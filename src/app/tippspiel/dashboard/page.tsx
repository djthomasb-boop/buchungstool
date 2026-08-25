import { redirect } from "next/navigation";
import { getCurrentTippUser, getUniqueTeams } from "@/app/actions/tipp";
import { prisma } from "@/lib/prisma";
import TippNav from "@/components/TippNav";
import TippDashboardClient from "@/components/TippDashboardClient";

export const revalidate = 0; // Disable caching to ensure fresh predictions and sync status

export default async function TippspielDashboardPage() {
  const user = await getCurrentTippUser();
  
  if (!user) {
    redirect("/tippspiel");
  }

  // Fetch all matches
  const matches = await prisma.match.findMany({
    orderBy: {
      dateTime: "asc",
    },
  });

  // Fetch all predictions by the current user
  const predictions = await prisma.prediction.findMany({
    where: {
      userId: user.id,
    },
  });

  // Fetch unique teams for champion dropdown selection
  const uniqueTeams = await getUniqueTeams();

  return (
    <div className="pb-16">
      <TippNav user={user} />
      <main className="max-w-6xl mx-auto px-4 mt-6">
        <TippDashboardClient 
          initialMatches={JSON.parse(JSON.stringify(matches))} 
          initialPredictions={JSON.parse(JSON.stringify(predictions))} 
          teams={uniqueTeams}
          currentUser={JSON.parse(JSON.stringify(user))}
        />
      </main>
    </div>
  );
}
