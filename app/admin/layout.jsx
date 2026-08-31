import Shell from "@/components/Shell.jsx";

const ADMIN = {
  id: "u-admin",
  role: "admin",
  name: "Mr. Francis Ssekandi",
  title: "Head of School",
};

export default function AdminLayout({ children }) {
  return (
    <Shell mode="admin" user={ADMIN} subtitle="Admin Console · Gill International School & Gill Pre-School">
      {children}
    </Shell>
  );
}
