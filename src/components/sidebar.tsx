import Link from "next/link";
import { LayoutDashboard, Plus, KanbanSquare } from "lucide-react";
import type { Board } from "@/lib/types";
import { NewBoardButton } from "./new-board-button";

interface SidebarProps {
  boards: Board[];
  activeBoardId?: string;
  workspaceId?: string;
}

export function Sidebar({ boards, activeBoardId, workspaceId }: SidebarProps) {
  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
      <div className="h-12 px-4 flex items-center border-b border-slate-200">
        <div className="w-7 h-7 rounded-md bg-accent flex items-center justify-center text-white font-bold text-sm">
          M
        </div>
        <span className="ml-2 font-semibold text-[15px]">Monday Pro</span>
      </div>

      <nav className="p-3 space-y-1">
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-100"
        >
          <LayoutDashboard className="w-4 h-4" />
          Dashboard
        </Link>
      </nav>

      <div className="px-3 mt-3 mb-2 flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Boards</span>
        {workspaceId && <NewBoardButton workspaceId={workspaceId} />}
      </div>

      <div className="flex-1 px-2 overflow-y-auto scrollbar-thin space-y-0.5">
        {boards.map((b) => (
          <Link
            key={b.id}
            href={`/boards/${b.id}`}
            className={
              "flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors " +
              (b.id === activeBoardId
                ? "bg-indigo-50 text-accent font-medium"
                : "text-slate-700 hover:bg-slate-100")
            }
          >
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: b.color }} />
            <KanbanSquare className="w-4 h-4 opacity-60" />
            <span className="truncate">{b.name}</span>
          </Link>
        ))}
        {boards.length === 0 && (
          <div className="px-3 py-4 text-xs text-slate-400">No boards yet. Create one to get started.</div>
        )}
      </div>

      <div className="px-3 py-3 border-t border-slate-200">
        <Link href="/settings/profile" className="text-xs text-slate-500 hover:text-slate-900">
          Profile & settings →
        </Link>
      </div>
    </aside>
  );
}
