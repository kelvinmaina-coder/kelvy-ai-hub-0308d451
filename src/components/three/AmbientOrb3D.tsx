import { Canvas, useFrame } from "@react-three/fiber";
import { Suspense, useRef } from "react";
import { MeshDistortMaterial, Sphere } from "@react-three/drei";
import * as THREE from "three";

function Blob({ color, position, scale, speed }: { color: string; position: [number, number, number]; scale: number; speed: number }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime() * speed;
    ref.current.position.x = position[0] + Math.sin(t) * 0.5;
    ref.current.position.y = position[1] + Math.cos(t * 0.8) * 0.4;
  });
  return (
    <Sphere ref={ref} args={[scale, 48, 48]} position={position}>
      <MeshDistortMaterial color={color} distort={0.5} speed={1.2} roughness={0.4} metalness={0.7} transparent opacity={0.55} />
    </Sphere>
  );
}

export default function AmbientOrb3D() {
  return (
    <div className="absolute inset-0 -z-10 opacity-40 pointer-events-none">
      <Canvas dpr={[1, 1.2]} camera={{ position: [0, 0, 8], fov: 50 }} gl={{ antialias: false, alpha: true, powerPreference: "high-performance" }}>
        <Suspense fallback={null}>
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} intensity={1} color="#00ff88" />
          <pointLight position={[-10, -10, -5]} intensity={0.8} color="#00ffff" />
          <Blob color="#00ff88" position={[-2.5, 1, 0]} scale={1.6} speed={0.4} />
          <Blob color="#00ffff" position={[2.5, -1, -1]} scale={1.9} speed={0.3} />
          <Blob color="#ff00ff" position={[0, 2, -2]} scale={1.2} speed={0.5} />
        </Suspense>
      </Canvas>
    </div>
  );
}
