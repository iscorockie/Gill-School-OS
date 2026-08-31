"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export const fmtUGX = (n) => "UGX " + (n || 0).toLocaleString("en-UG", { maximumFractionDigits: 0 });
export const fmtDate = (iso) => {
  if (!iso) return "—";
  if (iso.includes("T")) return new Date(iso).toLocaleDateString("en-UG", { day: "numeric", month: "short", year: "numeric" });
  return new Date(iso + "T00:00:00").toLocaleDateString("en-UG", { day: "numeric", month: "short", year: "numeric" });
};

const AppCtx = createContext(null);

export function AppProvider({ children }) {
  const [db, setDb] = useState(null);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/state", { cache: "no-store" });
      const d = await r.json();
      setDb(d);
      setError(null);
    } catch (e) {
      setError("Could not reach the platform data service.");
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const act = useCallback(async (type, payload, successMsg) => {
    const r = await fetch("/api/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, payload }),
    });
    const j = await r.json();
    if (!j.ok) throw new Error(j.error || "Action failed");
    setDb(j.db);
    if (successMsg) setToast(successMsg);
    setTimeout(() => setToast(null), 4200);
    return j.result;
  }, []);

  const value = useMemo(() => ({ db, error, toast, act, load }), [db, error, toast, act, load]);
  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

export function useApp() {
  return useContext(AppCtx);
}

export function Toast() {
  const { toast } = useApp();
  if (!toast) return null;
  return <div className="toast">✅ {toast}</div>;
}

export function Badge({ tone = "gray", children }) {
  return <span className={`badge ${tone}`}>{children}</span>;
}

export function Stat({ label, value, sub, tone }) {
  return (
    <div className="card stat">
      <span className="stat-label">{label}</span>
      <span className="stat-value" style={tone === "gold" ? { color: "#a5781a" } : tone === "red" ? { color: "var(--red)" } : tone === "blue" ? { color: "var(--blue)" } : undefined}>{value}</span>
      {sub ? <span className="small muted">{sub}</span> : null}
    </div>
  );
}

export function Modal({ title, onClose, children }) {
  return (
    <div className="modal-back" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="spread" style={{ marginBottom: "0.4rem" }}>
          <h3>{title}</h3>
          <button className="btn ghost sm" onClick={onClose}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Field({ label, children }) {
  return (
    <label style={{ display: "block", marginBottom: "0.85rem" }}>
      <span className="small" style={{ fontWeight: 700, display: "block", marginBottom: "0.3rem" }}>{label}</span>
      {children}
    </label>
  );
}

export function Empty({ children }) {
  return <div className="card" style={{ textAlign: "center", color: "var(--muted)", padding: "2rem" }}>{children || "Nothing here yet."}</div>;
}

export function Progress({ pct, gold }) {
  return <div className={`progress ${gold ? "gold" : ""}`}><div style={{ width: `${Math.max(2, Math.min(100, pct))}%` }} /></div>;
}

export function Tabs({ tabs, active, onChange }) {
  return (
    <div className="tabs">
      {tabs.map((t) => (
        <button key={t.id} className={active === t.id ? "on" : ""} onClick={() => onChange(t.id)}>{t.label}</button>
      ))}
    </div>
  );
}
