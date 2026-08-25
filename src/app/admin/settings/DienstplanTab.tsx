"use client";

import { useState, useTransition } from "react";
import { 
  addGastroEmployee, 
  deleteGastroEmployee, 
  addGastroShiftTime, 
  deleteGastroShiftTime, 
  addGastroArea, 
  deleteGastroArea, 
  addGastroSchedule, 
  deleteGastroSchedule 
} from "@/app/actions/shifts";
import { Users, Clock, MapPin, Calendar, Trash2, Plus, AlertCircle, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";

export function DienstplanTab({
  initialEmployees,
  initialShiftTimes,
  initialAreas,
  initialSchedules
}: {
  initialEmployees: any[];
  initialShiftTimes: any[];
  initialAreas: any[];
  initialSchedules: any[];
}) {
  const [activeSubTab, setActiveSubTab] = useState<"einteilung" | "stammdaten">("einteilung");
  const [isPending, startTransition] = useTransition();
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Data states (locally updated for fast interaction before revalidation)
  const [employees, setEmployees] = useState(initialEmployees);
  const [shiftTimes, setShiftTimes] = useState(initialShiftTimes);
  const [areas, setAreas] = useState(initialAreas);
  const [schedules, setSchedules] = useState(initialSchedules);

  // Form inputs
  const [employeeName, setEmployeeName] = useState("");
  const [shiftName, setShiftName] = useState("");
  const [areaName, setAreaName] = useState("");

  const [scheduleDate, setScheduleDate] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [selectedShift, setSelectedShift] = useState("");
  const [selectedArea, setSelectedArea] = useState("");

  const triggerFeedback = (success: string, error: string) => {
    if (success) {
      setSuccessMsg(success);
      setErrorMsg("");
      setTimeout(() => setSuccessMsg(""), 3000);
    }
    if (error) {
      setErrorMsg(error);
      setSuccessMsg("");
      setTimeout(() => setErrorMsg(""), 4000);
    }
  };

  // Employee Handlers
  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeName.trim()) return;

    startTransition(async () => {
      const res = await addGastroEmployee(employeeName);
      if (res.success && res.employee) {
        setEmployees(prev => [...prev, res.employee].sort((a, b) => a.name.localeCompare(b.name)));
        setEmployeeName("");
        triggerFeedback("Mitarbeiter erfolgreich hinzugefügt!", "");
      } else {
        triggerFeedback("", res.error || "Fehler beim Speichern.");
      }
    });
  };

  const handleDeleteEmployee = async (id: string) => {
    if (!window.confirm("Möchtest du diesen Mitarbeiter wirklich löschen? Alle zugehörigen Schichteinteilungen werden ebenfalls gelöscht.")) return;
    startTransition(async () => {
      const res = await deleteGastroEmployee(id);
      if (res.success) {
        setEmployees(prev => prev.filter(e => e.id !== id));
        setSchedules(prev => prev.filter(s => s.employeeId !== id));
        triggerFeedback("Mitarbeiter gelöscht.", "");
      } else {
        triggerFeedback("", res.error || "Fehler beim Löschen.");
      }
    });
  };

  // Shift Time Handlers
  const handleAddShiftTime = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shiftName.trim()) return;

    startTransition(async () => {
      const res = await addGastroShiftTime(shiftName);
      if (res.success && res.shiftTime) {
        setShiftTimes(prev => [...prev, res.shiftTime].sort((a, b) => a.name.localeCompare(b.name)));
        setShiftName("");
        triggerFeedback("Schichtzeit erfolgreich hinzugefügt!", "");
      } else {
        triggerFeedback("", res.error || "Fehler beim Speichern.");
      }
    });
  };

  const handleDeleteShiftTime = async (id: string) => {
    if (!window.confirm("Schichtzeit wirklich löschen?")) return;
    startTransition(async () => {
      const res = await deleteGastroShiftTime(id);
      if (res.success) {
        setShiftTimes(prev => prev.filter(t => t.id !== id));
        setSchedules(prev => prev.filter(s => s.shiftTimeId !== id));
        triggerFeedback("Schichtzeit gelöscht.", "");
      } else {
        triggerFeedback("", res.error || "Fehler beim Löschen.");
      }
    });
  };

  // Area Handlers
  const handleAddArea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!areaName.trim()) return;

    startTransition(async () => {
      const res = await addGastroArea(areaName);
      if (res.success && res.area) {
        setAreas(prev => [...prev, res.area].sort((a, b) => a.name.localeCompare(b.name)));
        setAreaName("");
        triggerFeedback("Bereich erfolgreich hinzugefügt!", "");
      } else {
        triggerFeedback("", res.error || "Fehler beim Speichern.");
      }
    });
  };

  const handleDeleteArea = async (id: string) => {
    if (!window.confirm("Bereich wirklich löschen?")) return;
    startTransition(async () => {
      const res = await deleteGastroArea(id);
      if (res.success) {
        setAreas(prev => prev.filter(a => a.id !== id));
        setSchedules(prev => prev.filter(s => s.areaId !== id));
        triggerFeedback("Bereich gelöscht.", "");
      } else {
        triggerFeedback("", res.error || "Fehler beim Löschen.");
      }
    });
  };

  // Schedule / Assignment Handlers
  const handleAddSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleDate || !selectedEmployee || !selectedShift || !selectedArea) {
      triggerFeedback("", "Bitte fülle alle vier Schicht-Felder aus.");
      return;
    }

    startTransition(async () => {
      const res = await addGastroSchedule(scheduleDate, selectedEmployee, selectedShift, selectedArea);
      if (res.success && res.schedule) {
        // Enriched local schedule entry
        const enriched = {
          ...res.schedule,
          employee: employees.find(e => e.id === selectedEmployee),
          shiftTime: shiftTimes.find(t => t.id === selectedShift),
          area: areas.find(a => a.id === selectedArea)
        };
        setSchedules(prev => [...prev, enriched].sort((a, b) => a.date.localeCompare(b.date)));
        
        // Reset selections (except date for faster multi-entry)
        setSelectedEmployee("");
        setSelectedShift("");
        setSelectedArea("");
        
        triggerFeedback("Schicht eingetragen!", "");
      } else {
        triggerFeedback("", res.error || "Fehler beim Eintragen der Schicht.");
      }
    });
  };

  const handleDeleteSchedule = async (id: string) => {
    startTransition(async () => {
      const res = await deleteGastroSchedule(id);
      if (res.success) {
        setSchedules(prev => prev.filter(s => s.id !== id));
        triggerFeedback("Einteilung gelöscht.", "");
      } else {
        triggerFeedback("", res.error || "Fehler beim Löschen.");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Messages */}
      {successMsg && (
        <div className="bg-green-500/10 border border-green-500/20 text-green-600 p-4 rounded-xl flex items-center gap-3 animate-fade-in">
          <CheckCircle2 size={20} />
          <span className="font-medium text-sm">{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-600 p-4 rounded-xl flex items-center gap-3 animate-fade-in">
          <AlertCircle size={20} />
          <span className="font-medium text-sm">{errorMsg}</span>
        </div>
      )}

      {/* Sub Tabs */}
      <div className="flex border-b border-foreground/10 pb-px gap-6">
        <button
          onClick={() => setActiveSubTab("einteilung")}
          className={`pb-3 font-bold text-sm border-b-2 transition-all ${
            activeSubTab === "einteilung" 
              ? "border-blue-500 text-blue-500" 
              : "border-transparent text-foreground/50 hover:text-foreground/80"
          }`}
        >
          📅 Schichteinteilung
        </button>
        <button
          onClick={() => setActiveSubTab("stammdaten")}
          className={`pb-3 font-bold text-sm border-b-2 transition-all ${
            activeSubTab === "stammdaten" 
              ? "border-blue-500 text-blue-500" 
              : "border-transparent text-foreground/50 hover:text-foreground/80"
          }`}
        >
          ⚙️ Mitarbeiter & Stammdaten
        </button>
      </div>

      {/* Roster / Tab 1: Einteilung */}
      {activeSubTab === "einteilung" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-1 glass p-6 rounded-2xl border border-foreground/5 h-fit space-y-4">
            <h3 className="font-bold text-base flex items-center gap-2 mb-2"><Calendar size={18} className="text-blue-500" /> Schicht eintragen</h3>
            <form onSubmit={handleAddSchedule} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-foreground/60 mb-1">Datum</label>
                <input 
                  type="date" 
                  value={scheduleDate} 
                  onChange={e => setScheduleDate(e.target.value)} 
                  className="w-full bg-background border border-foreground/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground/60 mb-1">Mitarbeiter</label>
                <select
                  value={selectedEmployee}
                  onChange={e => setSelectedEmployee(e.target.value)}
                  className="w-full bg-background border border-foreground/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  required
                >
                  <option value="">Wählen...</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground/60 mb-1">Schichtzeit</label>
                <select
                  value={selectedShift}
                  onChange={e => setSelectedShift(e.target.value)}
                  className="w-full bg-background border border-foreground/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  required
                >
                  <option value="">Wählen...</option>
                  {shiftTimes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground/60 mb-1">Bereich</label>
                <select
                  value={selectedArea}
                  onChange={e => setSelectedArea(e.target.value)}
                  className="w-full bg-background border border-foreground/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  required
                >
                  <option value="">Wählen...</option>
                  {areas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>

              <button
                type="submit"
                disabled={isPending || !scheduleDate || !selectedEmployee || !selectedShift || !selectedArea}
                className="w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-bold py-2 rounded-xl text-sm transition-all shadow-md shadow-blue-500/10 flex items-center justify-center gap-1 cursor-pointer"
              >
                <Plus size={16} /> Eintragen
              </button>
            </form>
          </div>

          {/* List */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="font-bold text-base">Einteilungen am {scheduleDate ? format(new Date(scheduleDate), "dd.MM.yyyy") : ""}</h3>
            
            {/* Filtered by currently selected date */}
            {(() => {
              const todaysSchedules = schedules.filter(s => s.date === scheduleDate);
              if (todaysSchedules.length === 0) {
                return (
                  <div className="p-8 text-center text-foreground/50 border border-dashed border-foreground/10 rounded-2xl">
                    Keine Schichten für diesen Tag eingetragen.
                  </div>
                );
              }

              return (
                <div className="grid gap-2">
                  {todaysSchedules.map(s => (
                    <div key={s.id} className="flex justify-between items-center bg-foreground/5 border border-foreground/5 p-4 rounded-xl">
                      <div className="grid grid-cols-3 gap-4 flex-1 text-sm font-medium">
                        <div>👤 <strong className="text-foreground/90">{s.employee?.name}</strong></div>
                        <div className="text-foreground/60">⏰ {s.shiftTime?.name}</div>
                        <div className="text-foreground/60">📍 {s.area?.name}</div>
                      </div>
                      <button
                        onClick={() => handleDeleteSchedule(s.id)}
                        disabled={isPending}
                        className="text-red-500 hover:bg-red-500/10 p-2 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              );
            })()}

            {/* Upcoming schedules */}
            <div className="mt-8 border-t border-foreground/10 pt-6">
              <h3 className="font-bold text-base mb-4">Kommende Schichten</h3>
              {(() => {
                const upcoming = schedules.filter(s => s.date >= format(new Date(), "yyyy-MM-dd") && s.date !== scheduleDate);
                if (upcoming.length === 0) {
                  return <p className="text-sm text-foreground/40 italic">Keine weiteren anstehenden Einteilungen.</p>;
                }
                
                return (
                  <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2" style={{ scrollbarWidth: 'thin' }}>
                    {upcoming.map(s => (
                      <div key={s.id} className="flex justify-between items-center bg-foreground/5 border border-foreground/5 p-3 rounded-xl text-xs">
                        <div className="grid grid-cols-4 gap-2 flex-1 font-medium items-center">
                          <div className="text-blue-500 font-bold">{format(new Date(s.date), "dd.MM.yy (EEEE)", { locale: de })}</div>
                          <div>👤 <strong>{s.employee?.name}</strong></div>
                          <div className="text-foreground/60">⏰ {s.shiftTime?.name}</div>
                          <div className="text-foreground/60">📍 {s.area?.name}</div>
                        </div>
                        <button
                          onClick={() => handleDeleteSchedule(s.id)}
                          disabled={isPending}
                          className="text-red-500 hover:bg-red-500/10 p-1.5 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>

          </div>
        </div>
      )}

      {/* Stammdaten / Tab 2: Mitarbeiter, Schichten, Bereiche */}
      {activeSubTab === "stammdaten" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Employee manager */}
          <div className="glass p-6 rounded-2xl border border-foreground/5 space-y-4">
            <h3 className="font-bold text-base flex items-center gap-2 border-b pb-2"><Users size={16} className="text-blue-500" /> Mitarbeiter</h3>
            <form onSubmit={handleAddEmployee} className="flex gap-2">
              <input 
                type="text" 
                placeholder="Name..." 
                value={employeeName} 
                onChange={e => setEmployeeName(e.target.value)} 
                className="flex-1 bg-background border border-foreground/10 rounded-xl px-3 py-2 text-sm focus:outline-none"
              />
              <button type="submit" disabled={isPending} className="bg-blue-500 hover:bg-blue-600 text-white p-2.5 rounded-xl text-sm font-bold flex items-center shrink-0 cursor-pointer">
                <Plus size={16} />
              </button>
            </form>
            <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
              {employees.length === 0 ? (
                <p className="text-xs text-foreground/40 italic">Keine Einträge.</p>
              ) : (
                employees.map(e => (
                  <div key={e.id} className="flex justify-between items-center text-sm py-1 border-b border-foreground/5">
                    <span>{e.name}</span>
                    <button onClick={() => handleDeleteEmployee(e.id)} className="text-red-500 hover:bg-red-500/10 p-1 rounded transition-all">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Shift Time manager */}
          <div className="glass p-6 rounded-2xl border border-foreground/5 space-y-4">
            <h3 className="font-bold text-base flex items-center gap-2 border-b pb-2"><Clock size={16} className="text-blue-500" /> Schichtzeiten</h3>
            <form onSubmit={handleAddShiftTime} className="flex gap-2">
              <input 
                type="text" 
                placeholder="z.B. Früh (10-14)..." 
                value={shiftName} 
                onChange={e => setShiftName(e.target.value)} 
                className="flex-1 bg-background border border-foreground/10 rounded-xl px-3 py-2 text-sm focus:outline-none"
              />
              <button type="submit" disabled={isPending} className="bg-blue-500 hover:bg-blue-600 text-white p-2.5 rounded-xl text-sm font-bold flex items-center shrink-0 cursor-pointer">
                <Plus size={16} />
              </button>
            </form>
            <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
              {shiftTimes.length === 0 ? (
                <p className="text-xs text-foreground/40 italic">Keine Einträge.</p>
              ) : (
                shiftTimes.map(t => (
                  <div key={t.id} className="flex justify-between items-center text-sm py-1 border-b border-foreground/5">
                    <span>{t.name}</span>
                    <button onClick={() => handleDeleteShiftTime(t.id)} className="text-red-500 hover:bg-red-500/10 p-1 rounded transition-all">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Area manager */}
          <div className="glass p-6 rounded-2xl border border-foreground/5 space-y-4">
            <h3 className="font-bold text-base flex items-center gap-2 border-b pb-2"><MapPin size={16} className="text-blue-500" /> Bereiche</h3>
            <form onSubmit={handleAddArea} className="flex gap-2">
              <input 
                type="text" 
                placeholder="z.B. Service..." 
                value={areaName} 
                onChange={e => setAreaName(e.target.value)} 
                className="flex-1 bg-background border border-foreground/10 rounded-xl px-3 py-2 text-sm focus:outline-none"
              />
              <button type="submit" disabled={isPending} className="bg-blue-500 hover:bg-blue-600 text-white p-2.5 rounded-xl text-sm font-bold flex items-center shrink-0 cursor-pointer">
                <Plus size={16} />
              </button>
            </form>
            <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
              {areas.length === 0 ? (
                <p className="text-xs text-foreground/40 italic">Keine Einträge.</p>
              ) : (
                areas.map(a => (
                  <div key={a.id} className="flex justify-between items-center text-sm py-1 border-b border-foreground/5">
                    <span>{a.name}</span>
                    <button onClick={() => handleDeleteArea(a.id)} className="text-red-500 hover:bg-red-500/10 p-1 rounded transition-all">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
