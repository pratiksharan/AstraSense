export type AssetCategory =
  | 'tank'
  | 'helicopter'
  | 'jet'
  | 'apc'
  | 'mrap'
  | 'uav'
  | 'support';

export interface AssetModelConfig {
  assetKey: string;
  label: string;
  assetType: AssetCategory;
  modelUrl?: string;
  fallbackModelUrl?: string;
  thumbnailUrl: string;
  scale: number;
  rotationSpeed: number;
  has3DModel?: boolean;
  cameraPosition?: [number, number, number];
  fov?: number;
  modelYaw?: number;
  modelPitch?: number;
  modelLift?: number;
}

const CDN_BASE = 'https://cdn.example.com/astrasense-models';

export const assetModelRegistry: Record<string, AssetModelConfig> = {
  'atl-7701': {
    assetKey: 'atl-7701',
    label: 'Heavy Tank Atlas',
    assetType: 'tank',
    modelUrl: '/models/t90am_tank/scene.gltf',
    thumbnailUrl: '/images/tank-atlas.jpg',
    scale: 3.7,
    rotationSpeed: 0.16,
    has3DModel: true,
    cameraPosition: [0, 1.2, 3.85],
    fov: 40,
    modelYaw: 0.25,
    modelPitch: 0.02,
    modelLift: 0,
  },
  'atl-7702': {
    assetKey: 'atl-7702',
    label: 'Heavy Tank Atlas Mk II',
    assetType: 'tank',
    modelUrl: '/models/type10_tank/scene.gltf',
    fallbackModelUrl: '/models/t90am_tank/scene.gltf',
    thumbnailUrl: '/images/tank-atlas-mk2.jpg',
    scale: 3.7,
    rotationSpeed: 0.16,
    has3DModel: true,
    cameraPosition: [0, 1.2, 3.85],
    fov: 40,
    modelYaw: 0.25,
    modelPitch: 0.02,
    modelLift: 0,
  },
  'flc-3301': {
    assetKey: 'flc-3301',
    label: 'Falcon Recon Helicopter',
    assetType: 'helicopter',
    modelUrl: '/models/seahawk_sh60b/scene.gltf',
    thumbnailUrl: '/images/heli-recon.jpg',
    scale: 4.2,
    rotationSpeed: 0.28,
    has3DModel: true,
    cameraPosition: [0, 0.95, 4.8],
    fov: 36,
    modelYaw: -0.35,
    modelPitch: -0.02,
    modelLift: -0.02,
  },
  'flc-3302': {
    assetKey: 'flc-3302',
    label: 'Falcon Utility Helicopter',
    assetType: 'helicopter',
    modelUrl: '/models/army_helicopter/scene.gltf',
    thumbnailUrl: '/images/heli-utility.jpg',
    scale: 4.25,
    rotationSpeed: 0.27,
    has3DModel: true,
    cameraPosition: [0, 0.95, 4.9],
    fov: 35,
    modelYaw: 0.42,
    modelPitch: -0.02,
    modelLift: -0.04,
  },
  'stk-5501': {
    assetKey: 'stk-5501',
    label: 'Striker Jet',
    assetType: 'jet',
    modelUrl: '/models/mig29_fighter/scene.gltf',
    thumbnailUrl: '/images/jet-striker.jpg',
    scale: 4.5,
    rotationSpeed: 0.34,
    has3DModel: true,
    cameraPosition: [0, 0.75, 5.1],
    fov: 34,
    modelYaw: -0.55,
    modelPitch: -0.03,
    modelLift: -0.08,
  },
  'stk-5502': {
    assetKey: 'stk-5502',
    label: 'Striker Interceptor',
    assetType: 'jet',
    thumbnailUrl: '/images/jet-interceptor.jpg',
    scale: 4.3,
    rotationSpeed: 0.25,
    has3DModel: false,
  },
  'rhn-2201': {
    assetKey: 'rhn-2201',
    label: 'Rhino APC Alpha',
    assetType: 'apc',
    thumbnailUrl: '/images/apc-rhino.jpg',
    scale: 3.6,
    rotationSpeed: 0.2,
    has3DModel: false,
  },
  'rhn-2202': {
    assetKey: 'rhn-2202',
    label: 'Rhino APC Bravo',
    assetType: 'apc',
    thumbnailUrl: '/images/apc-rhino-2.jpg',
    scale: 3.6,
    rotationSpeed: 0.2,
    has3DModel: false,
  },
  'vkr-9901': {
    assetKey: 'vkr-9901',
    label: 'Valkyrie MRAP',
    assetType: 'mrap',
    thumbnailUrl: '/images/mrap-valkyrie.jpg',
    scale: 3.4,
    rotationSpeed: 0.2,
    has3DModel: false,
  },
  'vkr-9902': {
    assetKey: 'vkr-9902',
    label: 'Valkyrie MRAP Sentinel',
    assetType: 'mrap',
    thumbnailUrl: '/images/mrap-valkyrie-2.jpg',
    scale: 3.4,
    rotationSpeed: 0.2,
    has3DModel: false,
  },
  'grd-4401': {
    assetKey: 'grd-4401',
    label: 'Guardian UAV',
    assetType: 'uav',
    thumbnailUrl: '/images/uav-guardian.jpg',
    scale: 2.4,
    rotationSpeed: 0.22,
    has3DModel: false,
  },
};

export const getAssetModelConfig = (assetKey?: string): AssetModelConfig | undefined => {
  if (!assetKey) {
    return undefined;
  }

  return assetModelRegistry[assetKey];
};
