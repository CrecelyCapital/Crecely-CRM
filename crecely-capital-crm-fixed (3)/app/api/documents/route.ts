import { and, desc, eq } from "drizzle-orm";
import { ensureDatabase, getDb } from "../../../db";
import { generatedDocuments } from "../../../db/schema";
import { toRouteErrorMessage } from "../../../lib/api-utils";
import { serializeGeneratedDocument } from "../../../lib/serializers";
import type { GeneratedDocument } from "../../../lib/types";

export async function GET(request: Request) {
  try {
    await ensureDatabase();
    const db = getDb();
    const searchParams = new URL(request.url).searchParams;
    const projectId = searchParams.get("projectId");

    const rows = projectId
      ? await db
          .select()
          .from(generatedDocuments)
          .where(eq(generatedDocuments.projectId, Number(projectId)))
          .orderBy(desc(generatedDocuments.updatedAt), desc(generatedDocuments.id))
      : await db
          .select()
          .from(generatedDocuments)
          .orderBy(desc(generatedDocuments.updatedAt), desc(generatedDocuments.id));

    return Response.json({ documents: rows.map(serializeGeneratedDocument) });
  } catch (error) {
    return Response.json(
      { error: toRouteErrorMessage(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await ensureDatabase();
    const payload = (await request.json()) as Partial<GeneratedDocument>;

    if (!payload.projectId || !payload.documentType || !payload.language) {
      return Response.json(
        { error: "projectId, documentType, and language are required" },
        { status: 400 }
      );
    }

    const db = getDb();
    const latest = await db
      .select()
      .from(generatedDocuments)
      .where(
        and(
          eq(generatedDocuments.projectId, payload.projectId),
          eq(generatedDocuments.documentType, payload.documentType),
          eq(generatedDocuments.language, payload.language)
        )
      )
      .orderBy(desc(generatedDocuments.version), desc(generatedDocuments.id))
      .limit(1);

    const [created] = await db
      .insert(generatedDocuments)
      .values({
        projectId: payload.projectId,
        documentType: payload.documentType,
        language: payload.language,
        content: payload.content ?? "",
        version: (latest[0]?.version ?? 0) + 1,
        updatedAt: new Date().toISOString(),
      })
      .returning();

    return Response.json(
      { document: serializeGeneratedDocument(created) },
      { status: 201 }
    );
  } catch (error) {
    return Response.json(
      { error: toRouteErrorMessage(error) },
      { status: 500 }
    );
  }
}
