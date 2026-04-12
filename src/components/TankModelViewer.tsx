import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, ThreeEvent, useFrame, useLoader } from '@react-three/fiber';
import { Maximize2, Minimize2 } from 'lucide-react';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as THREE from 'three';

interface TankModelViewerProps {
  modelPath: string;
  fallbackModelPath?: string;
  cameraPosition?: [number, number, number];
  fov?: number;
  autoRotateSpeed?: number;
  modelScaleTarget?: number;
  modelYaw?: number;
  modelPitch?: number;
  modelLift?: number;
}

interface ModelErrorBoundaryProps {
  children: React.ReactNode;
  resetKey: string;
  onError: () => void;
}

interface ModelErrorBoundaryState {
  hasError: boolean;
}

class ModelErrorBoundary extends React.Component<ModelErrorBoundaryProps, ModelErrorBoundaryState> {
  state: ModelErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ModelErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(): void {
    this.props.onError();
  }

  componentDidUpdate(prevProps: ModelErrorBoundaryProps): void {
    if (prevProps.resetKey !== this.props.resetKey && this.state.hasError) {
      this.setState({ hasError: false });
    }
  }

  render() {
    if (this.state.hasError) {
      return null;
    }

    return this.props.children;
  }
}

const InteractiveModel = ({
  modelPath,
  autoRotateSpeed = 0.22,
  modelScaleTarget = 3.55,
  modelYaw = 0,
  modelPitch = 0,
  modelLift = 0,
}: TankModelViewerProps) => {
  const gltf = useLoader(GLTFLoader, modelPath);

  const model = useMemo(() => {
    const clone = gltf.scene.clone(true);
    const box = new THREE.Box3().setFromObject(clone);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const maxAxis = Math.max(size.x, size.y, size.z) || 1;
    const scale = modelScaleTarget / maxAxis;

    const sampledCenter = new THREE.Vector3();
    const vertex = new THREE.Vector3();
    let sampledPoints = 0;

    clone.updateMatrixWorld(true);
    clone.traverse(object => {
      if (!(object as THREE.Mesh).isMesh) {
        return;
      }

      const mesh = object as THREE.Mesh;
      const geometry = mesh.geometry as THREE.BufferGeometry;
      const position = geometry.getAttribute('position');

      if (!position || position.count === 0) {
        return;
      }

      const stride = Math.max(1, Math.floor(position.count / 6000));
      for (let i = 0; i < position.count; i += stride) {
        vertex.set(position.getX(i), position.getY(i), position.getZ(i));
        vertex.applyMatrix4(mesh.matrixWorld);
        sampledCenter.add(vertex);
        sampledPoints += 1;
      }
    });

    const massCenterX = sampledPoints > 0 ? sampledCenter.x / sampledPoints : center.x;
    const blendedCenterX = THREE.MathUtils.lerp(center.x, massCenterX, 0.9);

    clone.scale.setScalar(scale);
    clone.position.set(
      -blendedCenterX * scale,
      -center.y * scale + modelLift,
      -center.z * scale,
    );

    clone.traverse(object => {
      if ((object as THREE.Mesh).isMesh) {
        const mesh = object as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
      }
    });

    return clone;
  }, [gltf.scene, modelLift, modelScaleTarget]);

  const autoRotateRef = useRef<THREE.Group>(null);
  const interactionRef = useRef<THREE.Group>(null);
  const dragState = useRef({
    isDragging: false,
    isReturning: false,
    lastX: 0,
    lastY: 0,
    targetX: 0,
    targetY: 0,
  });

  const stopDragging = () => {
    if (!dragState.current.isDragging) {
      return;
    }

    dragState.current.isDragging = false;
    dragState.current.isReturning = true;
  };

  const handlePointerDown = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    dragState.current.isDragging = true;
    dragState.current.isReturning = false;
    dragState.current.lastX = event.clientX;
    dragState.current.lastY = event.clientY;

    const target = event.target as EventTarget & {
      setPointerCapture?: (pointerId: number) => void;
    };
    target.setPointerCapture?.(event.pointerId);
  };

  const handlePointerMove = (event: ThreeEvent<PointerEvent>) => {
    if (!dragState.current.isDragging || !interactionRef.current) {
      return;
    }

    event.stopPropagation();
    const deltaX = event.clientX - dragState.current.lastX;

    dragState.current.lastX = event.clientX;
    dragState.current.lastY = event.clientY;

    dragState.current.targetY += deltaX * 0.006;
  };

  const handlePointerUp = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    const target = event.target as EventTarget & {
      releasePointerCapture?: (pointerId: number) => void;
    };
    target.releasePointerCapture?.(event.pointerId);
    stopDragging();
  };

  useEffect(() => {
    const onGlobalPointerUp = () => {
      if (!dragState.current.isDragging) {
        return;
      }

      dragState.current.isDragging = false;
      dragState.current.isReturning = true;
    };

    window.addEventListener('pointerup', onGlobalPointerUp);
    window.addEventListener('pointercancel', onGlobalPointerUp);

    return () => {
      window.removeEventListener('pointerup', onGlobalPointerUp);
      window.removeEventListener('pointercancel', onGlobalPointerUp);
    };
  }, []);

  useFrame((state, delta) => {
    if (!autoRotateRef.current || !interactionRef.current) {
      return;
    }

    const elapsed = state.clock.getElapsedTime();

    if (!dragState.current.isDragging) {
      autoRotateRef.current.rotation.y += delta * autoRotateSpeed;
    }

    const idleXTilt = modelPitch + Math.sin(elapsed * 0.45) * 0.055;
    autoRotateRef.current.rotation.x = THREE.MathUtils.damp(autoRotateRef.current.rotation.x, idleXTilt, 2.2, delta);

    interactionRef.current.rotation.x = THREE.MathUtils.damp(interactionRef.current.rotation.x, dragState.current.targetX, 12, delta);
    interactionRef.current.rotation.y = THREE.MathUtils.damp(interactionRef.current.rotation.y, dragState.current.targetY, 12, delta);

    if (!dragState.current.isDragging && dragState.current.isReturning) {
      dragState.current.targetX = THREE.MathUtils.damp(dragState.current.targetX, 0, 5.2, delta);
      dragState.current.targetY = THREE.MathUtils.damp(dragState.current.targetY, 0, 5.2, delta);

      const settled =
        Math.abs(dragState.current.targetX) < 0.01 &&
        Math.abs(dragState.current.targetY) < 0.01;

      if (settled) {
        dragState.current.targetX = 0;
        dragState.current.targetY = 0;
        interactionRef.current.rotation.set(0, 0, 0);
        dragState.current.isReturning = false;
      }
    }
  });

  return (
    <group ref={autoRotateRef} position={[0, 0.4, 0]} rotation={[modelPitch, modelYaw, 0]}>
      <group
        ref={interactionRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <primitive object={model} />
      </group>
    </group>
  );
};

