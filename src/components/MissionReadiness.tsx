import { useState } from 'react';
import { ChevronDown, ChevronUp, Shield } from 'lucide-react';
import { assets, getDeployStatus, getDeployColor } from '@/data/fleetData';

const MissionReadiness = () => {
  const [expanded, setExpanded] = useState(false);

  const ready = assets.filter(a => a.status === 'normal').length;
  const caution = assets.filter(a => a.status === 'warning').length;
  const grounded = assets.filter(a => a.status === 'critical').length;
  const avgAnomaly = (assets.reduce((s, a) => s + a.anomalyScore, 0) / assets.length).toFixed(2);
  const score = Math.round(assets.reduce((s, a) => s + a.readiness, 0) / assets.length);
  const statusSummary = [
    { label: 'Ready', value: ready, dot: 'bg-status-normal' },
    { label: 'Caution', value: caution, dot: 'bg-status-warning' },
    { label: 'Grounded', value: grounded, dot: 'bg-status-critical' },
  ];

  return (
    <div className="mx-4 sm:mx-6 mt-4 rounded-xl bg-card border border-border overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 sm:px-6 py-3.5 hover:bg-secondary/30 transition-colors"
      >
        <div className="sm:hidden text-left">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              <span className="text-xs font-semibold tracking-[0.15em] uppercase text-muted-foreground">Mission Readiness</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground uppercase tracking-wider">
              {expanded ? 'Collapse' : 'Expand'}
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </div>

          <div className="mt-2 grid grid-cols-3 gap-1.5">
            {statusSummary.map(item => (
              <span key={item.label} className="inline-flex items-center justify-center gap-1 rounded-md border border-border/70 bg-secondary/20 px-2 py-1 text-[11px] leading-none">
                <span className={`w-1.5 h-1.5 rounded-full ${item.dot}`} />
                <span className="font-semibold">{item.value}</span>
                <span className="text-muted-foreground">{item.label}</span>
              </span>
            ))}
          </div>

          <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
            <span className="rounded-md border border-border/60 bg-secondary/15 px-2.5 py-1.5">
              Score: <strong>{score}</strong>
            </span>
            <span className="rounded-md border border-border/60 bg-secondary/15 px-2.5 py-1.5 text-muted-foreground">
              Avg Anomaly: <strong className="text-foreground">{avgAnomaly}</strong>
            </span>
          </div>
        </div>

        <div className="hidden sm:flex items-start sm:items-center justify-between gap-4 text-left">
          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-4 lg:gap-5 text-left">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              <span className="text-xs font-semibold tracking-[0.15em] uppercase text-muted-foreground">Mission Readiness</span>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              {statusSummary.map(item => (
                <span key={item.label} className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-secondary/20 px-2.5 py-1 text-xs">
                  <span className={`w-1.5 h-1.5 rounded-full ${item.dot}`} />
                  <span className="font-semibold text-foreground">{item.value}</span>
                  <span className="text-muted-foreground">{item.label}</span>
                </span>
              ))}
            </div>
            <div className="hidden md:block h-4 w-px bg-border" />
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <span className="text-sm">Score: <strong>{score}</strong></span>
              <span className="text-sm text-muted-foreground">Avg Anomaly: <strong className="text-foreground">{avgAnomaly}</strong></span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground uppercase tracking-wider">
            {expanded ? 'Collapse' : 'Expand'}
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </div>
      </button>
      {expanded && (
        <div className="px-4 sm:px-6 pb-4 pt-2 border-t border-border">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-0">
            {assets.map(a => (
              <div key={a.id} className="flex flex-col sm:flex-row sm:items-center justify-between py-2 gap-2 sm:gap-3 border-b border-border/30 last:border-b-0">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                    a.status === 'normal' ? 'bg-status-normal' : a.status === 'warning' ? 'bg-status-warning' : 'bg-status-critical'
                  }`} />
                  <span className="text-[13px] font-medium truncate">{a.name}</span>
                </div>
                <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-3 flex-shrink-0">
                  <span className={`text-[10px] font-semibold uppercase tracking-wide text-right sm:w-[150px] sm:text-right ${getDeployColor(a.status)}`}>
                    {getDeployStatus(a.status)}
                  </span>
                  <span className="text-[11px] text-muted-foreground font-mono tabular-nums sm:w-8 sm:text-right">{a.readiness}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MissionReadiness;
