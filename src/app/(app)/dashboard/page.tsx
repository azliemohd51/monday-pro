import Link from "next/link";
import { AlertCircle, CheckCircle2, Clock, Inbox } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getMyTasks, getMyBoards } from "@/lib/queries";
import { STATUS_LABELS, STATUS_COLORS, PRIORITY_COLORS, PRIORITY_LABELS, STATUS_ORDER } from "@/lib/types";
import type { TaskStatus } from "@/lib/types";

export default async function DashboardPage() {
  const { user, profile } = await getCurrentUser();
  const [tasks, boards] = await Promise.all([getMyTasks(user.id), getMyBoards(user.id)]);
  const boardById = new Map(boards.map((b) => [b.id, b]));

  const today = new Date().toISOString().slice(0, 10);
  const overdue = tasks.filter((t) => t.due_date && t.due_date < today && t.status !== "done");
  const byStatus = new Map<TaskStatus, typeof tasks>(STATUS_ORDER.map((s) => [s, []]));
  tasks.forEach((t) => byStatus.get(t.status)?.push(t));

  return (
    <div className="px-8 py-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Welcome back, {profile.name.split(" ")[0]}</h1>
        <p className="text-sm text-slate-500 mt-1">Here&apos;s what&apos;s on your plate today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <StatCard icon={<Inbox className="w-4 h-4" />} label="Assigned to me" value={tasks.length} color="#6366F1" />
        <StatCard icon={<Clock className="w-4 h-4" />} label="In progress" value={byStatus.get("in_progress")?.length || 0} color="#FDAB3D" />
        <StatCard icon={<AlertCircle className="w-4 h-4" />} label="Overdue" value={overdue.length} color="#E2445C" />
        <StatCard icon={<CheckCircle2 className="w-4 h-4" />} label="Done" value={byStatus.get("done")?.length || 0} color="#00C875" />
      </div>

      {overdue.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            <span className="text-sm font-semibold text-rose-900">{overdue.length} overdue {overdue.length === 1 ? "task" : "tasks"}</span>
          </div>
          <ul className="space-y-1.5">
            {overdue.slice(0, 5).map((t) => (
              <li key={t.id} className="text-sm text-rose-800 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                <Link href={`/boards/${t.board_id}`} className="hover:underline">{t.title}</Link>
                <span className="text-xs text-rose-500">due {t.due_date}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {STATUS_ORDER.map((s) => {
          const items = byStatus.get(s) || [];
          return (
            <div key={s} className="bg-white rounded-lg border border-slate-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ background: STATUS_COLORS[s] }} />
                  <span className="font-semibold text-sm">{STATUS_LABELS[s]}</span>
                </div>
                <span className="text-xs text-slate-400">{items.length}</span>
              </div>
              <div className="divide-y divide-slate-100">
                {items.length === 0 && <div className="px-4 py-6 text-xs text-slate-400">No tasks</div>}
                {items.slice(0, 8).map((t) => (
                  <Link
                    key={t.id}
                    href={`/boards/${t.board_id}`}
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 group"
                  >
                    <span
                      className="priority-pill"
                      style={{ background: `${PRIORITY_COLORS[t.priority]}22`, color: PRIORITY_COLORS[t.priority] }}
                    >
                      {PRIORITY_LABELS[t.priority]}
                    </span>
                    <span className="flex-1 text-sm truncate group-hover:text-accent">{t.title}</span>
                    {t.due_date && (
                      <span className="text-xs text-slate-400">{formatDate(t.due_date)}</span>
                    )}
                    <span className="text-[10px] text-slate-300">{boardById.get(t.board_id)?.name || ""}</span>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {tasks.length === 0 && (
        <div className="text-center py-12">
          <p className="text-sm text-slate-500 mb-2">No tasks assigned yet.</p>
          {boards[0] && (
            <Link href={`/boards/${boards[0].id}`} className="btn-primary inline-flex">
              Open your first board
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4">
      <div className="flex items-center gap-2 text-slate-500 mb-1.5" style={{ color }}>
        {icon}
        <span className="text-xs font-semibold uppercase tracking-wider">{label}</span>
      </div>
      <div className="text-2xl font-bold tabular-nums">{value}</div>
    </div>
  );
}

function formatDate(s: string) {
  const d = new Date(s + "T12:00:00");
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
