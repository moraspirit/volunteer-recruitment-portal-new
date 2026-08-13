'use client';

import { useState, useEffect } from 'react';

interface TimeLeft {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
}

type TimerState = 'loading' | 'manual-closed' | 'not-open-yet' | 'open' | 'closed';

function calcTimeLeft(target: Date): TimeLeft | null {
    const diff = target.getTime() - Date.now();
    if (diff <= 0) return null;
    return {
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / 1000 / 60) % 60),
        seconds: Math.floor((diff / 1000) % 60),
    };
}

function pad(n: number) {
    return String(n).padStart(2, '0');
}

export default function CountdownTimer({ onComplete }: { onComplete?: () => void }) {
    const [timerState, setTimerState] = useState<TimerState>('loading');
    const [openingTime, setOpeningTime] = useState<Date | null>(null);
    const [closingTime, setClosingTime] = useState<Date | null>(null);
    const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);

    // Fetch settings once on mount
    useEffect(() => {
        fetch('/api/settings', { cache: 'no-store' })
            .then((r) => r.json())
            .then((data) => {
                if (!data) return;

                if (data.is_open === false) {
                    setTimerState('manual-closed');
                    onComplete?.();
                    return;
                }

                const now = new Date();
                const opening = data.opening_time ? new Date(data.opening_time) : null;
                const closing = data.closing_time ? new Date(data.closing_time) : null;

                if (opening && now < opening) {
                    setOpeningTime(opening);
                    setTimerState('not-open-yet');
                    onComplete?.(); // form is not yet open
                    return;
                }

                if (closing && now > closing) {
                    setTimerState('closed');
                    onComplete?.();
                    return;
                }

                setClosingTime(closing);
                setTimerState('open');
            })
            .catch(() => setTimerState('open'));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Tick every second
    useEffect(() => {
        const target =
            timerState === 'not-open-yet' ? openingTime :
            timerState === 'open' ? closingTime :
            null;

        if (!target) return;

        const tick = () => {
            const remaining = calcTimeLeft(target);
            if (!remaining) {
                // Time reached — reload page so the form reflects the new state
                window.location.reload();
            } else {
                setTimeLeft(remaining);
            }
        };

        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [timerState, openingTime, closingTime]);

    if (timerState === 'loading') return null;

    // Manually closed or deadline passed
    if (timerState === 'manual-closed' || timerState === 'closed') {
        return (
            <div className="max-w-3xl mx-auto mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-center">
                <p className="text-sm font-semibold text-red-700">Applications are currently closed.</p>
            </div>
        );
    }

    // Not open yet — show "opens in" countdown
    if (timerState === 'not-open-yet') {
        return (
            <div className="max-w-3xl mx-auto mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                    <span className="text-sm font-medium text-amber-800">Applications open in:</span>
                </div>
                <TimerBlocks timeLeft={timeLeft} color="text-amber-700" />
            </div>
        );
    }

    // Open — show "closes in" countdown (only if a closing time is set)
    if (timerState === 'open' && closingTime && timeLeft) {
        return (
            <div className="max-w-3xl mx-auto mb-6 bg-white border border-zinc-200 rounded-xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />
                    <span className="text-sm font-medium text-zinc-700">Applications closing in:</span>
                </div>
                <TimerBlocks timeLeft={timeLeft} color="text-red-600" />
            </div>
        );
    }

    // Open with no deadline — show a simple "open" indicator
    if (timerState === 'open' && !closingTime) {
        return (
            <div className="max-w-3xl mx-auto mb-6 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <p className="text-sm font-medium text-emerald-700">Applications are open.</p>
            </div>
        );
    }

    return null;
}

function TimerBlocks({ timeLeft, color }: { timeLeft: TimeLeft | null; color: string }) {
    if (!timeLeft) return null;
    return (
        <div className="flex gap-5 text-center">
            {[
                { label: 'Days', value: timeLeft.days },
                { label: 'Hours', value: timeLeft.hours },
                { label: 'Mins', value: timeLeft.minutes },
                { label: 'Secs', value: timeLeft.seconds },
            ].map(({ label, value }) => (
                <div key={label} className="flex flex-col items-center">
                    <span className={`text-xl font-bold tabular-nums ${color}`}>{pad(value)}</span>
                    <span className="text-xs text-zinc-400 mt-0.5">{label}</span>
                </div>
            ))}
        </div>
    );
}
