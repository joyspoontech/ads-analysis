/**
 * Sync Service - Orchestrates data synchronization from Google Sheets to Supabase
 */

import { fetchSheetAsCsv } from './googleSheets';
import {
    DataSource,
    getActiveDataSources,
    updateDataSource,
    upsertDailyMetricsBatch,
    getColumnMappings,
} from './supabase';
import {
    buildColumnMapper,
    normalizeRow,
    NormalizedRow
} from './columnMapper';

export interface SyncResult {
    success: boolean;
    sourceId: string;
    sourceName: string;
    rowsFetched: number;
    daysAggregated: number;
    error?: string;
}

export interface AggregatedDay {
    date: string;
    platform: string;
    data_type: 'ads' | 'sales';
    total_spend: number;
    total_impressions: number;
    total_clicks: number;
    total_sales: number;
    total_orders: number;
}

/**
 * Aggregate normalized rows by date
 */
function aggregateByDate(
    rows: NormalizedRow[],
    platform: string,
    dataType: 'ads' | 'sales'
): AggregatedDay[] {
    const byDate: Record<string, AggregatedDay> = {};
    const countByDate: Record<string, number> = {};

    for (const row of rows) {
        const date = row.date;
        if (!date) continue;

        if (!byDate[date]) {
            byDate[date] = {
                date,
                platform,
                data_type: dataType,
                total_spend: 0,
                total_impressions: 0,
                total_clicks: 0,
                total_sales: 0,
                total_orders: 0,
            };
            countByDate[date] = 0;
        }

        countByDate[date]++;
        byDate[date].total_spend += row.spend || 0;
        byDate[date].total_impressions += row.impressions || 0;
        byDate[date].total_clicks += row.clicks || 0;
        byDate[date].total_sales += row.sales || 0;
        byDate[date].total_orders += row.orders || 0;
    }

    // Debug: Log row counts per date
    console.log('[aggregateByDate] Row counts per date:',
        Object.entries(countByDate)
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([date, count]) => `${date}: ${count} rows`)
    );

    return Object.values(byDate);
}

/**
 * Sync a single data source
 */
export async function syncDataSource(source: DataSource): Promise<SyncResult> {
    const result: SyncResult = {
        success: false,
        sourceId: source.id,
        sourceName: source.name,
        rowsFetched: 0,
        daysAggregated: 0,
    };

    try {
        console.log(`[syncDataSource] Starting sync for "${source.name}" (${source.platform}/${source.data_type})...`);

        // 1. Fetch raw data from Google Sheet
        const rawRows = await fetchSheetAsCsv(source.sheet_id, source.tab_name || undefined, source.tab_gid || undefined);
        result.rowsFetched = rawRows.length;
        console.log(`[syncDataSource] Fetched ${rawRows.length} rows from sheet`);

        if (rawRows.length === 0) {
            result.error = 'No data found in sheet';
            return result;
        }

        // Debug: Log sample raw row
        if (rawRows.length > 0) {
            console.log('[syncDataSource] Sample raw row columns:', Object.keys(rawRows[0]));
            console.log('[syncDataSource] Sample raw row values:', JSON.stringify(rawRows[0]).slice(0, 500));
        }

        // 2. Build column mapper for this platform
        const mappings = await buildColumnMapper(source.platform, source.data_type);
        console.log('[syncDataSource] Active mappings:', Object.keys(mappings).length);

        // 3. Normalize each row
        const normalizedRows: NormalizedRow[] = rawRows.map(row => normalizeRow(row, mappings));
        console.log(`[syncDataSource] Normalized ${normalizedRows.length} rows`);

        // Debug: Log sample normalized row
        if (normalizedRows.length > 0) {
            console.log('[syncDataSource] Sample normalized row:', JSON.stringify(normalizedRows[0]));
        }

        // 4. Filter out rows without valid dates
        const validRows = normalizedRows.filter(row => row.date && row.date.match(/^\d{4}-\d{2}-\d{2}$/));
        console.log(`[syncDataSource] ${validRows.length} rows have valid dates (out of ${normalizedRows.length})`);

        // Debug: Track Nov 1 specifically
        const nov1Rows = validRows.filter(row => row.date === '2025-11-01');
        const nov1Spend = nov1Rows.reduce((sum, r) => sum + (r.spend || 0), 0);
        console.log(`[DEBUG Nov 1] Found ${nov1Rows.length} rows, total spend: ${nov1Spend.toFixed(2)}`);

        // Debug: Show sample dates that were rejected
        if (validRows.length < normalizedRows.length) {
            const invalidRows = normalizedRows.filter(row => !row.date || !row.date.match(/^\d{4}-\d{2}-\d{2}$/));
            console.log('[syncDataSource] Sample invalid dates:', invalidRows.slice(0, 5).map(r => ({ date: r.date, spend: r.spend })));
        }

        // 5. Aggregate by date
        const aggregated = aggregateByDate(validRows, source.platform, source.data_type);
        result.daysAggregated = aggregated.length;
        console.log(`[syncDataSource] Aggregated into ${aggregated.length} daily records`);

        // Debug: Log sample aggregated record
        if (aggregated.length > 0) {
            console.log('[syncDataSource] Sample aggregated record:', JSON.stringify(aggregated[0]));
        }

        // 6. Upsert to Supabase
        if (aggregated.length > 0) {
            const success = await upsertDailyMetricsBatch(aggregated);
            if (!success) {
                result.error = 'Failed to upsert to Supabase';
                return result;
            }
        } else {
            result.error = `No valid data to sync (${rawRows.length} rows fetched but 0 had valid dates)`;
            return result;
        }

        // 7. Update last synced timestamp
        await updateDataSource(source.id, { last_synced_at: new Date().toISOString() });

        result.success = true;
        console.log(`[syncDataSource] ✅ Sync complete for "${source.name}" - ${aggregated.length} days synced`);
        return result;
    } catch (error) {
        console.error(`[syncDataSource] ❌ Error syncing "${source.name}":`, error);
        result.error = error instanceof Error ? error.message : 'Unknown error';
        return result;
    }
}

