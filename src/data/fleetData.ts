export type AssetStatus = 'normal' | 'warning' | 'critical';
export type AssetType = 'Tank' | 'APC' | 'MRAP' | 'Helicopter' | 'Jet' | 'Drone' | 'Logistics' | 'Command' | 'Transport';

export interface Asset {
  id: string;
  name: string;
  type: AssetType;
  subtype: string;
  assetId: string;
  status: AssetStatus;
  readiness: number;
  anomalyScore: number;
  diagnosticMessage: string;
  image: string;
  directive: string;
  telemetry: TelemetryRow[];
  timeline: TimelineEvent[];
  diagnosticHeadline: string;
  diagnosticExplanation: string;
  detectionReasons: string[];
  recommendedActions: RecommendedAction[];
}

export interface TelemetryRow {
  metric: string;
  baseline: string;
  current: string;
  drift: string;
}

export interface TimelineEvent {
  time: string;
  event: string;
}

export interface RecommendedAction {
  priority: 'IMMEDIATE' | 'ADVISORY' | 'ROUTINE';
  action: string;
}

export interface ChartDataPoint {
  label: string;
  readiness: number;
  anomalies: number;
}

export const assets: Asset[] = [
  {
    id: 'atl-7701',
    name: 'Heavy Tank Atlas',
    type: 'Tank',
    subtype: 'MAIN BATTLE TANK',
    assetId: 'ATL-7701',
    status: 'normal',
    readiness: 97,
    anomalyScore: 0.03,
    diagnosticMessage: 'All systems are nominal',
    image: '/images/tank-atlas.jpg',
    directive: 'All systems operational. No immediate action required.',
    diagnosticHeadline: 'All Systems Are Nominal',
    diagnosticExplanation: 'All systems operational. No immediate action required.',
    detectionReasons: [
      'All sensor readings within expected baseline ranges',
      'No anomalous patterns detected in recent telemetry',
      'Vibration levels consistent with normal operating conditions',
    ],
    telemetry: [
      { metric: 'Temp', baseline: '174°F', current: '174°F', drift: '— STABLE' },
      { metric: 'RPM', baseline: '2550', current: '2550', drift: '— STABLE' },
      { metric: 'Power', baseline: 'OK', current: 'OK', drift: '— STABLE' },
      { metric: 'Oil Pressure', baseline: '42 psi', current: '42 psi', drift: '— STABLE' },
      { metric: 'Coolant Temp', baseline: '185°F', current: '185°F', drift: '— STABLE' },
      { metric: 'Vibration', baseline: '0.3g', current: '0.3g', drift: '— STABLE' },
    ],
    timeline: [
      { time: '15:22:10', event: 'Normal telemetry update received' },
      { time: '15:30:45', event: 'Systems remain nominal' },
      { time: '15:45:00', event: 'Routine diagnostics passed' },
    ],
    recommendedActions: [
      { priority: 'IMMEDIATE', action: 'Continue standard monitoring' },
      { priority: 'ADVISORY', action: 'No maintenance required at this time' },
      { priority: 'ROUTINE', action: 'Next scheduled inspection in 48 hours' },
    ],
  },
  {
    id: 'atl-7702',
    name: 'Heavy Tank Atlas Mk II',
    type: 'Tank',
    subtype: 'MAIN BATTLE TANK',
    assetId: 'ATL-7702',
    status: 'normal',
    readiness: 94,
    anomalyScore: 0.06,
    diagnosticMessage: 'Operating within optimal parameters',
    image: '/images/tank-atlas-mk2.jpg',
    directive: 'Systems within tolerance. Continue standard operations.',
    diagnosticHeadline: 'Systems Operating Normally',
    diagnosticExplanation: 'All parameters within expected ranges. Minor thermal variance noted but within tolerance.',
    detectionReasons: [
      'Engine performance metrics match baseline profile',
      'No unusual operator behavior patterns detected',
      'All subsystems reporting normal status',
    ],
    telemetry: [
      { metric: 'Temp', baseline: '176°F', current: '178°F', drift: '+1.1%' },
      { metric: 'RPM', baseline: '2600', current: '2590', drift: '— STABLE' },
      { metric: 'Power', baseline: 'OK', current: 'OK', drift: '— STABLE' },
      { metric: 'Oil Pressure', baseline: '44 psi', current: '43 psi', drift: '— STABLE' },
      { metric: 'Coolant Temp', baseline: '182°F', current: '184°F', drift: '+1.1%' },
      { metric: 'Vibration', baseline: '0.3g', current: '0.3g', drift: '— STABLE' },
    ],
    timeline: [
      { time: '14:50:00', event: 'Routine telemetry received' },
      { time: '15:10:30', event: 'All systems nominal' },
      { time: '15:35:00', event: 'Diagnostics check passed' },
    ],
    recommendedActions: [
      { priority: 'IMMEDIATE', action: 'No action required' },
      { priority: 'ROUTINE', action: 'Standard inspection in 72 hours' },
    ],
  },
  {
    id: 'flc-3301',
    name: 'Falcon Recon Helicopter',
    type: 'Helicopter',
    subtype: 'RECON HELICOPTER',
    assetId: 'FLC-3301',
    status: 'warning',
    readiness: 74,
    anomalyScore: 0.34,
    diagnosticMessage: 'Hydraulic pressure fluctuation detected',
    image: '/images/heli-recon.jpg',
    directive: 'Deploy with caution. Hydraulic system requires monitoring.',
    diagnosticHeadline: 'Hydraulic Instability Developing',
    diagnosticExplanation: 'Intermittent pressure drops in primary hydraulic circuit. Pattern suggests early seal degradation.',
    detectionReasons: [
      'Hydraulic pressure variance exceeds baseline by 18%',
      'Pressure oscillation pattern matches known seal wear signature',
      'Flight control response latency increased 12ms',
    ],
    telemetry: [
      { metric: 'Hydraulic Press.', baseline: '3000 psi', current: '2640 psi', drift: '-12.0%' },
      { metric: 'Rotor RPM', baseline: '395', current: '394', drift: '— STABLE' },
      { metric: 'Engine Temp', baseline: '420°F', current: '428°F', drift: '+1.9%' },
      { metric: 'Vibration', baseline: '0.4g', current: '0.5g', drift: '+25.0%' },
      { metric: 'Oil Pressure', baseline: '65 psi', current: '62 psi', drift: '-4.6%' },
      { metric: 'Fuel Flow', baseline: '280 gph', current: '282 gph', drift: '— STABLE' },
    ],
    timeline: [
      { time: '13:45:00', event: 'Hydraulic pressure anomaly first detected' },
      { time: '14:15:30', event: 'Pressure oscillation pattern confirmed' },
      { time: '14:52:00', event: 'Asset flagged for enhanced monitoring' },
    ],
    recommendedActions: [
      { priority: 'IMMEDIATE', action: 'Restrict to non-critical missions only' },
      { priority: 'ADVISORY', action: 'Schedule hydraulic system inspection within 24 hours' },
      { priority: 'ROUTINE', action: 'Order replacement seal kit' },
    ],
  },
  {
    id: 'flc-3302',
    name: 'Falcon Utility Helicopter',
    type: 'Helicopter',
    subtype: 'UTILITY HELICOPTER',
    assetId: 'FLC-3302',
    status: 'normal',
    readiness: 93,
    anomalyScore: 0.04,
    diagnosticMessage: 'All flight systems operational',
    image: '/images/heli-utility.jpg',
    directive: 'Clear for deployment. All systems nominal.',
    diagnosticHeadline: 'Flight Systems Nominal',
    diagnosticExplanation: 'All flight systems operating within parameters. No anomalies detected.',
    detectionReasons: [
      'All avionics responding within normal ranges',
      'Engine performance consistent with baseline',
      'No operator pattern deviations noted',
    ],
    telemetry: [
      { metric: 'Rotor RPM', baseline: '390', current: '391', drift: '— STABLE' },
      { metric: 'Engine Temp', baseline: '415°F', current: '416°F', drift: '— STABLE' },
      { metric: 'Vibration', baseline: '0.4g', current: '0.4g', drift: '— STABLE' },
      { metric: 'Hydraulic Press.', baseline: '3000 psi', current: '2980 psi', drift: '— STABLE' },
      { metric: 'Fuel Flow', baseline: '275 gph', current: '274 gph', drift: '— STABLE' },
      { metric: 'Oil Pressure', baseline: '62 psi', current: '63 psi', drift: '— STABLE' },
    ],
    timeline: [
      { time: '15:00:00', event: 'Routine telemetry update' },
      { time: '15:20:00', event: 'All systems check passed' },
    ],
    recommendedActions: [
      { priority: 'IMMEDIATE', action: 'Continue standard operations' },
      { priority: 'ROUTINE', action: 'Next maintenance window in 96 hours' },
    ],
  },
  {
    id: 'stk-5501',
    name: 'Striker Jet',
    type: 'Jet',
    subtype: 'MULTIROLE FIGHTER',
    assetId: 'STK-5501',
    status: 'warning',
    readiness: 78,
    anomalyScore: 0.38,
    diagnosticMessage: 'Elevated exhaust temperature detected',
    image: '/images/jet-striker.jpg',
    directive: 'Deploy with caution. Engine exhaust variance under review.',
    diagnosticHeadline: 'Engine Thermal Variance Detected',
    diagnosticExplanation: 'Exhaust gas temperature trending 8% above baseline. Consistent with early turbine blade wear.',
    detectionReasons: [
      'EGT readings 8% above historical baseline',
      'Turbine efficiency decreased by 3%',
      'Pattern consistent with Stage 1 blade erosion',
    ],
    telemetry: [
      { metric: 'EGT', baseline: '1180°F', current: '1274°F', drift: '+8.0%' },
      { metric: 'Thrust', baseline: '28,000 lbf', current: '27,200 lbf', drift: '-2.9%' },
      { metric: 'Fuel Flow', baseline: '1100 gph', current: '1145 gph', drift: '+4.1%' },
      { metric: 'Oil Temp', baseline: '195°F', current: '202°F', drift: '+3.6%' },
      { metric: 'Vibration', baseline: '0.2g', current: '0.25g', drift: '+25.0%' },
      { metric: 'Compressor RPM', baseline: '16500', current: '16480', drift: '— STABLE' },
    ],
    timeline: [
      { time: '12:30:00', event: 'EGT variance first flagged' },
      { time: '13:45:00', event: 'Thermal trend confirmed above threshold' },
      { time: '14:20:00', event: 'Asset placed on enhanced monitoring' },
    ],
    recommendedActions: [
      { priority: 'IMMEDIATE', action: 'Limit to short-duration sorties' },
      { priority: 'ADVISORY', action: 'Schedule turbine inspection within 48 hours' },
      { priority: 'ROUTINE', action: 'Review maintenance logs for last 30 days' },
    ],
  },
  {
    id: 'stk-5502',
    name: 'Striker Interceptor',
    type: 'Jet',
    subtype: 'AIR SUPERIORITY FIGHTER',
    assetId: 'STK-5502',
    status: 'normal',
    readiness: 96,
    anomalyScore: 0.05,
    diagnosticMessage: 'All avionics and propulsion nominal',
    image: '/images/jet-interceptor.jpg',
    directive: 'Fully operational. No restrictions.',
    diagnosticHeadline: 'All Systems Nominal',
    diagnosticExplanation: 'Full operational readiness confirmed. All subsystems performing within specifications.',
    detectionReasons: [
      'Propulsion metrics match manufacturer baseline',
      'Avionics suite fully calibrated',
      'No anomalous flight patterns detected',
    ],
    telemetry: [
      { metric: 'EGT', baseline: '1150°F', current: '1155°F', drift: '— STABLE' },
      { metric: 'Thrust', baseline: '30,000 lbf', current: '29,950 lbf', drift: '— STABLE' },
      { metric: 'Fuel Flow', baseline: '1050 gph', current: '1048 gph', drift: '— STABLE' },
      { metric: 'Oil Temp', baseline: '190°F', current: '191°F', drift: '— STABLE' },
      { metric: 'Vibration', baseline: '0.2g', current: '0.2g', drift: '— STABLE' },
      { metric: 'Compressor RPM', baseline: '16800', current: '16790', drift: '— STABLE' },
    ],
    timeline: [
      { time: '15:10:00', event: 'Routine systems check completed' },
      { time: '15:25:00', event: 'All parameters nominal' },
    ],
    recommendedActions: [
      { priority: 'IMMEDIATE', action: 'No action required' },
      { priority: 'ROUTINE', action: 'Standard inspection in 120 hours' },
    ],
  },
  {
    id: 'rhn-2201',
    name: 'Rhino APC',
    type: 'APC',
    subtype: 'ARMORED PERSONNEL CARRIER',
    assetId: 'RHN-2201',
    status: 'normal',
    readiness: 95,
    anomalyScore: 0.02,
    diagnosticMessage: 'All systems operating normally',
    image: '/images/apc-rhino.jpg',
    directive: 'Deploy ready. All systems green.',
    diagnosticHeadline: 'Fully Operational',
    diagnosticExplanation: 'Vehicle performing within all expected parameters. No maintenance required.',
    detectionReasons: [
      'Drivetrain performance consistent with baseline',
      'Armor integrity sensors nominal',
      'Communications array fully operational',
    ],
    telemetry: [
      { metric: 'Engine Temp', baseline: '195°F', current: '196°F', drift: '— STABLE' },
      { metric: 'RPM', baseline: '2200', current: '2200', drift: '— STABLE' },
      { metric: 'Oil Pressure', baseline: '48 psi', current: '47 psi', drift: '— STABLE' },
      { metric: 'Coolant Temp', baseline: '190°F', current: '191°F', drift: '— STABLE' },
      { metric: 'Transmission', baseline: 'OK', current: 'OK', drift: '— STABLE' },
      { metric: 'Battery', baseline: '24.2V', current: '24.1V', drift: '— STABLE' },
    ],
    timeline: [
      { time: '15:05:00', event: 'Telemetry update received' },
      { time: '15:30:00', event: 'All systems nominal' },
    ],
    recommendedActions: [
      { priority: 'IMMEDIATE', action: 'Continue operations' },
      { priority: 'ROUTINE', action: 'Next service in 200 hours' },
    ],
  },
  {
    id: 'rhn-2202',
    name: 'Rhino APC Support',
    type: 'APC',
    subtype: 'APC SUPPORT VARIANT',
    assetId: 'RHN-2202',
    status: 'normal',
    readiness: 91,
    anomalyScore: 0.00,
    diagnosticMessage: 'Systems optimal for deployment',
    image: '/images/apc-rhino-support.jpg',
    directive: 'Fully operational. No issues detected.',
    diagnosticHeadline: 'All Systems Nominal',
    diagnosticExplanation: 'Support systems and primary drivetrain all within parameters.',
    detectionReasons: [
      'All support systems functioning within specifications',
      'No deviations from operator baseline',
      'Equipment readiness confirmed',
    ],
    telemetry: [
      { metric: 'Engine Temp', baseline: '192°F', current: '193°F', drift: '— STABLE' },
      { metric: 'RPM', baseline: '2150', current: '2150', drift: '— STABLE' },
      { metric: 'Oil Pressure', baseline: '46 psi', current: '46 psi', drift: '— STABLE' },
      { metric: 'Coolant Temp', baseline: '188°F', current: '188°F', drift: '— STABLE' },
      { metric: 'Transmission', baseline: 'OK', current: 'OK', drift: '— STABLE' },
      { metric: 'Battery', baseline: '24.0V', current: '24.0V', drift: '— STABLE' },
    ],
    timeline: [
      { time: '14:55:00', event: 'Systems check completed' },
      { time: '15:20:00', event: 'Ready for deployment' },
    ],
    recommendedActions: [
      { priority: 'IMMEDIATE', action: 'No action needed' },
      { priority: 'ROUTINE', action: 'Scheduled maintenance in 180 hours' },
    ],
  },
  {
    id: 'vkr-9901',
    name: 'Valkyrie UAV',
    type: 'Drone',
    subtype: 'RECON DRONE',
    assetId: 'VKR-9901',
    status: 'critical',
    readiness: 32,
    anomalyScore: 0.94,
    diagnosticMessage: 'Communication link degraded',
    image: '/images/drone-valkyrie.jpg',
    directive: 'DO NOT DEPLOY. Communication link severely degraded. Immediate investigation required.',
    diagnosticHeadline: 'Communication Link Degraded',
    diagnosticExplanation: 'Primary communication link experiencing severe signal degradation. Operator baseline mismatch also detected — unusual control input patterns suggest unauthorized access attempt or system compromise.',
    detectionReasons: [
      'Primary comm link signal strength dropped to 23%',
      'Operator input pattern deviates 94% from established baseline',
      'Telemetry packet loss rate exceeds critical threshold at 18%',
    ],
    telemetry: [
      { metric: 'Signal Strength', baseline: '95%', current: '23%', drift: '-75.8%' },
      { metric: 'Packet Loss', baseline: '0.1%', current: '18%', drift: '+17800%' },
      { metric: 'Latency', baseline: '45ms', current: '340ms', drift: '+655.6%' },
      { metric: 'Battery', baseline: '85%', current: '82%', drift: '— STABLE' },
      { metric: 'GPS Lock', baseline: 'OK', current: 'DEGRADED', drift: 'ALERT' },
      { metric: 'Motor Temp', baseline: '125°F', current: '128°F', drift: '— STABLE' },
    ],
    timeline: [
      { time: '13:12:00', event: 'Signal degradation first detected' },
      { time: '13:28:00', event: 'Operator baseline mismatch flagged' },
      { time: '13:45:00', event: 'Asset grounded — DO NOT DEPLOY' },
      { time: '14:02:00', event: 'Investigation team notified' },
    ],
    recommendedActions: [
      { priority: 'IMMEDIATE', action: 'Ground asset immediately — do not redeploy' },
      { priority: 'IMMEDIATE', action: 'Investigate operator access logs' },
      { priority: 'ADVISORY', action: 'Run full communication system diagnostics' },
      { priority: 'ROUTINE', action: 'Review security protocols for drone fleet' },
    ],
  },
  {
    id: 'vkr-9902',
    name: 'Valkyrie Recon Drone',
    type: 'Drone',
    subtype: 'SURVEILLANCE DRONE',
    assetId: 'VKR-9902',
    status: 'normal',
    readiness: 92,
    anomalyScore: 0.08,
    diagnosticMessage: 'Surveillance systems fully operational',
    image: '/images/drone-recon.jpg',
    directive: 'Clear for deployment. All surveillance systems active.',
    diagnosticHeadline: 'Systems Operational',
    diagnosticExplanation: 'All surveillance and flight systems performing within expected parameters.',
    detectionReasons: [
      'Flight telemetry consistent with baseline',
      'Camera systems calibrated and functional',
      'Communication link strong and stable',
    ],
    telemetry: [
      { metric: 'Signal Strength', baseline: '96%', current: '94%', drift: '— STABLE' },
      { metric: 'Battery', baseline: '90%', current: '88%', drift: '— STABLE' },
      { metric: 'Latency', baseline: '42ms', current: '44ms', drift: '— STABLE' },
      { metric: 'Motor Temp', baseline: '120°F', current: '122°F', drift: '— STABLE' },
      { metric: 'GPS Lock', baseline: 'OK', current: 'OK', drift: '— STABLE' },
      { metric: 'Camera Status', baseline: 'OK', current: 'OK', drift: '— STABLE' },
    ],
    timeline: [
      { time: '15:00:00', event: 'Systems check completed successfully' },
      { time: '15:15:00', event: 'All systems nominal' },
    ],
    recommendedActions: [
      { priority: 'IMMEDIATE', action: 'Continue standard operations' },
      { priority: 'ROUTINE', action: 'Lens calibration due in 72 hours' },
    ],
  },
  {
    id: 'grd-4401',
    name: 'Guardian MRAP',
    type: 'MRAP',
    subtype: 'ARMORED TACTICAL VEHICLE',
    assetId: 'GRD-4401',
    status: 'warning',
    readiness: 76,
    anomalyScore: 0.31,
    diagnosticMessage: 'Coolant system pressure dropping',
    image: '/images/mrap-guardian.jpg',
    directive: 'Deploy with caution. Coolant system requires inspection.',
    diagnosticHeadline: 'Cooling Instability Developing',
    diagnosticExplanation: 'Coolant pressure has dropped 15% from baseline. Indicates possible leak or pump degradation.',
    detectionReasons: [
      'Coolant pressure trending below baseline for 6 hours',
      'Engine temperature compensating — trending upward',
      'Pattern matches historical coolant pump failure signature',
    ],
    telemetry: [
      { metric: 'Coolant Press.', baseline: '18 psi', current: '15.3 psi', drift: '-15.0%' },
      { metric: 'Engine Temp', baseline: '210°F', current: '224°F', drift: '+6.7%' },
      { metric: 'Oil Pressure', baseline: '52 psi', current: '50 psi', drift: '-3.8%' },
      { metric: 'RPM', baseline: '2400', current: '2380', drift: '— STABLE' },
      { metric: 'Transmission', baseline: 'OK', current: 'OK', drift: '— STABLE' },
      { metric: 'Battery', baseline: '24.5V', current: '24.3V', drift: '— STABLE' },
    ],
    timeline: [
      { time: '09:30:00', event: 'Coolant pressure drop first noted' },
      { time: '12:15:00', event: 'Trend confirmed — flagged for review' },
      { time: '14:00:00', event: 'Engine temp compensation detected' },
    ],
    recommendedActions: [
      { priority: 'IMMEDIATE', action: 'Limit operational tempo' },
      { priority: 'ADVISORY', action: 'Inspect coolant system within 12 hours' },
      { priority: 'ROUTINE', action: 'Order replacement coolant pump' },
    ],
  },
  {
    id: 'grd-4402',
    name: 'Guardian Signal MRAP',
    type: 'MRAP',
    subtype: 'SIGNAL & COMMS VEHICLE',
    assetId: 'GRD-4402',
    status: 'normal',
    readiness: 90,
    anomalyScore: 0.10,
    diagnosticMessage: 'Communications array fully operational',
    image: '/images/mrap-signal.jpg',
    directive: 'Deploy ready. Signal systems nominal.',
    diagnosticHeadline: 'Comms Systems Nominal',
    diagnosticExplanation: 'All communication arrays operating within specifications. Signal strength optimal.',
    detectionReasons: [
      'Communication arrays transmitting at full capacity',
      'Encryption modules verified and active',
      'No interference patterns detected',
    ],
    telemetry: [
      { metric: 'Signal Output', baseline: '100%', current: '98%', drift: '— STABLE' },
      { metric: 'Engine Temp', baseline: '205°F', current: '207°F', drift: '— STABLE' },
      { metric: 'Power Systems', baseline: 'OK', current: 'OK', drift: '— STABLE' },
      { metric: 'Battery', baseline: '24.8V', current: '24.6V', drift: '— STABLE' },
      { metric: 'Antenna Status', baseline: 'OK', current: 'OK', drift: '— STABLE' },
      { metric: 'Encryption', baseline: 'Active', current: 'Active', drift: '— STABLE' },
    ],
    timeline: [
      { time: '15:10:00', event: 'Communications check passed' },
      { time: '15:25:00', event: 'All arrays nominal' },
    ],
    recommendedActions: [
      { priority: 'IMMEDIATE', action: 'Continue operations' },
      { priority: 'ROUTINE', action: 'Antenna alignment check in 96 hours' },
    ],
  },
  {
    id: 'snt-6601',
    name: 'Sentinel Support Carrier',
    type: 'Logistics',
    subtype: 'SUPPORT CARRIER',
    assetId: 'SNT-6601',
    status: 'normal',
    readiness: 91,
    anomalyScore: 0.00,
    diagnosticMessage: 'Supply systems fully operational',
    image: '/images/logistics-sentinel.jpg',
    directive: 'All supply systems operational. Ready for tasking.',
    diagnosticHeadline: 'Supply Systems Nominal',
    diagnosticExplanation: 'All cargo handling and logistics systems performing within specifications.',
    detectionReasons: [
      'Cargo management systems fully operational',
      'Drivetrain performance consistent',
      'No operator deviations detected',
    ],
    telemetry: [
      { metric: 'Engine Temp', baseline: '188°F', current: '189°F', drift: '— STABLE' },
      { metric: 'RPM', baseline: '1800', current: '1800', drift: '— STABLE' },
      { metric: 'Cargo Systems', baseline: 'OK', current: 'OK', drift: '— STABLE' },
      { metric: 'Fuel Level', baseline: '78%', current: '76%', drift: '— STABLE' },
      { metric: 'Hydraulic Press.', baseline: '2200 psi', current: '2200 psi', drift: '— STABLE' },
      { metric: 'Battery', baseline: '24.0V', current: '24.0V', drift: '— STABLE' },
    ],
    timeline: [
      { time: '14:45:00', event: 'Supply check completed' },
      { time: '15:10:00', event: 'All systems green' },
    ],
    recommendedActions: [
      { priority: 'IMMEDIATE', action: 'No action required' },
      { priority: 'ROUTINE', action: 'Next service in 250 hours' },
    ],
  },
  {
    id: 'lgn-8801',
    name: 'Legion Command Vehicle',
    type: 'Command',
    subtype: 'MOBILE COMMAND POST',
    assetId: 'LGN-8801',
    status: 'normal',
    readiness: 98,
    anomalyScore: 0.01,
    diagnosticMessage: 'Command systems at full capacity',
    image: '/images/command-legion.jpg',
    directive: 'All command and control systems active. Full operational readiness.',
    diagnosticHeadline: 'Command Systems Optimal',
    diagnosticExplanation: 'All C4ISR systems functioning at peak performance. Network connectivity stable.',
    detectionReasons: [
      'Command network uptime at 99.97%',
      'All tactical displays calibrated',
      'Secure communications verified',
    ],
    telemetry: [
      { metric: 'Network Uptime', baseline: '99.9%', current: '99.97%', drift: '— STABLE' },
      { metric: 'Processing Load', baseline: '35%', current: '32%', drift: '— STABLE' },
      { metric: 'Comms Status', baseline: 'OK', current: 'OK', drift: '— STABLE' },
      { metric: 'Power Systems', baseline: 'OK', current: 'OK', drift: '— STABLE' },
      { metric: 'Cooling', baseline: '68°F', current: '69°F', drift: '— STABLE' },
      { metric: 'Battery Backup', baseline: '100%', current: '100%', drift: '— STABLE' },
    ],
    timeline: [
      { time: '15:00:00', event: 'Full systems diagnostic completed' },
      { time: '15:20:00', event: 'All command systems confirmed operational' },
    ],
    recommendedActions: [
      { priority: 'IMMEDIATE', action: 'Continue operations' },
      { priority: 'ROUTINE', action: 'Software update available — schedule during downtime' },
    ],
  },
  {
    id: 'ech-1101',
    name: 'Echo Tactical Transport',
    type: 'Transport',
    subtype: 'TACTICAL TRANSPORT',
    assetId: 'ECH-1101',
    status: 'normal',
    readiness: 92,
    anomalyScore: 0.04,
    diagnosticMessage: 'Transport systems nominal',
    image: '/images/transport-echo.jpg',
    directive: 'Ready for deployment. All transport systems operational.',
    diagnosticHeadline: 'Transport Systems Nominal',
    diagnosticExplanation: 'Drivetrain and cargo systems all operating within expected parameters.',
    detectionReasons: [
      'All transport metrics within baseline',
      'Cargo capacity systems functional',
      'No unusual patterns in operator behavior',
    ],
    telemetry: [
      { metric: 'Engine Temp', baseline: '192°F', current: '193°F', drift: '— STABLE' },
      { metric: 'RPM', baseline: '2000', current: '2010', drift: '— STABLE' },
      { metric: 'Transmission', baseline: 'OK', current: 'OK', drift: '— STABLE' },
      { metric: 'Fuel Level', baseline: '82%', current: '80%', drift: '— STABLE' },
      { metric: 'Suspension', baseline: 'OK', current: 'OK', drift: '— STABLE' },
      { metric: 'Battery', baseline: '24.2V', current: '24.1V', drift: '— STABLE' },
    ],
    timeline: [
      { time: '15:05:00', event: 'Routine check completed' },
      { time: '15:30:00', event: 'All systems nominal' },
    ],
    recommendedActions: [
      { priority: 'IMMEDIATE', action: 'No action required' },
      { priority: 'ROUTINE', action: 'Tire inspection in 48 hours' },
    ],
  },
];

