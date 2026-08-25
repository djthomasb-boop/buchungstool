"use client";

import { useState } from "react";
import { submitPrediction, submitChampionPrediction } from "@/app/actions/tipp";
import { Save, Check, AlertCircle, Clock, CheckCircle2 } from "lucide-react";

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

interface Prediction {
  id: string;
  userId: string;
  matchId: string;
  homeScore: number;
  awayScore: number;
  points: number | null;
}

interface TippDashboardClientProps {
  initialMatches: Match[];
  initialPredictions: Prediction[];
  teams?: string[];
  currentUser?: {
    id: string;
    nickname: string;
    totalPoints: number;
    championPrediction: string | null;
    championPoints: number;
  } | null;
}

const GROUP_MAPPING: Record<string, string> = {
  "Mexiko": "Gruppe A",
  "Südafrika": "Gruppe A",
  "Südkorea": "Gruppe A",
  "Tschechien": "Gruppe A",
  "Schweiz": "Gruppe B",
  "Kanada": "Gruppe B",
  "Bosnien und Herzegowina": "Gruppe B",
  "Katar": "Gruppe B",
  "Brasilien": "Gruppe C",
  "Marokko": "Gruppe C",
  "Schottland": "Gruppe C",
  "Haiti": "Gruppe C",
  "USA": "Gruppe D",
  "Australien": "Gruppe D",
  "Paraguay": "Gruppe D",
  "Türkei": "Gruppe D",
  "Deutschland": "Gruppe E",
  "Elfenbeinküste": "Gruppe E",
  "Ecuador": "Gruppe E",
  "Curaçao": "Gruppe E",
  "Niederlande": "Gruppe F",
  "Japan": "Gruppe F",
  "Schweden": "Gruppe F",
  "Tunesien": "Gruppe F",
  "Belgien": "Gruppe G",
  "Ägypten": "Gruppe G",
  "Iran": "Gruppe G",
  "Neuseeland": "Gruppe G",
  "Spanien": "Gruppe H",
  "Kap Verde": "Gruppe H",
  "Uruguay": "Gruppe H",
  "Saudi Arabien": "Gruppe H",
  "Frankreich": "Gruppe I",
  "Norwegen": "Gruppe I",
  "Senegal": "Gruppe I",
  "Irak": "Gruppe I",
  "Argentinien": "Gruppe J",
  "Österreich": "Gruppe J",
  "Algerien": "Gruppe J",
  "Jordanien": "Gruppe J",
  "Kolumbien": "Gruppe K",
  "Portugal": "Gruppe K",
  "DR Kongo": "Gruppe K",
  "Usbekistan": "Gruppe K",
  "England": "Gruppe L",
  "Kroatien": "Gruppe L",
  "Ghana": "Gruppe L",
  "Panama": "Gruppe L"
};

