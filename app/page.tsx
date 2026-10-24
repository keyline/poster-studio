"use client";

import { useEffect, useState } from "react";
import { EXPERTS } from "@/lib/experts";

type Poster = { id: string; src?: string; error?: string; expert: string; orientation: string };

const PASSWORD_KEY = "poster-studio-password";

export default function Home() {
  const [expertId, setExpertId] = useState(EXPERTS[0].id);
  const [brief, setBrief] = useState({
    headline: "",
    details: "",
    audience: "",
    style: "",
    colors: "",
    notes: "",
  });
  const [orientation, setOrientation] = useState("portrait");
  const [quality, setQuality] = useState("medium");
  const [count, setCount] = useState(2);

  const [prompt, setPrompt] = useState("");
  const [writing, setWriting] = useState(false);
  const [posters, setPosters] = useState<Poster[]>([]);
  const [error, setError] = useState("");

  const [password, setPassword] = useState("");
  const [needsPassword, setNeedsPassword] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(PASSWORD_KEY);
      if (saved) setPassword(saved);
    } catch {}
  }, []);

  function savePassword(value: string) {
    setPassword(value);
    try {
      localStorage.setItem(PASSWORD_KEY, value);
    } catch {}
  }

  async function api<T>(path: string, body: unknown): Promise<T> {
    const res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-app-password": password },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({ error: `Request failed (${res.status})` }));
    if (res.status === 401) setNeedsPassword(true);
    if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
    return data as T;
  }

  async function writePrompt() {
    setError("");
    setWriting(true);
    try {
      const { prompt } = await api<{ prompt: string }>("/api/prompt", { expertId, orientation, ...brief });
      setPrompt(prompt);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setWriting(false);
    }
  }

  async function generate() {
    setError("");
    const expert = EXPERTS.find((e) => e.id === expertId)!.name;
    const batch: Poster[] = Array.from({ length: count }, () => ({
      id: crypto.randomUUID(),
      expert,
      orientation,
    }));
    setPosters((p) => [...batch, ...p]);

    await Promise.all(
      batch.map(async (poster) => {
        let update: Partial<Poster>;
        try {
          const { image } = await api<{ image: string }>("/api/poster", { prompt, orientation, quality });
          update = { src: image };
        } catch (e) {
          update = { error: (e as Error).message };
        }
        setPosters((all) => all.map((p) => (p.id === poster.id ? { ...p, ...update } : p)));
      }),
    );
  }

  const generating = posters.some((p) => !p.src && !p.error);
  const field = (key: keyof typeof brief) => ({
    value: brief[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setBrief({ ...brief, [key]: e.target.value }),
  });

  return (
    <main className="wrap">
      <header className="top">
        <h1>
          Poster <span>Studio</span>
        </h1>
        <p>Pick an expert → get a detailed prompt → generate posters.</p>
      </header>

      <div className="grid">
        <section>
          <div className="panel">
            <h2 className="step">
              <b>1</b> Choose your expert
            </h2>
            <div className="experts">
              {EXPERTS.map((e) => (
                <button
                  key={e.id}
                  className={`expert ${e.id === expertId ? "on" : ""}`}
                  onClick={() => setExpertId(e.id)}
                  type="button"
                >
                  <div className="n">
                    {e.emoji} {e.name}
                  </div>
                  <div className="t">{e.tagline}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="panel">
            <h2 className="step">
              <b>2</b> Describe the poster
            </h2>
            <label>Headline / main text *</label>
            <input placeholder="e.g. Summer Music Fest 2026" {...field("headline")} />
            <label>
              Details <small>(date, venue, offer, contact…)</small>
            </label>
            <textarea rows={2} placeholder="e.g. 14 June, Eco Park, Kolkata · Tickets at fest.in" {...field("details")} />
            <label>Target audience</label>
            <input placeholder="e.g. college students, 18–25" {...field("audience")} />
            <label>Style / mood</label>
            <input placeholder="e.g. retro neon, vibrant, festive" {...field("style")} />
            <label>Brand colors</label>
            <input placeholder="e.g. #E8552D orange and deep navy" {...field("colors")} />
            <label>Extra notes</label>
            <textarea rows={2} placeholder="Anything else: logo position, things to avoid…" {...field("notes")} />

            <div className="row">
              <div>
                <label>Format</label>
                <select value={orientation} onChange={(e) => setOrientation(e.target.value)}>
                  <option value="portrait">Portrait</option>
                  <option value="square">Square</option>
                  <option value="landscape">Landscape</option>
                </select>
              </div>
              <div>
                <label>Quality</label>
                <select value={quality} onChange={(e) => setQuality(e.target.value)}>
                  <option value="low">Low (fast)</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div>
                <label>Variations</label>
                <select value={count} onChange={(e) => setCount(Number(e.target.value))}>
                  {[1, 2, 3, 4].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {needsPassword && (
              <>
                <label>Team password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => savePassword(e.target.value)}
                  placeholder="Ask your admin"
                />
              </>
            )}

            <button className="btn" onClick={writePrompt} disabled={writing || !brief.headline.trim()}>
              {writing && <span className="spin" />}
              {writing ? "Writing prompt…" : prompt ? "Rewrite prompt" : "Write detailed prompt"}
            </button>
            {error && <div className="error">{error}</div>}
          </div>
        </section>

        <section>
          <div className="panel">
            <h2 className="step">
              <b>3</b> Review the prompt
            </h2>
            <textarea
              className="prompt-box"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Your expert-written prompt will appear here. You can edit it before generating."
            />
            <div className="actions">
              <button
                className="btn ghost"
                type="button"
                disabled={!prompt}
                onClick={() => navigator.clipboard?.writeText(prompt)}
              >
                Copy prompt
              </button>
            </div>
            <button className="btn" onClick={generate} disabled={!prompt.trim() || generating}>
              {generating && <span className="spin" />}
              {generating ? "Generating posters…" : `Generate ${count} poster${count > 1 ? "s" : ""}`}
            </button>
            <p className="hint">Posters usually take 20–60 seconds. Higher quality costs more OpenAI credits.</p>
          </div>

          <div className="panel">
            <h2 className="step">
              <b>4</b> Your posters
            </h2>
            {posters.length === 0 ? (
              <div className="empty">Generated posters will show up here.</div>
            ) : (
              <div className="gallery">
                {posters.map((p, i) => (
                  <div className="card" key={p.id}>
                    {p.src ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.src} alt={`Poster by ${p.expert}`} />
                    ) : (
                      <div className={`placeholder ${p.orientation}`}>
                        {p.error ? <span className="error">{p.error}</span> : <span className="spin" />}
                      </div>
                    )}
                    <div className="meta">
                      <span>{p.expert}</span>
                      {p.src && (
                        <a href={p.src} download={`poster-${posters.length - i}.jpg`}>
                          Download
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
