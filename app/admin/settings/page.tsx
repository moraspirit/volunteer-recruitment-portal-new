import AdminDeadlineSettings from '../../../components/AdminDeadLineSettings';

export default function SettingsPage() {
    return (
        <div className="p-6 sm:p-10 max-w-2xl mx-auto w-full">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">Platform Settings</h1>
                <p className="text-zinc-500 text-sm mt-1.5">
                    Manage application deadlines and system toggles.
                </p>
            </div>

            <AdminDeadlineSettings />
        </div>
    );
}