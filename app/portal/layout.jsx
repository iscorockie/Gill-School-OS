import Shell from "@/components/Shell.jsx";

const PARENT = {
  id: "u-parent-1",
  role: "parent",
  name: "Amina Nansubuga",
  email: "amina.nansubuga@example.com",
};

export default function PortalLayout({ children }) {
  return (
    <Shell mode="portal" user={PARENT} subtitle="Parent Portal · Gill International School & Gill Pre-School">
      {children}
    </Shell>
  );
}
