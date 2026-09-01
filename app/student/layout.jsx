"use client";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Shell from "@/components/Shell.jsx";
import { AppProvider } from "@/components/ui.jsx";
import { StudentProvider, useStudent } from "@/components/StudentProvider.jsx";

function Gate({ children }) {
  const { session, ready } = useStudent();
  const router = useRouter();
  const pathname = usePathname();
  const publicPath = pathname === "/student/login";

  useEffect(() => {
    if (!ready) return;
    if (publicPath && session) router.replace("/student");
    if (!publicPath && !session) router.replace("/student/login");
  }, [ready, session, publicPath, router]);

  if (!ready) return <div className="auth-wrap"><div className="auth-card">Loading your portal…</div></div>;
  if (publicPath) return children; // login page renders without a session
  if (!session) return null; // redirect effect handles the bounce
  return children;
}

export default function StudentLayout({ children }) {
  return (
    <AppProvider>
      <StudentProvider>
        <Gate>
          <StudentShell>{children}</StudentShell>
        </Gate>
      </StudentProvider>
    </AppProvider>
  );
}

function StudentShell({ children }) {
  const { session, logout } = useStudent();
  const pathname = usePathname();
  // Public pages (login) render without the portal chrome — no session yet,
  // so the shell must NOT touch session fields or it throws client-side.
  if (pathname === "/student/login") return children;
  return (
    <Shell mode="student"
      user={{ name: session.name, role: `${session.class} · supervised by ${session.supervisedBy}`, title: null }}
      subtitle={`Student Portal · ${session.class} · ${session.campus === "preschool" ? "Pre-School" : "Cambridge Pathway"}`}
    >
      <div style={{ marginBottom: "1rem" }}>
        <StudentBar session={session} onLogout={logout} />
      </div>
      {children}
    </Shell>
  );
}

function StudentBar({ session, onLogout }) {
  return (
    <div className="card" style={{ display: "flex", flexWrap: "wrap", gap: "0.8rem", alignItems: "center", justifyContent: "space-between", padding: "0.8rem 1.1rem" }}>
      <div className="row" style={{ gap: "0.55rem" }}>
        <span className="badge blue">School ID · {session.schoolId}</span>
        <span className="chip-pre">Supervised by {session.supervisedBy}</span>
      </div>
      <button className="btn ghost sm" onClick={onLogout}>Sign out</button>
    </div>
  );
}
