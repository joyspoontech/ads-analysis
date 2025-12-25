/**
 * Column Mapper - Platform-specific column normalization
 * Handles different column names across Swiggy, Zepto, Blinkit, etc.
 */

import { getColumnMappings, ColumnMapping } from './supabase';

// Standard normalized column names
export const STANDARD_COLUMNS = {
    date: 'date',
    spend: 'spend',
    impressions: 'impressions',
    clicks: 'clicks',
    sales: 'sales',
    orders: 'orders',
    campaign: 'campaign_name',
    city: 'city',
    brand: 'brand',
} as const;

// Default column mappings (fallback when no custom mappings exist)
// Includes mappings for: Swiggy Ads, Swiggy Sales, Zepto Ads, Zepto Sales
export const DEFAULT_MAPPINGS: Record<string, string> = {
    // ============================================
    // DATE COLUMNS
    // ============================================
    'date': 'date',
    'metrics_date': 'date',
    'metrics date': 'date',
    'ordered_date': 'date',
    'report_date': 'date',
    'sales date': 'date',           // Zepto Sales
    'month': 'date',

    // ============================================
    // SPEND COLUMNS
    // ============================================
    'spend': 'spend',
    'spends': 'spend',
    'total_budget_burnt': 'spend',  // Swiggy Ads
    'budget_burnt': 'spend',
    'total_budget': 'spend',
    'daily_budget': 'spend',        // Zepto Ads
    'cost': 'spend',
    'amount_spent': 'spend',

    // ============================================
    // IMPRESSIONS COLUMNS
    // ============================================
    'impressions': 'impressions',   // Zepto Ads
    'total_impressions': 'impressions', // Swiggy Ads
    'views': 'impressions',

    // ============================================
    // CLICKS COLUMNS
    // ============================================
    'clicks': 'clicks',             // Zepto Ads
    'total_clicks': 'clicks',       // Swiggy Ads
    'click': 'clicks',

    // ============================================
    // SALES/GMV COLUMNS (only one primary per platform)
    // ============================================
    'gmv': 'sales',                 // Swiggy Sales, Zepto Sales - PRIMARY
    'total_gmv': 'sales',           // Swiggy Ads - PRIMARY 
    'revenue': 'sales',             // Zepto Ads - PRIMARY
    'sales': 'sales',
    'total_sales': 'sales',
    'order_value': 'sales',
    // Note: total_direct_gmv_14_days and total_direct_gmv_7_days are NOT mapped
    // to avoid double-counting with total_gmv

    // ============================================
    // ORDERS/QUANTITY COLUMNS
    // ============================================
    'orders': 'orders',             // Zepto Ads
    'total_orders': 'orders',
    'total_conversions': 'orders',  // Swiggy Ads
    'conversions': 'orders',
    'units_sold': 'orders',         // Swiggy Sales
    'quantity': 'orders',           // Zepto Sales

    // ============================================
    // CAMPAIGN/PRODUCT NAME COLUMNS
    // ============================================
    'campaign_name': 'campaign_name',
    'campaignname': 'campaign_name', // Zepto Ads
    'campaign': 'campaign_name',
    'product_name': 'campaign_name', // Swiggy Ads/Sales
    'sku name': 'campaign_name',     // Zepto Sales
    'sku_name': 'campaign_name',
    'ad_name': 'campaign_name',
    'menu_name': 'campaign_name',
    'item_name': 'campaign_name',
    'item': 'campaign_name',
    'name': 'campaign_name',

    // ============================================
    // CITY/LOCATION COLUMNS
    // ============================================
    'city': 'city',                 // All platforms
    'location': 'city',
    'area_name': 'city',            // Swiggy Sales
    'region': 'city',

    // ============================================
    // BRAND COLUMNS
    // ============================================
    'brand': 'brand',               // Swiggy Sales
    'brand_name': 'brand',          // Swiggy Ads, Zepto Sales
    'brandname': 'brand',           // Zepto Ads
};

export interface NormalizedRow {
    date: string;
    spend: number;
    impressions: number;
    clicks: number;
    sales: number;
    orders: number;
    campaign_name: string;
    city?: string;
    brand?: string;
    [key: string]: string | number | undefined;
}

/**
 * Build column mapping lookup - merges default mappings with custom DB mappings
 */
export async function buildColumnMapper(platform: string, dataType: 'ads' | 'sales'): Promise<Record<string, string>> {
    // Start with default mappings
    const mappings = { ...DEFAULT_MAPPINGS };

    // Override with custom mappings from database
    try {
        const customMappings = await getColumnMappings(platform);
        for (const cm of customMappings) {
            if (cm.data_type === dataType) {
                mappings[cm.source_column.toLowerCase()] = cm.target_column;
            }
        }
    } catch (error) {
        console.error('[buildColumnMapper] Failed to fetch custom mappings:', error);
    }

    return mappings;
}

