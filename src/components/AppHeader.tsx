import { Activity } from 'lucide-react';

const AppHeader = () => {
  const now = new Date();
  const formatted = now.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }) + ' · ' + now.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between px-6 py-3 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent" />
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-primary relative z-10">
            <circle cx="12" cy="12" r="3" fill="currentColor" opacity="0.9" />
            <circle cx="12" cy="12" r="7" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
            <circle cx="12" cy="12" r="11" stroke="currentColor" strokeWidth="1" opacity="0.25" />
            <line x1="12" y1="1" x2="12" y2="4" stroke="currentColor" strokeWidth="1.5" opacity="0.6" />
            <line x1="12" y1="20" x2="12" y2="23" stroke="currentColor" strokeWidth="1.5" opacity="0.6" />
            <line x1="1" y1="12" x2="4" y2="12" stroke="currentColor" strokeWidth="1.5" opacity="0.6" />
            <line x1="20" y1="12" x2="23" y2="12" stroke="currentColor" strokeWidth="1.5" opacity="0.6" />
          </svg>
        </div>
        <span className="text-[17px] font-semibold tracking-tight">
          Astra<span className="text-primary">Sense</span>
        </span>
      </div>
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 text-primary">
          <Activity className="w-4 h-4 animate-pulse-subtle" />
          <span className="text-sm font-medium tracking-wide">Live Monitoring</span>
        </div>
        <div className="h-4 w-px bg-border" />
        <span className="text-sm text-muted-foreground font-mono">{formatted}</span>
      </div>
    </header>
  );
};

export default AppHeader;
