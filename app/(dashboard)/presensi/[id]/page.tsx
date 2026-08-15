import { AttendanceSheet } from "@/components/feature/attendance-sheet";

export default async function PresensiDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <AttendanceSheet eventId={id} />;
}