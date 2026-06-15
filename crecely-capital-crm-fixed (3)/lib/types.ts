export type Language = "English" | "German";

export type DocumentType =
  | "Executive Summary"
  | "Investment Overview"
  | "Outreach Email";

export type DealStatus =
  | "Not contacted"
  | "Teaser sent"
  | "Interested"
  | "NDA sent"
  | "NDA signed"
  | "Data room access granted"
  | "Call scheduled"
  | "Offer received"
  | "Not interested"
  | "Closed";

export type RiskProfile = "Core" | "Core-plus" | "Value-add" | "Opportunistic";

export interface Project {
  id?: number;
  name: string;
  location: string;
  city: string;
  country: string;
  assetClass: string;
  investmentVolume: number | null;
  purchasePrice: number | null;
  noi: number | null;
  rentalIncome: number | null;
  occupancy: number | null;
  wault: number | null;
  capRate: number | null;
  exitYield: number | null;
  financingAssumptions: string;
  equityRequirement: number | null;
  investmentHighlights: string;
  keyRisks: string;
  developmentStatus: string;
  exitStrategy: string;
  googleDriveFolderUrl: string;
  additionalNotes: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Contact {
  id?: number;
  name: string;
  company: string;
  role: string;
  email: string;
  phone: string;
  contactType: "Investor" | "Partner" | "Advisor" | "Bank";
  investorProfile: string;
  preferredAssetClasses: string[];
  preferredGeographies: string[];
  ticketSizeMin: number | null;
  ticketSizeMax: number | null;
  riskProfile: RiskProfile;
  notes: string;
  relationshipStatus: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProjectContact {
  id?: number;
  projectId: number;
  contactId: number;
  dealStatus: DealStatus;
  matchScore: number;
  matchReason: string;
  potentialObjections: string;
  suggestedOutreachAngle: string;
  ndaStatus: string;
  lastContactedAt: string | null;
  nextFollowUpAt: string | null;
  notes: string;
}

export interface GeneratedDocument {
  id?: number;
  projectId: number;
  documentType: DocumentType;
  language: Language;
  content: string;
  version: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface MatchResult {
  contactId?: number;
  contactName: string;
  company: string;
  score: number;
  reason: string;
  potentialConcern: string;
  suggestedOutreachAngle: string;
}
