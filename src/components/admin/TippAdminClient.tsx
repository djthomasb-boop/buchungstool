"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  saveTippSetting, 
  syncMatchesFromOpenLigaDB, 
  seedSampleMatches, 
  updateMatchScoreManually,
  deleteTestMatches,
  resetTippspielCompletely,
  evaluateChampionPrediction,
  verifyMembersViaCSV,
  toggleMemberVerification,
  deleteTippUser,
  resetTippUserPin
} from "@/app/actions/tipp";
import { 
  Save, 
  RefreshCw, 
  Database, 
  Settings as SettingsIcon, 
  Check, 
  AlertTriangle,
  Calendar,
  Trash2,
  Trophy,
  Upload,
  Users,
  UserCheck,
  UserX,
  Search,
  Key,
  Printer
} from "lucide-react";

interface UserPrediction {
  id: string;
  userId: string;
  matchId: string;
  homeScore: number;
  awayScore: number;
  points: number | null;
}

interface TippUser {
  id: string;
  nickname: string;
  totalPoints: number;
  championPrediction: string | null;
  championPoints: number;
  email: string | null;
  phone: string | null;
  isMember: boolean;
  isMemberVerified: boolean;
  predictions: UserPrediction[];
}

interface Match {
  id: string;
  openLigaMatchId: number | null;
  teamHome: string;
  teamAway: string;
  logoHome: string | null;
  logoAway: string | null;
  dateTime: string;
  groupName: string;
  scoreHome: number | null;
  scoreAway: number | null;
  isFinished: boolean;
}

interface Settings {
  active: boolean;
  league: string;
  season: string;
}

interface TippAdminClientProps {
  initialMatches: Match[];
  initialSettings: Settings;
  uniqueTeams: string[];
  initialUsers: TippUser[];
}

