"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Board, TaskPriority, TaskStatus } from "@/lib/types";

export async function createBoardAction(workspaceId: string, name: string): Promise<Board | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("boards")
    .insert({ workspace_id: workspaceId, name, color: "#6366F1" })
    .select("*")
    .single<Board>();
  revalidatePath("/", "layout");
  return data;
}

export async function createTaskAction(boardId: string, status: TaskStatus, title: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: maxRow } = await supabase
    .from("tasks")
    .select("position")
    .eq("board_id", boardId)
    .eq("status", status)
    .order("position", { ascending: false })
    .limit(1);
  const nextPosition = (maxRow?.[0]?.position ?? -1) + 1;
  await supabase.from("tasks").insert({
    board_id: boardId,
    title,
    status,
    priority: "medium",
    position: nextPosition,
    created_by: user.id,
  });
  revalidatePath(`/boards/${boardId}`);
}

export async function updateTaskAction(
  taskId: string,
  patch: Partial<{
    title: string;
    description: string;
    assignee_id: string | null;
    status: TaskStatus;
    priority: TaskPriority;
    due_date: string | null;
  }>
) {
  const supabase = await createClient();
  const cleaned = { ...patch, updated_at: new Date().toISOString() };
  const { data: row } = await supabase
    .from("tasks")
    .update(cleaned)
    .eq("id", taskId)
    .select("board_id")
    .single<{ board_id: string }>();
  if (row?.board_id) revalidatePath(`/boards/${row.board_id}`);
}

export async function moveTaskAction(taskId: string, newStatus: TaskStatus, newPosition: number) {
  const supabase = await createClient();
  const { data: row } = await supabase
    .from("tasks")
    .update({ status: newStatus, position: newPosition, updated_at: new Date().toISOString() })
    .eq("id", taskId)
    .select("board_id")
    .single<{ board_id: string }>();
  if (row?.board_id) revalidatePath(`/boards/${row.board_id}`);
}

export async function deleteTaskAction(taskId: string) {
  const supabase = await createClient();
  const { data: row } = await supabase
    .from("tasks")
    .select("board_id")
    .eq("id", taskId)
    .single<{ board_id: string }>();
  await supabase.from("tasks").delete().eq("id", taskId);
  if (row?.board_id) revalidatePath(`/boards/${row.board_id}`);
}

export async function addCommentAction(taskId: string, content: string) {
  if (!content.trim()) return;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: row } = await supabase
    .from("tasks")
    .select("board_id")
    .eq("id", taskId)
    .single<{ board_id: string }>();
  await supabase.from("comments").insert({ task_id: taskId, user_id: user.id, content: content.trim() });
  if (row?.board_id) revalidatePath(`/boards/${row.board_id}`);
}

export async function updateProfileAction(name: string, avatarColor: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  await supabase.from("profiles").update({ name, avatar_color: avatarColor }).eq("id", user.id);
  revalidatePath("/", "layout");
}
