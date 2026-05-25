import Link from "next/link";
import { SignupForm } from "./form";

export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-slate-50">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center mb-8">
          <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center text-white font-bold text-lg">
            M
          </div>
          <span className="ml-3 text-xl font-semibold">Monday Pro</span>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
          <h1 className="text-2xl font-semibold mb-1">Create your workspace</h1>
          <p className="text-sm text-slate-500 mb-6">A sample board and tasks will be created for you</p>
          <SignupForm />
        </div>
        <p className="mt-6 text-sm text-slate-500 text-center">
          Already have an account?{" "}
          <Link href="/login" className="text-accent font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
