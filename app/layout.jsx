import "./globals.css";

export const metadata = {
  title: "Gill School OS — Gill International School, Najjera",
  description:
    "Unified campus platform for Gill International School & Gill Pre-School: one dashboard for parents, automated fees, paperless admissions, mobile money, and in-house communications.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
