import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Activity, ArrowDown, ArrowLeft, ArrowUp, Bot, CheckCircle2, Hash, RefreshCw, Tag } from 'lucide-react';
import AppHeader from '@/components/AppHeader';
import TankModelViewer from '@/components/TankModelViewer';
import { assets, getStatusColor, getStatusLabel } from '@/data/fleetData';

type LiveMetricKey = 'temp' | 'rpm' | 'oilPressure' | 'coolantTemp' | 'vibration' | 'other';
type SparkKey = 'temp' | 'rpm' | 'vibration' | 'anomaly';
type TrendDirection = 'up' | 'down' | 'flat';
type RowSeverity = 'normal' | 'watch' | 'critical';
type TelemetryGroup = 'critical' | 'monitored' | 'stable';
type TimelineEventType = 'Detection' | 'Escalation' | 'Action' | 'System' | 'Recovery';
type ActionTier = 'Immediate' | 'Next 15 Min' | 'Follow-up';
type CopilotResponseMode = 'direct_answer' | 'snapshot_report' | 'comparison' | 'action_focused' | 'severity_focused';
type CopilotSeverity = 'NOMINAL' | 'WATCH' | 'WARNING' | 'CRITICAL';

interface SparkMetricSelection {
  tempMetric: string | null;
  rpmMetric: string | null;
  vibrationMetric: string | null;
}

interface ParsedMeasurement {
  value: number;
  prefix: string;
  suffix: string;
  decimals: number;
  grouped: boolean;
}

interface TelemetryAssessment {
  metric: string;
  baseline: string;
  current: string;
  drift: string;
  direction: TrendDirection;
  safeRange: string;
  severity: RowSeverity;
  group: TelemetryGroup;
  risk: number;
}

interface EvidenceBlock {
  title: string;
  observation: string;
  implication: string;
  severity: RowSeverity;
}

interface CopilotAnalysis {
  mode: CopilotResponseMode;
  primaryAnswer: string;
  severity: CopilotSeverity;
  confidence: number;
  supportingPoints: string[];
  recommendedActions: Array<{
    tier: ActionTier;
    action: string;
    reason?: string;
  }>;
  evidence: {
    whatChanged: string[];
    whyItMatters: string[];
    likelyCauses: string[];
  };
}

interface CopilotSource {
  provider: string;
  model: string;
  requestTimestamp: string;
  requestId?: string;
}

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));
const randomBetween = (min: number, max: number): number => Math.random() * (max - min) + min;
const average = (values: number[]): number => {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
};

const formatEventTime = (date: Date): string => {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
};

const parseMeasurement = (value: string): ParsedMeasurement | null => {
  const match = value.match(/^(.*?)(-?\d[\d,]*(?:\.\d+)?)(.*)$/);
  if (!match) {
    return null;
  }

  const rawNumber = match[2];
  const parsedValue = Number(rawNumber.replace(/,/g, ''));
  if (Number.isNaN(parsedValue)) {
    return null;
  }

  return {
    value: parsedValue,
    prefix: match[1],
    suffix: match[3],
    decimals: rawNumber.includes('.') ? rawNumber.split('.')[1].length : 0,
    grouped: rawNumber.includes(','),
  };
};

const formatMeasurement = (measurement: ParsedMeasurement, nextValue: number): string => {
  const rounded = nextValue.toLocaleString('en-US', {
    minimumFractionDigits: measurement.decimals,
    maximumFractionDigits: measurement.decimals,
    useGrouping: measurement.grouped,
  });
  return `${measurement.prefix}${rounded}${measurement.suffix}`;
};

const computeDrift = (baseline: number, current: number): string => {
  if (baseline === 0) {
    return 'Stable';
  }

  const deltaPercent = ((current - baseline) / baseline) * 100;
  if (Math.abs(deltaPercent) < 0.35) {
    return 'Stable';
  }

  const sign = deltaPercent > 0 ? '+' : '-';
  return `${sign}${Math.abs(deltaPercent).toFixed(1)}%`;
};

const getDriftDirection = (drift: string): TrendDirection => {
  if (drift.startsWith('+')) {
    return 'up';
  }
  if (drift.startsWith('-')) {
    return 'down';
  }
  return 'flat';
};

const parseDriftMagnitude = (drift: string): number | undefined => {
  const normalized = drift.trim().toUpperCase();
  if (normalized === 'STABLE' || normalized.includes('STABLE')) {
    return 0;
  }
  if (normalized.includes('ALERT')) {
    return 30;
  }

  const match = drift.trim().match(/^[-+]?(\d+(?:\.\d+)?)%$/);
  if (!match) {
    return undefined;
  }

  return Number(match[1]);
};

const classifyTimelineEvent = (event: string): TimelineEventType => {
  const normalized = event.toLowerCase();

  if (/recover|restored|stabilized|returned to nominal/.test(normalized)) {
    return 'Recovery';
  }
  if (/ground|do not deploy|investigation|isolate|inspect|notified|lockdown/.test(normalized)) {
    return 'Action';
  }
  if (/critical|escalat|flagged|degraded|enhanced monitoring|exceeds/.test(normalized)) {
    return 'Escalation';
  }
  if (/first detected|detected|identified|anomaly/.test(normalized)) {
    return 'Detection';
  }

  return 'System';
};

