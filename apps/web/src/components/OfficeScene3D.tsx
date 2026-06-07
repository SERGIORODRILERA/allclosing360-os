"use client";

import React, { useRef, useMemo, Suspense, Component } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Html, ContactShadows, Float, Text } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";
import { DIRECTORS } from "../lib/engines";
import type { DirectorConfig } from "../lib/engines";
import type { UITask } from "./TasksPanel";
import type { EngineId } from "@ac360/types";

// ─── Layout constants ────────────────────────────────────────────────────────

// Desk positions: 2 rows of 8 facing south (+Z)
const DESK_GRID: { id: EngineId; x: number; z: number }[] = [
  // Row A — back (z = -12)
  { id: "ceo_advisor",             x: -14, z: -12 },
  { id: "director_comercial",      x: -10, z: -12 },
  { id: "director_marketing",      x:  -6, z: -12 },
  { id: "director_embudos",        x:  -2, z: -12 },
  { id: "director_seo",            x:   2, z: -12 },
  { id: "director_sem",            x:   6, z: -12 },
  { id: "director_contenido",      x:  10, z: -12 },
  { id: "director_crm_ghl",        x:  14, z: -12 },
  // Row B — mid (z = -4)
  { id: "director_meta_ads",       x: -14, z: -4 },
  { id: "director_google_ads",     x: -10, z: -4 },
  { id: "director_financiero",     x:  -6, z: -4 },
  { id: "director_operaciones",    x:  -2, z: -4 },
  { id: "director_llamadas_ia",    x:   2, z: -4 },
  { id: "director_automatizaciones", x: 6, z: -4 },
  { id: "director_producto",       x:  10, z: -4 },
];

const PROP_POSITIONS = {
  coffee:   [-17, 0, 10] as [number, number, number],
  water:    [-15, 0, 10] as [number, number, number],
  foosball: [ -9, 0, 13] as [number, number, number],
  pingpong: [  1, 0, 14] as [number, number, number],
  sofa:     [ 13, 0, 13] as [number, number, number],
  vending:  [ 20, 0, -12] as [number, number, number],
};

const IDLE_WALK_TARGETS: Array<{ key: keyof typeof PROP_POSITIONS; pos: THREE.Vector3 }> = [
  { key: "coffee",   pos: new THREE.Vector3(-17, 0, 10) },
  { key: "foosball", pos: new THREE.Vector3(-9,  0, 13) },
  { key: "vending",  pos: new THREE.Vector3(20,  0, -12) },
];

// ─── Error boundary ───────────────────────────────────────────────────────────

