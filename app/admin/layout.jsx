"use client";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Shell from "@/components/Shell.jsx";
import { useStaff } from "@/components/StaffSession.jsx";

// Only the Top School Administration may open this console. Staff, parents
// and students use their own portals; any other session is sent away.
export default function AdminLayout({ children }) {
  const { staff, ready } = useStaff();
  const router = useRouter();
  const pathname = usePathname();
  const onLogin = pathname === "/admin/login";
  const allowed = staff?.id === "u-admin";

  useEffect(() => {
    if (ready && !onLogin && !allowed) router.replace("/admin/login");
  }, [ready, onLogin, allowed, router]);

  if (!ready) {
    return <div className="auth-wrap"><div className="auth-card">Checking access…</div></div>;
  }
  if (onLogin) return children;
  if (!allowed) return null;

  return (
    <Shell mode="admin" user={{ ...staff, role: "staff", title: staff.title }} subtitle="OS Admin · Monitoring Console — Parents, Staff & Student Portals">
      <div className="card" style={{ marginBottom: "1.1rem", display: "flex", flexWrap: "wrap", gap: "0.7rem", alignItems: "center", justifyContent: "space-between", padding: "0.65rem 1rem" }}>
        <div className="row" style={{ gap: "0.55rem", flexWrap: "wrap" }}>
          <span className="badge blue">OS Admin · restricted</span>
          <span className="small">
            Signed in as <b>{staff.name}</b> · {staff.roleLabel || staff.title}
          </span>
        </div>
        <a className="small" href="/admin/login" onClick={() => { try { localStorage.removeItem("gill_staff_session"); } catch { /* ignore */ } }}>Sign out</a>
      </div>
      {children}
    </Shell>
  );
}