// Chart data generators
function generateChartData(range: string): { data: ChartDataPoint[]; insight: string } {
  switch (range) {
    case '24H':
      return {
        data: Array.from({ length: 24 }, (_, i) => ({
          label: `${i.toString().padStart(2, '0')}:00`,
          readiness: 90.5 + Math.random() * 2,
          anomalies: i === 14 ? 1 : 0,
        })),
        insight: 'Fleet readiness stable at ~91% over 24 hours. One anomaly event detected at 14:00 — under investigation.',
      };
    case '7D':
      return {
        data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d, i) => ({
          label: d,
          readiness: 90.8 + Math.sin(i * 0.5) * 1.2 + Math.random() * 0.5,
          anomalies: i === 4 ? 1 : 0,
        })),
        insight: 'Readiness averaged 91% this week. Single anomaly event on Friday — under review.',
      };
    case '30D': {
      const days30 = Array.from({ length: 30 }, (_, i) => {
        const anomalyDays = [8, 19, 26];
        return {
          label: `${i + 1}`,
          readiness: 89.5 + Math.sin(i * 0.3) * 2 + Math.random() * 1.5,
          anomalies: anomalyDays.includes(i) ? 1 : 0,
        };
      });
      return {
        data: days30,
        insight: 'Average readiness remained above 90% over 30 days. Three isolated anomaly events recorded — all resolved.',
      };
    }
    case '90D': {
      const weeks90 = Array.from({ length: 13 }, (_, i) => {
        const anomalyWeeks = [2, 5, 7, 10, 12];
        return {
          label: `W${i + 1}`,
          readiness: 89 + Math.sin(i * 0.4) * 2.5 + Math.random() * 1.5,
          anomalies: anomalyWeeks.includes(i) ? 1 : 0,
        };
      });
      return {
        data: weeks90,
        insight: 'Fleet performance remained consistent over 90 days. Five anomaly events detected — majority were operator-pattern deviations.',
      };
    }
    case '1Y': {
      const months1y = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((m, i) => {
        const anomalyCounts = [0, 1, 0, 1, 2, 0, 1, 0, 1, 0, 2, 1];
        return {
          label: m,
          readiness: 88.5 + Math.sin(i * 0.5) * 3 + Math.random() * 1.5,
          anomalies: anomalyCounts[i],
        };
      });
      return {
        data: months1y,
        insight: 'Fleet performance remained consistent over 1 year, with occasional operator-pattern deviations. 9 total anomaly events.',
      };
    }
    case '5Y': {
      const quarters5y = Array.from({ length: 20 }, (_, i) => {
        const year = 2022 + Math.floor(i / 4);
        const q = (i % 4) + 1;
        const anomalyCounts = [1, 0, 2, 1, 0, 1, 0, 2, 1, 0, 1, 2, 0, 1, 0, 1, 2, 0, 1, 1];
        return {
          label: `Q${q} '${year.toString().slice(2)}`,
          readiness: 87 + Math.sin(i * 0.3) * 3 + Math.random() * 2,
          anomalies: anomalyCounts[i],
        };
      });
      return {
        data: quarters5y,
        insight: 'Fleet readiness has remained stable between 87–93% over 5 years. 18 total anomaly events distributed across the period.',
      };
    }
    case 'ALL': {
      const years = Array.from({ length: 8 }, (_, i) => {
        const anomalyCounts = [2, 3, 4, 3, 5, 4, 3, 2];
        return {
          label: `${2019 + i}`,
          readiness: 86.5 + Math.sin(i * 0.5) * 3 + Math.random() * 2,
          anomalies: anomalyCounts[i],
        };
      });
      return {
        data: years,
        insight: 'Historical fleet performance shows consistent readiness above 87%. 26 total anomaly events recorded across all operational years.',
      };
    }
    default:
      return generateChartData('7D');
  }
}

