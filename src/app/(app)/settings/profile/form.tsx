"use client";
import { useState, useTransition } from "react";
import { Check } from "lucide-react";
import { Avatar } from "@/components/avatar";
import { updateProfileAction } from "@/app/(app)/actions";

const COLORS = ["#6366F1", "#10B981", "#F43F5E", "#F59E0B", "#0EA5E9", "#8B5CF6", "#14B8A6", "#EC4899"];

export function ProfileForm({
  initialName,
  initialColor,
  email,
}: {
  initialName: string;
  initialColor: string;
  email: string;
}) {
  const [name, setName] = useState(initialName);
  const [color, setColor] = useState(initialColor);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    startTransition(async () => {
      await updateProfileAction(name.trim() || initialName, color);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4">
        <Avatar name={name || "?"} color={color} size={64} />
        <div>
          <div className="text-lg font-semibold">{name || "Unnamed"}</div>
          <div className="text-sm text-slate-500">{email}</div>
        </div>
      </div>

      <div>
        <label className="label">Name</label>
        <input
          className="input"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div>
        <label className="label">Avatar color</label>
        <div className="flex flex-wrap gap-2">
          {COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: c }}
              title={c}
            >
              {color === c && <Check className="w-4 h-4 text-white" />}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button onClick={handleSave} disabled={isPending} className="btn-primary disabled:opacity-50">
          {isPending ? "Saving…" : "Save changes"}
        </button>
        {saved && <span className="text-sm text-emerald-600 font-medium">Saved</span>}
      </div>
    </div>
  );
}
