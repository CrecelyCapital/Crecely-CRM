import { desc, eq } from "drizzle-orm";
import { ensureDatabase, getDb } from "../../../db";
import { contacts } from "../../../db/schema";
import { toRouteErrorMessage } from "../../../lib/api-utils";
import { serializeContact, toNumberOrNull } from "../../../lib/serializers";
import type { Contact } from "../../../lib/types";

function listFromPayload(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  return String(value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function buildContactValues(payload: Partial<Contact>) {
  return {
    name: payload.name?.trim() ?? "",
    company: payload.company?.trim() ?? "",
    role: payload.role?.trim() ?? "",
    email: payload.email?.trim() ?? "",
    phone: payload.phone?.trim() ?? "",
    contactType: payload.contactType ?? "Investor",
    investorProfile: payload.investorProfile?.trim() ?? "",
    preferredAssetClasses: JSON.stringify(
      listFromPayload(payload.preferredAssetClasses)
    ),
    preferredGeographies: JSON.stringify(listFromPayload(payload.preferredGeographies)),
    ticketSizeMin: toNumberOrNull(payload.ticketSizeMin),
    ticketSizeMax: toNumberOrNull(payload.ticketSizeMax),
    riskProfile: payload.riskProfile ?? "Core-plus",
    notes: payload.notes?.trim() ?? "",
    relationshipStatus: payload.relationshipStatus?.trim() ?? "New",
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
        .from(contacts)
        .where(eq(contacts.id, Number(id)))
        .limit(1);
      return Response.json({ contact: rows[0] ? serializeContact(rows[0]) : null });
    }

    const rows = await db
      .select()
      .from(contacts)
      .orderBy(desc(contacts.updatedAt), desc(contacts.id));

    return Response.json({ contacts: rows.map(serializeContact) });
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
    const payload = (await request.json()) as Partial<Contact>;
    const values = buildContactValues(payload);

    if (!values.name) {
      return Response.json({ error: "Contact name is required" }, { status: 400 });
    }

    const db = getDb();
    const [created] = await db.insert(contacts).values(values).returning();
    return Response.json({ contact: serializeContact(created) }, { status: 201 });
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
    const payload = (await request.json()) as Partial<Contact>;

    if (!payload.id) {
      return Response.json({ error: "Contact id is required" }, { status: 400 });
    }

    const db = getDb();
    const [updated] = await db
      .update(contacts)
      .set(buildContactValues(payload))
      .where(eq(contacts.id, payload.id))
      .returning();

    return Response.json({ contact: updated ? serializeContact(updated) : null });
  } catch (error) {
    return Response.json(
      { error: toRouteErrorMessage(error) },
      { status: 500 }
    );
  }
}
