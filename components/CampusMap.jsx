"use client";
// Static Najjera street map based on the school's map listing. The campus
// export remains shared with registration and footer location links.

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

export default function CampusMap({ height = 430 }) {
  return (
    <div
      className="cmap cmap-static"
      style={{ minHeight: height, aspectRatio: "921 / 856" }}
      role="img"
      aria-label="Static street map of Gill International School and Gill International Preschool in Najjera, Kampala"
    >
      <img
        className="cmap-img"
        src="/map-najjera.svg"
        alt="Street map showing Gill International School, Gill International Preschool, Mbogo Road, Bulabira Road and nearby Najjera landmarks"
        draggable={false}
      />
    </div>
  );
}
