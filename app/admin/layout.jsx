"use client";
import { useRouter } from "next/navigation";
import Shell from "@/components/Shell.jsx";
import { useStaff } from "@/components/StaffSession.jsx";

const DEFAULT_ADMIN = {
  id: "u-admin",
  role: "admin",
  name: "Mr. Francis Ssekandi",
  title: "Head of School",
};

export default function AdminLayout({ children }) {
  const { staff, ready } = useStaff();
  const router = useRouter();
  const user = staff || DEFAULT_ADMIN;
  const title = staff?.title || DEFAULT_ADMIN.title;

  return (
    <Shell mode="admin" user={{ ...user, title, role: staff ? "staff" : "admin" }} subtitle="Staff Portal · Gill International School & Gill Pre-School">
      <div className="card" style={{ marginBottom: "1.1rem", display: "flex", flexWrap: "wrap", gap: "0.7rem", alignItems: "center", justifyContent: "space-between", padding: "0.65rem 1rem" }}>
        <div className="row" style={{ gap: "0.55rem" }}>
          <span className="badge blue">Staff Portal</span>
          {staff ? (
            <span className="small">
              Signed in as <b>{staff.name}</b> · {staff.roleLabel || staff.title}
            </span>
          ) : (
            <span className="small muted">Signed in as <b>{DEFAULT_ADMIN.name}</b> (demo) — or sign in with your own staff role.</span>
          )}
        </div>
        <div className="row">
          {!staff && ready && (
            <button className="btn ghost sm" onClick={() => router.push("/staff")}>Enter Staff Portal</button>
          )}
          {staff && (
            <a className="small" href="/staff" onClick={() => { try { localStorage.removeItem("gill_staff_session"); } catch {} }}>Sign out</a>
          )}
        </div>
      </div>
      {children}
    </Shell>
  );
}
