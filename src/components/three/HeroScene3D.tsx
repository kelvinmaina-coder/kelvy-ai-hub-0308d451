import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Stars, Icosahedron, MeshDistortMaterial, Torus, OrbitControls } from "@react-three/drei";
import { Suspense, useRef, useMemo } from "react";
import * as THREE from "three";

function CoreOrb() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.rotation.y = clock.getElapsedTime() * 0.35;
    ref.current.rotation.x = Math.sin(clock.getElapsedTime() * 0.4) * 0.2;
  });
  return (
    <Icosahedron ref={ref} args={[1.35, 3]}>
      <MeshDistortMaterial
        color="#00ff88"
        emissive="#00ff88"
        emissiveIntensity={0.55}
        distort={0.42}
        speed={1.6}
        roughness={0.15}
        metalness={0.9}
        wireframe={false}
      />
    </Icosahedron>
  );
}

function WireShell() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.rotation.y = -clock.getElapsedTime() * 0.2;
    ref.current.rotation.z = clock.getElapsedTime() * 0.15;
  });
  return (
    <Icosahedron ref={ref} args={[2.0, 1]}>
      <meshBasicMaterial color="#00ffff" wireframe transparent opacity={0.35} />
    </Icosahedron>
  );
}

function OrbitingNodes() {
  const group = useRef<THREE.Group>(null);
  const nodes = useMemo(() =>
    Array.from({ length: 14 }, (_, i) => ({
      angle: (i / 14) * Math.PI * 2,
      radius: 2.8 + Math.random() * 0.6,
      y: (Math.random() - 0.5) * 1.5,
      speed: 0.3 + Math.random() * 0.4,
      color: ["#00ff88", "#00ffff", "#ff00ff", "#ffaa00"][i % 4],
    })), []);
  useFrame(({ clock }) => {
    if (group.current) group.current.rotation.y = clock.getElapsedTime() * 0.15;
  });
  return (
    <group ref={group}>
      {nodes.map((n, i) => (
        <Float key={i} speed={n.speed * 3} rotationIntensity={0.5} floatIntensity={0.8}>
          <mesh position={[Math.cos(n.angle) * n.radius, n.y, Math.sin(n.angle) * n.radius]}>
            <sphereGeometry args={[0.09, 16, 16]} />
            <meshStandardMaterial color={n.color} emissive={n.color} emissiveIntensity={1.5} />
          </mesh>
        </Float>
      ))}
    </group>
  );
}

function Rings() {
  const g = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!g.current) return;
    g.current.rotation.x = clock.getElapsedTime() * 0.1;
    g.current.rotation.y = clock.getElapsedTime() * 0.2;
  });
  return (
    <group ref={g}>
      <Torus args={[2.3, 0.008, 16, 100]} rotation={[Math.PI / 2, 0, 0]}>
        <meshBasicMaterial color="#00ff88" transparent opacity={0.6} />
      </Torus>
      <Torus args={[2.6, 0.006, 16, 100]} rotation={[Math.PI / 2.4, Math.PI / 6, 0]}>
        <meshBasicMaterial color="#00ffff" transparent opacity={0.5} />
      </Torus>
      <Torus args={[2.9, 0.005, 16, 100]} rotation={[Math.PI / 3, -Math.PI / 4, 0]}>
        <meshBasicMaterial color="#ff00ff" transparent opacity={0.4} />
      </Torus>
    </group>
  );
}

export default function HeroScene3D() {
  return (
    <Canvas
      dpr={[1, 1.5]}
      camera={{ position: [0, 0, 6.5], fov: 50 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
    >
      <Suspense fallback={null}>
        <color attach="background" args={["#00000000"]} />
        <ambientLight intensity={0.35} />
        <pointLight position={[6, 6, 6]} intensity={1.4} color="#00ff88" />
        <pointLight position={[-6, -3, -4]} intensity={1.0} color="#00ffff" />
        <pointLight position={[0, 5, -5]} intensity={0.8} color="#ff00ff" />
        <Stars radius={30} depth={40} count={1200} factor={3} fade speed={0.6} />
        <CoreOrb />
        <WireShell />
        <Rings />
        <OrbitingNodes />
        <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.4} />
      </Suspense>
    </Canvas>
  );
}
