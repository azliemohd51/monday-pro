import Link from "next/link";
import { Avatar } from "./avatar";
import type { Profile } from "@/lib/types";
import { SignOutButton } from "./sign-out-button";

export function Topbar({ profile, title }: { profile: Profile; title?: string }) {
  return (
    <header className="h-12 bg-white border-b border-slate-200 flex items-center justify-between px-6 flex-shrink-0">
      <h1 className="text-sm font-semibold text-slate-700">{title || ""}</h1>
      <div className="flex items-center gap-3">
        <SignOutButton />
        <Link href="/settings/profile" className="flex items-center gap-2 hover:opacity-80">
          <Avatar name={profile.name} color={profile.avatar_color} size={28} />
          <span className="text-sm font-medium text-slate-700">{profile.name}</span>
        </Link>
      </div>
    </header>
  );
}