export default function TippAdminClient({
  initialMatches,
  initialSettings,
  uniqueTeams = [],
  initialUsers = [],
}: TippAdminClientProps) {
  const router = useRouter();

  // Navigation states
  const [activeTab, setActiveTab] = useState<"matches" | "users">("matches");

  // Participant search/filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [onlyPendingVerification, setOnlyPendingVerification] = useState(false);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});

  // Settings states
  const [active, setActive] = useState(initialSettings.active);
  const [league, setLeague] = useState(initialSettings.league);
  const [season, setSeason] = useState(initialSettings.season);
  const [settingsStatus, setSettingsStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  // Sync & Seed states
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState("");
  const [syncErr, setSyncErr] = useState("");
  
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedMsg, setSeedMsg] = useState("");
  
  const [isDeletingTest, setIsDeletingTest] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Match edit states
  const [matchData, setMatchData] = useState<Record<string, { home: string; away: string; finished: boolean }>>(() => {
    const map: Record<string, { home: string; away: string; finished: boolean }> = {};
    initialMatches.forEach((m) => {
      map[m.id] = {
        home: m.scoreHome !== null ? m.scoreHome.toString() : "",
        away: m.scoreAway !== null ? m.scoreAway.toString() : "",
        finished: m.isFinished,
      };
    });
    return map;
  });

  const [matchStatus, setMatchStatus] = useState<Record<string, "idle" | "saving" | "saved" | "error">>({});

  // Weltmeister evaluation states
  const [selectedWinner, setSelectedWinner] = useState("");
  const [bonusPoints, setBonusPoints] = useState(5);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evalStatus, setEvalStatus] = useState<"idle" | "success" | "error">("idle");
  const [evalMsg, setEvalMsg] = useState("");

  // CSV Import states
  const [isVerifyingCSV, setIsVerifyingCSV] = useState(false);
  const [csvStatus, setCsvStatus] = useState<"idle" | "success" | "error">("idle");
  const [csvMsg, setCsvMsg] = useState("");

  // Save Settings
  const handleSaveSettings = async () => {
    setSettingsStatus("saving");
    try {
      const res1 = await saveTippSetting("TIPPSPIEL_ACTIVE", active ? "true" : "false");
      const res2 = await saveTippSetting("TIPPSPIEL_LEAGUE", league.trim());
      const res3 = await saveTippSetting("TIPPSPIEL_SEASON", season.trim());

      if (res1.success && res2.success && res3.success) {
        setSettingsStatus("saved");
        setTimeout(() => setSettingsStatus("idle"), 2000);
        router.refresh();
      } else {
        setSettingsStatus("error");
      }
    } catch (err) {
      console.error(err);
      setSettingsStatus("error");
    }
  };

  // Sync OpenLigaDB
  const handleSync = async () => {
    setIsSyncing(true);
    setSyncMsg("");
    setSyncErr("");
    try {
      const res = await syncMatchesFromOpenLigaDB();
      if (res.success) {
        setSyncMsg(res.message || "Erfolgreich synchronisiert!");
        router.refresh();
      } else {
        setSyncErr(res.error || "Synchronisation fehlgeschlagen.");
      }
    } catch (err) {
      console.error(err);
      setSyncErr("Netzwerkfehler.");
    } finally {
      setIsSyncing(false);
    }
  };

  // Seed test matches
  const handleSeed = async () => {
    setIsSeeding(true);
    setSeedMsg("");
    try {
      const res = await seedSampleMatches();
      if (res.success) {
        setSeedMsg(`${res.count} Testspiele erfolgreich hinzugefügt!`);
        router.refresh();
      } else {
        setSeedMsg("Fehler beim Seeden.");
      }
    } catch (err) {
      console.error(err);
      setSeedMsg("Seeden fehlgeschlagen.");
    } finally {
      setIsSeeding(false);
    }
  };

  // Delete test matches
  const handleDeleteTest = async () => {
    if (!confirm("Möchtest du wirklich alle geseedeten Testspiele (Spiele ohne OpenLigaDB ID) und deren abgegebene Tipps löschen?")) {
      return;
    }
    setIsDeletingTest(true);
    setSeedMsg("");
    try {
      const res = await deleteTestMatches();
      if (res.success) {
        setSeedMsg(`${res.count} Testspiele erfolgreich gelöscht!`);
        router.refresh();
      } else {
        setSeedMsg(res.error || "Fehler beim Löschen.");
      }
    } catch (err) {
      console.error(err);
      setSeedMsg("Löschen fehlgeschlagen.");
    } finally {
      setIsDeletingTest(false);
    }
  };

  // Reset Tippspiel completely
  const handleResetCompletely = async () => {
    if (!confirm("WARNUNG: Möchtest du das Tippspiel komplett zurücksetzen? Alle Benutzer, Tipps und Spiele werden unwiderruflich gelöscht!")) {
      return;
    }
    setIsResetting(true);
    setSeedMsg("");
    try {
      const res = await resetTippspielCompletely();
      if (res.success) {
        setSeedMsg("Tippspiel erfolgreich komplett zurückgesetzt!");
        router.refresh();
      } else {
        setSeedMsg(res.error || "Fehler beim Zurücksetzen.");
      }
    } catch (err) {
      console.error(err);
      setSeedMsg("Zurücksetzen fehlgeschlagen.");
    } finally {
      setIsResetting(false);
    }
  };

  // Evaluate Weltmeister
  const handleEvaluateWeltmeister = async () => {
    if (!selectedWinner) return;
    setIsEvaluating(true);
    setEvalStatus("idle");
    setEvalMsg("");
    try {
      const res = await evaluateChampionPrediction(selectedWinner, bonusPoints);
      if (res.success) {
        setEvalStatus("success");
        setEvalMsg(`Weltmeister erfolgreich auf "${selectedWinner}" gesetzt und Punkte vergeben.`);
        router.refresh();
      } else {
        setEvalStatus("error");
        setEvalMsg(res.error || "Fehler bei der Auswertung.");
      }
    } catch (err) {
      console.error(err);
      setEvalStatus("error");
      setEvalMsg("Netzwerkfehler.");
    } finally {
      setIsEvaluating(false);
    }
  };

  // Handle CSV file upload & parsing
  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsVerifyingCSV(true);
    setCsvStatus("idle");
    setCsvMsg("");

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      try {
        const res = await verifyMembersViaCSV(text);
        if (res.success) {
          setCsvStatus("success");
          setCsvMsg(`Erfolg: ${res.verifiedCount} von ${res.totalChecked} ausstehenden Tippern wurden erfolgreich verifiziert!`);
          router.refresh();
        } else {
          setCsvStatus("error");
          setCsvMsg(res.error || "Fehler beim Abgleich.");
        }
      } catch (err) {
        console.error(err);
        setCsvStatus("error");
        setCsvMsg("Server- oder Netzwerkfehler.");
      } finally {
        setIsVerifyingCSV(false);
        e.target.value = "";
      }
    };

    reader.onerror = () => {
      setCsvStatus("error");
      setCsvMsg("Fehler beim Lesen der Datei.");
      setIsVerifyingCSV(false);
      e.target.value = "";
    };

    reader.readAsText(file);
  };

  // Handle manual player verification toggle
  const handleToggleVerification = async (userId: string, currentStatus: boolean) => {
    setActionLoading((prev) => ({ ...prev, [userId]: true }));
    try {
      const res = await toggleMemberVerification(userId, !currentStatus);
      if (res.success) {
        router.refresh();
      } else {
        alert(res.error || "Fehler beim Aktualisieren.");
      }
    } catch (err) {
      console.error(err);
      alert("Netzwerkfehler.");
    } finally {
      setActionLoading((prev) => ({ ...prev, [userId]: false }));
    }
  };

  // Handle deleting a player
  const handleDeleteUser = async (userId: string, nickname: string) => {
    if (!confirm(`Möchtest du den Tipper "${nickname}" wirklich unwiderruflich löschen? Alle abgegebenen Tipps dieses Nutzers gehen dabei verloren.`)) {
      return;
    }
    setActionLoading((prev) => ({ ...prev, [userId]: true }));
    try {
      const res = await deleteTippUser(userId);
      if (res.success) {
        router.refresh();
      } else {
        alert(res.error || "Fehler beim Löschen.");
      }
    } catch (err) {
      console.error(err);
      alert("Netzwerkfehler.");
    } finally {
      setActionLoading((prev) => ({ ...prev, [userId]: false }));
    }
  };

  // Handle resetting user PIN
  const handleResetPin = async (userId: string, nickname: string) => {
    const newPin = prompt(`Neue PIN für den Tipper "${nickname}" eingeben (mind. 4 Zeichen):`);
    if (newPin === null) return;
    if (newPin.trim().length < 4) {
      alert("Die PIN muss mindestens 4 Zeichen lang sein.");
      return;
    }

    setActionLoading((prev) => ({ ...prev, [userId]: true }));
    try {
      const res = await resetTippUserPin(userId, newPin.trim());
      if (res.success) {
        alert(`Die PIN für "${nickname}" wurde erfolgreich auf "${newPin.trim()}" zurückgesetzt.`);
        router.refresh();
      } else {
        alert(res.error || "Fehler beim Zurücksetzen der PIN.");
      }
    } catch (err) {
      console.error(err);
      alert("Netzwerkfehler.");
    } finally {
      setActionLoading((prev) => ({ ...prev, [userId]: false }));
    }
  };

  // Handle score updates
  const handleScoreInputChange = (matchId: string, team: "home" | "away", value: string) => {
    const cleanValue = value.replace(/\D/g, "");
    setMatchData((prev) => ({
      ...prev,
      [matchId]: {
        ...prev[matchId],
        [team]: cleanValue,
      },
    }));
    if (matchStatus[matchId] === "saved" || matchStatus[matchId] === "error") {
      setMatchStatus((prev) => ({ ...prev, [matchId]: "idle" }));
    }
  };

  const handleFinishedChange = (matchId: string, checked: boolean) => {
    setMatchData((prev) => ({
      ...prev,
      [matchId]: {
        ...prev[matchId],
        finished: checked,
      },
    }));
    if (matchStatus[matchId] === "saved" || matchStatus[matchId] === "error") {
      setMatchStatus((prev) => ({ ...prev, [matchId]: "idle" }));
    }
  };

  const handleSaveMatch = async (matchId: string) => {
    const data = matchData[matchId];
    if (!data) return;

    setMatchStatus((prev) => ({ ...prev, [matchId]: "saving" }));

    const scoreHome = data.home === "" ? null : parseInt(data.home, 10);
    const scoreAway = data.away === "" ? null : parseInt(data.away, 10);

    try {
      const res = await updateMatchScoreManually(
        matchId,
        scoreHome,
        scoreAway,
        data.finished
      );

      if (res.success) {
        setMatchStatus((prev) => ({ ...prev, [matchId]: "saved" }));
        setTimeout(() => {
          setMatchStatus((prev) => ({ ...prev, [matchId]: "idle" }));
        }, 2000);
        router.refresh();
      } else {
        setMatchStatus((prev) => ({ ...prev, [matchId]: "error" }));
      }
    } catch (err) {
      console.error(err);
      setMatchStatus((prev) => ({ ...prev, [matchId]: "error" }));
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("de-DE", {
      timeZone: "Europe/Berlin",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }) + " Uhr";
  };

  // Filter users based on search query and status checkbox
  const filteredUsers = initialUsers.filter((u) => {
    const query = searchQuery.trim().toLowerCase();
    const matchesQuery = 
      !query || 
      u.nickname.toLowerCase().includes(query) || 
      (u.email && u.email.toLowerCase().includes(query)) || 
      (u.phone && u.phone.toLowerCase().includes(query));

    if (!matchesQuery) return false;

    if (onlyPendingVerification) {
      if (!u.isMember || u.isMemberVerified) return false;
    }

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Tab Controls */}
      <div className="flex border-b border-foreground/10 pb-1">
        <button
          onClick={() => setActiveTab("matches")}
          className={`flex items-center gap-2 px-6 py-3 font-bold text-base sm:text-lg border-b-2 transition-all duration-200 cursor-pointer ${
            activeTab === "matches"
              ? "border-[#f23529] text-foreground font-black"
              : "border-transparent text-foreground/50 hover:text-foreground"
          }`}
        >
          <Calendar size={18} />
          Spiele & Einstellungen
        </button>
        <button
          onClick={() => setActiveTab("users")}
          className={`flex items-center gap-2 px-6 py-3 font-bold text-base sm:text-lg border-b-2 transition-all duration-200 cursor-pointer ${
            activeTab === "users"
              ? "border-[#f23529] text-foreground font-black"
              : "border-transparent text-foreground/50 hover:text-foreground"
          }`}
        >
          <Users size={18} />
          Teilnehmer-Auswertung ({initialUsers.length})
        </button>
      </div>

      {activeTab === "matches" ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-slide-up">
          {/* Left Sidebar: Settings & Actions */}
          <div className="lg:col-span-1 space-y-6">
            {/* Settings Card */}
            <div className="glass p-6 rounded-3xl border border-foreground/5 space-y-4">
              <div className="flex items-center gap-2 border-b border-foreground/5 pb-3">
                <SettingsIcon size={20} className="text-blue-500" />
                <h3 className="font-bold text-lg">Tippspiel-Einstellungen</h3>
              </div>

              <div className="space-y-4">
                {/* Active Toggle */}
                <div className="flex items-center justify-between">
                  <div>
                    <label className="font-bold text-sm block">Tippspiel Aktivieren</label>
                    <span className="text-xs text-foreground/50">Für Gäste und Navigation anzeigen</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={(e) => {
                      setActive(e.target.checked);
                      setSettingsStatus("idle");
                    }}
                    className="w-5 h-5 accent-blue-500 cursor-pointer"
                  />
                </div>

                {/* League Shortcut */}
                <div>
                  <label className="font-bold text-sm block mb-1">OpenLigaDB League Shortcut</label>
                  <input
                    type="text"
                    value={league}
                    onChange={(e) => {
                      setLeague(e.target.value);
                      setSettingsStatus("idle");
                    }}
                    placeholder="z.B. dfb-wm26"
                    className="w-full bg-background border border-foreground/10 rounded-xl px-3 py-2 text-sm focus:border-blue-500 outline-none"
                  />
                </div>

                {/* Season */}
                <div>
                  <label className="font-bold text-sm block mb-1">OpenLigaDB Saison</label>
                  <input
                    type="text"
                    value={season}
                    onChange={(e) => {
                      setSeason(e.target.value);
                      setSettingsStatus("idle");
                    }}
                    placeholder="z.B. 2025"
                    className="w-full bg-background border border-foreground/10 rounded-xl px-3 py-2 text-sm focus:border-blue-500 outline-none"
                  />
                </div>

                {/* Save Button */}
                <button
                  onClick={handleSaveSettings}
                  disabled={settingsStatus === "saving"}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {settingsStatus === "saving" ? (
                    "Speichert..."
                  ) : settingsStatus === "saved" ? (
                    <>
                      <Check size={16} /> Gespeichert
                    </>
                  ) : (
                    <>
                      <Save size={16} /> Speichern
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Actions Card */}
            <div className="glass p-6 rounded-3xl border border-foreground/5 space-y-4">
              <div className="flex items-center gap-2 border-b border-foreground/5 pb-3">
                <Database size={20} className="text-purple-500" />
                <h3 className="font-bold text-lg">Daten-Operationen</h3>
              </div>

              <div className="space-y-3">
                {/* Sync Button */}
                <button
                  onClick={handleSync}
                  disabled={isSyncing || !active}
                  className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  <RefreshCw size={16} className={isSyncing ? "animate-spin" : ""} />
                  OpenLigaDB synchronisieren
                </button>

                {/* Seed Button */}
                <button
                  onClick={handleSeed}
                  disabled={isSeeding || !active}
                  className="w-full py-3 bg-foreground/5 hover:bg-foreground/10 border border-foreground/10 text-foreground rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  <Database size={16} />
                  Testspiele seeden
                </button>

                {/* Delete Test Matches Button */}
                <button
                  onClick={handleDeleteTest}
                  disabled={isDeletingTest || !active}
                  className="w-full py-3 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-600 dark:text-amber-500 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  <Trash2 size={16} />
                  Testspiele löschen
                </button>

                {/* Reset Completely Button */}
                <button
                  onClick={handleResetCompletely}
                  disabled={isResetting || !active}
                  className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  <AlertTriangle size={16} />
                  Tippspiel zurücksetzen
                </button>

                {/* Status Messages */}
                {syncMsg && (
                  <div className="p-3 bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 text-xs font-bold rounded-lg text-center">
                    {syncMsg}
                  </div>
                )}
                {syncErr && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold rounded-lg text-center flex items-center justify-center gap-1">
                    <AlertTriangle size={14} />
                    {syncErr}
                  </div>
                )}
                {seedMsg && (
                  <div className="p-3 bg-blue-500/10 border border-blue-500/20 text-blue-500 text-xs font-bold rounded-lg text-center">
                    {seedMsg}
                  </div>
                )}
              </div>
            </div>

            {/* Weltmeister Evaluation Card */}
            <div className="glass p-6 rounded-3xl border border-foreground/5 space-y-4">
              <div className="flex items-center gap-2 border-b border-foreground/5 pb-3">
                <Trophy size={20} className="text-amber-500" />
                <h3 className="font-bold text-lg">Weltmeister auswerten</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="font-bold text-sm block mb-1">Sieger-Team</label>
                  <select
                    value={selectedWinner}
                    onChange={(e) => {
                      setSelectedWinner(e.target.value);
                      setEvalStatus("idle");
                    }}
                    className="w-full bg-background border border-foreground/10 rounded-xl px-3 py-2 text-sm focus:border-blue-500 outline-none font-bold"
                  >
                    <option value="">-- Wähle den Sieger --</option>
                    {uniqueTeams.map((team) => (
                      <option key={team} value={team}>
                        {team}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-sm block mb-1">Bonuspunkte</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={bonusPoints}
                    onChange={(e) => {
                      setBonusPoints(parseInt(e.target.value, 10) || 0);
                      setEvalStatus("idle");
                    }}
                    className="w-full bg-background border border-foreground/10 rounded-xl px-3 py-2 text-sm focus:border-blue-500 outline-none"
                  />
                </div>

                <button
                  onClick={handleEvaluateWeltmeister}
                  disabled={isEvaluating || !selectedWinner}
                  className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  <Trophy size={16} />
                  {isEvaluating ? "Werte aus..." : "Auswerten & Punkte vergeben"}
                </button>

                {evalMsg && (
                  <div className={`p-3 border text-xs font-bold rounded-lg text-center ${
                    evalStatus === "success"
                      ? "bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400"
                      : "bg-red-500/10 border-red-500/20 text-red-500"
                  }`}>
                    {evalMsg}
                  </div>
                )}
              </div>
            </div>

            {/* Mitglieder CSV-Abgleich Card */}
            <div className="glass p-6 rounded-3xl border border-foreground/5 space-y-4">
              <div className="flex items-center gap-2 border-b border-foreground/5 pb-3">
                <Upload size={20} className="text-emerald-500" />
                <h3 className="font-bold text-lg">Mitglieder-CSV abgleichen</h3>
              </div>

              <div className="space-y-4">
                <p className="text-xs text-foreground/60 leading-relaxed">
                  Exportiere eine Mitgliederliste (CSV) aus Magicline und lade sie hier hoch, um angemeldete be free e.V. Mitglieder anhand von E-Mail/Telefonnummer automatisch zu verifizieren.
                </p>

                <div className="relative border-2 border-dashed border-foreground/10 hover:border-emerald-500/30 rounded-2xl p-6 transition-all text-center cursor-pointer group bg-background/20">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleCSVUpload}
                    disabled={isVerifyingCSV}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                  />
                  <div className="flex flex-col items-center justify-center gap-1">
                    <Upload size={24} className="text-foreground/30 group-hover:text-emerald-500 transition-colors" />
                    <span className="text-sm font-bold text-foreground/80">
                      {isVerifyingCSV ? "Verarbeite CSV..." : "CSV-Datei auswählen"}
                    </span>
                    <span className="text-[10px] text-foreground/40 font-medium">
                      Trenntyp: Komma oder Semikolon
                    </span>
                  </div>
                </div>

                {csvMsg && (
                  <div className={`p-3 border text-xs font-bold rounded-lg text-center ${
                    csvStatus === "success"
                      ? "bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400"
                      : "bg-red-500/10 border-red-500/20 text-red-500"
                  }`}>
                    {csvMsg}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Match List & Results */}
          <div className="lg:col-span-2 space-y-6">
            <div className="glass p-6 rounded-3xl border border-foreground/5">
              <div className="flex items-center gap-2 border-b border-foreground/5 pb-4 mb-6">
                <Calendar size={20} className="text-blue-500" />
                <h3 className="font-bold text-lg">Spiele & Ergebnisse ({initialMatches.length})</h3>
              </div>

              <div className="space-y-4 overflow-y-auto max-h-[70vh] pr-2">
                {initialMatches.length === 0 ? (
                  <div className="text-center py-12 text-foreground/50 font-medium">
                    Keine Spiele vorhanden. Klicke auf &quot;Testspiele seeden&quot; oder synce mit OpenLigaDB.
                  </div>
                ) : (
                  initialMatches.map((match) => {
                    const data = matchData[match.id] || { home: "", away: "", finished: false };
                    const status = matchStatus[match.id] || "idle";

                    return (
                      <div
                        key={match.id}
                        className="p-4 bg-background/40 border border-foreground/5 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 transition-all hover:bg-background/60"
                      >
                        {/* Match Info */}
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2 text-xs font-bold text-foreground/50">
                            <span>{match.groupName}</span>
                            <span>•</span>
                            <span>{formatDate(match.dateTime)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm sm:text-base font-black text-foreground">
                            <span>{match.teamHome}</span>
                            <span className="text-foreground/40 font-medium">vs</span>
                            <span>{match.teamAway}</span>
                          </div>
                          {match.openLigaMatchId && (
                            <div className="text-[10px] text-blue-500 font-bold">
                              ID: {match.openLigaMatchId} (OpenLigaDB)
                            </div>
                          )}
                        </div>

                        {/* Results Input */}
                        <div className="flex items-center gap-4 flex-wrap md:flex-nowrap">
                          {/* Inputs */}
                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              maxLength={2}
                              value={data.home}
                              onChange={(e) => handleScoreInputChange(match.id, "home", e.target.value)}
                              placeholder="-"
                              className="w-10 h-10 bg-background border border-foreground/10 rounded-lg text-center font-bold text-sm outline-none focus:border-blue-500"
                            />
                            <span className="text-foreground/30 font-black">:</span>
                            <input
                              type="text"
                              maxLength={2}
                              value={data.away}
                              onChange={(e) => handleScoreInputChange(match.id, "away", e.target.value)}
                              placeholder="-"
                              className="w-10 h-10 bg-background border border-foreground/10 rounded-lg text-center font-bold text-sm outline-none focus:border-blue-500"
                            />
                          </div>

                          {/* Finished Checkbox */}
                          <div className="flex items-center gap-1.5">
                            <input
                              type="checkbox"
                              checked={data.finished}
                              onChange={(e) => handleFinishedChange(match.id, e.target.checked)}
                              id={`finish-${match.id}`}
                              className="w-4 h-4 accent-green-600 cursor-pointer"
                            />
                            <label
                              htmlFor={`finish-${match.id}`}
                              className="text-xs font-bold text-foreground/70 cursor-pointer"
                            >
                              Beendet
                            </label>
                          </div>

                          {/* Save Button */}
                          <button
                            onClick={() => handleSaveMatch(match.id)}
                            disabled={status === "saving"}
                            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer ${
                              status === "saved"
                                ? "bg-green-600 text-white"
                                : status === "saving"
                                ? "bg-foreground/10 text-foreground/50 cursor-not-allowed"
                                : "bg-blue-600 hover:bg-blue-700 text-white"
                            }`}
                          >
                            {status === "saved" ? (
                              <>
                                <Check size={12} /> Saved
                              </>
                            ) : status === "saving" ? (
                              "Saving..."
                            ) : (
                              <>
                                <Save size={12} /> Speichern
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6 animate-slide-up">
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="glass p-5 rounded-2xl border border-foreground/5 bg-blue-500/5">
              <span className="text-xs text-foreground/50 font-bold block mb-1">Teilnehmer gesamt</span>
              <span className="text-2xl font-black text-blue-500">{initialUsers.length}</span>
            </div>
            <div className="glass p-5 rounded-2xl border border-foreground/5 bg-purple-500/5">
              <span className="text-xs text-foreground/50 font-bold block mb-1">Aktive Tipper</span>
              <span className="text-2xl font-black text-purple-500">
                {initialUsers.filter((u) => u.predictions.length > 0).length}
              </span>
            </div>
            <div className="glass p-5 rounded-2xl border border-foreground/5 bg-amber-500/5">
              <span className="text-xs text-foreground/50 font-bold block mb-1">Selbstangemeldete Mitglieder</span>
              <span className="text-2xl font-black text-amber-500">
                {initialUsers.filter((u) => u.isMember).length}
              </span>
            </div>
            <div className="glass p-5 rounded-2xl border border-foreground/5 bg-emerald-500/5">
              <span className="text-xs text-foreground/50 font-bold block mb-1">Verifizierte Mitglieder</span>
              <span className="text-2xl font-black text-emerald-500">
                {initialUsers.filter((u) => u.isMemberVerified).length}
              </span>
            </div>
          </div>

          {/* Search & Action Bar */}
          <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between glass p-4 rounded-2xl border border-foreground/5">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/40" size={18} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Suche nach Nickname, E-Mail oder Telefon..."
                className="w-full bg-background border border-foreground/10 rounded-xl py-2.5 pl-11 pr-4 text-sm font-medium focus:border-blue-500 outline-none"
              />
            </div>
            
            <div className="flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={onlyPendingVerification}
                  onChange={(e) => setOnlyPendingVerification(e.target.checked)}
                  className="w-4 h-4 accent-blue-500 rounded cursor-pointer"
                />
                <span className="text-sm font-bold text-foreground/75">
                  Nur ausstehende Mitglieder-Verifizierungen anzeigen
                </span>
              </label>

              <button
                type="button"
                onClick={() => window.open("/admin/tippspiel/print", "_blank")}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-all cursor-pointer whitespace-nowrap text-sm"
              >
                <Printer size={18} />
                Gewinnerliste (PDF / Drucken)
              </button>
            </div>
          </div>

          {/* Participants Table */}
          <div className="overflow-x-auto rounded-2xl border border-foreground/5 bg-background/30 glass">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-foreground/5 bg-foreground/5 text-foreground/70 font-bold text-xs uppercase tracking-wider">
                  <th className="py-4 px-6 text-center w-16">Rang</th>
                  <th className="py-4 px-6">Nickname</th>
                  <th className="py-4 px-6">E-Mail</th>
                  <th className="py-4 px-6">Telefon</th>
                  <th className="py-4 px-4 text-center">Mitglied?</th>
                  <th className="py-4 px-4 text-center">Verifiziert?</th>
                  <th className="py-4 px-4 text-center">WM-Tipp</th>
                  <th className="py-4 px-4 text-center">Tipps</th>
                  <th className="py-4 px-4 text-center">Punkte</th>
                  <th className="py-4 px-6 text-center w-24">Aktion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-foreground/5">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-foreground/50 font-medium">
                      Keine passenden Tipper gefunden.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user, idx) => {
                    const isPending = user.isMember && !user.isMemberVerified;
                    return (
                      <tr 
                        key={user.id} 
                        className={`transition-colors hover:bg-foreground/5 ${
                          isPending ? "bg-amber-500/5" : ""
                        }`}
                      >
                        <td className="py-4 px-6 text-center font-bold text-sm text-foreground/50">
                          {idx + 1}
                        </td>
                        <td className="py-4 px-6 font-bold text-foreground">
                          {user.nickname}
                        </td>
                        <td className="py-4 px-6 text-sm text-foreground/75">
                          {user.email || <span className="text-foreground/30 italic">Keine</span>}
                        </td>
                        <td className="py-4 px-6 text-sm text-foreground/75">
                          {user.phone || <span className="text-foreground/30 italic">Keine</span>}
                        </td>
                        <td className="py-4 px-4 text-center text-sm font-bold">
                          {user.isMember ? (
                            <span className="text-green-500">Ja</span>
                          ) : (
                            <span className="text-foreground/30">Nein</span>
                          )}
                        </td>
                        <td className="py-4 px-4 text-center">
                          {user.isMember ? (
                            user.isMemberVerified ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-500/10 border border-green-500/20 text-green-500 text-xs font-black rounded-full">
                                Verifiziert
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-black rounded-full animate-pulse">
                                Ausstehend
                              </span>
                            )
                          ) : (
                            <span className="text-foreground/30 text-xs font-semibold">-</span>
                          )}
                        </td>
                        <td className="py-4 px-4 text-center text-sm font-semibold text-foreground/70">
                          {user.championPrediction || <span className="text-foreground/30 italic">-</span>}
                        </td>
                        <td className="py-4 px-4 text-center text-sm font-bold text-foreground/70">
                          {user.predictions.length}
                        </td>
                        <td className="py-4 px-4 text-center text-base font-black text-blue-500">
                          {user.totalPoints}
                        </td>
                        <td className="py-4 px-6 text-center">
                          <div className="flex items-center justify-center gap-2">
                            {user.isMember && (
                              <button
                                onClick={() => handleToggleVerification(user.id, user.isMemberVerified)}
                                disabled={actionLoading[user.id]}
                                className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                                  user.isMemberVerified
                                    ? "bg-red-500/10 border-red-500/20 text-red-500 hover:bg-red-500/20"
                                    : "bg-green-500/10 border-green-500/20 text-green-500 hover:bg-green-500/20"
                                }`}
                                title={user.isMemberVerified ? "Verifizierung entziehen" : "Mitglied verifizieren"}
                              >
                                {user.isMemberVerified ? <UserX size={16} /> : <UserCheck size={16} />}
                              </button>
                            )}
                            
                            <button
                              onClick={() => handleResetPin(user.id, user.nickname)}
                              disabled={actionLoading[user.id]}
                              className="p-1.5 bg-foreground/5 hover:bg-blue-500/10 text-foreground/40 hover:text-blue-500 rounded-lg transition-all border border-transparent hover:border-blue-500/20 cursor-pointer"
                              title="PIN zurücksetzen"
                            >
                              <Key size={16} />
                            </button>

                            <button
                              onClick={() => handleDeleteUser(user.id, user.nickname)}
                              disabled={actionLoading[user.id]}
                              className="p-1.5 bg-foreground/5 hover:bg-red-500/10 text-foreground/40 hover:text-red-500 rounded-lg transition-all border border-transparent hover:border-red-500/20 cursor-pointer"
                              title="Tipper löschen"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