/**
 * Normalize a column name using the mapping
 */
export function normalizeColumnName(name: string, mappings: Record<string, string>): string {
    const lower = name.toLowerCase().trim();
    return mappings[lower] || lower.replace(/\s+/g, '_');
}

/**
 * Format date to YYYY-MM-DD
 * Handles multiple formats from Swiggy/Zepto sheets
 */
export function formatDate(dateStr: string): string {
    if (!dateStr || dateStr === 'null' || dateStr === 'undefined') return '';

    const trimmed = String(dateStr).trim();
    if (!trimmed) return '';

    // Already in correct format
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
        return trimmed;
    }

    // Handle: 2024-12-24T00:00:00.000Z (ISO format)
    if (trimmed.includes('T')) {
        return trimmed.split('T')[0];
    }

    // Handle: Dec 24, 2024 or December 24, 2024
    const monthNameFull = trimmed.match(/^([A-Za-z]+)\s+(\d{1,2}),?\s*(\d{4})$/);
    if (monthNameFull) {
        const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
        const monthIndex = monthNames.findIndex(m => monthNameFull[1].toLowerCase().startsWith(m));
        if (monthIndex !== -1) {
            return `${monthNameFull[3]}-${String(monthIndex + 1).padStart(2, '0')}-${monthNameFull[2].padStart(2, '0')}`;
        }
    }

    // Handle: 24 Dec 2024 or 24-Dec-2024
    const dayFirst = trimmed.match(/^(\d{1,2})[\s\-]([A-Za-z]+)[\s\-](\d{4})$/);
    if (dayFirst) {
        const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
        const monthIndex = monthNames.findIndex(m => dayFirst[2].toLowerCase().startsWith(m));
        if (monthIndex !== -1) {
            return `${dayFirst[3]}-${String(monthIndex + 1).padStart(2, '0')}-${dayFirst[1].padStart(2, '0')}`;
        }
    }

    // Handle: Nov-25 (month-year, use 1st of month)
    const monthYear = trimmed.match(/^([A-Za-z]{3})-(\d{2})$/);
    if (monthYear) {
        const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
        const monthIndex = monthNames.indexOf(monthYear[1].toLowerCase());
        if (monthIndex !== -1) {
            const year = parseInt(monthYear[2]) + 2000;
            return `${year}-${String(monthIndex + 1).padStart(2, '0')}-01`;
        }
    }

    // Handle: XX/XX/YYYY format - need to detect if DD/MM or MM/DD
    const slashDate = trimmed.match(/^(\d{1,2})[\\\/]+(\d{1,2})[\\\/]+(\d{4})$/);
    if (slashDate) {
        const first = parseInt(slashDate[1]);
        const second = parseInt(slashDate[2]);
        const year = slashDate[3];

        let result: string;
        let format: string;

        // If first number > 12, it MUST be a day (DD/MM/YYYY)
        if (first > 12) {
            result = `${year}-${String(second).padStart(2, '0')}-${String(first).padStart(2, '0')}`;
            format = 'DD/MM';
        }
        // If second number > 12, it MUST be a day (MM/DD/YYYY - US format)
        else if (second > 12) {
            result = `${year}-${String(first).padStart(2, '0')}-${String(second).padStart(2, '0')}`;
            format = 'MM/DD';
        }
        // Both <= 12, ambiguous - default to MM/DD/YYYY (US format used by Swiggy)
        else {
            result = `${year}-${String(first).padStart(2, '0')}-${String(second).padStart(2, '0')}`;
            format = 'MM/DD (ambiguous)';
        }

        // Debug log for troubleshooting ambiguous dates
        if (first <= 12 && second <= 12) {
            console.log(`[formatDate] Ambiguous: "${trimmed}" -> ${result} (assumed ${format})`);
        }

        return result;
    }

    // Handle: XX-XX-YYYY or XX.XX.YYYY format (hyphen/dot usually Indian format DD-MM-YYYY)
    const hyphenDate = trimmed.match(/^(\d{1,2})[\-\.](\d{1,2})[\-\.](\d{4})$/);
    if (hyphenDate) {
        const first = parseInt(hyphenDate[1]);
        const second = parseInt(hyphenDate[2]);
        const year = hyphenDate[3];

        // If first number > 12, it MUST be a day (DD-MM-YYYY)
        if (first > 12) {
            return `${year}-${String(second).padStart(2, '0')}-${String(first).padStart(2, '0')}`;
        }
        // If second number > 12, it MUST be a day (MM-DD-YYYY)
        if (second > 12) {
            return `${year}-${String(first).padStart(2, '0')}-${String(second).padStart(2, '0')}`;
        }
        // Both <= 12, default to DD-MM-YYYY
        return `${year}-${String(second).padStart(2, '0')}-${String(first).padStart(2, '0')}`;
    }

    // Handle: YYYY/MM/DD, YYYY-MM-DD (already good formats)
    const yyyymmdd = trimmed.match(/^(\d{4})[\\/\\-\\.](\d{1,2})[\\/\\-\\.](\d{1,2})$/);
    if (yyyymmdd) {
        return `${yyyymmdd[1]}-${yyyymmdd[2].padStart(2, '0')}-${yyyymmdd[3].padStart(2, '0')}`;
    }

    // Try JavaScript Date parser as last resort
    try {
        const date = new Date(trimmed);
        if (!isNaN(date.getTime())) {
            return date.toISOString().split('T')[0];
        }
    } catch (e) {
        // Ignore parse errors
    }

    console.warn(`[formatDate] Could not parse date: "${trimmed}"`);
    return '';
}

