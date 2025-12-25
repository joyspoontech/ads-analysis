-- ===========================================
-- Dashboard 2.0 - Supabase Schema
-- Run this in the Supabase SQL Editor
-- ===========================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===========================================
-- Table: data_sources
-- Stores connected Google Sheet configurations
-- ===========================================
CREATE TABLE IF NOT EXISTS data_sources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  sheet_id TEXT NOT NULL,
  sheet_url TEXT NOT NULL,
  platform TEXT NOT NULL,
  data_type TEXT NOT NULL CHECK (data_type IN ('ads', 'sales')),
  tab_name TEXT,
  tab_gid TEXT,
  is_active BOOLEAN DEFAULT true,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_data_sources_active ON data_sources(is_active);
CREATE INDEX IF NOT EXISTS idx_data_sources_platform ON data_sources(platform);

-- ===========================================
-- Table: column_mappings
-- Platform-specific column name mappings
-- ===========================================
CREATE TABLE IF NOT EXISTS column_mappings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  platform TEXT NOT NULL,
  data_type TEXT NOT NULL CHECK (data_type IN ('ads', 'sales')),
  source_column TEXT NOT NULL,
  target_column TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(platform, data_type, source_column)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_column_mappings_platform ON column_mappings(platform, data_type);

-- ===========================================
-- Table: daily_metrics
-- Aggregated daily data per platform
-- ===========================================
CREATE TABLE IF NOT EXISTS daily_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL,
  platform TEXT NOT NULL,
  data_type TEXT NOT NULL CHECK (data_type IN ('ads', 'sales')),
  
  -- Raw aggregates
  total_spend DECIMAL(12,2) DEFAULT 0,
  total_impressions BIGINT DEFAULT 0,
  total_clicks BIGINT DEFAULT 0,
  total_sales DECIMAL(12,2) DEFAULT 0,
  total_orders INT DEFAULT 0,
  
  -- Calculated metrics (auto-computed by trigger)
  cpi DECIMAL(10,6) DEFAULT 0,
  ctr DECIMAL(10,6) DEFAULT 0,
  cpc DECIMAL(10,4) DEFAULT 0,
  roas DECIMAL(10,4) DEFAULT 0,
  
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(date, platform, data_type)
);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_daily_metrics_date ON daily_metrics(date);
CREATE INDEX IF NOT EXISTS idx_daily_metrics_platform ON daily_metrics(platform);
CREATE INDEX IF NOT EXISTS idx_daily_metrics_date_platform ON daily_metrics(date, platform);

-- ===========================================
-- Trigger: Auto-calculate derived metrics
-- ===========================================
CREATE OR REPLACE FUNCTION calculate_metrics()
RETURNS TRIGGER AS $$
BEGIN
  -- Cost Per Impression
  NEW.cpi := CASE 
    WHEN NEW.total_impressions > 0 
    THEN NEW.total_spend / NEW.total_impressions 
    ELSE 0 
  END;
  
  -- Click-Through Rate (percentage)
  NEW.ctr := CASE 
    WHEN NEW.total_impressions > 0 
    THEN (NEW.total_clicks::DECIMAL / NEW.total_impressions) * 100 
    ELSE 0 
  END;
  
  -- Cost Per Click
  NEW.cpc := CASE 
    WHEN NEW.total_clicks > 0 
    THEN NEW.total_spend / NEW.total_clicks 
    ELSE 0 
  END;
  
  -- Return on Ad Spend
  NEW.roas := CASE 
    WHEN NEW.total_spend > 0 
    THEN NEW.total_sales / NEW.total_spend 
    ELSE 0 
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if exists, then create
DROP TRIGGER IF EXISTS trigger_calculate_metrics ON daily_metrics;
CREATE TRIGGER trigger_calculate_metrics
  BEFORE INSERT OR UPDATE ON daily_metrics
  FOR EACH ROW EXECUTE FUNCTION calculate_metrics();

