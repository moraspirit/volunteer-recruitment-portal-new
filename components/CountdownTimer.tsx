'use client';

import { useState, useEffect } from 'react';

interface TimeLeft {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
}

export default function CountdownTimer({ onComplete }: { onComplete?: () => void }) {
    const [closingTime, setClosingTime] = useState<Date | null>(null);
    const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);
    const [isClosed, setIsClosed] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await fetch('/api/settings', { cache: 'no-store' });
                const data = await response.json();

                if (data) {
                    // 1. MANUAL OVERRIDE: If admin toggled it off, shut it down immediately
                    if (data.is_open === false) {
                        setIsClosed(true);
                        if (onComplete) onComplete();
                        setIsLoaded(true);
                        return;
                    }

                    // 2. Otherwise, proceed with the timer
                    if (data.closing_time) {
                        setClosingTime(new Date(data.closing_time));
                    }
                }
            } catch (error) {
                console.error("Failed to fetch settings:", error);
            } finally {
                setIsLoaded(true);
            }
        };

        fetchSettings();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (!closingTime || isClosed) return;

        const calculateTimeLeft = () => {
            const difference = closingTime.getTime() - new Date().getTime();

            if (difference <= 0) {
                setIsClosed(true);
                if (onComplete) onComplete();
                return null;
            }

            return {
                days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                minutes: Math.floor((difference / 1000 / 60) % 60),
                seconds: Math.floor((difference / 1000) % 60),
            };
        };

        setTimeLeft(calculateTimeLeft());

        const timer = setInterval(() => {
            const remaining = calculateTimeLeft();
            if (!remaining) {
                clearInterval(timer);
            } else {
                setTimeLeft(remaining);
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [closingTime, isClosed, onComplete]);

    if (!isLoaded) return null;

    if (isClosed) {
        return (
            <div className="max-w-4xl mx-auto bg-red-950/50 border border-red-500/50 text-red-200 p-4 rounded-xl text-center font-semibold mb-6">
                Applications are currently closed.
            </div>
        );
    }

    if (!timeLeft) return null;

    return (
        <div className="max-w-4xl mx-auto bg-zinc-900 border border-zinc-800 p-4 rounded-xl mb-6 flex flex-col sm:flex-row items-center justify-between">
            <div className="flex items-center gap-3 mb-3 sm:mb-0">
                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
                <span className="text-white font-medium">Application closing in:</span>
            </div>

            <div className="flex gap-4 text-center">
                {/* ... (Keep your existing timer UI mapping here) ... */}
                <div className="flex flex-col">
                    <span className="text-xl font-bold text-yellow-500">{timeLeft.days}</span>
                    <span className="text-xs text-zinc-400">Days</span>
                </div>
                <div className="flex flex-col">
                    <span className="text-xl font-bold text-yellow-500">{timeLeft.hours.toString().padStart(2, '0')}</span>
                    <span className="text-xs text-zinc-400">Hours</span>
                </div>
                <div className="flex flex-col">
                    <span className="text-xl font-bold text-yellow-500">{timeLeft.minutes.toString().padStart(2, '0')}</span>
                    <span className="text-xs text-zinc-400">Mins</span>
                </div>
                <div className="flex flex-col">
                    <span className="text-xl font-bold text-yellow-500">{timeLeft.seconds.toString().padStart(2, '0')}</span>
                    <span className="text-xs text-zinc-400">Secs</span>
                </div>
            </div>
        </div>
    );
}