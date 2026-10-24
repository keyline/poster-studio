"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { APPEALS } from "@/lib/appeals";
import { AD_STYLES, DEPTH_LABELS, type AdStyle } from "@/lib/craft";
import { forAi } from "@/lib/brandStore";
import { api, canvasToJpeg, saveBlob } from "@/lib/client";
import { EXPERTS, ROLES, avatarUrl } from "@/lib/experts";
import { QUALITIES, allowed, bestQualityWithin, estimateCost, type Quality } from "@/lib/imageCost";
import type { Brand, Idea, Layout, Team, TextMode, Visual } from "@/lib/types";
import PosterCanvas from "./PosterCanvas";

type Poster = { src?: string; loading?: boolean; error?: string; layout: Layout; showText: boolean; quality?: string; cost?: number | null };

const usd = (n: number) => `$${n.toFixed(3).replace(/0$/, "")}`;

const EMPTY_TEAM: Team = { copywriter: "", artDirector: "", visualizer: "", photographer: "" };

export default function Studio({
  brands,
  brandId,
  setBrandId,
  onNewBrand,
}: {
  brands: Brand[];
  brandId: string;
  setBrandId: (id: string) => void;
  onNewBrand: () => void;
}) {
  const brand = brands.find((b) => b.id === brandId);
  const [brief, setBrief] = useState("");
  const [appeals, setAppeals] = useState<string[]>([]);
  const [team, setTeam] = useState<Team>(EMPTY_TEAM);
  const [orientation, setOrientation] = useState("portrait");
  const [quality, setQuality] = useState<"auto" | Quality>("auto");
  const [config, setConfig] = useState<{ model: string; maxCost: number } | null>(null);

  useEffect(() => {
    api<{ model: string; maxCost: number }>("/api/config").then(setConfig, () => {});
  }, []);

  const autoQuality = config ? bestQualityWithin(config.model, orientation, config.maxCost) : "low";
  const effectiveQuality = quality === "auto" || (config && !allowed(config.model, orientation, quality, config.maxCost)) ? autoQuality : quality;
  const perImage = config ? estimateCost(config.model, orientation, effectiveQuality) : null;
  const [textMode, setTextMode] = useState<TextMode>("overlay");
  const [adStyle, setAdStyle] = useState<AdStyle>("photo");
  const [depth, setDepth] = useState(7);

  function pickStyle(style: AdStyle) {
    setAdStyle(style);
  }

  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [visuals, setVisuals] = useState<Visual[]>([]);
  const [posters, setPosters] = useState<Poster[]>([]);
  const [busy, setBusy] = useState<"" | "ideas" | "visuals">("");
  const [error, setError] = useState("");

  const teamComplete = Object.values(team).every(Boolean);
  const ready = Boolean(brand && brief.trim() && appeals.length && teamComplete);
  const missing = [
    !brand && "a brand",
    !brief.trim() && "a brief",
    !appeals.length && "at least one positioning style",
    !teamComplete && "all four team members",
  ].filter(Boolean);

  async function buildIdeas() {
    setBusy("ideas");
    setError("");
    try {
      const { ideas } = await api<{ ideas: Idea[] }>("/api/ideas", { brand: brand && forAi(brand), brief, appeals, team, orientation, adStyle, depth });
      setIdeas(ideas);
      setVisuals([]);
      setPosters([]);
      setTimeout(() => document.getElementById("ideas")?.scrollIntoView({ behavior: "smooth" }), 50);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy("");
    }
  }

  async function buildVisuals() {
    setBusy("visuals");
    setError("");
    try {
      const { visuals } = await api<{ visuals: Visual[] }>("/api/visuals", { brand: brand && forAi(brand), ideas, team, orientation, textMode, adStyle, depth });
      setVisuals(visuals);
      setPosters(visuals.map((v) => ({ layout: v.layout, showText: textMode === "overlay" })));
      setTimeout(() => document.getElementById("visuals")?.scrollIntoView({ behavior: "smooth" }), 50);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy("");
    }
  }

  const updatePoster = (i: number, patch: Partial<Poster>) =>
    setPosters((all) => all.map((p, n) => (n === i ? { ...p, ...patch } : p)));

  async function generate(i: number) {
    updatePoster(i, { loading: true, error: undefined });
    try {
      const res = await api<{ image: string; quality: string; estimatedCost: number | null }>("/api/poster", {
        prompt: visuals[i].prompt,
        orientation,
        quality: effectiveQuality,
      });
      const image = res.image;
      updatePoster(i, { src: image, loading: false, quality: res.quality, cost: res.estimatedCost });
    } catch (e) {
      updatePoster(i, { error: (e as Error).message, loading: false });
    }
  }

  function generateAll() {
    visuals.forEach((_, i) => generate(i));
    setTimeout(() => document.getElementById("posters")?.scrollIntoView({ behavior: "smooth" }), 50);
  }

  // Finished poster canvases, so "Download all" can export exactly what is on screen.
  const canvases = useRef<(HTMLCanvasElement | null)[]>([]);
  const canvasSetters = useMemo(
    () => [0, 1, 2].map((i) => (c: HTMLCanvasElement | null) => (canvases.current[i] = c)),
    [],
  );
  const [downloading, setDownloading] = useState(false);
  const fileBase = (brand?.name ?? "poster").trim().replace(/[^\w-]+/g, "-").replace(/-+/g, "-");

  function postCopyText(idea?: Idea) {
    if (!idea) return "";
    return idea.postCopy?.trim() || [idea.headline, idea.subhead, idea.body, idea.cta].filter(Boolean).join("\n\n");
  }

  async function downloadAll() {
    setDownloading(true);
    try {
      for (let i = 0; i < posters.length; i++) {
        const canvas = canvases.current[i];
        if (!posters[i].src || !canvas) continue;
        saveBlob(await canvasToJpeg(canvas), `${fileBase}-ad-${i + 1}.jpg`);
        await new Promise((r) => setTimeout(r, 400));
        saveBlob(new Blob([postCopyText(ideas[i])], { type: "text/plain;charset=utf-8" }), `${fileBase}-ad-${i + 1}-post-copy.txt`);
        await new Promise((r) => setTimeout(r, 400));
      }
    } finally {
      setDownloading(false);
    }
  }

  const editIdea = (i: number, key: keyof Idea, value: string) =>
    setIdeas((all) => all.map((idea, n) => (n === i ? { ...idea, [key]: value } : idea)));

  return (
    <div className="studio">
      {/* 1. Client */}
      <section className="panel">
        <StepTitle n={1} title="Client" hint="Whose poster are we making?" />
        {brands.length === 0 ? (
          <div className="empty">
            No brands yet.{" "}
            <button className="link" onClick={onNewBrand} type="button">
              Add your first client brand
            </button>
          </div>
        ) : (
          <div className="brand-pick">
            {brands.map((b) => (
              <button key={b.id} type="button" className={`brand-chip ${b.id === brandId ? "on" : ""}`} onClick={() => setBrandId(b.id)}>
                {b.logo ? <img src={b.logo} alt="" /> : <span className="mono">{b.name[0]}</span>}
                <span>
                  <b>{b.name}</b>
                  <small>{b.study ? "Study ready" : "No study yet"}</small>
                </span>
              </button>
            ))}
          </div>
        )}
        {brand && !brand.study && <p className="warn">This brand has no competitor study yet — ideas will be weaker. Run it from the Brands tab.</p>}
      </section>

      {/* 2. Brief */}
      <section className="panel">
        <StepTitle n={2} title="Poster brief" hint="What does this poster need to do?" />
        <textarea
          rows={4}
          value={brief}
          onChange={(e) => setBrief(e.target.value)}
          placeholder="e.g. Durga Puja offer: 10% off on 3BHK flats at Rajarhat project, booking open till 15 Oct. Target: young families upgrading from rented homes. Mandatory: RERA no. on poster."
        />
        <label>Ad style</label>
        <div className="ad-styles">
          {AD_STYLES.map((st) => (
            <button key={st.id} type="button" className={`appeal ${adStyle === st.id ? "on" : ""}`} onClick={() => pickStyle(st.id)}>
              <b>{st.name}</b>
              <small>{st.hint}</small>
            </button>
          ))}
        </div>
        <label>
          Creative depth: <b className="depth-value">{depth}</b> <span className="muted">· {DEPTH_LABELS[depth]}</span>
        </label>
        <input type="range" min={1} max={10} step={1} value={depth} onChange={(e) => setDepth(Number(e.target.value))} className="depth" />
        <div className="depth-scale muted small">
          <span>1 · Straight, clear benefit</span>
          <span>10 · Double meaning, award-level concept</span>
        </div>
        <div className="form-grid three">
          <div>
            <label>Format</label>
            <select value={orientation} onChange={(e) => setOrientation(e.target.value)}>
              <option value="portrait">Portrait (2:3)</option>
              <option value="square">Square (1:1)</option>
              <option value="landscape">Landscape (3:2)</option>
            </select>
          </div>
          <div>
            <label>Image quality</label>
            <select value={quality} onChange={(e) => setQuality(e.target.value as "auto" | Quality)}>
              <option value="auto">Best within budget ({autoQuality})</option>
              {QUALITIES.map((q) => {
                const cost = config ? estimateCost(config.model, orientation, q) : null;
                const ok = config ? allowed(config.model, orientation, q, config.maxCost) : true;
                return (
                  <option key={q} value={q} disabled={!ok}>
                    {q[0].toUpperCase() + q.slice(1)}
                    {cost !== null ? ` · ~${usd(cost)}` : ""}
                    {ok ? "" : " · over budget"}
                  </option>
                );
              })}
            </select>
          </div>
          <div>
            <label>Typography</label>
            <select value={textMode} onChange={(e) => setTextMode(e.target.value as TextMode)}>
              <option value="overlay">Typeset by the studio (recommended, exact copy)</option>
              <option value="ai">AI draws the text (may misspell)</option>
            </select>
          </div>
        </div>
      </section>

      {/* 3. Positioning */}
      <section className="panel">
        <StepTitle n={3} title="Positioning style" hint="Pick one or more emotional appeals" />
        <div className="appeals">
          {APPEALS.map((a) => {
            const on = appeals.includes(a.id);
            return (
              <button
                key={a.id}
                type="button"
                className={`appeal ${on ? "on" : ""}`}
                onClick={() => setAppeals(on ? appeals.filter((x) => x !== a.id) : [...appeals, a.id])}
              >
                <b>{a.name}</b>
                <small>{a.hint}</small>
              </button>
            );
          })}
        </div>
      </section>

      {/* 4. Team */}
      <section className="panel">
        <StepTitle n={4} title="Assemble your creative team" hint="Pick one professional for each role" />
        {ROLES.map((role) => (
          <div className="role" key={role.id}>
            <div className="role-head">
              <h4>{role.label}</h4>
              <span className="muted small">{role.hint}</span>
            </div>
            <div className="profiles">
              {EXPERTS.filter((e) => e.role === role.id).map((e) => (
                <button
                  key={e.id}
                  type="button"
                  className={`profile ${team[role.id] === e.id ? "on" : ""}`}
                  onClick={() => setTeam({ ...team, [role.id]: e.id })}
                >
                  <span className="avatar">
                    {e.name.split(" ").map((w) => w[0]).join("")}
                    <img src={avatarUrl(e)} alt="" loading="lazy" onError={(ev) => (ev.currentTarget.style.display = "none")} />
                  </span>
                  <div>
                    <b>{e.name}</b>
                    <span className="title">{e.title}</span>
                    <p>{e.brief}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}

        <button className="btn big" type="button" disabled={!ready || busy !== ""} onClick={buildIdeas}>
          {busy === "ideas" && <span className="spin" />}
          {busy === "ideas" ? "The team is brainstorming…" : ideas.length ? "Start over with 3 new ideas" : "Start building →"}
        </button>
        {!ready && <p className="muted small center">Select {missing.join(", ")} to start.</p>}
        {error && !ideas.length && <div className="error">{error}</div>}
      </section>

      {/* 5. Ideas */}
      {ideas.length > 0 && (
        <section className="panel" id="ideas">
          <StepTitle n={5} title="Three ideas from your team" hint="Edit anything — the copy flows straight into the posters" />
          <div className="ideas">
            {ideas.map((idea, i) => (
              <article className="idea" key={i}>
                <div className="idea-top">
                  <span className="idea-no">Idea {i + 1}</span>
                  <h3>{idea.title}</h3>
                  <div className="chips">
                    {idea.appeals?.map((a) => (
                      <span className="chip" key={a}>
                        {a}
                      </span>
                    ))}
                  </div>
                </div>
                <p className="insight">
                  <b>Insight:</b> {idea.insight}
                </p>
                <p className="insight">
                  <b>Big idea:</b> {idea.bigIdea}
                </p>
                <label>Headline</label>
                <textarea rows={2} className="headline-input" value={idea.headline} onChange={(e) => editIdea(i, "headline", e.target.value)} />
                <label>Subhead</label>
                <textarea rows={2} value={idea.subhead} onChange={(e) => editIdea(i, "subhead", e.target.value)} />
                <label>Body copy</label>
                <textarea rows={2} value={idea.body} onChange={(e) => editIdea(i, "body", e.target.value)} />
                <div className="form-grid">
                  <div>
                    <label>CTA</label>
                    <input value={idea.cta} onChange={(e) => editIdea(i, "cta", e.target.value)} />
                  </div>
                  <div>
                    <label>Tagline</label>
                    <input value={idea.tagline} onChange={(e) => editIdea(i, "tagline", e.target.value)} />
                  </div>
                </div>
                <label>Post copy (social caption)</label>
                <textarea rows={7} value={idea.postCopy ?? ""} onChange={(e) => editIdea(i, "postCopy", e.target.value)} />
                <label>Visual concept</label>
                <textarea rows={3} value={idea.visualConcept} onChange={(e) => editIdea(i, "visualConcept", e.target.value)} />
                {idea.doubleMeaning && (
                  <p className="insight">
                    <b>Double meaning:</b> {idea.doubleMeaning}
                  </p>
                )}
                <p className="muted small">
                  <b>Why it works:</b> {idea.rationale}
                </p>
                {idea.cdNote && (
                  <p className="cd-note">
                    <b>Creative Director:</b> {idea.cdNote}
                  </p>
                )}
              </article>
            ))}
          </div>
          <button className="btn big" type="button" disabled={busy !== ""} onClick={buildVisuals}>
            {busy === "visuals" && <span className="spin" />}
            {busy === "visuals"
              ? "Art director & photographer are planning the shoot…"
              : visuals.length
                ? "Rewrite the visual prompts"
                : "Plan the shoot: write 3 visual prompts →"}
          </button>
          {error && !visuals.length && <div className="error">{error}</div>}
        </section>
      )}

      {/* 6. Visual prompts */}
      {visuals.length > 0 && (
        <section className="panel" id="visuals">
          <StepTitle n={6} title="Shoot briefs" hint="Three different styles. Fine-tune before shooting." />
          <div className="ideas">
            {visuals.map((v, i) => (
              <article className="idea" key={i}>
                <span className="idea-no">For idea {i + 1}</span>
                <h3>{v.styleName}</h3>
                <p className="muted small">{v.styleNote}</p>
                {v.artDirection && (
                  <details className="spec">
                    <summary>Art director&apos;s layout spec</summary>
                    <p>{v.artDirection}</p>
                  </details>
                )}
                <label>Image prompt</label>
                <textarea
                  rows={12}
                  value={v.prompt}
                  onChange={(e) => setVisuals((all) => all.map((x, n) => (n === i ? { ...x, prompt: e.target.value } : x)))}
                />
              </article>
            ))}
          </div>
          <button className="btn big" type="button" onClick={generateAll} disabled={posters.some((p) => p.loading)}>
            {posters.some((p) => p.loading) ? "Shooting…" : posters.some((p) => p.src) ? "Reshoot all 3 posters" : "Shoot the 3 posters →"}
          </button>
          <p className="muted small center">
            {config && (
              <>
                {config.model}, {effectiveQuality} quality ·{" "}
                {perImage !== null ? `about ${usd(perImage)} per image, ${usd(perImage * visuals.length)} for all ${visuals.length}` : "cost unknown for this model, using low quality"}{" "}
                · budget {usd(config.maxCost)} per image.{" "}
              </>
            )}
            Each poster takes about 30–90 seconds.
          </p>
        </section>
      )}

      {/* 7. Posters */}
      {posters.some((p) => p.src || p.loading || p.error) && (
        <section className="panel" id="posters">
          <div className="posters-head">
            <StepTitle n={7} title="Your posters" hint="Adjust the layout, then download" />
            <button className="btn" type="button" onClick={downloadAll} disabled={downloading || !posters.some((p) => p.src)}>
              {downloading && <span className="spin" />}
              {downloading ? "Downloading…" : `Download all (${posters.filter((p) => p.src).length} images + post copy)`}
            </button>
          </div>
          <div className="posters">
            {posters.map((p, i) => (
              <article className="poster-card" key={i}>
                <div className="poster-head">
                  <b>
                    Idea {i + 1}: {ideas[i]?.title}
                  </b>
                  <span className="muted small">
                    {visuals[i]?.styleName}
                    {p.quality && ` · ${p.quality} quality${p.cost != null ? ` · ~${usd(p.cost)}` : ""}`}
                  </span>
                </div>
                {p.src ? (
                  <PosterCanvas
                    src={p.src}
                    copy={{
                      headline: ideas[i]?.headline ?? "",
                      subhead: ideas[i]?.subhead ?? "",
                      body: ideas[i]?.body ?? "",
                      cta: ideas[i]?.cta ?? "",
                      tagline: ideas[i]?.tagline ?? "",
                    }}
                    layout={p.layout}
                    showText={p.showText}
                    logo={brand?.logo}
                    filename={`${fileBase}-ad-${i + 1}.jpg`}
                    onCanvas={canvasSetters[i]}
                  />
                ) : (
                  <div className={`placeholder ${orientation}`}>
                    {p.loading ? (
                      <span className="center-col">
                        <span className="spin" /> Shooting…
                      </span>
                    ) : p.error ? (
                      <span className="error">{p.error}</span>
                    ) : (
                      "Not shot yet"
                    )}
                  </div>
                )}

                <div className="poster-controls">
                  <label className="check">
                    <input type="checkbox" checked={p.showText} onChange={(e) => updatePoster(i, { showText: e.target.checked })} />
                    Typeset copy
                  </label>
                  <select
                    value={p.layout.panel === false ? "over" : "panel"}
                    onChange={(e) => updatePoster(i, { layout: { ...p.layout, panel: e.target.value === "panel" } })}
                  >
                    <option value="panel">Copy panel</option>
                    <option value="over">Copy over image</option>
                  </select>
                  <select
                    value={p.layout.logoStyle ?? "auto"}
                    title="How the logo is placed"
                    onChange={(e) => updatePoster(i, { layout: { ...p.layout, logoStyle: e.target.value as Layout["logoStyle"] } })}
                  >
                    <option value="auto">Logo: auto</option>
                    <option value="original">Logo: transparent</option>
                    <option value="white">Logo: white</option>
                    <option value="black">Logo: black</option>
                    <option value="badge">Logo: on badge</option>
                  </select>
                  <select value={p.layout.position} onChange={(e) => updatePoster(i, { layout: { ...p.layout, position: e.target.value as Layout["position"] } })}>
                    {["top", "bottom", "left", "right", "center"].map((pos) => (
                      <option key={pos} value={pos}>
                        Text {pos}
                      </option>
                    ))}
                  </select>
                  <select value={p.layout.tone} onChange={(e) => updatePoster(i, { layout: { ...p.layout, tone: e.target.value as Layout["tone"] } })}>
                    <option value="light">White text</option>
                    <option value="dark">Black text</option>
                  </select>
                  <select value={p.layout.font} onChange={(e) => updatePoster(i, { layout: { ...p.layout, font: e.target.value as Layout["font"] } })}>
                    <option value="serif">Serif</option>
                    <option value="sans">Sans</option>
                    <option value="condensed">Condensed</option>
                  </select>
                  <input
                    type="color"
                    value={p.layout.accent}
                    title="CTA colour"
                    onChange={(e) => updatePoster(i, { layout: { ...p.layout, accent: e.target.value } })}
                  />
                  <button className="btn ghost small" type="button" disabled={p.loading} onClick={() => generate(i)}>
                    {p.src ? "Reshoot" : "Shoot"}
                  </button>
                </div>

                <div className="post-copy">
                  <div className="post-copy-head">
                    <b>Post copy</b>
                    <button className="link small" type="button" onClick={() => navigator.clipboard?.writeText(postCopyText(ideas[i]))}>
                      Copy
                    </button>
                  </div>
                  <textarea rows={8} value={ideas[i]?.postCopy ?? ""} onChange={(e) => editIdea(i, "postCopy", e.target.value)} />
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function StepTitle({ n, title, hint }: { n: number; title: string; hint: string }) {
  return (
    <div className="step-title">
      <span className="step-no">{n}</span>
      <div>
        <h3>{title}</h3>
        <p className="muted small">{hint}</p>
      </div>
    </div>
  );
}