-- ===========================================
-- Table: monthly_summary
-- Pre-aggregated monthly data for trends
-- ===========================================
CREATE TABLE IF NOT EXISTS monthly_summary (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  month DATE NOT NULL,
  platform TEXT NOT NULL,
  
  total_spend DECIMAL(12,2) DEFAULT 0,
  total_impressions BIGINT DEFAULT 0,
  total_clicks BIGINT DEFAULT 0,
  total_sales DECIMAL(12,2) DEFAULT 0,
  total_orders INT DEFAULT 0,
  
  avg_cpi DECIMAL(10,6) DEFAULT 0,
  avg_ctr DECIMAL(10,6) DEFAULT 0,
  avg_roas DECIMAL(10,4) DEFAULT 0,
  
  UNIQUE(month, platform)
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_monthly_summary_month ON monthly_summary(month);
CREATE INDEX IF NOT EXISTS idx_monthly_summary_platform ON monthly_summary(platform);

-- ===========================================
-- Enable Row Level Security (RLS)
-- ===========================================
ALTER TABLE data_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE column_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_summary ENABLE ROW LEVEL SECURITY;

-- Allow all operations for now (adjust for production)
CREATE POLICY "Allow all for data_sources" ON data_sources FOR ALL USING (true);
CREATE POLICY "Allow all for column_mappings" ON column_mappings FOR ALL USING (true);
CREATE POLICY "Allow all for daily_metrics" ON daily_metrics FOR ALL USING (true);
CREATE POLICY "Allow all for monthly_summary" ON monthly_summary FOR ALL USING (true);

-- ===========================================
-- Insert default column mappings for all platforms
-- Based on actual column names from Google Sheets
-- ===========================================

-- First, clear existing mappings to avoid conflicts
DELETE FROM column_mappings;

INSERT INTO column_mappings (platform, data_type, source_column, target_column) VALUES
  -- =====================
  -- SWIGGY ADS
  -- Columns: METRICS_DATE, CAMPAIGN_ID, CAMPAIGN_NAME, TOTAL_IMPRESSIONS, 
  --          TOTAL_BUDGET_BURNT, TOTAL_CLICKS, TOTAL_GMV, TOTAL_CONVERSIONS,
  --          TOTAL_DIRECT_GMV_14_DAYS, TOTAL_DIRECT_GMV_7_DAYS
  -- =====================
  ('swiggy', 'ads', 'metrics_date', 'date'),
  ('swiggy', 'ads', 'total_budget_burnt', 'spend'),
  ('swiggy', 'ads', 'total_impressions', 'impressions'),
  ('swiggy', 'ads', 'total_clicks', 'clicks'),
  ('swiggy', 'ads', 'total_gmv', 'sales'),
  ('swiggy', 'ads', 'total_direct_gmv_14_days', 'sales'),
  ('swiggy', 'ads', 'total_direct_gmv_7_days', 'sales'),
  ('swiggy', 'ads', 'total_conversions', 'orders'),
  ('swiggy', 'ads', 'campaign_name', 'campaign_name'),
  ('swiggy', 'ads', 'product_name', 'campaign_name'),
  ('swiggy', 'ads', 'city', 'city'),
  ('swiggy', 'ads', 'brand_name', 'brand'),

  -- =====================
  -- SWIGGY SALES
  -- Columns: BRAND, ORDERED_DATE, CITY, AREA_NAME, PRODUCT_NAME, 
  --          UNITS_SOLD, GMV
  -- =====================
  ('swiggy', 'sales', 'ordered_date', 'date'),
  ('swiggy', 'sales', 'gmv', 'sales'),
  ('swiggy', 'sales', 'units_sold', 'orders'),
  ('swiggy', 'sales', 'product_name', 'campaign_name'),
  ('swiggy', 'sales', 'city', 'city'),
  ('swiggy', 'sales', 'area_name', 'city'),
  ('swiggy', 'sales', 'brand', 'brand'),

  -- =====================
  -- ZEPTO ADS
  -- Columns: Date, CampaignName, Impressions, Spend, Clicks, 
  --          Revenue, Orders, Roas
  -- =====================
  ('zepto', 'ads', 'date', 'date'),
  ('zepto', 'ads', 'spend', 'spend'),
  ('zepto', 'ads', 'impressions', 'impressions'),
  ('zepto', 'ads', 'clicks', 'clicks'),
  ('zepto', 'ads', 'revenue', 'sales'),
  ('zepto', 'ads', 'orders', 'orders'),
  ('zepto', 'ads', 'campaignname', 'campaign_name'),
  ('zepto', 'ads', 'brandname', 'brand'),

  -- =====================
  -- ZEPTO SALES
  -- Columns: Sales Date, SKU Name, City, Brand Name, Quantity, GMV
  -- =====================
  ('zepto', 'sales', 'sales date', 'date'),
  ('zepto', 'sales', 'gmv', 'sales'),
  ('zepto', 'sales', 'quantity', 'orders'),
  ('zepto', 'sales', 'sku name', 'campaign_name'),
  ('zepto', 'sales', 'city', 'city'),
  ('zepto', 'sales', 'brand name', 'brand'),

  -- =====================
  -- BLINKIT ADS (default template)
  -- =====================
  ('blinkit', 'ads', 'date', 'date'),
  ('blinkit', 'ads', 'spend', 'spend'),
  ('blinkit', 'ads', 'impressions', 'impressions'),
  ('blinkit', 'ads', 'clicks', 'clicks'),
  ('blinkit', 'ads', 'revenue', 'sales'),
  ('blinkit', 'ads', 'orders', 'orders')

ON CONFLICT (platform, data_type, source_column) DO UPDATE 
SET target_column = EXCLUDED.target_column;

-- ===========================================
-- Useful queries for debugging
-- ===========================================

-- View all data sources
-- SELECT * FROM data_sources ORDER BY created_at DESC;

-- View daily metrics for last 7 days
-- SELECT * FROM daily_metrics WHERE date >= CURRENT_DATE - INTERVAL '7 days' ORDER BY date DESC;

-- View metrics grouped by platform
-- SELECT platform, SUM(total_spend) as spend, SUM(total_sales) as sales, 
--        AVG(roas) as avg_roas FROM daily_metrics GROUP BY platform;

-- View monthly summary
-- SELECT * FROM monthly_summary ORDER BY month DESC;
