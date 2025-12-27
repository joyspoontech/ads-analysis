'use client';

import { useMemo } from 'react';
import {
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    Radar,
} from 'recharts';
import { Layers, Loader2 } from 'lucide-react';
import ChartCard from '@/components/ChartCard';
import { useMetrics } from '@/hooks/useMetrics';
import { formatNumber } from '@/lib/aggregation';

const COLORS = ['#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', '#EC4899', '#EF4444'];

const PLATFORM_COLORS: Record<string, string> = {
    swiggy: '#FC8019',
    zepto: '#8B5CF6',
    blinkit: '#F8E831',
    instamart: '#41B883',
    amazon: '#FF9900',
    flipkart: '#2874F0',
};

export default function PlatformsPage() {
    const { platformMetrics, isLoading } = useMetrics();

    // Prepare data for charts
    const pieData = useMemo(() => {
        return platformMetrics.map(pm => ({
            name: pm.platform.charAt(0).toUpperCase() + pm.platform.slice(1),
            value: pm.totalSpend,
            color: PLATFORM_COLORS[pm.platform.toLowerCase()] || '#8B5CF6',
        }));
    }, [platformMetrics]);

    const radarData = useMemo(() => {
        if (platformMetrics.length === 0) return [];

        // Normalize values to 0-100 scale for radar chart
        const maxSpend = Math.max(...platformMetrics.map(p => p.totalSpend));
        const maxSales = Math.max(...platformMetrics.map(p => p.totalSales));
        const maxImpressions = Math.max(...platformMetrics.map(p => p.totalImpressions));
        const maxRoas = Math.max(...platformMetrics.map(p => p.roas));

        return platformMetrics.map(pm => ({
            platform: pm.platform.charAt(0).toUpperCase() + pm.platform.slice(1),
            Spend: maxSpend > 0 ? (pm.totalSpend / maxSpend) * 100 : 0,
            Sales: maxSales > 0 ? (pm.totalSales / maxSales) * 100 : 0,
            Impressions: maxImpressions > 0 ? (pm.totalImpressions / maxImpressions) * 100 : 0,
            ROAS: maxRoas > 0 ? (pm.roas / maxRoas) * 100 : 0,
        }));
    }, [platformMetrics]);

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Page Header */}
            <div>
                <h1 className="text-3xl font-bold">Platforms</h1>
                <p className="text-[var(--text-muted)] mt-1">
                    Compare performance across platforms
                </p>
            </div>

            {/* Loading State */}
            {isLoading && (
                <div className="glass rounded-2xl p-12 text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-[var(--primary)]" />
                    <p className="text-[var(--text-muted)]">Loading platform data...</p>
                </div>
            )}

            {/* Empty State */}
            {!isLoading && platformMetrics.length === 0 && (
                <div className="glass rounded-2xl p-12 text-center">
                    <Layers className="w-12 h-12 mx-auto mb-4 text-[var(--text-muted)]" />
                    <h2 className="text-xl font-semibold mb-2">No Platform Data</h2>
                    <p className="text-[var(--text-muted)]">
                        Sync your data sources to see platform comparison.
                    </p>
                </div>
            )}

            {/* Platform Cards */}
            {!isLoading && platformMetrics.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {platformMetrics.map((pm, index) => {
                        const color = PLATFORM_COLORS[pm.platform.toLowerCase()] || COLORS[index % COLORS.length];
                        return (
                            <div
                                key={pm.platform}
                                className={`glass rounded-xl p-6 card-hover animate-slide-up stagger-${Math.min(index + 1, 5)}`}
                            >
                                <div className="flex items-center gap-3 mb-4">
                                    <div
                                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                                        style={{ background: `${color}20` }}
                                    >
                                        <Layers className="w-5 h-5" style={{ color }} />
                                    </div>
                                    <h3 className="font-semibold text-lg">
                                        {pm.platform.charAt(0).toUpperCase() + pm.platform.slice(1)}
                                    </h3>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-[var(--text-muted)]">Spend</span>
                                        <span className="font-medium">{formatNumber(pm.totalSpend, 'currency')}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-[var(--text-muted)]">Sales</span>
                                        <span className="font-medium">{formatNumber(pm.totalSales, 'currency')}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-[var(--text-muted)]">Impressions</span>
                                        <span className="font-medium">{formatNumber(pm.totalImpressions)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-[var(--text-muted)]">ROAS</span>
                                        <span className={`badge ${pm.roas >= 1 ? 'badge-success' : 'badge-warning'}`}>
                                            {pm.roas.toFixed(2)}x
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Charts Row */}
            {!isLoading && platformMetrics.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Spend Distribution Pie */}
                    <ChartCard title="Spend Distribution" subtitle="By platform">
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(value) => formatNumber(Number(value) || 0, 'currency')}
                                        contentStyle={{
                                            background: 'var(--surface)',
                                            border: '1px solid var(--border)',
                                            borderRadius: '8px',
                                        }}
                                    />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </ChartCard>

                    {/* Platform Comparison Bar */}
                    <ChartCard title="Spend vs Sales" subtitle="Side by side comparison">
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={platformMetrics} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                    <XAxis type="number" stroke="var(--text-muted)" fontSize={12} />
                                    <YAxis
                                        dataKey="platform"
                                        type="category"
                                        stroke="var(--text-muted)"
                                        fontSize={12}
                                        width={80}
                                        tickFormatter={(value) => value.charAt(0).toUpperCase() + value.slice(1)}
                                    />
                                    <Tooltip
                                        formatter={(value) => formatNumber(Number(value) || 0, 'currency')}
                                        contentStyle={{
                                            background: 'var(--surface)',
                                            border: '1px solid var(--border)',
                                            borderRadius: '8px',
                                        }}
                                    />
                                    <Legend />
                                    <Bar dataKey="totalSpend" name="Spend" fill="#8B5CF6" radius={[0, 4, 4, 0]} />
                                    <Bar dataKey="totalSales" name="Sales" fill="#10B981" radius={[0, 4, 4, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </ChartCard>
                </div>
            )}

            {/* ROAS Comparison Table */}
            {!isLoading && platformMetrics.length > 0 && (
                <div className="glass rounded-2xl overflow-hidden">
                    <div className="p-4 border-b border-[var(--border)]">
                        <h3 className="font-semibold">Platform Performance Summary</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Platform</th>
                                    <th>Spend</th>
                                    <th>Sales</th>
                                    <th>Impressions</th>
                                    <th>ROAS</th>
                                    <th>Share of Spend</th>
                                </tr>
                            </thead>
                            <tbody>
                                {platformMetrics.map((pm, index) => {
                                    const totalSpend = platformMetrics.reduce((sum, p) => sum + p.totalSpend, 0);
                                    const share = totalSpend > 0 ? (pm.totalSpend / totalSpend) * 100 : 0;
                                    const color = PLATFORM_COLORS[pm.platform.toLowerCase()] || COLORS[index % COLORS.length];

                                    return (
                                        <tr key={pm.platform}>
                                            <td>
                                                <span className="flex items-center gap-2">
                                                    <span
                                                        className="w-3 h-3 rounded-full"
                                                        style={{ background: color }}
                                                    />
                                                    <span className="font-medium">
                                                        {pm.platform.charAt(0).toUpperCase() + pm.platform.slice(1)}
                                                    </span>
                                                </span>
                                            </td>
                                            <td>{formatNumber(pm.totalSpend, 'currency')}</td>
                                            <td>{formatNumber(pm.totalSales, 'currency')}</td>
                                            <td>{formatNumber(pm.totalImpressions)}</td>
                                            <td>
                                                <span className={`badge ${pm.roas >= 1 ? 'badge-success' : 'badge-warning'}`}>
                                                    {pm.roas.toFixed(2)}x
                                                </span>
                                            </td>
                                            <td>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-20 h-2 bg-[var(--surface)] rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full rounded-full"
                                                            style={{ width: `${share}%`, background: color }}
                                                        />
                                                    </div>
                                                    <span className="text-sm">{share.toFixed(1)}%</span>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
