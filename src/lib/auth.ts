import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile, Board } from "@/lib/types";

const PALETTE = ["#6366F1", "#10B981", "#F43F5E", "#F59E0B", "#0EA5E9", "#8B5CF6", "#14B8A6", "#EC4899"];

function pickColor(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return PALETTE[Math.abs(h) % PALETTE.length];
}

/**
 * Get the current authenticated user, redirecting to /login if not signed in.
 * Also lazily creates profile + default workspace + board if the signup trigger
 * missed (failed silently, per defensive trigger design).
 */
export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Lazy-ensure profile exists
  let { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle<Profile>();

  if (!profile) {
    const name = (user.user_metadata?.name as string) || user.email?.split("@")[0] || "New User";
    const color = pickColor(user.id);
    const inserted = await supabase
      .from("profiles")
      .insert({ id: user.id, name, avatar_color: color, role: "member" })
      .select("*")
      .single<Profile>();
    profile = inserted.data;
  }

  // Lazy-ensure at least one workspace
  const { data: existingMembership } = await supabase
    .from("workspace_members")
    .select("workspace_id")
    .eq("user_id", user.id)
    .limit(1);

  if (!existingMembership || existingMembership.length === 0) {
    const { data: ws } = await supabase
      .from("workspaces")
      .insert({ name: "My Workspace", color: "#6366F1", owner_id: user.id })
      .select("*")
      .single();
    if (ws) {
      await supabase.from("workspace_members").insert({
        workspace_id: ws.id,
        user_id: user.id,
        role: "admin",
      });
      const { data: board } = await supabase
        .from("boards")
        .insert({ workspace_id: ws.id, name: "My First Board", color: "#6366F1" })
        .select("*")
        .single<Board>();
      if (board) {
        await supabase.from("tasks").insert([
          { board_id: board.id, title: "Welcome to Monday Pro 👋", description: "This is a sample task. Click to edit, drag between columns to change status.", assignee_id: user.id, status: "todo", priority: "medium", position: 0, created_by: user.id },
          { board_id: board.id, title: "Try dragging this card", description: "Move tasks across columns to update status.", assignee_id: user.id, status: "in_progress", priority: "high", position: 1, created_by: user.id },
          { board_id: board.id, title: "Leave a comment", description: "Open a task to see the comments thread.", assignee_id: user.id, status: "review", priority: "low", position: 2, created_by: user.id },
          { board_id: board.id, title: "Mark something done", description: "Completing tasks is satisfying.", assignee_id: user.id, status: "done", priority: "medium", position: 3, created_by: user.id },
        ]);
      }
    }
  }

  return { user, profile: profile! };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
}
