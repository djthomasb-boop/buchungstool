import { getTippSettings } from "@/app/actions/tipp";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";


export default async function TippspielLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getTippSettings();
  
  if (!settings.active) {
    redirect("/");
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-background">
      {/* Background Decorators */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-[#f23529]/10 blur-[120px] pointer-events-none animate-pulse duration-[8s]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/10 blur-[120px] pointer-events-none animate-pulse duration-[10s]" />
      
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
