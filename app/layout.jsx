import "./globals.css";

export const metadata = {
  title: "Gill School OS — Gill International School, Najjera",
  description:
    "Unified campus platform for Gill International School & Gill Pre-School: one dashboard for parents, automated fees, paperless admissions, mobile money, and in-house communications.",
};

export const viewport = {
  themeColor: "#8C2429",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* Brand fonts — exactly as loaded by gillschool.ac.ug */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Sora:wght@500;600;700;800&family=Inter:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap"
          rel="stylesheet"
        />
        {/* Brand fonts — exactly as loaded by preschool.gillschool.ac.ug */}
        <link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600;700&family=Nunito:ital,wght@0,500;0,600;0,700;0,800;1,500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
