import { createClient, type Client, type InArgs, type InStatement } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

let databaseReady: Promise<void> | null = null;
let client: Client | null = null;

/**
 * Returns the underlying libsql client. Configure via environment variables:
 * - DATABASE_URL: e.g. "file:./local.db" for local/dev, or a "libsql://..." URL for Turso/production.
 * - DATABASE_AUTH_TOKEN: required when using a remote libsql/Turso database.
 */
export function getRawDb(): Client {
  if (!client) {
    const url = process.env.DATABASE_URL ?? "file:./local.db";
    const authToken = process.env.DATABASE_AUTH_TOKEN;

    client = createClient({
      url,
      ...(authToken ? { authToken } : {}),
    });
  }

  return client;
}

export function getDb() {
  return drizzle(getRawDb(), { schema });
}

export async function ensureDatabase() {
  databaseReady ??= bootstrapDatabase();
  return databaseReady;
}

type PreparedStatement = { sql: string; args: unknown[] };

function prepare(sql: string): PreparedStatement & { bind(...args: unknown[]): PreparedStatement } {
  return {
    sql,
    args: [],
    bind(...args: unknown[]) {
      return { sql, args };
    },
  };
}

async function batch(db: Client, statements: Array<PreparedStatement>) {
  const normalized: InStatement[] = statements.map((statement) => ({
    sql: statement.sql,
    args: statement.args as InArgs,
  }));
  await db.batch(normalized, "write");
}

async function first<T>(db: Client, statement: PreparedStatement): Promise<T | null> {
  const result = await db.execute({ sql: statement.sql, args: statement.args as InArgs });
  return (result.rows[0] as T | undefined) ?? null;
}

