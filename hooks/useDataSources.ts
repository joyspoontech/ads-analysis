/**
 * useDataSources - React hook for managing data sources
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    getDataSources,
    addDataSource,
    updateDataSource,
    deleteDataSource,
    DataSource
} from '@/lib/supabase';

export function useDataSources() {
    const [sources, setSources] = useState<DataSource[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchSources = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const data = await getDataSources();
            setSources(data);
        } catch (err) {
            console.error('[useDataSources] Error:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch data sources');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSources();
    }, [fetchSources]);

    const add = async (source: Omit<DataSource, 'id' | 'created_at' | 'updated_at'>) => {
        try {
            const newSource = await addDataSource(source);
            if (newSource) {
                setSources(prev => [newSource, ...prev]);
                return newSource;
            }
            throw new Error('Failed to add data source');
        } catch (err) {
            console.error('[useDataSources] Add error:', err);
            throw err;
        }
    };

    const update = async (id: string, updates: Partial<DataSource>) => {
        try {
            const updated = await updateDataSource(id, updates);
            if (updated) {
                setSources(prev => prev.map(s => s.id === id ? updated : s));
                return updated;
            }
            throw new Error('Failed to update data source');
        } catch (err) {
            console.error('[useDataSources] Update error:', err);
            throw err;
        }
    };

    const remove = async (id: string) => {
        try {
            const success = await deleteDataSource(id);
            if (success) {
                setSources(prev => prev.filter(s => s.id !== id));
                return true;
            }
            throw new Error('Failed to delete data source');
        } catch (err) {
            console.error('[useDataSources] Delete error:', err);
            throw err;
        }
    };

    const toggleActive = async (id: string) => {
        const source = sources.find(s => s.id === id);
        if (source) {
            return update(id, { is_active: !source.is_active });
        }
    };

    return {
        sources,
        isLoading,
        error,
        refresh: fetchSources,
        add,
        update,
        remove,
        toggleActive,
    };
}
