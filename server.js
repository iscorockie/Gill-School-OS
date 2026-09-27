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

// ---- Node.js version guard ------------------------------------------------
// Next.js 15 needs Node >= 18.18. Panels default to old runtimes; fail with a
// message that names the fix instead of a cryptic crash in the panel's log.
const [nodeMajor, nodeMinor] = process.versions.node.split(".").map(Number);
if (nodeMajor < 18 || (nodeMajor === 18 && nodeMinor < 18)) {
  console.error(
    `[gill-os] Node.js ${process.versions.node} is too old — this app needs >= 18.18 (20 or 22 recommended).\n` +
      `[gill-os] Fix: in the panel open Applications → this app → Application type → choose Node 20 or 22 → Start.`
  );
  process.exit(1);
}

// ---- Load .env / .env.local / .env.production explicitly -------------------
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

// ---- Deterministic data folder --------------------------------------------
// Panels may start the app with a different working directory, which would
// scatter db.json / uploads / mail.json into an unknown folder. Default the
// data dir to the app folder (what docs/deploy-shared-hosting.md documents);
// DATA_DIR still overrides it when set.
if (!process.env.DATA_DIR) {
  process.env.DATA_DIR = path.join(__dirname, "data");
}

const port = parseInt(process.env.PORT || "3000", 10);

// ---- Bind address ---------------------------------------------------------
// Panels export HOSTNAME as the MACHINE's name (e.g. srv1.crystalcloudhost.com)
// — binding to it either crashes at boot (EADDRNOTAVAIL) or listens on the
// wrong interface, so the panel's proxy (which connects to 127.0.0.1:PORT)
// gets connection-refused and the public site shows a Webuzo "50X error".
// Only honor HOSTNAME when it is an actual bind target (an IP or localhost);
// BIND_HOST forces a specific interface explicitly.
const ambient = (process.env.HOSTNAME || "").trim();
const isBindTarget = ambient === "localhost" || /^[0-9.]+$/.test(ambient) || ambient.includes(":");
const hostname = process.env.BIND_HOST || (isBindTarget ? ambient : "0.0.0.0");

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

// Leave a clear trace when something crashes, so panel logs are diagnosable
// and supervised restarts don't fail silently.
process.on("uncaughtException", (err) => {
  console.error("[gill-os] uncaught exception (the panel will restart me):", err);
  process.exit(1);
});
process.on("unhandledRejection", (err) => {
  console.error("[gill-os] unhandled rejection:", err);
});

function startServer(bindHost) {
  const server = createServer((req, res) => {
    try {
      handle(req, res, parse(req.url, true));
    } catch (err) {
      console.error("[gill-os] request failed:", err);
      if (!res.headersSent) {
        res.statusCode = 500;
        res.end("Internal error");
      }
    }
  });

  server.on("error", (err) => {
    // A stale HOSTNAME/BIND_HOST that isn't a local interface shouldn't take
    // the whole portal down — fall back to every interface.
    if (bindHost !== "0.0.0.0" && err.code === "EADDRNOTAVAIL") {
      console.error(`[gill-os] cannot bind ${bindHost} (EADDRNOTAVAIL) — retrying on 0.0.0.0`);
      startServer("0.0.0.0");
      return;
    }
    console.error(
      `[gill-os] failed to listen on ${bindHost}:${port} (${err.code || err.message}).\n` +
        `[gill-os] Is another process using the port? Check the panel's assigned PORT value and restart the app.`
    );
    process.exit(1);
  });

  server.listen(port, bindHost, () => {
    console.log(
      `[gill-os] ready on http://${bindHost}:${port} — node ${process.versions.node}, ` +
        `data: ${process.env.DATA_DIR}, build: ${fs.existsSync(buildManifest) ? "ok" : "missing"}`
    );
  });
}

app
  .prepare()
  .then(() => startServer(hostname))
  .catch((err) => {
    console.error("[gill-os] failed to start:", err);
    process.exit(1);
  });
