import { Canvas, useFrame } from "@react-three/fiber";
import { Suspense, useMemo, useRef } from "react";
import { OrbitControls, Html, Line, Float } from "@react-three/drei";
import * as THREE from "three";

interface Device { name: string; ip: string; status: string; type?: string; }

const statusColor = (s: string) =>
  s === "online" ? "#00ff88" : s === "suspicious" || s === "rogue" ? "#ff0055" : "#666";

function Node({ pos, device, onClick }: { pos: [number, number, number]; device: Device; onClick?: () => void }) {
  const ref = useRef<THREE.Mesh>(null);
  const color = statusColor(device.status);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime();
    const s = 1 + Math.sin(t * 2 + pos[0]) * 0.05;
    ref.current.scale.setScalar(s);
  });
  return (
    <Float speed={2} rotationIntensity={0.4} floatIntensity={0.5}>
      <mesh ref={ref} position={pos} onClick={onClick}>
        <icosahedronGeometry args={[0.32, 1]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.2} metalness={0.7} roughness={0.2} />
        <Html distanceFactor={10} position={[0, 0.5, 0]} center>
          <div className="pointer-events-none text-[9px] font-mono px-1.5 py-0.5 rounded bg-background/80 border border-border text-foreground whitespace-nowrap">
            {device.name}
          </div>
        </Html>
      </mesh>
    </Float>
  );
}

function CenterHub() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (ref.current) ref.current.rotation.y = clock.getElapsedTime() * 0.5;
  });
  return (
    <mesh ref={ref}>
      <octahedronGeometry args={[0.55, 0]} />
      <meshStandardMaterial color="#00ffff" emissive="#00ffff" emissiveIntensity={1.5} wireframe />
    </mesh>
  );
}

export default function NetworkTopology3D({ devices }: { devices: Device[] }) {
  const positions = useMemo(() => {
    const n = Math.max(devices.length, 1);
    return devices.map((_, i) => {
      const phi = Math.acos(-1 + (2 * i) / n);
      const theta = Math.sqrt(n * Math.PI) * phi;
      const r = 3;
      return [r * Math.cos(theta) * Math.sin(phi), r * Math.sin(theta) * Math.sin(phi), r * Math.cos(phi)] as [number, number, number];
    });
  }, [devices]);

  return (
    <Canvas dpr={[1, 1.5]} camera={{ position: [0, 2, 8], fov: 55 }} gl={{ antialias: true, alpha: true }}>
      <Suspense fallback={null}>
        <ambientLight intensity={0.4} />
        <pointLight position={[10, 10, 10]} intensity={1.2} color="#00ff88" />
        <pointLight position={[-8, -4, -4]} intensity={0.8} color="#ff00ff" />
        <CenterHub />
        {positions.map((p, i) => (
          <group key={devices[i].ip}>
            <Line points={[[0, 0, 0], p]} color={statusColor(devices[i].status)} lineWidth={1} transparent opacity={0.35} />
            <Node pos={p} device={devices[i]} />
          </group>
        ))}
        <OrbitControls enablePan={false} autoRotate autoRotateSpeed={0.6} maxDistance={14} minDistance={5} />
      </Suspense>
    </Canvas>
  );
}
