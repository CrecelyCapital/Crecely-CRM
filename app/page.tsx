"use client";

import { useEffect, useMemo, useState } from "react";
import {
  dealStatuses,
  documentTypes,
  emptyContact,
  emptyProject,
  languages,
  navItems,
  riskProfiles,
  sampleContacts,
  sampleProjects,
} from "../lib/constants";
import { generateFallbackDocument } from "../lib/document-generator";
import { calculateMatches } from "../lib/matching";
import type {
  Contact,
  DealStatus,
  DocumentType,
  GeneratedDocument,
  Language,
  MatchResult,
  Project,
  ProjectContact,
} from "../lib/types";

type NavItem = (typeof navItems)[number];

const moneyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

function money(value: number | null | undefined) {
  return value === null || value === undefined ? "Missing" : moneyFormatter.format(value);
}

function numberInputValue(value: number | null | undefined) {
  return value === null || value === undefined ? "" : String(value);
}

function splitList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function fieldClass() {
  return "h-10 w-full rounded-lg border border-stone-300 bg-white px-3 text-sm text-stone-950 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100";
}

function textAreaClass() {
  return "min-h-24 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm leading-6 text-stone-950 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100";
}

function Label({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`grid gap-1 text-xs font-semibold text-stone-600 ${className}`}>
      {children}
    </label>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder = "",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <Label>
      <span>{label}</span>
      <input
        className={fieldClass()}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </Label>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number | null;
  onChange: (value: number | null) => void;
}) {
  return (
    <Label>
      <span>{label}</span>
      <input
        className={fieldClass()}
        inputMode="decimal"
        type="number"
        value={numberInputValue(value)}
        onChange={(event) =>
          onChange(event.target.value === "" ? null : Number(event.target.value))
        }
      />
    </Label>
  );
}

function SelectField<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: readonly T[];
  onChange: (value: T) => void;
}) {
  return (
    <Label>
      <span>{label}</span>
      <select
        className={fieldClass()}
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </Label>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  rows = 4,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
}) {
  return (
    <Label className="md:col-span-2">
      <span>{label}</span>
      <textarea
        className={textAreaClass()}
        rows={rows}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </Label>
  );
}

