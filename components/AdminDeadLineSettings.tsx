'use client';

import { useState, useEffect } from 'react';

// ── Helpers ────────────────────────────────────────────────────────────────────

function toLocalInput(iso: string | null | undefined): string {
    if (!iso) return '';
    const d = new Date(iso);
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

function formatDisplay(iso: string | null | undefined): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
}

interface TimeParts {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    past: boolean;
}

function calcParts(target: string): TimeParts {
    const diff = new Date(target).getTime() - Date.now();
    if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, past: true };
    return {
        past: false,
        days:    Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours:   Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / 1000 / 60) % 60),
        seconds: Math.floor((diff / 1000) % 60),
    };
}

function pad(n: number) { return String(n).padStart(2, '0'); }

// ── Mini countdown display ─────────────────────────────────────────────────────

function CountdownDisplay({
    label,
    target,
    accentClass,
    pastLabel,
}: {
    label: string;
    target: string;
    accentClass: string;
    pastLabel: string;
}) {
    const [parts, setParts] = useState<TimeParts>(() => calcParts(target));

    useEffect(() => {
        setParts(calcParts(target));
        const id = setInterval(() => setParts(calcParts(target)), 1000);
        return () => clearInterval(id);
    }, [target]);

    if (parts.past) {
        return (
            <div className="flex items-center gap-2 text-xs text-zinc-400 italic">
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-300 shrink-0" />
                {pastLabel}
            </div>
        );
    }

    return (
        <div className="mt-3 p-3 bg-zinc-50 rounded-lg border border-zinc-100">
            <p className="text-xs font-medium text-zinc-500 mb-2">{label}</p>
            <div className="flex gap-3">
                {[
                    { v: parts.days,    l: 'Days' },
                    { v: parts.hours,   l: 'Hrs' },
                    { v: parts.minutes, l: 'Min' },
                    { v: parts.seconds, l: 'Sec' },
                ].map(({ v, l }) => (
                    <div key={l} className="flex flex-col items-center min-w-[2.5rem]">
                        <span className={`text-lg font-bold tabular-nums ${accentClass}`}>{pad(v)}</span>
                        <span className="text-xs text-zinc-400">{l}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ── Status badge ───────────────────────────────────────────────────────────────

type FormStatus = 'manual-closed' | 'not-open-yet' | 'open' | 'closed-deadline' | 'unknown';

function resolveStatus(isOpen: boolean, openingTime: string, closingTime: string): FormStatus {
    if (!isOpen) return 'manual-closed';
    const now = new Date();
    if (openingTime && now < new Date(openingTime)) return 'not-open-yet';
    if (closingTime && now > new Date(closingTime)) return 'closed-deadline';
    if (isOpen) return 'open';
    return 'unknown';
}

const STATUS_CONFIG: Record<FormStatus, { label: string; color: string; dot: string }> = {
    'open':            { label: 'Accepting applications',   color: 'text-emerald-700 bg-emerald-50 border-emerald-200', dot: 'bg-emerald-500 animate-pulse' },
    'not-open-yet':    { label: 'Not open yet',             color: 'text-amber-700 bg-amber-50 border-amber-200',       dot: 'bg-amber-400' },
    'manual-closed':   { label: 'Manually closed',          color: 'text-red-700 bg-red-50 border-red-200',             dot: 'bg-red-500' },
    'closed-deadline': { label: 'Closed — deadline passed', color: 'text-red-700 bg-red-50 border-red-200',             dot: 'bg-red-500' },
    'unknown':         { label: 'Unknown',                  color: 'text-zinc-600 bg-zinc-50 border-zinc-200',          dot: 'bg-zinc-400' },
};

// ── Main component ─────────────────────────────────────────────────────────────

export default function AdminDeadlineSettings() {
    const [isOpen, setIsOpen] = useState(true);
    const [openingTime, setOpeningTime] = useState('');
    const [closingTime, setClosingTime] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Tick state just to re-resolve status badge every second
    const [, setTick] = useState(0);
    useEffect(() => {
        const id = setInterval(() => setTick((t) => t + 1), 1000);
        return () => clearInterval(id);
    }, []);

    useEffect(() => {
        fetch('/api/settings', { cache: 'no-store' })
            .then((r) => r.json())
            .then((data) => {
                if (data) {
                    setIsOpen(data.is_open ?? true);
                    setOpeningTime(toLocalInput(data.opening_time));
                    setClosingTime(toLocalInput(data.closing_time));
                }
            })
            .catch(console.error)
            .finally(() => setIsLoading(false));
    }, []);

    const handleSave = async () => {
        if (openingTime && closingTime && new Date(openingTime) >= new Date(closingTime)) {
            setMessage({ type: 'error', text: 'Opening date must be before closing date.' });
            return;
        }
        setIsSaving(true);
        setMessage(null);
        try {
            const res = await fetch('/api/admin/settings', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    is_open: isOpen,
                    opening_time: openingTime || null,
                    closing_time: closingTime || null,
                }),
            });
            if (!res.ok) throw new Error('Failed to update');
            setMessage({ type: 'success', text: 'Settings saved successfully.' });
        } catch {
            setMessage({ type: 'error', text: 'Error saving settings. Try again.' });
        } finally {
            setIsSaving(false);
            setTimeout(() => setMessage(null), 4000);
        }
    };

    const status = resolveStatus(isOpen, openingTime, closingTime);
    const statusCfg = STATUS_CONFIG[status];

    const invalidDates =
        !!(openingTime && closingTime && new Date(openingTime) >= new Date(closingTime));

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-40">
                <div className="w-5 h-5 border-2 border-zinc-300 border-t-zinc-700 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-5 max-w-xl">

            {/* Current status badge */}
            <div className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border text-sm font-medium ${statusCfg.color}`}>
                <span className={`w-2 h-2 rounded-full shrink-0 ${statusCfg.dot}`} />
                {statusCfg.label}
            </div>

            {/* Master toggle */}
            <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <p className="text-sm font-semibold text-zinc-900">Accept Applications</p>
                        <p className="text-xs text-zinc-500 mt-0.5">
                            Master switch — overrides dates when turned off.
                        </p>
                    </div>
                    <button
                        type="button"
                        role="switch"
                        aria-checked={isOpen}
                        onClick={() => setIsOpen((v) => !v)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none ${isOpen ? 'bg-emerald-500' : 'bg-zinc-300'}`}
                    >
                        <span className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform ${isOpen ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                </div>
            </div>

            {/* Date pickers + countdowns */}
            <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm space-y-5">
                <h3 className="text-sm font-semibold text-zinc-900">Application Window</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {/* Opening date */}
                    <div>
                        <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">
                            Opening Date &amp; Time
                        </label>
                        <input
                            type="datetime-local"
                            value={openingTime}
                            onChange={(e) => setOpeningTime(e.target.value)}
                            className="w-full h-10 px-3 border border-zinc-200 rounded-lg text-sm text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400 transition-all"
                        />
                        {openingTime ? (
                            <>
                                <p className="text-xs text-zinc-400 mt-1.5">{formatDisplay(openingTime)}</p>
                                <CountdownDisplay
                                    label="Opens in:"
                                    target={openingTime}
                                    accentClass="text-amber-600"
                                    pastLabel="Already opened"
                                />
                            </>
                        ) : (
                            <p className="text-xs text-zinc-400 mt-1.5 italic">No opening date set — uses master switch.</p>
                        )}
                        {openingTime && (
                            <button
                                type="button"
                                onClick={() => setOpeningTime('')}
                                className="text-xs text-zinc-400 hover:text-red-600 mt-2 transition-colors"
                            >
                                Clear
                            </button>
                        )}
                    </div>

                    {/* Closing date */}
                    <div>
                        <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">
                            Closing Date &amp; Time
                        </label>
                        <input
                            type="datetime-local"
                            value={closingTime}
                            min={openingTime || undefined}
                            onChange={(e) => setClosingTime(e.target.value)}
                            className="w-full h-10 px-3 border border-zinc-200 rounded-lg text-sm text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400 transition-all"
                        />
                        {closingTime ? (
                            <>
                                <p className="text-xs text-zinc-400 mt-1.5">{formatDisplay(closingTime)}</p>
                                <CountdownDisplay
                                    label="Closes in:"
                                    target={closingTime}
                                    accentClass="text-red-600"
                                    pastLabel="Already closed"
                                />
                            </>
                        ) : (
                            <p className="text-xs text-zinc-400 mt-1.5 italic">No closing date set — stays open until switched off.</p>
                        )}
                        {closingTime && (
                            <button
                                type="button"
                                onClick={() => setClosingTime('')}
                                className="text-xs text-zinc-400 hover:text-red-600 mt-2 transition-colors"
                            >
                                Clear
                            </button>
                        )}
                    </div>
                </div>

                {/* Timeline bar */}
                {(openingTime || closingTime) && !invalidDates && (
                    <div className="flex items-center gap-2 pt-1 text-xs text-zinc-400">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                        <span className="shrink-0">{openingTime ? formatDisplay(openingTime) : 'Now'}</span>
                        <div className="flex-1 h-px bg-zinc-200" />
                        <span className="w-2 h-2 rounded-full bg-red-400 shrink-0" />
                        <span className="shrink-0">{closingTime ? formatDisplay(closingTime) : 'No deadline'}</span>
                    </div>
                )}

                {/* Validation warning */}
                {invalidDates && (
                    <p className="text-sm text-red-600 font-medium">
                        Opening date must be before the closing date.
                    </p>
                )}
            </div>

            {/* Save */}
            <div className="flex items-center gap-4">
                <button
                    onClick={handleSave}
                    disabled={isSaving || invalidDates}
                    className="h-11 px-6 bg-zinc-900 text-white rounded-xl text-sm font-semibold hover:bg-zinc-800 transition-colors disabled:opacity-50 shadow-sm"
                >
                    {isSaving ? 'Saving…' : 'Save Settings'}
                </button>
                {message && (
                    <p className={`text-sm font-medium ${message.type === 'success' ? 'text-emerald-600' : 'text-red-600'}`}>
                        {message.text}
                    </p>
                )}
            </div>

            {/* Help note */}
            <p className="text-xs text-zinc-400 leading-relaxed">
                <strong className="text-zinc-500">How it works:</strong> If the master switch is off, the form is always closed regardless of dates.
                If dates are set, the form opens automatically at the opening time and closes at the closing date.
                If no dates are set, the master switch alone controls availability.
            </p>
        </div>
    );
}