/**
 * Sync all active data sources
 */
export async function syncAllSources(): Promise<SyncResult[]> {
    console.log('[syncAllSources] Starting sync for all active sources...');

    const sources = await getActiveDataSources();
    console.log(`[syncAllSources] Found ${sources.length} active sources`);

    const results: SyncResult[] = [];

    for (const source of sources) {
        const result = await syncDataSource(source);
        results.push(result);
    }

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    console.log(`[syncAllSources] Complete: ${successful} successful, ${failed} failed`);

    return results;
}

/**
 * Sync a single source by ID
 */
export async function syncSourceById(sourceId: string): Promise<SyncResult> {
    const sources = await getActiveDataSources();
    const source = sources.find(s => s.id === sourceId);

    if (!source) {
        return {
            success: false,
            sourceId,
            sourceName: 'Unknown',
            rowsFetched: 0,
            daysAggregated: 0,
            error: 'Source not found',
        };
    }

    return syncDataSource(source);
}

/**
 * Sync a single data source using Google Query API (server-side aggregation)
 * This is faster and more reliable than CSV parsing
 */
export async function syncDataSourceWithQuery(source: DataSource): Promise<SyncResult> {
    const result: SyncResult = {
        success: false,
        sourceId: source.id,
        sourceName: source.name,
        rowsFetched: 0,
        daysAggregated: 0,
    };

    try {
        console.log(`[syncDataSourceWithQuery] Starting sync for "${source.name}" (${source.platform}/${source.data_type})...`);

        // Build query API URL
        const queryUrl = `/api/sheets-query?sheetId=${source.sheet_id}&dataType=${source.data_type}&gid=${source.tab_gid || 0}`;

        // For server-side, we need the full URL
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
        const fullUrl = `${baseUrl}${queryUrl}`;

        console.log(`[syncDataSourceWithQuery] Fetching: ${queryUrl}`);

        const response = await fetch(fullUrl);
        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error || 'Failed to fetch aggregated data');
        }

        const aggregates = data.data as Array<{
            date: string;
            spend: number;
            impressions: number;
            clicks: number;
            sales: number;
            orders: number;
        }>;

        result.daysAggregated = aggregates.length;
        console.log(`[syncDataSourceWithQuery] Got ${aggregates.length} aggregated days`);

        if (aggregates.length === 0) {
            result.error = 'No data returned from query';
            return result;
        }

        // Convert to AggregatedDay format for upsert
        const dailyRecords: AggregatedDay[] = aggregates.map(agg => ({
            date: agg.date,
            platform: source.platform,
            data_type: source.data_type,
            total_spend: agg.spend || 0,
            total_impressions: agg.impressions || 0,
            total_clicks: agg.clicks || 0,
            total_sales: agg.sales || 0,
            total_orders: agg.orders || 0,
        }));

        // Log sample for debugging
        if (dailyRecords.length > 0) {
            console.log('[syncDataSourceWithQuery] Sample record:', JSON.stringify(dailyRecords[0]));
        }

        // Upsert to Supabase
        await upsertDailyMetricsBatch(dailyRecords);

        // Update last_synced timestamp
        await updateDataSource(source.id, { last_synced_at: new Date().toISOString() });

        result.success = true;
        console.log(`[syncDataSourceWithQuery] ✅ Sync complete for "${source.name}" - ${dailyRecords.length} days synced`);

        return result;

    } catch (error) {
        console.error(`[syncDataSourceWithQuery] ❌ Sync failed for "${source.name}":`, error);
        result.error = error instanceof Error ? error.message : 'Unknown error';
        return result;
    }
}

/**
 * Sync all active data sources using Google Query API
 */
export async function syncAllSourcesWithQuery(): Promise<SyncResult[]> {
    console.log('[syncAllSourcesWithQuery] Starting sync for all active sources using Query API...');

    const sources = await getActiveDataSources();
    console.log(`[syncAllSourcesWithQuery] Found ${sources.length} active sources`);

    const results: SyncResult[] = [];

    for (const source of sources) {
        const result = await syncDataSourceWithQuery(source);
        results.push(result);
    }

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    console.log(`[syncAllSourcesWithQuery] Complete: ${successful} successful, ${failed} failed`);

    return results;
}
