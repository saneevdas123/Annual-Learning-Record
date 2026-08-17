export default function AppLoading() {
  return (
    <div className="space-y-4" aria-busy="true" aria-live="polite">
      <div className="h-3 w-24 rounded bg-ink/10" />
      <div className="h-8 w-64 max-w-full rounded bg-ink/10" />
      <div className="h-4 w-full max-w-xl rounded bg-ink/[0.06]" />
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="card h-24 bg-white" />
        <div className="card h-24 bg-white" />
        <div className="card h-24 bg-white" />
      </div>
      <div className="card h-64 bg-white" />
    </div>
  );
}