interface EBState { hasError: boolean }
class CanvasErrorBoundary extends Component<{ children: React.ReactNode; fallback: React.ReactNode }, EBState> {
  constructor(props: { children: React.ReactNode; fallback: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() { return { hasError: true }; }
  override render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

// ─── 2.5D fallback ────────────────────────────────────────────────────────────

function FallbackOffice({
  directors,
  tasks,
  activeDirectorId,
  onDirectorSelect,
}: {
  directors: DirectorConfig[];
  tasks: UITask[];
  activeDirectorId: EngineId | null;
  onDirectorSelect: (id: EngineId) => void;
}) {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
      gap: 8, padding: 16, overflow: "auto", height: "100%",
      background: "var(--color-bg)",
    }}>
      {directors.map((d) => {
        const task = tasks.find((t) => t.engineId === d.id && t.status === "in_progress");
        const isActive = d.id === activeDirectorId;
        return (
          <button
            key={d.id}
            onClick={() => onDirectorSelect(d.id)}
            style={{
              background: isActive ? `${d.color}22` : "var(--color-surface)",
              border: `1px solid ${isActive ? d.color : "var(--color-border)"}`,
              borderRadius: 10, padding: "10px 8px", cursor: "pointer",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
            }}
          >
            <div style={{ fontSize: 24 }}>{d.icon}</div>
            <div style={{ fontSize: 10, fontWeight: 700, color: d.color }}>{d.shortName}</div>
            {task && (
              <div style={{
                width: "100%", height: 3, borderRadius: 2,
                background: `${d.color}33`,
                position: "relative",
              }}>
                <div style={{
                  position: "absolute", left: 0, top: 0, bottom: 0,
                  width: `${task.progress}%`, borderRadius: 2,
                  background: d.color,
                  transition: "width 0.3s",
                }} />
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ─── Furniture components ─────────────────────────────────────────────────────

function Floor() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, -0.02, 0]}>
      <planeGeometry args={[48, 40]} />
      <meshStandardMaterial color="#1a1a2e" roughness={0.8} metalness={0.1} />
    </mesh>
  );
}

function ZoneFloor({
  x, z, w, d, color,
}: { x: number; z: number; w: number; d: number; color: string }) {
  return (
    <mesh position={[x, -0.01, z]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[w, d]} />
      <meshStandardMaterial color={color} transparent opacity={0.12} roughness={1} />
    </mesh>
  );
}

function WallPanel({ x, y, z, w, h, color = "#1e1e3a" }: { x: number; y: number; z: number; w: number; h: number; color?: string }) {
  return (
    <mesh position={[x, y, z]} castShadow>
      <boxGeometry args={[w, h, 0.1]} />
      <meshStandardMaterial color={color} roughness={0.9} />
    </mesh>
  );
}

function Desk({ position, color }: { position: [number, number, number]; color: string }) {
  const [dx, , dz] = position;
  return (
    <group position={position}>
      {/* Surface */}
      <mesh position={[0, 0.72, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.7, 0.06, 0.85]} />
        <meshStandardMaterial color="#2a2a3d" roughness={0.7} />
      </mesh>
      {/* Left leg */}
      <mesh position={[-0.75, 0.35, 0]} castShadow>
        <boxGeometry args={[0.06, 0.7, 0.06]} />
        <meshStandardMaterial color="#1a1a2e" />
      </mesh>
      {/* Right leg */}
      <mesh position={[0.75, 0.35, 0]} castShadow>
        <boxGeometry args={[0.06, 0.7, 0.06]} />
        <meshStandardMaterial color="#1a1a2e" />
      </mesh>
      {/* Back beam */}
      <mesh position={[0, 0.35, 0.38]} castShadow>
        <boxGeometry args={[1.5, 0.06, 0.06]} />
        <meshStandardMaterial color="#1a1a2e" />
      </mesh>
      {/* Monitor (emissive for bloom) */}
      <mesh position={[0, 1.12, 0.3]} castShadow>
        <boxGeometry args={[0.75, 0.5, 0.04]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2.2} roughness={0.3} />
      </mesh>
      {/* Monitor stand */}
      <mesh position={[0, 0.82, 0.3]}>
        <cylinderGeometry args={[0.02, 0.04, 0.18, 6]} />
        <meshStandardMaterial color="#333" />
      </mesh>
      {/* Keyboard */}
      <mesh position={[0, 0.76, -0.05]}>
        <boxGeometry args={[0.45, 0.02, 0.16]} />
        <meshStandardMaterial color="#252535" />
      </mesh>
    </group>
  );
}

function Chair({ position, color }: { position: [number, number, number]; color: string }) {
  return (
    <group position={position}>
      {/* Seat */}
      <mesh position={[0, 0.48, 0]} castShadow>
        <boxGeometry args={[0.5, 0.08, 0.5]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
      {/* Back */}
      <mesh position={[0, 0.8, 0.22]} castShadow>
        <boxGeometry args={[0.46, 0.55, 0.07]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
      {/* Pole */}
      <mesh position={[0, 0.24, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 0.48, 6]} />
        <meshStandardMaterial color="#222" />
      </mesh>
      {/* Base */}
      <mesh position={[0, 0.04, 0]}>
        <cylinderGeometry args={[0.28, 0.28, 0.05, 5]} />
        <meshStandardMaterial color="#222" />
      </mesh>
    </group>
  );
}

function Plant({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return (
    <group position={position} scale={scale}>
      {/* Pot */}
      <mesh position={[0, 0.18, 0]} castShadow>
        <cylinderGeometry args={[0.15, 0.12, 0.36, 8]} />
        <meshStandardMaterial color="#6b3e26" roughness={0.9} />
      </mesh>
      {/* Soil */}
      <mesh position={[0, 0.37, 0]}>
        <cylinderGeometry args={[0.14, 0.14, 0.04, 8]} />
        <meshStandardMaterial color="#3d2400" />
      </mesh>
      {/* Main leaf cluster */}
      <mesh position={[0, 0.7, 0]} castShadow>
        <sphereGeometry args={[0.3, 7, 7]} />
        <meshStandardMaterial color="#1a7a3c" roughness={1} />
      </mesh>
      {/* Side leaves */}
      <mesh position={[0.22, 0.6, 0]} rotation={[0, 0, 0.5]} castShadow>
        <sphereGeometry args={[0.18, 6, 6]} />
        <meshStandardMaterial color="#1f8f44" roughness={1} />
      </mesh>
      <mesh position={[-0.2, 0.55, 0.1]} rotation={[0, 0.3, -0.4]} castShadow>
        <sphereGeometry args={[0.16, 6, 6]} />
        <meshStandardMaterial color="#167a38" roughness={1} />
      </mesh>
    </group>
  );
}

function CoffeeMachine({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Body */}
      <mesh position={[0, 0.45, 0]} castShadow>
        <boxGeometry args={[0.38, 0.9, 0.32]} />
        <meshStandardMaterial color="#222233" roughness={0.4} metalness={0.6} />
      </mesh>
      {/* Display panel */}
      <mesh position={[0, 0.62, 0.165]}>
        <boxGeometry args={[0.22, 0.18, 0.01]} />
        <meshStandardMaterial color="#00ccff" emissive="#00ccff" emissiveIntensity={1.8} />
      </mesh>
      {/* Spout */}
      <mesh position={[0, 0.28, 0.22]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.025, 0.025, 0.12, 6]} />
        <meshStandardMaterial color="#888" metalness={0.8} />
      </mesh>
      {/* Cup area */}
      <mesh position={[0, 0.06, 0.1]}>
        <boxGeometry args={[0.3, 0.08, 0.18]} />
        <meshStandardMaterial color="#111" roughness={0.9} />
      </mesh>
      {/* Cup */}
      <mesh position={[0, 0.12, 0.1]}>
        <cylinderGeometry args={[0.05, 0.04, 0.09, 8]} />
        <meshStandardMaterial color="#e8e0d0" roughness={0.6} />
      </mesh>
    </group>
  );
}

function WaterDispenser({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.6, 0]} castShadow>
        <boxGeometry args={[0.3, 1.2, 0.28]} />
        <meshStandardMaterial color="#2a2a4a" roughness={0.5} metalness={0.3} />
      </mesh>
      {/* Water bottle (blue tint) */}
      <mesh position={[0, 1.3, 0]}>
        <cylinderGeometry args={[0.12, 0.12, 0.5, 8]} />
        <meshStandardMaterial color="#4477dd" transparent opacity={0.7} roughness={0.2} />
      </mesh>
    </group>
  );
}

function VendingMachine({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Body */}
      <mesh position={[0, 1.0, 0]} castShadow>
        <boxGeometry args={[0.72, 2.0, 0.5]} />
        <meshStandardMaterial color="#1a2a4a" roughness={0.5} metalness={0.2} />
      </mesh>
      {/* Display / glass front */}
      <mesh position={[0, 1.1, 0.26]}>
        <boxGeometry args={[0.56, 1.2, 0.02]} />
        <meshStandardMaterial color="#0033aa" emissive="#0033aa" emissiveIntensity={0.8} transparent opacity={0.7} />
      </mesh>
      {/* Slot */}
      <mesh position={[0, 0.14, 0.26]}>
        <boxGeometry args={[0.3, 0.08, 0.04]} />
        <meshStandardMaterial color="#111" />
      </mesh>
      {/* Top light strip */}
      <mesh position={[0, 2.04, 0]}>
        <boxGeometry args={[0.7, 0.08, 0.48]} />
        <meshStandardMaterial color="#ffaa00" emissive="#ffaa00" emissiveIntensity={2} />
      </mesh>
    </group>
  );
}

function FoosballTable({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Table body */}
      <mesh position={[0, 0.46, 0]} castShadow>
        <boxGeometry args={[1.4, 0.1, 0.82]} />
        <meshStandardMaterial color="#2d4a1e" roughness={0.8} />
      </mesh>
      {/* Table sides */}
      <mesh position={[0, 0.65, 0]}>
        <boxGeometry args={[1.42, 0.38, 0.84]} />
        <meshStandardMaterial color="#5c3d11" roughness={0.8} />
      </mesh>
      {/* Playing field */}
      <mesh position={[0, 0.52, 0]}>
        <boxGeometry args={[1.2, 0.02, 0.62]} />
        <meshStandardMaterial color="#1a6b1a" roughness={0.9} />
      </mesh>
      {/* Handles left */}
      {[-0.4, 0, 0.4].map((xo, i) => (
        <mesh key={`fl${i}`} position={[-0.76, 0.72, xo]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.025, 0.025, 0.18, 6]} />
          <meshStandardMaterial color="#888" metalness={0.6} />
        </mesh>
      ))}
      {/* Handles right */}
      {[-0.4, 0, 0.4].map((xo, i) => (
        <mesh key={`fr${i}`} position={[0.76, 0.72, xo]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.025, 0.025, 0.18, 6]} />
          <meshStandardMaterial color="#888" metalness={0.6} />
        </mesh>
      ))}
      {/* Legs */}
      {([-0.62, 0.45, -0.62, -0.45] as const).length > 0 && (
        <>
          {([[-0.62, 0.45], [0.62, 0.45], [-0.62, -0.45], [0.62, -0.45]] as [number, number][]).map(([xl, zl], i) => (
            <mesh key={`leg${i}`} position={[xl, 0.22, zl]}>
              <cylinderGeometry args={[0.04, 0.04, 0.44, 6]} />
              <meshStandardMaterial color="#3d2400" />
            </mesh>
          ))}
        </>
      )}
    </group>
  );
}

