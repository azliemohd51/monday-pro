import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getBoard, getBoardTasks, getProfiles } from "@/lib/queries";
import { BoardClient } from "./board-client";

export default async function BoardPage({ params }: { params: Promise<{ id: string }> }) {
  await getCurrentUser();
  const { id } = await params;
  const [board, tasks, profiles] = await Promise.all([
    getBoard(id),
    getBoardTasks(id),
    getProfiles(),
  ]);
  if (!board) notFound();

  return <BoardClient board={board} initialTasks={tasks} profiles={profiles} />;
}
