// Gill School OS — production launcher for shared hosting (Node.js app
// manager / Passenger-style panels) and any VPS.
//
// Usage on the server:
//   npm install
//   npm run build
//   PORT=30008 NODE_ENV=production node server.js
//
// The panel assigns the port via PORT and reverse-proxies the public domain
// (portal.gill.ac.ug) to it. APP_URL, SMTP_* and DATA_DIR come from the
// panel's Environment Variables section (see docs/deploy-shared-hosting.md).
// DATA_DIR (optional) keeps the database outside the app folder so redeploys
// never touch live data.

const { createServer } = require("http");
const { parse } = require("url");
const path = require("path");
const fs = require("fs");

// Load .env / .env.local / .env.production explicitly, before anything else.
// Next.js loads these itself for `next dev` / `next start`, but shared-hosting
// panels run this file directly (`node server.js`) and start the process with a
// bare environment — without this, SMTP_* sitting in a .env next to the app
// would never reach the mailer and email would silently stay in simulated
// mode ("the emails are not active"). Real environment variables always win
// over .env values (@next/env does not overwrite existing process.env).
try {
  require("@next/env").loadEnvConfig(__dirname, process.env.NODE_ENV !== "production");
} catch (e) {
  // Fallback loader if @next/env is ever unavailable: parse KEY=VALUE lines.
  try {
    const envFile = path.join(__dirname, ".env");
    if (fs.existsSync(envFile)) {
      for (const line of fs.readFileSync(envFile, "utf8").split("\n")) {
        const m = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/.exec(line);
        if (m && process.env[m[1]] === undefined) {
          process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
        }
      }
    }
  } catch { /* keep going — the app still runs (simulated mail) */ }
}

const port = parseInt(process.env.PORT || "3000", 10);
const hostname = process.env.HOSTNAME || "0.0.0.0";

// Fail fast with a helpful message if the app was never built.
const buildManifest = path.join(__dirname, ".next", "BUILD_ID");
if (!fs.existsSync(buildManifest)) {
  console.error(
    "[gill-os] No production build found (.next/BUILD_ID missing).\n" +
      "Run `npm install && npm run build` first, then start again."
  );
  process.exit(1);
}

const next = require("next");
const app = next({ dev: false, dir: __dirname, hostname, port });
const handle = app.getRequestHandler();

app
  .prepare()
  .then(() => {
    createServer((req, res) => {
      try {
        handle(req, res, parse(req.url, true));
      } catch (err) {
        console.error("[gill-os] request failed:", err);
        if (!res.headersSent) {
          res.statusCode = 500;
          res.end("Internal error");
        }
      }
    }).listen(port, hostname, () => {
      console.log(`[gill-os] ready on http://${hostname}:${port} (data: ${process.env.DATA_DIR || path.join(process.cwd(), "data")})`);
    });
  })
  .catch((err) => {
    console.error("[gill-os] failed to start:", err);
    process.exit(1);
  });
