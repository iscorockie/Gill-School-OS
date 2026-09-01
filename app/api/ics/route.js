import { NextResponse } from "next/server";
import { getDB } from "@/lib/store";

export const dynamic = "force-dynamic";

function esc(s) {
  return String(s || "").replace(/\\/g, "\\\\").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

export async function GET(req) {
  const db = getDB();
  const url = new URL(req.url);
  const campus = url.searchParams.get("campus") || "all";
  const events = db.events.filter((e) => campus === "all" || e.audience === "all" || e.audience === campus);
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Gill School OS//Events//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:Gill International School Calendar",
  ];
  for (const e of events) {
    const [y, m, d] = e.date.split("-");
    const start = `${y}${m}${d}T${(e.time || "08:00").split("–")[0].replace(":", "")}00`;
    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${e.id}@gill-school-os`);
    lines.push(`DTSTAMP:${start}Z`);
    lines.push(`DTSTART:${start}Z`);
    lines.push(`DTEND:${start}Z`);
    lines.push(`SUMMARY:${esc(e.title)}`);
    lines.push(`DESCRIPTION:${esc(e.title)} at ${esc(e.location)}. Presented by Gill International School.`);
    lines.push(`LOCATION:${esc(e.location)}`);
    lines.push("END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  const body = lines.join("\r\n");
  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="gill-school-events.ics"',
    },
  });
}
