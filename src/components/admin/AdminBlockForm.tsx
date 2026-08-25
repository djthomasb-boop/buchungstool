"use client";

import { useState } from "react";
import { addBlockedDay, addBlockedDayRange, deleteBlockedDay } from "@/app/actions/admin";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { Trash2, AlertCircle, PlusCircle, Calendar as CalIcon } from "lucide-react";

export function AdminBlockForm({ blockedDays }: { blockedDays: any[] }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [mode, setMode] = useState<"single" | "range">("single");
  const [weekdays, setWeekdays] = useState<number[]>([1, 2, 3, 4, 5, 6]); // Mon-Sat preselected

  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg("");
    setSuccessMsg("");

    const formData = new FormData(e.currentTarget);
    const type = formData.get("type") as string;
    const action = formData.get("action") as string;
    const reason = formData.get("reason") as string;
    const startTime = formData.get("startTime") as string || undefined;
    const endTime = formData.get("endTime") as string || undefined;

    if (mode === "single") {
      const date = formData.get("date") as string;
      if (!date || !type) {
        setErrorMsg("Bitte Datum und Bereich auswählen.");
        setIsSubmitting(false);
        return;
      }

      const res = await addBlockedDay({
        date,
        type,
        action,
        reason,
        startTime,
        endTime
      });

      if (res.success) {
        setSuccessMsg("Eintrag erfolgreich hinzugefügt!");
        (e.target as HTMLFormElement).reset();
      } else {
        setErrorMsg(res.error || "Fehler beim Hinzufügen.");
      }
    } else {
      const startDate = formData.get("startDate") as string;
      const endDate = formData.get("endDate") as string;
      if (!startDate || !endDate || !type) {
        setErrorMsg("Bitte Start- und Enddatum auswählen.");
        setIsSubmitting(false);
        return;
      }
      if (weekdays.length === 0) {
        setErrorMsg("Bitte mindestens einen Wochentag auswählen.");
        setIsSubmitting(false);
        return;
      }

      const res = await addBlockedDayRange({
        startDate,
        endDate,
        weekdays,
        type,
        action,
        reason,
        startTime,
        endTime
      });

      if (res.success) {
        setSuccessMsg(res.message || "Einträge erfolgreich hinzugefügt!");
        (e.target as HTMLFormElement).reset();
      } else {
        setErrorMsg(res.error || "Fehler beim Hinzufügen.");
      }
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Diese Sperre wirklich aufheben?")) {
      const res = await deleteBlockedDay(id);
      if (!res.success) {
        alert(res.error || "Fehler beim Löschen.");
      }
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "all": return "Komplettes Haus";
      case "bowling": return "Bowling";
      case "kidsworld": return "Kids.World";
      case "squash": return "Squash";
      case "event": return "Events";
      default: return type;
    }
  };

  return (
    <div className="grid md:grid-cols-2 gap-8">
      {/* Formular */}
      <div className="glass p-8 rounded-3xl border border-foreground/10">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          <PlusCircle className="text-blue-500" /> Neue Tages-Regel anlegen
        </h2>
        
        <form onSubmit={handleAdd} className="space-y-4">
          <div>
            <label className="block text-sm font-bold mb-2">Modus</label>
            <div className="flex bg-background border border-foreground/10 rounded-xl p-1">
              <button
                type="button"
                onClick={() => setMode("single")}
                className={`flex-1 py-2 text-center text-xs font-bold rounded-lg transition-all ${
                  mode === "single"
                    ? "bg-blue-500 text-white shadow"
                    : "text-foreground/60 hover:text-foreground"
                }`}
              >
                Einzelner Tag
              </button>
              <button
                type="button"
                onClick={() => setMode("range")}
                className={`flex-1 py-2 text-center text-xs font-bold rounded-lg transition-all ${
                  mode === "range"
                    ? "bg-blue-500 text-white shadow"
                    : "text-foreground/60 hover:text-foreground"
                }`}
              >
                Zeitraum (z. B. Ferien)
              </button>
            </div>
          </div>

          {mode === "single" ? (
            <div>
              <label className="block text-sm font-bold mb-2">Datum</label>
              <input type="date" name="date" required className="w-full bg-background border border-foreground/10 rounded-xl px-4 py-3" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-2">Start-Datum</label>
                  <input type="date" name="startDate" required className="w-full bg-background border border-foreground/10 rounded-xl px-4 py-3" />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2">End-Datum</label>
                  <input type="date" name="endDate" required className="w-full bg-background border border-foreground/10 rounded-xl px-4 py-3" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold mb-2">Wochentage</label>
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                  {[
                    { label: "Mo", value: 1 },
                    { label: "Di", value: 2 },
                    { label: "Mi", value: 3 },
                    { label: "Do", value: 4 },
                    { label: "Fr", value: 5 },
                    { label: "Sa", value: 6 },
                    { label: "So", value: 0 },
                  ].map((d) => (
                    <label
                      key={d.value}
                      className={`flex items-center justify-center p-2 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                        weekdays.includes(d.value)
                          ? "border-blue-500 bg-blue-500/10 text-blue-500"
                          : "border-foreground/10 hover:border-blue-500/30 text-foreground/70"
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="hidden"
                        checked={weekdays.includes(d.value)}
                        onChange={() => {
                          setWeekdays((prev) =>
                            prev.includes(d.value)
                              ? prev.filter((x) => x !== d.value)
                              : [...prev, d.value]
                          );
                        }}
                      />
                      {d.label}
                    </label>
                  ))}
                </div>
              </div>
            </>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold mb-2">Uhrzeit von (optional)</label>
              <input
                type="time"
                name="startTime"
                className="w-full bg-background border border-foreground/10 rounded-xl px-4 py-3"
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-2">Uhrzeit bis (optional)</label>
              <input
                type="time"
                name="endTime"
                className="w-full bg-background border border-foreground/10 rounded-xl px-4 py-3"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold mb-2">Bereich</label>
            <select name="type" required className="w-full bg-background border border-foreground/10 rounded-xl px-4 py-3">
              <option value="all">Komplettes Haus (Alle Bereiche)</option>
              <option value="bowling">Bowling</option>
              <option value="kidsworld">Kindergeburtstag</option>
              <option value="squash">Squash</option>
              <option value="event">Events</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold mb-2">Art der Regel</label>
            <select name="action" required className="w-full bg-background border border-foreground/10 rounded-xl px-4 py-3">
              <option value="block">🚫 Geschlossen (Sperrzeit)</option>
              <option value="open">✅ Geöffnet (Sonderöffnung, z.B. Feiertag)</option>
            </select>
            <p className="text-xs text-foreground/50 mt-1">
              "Geöffnet" überschreibt die regulären Schließtage (z.B. für Kindergeburtstage am Sonntag).
            </p>
          </div>

          <div>
            <label className="block text-sm font-bold mb-2">Grund (Sichtbar für Kunden)</label>
            <input 
              type="text" 
              name="reason" 
              placeholder="z.B. Großes Sommerfest, Geschlossene Gesellschaft..." 
              className="w-full bg-background border border-foreground/10 rounded-xl px-4 py-3" 
            />
            <p className="text-xs text-foreground/50 mt-1">
              Dieser Text wird dem Kunden angezeigt, wenn er versucht an diesem Tag zu buchen.
            </p>
          </div>

          {errorMsg && (
            <div className="bg-red-500/10 text-red-600 p-3 rounded-lg text-sm font-medium border border-red-500/20">
              {errorMsg}
            </div>
          )}
          
          {successMsg && (
            <div className="bg-green-500/10 text-green-600 p-3 rounded-lg text-sm font-medium border border-green-500/20">
              {successMsg}
            </div>
          )}

          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50 mt-4"
          >
            {isSubmitting ? "Speichert..." : "Regel aktivieren"}
          </button>
        </form>
      </div>

      {/* Liste */}
      <div>
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          <CalIcon className="text-foreground/50" /> Aktive Sperrzeiten
        </h2>

        {blockedDays.length === 0 ? (
          <div className="bg-foreground/5 border border-foreground/10 p-8 rounded-2xl text-center text-foreground/50">
            Es sind aktuell keine Sperrzeiten hinterlegt.
          </div>
        ) : (
          <div className="space-y-4">
            {blockedDays.map((block) => (
              <div key={block.id} className="bg-background border border-foreground/10 p-5 rounded-2xl flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center shadow-sm">
                <div>
                  <div className="font-bold text-lg">
                    {format(new Date(block.date), "dd. MMMM yyyy", { locale: de })}
                  </div>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${block.action === 'open' ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'}`}>
                      {block.action === 'open' ? 'Sonderöffnung' : 'Sperrzeit'}: {getTypeLabel(block.type)}
                      {block.startTime && block.endTime ? ` (${block.startTime} - ${block.endTime} Uhr)` : ""}
                    </span>
                    {block.reason && (
                      <span className="text-sm text-foreground/60 flex items-center gap-1">
                        <AlertCircle size={14} /> {block.reason}
                      </span>
                    )}
                  </div>
                </div>
                <button 
                  onClick={() => handleDelete(block.id)}
                  className="bg-red-500/10 hover:bg-red-500/20 text-red-600 p-2 rounded-lg transition-colors"
                  title="Sperre aufheben"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
