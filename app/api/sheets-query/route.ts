import { NextRequest, NextResponse } from 'next/server';

/**
 * Google Sheets Query API - Server-side aggregation
 * Uses Google Visualization Query Language to get pre-aggregated data
 * DYNAMIC: First detects column names, then builds query using column letters
 */

interface QueryResult {
    success: boolean;
    data?: DailyAggregate[];
    error?: string;
    rowCount?: number;
}

interface DailyAggregate {
    date: string;
    spend: number;
    impressions: number;
    clicks: number;
    sales: number;
    orders: number;
}

// Column name variations to look for (Swiggy + Zepto)
const DATE_COLUMNS = [
    // Swiggy
    'METRICS_DATE', 'ORDERED_DATE',
    // Zepto
    'Date', 'Sales Date',
    // Generic
    'date', 'Order Date', 'Report Date', 'Day'
];
const SPEND_COLUMNS = [
    // Swiggy
    'TOTAL_BUDGET_BURNT',
    // Zepto - Note: 'Daily_budget' is the budget CAP, not actual spend
    'Spend',
    // Generic
    'Spends', 'Cost', 'Budget Burnt', 'SPENDS'
];
const IMPRESSIONS_COLUMNS = [
    // Swiggy
    'TOTAL_IMPRESSIONS',
    // Zepto
    'Impressions',
    // Generic
    'IMPRESSIONS', 'Views'
];
const CLICKS_COLUMNS = [
    // Swiggy
    'TOTAL_CLICKS',
    // Zepto
    'Clicks',
    // Generic
    'CLICKS'
];
const SALES_COLUMNS = [
    // Swiggy
    'TOTAL_GMV',
    // Zepto
    'GMV', 'Revenue',
    // Generic
    'Sales', 'Total GMV', 'Total Sales'
];
const ORDERS_COLUMNS = [
    // Swiggy
    'TOTAL_CONVERSIONS', 'UNITS_SOLD',
    // Zepto
    'Orders', 'Quantity',
    // Generic
    'Conversions', 'Units Sold'
];

function indexToColumnLetter(index: number): string {
    let result = '';
    let temp = index;

    while (temp >= 0) {
        result = String.fromCharCode((temp % 26) + 65) + result;
        temp = Math.floor(temp / 26) - 1;
    }

    return result;
}

