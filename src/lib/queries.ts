import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Board, Profile, Task, Workspace } from "@/lib/types";

export async function getMyWorkspaces(userId: string): Promise<Workspace[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("workspaces")
    .select("*, workspace_members!inner(user_id)")
    .eq("workspace_members.user_id", userId)
    .order("created_at", { ascending: true });
  return (data || []).map((w) => ({ ...w, workspace_members: undefined } as unknown as Workspace));
}

export async function getMyBoards(userId: string): Promise<Board[]> {
  const supabase = await createClient();
  const { data: memberships } = await supabase
    .from("workspace_members")
    .select("workspace_id")
    .eq("user_id", userId);
  const ids = (memberships || []).map((m) => m.workspace_id);
  if (ids.length === 0) return [];
  const { data } = await supabase
    .from("boards")
    .select("*")
    .in("workspace_id", ids)
    .order("created_at", { ascending: true });
  return data || [];
}

export async function getBoard(boardId: string): Promise<Board | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("boards").select("*").eq("id", boardId).maybeSingle();
  return data;
}

export async function getBoardTasks(boardId: string): Promise<Task[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("tasks")
    .select("*")
    .eq("board_id", boardId)
    .order("position", { ascending: true });
  return data || [];
}

export async function getMyTasks(userId: string): Promise<Task[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("tasks")
    .select("*")
    .eq("assignee_id", userId)
    .order("due_date", { ascending: true, nullsFirst: false });
  return data || [];
}

export async function getProfiles(): Promise<Profile[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("*").order("name");
  return data || [];
}

export async function getTask(taskId: string): Promise<Task | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("tasks").select("*").eq("id", taskId).maybeSingle();
  return data;
}
