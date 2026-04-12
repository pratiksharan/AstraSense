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

  return (
    <div className="mx-4 sm:mx-6 mt-4 rounded-xl bg-card border border-border overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-start sm:items-center justify-between px-4 sm:px-6 py-3.5 hover:bg-secondary/30 transition-colors gap-3"
      >
        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-5 text-left">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            <span className="text-xs font-semibold tracking-[0.15em] uppercase text-muted-foreground">Mission Readiness</span>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-status-normal" />
              <span className="font-semibold">{ready}</span>
              <span className="text-muted-foreground">Ready</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-status-warning" />
              <span className="font-semibold">{caution}</span>
              <span className="text-muted-foreground">Caution</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-status-critical" />
              <span className="font-semibold">{grounded}</span>
              <span className="text-muted-foreground">Grounded</span>
            </span>
          </div>
          <div className="hidden sm:block h-4 w-px bg-border" />
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="text-sm">Score: <strong>{score}</strong></span>
            <span className="text-sm text-muted-foreground">Avg Anomaly: <strong className="text-foreground">{avgAnomaly}</strong></span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wider">
          {expanded ? 'Collapse' : 'Expand'}
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>
      {expanded && (
        <div className="px-4 sm:px-6 pb-4 pt-1 border-t border-border">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-0 mt-2">
            {assets.map(a => (
              <div key={a.id} className="flex items-center justify-between py-1.5 gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                    a.status === 'normal' ? 'bg-status-normal' : a.status === 'warning' ? 'bg-status-warning' : 'bg-status-critical'
                  }`} />
                  <span className="text-[13px] font-medium truncate">{a.name}</span>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className={`text-[10px] font-semibold uppercase tracking-wide ${getDeployColor(a.status)}`}>
                    {getDeployStatus(a.status)}
                  </span>
                  <span className="text-[11px] text-muted-foreground font-mono tabular-nums">{a.readiness}</span>
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
