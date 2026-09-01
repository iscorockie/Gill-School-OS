"use client";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Shell from "@/components/Shell.jsx";
import { useStaff } from "@/components/StaffSession.jsx";

export default function StaffLayout({ children }) {
  const { staff, ready } = useStaff();
  const router = useRouter();
  const pathname = usePathname();
  const onLogin = pathname === "/staff";

  useEffect(() => {
    if (ready && !onLogin && !staff) router.replace("/staff");
  }, [ready, onLogin, staff, router]);

  if (!ready) return <div className="auth-wrap"><div className="auth-card">Loading Staff Portal…</div></div>;
  if (onLogin) return children;
  if (!staff) return null;

  return (
    <Shell mode="staff" user={{ ...staff, role: "staff" }} subtitle={`Staff Portal · Gill International School & Gill Pre-School · ${staff.roleLabel}`}>
      <div className="card" style={{ marginBottom: "1.1rem", display: "flex", flexWrap: "wrap", gap: "0.7rem", alignItems: "center", justifyContent: "space-between", padding: "0.65rem 1rem" }}>
        <div className="row" style={{ gap: "0.55rem", flexWrap: "wrap" }}>
          <span className="badge blue">{staff.roleLabel}</span>
          <span className="small">Signed in as <b>{staff.name}</b></span>
        </div>
        <a className="small" href="/staff" onClick={() => { try { localStorage.removeItem("gill_staff_session"); } catch { /* ignore */ } }}>Sign out</a>
      </div>
      {children}
    </Shell>
  );
}