async function bootstrapDatabase() {
  const d1 = getRawDb();

  await batch(d1, [
    prepare(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL DEFAULT '',
      email TEXT NOT NULL UNIQUE,
      role TEXT NOT NULL DEFAULT 'manager',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`),
    prepare(`CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      location TEXT NOT NULL DEFAULT '',
      city TEXT NOT NULL DEFAULT '',
      country TEXT NOT NULL DEFAULT '',
      asset_class TEXT NOT NULL DEFAULT '',
      investment_volume REAL,
      purchase_price REAL,
      noi REAL,
      rental_income REAL,
      occupancy REAL,
      wault REAL,
      cap_rate REAL,
      exit_yield REAL,
      financing_assumptions TEXT NOT NULL DEFAULT '',
      equity_requirement REAL,
      investment_highlights TEXT NOT NULL DEFAULT '',
      key_risks TEXT NOT NULL DEFAULT '',
      development_status TEXT NOT NULL DEFAULT '',
      exit_strategy TEXT NOT NULL DEFAULT '',
      google_drive_folder_url TEXT NOT NULL DEFAULT '',
      additional_notes TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`),
    prepare(`CREATE TABLE IF NOT EXISTS contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      company TEXT NOT NULL DEFAULT '',
      role TEXT NOT NULL DEFAULT '',
      email TEXT NOT NULL DEFAULT '',
      phone TEXT NOT NULL DEFAULT '',
      contact_type TEXT NOT NULL DEFAULT 'Investor',
      investor_profile TEXT NOT NULL DEFAULT '',
      preferred_asset_classes TEXT NOT NULL DEFAULT '[]',
      preferred_geographies TEXT NOT NULL DEFAULT '[]',
      ticket_size_min REAL,
      ticket_size_max REAL,
      risk_profile TEXT NOT NULL DEFAULT 'Core',
      notes TEXT NOT NULL DEFAULT '',
      relationship_status TEXT NOT NULL DEFAULT 'New',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`),
    prepare(`CREATE TABLE IF NOT EXISTS project_contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      contact_id INTEGER NOT NULL,
      deal_status TEXT NOT NULL DEFAULT 'Not contacted',
      match_score INTEGER NOT NULL DEFAULT 0,
      match_reason TEXT NOT NULL DEFAULT '',
      potential_objections TEXT NOT NULL DEFAULT '',
      suggested_outreach_angle TEXT NOT NULL DEFAULT '',
      nda_status TEXT NOT NULL DEFAULT 'Not sent',
      last_contacted_at TEXT,
      next_follow_up_at TEXT,
      notes TEXT NOT NULL DEFAULT '',
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE
    )`),
    prepare(`CREATE TABLE IF NOT EXISTS generated_documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      document_type TEXT NOT NULL,
      language TEXT NOT NULL,
      content TEXT NOT NULL,
      version INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    )`),
    prepare(`CREATE TABLE IF NOT EXISTS interactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER,
      contact_id INTEGER,
      interaction_type TEXT NOT NULL DEFAULT 'Note',
      notes TEXT NOT NULL DEFAULT '',
      interaction_date TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      next_action TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL,
      FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL
    )`),
    prepare("CREATE INDEX IF NOT EXISTS users_email_idx ON users (email)"),
    prepare("CREATE INDEX IF NOT EXISTS projects_asset_class_idx ON projects (asset_class)"),
    prepare("CREATE INDEX IF NOT EXISTS projects_city_country_idx ON projects (city, country)"),
    prepare("CREATE INDEX IF NOT EXISTS contacts_type_idx ON contacts (contact_type)"),
    prepare("CREATE INDEX IF NOT EXISTS contacts_company_idx ON contacts (company)"),
    prepare("CREATE INDEX IF NOT EXISTS project_contacts_project_idx ON project_contacts (project_id)"),
    prepare("CREATE INDEX IF NOT EXISTS project_contacts_contact_idx ON project_contacts (contact_id)"),
    prepare("CREATE UNIQUE INDEX IF NOT EXISTS project_contacts_unique_idx ON project_contacts (project_id, contact_id)"),
    prepare("CREATE INDEX IF NOT EXISTS generated_documents_project_idx ON generated_documents (project_id)"),
    prepare("CREATE INDEX IF NOT EXISTS interactions_project_idx ON interactions (project_id)"),
    prepare("CREATE INDEX IF NOT EXISTS interactions_contact_idx ON interactions (contact_id)"),
  ]);

  const row = await first<{ total: number }>(
    d1,
    prepare("SELECT COUNT(*) AS total FROM projects")
  );

  if ((row?.total ?? 0) === 0) {
    await seedDatabase(d1);
  }
}

async function seedDatabase(d1: Client) {
  await batch(d1, [
    prepare(
      `INSERT INTO users (name, email, role) VALUES (?, ?, ?)`)
      .bind("Deal Manager", "manager@example.com", "admin"),
    prepare(
      `INSERT INTO projects (
        name, location, city, country, asset_class, investment_volume,
        purchase_price, noi, rental_income, occupancy, wault, cap_rate,
        exit_yield, financing_assumptions, equity_requirement,
        investment_highlights, key_risks, development_status, exit_strategy,
        google_drive_folder_url, additional_notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(
        "Riverside Logistics Hub",
        "Prime logistics corridor",
        "Duesseldorf",
        "Germany",
        "Logistics",
        42500000,
        39200000,
        2450000,
        3100000,
        96,
        6.2,
        6.25,
        5.5,
        "Senior debt at 55 percent LTV with interest-only period under review.",
        17800000,
        "Modern last-mile logistics location\nStrong occupier demand\nReversionary rent potential",
        "Lease rollover concentration in year six\nCapex scope requires technical validation",
        "Standing asset with light value-add plan",
        "Stabilize rent roll and sell to core buyer after 3 to 5 years",
        "",
        "Phase 1 sample project for document generation and matching."
      ),
    prepare(
      `INSERT INTO projects (
        name, location, city, country, asset_class, investment_volume,
        purchase_price, noi, rental_income, occupancy, wault, cap_rate,
        exit_yield, financing_assumptions, equity_requirement,
        investment_highlights, key_risks, development_status, exit_strategy,
        google_drive_folder_url, additional_notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(
        "Altstadt Mixed-Use Portfolio",
        "Central retail and residential blocks",
        "Hamburg",
        "Germany",
        "Mixed-use",
        28500000,
        27100000,
        1320000,
        1740000,
        91,
        4.4,
        4.87,
        4.35,
        "Debt assumptions pending lender feedback.",
        12600000,
        "Central micro-location\nDiversified income base\nResidential rent upside",
        "Retail letting sensitivity\nESG capex still being quantified",
        "Existing portfolio with active asset management plan",
        "Refinance or sell individual assets after repositioning",
        "",
        "Useful for comparing family office fit versus fund fit."
      ),
  ]);

  await batch(d1, [
    prepare(
      `INSERT INTO contacts (
        name, company, role, email, phone, contact_type, investor_profile,
        preferred_asset_classes, preferred_geographies, ticket_size_min,
        ticket_size_max, risk_profile, notes, relationship_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(
        "Anna Weber",
        "NordKap Capital",
        "Investment Director",
        "anna.weber@example.com",
        "+49 30 0000 0000",
        "Investor",
        "German institutional investor focused on income-producing assets.",
        JSON.stringify(["Logistics", "Office", "Mixed-use"]),
        JSON.stringify(["Germany", "Netherlands", "DACH"]),
        10000000,
        30000000,
        "Core-plus",
        "Prefers defensible income and clear downside protection.",
        "Warm"
      ),
    prepare(
      `INSERT INTO contacts (
        name, company, role, email, phone, contact_type, investor_profile,
        preferred_asset_classes, preferred_geographies, ticket_size_min,
        ticket_size_max, risk_profile, notes, relationship_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(
        "Markus Stein",
        "Stein Family Office",
        "Managing Partner",
        "markus.stein@example.com",
        "+49 89 0000 0000",
        "Investor",
        "Family office with selective appetite for German value-add situations.",
        JSON.stringify(["Residential", "Mixed-use", "Hospitality"]),
        JSON.stringify(["Germany", "Austria"]),
        5000000,
        18000000,
        "Value-add",
        "Needs concise story, local partner credibility, and transparent capex.",
        "Active"
      ),
    prepare(
      `INSERT INTO contacts (
        name, company, role, email, phone, contact_type, investor_profile,
        preferred_asset_classes, preferred_geographies, ticket_size_min,
        ticket_size_max, risk_profile, notes, relationship_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(
        "Sophie Laurent",
        "Alpine Debt Partners",
        "Capital Partner",
        "sophie.laurent@example.com",
        "+41 44 0000 0000",
        "Partner",
        "Private debt partner for senior and whole-loan structures.",
        JSON.stringify(["Logistics", "Residential", "Office"]),
        JSON.stringify(["DACH", "Germany", "Switzerland"]),
        15000000,
        60000000,
        "Core",
        "Useful for financing feedback rather than pure equity placement.",
        "New"
      ),
  ]);
}
