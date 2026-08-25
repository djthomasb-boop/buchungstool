"use client";

import { saveManualText } from "@/app/actions/manual";
import { Edit2, CheckCircle2, X } from "lucide-react";
import { useState } from "react";

export function ManualClient({ initialText }: { initialText: string }) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [text, setText] = useState(initialText);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPending(true);
    setIsSuccess(false);
    
    const formData = new FormData(e.currentTarget);
    await saveManualText(formData);
    
    setIsPending(false);
    setIsSuccess(true);
    setIsEditing(false);
    
    setTimeout(() => {
      setIsSuccess(false);
    }, 3000);
  };

  return (
    <div>
      {isSuccess && (
        <div className="bg-green-500/10 border border-green-500/20 text-green-600 p-4 rounded-xl flex items-center gap-3 animate-fade-in mb-6">
          <CheckCircle2 size={20} />
          <span className="font-medium">Bedienungsanleitung wurde erfolgreich gespeichert!</span>
        </div>
      )}

      {!isEditing ? (
        <div>
          <div className="flex justify-end mb-4">
            <button 
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 text-sm bg-foreground/5 hover:bg-foreground/10 px-4 py-2 rounded-lg transition-all"
            >
              <Edit2 size={16} /> Bearbeiten
            </button>
          </div>
          <div className="prose prose-invert max-w-none">
            <pre className="whitespace-pre-wrap font-sans text-foreground/80 leading-relaxed bg-transparent border-none p-0">
              {text}
            </pre>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-medium text-foreground/80">
              Bedienungsanleitung anpassen
            </label>
            <button 
              type="button"
              onClick={() => setIsEditing(false)}
              className="flex items-center gap-2 text-sm text-red-500 hover:bg-red-500/10 px-3 py-1.5 rounded-lg transition-all"
            >
              <X size={16} /> Abbrechen
            </button>
          </div>
          <textarea
            name="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full h-[500px] bg-background border border-foreground/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-y"
          />
          <div className="flex justify-end pt-2">
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
              ) : 'Speichern'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
