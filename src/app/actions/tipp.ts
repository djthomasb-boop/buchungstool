"use server";

import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import crypto from "crypto";

// Helper to hash password
function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

// Helper to calculate prediction points
export async function calculatePredictionPoints(
  predHome: number,
  predAway: number,
  actHome: number,
  actAway: number
): Promise<number> {
  if (predHome === actHome && predAway === actAway) {
    return 3; // exact match
  }
  const predDiff = predHome - predAway;
  const actDiff = actHome - actAway;
  if (predDiff === actDiff) {
    return 2; // correct difference (implies correct winner/draw)
  }
  const predWinner = Math.sign(predDiff);
  const actWinner = Math.sign(actDiff);
  if (predWinner === actWinner) {
    return 1; // correct winner/tendency
  }
  return 0; // wrong winner
}

// Recalculates points for all predictions of a match and updates user totals
async function recalculateMatchPredictions(matchId: string) {
  const match = await prisma.match.findUnique({ where: { id: matchId } });
  if (!match || match.scoreHome === null || match.scoreAway === null) return;

  const predictions = await prisma.prediction.findMany({ where: { matchId } });
  
  for (const pred of predictions) {
    const points = await calculatePredictionPoints(
      pred.homeScore,
      pred.awayScore,
      match.scoreHome,
      match.scoreAway
    );
    await prisma.prediction.update({
      where: { id: pred.id },
      data: { points },
    });
  }

  // Update total points for all users
  const users = await prisma.tippUser.findMany();
  for (const user of users) {
    const userPredictions = await prisma.prediction.findMany({
      where: { userId: user.id, points: { not: null } },
    });
    const totalPoints = userPredictions.reduce((sum, p) => sum + (p.points || 0), 0);
    await prisma.tippUser.update({
      where: { id: user.id },
      data: { totalPoints },
    });
  }
}

// User Actions
export async function registerTippUser(nickname: string, pin: string, email: string, phone: string, isMember: boolean) {
  const trimmedNickname = nickname.trim();
  if (!trimmedNickname || trimmedNickname.length < 3) {
    return { success: false, error: "Der Nickname muss mindestens 3 Zeichen lang sein." };
  }
  if (!pin || pin.length < 4) {
    return { success: false, error: "Das Passwort/PIN muss mindestens 4 Zeichen lang sein." };
  }

  const trimmedEmail = email.trim();
  if (!trimmedEmail || !trimmedEmail.includes("@") || trimmedEmail.split("@")[1]?.indexOf(".") === -1) {
    return { success: false, error: "Bitte gib eine gültige E-Mail-Adresse ein." };
  }

  const trimmedPhone = phone.trim();
  if (!trimmedPhone || trimmedPhone.length < 5) {
    return { success: false, error: "Bitte gib eine gültige Telefonnummer ein." };
  }

  const existing = await prisma.tippUser.findUnique({
    where: { nickname: trimmedNickname },
  });
  if (existing) {
    return { success: false, error: "Dieser Nickname ist bereits vergeben." };
  }

  try {
    const hashedPassword = hashPassword(pin);
    const user = await prisma.tippUser.create({
      data: {
        nickname: trimmedNickname,
        password: hashedPassword,
        email: trimmedEmail,
        phone: trimmedPhone,
        isMember,
      },
    });

    const cookieStore = await cookies();
    cookieStore.set("tipp_session", user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
    });

    return { success: true };
  } catch (error) {
    console.error("Register error:", error);
    return { success: false, error: "Registrierung fehlgeschlagen." };
  }
}

export async function loginTippUser(nickname: string, pin: string) {
  const trimmedNickname = nickname.trim();
  const hashedPassword = hashPassword(pin);

  const user = await prisma.tippUser.findUnique({
    where: { nickname: trimmedNickname },
  });

  if (!user || user.password !== hashedPassword) {
    return { success: false, error: "Ungültiger Nickname oder Passwort/PIN." };
  }

  const cookieStore = await cookies();
  cookieStore.set("tipp_session", user.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: "/",
  });

  return { success: true };
}

export async function logoutTippUser() {
  const cookieStore = await cookies();
  cookieStore.delete("tipp_session");
  return { success: true };
}

