import AppConfigManager from '@/components/AppConfigManager';

export default function ConfigPage() {
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Application Configuration</h1>
                <p className="text-zinc-500 text-sm mt-1.5">
                    Configure this recruitment cycle&apos;s settings — universities, batches, faculties, and form display options.
                </p>
                <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
                    <strong>Note:</strong> This configuration requires the <code className="font-mono bg-amber-100 px-1 rounded">app_config</code> table.
                    Run <code className="font-mono bg-amber-100 px-1 rounded">supabase/migrations/001_app_config.sql</code> in your Supabase SQL Editor first.
                </div>
            </div>

            <AppConfigManager />
        </div>
    );
}
