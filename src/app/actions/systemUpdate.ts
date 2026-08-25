"use server";

import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";

type UpdateMode = "disabled" | "webhook" | "script";

type UpdateRunResult = {
  success: boolean;
  message: string;
  log?: string;
};

async function requireAdminSession() {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session");

  if (session?.value !== "authenticated") {
    throw new Error("Nicht autorisiert.");
  }
}

function getUpdateMode(): UpdateMode {
  if (process.env.ADMIN_UPDATE_WEBHOOK_URL) return "webhook";
  if (process.env.ADMIN_UPDATE_SCRIPT_PATH) return "script";
  return "disabled";
}

async function getUpdateStatusFileInfo() {
  if (!process.env.ADMIN_UPDATE_STATUS_FILE) return null;

  try {
    const raw = await fs.readFile(process.env.ADMIN_UPDATE_STATUS_FILE, "utf8");
    const status = JSON.parse(raw) as {
      status?: string;
      startedAt?: string;
      finishedAt?: string;
      message?: string;
      log?: string;
    };

    return {
      lastRunAt: status.finishedAt || status.startedAt || null,
      lastStatus: status.status || null,
      lastLog: [status.message, status.log].filter(Boolean).join("\n\n"),
    };
  } catch {
    return null;
  }
}

function maskTarget(value: string) {
  try {
    const url = new URL(value);
    return `${url.protocol}//${url.host}${url.pathname}`;
  } catch {
    return value;
  }
}

async function saveUpdateLog(status: "success" | "error", log: string) {
  const now = new Date().toISOString();
  const cappedLog = log.slice(-12000);

  await prisma.setting.upsert({
    where: { key: "SYSTEM_UPDATE_LAST_RUN_AT" },
    update: { value: now },
    create: { key: "SYSTEM_UPDATE_LAST_RUN_AT", value: now },
  });
  await prisma.setting.upsert({
    where: { key: "SYSTEM_UPDATE_LAST_STATUS" },
    update: { value: status },
    create: { key: "SYSTEM_UPDATE_LAST_STATUS", value: status },
  });
  await prisma.setting.upsert({
    where: { key: "SYSTEM_UPDATE_LAST_LOG" },
    update: { value: cappedLog },
    create: { key: "SYSTEM_UPDATE_LAST_LOG", value: cappedLog },
  });
}

function runScript(scriptPath: string): Promise<UpdateRunResult> {
  return new Promise((resolve) => {
    const resolvedScriptPath = path.isAbsolute(scriptPath)
      ? scriptPath
      : path.resolve(process.cwd(), scriptPath);

    const child = spawn(resolvedScriptPath, {
      cwd: process.cwd(),
      env: process.env,
      shell: false,
    });

    let log = "";
    const appendLog = (chunk: Buffer) => {
      log += chunk.toString();
      if (log.length > 12000) log = log.slice(-12000);
    };

    const timer = setTimeout(() => {
      child.kill("SIGTERM");
      resolve({
        success: false,
        message: "Update-Script wurde wegen Zeitüberschreitung beendet.",
        log,
      });
    }, 15 * 60 * 1000);

    child.stdout.on("data", appendLog);
    child.stderr.on("data", appendLog);
    child.on("error", (error) => {
      clearTimeout(timer);
      resolve({
        success: false,
        message: `Update-Script konnte nicht gestartet werden: ${error.message}`,
        log,
      });
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      resolve({
        success: code === 0,
        message: code === 0 ? "Update erfolgreich abgeschlossen." : `Update-Script endete mit Fehlercode ${code}.`,
        log,
      });
    });
  });
}

export async function getSystemUpdateInfo() {
  await requireAdminSession();

  const mode = getUpdateMode();
  const lastRunAt = await prisma.setting.findUnique({ where: { key: "SYSTEM_UPDATE_LAST_RUN_AT" } });
  const lastStatus = await prisma.setting.findUnique({ where: { key: "SYSTEM_UPDATE_LAST_STATUS" } });
  const lastLog = await prisma.setting.findUnique({ where: { key: "SYSTEM_UPDATE_LAST_LOG" } });
  const statusFileInfo = await getUpdateStatusFileInfo();

  return {
    mode,
    enabled: mode !== "disabled",
    target:
      mode === "webhook"
        ? maskTarget(process.env.ADMIN_UPDATE_WEBHOOK_URL || "")
        : mode === "script"
          ? process.env.ADMIN_UPDATE_SCRIPT_PATH || ""
          : "",
    lastRunAt: statusFileInfo?.lastRunAt || lastRunAt?.value || null,
    lastStatus: statusFileInfo?.lastStatus || lastStatus?.value || null,
    lastLog: statusFileInfo?.lastLog || lastLog?.value || "",
  };
}

export async function runSystemUpdate() {
  await requireAdminSession();

  const mode = getUpdateMode();

  if (mode === "disabled") {
    return {
      success: false,
      message: "Die Update-Funktion ist noch nicht konfiguriert.",
      log: "Setze ADMIN_UPDATE_WEBHOOK_URL oder ADMIN_UPDATE_SCRIPT_PATH auf dem Server.",
    };
  }

  let result: UpdateRunResult;

  try {
    if (mode === "webhook") {
      const response = await fetch(process.env.ADMIN_UPDATE_WEBHOOK_URL || "", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(process.env.ADMIN_UPDATE_WEBHOOK_TOKEN
            ? { Authorization: `Bearer ${process.env.ADMIN_UPDATE_WEBHOOK_TOKEN}` }
            : {}),
        },
        body: JSON.stringify({
          source: "buchungstool-admin",
          requestedAt: new Date().toISOString(),
        }),
        signal: AbortSignal.timeout(60000),
      });

      const text = await response.text();
      result = {
        success: response.ok || response.status === 409,
        message:
          response.status === 409
            ? "Update läuft bereits."
            : response.ok
              ? "Update wurde angestoßen."
              : `Update-Webhook meldet HTTP ${response.status}.`,
        log: text || response.statusText,
      };
    } else {
      result = await runScript(process.env.ADMIN_UPDATE_SCRIPT_PATH || "");
    }
  } catch (error) {
    result = {
      success: false,
      message: "Update konnte nicht gestartet werden.",
      log: error instanceof Error ? error.message : String(error),
    };
  }

  await saveUpdateLog(result.success ? "success" : "error", `${result.message}\n\n${result.log || ""}`);

  return result;
}
