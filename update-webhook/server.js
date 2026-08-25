const crypto = require("node:crypto");
const fs = require("node:fs");
const http = require("node:http");
const { spawn } = require("node:child_process");

const port = Number(process.env.PORT || 3050);
const token = process.env.UPDATE_TOKEN || "";
const scriptPath = process.env.UPDATE_SCRIPT || "/update-webhook/run-update.sh";
const statusFile = process.env.UPDATE_STATUS_FILE || "/workspace/data/update-status.json";
const logFile = process.env.UPDATE_LOG_FILE || "/workspace/data/update-webhook.log";

let running = false;

function ensureParentDir(filePath) {
  fs.mkdirSync(require("node:path").dirname(filePath), { recursive: true });
}

function writeStatus(status) {
  ensureParentDir(statusFile);
  fs.writeFileSync(statusFile, JSON.stringify(status, null, 2));
}

function appendLog(chunk) {
  ensureParentDir(logFile);
  fs.appendFileSync(logFile, chunk);
}

function readLogTail(maxBytes = 12000) {
  try {
    const stat = fs.statSync(logFile);
    const fd = fs.openSync(logFile, "r");
    const size = Math.min(stat.size, maxBytes);
    const buffer = Buffer.alloc(size);
    fs.readSync(fd, buffer, 0, size, Math.max(0, stat.size - size));
    fs.closeSync(fd);
    return buffer.toString();
  } catch {
    return "";
  }
}

function isAuthorized(req) {
  if (!token) return false;

  const auth = req.headers.authorization || "";
  const supplied = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  const suppliedBuffer = Buffer.from(supplied);
  const tokenBuffer = Buffer.from(token);

  return suppliedBuffer.length === tokenBuffer.length && crypto.timingSafeEqual(suppliedBuffer, tokenBuffer);
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { "Content-Type": "application/json" });
  res.end(JSON.stringify(payload));
}

function startUpdate() {
  const startedAt = new Date().toISOString();
  running = true;
  ensureParentDir(logFile);
  fs.writeFileSync(logFile, `Update started at ${startedAt}\n`);
  writeStatus({ status: "running", startedAt, message: "Update laeuft.", log: "" });

  const child = spawn(scriptPath, {
    cwd: process.env.WORKSPACE || "/workspace",
    env: process.env,
    shell: false,
  });

  child.stdout.on("data", (chunk) => appendLog(chunk.toString()));
  child.stderr.on("data", (chunk) => appendLog(chunk.toString()));

  child.on("error", (error) => {
    const finishedAt = new Date().toISOString();
    appendLog(`\nUpdate failed to start: ${error.message}\n`);
    writeStatus({
      status: "error",
      startedAt,
      finishedAt,
      message: `Update konnte nicht gestartet werden: ${error.message}`,
      log: readLogTail(),
    });
    running = false;
  });

  child.on("close", (code) => {
    const finishedAt = new Date().toISOString();
    const ok = code === 0;
    appendLog(`\nUpdate finished at ${finishedAt} with code ${code}\n`);
    writeStatus({
      status: ok ? "success" : "error",
      startedAt,
      finishedAt,
      message: ok ? "Update erfolgreich abgeschlossen." : `Update endete mit Fehlercode ${code}.`,
      log: readLogTail(),
    });
    running = false;
  });
}

const server = http.createServer((req, res) => {
  if (req.method === "GET" && req.url === "/status") {
    if (!isAuthorized(req)) return sendJson(res, 401, { error: "Unauthorized" });

    try {
      const status = JSON.parse(fs.readFileSync(statusFile, "utf8"));
      return sendJson(res, 200, { ...status, running });
    } catch {
      return sendJson(res, 200, { status: "idle", running, log: readLogTail() });
    }
  }

  if (req.method !== "POST" || req.url !== "/update") {
    return sendJson(res, 404, { error: "Not found" });
  }

  if (!token) {
    return sendJson(res, 503, { error: "UPDATE_TOKEN fehlt." });
  }

  if (!isAuthorized(req)) {
    return sendJson(res, 401, { error: "Unauthorized" });
  }

  if (running) {
    return sendJson(res, 409, { error: "Update laeuft bereits." });
  }

  startUpdate();
  return sendJson(res, 202, { success: true, message: "Update wurde gestartet." });
});

server.listen(port, "0.0.0.0", () => {
  console.log(`Buchungstool update webhook listening on port ${port}`);
});
