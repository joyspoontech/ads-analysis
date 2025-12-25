/**
 * Supabase Client & Database Queries
 * Dashboard 2.0 - Hybrid Architecture
 */

import { createClient } from '@supabase/supabase-js';

// Supabase Configuration
const supabaseUrl = 'https://fhomcjmquvhvakvfinsv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZob21jam1xdXZodmFrdmZpbnN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0MDI4NzQsImV4cCI6MjA4MTk3ODg3NH0.IObl3mkoz_8-Kqit7W8Lw41uNFAJAgzPWHxqm0n7zuY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ============================================
// Type Definitions
// ============================================

export interface DataSource {
    id: string;
    name: string;
    sheet_id: string;
    sheet_url: string;
    platform: string;
    data_type: 'ads' | 'sales';
    tab_name: string | null;
    tab_gid: string | null;
    is_active: boolean;
    last_synced_at: string | null;
    created_at: string;
    updated_at: string;
}

export interface ColumnMapping {
    id: string;
    platform: string;
    data_type: 'ads' | 'sales';
    source_column: string;
    target_column: string;
    is_active: boolean;
    created_at: string;
}

export interface DailyMetric {
    id: string;
    date: string;
    platform: string;
    data_type: 'ads' | 'sales';
    total_spend: number;
    total_impressions: number;
    total_clicks: number;
    total_sales: number;
    total_orders: number;
    cpi: number;
    ctr: number;
    cpc: number;
    roas: number;
    synced_at: string;
}

export interface MonthlySummary {
    id: string;
    month: string;
    platform: string;
    total_spend: number;
    total_impressions: number;
    total_clicks: number;
    total_sales: number;
    total_orders: number;
    avg_cpi: number;
    avg_ctr: number;
    avg_roas: number;
}

// ============================================
// Data Sources CRUD
// ============================================

export async function getDataSources(): Promise<DataSource[]> {
    const { data, error } = await supabase
        .from('data_sources')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('[getDataSources] Error:', error);
        return [];
    }
    return data || [];
}

export async function getActiveDataSources(): Promise<DataSource[]> {
    const { data, error } = await supabase
        .from('data_sources')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('[getActiveDataSources] Error:', error);
        return [];
    }
    return data || [];
}

export async function addDataSource(source: Omit<DataSource, 'id' | 'created_at' | 'updated_at'>): Promise<DataSource | null> {
    const { data, error } = await supabase
        .from('data_sources')
        .insert(source)
        .select()
        .single();

    if (error) {
        console.error('[addDataSource] Error:', error);
        return null;
    }
    return data;
}

export async function updateDataSource(id: string, updates: Partial<DataSource>): Promise<DataSource | null> {
    const { data, error } = await supabase
        .from('data_sources')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('[updateDataSource] Error:', error);
        return null;
    }
    return data;
}

export async function deleteDataSource(id: string): Promise<boolean> {
    // First, get the data source details to know which metrics to delete
    const { data: source } = await supabase
        .from('data_sources')
        .select('platform, data_type')
        .eq('id', id)
        .single();

    if (source) {
        // Check if there are other data sources with the same platform and data_type
        const { data: otherSources } = await supabase
            .from('data_sources')
            .select('id')
            .eq('platform', source.platform)
            .eq('data_type', source.data_type)
            .neq('id', id);

        // Only delete metrics if this is the LAST source for this platform/data_type
        if (!otherSources || otherSources.length === 0) {
            console.log(`[deleteDataSource] Deleting daily_metrics for ${source.platform}/${source.data_type}`);
            const { error: metricsError } = await supabase
                .from('daily_metrics')
                .delete()
                .eq('platform', source.platform)
                .eq('data_type', source.data_type);

            if (metricsError) {
                console.error('[deleteDataSource] Error deleting metrics:', metricsError);
            }
        }
    }

    // Delete the data source
    const { error } = await supabase
        .from('data_sources')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('[deleteDataSource] Error:', error);
        return false;
    }

    console.log(`[deleteDataSource] Successfully deleted data source ${id} and associated metrics`);
    return true;
}

// ============================================
// Column Mappings
// ============================================

