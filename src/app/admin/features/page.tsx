import { Lightbulb } from "lucide-react";
import { FeatureForm } from "./FeatureForm";

export default function FeaturesPage() {
  return (
    <div className="p-8 md:p-12 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight">Features vorschlagen</h1>
        <p className="text-foreground/60 mt-1">Sende neue Ideen oder Wünsche direkt an die Entwickler.</p>
      </div>

      <div className="glass p-8 rounded-3xl border border-foreground/5">
        <div className="flex justify-between items-center mb-6 pb-6 border-b border-foreground/10">
          <div className="flex items-center gap-3">
            <div className="bg-red-500/10 p-3 rounded-xl text-red-500">
              <Lightbulb size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold">Neue Idee einreichen</h2>
              <p className="text-sm text-foreground/50">Deine Anfrage geht per E-Mail an mail@dtbmediamix.de</p>
            </div>
          </div>
        </div>

        <FeatureForm />
      </div>
    </div>
  );
}
