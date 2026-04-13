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
        <div className="px-4 sm:px-6 py-2.5 bg-status-critical/10 border-b border-status-critical/20">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 flex items-start sm:items-center gap-3">
              <AlertCircle className="w-4 h-4 text-status-critical flex-shrink-0 mt-0.5 sm:mt-0" />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                  <span className="text-xs font-bold tracking-widest text-status-critical uppercase">Critical</span>
                  <span className="text-xs text-muted-foreground">—</span>
                </div>
                <p className="text-sm text-foreground break-words">{criticalAsset.name}: {criticalAsset.diagnosticMessage}</p>
              </div>
            </div>
            <div className="flex items-center justify-between sm:justify-end gap-4 pl-7 sm:pl-0">
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
        </div>
      )}
      {showAnomaly && topAnomalyAsset && (
        <div className="px-4 sm:px-6 py-2.5 bg-warning/5 border-b border-warning/10">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 flex items-start sm:items-center gap-3">
              <Activity className="w-4 h-4 text-warning flex-shrink-0 mt-0.5 sm:mt-0" />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                  <span className="text-xs font-bold tracking-widest text-warning uppercase">
                    {highAnomalies.length === 1 ? 'High Anomaly Detected' : `${highAnomalies.length} High Anomalies Detected`}
                  </span>
                  <span className="text-xs text-muted-foreground">—</span>
                </div>
                <p className="text-sm text-foreground break-words">{topAnomalyAsset.diagnosticMessage} on {topAnomalyAsset.name}</p>
                <p className="text-xs text-muted-foreground">Score: {topAnomalyAsset.anomalyScore.toFixed(2)}</p>
              </div>
            </div>
            <button onClick={() => setShowAnomaly(false)} className="self-end sm:self-auto text-muted-foreground hover:text-foreground transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AlertBanners;
