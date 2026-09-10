"use client";
// Static campus map — a real street view of Najjera (public/map-najjera.svg)
// showing the 1.1 km route between the two Gill campuses, in the style of the
// school's own Google Maps listing. Tapping a pin (or its label) opens Google
// Maps with driving directions to that exact landmark — the shortest route
// for the parent.
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
    // Pin anchor (tip) as a percentage of the map image (1312 × 984).
    x: 44.0,
    y: 82.0,
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
    x: 56.2,
    y: 13.4,
  },
];

const directionsUrl = (c) =>
  `https://www.google.com/maps/dir/?api=1&destination=${c.lat},${c.lng}`;

export default function CampusMap({ height = 430 }) {
  return (
    <div
      className="cmap"
      style={{ minHeight: height, aspectRatio: "1312 / 984" }}
      role="group"
      aria-label="Street map of the two Gill campuses in Najjera, Kampala, with the 1.1 km route between them"
    >
      <img
        className="cmap-img"
        src="/map-najjera.svg"
        alt=""
        aria-hidden="true"
        draggable={false}
      />

      {/* Pins — tapping opens Google Maps directions (shortest driving route) */}
      {CAMPUSES.map((c) => (
        <a
          key={c.id}
          className={`cmap-pin ${c.class}`}
          href={directionsUrl(c)}
          target="_blank"
          rel="noreferrer"
          style={{ left: `${c.x}%`, top: `${c.y}%` }}
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
      ))}

      <div className="cmap-hint">
        <Icon name="pin" size={15} />
        Tap a pin — Google Maps opens the quickest driving route from where you are.
      </div>
    </div>
  );
}
