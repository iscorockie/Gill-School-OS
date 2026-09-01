"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AppProvider, Toast, useApp } from "./ui.jsx";
import Icon from "./icons.jsx";

function NavLink({ href, icon, label, end }) {
  const pathname = usePathname();
  const active = end ? pathname === href : pathname.startsWith(href);
  return (
    <Link href={href} className={active ? "active" : ""}>
      <span className="nav-ico"><Icon name={icon} size={17} /></span>
      {label}
    </Link>
  );
}

const PORTAL_NAV = [
  { section: "My family" },
  { href: "/portal", icon: "home", label: "Overview", end: true },
  { href: "/portal/fees", icon: "wallet", label: "Fees & Payments" },
  { href: "/portal/children", icon: "users", label: "Children & Progress" },
  { href: "/portal/accounts", icon: "key", label: "Student Accounts" },
  { href: "/portal/leave", icon: "send", label: "Absence Requests" },
  { section: "School life" },
  { href: "/portal/messages", icon: "chat", label: "Family Group Chats" },
  { href: "/portal/news", icon: "bell", label: "Noticeboard & Messages" },
  { href: "/portal/calendar", icon: "calendar", label: "School Calendar" },
  { href: "/portal/resources", icon: "bookOpen", label: "Resources & Library" },
  { href: "/portal/orders", icon: "shirt", label: "Uniform & Book Pre-Orders" },
];

const STAFF_NAV = [
  { section: "My work" },
  { href: "/staff/home", icon: "home", label: "Overview", end: true },
];

const STUDENT_NAV = [
  { section: "My school" },
  { href: "/student", icon: "home", label: "Today", end: true },
  { href: "/student/progress", icon: "chart", label: "My Progress" },
  { href: "/student/homework", icon: "clipboard", label: "Homework" },
  { href: "/student/library", icon: "bookOpen", label: "Library" },
  { href: "/student/calendar", icon: "calendar", label: "School Calendar" },
];

const ADMIN_NAV = [
  { section: "Operations" },
  { href: "/admin", icon: "chart", label: "Dashboard", end: true },
  { href: "/admin/admissions", icon: "file", label: "Admissions & Transitions" },
  { href: "/admin/fees", icon: "card", label: "Fees & Payments" },
  { href: "/admin/pickups", icon: "gate", label: "Gate & Checkouts" },
  { href: "/admin/leaves", icon: "send", label: "Leave Approvals" },
  { section: "School" },
  { href: "/admin/communications", icon: "chat", label: "Communications" },
  { href: "/admin/academics", icon: "chart", label: "Assessments" },
  { href: "/admin/events", icon: "calendar", label: "Events & Calendar" },
  { href: "/admin/resources", icon: "layers", label: "Resource Hub" },
];

function ErrBanner() {
  const { error, load } = useApp();
  if (!error) return null;
  return (
    <div className="card" style={{ borderColor: "var(--red)", background: "var(--red-50)" }}>
      <b>Unable to load data</b> <button className="btn sm" onClick={load}>Retry</button>
    </div>
  );
}

export default function Shell({ mode = "portal", user, subtitle, children }) {
  const nav = mode === "portal" ? PORTAL_NAV : mode === "student" ? STUDENT_NAV : mode === "staff" ? STAFF_NAV : ADMIN_NAV;
  const brand = mode === "portal" ? "Parent Portal" : mode === "student" ? "Student Portal" : mode === "staff" ? "Staff Portal" : "OS Admin";
  const tagline = mode === "student" ? "Najjera · Cambridge Pathway" : mode === "staff" ? "Gill School OS" : "Najjera · Kampala";
  return (
    <AppProvider>
      <div className="wrap">
        <aside className={`sidebar ${mode === "student" ? "sidebar-student" : ""} ${mode === "staff" ? "sidebar-staff" : ""}`}>
          <div className="brand">
            <a href="https://www.gill.ac.ug/#home" aria-label="Back to gill.ac.ug" title="Back to gill.ac.ug">
              <img src="/logo.png" alt="Gill International School logo" />
            </a>
            <div>
              <a href="https://www.gill.ac.ug/#home" style={{ textDecoration: "none" }}>
                <b>Gill School OS</b>
                <span>{brand} · Najjera</span>
              </a>
            </div>
          </div>
          <nav className="nav">
            {nav.map((n, i) => n.section ? (
                <div className="section" key={i}>{n.section}</div>
              ) : (
                <NavLink key={n.href} {...n} />
              )
            )}
          </nav>
          <div className="foot">
            <div className="row" style={{ justifyContent: "space-between" }}>
              <span>{tagline}</span>
              <Link href="/" className="small">← Home</Link>
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
                <span className="small muted">{user.role === "parent" ? "Parent" : user.roleLabel || user.title || user.role}</span>
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
