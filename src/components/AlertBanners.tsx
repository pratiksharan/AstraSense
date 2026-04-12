import { AlertCircle, Activity, X, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { assets } from '@/data/fleetData';

const AlertBanners = () => {
  const [showCritical, setShowCritical] = useState(true);
  const [showAnomaly, setShowAnomaly] = useState(true);
  const navigate = useNavigate();
  const criticalAsset = assets.find(asset => asset.status === 'critical');
  const highAnomalies = assets
    .filter(asset => asset.anomalyScore >= 0.9)
    .sort((a, b) => b.anomalyScore - a.anomalyScore);
  const topAnomalyAsset = highAnomalies[0];

  return (
    <div className="space-y-px">
      {showCritical && criticalAsset && (
        <div className="flex items-center justify-between px-6 py-2.5 bg-status-critical/10 border-b border-status-critical/20">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-4 h-4 text-status-critical flex-shrink-0" />
            <span className="text-xs font-bold tracking-widest text-status-critical uppercase">Critical</span>
            <span className="text-xs text-muted-foreground">—</span>
            <span className="text-sm text-foreground">{criticalAsset.name}: {criticalAsset.diagnosticMessage}</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(`/asset/${criticalAsset.id}`)}
              className="flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
            >
              View Report <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => setShowCritical(false)} className="text-muted-foreground hover:text-foreground transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
      {showAnomaly && topAnomalyAsset && (
        <div className="flex items-center justify-between px-6 py-2.5 bg-warning/5 border-b border-warning/10">
          <div className="flex items-center gap-3">
            <Activity className="w-4 h-4 text-warning flex-shrink-0" />
            <span className="text-xs font-bold tracking-widest text-warning uppercase">
              {highAnomalies.length === 1 ? 'High Anomaly Detected' : `${highAnomalies.length} High Anomalies Detected`}
            </span>
            <span className="text-xs text-muted-foreground">—</span>
            <span className="text-sm text-foreground">{topAnomalyAsset.diagnosticMessage} on {topAnomalyAsset.name}</span>
            <span className="text-xs text-muted-foreground ml-1">Score: {topAnomalyAsset.anomalyScore.toFixed(2)}</span>
          </div>
          <button onClick={() => setShowAnomaly(false)} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};

export default AlertBanners;
