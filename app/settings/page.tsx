'use client';

import { useState } from 'react';
import { Settings, Database, Palette, Bell, Save, Check } from 'lucide-react';

export default function SettingsPage() {
    const [saved, setSaved] = useState(false);

    const handleSave = () => {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

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
                <div className="glass rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-lg bg-[var(--primary)]/20 flex items-center justify-center">
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
                                defaultValue="Joyspoon Analytics"
                                className="input-field max-w-md"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Default Date Range</label>
                            <select className="select-field max-w-md">
                                <option value="7">Last 7 days</option>
                                <option value="30" selected>Last 30 days</option>
                                <option value="90">Last 90 days</option>
                                <option value="365">Last year</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Database Connection */}
                <div className="glass rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-lg bg-[var(--success)]/20 flex items-center justify-center">
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
                                defaultValue="https://fhomcjmquvhvakvfinsv.supabase.co"
                                className="input-field"
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
                <div className="glass rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-lg bg-[var(--accent-pink)]/20 flex items-center justify-center">
                            <Palette className="w-5 h-5 text-[var(--accent-pink)]" />
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
                                <button className="px-4 py-2 rounded-lg bg-[var(--primary)] text-white font-medium">
                                    Dark
                                </button>
                                <button className="px-4 py-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] font-medium opacity-50 cursor-not-allowed">
                                    Light (Coming Soon)
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Currency Symbol</label>
                            <select className="select-field max-w-md">
                                <option value="₹" selected>₹ (Indian Rupee)</option>
                                <option value="$">$ (US Dollar)</option>
                                <option value="€">€ (Euro)</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Notifications */}
                <div className="glass rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-lg bg-[var(--warning)]/20 flex items-center justify-center">
                            <Bell className="w-5 h-5 text-[var(--warning)]" />
                        </div>
                        <div>
                            <h2 className="font-semibold">Notifications</h2>
                            <p className="text-sm text-[var(--text-muted)]">Alert preferences</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input type="checkbox" defaultChecked className="w-5 h-5 rounded accent-[var(--primary)]" />
                            <span>Show sync completion notifications</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input type="checkbox" defaultChecked className="w-5 h-5 rounded accent-[var(--primary)]" />
                            <span>Alert on low ROAS (&lt; 1.0)</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input type="checkbox" className="w-5 h-5 rounded accent-[var(--primary)]" />
                            <span>Daily summary email</span>
                        </label>
                    </div>
                </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
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
