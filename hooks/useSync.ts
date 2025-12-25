/**
 * useSync - React hook for sync operations
 */

'use client';

import { useState, useCallback } from 'react';
import { syncAllSources, syncSourceById, syncAllSourcesWithQuery, SyncResult } from '@/lib/syncService';

export function useSync() {
    const [isSyncing, setIsSyncing] = useState(false);
    const [lastSyncResults, setLastSyncResults] = useState<SyncResult[]>([]);
    const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
    const [error, setError] = useState<string | null>(null);

    const syncAll = useCallback(async () => {
        setIsSyncing(true);
        setError(null);

        try {
            const results = await syncAllSources();
            setLastSyncResults(results);
            setLastSyncTime(new Date());

            const failed = results.filter(r => !r.success);
            if (failed.length > 0) {
                setError(`${failed.length} source(s) failed to sync`);
            }

            return results;
        } catch (err) {
            console.error('[useSync] Error:', err);
            const message = err instanceof Error ? err.message : 'Sync failed';
            setError(message);
            throw err;
        } finally {
            setIsSyncing(false);
        }
    }, []);

    // New: Query-based sync (faster, more reliable)
    const syncAllWithQuery = useCallback(async () => {
        setIsSyncing(true);
        setError(null);

        try {
            const results = await syncAllSourcesWithQuery();
            setLastSyncResults(results);
            setLastSyncTime(new Date());

            const failed = results.filter(r => !r.success);
            if (failed.length > 0) {
                setError(`${failed.length} source(s) failed to sync`);
            }

            return results;
        } catch (err) {
            console.error('[useSync] Error (Query):', err);
            const message = err instanceof Error ? err.message : 'Sync failed';
            setError(message);
            throw err;
        } finally {
            setIsSyncing(false);
        }
    }, []);

    const syncOne = useCallback(async (sourceId: string) => {
        setIsSyncing(true);
        setError(null);

        try {
            const result = await syncSourceById(sourceId);
            setLastSyncResults([result]);
            setLastSyncTime(new Date());

            if (!result.success) {
                setError(result.error || 'Sync failed');
            }

            return result;
        } catch (err) {
            console.error('[useSync] Error syncing source:', err);
            const message = err instanceof Error ? err.message : 'Sync failed';
            setError(message);
            throw err;
        } finally {
            setIsSyncing(false);
        }
    }, []);

    return {
        isSyncing,
        lastSyncResults,
        lastSyncTime,
        error,
        syncAll,
        syncAllWithQuery,  // New query-based sync
        syncOne,
    };
}
