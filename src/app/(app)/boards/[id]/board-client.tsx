"use client";
import { useState, useTransition } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import type { Board, Profile, Task, TaskStatus } from "@/lib/types";
import { STATUS_COLORS, STATUS_LABELS, STATUS_ORDER, PRIORITY_COLORS } from "@/lib/types";
import { TaskDrawer } from "./task-drawer";
import { KanbanCard, KanbanColumn } from "./kanban-pieces";
import { createTaskAction, moveTaskAction } from "@/app/(app)/actions";

interface Props {
  board: Board;
  initialTasks: Task[];
  profiles: Profile[];
}

export function BoardClient({ board, initialTasks, profiles }: Props) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [openTaskId, setOpenTaskId] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const profilesById = new Map(profiles.map((p) => [p.id, p]));
  const openTask = openTaskId ? tasks.find((t) => t.id === openTaskId) || null : null;

  function onDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
  }

  function onDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;
    const taskId = String(active.id);
    const overId = String(over.id);
    const targetStatus = (STATUS_ORDER as string[]).includes(overId)
      ? (overId as TaskStatus)
      : tasks.find((t) => t.id === overId)?.status;
    if (!targetStatus) return;
    const moving = tasks.find((t) => t.id === taskId);
    if (!moving || moving.status === targetStatus) return;
    const maxPos = tasks.filter((t) => t.status === targetStatus).reduce((m, t) => Math.max(m, t.position), -1);
    const newPosition = maxPos + 1;
    // Optimistic
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: targetStatus, position: newPosition } : t)));
    startTransition(async () => {
      await moveTaskAction(taskId, targetStatus, newPosition);
    });
  }

  function handleAddTask(status: TaskStatus) {
    const title = window.prompt("Task title", "New Task");
    if (!title) return;
    const tempId = `temp-${Date.now()}`;
    const maxPos = tasks.filter((t) => t.status === status).reduce((m, t) => Math.max(m, t.position), -1);
    const optimistic: Task = {
      id: tempId,
      board_id: board.id,
      title,
      description: "",
      assignee_id: null,
      status,
      priority: "medium",
      due_date: null,
      position: maxPos + 1,
      created_by: "",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setTasks((prev) => [...prev, optimistic]);
    startTransition(async () => {
      await createTaskAction(board.id, status, title);
    });
  }

  function updateLocalTask(taskId: string, patch: Partial<Task>) {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, ...patch } : t)));
  }

  function removeLocalTask(taskId: string) {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  }

  return (
    <>
      <div className="px-6 pt-5 pb-3">
        <div className="flex items-center gap-3 mb-1">
          <span className="w-3 h-3 rounded-full" style={{ background: board.color }} />
          <h1 className="text-xl font-semibold">{board.name}</h1>
        </div>
        <p className="text-sm text-slate-500">{tasks.length} task{tasks.length === 1 ? "" : "s"} · drag cards between columns to update status</p>
      </div>

      <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
        <div className="px-6 pb-8 flex gap-4 overflow-x-auto scrollbar-thin">
          {STATUS_ORDER.map((status) => {
            const items = tasks
              .filter((t) => t.status === status)
              .sort((a, b) => a.position - b.position);
            return (
              <KanbanColumn
                key={status}
                status={status}
                label={STATUS_LABELS[status]}
                color={STATUS_COLORS[status]}
                count={items.length}
                onAdd={() => handleAddTask(status)}
              >
                {items.map((t) => (
                  <KanbanCard
                    key={t.id}
                    task={t}
                    assignee={t.assignee_id ? profilesById.get(t.assignee_id) : null}
                    priorityColor={PRIORITY_COLORS[t.priority]}
                    onClick={() => setOpenTaskId(t.id)}
                  />
                ))}
              </KanbanColumn>
            );
          })}
        </div>

        <DragOverlay>
          {activeId && tasks.find((t) => t.id === activeId) ? (
            <div className="opacity-90 rotate-2">
              <KanbanCard
                task={tasks.find((t) => t.id === activeId)!}
                assignee={(() => {
                  const t = tasks.find((x) => x.id === activeId)!;
                  return t.assignee_id ? profilesById.get(t.assignee_id) || null : null;
                })()}
                priorityColor={PRIORITY_COLORS[tasks.find((t) => t.id === activeId)!.priority]}
                onClick={() => {}}
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {openTask && (
        <TaskDrawer
          task={openTask}
          profiles={profiles}
          onClose={() => setOpenTaskId(null)}
          onPatch={(patch) => updateLocalTask(openTask.id, patch)}
          onDelete={() => {
            removeLocalTask(openTask.id);
            setOpenTaskId(null);
          }}
        />
      )}
    </>
  );
}