function PingPongTable({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Table top */}
      <mesh position={[0, 0.76, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.4, 0.05, 2.6]} />
        <meshStandardMaterial color="#1e5a9c" roughness={0.7} />
      </mesh>
      {/* Net */}
      <mesh position={[0, 0.86, 0]}>
        <boxGeometry args={[1.42, 0.2, 0.03]} />
        <meshStandardMaterial color="#eee" transparent opacity={0.7} roughness={1} />
      </mesh>
      {/* Lines on table */}
      <mesh position={[0, 0.792, 0]}>
        <boxGeometry args={[0.03, 0.001, 2.58]} />
        <meshStandardMaterial color="#ffffff" roughness={1} />
      </mesh>
      {/* Legs */}
      {([[-0.6, 1.1], [0.6, 1.1], [-0.6, -1.1], [0.6, -1.1]] as [number, number][]).map(([xl, zl], i) => (
        <mesh key={`pleg${i}`} position={[xl, 0.37, zl]}>
          <cylinderGeometry args={[0.04, 0.04, 0.74, 6]} />
          <meshStandardMaterial color="#888" metalness={0.5} />
        </mesh>
      ))}
    </group>
  );
}

function Sofa({ position }: { position: [number, number, number] }) {
  return (
    <group position={position} rotation={[0, Math.PI, 0]}>
      {/* Base */}
      <mesh position={[0, 0.22, 0]} castShadow>
        <boxGeometry args={[1.8, 0.44, 0.72]} />
        <meshStandardMaterial color="#2d3561" roughness={0.9} />
      </mesh>
      {/* Back rest */}
      <mesh position={[0, 0.6, 0.3]} castShadow>
        <boxGeometry args={[1.78, 0.5, 0.2]} />
        <meshStandardMaterial color="#2d3561" roughness={0.9} />
      </mesh>
      {/* Left arm */}
      <mesh position={[-0.85, 0.5, 0]} castShadow>
        <boxGeometry args={[0.18, 0.34, 0.72]} />
        <meshStandardMaterial color="#222244" roughness={0.9} />
      </mesh>
      {/* Right arm */}
      <mesh position={[0.85, 0.5, 0]} castShadow>
        <boxGeometry args={[0.18, 0.34, 0.72]} />
        <meshStandardMaterial color="#222244" roughness={0.9} />
      </mesh>
      {/* Cushions */}
      {[-0.55, 0, 0.55].map((xo, i) => (
        <mesh key={`cush${i}`} position={[xo, 0.5, -0.05]}>
          <boxGeometry args={[0.54, 0.12, 0.62]} />
          <meshStandardMaterial color="#363b6e" roughness={0.8} />
        </mesh>
      ))}
    </group>
  );
}

