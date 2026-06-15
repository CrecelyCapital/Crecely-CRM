import { and, eq } from "drizzle-orm";
import { ensureDatabase, getDb } from "../../../db";
import { contacts, projectContacts, projects } from "../../../db/schema";
import { toRouteErrorMessage } from "../../../lib/api-utils";
import { calculateMatches } from "../../../lib/matching";
import { serializeContact, serializeProject } from "../../../lib/serializers";

export async function POST(request: Request) {
  try {
    await ensureDatabase();
    const payload = (await request.json()) as { projectId?: number };

    if (!payload.projectId) {
      return Response.json({ error: "projectId is required" }, { status: 400 });
    }

    const db = getDb();
    const projectRows = await db
      .select()
      .from(projects)
      .where(eq(projects.id, payload.projectId))
      .limit(1);

    if (!projectRows[0]) {
      return Response.json({ error: "Project not found" }, { status: 404 });
    }

    const contactRows = await db.select().from(contacts);
    const project = serializeProject(projectRows[0]);
    const serializedContacts = contactRows.map(serializeContact);
    const matches = calculateMatches(project, serializedContacts);

    for (const match of matches) {
      if (!match.contactId) continue;

      const existing = await db
        .select()
        .from(projectContacts)
        .where(
          and(
            eq(projectContacts.projectId, payload.projectId),
            eq(projectContacts.contactId, match.contactId)
          )
        )
        .limit(1);

      const values = {
        projectId: payload.projectId,
        contactId: match.contactId,
        dealStatus: existing[0]?.dealStatus ?? "Not contacted",
        matchScore: match.score,
        matchReason: match.reason,
        potentialObjections: match.potentialConcern,
        suggestedOutreachAngle: match.suggestedOutreachAngle,
        ndaStatus: existing[0]?.ndaStatus ?? "Not sent",
        lastContactedAt: existing[0]?.lastContactedAt ?? null,
        nextFollowUpAt: existing[0]?.nextFollowUpAt ?? null,
        notes: existing[0]?.notes ?? "",
      };

      if (existing[0]) {
        await db
          .update(projectContacts)
          .set(values)
          .where(eq(projectContacts.id, existing[0].id));
      } else {
        await db.insert(projectContacts).values(values);
      }
    }

    return Response.json({ matches });
  } catch (error) {
    return Response.json(
      { error: toRouteErrorMessage(error) },
      { status: 500 }
    );
  }
}
