"use client";
// Lightweight SVG chart kit — brand colors, hover tooltips, no dependencies.
import { useState } from "react";

export const CHART_COLORS = {
  maroon: "#8c2429",
  gold: "#c9a24b",
  peri: "#7f9cd4",
  green: "#2f7d46",
  red: "#b3261e",
  slate: "#6b7280",
  periLight: "#a9bbea",
};

function niceMax(v) {
  if (v <= 0) return 100;
  const mag = Math.pow(10, Math.floor(Math.log10(v)));
  const n = v / mag;
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
  return step * mag;
}

export function Sparkline({ values = [], color = CHART_COLORS.maroon, width = 130, height = 40 }) {
  if (values.length < 2) values = [0, 0];
  const max = Math.max(...values, 1);
  const pts = values.map((v, i) => [
    (i / (values.length - 1)) * (width - 4) + 2,
    height - 4 - (v / max) * (height - 10),
  ]);
  const path = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const area = `${path} L${pts[pts.length - 1][0].toFixed(1)},${height} L${pts[0][0].toFixed(1)},${height} Z`;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: "block", width: "100%" }}>
      <path d={area} fill={color} opacity="0.14" />
      <path d={path} fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="3" fill={color} />
    </svg>
  );
}

export function AreaChart({ data = [], height = 240, color = CHART_COLORS.maroon, unit = "" }) {
  const [hover, setHover] = useState(null);
  const W = 640, H = 260, L = 58, R = 16, T = 16, B = 34;
  const iw = W - L - R, ih = H - T - B;
  const max = niceMax(Math.max(...data.map((d) => d.value), 1));
  const x = (i) => L + (data.length === 1 ? iw / 2 : (i / (data.length - 1)) * iw);
  const y = (v) => T + ih - (v / max) * ih;
  const line = data.map((d, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(d.value).toFixed(1)}`).join(" ");
  const area = `${line} L${x(data.length - 1).toFixed(1)},${T + ih} L${x(0).toFixed(1)},${T + ih} Z`;
  const grid = [0.25, 0.5, 0.75, 1];

  return (
    <div style={{ position: "relative" }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={height} role="img" aria-label="Trend chart">
        <defs>
          <linearGradient id="areafill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.28" />
            <stop offset="100%" stopColor={color} stopOpacity="0.03" />
          </linearGradient>
        </defs>
        {grid.map((g) => (
          <g key={g}>
            <line x1={L} x2={W - R} y1={y(max * g)} y2={y(max * g)} stroke="#e7e2e4" strokeWidth="1" />
            <text x={L - 8} y={y(max * g) + 4} textAnchor="end" fontSize="11" fill="#8a7f83">{compact(max * g)}</text>
          </g>
        ))}
        <path d={area} fill="url(#areafill)" />
        <path d={line} fill="none" stroke={color} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
        {data.map((d, i) => {
          const gw = data.length > 1 ? iw / (data.length - 1) : iw;
          return (
            <g key={i}>
              <rect
                x={L + (i - 0.5) * gw}
                y={T}
                width={gw}
                height={ih}
                fill={hover === i ? "rgba(140,36,41,0.06)" : "transparent"}
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
                style={{ cursor: "pointer" }}
              />
              <circle cx={x(i)} cy={y(d.value)} r={hover === i ? 5 : 3} fill={hover === i ? color : "#fff"} stroke={color} strokeWidth="2" />
              <text x={x(i)} y={H - 12} textAnchor="middle" fontSize="11" fill="#8a7f83">{d.label}</text>
            </g>
          );
        })}
      </svg>
      {hover !== null && data[hover] && (
        <div style={{ position: "absolute", top: 8, left: 8, background: "#fff", border: "1px solid var(--line)", borderRadius: 10, padding: "0.4rem 0.7rem", boxShadow: "var(--shadow)", pointerEvents: "none", zIndex: 2 }}>
          <b className="small">{data[hover].label}</b>
          <div className="small">{data[hover].sub || ""}{" "}<b style={{ color }}>{compact(data[hover].value)}</b>{unit}</div>
        </div>
      )}
    </div>
  );
}

export function GroupedBars({ labels = [], series = [], height = 250 }) {
  const [hover, setHover] = useState(null);
  const W = 640, H = 260, L = 58, R = 16, T = 16, B = 34;
  const iw = W - L - R, ih = H - T - B;
  const max = niceMax(Math.max(...series.flatMap((s) => s.values), 1));
  const groupW = iw / Math.max(labels.length, 1);
  const barW = Math.min(26, (groupW * 0.72) / Math.max(series.length, 1));
  const y = (v) => T + ih - (v / max) * ih;

  return (
    <div style={{ position: "relative" }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={height} role="img" aria-label="Grouped bar chart">
        {[0.25, 0.5, 0.75, 1].map((g) => (
          <g key={g}>
            <line x1={L} x2={W - R} y1={y(max * g)} y2={y(max * g)} stroke="#e7e2e4" strokeWidth="1" />
            <text x={L - 8} y={y(max * g) + 4} textAnchor="end" fontSize="11" fill="#8a7f83">{compact(max * g)}</text>
          </g>
        ))}
        {labels.map((lab, i) => {
          const gx = L + i * groupW + groupW / 2;
          const total = series.reduce((s, s2) => s + (s2.values[i] || 0), 0);
          return (
            <g key={i}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              style={{ cursor: "pointer" }}
            >
              <rect x={L + i * groupW} y={T} width={groupW} height={ih} fill={hover === i ? "rgba(140,36,41,0.05)" : "transparent"} />
              {series.map((s, si) => {
                const v = s.values[i] || 0;
                if (v <= 0) return null;
                const bx = gx - (barW * series.length) / 2 + si * (barW + 2);
                return (
                  <g key={si}>
                    <rect x={bx} y={y(v)} width={barW} height={Math.max(1, T + ih - y(v))} rx="4" fill={s.color} opacity={hover === i ? 1 : 0.85} />
                  </g>
                );
              })}
              <text x={gx} y={H - 12} textAnchor="middle" fontSize="11" fill="#8a7f83">{lab}</text>
              {total > 0 && <text x={gx} y={y(Math.max(...series.map((s) => s.values[i] || 0))) - 6} textAnchor="middle" fontSize="10" fontWeight="700" fill="#5c5257">{compact(total)}</text>}
            </g>
          );
        })}
      </svg>
      <div className="row" style={{ gap: "1rem", justifyContent: "center", marginTop: "0.4rem", flexWrap: "wrap" }}>
        {series.map((s) => (
          <span key={s.name} className="small" style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: s.color, display: "inline-block" }} /> {s.name}
          </span>
        ))}
      </div>
    </div>
  );
}

export function Donut({ segments = [], size = 190, thickness = 26, centerTitle = "", centerValue = "" }) {
  const [hover, setHover] = useState(null);
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  const R = (size - thickness) / 2;
  const C = 2 * Math.PI * R;
  let acc = 0;
  const active = hover !== null ? segments[hover] : null;

  return (
    <div className="row" style={{ gap: "1.4rem", alignItems: "center", flexWrap: "wrap", justifyContent: "center" }}>
      <div style={{ position: "relative", width: size, height: size, flex: "none" }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Distribution donut">
          <circle cx={size / 2} cy={size / 2} r={R} fill="none" stroke="#efe9ea" strokeWidth={thickness} />
          {segments.map((s, i) => {
            const frac = s.value / total;
            const dash = `${Math.max(0, frac * C - 2)} ${C}`;
            const el = (
              <circle
                key={i}
                cx={size / 2} cy={size / 2} r={R}
                fill="none"
                stroke={s.color}
                strokeWidth={hover === i ? thickness + 5 : thickness}
                strokeDasharray={dash}
                strokeDashoffset={-acc * C}
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
                strokeLinecap="butt"
                opacity={hover === null || hover === i ? 1 : 0.35}
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
                style={{ cursor: "pointer", transition: "stroke-width .15s, opacity .15s" }}
              />
            );
            acc += frac;
            return el;
          })}
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", textAlign: "center", pointerEvents: "none" }}>
          <div>
            <div className="small muted">{active ? active.label : centerTitle}</div>
            <div style={{ fontWeight: 800, fontSize: "1.05rem", lineHeight: 1.15 }}>{active ? compact(active.value) : centerValue}</div>
            {active && <div className="small" style={{ color: active.color }}>{Math.round((active.value / total) * 100)}%</div>}
          </div>
        </div>
      </div>
      <div style={{ display: "grid", gap: "0.45rem", minWidth: 170 }}>
        {segments.map((s, i) => (
          <div
            key={s.label}
            className="small row"
            style={{ gap: "0.5rem", opacity: hover === null || hover === i ? 1 : 0.45, cursor: "pointer" }}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
          >
            <span style={{ width: 11, height: 11, borderRadius: 3, background: s.color, flex: "none" }} />
            <span style={{ flex: 1 }}>{s.label}</span>
            <b>{compact(s.value)}</b>
            <span className="muted">{Math.round((s.value / total) * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function HBarList({ items = [], unit = "" }) {
  const max = Math.max(...items.map((i) => i.value), 1);
  return (
    <div style={{ display: "grid", gap: "0.8rem" }}>
      {items.map((it) => (
        <div key={it.label}>
          <div className="spread small" style={{ marginBottom: "0.25rem" }}>
            <span><b>{it.label}</b>{it.sub ? <span className="muted"> · {it.sub}</span> : null}</span>
            <span><b style={{ color: it.tone || "var(--maroon)" }}>{compact(it.value)}</b>{unit}{it.extra ? <span className="muted"> {it.extra}</span> : null}</span>
          </div>
          <div style={{ height: 10, borderRadius: 99, background: "#f0eaec", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${Math.min(100, (it.value / max) * 100)}%`, borderRadius: 99, background: it.bar || CHART_COLORS.maroon, opacity: 0.9 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function compact(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(0) + "k";
  return String(Math.round(n));
}