/**
 * Parse numeric value from string (handles currency symbols, commas)
 */
export function parseNumeric(value: string | number | undefined): number {
    if (value === undefined || value === null || value === '') return 0;
    if (typeof value === 'number') return value;

    const cleaned = String(value).replace(/[₹$,\s]/g, '').trim();
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
}

/**
 * Normalize a raw row to standard format
 */
export function normalizeRow(
    row: Record<string, any>,
    mappings: Record<string, string>
): NormalizedRow {
    const normalized: NormalizedRow = {
        date: '',
        spend: 0,
        impressions: 0,
        clicks: 0,
        sales: 0,
        orders: 0,
        campaign_name: '',
    };

    for (const [key, value] of Object.entries(row)) {
        const targetColumn = normalizeColumnName(key, mappings);

        switch (targetColumn) {
            case 'date':
                normalized.date = formatDate(String(value || ''));
                break;
            case 'spend':
                normalized.spend = parseNumeric(value);
                break;
            case 'impressions':
                normalized.impressions = parseNumeric(value);
                break;
            case 'clicks':
                normalized.clicks = parseNumeric(value);
                break;
            case 'sales':
                // Only set sales if not already set (first non-zero wins)
                const salesVal = parseNumeric(value);
                if (salesVal > 0 && normalized.sales === 0) {
                    normalized.sales = salesVal;
                }
                break;
            case 'orders':
                normalized.orders = parseNumeric(value);
                break;
            case 'campaign_name':
                normalized.campaign_name = String(value || '');
                break;
            case 'city':
                normalized.city = String(value || '');
                break;
            case 'brand':
                normalized.brand = String(value || '');
                break;
            default:
                // Keep other columns as-is
                normalized[targetColumn] = value;
        }
    }

    return normalized;
}

/**
 * Detect if headers indicate ads or sales data
 */
export function detectDataType(headers: string[]): 'ads' | 'sales' {
    const lowerHeaders = headers.map(h => h.toLowerCase());

    const adsIndicators = ['impressions', 'clicks', 'ctr', 'cpi', 'roi', 'roas', 'budget', 'spend', 'spends', 'ad_name', 'campaign', 'budget_burnt'];
    const salesIndicators = ['order_id', 'order', 'quantity', 'units_sold', 'sku', 'product_name', 'mrp', 'discount', 'net_amount'];

    const adsScore = adsIndicators.filter(ind => lowerHeaders.some(h => h.includes(ind))).length;
    const salesScore = salesIndicators.filter(ind => lowerHeaders.some(h => h.includes(ind))).length;

    return adsScore >= salesScore ? 'ads' : 'sales';
}

/**
 * Suggest column mappings based on headers
 */
export function suggestMappings(headers: string[]): { source: string; target: string; confidence: 'high' | 'medium' | 'low' }[] {
    const suggestions: { source: string; target: string; confidence: 'high' | 'medium' | 'low' }[] = [];

    for (const header of headers) {
        const lower = header.toLowerCase().trim();
        const mapped = DEFAULT_MAPPINGS[lower];

        if (mapped) {
            suggestions.push({
                source: header,
                target: mapped,
                confidence: 'high',
            });
        } else {
            // Try partial matching
            for (const [pattern, target] of Object.entries(DEFAULT_MAPPINGS)) {
                if (lower.includes(pattern) || pattern.includes(lower)) {
                    suggestions.push({
                        source: header,
                        target,
                        confidence: 'medium',
                    });
                    break;
                }
            }
        }
    }

    return suggestions;
}
