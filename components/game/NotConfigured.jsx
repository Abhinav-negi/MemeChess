export default function NotConfigured() {
  return (
    <div className="mx-auto max-w-xl px-4 py-16">
      <div className="card p-6">
        <h1 className="text-lg font-semibold text-text">Online play isn’t configured</h1>
        <p className="mt-2 text-sm text-muted">
          Set <code className="font-mono text-text">NEXT_PUBLIC_SUPABASE_URL</code> and{' '}
          <code className="font-mono text-text">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> (see README). You can still play
          the bot.
        </p>
      </div>
    </div>
  );
}