// ─── Neon sign ────────────────────────────────────────────────────────────────

function NeonSign({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Backing panel */}
      <mesh>
        <boxGeometry args={[7.5, 0.9, 0.08]} />
        <meshStandardMaterial color="#0a0a14" roughness={0.6} />
      </mesh>
      {/* Glowing text via drei Text */}
      <Text
        position={[0, 0, 0.06]}
        fontSize={0.42}
        color="#4f7eff"
        anchorX="center"
        anchorY="middle"
        font={undefined}
        // @ts-ignore — emissive props on Text material
        material-emissive="#4f7eff"
        material-emissiveIntensity={3}
      >
        ALLCLOSING360 OS
      </Text>
      {/* Decorative horizontal bars */}
      <mesh position={[0, -0.38, 0.06]}>
        <boxGeometry args={[6.8, 0.04, 0.01]} />
        <meshStandardMaterial color="#4f7eff" emissive="#4f7eff" emissiveIntensity={4} />
      </mesh>
      <mesh position={[0, 0.38, 0.06]}>
        <boxGeometry args={[6.8, 0.04, 0.01]} />
        <meshStandardMaterial color="#4f7eff" emissive="#4f7eff" emissiveIntensity={4} />
      </mesh>
    </group>
  );
}

// ─── Director avatar with idle walk animation ─────────────────────────────────

