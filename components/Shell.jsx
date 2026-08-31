"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AppProvider, Toast, useApp } from "./ui.jsx";

const stroke = { width: 16, height: 16, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" };
const I = ({ d }) => <svg {...stroke}><path d={d} /></svg>;
const Circle = ({ d }) => <svg {...stroke}><circle cx="12" cy="12" r="9" /><path d={d} /></svg>;

export function Icon({ name }) {
  const map = {
    home: <I d="M3 10.5 12 3l9 7.5V21h-6v-6h-6v6H3z" />,
    users: <><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c.8-3.4 3.4-5 6.5-5s5.7 1.6 6.5 5" /><path d="M16 5.5a3.5 3.5 0 0 1 0 6.6M18.5 15.4c1.5.8 2.5 2.1 3 4.6" /></>,
    receipt: <I d="M5 3h14v18l-2.3-1.5L14.4 21l-2.4-1.5L9.6 21l-2.3-1.5L5 21zM9 8h6M9 12h6" />,
    book: <I d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z" />,
    calendar: <><rect x="3.5" y="5" width="17" height="16" rx="2" /><path d="M3.5 10h17M8 3v4M16 3v4" /></>,
    chat: <I d="M21 12a8 8 0 0 1-8 8H4l2.2-3A8 8 0 1 1 21 12z" />,
    bell: <I d="M18 9a6 6 0 1 0-12 0c0 6-2 7-2 7h16s-2-1-2-7M10.5 20a1.8 1.8 0 0 0 3 0" />,
    doc: <I d="M6 3h8l4 4v14H6zM14 3v4h4M9 12h6M9 16h6" />,
    chart: <I d="M4 20V10M10 20V4M16 20v-7M22 20H2" />,
    gate: <I d="M4 21V6a8 8 0 0 1 16 0v15M4 21h16M8 21v-8M12 21v-8M16 21v-8M8 13h8" />,
    tshirt: <I d="M8 3 4 6l2 4 2-1v12h8V9l2 1 2-4-4-3a4 4 0 0 1-8 0z" />,
    send: <I d="M22 2 11 13M22 2l-7 20-4-9-9-4z" />,
    shield: <I d="M12 3 4 6v6c0 5 3.4 8.2 8 9 4.6-.8 8-4 8-9V6zM9 12l2 2 4-4" />,
    card: <><rect x="2.5" y="5" width="19" height="14" rx="2" /><path d="M2.5 10h19M6 15h4" /></>,
    spark: <I d="M12 2l2.2 6.6L21 11l-6.8 2.4L12 20l-2.2-6.6L3 11l6.8-2.4z" />,
    wallet: <I d="M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM16 12h4" />,
    swap: <I d="M7 8h13m0 0-3-3m3 3-3 3M17 16H4m0 0 3 3m-3-3 3-3" />,
  };
  return map[name] || null;
}

function NavLink({ href, icon, label, end }) {
  const pathname = usePathname();
  const active = end ? pathname === href : pathname.startsWith(href);
  return (
    <Link href={href} className={active ? "active" : ""}>
      <span className="emoji"><Icon name={icon} /></span>
      {label}
    </Link>
  );
}

const PORTAL_NAV = [
  { section: "My family" },
  { href: "/portal", icon: "home", label: "Overview", end: true },
  { href: "/portal/fees", icon: "wallet", label: "Fees & Payments" },
  { href: "/portal/children", icon: "users", label: "Children & Progress" },
  { href: "/portal/leave", icon: "send", label: "Absence Requests" },
  { section: "School life" },
  { href: "/portal/news", icon: "bell", label: "Noticeboard & Messages" },
  { href: "/portal/calendar", icon: "calendar", label: "School Calendar" },
  { href: "/portal/resources", icon: "book", label: "Resources & Library" },
  { href: "/portal/orders", icon: "tshirt", label: "Uniform & Book Pre-Orders" },
];

const ADMIN_NAV = [
  { section: "Operations" },
  { href: "/admin", icon: "chart", label: "Dashboard", end: true },
  { href: "/admin/admissions", icon: "doc", label: "Admissions & Transition" },
  { href: "/admin/fees", icon: "card", label: "Fees & Reconciliation" },
  { href: "/admin/pickups", icon: "gate", label: "Gate & Late Pickups" },
  { href: "/admin/leaves", icon: "send", label: "Leave Approvals" },
  { section: "School" },
  { href: "/admin/communications", icon: "chat", label: "Communications" },
  { href: "/admin/academics", icon: "chart", label: "Academics" },
  { href: "/admin/events", icon: "calendar", label: "Events & Calendar" },
  { href: "/admin/resources", icon: "book", label: "Resource Hub" },
  { href: "/admin/savings", icon: "spark", label: "Cost-Savings Report" },
];

function ErrBanner() {
  const { error, load } = useApp();
  if (!error) return null;
  return (
    <div className="card" style={{ borderColor: "var(--red)", background: "var(--red-50)" }}>
      <b>⚠️ {error}</b> <button className="btn sm" onClick={load}>Retry</button>
    </div>
  );
}

export default function Shell({ mode = "portal", user, subtitle, children }) {
  const nav = mode === "portal" ? PORTAL_NAV : ADMIN_NAV;
  const brand = mode === "portal" ? "Parent Portal" : "Admin Console";
  return (
    <AppProvider>
      <div className="wrap">
        <aside className="sidebar">
          <div className="brand">
            <img src="/logo.png" alt="Gill International School logo" />
            <div>
              <b>Gill School OS</b>
              <span>{brand} · Najjera</span>
            </div>
          </div>
          <nav className="nav">
            {nav.map((n, i) =>
              n.section ? (
                <div className="section" key={i}>{n.section}</div>
              ) : (
                <NavLink key={n.href} {...n} />
              )
            )}
          </nav>
          <div className="foot">
            <div className="row" style={{ justifyContent: "space-between" }}>
              <span>Cambridge · Pre-School & Main</span>
              <a href="/" className="small">← Site home</a>
            </div>
          </div>
        </aside>
        <div className="main">
          <div className="topbar">
            <div>
              <span className="muted small">{subtitle || "Gill International School · Najjera, Kampala"}</span>
              <h1>{user ? `${user.name}` : ""}</h1>
            </div>
            {user && (
              <div className="who">
                <span className="small muted">{user.role === "parent" ? "Parent" : user.title || user.role}</span>
                <div className="avatar">{user.name.replace(/^(Mr\.|Mrs\.|Ms\.)\s*/, "").split(" ").map((w) => w[0]).join("").slice(0, 2)}</div>
              </div>
            )}
          </div>
          <ErrBanner />
          {children}
        </div>
      </div>
      <Toast />
    </AppProvider>
  );
}
