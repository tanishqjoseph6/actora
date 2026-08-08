"use client";

import { Float, RoundedBox } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Group, Mesh } from "three";
import { MathUtils } from "three";

type Hero3DSceneProps = {
  reducedMotion?: boolean | null;
};

const OBJECTS = [
  { label: "EMAIL", position: [-2.9, 1.2, 0.2] as const, color: "#60A5FA", kind: "mail" },
  { label: "CRM", position: [2.7, 1.1, -0.4] as const, color: "#818CF8", kind: "folder" },
  { label: "TASKS", position: [-3, -1.1, -0.3] as const, color: "#93C5FD", kind: "task" },
  { label: "CALENDAR", position: [2.8, -1.1, 0.1] as const, color: "#38BDF8", kind: "calendar" },
  { label: "AI", position: [0, 2.15, -0.4] as const, color: "#BFDBFE", kind: "orb" },
  { label: "API", position: [-1.85, -2.05, 0.1] as const, color: "#2563EB", kind: "cube" },
  { label: "FILES", position: [1.75, -2.05, -0.1] as const, color: "#67E8F9", kind: "cloud" },
] as const;

function GlassMaterial({ color, opacity = 0.74 }: { color: string; opacity?: number }) {
  return (
    <meshPhysicalMaterial
      color={color}
      transparent
      opacity={opacity}
      roughness={0.18}
      metalness={0.24}
      clearcoat={0.8}
      clearcoatRoughness={0.2}
      emissive={color}
      emissiveIntensity={0.12}
    />
  );
}

function FloatingObject({
  position,
  color,
  kind,
  reducedMotion,
}: {
  position: readonly [number, number, number];
  color: string;
  kind: string;
  reducedMotion?: boolean | null;
}) {
  const mesh = useRef<Mesh>(null);

  useFrame((state) => {
    if (!mesh.current || reducedMotion) return;
    mesh.current.rotation.y += 0.0025;
    mesh.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.45 + position[0]) * 0.08;
  });

  if (kind === "orb") {
    return (
      <Float speed={reducedMotion ? 0 : 1.2} rotationIntensity={0.2} floatIntensity={0.5}>
        <mesh ref={mesh} position={position}>
          <icosahedronGeometry args={[0.42, 3]} />
          <GlassMaterial color={color} opacity={0.82} />
        </mesh>
        <mesh position={[position[0], position[1], position[2] - 0.02]} scale={1.22}>
          <sphereGeometry args={[0.42, 24, 24]} />
          <meshBasicMaterial color={color} transparent opacity={0.08} />
        </mesh>
      </Float>
    );
  }

  if (kind === "cloud") {
    return (
      <Float speed={reducedMotion ? 0 : 1.1} rotationIntensity={0.25} floatIntensity={0.65}>
        <group ref={mesh as unknown as React.RefObject<Group>} position={position}>
          <mesh position={[-0.18, 0, 0]}>
            <sphereGeometry args={[0.22, 16, 16]} />
            <GlassMaterial color={color} />
          </mesh>
          <mesh position={[0.12, 0.04, 0]}>
            <sphereGeometry args={[0.3, 16, 16]} />
            <GlassMaterial color={color} />
          </mesh>
          <mesh position={[0.36, -0.04, 0]}>
            <sphereGeometry args={[0.18, 16, 16]} />
            <GlassMaterial color={color} />
          </mesh>
        </group>
      </Float>
    );
  }

  if (kind === "cube") {
    return (
      <Float speed={reducedMotion ? 0 : 0.8} rotationIntensity={0.8} floatIntensity={0.35}>
        <RoundedBox ref={mesh} position={position} args={[0.72, 0.72, 0.72]} radius={0.12} smoothness={4}>
          <GlassMaterial color={color} />
        </RoundedBox>
      </Float>
    );
  }

  return (
    <Float speed={reducedMotion ? 0 : 1} rotationIntensity={0.35} floatIntensity={0.55}>
      <RoundedBox ref={mesh} position={position} args={[0.88, 0.56, 0.16]} radius={0.08} smoothness={4}>
        <GlassMaterial color={color} opacity={0.68} />
      </RoundedBox>
    </Float>
  );
}

function WorkspaceScene({ reducedMotion }: Hero3DSceneProps) {
  const group = useRef<Group>(null);
  const target = useRef({ x: 0, y: 0 });

  useFrame((state) => {
    if (!group.current || reducedMotion) return;
    target.current.x = state.pointer.y * -0.08;
    target.current.y = state.pointer.x * 0.1;
    group.current.rotation.x = MathUtils.lerp(group.current.rotation.x, target.current.x, 0.035);
    group.current.rotation.y = MathUtils.lerp(group.current.rotation.y, target.current.y, 0.035);
  });

  return (
    <>
      <ambientLight intensity={0.7} color="#93C5FD" />
      <directionalLight position={[4, 5, 6]} intensity={2.2} color="#BFDBFE" />
      <pointLight position={[0, 0, 3]} intensity={10} distance={9} color="#2563EB" />
      <group ref={group}>
        <Float speed={reducedMotion ? 0 : 0.65} rotationIntensity={0.06} floatIntensity={0.18}>
          <RoundedBox args={[3.9, 2.4, 0.12]} radius={0.18} smoothness={6} position={[0, 0, -0.4]}>
            <meshPhysicalMaterial
              color="#0F172A"
              transparent
              opacity={0.88}
              roughness={0.25}
              metalness={0.35}
              clearcoat={1}
            />
          </RoundedBox>
          <mesh position={[0, 0, -0.32]}>
            <planeGeometry args={[3.45, 1.92]} />
            <meshBasicMaterial color="#111827" transparent opacity={0.82} />
          </mesh>
          <mesh position={[0, 0.73, -0.25]}>
            <planeGeometry args={[3.45, 0.018]} />
            <meshBasicMaterial color="#3B82F6" transparent opacity={0.65} />
          </mesh>
          {[-1.25, -0.75, -0.25, 0.25, 0.75, 1.25].map((x) => (
            <mesh key={x} position={[x, -0.08, -0.24]}>
              <boxGeometry args={[0.28, 0.62 + Math.abs(x) * 0.08, 0.03]} />
              <meshBasicMaterial color={x > 0 ? "#60A5FA" : "#2563EB"} transparent opacity={0.7} />
            </mesh>
          ))}
        </Float>
        {OBJECTS.map((item) => (
          <FloatingObject key={item.label} {...item} reducedMotion={reducedMotion} />
        ))}
      </group>
    </>
  );
}

export function Hero3DScene({ reducedMotion }: Hero3DSceneProps) {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 hidden opacity-70 sm:block" aria-hidden="true">
      <Canvas
        camera={{ position: [0, 0, 7.5], fov: 38 }}
        dpr={[1, 1.35]}
        gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
      >
        <WorkspaceScene reducedMotion={reducedMotion} />
      </Canvas>
    </div>
  );
}
