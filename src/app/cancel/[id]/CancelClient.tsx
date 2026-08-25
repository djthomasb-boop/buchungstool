"use client";

import { useState } from "react";
import { cancelBookingCustomer } from "@/app/actions/admin";
import { CheckCircle2, AlertTriangle, ArrowRight } from "lucide-react";
import Link from "next/link";

export function CancelClient({ bookingId, isPast24h, isAlreadyCancelled }: { bookingId: string, isPast24h: boolean, isAlreadyCancelled: boolean }) {
  const [isPending, setIsPending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (isAlreadyCancelled) {
    return (
      <div className="text-center">
        <div className="bg-red-500/10 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500">
          <AlertTriangle size={48} />
        </div>
        <h1 className="text-3xl font-extrabold mb-4">Bereits storniert</h1>
        <p className="text-foreground/70 mb-8">Diese Buchung wurde bereits erfolgreich storniert.</p>
        <Link href="/">
          <button className="bg-foreground/5 hover:bg-foreground/10 px-8 py-3 rounded-xl font-bold transition-all">
            Zur Startseite
          </button>
        </Link>
      </div>
    );
  }

  if (isPast24h) {
    return (
      <div className="text-center">
         <div className="bg-orange-500/10 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 text-orange-500">
          <AlertTriangle size={48} />
        </div>
        <h1 className="text-3xl font-extrabold mb-4">Stornierung nicht möglich</h1>
        <p className="text-foreground/70 mb-8 max-w-md mx-auto">
          Eine Online-Stornierung ist leider nur bis 24 Stunden vor dem Termin möglich. Bitte rufen Sie uns direkt an, um Ihren Termin abzusagen.
        </p>
        <Link href="/">
          <button className="bg-blue-500 text-white hover:bg-blue-600 px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-500/30">
            Verstanden
          </button>
        </Link>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="text-center animate-fade-in">
        <div className="bg-green-500/10 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 text-green-500">
          <CheckCircle2 size={48} />
        </div>
        <h1 className="text-3xl font-extrabold mb-4">Stornierung erfolgreich</h1>
        <p className="text-foreground/70 mb-8 max-w-md mx-auto">
          Ihre Buchung wurde erfolgreich storniert. Sie erhalten dazu keine separate E-Mail mehr.
        </p>
        <Link href="/">
          <button className="bg-blue-500 text-white hover:bg-blue-600 px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-500/30 flex items-center gap-2 mx-auto">
            Zurück zur Startseite <ArrowRight size={18} />
          </button>
        </Link>
      </div>
    );
  }

  const handleCancel = async () => {
    setIsPending(true);
    setErrorMsg("");
    const result = await cancelBookingCustomer(bookingId);
    if (result.success) {
      setIsSuccess(true);
    } else {
      setErrorMsg(result.error || "Es gab ein Problem bei der Stornierung.");
    }
    setIsPending(false);
  };

  return (
    <div className="text-center">
      <h1 className="text-3xl font-extrabold mb-4 text-red-600">Buchung stornieren</h1>
      <p className="text-foreground/70 mb-8 max-w-md mx-auto">
        Möchten Sie diese Buchung wirklich unwiderruflich stornieren? Dieser Vorgang kann nicht rückgängig gemacht werden.
      </p>

      {errorMsg && (
        <div className="bg-red-500/10 text-red-600 p-4 rounded-xl mb-6 font-medium text-sm border border-red-500/20">
          {errorMsg}
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-center gap-4">
        <button 
          onClick={handleCancel}
          disabled={isPending}
          className="bg-red-600 hover:bg-red-700 text-white font-bold px-8 py-3 rounded-xl transition-all shadow-lg shadow-red-600/30 disabled:opacity-50"
        >
          {isPending ? "Storniere..." : "Ja, jetzt stornieren"}
        </button>
        <Link href="/">
          <button className="bg-foreground/5 hover:bg-foreground/10 px-8 py-3 rounded-xl font-bold transition-all">
            Nein, doch nicht
          </button>
        </Link>
      </div>
    </div>
  );
}
