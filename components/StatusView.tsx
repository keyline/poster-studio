"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/client";

type Check = { name: string; ok: boolean; detail: string; fix?: string };

export default function StatusView() {
  const [checks, setChecks] = useState<Check[] | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function run() {
    setBusy(true);
    setError("");
    try {
      setChecks((await api<{ checks: Check[] }>("/api/status")).checks);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    run();
  }, []);

  const allOk = checks?.every((c) => c.ok);

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>System status</h1>
          <p className="muted">Checks the OpenAI key, credit, image model and team storage.</p>
        </div>
        <button className="btn ghost" type="button" onClick={run} disabled={busy}>
          {busy && <span className="spin" />}
          {busy ? "Checking…" : "Check again"}
        </button>
      </div>
      {error && <div className="panel error">{error}</div>}
      {!checks && !error && (
        <div className="panel empty">
          <span className="spin" />
        </div>
      )}
      {checks && (
        <div className="panel">
          <p className={`status-summary ${allOk ? "ok" : ""}`}>
            {allOk ? "Everything is connected. You're ready to make posters." : "Something needs attention — see below."}
          </p>
          <ul className="checks">
            {checks.map((c) => (
              <li key={c.name} className={c.ok ? "ok" : "bad"}>
                <span className="dot">{c.ok ? "✓" : "!"}</span>
                <div>
                  <b>{c.name}</b>
                  <p>{c.detail}</p>
                  {c.fix && (
                    <p className="fix">
                      <b>How to fix:</b> {c.fix}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
