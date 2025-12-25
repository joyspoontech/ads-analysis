/**
 * useMetrics - React hook for fetching metrics from Supabase
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    getDailyMetrics,
    getMetricsSummary,
    getMetricsByPlatform,
    getDailyTrend,
    DailyMetric
} from '@/lib/supabase';

interface UseMetricsOptions {
    startDate?: string;
    endDate?: string;
    platform?: string;
    autoFetch?: boolean;
}

interface MetricsSummary {
    totalSpend: number;
    totalImpressions: number;
    totalClicks: number;
    totalSales: number;           // Combined: ads GMV + sales GMV
    totalAdsSales: number;        // From ads only (ad-attributed GMV)
    totalProductSales: number;    // From sales sheets only (actual product GMV)
    avgCpi: number;
    avgCtr: number;
    avgRoas: number;
}

interface PlatformMetrics {
    platform: string;
    totalSpend: number;
    totalSales: number;
    totalImpressions: number;
    roas: number;
}

interface TrendData {
    date: string;
    spend: number;
    sales: number;
    impressions: number;
    clicks: number;
}

export function useMetrics(options: UseMetricsOptions = {}) {
    const { startDate, endDate, platform, autoFetch = true } = options;

    const [dailyMetrics, setDailyMetrics] = useState<DailyMetric[]>([]);
    const [summary, setSummary] = useState<MetricsSummary | null>(null);
    const [platformMetrics, setPlatformMetrics] = useState<PlatformMetrics[]>([]);
    const [trend, setTrend] = useState<TrendData[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchMetrics = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const [daily, summaryData, byPlatform, trendData] = await Promise.all([
                getDailyMetrics(startDate, endDate, platform),
                getMetricsSummary(startDate, endDate),
                getMetricsByPlatform(startDate, endDate),
                getDailyTrend(startDate, endDate),
            ]);

            setDailyMetrics(daily);
            setSummary(summaryData);
            setPlatformMetrics(byPlatform);
            setTrend(trendData);
        } catch (err) {
            console.error('[useMetrics] Error:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch metrics');
        } finally {
            setIsLoading(false);
        }
    }, [startDate, endDate, platform]);

    useEffect(() => {
        if (autoFetch) {
            fetchMetrics();
        }
    }, [fetchMetrics, autoFetch]);

    // Filter ads-only metrics for detailed table
    const adsMetrics = dailyMetrics
        .filter(m => m.data_type === 'ads')
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return {
        dailyMetrics,
        adsMetrics,     // NEW: ads-only daily metrics
        summary,
        platformMetrics,
        trend,
        isLoading,
        error,
        refresh: fetchMetrics,
    };
}

/**
 * useMetricsSummary - Simplified hook for just summary stats
 */
export function useMetricsSummary(startDate?: string, endDate?: string) {
    const [summary, setSummary] = useState<MetricsSummary | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetch() {
            setIsLoading(true);
            try {
                const data = await getMetricsSummary(startDate, endDate);
                setSummary(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to fetch summary');
            } finally {
                setIsLoading(false);
            }
        }
        fetch();
    }, [startDate, endDate]);

    return { summary, isLoading, error };
}
