import AdminDeadlineSettings from '../../../components/AdminDeadLineSettings';

export default function SettingsPage() {
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Application Settings</h1>
                <p className="text-zinc-500 text-sm mt-1.5">
                    Control when applications open and close. The master switch overrides all date-based rules.
                </p>
            </div>

            <AdminDeadlineSettings />
        </div>
    );
}
