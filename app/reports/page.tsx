'use client';

import { useState } from 'react';
import { FileText, Download, Loader2, FileSpreadsheet, File } from 'lucide-react';
import DateRangePicker from '@/components/DateRangePicker';
import { useMetrics } from '@/hooks/useMetrics';
import { formatNumber, aggregateToMonthly } from '@/lib/aggregation';

type ExportFormat = 'csv' | 'excel' | 'pdf';

export default function ReportsPage() {
    const [dateRange, setDateRange] = useState(() => {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 30);
        return {
            start: start.toISOString().split('T')[0],
            end: end.toISOString().split('T')[0],
        };
    });
    const [exporting, setExporting] = useState<ExportFormat | null>(null);

    const { dailyMetrics, summary, platformMetrics, isLoading } = useMetrics({
        startDate: dateRange.start,
        endDate: dateRange.end,
    });

    // Export to CSV
    const exportToCsv = () => {
        setExporting('csv');

        const headers = ['Date', 'Platform', 'Type', 'Spend', 'Impressions', 'Clicks', 'Sales', 'CPI', 'CTR%', 'ROAS'];
        const rows = dailyMetrics.map(m => [
            m.date,
            m.platform,
            m.data_type,
            m.total_spend,
            m.total_impressions,
            m.total_clicks,
            m.total_sales,
            m.cpi.toFixed(6),
            m.ctr.toFixed(2),
            m.roas.toFixed(2),
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(r => r.join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics_report_${dateRange.start}_${dateRange.end}.csv`;
        a.click();
        URL.revokeObjectURL(url);

        setExporting(null);
    };

    // Export to Excel (using xlsx library)
    const exportToExcel = async () => {
        setExporting('excel');

        try {
            const XLSX = await import('xlsx');

            const data = dailyMetrics.map(m => ({
                Date: m.date,
                Platform: m.platform,
                Type: m.data_type,
                Spend: m.total_spend,
                Impressions: m.total_impressions,
                Clicks: m.total_clicks,
                Sales: m.total_sales,
                CPI: m.cpi,
                'CTR%': m.ctr,
                ROAS: m.roas,
            }));

            const ws = XLSX.utils.json_to_sheet(data);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Daily Metrics');

            // Add summary sheet
            const summaryData = [
                { Metric: 'Total Spend', Value: summary?.totalSpend || 0 },
                { Metric: 'Total Sales', Value: summary?.totalSales || 0 },
                { Metric: 'Total Impressions', Value: summary?.totalImpressions || 0 },
                { Metric: 'Total Clicks', Value: summary?.totalClicks || 0 },
                { Metric: 'Average CTR%', Value: summary?.avgCtr || 0 },
                { Metric: 'Average ROAS', Value: summary?.avgRoas || 0 },
            ];
            const summaryWs = XLSX.utils.json_to_sheet(summaryData);
            XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');

            XLSX.writeFile(wb, `analytics_report_${dateRange.start}_${dateRange.end}.xlsx`);
        } catch (error) {
            console.error('Excel export failed:', error);
        }

        setExporting(null);
    };

    // Export to PDF
    const exportToPdf = async () => {
        setExporting('pdf');

        try {
            const jsPDF = (await import('jspdf')).default;
            const doc = new jsPDF();

            doc.setFontSize(20);
            doc.text('Analytics Report', 20, 20);
            doc.setFontSize(12);
            doc.text(`Period: ${dateRange.start} to ${dateRange.end}`, 20, 30);

            // Summary section
            doc.setFontSize(14);
            doc.text('Summary', 20, 45);
            doc.setFontSize(10);

            const summaryLines = [
                `Total Spend: ${formatNumber(summary?.totalSpend || 0, 'currency')}`,
                `Total Sales: ${formatNumber(summary?.totalSales || 0, 'currency')}`,
                `Total Impressions: ${formatNumber(summary?.totalImpressions || 0)}`,
                `Total Clicks: ${formatNumber(summary?.totalClicks || 0)}`,
                `Average CTR: ${(summary?.avgCtr || 0).toFixed(2)}%`,
                `Average ROAS: ${(summary?.avgRoas || 0).toFixed(2)}x`,
            ];

            summaryLines.forEach((line, index) => {
                doc.text(line, 20, 55 + (index * 7));
            });

            // Platform breakdown
            doc.setFontSize(14);
            doc.text('Platform Breakdown', 20, 105);
            doc.setFontSize(10);

            platformMetrics.forEach((pm, index) => {
                const y = 115 + (index * 20);
                doc.text(`${pm.platform.charAt(0).toUpperCase() + pm.platform.slice(1)}`, 20, y);
                doc.text(`Spend: ${formatNumber(pm.totalSpend, 'currency')}`, 60, y);
                doc.text(`Sales: ${formatNumber(pm.totalSales, 'currency')}`, 120, y);
                doc.text(`ROAS: ${pm.roas.toFixed(2)}x`, 170, y);
            });

            doc.save(`analytics_report_${dateRange.start}_${dateRange.end}.pdf`);
        } catch (error) {
            console.error('PDF export failed:', error);
        }

        setExporting(null);
    };

    const exportFormats = [
        {
            id: 'csv' as ExportFormat,
            label: 'CSV',
            description: 'Raw data for spreadsheets',
            icon: FileSpreadsheet,
            action: exportToCsv,
        },
        {
            id: 'excel' as ExportFormat,
            label: 'Excel',
            description: 'Formatted workbook with multiple sheets',
            icon: FileSpreadsheet,
            action: exportToExcel,
        },
        {
            id: 'pdf' as ExportFormat,
            label: 'PDF',
            description: 'Summary report for sharing',
            icon: File,
            action: exportToPdf,
        },
    ];

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Reports</h1>
                    <p className="text-[var(--text-muted)] mt-1">
                        Export your analytics data
                    </p>
                </div>
                <DateRangePicker
                    onRangeChange={(start, end) => setDateRange({
                        start: start.toISOString().split('T')[0],
                        end: end.toISOString().split('T')[0],
                    })}
                />
            </div>

            {/* Summary Preview */}
            {summary && (
                <div className="glass rounded-2xl p-6">
                    <h2 className="font-semibold mb-4">Report Preview</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        <div>
                            <p className="text-sm text-[var(--text-muted)]">Total Spend</p>
                            <p className="text-xl font-bold">{formatNumber(summary.totalSpend, 'currency')}</p>
                        </div>
                        <div>
                            <p className="text-sm text-[var(--text-muted)]">Total Sales</p>
                            <p className="text-xl font-bold">{formatNumber(summary.totalSales, 'currency')}</p>
                        </div>
                        <div>
                            <p className="text-sm text-[var(--text-muted)]">Impressions</p>
                            <p className="text-xl font-bold">{formatNumber(summary.totalImpressions)}</p>
                        </div>
                        <div>
                            <p className="text-sm text-[var(--text-muted)]">Clicks</p>
                            <p className="text-xl font-bold">{formatNumber(summary.totalClicks)}</p>
                        </div>
                        <div>
                            <p className="text-sm text-[var(--text-muted)]">Avg CTR</p>
                            <p className="text-xl font-bold">{summary.avgCtr.toFixed(2)}%</p>
                        </div>
                        <div>
                            <p className="text-sm text-[var(--text-muted)]">Avg ROAS</p>
                            <p className="text-xl font-bold">{summary.avgRoas.toFixed(2)}x</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Export Options */}
            <div className="grid md:grid-cols-3 gap-4">
                {exportFormats.map((format) => (
                    <div key={format.id} className="glass rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-lg bg-[var(--primary)]/20 flex items-center justify-center">
                                <format.icon className="w-5 h-5 text-[var(--primary)]" />
                            </div>
                            <div>
                                <h3 className="font-semibold">{format.label}</h3>
                                <p className="text-sm text-[var(--text-muted)]">{format.description}</p>
                            </div>
                        </div>
                        <button
                            onClick={format.action}
                            disabled={exporting !== null || isLoading || dailyMetrics.length === 0}
                            className="btn-primary w-full flex items-center justify-center gap-2"
                        >
                            {exporting === format.id ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Exporting...
                                </>
                            ) : (
                                <>
                                    <Download className="w-4 h-4" />
                                    Export {format.label}
                                </>
                            )}
                        </button>
                    </div>
                ))}
            </div>

            {/* Data Count */}
            <p className="text-center text-[var(--text-muted)]">
                {isLoading ? (
                    'Loading data...'
                ) : (
                    `${dailyMetrics.length} records from ${dateRange.start} to ${dateRange.end}`
                )}
            </p>
        </div>
    );
}
