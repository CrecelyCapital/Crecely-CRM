CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'manager',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS projects (
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
);

CREATE TABLE IF NOT EXISTS contacts (
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
);

CREATE TABLE IF NOT EXISTS project_contacts (
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
);

CREATE TABLE IF NOT EXISTS generated_documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  document_type TEXT NOT NULL,
  language TEXT NOT NULL,
  content TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS interactions (
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
);

CREATE INDEX IF NOT EXISTS users_email_idx ON users (email);
CREATE INDEX IF NOT EXISTS projects_asset_class_idx ON projects (asset_class);
CREATE INDEX IF NOT EXISTS projects_city_country_idx ON projects (city, country);
CREATE INDEX IF NOT EXISTS contacts_type_idx ON contacts (contact_type);
CREATE INDEX IF NOT EXISTS contacts_company_idx ON contacts (company);
CREATE INDEX IF NOT EXISTS project_contacts_project_idx ON project_contacts (project_id);
CREATE INDEX IF NOT EXISTS project_contacts_contact_idx ON project_contacts (contact_id);
CREATE INDEX IF NOT EXISTS project_contacts_status_idx ON project_contacts (deal_status);
CREATE UNIQUE INDEX IF NOT EXISTS project_contacts_unique_idx ON project_contacts (project_id, contact_id);
CREATE INDEX IF NOT EXISTS generated_documents_project_idx ON generated_documents (project_id);
CREATE INDEX IF NOT EXISTS generated_documents_type_language_idx ON generated_documents (document_type, language);
CREATE INDEX IF NOT EXISTS interactions_project_idx ON interactions (project_id);
CREATE INDEX IF NOT EXISTS interactions_contact_idx ON interactions (contact_id);
