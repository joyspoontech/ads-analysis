'use client';

import { Search, Bell, User, Moon, Sun } from 'lucide-react';
import { useState, useEffect } from 'react';

// Simple theme toggle without external dependencies
function applyTheme(theme: 'dark' | 'light') {
    localStorage.setItem('theme', theme);
    // Theme is always dark in this version
}

export default function Header() {
    const [darkMode, setDarkMode] = useState(true);
    const [showNotifications, setShowNotifications] = useState(false);
    const [showProfile, setShowProfile] = useState(false);

    // Initialize theme from localStorage on mount
    useEffect(() => {
        const savedTheme = localStorage.getItem('theme');
        setDarkMode(savedTheme !== 'light');
    }, []);

    const toggleTheme = () => {
        const newTheme = darkMode ? 'light' : 'dark';
        setDarkMode(!darkMode);
        applyTheme(newTheme);
    };

    const notifications = [
        { id: 1, message: 'Campaign "Holiday Sale" exceeded target ROAS', time: '5 min ago', type: 'success' },
        { id: 2, message: 'New data synced successfully', time: '1 hour ago', type: 'info' },
        { id: 3, message: 'Ad spend limit reached', time: '3 hours ago', type: 'warning' },
    ];

    return (
        <header className="h-16 glass border-b border-[var(--border)] flex items-center justify-between px-6 sticky top-0 z-30">
            {/* Search */}
            <div className="flex-1 max-w-md">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
                    <input
                        type="text"
                        placeholder="Search campaigns, platforms..."
                        className="input-field pl-10 w-full"
                    />
                </div>
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-4">
                {/* Theme Toggle */}
                <button
                    onClick={toggleTheme}
                    className="w-10 h-10 rounded-xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center hover:bg-[var(--surface-light)] transition-colors"
                    title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                >
                    {darkMode ? (
                        <Moon className="w-5 h-5 text-[var(--primary)]" />
                    ) : (
                        <Sun className="w-5 h-5 text-[var(--warning)]" />
                    )}
                </button>

                {/* Notifications */}
                <div className="relative">
                    <button
                        onClick={() => {
                            setShowNotifications(!showNotifications);
                            setShowProfile(false);
                        }}
                        className="w-10 h-10 rounded-xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center hover:bg-[var(--surface-light)] transition-colors relative"
                    >
                        <Bell className="w-5 h-5" />
                        <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[var(--error)] text-xs flex items-center justify-center text-white">
                            3
                        </span>
                    </button>

                    {showNotifications && (
                        <div className="dropdown-menu absolute right-0 top-12 w-80">
                            <div className="p-3 border-b border-[var(--border)]">
                                <h3 className="font-semibold">Notifications</h3>
                            </div>
                            {notifications.map((notif) => (
                                <div
                                    key={notif.id}
                                    className="dropdown-item flex flex-col gap-1"
                                >
                                    <p className="text-sm">{notif.message}</p>
                                    <span className="text-xs text-[var(--text-muted)]">{notif.time}</span>
                                </div>
                            ))}
                            <div className="p-2 border-t border-[var(--border)]">
                                <button className="text-sm text-[var(--primary)] hover:underline w-full text-center">
                                    View all notifications
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Profile */}
                <div className="relative">
                    <button
                        onClick={() => {
                            setShowProfile(!showProfile);
                            setShowNotifications(false);
                        }}
                        className="flex items-center gap-3 p-2 rounded-xl hover:bg-[var(--surface)] transition-colors"
                    >
                        <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                            <User className="w-5 h-5 text-white" />
                        </div>
                        <div className="text-left hidden md:block">
                            <p className="font-medium text-sm">Admin User</p>
                            <p className="text-xs text-[var(--text-muted)]">admin@company.com</p>
                        </div>
                    </button>

                    {showProfile && (
                        <div className="dropdown-menu absolute right-0 top-14 w-48">
                            <button className="dropdown-item w-full text-left">Profile</button>
                            <a href="/settings" className="dropdown-item w-full text-left block">Account Settings</a>
                            <div className="border-t border-[var(--border)] my-1"></div>
                            <button className="dropdown-item w-full text-left text-[var(--error)]">
                                Sign Out
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
