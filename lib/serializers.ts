import type {
  Contact,
  GeneratedDocument,
  Project,
  ProjectContact,
} from "./types";
import type {
  ContactRow,
  GeneratedDocumentRow,
  ProjectContactRow,
  ProjectRow,
} from "../db/schema";

function parseList(value: string) {
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed)
      ? parsed.map((item) => String(item)).filter(Boolean)
      : [];
  } catch {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
}

export function serializeProject(row: ProjectRow): Project {
  return {
    id: row.id,
    name: row.name,
    location: row.location,
    city: row.city,
    country: row.country,
    assetClass: row.assetClass,
    investmentVolume: row.investmentVolume,
    purchasePrice: row.purchasePrice,
    noi: row.noi,
    rentalIncome: row.rentalIncome,
    occupancy: row.occupancy,
    wault: row.wault,
    capRate: row.capRate,
    exitYield: row.exitYield,
    financingAssumptions: row.financingAssumptions,
    equityRequirement: row.equityRequirement,
    investmentHighlights: row.investmentHighlights,
    keyRisks: row.keyRisks,
    developmentStatus: row.developmentStatus,
    exitStrategy: row.exitStrategy,
    googleDriveFolderUrl: row.googleDriveFolderUrl,
    additionalNotes: row.additionalNotes,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function serializeContact(row: ContactRow): Contact {
  return {
    id: row.id,
    name: row.name,
    company: row.company,
    role: row.role,
    email: row.email,
    phone: row.phone,
    contactType: row.contactType as Contact["contactType"],
    investorProfile: row.investorProfile,
    preferredAssetClasses: parseList(row.preferredAssetClasses),
    preferredGeographies: parseList(row.preferredGeographies),
    ticketSizeMin: row.ticketSizeMin,
    ticketSizeMax: row.ticketSizeMax,
    riskProfile: row.riskProfile as Contact["riskProfile"],
    notes: row.notes,
    relationshipStatus: row.relationshipStatus,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function serializeProjectContact(row: ProjectContactRow): ProjectContact {
  return {
    id: row.id,
    projectId: row.projectId,
    contactId: row.contactId,
    dealStatus: row.dealStatus as ProjectContact["dealStatus"],
    matchScore: row.matchScore,
    matchReason: row.matchReason,
    potentialObjections: row.potentialObjections,
    suggestedOutreachAngle: row.suggestedOutreachAngle,
    ndaStatus: row.ndaStatus,
    lastContactedAt: row.lastContactedAt,
    nextFollowUpAt: row.nextFollowUpAt,
    notes: row.notes,
  };
}

export function serializeGeneratedDocument(
  row: GeneratedDocumentRow
): GeneratedDocument {
  return {
    id: row.id,
    projectId: row.projectId,
    documentType: row.documentType as GeneratedDocument["documentType"],
    language: row.language as GeneratedDocument["language"],
    content: row.content,
    version: row.version,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function toNumberOrNull(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}
