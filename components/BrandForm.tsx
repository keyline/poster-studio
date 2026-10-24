"use client";

import { useState } from "react";
import { api, compressImage, readAsDataUrl } from "@/lib/client";
import type { Brand, BrandInput, SourceNote } from "@/lib/types";

type Upload = { file: File; label: string; kind: "image" | "pdf" };
type Step = { label: string; status: "waiting" | "running" | "done" | "error"; detail?: string };

const MAX_PDF_BYTES = 3 * 1024 * 1024;

const EMPTY: BrandInput = {
  name: "",
  industry: "",
  location: "",
  description: "",
  website: "",
  facebook: "",
  instagram: "",
  otherLinks: "",
  competitorsHint: "",
};

export default function BrandForm({
  initial,
  onDone,
  onCancel,
}: {
  initial?: Brand;
  onDone: (brand: Brand) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<BrandInput>(() => (initial ? { ...EMPTY, ...initial } : EMPTY));
  const [logo, setLogo] = useState<string | undefined>(initial?.logo);
  const [notes, setNotes] = useState<SourceNote[]>(initial?.notes ?? []);
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [runStudy, setRunStudy] = useState(true);
  const [steps, setSteps] = useState<Step[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const field = (key: keyof BrandInput) => ({
    value: (form[key] as string) ?? "",
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm({ ...form, [key]: e.target.value }),
  });

  function addFiles(list: FileList | null, label: string, kind: "image" | "pdf") {
    if (!list) return;
    const added: Upload[] = [];
    for (const file of Array.from(list)) {
      if (kind === "pdf" && file.size > MAX_PDF_BYTES) {
        setError(`"${file.name}" is larger than 3 MB. Please compress or split the PDF.`);
        continue;
      }
      added.push({ file, label, kind });
    }
    setUploads((u) => [...u, ...added]);
  }

  async function pickLogo(list: FileList | null) {
    const file = list?.[0];
    if (file) setLogo(await compressImage(file, 500, "image/png"));
  }

  async function submit() {
    if (!form.name.trim()) {
      setError("Brand name is required.");
      return;
    }
    setError("");
    setBusy(true);
    const plan: Step[] = [
      { label: initial ? "Saving brand details" : "Creating brand", status: "waiting" },
      ...uploads.map((u) => ({ label: `Reading ${u.label}: ${u.file.name}`, status: "waiting" as const })),
      ...(runStudy ? [{ label: "Researching brand & competitors (1–3 min)", status: "waiting" as const }] : []),
    ];
    setSteps(plan);
    const mark = (i: number, status: Step["status"], detail?: string) =>
      setSteps((s) => s.map((st, n) => (n === i ? { ...st, status, detail } : st)));

    try {
      mark(0, "running");
      const details = { ...form, logo: logo ?? null, details: true };
      let { brand } = initial
        ? await api<{ brand: Brand }>(`/api/brands/${initial.id}`, details, "PUT")
        : await api<{ brand: Brand }>("/api/brands", { ...form, logo });
      mark(0, "done");

      const newNotes: SourceNote[] = [];
      for (let i = 0; i < uploads.length; i++) {
        const u = uploads[i];
        mark(i + 1, "running");
        try {
          const dataUrl = u.kind === "pdf" ? await readAsDataUrl(u.file) : await compressImage(u.file);
          const { text } = await api<{ text: string }>("/api/extract", {
            kind: u.kind,
            label: u.label,
            dataUrl,
            filename: u.file.name,
          });
          newNotes.push({ id: crypto.randomUUID(), label: `${u.label}: ${u.file.name}`, text });
          mark(i + 1, "done");
        } catch (e) {
          mark(i + 1, "error", (e as Error).message);
        }
      }
      const allNotes = [...notes, ...newNotes];
      if (newNotes.length || allNotes.length !== (initial?.notes.length ?? 0)) {
        ({ brand } = await api<{ brand: Brand }>(`/api/brands/${brand.id}`, { notes: allNotes }, "PUT"));
      }

      if (runStudy) {
        const s = plan.length - 1;
        mark(s, "running");
        try {
          ({ brand } = await api<{ brand: Brand }>(`/api/brands/${brand.id}/study`, {}));
          mark(s, "done");
        } catch (e) {
          mark(s, "error", (e as Error).message);
          setError("Brand saved, but the study failed. You can re-run it from the brand page.");
          setBusy(false);
          return;
        }
      }
      onDone(brand);
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  return (
    <div className="panel form-panel">
      <div className="panel-head">
        <h2>{initial ? `Edit ${initial.name}` : "New client brand"}</h2>
        <p className="muted">
          Give the planning team everything you have. The more material, the sharper the competitor study.
        </p>
      </div>

      <div className="form-grid">
        <div>
          <label>Brand name *</label>
          <input placeholder="e.g. Sagi Realty" {...field("name")} />
        </div>
        <div>
          <label>Industry / category</label>
          <input placeholder="e.g. Residential real estate" {...field("industry")} />
        </div>
        <div>
          <label>Market / location</label>
          <input placeholder="e.g. Kolkata, India" {...field("location")} />
        </div>
        <div>
          <label>Known competitors <small>(optional)</small></label>
          <input placeholder="e.g. Merlin, Siddha, PS Group" {...field("competitorsHint")} />
        </div>
      </div>

      <label>About the brand <small>(client brief, products, prices, story, USP, anything)</small></label>
      <textarea rows={5} placeholder="Paste the client's description, brochure text, notes from the client meeting…" {...field("description")} />

      <div className="form-grid">
        <div>
          <label>Website</label>
          <input placeholder="https://…" {...field("website")} />
        </div>
        <div>
          <label>Other links <small>(LinkedIn, YouTube, Google Maps…)</small></label>
          <input placeholder="Comma separated" {...field("otherLinks")} />
        </div>
        <div>
          <label>Facebook page URL</label>
          <input placeholder="https://facebook.com/…" {...field("facebook")} />
          <FilePick label="+ Facebook screenshots" accept="image/*" onPick={(f) => addFiles(f, "Facebook screenshot", "image")} />
        </div>
        <div>
          <label>Instagram profile URL</label>
          <input placeholder="https://instagram.com/…" {...field("instagram")} />
          <FilePick label="+ Instagram screenshots" accept="image/*" onPick={(f) => addFiles(f, "Instagram screenshot", "image")} />
        </div>
      </div>

      <div className="form-grid">
        <div>
          <label>Brochures / PDFs <small>(max 3 MB each)</small></label>
          <FilePick label="+ Add PDFs" accept="application/pdf" onPick={(f) => addFiles(f, "PDF", "pdf")} />
        </div>
        <div>
          <label>Other images <small>(old ads, packaging, store photos)</small></label>
          <FilePick label="+ Add images" accept="image/*" onPick={(f) => addFiles(f, "Brand image", "image")} />
        </div>
        <div>
          <label>Logo <small>(PNG with transparency works best)</small></label>
          <div className="logo-pick">
            {logo && <img src={logo} alt="Logo" />}
            <FilePick label={logo ? "Change logo" : "+ Upload logo"} accept="image/*" multiple={false} onPick={pickLogo} />
            {logo && (
              <button className="link" type="button" onClick={() => setLogo(undefined)}>
                Remove
              </button>
            )}
          </div>
        </div>
      </div>

      {(uploads.length > 0 || notes.length > 0) && (
        <div className="uploads">
          {notes.map((n) => (
            <span className="chip" key={n.id} title={n.text}>
              ✓ {n.label}
              <button type="button" onClick={() => setNotes(notes.filter((x) => x.id !== n.id))} aria-label="Remove">
                ×
              </button>
            </span>
          ))}
          {uploads.map((u, i) => (
            <span className="chip new" key={i}>
              {u.label}: {u.file.name}
              <button type="button" onClick={() => setUploads(uploads.filter((_, n) => n !== i))} aria-label="Remove">
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      <label className="check">
        <input type="checkbox" checked={runStudy} onChange={(e) => setRunStudy(e.target.checked)} />
        {initial?.study ? "Re-run the brand & competitor study" : "Run the brand & competitor study now"}
      </label>

      {steps.length > 0 && (
        <ul className="steps">
          {steps.map((s, i) => (
            <li key={i} className={s.status}>
              <span className="dot">{s.status === "running" ? <span className="spin" /> : s.status === "done" ? "✓" : s.status === "error" ? "!" : ""}</span>
              <span>
                {s.label}
                {s.detail && <small className="error-text"> — {s.detail}</small>}
              </span>
            </li>
          ))}
        </ul>
      )}

      {error && <div className="error">{error}</div>}

      <div className="actions end">
        <button className="btn ghost" type="button" onClick={onCancel} disabled={busy}>
          Cancel
        </button>
        <button className="btn" type="button" onClick={submit} disabled={busy}>
          {busy && <span className="spin" />}
          {busy ? "Working…" : initial ? "Save brand" : "Create brand & study it"}
        </button>
      </div>
    </div>
  );
}

function FilePick({
  label,
  accept,
  onPick,
  multiple = true,
}: {
  label: string;
  accept: string;
  onPick: (files: FileList | null) => void;
  multiple?: boolean;
}) {
  return (
    <label className="file-pick">
      {label}
      <input
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={(e) => {
          onPick(e.target.files);
          e.target.value = "";
        }}
      />
    </label>
  );
}
