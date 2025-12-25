'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
    title: string;
    value: number;
    previousValue?: number;
    format?: 'currency' | 'number' | 'percent';
    icon: LucideIcon;
    color: 'primary' | 'secondary' | 'success' | 'warning';
    prefix?: string;
    suffix?: string;
}

export default function StatCard({
    title,
    value,
    previousValue,
    format = 'number',
    icon: Icon,
    color,
    prefix = '',
    suffix = '',
}: StatCardProps) {
    const [displayValue, setDisplayValue] = useState(0);
    const [isAnimating, setIsAnimating] = useState(true);

    useEffect(() => {
        setIsAnimating(true);
        const duration = 1000;
        const startTime = performance.now();
        const startValue = 0;

        const animate = (currentTime: number) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Easing function
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);
            const current = startValue + (value - startValue) * easeOutQuart;

            setDisplayValue(current);

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                setIsAnimating(false);
            }
        };

        requestAnimationFrame(animate);
    }, [value]);

    const formatValue = (val: number) => {
        if (format === 'currency') {
            if (val >= 100000) {
                return `₹${(val / 100000).toFixed(2)}L`;
            } else if (val >= 1000) {
                return `₹${(val / 1000).toFixed(1)}K`;
            }
            return `₹${val.toFixed(0)}`;
        } else if (format === 'percent') {
            return `${(val * 100).toFixed(2)}%`;
        } else {
            if (val >= 1000000) {
                return `${(val / 1000000).toFixed(2)}M`;
            } else if (val >= 1000) {
                return `${(val / 1000).toFixed(1)}K`;
            }
            return val.toFixed(val < 10 ? 2 : 0);
        }
    };

    const getChange = () => {
        if (!previousValue) return null;
        const change = ((value - previousValue) / previousValue) * 100;
        return {
            value: Math.abs(change).toFixed(1),
            positive: change >= 0,
        };
    };

    const change = getChange();

    const colorClasses = {
        primary: 'from-[var(--primary)] to-[var(--accent-pink)]',
        secondary: 'from-[var(--secondary)] to-[var(--primary)]',
        success: 'from-[var(--success)] to-emerald-400',
        warning: 'from-[var(--warning)] to-orange-400',
    };

    const glowClasses = {
        primary: 'glow-primary',
        secondary: 'shadow-[0_0_20px_rgba(6,182,212,0.3)]',
        success: 'glow-success',
        warning: 'glow-warning',
    };

    return (
        <div className="glass rounded-2xl p-6 card-hover">
            <div className="flex items-start justify-between mb-4">
                <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center ${glowClasses[color]}`}
                >
                    <Icon className="w-6 h-6 text-white" />
                </div>
                {change && (
                    <div
                        className={`flex items-center gap-1 px-2 py-1 rounded-lg text-sm ${change.positive
                                ? 'bg-[var(--success)]/20 text-[var(--success)]'
                                : 'bg-[var(--error)]/20 text-[var(--error)]'
                            }`}
                    >
                        {change.positive ? (
                            <TrendingUp className="w-4 h-4" />
                        ) : (
                            <TrendingDown className="w-4 h-4" />
                        )}
                        <span>{change.value}%</span>
                    </div>
                )}
            </div>

            <h3 className="text-[var(--text-secondary)] text-sm font-medium mb-2">{title}</h3>

            <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-glow">
                    {prefix}
                    {formatValue(displayValue)}
                    {suffix}
                </span>
            </div>

            {previousValue && (
                <p className="text-xs text-[var(--text-muted)] mt-2">
                    vs {formatValue(previousValue)} last period
                </p>
            )}
        </div>
    );
}
