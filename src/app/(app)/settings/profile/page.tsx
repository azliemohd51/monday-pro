import { getCurrentUser } from "@/lib/auth";
import { ProfileForm } from "./form";

export default async function ProfilePage() {
  const { user, profile } = await getCurrentUser();
  return (
    <div className="px-8 py-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold mb-1">Profile</h1>
      <p className="text-sm text-slate-500 mb-6">Your name and avatar color appear next to tasks and comments.</p>
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <ProfileForm initialName={profile.name} initialColor={profile.avatar_color} email={user.email || ""} />
      </div>
    </div>
  );
}