const TankModelViewer = ({
  modelPath,
  fallbackModelPath,
  cameraPosition = [0, 1.25, 3.7],
  fov = 40,
  autoRotateSpeed = 0.22,
  modelScaleTarget = 3.55,
  modelYaw = 0,
  modelPitch = 0,
  modelLift = 0,
}: TankModelViewerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeModelPath, setActiveModelPath] = useState(modelPath);
  const [usedFallback, setUsedFallback] = useState(false);
  const [modelError, setModelError] = useState<string | null>(null);

  useEffect(() => {
    setActiveModelPath(modelPath);
    setUsedFallback(false);
    setModelError(null);
  }, [modelPath, fallbackModelPath]);

  const handleModelError = () => {
    if (!usedFallback && fallbackModelPath) {
      setUsedFallback(true);
      setActiveModelPath(fallbackModelPath);
      setModelError('Primary model failed to load. Switched to backup model.');
      return;
    }

    setModelError('Unable to load this 3D model.');
  };

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === containerRef.current);
    };

    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', onFullscreenChange);
    };
  }, []);

  const toggleFullscreen = async () => {
    if (!containerRef.current) {
      return;
    }

    if (document.fullscreenElement === containerRef.current) {
      await document.exitFullscreen();
      return;
    }

    await containerRef.current.requestFullscreen();
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full overflow-hidden bg-surface-overlay ${
        isFullscreen ? 'h-screen rounded-none border-0' : 'h-64 md:h-72 rounded-2xl border border-primary/25'
      }`}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-35"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(52, 211, 153, 0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(52, 211, 153, 0.05) 1px, transparent 1px)',
          backgroundSize: '26px 26px',
        }}
      />
      <div className="pointer-events-none absolute inset-[1px] rounded-[inherit] border border-white/10" />
      <div className="pointer-events-none absolute inset-0 rounded-[inherit] ring-1 ring-primary/20" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-primary/15 to-transparent" />
      <button
        type="button"
        onClick={toggleFullscreen}
        aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
        className="absolute top-3 right-3 z-20 inline-flex items-center justify-center rounded-md border border-border/70 bg-background/70 p-2 text-foreground hover:bg-background/90 transition-colors"
      >
        {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
      </button>
      <Canvas camera={{ position: cameraPosition, fov }} dpr={[1, 1.5]}>
        <ambientLight intensity={0.65} />
        <hemisphereLight intensity={0.45} color="#ffffff" groundColor="#1a1f2a" />
        <directionalLight position={[4, 6, 5]} intensity={1.1} />
        <directionalLight position={[-5, 3, -4]} intensity={0.45} />
        <ModelErrorBoundary resetKey={activeModelPath} onError={handleModelError}>
          <Suspense fallback={null}>
            <InteractiveModel
              modelPath={activeModelPath}
              autoRotateSpeed={autoRotateSpeed}
              modelScaleTarget={modelScaleTarget}
              modelYaw={modelYaw}
              modelPitch={modelPitch}
              modelLift={modelLift}
            />
          </Suspense>
        </ModelErrorBoundary>
      </Canvas>
      {modelError && (
        <div className="absolute left-2 right-2 top-2 z-20 rounded-md border border-amber-500/40 bg-amber-950/50 px-2 py-1.5">
          <p className="text-[11px] text-amber-100 text-center">{modelError}</p>
        </div>
      )}
      <div className="absolute left-2 right-2 bottom-2 z-20 rounded-md border border-border/60 bg-background/70 px-2 py-1.5">
        <p className="text-[11px] text-muted-foreground text-center">drag to inspect in 3d</p>
      </div>
    </div>
  );
};

export default TankModelViewer;
