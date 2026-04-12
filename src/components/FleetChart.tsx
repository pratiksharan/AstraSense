import { useState, useMemo } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart, Area } from 'recharts';
import { assets, generateChartData, timeRanges, type TimeRange } from '@/data/fleetData';
import { AlertCircle, AlertTriangle, Activity, Target } from 'lucide-react';

const FleetChart = () => {
  const [range, setRange] = useState<TimeRange>('7D');
  const { data, insight } = useMemo(() => generateChartData(range), [range]);
  const totalAssets = assets.length;
  const cautionAssets = assets.filter(asset => asset.status === 'warning').length;
  const criticalAssets = assets.filter(asset => asset.status === 'critical').length;
  const avgAnomaly = (assets.reduce((sum, asset) => sum + asset.anomalyScore, 0) / assets.length).toFixed(2);

  return (
    <div className="mx-4 sm:mx-6 mt-6 rounded-xl bg-card border border-border overflow-hidden">
      <div className="px-4 sm:px-6 pt-5 pb-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between mb-5">
          <div>
            <h2 className="text-xs font-semibold tracking-[0.15em] uppercase text-muted-foreground">Fleet Performance</h2>
            <p className="text-xs text-muted-foreground/60 mt-0.5">
              {range === '24H' ? '24-hour trend' : range === '7D' ? '7-day trend' : `${range} trend`}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
            {/* Time range controls */}
            <div className="flex items-center bg-secondary rounded-lg p-0.5 w-fit">
              {timeRanges.map(r => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                    r === range
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
            {/* KPI Cluster */}
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 sm:pl-4 sm:border-l border-border">
              <KPI icon={<Target className="w-3.5 h-3.5" />} value={`${totalAssets}`} label="TOTAL" color="text-primary" />
              <KPI icon={<AlertTriangle className="w-3.5 h-3.5" />} value={`${cautionAssets}`} label="CAUTION" color="text-status-warning" />
              <KPI icon={<AlertCircle className="w-3.5 h-3.5" />} value={`${criticalAssets}`} label="CRITICAL" color="text-status-critical" />
              <KPI icon={<Activity className="w-3.5 h-3.5" />} value={avgAnomaly} label="AVG ANOMALY" color="text-primary" />
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
              <defs>
                <linearGradient id="readinessGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(160, 70%, 45%)" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="hsl(160, 70%, 45%)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="hsl(220, 13%, 15%)" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: 'hsl(215, 12%, 45%)', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                dy={8}
              />
              <YAxis
                yAxisId="left"
                domain={[85, 100]}
                tick={{ fill: 'hsl(215, 12%, 45%)', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={v => `${v}%`}
                dx={-5}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                domain={[0, 'auto']}
                tick={{ fill: 'hsl(215, 12%, 45%)', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(220, 18%, 10%)',
                  border: '1px solid hsl(220, 13%, 18%)',
                  borderRadius: '8px',
                  fontSize: '12px',
                  color: 'hsl(210, 20%, 92%)',
                }}
                labelStyle={{ color: 'hsl(215, 12%, 58%)' }}
              />
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="readiness"
                fill="url(#readinessGrad)"
                stroke="none"
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="readiness"
                stroke="hsl(160, 70%, 45%)"
                strokeWidth={2}
                dot={{ r: 3, fill: 'hsl(160, 70%, 45%)', stroke: 'hsl(220, 18%, 10%)', strokeWidth: 2 }}
                activeDot={{ r: 5, fill: 'hsl(160, 70%, 45%)' }}
                name="Fleet Readiness"
              />
              <Bar
                yAxisId="right"
                dataKey="anomalies"
                fill="hsl(38, 92%, 50%)"
                radius={[2, 2, 0, 0]}
                maxBarSize={16}
                opacity={0.85}
                name="Anomaly Count"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Legend + Insight */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mt-3 pt-3 border-t border-border/50">
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-primary rounded-full" />
              <span className="text-xs text-muted-foreground">Fleet Readiness</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-warning" />
              <span className="text-xs text-muted-foreground">Anomaly Count</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground/70 italic max-w-lg sm:text-right">{insight}</p>
        </div>
      </div>
    </div>
  );
};

const KPI = ({ icon, value, label, color }: { icon: React.ReactNode; value: string; label: string; color: string }) => (
  <div className="flex items-center gap-2">
    <div className={`w-7 h-7 rounded-lg bg-secondary flex items-center justify-center ${color}`}>
      {icon}
    </div>
    <div>
      <p className="text-base font-bold font-mono leading-none">{value}</p>
      <p className="text-[10px] tracking-widest text-muted-foreground uppercase mt-0.5">{label}</p>
    </div>
  </div>
);

export default FleetChart;