export { generateChartData };

export const timeRanges = ['24H', '7D', '30D', '90D', '1Y', '5Y', 'ALL'] as const;
export type TimeRange = typeof timeRanges[number];

export const filterTags = ['All', 'Tank', 'APC', 'MRAP', 'Helicopter', 'Jet', 'Drone', 'Logistics', 'Command', 'Transport', 'Critical', 'Warning', 'Normal'] as const;
export type FilterTag = typeof filterTags[number];

export const sortOptions = [
  { value: 'all', label: 'All Assets' },
  { value: 'critical', label: 'Critical First' },
  { value: 'attention', label: 'Needs Attention' },
  { value: 'operational', label: 'Operational Only' },
  { value: 'highest', label: 'Highest Readiness' },
  { value: 'lowest', label: 'Lowest Readiness' },
] as const;

export const getStatusColor = (status: AssetStatus): string => {
  switch (status) {
    case 'normal': return 'text-status-normal';
    case 'warning': return 'text-status-warning';
    case 'critical': return 'text-status-critical';
  }
};

export const getStatusLabel = (status: AssetStatus): string => {
  switch (status) {
    case 'normal': return 'NORMAL';
    case 'warning': return 'WARNING';
    case 'critical': return 'CRITICAL';
  }
};

export const getDeployStatus = (status: AssetStatus): string => {
  switch (status) {
    case 'normal': return 'DEPLOY READY';
    case 'warning': return 'DEPLOY WITH CAUTION';
    case 'critical': return 'DO NOT DEPLOY';
  }
};

export const getDeployColor = (status: AssetStatus): string => {
  switch (status) {
    case 'normal': return 'text-status-normal';
    case 'warning': return 'text-status-warning';
    case 'critical': return 'text-status-critical';
  }
};
