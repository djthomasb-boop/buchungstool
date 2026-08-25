"use client";

import { useEffect } from "react";

export function PrintButton() {
  useEffect(() => {
    // Automatically trigger browser print dialog shortly after loading
    const timer = setTimeout(() => {
      window.print();
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <button
      onClick={() => window.print()}
      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
    >
      <span>🖨️</span> Jetzt drucken / PDF speichern
    </button>
  );
}