function findColumnLetter(headers: string[], possibleNames: string[]): string | null {
    for (let i = 0; i < headers.length; i++) {
        const header = headers[i]?.trim().toUpperCase();
        if (possibleNames.some(name => header === name.toUpperCase())) {
            return indexToColumnLetter(i);
        }
    }
    return null;
}

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const sheetId = searchParams.get('sheetId');
    const dataType = searchParams.get('dataType') || 'ads';
    const gid = searchParams.get('gid') || '0';

    if (!sheetId) {
        return NextResponse.json({ error: 'Missing sheetId parameter' }, { status: 400 });
    }

    try {
        // Step 1: First fetch headers to detect column names
        console.log(`[sheets-query] Detecting columns for sheet ${sheetId}`);

        const headersUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tq=SELECT%20*%20LIMIT%200&gid=${gid}&headers=1`;
        const headersResponse = await fetch(headersUrl);
        const headersText = await headersResponse.text();

        const headersMatch = headersText.match(/google\.visualization\.Query\.setResponse\(([\s\S]*)\);?$/);
        if (!headersMatch) {
            throw new Error('Could not fetch column headers');
        }

        const headersData = JSON.parse(headersMatch[1]);

        if (headersData.status === 'error') {
            throw new Error(headersData.errors?.[0]?.message || 'Failed to get headers');
        }

        const cols = headersData.table?.cols || [];
        const headers = cols.map((c: { label?: string }) => c.label || '');
        console.log(`[sheets-query] Found headers: ${headers.slice(0, 10).join(', ')}...`);

        // Step 2: Find column letters for each metric
        const dateCol = findColumnLetter(headers, DATE_COLUMNS);
        const spendCol = findColumnLetter(headers, SPEND_COLUMNS);
        const impressionsCol = findColumnLetter(headers, IMPRESSIONS_COLUMNS);
        const clicksCol = findColumnLetter(headers, CLICKS_COLUMNS);
        const salesCol = findColumnLetter(headers, SALES_COLUMNS);
        const ordersCol = findColumnLetter(headers, ORDERS_COLUMNS);

        console.log(`[sheets-query] Detected columns: date=${dateCol}, spend=${spendCol}, impressions=${impressionsCol}, clicks=${clicksCol}, sales=${salesCol}, orders=${ordersCol}`);

        if (!dateCol) {
            throw new Error(`Could not find date column. Available headers: ${headers.slice(0, 15).join(', ')}`);
        }

        // Step 3: Build query using column letters
        let query: string;
        const selectParts = [dateCol];
        const sumParts: string[] = [];

        if (dataType === 'ads') {
            if (spendCol) { selectParts.push(`SUM(${spendCol})`); sumParts.push('spend'); }
            if (impressionsCol) { selectParts.push(`SUM(${impressionsCol})`); sumParts.push('impressions'); }
            if (clicksCol) { selectParts.push(`SUM(${clicksCol})`); sumParts.push('clicks'); }
            if (salesCol) { selectParts.push(`SUM(${salesCol})`); sumParts.push('sales'); }
            if (ordersCol) { selectParts.push(`SUM(${ordersCol})`); sumParts.push('orders'); }
        } else {
            // Sales data - typically just GMV and units
            if (salesCol) { selectParts.push(`SUM(${salesCol})`); sumParts.push('sales'); }
            if (ordersCol) { selectParts.push(`SUM(${ordersCol})`); sumParts.push('orders'); }
        }

        query = `SELECT ${selectParts.join(', ')} WHERE ${dateCol} IS NOT NULL GROUP BY ${dateCol} ORDER BY ${dateCol}`;
        console.log(`[sheets-query] Query: ${query}`);

        // Step 4: Execute the aggregation query
        const encodedQuery = encodeURIComponent(query);
        const queryUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tq=${encodedQuery}&gid=${gid}&headers=1`;

        const response = await fetch(queryUrl);
        const text = await response.text();

        const jsonMatch = text.match(/google\.visualization\.Query\.setResponse\(([\s\S]*)\);?$/);
        if (!jsonMatch) {
            console.error('[sheets-query] Invalid response:', text.substring(0, 300));
            throw new Error('Invalid response format from Google Sheets');
        }

        const jsonData = JSON.parse(jsonMatch[1]);

        if (jsonData.status === 'error') {
            const errors = jsonData.errors || [];
            const errorDetails = errors.map((e: { detailed_message?: string; message?: string }) =>
                e.detailed_message || e.message
            ).join('; ');
            throw new Error(errorDetails || 'Query error');
        }

        // Step 5: Parse results
        const rows = jsonData.table?.rows || [];
        console.log(`[sheets-query] Got ${rows.length} aggregated rows`);

        const aggregates: DailyAggregate[] = [];

        // Log first 5 rows for debugging date parsing
        console.log('[sheets-query] First 5 raw date values:');
        for (let debug = 0; debug < Math.min(5, rows.length); debug++) {
            const debugCells = rows[debug]?.c || [];
            const rawV = debugCells[0]?.v;
            const rawF = debugCells[0]?.f;
            const parsed = formatDateString(rawV, rawF);
            console.log(`  Row ${debug}: v="${rawV}" f="${rawF}" -> parsed="${parsed}"`);
        }

        for (const row of rows) {
            const cells = row.c || [];
            if (!cells[0] || cells[0].v == null) continue;

            let dateStr = formatDateString(cells[0].v, cells[0].f);
            if (!dateStr) continue;

            const aggregate: DailyAggregate = {
                date: dateStr,
                spend: 0,
                impressions: 0,
                clicks: 0,
                sales: 0,
                orders: 0,
            };

            // Map values based on what columns we found
            let colIndex = 1;
            for (const metric of sumParts) {
                const value = parseNumber(cells[colIndex]);
                if (metric === 'spend') aggregate.spend = value;
                else if (metric === 'impressions') aggregate.impressions = value;
                else if (metric === 'clicks') aggregate.clicks = value;
                else if (metric === 'sales') aggregate.sales = value;
                else if (metric === 'orders') aggregate.orders = value;
                colIndex++;
            }

            aggregates.push(aggregate);
        }

        console.log(`[sheets-query] Parsed ${aggregates.length} valid aggregates`);
        if (aggregates.length > 0) {
            console.log('[sheets-query] Sample:', JSON.stringify(aggregates[0]));
        }

        return NextResponse.json({
            success: true,
            data: aggregates,
            rowCount: aggregates.length,
        } as QueryResult);

    } catch (error) {
        console.error('[sheets-query] Error:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        } as QueryResult, { status: 500 });
    }
}

function parseNumber(cell: { v?: number | string } | null): number {
    if (!cell || cell.v == null) return 0;
    const value = cell.v;
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
        const clean = value.replace(/[₹$,]/g, '');
        return parseFloat(clean) || 0;
    }
    return 0;
}

function formatDateString(value: string | number | Date, formatted?: string): string {
    if (!value) return '';

    // If there's a formatted value, try that first
    if (formatted && typeof formatted === 'string') {
        const parsed = tryParseDateString(formatted);
        if (parsed) return parsed;
    }

    // Handle Date object from Google
    if (typeof value === 'string') {
        // Handle Date(YYYY,M,D) format
        const dateMatch = value.match(/Date\((\d+),(\d+),(\d+)\)/);
        if (dateMatch) {
            const year = dateMatch[1];
            const month = String(parseInt(dateMatch[2]) + 1).padStart(2, '0');
            const day = String(dateMatch[3]).padStart(2, '0');
            return `${year}-${month}-${day}`;
        }

        return tryParseDateString(value) || '';
    }

    return '';
}

function tryParseDateString(dateStr: string): string | null {
    if (!dateStr) return null;

    // Already YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        return dateStr;
    }

    // MM/DD/YYYY or DD/MM/YYYY
    const slashMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (slashMatch) {
        const first = parseInt(slashMatch[1]);
        const second = parseInt(slashMatch[2]);
        const year = slashMatch[3];

        if (first > 12) {
            return `${year}-${String(second).padStart(2, '0')}-${String(first).padStart(2, '0')}`;
        } else if (second > 12) {
            return `${year}-${String(first).padStart(2, '0')}-${String(second).padStart(2, '0')}`;
        } else {
            // Assume MM/DD
            return `${year}-${String(first).padStart(2, '0')}-${String(second).padStart(2, '0')}`;
        }
    }

    // Try JavaScript parser
    try {
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
            return date.toISOString().split('T')[0];
        }
    } catch {
        // Ignore
    }

    return null;
}
