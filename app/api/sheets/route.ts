/**
 * API Route: Fetch Google Sheet as CSV
 * This bypasses CORS by fetching server-side
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const sheetId = searchParams.get('sheetId');
    const tabName = searchParams.get('tabName');
    const gid = searchParams.get('gid');

    if (!sheetId) {
        return NextResponse.json({ error: 'Missing sheetId parameter' }, { status: 400 });
    }

    // Build export URL
    let url: string;
    if (gid) {
        url = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
    } else if (tabName && tabName !== 'Sheet1') {
        url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(tabName)}`;
    } else {
        url = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
    }

    console.log(`[API /sheets] Fetching: ${url}`);

    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            },
        });

        if (!response.ok) {
            console.error(`[API /sheets] Failed: ${response.status} ${response.statusText}`);

            // Try alternate URL format
            const altUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv${gid ? `&gid=${gid}` : ''}`;
            console.log(`[API /sheets] Trying alternate URL: ${altUrl}`);

            const altResponse = await fetch(altUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                },
            });

            if (!altResponse.ok) {
                return NextResponse.json({
                    error: `Sheet not accessible (${response.status}). Make sure it's published to web or shared with "Anyone with link".`,
                    status: response.status,
                }, { status: response.status });
            }

            const altText = await altResponse.text();
            return NextResponse.json({ csv: altText });
        }

        const csvText = await response.text();
        console.log(`[API /sheets] Success: ${csvText.length} bytes, first 100 chars: ${csvText.slice(0, 100)}`);

        return NextResponse.json({ csv: csvText });
    } catch (error) {
        console.error('[API /sheets] Error:', error);
        return NextResponse.json({
            error: error instanceof Error ? error.message : 'Failed to fetch sheet',
        }, { status: 500 });
    }
}
