import { getCurrentUser } from "@/lib/auth";
import { getMyBoards, getMyWorkspaces } from "@/lib/queries";
import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";
import { VersionFooter } from "@/components/version-footer";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, profile } = await getCurrentUser();
  const [boards, workspaces] = await Promise.all([
    getMyBoards(user.id),
    getMyWorkspaces(user.id),
  ]);
  const primaryWorkspaceId = workspaces[0]?.id;

  return (
    <div className="h-screen flex flex-col">
      <div className="flex-1 flex overflow-hidden">
        <Sidebar boards={boards} workspaceId={primaryWorkspaceId} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Topbar profile={profile} />
          <main className="flex-1 overflow-auto scrollbar-thin bg-slate-50">
            {children}
          </main>
        </div>
      </div>
      <VersionFooter />
    </div>
  );
}
