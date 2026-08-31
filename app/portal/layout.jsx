"use client";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Shell from "@/components/Shell.jsx";
import { AppProvider } from "@/components/ui.jsx";
import { ParentProvider, useParent } from "@/components/ParentProvider.jsx";

function Gate({ children }) {
  const { session, ready } = useParent();
  const router = useRouter();
  const pathname = usePathname();
  const onLogin = pathname === "/portal/login";

  useEffect(() => {
    if (ready && !session && !onLogin) router.replace("/portal/login");
  }, [ready, session, onLogin, router]);

  if (!ready) return <div className="auth-wrap"><div className="auth-card">Loading Parent Portal…</div></div>;
  if (onLogin) return children;
  if (!session) return null;
  return children;
}

export default function PortalLayout({ children }) {
  return (
    <AppProvider>
      <ParentProvider>
        <Gate>
          <PortalChrome>{children}</PortalChrome>
        </Gate>
      </ParentProvider>
    </AppProvider>
  );
}

function PortalChrome({ children }) {
  const { session } = useParent();
  const pathname = usePathname();
  if (pathname === "/portal/login") return children;
  return (
    <Shell
      mode="portal"
      user={{
        name: `${session.familyName} family`,
        role: "Parent",
        title: `Shared by ${session.members.map((m) => m.name.split(" ")[0]).join(" & ")}`,
      }}
      subtitle="Parent Portal · Gill International School & Gill Pre-School"
    >
      <div style={{ marginBottom: "1rem" }}>
        <FamilyBar session={session} />
      </div>
      {children}
    </Shell>
  );
}

function FamilyBar({ session }) {
  const { logout } = useParent();
  return (
    <div className="card" style={{ display: "flex", flexWrap: "wrap", gap: "0.8rem", alignItems: "center", justifyContent: "space-between", padding: "0.8rem 1.1rem" }}>
      <div className="row" style={{ gap: "0.55rem" }}>
        <span className="badge blue">@{session.username} · shared family login</span>
        {session.members.map((m) => (
          <span className="chip-pre" key={m.id}>{m.name.split(" ")[0]} · {m.relation.split(" / ")[0]}</span>
        ))}
      </div>
      <button className="btn ghost sm" onClick={logout}>Sign out</button>
    </div>
  );
}