export async function getColumnMappings(platform?: string): Promise<ColumnMapping[]> {
    let query = supabase
        .from('column_mappings')
        .select('*')
        .eq('is_active', true);

    if (platform) {
        query = query.eq('platform', platform);
    }

    const { data, error } = await query;

    if (error) {
        console.error('[getColumnMappings] Error:', error);
        return [];
    }
    return data || [];
}

export async function upsertColumnMapping(mapping: Omit<ColumnMapping, 'id' | 'created_at'>): Promise<ColumnMapping | null> {
    const { data, error } = await supabase
        .from('column_mappings')
        .upsert(mapping, { onConflict: 'platform,data_type,source_column' })
        .select()
        .single();

    if (error) {
        console.error('[upsertColumnMapping] Error:', error);
        return null;
    }
    return data;
}

// ============================================
// Daily Metrics
// ============================================

export async function getDailyMetrics(
    startDate?: string,
    endDate?: string,
    platform?: string
): Promise<DailyMetric[]> {
    let query = supabase
        .from('daily_metrics')
        .select('*')
        .order('date', { ascending: false });

    if (startDate) {
        query = query.gte('date', startDate);
    }
    if (endDate) {
        query = query.lte('date', endDate);
    }
    if (platform) {
        query = query.eq('platform', platform);
    }

    const { data, error } = await query;

    if (error) {
        console.error('[getDailyMetrics] Error:', error);
        return [];
    }
    return data || [];
}

export async function upsertDailyMetric(metric: Omit<DailyMetric, 'id' | 'synced_at' | 'cpi' | 'ctr' | 'cpc' | 'roas'>): Promise<DailyMetric | null> {
    const { data, error } = await supabase
        .from('daily_metrics')
        .upsert(metric, { onConflict: 'date,platform,data_type' })
        .select()
        .single();

    if (error) {
        console.error('[upsertDailyMetric] Error:', error);
        return null;
    }
    return data;
}

export async function upsertDailyMetricsBatch(metrics: Omit<DailyMetric, 'id' | 'synced_at' | 'cpi' | 'ctr' | 'cpc' | 'roas'>[]): Promise<boolean> {
    if (metrics.length === 0) {
        console.log('[upsertDailyMetricsBatch] No metrics to upsert');
        return true;
    }

    console.log(`[upsertDailyMetricsBatch] Upserting ${metrics.length} records`);
    console.log('[upsertDailyMetricsBatch] Sample record:', JSON.stringify(metrics[0]));

    // Validate data before upsert
    const validMetrics = metrics.filter(m => {
        if (!m.date || !m.platform || !m.data_type) {
            console.warn('[upsertDailyMetricsBatch] Invalid record (missing required fields):', m);
            return false;
        }
        return true;
    });

    if (validMetrics.length === 0) {
        console.error('[upsertDailyMetricsBatch] No valid records after filtering');
        return false;
    }

    const { data, error } = await supabase
        .from('daily_metrics')
        .upsert(validMetrics, { onConflict: 'date,platform,data_type' })
        .select();

    if (error) {
        console.error('[upsertDailyMetricsBatch] Supabase error:', {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint,
        });
        return false;
    }

    console.log(`[upsertDailyMetricsBatch] Successfully upserted ${data?.length || 0} records`);
    return true;
}

// ============================================
// Monthly Summary
// ============================================

export async function getMonthlySummary(
    startMonth?: string,
    endMonth?: string,
    platform?: string
): Promise<MonthlySummary[]> {
    let query = supabase
        .from('monthly_summary')
        .select('*')
        .order('month', { ascending: false });

    if (startMonth) {
        query = query.gte('month', startMonth);
    }
    if (endMonth) {
        query = query.lte('month', endMonth);
    }
    if (platform) {
        query = query.eq('platform', platform);
    }

    const { data, error } = await query;

    if (error) {
        console.error('[getMonthlySummary] Error:', error);
        return [];
    }
    return data || [];
}

// ============================================
// Aggregation Queries
// ============================================

