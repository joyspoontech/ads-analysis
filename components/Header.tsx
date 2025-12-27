'use client';

import { Search, Bell, User, Settings, LogOut, X, Check } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useTheme } from '@/contexts/ThemeContext';
import ThemeToggle from './ThemeToggle';

export default function Header() {
    const [showNotifications, setShowNotifications] = useState(false);
    const [showProfile, setShowProfile] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [notifications, setNotifications] = useState([
        { id: 1, message: 'Campaign "Holiday Sale" exceeded target ROAS', time: '5 min ago', type: 'success', read: false },
        { id: 2, message: 'New data synced successfully', time: '1 hour ago', type: 'info', read: false },
        { id: 3, message: 'Ad spend limit reached', time: '3 hours ago', type: 'warning', read: true },
    ]);

    const notifRef = useRef<HTMLDivElement>(null);
    const profileRef = useRef<HTMLDivElement>(null);

    // Close dropdowns when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
                setShowNotifications(false);
            }
            if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
                setShowProfile(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Mark notification as read
    const markAsRead = (id: number) => {
        setNotifications(prev =>
            prev.map(n => n.id === id ? { ...n, read: true } : n)
        );
    };

    // Mark all as read
    const markAllAsRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    // Clear notification
    const clearNotification = (id: number) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    // Handle search
    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            // Could navigate to search results page
            console.log('Searching for:', searchQuery);
        }
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <header className="h-16 glass border-b border-[var(--border)] flex items-center justify-between px-6 sticky top-0 z-30 animate-slide-in">
            {/* Search */}
            <form onSubmit={handleSearch} className="flex-1 max-w-md">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search campaigns, platforms..."
                        className="input-field pl-10 w-full transition-all focus:ring-2 focus:ring-[var(--primary-subtle)]"
                    />
                    {searchQuery && (
                        <button
                            type="button"
                            onClick={() => setSearchQuery('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </form>

            {/* Right Section */}
            <div className="flex items-center gap-3">
                {/* Theme Toggle */}
                <ThemeToggle />

                {/* Notifications */}
                <div className="relative" ref={notifRef}>
                    <button
                        onClick={() => {
                            setShowNotifications(!showNotifications);
                            setShowProfile(false);
                        }}
                        className="w-10 h-10 rounded-lg bg-[var(--background-secondary)] border border-[var(--border)] flex items-center justify-center hover:bg-[var(--surface-light)] transition-all hover:scale-105 active:scale-95 relative"
                        title="Notifications"
                    >
                        <Bell className="w-5 h-5" />
                        {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[var(--error)] text-xs flex items-center justify-center text-white animate-pulse">
                                {unreadCount}
                            </span>
                        )}
                    </button>

                    {showNotifications && (
                        <div className="dropdown-menu absolute right-0 top-12 w-80 animate-scale-in">
                            <div className="p-3 border-b border-[var(--border)] flex items-center justify-between">
                                <h3 className="font-semibold">Notifications</h3>
                                {unreadCount > 0 && (
                                    <button
                                        onClick={markAllAsRead}
                                        className="text-xs text-[var(--primary)] hover:underline"
                                    >
                                        Mark all read
                                    </button>
                                )}
                            </div>
                            {notifications.length === 0 ? (
                                <div className="p-4 text-center text-[var(--text-muted)]">
                                    No notifications
                                </div>
                            ) : (
                                notifications.map((notif) => (
                                    <div
                                        key={notif.id}
                                        className={`dropdown-item flex items-start gap-3 group ${!notif.read ? 'bg-[var(--primary-subtle)]' : ''}`}
                                        onClick={() => markAsRead(notif.id)}
                                    >
                                        <div className={`w-2 h-2 rounded-full mt-2 ${notif.type === 'success' ? 'bg-[var(--success)]' :
                                                notif.type === 'warning' ? 'bg-[var(--warning)]' :
                                                    'bg-[var(--primary)]'
                                            }`} />
                                        <div className="flex-1">
                                            <p className="text-sm">{notif.message}</p>
                                            <span className="text-xs text-[var(--text-muted)]">{notif.time}</span>
                                        </div>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); clearNotification(notif.id); }}
                                            className="opacity-0 group-hover:opacity-100 transition-opacity text-[var(--text-muted)] hover:text-[var(--error)]"
                                            title="Dismiss"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))
                            )}
                            <div className="p-2 border-t border-[var(--border)]">
                                <Link
                                    href="/settings"
                                    className="text-sm text-[var(--primary)] hover:underline w-full text-center block"
                                    onClick={() => setShowNotifications(false)}
                                >
                                    Notification settings
                                </Link>
                            </div>
                        </div>
                    )}
                </div>

                {/* Profile */}
                <div className="relative" ref={profileRef}>
                    <button
                        onClick={() => {
                            setShowProfile(!showProfile);
                            setShowNotifications(false);
                        }}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--surface-light)] transition-all active:scale-98"
                    >
                        <div className="w-10 h-10 rounded-lg bg-[var(--primary)] flex items-center justify-center">
                            <User className="w-5 h-5 text-white" />
                        </div>
                        <div className="text-left hidden md:block">
                            <p className="font-medium text-sm">Admin User</p>
                            <p className="text-xs text-[var(--text-muted)]">admin@company.com</p>
                        </div>
                    </button>

                    {showProfile && (
                        <div className="dropdown-menu absolute right-0 top-14 w-52 animate-scale-in">
                            <div className="p-3 border-b border-[var(--border)]">
                                <p className="font-medium text-sm">Admin User</p>
                                <p className="text-xs text-[var(--text-muted)]">admin@company.com</p>
                            </div>
                            <Link
                                href="/settings"
                                className="dropdown-item w-full text-left flex items-center gap-2"
                                onClick={() => setShowProfile(false)}
                            >
                                <Settings className="w-4 h-4" />
                                Settings
                            </Link>
                            <div className="border-t border-[var(--border)] my-1"></div>
                            <button
                                className="dropdown-item w-full text-left text-[var(--error)] flex items-center gap-2"
                                onClick={() => {
                                    // Sign out logic would go here
                                    console.log('Sign out clicked');
                                    setShowProfile(false);
                                }}
                            >
                                <LogOut className="w-4 h-4" />
                                Sign Out
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
