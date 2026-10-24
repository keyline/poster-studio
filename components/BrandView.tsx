"use client";

import { useState } from "react";
import { forAi, removeBrand, storeBrand, type StorageMode } from "@/lib/brandStore";
import { api } from "@/lib/client";
import type { Brand, BrandStudy } from "@/lib/types";

export default function BrandView({
  brand,
  mode,
  warning,
  onChange,
  onEdit,
  onDelete,
  onCreatePoster,
}: {
  brand: Brand;
  mode: StorageMode;
  warning?: string;
  onChange: (b: Brand) => void;
  onEdit: () => void;
  onDelete: () => void;
  onCreatePoster: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(warning ?? "");
  const s = brand.study;

  async function rerun() {
    setBusy(true);
    setError("");
    try {
      const { study } = await api<{ study: BrandStudy }>("/api/study", { brand: forAi(brand) });
      onChange(await storeBrand({ ...brand, study }, mode));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!confirm(`Delete ${brand.name}? This cannot be undone.`)) return;
    try {
      await removeBrand(brand.id, mode);
      onDelete();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <div className="brand-view">
      <div className="panel brand-hero">
        <div className="brand-id">
          {brand.logo ? <img src={brand.logo} alt="" className="logo-lg" /> : <div className="logo-lg mono">{brand.name[0]}</div>}
          <div>
            <h2>{brand.name}</h2>
            <p className="muted">{[brand.industry || s?.category, brand.location].filter(Boolean).join(" · ")}</p>
            <div className="links">
              {[brand.website, brand.facebook, brand.instagram].filter(Boolean).map((u) => (
                <a key={u} href={/^https?:/.test(u) ? u : `https://${u}`} target="_blank" rel="noreferrer">
                  {u.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")}
                </a>
              ))}
            </div>
          </div>
        </div>
        <div className="actions">
          <button className="btn" type="button" onClick={onCreatePoster}>
            Create poster →
          </button>
          <button className="btn ghost" type="button" onClick={onEdit}>
            Edit / add material
          </button>
          <button className="btn ghost" type="button" onClick={rerun} disabled={busy}>
            {busy && <span className="spin" />}
            {busy ? "Researching… (1–3 min)" : s ? "Re-run study" : "Run study"}
          </button>
          <button className="btn ghost danger" type="button" onClick={remove}>
            Delete
          </button>
        </div>
        {error && <div className="error">{error}</div>}
      </div>

      {!s ? (
        <div className="panel empty">No study yet. Run the brand & competitor study to brief the creative team.</div>
      ) : (
        <>
          <div className="panel">
            <div className="section-label">Brand summary</div>
            <p className="lead">{s.brandSummary}</p>
            <div className="study-grid">
              <Block title="Target audience" items={s.targetAudience} />
              <Block title="Personality" items={s.brandPersonality} chips />
              <div>
                <h4>Tone of voice</h4>
                <p>{s.toneOfVoice}</p>
              </div>
              <div>
                <h4>Visual identity</h4>
                <div className="swatches">
                  {s.visualIdentity.colors.map((c) => {
                    const hex = c.match(/#[0-9a-f]{6}|#[0-9a-f]{3}\b/i)?.[0];
                    return (
                      <span key={c} className="swatch">
                        {hex && <i style={{ background: hex }} />}
                        {c}
                      </span>
                    );
                  })}
                </div>
                <p>
                  <b>Type:</b> {s.visualIdentity.typography}
                </p>
                <p>
                  <b>Imagery:</b> {s.visualIdentity.imagery}
                </p>
              </div>
              <Block title="USPs" items={s.usp} />
            </div>
          </div>

          <div className="panel">
            <div className="section-label">Competitor study</div>
            <div className="competitors">
              {s.competitors.map((c) => (
                <div className="competitor" key={c.name}>
                  <h4>{c.name}</h4>
                  <p>
                    <b>Positioning:</b> {c.positioning}
                  </p>
                  <p>
                    <b>Strengths:</b> {c.strengths}
                  </p>
                  <p>
                    <b>Weaknesses:</b> {c.weaknesses}
                  </p>
                  <p>
                    <b>Communication:</b> {c.communicationStyle}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="panel study-grid">
            <Block title="Market gaps" items={s.marketGaps} />
            <Block title="Positioning opportunities" items={s.positioningOpportunities} />
            <Block title="Creative do's" items={s.dos} />
            <Block title="Creative don'ts" items={s.donts} />
          </div>

          <p className="muted small">
            Study generated {new Date(s.generatedAt).toLocaleString()}
            {s.usedWebSearch ? " with live web research" : " without live web search (model knowledge + your material)"}.
            {s.sources.length > 0 && (
              <>
                {" "}
                Sources:{" "}
                {s.sources.slice(0, 8).map((src, i) => (
                  <span key={i}>
                    {/^https?:/.test(src) ? (
                      <a href={src} target="_blank" rel="noreferrer">
                        {src.replace(/^https?:\/\/(www\.)?/, "").slice(0, 40)}
                      </a>
                    ) : (
                      src
                    )}
                    {i < Math.min(s.sources.length, 8) - 1 ? ", " : ""}
                  </span>
                ))}
              </>
            )}
          </p>
        </>
      )}
    </div>
  );
}

function Block({ title, items, chips }: { title: string; items: string[]; chips?: boolean }) {
  if (!items.length) return null;
  return (
    <div>
      <h4>{title}</h4>
      {chips ? (
        <div className="chips">
          {items.map((i) => (
            <span className="chip" key={i}>
              {i}
            </span>
          ))}
        </div>
      ) : (
        <ul>
          {items.map((i) => (
            <li key={i}>{i}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
