export type PublicTaskcenterEvent = {
  id: number;
  name: string;
  date: string;
  startTime: string | null;
  location: string | null;
  description: string | null;
  bannerUrl: string | null;
  ticketSalesActive: boolean;
};

type TaskcenterEventResponse = {
  id?: number;
  name?: string;
  date?: string;
  start_time?: string | null;
  location?: string | null;
  description?: string | null;
  banner_url?: string | null;
  status?: string;
  public_sales_active?: number | boolean | null;
  is_archived?: number | boolean | null;
};

function normalizeBannerUrl(value: string | null | undefined, apiBaseUrl: string) {
  if (!value) return null;

  try {
    const normalizedValue = value.startsWith("public/") ? value.slice("public".length) : value;
    const url = new URL(normalizedValue, `${apiBaseUrl.replace(/\/$/, "")}/`);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function currentDateKey() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export async function getPublicTaskcenterEvents(): Promise<PublicTaskcenterEvent[]> {
  const apiBaseUrl = process.env.TASKCENTER_API_URL || "https://ticket.befree.works";
  const apiUserId = process.env.TASKCENTER_API_USER_ID;

  if (!apiUserId) {
    console.warn("Taskcenter events are disabled because TASKCENTER_API_USER_ID is not configured.");
    return [];
  }

  try {
    const response = await fetch(`${apiBaseUrl.replace(/\/$/, "")}/api/ticket_events?archived=0`, {
      headers: { "X-User-Id": apiUserId },
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      console.error(`Taskcenter events returned HTTP ${response.status}.`);
      return [];
    }

    const data = (await response.json()) as TaskcenterEventResponse[];
    if (!Array.isArray(data)) return [];

    const today = currentDateKey();

    return data
      .filter((event) =>
        typeof event.id === "number" &&
        typeof event.name === "string" &&
        typeof event.date === "string" &&
        event.date >= today &&
        event.status?.toLowerCase() === "aktiv" &&
        Number(event.is_archived || 0) !== 1
      )
      .map((event) => ({
        id: event.id as number,
        name: (event.name as string).trim(),
        date: event.date as string,
        startTime: event.start_time?.slice(0, 5) || null,
        location: event.location?.trim() || null,
        description: event.description?.trim() || null,
        bannerUrl: normalizeBannerUrl(event.banner_url, apiBaseUrl),
        ticketSalesActive: event.public_sales_active !== false && Number(event.public_sales_active ?? 1) !== 0,
      }))
      .sort((a, b) => `${a.date} ${a.startTime || ""}`.localeCompare(`${b.date} ${b.startTime || ""}`));
  } catch (error) {
    console.error("Taskcenter events could not be loaded:", error);
    return [];
  }
}
