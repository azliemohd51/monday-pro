import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-6">
      <div className="text-center">
        <div className="text-7xl font-bold text-slate-300 mb-2">404</div>
        <h1 className="text-xl font-semibold mb-2">Not found</h1>
        <p className="text-sm text-slate-500 mb-6">That page doesn&apos;t exist or you don&apos;t have access.</p>
        <Link href="/dashboard" className="btn-primary inline-flex">
          Go to dashboard
        </Link>
      </div>
    </div>
  );
}
