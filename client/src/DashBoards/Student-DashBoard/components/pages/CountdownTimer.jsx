import { useState, useEffect, memo } from 'react';
import { Clock } from 'lucide-react';

/**
 * Self-contained countdown timer that manages its own 1-second interval.
 * Prevents the parent component from re-rendering every second.
 */
const CountdownTimer = memo(({ createdAt }) => {
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const getTimeRemaining = () => {
        if (!createdAt) return '—';
        const createdMs = createdAt.toMillis
            ? createdAt.toMillis()
            : new Date(createdAt).getTime();
        const expiryMs = createdMs + 48 * 60 * 60 * 1000;
        const remainingMs = expiryMs - currentTime.getTime();

        if (remainingMs <= 0) return 'Expired';

        const hours = Math.floor(remainingMs / (1000 * 60 * 60));
        const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((remainingMs % (1000 * 60)) / 1000);

        return `${hours}h ${minutes}m ${seconds}s left`;
    };

    return (
        <div
            className="complaint-timer-display"
            style={{
                marginTop: '0.5rem',
                fontSize: '0.75rem',
                color: '#ef4444',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontWeight: '600',
            }}
        >
            <Clock size={12} />
            Auto-escalation in: {getTimeRemaining()}
        </div>
    );
});

CountdownTimer.displayName = 'CountdownTimer';

export default CountdownTimer;
