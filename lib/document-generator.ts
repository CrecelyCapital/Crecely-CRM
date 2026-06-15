import type { DocumentType, Language, Project } from "./types";

const executiveSections = [
  "Project introduction",
  "Location and market positioning",
  "Investment highlights",
  "Financial overview",
  "Strategic rationale",
  "Risk summary",
  "Conclusion",
];

const overviewSections = [
  "Project description",
  "Location analysis",
  "Asset profile",
  "Tenant / income profile",
  "Financial assumptions",
  "Return potential",
  "Financing overview",
  "Value creation strategy",
  "Risk factors",
  "Exit strategy",
];

function formatAmount(value: number | null) {
  if (value === null || Number.isNaN(value)) return "Missing";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatNumber(value: number | null, suffix = "") {
  if (value === null || Number.isNaN(value)) return "Missing";
  return `${value}${suffix}`;
}

export function findMissingProjectData(project: Project) {
  const missing: string[] = [];
  const required: Array<[string, unknown]> = [
    ["purchase price", project.purchasePrice],
    ["NOI", project.noi],
    ["rental income", project.rentalIncome],
    ["occupancy", project.occupancy],
    ["WAULT", project.wault],
    ["cap rate", project.capRate],
    ["exit yield", project.exitYield],
    ["equity requirement", project.equityRequirement],
    ["financing assumptions", project.financingAssumptions],
    ["investment highlights", project.investmentHighlights],
    ["key risks", project.keyRisks],
    ["exit strategy", project.exitStrategy],
  ];

  for (const [label, value] of required) {
    if (value === null || value === undefined || String(value).trim() === "") {
      missing.push(label);
    }
  }

  return missing;
}

export function createDocumentPrompt(
  project: Project,
  documentType: DocumentType,
  language: Language
) {
  const sections =
    documentType === "Investment Overview" ? overviewSections : executiveSections;
  const missing = findMissingProjectData(project);

  return `You are writing a ${documentType} for institutional real estate investors.

Language: ${language}
Tone: professional, institutional, concise, suitable for family offices, funds, banks, and capital partners.

Rules:
- Do not invent missing financial data.
- If data is missing, mark it clearly as missing and suggest what should be added.
- Use business-quality ${language === "German" ? "German, not literal translation" : "English"}.
- Structure the output with the following sections: ${sections.join(", ")}.

Project data:
Name: ${project.name}
Location: ${project.location}
City: ${project.city}
Country: ${project.country}
Asset class: ${project.assetClass}
Investment volume: ${formatAmount(project.investmentVolume)}
Purchase price: ${formatAmount(project.purchasePrice)}
NOI: ${formatAmount(project.noi)}
Rental income: ${formatAmount(project.rentalIncome)}
Occupancy: ${formatNumber(project.occupancy, "%")}
WAULT: ${formatNumber(project.wault, " years")}
Cap rate: ${formatNumber(project.capRate, "%")}
Exit yield: ${formatNumber(project.exitYield, "%")}
Financing assumptions: ${project.financingAssumptions || "Missing"}
Equity requirement: ${formatAmount(project.equityRequirement)}
Investment highlights:
${project.investmentHighlights || "Missing"}
Key risks:
${project.keyRisks || "Missing"}
Development status: ${project.developmentStatus || "Missing"}
Exit strategy: ${project.exitStrategy || "Missing"}
Additional notes: ${project.additionalNotes || "None"}

Known missing data: ${missing.length ? missing.join(", ") : "None"}`;
}

export function generateFallbackDocument(
  project: Project,
  documentType: DocumentType,
  language: Language
) {
  const missing = findMissingProjectData(project);
  const missingLine = missing.length
    ? `Missing information to confirm: ${missing.join(", ")}.`
    : "All core fields required for this first draft are present.";

  if (language === "German") {
    if (documentType === "Investment Overview") {
      return `# Investment Overview - ${project.name}

## Projektbeschreibung
${project.name} ist eine ${project.assetClass || "Assetklasse noch offen"}-Investmentmoeglichkeit in ${project.city || "Stadt fehlt"}, ${project.country || "Land fehlt"}. Das Projekt befindet sich in ${project.location || "einer noch zu spezifizierenden Lage"} und wird als ${project.developmentStatus || "Status fehlt"} beschrieben.

## Standortanalyse
Der Standort sollte anhand von Mikrolage, Nachfrage, Vergleichstransaktionen und Mietermarkt validiert werden. Vorliegende Einordnung: ${project.location || "fehlend"}.

## Asset-Profil
Assetklasse: ${project.assetClass || "fehlend"}. Investmentvolumen: ${formatAmount(project.investmentVolume)}. Kaufpreis: ${formatAmount(project.purchasePrice)}.

## Mieter- und Ertragsprofil
Mieteinnahmen: ${formatAmount(project.rentalIncome)}. NOI: ${formatAmount(project.noi)}. Vermietungsstand: ${formatNumber(project.occupancy, "%")}. WAULT: ${formatNumber(project.wault, " Jahre")}.

## Finanzielle Annahmen
Cap Rate: ${formatNumber(project.capRate, "%")}. Exit Yield: ${formatNumber(project.exitYield, "%")}. Eigenkapitalbedarf: ${formatAmount(project.equityRequirement)}. Finanzierung: ${project.financingAssumptions || "fehlend"}.

## Renditepotenzial
Das Renditepotenzial sollte aus laufendem Cashflow, Mietwachstum, Capex-Plan und Exit-Annahmen abgeleitet werden. Es wurden keine fehlenden Finanzdaten ergaenzt.

## Value-Creation-Strategie
${project.investmentHighlights || "Werttreiber fehlen und sollten ergaenzt werden."}

## Risikofaktoren
${project.keyRisks || "Risikofaktoren fehlen und sollten ergaenzt werden."}

## Exit-Strategie
${project.exitStrategy || "Exit-Strategie fehlt und sollte ergaenzt werden."}

## Fehlende Informationen
${missingLine}`;
    }

    return `# Executive Summary - ${project.name}

## Projektintro
${project.name} ist eine professionelle Investmentmoeglichkeit im Segment ${project.assetClass || "Assetklasse fehlt"} in ${project.city || "Stadt fehlt"}, ${project.country || "Land fehlt"}.

## Standort und Marktpositionierung
Die Immobilie befindet sich in ${project.location || "einer noch zu validierenden Lage"}. Die Marktpositionierung sollte anhand von Nachfrage, Vergleichsmieten und Transaktionsdaten ergaenzt werden.

## Investment Highlights
${project.investmentHighlights || "Investment Highlights fehlen und sollten ergaenzt werden."}

## Finanzueberblick
Investmentvolumen: ${formatAmount(project.investmentVolume)}. Kaufpreis: ${formatAmount(project.purchasePrice)}. NOI: ${formatAmount(project.noi)}. Eigenkapitalbedarf: ${formatAmount(project.equityRequirement)}. Cap Rate: ${formatNumber(project.capRate, "%")}.

## Strategische Logik
Die Investmentthese basiert auf Standortqualitaet, Asset-Profil und umsetzbaren Werttreibern. Weitere Belege sollten aus Due Diligence und Marktvergleich ergaenzt werden.

## Risiken
${project.keyRisks || "Risiken fehlen und sollten ergaenzt werden."}

## Fazit
Das Projekt eignet sich fuer Investoren, die ${project.assetClass || "das Segment"}-Exposure in ${project.country || "dem Zielmarkt"} suchen. ${missingLine}`;
  }

  if (documentType === "Investment Overview") {
    return `# Investment Overview - ${project.name}

## Project description
${project.name} is a ${project.assetClass || "missing asset class"} opportunity in ${project.city || "missing city"}, ${project.country || "missing country"}. The current development status is: ${project.developmentStatus || "missing"}.

## Location analysis
The asset is positioned in ${project.location || "a location that still needs to be specified"}. Market positioning should be supported by local demand, comparable rents, and transaction evidence.

## Asset profile
Asset class: ${project.assetClass || "missing"}. Investment volume: ${formatAmount(project.investmentVolume)}. Purchase price: ${formatAmount(project.purchasePrice)}.

## Tenant / income profile
Rental income: ${formatAmount(project.rentalIncome)}. NOI: ${formatAmount(project.noi)}. Occupancy: ${formatNumber(project.occupancy, "%")}. WAULT: ${formatNumber(project.wault, " years")}.

## Financial assumptions
Cap rate: ${formatNumber(project.capRate, "%")}. Exit yield: ${formatNumber(project.exitYield, "%")}. Equity requirement: ${formatAmount(project.equityRequirement)}. Financing: ${project.financingAssumptions || "missing"}.

## Return potential
Return potential should be underwritten through cash flow, rent reversion, capex, financing terms, and exit assumptions. No missing financial data has been invented.

## Financing overview
${project.financingAssumptions || "Financing assumptions are missing and should be added."}

## Value creation strategy
${project.investmentHighlights || "Value creation points are missing and should be added."}

## Risk factors
${project.keyRisks || "Risk factors are missing and should be added."}

## Exit strategy
${project.exitStrategy || "Exit strategy is missing and should be added."}

## Missing information
${missingLine}`;
  }

  return `# Executive Summary - ${project.name}

## Project introduction
${project.name} is a ${project.assetClass || "missing asset class"} real estate investment opportunity located in ${project.city || "missing city"}, ${project.country || "missing country"}.

## Location and market positioning
The project is positioned in ${project.location || "a location that needs to be specified"}. Market positioning should be supported with local demand indicators, rental evidence, and transaction comparables.

## Investment highlights
${project.investmentHighlights || "Investment highlights are missing and should be added."}

## Financial overview
Investment volume: ${formatAmount(project.investmentVolume)}. Purchase price: ${formatAmount(project.purchasePrice)}. NOI: ${formatAmount(project.noi)}. Equity requirement: ${formatAmount(project.equityRequirement)}. Cap rate: ${formatNumber(project.capRate, "%")}.

## Strategic rationale
The investment thesis is based on the location, asset profile, and identifiable value creation levers. The rationale should be supported with due diligence and market evidence before external distribution.

## Risk summary
${project.keyRisks || "Key risks are missing and should be added."}

## Conclusion
The opportunity may suit investors seeking ${project.assetClass || "sector"} exposure in ${project.country || "the target market"}. ${missingLine}`;
}
