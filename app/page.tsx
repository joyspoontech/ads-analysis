'use client';

import { useState, useMemo } from 'react';
import {
  AreaChart,
  Area,
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
} from 'recharts';
import {
  DollarSign,
  TrendingUp,
  Eye,
  MousePointer,
  Target,
  ArrowUpRight,
  Loader2,
  RefreshCw,
  Database,
  AlertCircle,
} from 'lucide-react';
import StatCard from '@/components/StatCard';
import ChartCard from '@/components/ChartCard';
import DateRangePicker from '@/components/DateRangePicker';
import { useMetrics } from '@/hooks/useMetrics';
import { useSync } from '@/hooks/useSync';
import { useDataSources } from '@/hooks/useDataSources';

const COLORS = ['#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', '#EC4899', '#EF4444'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass rounded-lg p-3 border border-[var(--border)]">
        <p className="text-sm font-medium mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {typeof entry.value === 'number'
              ? entry.value >= 1000
                ? `₹${(entry.value / 1000).toFixed(1)}K`
                : entry.value.toFixed(2)
              : entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  // Date range state
  const [dateRange, setDateRange] = useState(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0],
    };
  });

  // Platform filter for Ads Performance section
  const [selectedAdsPlatform, setSelectedAdsPlatform] = useState<string>('all');

  // Hooks
  const { summary, platformMetrics, trend, adsMetrics, isLoading: metricsLoading, refresh: refreshMetrics } = useMetrics({
    startDate: dateRange.start,
    endDate: dateRange.end,
  });
  const { isSyncing, syncAll, lastSyncTime, error: syncError } = useSync();
  const { sources, isLoading: sourcesLoading } = useDataSources();

  // Handle sync
  const handleSync = async () => {
    await syncAll();
    await refreshMetrics();
  };

  // Chart data
  const trendData = useMemo(() => {
    return trend.map(t => ({
      ...t,
      displayDate: new Date(t.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
    }));
  }, [trend]);

  const pieData = useMemo(() => {
    return platformMetrics.map(pm => ({
      name: pm.platform.charAt(0).toUpperCase() + pm.platform.slice(1),
      value: pm.totalSpend,
    }));
  }, [platformMetrics]);

  // Filter ads metrics by selected platform
  const filteredAdsMetrics = useMemo(() => {
    if (selectedAdsPlatform === 'all') {
      return adsMetrics;
    }
    return adsMetrics.filter(m => m.platform === selectedAdsPlatform);
  }, [adsMetrics, selectedAdsPlatform]);

  const hasData = summary && summary.totalSpend > 0;
  const hasDataSources = sources.length > 0;
  const isLoading = metricsLoading || sourcesLoading;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Dashboard Overview</h1>
          <p className="text-[var(--text-muted)] mt-1">
            {hasDataSources ? `${sources.filter(s => s.is_active).length} active data source(s)` : 'No data sources'}
            {isSyncing && (
              <span className="ml-2 inline-flex items-center gap-1 text-[var(--primary)]">
                <Loader2 className="w-4 h-4 animate-spin" />
                Syncing...
              </span>
            )}
            {lastSyncTime && !isSyncing && (
              <span className="ml-2 text-xs">
                Last synced: {lastSyncTime.toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={handleSync}
            disabled={isSyncing || !hasDataSources}
            className="btn-secondary flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            Sync Now
          </button>
          <DateRangePicker
            onRangeChange={(start, end) => setDateRange({
              start: start.toISOString().split('T')[0],
              end: end.toISOString().split('T')[0],
            })}
          />
        </div>
      </div>

      {/* Sync Error */}
      {syncError && (
        <div className="glass rounded-2xl p-4 border border-red-500/20 bg-red-500/10 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <p className="text-red-500">{syncError}</p>
        </div>
      )}

      {/* No Data Sources */}
      {!hasDataSources && !isLoading && (
        <div className="glass rounded-2xl p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-[var(--primary)]/20 flex items-center justify-center mx-auto mb-4">
            <Database className="w-8 h-8 text-[var(--primary)]" />
          </div>
          <h2 className="text-xl font-semibold mb-2">No Data Sources</h2>
          <p className="text-[var(--text-muted)] max-w-md mx-auto mb-6">
            Add a Google Sheet to start syncing your analytics data.
          </p>
          <a
            href="/data-sources"
            className="btn-primary inline-flex items-center gap-2"
          >
            Add Data Source
          </a>
        </div>
      )}

      {/* No Data in Range */}
      {hasDataSources && !hasData && !isLoading && (
        <div className="glass rounded-2xl p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-[var(--warning)]/20 flex items-center justify-center mx-auto mb-4">
            <RefreshCw className="w-8 h-8 text-[var(--warning)]" />
          </div>
          <h2 className="text-xl font-semibold mb-2">No Data Found</h2>
          <p className="text-[var(--text-muted)] max-w-md mx-auto mb-6">
            No data found for the selected date range. Try syncing your data sources or adjusting the dates.
          </p>
          <button onClick={handleSync} disabled={isSyncing} className="btn-primary">
            {isSyncing ? 'Syncing...' : 'Sync Data'}
          </button>
        </div>
      )}

      {/* Stats Grid */}
      {(hasData || isLoading) && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="animate-slide-up stagger-1">
            <StatCard
              title="Total Spends"
              value={summary?.totalSpend || 0}
              format="currency"
              icon={DollarSign}
              color="primary"
            />
          </div>
          <div className="animate-slide-up stagger-2">
            <StatCard
              title="Product Sales"
              value={summary?.totalProductSales || 0}
              format="currency"
              icon={TrendingUp}
              color="success"
            />
          </div>
          <div className="animate-slide-up stagger-3">
            <StatCard
              title="Average ROAS"
              value={summary?.avgRoas || 0}
              format="number"
              icon={Target}
              color="secondary"
              suffix="x"
            />
          </div>
          <div className="animate-slide-up stagger-4">
            <StatCard
              title="Total Impressions"
              value={summary?.totalImpressions || 0}
              format="number"
              icon={Eye}
              color="warning"
            />
          </div>
        </div>
      )}

      {/* Charts Row 1 */}
      {(hasData || isLoading) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Spends vs Sales Trend */}
          <ChartCard
            title="Spends vs Sales Trend"
            subtitle="Daily performance over selected period"
          >
            <div className="h-80">
              {trendData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData}>
                    <defs>
                      <linearGradient id="spendsGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="displayDate" stroke="var(--text-muted)" fontSize={12} />
                    <YAxis stroke="var(--text-muted)" fontSize={12} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="spend"
                      name="Spends"
                      stroke="#8B5CF6"
                      fill="url(#spendsGradient)"
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="sales"
                      name="Sales"
                      stroke="#10B981"
                      fill="url(#salesGradient)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-[var(--text-muted)]">
                  {isLoading ? 'Loading chart data...' : 'No trend data available'}
                </div>
              )}
            </div>
          </ChartCard>

          {/* Platform Comparison */}
          <ChartCard title="Platform Performance" subtitle="Comparison across platforms">
            <div className="h-80">
              {platformMetrics.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={platformMetrics} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis type="number" stroke="var(--text-muted)" fontSize={12} />
                    <YAxis
                      dataKey="platform"
                      type="category"
                      stroke="var(--text-muted)"
                      fontSize={12}
                      width={100}
                      tickFormatter={(value) => value.charAt(0).toUpperCase() + value.slice(1)}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="totalSpend" name="Spends" fill="#8B5CF6" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="totalSales" name="Sales" fill="#10B981" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-[var(--text-muted)]">
                  {isLoading ? 'Loading...' : 'No platform data available'}
                </div>
              )}
            </div>
          </ChartCard>
        </div>
      )}

      {/* Charts Row 2 */}
      {(hasData || isLoading) && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Metrics Cards */}
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Avg. CTR</h3>
              <ArrowUpRight className="w-5 h-5 text-[var(--success)]" />
            </div>
            <p className="text-3xl font-bold">{(summary?.avgCtr || 0).toFixed(2)}%</p>
            <p className="text-sm text-[var(--text-muted)] mt-2">Click-through rate</p>
          </div>

          <div className="glass rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Total Clicks</h3>
              <MousePointer className="w-5 h-5 text-[var(--primary)]" />
            </div>
            <p className="text-3xl font-bold">
              {(summary?.totalClicks || 0) >= 1000
                ? `${((summary?.totalClicks || 0) / 1000).toFixed(1)}K`
                : summary?.totalClicks || 0}
            </p>
            <p className="text-sm text-[var(--text-muted)] mt-2">From all campaigns</p>
          </div>

          <div className="glass rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Avg. CPI</h3>
              <DollarSign className="w-5 h-5 text-[var(--warning)]" />
            </div>
            <p className="text-3xl font-bold">
              ₹{(summary?.avgCpi || 0).toFixed(4)}
            </p>
            <p className="text-sm text-[var(--text-muted)] mt-2">Cost per impression</p>
          </div>
        </div>
      )}

      {/* Spends Distribution */}
      {(hasData || isLoading) && pieData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard title="Spends Distribution" subtitle="By platform">
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
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          {/* Platform Stats Table */}
          <ChartCard title="Platform Summary" subtitle="Key metrics by platform">
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Platform</th>
                    <th>Spends</th>
                    <th>Sales</th>
                    <th>ROAS</th>
                  </tr>
                </thead>
                <tbody>
                  {platformMetrics.map((pm, index) => (
                    <tr key={pm.platform}>
                      <td className="font-medium">
                        <span className="inline-flex items-center gap-2">
                          <span
                            className="w-3 h-3 rounded-full"
                            style={{ background: COLORS[index % COLORS.length] }}
                          />
                          {pm.platform.charAt(0).toUpperCase() + pm.platform.slice(1)}
                        </span>
                      </td>
                      <td>₹{pm.totalSpend >= 1000 ? `${(pm.totalSpend / 1000).toFixed(1)}K` : pm.totalSpend.toFixed(0)}</td>
                      <td>₹{pm.totalSales >= 1000 ? `${(pm.totalSales / 1000).toFixed(1)}K` : pm.totalSales.toFixed(0)}</td>
                      <td>
                        <span className={`badge ${pm.roas >= 1 ? 'badge-success' : 'badge-warning'}`}>
                          {pm.roas.toFixed(2)}x
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ChartCard>
        </div>
      )}

      {/* ================================================== */}
      {/* ADS PERFORMANCE SECTION */}
      {/* ================================================== */}
      {(hasData || isLoading) && filteredAdsMetrics.length > 0 && (
        <>
          {/* Section Header */}
          <div className="pt-6 pb-2 border-t border-[var(--border)]">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  📊 Ads Performance Analysis
                </h2>
                <p className="text-[var(--text-muted)]">
                  Metrics from advertising campaigns only • {filteredAdsMetrics.length} days of data
                </p>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-[var(--text-muted)]">Platform:</label>
                <select
                  value={selectedAdsPlatform}
                  onChange={(e) => setSelectedAdsPlatform(e.target.value)}
                  className="select-field text-sm py-1 px-3"
                >
                  <option value="all">All Platforms</option>
                  <option value="swiggy">Swiggy</option>
                  <option value="zepto">Zepto</option>
                  <option value="blinkit">Blinkit</option>
                  <option value="instamart">Instamart</option>
                </select>
              </div>
            </div>
          </div>

          {/* Ads Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="glass rounded-xl p-4">
              <p className="text-sm text-[var(--text-muted)]">Ad Spend</p>
              <p className="text-2xl font-bold">
                ₹{filteredAdsMetrics.reduce((sum, r) => sum + Number(r.total_spend), 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </p>
            </div>
            <div className="glass rounded-xl p-4">
              <p className="text-sm text-[var(--text-muted)]">Ad Sales (GMV)</p>
              <p className="text-2xl font-bold text-[var(--success)]">
                ₹{filteredAdsMetrics.reduce((sum, r) => sum + Number(r.total_sales), 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </p>
            </div>
            <div className="glass rounded-xl p-4">
              <p className="text-sm text-[var(--text-muted)]">Avg. CTR</p>
              <p className="text-2xl font-bold">
                {(() => {
                  const totalClicks = filteredAdsMetrics.reduce((sum, r) => sum + Number(r.total_clicks), 0);
                  const totalImpr = filteredAdsMetrics.reduce((sum, r) => sum + Number(r.total_impressions), 0);
                  return totalImpr > 0 ? ((totalClicks / totalImpr) * 100).toFixed(2) : '0.00';
                })()}%
              </p>
            </div>
            <div className="glass rounded-xl p-4">
              <p className="text-sm text-[var(--text-muted)]">Overall ROAS</p>
              <p className="text-2xl font-bold text-[var(--primary)]">
                {(() => {
                  const totalSpend = filteredAdsMetrics.reduce((sum, r) => sum + Number(r.total_spend), 0);
                  const totalSales = filteredAdsMetrics.reduce((sum, r) => sum + Number(r.total_sales), 0);
                  return totalSpend > 0 ? (totalSales / totalSpend).toFixed(2) : '0.00';
                })()}x
              </p>
            </div>
          </div>

          {/* Ads Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Ads Spend vs Sales Chart */}
            <ChartCard title="Ad Spend vs Sales" subtitle="Daily performance from ads">
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={filteredAdsMetrics.map(m => ({
                    date: new Date(m.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
                    spend: Number(m.total_spend),
                    sales: Number(m.total_sales),
                  }))}>
                    <defs>
                      <linearGradient id="adsSpendGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="adsSalesGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={11} />
                    <YAxis stroke="var(--text-muted)" fontSize={11} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Area type="monotone" dataKey="spend" name="Ad Spend" stroke="#8B5CF6" fill="url(#adsSpendGradient)" strokeWidth={2} />
                    <Area type="monotone" dataKey="sales" name="Ad Sales" stroke="#10B981" fill="url(#adsSalesGradient)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>

            {/* ROAS Trend Chart */}
            <ChartCard title="ROAS Trend" subtitle="Return on Ad Spend over time">
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={filteredAdsMetrics.map(m => ({
                    date: new Date(m.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
                    roas: Number(m.roas),
                    ctr: Number(m.ctr),
                  }))}>
                    <defs>
                      <linearGradient id="roasGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={11} />
                    <YAxis stroke="var(--text-muted)" fontSize={11} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Area type="monotone" dataKey="roas" name="ROAS" stroke="#F59E0B" fill="url(#roasGradient)" strokeWidth={2} />
                    {/* Reference line at ROAS = 1 */}
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
          </div>

          {/* Ads Daily Breakdown Table */}
          <div className="glass rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-[var(--border)]">
              <h3 className="font-semibold text-lg">Daily Breakdown</h3>
              <p className="text-sm text-[var(--text-muted)]">
                Detailed daily ads metrics
              </p>
            </div>
            <div className="overflow-x-auto max-h-[500px]">
              <table className="data-table">
                <thead className="sticky top-0 bg-[var(--surface)]">
                  <tr>
                    <th>Date</th>
                    <th>Spends</th>
                    <th>Impressions</th>
                    <th>Clicks</th>
                    <th>Sales</th>
                    <th>CPI</th>
                    <th>CTR%</th>
                    <th>ROAS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAdsMetrics.map((row) => (
                    <tr key={`${row.date}-${row.platform}`}>
                      <td className="font-medium">
                        {new Date(row.date).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        })}
                      </td>
                      <td>₹{Number(row.total_spend).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
                      <td>{Number(row.total_impressions).toLocaleString('en-IN')}</td>
                      <td>{Number(row.total_clicks).toLocaleString('en-IN')}</td>
                      <td>₹{Number(row.total_sales).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
                      <td>{Number(row.cpi).toFixed(2)}</td>
                      <td>{Number(row.ctr).toFixed(2)}%</td>
                      <td>
                        <span className={`badge ${Number(row.roas) >= 1 ? 'badge-success' : 'badge-warning'}`}>
                          {Number(row.roas).toFixed(2)}x
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                {/* Summary Row */}
                <tfoot className="bg-[var(--surface-light)] font-semibold border-t-2 border-[var(--border)]">
                  <tr>
                    <td>Total</td>
                    <td>₹{filteredAdsMetrics.reduce((sum, r) => sum + Number(r.total_spend), 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
                    <td>{filteredAdsMetrics.reduce((sum, r) => sum + Number(r.total_impressions), 0).toLocaleString('en-IN')}</td>
                    <td>{filteredAdsMetrics.reduce((sum, r) => sum + Number(r.total_clicks), 0).toLocaleString('en-IN')}</td>
                    <td>₹{filteredAdsMetrics.reduce((sum, r) => sum + Number(r.total_sales), 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
                    <td>
                      {(() => {
                        const totalSpend = filteredAdsMetrics.reduce((sum, r) => sum + Number(r.total_spend), 0);
                        const totalImpr = filteredAdsMetrics.reduce((sum, r) => sum + Number(r.total_impressions), 0);
                        return totalImpr > 0 ? (totalSpend / totalImpr).toFixed(2) : '0.00';
                      })()}
                    </td>
                    <td>
                      {(() => {
                        const totalClicks = filteredAdsMetrics.reduce((sum, r) => sum + Number(r.total_clicks), 0);
                        const totalImpr = filteredAdsMetrics.reduce((sum, r) => sum + Number(r.total_impressions), 0);
                        return totalImpr > 0 ? ((totalClicks / totalImpr) * 100).toFixed(2) : '0.00';
                      })()}%
                    </td>
                    <td>
                      <span className="badge badge-primary">
                        {(() => {
                          const totalSpend = filteredAdsMetrics.reduce((sum, r) => sum + Number(r.total_spend), 0);
                          const totalSales = filteredAdsMetrics.reduce((sum, r) => sum + Number(r.total_sales), 0);
                          return totalSpend > 0 ? (totalSales / totalSpend).toFixed(2) : '0.00';
                        })()}x
                      </span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