export async function getCurrentTippUser() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("tipp_session")?.value;
  if (!sessionId) return null;

  return await prisma.tippUser.findUnique({
    where: { id: sessionId },
    select: {
      id: true,
      nickname: true,
      totalPoints: true,
      championPrediction: true,
      championPoints: true,
      email: true,
      phone: true,
      isMember: true,
      isMemberVerified: true,
    },
  });
}

// Prediction Submission
export async function submitPrediction(matchId: string, homeScore: number, awayScore: number) {
  const user = await getCurrentTippUser();
  if (!user) {
    return { success: false, error: "Nicht angemeldet." };
  }

  const match = await prisma.match.findUnique({ where: { id: matchId } });
  if (!match) {
    return { success: false, error: "Spiel nicht gefunden." };
  }

  // Lock prediction check: cannot predict if match has started
  const now = new Date();
  if (new Date(match.dateTime) <= now) {
    return { success: false, error: "Das Spiel hat bereits begonnen. Tippabgabe gesperrt." };
  }

  try {
    await prisma.prediction.upsert({
      where: {
        userId_matchId: {
          userId: user.id,
          matchId,
        },
      },
      update: {
        homeScore,
        awayScore,
      },
      create: {
        userId: user.id,
        matchId,
        homeScore,
        awayScore,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Submit prediction error:", error);
    return { success: false, error: "Tipp konnte nicht gespeichert werden." };
  }
}

// Admin / Sync Actions
export async function syncMatchesFromOpenLigaDB() {
  // Get active settings or defaults
  const activeSetting = await prisma.setting.findUnique({ where: { key: "TIPPSPIEL_ACTIVE" } });
  const isTippActive = activeSetting?.value === "true";
  if (!isTippActive) {
    return { success: false, error: "Das Tippspiel ist derzeit deaktiviert." };
  }

  const leagueSetting = await prisma.setting.findUnique({ where: { key: "TIPPSPIEL_LEAGUE" } });
  const seasonSetting = await prisma.setting.findUnique({ where: { key: "TIPPSPIEL_SEASON" } });

  const shortcut = leagueSetting?.value || "wm26";
  const season = seasonSetting?.value || "2026";

  try {
    const res = await fetch(`https://api.openligadb.de/getmatchdata/${shortcut}/${season}?t=${Date.now()}`, {
      cache: "no-store",
    });
    if (!res.ok) {
      throw new Error(`OpenLigaDB responded with ${res.status}`);
    }
    const openLigaMatches = await res.json();
    if (!Array.isArray(openLigaMatches)) {
      return { success: false, error: "Keine gültigen Spieldaten empfangen." };
    }

    let updatedCount = 0;
    let createdCount = 0;

    for (const olm of openLigaMatches) {
      const openLigaMatchId = olm.matchID;
      const teamHome = olm.team1.teamName;
      const teamAway = olm.team2.teamName;
      const logoHome = olm.team1.teamIconUrl || null;
      const logoAway = olm.team2.teamIconUrl || null;
      const dateTime = new Date(olm.matchDateTimeUTC || olm.matchDateTime);
      const groupName = olm.group.groupName || "Vorrunde";
      const isFinished = olm.matchIsFinished;

      // Extract scores if finished
      let scoreHome: number | null = null;
      let scoreAway: number | null = null;
      if (isFinished && Array.isArray(olm.matchResults)) {
        const finalResult = olm.matchResults.find((r: any) => r.resultTypeID === 2);
        if (finalResult) {
          scoreHome = finalResult.pointsTeam1;
          scoreAway = finalResult.pointsTeam2;
        }
      }

      const existingMatch = await prisma.match.findUnique({
        where: { openLigaMatchId },
      });

      if (existingMatch) {
        // If results changed, we update and trigger recalculation
        const scoreChanged = 
          existingMatch.scoreHome !== scoreHome || 
          existingMatch.scoreAway !== scoreAway || 
          existingMatch.isFinished !== isFinished;

        await prisma.match.update({
          where: { openLigaMatchId },
          data: {
            teamHome,
            teamAway,
            logoHome,
            logoAway,
            dateTime,
            groupName,
            scoreHome,
            scoreAway,
            isFinished,
          },
        });

        if (scoreChanged && isFinished) {
          await recalculateMatchPredictions(existingMatch.id);
        }
        updatedCount++;
      } else {
        const newMatch = await prisma.match.create({
          data: {
            openLigaMatchId,
            teamHome,
            teamAway,
            logoHome,
            logoAway,
            dateTime,
            groupName,
            scoreHome,
            scoreAway,
            isFinished,
          },
        });

        if (isFinished) {
          await recalculateMatchPredictions(newMatch.id);
        }
        createdCount++;
      }
    }

    return { 
      success: true, 
      message: `${createdCount} Spiele erstellt und ${updatedCount} Spiele aktualisiert.` 
    };
  } catch (error) {
    console.error("Sync matches error:", error);
    return { success: false, error: "Fehler beim Abruf der Spieldaten von OpenLigaDB." };
  }
}

export async function updateMatchScoreManually(
  matchId: string,
  scoreHome: number | null,
  scoreAway: number | null,
  isFinished: boolean
) {
  try {
    await prisma.match.update({
      where: { id: matchId },
      data: {
        scoreHome,
        scoreAway,
        isFinished,
      },
    });

    if (isFinished && scoreHome !== null && scoreAway !== null) {
      await recalculateMatchPredictions(matchId);
    }

    return { success: true };
  } catch (error) {
    console.error("Manual update error:", error);
    return { success: false, error: "Fehler beim manuellen Speichern des Ergebnisses." };
  }
}

export async function saveTippSetting(key: string, value: string) {
  try {
    await prisma.setting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
    return { success: true };
  } catch (error) {
    console.error("Save setting error:", error);
    return { success: false, error: "Fehler beim Speichern der Einstellung." };
  }
}

export async function getTippSettings() {
  const activeSetting = await prisma.setting.findUnique({ where: { key: "TIPPSPIEL_ACTIVE" } });
  const leagueSetting = await prisma.setting.findUnique({ where: { key: "TIPPSPIEL_LEAGUE" } });
  const seasonSetting = await prisma.setting.findUnique({ where: { key: "TIPPSPIEL_SEASON" } });

  return {
    active: activeSetting?.value === "true",
    league: leagueSetting?.value || "wm26",
    season: seasonSetting?.value || "2026",
  };
}

export async function seedSampleMatches() {
  try {
    const sampleMatches = [
      {
        teamHome: "USA",
        teamAway: "Deutschland",
        dateTime: new Date("2026-06-06T18:30:00Z"),
        groupName: "Vorrunde - Gruppe A",
        logoHome: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Flag_of_the_United_States.svg/20px-Flag_of_the_United_States.svg.png",
        logoAway: "https://img.uefa.com/imgml/flags/140x140/FRG.png",
      },
      {
        teamHome: "Deutschland",
        teamAway: "Curaçao",
        dateTime: new Date("2026-06-14T17:00:00Z"),
        groupName: "Vorrunde - Gruppe A",
        logoHome: "https://img.uefa.com/imgml/flags/140x140/FRG.png",
        logoAway: "https://upload.wikimedia.org/wikipedia/commons/b/b1/Flag_of_Cura%C3%A7ao.svg",
      },
      {
        teamHome: "Ecuador",
        teamAway: "Deutschland",
        dateTime: new Date("2026-06-25T20:00:00Z"),
        groupName: "Vorrunde - Gruppe A",
        logoHome: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/Flag_of_Ecuador.svg/20px-Flag_of_Ecuador.svg.png",
        logoAway: "https://img.uefa.com/imgml/flags/140x140/FRG.png",
      },
      {
        teamHome: "Kanada",
        teamAway: "Argentinien",
        dateTime: new Date("2026-06-11T18:00:00Z"),
        groupName: "Vorrunde - Gruppe B",
        logoHome: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d9/Flag_of_Canada_%28Pantone%29.svg/20px-Flag_of_Canada_%28Pantone%29.svg.png",
        logoAway: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Flag_of_Argentina.svg/20px-Flag_of_Argentina.svg.png",
      },
      {
        teamHome: "Mexiko",
        teamAway: "Italien",
        dateTime: new Date("2026-06-12T16:00:00Z"),
        groupName: "Vorrunde - Gruppe C",
        logoHome: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fc/Flag_of_Mexico.svg/20px-Flag_of_Mexico.svg.png",
        logoAway: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/03/Flag_of_Italy.svg/20px-Flag_of_Italy.svg.png",
      },
    ];

    let createdCount = 0;
    for (const match of sampleMatches) {
      // Check if match already exists
      const existing = await prisma.match.findFirst({
        where: {
          teamHome: match.teamHome,
          teamAway: match.teamAway,
          dateTime: match.dateTime,
        },
      });

      if (!existing) {
        await prisma.match.create({ data: match });
        createdCount++;
      }
    }

    return { success: true, count: createdCount };
  } catch (error) {
    console.error("Seed matches error:", error);
    return { success: false, error: "Fehler beim Seeden der Testspiele." };
  }
}

export async function deleteTestMatches() {
  try {
    const deleted = await prisma.match.deleteMany({
      where: {
        openLigaMatchId: null,
      },
    });
    
    // Reset points for all users since some predictions were deleted
    const users = await prisma.tippUser.findMany();
    for (const user of users) {
      const userPredictions = await prisma.prediction.findMany({
        where: { userId: user.id, points: { not: null } },
      });
      const totalPoints = userPredictions.reduce((sum, p) => sum + (p.points || 0), 0);
      await prisma.tippUser.update({
        where: { id: user.id },
        data: { totalPoints },
      });
    }

    return { success: true, count: deleted.count };
  } catch (error) {
    console.error("Delete test matches error:", error);
    return { success: false, error: "Fehler beim Löschen der Testspiele." };
  }
}

export async function resetTippspielCompletely() {
  try {
    await prisma.prediction.deleteMany({});
    await prisma.match.deleteMany({});
    await prisma.tippUser.deleteMany({});
    return { success: true };
  } catch (error) {
    console.error("Reset Tippspiel error:", error);
    return { success: false, error: "Fehler beim Zurücksetzen des Tippspiels." };
  }
}

export async function submitChampionPrediction(teamName: string) {
  const user = await getCurrentTippUser();
  if (!user) {
    return { success: false, error: "Nicht angemeldet." };
  }

  // Check if tournament has already started (earliest match kick-off time)
  const firstMatch = await prisma.match.findFirst({
    orderBy: {
      dateTime: "asc",
    },
  });

  if (firstMatch) {
    const now = new Date();
    if (new Date(firstMatch.dateTime) <= now) {
      return { success: false, error: "Die WM hat bereits begonnen. Weltmeister-Tipps sind gesperrt." };
    }
  }

  try {
    await prisma.tippUser.update({
      where: { id: user.id },
      data: { championPrediction: teamName.trim() },
    });
    return { success: true };
  } catch (error) {
    console.error("Submit champion prediction error:", error);
    return { success: false, error: "Tipp konnte nicht gespeichert werden." };
  }
}

export async function evaluateChampionPrediction(winningTeam: string, pointsToAward: number) {
  try {
    const users = await prisma.tippUser.findMany();
    
    for (const user of users) {
      const isCorrect = 
        user.championPrediction?.trim().toLowerCase() === winningTeam.trim().toLowerCase();
      
      const championPoints = isCorrect ? pointsToAward : 0;
      
      // Fetch user prediction points sum
      const userPredictions = await prisma.prediction.findMany({
        where: { userId: user.id, points: { not: null } },
      });
      const predictionsPoints = userPredictions.reduce((sum, p) => sum + (p.points || 0), 0);
      
      await prisma.tippUser.update({
        where: { id: user.id },
        data: {
          championPoints,
          totalPoints: predictionsPoints + championPoints,
        },
      });
    }

    return { success: true };
  } catch (error) {
    console.error("Evaluate champion error:", error);
    return { success: false, error: "Fehler bei der Auswertung des Weltmeisters." };
  }
}

export async function getUniqueTeams(): Promise<string[]> {
  try {
    const matches = await prisma.match.findMany({
      select: {
        teamHome: true,
        teamAway: true,
      },
    });

    const teams = new Set<string>();
    matches.forEach((m) => {
      teams.add(m.teamHome.trim());
      teams.add(m.teamAway.trim());
    });

    return Array.from(teams).sort((a, b) => a.localeCompare(b, "de"));
  } catch (error) {
    console.error("Get unique teams error:", error);
    return [];
  }
}

export async function verifyMembersViaCSV(csvText: string) {
  try {
    if (!csvText || csvText.trim().length === 0) {
      return { success: false, error: "Die CSV-Datei ist leer." };
    }

    // Split text by lines
    const lines = csvText.split(/\r?\n/);
    const emailsInCSV = new Set<string>();
    const phonesInCSV = new Set<string>();

    for (const line of lines) {
      if (!line.trim()) continue;

      // Determine separator (comma or semicolon)
      const separator = line.includes(";") ? ";" : ",";
      const fields = line.split(separator);

      for (let field of fields) {
        field = field.trim().replace(/^["']|["']$/g, "").trim(); // strip quotes
        
        // Check if it's an email
        if (field.includes("@") && field.includes(".")) {
          emailsInCSV.add(field.toLowerCase());
        }
        
        // Check if it's a phone number (only digits, spaces, +, /, -, parentheses)
        // Must contain at least 5 digits to avoid matching short fields
        const digits = field.replace(/\D/g, "");
        if (digits.length >= 5 && /^[+\d\s\/\(\)-]+$/.test(field)) {
          const normalized = field.startsWith("+") ? "+" + digits : digits;
          phonesInCSV.add(normalized);
        }
      }
    }

    // Query TippUsers who selected they are a member, but are not verified yet
    const usersToVerify = await prisma.tippUser.findMany({
      where: {
        isMember: true,
        isMemberVerified: false,
      },
    });

    let verifiedCount = 0;

    for (const user of usersToVerify) {
      let isMatch = false;

      // Check Email
      if (user.email) {
        const userEmail = user.email.trim().toLowerCase();
        if (emailsInCSV.has(userEmail)) {
          isMatch = true;
        }
      }

      // Check Phone
      if (!isMatch && user.phone) {
        const userPhoneDigits = user.phone.replace(/\D/g, "");
        const userPhoneNormalized = user.phone.trim().startsWith("+") ? "+" + userPhoneDigits : userPhoneDigits;
        
        if (phonesInCSV.has(userPhoneNormalized)) {
          isMatch = true;
        }
      }

      if (isMatch) {
        await prisma.tippUser.update({
          where: { id: user.id },
          data: { isMemberVerified: true },
        });
        verifiedCount++;
      }
    }

    return {
      success: true,
      verifiedCount,
      totalChecked: usersToVerify.length,
    };
  } catch (error) {
    console.error("CSV Verification error:", error);
    return { success: false, error: "Fehler bei der CSV-Verarbeitung." };
  }
}

export async function toggleMemberVerification(userId: string, isVerified: boolean) {
  try {
    await prisma.tippUser.update({
      where: { id: userId },
      data: { isMemberVerified: isVerified },
    });
    return { success: true };
  } catch (error) {
    console.error("Toggle member verification error:", error);
    return { success: false, error: "Fehler beim Aktualisieren des Verifizierungsstatus." };
  }
}

export async function deleteTippUser(userId: string) {
  try {
    await prisma.tippUser.delete({
      where: { id: userId },
    });
    return { success: true };
  } catch (error) {
    console.error("Delete tipp user error:", error);
    return { success: false, error: "Fehler beim Löschen des Benutzers." };
  }
}

export async function resetTippUserPin(userId: string, newPin: string) {
  const trimmedPin = newPin.trim();
  if (!trimmedPin || trimmedPin.length < 4) {
    return { success: false, error: "Die PIN/das Passwort muss mindestens 4 Zeichen lang sein." };
  }

  try {
    const hashedPassword = hashPassword(trimmedPin);
    await prisma.tippUser.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });
    return { success: true };
  } catch (error) {
    console.error("Reset tipp user PIN error:", error);
    return { success: false, error: "Fehler beim Zurücksetzen der PIN." };
  }
}




