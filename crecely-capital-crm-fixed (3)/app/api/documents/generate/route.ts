import { eq } from "drizzle-orm";
import { ensureDatabase, getDb } from "../../../../db";
import { projects } from "../../../../db/schema";
import { toRouteErrorMessage } from "../../../../lib/api-utils";
import {
  createDocumentPrompt,
  generateFallbackDocument,
} from "../../../../lib/document-generator";
import { serializeProject } from "../../../../lib/serializers";
import type { DocumentType, Language } from "../../../../lib/types";

type ResponsesApiResult = {
  output_text?: string;
  output?: Array<{
    content?: Array<{
      text?: string;
      type?: string;
    }>;
  }>;
};

function readRuntimeEnv(key: string) {
  return process.env[key];
}

function extractOutputText(result: ResponsesApiResult) {
  if (result.output_text) return result.output_text;

  return (
    result.output
      ?.flatMap((item) => item.content ?? [])
      .map((content) => content.text)
      .filter(Boolean)
      .join("\n")
      .trim() ?? ""
  );
}

async function generateWithOpenAI(prompt: string) {
  const apiKey = readRuntimeEnv("OPENAI_API_KEY");
  if (!apiKey) return null;

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: readRuntimeEnv("OPENAI_MODEL") ?? "gpt-4.1-mini",
      input: prompt,
    }),
  });

  if (!response.ok) {
    return null;
  }

  const result = (await response.json()) as ResponsesApiResult;
  return extractOutputText(result) || null;
}

export async function POST(request: Request) {
  try {
    await ensureDatabase();
    const payload = (await request.json()) as {
      projectId?: number;
      documentType?: DocumentType;
      language?: Language;
    };

    if (!payload.projectId || !payload.documentType || !payload.language) {
      return Response.json(
        { error: "projectId, documentType, and language are required" },
        { status: 400 }
      );
    }

    const db = getDb();
    const rows = await db
      .select()
      .from(projects)
      .where(eq(projects.id, payload.projectId))
      .limit(1);

    if (!rows[0]) {
      return Response.json({ error: "Project not found" }, { status: 404 });
    }

    const project = serializeProject(rows[0]);
    const prompt = createDocumentPrompt(
      project,
      payload.documentType,
      payload.language
    );
    const openAiContent = await generateWithOpenAI(prompt);
    const content =
      openAiContent ??
      generateFallbackDocument(project, payload.documentType, payload.language);

    return Response.json({
      content,
      source: openAiContent ? "openai" : "fallback",
    });
  } catch (error) {
    return Response.json(
      { error: toRouteErrorMessage(error) },
      { status: 500 }
    );
  }
}
