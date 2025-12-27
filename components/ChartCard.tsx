'use client';

import { ReactNode, useState, useRef, useEffect } from 'react';
import { MoreVertical, Download, Maximize2, Minimize2, X, Copy, Share2, Check } from 'lucide-react';

interface ChartCardProps {
    title: string;
    subtitle?: string;
    children: ReactNode;
    className?: string;
    actions?: boolean;
    action?: ReactNode;
    chartId?: string;
}

export default function ChartCard({
    title,
    subtitle,
    children,
    className = '',
    actions = true,
    action,
    chartId,
}: ChartCardProps) {
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [copied, setCopied] = useState(false);
    const cardRef = useRef<HTMLDivElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    // Close menu when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowMenu(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Handle download as image
    const handleDownload = async () => {
        if (!cardRef.current) return;

        try {
            // Dynamic import for html2canvas (only when needed)
            const html2canvas = (await import('html2canvas')).default;
            const canvas = await html2canvas(cardRef.current, {
                backgroundColor: null,
                scale: 2,
            });

            const link = document.createElement('a');
            link.download = `${title.replace(/\s+/g, '-').toLowerCase()}-chart.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        } catch {
            // Fallback: Download as text data
            const data = cardRef.current.innerText;
            const blob = new Blob([data], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.download = `${title.replace(/\s+/g, '-').toLowerCase()}-data.txt`;
            link.href = url;
            link.click();
            URL.revokeObjectURL(url);
        }
    };

    // Handle fullscreen toggle
    const handleFullscreen = () => {
        setIsFullscreen(!isFullscreen);
    };

    // Handle copy to clipboard
    const handleCopy = async () => {
        if (!cardRef.current) return;
        try {
            await navigator.clipboard.writeText(cardRef.current.innerText);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            console.error('Failed to copy');
        }
        setShowMenu(false);
    };

    // Handle share
    const handleShare = async () => {
        try {
            if (navigator.share) {
                await navigator.share({
                    title: title,
                    text: `Check out this chart: ${title}`,
                    url: window.location.href,
                });
            } else {
                // Fallback: copy URL
                await navigator.clipboard.writeText(window.location.href);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            }
        } catch {
            console.error('Share failed');
        }
        setShowMenu(false);
    };

    // Fullscreen overlay
    if (isFullscreen) {
        return (
            <div className="fixed inset-0 z-50 bg-[var(--background)] p-8 overflow-auto animate-scale-in">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-2xl font-semibold">{title}</h2>
                            {subtitle && (
                                <p className="text-[var(--text-muted)] mt-1">{subtitle}</p>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleDownload}
                                className="btn-secondary flex items-center gap-2"
                                title="Download chart"
                            >
                                <Download className="w-4 h-4" />
                                Download
                            </button>
                            <button
                                onClick={handleFullscreen}
                                className="btn-primary flex items-center gap-2"
                            >
                                <Minimize2 className="w-4 h-4" />
                                Exit Fullscreen
                            </button>
                        </div>
                    </div>
                    <div
                        ref={cardRef}
                        className="glass rounded-xl p-8 min-h-[70vh]"
                    >
                        {children}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div
            ref={cardRef}
            className={`glass rounded-xl p-5 animate-slide-up ${className}`}
            id={chartId}
        >
            <div className="flex items-start justify-between mb-4">
                <div>
                    <h3 className="font-medium text-base">{title}</h3>
                    {subtitle && (
                        <p className="text-sm text-[var(--text-muted)] mt-1">{subtitle}</p>
                    )}
                </div>
                <div className="flex items-center gap-1.5">
                    {action}
                    {actions && (
                        <>
                            <button
                                onClick={handleDownload}
                                className="w-8 h-8 rounded-lg bg-[var(--background-secondary)] flex items-center justify-center hover:bg-[var(--surface-light)] transition-all hover:scale-105 active:scale-95"
                                title="Download as image"
                            >
                                <Download className="w-4 h-4 text-[var(--text-secondary)]" />
                            </button>
                            <button
                                onClick={handleFullscreen}
                                className="w-8 h-8 rounded-lg bg-[var(--background-secondary)] flex items-center justify-center hover:bg-[var(--surface-light)] transition-all hover:scale-105 active:scale-95"
                                title="View fullscreen"
                            >
                                <Maximize2 className="w-4 h-4 text-[var(--text-secondary)]" />
                            </button>
                            <div className="relative" ref={menuRef}>
                                <button
                                    onClick={() => setShowMenu(!showMenu)}
                                    className="w-8 h-8 rounded-lg bg-[var(--background-secondary)] flex items-center justify-center hover:bg-[var(--surface-light)] transition-all hover:scale-105 active:scale-95"
                                    title="More options"
                                >
                                    <MoreVertical className="w-4 h-4 text-[var(--text-secondary)]" />
                                </button>
                                {showMenu && (
                                    <div className="absolute right-0 top-10 dropdown-menu z-20 animate-scale-in">
                                        <button
                                            onClick={handleCopy}
                                            className="dropdown-item w-full text-left flex items-center gap-2"
                                        >
                                            {copied ? <Check className="w-4 h-4 text-[var(--success)]" /> : <Copy className="w-4 h-4" />}
                                            {copied ? 'Copied!' : 'Copy data'}
                                        </button>
                                        <button
                                            onClick={handleShare}
                                            className="dropdown-item w-full text-left flex items-center gap-2"
                                        >
                                            <Share2 className="w-4 h-4" />
                                            Share
                                        </button>
                                        <button
                                            onClick={handleFullscreen}
                                            className="dropdown-item w-full text-left flex items-center gap-2"
                                        >
                                            <Maximize2 className="w-4 h-4" />
                                            Fullscreen
                                        </button>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
            {children}
        </div>
    );
}
