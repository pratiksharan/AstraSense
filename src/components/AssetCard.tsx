import { Eye, Flag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Asset } from '@/data/fleetData';
import { getStatusColor, getStatusLabel } from '@/data/fleetData';

interface AssetCardProps {
  asset: Asset;
}

const AssetCard = ({ asset }: AssetCardProps) => {
  const navigate = useNavigate();
  const statusColor = getStatusColor(asset.status);
  const statusLabel = getStatusLabel(asset.status);

  const borderColor = asset.status === 'critical'
    ? 'border-status-critical/40'
    : asset.status === 'warning'
    ? 'border-status-warning/30'
    : 'border-primary/20';

  return (
    <div className={`rounded-xl bg-card border ${borderColor} overflow-hidden group hover:border-primary/40 transition-all duration-300`}>
      {/* Image */}
      <div className="relative h-44 overflow-hidden">
        <img
          src={asset.image}
          alt={asset.name}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
      </div>

      {/* Content */}
      <div className="px-4 pt-3 pb-4">
        <div className="flex items-start justify-between mb-1">
          <div>
            <h3 className="text-sm font-semibold">{asset.name}</h3>
            <p className="text-[10px] tracking-widest text-muted-foreground uppercase">{asset.subtype}</p>
          </div>
          <span className={`text-xs font-bold ${statusColor}`}>{statusLabel}</span>
        </div>

        {/* Diagnostic message */}
        <div className="mt-2.5 px-3 py-2 rounded-lg bg-secondary/60">
          <p className="text-xs text-secondary-foreground">{asset.diagnosticMessage}</p>
        </div>

        {/* Readiness + Anomaly */}
        <div className="flex items-center justify-between mt-3">
          <div className="text-xs text-muted-foreground">
            Readiness <span className={`font-bold ${asset.readiness >= 90 ? 'text-status-normal' : asset.readiness >= 70 ? 'text-status-warning' : 'text-status-critical'}`}>
              {asset.readiness}%
            </span>
          </div>
          <div className="text-xs text-muted-foreground">
            Anomaly <span className={`font-bold font-mono ${asset.anomalyScore >= 0.9 ? 'text-status-critical' : asset.anomalyScore >= 0.6 ? 'text-status-warning' : 'text-foreground'}`}>
              {asset.anomalyScore.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 mt-3">
          <button
            onClick={() => navigate(`/asset/${asset.id}`)}
            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border border-border hover:border-primary/40 hover:bg-primary/5 transition-all text-xs font-medium text-primary"
          >
            <Eye className="w-3.5 h-3.5" />
            View Diagnostics
          </button>
          <button className="p-2 rounded-lg border border-border hover:border-primary/40 hover:bg-primary/5 transition-all text-muted-foreground hover:text-primary">
            <Flag className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssetCard;
