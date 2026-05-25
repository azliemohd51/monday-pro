"use client";
import { useEffect, useState, useTransition } from "react";
import { X, Trash2, Send } from "lucide-react";
import type { Profile, Task, TaskPriority, TaskStatus, Comment } from "@/lib/types";
import {
  STATUS_LABELS,
  STATUS_COLORS,
  STATUS_ORDER,
  PRIORITY_LABELS,
  PRIORITY_COLORS,
} from "@/lib/types";
import { Avatar } from "@/components/avatar";
import { createClient } from "@/lib/supabase/client";
import { addCommentAction, deleteTaskAction, updateTaskAction } from "@/app/(app)/actions";

const PRIORITY_ORDER: TaskPriority[] = ["low", "medium", "high", "critical"];

interface Props {
  task: Task;
  profiles: Profile[];
  onClose: () => void;
  onPatch: (patch: Partial<Task>) => void;
  onDelete: () => void;
}

interface CommentWithProfile extends Comment {
  profile?: Profile | null;
}

export function TaskDrawer({ task, profiles, onClose, onPatch, onDelete }: Props) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description);
  const [comments, setComments] = useState<CommentWithProfile[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isPosting, startPostComment] = useTransition();
  const [, startUpdate] = useTransition();
  const profilesById = new Map(profiles.map((p) => [p.id, p]));

  useEffect(() => {
    setTitle(task.title);
    setDescription(task.description);
  }, [task.id, task.title, task.description]);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("comments")
        .select("*")
        .eq("task_id", task.id)
        .order("created_at", { ascending: true });
      if (!cancelled && data) {
        const withProfiles: CommentWithProfile[] = data.map((c) => ({
          ...c,
          profile: profilesById.get(c.user_id) || null,
        }));
        setComments(withProfiles);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [task.id]);

  function commitField(patch: Partial<Task>) {
    onPatch(patch);
    startUpdate(async () => {
      await updateTaskAction(task.id, patch);
    });
  }

  function handleAddComment() {
    const content = newComment.trim();
    if (!content) return;
    const me = profiles.find((p) => p.id === task.created_by); // fallback display
    const optimistic: CommentWithProfile = {
      id: `temp-${Date.now()}`,
      task_id: task.id,
      user_id: me?.id || "",
      content,
      created_at: new Date().toISOString(),
      profile: me || null,
    };
    setComments((prev) => [...prev, optimistic]);
    setNewComment("");
    startPostComment(async () => {
      await addCommentAction(task.id, content);
      // Refetch to get the real comment with correct user
      const supabase = createClient();
      const { data } = await supabase
        .from("comments")
        .select("*")
        .eq("task_id", task.id)
        .order("created_at", { ascending: true });
      if (data) {
        const withProfiles: CommentWithProfile[] = data.map((c) => ({
          ...c,
          profile: profilesById.get(c.user_id) || null,
        }));
        setComments(withProfiles);
      }
    });
  }

  function handleDelete() {
    if (!confirm(`Delete "${task.title}"?`)) return;
    onDelete();
    startUpdate(async () => {
      await deleteTaskAction(task.id);
    });
  }

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/30 z-40" onClick={onClose} />
      <div className="fixed top-0 right-0 bottom-0 w-[480px] max-w-[92vw] bg-white z-50 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
        <div className="h-12 border-b border-slate-200 flex items-center justify-between px-4 flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ background: STATUS_COLORS[task.status] }} />
            <span className="text-xs font-medium text-slate-500">{STATUS_LABELS[task.status]}</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-900 p-1 rounded hover:bg-slate-100">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-4 border-b border-slate-100">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => title !== task.title && commitField({ title: title.trim() || task.title })}
            onKeyDown={(e) => {
              if (e.key === "Enter") (e.target as HTMLInputElement).blur();
            }}
            className="text-xl font-semibold w-full outline-none focus:bg-slate-50 rounded px-1 -mx-1"
          />
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="px-6 py-4 space-y-4 border-b border-slate-100">
            <FieldRow label="Status">
              <select
                value={task.status}
                onChange={(e) => commitField({ status: e.target.value as TaskStatus })}
                className="status-pill w-full justify-between cursor-pointer appearance-none border-0 outline-none"
                style={{ background: STATUS_COLORS[task.status] }}
              >
                {STATUS_ORDER.map((s) => (
                  <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                ))}
              </select>
            </FieldRow>

            <FieldRow label="Priority">
              <select
                value={task.priority}
                onChange={(e) => commitField({ priority: e.target.value as TaskPriority })}
                className="px-3 h-7 rounded text-xs font-bold uppercase tracking-wider appearance-none border-0 outline-none cursor-pointer"
                style={{ background: `${PRIORITY_COLORS[task.priority]}22`, color: PRIORITY_COLORS[task.priority] }}
              >
                {PRIORITY_ORDER.map((p) => (
                  <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>
                ))}
              </select>
            </FieldRow>

            <FieldRow label="Assignee">
              <select
                value={task.assignee_id || ""}
                onChange={(e) => commitField({ assignee_id: e.target.value || null })}
                className="input"
              >
                <option value="">Unassigned</option>
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              {task.assignee_id && profilesById.get(task.assignee_id) && (
                <div className="mt-2 flex items-center gap-2">
                  <Avatar name={profilesById.get(task.assignee_id)!.name} color={profilesById.get(task.assignee_id)!.avatar_color} size={24} />
                  <span className="text-sm text-slate-600">{profilesById.get(task.assignee_id)!.name}</span>
                </div>
              )}
            </FieldRow>

            <FieldRow label="Due date">
              <input
                type="date"
                value={task.due_date || ""}
                onChange={(e) => commitField({ due_date: e.target.value || null })}
                className="input"
              />
            </FieldRow>

            <FieldRow label="Description">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={() => description !== task.description && commitField({ description })}
                rows={4}
                className="input resize-y"
                placeholder="Add a description…"
              />
            </FieldRow>
          </div>

          <div className="px-6 py-4">
            <h3 className="text-xs uppercase tracking-wider font-semibold text-slate-500 mb-3">
              Comments {comments.length > 0 && <span className="ml-1 text-slate-400">({comments.length})</span>}
            </h3>
            <div className="space-y-3 mb-4">
              {comments.length === 0 && (
                <p className="text-sm text-slate-400 italic">No comments yet. Start the conversation.</p>
              )}
              {comments.map((c) => (
                <div key={c.id} className="flex gap-3">
                  <Avatar
                    name={c.profile?.name || "?"}
                    color={c.profile?.avatar_color || "#94A3B8"}
                    size={28}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 mb-0.5">
                      <span className="text-sm font-semibold">{c.profile?.name || "Unknown"}</span>
                      <span className="text-[11px] text-slate-400">{formatRelative(c.created_at)}</span>
                    </div>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap break-words">{c.content}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2 items-start">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault();
                    handleAddComment();
                  }
                }}
                rows={2}
                placeholder="Write a comment…  (⌘+Enter to send)"
                className="input resize-none flex-1"
              />
              <button
                onClick={handleAddComment}
                disabled={isPosting || !newComment.trim()}
                className="btn-primary self-stretch px-3 disabled:opacity-50"
                title="Send"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200 px-6 py-3 flex items-center justify-between flex-shrink-0">
          <button
            onClick={handleDelete}
            className="text-sm text-rose-500 hover:text-rose-700 flex items-center gap-1.5"
          >
            <Trash2 className="w-4 h-4" />
            Delete task
          </button>
          <span className="text-[10px] text-slate-300 font-mono">#{task.id.slice(0, 8)}</span>
        </div>
      </div>
    </>
  );
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="label">{label}</div>
      {children}
    </div>
  );
}

function formatRelative(ts: string) {
  const d = new Date(ts);
  const now = new Date();
  const diff = (now.getTime() - d.getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return d.toLocaleDateString();
}
