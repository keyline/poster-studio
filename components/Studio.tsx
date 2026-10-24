"use client";

import { useState } from "react";
import { APPEALS } from "@/lib/appeals";
import { api } from "@/lib/client";
import { EXPERTS, ROLES, avatarUrl } from "@/lib/experts";
import type { Brand, Idea, Layout, Team, TextMode, Visual } from "@/lib/types";
import PosterCanvas from "./PosterCanvas";

type Poster = { src?: string; loading?: boolean; error?: string; layout: Layout; showText: boolean };

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
  const [quality, setQuality] = useState("high");
  const [textMode, setTextMode] = useState<TextMode>("overlay");

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
      const { ideas } = await api<{ ideas: Idea[] }>("/api/ideas", { brandId, brief, appeals, team, orientation });
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
      const { visuals } = await api<{ visuals: Visual[] }>("/api/visuals", { brandId, ideas, team, orientation, textMode });
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
      const { image } = await api<{ image: string }>("/api/poster", { prompt: visuals[i].prompt, orientation, quality });
      updatePoster(i, { src: image, loading: false });
    } catch (e) {
      updatePoster(i, { error: (e as Error).message, loading: false });
    }
  }

  function generateAll() {
    visuals.forEach((_, i) => generate(i));
    setTimeout(() => document.getElementById("posters")?.scrollIntoView({ behavior: "smooth" }), 50);
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
            <select value={quality} onChange={(e) => setQuality(e.target.value)}>
              <option value="high">High (best realism)</option>
              <option value="medium">Medium</option>
              <option value="low">Low (quick drafts)</option>
            </select>
          </div>
          <div>
            <label>Typography</label>
            <select value={textMode} onChange={(e) => setTextMode(e.target.value as TextMode)}>
              <option value="overlay">Typeset by the art director (most real)</option>
              <option value="ai">Rendered inside the AI image</option>
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
                <label>Visual concept</label>
                <textarea rows={3} value={idea.visualConcept} onChange={(e) => editIdea(i, "visualConcept", e.target.value)} />
                <p className="muted small">
                  <b>Why it works:</b> {idea.rationale}
                </p>
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
          <p className="muted small center">Each poster takes about 30–90 seconds. High quality uses more OpenAI credits.</p>
        </section>
      )}

      {/* 7. Posters */}
      {posters.some((p) => p.src || p.loading || p.error) && (
        <section className="panel" id="posters">
          <StepTitle n={7} title="Your posters" hint="Adjust the layout, then download" />
          <div className="posters">
            {posters.map((p, i) => (
              <article className="poster-card" key={i}>
                <div className="poster-head">
                  <b>
                    Idea {i + 1}: {ideas[i]?.title}
                  </b>
                  <span className="muted small">{visuals[i]?.styleName}</span>
                </div>
                {p.src ? (
                  <PosterCanvas
                    src={p.src}
                    copy={{ headline: ideas[i]?.headline ?? "", subhead: ideas[i]?.subhead ?? "", cta: ideas[i]?.cta ?? "" }}
                    layout={p.layout}
                    showText={p.showText}
                    logo={brand?.logo}
                    filename={`${brand?.name ?? "poster"}-idea-${i + 1}.jpg`.replace(/\s+/g, "-")}
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