function CommandButton({
  children,
  onClick,
  variant = "primary",
  disabled = false,
}: {
  children: React.ReactNode;
  onClick: () => void;
  variant?: "primary" | "secondary" | "quiet";
  disabled?: boolean;
}) {
  const variants = {
    primary: "bg-stone-950 text-white hover:bg-stone-800",
    secondary: "border border-stone-300 bg-white text-stone-950 hover:bg-stone-100",
    quiet: "text-stone-700 hover:bg-stone-100",
  };

  return (
    <button
      className={`h-10 rounded-lg px-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]}`}
      disabled={disabled}
      type="button"
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function ScoreBadge({ score }: { score: number }) {
  const tone =
    score >= 75
      ? "bg-emerald-100 text-emerald-800"
      : score >= 50
        ? "bg-amber-100 text-amber-800"
        : "bg-stone-100 text-stone-700";

  return (
    <span className={`inline-flex h-8 min-w-14 items-center justify-center rounded-lg px-2 text-sm font-bold ${tone}`}>
      {score}
    </span>
  );
}

function SectionHeader({
  title,
  detail,
}: {
  title: string;
  detail?: string;
}) {
  return (
    <div className="mb-4 flex flex-col gap-1">
      <h2 className="text-xl font-semibold text-stone-950">{title}</h2>
      {detail ? <p className="text-sm text-stone-600">{detail}</p> : null}
    </div>
  );
}

export default function Home() {
  const [activeView, setActiveView] = useState<NavItem>("Dashboard");
  const [projects, setProjects] = useState<Project[]>(sampleProjects);
  const [contacts, setContacts] = useState<Contact[]>(sampleContacts);
  const [projectContacts, setProjectContacts] = useState<ProjectContact[]>([]);
  const [documents, setDocuments] = useState<GeneratedDocument[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number>(1);
  const [selectedContactId, setSelectedContactId] = useState<number>(1);
  const [projectDraft, setProjectDraft] = useState<Project>(sampleProjects[0]);
  const [contactDraft, setContactDraft] = useState<Contact>(sampleContacts[0]);
  const [documentType, setDocumentType] = useState<DocumentType>("Executive Summary");
  const [language, setLanguage] = useState<Language>("English");
  const [generatedContent, setGeneratedContent] = useState("");
  const [currentUser, setCurrentUser] = useState("Deal Manager");
  const [notice, setNotice] = useState("MVP workspace ready");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedProjectId) ?? projects[0],
    [projects, selectedProjectId]
  );

  const selectedContact = useMemo(
    () => contacts.find((contact) => contact.id === selectedContactId) ?? contacts[0],
    [contacts, selectedContactId]
  );

  const matches = useMemo(
    () => (selectedProject ? calculateMatches(selectedProject, contacts) : []),
    [contacts, selectedProject]
  );

  const pipelineRows = useMemo(() => {
    if (!selectedProject) return [];

    return matches.map((match) => {
      const saved = projectContacts.find(
        (item) =>
          item.projectId === selectedProject.id && item.contactId === match.contactId
      );
      return {
        match,
        dealStatus: saved?.dealStatus ?? "Not contacted",
        ndaStatus: saved?.ndaStatus ?? "Not sent",
        notes: saved?.notes ?? "",
      };
    });
  }, [matches, projectContacts, selectedProject]);

  const projectDocuments = useMemo(
    () =>
      selectedProject?.id
        ? documents.filter((document) => document.projectId === selectedProject.id)
        : [],
    [documents, selectedProject]
  );

  useEffect(() => {
    async function loadData() {
      try {
        const [meResponse, projectsResponse, contactsResponse] = await Promise.all([
          fetch("/api/me"),
          fetch("/api/projects"),
          fetch("/api/contacts"),
        ]);

        if (meResponse.ok) {
          const payload = (await meResponse.json()) as {
            user?: { name?: string; email?: string };
          };
          setCurrentUser(payload.user?.name || payload.user?.email || "Deal Manager");
        }

        if (projectsResponse.ok) {
          const payload = (await projectsResponse.json()) as { projects?: Project[] };
          if (payload.projects?.length) {
            setProjects(payload.projects);
            setSelectedProjectId(payload.projects[0].id ?? 1);
            setProjectDraft(payload.projects[0]);
          }
        }

        if (contactsResponse.ok) {
          const payload = (await contactsResponse.json()) as { contacts?: Contact[] };
          if (payload.contacts?.length) {
            setContacts(payload.contacts);
            setSelectedContactId(payload.contacts[0].id ?? 1);
            setContactDraft(payload.contacts[0]);
          }
        }

        await refreshPipeline();
        await refreshDocuments();
        setNotice("Data loaded");
      } catch {
        setNotice("Using local demo data");
      }
    }

    void loadData();
  }, []);

  useEffect(() => {
    if (selectedProject) setProjectDraft(selectedProject);
  }, [selectedProject]);

  useEffect(() => {
    if (selectedContact) setContactDraft(selectedContact);
  }, [selectedContact]);

  async function refreshPipeline(projectId = selectedProjectId) {
    try {
      const response = await fetch(`/api/project-contacts?projectId=${projectId}`);
      if (!response.ok) return;
      const payload = (await response.json()) as {
        projectContacts?: ProjectContact[];
      };
      setProjectContacts((current) => {
        const others = current.filter((item) => item.projectId !== projectId);
        return [...others, ...(payload.projectContacts ?? [])];
      });
    } catch {
      setNotice("Pipeline is local until database is available");
    }
  }

  async function refreshDocuments(projectId = selectedProjectId) {
    try {
      const response = await fetch(`/api/documents?projectId=${projectId}`);
      if (!response.ok) return;
      const payload = (await response.json()) as {
        documents?: GeneratedDocument[];
      };
      setDocuments((current) => {
        const others = current.filter((item) => item.projectId !== projectId);
        return [...others, ...(payload.documents ?? [])];
      });
    } catch {
      setNotice("Documents are local until database is available");
    }
  }

  function updateProject<K extends keyof Project>(key: K, value: Project[K]) {
    setProjectDraft((current) => ({ ...current, [key]: value }));
  }

  function updateContact<K extends keyof Contact>(key: K, value: Contact[K]) {
    setContactDraft((current) => ({ ...current, [key]: value }));
  }

  async function saveProject() {
    setIsSaving(true);
    try {
      const response = await fetch("/api/projects", {
        method: projectDraft.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(projectDraft),
      });

      if (!response.ok) throw new Error("Project save failed");
      const payload = (await response.json()) as { project?: Project };
      if (!payload.project) throw new Error("No project returned");
      const savedProject = payload.project;

      setProjects((current) => {
        const exists = current.some((project) => project.id === savedProject.id);
        return exists
          ? current.map((project) =>
              project.id === savedProject.id ? savedProject : project
            )
          : [savedProject, ...current];
      });
      setSelectedProjectId(savedProject.id ?? selectedProjectId);
      setNotice("Project saved");
    } catch {
      const fallback = {
        ...projectDraft,
        id: projectDraft.id ?? Date.now(),
      };
      setProjects((current) => {
        const exists = current.some((project) => project.id === fallback.id);
        return exists
          ? current.map((project) => (project.id === fallback.id ? fallback : project))
          : [fallback, ...current];
      });
      setSelectedProjectId(fallback.id ?? selectedProjectId);
      setNotice("Project saved locally");
    } finally {
      setIsSaving(false);
    }
  }

  async function saveContact() {
    setIsSaving(true);
    try {
      const response = await fetch("/api/contacts", {
        method: contactDraft.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(contactDraft),
      });

      if (!response.ok) throw new Error("Contact save failed");
      const payload = (await response.json()) as { contact?: Contact };
      if (!payload.contact) throw new Error("No contact returned");
      const savedContact = payload.contact;

      setContacts((current) => {
        const exists = current.some((contact) => contact.id === savedContact.id);
        return exists
          ? current.map((contact) =>
              contact.id === savedContact.id ? savedContact : contact
            )
          : [savedContact, ...current];
      });
      setSelectedContactId(savedContact.id ?? selectedContactId);
      setNotice("Contact saved");
    } catch {
      const fallback = {
        ...contactDraft,
        id: contactDraft.id ?? Date.now(),
      };
      setContacts((current) => {
        const exists = current.some((contact) => contact.id === fallback.id);
        return exists
          ? current.map((contact) => (contact.id === fallback.id ? fallback : contact))
          : [fallback, ...current];
      });
      setSelectedContactId(fallback.id ?? selectedContactId);
      setNotice("Contact saved locally");
    } finally {
      setIsSaving(false);
    }
  }

  async function runMatching() {
    if (!selectedProject?.id) return;

    try {
      const response = await fetch("/api/matching", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: selectedProject.id }),
      });

      if (!response.ok) throw new Error("Matching failed");
      await refreshPipeline(selectedProject.id);
      setNotice("Matching refreshed");
    } catch {
      setProjectContacts((current) => {
        const others = current.filter((item) => item.projectId !== selectedProject.id);
        const generated = matches.map((match) => ({
          projectId: selectedProject.id as number,
          contactId: match.contactId ?? Date.now(),
          dealStatus: "Not contacted" as DealStatus,
          matchScore: match.score,
          matchReason: match.reason,
          potentialObjections: match.potentialConcern,
          suggestedOutreachAngle: match.suggestedOutreachAngle,
          ndaStatus: "Not sent",
          lastContactedAt: null,
          nextFollowUpAt: null,
          notes: "",
        }));
        return [...others, ...generated];
      });
      setNotice("Matching calculated locally");
    }
  }

  async function generateDocument() {
    if (!selectedProject?.id) return;
    setIsGenerating(true);

    try {
      const response = await fetch("/api/documents/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: selectedProject.id,
          documentType,
          language,
        }),
      });

      if (!response.ok) throw new Error("Generation failed");
      const payload = (await response.json()) as {
        content?: string;
        source?: "openai" | "fallback";
      };
      setGeneratedContent(payload.content ?? "");
      setNotice(payload.source === "openai" ? "Document generated with OpenAI" : "Document generated locally");
    } catch {
      setGeneratedContent(
        generateFallbackDocument(selectedProject, documentType, language)
      );
      setNotice("Document generated locally");
    } finally {
      setIsGenerating(false);
    }
  }

  async function saveDocument() {
    if (!selectedProject?.id || !generatedContent.trim()) return;

    try {
      const response = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: selectedProject.id,
          documentType,
          language,
          content: generatedContent,
        }),
      });

      if (!response.ok) throw new Error("Save failed");
      const payload = (await response.json()) as { document?: GeneratedDocument };
      if (payload.document) {
        setDocuments((current) => [payload.document as GeneratedDocument, ...current]);
      }
      setNotice("Document saved");
    } catch {
      setDocuments((current) => [
        {
          id: Date.now(),
          projectId: selectedProject.id as number,
          documentType,
          language,
          content: generatedContent,
          version: 1,
        },
        ...current,
      ]);
      setNotice("Document saved locally");
    }
  }

  function downloadAsWord() {
    if (!generatedContent.trim()) return;
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>${selectedProject?.name ?? "Document"}</title></head><body><pre style="font-family: Arial, sans-serif; white-space: pre-wrap; line-height: 1.5;">${generatedContent.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</pre></body></html>`;
    const blob = new Blob([html], { type: "application/msword" });
    const url = URL.createObjectURL(blob);
    const anchor = window.document.createElement("a");
    anchor.href = url;
    anchor.download = `${selectedProject?.name ?? "investment-document"}.doc`;
    anchor.click();
    URL.revokeObjectURL(url);
    setNotice("Word export created");
  }

  function printAsPdf() {
    if (!generatedContent.trim()) return;
    const popup = window.open("", "_blank", "width=900,height=700");
    if (!popup) return;
    popup.document.write(
      `<pre style="font-family: Arial, sans-serif; white-space: pre-wrap; line-height: 1.5;">${generatedContent.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</pre>`
    );
    popup.document.close();
    popup.focus();
    popup.print();
    setNotice("PDF print dialog opened");
  }

  async function updatePipelineStatus(match: MatchResult, dealStatus: DealStatus) {
    if (!selectedProject?.id || !match.contactId) return;

    const nextItem: ProjectContact = {
      projectId: selectedProject.id,
      contactId: match.contactId,
      dealStatus,
      matchScore: match.score,
      matchReason: match.reason,
      potentialObjections: match.potentialConcern,
      suggestedOutreachAngle: match.suggestedOutreachAngle,
      ndaStatus: "Not sent",
      lastContactedAt: dealStatus === "Not contacted" ? null : new Date().toISOString(),
      nextFollowUpAt: null,
      notes: "",
    };

    setProjectContacts((current) => {
      const exists = current.some(
        (item) =>
          item.projectId === nextItem.projectId &&
          item.contactId === nextItem.contactId
      );
      return exists
        ? current.map((item) =>
            item.projectId === nextItem.projectId && item.contactId === nextItem.contactId
              ? { ...item, dealStatus }
              : item
          )
        : [...current, nextItem];
    });

    try {
      await fetch("/api/project-contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nextItem),
      });
      setNotice("Pipeline updated");
    } catch {
      setNotice("Pipeline updated locally");
    }
  }

  const totalPipelineValue = pipelineRows.reduce(
    (total, row) => total + (row.dealStatus !== "Not interested" ? row.match.score : 0),
    0
  );

  return (
    <main className="min-h-screen bg-stone-100 text-stone-950">
      <div className="flex min-h-screen">
        <aside className="hidden w-72 shrink-0 border-r border-stone-200 bg-white px-5 py-6 lg:block">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-700 text-sm font-bold text-white">
              RE
            </div>
            <div>
              <p className="text-sm font-bold">Capital Desk</p>
              <p className="text-xs text-stone-500">Real estate deals</p>
            </div>
          </div>

          <nav className="grid gap-1">
            {navItems.map((item) => (
              <button
                key={item}
                className={`h-10 rounded-lg px-3 text-left text-sm font-semibold transition ${
                  activeView === item
                    ? "bg-stone-950 text-white"
                    : "text-stone-700 hover:bg-stone-100"
                }`}
                type="button"
                onClick={() => setActiveView(item)}
              >
                {item}
              </button>
            ))}
          </nav>

          <div className="mt-8 rounded-lg border border-stone-200 bg-stone-50 p-4">
            <p className="text-xs font-semibold text-stone-500">Current project</p>
            <p className="mt-2 text-sm font-bold">{selectedProject?.name}</p>
            <p className="mt-1 text-xs text-stone-600">
              {selectedProject?.city}, {selectedProject?.country}
            </p>
          </div>
        </aside>

        <section className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-10 border-b border-stone-200 bg-white/95 px-4 py-4 backdrop-blur md:px-8">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-semibold text-emerald-700">Phase 1 MVP</p>
                <h1 className="text-2xl font-semibold text-stone-950">
                  Real Estate Investment Deal Platform
                </h1>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <select
                  className="h-10 min-w-56 rounded-lg border border-stone-300 bg-white px-3 text-sm"
                  value={selectedProjectId}
                  onChange={(event) => setSelectedProjectId(Number(event.target.value))}
                >
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
                <div className="rounded-lg bg-stone-100 px-3 py-2 text-sm text-stone-700">
                  {currentUser}
                </div>
              </div>
            </div>
          </header>

          <div className="grid gap-4 px-4 py-5 md:px-8 lg:hidden">
            <select
              className={fieldClass()}
              value={activeView}
              onChange={(event) => setActiveView(event.target.value as NavItem)}
            >
              {navItems.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1 px-4 pb-10 pt-5 md:px-8">
            <div className="mb-5 flex items-center justify-between gap-3 rounded-lg border border-stone-200 bg-white px-4 py-3">
              <p className="text-sm font-semibold text-stone-700">{notice}</p>
              <p className="text-xs text-stone-500">
                {projects.length} projects - {contacts.length} contacts
              </p>
            </div>

            {activeView === "Dashboard" ? (
              <DashboardView
                contacts={contacts}
                matches={matches}
                pipelineRows={pipelineRows}
                projects={projects}
                selectedProject={selectedProject}
                totalPipelineValue={totalPipelineValue}
              />
            ) : null}

            {activeView === "Projects" ? (
              <ProjectsView
                isSaving={isSaving}
                projectDraft={projectDraft}
                projects={projects}
                selectedProjectId={selectedProjectId}
                setProjectDraft={setProjectDraft}
                setSelectedProjectId={setSelectedProjectId}
                updateProject={updateProject}
                saveProject={saveProject}
              />
            ) : null}

            {activeView === "Investors / Partners" ? (
              <ContactsView
                contactDraft={contactDraft}
                contacts={contacts}
                isSaving={isSaving}
                selectedContactId={selectedContactId}
                setContactDraft={setContactDraft}
                setSelectedContactId={setSelectedContactId}
                updateContact={updateContact}
                saveContact={saveContact}
              />
            ) : null}

            {activeView === "AI Matching" ? (
              <MatchingView
                matches={matches}
                runMatching={runMatching}
                selectedProject={selectedProject}
              />
            ) : null}

            {activeView === "Documents" ? (
              <DocumentsView
                documentType={documentType}
                generatedContent={generatedContent}
                isGenerating={isGenerating}
                language={language}
                projectDocuments={projectDocuments}
                selectedProject={selectedProject}
                setDocumentType={setDocumentType}
                setGeneratedContent={setGeneratedContent}
                setLanguage={setLanguage}
                generateDocument={generateDocument}
                saveDocument={saveDocument}
                downloadAsWord={downloadAsWord}
                printAsPdf={printAsPdf}
              />
            ) : null}

            {activeView === "Deal Pipeline" ? (
              <PipelineView
                pipelineRows={pipelineRows}
                selectedProject={selectedProject}
                updatePipelineStatus={updatePipelineStatus}
              />
            ) : null}

            {activeView === "Settings" ? <SettingsView /> : null}
          </div>
        </section>
      </div>
    </main>
  );
}

function DashboardView({
  contacts,
  matches,
  pipelineRows,
  projects,
  selectedProject,
  totalPipelineValue,
}: {
  contacts: Contact[];
  matches: MatchResult[];
  pipelineRows: Array<{
    match: MatchResult;
    dealStatus: DealStatus;
    ndaStatus: string;
    notes: string;
  }>;
  projects: Project[];
  selectedProject?: Project;
  totalPipelineValue: number;
}) {
  const activePipeline = pipelineRows.filter(
    (row) => row.dealStatus !== "Not contacted" && row.dealStatus !== "Not interested"
  ).length;

  return (
    <div className="grid gap-5">
      <section className="grid gap-4 md:grid-cols-4">
        <Metric label="Projects" value={String(projects.length)} detail="Tracked opportunities" />
        <Metric label="Investors" value={String(contacts.length)} detail="CRM records" />
        <Metric label="Top match" value={String(matches[0]?.score ?? 0)} detail={matches[0]?.company ?? "No match"} />
        <Metric label="Pipeline" value={String(activePipeline)} detail={`${totalPipelineValue} score points`} />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
        <div className="rounded-lg border border-stone-200 bg-white p-5">
          <SectionHeader title="Selected Deal" detail={selectedProject?.name} />
          <div className="grid gap-4 md:grid-cols-3">
            <Fact label="Asset class" value={selectedProject?.assetClass ?? "Missing"} />
            <Fact label="Location" value={`${selectedProject?.city ?? ""}, ${selectedProject?.country ?? ""}`} />
            <Fact label="Investment volume" value={money(selectedProject?.investmentVolume)} />
            <Fact label="Purchase price" value={money(selectedProject?.purchasePrice)} />
            <Fact label="NOI" value={money(selectedProject?.noi)} />
            <Fact label="Equity required" value={money(selectedProject?.equityRequirement)} />
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <TextBlock title="Investment highlights" value={selectedProject?.investmentHighlights ?? ""} />
            <TextBlock title="Key risks" value={selectedProject?.keyRisks ?? ""} />
          </div>
        </div>

        <div className="rounded-lg border border-stone-200 bg-white p-5">
          <SectionHeader title="Best Matches" detail="Rule-based Phase 1 scoring" />
          <div className="grid gap-3">
            {matches.slice(0, 4).map((match) => (
              <div
                key={`${match.company}-${match.contactName}`}
                className="grid grid-cols-[auto_1fr] gap-3 rounded-lg border border-stone-200 p-3"
              >
                <ScoreBadge score={match.score} />
                <div>
                  <p className="text-sm font-bold">{match.company}</p>
                  <p className="text-xs text-stone-500">{match.contactName}</p>
                  <p className="mt-2 text-xs leading-5 text-stone-600">{match.reason}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function ProjectsView({
  isSaving,
  projectDraft,
  projects,
  selectedProjectId,
  setProjectDraft,
  setSelectedProjectId,
  updateProject,
  saveProject,
}: {
  isSaving: boolean;
  projectDraft: Project;
  projects: Project[];
  selectedProjectId: number;
  setProjectDraft: (project: Project) => void;
  setSelectedProjectId: (id: number) => void;
  updateProject: <K extends keyof Project>(key: K, value: Project[K]) => void;
  saveProject: () => void;
}) {
  return (
    <section className="grid gap-5 xl:grid-cols-[320px_1fr]">
      <div className="rounded-lg border border-stone-200 bg-white p-4">
        <div className="mb-4 flex items-center justify-between">
          <SectionHeader title="Projects" />
          <CommandButton
            variant="secondary"
            onClick={() => setProjectDraft({ ...emptyProject })}
          >
            New
          </CommandButton>
        </div>
        <div className="grid gap-2">
          {projects.map((project) => (
            <button
              key={project.id}
              className={`rounded-lg border p-3 text-left transition ${
                selectedProjectId === project.id
                  ? "border-emerald-600 bg-emerald-50"
                  : "border-stone-200 bg-white hover:bg-stone-50"
              }`}
              type="button"
              onClick={() => {
                setSelectedProjectId(project.id ?? 0);
                setProjectDraft(project);
              }}
            >
              <p className="text-sm font-bold">{project.name}</p>
              <p className="mt-1 text-xs text-stone-500">
                {project.assetClass} - {project.city}
              </p>
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-stone-200 bg-white p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <SectionHeader title="Project Record" detail="Core fields for underwriting and AI output" />
          <CommandButton disabled={isSaving} onClick={saveProject}>
            Save Project
          </CommandButton>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <TextField label="Project name" value={projectDraft.name} onChange={(value) => updateProject("name", value)} />
          <TextField label="Asset class" value={projectDraft.assetClass} onChange={(value) => updateProject("assetClass", value)} />
          <TextField label="Location" value={projectDraft.location} onChange={(value) => updateProject("location", value)} />
          <TextField label="City" value={projectDraft.city} onChange={(value) => updateProject("city", value)} />
          <TextField label="Country" value={projectDraft.country} onChange={(value) => updateProject("country", value)} />
          <TextField label="Development status" value={projectDraft.developmentStatus} onChange={(value) => updateProject("developmentStatus", value)} />
          <NumberField label="Investment volume" value={projectDraft.investmentVolume} onChange={(value) => updateProject("investmentVolume", value)} />
          <NumberField label="Purchase price" value={projectDraft.purchasePrice} onChange={(value) => updateProject("purchasePrice", value)} />
          <NumberField label="NOI" value={projectDraft.noi} onChange={(value) => updateProject("noi", value)} />
          <NumberField label="Rental income" value={projectDraft.rentalIncome} onChange={(value) => updateProject("rentalIncome", value)} />
          <NumberField label="Occupancy percent" value={projectDraft.occupancy} onChange={(value) => updateProject("occupancy", value)} />
          <NumberField label="WAULT years" value={projectDraft.wault} onChange={(value) => updateProject("wault", value)} />
          <NumberField label="Cap rate percent" value={projectDraft.capRate} onChange={(value) => updateProject("capRate", value)} />
          <NumberField label="Exit yield percent" value={projectDraft.exitYield} onChange={(value) => updateProject("exitYield", value)} />
          <NumberField label="Equity requirement" value={projectDraft.equityRequirement} onChange={(value) => updateProject("equityRequirement", value)} />
          <TextField label="Google Drive folder URL" value={projectDraft.googleDriveFolderUrl} onChange={(value) => updateProject("googleDriveFolderUrl", value)} />
          <TextAreaField label="Financing assumptions" value={projectDraft.financingAssumptions} onChange={(value) => updateProject("financingAssumptions", value)} />
          <TextAreaField label="Investment highlights" value={projectDraft.investmentHighlights} onChange={(value) => updateProject("investmentHighlights", value)} />
          <TextAreaField label="Key risks" value={projectDraft.keyRisks} onChange={(value) => updateProject("keyRisks", value)} />
          <TextAreaField label="Exit strategy" value={projectDraft.exitStrategy} onChange={(value) => updateProject("exitStrategy", value)} />
          <TextAreaField label="Additional notes" value={projectDraft.additionalNotes} onChange={(value) => updateProject("additionalNotes", value)} />
        </div>
      </div>
    </section>
  );
}

function ContactsView({
  contactDraft,
  contacts,
  isSaving,
  selectedContactId,
  setContactDraft,
  setSelectedContactId,
  updateContact,
  saveContact,
}: {
  contactDraft: Contact;
  contacts: Contact[];
  isSaving: boolean;
  selectedContactId: number;
  setContactDraft: (contact: Contact) => void;
  setSelectedContactId: (id: number) => void;
  updateContact: <K extends keyof Contact>(key: K, value: Contact[K]) => void;
  saveContact: () => void;
}) {
  return (
    <section className="grid gap-5 xl:grid-cols-[320px_1fr]">
      <div className="rounded-lg border border-stone-200 bg-white p-4">
        <div className="mb-4 flex items-center justify-between">
          <SectionHeader title="Contacts" />
          <CommandButton
            variant="secondary"
            onClick={() => setContactDraft({ ...emptyContact })}
          >
            New
          </CommandButton>
        </div>
        <div className="grid gap-2">
          {contacts.map((contact) => (
            <button
              key={contact.id}
              className={`rounded-lg border p-3 text-left transition ${
                selectedContactId === contact.id
                  ? "border-emerald-600 bg-emerald-50"
                  : "border-stone-200 bg-white hover:bg-stone-50"
              }`}
              type="button"
              onClick={() => {
                setSelectedContactId(contact.id ?? 0);
                setContactDraft(contact);
              }}
            >
              <p className="text-sm font-bold">{contact.name}</p>
              <p className="mt-1 text-xs text-stone-500">
                {contact.company} - {contact.contactType}
              </p>
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-stone-200 bg-white p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <SectionHeader title="Investor / Partner Record" detail="Profile, preferences, relationship context" />
          <CommandButton disabled={isSaving} onClick={saveContact}>
            Save Contact
          </CommandButton>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <TextField label="Name" value={contactDraft.name} onChange={(value) => updateContact("name", value)} />
          <TextField label="Company" value={contactDraft.company} onChange={(value) => updateContact("company", value)} />
          <TextField label="Role" value={contactDraft.role} onChange={(value) => updateContact("role", value)} />
          <TextField label="Email" value={contactDraft.email} onChange={(value) => updateContact("email", value)} />
          <TextField label="Phone" value={contactDraft.phone} onChange={(value) => updateContact("phone", value)} />
          <SelectField
            label="Contact type"
            value={contactDraft.contactType}
            options={["Investor", "Partner", "Advisor", "Bank"] as const}
            onChange={(value) => updateContact("contactType", value)}
          />
          <SelectField
            label="Risk profile"
            value={contactDraft.riskProfile}
            options={riskProfiles}
            onChange={(value) => updateContact("riskProfile", value)}
          />
          <TextField label="Relationship status" value={contactDraft.relationshipStatus} onChange={(value) => updateContact("relationshipStatus", value)} />
          <NumberField label="Ticket size min" value={contactDraft.ticketSizeMin} onChange={(value) => updateContact("ticketSizeMin", value)} />
          <NumberField label="Ticket size max" value={contactDraft.ticketSizeMax} onChange={(value) => updateContact("ticketSizeMax", value)} />
          <TextField
            label="Preferred asset classes"
            value={contactDraft.preferredAssetClasses.join(", ")}
            onChange={(value) => updateContact("preferredAssetClasses", splitList(value))}
          />
          <TextField
            label="Preferred geographies"
            value={contactDraft.preferredGeographies.join(", ")}
            onChange={(value) => updateContact("preferredGeographies", splitList(value))}
          />
          <TextAreaField label="Investor profile" value={contactDraft.investorProfile} onChange={(value) => updateContact("investorProfile", value)} />
          <TextAreaField label="Notes" value={contactDraft.notes} onChange={(value) => updateContact("notes", value)} />
        </div>
      </div>
    </section>
  );
}

function MatchingView({
  matches,
  runMatching,
  selectedProject,
}: {
  matches: MatchResult[];
  runMatching: () => void;
  selectedProject?: Project;
}) {
  return (
    <section className="rounded-lg border border-stone-200 bg-white p-5">
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <SectionHeader title="AI Matching" detail={selectedProject?.name} />
        <CommandButton onClick={runMatching}>Refresh Scores</CommandButton>
      </div>
      <div className="grid gap-3">
        {matches.map((match) => (
          <div
            key={`${match.company}-${match.contactName}`}
            className="grid gap-4 rounded-lg border border-stone-200 p-4 md:grid-cols-[auto_1.2fr_1fr_1fr]"
          >
            <ScoreBadge score={match.score} />
            <div>
              <p className="text-sm font-bold">{match.company}</p>
              <p className="text-xs text-stone-500">{match.contactName}</p>
            </div>
            <p className="text-sm leading-6 text-stone-700">{match.reason}</p>
            <div>
              <p className="text-xs font-bold text-stone-500">Concern</p>
              <p className="mt-1 text-sm leading-6 text-stone-700">
                {match.potentialConcern}
              </p>
              <p className="mt-3 text-xs font-bold text-stone-500">Outreach angle</p>
              <p className="mt-1 text-sm leading-6 text-stone-700">
                {match.suggestedOutreachAngle}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function DocumentsView({
  documentType,
  generatedContent,
  isGenerating,
  language,
  projectDocuments,
  selectedProject,
  setDocumentType,
  setGeneratedContent,
  setLanguage,
  generateDocument,
  saveDocument,
  downloadAsWord,
  printAsPdf,
}: {
  documentType: DocumentType;
  generatedContent: string;
  isGenerating: boolean;
  language: Language;
  projectDocuments: GeneratedDocument[];
  selectedProject?: Project;
  setDocumentType: (value: DocumentType) => void;
  setGeneratedContent: (value: string) => void;
  setLanguage: (value: Language) => void;
  generateDocument: () => void;
  saveDocument: () => void;
  downloadAsWord: () => void;
  printAsPdf: () => void;
}) {
  return (
    <section className="grid gap-5 xl:grid-cols-[1fr_360px]">
      <div className="rounded-lg border border-stone-200 bg-white p-5">
        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <SectionHeader title="Generated Documents" detail={selectedProject?.name} />
          <div className="flex flex-wrap gap-2">
            <CommandButton disabled={isGenerating} onClick={generateDocument}>
              {isGenerating ? "Generating" : "Generate"}
            </CommandButton>
            <CommandButton variant="secondary" onClick={saveDocument}>
              Save
            </CommandButton>
            <CommandButton variant="secondary" onClick={downloadAsWord}>
              Word
            </CommandButton>
            <CommandButton variant="secondary" onClick={printAsPdf}>
              PDF
            </CommandButton>
          </div>
        </div>
        <div className="mb-4 grid gap-4 md:grid-cols-2">
          <SelectField
            label="Document type"
            value={documentType}
            options={documentTypes}
            onChange={setDocumentType}
          />
          <SelectField
            label="Language"
            value={language}
            options={languages}
            onChange={setLanguage}
          />
        </div>
        <textarea
          className="min-h-[560px] w-full rounded-lg border border-stone-300 bg-white px-4 py-3 font-mono text-sm leading-6 text-stone-950 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
          value={generatedContent}
          onChange={(event) => setGeneratedContent(event.target.value)}
          placeholder="Draft content"
        />
      </div>

      <div className="rounded-lg border border-stone-200 bg-white p-5">
        <SectionHeader title="Saved Versions" />
        <div className="grid gap-3">
          {projectDocuments.length ? (
            projectDocuments.map((document) => (
              <button
                key={document.id}
                className="rounded-lg border border-stone-200 p-3 text-left hover:bg-stone-50"
                type="button"
                onClick={() => setGeneratedContent(document.content)}
              >
                <p className="text-sm font-bold">{document.documentType}</p>
                <p className="mt-1 text-xs text-stone-500">
                  {document.language} - v{document.version}
                </p>
              </button>
            ))
          ) : (
            <p className="rounded-lg bg-stone-50 p-4 text-sm text-stone-600">
              No saved versions for this project yet.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

function PipelineView({
  pipelineRows,
  selectedProject,
  updatePipelineStatus,
}: {
  pipelineRows: Array<{
    match: MatchResult;
    dealStatus: DealStatus;
    ndaStatus: string;
    notes: string;
  }>;
  selectedProject?: Project;
  updatePipelineStatus: (match: MatchResult, dealStatus: DealStatus) => void;
}) {
  return (
    <section className="rounded-lg border border-stone-200 bg-white p-5">
      <SectionHeader title="Deal Pipeline" detail={selectedProject?.name} />
      <div className="overflow-x-auto">
        <table className="w-full min-w-[920px] border-separate border-spacing-0 text-left text-sm">
          <thead>
            <tr className="text-xs font-bold text-stone-500">
              <th className="border-b border-stone-200 px-3 py-3">Investor</th>
              <th className="border-b border-stone-200 px-3 py-3">Score</th>
              <th className="border-b border-stone-200 px-3 py-3">Status</th>
              <th className="border-b border-stone-200 px-3 py-3">NDA</th>
              <th className="border-b border-stone-200 px-3 py-3">Angle</th>
            </tr>
          </thead>
          <tbody>
            {pipelineRows.map((row) => (
              <tr key={`${row.match.company}-${row.match.contactName}`}>
                <td className="border-b border-stone-100 px-3 py-3">
                  <p className="font-bold">{row.match.company}</p>
                  <p className="text-xs text-stone-500">{row.match.contactName}</p>
                </td>
                <td className="border-b border-stone-100 px-3 py-3">
                  <ScoreBadge score={row.match.score} />
                </td>
                <td className="border-b border-stone-100 px-3 py-3">
                  <select
                    className="h-9 w-48 rounded-lg border border-stone-300 bg-white px-2 text-sm"
                    value={row.dealStatus}
                    onChange={(event) =>
                      updatePipelineStatus(row.match, event.target.value as DealStatus)
                    }
                  >
                    {dealStatuses.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="border-b border-stone-100 px-3 py-3">{row.ndaStatus}</td>
                <td className="border-b border-stone-100 px-3 py-3 text-stone-700">
                  {row.match.suggestedOutreachAngle}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function SettingsView() {
  const routes = [
    "/api/me",
    "/api/projects",
    "/api/contacts",
    "/api/matching",
    "/api/project-contacts",
    "/api/documents",
    "/api/documents/generate",
  ];

  return (
    <section className="grid gap-5 xl:grid-cols-2">
      <div className="rounded-lg border border-stone-200 bg-white p-5">
        <SectionHeader title="Architecture" detail="Designed for phased build-out" />
        <div className="grid gap-3 text-sm leading-6 text-stone-700">
          <p>Frontend: React, TypeScript, Tailwind CSS, app router structure.</p>
          <p>Data: SQLite/libsql-compatible relational schema with Drizzle definitions.</p>
          <p>Auth: workspace identity headers with local development fallback.</p>
          <p>AI: server route for OpenAI Responses API plus structured fallback generation.</p>
          <p>Storage roadmap: libsql/Turso for records, external object storage for documents in later phases.</p>
        </div>
      </div>

      <div className="rounded-lg border border-stone-200 bg-white p-5">
        <SectionHeader title="API Surface" />
        <div className="grid gap-2">
          {routes.map((route) => (
            <code
              className="rounded-lg bg-stone-100 px-3 py-2 text-sm text-stone-800"
              key={route}
            >
              {route}
            </code>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-stone-200 bg-white p-5 xl:col-span-2">
        <SectionHeader title="Roadmap" />
        <div className="grid gap-3 md:grid-cols-4">
          <RoadmapStep title="Phase 1" items={["CRUD", "AI documents", "Matching", "Pipeline"]} />
          <RoadmapStep title="Phase 2" items={["Drive links", "Document refs", "Extraction", "Missing data"]} />
          <RoadmapStep title="Phase 3" items={["Outreach", "Reminders", "Interactions", "NDA tracking"]} />
          <RoadmapStep title="Phase 4" items={["Drive sync", "Email", "Campaigns", "Analytics"]} />
        </div>
      </div>
    </section>
  );
}

function Metric({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-lg border border-stone-200 bg-white p-5">
      <p className="text-xs font-bold text-stone-500">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-stone-950">{value}</p>
      <p className="mt-2 text-sm text-stone-600">{detail}</p>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-stone-50 p-4">
      <p className="text-xs font-bold text-stone-500">{label}</p>
      <p className="mt-2 text-sm font-semibold text-stone-950">{value}</p>
    </div>
  );
}

function TextBlock({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-lg border border-stone-200 p-4">
      <p className="text-sm font-bold">{title}</p>
      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-stone-700">
        {value || "Missing"}
      </p>
    </div>
  );
}

function RoadmapStep({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-lg border border-stone-200 p-4">
      <p className="text-sm font-bold">{title}</p>
      <div className="mt-3 grid gap-2">
        {items.map((item) => (
          <p className="text-sm text-stone-700" key={item}>
            {item}
          </p>
        ))}
      </div>
    </div>
  );
}
