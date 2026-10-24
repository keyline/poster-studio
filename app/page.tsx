"use client";

import { useCallback, useEffect, useState } from "react";
import BrandForm from "@/components/BrandForm";
import BrandView from "@/components/BrandView";
import Studio from "@/components/Studio";
import { loadBrands, moveBrowserBrandsToShared, type StorageMode } from "@/lib/brandStore";
import { api, getPassword, onAuthNeeded, setPassword } from "@/lib/client";
import type { Brand } from "@/lib/types";

type View =
  | { name: "brands" }
  | { name: "new" }
  | { name: "edit"; id: string }
  | { name: "brand"; id: string }
  | { name: "studio" };

export default function Home() {
  const [view, setView] = useState<View>({ name: "brands" });
  const [brands, setBrands] = useState<Brand[]>([]);
  const [mode, setMode] = useState<StorageMode>("shared");
  const [openaiReady, setOpenaiReady] = useState(true);
  const [warning, setWarning] = useState<string>();
  const [leftInBrowser, setLeftInBrowser] = useState<Brand[]>([]);
  const [moving, setMoving] = useState(false);
  const [moveError, setMoveError] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [studioBrandId, setStudioBrandId] = useState("");
  const [askPassword, setAskPassword] = useState(false);
  const [pw, setPw] = useState("");

  const load = useCallback(async () => {
    try {
      const data = await loadBrands();
      setBrands(data.brands);
      setMode(data.mode);
      setLeftInBrowser(data.leftInBrowser);
      setLoadError("");
      api<{ openaiConfigured: boolean }>("/api/config").then((c) => setOpenaiReady(c.openaiConfigured), () => {});
    } catch (e) {
      setLoadError((e as Error).message);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    onAuthNeeded(() => setAskPassword(true));
    setPw(getPassword());
    load();
  }, [load]);

  const upsert = (b: Brand) => setBrands((all) => [b, ...all.filter((x) => x.id !== b.id)]);
  const current = "id" in view ? brands.find((b) => b.id === view.id) : undefined;

  function openStudio(brandId?: string) {
    if (brandId) setStudioBrandId(brandId);
    else if (!studioBrandId && brands[0]) setStudioBrandId(brands[0].id);
    setView({ name: "studio" });
    window.scrollTo({ top: 0 });
  }

  return (
    <main>
      <header className="topbar">
        <div className="wrap topbar-inner">
          <div className="logo">
            Poster<span>Studio</span>
            <small>your creative agency</small>
          </div>
          <nav>
            <button className={view.name !== "studio" ? "on" : ""} onClick={() => setView({ name: "brands" })} type="button">
              Brands
            </button>
            <button className={view.name === "studio" ? "on" : ""} onClick={() => openStudio()} type="button">
              Create poster
            </button>
          </nav>
        </div>
      </header>

      <div className="wrap">
        {!openaiReady && (
          <div className="banner error-banner">
            <b>OpenAI is not connected.</b> In Vercel open your project → <b>Settings → Environment Variables</b>, add{" "}
            <code>OPENAI_API_KEY</code> with your key from platform.openai.com/api-keys, then <b>Deployments → ⋯ → Redeploy</b>. Until
            then the brand study, ideas and posters cannot run.
          </div>
        )}
        {leftInBrowser.length > 0 && (
          <div className="banner ok-banner">
            <span>
              Team storage is connected. {leftInBrowser.length} brand{leftInBrowser.length > 1 ? "s are" : " is"} still saved only in
              this browser ({leftInBrowser.map((b) => b.name).join(", ")}).
            </span>
            <button
              className="btn small"
              type="button"
              disabled={moving}
              onClick={async () => {
                setMoving(true);
                setMoveError("");
                try {
                  const moved = await moveBrowserBrandsToShared(leftInBrowser);
                  setBrands((all) => [...moved, ...all.filter((b) => !moved.some((m) => m.id === b.id))]);
                  setLeftInBrowser([]);
                } catch (e) {
                  setMoveError((e as Error).message);
                  load();
                } finally {
                  setMoving(false);
                }
              }}
            >
              {moving && <span className="spin" />}
              {moving ? "Moving…" : "Move them to the team"}
            </button>
            {moveError && <span className="error-text">{moveError}</span>}
          </div>
        )}
        {loaded && mode === "browser" && (
          <div className="banner">
            Brands are saved <b>in this browser</b> only. To share them with your team, connect <b>Upstash for Redis</b> in Vercel →
            Storage, then redeploy.
          </div>
        )}

        {view.name === "brands" && (
          <>
            <div className="page-head">
              <div>
                <h1>Client brands</h1>
                <p className="muted">Every brand the agency knows, with its competitor study. Pick one to create posters.</p>
              </div>
              <button className="btn" type="button" onClick={() => setView({ name: "new" })}>
                + New brand
              </button>
            </div>
            {!loaded ? (
              <div className="panel empty">
                <span className="spin" />
              </div>
            ) : loadError ? (
              <div className="panel empty">
                <div className="error">{loadError}</div>
                <button className="btn ghost" type="button" onClick={load}>
                  Retry
                </button>
              </div>
            ) : brands.length === 0 ? (
              <div className="panel empty">
                <h3>No brands yet</h3>
                <p className="muted">Add a client: details, website, social pages or screenshots, PDFs. We&apos;ll study the brand and its competitors.</p>
                <button className="btn" type="button" onClick={() => setView({ name: "new" })}>
                  Add your first brand
                </button>
              </div>
            ) : (
              <div className="brand-grid">
                {brands.map((b) => (
                  <button key={b.id} type="button" className="brand-card" onClick={() => setView({ name: "brand", id: b.id })}>
                    {b.logo ? <img src={b.logo} alt="" className="logo-md" /> : <div className="logo-md mono">{b.name[0]}</div>}
                    <div>
                      <h3>{b.name}</h3>
                      <p className="muted small">{[b.industry || b.study?.category, b.location].filter(Boolean).join(" · ") || "—"}</p>
                      <span className={`status ${b.study ? "ok" : ""}`}>
                        {b.study ? `Study ready · ${b.study.competitors.length} competitors` : "No study yet"}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {view.name === "new" && (
          <BrandForm
            mode={mode}
            onCancel={() => setView({ name: "brands" })}
            onDone={(b, w) => {
              upsert(b);
              setWarning(w);
              setView({ name: "brand", id: b.id });
            }}
          />
        )}

        {view.name === "edit" && current && (
          <BrandForm
            mode={mode}
            initial={current}
            onCancel={() => setView({ name: "brand", id: current.id })}
            onDone={(b, w) => {
              upsert(b);
              setWarning(w);
              setView({ name: "brand", id: b.id });
            }}
          />
        )}

        {view.name === "brand" && current && (
          <>
            <button className="link back" type="button" onClick={() => setView({ name: "brands" })}>
              ← All brands
            </button>
            <BrandView
              key={current.id + (warning ?? "")}
              brand={current}
              mode={mode}
              warning={warning}
              onChange={upsert}
              onEdit={() => {
                setWarning(undefined);
                setView({ name: "edit", id: current.id });
              }}
              onDelete={() => {
                setBrands((all) => all.filter((x) => x.id !== current.id));
                setView({ name: "brands" });
              }}
              onCreatePoster={() => openStudio(current.id)}
            />
          </>
        )}

        {/* Kept mounted so work in progress survives switching tabs. */}
        <div hidden={view.name !== "studio"}>
          <div className="page-head">
            <div>
              <h1>Create poster</h1>
              <p className="muted">Brief → positioning → team → 3 ideas → 3 shoots → posters.</p>
            </div>
          </div>
          <Studio
            brands={brands}
            brandId={studioBrandId}
            setBrandId={setStudioBrandId}
            onNewBrand={() => setView({ name: "new" })}
          />
        </div>
      </div>

      {askPassword && (
        <div className="modal-bg">
          <form
            className="modal"
            onSubmit={(e) => {
              e.preventDefault();
              setPassword(pw);
              setAskPassword(false);
              load();
            }}
          >
            <h3>Team password</h3>
            <p className="muted small">Ask your admin for the Poster Studio password.</p>
            <input type="password" autoFocus value={pw} onChange={(e) => setPw(e.target.value)} />
            <button className="btn" type="submit">
              Continue
            </button>
          </form>
        </div>
      )}
    </main>
  );
}
