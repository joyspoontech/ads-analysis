# 🤖 AI CONTEXT DOCUMENT
# Joyspoon Ads Analytics Dashboard 2.0

> **Purpose**: This document provides complete context for AI assistants to understand and work on this project without requiring additional information from the user.

---

## 📋 PROJECT OVERVIEW

**Name**: Joyspoon Ads Analytics Dashboard 2.0  
**Type**: Next.js 15 Web Application  
**Purpose**: Multi-platform advertising analytics with hybrid Google Sheets + Supabase architecture  
**Location**: `/Users/princegondaliya/Learning/Joyspoon/ADS_data_analysis copy/dashboard2.0/`

### Architecture: Hybrid Sync Model
```
┌─────────────────────────────────────────────────────────────────┐
│                     DATA FLOW ARCHITECTURE                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   Google Sheets (Raw Data)                                      │
│   ├── Swiggy Ads (~30K rows)                                    │
│   ├── Swiggy Sales (~1K rows)                                   │
│   ├── Zepto Ads (~30K rows)                                     │
│   └── Zepto Sales (~1K rows)                                    │
│              │                                                  │
│              ▼                                                  │
│   ┌───────────────────────────────────────┐                     │
│   │   SYNC ENGINE (on button click)       │                     │
│   │   1. Fetch CSV from sheets            │                     │
│   │   2. Normalize columns                │                     │
│   │   3. Aggregate by date                │                     │
│   │   4. Calculate CPI, CTR, ROAS         │                     │
│   └───────────────────────────────────────┘                     │
│              │                                                  │
│              ▼                                                  │
│   ┌───────────────────────────────────────┐                     │
│   │   SUPABASE (Aggregated Data)          │                     │
│   │   - daily_metrics (~365 rows/year)    │                     │
│   │   - monthly_summary (~24 rows/year)   │                     │
│   │   - data_sources (configuration)      │                     │
│   │   - column_mappings (per platform)    │                     │
│   └───────────────────────────────────────┘                     │
│              │                                                  │
│              ▼                                                  │
│   ┌───────────────────────────────────────┐                     │
│   │   DASHBOARD (Fast queries!)           │                     │
│   │   Charts, Stats, Reports              │                     │
│   └───────────────────────────────────────┘                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Key Features
- **Google Sheets Integration**: Raw data stays in sheets (multiple editors OK)
- **Column Normalization**: Different column names per platform are mapped to standard fields
- **Daily Aggregation**: Raw rows aggregated to daily totals before storage
- **Auto-calculated Metrics**: Supabase trigger calculates CPI, CTR, ROAS, CPC
- **Fast Dashboard**: Reads from pre-aggregated Supabase tables
- **Minimal Storage**: ~1MB/year (fits in Supabase free tier forever)

---

## 🔗 SUPABASE CONFIGURATION

### Credentials
```
URL: https://fhomcjmquvhvakvfinsv.supabase.co
Anon Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZob21jam1xdXZodmFrdmZpbnN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0MDI4NzQsImV4cCI6MjA4MTk3ODg3NH0.IObl3mkoz_8-Kqit7W8Lw41uNFAJAgzPWHxqm0n7zuY
Service Role: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZob21jam1xdXZodmFrdmZpbnN2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjQwMjg3NCwiZXhwIjoyMDgxOTc4ODc0fQ.eIkJHoCgyjUOohP_xXd-8YmcQgXPLE7wD2s8FKWOwME
```

### Database Schema
Run `supabase-schema.sql` in SQL Editor to set up tables:

| Table | Purpose |
|-------|---------|
| `data_sources` | Google Sheet configurations |
| `column_mappings` | Platform-specific column name mappings |
| `daily_metrics` | Aggregated daily data (main table) |
| `monthly_summary` | Pre-aggregated monthly data for trends |

---

## 📁 PROJECT STRUCTURE

```
dashboard2.0/
├── app/                          # Next.js App Router pages
│   ├── page.tsx                  # Dashboard (main page)
│   ├── layout.tsx                # Root layout with Sidebar
│   ├── globals.css               # Global styles (dark theme)
│   ├── campaigns/page.tsx        # Campaign analysis
│   ├── data-sources/page.tsx     # ⭐ MANAGE GOOGLE SHEETS
│   ├── platforms/page.tsx        # Platform comparison
│   ├── reports/page.tsx          # Export reports
│   └── settings/page.tsx         # App settings
├── components/                   # Reusable React components
│   ├── Sidebar.tsx               # Navigation
│   ├── StatCard.tsx              # Metric cards with animation
│   ├── ChartCard.tsx             # Chart wrapper
│   ├── DateRangePicker.tsx       # Date selection
│   └── Header.tsx                # Page header
├── hooks/                        # React hooks
│   ├── useMetrics.ts             # ⭐ Fetch from Supabase
│   ├── useDataSources.ts         # Manage sources (CRUD)
│   └── useSync.ts                # Sync operations
├── lib/                          # Core utilities
│   ├── supabase.ts               # ⭐ Supabase client + queries
│   ├── googleSheets.ts           # Sheet fetching + CSV parsing
│   ├── columnMapper.ts           # ⭐ Column normalization
│   ├── syncService.ts            # ⭐ Sync orchestration
│   └── aggregation.ts            # Metric calculations
├── supabase-schema.sql           # Database schema
├── AI_CONTEXT.md                 # This file
├── package.json
└── next.config.ts
```

---

## 🔧 KEY TECHNICAL DETAILS

### DailyMetric Interface (Supabase)
```typescript
interface DailyMetric {
  id: string;
  date: string;              // YYYY-MM-DD
  platform: string;          // 'swiggy', 'zepto', etc.
  data_type: 'ads' | 'sales';
  
