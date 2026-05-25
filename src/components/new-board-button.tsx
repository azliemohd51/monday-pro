"use client";
import { Plus } from "lucide-react";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { createBoardAction } from "@/app/(app)/actions";

export function NewBoardButton({ workspaceId }: { workspaceId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <button
      className="text-slate-400 hover:text-slate-900 p-1 rounded hover:bg-slate-100 disabled:opacity-50"
      title="New board"
      disabled={isPending}
      onClick={() => {
        const name = window.prompt("Board name", "New Board");
        if (!name) return;
        startTransition(async () => {
          const board = await createBoardAction(workspaceId, name);
          if (board?.id) router.push(`/boards/${board.id}`);
        });
      }}
    >
      <Plus className="w-4 h-4" />
    </button>
  );
}
