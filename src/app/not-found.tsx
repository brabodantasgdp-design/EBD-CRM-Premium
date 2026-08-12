import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-slate-100/70 flex items-center justify-center p-6">
      <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-sm">
        <h1 className="text-xl font-bold text-slate-900">Página não encontrada</h1>
        <p className="mt-2 text-sm text-slate-500">O módulo solicitado não existe.</p>
        <Link className="inline-block mt-5 text-sm font-semibold text-indigo-600" href="/dashboard">
          Voltar ao Dashboard
        </Link>
      </div>
    </main>
  );
}