interface AvatarProps {
  director: DirectorConfig;
  homePos: [number, number, number];
  isActive: boolean;
  task?: UITask;
  onSelect: () => void;
}

type WalkPhase = "desk" | "walk_out" | "at_prop" | "walk_home";

function DirectorAvatar({ director, homePos, isActive, task, onSelect }: AvatarProps) {
  const groupRef = useRef<THREE.Group>(null!);
  const bodyRef = useRef<THREE.Mesh>(null!);
  const leftArmRef = useRef<THREE.Mesh>(null!);
  const rightArmRef = useRef<THREE.Mesh>(null!);
  const leftLegRef = useRef<THREE.Mesh>(null!);
  const rightLegRef = useRef<THREE.Mesh>(null!);

  const stateRef = useRef<{
    phase: WalkPhase;
    timer: number;
    idleTimer: number;
    targetPropIdx: number;
    currentPos: THREE.Vector3;
    targetPos: THREE.Vector3;
    homeVec: THREE.Vector3;
  }>({
    phase: "desk",
    timer: 0,
    idleTimer: Math.random() * 8 + 4, // stagger initial walk times
    targetPropIdx: 0,
    currentPos: new THREE.Vector3(...homePos),
    targetPos: new THREE.Vector3(...homePos),
    homeVec: new THREE.Vector3(...homePos),
  });

  const color = director.color;
  const isBusy = task?.status === "in_progress";

  useFrame((state, delta) => {
    const g = groupRef.current;
    const body = bodyRef.current;
    const la = leftArmRef.current;
    const ra = rightArmRef.current;
    const ll = leftLegRef.current;
    const rl = rightLegRef.current;
    if (!g || !body || !la || !ra || !ll || !rl) return;

    const s = stateRef.current;
    const t = state.clock.elapsedTime;

    if (s.phase === "desk") {
      s.idleTimer -= delta;

      if (isBusy) {
        // Typing animation
        const typeSpeed = 5;
        la.rotation.x = Math.sin(t * typeSpeed) * 0.18;
        ra.rotation.x = Math.sin(t * typeSpeed + Math.PI) * 0.18;
        ll.rotation.x = 0;
        rl.rotation.x = 0;
        body.rotation.y = Math.sin(t * 0.4) * 0.04;
        // Reset position
        g.position.lerp(s.homeVec, 0.1);
        s.idleTimer = Math.random() * 8 + 4; // reset so busy director doesn't wander
      } else {
        // Idle bob
        g.position.y = Math.sin(t * 1.4) * 0.04;
        la.rotation.x = Math.sin(t * 0.9) * 0.06;
        ra.rotation.x = Math.sin(t * 0.9 + 1) * 0.06;
        ll.rotation.x = 0;
        rl.rotation.x = 0;
        body.rotation.y = Math.sin(t * 0.25) * 0.06;

        if (!isActive && s.idleTimer <= 0) {
          s.targetPropIdx = Math.floor(Math.random() * IDLE_WALK_TARGETS.length);
          const idleTarget = IDLE_WALK_TARGETS[s.targetPropIdx];
          if (idleTarget) {
            s.targetPos.copy(idleTarget.pos);
            s.phase = "walk_out";
          } else {
            s.idleTimer = 10;
          }
        }
      }
    }

    if (s.phase === "walk_out") {
      // Walk toward target
      const dir = s.targetPos.clone().sub(s.currentPos);
      const dist = dir.length();
      if (dist < 0.25) {
        s.phase = "at_prop";
        s.timer = 5 + Math.random() * 5;
        s.currentPos.copy(s.targetPos);
      } else {
        dir.normalize().multiplyScalar(delta * 3.5);
        s.currentPos.add(dir);
        g.position.set(s.currentPos.x, 0, s.currentPos.z);
        // Face walking direction
        g.rotation.y = Math.atan2(dir.x, dir.z);
        // Walk animation
        la.rotation.x = Math.sin(t * 6) * 0.5;
        ra.rotation.x = Math.sin(t * 6 + Math.PI) * 0.5;
        ll.rotation.x = Math.sin(t * 6 + Math.PI) * 0.45;
        rl.rotation.x = Math.sin(t * 6) * 0.45;
        // Bob
        g.position.y = Math.abs(Math.sin(t * 6)) * 0.05;
      }
    }

    if (s.phase === "at_prop") {
      s.timer -= delta;
      // Idle at prop
      g.position.y = Math.sin(t * 1.2) * 0.03;
      la.rotation.x = Math.sin(t * 0.7) * 0.08;
      ra.rotation.x = Math.sin(t * 0.7 + 0.5) * 0.08;
      ll.rotation.x = 0;
      rl.rotation.x = 0;
      if (s.timer <= 0) {
        s.targetPos.copy(s.homeVec);
        s.phase = "walk_home";
      }
    }

    if (s.phase === "walk_home") {
      const dir = s.homeVec.clone().sub(s.currentPos);
      const dist = dir.length();
      if (dist < 0.25) {
        s.phase = "desk";
        s.idleTimer = Math.random() * 12 + 8;
        s.currentPos.copy(s.homeVec);
        g.position.set(s.homeVec.x, 0, s.homeVec.z);
        g.rotation.y = 0;
      } else {
        dir.normalize().multiplyScalar(delta * 3.5);
        s.currentPos.add(dir);
        g.position.set(s.currentPos.x, 0, s.currentPos.z);
        g.rotation.y = Math.atan2(dir.x, dir.z);
        la.rotation.x = Math.sin(t * 6) * 0.5;
        ra.rotation.x = Math.sin(t * 6 + Math.PI) * 0.5;
        ll.rotation.x = Math.sin(t * 6 + Math.PI) * 0.45;
        rl.rotation.x = Math.sin(t * 6) * 0.45;
        g.position.y = Math.abs(Math.sin(t * 6)) * 0.05;
      }
    }
  });

  const progress = task?.progress ?? 0;
  const progressAngle = (progress / 100) * Math.PI * 2;

  // Ring geometry for progress
  const ringShape = useMemo(() => {
    const shape = new THREE.Shape();
    shape.absarc(0, 0, 0.38, 0, Math.PI * 2, false);
    const hole = new THREE.Path();
    hole.absarc(0, 0, 0.32, 0, Math.PI * 2, true);
    shape.holes.push(hole);
    return shape;
  }, []);

  const ringProgressShape = useMemo(() => {
    const shape = new THREE.Shape();
    shape.absarc(0, 0, 0.38, -Math.PI / 2, -Math.PI / 2 + progressAngle, false);
    const hole = new THREE.Path();
    hole.absarc(0, 0, 0.32, -Math.PI / 2 + progressAngle, -Math.PI / 2, true);
    shape.holes.push(hole);
    return shape;
  }, [progressAngle]);

  const skinColor = "#f4a870";

  return (
    <group
      ref={groupRef}
      position={homePos}
      onClick={(e) => { e.stopPropagation(); onSelect(); }}
    >
      {/* Head */}
      <mesh position={[0, 1.9, 0]} castShadow>
        <sphereGeometry args={[0.22, 10, 10]} />
        <meshStandardMaterial color={skinColor} roughness={0.8} />
      </mesh>
      {/* Hair */}
      <mesh position={[0, 2.05, 0]}>
        <sphereGeometry args={[0.22, 10, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={director.color} roughness={0.9} />
      </mesh>
      {/* Body */}
      <mesh ref={bodyRef} position={[0, 1.4, 0]} castShadow>
        <boxGeometry args={[0.44, 0.58, 0.22]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
      {/* Left arm */}
      <mesh ref={leftArmRef} position={[-0.28, 1.4, 0]} castShadow>
        <boxGeometry args={[0.12, 0.44, 0.12]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
      {/* Right arm */}
      <mesh ref={rightArmRef} position={[0.28, 1.4, 0]} castShadow>
        <boxGeometry args={[0.12, 0.44, 0.12]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
      {/* Left leg */}
      <mesh ref={leftLegRef} position={[-0.12, 0.88, 0]} castShadow>
        <boxGeometry args={[0.14, 0.5, 0.14]} />
        <meshStandardMaterial color="#1a1a2e" roughness={0.8} />
      </mesh>
      {/* Right leg */}
      <mesh ref={rightLegRef} position={[0.12, 0.88, 0]} castShadow>
        <boxGeometry args={[0.14, 0.5, 0.14]} />
        <meshStandardMaterial color="#1a1a2e" roughness={0.8} />
      </mesh>
      {/* Feet */}
      <mesh position={[-0.12, 0.61, 0.06]}>
        <boxGeometry args={[0.14, 0.1, 0.2]} />
        <meshStandardMaterial color="#222" />
      </mesh>
      <mesh position={[0.12, 0.61, 0.06]}>
        <boxGeometry args={[0.14, 0.1, 0.2]} />
        <meshStandardMaterial color="#222" />
      </mesh>

      {/* Progress ring above head (only when active) */}
      {isBusy && (
        <group position={[0, 2.48, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          {/* Background ring */}
          <mesh>
            <shapeGeometry args={[ringShape]} />
            <meshStandardMaterial color="#333" side={THREE.DoubleSide} />
          </mesh>
          {/* Progress ring */}
          <mesh>
            <shapeGeometry args={[ringProgressShape]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.5} side={THREE.DoubleSide} />
          </mesh>
        </group>
      )}

      {/* Active selection ring */}
      {isActive && (
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.45, 0.52, 32]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2} side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* Name label */}
      <Html
        position={[0, 2.75, 0]}
        center
        distanceFactor={12}
        style={{ pointerEvents: "none" }}
      >
        <div style={{
          background: "rgba(8,8,20,0.88)",
          border: `1px solid ${color}55`,
          borderRadius: 5,
          padding: "2px 7px",
          whiteSpace: "nowrap",
          fontSize: 11,
          color: color,
          fontWeight: 700,
          fontFamily: "var(--font-mono, monospace)",
          textShadow: `0 0 8px ${color}`,
        }}>
          {director.shortName}
          {isBusy && <span style={{ marginLeft: 4, opacity: 0.7 }}>{progress}%</span>}
        </div>
      </Html>

      {/* Thought bubble with current step */}
      {isBusy && task?.currentStep && (
        <Html
          position={[0.5, 2.25, 0]}
          distanceFactor={14}
          style={{ pointerEvents: "none" }}
        >
          <div style={{
            background: "rgba(8,8,20,0.9)",
            border: `1px solid ${color}33`,
            borderRadius: 6,
            padding: "3px 8px",
            maxWidth: 140,
            fontSize: 9,
            color: "rgba(255,255,255,0.8)",
            fontFamily: "var(--font-mono, monospace)",
            lineHeight: 1.3,
          }}>
            💭 {task.currentStep}
          </div>
        </Html>
      )}
    </group>
  );
}

// ─── Full scene content ───────────────────────────────────────────────────────

function SceneContent({
  tasks,
  activeDirectorId,
  onDirectorSelect,
}: {
  tasks: UITask[];
  activeDirectorId: EngineId | null;
  onDirectorSelect: (id: EngineId) => void;
}) {
  const taskByDirector = useMemo(() => {
    const map = new Map<string, UITask>();
    for (const t of tasks) {
      if (t.status === "in_progress" || t.status === "completed") {
        const existing = map.get(t.engineId);
        if (!existing || existing.status === "completed") map.set(t.engineId, t);
      }
    }
    return map;
  }, [tasks]);

  return (
    <>
      {/* Lights */}
      <ambientLight intensity={0.4} color="#8899cc" />
      <directionalLight
        position={[8, 18, 6]}
        intensity={1.2}
        color="#ffffff"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={60}
        shadow-camera-left={-25}
        shadow-camera-right={25}
        shadow-camera-top={25}
        shadow-camera-bottom={-25}
      />
      {/* Accent lights for break room */}
      <pointLight position={[-10, 3.5, 12]} intensity={1.5} color="#4f7eff" distance={12} decay={2} />
      <pointLight position={[5, 3.5, 14]} intensity={1.2} color="#00ccff" distance={10} decay={2} />
      {/* Desk row lights */}
      <pointLight position={[0, 4, -12]} intensity={0.8} color="#88aaff" distance={18} decay={2} />
      <pointLight position={[0, 4, -4]} intensity={0.8} color="#88aaff" distance={18} decay={2} />

      {/* Floor */}
      <Floor />

      {/* Zone floors */}
      <ZoneFloor x={-7} z={-12} w={16} d={6} color="#f59e0b" />
      <ZoneFloor x={7}  z={-12} w={16} d={6} color="#6366f1" />
      <ZoneFloor x={0}  z={-4}  w={32} d={6} color="#06b6d4" />
      <ZoneFloor x={0}  z={7}   w={48} d={14} color="#14b8a6" />

      {/* North wall */}
      <WallPanel x={0} y={2} z={-19.9} w={48} h={4} color="#0f0f22" />
      {/* South wall */}
      <WallPanel x={0} y={2} z={19.9}  w={48} h={4} color="#0f0f22" />
      {/* West wall */}
      <WallPanel x={-23.9} y={2} z={0} w={0.1} h={4} color="#0f0f22" />
      {/* East wall */}
      <WallPanel x={23.9}  y={2} z={0} w={0.1} h={4} color="#0f0f22" />

      {/* Neon sign on north wall */}
      <NeonSign position={[0, 3.0, -19.5]} />

      {/* Break room separator (glass-look) */}
      <mesh position={[0, 1.2, 2.5]} castShadow>
        <boxGeometry args={[48, 2.4, 0.08]} />
        <meshStandardMaterial color="#4f7eff" transparent opacity={0.12} roughness={0.1} metalness={0.2} />
      </mesh>
      {/* Glass separator glow strip */}
      <mesh position={[0, 2.38, 2.5]}>
        <boxGeometry args={[48, 0.05, 0.06]} />
        <meshStandardMaterial color="#4f7eff" emissive="#4f7eff" emissiveIntensity={2} />
      </mesh>

      {/* Desks + chairs */}
      {DESK_GRID.map((dg) => {
        const dir = DIRECTORS.find((d) => d.id === dg.id);
        if (!dir) return null;
        return (
          <group key={dg.id}>
            <Desk position={[dg.x, 0, dg.z]} color={dir.color} />
            <Chair position={[dg.x, 0, dg.z + 0.9]} color={dir.color} />
          </group>
        );
      })}

      {/* Avatars */}
      {DESK_GRID.map((dg) => {
        const dir = DIRECTORS.find((d) => d.id === dg.id);
        if (!dir) return null;
        const task = taskByDirector.get(dg.id);
        return (
          <DirectorAvatar
            key={dg.id}
            director={dir}
            homePos={[dg.x, 0, dg.z + 1.2]}
            isActive={activeDirectorId === dg.id}
            task={task}
            onSelect={() => onDirectorSelect(dg.id)}
          />
        );
      })}

      {/* Props */}
      <CoffeeMachine position={PROP_POSITIONS.coffee} />
      <WaterDispenser position={PROP_POSITIONS.water} />
      <FoosballTable position={PROP_POSITIONS.foosball} />
      <PingPongTable position={PROP_POSITIONS.pingpong} />
      <Sofa position={PROP_POSITIONS.sofa} />
      <VendingMachine position={PROP_POSITIONS.vending} />

      {/* Plants scattered around */}
      <Float speed={0.5} rotationIntensity={0.1} floatIntensity={0.15}>
        <Plant position={[-21, 0, -15]} scale={1.2} />
      </Float>
      <Float speed={0.6} rotationIntensity={0.1} floatIntensity={0.12}>
        <Plant position={[21, 0, -15]} scale={1.0} />
      </Float>
      <Float speed={0.4} rotationIntensity={0.08} floatIntensity={0.1}>
        <Plant position={[-21, 0, 8]} scale={1.4} />
      </Float>
      <Plant position={[20, 0, 8]} scale={1.1} />
      <Plant position={[-5, 0, 7]} scale={0.9} />
      <Plant position={[8, 0, 6]} scale={1.0} />

      {/* Contact shadows */}
      <ContactShadows
        position={[0, -0.01, 0]}
        scale={50}
        far={8}
        blur={2.5}
        opacity={0.6}
        color="#000011"
      />

      {/* Orbit controls */}
      <OrbitControls
        enableDamping
        dampingFactor={0.06}
        maxPolarAngle={Math.PI / 2.15}
        minPolarAngle={Math.PI / 6}
        maxDistance={38}
        minDistance={6}
        target={[0, 1, -4]}
      />

      {/* Bloom postprocessing */}
      <EffectComposer>
        <Bloom
          luminanceThreshold={0.35}
          luminanceSmoothing={0.3}
          intensity={1.2}
          mipmapBlur
        />
      </EffectComposer>
    </>
  );
}

// ─── Public props ─────────────────────────────────────────────────────────────

export interface OfficeScene3DProps {
  tasks: UITask[];
  activeDirectorId: EngineId | null;
  onDirectorSelect: (id: EngineId) => void;
}

// ─── Main export ─────────────────────────────────────────────────────────────

export default function OfficeScene3D({ tasks, activeDirectorId, onDirectorSelect }: OfficeScene3DProps) {
  const fallback = (
    <FallbackOffice
      directors={DIRECTORS}
      tasks={tasks}
      activeDirectorId={activeDirectorId}
      onDirectorSelect={onDirectorSelect}
    />
  );

  return (
    <CanvasErrorBoundary fallback={fallback}>
      <Canvas
        shadows
        camera={{ position: [0, 18, 24], fov: 52 }}
        gl={{ antialias: true, alpha: false }}
        style={{ background: "#060614", width: "100%", height: "100%" }}
      >
        <Suspense fallback={null}>
          <SceneContent
            tasks={tasks}
            activeDirectorId={activeDirectorId}
            onDirectorSelect={onDirectorSelect}
          />
        </Suspense>
      </Canvas>
    </CanvasErrorBoundary>
  );
}
