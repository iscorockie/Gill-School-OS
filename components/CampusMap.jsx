"use client";
// Two-campus map — Pre-School & Main School pinned at their distinct
// Najjera landmarks. Leaflet is loaded client-side only (no SSR window).
import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";

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

const pinSvg = (color) =>
  `<svg width="34" height="46" viewBox="0 0 24 32" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 6px 8px rgba(20,10,12,0.35)); display:block;">
    <path d="M12 31C12 31 22 19.5 22 12a10 10 0 1 0-20 0c0 7.5 10 19 10 19z" fill="${color}" stroke="#fff" stroke-width="1.6"/>
    <circle cx="12" cy="12" r="4.2" fill="#fff" stroke="${color}" stroke-width="1.4"/>
  </svg>`;

export default function CampusMap({ height = 430 }) {
  const ref = useRef(null);

  useEffect(() => {
    let map;
    let L;
    let cancelled = false;

    async function init() {
      const mod = await import("leaflet");
      if (cancelled || !ref.current) return;
      L = mod.default;
      map = L.map(ref.current, {
        scrollWheelZoom: false,
        attributionControl: true,
      });
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "© OpenStreetMap contributors",
      }).addTo(map);

      const bounds = [];
      for (const c of CAMPUSES) {
        const icon = L.divIcon({
          className: "",
          html: pinSvg(c.color),
          iconSize: [34, 46],
          iconAnchor: [17, 44],
          popupAnchor: [0, -42],
        });
        bounds.push([c.lat, c.lng]);
        L.marker([c.lat, c.lng], { icon })
          .addTo(map)
          .bindPopup(
            `<div style="font-family:Inter,system-ui,sans-serif;min-width:210px">
              <b style="font-size:14px;color:${c.color}">${c.name}</b>
              <div style="font-size:12px;color:#444;margin-top:4px">${c.address}</div>
              <div style="font-size:12px;color:#666;margin-top:2px"><b>Landmark:</b> ${c.landmark}</div>
              <div style="font-size:12px;color:#666;margin-top:2px">Plus code <b>${c.plusCode}</b></div>
              <a href="https://www.google.com/maps?q=${c.lat},${c.lng}" target="_blank" rel="noreferrer"
                 style="display:inline-block;margin-top:8px;font-size:12px;font-weight:700;color:#fff;background:${c.color};
                 padding:5px 10px;border-radius:8px;text-decoration:none">Open in Google Maps →</a>
            </div>`
          );
      }

      // Dashed connector — the two campuses sit ~1 km apart on Mbogo Road.
      L.polyline(bounds, {
        color: "#8c2429",
        weight: 2,
        dashArray: "5 8",
        opacity: 0.55,
      }).addTo(map);

      map.fitBounds(L.latLngBounds(bounds), { padding: [46, 46] });
    }

    init();
    return () => {
      cancelled = true;
      map?.remove();
    };
  }, []);

  return (
    <div
      ref={ref}
      className="campus-map"
      style={{ height }}
      role="region"
      aria-label="Map showing Gill Pre-School and Gill International School in Najjera, Kampala"
    />
  );
}
