export function Topbar() {
  return (
    <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
      <div>
        <p className="text-xs uppercase tracking-wide text-slate-500">Painel administrativo</p>
        <h1 className="text-lg font-semibold text-slate-900">Analyzer Video</h1>
      </div>
      <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">v0.1</div>
    </header>
  );
}
