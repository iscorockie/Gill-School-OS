/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Production runs via the root server.js custom server (see
  // docs/deploy-shared-hosting.md), so no `output: "standalone"` here —
  // standalone mode would only print a warning and serve no purpose.
  // The app is previewed through e2b sandbox proxies (e.g. 3000-<id>.e2b.app);
  // without this, dev assets are blocked as cross-origin in the live preview.
  allowedDevOrigins: ["*.e2b.app"],
  async redirects() {
    return [
      // "portal.gill.ac.ug/login" is the shared sign-in page (a real route — do
      // not redirect it away). These Parent-Portal direct URLs parents share
      // must land on the family sign-in, not a 404.
      { source: "/parent", destination: "/portal/login", permanent: true },
      { source: "/parent/login", destination: "/portal/login", permanent: true },
    ];
  },
};

export default nextConfig;
