'use client';

import { useState, useEffect } from 'react';
import { Settings, Database, Palette, Bell, Save, Check, Sun, Moon } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

export default function SettingsPage() {
    const [saved, setSaved] = useState(false);
    const [dashboardName, setDashboardName] = useState('Joyspoon Analytics');
    const [defaultRange, setDefaultRange] = useState('30');
    const [currency, setCurrency] = useState('₹');
    const [notifications, setNotifications] = useState({
        syncComplete: true,
        lowRoas: true,
        dailyEmail: false,
    });
    const { theme, setTheme } = useTheme();

    const handleSave = () => {
        // Save to localStorage
        localStorage.setItem('settings', JSON.stringify({
            dashboardName,
            defaultRange,
            currency,
            notifications,
        }));
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    // Load settings on mount
    useEffect(() => {
        const savedSettings = localStorage.getItem('settings');
        if (savedSettings) {
            const settings = JSON.parse(savedSettings);
            setDashboardName(settings.dashboardName || 'Joyspoon Analytics');
            setDefaultRange(settings.defaultRange || '30');
            setCurrency(settings.currency || '₹');
            setNotifications(settings.notifications || {
                syncComplete: true,
                lowRoas: true,
                dailyEmail: false,
            });
        }
    }, []);

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Page Header */}
            <div>
                <h1 className="text-3xl font-bold">Settings</h1>
                <p className="text-[var(--text-muted)] mt-1">
                    Configure your dashboard preferences
                </p>
            </div>

            {/* Settings Sections */}
            <div className="space-y-6">
                {/* General Settings */}
                <div className="glass rounded-xl p-6 animate-slide-up stagger-1">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-lg bg-[var(--primary-subtle)] flex items-center justify-center">
                            <Settings className="w-5 h-5 text-[var(--primary)]" />
                        </div>
                        <div>
                            <h2 className="font-semibold">General Settings</h2>
                            <p className="text-sm text-[var(--text-muted)]">Basic configuration options</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Dashboard Name</label>
                            <input
                                type="text"
                                value={dashboardName}
                                onChange={(e) => setDashboardName(e.target.value)}
                                className="input-field max-w-md"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Default Date Range</label>
                            <select
                                className="select-field max-w-md"
                                value={defaultRange}
                                onChange={(e) => setDefaultRange(e.target.value)}
                            >
                                <option value="7">Last 7 days</option>
                                <option value="30">Last 30 days</option>
                                <option value="90">Last 90 days</option>
                                <option value="365">Last year</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Database Connection */}
                <div className="glass rounded-xl p-6 animate-slide-up stagger-2">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-lg bg-[var(--success-subtle)] flex items-center justify-center">
                            <Database className="w-5 h-5 text-[var(--success)]" />
                        </div>
                        <div>
                            <h2 className="font-semibold">Database Connection</h2>
                            <p className="text-sm text-[var(--text-muted)]">Supabase configuration</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Supabase URL</label>
                            <input
                                type="text"
                                defaultValue="https://vdhxrrbkbgvzicskvqex.supabase.co"
                                className="input-field opacity-60"
                                disabled
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Status</label>
                            <span className="badge badge-success">Connected</span>
                        </div>
                    </div>
                </div>

                {/* Appearance */}
                <div className="glass rounded-xl p-6 animate-slide-up stagger-3">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-lg bg-[var(--primary-subtle)] flex items-center justify-center">
                            <Palette className="w-5 h-5 text-[var(--primary)]" />
                        </div>
                        <div>
                            <h2 className="font-semibold">Appearance</h2>
                            <p className="text-sm text-[var(--text-muted)]">Customize look and feel</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Theme</label>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setTheme('dark')}
                                    className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-all ${theme === 'dark'
                                            ? 'bg-[var(--primary)] text-white'
                                            : 'bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--primary)]'
                                        }`}
                                >
                                    <Moon className="w-4 h-4" />
                                    Dark
                                </button>
                                <button
                                    onClick={() => setTheme('light')}
                                    className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-all ${theme === 'light'
                                            ? 'bg-[var(--primary)] text-white'
                                            : 'bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--primary)]'
                                        }`}
                                >
                                    <Sun className="w-4 h-4" />
                                    Light
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Currency Symbol</label>
                            <select
                                className="select-field max-w-md"
                                value={currency}
                                onChange={(e) => setCurrency(e.target.value)}
                            >
                                <option value="₹">₹ (Indian Rupee)</option>
                                <option value="$">$ (US Dollar)</option>
                                <option value="€">€ (Euro)</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Notifications */}
                <div className="glass rounded-xl p-6 animate-slide-up stagger-4">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-lg bg-[var(--warning-subtle)] flex items-center justify-center">
                            <Bell className="w-5 h-5 text-[var(--warning)]" />
                        </div>
                        <div>
                            <h2 className="font-semibold">Notifications</h2>
                            <p className="text-sm text-[var(--text-muted)]">Alert preferences</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <input
                                type="checkbox"
                                checked={notifications.syncComplete}
                                onChange={(e) => setNotifications({ ...notifications, syncComplete: e.target.checked })}
                                className="w-5 h-5 rounded accent-[var(--primary)]"
                            />
                            <span className="group-hover:text-[var(--primary)] transition-colors">Show sync completion notifications</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <input
                                type="checkbox"
                                checked={notifications.lowRoas}
                                onChange={(e) => setNotifications({ ...notifications, lowRoas: e.target.checked })}
                                className="w-5 h-5 rounded accent-[var(--primary)]"
                            />
                            <span className="group-hover:text-[var(--primary)] transition-colors">Alert on low ROAS (&lt; 1.0)</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <input
                                type="checkbox"
                                checked={notifications.dailyEmail}
                                onChange={(e) => setNotifications({ ...notifications, dailyEmail: e.target.checked })}
                                className="w-5 h-5 rounded accent-[var(--primary)]"
                            />
                            <span className="group-hover:text-[var(--primary)] transition-colors">Daily summary email</span>
                        </label>
                    </div>
                </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end animate-slide-up stagger-5">
                <button
                    onClick={handleSave}
                    className="btn-primary flex items-center gap-2"
                >
                    {saved ? (
                        <>
                            <Check className="w-4 h-4" />
                            Saved!
                        </>
                    ) : (
                        <>
                            <Save className="w-4 h-4" />
                            Save Settings
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