export default function TippDashboardClient({
  initialMatches,
  initialPredictions,
  teams = [],
  currentUser,
}: TippDashboardClientProps) {
  const [activeTab, setActiveTab] = useState<"open" | "closed" | "groups">("open");
  const [predictions, setPredictions] = useState<Record<string, { home: string; away: string }>>(() => {
    const initialMap: Record<string, { home: string; away: string }> = {};
    initialPredictions.forEach((p) => {
      initialMap[p.matchId] = {
        home: p.homeScore.toString(),
        away: p.awayScore.toString(),
      };
    });
    return initialMap;
  });

  const [savingStatus, setSavingStatus] = useState<Record<string, "idle" | "saving" | "saved" | "error">>({});
  const [errorMessage, setErrorMessage] = useState<Record<string, string>>({});

  // Champion Prediction states
  const [selectedChampion, setSelectedChampion] = useState(currentUser?.championPrediction || "");
  const [championSaving, setChampionSaving] = useState(false);
  const [championSaved, setChampionSaved] = useState(false);
  const [championError, setChampionError] = useState("");

  // Group Filter state
  const [selectedGroupFilter, setSelectedGroupFilter] = useState("all");

  const now = new Date();

  // Determine if tournament has started (earliest match kick-off time is in past)
  const isTournamentStarted = initialMatches.some(m => new Date(m.dateTime) <= now);

  // Extract unique group names for filter dropdown
  const uniqueGroups = Array.from(new Set(initialMatches.map((m) => m.groupName))).sort();

  // Categorize matches
  const openMatches: Match[] = [];
  const closedMatches: Match[] = [];

  initialMatches.forEach((match) => {
    const matchDate = new Date(match.dateTime);
    if (matchDate > now) {
      openMatches.push(match);
    } else {
      closedMatches.push(match);
    }
  });

  // Apply filters
  const filteredOpenMatches = openMatches.filter(
    (m) => selectedGroupFilter === "all" || m.groupName === selectedGroupFilter
  );
  const filteredClosedMatches = closedMatches.filter(
    (m) => selectedGroupFilter === "all" || m.groupName === selectedGroupFilter
  );

  // Calculate live group standings dynamically from matches
  interface TableEntry {
    teamName: string;
    logo: string | null;
    played: number;
    won: number;
    draw: number;
    lost: number;
    goalsFor: number;
    goalsAgainst: number;
    points: number;
  }

  const groupStageMatches = initialMatches.filter(m => 
    m.groupName.includes("Gruppenphase") || m.groupName.includes("Vorrunde")
  );

  const groupsData: Record<string, Record<string, TableEntry>> = {};
  const groupNames = ["Gruppe A", "Gruppe B", "Gruppe C", "Gruppe D", "Gruppe E", "Gruppe F", "Gruppe G", "Gruppe H", "Gruppe I", "Gruppe J", "Gruppe K", "Gruppe L"];
  
  groupNames.forEach(g => {
    groupsData[g] = {};
  });

  Object.entries(GROUP_MAPPING).forEach(([teamName, groupName]) => {
    if (groupsData[groupName]) {
      groupsData[groupName][teamName] = {
        teamName,
        logo: null,
        played: 0,
        won: 0,
        draw: 0,
        lost: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        points: 0
      };
    }
  });

  groupStageMatches.forEach(m => {
    const homeGroup = GROUP_MAPPING[m.teamHome];
    const awayGroup = GROUP_MAPPING[m.teamAway];

    if (homeGroup && groupsData[homeGroup][m.teamHome]) {
      if (m.logoHome) groupsData[homeGroup][m.teamHome].logo = m.logoHome;
    }
    if (awayGroup && groupsData[awayGroup][m.teamAway]) {
      if (m.logoAway) groupsData[awayGroup][m.teamAway].logo = m.logoAway;
    }

    if (m.scoreHome !== null && m.scoreAway !== null) {
      const sh = m.scoreHome;
      const sa = m.scoreAway;

      if (homeGroup && groupsData[homeGroup][m.teamHome]) {
        const entry = groupsData[homeGroup][m.teamHome];
        entry.played += 1;
        entry.goalsFor += sh;
        entry.goalsAgainst += sa;
        if (sh > sa) {
          entry.won += 1;
          entry.points += 3;
        } else if (sh < sa) {
          entry.lost += 1;
        } else {
          entry.draw += 1;
          entry.points += 1;
        }
      }

      if (awayGroup && groupsData[awayGroup][m.teamAway]) {
        const entry = groupsData[awayGroup][m.teamAway];
        entry.played += 1;
        entry.goalsFor += sa;
        entry.goalsAgainst += sh;
        if (sa > sh) {
          entry.won += 1;
          entry.points += 3;
        } else if (sa < sh) {
          entry.lost += 1;
        } else {
          entry.draw += 1;
          entry.points += 1;
        }
      }
    }
  });

  const sortedGroups: Record<string, TableEntry[]> = {};
  Object.entries(groupsData).forEach(([gName, teamsMap]) => {
    sortedGroups[gName] = Object.values(teamsMap).sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      const diffA = a.goalsFor - a.goalsAgainst;
      const diffB = b.goalsFor - b.goalsAgainst;
      if (diffB !== diffA) return diffB - diffA;
      if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
      return a.teamName.localeCompare(b.teamName);
    });
  });

  const handleSaveChampion = async () => {
    if (!selectedChampion) return;
    setChampionSaving(true);
    setChampionError("");
    setChampionSaved(false);
    try {
      const res = await submitChampionPrediction(selectedChampion);
      if (res.success) {
        setChampionSaved(true);
        setTimeout(() => setChampionSaved(false), 2000);
      } else {
        setChampionError(res.error || "Fehler beim Speichern.");
      }
    } catch (err) {
      console.error(err);
      setChampionError("Netzwerkfehler.");
    } finally {
      setChampionSaving(false);
    }
  };

  const handleInputChange = (matchId: string, team: "home" | "away", value: string) => {
    // Only allow digits
    const cleanValue = value.replace(/\D/g, "");
    setPredictions((prev) => ({
      ...prev,
      [matchId]: {
        ...prev[matchId],
        [team]: cleanValue,
      },
    }));
    // Reset save status if user types
    if (savingStatus[matchId] === "saved" || savingStatus[matchId] === "error") {
      setSavingStatus((prev) => ({ ...prev, [matchId]: "idle" }));
    }
  };

  const handleSave = async (matchId: string) => {
    const pred = predictions[matchId];
    if (!pred || pred.home === "" || pred.away === "") {
      setErrorMessage((prev) => ({ ...prev, [matchId]: "Bitte beide Tore eingeben." }));
      setSavingStatus((prev) => ({ ...prev, [matchId]: "error" }));
      return;
    }

    setSavingStatus((prev) => ({ ...prev, [matchId]: "saving" }));
    setErrorMessage((prev) => ({ ...prev, [matchId]: "" }));

    try {
      const res = await submitPrediction(
        matchId,
        parseInt(pred.home, 10),
        parseInt(pred.away, 10)
      );

      if (res.success) {
        setSavingStatus((prev) => ({ ...prev, [matchId]: "saved" }));
      } else {
        setErrorMessage((prev) => ({ ...prev, [matchId]: res.error || "Fehler beim Speichern." }));
        setSavingStatus((prev) => ({ ...prev, [matchId]: "error" }));
      }
    } catch (err) {
      console.error(err);
      setErrorMessage((prev) => ({ ...prev, [matchId]: "Netzwerkfehler." }));
      setSavingStatus((prev) => ({ ...prev, [matchId]: "error" }));
    }
  };

  // Helper to format date
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("de-DE", {
      timeZone: "Europe/Berlin",
      weekday: "short",
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }) + " Uhr";
  };

  // Helper to get points badge color & label
  const getPointsBadge = (points: number | null) => {
    if (points === null) return null;
    if (points === 3) {
      return (
        <span className="px-3 py-1 bg-green-500/10 border border-green-500/30 text-green-500 text-xs font-black rounded-full">
          +3 (Exakt)
        </span>
      );
    }
    if (points === 2) {
      return (
        <span className="px-3 py-1 bg-yellow-500/10 border border-yellow-500/30 text-yellow-500 text-xs font-black rounded-full">
          +2 (Differenz)
        </span>
      );
    }
    if (points === 1) {
      return (
        <span className="px-3 py-1 bg-blue-500/10 border border-blue-500/30 text-blue-500 text-xs font-black rounded-full">
          +1 (Tendenz)
        </span>
      );
    }
    return (
      <span className="px-3 py-1 bg-foreground/5 border border-foreground/10 text-foreground/40 text-xs font-bold rounded-full">
        0 Punkte
      </span>
    );
  };

  return (
    <div className="space-y-8 animate-slide-up">
      {/* Weltmeister Tipp Banner */}
      {currentUser && (
        <div className="glass p-6 rounded-3xl border border-foreground/5 bg-gradient-to-r from-amber-500/5 via-transparent to-transparent flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="font-black text-lg flex items-center gap-2">
              Wer wird Weltmeister? 🏆
            </h3>
            <p className="text-xs text-foreground/50">
              {isTournamentStarted 
                ? `Turnier gestartet. Dein gesetzter Tipp: ${selectedChampion || "Kein Tipp abgegeben"}` 
                : "Gib deinen Tipp ab, bevor das erste WM-Spiel angepfiffen wird!"}
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <select
              value={selectedChampion}
              onChange={(e) => {
                setSelectedChampion(e.target.value);
                setChampionError("");
              }}
              disabled={isTournamentStarted || championSaving || teams.length === 0}
              className="bg-background border border-foreground/10 rounded-xl px-4 py-2.5 text-sm font-bold focus:border-blue-500 outline-none min-w-[200px]"
            >
              <option value="">-- Wähle ein Team --</option>
              {teams.map((team) => (
                <option key={team} value={team}>
                  {team}
                </option>
              ))}
            </select>

            {!isTournamentStarted && teams.length > 0 && (
              <button
                onClick={handleSaveChampion}
                disabled={championSaving || !selectedChampion}
                className={`px-4 py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all shadow-sm ${
                  championSaved
                    ? "bg-green-500 text-white"
                    : "bg-blue-600 hover:bg-blue-700 text-white"
                }`}
              >
                {championSaved ? "Gespeichert!" : "Speichern"}
              </button>
            )}

            {teams.length === 0 && (
              <span className="text-[10px] text-foreground/40 font-medium italic sm:max-w-[150px]">
                Warte auf WM-Spieldaten, um zu tippen.
              </span>
            )}
          </div>
        </div>
      )}

      {/* Tabs and Filter Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-foreground/10 pb-1">
        <div className="flex w-full sm:w-auto overflow-x-auto">
          <button
            onClick={() => setActiveTab("open")}
            className={`flex-1 sm:flex-initial px-3 sm:px-6 py-2.5 sm:py-3 font-bold text-sm sm:text-lg border-b-2 transition-all duration-200 whitespace-nowrap ${
              activeTab === "open"
                ? "border-[#f23529] text-foreground"
                : "border-transparent text-foreground/50 hover:text-foreground"
            }`}
          >
            Offene Tipps ({filteredOpenMatches.length})
          </button>
          <button
            onClick={() => setActiveTab("closed")}
            className={`flex-1 sm:flex-initial px-3 sm:px-6 py-2.5 sm:py-3 font-bold text-sm sm:text-lg border-b-2 transition-all duration-200 whitespace-nowrap ${
              activeTab === "closed"
                ? "border-[#f23529] text-foreground"
                : "border-transparent text-foreground/50 hover:text-foreground"
            }`}
          >
            Laufende & Beendete ({filteredClosedMatches.length})
          </button>
          <button
            onClick={() => setActiveTab("groups")}
            className={`flex-1 sm:flex-initial px-3 sm:px-6 py-2.5 sm:py-3 font-bold text-sm sm:text-lg border-b-2 transition-all duration-200 whitespace-nowrap ${
              activeTab === "groups"
                ? "border-[#f23529] text-foreground"
                : "border-transparent text-foreground/50 hover:text-foreground"
            }`}
          >
            Gruppentabellen
          </button>
        </div>

        {/* Group Filter */}
        {uniqueGroups.length > 1 && activeTab !== "groups" && (
          <div className="flex items-center justify-start gap-2 w-full sm:w-auto pb-2 sm:pb-0 px-1 sm:px-0">
            <span className="text-xs font-bold text-foreground/50">Gruppe/Runde:</span>
            <select
              value={selectedGroupFilter}
              onChange={(e) => setSelectedGroupFilter(e.target.value)}
              className="bg-background border border-foreground/10 rounded-xl px-3 py-1.5 text-xs font-bold focus:border-blue-500 outline-none min-w-[120px] max-w-[200px]"
            >
              <option value="all">Alle Spiele</option>
              {uniqueGroups.map((group) => (
                <option key={group} value={group}>
                  {group}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Info Banner for KO Round */}
      {activeTab !== "groups" && (
        <div className="glass flex items-start gap-3.5 p-4 sm:p-5 rounded-2xl border border-blue-500/20 bg-blue-500/5 mb-6 text-sm text-foreground/90 animate-fade-in">
          <AlertCircle className="text-blue-500 shrink-0 mt-0.5 animate-pulse" size={20} />
          <div>
            <span className="font-extrabold text-blue-500 block sm:inline mr-1">Hinweis zur K.o.-Runde:</span>
            <span className="font-medium">
              Es wird das tatsächliche Endergebnis gewertet (inkl. Verlängerung &amp; Elfmeterschießen) und mit bis zu 3 Punkten belohnt. 
              Bitte tippe das Endergebnis inklusive eines eventuellen Elfmeterschießens (z. B. 6:4 statt 1:1) – 
              Unentschieden-Tipps bringen in der K.o.-Runde 0 Punkte!
            </span>
          </div>
        </div>
      )}

      {/* Empty State */}
      {activeTab === "open" && filteredOpenMatches.length === 0 && (
        <div className="glass p-12 rounded-3xl text-center border border-foreground/5 max-w-lg mx-auto">
          <CheckCircle2 size={48} className="mx-auto text-green-500 mb-4" />
          <h3 className="text-xl font-bold mb-2">Keine offenen Spiele</h3>
          <p className="text-foreground/60">
            Es sind keine passenden offenen Spiele vorhanden.
          </p>
        </div>
      )}

      {activeTab === "closed" && filteredClosedMatches.length === 0 && (
        <div className="glass p-12 rounded-3xl text-center border border-foreground/5 max-w-lg mx-auto">
          <Clock size={48} className="mx-auto text-blue-500 mb-4 animate-pulse" />
          <h3 className="text-xl font-bold mb-2">Noch keine Spiele gestartet</h3>
          <p className="text-foreground/60">
            Es sind keine passenden laufenden oder beendeten Spiele vorhanden.
          </p>
        </div>
      )}

      {/* Grid of Matches */}
      {activeTab !== "groups" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {activeTab === "open" &&
            filteredOpenMatches.map((match) => {
              const pred = predictions[match.id] || { home: "", away: "" };
              const status = savingStatus[match.id] || "idle";

              return (
                <div
                  key={match.id}
                  className="glass min-w-0 p-4 sm:p-6 rounded-3xl border border-foreground/5 flex flex-col justify-between gap-4 relative overflow-hidden transition-all duration-300 hover:border-foreground/10 hover:shadow-lg"
                >
                  {/* Header info */}
                  <div className="flex items-center justify-between text-xs text-foreground/50">
                    <span className="font-bold">{match.groupName}</span>
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {formatDate(match.dateTime)}
                    </span>
                  </div>

                  {/* Matchup row */}
                  <div className="flex items-center justify-between my-2 gap-1">
                    {/* Home Team */}
                    <div className="flex flex-col items-center flex-1 text-center min-w-0">
                      {match.logoHome ? (
                        <img src={match.logoHome} alt={match.teamHome} className="h-10 w-10 object-contain mb-2 shrink-0" />
                      ) : (
                        <div className="h-10 w-10 bg-foreground/5 rounded-full flex items-center justify-center font-black text-sm mb-2 shrink-0">
                          {match.teamHome.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <span className="font-bold text-xs sm:text-base truncate w-full" title={match.teamHome}>{match.teamHome}</span>
                    </div>

                    {/* Input Fields */}
                    <div className="flex items-center gap-1.5 sm:gap-3 px-1 sm:px-4 shrink-0">
                      <input
                        type="text"
                        maxLength={2}
                        value={pred.home}
                        onChange={(e) => handleInputChange(match.id, "home", e.target.value)}
                        placeholder="-"
                        className="w-10 h-10 sm:w-12 sm:h-12 bg-background/50 border border-foreground/10 rounded-xl text-center font-black text-lg sm:text-xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                      />
                      <span className="text-foreground/30 font-black">:</span>
                      <input
                        type="text"
                        maxLength={2}
                        value={pred.away}
                        onChange={(e) => handleInputChange(match.id, "away", e.target.value)}
                        placeholder="-"
                        className="w-10 h-10 sm:w-12 sm:h-12 bg-background/50 border border-foreground/10 rounded-xl text-center font-black text-lg sm:text-xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                      />
                    </div>

                    {/* Away Team */}
                    <div className="flex flex-col items-center flex-1 min-w-0 w-0 text-center">
                      {match.logoAway ? (
                        <img src={match.logoAway} alt={match.teamAway} className="h-10 w-10 object-contain mb-2 shrink-0" />
                      ) : (
                        <div className="h-10 w-10 bg-foreground/5 rounded-full flex items-center justify-center font-black text-sm mb-2 shrink-0">
                          {match.teamAway.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <span className="font-bold text-xs sm:text-base truncate w-full block" title={match.teamAway}>{match.teamAway}</span>
                    </div>
                  </div>

                  {/* Footer Controls */}
                  <div className="flex items-center justify-between border-t border-foreground/5 pt-4">
                    <div className="text-xs text-red-500 font-bold max-w-[60%] line-clamp-1">
                      {status === "error" && (errorMessage[match.id] || "Fehler")}
                    </div>

                    <button
                      onClick={() => handleSave(match.id)}
                      disabled={status === "saving"}
                      className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-sm ${
                        status === "saved"
                          ? "bg-green-500 text-white shadow-green-500/15"
                          : status === "saving"
                          ? "bg-foreground/10 text-foreground/50 cursor-not-allowed"
                          : "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/10"
                      }`}
                    >
                      {status === "saved" ? (
                        <>
                          <Check size={14} /> Saved
                        </>
                      ) : status === "saving" ? (
                        "Saving..."
                      ) : (
                        <>
                          <Save size={14} /> Tippen
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}

          {activeTab === "closed" &&
            filteredClosedMatches.map((match) => {
              const pred = initialPredictions.find((p) => p.matchId === match.id);
              const isPlayed = match.isFinished && match.scoreHome !== null && match.scoreAway !== null;

              return (
                <div
                  key={match.id}
                  className="glass min-w-0 p-4 sm:p-6 rounded-3xl border border-foreground/5 flex flex-col justify-between gap-4 relative overflow-hidden opacity-90"
                >
                  {/* Header info */}
                  <div className="flex items-center justify-between text-xs text-foreground/50">
                    <span className="font-bold">{match.groupName}</span>
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {formatDate(match.dateTime)}
                    </span>
                  </div>

                  {/* Matchup row */}
                  <div className="flex items-center justify-between w-full my-2 gap-1 min-w-0">
                    {/* Home Team */}
                    <div className="flex flex-col items-center flex-1 min-w-0 w-0 text-center">
                      {match.logoHome ? (
                        <img src={match.logoHome} alt={match.teamHome} className="h-10 w-10 object-contain mb-2 shrink-0" />
                      ) : (
                        <div className="h-10 w-10 bg-foreground/5 rounded-full flex items-center justify-center font-black text-sm mb-2 shrink-0">
                          {match.teamHome.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <span className="font-bold text-xs sm:text-base truncate w-full block" title={match.teamHome}>{match.teamHome}</span>
                    </div>

                    {/* Actual Score Display */}
                    <div className="flex flex-col items-center px-1 sm:px-4 shrink-0">
                      <span className="text-[10px] sm:text-xs text-foreground/45 font-bold uppercase tracking-widest mb-1 text-center">
                        {match.isFinished ? "Endergebnis" : "Live"}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-xl sm:text-2xl font-black">
                          {match.scoreHome !== null ? match.scoreHome : "-"}
                        </span>
                        <span className="text-foreground/30 font-black">:</span>
                        <span className="text-xl sm:text-2xl font-black">
                          {match.scoreAway !== null ? match.scoreAway : "-"}
                        </span>
                      </div>
                    </div>

                    {/* Away Team */}
                    <div className="flex flex-col items-center flex-1 min-w-0 w-0 text-center">
                      {match.logoAway ? (
                        <img src={match.logoAway} alt={match.teamAway} className="h-10 w-10 object-contain mb-2 shrink-0" />
                      ) : (
                        <div className="h-10 w-10 bg-foreground/5 rounded-full flex items-center justify-center font-black text-sm mb-2 shrink-0">
                          {match.teamAway.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <span className="font-bold text-xs sm:text-base truncate w-full block" title={match.teamAway}>{match.teamAway}</span>
                    </div>
                  </div>

                  {/* Prediction stats */}
                  <div className="flex items-center justify-between border-t border-foreground/5 pt-4">
                    <div className="text-xs font-bold text-foreground/50">
                      Dein Tipp:{" "}
                      {pred ? (
                        <span className="text-foreground font-black bg-foreground/5 px-2 py-1 rounded-lg">
                          {pred.homeScore} : {pred.awayScore}
                        </span>
                      ) : (
                        <span className="text-foreground/30 font-medium italic">Kein Tipp abgegeben</span>
                      )}
                    </div>

                    {/* Points Badge */}
                    <div>{pred && isPlayed && getPointsBadge(pred.points)}</div>
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {activeTab === "groups" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-slide-up mt-6">
          {Object.entries(sortedGroups).map(([groupName, teamsList]) => (
            <div key={groupName} className="glass p-5 rounded-3xl border border-foreground/5 bg-foreground/[0.01] flex flex-col gap-3">
              {/* Group Title Header */}
              <div className="bg-orange-500/10 border border-orange-500/20 text-orange-600 dark:text-orange-400 font-black text-sm px-4 py-2 rounded-2xl tracking-widest text-center uppercase">
                {groupName}
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-foreground/5 text-foreground/45 font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-2 px-1">Team</th>
                      <th className="py-2 px-1 text-center">Sp</th>
                      <th className="py-2 px-1 text-center">S</th>
                      <th className="py-2 px-1 text-center">U</th>
                      <th className="py-2 px-1 text-center">N</th>
                      <th className="py-2 px-1 text-center">T</th>
                      <th className="py-2 px-1 text-center">Pkt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-foreground/[0.03]">
                    {teamsList.map((t, idx) => {
                      const isTop2 = idx < 2;
                      return (
                        <tr key={t.teamName} className="hover:bg-foreground/[0.01] transition-colors">
                          <td className="py-2.5 px-1 font-semibold text-foreground flex items-center gap-1.5 min-w-0">
                            <span className={`text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                              isTop2 
                                ? "bg-green-500/10 text-green-600 dark:text-green-400" 
                                : "bg-foreground/5 text-foreground/40"
                            }`}>
                              {idx + 1}
                            </span>
                            {t.logo ? (
                              <img src={t.logo} alt={t.teamName} className="h-3.5 w-5 object-contain shrink-0 rounded-sm" />
                            ) : (
                              <div className="h-3.5 w-5 bg-foreground/5 rounded-sm flex items-center justify-center font-black text-[7px] shrink-0 text-foreground/40">
                                {t.teamName.slice(0, 2).toUpperCase()}
                              </div>
                            )}
                            <span className="truncate max-w-[110px]" title={t.teamName}>{t.teamName}</span>
                          </td>
                          <td className="py-2.5 px-1 text-center font-bold text-foreground/75">{t.played}</td>
                          <td className="py-2.5 px-1 text-center text-foreground/60">{t.won}</td>
                          <td className="py-2.5 px-1 text-center text-foreground/60">{t.draw}</td>
                          <td className="py-2.5 px-1 text-center text-foreground/60">{t.lost}</td>
                          <td className="py-2.5 px-1 text-center text-foreground/60 whitespace-nowrap">{t.goalsFor}:{t.goalsAgainst}</td>
                          <td className="py-2.5 px-1 text-center font-black text-blue-500">{t.points}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
