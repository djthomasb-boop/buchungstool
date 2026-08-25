"use client";

import { submitFeatureSuggestion } from "@/app/actions/features";
import { CheckCircle2, User, FileText, AlertCircle } from "lucide-react";
import { useState } from "react";

export function FeatureForm() {
  const [isPending, setIsPending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPending(true);
    setIsSuccess(false);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const result = await submitFeatureSuggestion(formData);

    if (result.success) {
      setIsSuccess(true);
      (e.target as HTMLFormElement).reset();
    } else {
      setError(result.error || "Ein unbekannter Fehler ist aufgetreten.");
    }

    setIsPending(false);

    if (result.success) {
      setTimeout(() => setIsSuccess(false), 5000);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {isSuccess && (
        <div className="bg-green-500/10 border border-green-500/20 text-green-600 p-4 rounded-xl flex items-center gap-3 animate-fade-in">
          <CheckCircle2 size={20} />
          <span className="font-medium">Vielen Dank! Dein Vorschlag wurde erfolgreich gesendet.</span>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-600 p-4 rounded-xl flex items-center gap-3 animate-fade-in">
          <AlertCircle size={20} />
          <span className="font-medium">{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium mb-2 text-foreground/80 flex items-center gap-2">
            <User size={16} /> Mitarbeiter (Dein Name)
          </label>
          <input 
            name="name"
            type="text" 
            required
            placeholder="Max Mustermann"
            className="w-full bg-background border border-foreground/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500/50"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2 text-foreground/80 flex items-center gap-2">
            <AlertCircle size={16} /> Priorität
          </label>
          <select 
            name="priority"
            defaultValue="normal"
            className="w-full bg-background border border-foreground/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500/50 appearance-none"
          >
            <option value="normal">Normal</option>
            <option value="mittel">Mittel</option>
            <option value="hoch">Hoch</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2 text-foreground/80 flex items-center gap-2">
          <FileText size={16} /> Beschreibe Dein gewünschtes Feature
        </label>
        <textarea
          name="description"
          required
          rows={6}
          placeholder="Ich würde mir wünschen, dass..."
          className="w-full bg-background border border-foreground/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500/50 resize-y"
        />
      </div>

      <div className="pt-2 flex justify-end">
        <button 
          type="submit" 
          disabled={isPending}
          className="bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-lg shadow-red-500/30 flex items-center gap-2"
        >
          {isPending ? (
            <>
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              Sende...
            </>
          ) : 'Vorschlag senden'}
        </button>
      </div>
    </form>
  );
}