const shiftTimeLabel = (timeLabel: string, minuteOffset: number): string => {
  const match = timeLabel.match(/^(\d{2}):(\d{2})(?::(\d{2}))?$/);
  if (!match) {
    return timeLabel;
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  const seconds = Number(match[3] ?? '0');
  const totalSeconds = ((hours * 3600 + minutes * 60 + seconds + minuteOffset * 60) % 86400 + 86400) % 86400;

  const nextHours = Math.floor(totalSeconds / 3600)
    .toString()
    .padStart(2, '0');
  const nextMinutes = Math.floor((totalSeconds % 3600) / 60)
    .toString()
    .padStart(2, '0');
  const nextSeconds = Math.floor(totalSeconds % 60)
    .toString()
    .padStart(2, '0');

  return `${nextHours}:${nextMinutes}:${nextSeconds}`;
};

const statusToneClasses: Record<RowSeverity, string> = {
  normal: 'bg-status-normal/15 text-status-normal border-status-normal/30',
  watch: 'bg-status-warning/15 text-status-warning border-status-warning/30',
  critical: 'bg-status-critical/15 text-status-critical border-status-critical/30',
};

const timelineTypeToneClasses: Record<TimelineEventType, string> = {
  Detection: 'bg-primary/15 text-primary border-primary/30',
  Escalation: 'bg-status-warning/15 text-status-warning border-status-warning/30',
  Action: 'bg-status-critical/15 text-status-critical border-status-critical/30',
  System: 'bg-muted text-muted-foreground border-border',
  Recovery: 'bg-status-normal/15 text-status-normal border-status-normal/30',
};

const actionTierToneClasses: Record<ActionTier, string> = {
  Immediate: 'bg-status-critical/15 text-status-critical border-status-critical/30',
  'Next 15 Min': 'bg-status-warning/15 text-status-warning border-status-warning/30',
  'Follow-up': 'bg-primary/15 text-primary border-primary/30',
};

const getMetricKey = (metric: string): LiveMetricKey => {
  const normalized = metric.toLowerCase();
  if (normalized === 'temp' || normalized.includes('engine temp')) {
    return 'temp';
  }
  if (normalized === 'rpm' || normalized === 'rotor rpm') {
    return 'rpm';
  }
  if (normalized.includes('oil pressure')) {
    return 'oilPressure';
  }
  if (normalized.includes('coolant temp')) {
    return 'coolantTemp';
  }
  if (normalized.includes('vibration')) {
    return 'vibration';
  }
  return 'other';
};

const assessTelemetryRow = (row: {
  metric: string;
  baseline: string;
  current: string;
  drift: string;
}): TelemetryAssessment => {
  const metric = row.metric.toLowerCase();
  const baselineValue = parseMeasurement(row.baseline)?.value;
  const currentValue = parseMeasurement(row.current)?.value;
  const driftMagnitude = parseDriftMagnitude(row.drift);

  let safeRange = 'Safe within +/-5% baseline';
  let severity: RowSeverity = 'normal';
  let risk = clamp((driftMagnitude ?? 0) / 20, 0, 1);

  const markCritical = (score: number) => {
    severity = 'critical';
    risk = Math.max(risk, score);
  };

  const markWatch = (score: number) => {
    if (severity !== 'critical') {
      severity = 'watch';
    }
    risk = Math.max(risk, score);
  };

  if (row.current.toUpperCase().includes('DEGRADED') || row.drift.toUpperCase().includes('ALERT')) {
    markCritical(0.95);
  }

  if (metric.includes('signal strength')) {
    safeRange = 'Safe > 70%';
    if (currentValue !== undefined) {
      if (currentValue < 50) {
        markCritical(0.95);
      } else if (currentValue < 70) {
        markWatch(0.65);
      }
      risk = Math.max(risk, clamp((70 - currentValue) / 70, 0, 1));
    }
  } else if (metric.includes('packet loss')) {
    safeRange = 'Safe < 2%';
    if (currentValue !== undefined) {
      if (currentValue > 10) {
        markCritical(0.95);
      } else if (currentValue > 2) {
        markWatch(0.7);
      }
      risk = Math.max(risk, clamp((currentValue - 2) / 20, 0, 1));
    }
  } else if (metric.includes('latency')) {
    safeRange = 'Safe < 120ms';
    if (currentValue !== undefined) {
      if (currentValue > 220) {
        markCritical(0.92);
      } else if (currentValue > 120) {
        markWatch(0.65);
      }
      risk = Math.max(risk, clamp((currentValue - 120) / 260, 0, 1));
    }
  } else if (metric.includes('motor temp')) {
    safeRange = 'Safe < 135F';
    if (currentValue !== undefined) {
      if (currentValue > 150) {
        markCritical(0.86);
      } else if (currentValue > 135) {
        markWatch(0.58);
      }
      risk = Math.max(risk, clamp((currentValue - 135) / 35, 0, 1));
    }
  } else if (metric.includes('battery')) {
    safeRange = 'Safe > 40%';
    if (currentValue !== undefined) {
      if (currentValue < 20) {
        markCritical(0.86);
      } else if (currentValue < 40) {
        markWatch(0.58);
      }
      risk = Math.max(risk, clamp((40 - currentValue) / 40, 0, 1));
    }
  } else if (metric.includes('gps lock') || metric.includes('camera status') || metric.includes('transmission') || metric.includes('power')) {
    safeRange = 'Safe = OK';
    const normalizedCurrent = row.current.toUpperCase();
    if (normalizedCurrent.includes('DEGRADED') || normalizedCurrent.includes('FAIL') || normalizedCurrent.includes('LOST')) {
      markCritical(0.9);
    } else if (normalizedCurrent.includes('WARN') || normalizedCurrent.includes('INTERMITTENT')) {
      markWatch(0.55);
    }
  } else if (metric.includes('engine temp') || metric.includes('coolant temp') || metric.includes('oil temp') || metric === 'temp') {
    safeRange = 'Safe < 205F';
    if (currentValue !== undefined) {
      if (currentValue > 220) {
        markCritical(0.82);
      } else if (currentValue > 205) {
        markWatch(0.55);
      }
      risk = Math.max(risk, clamp((currentValue - 205) / 35, 0, 1));
    }
  } else if (metric.includes('vibration')) {
    safeRange = 'Safe < 0.45g';
    if (currentValue !== undefined) {
      if (currentValue > 0.65) {
        markCritical(0.84);
      } else if (currentValue > 0.45) {
        markWatch(0.58);
      }
      risk = Math.max(risk, clamp((currentValue - 0.45) / 0.3, 0, 1));
    }
  } else if (metric.includes('hydraulic')) {
    safeRange = 'Safe > 2800 psi';
    if (currentValue !== undefined) {
      if (currentValue < 2500) {
        markCritical(0.88);
      } else if (currentValue < 2800) {
        markWatch(0.62);
      }
      risk = Math.max(risk, clamp((2800 - currentValue) / 400, 0, 1));
    }
  } else if (metric.includes('oil pressure')) {
    safeRange = 'Safe > 40 psi';
    if (currentValue !== undefined) {
      if (currentValue < 30) {
        markCritical(0.84);
      } else if (currentValue < 40) {
        markWatch(0.55);
      }
      risk = Math.max(risk, clamp((40 - currentValue) / 20, 0, 1));
    }
  } else if (baselineValue !== undefined && currentValue !== undefined && baselineValue !== 0) {
    const deltaPercent = Math.abs(((currentValue - baselineValue) / baselineValue) * 100);
    safeRange = 'Safe within +/-5% baseline';
    if (deltaPercent > 14) {
      markCritical(0.82);
    } else if (deltaPercent > 6) {
      markWatch(0.58);
    }
    risk = Math.max(risk, clamp(deltaPercent / 22, 0, 1));
  }

  if (severity === 'normal' && driftMagnitude !== undefined && driftMagnitude > 5) {
    markWatch(0.5);
  }

  const group: TelemetryGroup =
    severity === 'critical' ? 'critical' : severity === 'watch' ? 'monitored' : 'stable';

  return {
    metric: row.metric,
    baseline: row.baseline,
    current: row.current,
    drift: row.drift,
    direction: getDriftDirection(row.drift),
    safeRange,
    severity,
    group,
    risk: clamp(risk, 0, 1),
  };
};

const buildEvidenceTitle = (metric: string): string => {
  const normalized = metric.toLowerCase();
  if (normalized.includes('signal strength')) {
    return 'Signal strength collapse';
  }
  if (normalized.includes('packet loss')) {
    return 'Packet loss escalation';
  }
  if (normalized.includes('latency')) {
    return 'Control latency degradation';
  }
  if (normalized.includes('gps lock')) {
    return 'Positioning integrity degraded';
  }
  if (normalized.includes('motor temp')) {
    return 'Motor thermal stress';
  }
  if (normalized.includes('battery')) {
    return 'Power reserve reduction';
  }
  return `${metric} deviation`;
};

const appendSparkPoint = (series: number[], value: number): number[] => {
  const nextSeries = [...series, value];
  return nextSeries.length > 26 ? nextSeries.slice(nextSeries.length - 26) : nextSeries;
};

const getMetricValueFromRowsByName = (
  rows: Array<{ metric: string; current: string }>,
  metricName: string | null,
): number | undefined => {
  if (!metricName) {
    return undefined;
  }

  const targetRow = rows.find(row => row.metric === metricName);
  if (!targetRow) {
    return undefined;
  }

  return parseMeasurement(targetRow.current)?.value;
};

const selectSparkMetrics = (
  rows: Array<{ metric: string; current: string }>,
): SparkMetricSelection => {
  const numericRows = rows.filter(row => parseMeasurement(row.current) !== null);
  const used = new Set<string>();

  const pickMetric = (preferredKeys: LiveMetricKey[]): string | null => {
    for (const preferredKey of preferredKeys) {
      const preferredMatch = numericRows.find(
        row => !used.has(row.metric) && getMetricKey(row.metric) === preferredKey,
      );
      if (preferredMatch) {
        used.add(preferredMatch.metric);
        return preferredMatch.metric;
      }
    }

    const fallback = numericRows.find(row => !used.has(row.metric));
    if (!fallback) {
      return null;
    }

    used.add(fallback.metric);
    return fallback.metric;
  };

  return {
    tempMetric: pickMetric(['temp', 'coolantTemp', 'oilPressure']),
    rpmMetric: pickMetric(['rpm']),
    vibrationMetric: pickMetric(['vibration']),
  };
};

const buildSeedSeries = (center: number): number[] => {
  const jitter = Math.max(Math.abs(center) * 0.004, 0.02);
  return Array.from({ length: 18 }, (_, index) => {
    const phase = index / 17;
    const wave = Math.sin(phase * Math.PI * 1.3) * jitter * 0.45;
    return center + wave;
  });
};

const buildInitialSparkHistory = (
  rows: Array<{ metric: string; current: string }>,
  anomalyScore: number,
  selection: SparkMetricSelection,
): Record<SparkKey, number[]> => {
  const temp = getMetricValueFromRowsByName(rows, selection.tempMetric) ?? 0;
  const rpm = getMetricValueFromRowsByName(rows, selection.rpmMetric) ?? 0;
  const vibration = getMetricValueFromRowsByName(rows, selection.vibrationMetric) ?? 0;

  return {
    temp: buildSeedSeries(temp),
    rpm: buildSeedSeries(rpm),
    vibration: buildSeedSeries(vibration),
    anomaly: buildSeedSeries(anomalyScore),
  };
};

const timelineHeartbeatEvents = [
  'Telemetry heartbeat received',
  'RPM stable within baseline',
  'No anomaly escalation detected',
  'Operator profile consistent',
  'Thermal profile within expected range',
];

const MiniSparkline = ({ data, className = 'h-8' }: { data: number[]; className?: string }) => {
  if (data.length < 2) {
    return <div className={`${className} w-full`} />;
  }

  const stabilized = data.reduce<number[]>((acc, value, index) => {
    if (index === 0) {
      acc.push(value);
      return acc;
    }

    const last = acc[index - 1];
    acc.push(last * 0.2 + value * 0.8);
    return acc;
  }, []);

  const sorted = [...stabilized].sort((a, b) => a - b);
  const lowIndex = Math.floor((sorted.length - 1) * 0.1);
  const highIndex = Math.ceil((sorted.length - 1) * 0.9);
  const lowerBound = sorted[lowIndex];
  const upperBound = sorted[Math.max(lowIndex, highIndex)];
  const compressed = stabilized.map(value => clamp(value, lowerBound, upperBound));

  const min = Math.min(...compressed);
  const max = Math.max(...compressed);
  const range = max - min || 1;
  const center = (max + min) / 2;
  const expandedRange = range * 1.25;
  const displayMin = center - expandedRange / 2;
  const displayRange = expandedRange || 1;

  const chartHeight = 32;
  const topPadding = 4;
  const bottomPadding = 4;
  const usableHeight = chartHeight - topPadding - bottomPadding;

  const points = compressed
    .map((value, index) => {
      const x = (index / (data.length - 1)) * 100;
      const y = topPadding + (1 - (value - displayMin) / displayRange) * usableHeight;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg viewBox="0 0 100 32" preserveAspectRatio="none" className={`${className} w-full`}>
      <polyline
        points={points}
        fill="none"
        stroke="hsl(var(--primary))"
        strokeOpacity="0.95"
        strokeWidth="1.15"
        strokeLinecap="butt"
        strokeLinejoin="miter"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
};

const AnomalyTrendChart = ({ data }: { data: number[] }) => {
  if (data.length < 2) {
    return <div className="h-16 w-full" />;
  }

  const smoothed = data.reduce<number[]>((acc, value, index) => {
    if (index === 0) {
      acc.push(value);
      return acc;
    }

    const previous = acc[index - 1];
    acc.push(previous * 0.62 + value * 0.38);
    return acc;
  }, []);

  const chartHeight = 58;
  const chartTop = 4;
  const chartBottom = chartHeight - 4;
  const warningThreshold = 0.6;
  const criticalThreshold = 0.9;
  const latestValue = smoothed[smoothed.length - 1] ?? 0;
  const minValue = Math.min(...smoothed);
  const maxValue = Math.max(...smoothed);

  let displayMin = 0;
  let displayMax = 1;

  if (latestValue >= criticalThreshold) {
    displayMin = clamp(Math.min(minValue - 0.015, criticalThreshold - 0.06), 0, 0.95);
    displayMax = clamp(Math.max(maxValue + 0.015, criticalThreshold + 0.04), displayMin + 0.09, 1);
  } else if (latestValue >= warningThreshold) {
    displayMin = clamp(Math.min(minValue - 0.02, warningThreshold - 0.08), 0, 0.9);
    displayMax = clamp(Math.max(maxValue + 0.02, warningThreshold + 0.12), displayMin + 0.12, 1);
  } else {
    displayMin = clamp(minValue - 0.02, 0, 0.7);
    displayMax = clamp(Math.max(maxValue + 0.04, 0.25), displayMin + 0.12, 1);
  }

  if (displayMax - displayMin < 0.09) {
    const center = (displayMin + displayMax) / 2;
    displayMin = clamp(center - 0.045, 0, 0.95);
    displayMax = clamp(center + 0.045, displayMin + 0.09, 1);
  }

  const toY = (value: number): number => {
    const normalized = clamp((value - displayMin) / (displayMax - displayMin), 0, 1);
    return chartTop + (1 - normalized) * (chartBottom - chartTop);
  };

  const points = smoothed.map((value, index) => {
    const x = (index / (smoothed.length - 1)) * 100;
    const y = toY(value);
    return { x, y };
  });

  const trendPath = points
    .map((point, index, list) => {
      if (index === 0) {
        return `M ${point.x} ${point.y}`;
      }
      const previous = list[index - 1];
      const controlX = (previous.x + point.x) / 2;
      return `Q ${controlX} ${previous.y}, ${point.x} ${point.y}`;
    })
    .join(' ');

  const trendStroke = latestValue >= criticalThreshold
    ? 'rgba(239,68,68,0.95)'
    : latestValue >= warningThreshold
    ? 'rgba(245,158,11,0.95)'
    : 'hsl(var(--primary))';

  return (
    <svg viewBox={`0 0 100 ${chartHeight}`} preserveAspectRatio="none" className="h-16 w-full">
      <rect x="0" y={chartTop} width="100" height={chartBottom - chartTop} fill="rgba(15,23,42,0.35)" />

      <path
        d={trendPath}
        fill="none"
        stroke={trendStroke}
        strokeOpacity="0.95"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r="1.25" fill={trendStroke} />
    </svg>
  );
};

const VehicleDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const asset = assets.find(a => a.id === id);

  if (!asset) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="flex items-center justify-center h-[60vh]">
          <p className="text-muted-foreground">Asset not found.</p>
        </div>
      </div>
    );
  }

  const statusColor = getStatusColor(asset.status);
  const statusLabel = getStatusLabel(asset.status);

  const initialSparkSelection = useMemo(
    () => selectSparkMetrics(asset.telemetry),
    [asset.telemetry],
  );

  const [liveTelemetryRows, setLiveTelemetryRows] = useState(() => asset.telemetry.map(row => ({ ...row })));
  const [liveAnomalyScore, setLiveAnomalyScore] = useState(asset.anomalyScore);
  const [flashingMetrics, setFlashingMetrics] = useState<Record<string, boolean>>({});
  const [liveTimeline, setLiveTimeline] = useState(() => [...asset.timeline]);
  const [lastSignalAt, setLastSignalAt] = useState(formatEventTime(new Date()));
  const [sparkMetricSelection, setSparkMetricSelection] = useState<SparkMetricSelection>(initialSparkSelection);
  const [sparkHistory, setSparkHistory] = useState<Record<SparkKey, number[]>>(() =>
    buildInitialSparkHistory(asset.telemetry, asset.anomalyScore, initialSparkSelection),
  );
  const [copilotLoading, setCopilotLoading] = useState(false);
  const [copilotError, setCopilotError] = useState<string | null>(null);
  const [copilotResult, setCopilotResult] = useState<CopilotAnalysis | null>(null);
  const [copilotSource, setCopilotSource] = useState<CopilotSource | null>(null);
  const [copilotPrompt, setCopilotPrompt] = useState('');

  const telemetryRowsRef = useRef(liveTelemetryRows);

  useEffect(() => {
    telemetryRowsRef.current = liveTelemetryRows;
  }, [liveTelemetryRows]);

  useEffect(() => {
    const freshRows = asset.telemetry.map(row => ({ ...row }));
    const freshSparkSelection = selectSparkMetrics(freshRows);
    setLiveTelemetryRows(freshRows);
    setLiveAnomalyScore(asset.anomalyScore);
    setFlashingMetrics({});
    setLiveTimeline([...asset.timeline]);
    setLastSignalAt(formatEventTime(new Date()));
    setSparkMetricSelection(freshSparkSelection);
    setSparkHistory(buildInitialSparkHistory(freshRows, asset.anomalyScore, freshSparkSelection));
  }, [asset.id, asset.anomalyScore, asset.telemetry, asset.timeline]);

  useEffect(() => {
    let disposed = false;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const scheduleNext = () => {
      timeoutId = setTimeout(runTick, randomBetween(1400, 2600));
    };

    const runTick = () => {
      if (disposed) {
        return;
      }

      const rowsSnapshot = telemetryRowsRef.current;
      const nextRows = rowsSnapshot.map(row => ({ ...row }));

      const editableRows = nextRows
        .map((row, index) => {
          const parsedCurrent = parseMeasurement(row.current);
          const parsedBaseline = parseMeasurement(row.baseline);
          const key = getMetricKey(row.metric);
          return {
            row,
            index,
            key,
            parsedCurrent,
            parsedBaseline,
          };
        })
        .filter(
          (entry): entry is {
            row: (typeof nextRows)[number];
            index: number;
            key: LiveMetricKey;
            parsedCurrent: ParsedMeasurement;
            parsedBaseline: ParsedMeasurement;
          } => entry.parsedCurrent !== null && entry.parsedBaseline !== null,
        );

      const updatesThisTick = Math.min(editableRows.length, Math.random() < 0.45 ? 3 : 2);
      const selectedRows = [...editableRows].sort(() => Math.random() - 0.5).slice(0, Math.min(updatesThisTick, editableRows.length));

      const changedMetrics: string[] = [];

      selectedRows.forEach(entry => {
        const { parsedCurrent, parsedBaseline, key, row } = entry;
        let nextValue = parsedCurrent.value;

        if (asset.id === 'atl-7701') {
          switch (key) {
            case 'temp':
              nextValue = randomBetween(173, 175);
              break;
            case 'rpm':
              nextValue = randomBetween(2540, 2560);
              break;
            case 'oilPressure':
              nextValue = randomBetween(41, 43);
              break;
            case 'coolantTemp':
              nextValue = randomBetween(184, 186);
              break;
            case 'vibration':
              nextValue = randomBetween(0.29, 0.31);
              break;
            default:
              break;
          }
        } else {
          const statusVolatility = asset.status === 'critical' ? 0.02 : asset.status === 'warning' ? 0.013 : 0.009;
          const metricFactor = key === 'vibration' ? 1.35 : key === 'rpm' ? 0.75 : key === 'other' ? 1.1 : 1;
          const driftRate = statusVolatility * metricFactor;
          const target = parsedCurrent.value * (1 + randomBetween(-driftRate, driftRate));
          nextValue = parsedCurrent.value + (target - parsedCurrent.value) * randomBetween(0.5, 0.85);
        }

        if (parsedCurrent.suffix.includes('%')) {
          nextValue = clamp(nextValue, 0, 100);
        }

        nextValue = Math.max(0, nextValue);

        if (key === 'rpm') {
          nextValue = Math.round(nextValue);
        }

        const minimumDelta = key === 'rpm' ? 1 : parsedCurrent.decimals > 0 ? 0.002 : 0.2;
        if (Math.abs(nextValue - parsedCurrent.value) < minimumDelta) {
          return;
        }

        const nextCurrentText = formatMeasurement(parsedCurrent, nextValue);
        const nextDriftText = computeDrift(parsedBaseline.value, nextValue);

        if (nextCurrentText === row.current && nextDriftText === row.drift) {
          return;
        }

        nextRows[entry.index].current = nextCurrentText;
        nextRows[entry.index].drift = nextDriftText;
        changedMetrics.push(row.metric);
      });

      if (changedMetrics.length > 0) {
        setLiveTelemetryRows(nextRows);
        setFlashingMetrics(prev => {
          const next = { ...prev };
          changedMetrics.forEach(metricName => {
            next[metricName] = true;
            window.setTimeout(() => {
              setFlashingMetrics(existing => ({ ...existing, [metricName]: false }));
            }, 900);
          });
          return next;
        });
      }

      setLiveAnomalyScore(prev => {
        if (asset.id === 'atl-7701') {
          const next = clamp(prev + randomBetween(-0.008, 0.008), 0.02, 0.05);
          return Number(next.toFixed(3));
        }

        const anomalyBand = asset.status === 'critical'
          ? { low: Math.max(0, asset.anomalyScore - 0.12), high: Math.min(1, asset.anomalyScore + 0.03), step: 0.015 }
          : asset.status === 'warning'
          ? { low: Math.max(0, asset.anomalyScore - 0.07), high: Math.min(1, asset.anomalyScore + 0.06), step: 0.01 }
          : { low: Math.max(0, asset.anomalyScore - 0.03), high: Math.min(1, asset.anomalyScore + 0.03), step: 0.006 };

        const next = clamp(prev + randomBetween(-anomalyBand.step, anomalyBand.step), anomalyBand.low, anomalyBand.high);
        return Number(next.toFixed(3));
      });

      setLastSignalAt(formatEventTime(new Date()));
      scheduleNext();
    };

    scheduleNext();

    return () => {
      disposed = true;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [asset.id, asset.anomalyScore]);

  useEffect(() => {
    const temp = getMetricValueFromRowsByName(liveTelemetryRows, sparkMetricSelection.tempMetric);
    const rpm = getMetricValueFromRowsByName(liveTelemetryRows, sparkMetricSelection.rpmMetric);
    const vibration = getMetricValueFromRowsByName(liveTelemetryRows, sparkMetricSelection.vibrationMetric);

    setSparkHistory(prev => ({
      temp: appendSparkPoint(prev.temp, temp ?? prev.temp[prev.temp.length - 1] ?? 0),
      rpm: appendSparkPoint(prev.rpm, rpm ?? prev.rpm[prev.rpm.length - 1] ?? 0),
      vibration: appendSparkPoint(prev.vibration, vibration ?? prev.vibration[prev.vibration.length - 1] ?? 0),
      anomaly: appendSparkPoint(prev.anomaly, liveAnomalyScore),
    }));
  }, [liveTelemetryRows, liveAnomalyScore, sparkMetricSelection]);

  useEffect(() => {
    let disposed = false;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const pushTimelineEvent = () => {
      if (disposed) {
        return;
      }

      const nextEvent = timelineHeartbeatEvents[Math.floor(Math.random() * timelineHeartbeatEvents.length)];
      setLiveTimeline(prev => {
        const updated = [...prev, { time: formatEventTime(new Date()), event: nextEvent }];
        return updated.slice(-20);
      });

      timeoutId = setTimeout(pushTimelineEvent, randomBetween(14000, 22000));
    };

    timeoutId = setTimeout(pushTimelineEvent, randomBetween(12000, 18000));

    return () => {
      disposed = true;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [asset.id]);

  const telemetryAssessments = useMemo<TelemetryAssessment[]>(() => {
    const severityOrder: Record<RowSeverity, number> = {
      critical: 0,
      watch: 1,
      normal: 2,
    };

    return liveTelemetryRows
      .map(row => assessTelemetryRow(row))
      .sort((a, b) => {
        if (severityOrder[a.severity] !== severityOrder[b.severity]) {
          return severityOrder[a.severity] - severityOrder[b.severity];
        }
        return b.risk - a.risk;
      });
  }, [liveTelemetryRows]);

  const telemetryGroups = useMemo(() => {
    return [
      {
        key: 'critical' as TelemetryGroup,
        title: 'Critical Deviations',
        subtitle: 'Immediate operational risk',
        rows: telemetryAssessments.filter(row => row.group === 'critical'),
      },
      {
        key: 'monitored' as TelemetryGroup,
        title: 'Monitored Deviations',
        subtitle: 'Watch and reassess',
        rows: telemetryAssessments.filter(row => row.group === 'monitored'),
      },
      {
        key: 'stable' as TelemetryGroup,
        title: 'Stable Systems',
        subtitle: 'Within healthy tolerance',
        rows: telemetryAssessments.filter(row => row.group === 'stable'),
      },
    ];
  }, [telemetryAssessments]);

  const criticalCount = telemetryAssessments.filter(row => row.severity === 'critical').length;
  const watchCount = telemetryAssessments.filter(row => row.severity === 'watch').length;

  const anomalyLevel = liveAnomalyScore < 0.15 ? 'NOMINAL' : liveAnomalyScore < 0.6 ? 'ELEVATED' : liveAnomalyScore < 0.9 ? 'HIGH' : 'CRITICAL';
  const anomalyLevelColor = liveAnomalyScore < 0.15 ? 'text-status-normal' : liveAnomalyScore < 0.6 ? 'text-status-warning' : 'text-status-critical';
  const anomalyBarWidth = Math.min(liveAnomalyScore * 100, 100);

  const anomalyBreakdown = useMemo(() => {
    const metricRiskByKeywords = (keywords: string[]): number => {
      const matches = telemetryAssessments.filter(row => keywords.some(keyword => row.metric.toLowerCase().includes(keyword)));
      if (matches.length === 0) {
        return 0.15;
      }
      return average(matches.map(row => row.risk));
    };

    const signalRisk = average([
      metricRiskByKeywords(['signal strength']),
      metricRiskByKeywords(['packet loss']),
      metricRiskByKeywords(['gps lock']),
    ]);
    const operatorRisk = clamp(liveAnomalyScore * 0.78 + criticalCount * 0.04 + watchCount * 0.015, 0, 1);
    const controlRisk = average([
      metricRiskByKeywords(['latency']),
      metricRiskByKeywords(['packet loss']),
    ]);

    const weighted = [
      { label: 'Signal anomaly', raw: signalRisk * 0.43 },
      { label: 'Operator-pattern anomaly', raw: operatorRisk * 0.32 },
      { label: 'Control-latency anomaly', raw: controlRisk * 0.25 },
    ];

    const weightedTotal = weighted.reduce((sum, item) => sum + item.raw, 0);
    const scale = weightedTotal > 0 ? liveAnomalyScore / weightedTotal : 1;

    const components = weighted.map(item => ({
      label: item.label,
      value: clamp(item.raw * scale, 0, 1),
    }));

    const confidence = Math.round(clamp(74 + criticalCount * 6 + watchCount * 3 + liveAnomalyScore * 12, 68, 97));

    return {
      components,
      confidence,
    };
  }, [criticalCount, liveAnomalyScore, telemetryAssessments, watchCount]);

  const possibleCauses = useMemo(() => {
    if (liveAnomalyScore < 0.6) {
      return [] as string[];
    }

    const signalComponent = anomalyBreakdown.components.find(component => component.label === 'Signal anomaly')?.value ?? 0;
    const operatorComponent = anomalyBreakdown.components.find(component => component.label === 'Operator-pattern anomaly')?.value ?? 0;
    const controlComponent = anomalyBreakdown.components.find(component => component.label === 'Control-latency anomaly')?.value ?? 0;

    const causes: string[] = [];
    if (operatorComponent > 0.2) {
      causes.push('Likely unauthorized operator pattern or identity-profile mismatch.');
    }
    if (signalComponent > 0.22) {
      causes.push('Likely communication system fault or severe link attenuation.');
    }
    if (controlComponent > 0.18) {
      causes.push('Likely telemetry link instability causing delayed control response.');
    }
    if (telemetryAssessments.some(row => row.metric.toLowerCase().includes('gps lock') && row.severity === 'critical')) {
      causes.push('Potential spoofed or compromised command stream behavior.');
    }

    if (causes.length < 3) {
      causes.push(...asset.detectionReasons.slice(0, 3 - causes.length).map(reason => `${reason}.`));
    }

    return Array.from(new Set(causes)).slice(0, 4);
  }, [anomalyBreakdown.components, asset.detectionReasons, liveAnomalyScore, telemetryAssessments]);

  const evidenceBlocks = useMemo<EvidenceBlock[]>(() => {
    const rankedRows = telemetryAssessments
      .filter(row => row.severity !== 'normal')
      .sort((a, b) => b.risk - a.risk)
      .slice(0, 3);

    const rowsAsEvidence: EvidenceBlock[] = rankedRows.map(row => ({
      title: buildEvidenceTitle(row.metric),
      observation: `${row.metric} moved from ${row.baseline} to ${row.current} (drift ${row.drift}).`,
      implication: `${row.safeRange}. Classified as ${row.severity === 'critical' ? 'Critical' : 'Watch'} based on current operational thresholds.`,
      severity: row.severity,
    }));

    if (liveAnomalyScore >= 0.85) {
      rowsAsEvidence.splice(1, 0, {
        title: 'Operator baseline mismatch',
        observation: `Control-input behavior divergence reached ${Math.round(liveAnomalyScore * 100)}% anomaly intensity from baseline profile.`,
        implication: 'Likely unauthorized or compromised control behavior; operator verification is required before redeployment.',
        severity: 'critical',
      });
    }

    if (rowsAsEvidence.length === 0) {
      return asset.detectionReasons.slice(0, 3).map(reason => ({
        title: 'Diagnostic correlation',
        observation: reason,
        implication: 'Monitor for escalation and validate against the next telemetry cycles.',
        severity: 'watch' as RowSeverity,
      }));
    }

    return rowsAsEvidence.slice(0, 4);
  }, [asset.detectionReasons, liveAnomalyScore, telemetryAssessments]);

  const typedTimelineEvents = useMemo(
    () => liveTimeline.map(event => ({ ...event, type: classifyTimelineEvent(event.event) })),
    [liveTimeline],
  );

  const timelineDisplayEvents = useMemo(
    () => [...typedTimelineEvents].reverse(),
    [typedTimelineEvents],
  );

  const operationalActions = useMemo<Array<{ tier: ActionTier; action: string }>>(() => {
    if (asset.status === 'critical') {
      return [
        { tier: 'Immediate', action: 'Ground asset and maintain mission dispatch lock.' },
        { tier: 'Immediate', action: 'Verify active operator identity and isolate suspect command channels.' },
        { tier: 'Next 15 Min', action: 'Audit operator access logs and validate command-source signatures.' },
        { tier: 'Next 15 Min', action: 'Run telemetry link integrity checks across signal, packet loss, and latency paths.' },
        { tier: 'Follow-up', action: 'Execute full communication subsystem diagnostics and RF interference sweep.' },
        { tier: 'Follow-up', action: 'Rebaseline operator profile only after command integrity is confirmed.' },
      ];
    }

    if (asset.status === 'warning') {
      return [
        { tier: 'Immediate', action: asset.recommendedActions[0]?.action ?? 'Apply mission constraints until metrics stabilize.' },
        { tier: 'Next 15 Min', action: asset.recommendedActions[1]?.action ?? 'Review trend progression and validate subsystem health.' },
        { tier: 'Follow-up', action: asset.recommendedActions[2]?.action ?? 'Schedule targeted maintenance and reassessment.' },
      ];
    }

    return [
      { tier: 'Immediate', action: 'Continue standard monitoring posture.' },
      { tier: 'Next 15 Min', action: 'Confirm trend consistency during next telemetry window.' },
      { tier: 'Follow-up', action: asset.recommendedActions.find(item => item.priority === 'ROUTINE')?.action ?? 'Perform routine inspection on schedule.' },
    ];
  }, [asset.recommendedActions, asset.status]);

  const deploymentState = useMemo(() => {
    if (asset.status === 'critical') {
      return {
        operationalState: 'Grounded',
        deploymentStatus: 'Do Not Deploy',
        posture: 'Critical containment posture active',
      };
    }

    if (asset.status === 'warning') {
      return {
        operationalState: 'Restricted',
        deploymentStatus: 'Deploy With Caution',
        posture: 'Enhanced monitoring in effect',
      };
    }

    return {
      operationalState: 'Operational',
      deploymentStatus: 'Mission Ready',
      posture: 'Nominal operating posture',
    };
  }, [asset.status]);

  const lastStableSnapshot = useMemo(() => {
    const firstIncident = liveTimeline.find(entry => classifyTimelineEvent(entry.event) !== 'System');
    const stableTime = firstIncident ? shiftTimeLabel(firstIncident.time, -4) : shiftTimeLabel(lastSignalAt, -5);
    const stableSignalStrength =
      liveTelemetryRows.find(row => row.metric.toLowerCase().includes('signal strength'))?.baseline ?? 'N/A';

    const operatorMatch = asset.status === 'critical' ? '98%' : asset.status === 'warning' ? '96%' : '99%';

    return {
      time: stableTime,
      signalStrength: stableSignalStrength,
      operatorMatch,
    };
  }, [asset.status, lastSignalAt, liveTelemetryRows, liveTimeline]);

  const runCopilotAnalysis = async () => {
    setCopilotLoading(true);
    setCopilotError(null);
    setCopilotResult(null);
    setCopilotSource(null);

    try {
      const response = await fetch('/api/ai/diagnostics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          asset: {
            id: asset.id,
            name: asset.name,
            type: asset.type,
            subtype: asset.subtype,
            readiness: asset.readiness,
            status: asset.status,
          },
          anomalyScore: liveAnomalyScore,
          anomalyLevel,
          telemetryAssessments,
          timeline: timelineDisplayEvents.slice(0, 12),
          recommendedActions: operationalActions,
          operatorPrompt: copilotPrompt.trim(),
        }),
      });

      const rawBody = await response.text();
      let payload: unknown = null;

      if (rawBody.trim()) {
        try {
          payload = JSON.parse(rawBody);
        } catch {
          throw new Error('AI service returned an invalid response format.');
        }
      }

      const payloadObject = (payload && typeof payload === 'object') ? payload as Record<string, unknown> : null;

      if (!response.ok || payloadObject?.ok !== true) {
        const detailsObject =
          payloadObject?.details && typeof payloadObject.details === 'object'
            ? payloadObject.details as Record<string, unknown>
            : null;
        const detailsError = typeof detailsObject?.error === 'string' ? detailsObject.error : null;
        const backendError = (typeof payloadObject?.error === 'string' ? payloadObject.error : null) || detailsError;

        if (!backendError && !rawBody.trim()) {
          throw new Error('AI service returned an empty response. Confirm the API proxy is running and reachable.');
        }

        throw new Error(backendError || 'AI diagnostics request failed');
      }

      const analysisRaw = payloadObject.analysis as Record<string, unknown> | undefined;
      const sourceRaw = payloadObject.source as Record<string, unknown> | undefined;

      if (!analysisRaw) {
        throw new Error('AI returned unexpected response format');
      }

      if (!sourceRaw || typeof sourceRaw.provider !== 'string' || typeof sourceRaw.model !== 'string' || typeof sourceRaw.requestTimestamp !== 'string') {
        throw new Error('AI service did not return source metadata.');
      }

      const toStringList = (value: unknown): string[] => {
        if (Array.isArray(value)) {
          const items = value
            .filter((item): item is string => typeof item === 'string')
            .map(item => item.trim())
            .filter(Boolean);
          return items;
        }

        if (typeof value === 'string') {
          const single = value.trim();
          return single ? [single] : [];
        }

        return [];
      };

      const normalizeTier = (value: unknown): ActionTier => {
        if (value === 'Immediate' || value === 'Next 15 Min' || value === 'Follow-up') {
          return value;
        }
        return 'Follow-up';
      };

      const recommendedActionsRaw =
        (Array.isArray(analysisRaw.recommendedActions) && analysisRaw.recommendedActions) ||
        (Array.isArray(analysisRaw.nextActions) && analysisRaw.nextActions) ||
        [];

      const normalizedActions = Array.isArray(recommendedActionsRaw)
        ? recommendedActionsRaw
            .filter((step): step is Record<string, unknown> => Boolean(step && typeof step === 'object'))
            .map(step => ({
              tier: normalizeTier(step.tier),
              action: typeof step.action === 'string' ? step.action.trim() : '',
              reason: typeof step.reason === 'string' && step.reason.trim() ? step.reason.trim() : undefined,
            }))
            .filter(step => Boolean(step.action))
        : [];

      const primaryAnswerRaw =
        (typeof analysisRaw.primaryAnswer === 'string' && analysisRaw.primaryAnswer.trim()) ||
        (typeof analysisRaw.primary_answer === 'string' && analysisRaw.primary_answer.trim()) ||
        (typeof analysisRaw.summary === 'string' && analysisRaw.summary.trim()) ||
        '';

      if (!primaryAnswerRaw) {
        throw new Error('AI returned unexpected response format');
      }

      const modeRaw = typeof analysisRaw.mode === 'string' ? analysisRaw.mode.toLowerCase() : 'snapshot_report';
      const normalizedMode: CopilotResponseMode =
        modeRaw === 'direct_answer' ||
        modeRaw === 'snapshot_report' ||
        modeRaw === 'comparison' ||
        modeRaw === 'action_focused' ||
        modeRaw === 'severity_focused'
          ? modeRaw
          : (copilotPrompt.trim() ? 'direct_answer' : 'snapshot_report');

      const severityRaw =
        typeof analysisRaw.severity === 'string'
          ? analysisRaw.severity.toUpperCase()
          : typeof analysisRaw.riskLevel === 'string'
          ? analysisRaw.riskLevel.toUpperCase()
          : 'WARNING';

      const normalizedSeverity: CopilotSeverity =
        severityRaw === 'NOMINAL' || severityRaw === 'WATCH' || severityRaw === 'WARNING' || severityRaw === 'CRITICAL'
          ? severityRaw
          : severityRaw === 'ELEVATED'
          ? 'WATCH'
          : severityRaw === 'HIGH'
          ? 'WARNING'
          : 'WARNING';

      const evidenceRaw = analysisRaw.evidence && typeof analysisRaw.evidence === 'object'
        ? analysisRaw.evidence as Record<string, unknown>
        : null;

      const normalizedAnalysis: CopilotAnalysis = {
        mode: normalizedMode,
        primaryAnswer: primaryAnswerRaw,
        severity: normalizedSeverity,
        confidence: Math.round(clamp(Number(analysisRaw.confidence) || 0, 0, 100)),
        supportingPoints: toStringList(analysisRaw.supportingPoints),
        recommendedActions: normalizedActions,
        evidence: {
          whatChanged: toStringList(evidenceRaw?.whatChanged ?? analysisRaw.whatChanged),
          whyItMatters: toStringList(evidenceRaw?.whyItMatters ?? analysisRaw.whyItMatters),
          likelyCauses: toStringList(evidenceRaw?.likelyCauses ?? analysisRaw.likelyCauses),
        },
      };

      const normalizedSource: CopilotSource = {
        provider: sourceRaw.provider,
        model: sourceRaw.model,
        requestTimestamp: sourceRaw.requestTimestamp,
        requestId: typeof sourceRaw.requestId === 'string' ? sourceRaw.requestId : undefined,
      };

      setCopilotResult({
        ...normalizedAnalysis,
      });
      setCopilotSource(normalizedSource);
    } catch (error) {
      setCopilotResult(null);
      setCopilotSource(null);
      setCopilotError(error instanceof Error ? error.message : 'Failed to run AI diagnostics');
    } finally {
      setCopilotLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <div className="px-6 pt-4 pb-2">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-5"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Fleet
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-6">
          {/* Left Column */}
          <div className="space-y-4">
            <div className="rounded-xl overflow-hidden border border-border">
              <TankModelViewer assetKey={asset.id} fallbackImageUrl={asset.image} />
            </div>
            <div className="rounded-xl bg-card border border-border p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-xl font-bold">{asset.name}</h1>
                  <p className="text-xs tracking-widest text-muted-foreground uppercase mt-0.5">{asset.subtype}</p>
                </div>
                <span className={`flex items-center gap-1.5 text-xs font-bold ${statusColor}`}>
                  <span className={`w-2 h-2 rounded-full ${asset.status === 'normal' ? 'bg-status-normal' : asset.status === 'warning' ? 'bg-status-warning' : 'bg-status-critical'}`} />
                  {statusLabel}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-5">
                <div className="flex items-center gap-2">
                  <Hash className="w-3.5 h-3.5 text-muted-foreground" />
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Asset ID</p>
                    <p className="text-sm font-semibold font-mono">{asset.assetId}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Tag className="w-3.5 h-3.5 text-muted-foreground" />
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Type</p>
                    <p className="text-sm font-semibold">{asset.type}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 text-muted-foreground" />
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Readiness</p>
                    <p className={`text-sm font-bold ${asset.readiness >= 90 ? 'text-status-normal' : asset.readiness >= 70 ? 'text-status-warning' : 'text-status-critical'}`}>
                      {asset.readiness}%
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5 text-muted-foreground" />
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Anomaly Score</p>
                    <p className="text-sm font-bold font-mono">{liveAnomalyScore.toFixed(2)}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-border/70 bg-secondary/20 p-3 mb-4">
                <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground font-semibold mb-2">Deployment Snapshot</p>
                <div className="grid grid-cols-1 gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Operational State</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded border ${asset.status === 'critical' ? 'bg-status-critical/15 text-status-critical border-status-critical/30' : asset.status === 'warning' ? 'bg-status-warning/15 text-status-warning border-status-warning/30' : 'bg-status-normal/15 text-status-normal border-status-normal/30'}`}>
                      {deploymentState.operationalState}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Mission Readiness</span>
                    <span className="text-xs font-semibold font-mono">{asset.readiness}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Deployment Status</span>
                    <span className={`text-xs font-bold ${asset.status === 'critical' ? 'text-status-critical' : asset.status === 'warning' ? 'text-status-warning' : 'text-status-normal'}`}>
                      {deploymentState.deploymentStatus}
                    </span>
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground mt-2">{deploymentState.posture}</p>
              </div>

              <div className="rounded-lg border border-border/70 bg-secondary/20 p-3 mb-4">
                <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground font-semibold mb-2">Last Stable State</p>
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">State Timestamp</span>
                    <span className="font-mono">{lastStableSnapshot.time}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Stable Signal Strength</span>
                    <span className="font-mono">{lastStableSnapshot.signalStrength}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Operator Profile Match</span>
                    <span className="font-mono">{lastStableSnapshot.operatorMatch}</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-border">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5">Directive</p>
                <p className="text-sm text-secondary-foreground">{asset.directive}</p>
                <p className="text-[11px] text-muted-foreground mt-2">Last telemetry heartbeat: {lastSignalAt}</p>
              </div>
            </div>

            {/* Anomaly + Timeline */}
            <div className="space-y-4">
              <div className="rounded-xl bg-card border border-border p-4">
                <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-semibold mb-2">Anomaly Score</p>
                <div className="flex items-baseline gap-2 mb-1.5">
                  <span className="text-2xl font-bold font-mono">{liveAnomalyScore.toFixed(2)}</span>
                  <span className={`text-sm font-bold ${anomalyLevelColor}`}>{anomalyLevel}</span>
                </div>
                <div className="mb-2.5 rounded-md border border-border/70 bg-secondary/20 px-2.5 py-2">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Score Drivers</p>
                    <p className="text-[11px] text-muted-foreground">Confidence {anomalyBreakdown.confidence}%</p>
                  </div>
                  <div className="space-y-1.5">
                    {anomalyBreakdown.components.map(component => (
                      <div key={component.label} className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">{component.label}</span>
                        <span className="font-mono text-secondary-foreground">{component.value.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {possibleCauses.length > 0 && (
                  <div className="mb-2.5 rounded-md border border-status-warning/25 bg-status-warning/5 px-2.5 py-2">
                    <p className="text-[10px] uppercase tracking-widest text-status-warning mb-1.5 font-semibold">Possible Causes</p>
                    <div className="space-y-1">
                      {possibleCauses.map((cause, index) => (
                        <p key={index} className="text-xs text-secondary-foreground">• {cause}</p>
                      ))}
                    </div>
                  </div>
                )}

                <div className="w-full h-1.5 rounded-full bg-secondary overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      liveAnomalyScore < 0.15 ? 'bg-status-normal' : liveAnomalyScore < 0.6 ? 'bg-status-warning' : 'bg-status-critical'
                    }`}
                    style={{ width: `${anomalyBarWidth}%` }}
                  />
                </div>
                <div className="mt-2 rounded-md border border-border/60 bg-secondary/20 px-2 py-1.5">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Recent Trend</p>
                    <p className="text-[10px] text-muted-foreground">Threshold 0.90</p>
                  </div>
                  <AnomalyTrendChart data={sparkHistory.anomaly} />
                </div>
              </div>

              <div className="rounded-xl bg-card border border-border p-5 flex flex-col min-h-0 max-h-[430px] overflow-hidden">
                <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-semibold mb-4">Incident Timeline</p>
                <div className="space-y-4 overflow-y-auto pr-1 pb-1 flex-1 min-h-0">
                  {timelineDisplayEvents.map((event, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="flex flex-col items-center">
                        <div className={`w-2.5 h-2.5 rounded-full border-2 ${i === 0 ? 'bg-primary/70 border-primary/40' : 'bg-muted-foreground/30 border-muted'}`} />
                        {i < timelineDisplayEvents.length - 1 && <div className="w-px h-6 bg-border" />}
                      </div>
                      <div className="-mt-0.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wide mb-1 ${timelineTypeToneClasses[event.type]}`}>
                          {event.type}
                        </span>
                        <p className="text-sm font-medium">{event.event}</p>
                        <p className="text-xs text-muted-foreground font-mono">{event.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            {/* Live Telemetry Strip */}
            <div className="rounded-xl bg-card border border-border p-4">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <p className="text-[10px] uppercase tracking-[0.15em] text-primary font-semibold">Live Telemetry</p>
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/70 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                  </span>
                  telemetry stream active
                </div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mt-1">
                <div className="rounded-md border border-border/70 bg-secondary/25 px-2 py-2">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground truncate" title={sparkMetricSelection.tempMetric ?? 'Metric A'}>
                    {sparkMetricSelection.tempMetric ?? 'Metric A'}
                  </p>
                  <MiniSparkline data={sparkHistory.temp} />
                </div>
                <div className="rounded-md border border-border/70 bg-secondary/25 px-2 py-2">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground truncate" title={sparkMetricSelection.rpmMetric ?? 'Metric B'}>
                    {sparkMetricSelection.rpmMetric ?? 'Metric B'}
                  </p>
                  <MiniSparkline data={sparkHistory.rpm} />
                </div>
                <div className="rounded-md border border-border/70 bg-secondary/25 px-2 py-2">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground truncate" title={sparkMetricSelection.vibrationMetric ?? 'Metric C'}>
                    {sparkMetricSelection.vibrationMetric ?? 'Metric C'}
                  </p>
                  <MiniSparkline data={sparkHistory.vibration} />
                </div>
                <div className="rounded-md border border-border/70 bg-secondary/25 px-2 py-2">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Anomaly</p>
                  <MiniSparkline data={sparkHistory.anomaly} />
                </div>
              </div>
            </div>

            {/* Diagnostic Intelligence */}
            <div className="rounded-xl bg-card border border-border p-5">
              <p className="text-[10px] uppercase tracking-[0.15em] text-primary font-semibold mb-3">Diagnostic Intelligence</p>
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-bold">{asset.diagnosticHeadline}</h2>
              </div>
              <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                asset.status === 'normal' ? 'bg-status-normal/15 text-status-normal' : asset.status === 'warning' ? 'bg-status-warning/15 text-status-warning' : 'bg-status-critical/15 text-status-critical'
              }`}>
                {statusLabel}
              </span>
              <p className="text-sm text-muted-foreground mt-3">{asset.diagnosticExplanation}</p>
            </div>

            {/* AI Copilot */}
            <div className="rounded-xl bg-card border border-border p-5">
              <div className="mb-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[10px] uppercase tracking-[0.15em] text-primary font-semibold">AstraSense AI Copilot</p>
                  <span className="inline-flex items-center gap-1 rounded-md border border-primary/35 bg-primary/10 px-2.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.1em] text-primary">
                    <Bot className="h-2.5 w-2.5" />
                    Live LLM Response
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Real-time interpretation of this vehicle snapshot.</p>
              </div>

              <div className="mb-3">
                <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Operator Prompt (Optional)</label>
                <textarea
                  value={copilotPrompt}
                  onChange={(event) => setCopilotPrompt(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
                      event.preventDefault();
                      if (!copilotLoading) {
                        runCopilotAnalysis();
                      }
                    }
                  }}
                  placeholder="Ask a focused question, e.g. prioritize next 15-minute actions for command-link degradation"
                  className="mt-1 w-full rounded-md border border-border/70 bg-secondary/20 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/80 focus:outline-none focus:ring-1 focus:ring-primary/40"
                  rows={2}
                />
              </div>

              {copilotError && (
                <div className="rounded-md border border-status-critical/30 bg-status-critical/10 px-3 py-2 mb-3">
                  <p className="text-xs text-status-critical font-medium">{copilotError}</p>
                </div>
              )}

              {copilotLoading && (
                <div className="rounded-md border border-primary/25 bg-primary/5 px-3 py-2 mb-3">
                  <p className="text-xs text-primary font-medium">Running live AI analysis...</p>
                </div>
              )}

              {copilotResult && (
                <div className="space-y-3">
                  {copilotSource && (
                    <div className="rounded-md border border-primary/30 bg-primary/5 px-3 py-2">
                      <p className="text-[9px] uppercase tracking-[0.1em] text-primary font-semibold mb-1 inline-flex items-center gap-1"><Bot className="h-2.5 w-2.5" />Live AI Source</p>
                      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-muted-foreground">
                        <p><span className="text-foreground font-medium">Provider:</span> {copilotSource.provider.toUpperCase()}</p>
                        <p><span className="text-foreground font-medium">Model:</span> {copilotSource.model}</p>
                        <p><span className="text-foreground font-medium">Requested:</span> {new Date(copilotSource.requestTimestamp).toLocaleString()}</p>
                        {copilotSource.requestId && <p><span className="text-foreground font-medium">Request ID:</span> <span className="break-all text-[10px]">{copilotSource.requestId}</span></p>}
                      </div>
                    </div>
                  )}

                  <div className="rounded-md border border-border/70 bg-secondary/20 px-3 py-2.5">
                    <div className="flex items-center justify-between gap-3 mb-1">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Primary Answer</p>
                      <span className={`px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wide ${
                        copilotResult.severity === 'CRITICAL'
                          ? 'bg-status-critical/15 text-status-critical border-status-critical/30'
                          : copilotResult.severity === 'WARNING' || copilotResult.severity === 'WATCH'
                          ? 'bg-status-warning/15 text-status-warning border-status-warning/30'
                          : 'bg-status-normal/15 text-status-normal border-status-normal/30'
                      }`}>
                        {copilotResult.severity}
                      </span>
                    </div>
                    <p className="text-sm text-secondary-foreground">{copilotResult.primaryAnswer}</p>
                    <p className="text-[11px] text-muted-foreground mt-1">Confidence: {copilotResult.confidence}%</p>
                    <p className="text-[11px] text-muted-foreground mt-1">Mode: {copilotResult.mode.replace('_', ' ')}</p>
                  </div>

                  {copilotResult.supportingPoints.length > 0 && (
                    <div className="rounded-md border border-border/70 bg-secondary/20 px-3 py-2.5">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">Supporting Points</p>
                      <div className="space-y-1">
                        {copilotResult.supportingPoints.slice(0, 5).map((point, index) => (
                          <p key={index} className="text-xs text-secondary-foreground">• {point}</p>
                        ))}
                      </div>
                    </div>
                  )}

                  {(copilotResult.mode === 'snapshot_report' || copilotResult.mode === 'comparison') && (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="rounded-md border border-border/70 bg-secondary/20 px-3 py-2.5">
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">What Changed</p>
                          {copilotResult.evidence.whatChanged.length > 0 ? (
                            <div className="space-y-1">
                              {copilotResult.evidence.whatChanged.slice(0, 4).map((item, index) => (
                                <p key={index} className="text-xs text-secondary-foreground">• {item}</p>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-muted-foreground">Unavailable in model response.</p>
                          )}
                        </div>
                        <div className="rounded-md border border-border/70 bg-secondary/20 px-3 py-2.5">
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">Why It Matters</p>
                          {copilotResult.evidence.whyItMatters.length > 0 ? (
                            <div className="space-y-1">
                              {copilotResult.evidence.whyItMatters.slice(0, 4).map((item, index) => (
                                <p key={index} className="text-xs text-secondary-foreground">• {item}</p>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-muted-foreground">Unavailable in model response.</p>
                          )}
                        </div>
                      </div>

                      <div className="rounded-md border border-status-warning/25 bg-status-warning/5 px-3 py-2.5">
                        <p className="text-[10px] uppercase tracking-wider text-status-warning mb-1.5">Likely Causes (Hypothesis)</p>
                        {copilotResult.evidence.likelyCauses.length > 0 ? (
                          <div className="space-y-1">
                            {copilotResult.evidence.likelyCauses.slice(0, 4).map((cause, index) => (
                              <p key={index} className="text-xs text-secondary-foreground">• {cause}</p>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground">Unavailable in model response.</p>
                        )}
                      </div>
                    </>
                  )}

                  {copilotResult.mode === 'severity_focused' && (
                    <div className="rounded-md border border-border/70 bg-secondary/20 px-3 py-2.5">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">Severity Assessment</p>
                      {copilotResult.evidence.whyItMatters.length > 0 ? (
                        <div className="space-y-1">
                          {copilotResult.evidence.whyItMatters.slice(0, 4).map((item, index) => (
                            <p key={index} className="text-xs text-secondary-foreground">• {item}</p>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">No additional severity evidence was provided.</p>
                      )}
                    </div>
                  )}

                  <div className="rounded-md border border-border/70 bg-secondary/20 px-3 py-2.5">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">
                      {copilotResult.mode === 'action_focused' ? 'What To Do Now' : 'Recommended Actions'}
                    </p>
                    {copilotResult.recommendedActions.length > 0 ? (
                      <div className="space-y-2">
                        {copilotResult.recommendedActions.slice(0, 5).map((step, index) => (
                          <div key={index} className="flex items-start gap-2">
                            <span className={`shrink-0 px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wide ${actionTierToneClasses[step.tier] || 'bg-primary/15 text-primary border-primary/30'}`}>
                              {step.tier}
                            </span>
                            <div className="min-w-0">
                              <p className="text-xs text-secondary-foreground leading-relaxed break-words">{step.action}</p>
                              {step.reason && <p className="text-[11px] text-muted-foreground mt-0.5">Why: {step.reason}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">Unavailable in model response.</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Why This Was Detected */}
            <div className="rounded-xl bg-card border border-border p-5">
              <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-semibold mb-4">Why This Was Detected</p>
              <div className="space-y-3">
                {evidenceBlocks.map((block, i) => (
                  <div key={i} className="rounded-lg border border-border/70 bg-secondary/20 p-3">
                    <div className="flex items-center justify-between gap-3 mb-1">
                      <p className="text-sm font-semibold text-foreground">{block.title}</p>
                      <span className={`px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wide ${statusToneClasses[block.severity]}`}>
                        {block.severity === 'critical' ? 'Critical' : block.severity === 'watch' ? 'Watch' : 'Normal'}
                      </span>
                    </div>
                    <p className="text-xs text-secondary-foreground">{block.observation}</p>
                    <p className="text-[11px] text-muted-foreground mt-1">{block.implication}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Telemetry Comparison */}
            <div className="rounded-xl bg-card border border-border p-5">
              <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-semibold mb-4">Telemetry Comparison</p>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[820px]">
                  <thead>
                    <tr className="text-[10px] uppercase tracking-widest text-muted-foreground">
                      <th className="text-left pb-3 font-semibold">Metric</th>
                      <th className="text-right pb-3 font-semibold">Baseline</th>
                      <th className="text-right pb-3 font-semibold">Current</th>
                      <th className="text-right pb-3 font-semibold">Safe Range</th>
                      <th className="text-right pb-3 font-semibold">Drift</th>
                      <th className="text-right pb-3 font-semibold">Status</th>
                    </tr>
                  </thead>
                  {telemetryGroups.map(group => (
                    group.rows.length > 0 ? (
                      <tbody key={group.key}>
                        <tr className="border-t border-border/50 bg-secondary/20">
                          <td colSpan={6} className="py-2.5 px-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground font-semibold">{group.title}</span>
                              <span className="text-[11px] text-muted-foreground">{group.subtitle} • {group.rows.length}</span>
                            </div>
                          </td>
                        </tr>
                        {group.rows.map((row, i) => (
                          <tr key={`${group.key}-${row.metric}-${i}`} className="border-t border-border/50">
                            <td className="py-2.5 text-sm font-medium">{row.metric}</td>
                            <td className="py-2.5 text-sm text-muted-foreground text-right">{row.baseline}</td>
                            <td className="py-2.5 text-sm font-semibold text-right">
                              <span className={`inline-flex items-center justify-end gap-1 rounded px-2 py-0.5 transition-all duration-300 ${
                                flashingMetrics[row.metric] ? 'bg-primary/15 text-primary shadow-[0_0_0_1px_hsl(var(--primary)/0.25)]' : ''
                              }`}>
                                {row.direction === 'up' && <ArrowUp className="w-3 h-3 text-status-normal" />}
                                {row.direction === 'down' && <ArrowDown className="w-3 h-3 text-status-critical" />}
                                {row.direction === 'flat' && <span className="w-1.5 h-1.5 rounded-full bg-status-normal" />}
                                {row.current}
                              </span>
                            </td>
                            <td className="py-2.5 text-xs text-right text-muted-foreground">{row.safeRange}</td>
                            <td className="py-2.5 text-xs text-right font-mono">
                              {row.direction === 'flat' ? (
                                <span className="inline-flex items-center gap-1 text-status-normal font-semibold">Stable</span>
                              ) : (
                                <span className={`inline-flex items-center gap-1 font-semibold ${row.direction === 'up' ? 'text-status-normal' : 'text-status-critical'}`}>
                                  {row.direction === 'up' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                                  {row.drift}
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 text-right">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wide ${statusToneClasses[row.severity]}`}>
                                {row.severity === 'critical' ? 'Critical' : row.severity === 'watch' ? 'Watch' : 'Normal'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    ) : null
                  ))}
                </table>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default VehicleDetail;
