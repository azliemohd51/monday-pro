"use client";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { Plus, Calendar } from "lucide-react";
import type { Profile, Task, TaskStatus } from "@/lib/types";
import { Avatar } from "@/components/avatar";

export function KanbanColumn({
  status,
  label,
  color,
  count,
  children,
  onAdd,
}: {
  status: TaskStatus;
  label: string;
  color: string;
  count: number;
  children: React.ReactNode;
  onAdd: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  return (
    <div
      ref={setNodeRef}
      className={
        "min-w-[300px] w-[300px] bg-slate-100 rounded-lg p-2 flex flex-col flex-shrink-0 transition-colors " +
        (isOver ? "bg-indigo-100 outline outline-2 outline-accent outline-offset-[-4px]" : "")
      }
    >
      <div className="flex items-center justify-between px-2 py-2">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
          <span className="font-semibold text-sm" style={{ color }}>{label}</span>
          <span className="text-xs text-slate-400">{count}</span>
        </div>
        <button onClick={onAdd} className="text-slate-400 hover:text-slate-900 p-1 rounded hover:bg-white/60" title="Add task">
          <Plus className="w-4 h-4" />
        </button>
      </div>
      <div className="flex-1 min-h-[60px] space-y-2">{children}</div>
      <button
        onClick={onAdd}
        className="mt-2 w-full text-xs text-slate-500 hover:text-slate-900 py-1.5 px-2 rounded hover:bg-white/60 flex items-center gap-1.5"
      >
        <Plus className="w-3.5 h-3.5" />
        Add task
      </button>
    </div>
  );
}

export function KanbanCard({
  task,
  assignee,
  priorityColor,
  onClick,
}: {
  task: Task;
  assignee: Profile | null | undefined;
  priorityColor: string;
  onClick: () => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: task.id });
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={
        "bg-white rounded-lg p-3 shadow-[0_1px_2px_rgba(15,23,42,0.06),0_0_0_1px_rgba(15,23,42,0.04)] cursor-pointer hover:shadow-[0_4px_12px_rgba(15,23,42,0.08),0_0_0_1px_rgba(99,102,241,0.2)] transition-shadow " +
        (isDragging ? "opacity-40" : "")
      }
    >
      <div className="font-medium text-sm mb-2 leading-snug">{task.title}</div>
      <div className="flex items-center justify-between gap-2">
        <span
          className="priority-pill"
          style={{ background: `${priorityColor}22`, color: priorityColor }}
        >
          {task.priority}
        </span>
        <div className="flex items-center gap-2">
          {task.due_date && (
            <span className="text-[11px] text-slate-500 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {formatDate(task.due_date)}
            </span>
          )}
          {assignee && <Avatar name={assignee.name} color={assignee.avatar_color} size={22} />}
        </div>
      </div>
    </div>
  );
}

function formatDate(s: string) {
  const d = new Date(s + "T12:00:00");
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
