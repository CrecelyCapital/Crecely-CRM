import { and, desc, eq } from "drizzle-orm";
import { ensureDatabase, getDb } from "../../../db";
import { projectContacts } from "../../../db/schema";
import { toRouteErrorMessage } from "../../../lib/api-utils";
import { serializeProjectContact } from "../../../lib/serializers";
import type { ProjectContact } from "../../../lib/types";

function buildProjectContactValues(payload: Partial<ProjectContact>) {
  return {
    projectId: Number(payload.projectId),
    contactId: Number(payload.contactId),
    dealStatus: payload.dealStatus ?? "Not contacted",
    matchScore: Number(payload.matchScore ?? 0),
    matchReason: payload.matchReason?.trim() ?? "",
    potentialObjections: payload.potentialObjections?.trim() ?? "",
    suggestedOutreachAngle: payload.suggestedOutreachAngle?.trim() ?? "",
    ndaStatus: payload.ndaStatus?.trim() ?? "Not sent",
    lastContactedAt: payload.lastContactedAt ?? null,
    nextFollowUpAt: payload.nextFollowUpAt ?? null,
    notes: payload.notes?.trim() ?? "",
  };
}

export async function GET(request: Request) {
  try {
    await ensureDatabase();
    const db = getDb();
    const projectId = new URL(request.url).searchParams.get("projectId");

    const rows = projectId
      ? await db
          .select()
          .from(projectContacts)
          .where(eq(projectContacts.projectId, Number(projectId)))
          .orderBy(desc(projectContacts.matchScore), desc(projectContacts.id))
      : await db
          .select()
          .from(projectContacts)
          .orderBy(desc(projectContacts.matchScore), desc(projectContacts.id));

    return Response.json({ projectContacts: rows.map(serializeProjectContact) });
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
    const payload = (await request.json()) as Partial<ProjectContact>;
    const values = buildProjectContactValues(payload);

    if (!values.projectId || !values.contactId) {
      return Response.json(
        { error: "projectId and contactId are required" },
        { status: 400 }
      );
    }

    const db = getDb();
    const existing = await db
      .select()
      .from(projectContacts)
      .where(
        and(
          eq(projectContacts.projectId, values.projectId),
          eq(projectContacts.contactId, values.contactId)
        )
      )
      .limit(1);

    if (existing[0]) {
      const [updated] = await db
        .update(projectContacts)
        .set(values)
        .where(eq(projectContacts.id, existing[0].id))
        .returning();
      return Response.json({ projectContact: serializeProjectContact(updated) });
    }

    const [created] = await db.insert(projectContacts).values(values).returning();
    return Response.json(
      { projectContact: serializeProjectContact(created) },
      { status: 201 }
    );
  } catch (error) {
    return Response.json(
      { error: toRouteErrorMessage(error) },
      { status: 500 }
    );
  }
}
