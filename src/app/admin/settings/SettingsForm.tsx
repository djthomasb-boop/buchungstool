"use client";

import { saveSmtpSettings } from "@/app/actions/settings";
import { Mail, Server, Shield, KeyRound, User, CheckCircle2 } from "lucide-react";
import { useState } from "react";

export function SettingsForm({
  initialHost,
  initialPort,
  initialUser,
  initialPass,
  initialFrom
}: {
  initialHost: string;
  initialPort: string;
  initialUser: string;
  initialPass: string;
  initialFrom: string;
}) {
  const [isSuccess, setIsSuccess] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPending(true);
    setIsSuccess(false);
    
    const formData = new FormData(e.currentTarget);
    await saveSmtpSettings(formData);
    
    setIsPending(false);
    setIsSuccess(true);
    
    // Hide success message after 3 seconds
    setTimeout(() => {
      setIsSuccess(false);
    }, 3000);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {isSuccess && (
        <div className="bg-green-500/10 border border-green-500/20 text-green-600 p-4 rounded-xl flex items-center gap-3 animate-fade-in mb-6">
          <CheckCircle2 size={20} />
          <span className="font-medium">Einstellungen wurden erfolgreich gespeichert!</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium mb-2 text-foreground/80 flex items-center gap-2">
            <Server size={16} /> SMTP Server (Host)
          </label>
          <input 
            name="host"
            type="text" 
            defaultValue={initialHost}
            placeholder="smtp.ionos.de"
            className="w-full bg-background border border-foreground/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2 text-foreground/80 flex items-center gap-2">
            <Shield size={16} /> Port
          </label>
          <input 
            name="port"
            type="text" 
            defaultValue={initialPort}
            placeholder="587 oder 465"
            className="w-full bg-background border border-foreground/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2 text-foreground/80 flex items-center gap-2">
            <User size={16} /> Benutzername (E-Mail)
          </label>
          <input 
            name="user"
            type="text" 
            defaultValue={initialUser}
            placeholder="info@mein-center.de"
            className="w-full bg-background border border-foreground/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2 text-foreground/80 flex items-center gap-2">
            <KeyRound size={16} /> Passwort
          </label>
          <input 
            name="pass"
            type="password" 
            defaultValue={initialPass}
            placeholder="********"
            className="w-full bg-background border border-foreground/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
        </div>
      </div>

      <div className="pt-6 border-t border-foreground/10">
        <label className="block text-sm font-medium mb-2 text-foreground/80 flex items-center gap-2">
          <Mail size={16} /> Absender-Adresse (Von)
        </label>
        <input 
          name="from"
          type="email" 
          defaultValue={initialFrom}
          placeholder="buchungen@mein-center.de"
          className="w-full md:w-1/2 bg-background border border-foreground/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
        />
        <p className="text-xs text-foreground/50 mt-2">Diese Adresse wird dem Kunden als Absender der Bestätigungsmail angezeigt.</p>
      </div>

      <div className="pt-6 flex justify-end">
        <button 
          type="submit" 
          disabled={isPending}
          className="bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-lg shadow-blue-500/30 flex items-center gap-2"
        >
          {isPending ? (
            <>
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              Speichern...
            </>
          ) : 'Einstellungen speichern'}
        </button>
      </div>
    </form>
  );
}