  // Raw aggregates
  total_spend: number;
  total_impressions: number;
  total_clicks: number;
  total_sales: number;
  total_orders: number;
  
  // Auto-calculated by trigger
  cpi: number;               // Cost Per Impression
  ctr: number;               // Click-Through Rate %
  cpc: number;               // Cost Per Click
  roas: number;              // Return on Ad Spend
  
  synced_at: string;
}
```

### DataSource Interface
```typescript
interface DataSource {
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
}
```

### Metric Calculations
```
CPI (Cost Per Impression) = Spend / Impressions
CTR% (Click-Through Rate) = (Clicks / Impressions) × 100
CPC (Cost Per Click) = Spend / Clicks
ROAS (Return on Ad Spend) = Sales / Spend
```

---

## 🔄 SYNC FLOW

```
1. USER clicks "Sync Now" button
   ↓
2. For each active data_source:
   a. Fetch raw CSV from Google Sheet
   b. Get column mappings for this platform
   c. Normalize each row to standard format
   d. Filter rows with valid dates
   e. Aggregate by date (sum spend, impressions, etc.)
   ↓
3. UPSERT aggregated data to daily_metrics
   (Supabase trigger auto-calculates CPI, CTR, ROAS, CPC)
   ↓
4. UPDATE last_synced_at on data_source
   ↓
5. DASHBOARD refreshes with new data
```

---

## 📊 COLUMN MAPPING

Different platforms use different column names. The columnMapper.ts handles this:

### Default Mappings
```typescript
{
  // Spend
  'spends' → 'spend',
  'budget_burnt' → 'spend',
  'cost' → 'spend',
  
  // Impressions
  'impressions' → 'impressions',
  'views' → 'impressions',
  
  // Sales
  'gmv' → 'sales',
  'total_direct_gmv_14_days' → 'sales',
  'revenue' → 'sales',
  
  // Date
  'date' → 'date',
  'metrics_date' → 'date',
}
```

### Custom Mappings (Supabase)
Stored in `column_mappings` table for per-platform overrides.

---

## 🚀 HOW TO RUN

### First Time Setup
```bash
# 1. Navigate to project
cd /Users/princegondaliya/Learning/Joyspoon/ADS_data_analysis\ copy/dashboard2.0

# 2. Install dependencies
npm install

# 3. Set up Supabase (run in SQL Editor)
# Copy contents of supabase-schema.sql and execute

# 4. Start dev server
npm run dev
```

Server runs on: http://localhost:3000

### Dependencies
- Next.js 15
- React 19
- Supabase JS
- Recharts (charts)
- Lucide React (icons)
- date-fns
- xlsx (Excel export)
- jspdf + html2canvas (PDF export)

---

## 📊 SUPPORTED PLATFORMS

| Platform | Color | Notes |
|----------|-------|-------|
| Swiggy | #FC8019 | GMV from `total_direct_gmv_14_days` or `total_direct_gmv_7_days` |
| Zepto | #8B5CF6 | Uses `budget_burnt` for spend, `views` for impressions |
| Blinkit | #F8E831 | Standard column names |
| Instamart | #41B883 | Standard column names |
| Amazon | #FF9900 | Standard column names |
| Flipkart | #2874F0 | Standard column names |

---

## 🐛 DEBUGGING

### Console Logs to Watch
```
[syncDataSource] Starting sync for "..."
[syncDataSource] Fetched X rows from sheet
[syncDataSource] Normalized X rows
[syncDataSource] X rows have valid dates
[syncDataSource] Aggregated into X daily records
[syncDataSource] Sync complete
```

### Common Issues
| Issue | Solution |
|-------|----------|
| Sheet not accessible | Make sure it's "Published to web" or shared with "Anyone with link" |
| No data after sync | Check if dates in sheet are valid (YYYY-MM-DD format) |
| Wrong metrics | Check column_mappings in Supabase for this platform |
| Supabase error | Check RLS policies are set up (run schema SQL) |

---

## 💡 COMMON TASKS

### Add a New Platform
1. Add to `PLATFORMS` array in `app/data-sources/page.tsx`
2. Add column mappings to `column_mappings` table in Supabase
3. Update `DEFAULT_MAPPINGS` in `lib/columnMapper.ts` if needed

### Add New Column Mapping
```sql
INSERT INTO column_mappings (platform, data_type, source_column, target_column)
VALUES ('swiggy', 'ads', 'your_column_name', 'target_field');
```

### View Raw Data (before aggregation)
Use the Google Sheet directly - raw data is not stored in Supabase.

---

## 🔗 QUICK LINKS

- **Project Root**: `/Users/princegondaliya/Learning/Joyspoon/ADS_data_analysis copy/dashboard2.0/`
- **Supabase Dashboard**: https://supabase.com/dashboard/project/fhomcjmquvhvakvfinsv
- **Previous Version**: `/Users/princegondaliya/Learning/Joyspoon/ADS_data_analysis copy/dashboard/`

---

*Last Updated: December 24, 2025*
