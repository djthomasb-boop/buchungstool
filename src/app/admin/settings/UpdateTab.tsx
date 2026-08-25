"use client";

import { useEffect, useState, useTransition } from "react";
import { AlertTriangle, CheckCircle2, RefreshCw, Server, Terminal } from "lucide-react";
import { getSystemUpdateInfo, runSystemUpdate } from "@/app/actions/systemUpdate";

type UpdateInfo = {
  mode: "disabled" | "webhook" | "script";
  enabled: boolean;
  target: string;
  lastRunAt: string | null;
  lastStatus: string | null;
  lastLog: string;
};

export function UpdateTab() {
  const [info, setInfo] = useState<UpdateInfo | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string; log?: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const loadInfo = () => {
    startTransition(async () => {
      const result = await getSystemUpdateInfo();
      setInfo(result);
    });
  };

  useEffect(() => {
    loadInfo();
  }, []);

  const handleRunUpdate = () => {
    setMessage(null);
    startTransition(async () => {
      const result = await runSystemUpdate();
      setMessage({
        type: result.success ? "success" : "error",
        text: result.message,
        log: result.log,
      });
      const refreshed = await getSystemUpdateInfo();
      setInfo(refreshed);
    });
  };

  const modeLabel = info?.mode === "webhook" ? "Webhook" : info?.mode === "script" ? "Script" : "Nicht aktiv";

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-background border border-foreground/10 rounded-xl p-4">
          <div className="text-xs font-bold uppercase text-foreground/50 mb-2">Status</div>
          <div className={`font-black ${info?.enabled ? "text-green-600" : "text-amber-600"}`}>
            {info?.enabled ? "Bereit" : "Nicht konfiguriert"}
          </div>
        </div>
        <div className="bg-background border border-foreground/10 rounded-xl p-4">
          <div className="text-xs font-bold uppercase text-foreground/50 mb-2">Modus</div>
          <div className="font-black flex items-center gap-2">
            <Server size={16} className="text-blue-500" /> {modeLabel}
          </div>
        </div>
        <div className="bg-background border border-foreground/10 rounded-xl p-4">
          <div className="text-xs font-bold uppercase text-foreground/50 mb-2">Letzter Lauf</div>
          <div className="font-black">
            {info?.lastRunAt ? new Date(info.lastRunAt).toLocaleString("de-DE") : "-"}
          </div>
        </div>
      </div>

      <div className="bg-background border border-foreground/10 rounded-xl p-5 space-y-4">
        <div>
          <div className="text-xs font-bold uppercase text-foreground/50 mb-2">Ziel</div>
          <code className="block bg-foreground/5 border border-foreground/10 rounded-lg px-3 py-2 text-xs break-all">
            {info?.target || "ADMIN_UPDATE_WEBHOOK_URL oder ADMIN_UPDATE_SCRIPT_PATH fehlt"}
          </code>
        </div>

        {!info?.enabled && (
          <div className="flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-amber-700 text-sm">
            <AlertTriangle size={18} className="shrink-0 mt-0.5" />
            <span>
              Update-Button ist absichtlich deaktiviert, bis auf dem Server ein fester Update-Webhook oder ein Script-Pfad hinterlegt ist.
            </span>
          </div>
        )}

        <button
          type="button"
          onClick={handleRunUpdate}
          disabled={!info?.enabled || isPending}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black transition-all disabled:opacity-50 disabled:hover:bg-blue-600 cursor-pointer"
        >
          <RefreshCw size={18} className={isPending ? "animate-spin" : ""} />
          {isPending ? "Update läuft..." : "Update starten"}
        </button>
      </div>

      {message && (
        <div className={`rounded-xl border p-4 text-sm ${
          message.type === "success"
            ? "bg-green-500/10 border-green-500/20 text-green-700"
            : "bg-red-500/10 border-red-500/20 text-red-700"
        }`}>
          <div className="flex items-center gap-2 font-black mb-2">
            {message.type === "success" ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
            {message.text}
          </div>
          {message.log && (
            <pre className="mt-3 max-h-72 overflow-auto whitespace-pre-wrap rounded-lg bg-black/80 text-white p-3 text-xs">
              {message.log}
            </pre>
          )}
        </div>
      )}

      {info?.lastLog && (
        <div className="rounded-xl border border-foreground/10 bg-background p-4">
          <div className="flex items-center gap-2 text-sm font-black mb-3">
            <Terminal size={16} className="text-blue-500" /> Letztes Update-Log
          </div>
          <pre className="max-h-72 overflow-auto whitespace-pre-wrap rounded-lg bg-foreground/5 border border-foreground/10 p-3 text-xs">
            {info.lastLog}
          </pre>
        </div>
      )}
    </div>
  );
}
