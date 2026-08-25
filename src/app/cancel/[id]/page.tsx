import { redirect } from "next/navigation";

export default async function CancelBookingPage({ params }: { params: { id: string } }) {
  const { id } = await params;
  redirect(`/manage-booking/${id}`);
}
