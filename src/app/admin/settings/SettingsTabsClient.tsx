"use client";

import { useState } from "react";
import { SettingsForm } from "./SettingsForm";
import { DienstplanTab } from "./DienstplanTab";
import { UpdateTab } from "./UpdateTab";
import { Calendar, Mail, RefreshCw } from "lucide-react";

type SettingsTab = "smtp" | "dienstplan" | "update";

export function SettingsTabsClient({
  smtpData,
  rosterData,
  initialTab = "smtp"
}: {
  smtpData: {
    host: string;
    port: string;
    user: string;
    pass: string;
    from: string;
  };
  rosterData: {
    employees: any[];
    shiftTimes: any[];
    areas: any[];
    schedules: any[];
  };
  initialTab?: SettingsTab;
}) {
  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab);

  return (
    <div className="space-y-8">
      {/* Tab Switcher */}
      <div className="flex gap-4 p-1.5 bg-foreground/5 rounded-2xl w-fit">
        <button
          onClick={() => setActiveTab("smtp")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
            activeTab === "smtp"
              ? "bg-blue-500 text-white shadow-md shadow-blue-500/10"
              : "text-foreground/60 hover:text-foreground hover:bg-foreground/5"
          }`}
        >
          <Mail size={16} /> SMTP E-Mail
        </button>
        <button
          onClick={() => setActiveTab("dienstplan")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
            activeTab === "dienstplan"
              ? "bg-blue-500 text-white shadow-md shadow-blue-500/10"
              : "text-foreground/60 hover:text-foreground hover:bg-foreground/5"
          }`}
        >
          <Calendar size={16} /> Dienstplan (Gastro)
        </button>
        <button
          onClick={() => setActiveTab("update")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
            activeTab === "update"
              ? "bg-blue-500 text-white shadow-md shadow-blue-500/10"
              : "text-foreground/60 hover:text-foreground hover:bg-foreground/5"
          }`}
        >
          <RefreshCw size={16} /> System-Update
        </button>
      </div>

      {/* SMTP tab content */}
      {activeTab === "smtp" && (
        <div className="glass p-8 rounded-3xl border border-foreground/5 animate-fade-in">
          <div className="flex items-center gap-3 mb-6 pb-6 border-b border-foreground/10">
            <div className="bg-blue-500/10 p-3 rounded-xl text-blue-500">
              <Mail size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold">SMTP Konfiguration</h2>
              <p className="text-sm text-foreground/50">Wird für den automatischen Versand von Bestätigungsmails an Kunden benötigt.</p>
            </div>
          </div>

          <SettingsForm 
            initialHost={smtpData.host}
            initialPort={smtpData.port}
            initialUser={smtpData.user}
            initialPass={smtpData.pass}
            initialFrom={smtpData.from}
          />
        </div>
      )}

      {/* Dienstplan tab content */}
      {activeTab === "dienstplan" && (
        <div className="glass p-8 rounded-3xl border border-foreground/5 animate-fade-in">
          <div className="flex items-center gap-3 mb-6 pb-6 border-b border-foreground/10">
            <div className="bg-blue-500/10 p-3 rounded-xl text-blue-500">
              <Calendar size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold">Dienstplan Gastrobereich</h2>
              <p className="text-sm text-foreground/50">Mitarbeiter verwalten und Schichten einteilen.</p>
            </div>
          </div>

          <DienstplanTab
            initialEmployees={rosterData.employees}
            initialShiftTimes={rosterData.shiftTimes}
            initialAreas={rosterData.areas}
            initialSchedules={rosterData.schedules}
          />
        </div>
      )}

      {activeTab === "update" && (
        <div className="glass p-8 rounded-3xl border border-foreground/5 animate-fade-in">
          <div className="flex items-center gap-3 mb-6 pb-6 border-b border-foreground/10">
            <div className="bg-blue-500/10 p-3 rounded-xl text-blue-500">
              <RefreshCw size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold">System-Update</h2>
              <p className="text-sm text-foreground/50">Startet den fest hinterlegten Update-Ablauf und zeigt das letzte Ergebnis.</p>
            </div>
          </div>

          <UpdateTab />
        </div>
      )}
    </div>
  );
}