export async function getMetricsSummary(startDate?: string, endDate?: string): Promise<{
    totalSpend: number;
    totalImpressions: number;
    totalClicks: number;
    totalSales: number;           // Combined: ads GMV + sales GMV
    totalAdsSales: number;        // From ads only (ad-attributed GMV)
    totalProductSales: number;    // From sales sheets only (actual product GMV)
    avgCpi: number;
    avgCtr: number;
    avgRoas: number;
}> {
    const metrics = await getDailyMetrics(startDate, endDate);

    // Separate ads and sales data
    const adsMetrics = metrics.filter(m => m.data_type === 'ads');
    const salesMetrics = metrics.filter(m => m.data_type === 'sales');

    // Ads totals (spend, impressions, clicks, ad-attributed sales)
    const adsTotals = adsMetrics.reduce((acc, m) => ({
        spend: acc.spend + (Number(m.total_spend) || 0),
        impressions: acc.impressions + (Number(m.total_impressions) || 0),
        clicks: acc.clicks + (Number(m.total_clicks) || 0),
        sales: acc.sales + (Number(m.total_sales) || 0),
    }), { spend: 0, impressions: 0, clicks: 0, sales: 0 });

    // Sales totals (actual product sales/GMV)
    const salesTotals = salesMetrics.reduce((acc, m) => ({
        sales: acc.sales + (Number(m.total_sales) || 0),
        orders: acc.orders + (Number(m.total_orders) || 0),
    }), { sales: 0, orders: 0 });

    // Combined sales = ads GMV + product sales GMV
    const combinedSales = adsTotals.sales + salesTotals.sales;

    return {
        totalSpend: adsTotals.spend,                    // From ads only
        totalImpressions: adsTotals.impressions,        // From ads only
        totalClicks: adsTotals.clicks,                  // From ads only
        totalSales: combinedSales,                      // Combined
        totalAdsSales: adsTotals.sales,                 // Ads GMV only
        totalProductSales: salesTotals.sales,           // Product sales only
        avgCpi: adsTotals.impressions > 0 ? adsTotals.spend / adsTotals.impressions : 0,
        avgCtr: adsTotals.impressions > 0 ? (adsTotals.clicks / adsTotals.impressions) * 100 : 0,
        avgRoas: adsTotals.spend > 0 ? combinedSales / adsTotals.spend : 0,
    };
}

export async function getMetricsByPlatform(startDate?: string, endDate?: string): Promise<{
    platform: string;
    totalSpend: number;
    totalSales: number;
    totalImpressions: number;
    roas: number;
}[]> {
    const metrics = await getDailyMetrics(startDate, endDate);

    const byPlatform: Record<string, { spend: number; sales: number; impressions: number }> = {};

    for (const m of metrics) {
        if (!byPlatform[m.platform]) {
            byPlatform[m.platform] = { spend: 0, sales: 0, impressions: 0 };
        }
        byPlatform[m.platform].spend += Number(m.total_spend) || 0;
        byPlatform[m.platform].sales += Number(m.total_sales) || 0;
        byPlatform[m.platform].impressions += Number(m.total_impressions) || 0;
    }

    return Object.entries(byPlatform).map(([platform, data]) => ({
        platform,
        totalSpend: data.spend,
        totalSales: data.sales,
        totalImpressions: data.impressions,
        roas: data.spend > 0 ? data.sales / data.spend : 0,
    }));
}

export async function getDailyTrend(startDate?: string, endDate?: string): Promise<{
    date: string;
    spend: number;
    sales: number;
    impressions: number;
    clicks: number;
}[]> {
    const metrics = await getDailyMetrics(startDate, endDate);

    const byDate: Record<string, { spend: number; sales: number; impressions: number; clicks: number }> = {};

    for (const m of metrics) {
        if (!byDate[m.date]) {
            byDate[m.date] = { spend: 0, sales: 0, impressions: 0, clicks: 0 };
        }
        byDate[m.date].spend += Number(m.total_spend) || 0;
        byDate[m.date].sales += Number(m.total_sales) || 0;
        byDate[m.date].impressions += Number(m.total_impressions) || 0;
        byDate[m.date].clicks += Number(m.total_clicks) || 0;
    }

    return Object.entries(byDate)
        .map(([date, data]) => ({ date, ...data }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}
