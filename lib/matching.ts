import type { Contact, MatchResult, Project, RiskProfile } from "./types";

const riskOrder: RiskProfile[] = ["Core", "Core-plus", "Value-add", "Opportunistic"];

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function includesNormalized(values: string[], target: string) {
  const normalizedTarget = normalize(target);
  return values.some((value) => {
    const normalizedValue = normalize(value);
    return (
      normalizedValue === normalizedTarget ||
      normalizedValue.includes(normalizedTarget) ||
      normalizedTarget.includes(normalizedValue)
    );
  });
}

function scoreRisk(project: Project, contact: Contact) {
  const profileIndex = riskOrder.indexOf(contact.riskProfile);
  const text = `${project.developmentStatus} ${project.keyRisks} ${project.additionalNotes}`.toLowerCase();
  const impliedRisk = text.includes("development") || text.includes("capex")
    ? "Value-add"
    : text.includes("standing") || text.includes("stabilize")
      ? "Core-plus"
      : "Core";
  const impliedIndex = riskOrder.indexOf(impliedRisk);

  if (profileIndex === impliedIndex) return 18;
  if (Math.abs(profileIndex - impliedIndex) === 1) return 12;
  return 4;
}

export function calculateMatch(project: Project, contact: Contact): MatchResult {
  const reasons: string[] = [];
  const concerns: string[] = [];
  let score = 0;

  if (includesNormalized(contact.preferredAssetClasses, project.assetClass)) {
    score += 25;
    reasons.push(`asset class fit for ${project.assetClass}`);
  } else {
    concerns.push(`asset class is outside stated focus`);
  }

  if (
    includesNormalized(contact.preferredGeographies, project.country) ||
    includesNormalized(contact.preferredGeographies, project.city) ||
    includesNormalized(contact.preferredGeographies, "DACH")
  ) {
    score += 22;
    reasons.push(`geographic appetite covers ${project.country}`);
  } else {
    concerns.push(`geography is not an explicit preference`);
  }

  const equity = project.equityRequirement ?? project.investmentVolume ?? 0;
  if (equity > 0 && contact.ticketSizeMin !== null && contact.ticketSizeMax !== null) {
    if (equity >= contact.ticketSizeMin && equity <= contact.ticketSizeMax) {
      score += 25;
      reasons.push(`ticket size fits the target range`);
    } else if (equity < contact.ticketSizeMin) {
      score += 8;
      concerns.push(`equity need may be below the minimum ticket`);
    } else {
      score += 8;
      concerns.push(`equity need may exceed the preferred ticket`);
    }
  } else {
    score += 8;
    concerns.push(`ticket size needs confirmation`);
  }

  score += scoreRisk(project, contact);
  reasons.push(`risk profile alignment is ${contact.riskProfile}`);

  const notes = normalize(contact.notes);
  if (
    notes.includes("income") ||
    notes.includes("downside") ||
    notes.includes("capex") ||
    notes.includes("financing")
  ) {
    score += 10;
    reasons.push(`notes indicate a relevant investment angle`);
  }

  const boundedScore = Math.max(0, Math.min(100, score));
  const mainReason = reasons.length
    ? reasons.join("; ")
    : "Limited structured overlap based on current fields.";
  const potentialConcern = concerns.length
    ? concerns.join("; ")
    : "No major concern detected from structured fields.";
  const suggestedOutreachAngle =
    contact.contactType === "Partner"
      ? `Position ${project.name} around financing structure, downside protection, and execution credibility.`
      : `Lead with ${project.assetClass} exposure in ${project.city}, equity requirement, and the most defensible value creation points.`;

  return {
    contactId: contact.id,
    contactName: contact.name,
    company: contact.company,
    score: boundedScore,
    reason: mainReason,
    potentialConcern,
    suggestedOutreachAngle,
  };
}

export function calculateMatches(project: Project, contacts: Contact[]) {
  return contacts
    .map((contact) => calculateMatch(project, contact))
    .sort((a, b) => b.score - a.score);
}
