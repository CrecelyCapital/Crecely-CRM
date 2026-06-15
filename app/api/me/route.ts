import { eq } from "drizzle-orm";
import { ensureDatabase, getDb } from "../../../db";
import { users } from "../../../db/schema";
import { getCurrentUserFromHeaders, toRouteErrorMessage } from "../../../lib/api-utils";

export async function GET(request: Request) {
  try {
    await ensureDatabase();
    const currentUser = getCurrentUserFromHeaders(request);
    const db = getDb();
    const existing = await db
      .select()
      .from(users)
      .where(eq(users.email, currentUser.email))
      .limit(1);

    if (existing[0]) {
      return Response.json({ user: existing[0] });
    }

    const [created] = await db.insert(users).values(currentUser).returning();
    return Response.json({ user: created }, { status: 201 });
  } catch (error) {
    return Response.json(
      { error: toRouteErrorMessage(error) },
      { status: 500 }
    );
  }
}
