import { sql } from "drizzle-orm";
import {
  index,
  integer,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const users = sqliteTable(
  "users",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull().default(""),
    email: text("email").notNull().unique(),
    role: text("role").notNull().default("manager"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    emailIdx: index("users_email_idx").on(table.email),
  })

export const projects = sqliteTable(
  "projects",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    location: text("location").notNull().default(""),
    city: text("city").notNull().default(""),
    country: text("country").notNull().default(""),
    assetClass: text("asset_class").notNull().default(""),
    investmentVolume: real("investment_volume"),
    purchasePrice: real("purchase_price"),
    noi: real("noi"),
    rentalIncome: real("rental_income"),
    occupancy: real("occupancy"),
    wault: real("wault"),
    capRate: real("cap_rate"),
    exitYield: real("exit_yield"),
    financingAssumptions: text("financing_assumptions").notNull().default(""),
    equityRequirement: real("equity_requirement"),
    investmentHighlights: text("investment_highlights").notNull().default(""),
    keyRisks: text("key_risks").notNull().default(""),
    developmentStatus: text("development_status").notNull().default(""),
    exitStrategy: text("exit_strategy").notNull().default(""),
    googleDriveFolderUrl: text("google_drive_folder_url").notNull().default(""),
    additionalNotes: text("additional_notes").notNull().default(""),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    assetClassIdx: index("projects_asset_class_idx").on(table.assetClass),
    cityCountryIdx: index("projects_city_country_idx").on(table.city, table.country),
  })
);

export const contacts = sqliteTable(
  "contacts",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    company: text("company").notNull().default(""),
    role: text("role").notNull().default(""),
    email: text("email").notNull().default(""),
    phone: text("phone").notNull().default(""),
    contactType: text("contact_type").notNull().default("Investor"),
    investorProfile: text("investor_profile").notNull().default(""),
    preferredAssetClasses: text("preferred_asset_classes").notNull().default("[]"),
    preferredGeographies: text("preferred_geographies").notNull().default("[]"),
    ticketSizeMin: real("ticket_size_min"),
    ticketSizeMax: real("ticket_size_max"),
    riskProfile: text("risk_profile").notNull().default("Core"),
    notes: text("notes").notNull().default(""),
    relationshipStatus: text("relationship_status").notNull().default("New"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    typeIdx: index("contacts_type_idx").on(table.contactType),
    companyIdx: index("contacts_company_idx").on(table.company),
  })
);

export const projectContacts = sqliteTable(
  "project_contacts",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    projectId: integer("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    contactId: integer("contact_id")
      .notNull()
      .references(() => contacts.id, { onDelete: "cascade" }),
    dealStatus: text("deal_status").notNull().default("Not contacted"),
    matchScore: integer("match_score").notNull().default(0),
    matchReason: text("match_reason").notNull().default(""),
    potentialObjections: text("potential_objections").notNull().default(""),
    suggestedOutreachAngle: text("suggested_outreach_angle").notNull().default(""),
    ndaStatus: text("nda_status").notNull().default("Not sent"),
    lastContactedAt: text("last_contacted_at"),
    nextFollowUpAt: text("next_follow_up_at"),
    notes: text("notes").notNull().default(""),
  },
  (table) => ({
    projectIdx: index("project_contacts_project_idx").on(table.projectId),
    contactIdx: index("project_contacts_contact_idx").on(table.contactId),
    statusIdx: index("project_contacts_status_idx").on(table.dealStatus),
    uniqueIdx: uniqueIndex("project_contacts_unique_idx").on(table.projectId, table.contactId),
  })
);

export const generatedDocuments = sqliteTable(
  "generated_documents",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    projectId: integer("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    documentType: text("document_type").notNull(),
    language: text("language").notNull(),
    content: text("content").notNull(),
    version: integer("version").notNull().default(1),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    projectIdx: index("generated_documents_project_idx").on(table.projectId),
    typeLanguageIdx: index("generated_documents_type_language_idx").on(
      table.documentType,
      table.language
    ),
  })
  ]
);

export const interactions = sqliteTable(
  "interactions",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    projectId: integer("project_id").references(() => projects.id, {
      onDelete: "set null",
    }),
    contactId: integer("contact_id").references(() => contacts.id, {
      onDelete: "set null",
    }),
    interactionType: text("interaction_type").notNull().default("Note"),
    notes: text("notes").notNull().default(""),
    interactionDate: text("interaction_date").notNull().default(sql`CURRENT_TIMESTAMP`),
    nextAction: text("next_action").notNull().default(""),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    projectIdx: index("interactions_project_idx").on(table.projectId),
    contactIdx: index("interactions_contact_idx").on(table.contactId),
  })
);

export type ProjectRow = typeof projects.$inferSelect;
export type ContactRow = typeof contacts.$inferSelect;
export type ProjectContactRow = typeof projectContacts.$inferSelect;
export type GeneratedDocumentRow = typeof generatedDocuments.$inferSelect;
