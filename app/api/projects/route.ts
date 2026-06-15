import { desc, eq } from "drizzle-orm";
import { ensureDatabase, getDb } from "../../../db";
import { projects } from "../../../db/schema";
import { toRouteErrorMessage } from "../../../lib/api-utils";
import { serializeProject, toNumberOrNull } from "../../../lib/serializers";
import type { Project } from "../../../lib/types";

function buildProjectValues(payload: Partial<Project>) {
  return {
    name: payload.name?.trim() ?? "",
    location: payload.location?.trim() ?? "",
    city: payload.city?.trim() ?? "",
    country: payload.country?.trim() ?? "",
    assetClass: payload.assetClass?.trim() ?? "",
    investmentVolume: toNumberOrNull(payload.investmentVolume),
    purchasePrice: toNumberOrNull(payload.purchasePrice),
    noi: toNumberOrNull(payload.noi),
    rentalIncome: toNumberOrNull(payload.rentalIncome),
    occupancy: toNumberOrNull(payload.occupancy),
    wault: toNumberOrNull(payload.wault),
    capRate: toNumberOrNull(payload.capRate),
    exitYield: toNumberOrNull(payload.exitYield),
    financingAssumptions: payload.financingAssumptions?.trim() ?? "",
    equityRequirement: toNumberOrNull(payload.equityRequirement),
    investmentHighlights: payload.investmentHighlights?.trim() ?? "",
    keyRisks: payload.keyRisks?.trim() ?? "",
    developmentStatus: payload.developmentStatus?.trim() ?? "",
    exitStrategy: payload.exitStrategy?.trim() ?? "",
    googleDriveFolderUrl: payload.googleDriveFolderUrl?.trim() ?? "",
    additionalNotes: payload.additionalNotes?.trim() ?? "",
    updatedAt: new Date().toISOString(),
  };
}

export async function GET(request: Request) {
  try {
    await ensureDatabase();
    const db = getDb();
    const id = new URL(request.url).searchParams.get("id");

    if (id) {
      const rows = await db
        .select()
        .from(projects)
        .where(eq(projects.id, Number(id)))
        .limit(1);
      return Response.json({ project: rows[0] ? serializeProject(rows[0]) : null });
    }

    const rows = await db
      .select()
      .from(projects)
      .orderBy(desc(projects.updatedAt), desc(projects.id));

    return Response.json({ projects: rows.map(serializeProject) });
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
    const payload = (await request.json()) as Partial<Project>;
    const values = buildProjectValues(payload);

    if (!values.name) {
      return Response.json({ error: "Project name is required" }, { status: 400 });
    }

    const db = getDb();
    const [created] = await db.insert(projects).values(values).returning();
    return Response.json({ project: serializeProject(created) }, { status: 201 });
  } catch (error) {
    return Response.json(
      { error: toRouteErrorMessage(error) },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    await ensureDatabase();
    const payload = (await request.json()) as Partial<Project>;

    if (!payload.id) {
      return Response.json({ error: "Project id is required" }, { status: 400 });
    }

    const db = getDb();
    const [updated] = await db
      .update(projects)
      .set(buildProjectValues(payload))
      .where(eq(projects.id, payload.id))
      .returning();

    return Response.json({ project: updated ? serializeProject(updated) : null });
  } catch (error) {
    return Response.json(
      { error: toRouteErrorMessage(error) },
      { status: 500 }
    );
  }
}
