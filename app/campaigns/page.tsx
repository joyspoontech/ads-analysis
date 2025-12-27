'use client';

import { useState, useMemo } from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';
import {
    Calendar,
    TrendingUp,
    DollarSign,
    Eye,
    MousePointer,
    Loader2,
    RefreshCw,
} from 'lucide-react';
import ChartCard from '@/components/ChartCard';
import DateRangePicker from '@/components/DateRangePicker';
import { useMetrics } from '@/hooks/useMetrics';
import { useSync } from '@/hooks/useSync';
import { aggregateToWeekly, aggregateToMonthly, formatNumber } from '@/lib/aggregation';

type AggregationType = 'daily' | 'weekly' | 'monthly';

export default function CampaignsPage() {
    const [aggregation, setAggregation] = useState<AggregationType>('daily');
    const [dateRange, setDateRange] = useState(() => {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 30);
        return {
            start: start.toISOString().split('T')[0],
            end: end.toISOString().split('T')[0],
        };
    });

    const { dailyMetrics, summary, isLoading, refresh } = useMetrics({
        startDate: dateRange.start,
        endDate: dateRange.end,
    });
    const { isSyncing, syncAll } = useSync();

    // Aggregate data based on selection
    const aggregatedData = useMemo(() => {
        if (aggregation === 'weekly') {
            return aggregateToWeekly(dailyMetrics).map(w => ({
                label: `${new Date(w.weekStart).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}`,
                spend: w.totalSpend,
                sales: w.totalSales,
                impressions: w.totalImpressions,
                clicks: w.totalClicks,
                ctr: w.ctr,
                roas: w.roas,
            }));
        } else if (aggregation === 'monthly') {
            return aggregateToMonthly(dailyMetrics).map(m => ({
                label: m.monthLabel,
                spend: m.totalSpend,
                sales: m.totalSales,
                impressions: m.totalImpressions,
                clicks: m.totalClicks,
                ctr: m.ctr,
                roas: m.roas,
            }));
        } else {
            return dailyMetrics.map(d => ({
                label: new Date(d.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
                spend: Number(d.total_spend),
                sales: Number(d.total_sales),
                impressions: Number(d.total_impressions),
                clicks: Number(d.total_clicks),
                ctr: Number(d.ctr),
                roas: Number(d.roas),
            }));
        }
    }, [dailyMetrics, aggregation]);

    const handleSync = async () => {
        await syncAll();
        await refresh();
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Campaigns</h1>
                    <p className="text-[var(--text-muted)] mt-1">
                        Analyze performance by date, week, or month
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    {/* Aggregation Toggle */}
                    <div className="flex rounded-lg overflow-hidden border border-[var(--border)]">
                        {(['daily', 'weekly', 'monthly'] as AggregationType[]).map((agg) => (
                            <button
                                key={agg}
                                onClick={() => setAggregation(agg)}
                                className={`px-4 py-2 text-sm font-medium transition-colors ${aggregation === agg
                                    ? 'bg-[var(--primary)] text-white'
                                    : 'bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--surface-light)]'
                                    }`}
                            >
                                {agg.charAt(0).toUpperCase() + agg.slice(1)}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={handleSync}
                        disabled={isSyncing}
                        className="btn-secondary flex items-center gap-2"
                    >
                        <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                        Sync
                    </button>
                    <DateRangePicker
                        onRangeChange={(start, end) => setDateRange({
                            start: start.toISOString().split('T')[0],
                            end: end.toISOString().split('T')[0],
                        })}
                    />
                </div>
            </div>

            {/* Summary Stats */}
            {summary && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="glass rounded-xl p-4 animate-slide-up stagger-1 card-hover">
                        <div className="flex items-center gap-2 text-[var(--text-muted)] mb-2">
                            <DollarSign className="w-4 h-4" />
                            <span className="text-sm">Total Spend</span>
                        </div>
                        <p className="text-2xl font-bold">{formatNumber(summary.totalSpend, 'currency')}</p>
                    </div>
                    <div className="glass rounded-xl p-4 animate-slide-up stagger-2 card-hover">
                        <div className="flex items-center gap-2 text-[var(--text-muted)] mb-2">
                            <TrendingUp className="w-4 h-4" />
                            <span className="text-sm">Total Sales</span>
                        </div>
                        <p className="text-2xl font-bold">{formatNumber(summary.totalSales, 'currency')}</p>
                    </div>
                    <div className="glass rounded-xl p-4 animate-slide-up stagger-3 card-hover">
                        <div className="flex items-center gap-2 text-[var(--text-muted)] mb-2">
                            <Eye className="w-4 h-4" />
                            <span className="text-sm">Avg CTR</span>
                        </div>
                        <p className="text-2xl font-bold">{summary.avgCtr.toFixed(2)}%</p>
                    </div>
                    <div className="glass rounded-xl p-4 animate-slide-up stagger-4 card-hover">
                        <div className="flex items-center gap-2 text-[var(--text-muted)] mb-2">
                            <Calendar className="w-4 h-4" />
                            <span className="text-sm">Avg ROAS</span>
                        </div>
                        <p className="text-2xl font-bold">{summary.avgRoas.toFixed(2)}x</p>
                    </div>
                </div>
            )}

            {/* Loading State */}
            {isLoading && (
                <div className="glass rounded-2xl p-12 text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-[var(--primary)]" />
                    <p className="text-[var(--text-muted)]">Loading campaign data...</p>
                </div>
            )}

            {/* Spend vs Sales Chart */}
            {!isLoading && aggregatedData.length > 0 && (
                <ChartCard
                    title={`Spend vs Sales (${aggregation})`}
                    subtitle={`${aggregatedData.length} ${aggregation === 'daily' ? 'days' : aggregation === 'weekly' ? 'weeks' : 'months'}`}
                >
                    <div className="h-96">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={aggregatedData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                <XAxis dataKey="label" stroke="var(--text-muted)" fontSize={12} />
                                <YAxis stroke="var(--text-muted)" fontSize={12} />
                                <Tooltip
                                    contentStyle={{
                                        background: 'var(--surface)',
                                        border: '1px solid var(--border)',
                                        borderRadius: '8px',
                                    }}
                                />
                                <Legend />
                                <Bar dataKey="spend" name="Spend" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="sales" name="Sales" fill="#10B981" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </ChartCard>
            )}

            {/* Data Table */}
            {!isLoading && aggregatedData.length > 0 && (
                <div className="glass rounded-2xl overflow-hidden">
                    <div className="p-4 border-b border-[var(--border)]">
                        <h3 className="font-semibold">Detailed Breakdown</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Period</th>
                                    <th>Spend</th>
                                    <th>Impressions</th>
                                    <th>Clicks</th>
                                    <th>CTR%</th>
                                    <th>Sales</th>
                                    <th>ROAS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {aggregatedData.map((row, index) => (
                                    <tr key={index}>
                                        <td className="font-medium">{row.label}</td>
                                        <td>{formatNumber(row.spend, 'currency')}</td>
                                        <td>{formatNumber(row.impressions)}</td>
                                        <td>{formatNumber(row.clicks)}</td>
                                        <td>{row.ctr.toFixed(2)}%</td>
                                        <td>{formatNumber(row.sales, 'currency')}</td>
                                        <td>
                                            <span className={`badge ${row.roas >= 1 ? 'badge-success' : 'badge-warning'}`}>
                                                {row.roas.toFixed(2)}x
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Empty State */}
            {!isLoading && aggregatedData.length === 0 && (
                <div className="glass rounded-2xl p-12 text-center">
                    <Calendar className="w-12 h-12 mx-auto mb-4 text-[var(--text-muted)]" />
                    <h2 className="text-xl font-semibold mb-2">No Campaign Data</h2>
                    <p className="text-[var(--text-muted)]">
                        Sync your data sources to see campaign analytics.
                    </p>
                </div>
            )}
        </div>
    );
}
