"use client";
// Static campus map — drawn in the OS design system (no external tiles, no
// pan/zoom). The two campus pins sit at their real relative position in
// Najjera. Tapping a pin (or its label) opens Google Maps with driving
// directions to that exact landmark — the shortest route for the parent.
import Icon from "./icons.jsx";

export const CAMPUSES = [
  {
    id: "preschool",
    name: "Gill Pre-School",
    short: "Pre-School",
    lat: 0.3762226,
    lng: 32.6244347,
    address: "White Close, Plot 341, Najjera–Kira Municipality",
    landmark: "Opposite Hass Petrol Station",
    plusCode: "6GGJ9JGF+FQ",
    phone: "+256 755 071 456",
    color: "#c9a24b",
    class: "gips",
  },
  {
    id: "main",
    name: "Gill International School",
    short: "Main School",
    lat: 0.384875,
    lng: 32.626375,
    address: "Mbogo Road 1, Najjera, Kampala",
    landmark: "Plus code 9JMG+XH Kampala",
    plusCode: "9JMG+XH Kampala",
    phone: "+256 783 003 231",
    color: "#8c2429",
    class: "main",
  },
];

// Real bearing: Pre-School sits south-west, Main School north-east (~1 km).
const directionsUrl = (c) =>
  `https://www.google.com/maps/dir/?api=1&destination=${c.lat},${c.lng}`;

export default function CampusMap({ height = 430 }) {
  // Percent positions (10% padding so pins + labels never touch the edge).
  const lats = CAMPUSES.map((c) => c.lat);
  const lngs = CAMPUSES.map((c) => c.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const spanLat = maxLat - minLat || 1;
  const spanLng = maxLng - minLng || 1;
  const pad = 0.16;

  const pos = (c) => {
    const x = (pad + ((c.lng - minLng) / spanLng) * (1 - 2 * pad)) * 100;
    const y = (pad + (1 - (c.lat - minLat) / spanLat) * (1 - 2 * pad)) * 100;
    return { x, y };
  };

  const [pre, main] = CAMPUSES;
  const p1 = pos(pre);
  const p2 = pos(main);
  const pct = (v) => `${v.toFixed(2)}%`;

  return (
    <div className="cmap" style={{ minHeight: height }} role="group" aria-label="Static map of the two Gill campuses in Najjera, Kampala">
      <svg className="cmap-svg" viewBox="0 0 1000 560" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        {/* paper */}
        <rect width="1000" height="560" fill="#eef1f7" />
        {/* park + water */}
        <path d="M0 300 Q140 240 260 320 T520 360 L520 560 L0 560 Z" fill="#e3efe4" />
        <path d="M760 420 q60 -34 120 0 t120 14 L1000 560 L720 560 Z" fill="#dcebf5" />
        {/* city blocks */}
        <g fill="#e2e6f0">
          <rect x="60" y="60" width="150" height="90" rx="10" />
          <rect x="300" y="40" width="180" height="80" rx="10" />
          <rect x="560" y="70" width="160" height="80" rx="10" />
          <rect x="800" y="120" width="150" height="90" rx="10" />
          <rect x="80" y="380" width="170" height="90" rx="10" />
          <rect x="330" y="440" width="170" height="80" rx="10" />
          <rect x="620" y="300" width="120" height="70" rx="10" />
        </g>
        {/* Mbogo Road — main spine between the two campuses */}
        <path d="M-40 520 L1040 40" stroke="#fff" strokeWidth="52" />
        <path d="M-40 520 L1040 40" stroke="#d7dbe8" strokeWidth="2" strokeDasharray="14 10" />
        {/* White Close branch to the Pre-School */}
        <path d="M210 424 L560 250 L640 190" stroke="#fff" strokeWidth="30" />
        <path d="M210 424 L560 250 L640 190" stroke="#d7dbe8" strokeWidth="1.6" strokeDasharray="10 8" />
        {/* minor lanes */}
        <g stroke="#fff" strokeWidth="16" fill="none" opacity="0.85">
          <path d="M120 0 L120 560" />
          <path d="M420 0 L420 110" />
          <path d="M880 0 L880 220" />
          <path d="M180 560 L180 300" />
          <path d="M700 560 L700 360" />
        </g>
        {/* road names */}
        <g fill="#6b7484" fontFamily="Inter, system-ui, sans-serif" fontSize="19" fontWeight="600">
          <text x="640" y="128" transform="rotate(27 640 128)">Mbogo Road</text>
          <text x="238" y="446" transform="rotate(-30 238 446)">White Close</text>
          <text x="96" y="90">Najjera</text>
          <text x="722" y="506">Kira Municipality</text>
          <text x="896" y="88" fontSize="16" fontWeight="500">N ↑</text>
          <text x="868" y="236" fontSize="16" fontWeight="500" fill="#8a93a3">≈ 1 km apart</text>
        </g>
        {/* connector between campuses */}
        <line x1={p1.x * 10} y1={p1.y * 5.6} x2={p2.x * 10} y2={p2.y * 5.6} stroke="#8c2429" strokeWidth="2.4" strokeDasharray="4 9" opacity="0.5" />
        {/* Hass Petrol Station landmark */}
        <g transform="translate(150,388)">
          <rect x="-8" y="-8" width="16" height="16" rx="4" fill="#2f7d46" />
          <text x="12" y="6" fontSize="16" fontWeight="700" fill="#2f7d46" fontFamily="Inter, system-ui, sans-serif">Hass Petrol Station</text>
        </g>
        {/* scale bar */}
        <g transform="translate(820,540)">
          <rect x="0" y="-8" width="120" height="5" rx="2.5" fill="#8a93a3" />
          <text x="0" y="-16" fontSize="15" fill="#6b7484" fontFamily="Inter, system-ui, sans-serif">≈ 500 m</text>
        </g>
      </svg>

      {/* Pins — tapping opens Google Maps directions (shortest driving route) */}
      {CAMPUSES.map((c) => {
        const p = pos(c);
        return (
          <a
            key={c.id}
            className={`cmap-pin ${c.class}`}
            href={directionsUrl(c)}
            target="_blank"
            rel="noreferrer"
            style={{ left: pct(p.x), top: pct(p.y) }}
            aria-label={`Directions to ${c.name} — ${c.address}, ${c.landmark}`}
            title={`Directions to ${c.name}`}
          >
            <svg className="cmap-pin-svg" width="34" height="46" viewBox="0 0 24 32" fill="none" aria-hidden="true">
              <path d="M12 31C12 31 22 19.5 22 12a10 10 0 1 0-20 0c0 7.5 10 19 10 19z" fill={c.color} stroke="#fff" strokeWidth="1.6" />
              <circle cx="12" cy="12" r="4.2" fill="#fff" stroke={c.color} strokeWidth="1.4" />
            </svg>
            <span className="cmap-label">
              <b>{c.short}</b>
              <small>{c.landmark}</small>
            </span>
          </a>
        );
      })}

      <div className="cmap-hint">
        <Icon name="pin" size={15} />
        Tap a pin — Google Maps opens the quickest driving route from where you are.
      </div>
    </div>
  );
}
