"use client";
 
import { useState, useEffect } from "react";
import { User, Lock, ArrowRight, Trophy, Sparkles, Mail, Phone } from "lucide-react";
import { loginTippUser, registerTippUser, getCurrentTippUser } from "@/app/actions/tipp";
import { useRouter } from "next/navigation";
 
export default function TippspielLoginPage() {
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [nickname, setNickname] = useState("");
  const [pin, setPin] = useState("");
  
  // Registration lead states
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [isMember, setIsMember] = useState(false);
 
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
 
  // Check if user is already logged in
  useEffect(() => {
    async function checkAuth() {
      const user = await getCurrentTippUser();
      if (user) {
        router.push("/tippspiel/dashboard");
      }
    }
    checkAuth();
  }, [router]);
 
  const handleAction = async (actionType: "login" | "register") => {
    setIsLoading(true);
    setError("");
    setMessage("");
 
    if (!nickname.trim() || !pin) {
      setError("Nickname und Passwort/PIN müssen ausgefüllt sein.");
      setIsLoading(false);
      return;
    }
 
    if (actionType === "register") {
      const trimmedEmail = email.trim();
      if (!trimmedEmail || !trimmedEmail.includes("@") || trimmedEmail.split("@")[1]?.indexOf(".") === -1) {
        setError("Bitte gib eine gültige E-Mail-Adresse ein.");
        setIsLoading(false);
        return;
      }
 
      const trimmedPhone = phone.trim();
      if (!trimmedPhone || trimmedPhone.length < 5) {
        setError("Bitte gib eine gültige Telefonnummer ein.");
        setIsLoading(false);
        return;
      }
    }
 
    try {
      const res =
        actionType === "login"
          ? await loginTippUser(nickname, pin)
          : await registerTippUser(nickname, pin, email, phone, isMember);
 
      if (res.success) {
        if (actionType === "register") {
          setMessage("Registrierung erfolgreich! Leite weiter...");
          setTimeout(() => {
            router.push("/tippspiel/dashboard");
          }, 1500);
        } else {
          router.push("/tippspiel/dashboard");
        }
      } else {
        setError(res.error || "Ein Fehler ist aufgetreten.");
        setIsLoading(false);
      }
    } catch (err) {
      console.error(err);
      setError("Verbindung zum Server fehlgeschlagen.");
      setIsLoading(false);
    }
  };
 
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 relative">
      <div className="w-full max-w-md z-10 animate-fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-[#f23529]/10 text-[#cd1212] dark:text-[#f23529] rounded-2xl mb-4 border border-[#f23529]/20 animate-bounce">
            <Trophy size={36} />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground flex items-center justify-center gap-2">
            WM 2026 Tippspiel
          </h1>
          <p className="text-lg text-blue-500 font-extrabold mt-2 animate-pulse">
            🏆 Tippe mit und gewinne tolle Preise! 🎁
          </p>
          <p className="text-foreground/60 mt-1 font-medium">
            Gib deine Tipps ab und erklimme die Rangliste!
          </p>
        </div>
 
        <div className="glass p-8 rounded-3xl shadow-2xl border border-foreground/10 backdrop-blur-xl relative overflow-hidden">
          {/* Tabs at the top */}
          <div className="flex border-b border-foreground/10 mb-6">
            <button
              onClick={() => {
                setActiveTab("login");
                setError("");
                setMessage("");
              }}
              className={`flex-1 py-3 text-center font-bold transition-all border-b-2 ${
                activeTab === "login"
                  ? "border-blue-500 text-foreground border-b-2"
                  : "border-transparent text-foreground/40 hover:text-foreground/60"
              }`}
            >
              Anmelden
            </button>
            <button
              onClick={() => {
                setActiveTab("register");
                setError("");
                setMessage("");
              }}
              className={`flex-1 py-3 text-center font-bold transition-all border-b-2 ${
                activeTab === "register"
                  ? "border-blue-500 text-foreground border-b-2"
                  : "border-transparent text-foreground/40 hover:text-foreground/60"
              }`}
            >
              Konto erstellen
            </button>
          </div>
 
          {/* Form */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold mb-2 text-foreground/80">Nickname</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/40" size={20} />
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="Z.B. Ballkünstler"
                  className="w-full bg-background/50 border-2 border-foreground/10 rounded-2xl py-4 pl-12 pr-4 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 outline-none transition-all font-medium"
                  required
                />
              </div>
            </div>
 
            <div>
              <label className="block text-sm font-bold mb-2 text-foreground/80">Passwort / PIN</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/40" size={20} />
                <input
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="Mind. 4 Zeichen"
                  className="w-full bg-background/50 border-2 border-foreground/10 rounded-2xl py-4 pl-12 pr-4 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 outline-none transition-all font-medium"
                  required
                />
              </div>
            </div>
 
            {activeTab === "register" && (
              <>
                <div>
                  <label className="block text-sm font-bold mb-2 text-foreground/80">E-Mail-Adresse</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/40" size={20} />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="deine.mail@adresse.de"
                      className="w-full bg-background/50 border-2 border-foreground/10 rounded-2xl py-4 pl-12 pr-4 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 outline-none transition-all font-medium"
                      required
                    />
                  </div>
                </div>
 
                <div>
                  <label className="block text-sm font-bold mb-2 text-foreground/80">Telefonnummer</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/40" size={20} />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="z.B. 0170 1234567"
                      className="w-full bg-background/50 border-2 border-foreground/10 rounded-2xl py-4 pl-12 pr-4 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 outline-none transition-all font-medium"
                      required
                    />
                  </div>
                </div>
 
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-foreground/80">
                    Bist Du bereits Mitglied von be free e.V.?
                  </label>
                  <div className="flex gap-4">
                    <label className="flex-1 flex items-center justify-between p-3.5 bg-background/50 border-2 border-foreground/10 rounded-2xl cursor-pointer hover:border-blue-500/40 transition-all">
                      <span className="font-bold text-sm text-foreground/80">Ja</span>
                      <input
                        type="radio"
                        name="isMember"
                        checked={isMember === true}
                        onChange={() => setIsMember(true)}
                        className="w-4 h-4 accent-blue-500 cursor-pointer"
                      />
                    </label>
                    <label className="flex-1 flex items-center justify-between p-3.5 bg-background/50 border-2 border-foreground/10 rounded-2xl cursor-pointer hover:border-blue-500/40 transition-all">
                      <span className="font-bold text-sm text-foreground/80">Nein</span>
                      <input
                        type="radio"
                        name="isMember"
                        checked={isMember === false}
                        onChange={() => setIsMember(false)}
                        className="w-4 h-4 accent-blue-500 cursor-pointer"
                      />
                    </label>
                  </div>
                </div>
              </>
            )}
 
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm font-bold text-center">
                {error}
              </div>
            )}
 
            {message && (
              <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-green-600 dark:text-green-400 text-sm font-bold text-center">
                {message}
              </div>
            )}
 
            <button
              type="button"
              onClick={() => handleAction(activeTab)}
              disabled={isLoading}
              className={`w-full py-4 rounded-2xl font-black transition-all flex items-center justify-center gap-1.5 shadow-lg ${
                activeTab === "login"
                  ? "bg-foreground text-background hover:bg-foreground/95"
                  : "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20"
              }`}
            >
              {activeTab === "login" ? (
                <>
                  Einloggen <ArrowRight size={18} />
                </>
              ) : (
                <>
                  <Sparkles size={18} /> Registrieren
                </>
              )}
            </button>
          </div>
        </div>
 
        <p className="text-center text-xs text-foreground/40 mt-8 font-medium">
          be free Sport & Erholungszentrum &copy; {new Date().getFullYear()}
        </p>
      </div>
    </main>
  );
}
