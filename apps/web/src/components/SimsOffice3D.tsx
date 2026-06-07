"use client";

import { useRef, useState, useMemo, useEffect, Suspense } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Html, Environment } from "@react-three/drei";
import * as THREE from "three";
import { DIRECTORS, DIRECTOR_MAP } from "../lib/engines";
import type { DirectorConfig } from "../lib/engines";
import type { UITask } from "./TasksPanel";
import type { EngineId } from "@ac360/types";
import DirectorSidePanel from "./DirectorSidePanel";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Props {
  tasks: UITask[];
  activeDirectorId: EngineId | null;
  onDirectorSelect: (id: EngineId) => void;
}

type AvatarState = "idle" | "working" | "completed" | "error";

// ─── Department layout ────────────────────────────────────────────────────────

interface Dept {
  id: string;
  label: string;
  color: string;
  accentHex: string;
  x: number; z: number;
  w: number; d: number;
  directors: string[];
  deskPositions: [number, number][];
}

const DEPTS: Dept[] = [
  {
    id: "ceo",     label: "CEO Suite",       color: "#f59e0b", accentHex: "#f59e0b",
    x: -9, z: -8,  w: 6, d: 6,
    directors: ["ceo_advisor"],
    deskPositions: [[0, 0]],
  },
  {
    id: "comercial", label: "Comercial",     color: "#3b82f6", accentHex: "#3b82f6",
    x: -3, z: -8,  w: 5, d: 4,
    directors: ["director_comercial", "director_crm_ghl"],
    deskPositions: [[-1, 0], [1, 0]],
  },
  {
    id: "marketing", label: "Marketing",     color: "#ec4899", accentHex: "#ec4899",
    x: 2,  z: -8,  w: 5, d: 4,
    directors: ["director_marketing", "director_embudos"],
    deskPositions: [[-1, 0], [1, 0]],
  },
  {
    id: "contenido", label: "Contenido",     color: "#a855f7", accentHex: "#a855f7",
    x: 7,  z: -8,  w: 4, d: 4,
    directors: ["director_contenido"],
    deskPositions: [[0, 0]],
  },
  {
    id: "seo",     label: "SEO / SEM",       color: "#22c55e", accentHex: "#22c55e",
    x: -9, z: -2,  w: 5, d: 4,
    directors: ["director_seo", "director_sem"],
    deskPositions: [[-1, 0], [1, 0]],
  },
  {
    id: "meta_ads", label: "Meta Ads",       color: "#6366f1", accentHex: "#6366f1",
    x: -4, z: -2,  w: 4, d: 4,
    directors: ["director_meta_ads"],
    deskPositions: [[0, 0]],
  },
  {
    id: "google_ads", label: "Google Ads",   color: "#ef4444", accentHex: "#ef4444",
    x: 0,  z: -2,  w: 4, d: 4,
    directors: ["director_google_ads"],
    deskPositions: [[0, 0]],
  },
  {
    id: "automatizaciones", label: "Automatiz.", color: "#14b8a6", accentHex: "#14b8a6",
    x: 4,  z: -2,  w: 4, d: 4,
    directors: ["director_automatizaciones"],
    deskPositions: [[0, 0]],
  },
  {
    id: "finanzas", label: "Finanzas",       color: "#10b981", accentHex: "#10b981",
    x: 8,  z: -2,  w: 4, d: 4,
    directors: ["director_financiero", "director_llamadas_ia"],
    deskPositions: [[-1, 0], [1, 0]],
  },
  {
    id: "operaciones", label: "Operaciones", color: "#8b5cf6", accentHex: "#8b5cf6",
    x: -9, z: 2,   w: 5, d: 4,
    directors: ["director_operaciones"],
    deskPositions: [[0, 0]],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function hashStr(s: string): number {
  return s.split("").reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 0);
}

const SKIN_TONES  = ["#f5cba7", "#e8a87c", "#c68642", "#8d5524", "#f0d9b5"];
const HAIR_COLORS = ["#1a0a00", "#8b4513", "#d4a017", "#1c1c2e", "#c0392b", "#deb887"];
const SHIRT_COLORS = ["#1e3a8a", "#dc2626", "#15803d", "#7c3aed", "#1d4ed8", "#92400e"];

function directorColors(id: string) {
  const h = hashStr(id);
  return {
    skin: SKIN_TONES[h % SKIN_TONES.length]!,
    hair: HAIR_COLORS[(h >> 3) % HAIR_COLORS.length]!,
    shirt: SHIRT_COLORS[(h >> 6) % SHIRT_COLORS.length]!,
  };
}

function hexToColor(hex: string) {
  return new THREE.Color(hex);
}

// ─── Furniture ────────────────────────────────────────────────────────────────

function Desk({ position, color }: { position: [number, number, number]; color: string }) {
  const col = hexToColor(color);
  return (
    <group position={position}>
      {/* Desktop */}
      <mesh position={[0, 0.42, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.1, 0.06, 0.6]} />
        <meshStandardMaterial color="#1e1e2e" roughness={0.6} metalness={0.1} />
      </mesh>
      {/* Legs */}
      {([-0.48, 0.48] as number[]).map((ox) =>
        ([-0.24, 0.24] as number[]).map((oz) => (
          <mesh key={`${ox}-${oz}`} position={[ox, 0.21, oz]} castShadow>
            <boxGeometry args={[0.06, 0.42, 0.06]} />
            <meshStandardMaterial color="#111122" />
          </mesh>
        ))
      )}
      {/* Monitor */}
      <mesh position={[0, 0.75, -0.15]} castShadow>
        <boxGeometry args={[0.55, 0.35, 0.04]} />
        <meshStandardMaterial color="#0d0d1a" roughness={0.4} />
      </mesh>
      {/* Screen glow */}
      <mesh position={[0, 0.75, -0.13]}>
        <boxGeometry args={[0.48, 0.28, 0.01]} />
        <meshStandardMaterial color={col} emissive={col} emissiveIntensity={0.35} roughness={0} />
      </mesh>
      {/* Monitor stand */}
      <mesh position={[0, 0.49, -0.15]}>
        <boxGeometry args={[0.06, 0.1, 0.06]} />
        <meshStandardMaterial color="#0a0a14" />
      </mesh>
      {/* Keyboard */}
      <mesh position={[0, 0.46, 0.1]}>
        <boxGeometry args={[0.4, 0.02, 0.14]} />
        <meshStandardMaterial color="#1a1a28" roughness={0.8} />
      </mesh>
    </group>
  );
}

function Chair({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.28, 0]} castShadow>
        <boxGeometry args={[0.44, 0.06, 0.44]} />
        <meshStandardMaterial color="#1a1a3a" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.56, -0.19]} castShadow>
        <boxGeometry args={[0.44, 0.44, 0.06]} />
        <meshStandardMaterial color="#1a1a3a" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.12, 0]}>
        <cylinderGeometry args={[0.04, 0.06, 0.24, 6]} />
        <meshStandardMaterial color="#0a0a14" metalness={0.6} roughness={0.4} />
      </mesh>
    </group>
  );
}

function Plant({ position, color }: { position: [number, number, number]; color: string }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.14, 0]}>
        <cylinderGeometry args={[0.12, 0.1, 0.28, 6]} />
        <meshStandardMaterial color={color + "66"} roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.38, 0]}>
        <sphereGeometry args={[0.22, 6, 6]} />
        <meshStandardMaterial color="#22c55e" roughness={1} />
      </mesh>
    </group>
  );
}

// ─── Low-poly Avatar ──────────────────────────────────────────────────────────

function Plumbob({ color, state }: { color: string; state: AvatarState }) {
  const groupRef = useRef<THREE.Group>(null!);
  const plumbColor = state === "error" ? "#ef4444" : state === "completed" ? "#22d97a" : state === "working" ? color : "#6b6b8a";

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (!groupRef.current) return;
    groupRef.current.rotation.y = t * (state === "working" ? 2.5 : 0.8);
    groupRef.current.position.y = 0.12 + Math.sin(t * 1.5) * 0.06;
  });

  const mat = <meshStandardMaterial color={plumbColor} emissive={plumbColor} emissiveIntensity={state === "working" ? 0.8 : 0.3} roughness={0.1} metalness={0.5} />;
  return (
    <group ref={groupRef} position={[0, 0.12, 0]}>
      <mesh>
        <coneGeometry args={[0.1, 0.24, 4]} />
        {mat}
      </mesh>
      <mesh rotation={[Math.PI, 0, 0]} position={[0, -0.16, 0]}>
        <coneGeometry args={[0.1, 0.18, 4]} />
        {mat}
      </mesh>
    </group>
  );
}

function LowPolyAvatar({
  director, tasks, isSelected, position, onClick,
}: {
  director: DirectorConfig;
  tasks: UITask[];
  isSelected: boolean;
  position: [number, number, number];
  onClick: () => void;
}) {
  const groupRef    = useRef<THREE.Group>(null!);
  const bodyRef     = useRef<THREE.Group>(null!);
  const leftArmRef  = useRef<THREE.Mesh>(null!);
  const rightArmRef = useRef<THREE.Mesh>(null!);
  const leftLegRef  = useRef<THREE.Mesh>(null!);
  const rightLegRef = useRef<THREE.Mesh>(null!);
  const [hovered, setHovered] = useState(false);

  const state: AvatarState = useMemo(() => {
    if (tasks.some(t => t.engineId === director.id && t.status === "in_progress")) return "working";
    const last = tasks.slice().reverse().find(t => t.engineId === director.id);
    if (!last) return "idle";
    return last.status === "completed" ? "completed" : last.status === "failed" ? "error" : "idle";
  }, [tasks, director.id]);

  const { skin, hair, shirt } = directorColors(director.id);
  const completedTask = tasks.slice().reverse().find(t => t.engineId === director.id && t.status === "completed");
  const activeTask    = tasks.find(t => t.engineId === director.id && t.status === "in_progress");
  const isWorking   = state === "working";
  const isCompleted = state === "completed";

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (!bodyRef.current) return;

    // Body bob
    bodyRef.current.position.y = isWorking
      ? Math.sin(t * 4) * 0.015
      : Math.sin(t * 1.2 + hashStr(director.id) * 0.1) * 0.018;

    if (isWorking) {
      // Typing animation
      if (leftArmRef.current)  leftArmRef.current.rotation.x  = -0.7 + Math.sin(t * 10) * 0.25;
      if (rightArmRef.current) rightArmRef.current.rotation.x = -0.7 + Math.sin(t * 10 + Math.PI) * 0.25;
      if (leftLegRef.current)  leftLegRef.current.rotation.x  = 0;
      if (rightLegRef.current) rightLegRef.current.rotation.x = 0;
    } else {
      // Idle sway
      if (leftArmRef.current)  leftArmRef.current.rotation.x  = Math.sin(t * 0.9) * 0.08;
      if (rightArmRef.current) rightArmRef.current.rotation.x = Math.sin(t * 0.9 + Math.PI) * 0.08;
      if (leftLegRef.current)  leftLegRef.current.rotation.x  = 0;
      if (rightLegRef.current) rightLegRef.current.rotation.x = 0;
    }

    // Selection pulse scale
    const targetScale = (isSelected || hovered) ? 1.08 : 1.0;
    if (groupRef.current) {
      groupRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.12);
    }
  });

  const skinMat  = <meshStandardMaterial color={skin}  roughness={0.85} />;
  const hairMat  = <meshStandardMaterial color={hair}  roughness={0.9} />;
  const shirtMat = <meshStandardMaterial color={shirt} roughness={0.8} />;
  const pantsMat = <meshStandardMaterial color="#1a1a3a" roughness={0.9} />;
  const shoeMat  = <meshStandardMaterial color="#0a0a0a" roughness={0.7} />;

  return (
    <group
      ref={groupRef}
      position={position}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      onPointerEnter={() => { setHovered(true); document.body.style.cursor = "pointer"; }}
      onPointerLeave={() => { setHovered(false); document.body.style.cursor = "default"; }}
    >
      <group ref={bodyRef}>
        {/* Shadow ring on floor */}
        <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.25, 0.42, 16]} />
          <meshStandardMaterial color={isSelected ? director.color : "#000"} transparent opacity={isSelected ? 0.5 : 0.18} />
        </mesh>

        {/* Shoes */}
        <mesh ref={leftLegRef} position={[-0.12, 0.1, 0.04]} castShadow>
          <boxGeometry args={[0.18, 0.1, 0.28]} />
          {shoeMat}
        </mesh>
        <mesh ref={rightLegRef} position={[0.12, 0.1, 0.04]} castShadow>
          <boxGeometry args={[0.18, 0.1, 0.28]} />
          {shoeMat}
        </mesh>

        {/* Legs */}
        <mesh position={[-0.12, 0.42, 0]} castShadow>
          <boxGeometry args={[0.19, 0.52, 0.19]} />
          {pantsMat}
        </mesh>
        <mesh position={[0.12, 0.42, 0]} castShadow>
          <boxGeometry args={[0.19, 0.52, 0.19]} />
          {pantsMat}
        </mesh>

        {/* Torso */}
        <mesh position={[0, 0.9, 0]} castShadow>
          <boxGeometry args={[0.52, 0.52, 0.28]} />
          {shirtMat}
        </mesh>

        {/* Collar */}
        <mesh position={[0, 1.11, 0]}>
          <boxGeometry args={[0.28, 0.1, 0.15]} />
          <meshStandardMaterial color="#fff" roughness={0.9} transparent opacity={0.85} />
        </mesh>

        {/* Arms */}
        <mesh ref={leftArmRef} position={[-0.37, 0.86, 0]} rotation={[0, 0, 0.08]} castShadow>
          <boxGeometry args={[0.18, 0.5, 0.18]} />
          {shirtMat}
        </mesh>
        <mesh ref={rightArmRef} position={[0.37, 0.86, 0]} rotation={[0, 0, -0.08]} castShadow>
          <boxGeometry args={[0.18, 0.5, 0.18]} />
          {shirtMat}
        </mesh>

        {/* Hands */}
        <mesh position={[-0.37, 0.6, 0]}>
          <boxGeometry args={[0.16, 0.14, 0.14]} />
          {skinMat}
        </mesh>
        <mesh position={[0.37, 0.6, 0]}>
          <boxGeometry args={[0.16, 0.14, 0.14]} />
          {skinMat}
        </mesh>

        {/* Neck */}
        <mesh position={[0, 1.2, 0]}>
          <boxGeometry args={[0.18, 0.14, 0.18]} />
          {skinMat}
        </mesh>

        {/* Head */}
        <mesh position={[0, 1.52, 0]} castShadow>
          <boxGeometry args={[0.42, 0.46, 0.40]} />
          {skinMat}
        </mesh>

        {/* Eyes */}
        <mesh position={[-0.11, 1.54, 0.2]}>
          <boxGeometry args={[0.1, 0.08, 0.04]} />
          <meshStandardMaterial color="#fff" />
        </mesh>
        <mesh position={[0.11, 1.54, 0.2]}>
          <boxGeometry args={[0.1, 0.08, 0.04]} />
          <meshStandardMaterial color="#fff" />
        </mesh>
        <mesh position={[-0.11, 1.54, 0.22]}>
          <boxGeometry args={[0.06, 0.06, 0.04]} />
          <meshStandardMaterial color="#1a0800" />
        </mesh>
        <mesh position={[0.11, 1.54, 0.22]}>
          <boxGeometry args={[0.06, 0.06, 0.04]} />
          <meshStandardMaterial color="#1a0800" />
        </mesh>

        {/* Mouth */}
        <mesh position={[0, 1.42, 0.21]}>
          <boxGeometry args={[0.14, 0.04, 0.04]} />
          <meshStandardMaterial color={isCompleted || isWorking ? "#8b3a00" : "#9a4a1a"} />
        </mesh>

        {/* Hair */}
        <mesh position={[0, 1.76, 0]} castShadow>
          <boxGeometry args={[0.44, 0.18, 0.42]} />
          {hairMat}
        </mesh>
        {/* Hair sides */}
        <mesh position={[-0.23, 1.63, 0]}>
          <boxGeometry args={[0.04, 0.22, 0.38]} />
          {hairMat}
        </mesh>
        <mesh position={[0.23, 1.63, 0]}>
          <boxGeometry args={[0.04, 0.22, 0.38]} />
          {hairMat}
        </mesh>

        {/* Plumbob above head */}
        <group position={[0, 2.05, 0]}>
          <Plumbob color={director.color} state={state} />
        </group>

        {/* Completion popup */}
        {isCompleted && completedTask && (
          <Html position={[0, 2.6, 0]} center distanceFactor={6} zIndexRange={[100, 0]}>
            <div style={{
              background: "rgba(34,217,122,0.95)",
              color: "#fff",
              padding: "5px 12px",
              borderRadius: 20,
              fontSize: 11,
              fontWeight: 700,
              whiteSpace: "nowrap",
              pointerEvents: "none",
              boxShadow: "0 4px 16px rgba(34,217,122,0.5)",
              border: "1px solid rgba(255,255,255,0.3)",
            }}>
              ✅ Tarea completada
            </div>
          </Html>
        )}

        {/* Working status bubble */}
        {isWorking && activeTask && (
          <Html position={[0, 2.6, 0]} center distanceFactor={6} zIndexRange={[100, 0]}>
            <div style={{
              background: "rgba(15,15,30,0.92)",
              color: director.color,
              padding: "4px 10px",
              borderRadius: 14,
              fontSize: 10,
              fontWeight: 600,
              whiteSpace: "nowrap",
              pointerEvents: "none",
              border: `1px solid ${director.color}60`,
              boxShadow: `0 2px 12px ${director.color}30`,
              maxWidth: 140,
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}>
              ⚡ {activeTask.currentStep?.slice(0, 22) ?? "Trabajando…"}
            </div>
          </Html>
        )}

        {/* Name tag (shown when selected or hovered) */}
        {(isSelected || hovered) && (
          <Html position={[0, -0.1, 0]} center distanceFactor={8} zIndexRange={[50, 0]}>
            <div style={{
              background: "rgba(10,10,20,0.92)",
              color: director.color,
              padding: "3px 10px",
              borderRadius: 10,
              fontSize: 10,
              fontWeight: 700,
              whiteSpace: "nowrap",
              pointerEvents: "none",
              border: `1px solid ${director.color}50`,
            }}>
              {director.humanName} · {director.shortName}
            </div>
          </Html>
        )}

        {/* Selected glow ring */}
        {isSelected && (
          <SelectedRing color={director.color} />
        )}
      </group>
    </group>
  );
}

function SelectedRing({ color }: { color: string }) {
  const meshRef = useRef<THREE.Mesh>(null!);
  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const s = 1 + Math.sin(clock.getElapsedTime() * 3) * 0.08;
    meshRef.current.scale.set(s, 1, s);
    (meshRef.current.material as THREE.MeshStandardMaterial).opacity = 0.5 + Math.sin(clock.getElapsedTime() * 3) * 0.2;
  });
  return (
    <mesh ref={meshRef} position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.44, 0.56, 32]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1} transparent opacity={0.5} />
    </mesh>
  );
}

// ─── Department Room ──────────────────────────────────────────────────────────

function DeptRoom({ dept, tasks, activeDirectorId, onDirectorSelect }: {
  dept: Dept;
  tasks: UITask[];
  activeDirectorId: EngineId | null;
  onDirectorSelect: (id: EngineId) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const isActive = dept.directors.some(d => tasks.some(t => t.engineId === d && t.status === "in_progress"));
  const col = hexToColor(dept.color);
  const cx = dept.x + dept.w / 2;
  const cz = dept.z + dept.d / 2;

  // Wall glow animation
  const glowRef = useRef<THREE.PointLight>(null!);
  useFrame(({ clock }) => {
    if (!glowRef.current) return;
    glowRef.current.intensity = isActive
      ? 0.6 + Math.sin(clock.getElapsedTime() * 2) * 0.3
      : 0;
  });

  return (
    <group position={[cx, 0, cz]}>
      {/* Floor tile */}
      <mesh
        position={[0, 0.005, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
      >
        <planeGeometry args={[dept.w - 0.12, dept.d - 0.12]} />
        <meshStandardMaterial
          color={isActive || hovered ? dept.color : "#0d0d1e"}
          roughness={0.85}
          metalness={0.05}
          transparent
          opacity={isActive ? 0.18 : hovered ? 0.12 : 0.08}
        />
      </mesh>

      {/* Floor border */}
      <mesh position={[0, 0.004, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[dept.w - 0.08, dept.d - 0.08]} />
        <meshStandardMaterial color={dept.color} transparent opacity={isActive ? 0.5 : hovered ? 0.3 : 0.2} />
      </mesh>

      {/* Inner floor (slightly raised) */}
      <mesh position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[dept.w - 0.3, dept.d - 0.3]} />
        <meshStandardMaterial color={isActive ? "#111128" : "#0a0a18"} roughness={0.9} />
      </mesh>

      {/* Low walls (perimeter) */}
      {/* Front wall */}
      <mesh position={[0, 0.3, dept.d / 2 - 0.04]} castShadow receiveShadow>
        <boxGeometry args={[dept.w, 0.6, 0.08]} />
        <meshStandardMaterial color="#0e0e1e" roughness={0.9} />
      </mesh>
      {/* Back wall */}
      <mesh position={[0, 0.3, -dept.d / 2 + 0.04]} castShadow receiveShadow>
        <boxGeometry args={[dept.w, 0.6, 0.08]} />
        <meshStandardMaterial color="#0e0e1e" roughness={0.9} />
      </mesh>
      {/* Left wall */}
      <mesh position={[-dept.w / 2 + 0.04, 0.3, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.08, 0.6, dept.d]} />
        <meshStandardMaterial color="#0e0e1e" roughness={0.9} />
      </mesh>
      {/* Right wall */}
      <mesh position={[dept.w / 2 - 0.04, 0.3, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.08, 0.6, dept.d]} />
        <meshStandardMaterial color="#0e0e1e" roughness={0.9} />
      </mesh>

      {/* Wall-top accent strip */}
      {["front", "back", "left", "right"].map((side, i) => {
        const p = side === "front"  ? [0, 0.63, dept.d / 2 - 0.04] as [number,number,number] :
                  side === "back"   ? [0, 0.63, -dept.d / 2 + 0.04] as [number,number,number] :
                  side === "left"   ? [-dept.w / 2 + 0.04, 0.63, 0] as [number,number,number] :
                                      [dept.w / 2 - 0.04, 0.63, 0] as [number,number,number];
        const sz: [number,number,number] = (side === "front" || side === "back") ? [dept.w, 0.05, 0.09] : [0.09, 0.05, dept.d];
        return (
          <mesh key={i} position={p}>
            <boxGeometry args={sz} />
            <meshStandardMaterial color={col} emissive={col} emissiveIntensity={isActive ? 0.6 : 0.2} />
          </mesh>
        );
      })}

      {/* Department label */}
      <Html position={[0, 0.72, -dept.d / 2 + 0.06]} center distanceFactor={10} zIndexRange={[20, 0]}>
        <div style={{
          color: dept.color,
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          pointerEvents: "none",
          textShadow: `0 0 8px ${dept.color}`,
          whiteSpace: "nowrap",
        }}>
          {dept.label}
        </div>
      </Html>

      {/* Active glow light */}
      <pointLight ref={glowRef} position={[0, 1.5, 0]} color={dept.color} intensity={0} distance={6} decay={2} />

      {/* Furniture */}
      {dept.deskPositions.slice(0, dept.directors.length).map(([ox, oz], i) => (
        <group key={i}>
          <Desk position={[ox * 1.4, 0, oz + 0.2]} color={dept.color} />
          <Chair position={[ox * 1.4, 0, oz + 0.9]} />
          {i === 0 && <Plant position={[-dept.w / 2 + 0.5, 0, -dept.d / 2 + 0.5]} color={dept.color} />}
        </group>
      ))}

      {/* Avatars */}
      {dept.directors.map((dirId, i) => {
        const d = DIRECTOR_MAP[dirId as keyof typeof DIRECTOR_MAP];
        if (!d) return null;
        const dirTasks = tasks.filter(t => t.engineId === dirId);
        const ox = dept.deskPositions[i]?.[0] ?? 0;
        const oz = dept.deskPositions[i]?.[1] ?? 0;
        return (
          <LowPolyAvatar
            key={dirId}
            director={d}
            tasks={dirTasks}
            isSelected={activeDirectorId === dirId}
            position={[ox * 1.4, 0, oz + 1.2]}
            onClick={() => onDirectorSelect(dirId as EngineId)}
          />
        );
      })}
    </group>
  );
}

// ─── Office Ground & Decorations ─────────────────────────────────────────────

function OfficeGround() {
  return (
    <group>
      {/* Main floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[38, 28]} />
        <meshStandardMaterial color="#06060f" roughness={0.95} />
      </mesh>
      {/* Subtle grid */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]}>
        <planeGeometry args={[38, 28]} />
        <meshStandardMaterial color="#0f0f20" transparent opacity={0.5} wireframe />
      </mesh>

      {/* Corridors — horizontal strips */}
      {[-0.5, 6.5].map((z, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.003, z]}>
          <planeGeometry args={[38, 0.8]} />
          <meshStandardMaterial color="#1a1a2e" roughness={0.9} transparent opacity={0.6} />
        </mesh>
      ))}

      {/* Center logo / floor decal */}
      <Html position={[0, 0.01, 0]} center distanceFactor={20} zIndexRange={[5, 0]}>
        <div style={{
          fontSize: 9,
          fontWeight: 900,
          color: "rgba(79,126,255,0.08)",
          letterSpacing: "0.4em",
          textTransform: "uppercase",
          pointerEvents: "none",
          whiteSpace: "nowrap",
        }}>
          ALLCLOSING360 HQ
        </div>
      </Html>
    </group>
  );
}

function AmbientParticles({ count = 30 }: { count?: number }) {
  const meshRef = useRef<THREE.InstancedMesh>(null!);
  const positions = useMemo(() => {
    const pos: THREE.Vector3[] = [];
    for (let i = 0; i < count; i++) {
      pos.push(new THREE.Vector3(
        (Math.random() - 0.5) * 36,
        Math.random() * 3 + 0.5,
        (Math.random() - 0.5) * 24,
      ));
    }
    return pos;
  }, [count]);
  const speeds = useMemo(() => positions.map(() => 0.3 + Math.random() * 0.7), [positions]);
  const offsets = useMemo(() => positions.map(() => Math.random() * Math.PI * 2), [positions]);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.getElapsedTime();
    const dummy = new THREE.Object3D();
    positions.forEach((p, i) => {
      dummy.position.set(p.x, p.y + Math.sin(t * speeds[i]! + offsets[i]!) * 0.4, p.z);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[0.03, 4, 4]} />
      <meshStandardMaterial color="#4f7eff" emissive="#4f7eff" emissiveIntensity={1} transparent opacity={0.6} />
    </instancedMesh>
  );
}

// ─── Camera Setup ─────────────────────────────────────────────────────────────

function CameraRig() {
  const { camera } = useThree();
  useEffect(() => {
    camera.position.set(0, 22, 18);
    camera.lookAt(0, 0, 0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}

// ─── Scene ────────────────────────────────────────────────────────────────────

function OfficeScene({ tasks, activeDirectorId, onDirectorSelect }: {
  tasks: UITask[];
  activeDirectorId: EngineId | null;
  onDirectorSelect: (id: EngineId) => void;
}) {
  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.4} color="#c0c0ff" />
      <directionalLight
        position={[12, 20, 10]}
        intensity={1.2}
        color="#fff5e0"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={80}
        shadow-camera-left={-24}
        shadow-camera-right={24}
        shadow-camera-top={18}
        shadow-camera-bottom={-18}
      />
      <directionalLight position={[-8, 10, -8]} intensity={0.3} color="#8080ff" />
      <pointLight position={[0, 8, 0]} intensity={0.5} color="#3030ff" distance={40} />

      <CameraRig />

      <OfficeGround />
      <AmbientParticles />

      {DEPTS.map((dept) => (
        <DeptRoom
          key={dept.id}
          dept={dept}
          tasks={tasks}
          activeDirectorId={activeDirectorId}
          onDirectorSelect={onDirectorSelect}
        />
      ))}

      <OrbitControls
        makeDefault
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 2.4}
        minDistance={8}
        maxDistance={45}
        enablePan={true}
        panSpeed={0.8}
        rotateSpeed={0.5}
        zoomSpeed={0.8}
        target={[0, 0, 0]}
      />
    </>
  );
}

// ─── Main Export ─────────────────────────────────────────────────────────────

export default function SimsOffice3D({ tasks, activeDirectorId, onDirectorSelect }: Props) {
  const [selectedDirectorId, setSelectedDirectorId] = useState<string | null>(null);

  function handleSelect(id: EngineId) {
    onDirectorSelect(id);
    setSelectedDirectorId(id);
  }

  const selectedDirector = selectedDirectorId
    ? DIRECTOR_MAP[selectedDirectorId as keyof typeof DIRECTOR_MAP] ?? null
    : null;

  const processingCount = tasks.filter(t => t.status === "in_progress").length;
  const completedCount  = tasks.filter(t => t.status === "completed").length;

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", background: "#030308", overflow: "hidden" }}>
      {/* HUD header */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, zIndex: 10,
        padding: "10px 16px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: "linear-gradient(180deg, rgba(3,3,10,0.9) 0%, transparent 100%)",
        pointerEvents: "none",
      }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.16em", color: "rgba(79,126,255,0.7)", textTransform: "uppercase" }}>
            ALLCLOSING360 HQ · Vista 3D
          </div>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#fff", marginTop: 1 }}>
            Oficina Virtual IA
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <Stat label="Directores" value={DIRECTORS.length} color="#4f7eff" />
          <Stat label="Trabajando" value={processingCount} color="#f59e0b" active={processingCount > 0} />
          <Stat label="Completadas" value={completedCount} color="#22d97a" />
        </div>
      </div>

      {/* Controls hint */}
      <div style={{
        position: "absolute", bottom: 12, left: 12, zIndex: 10,
        fontSize: 9, color: "rgba(255,255,255,0.3)",
        pointerEvents: "none",
        lineHeight: 1.8,
      }}>
        🖱️ Arrastrar · Scroll zoom · Click avatar para detalles
      </div>

      {/* R3F Canvas */}
      <Canvas
        shadows
        dpr={[1, 1.5]}
        style={{ width: "100%", height: "100%" }}
        gl={{ antialias: true, alpha: false }}
        camera={{ fov: 50, near: 0.1, far: 200 }}
      >
        <color attach="background" args={["#030308"]} />
        <fog attach="fog" args={["#030308", 30, 80]} />
        <Suspense fallback={null}>
          <OfficeScene
            tasks={tasks}
            activeDirectorId={activeDirectorId}
            onDirectorSelect={handleSelect}
          />
        </Suspense>
      </Canvas>

      {/* Director side panel */}
      {selectedDirector && (
        <DirectorSidePanel
          director={selectedDirector}
          tasks={tasks.filter(t => t.engineId === selectedDirectorId)}
          onClose={() => setSelectedDirectorId(null)}
        />
      )}
    </div>
  );
}

// ─── Mini stat pill ───────────────────────────────────────────────────────────

function Stat({ label, value, color, active }: { label: string; value: number; color: string; active?: boolean }) {
  return (
    <div style={{
      background: "rgba(10,10,20,0.8)",
      border: `1px solid ${color}40`,
      borderRadius: 8,
      padding: "4px 12px",
      textAlign: "center",
      boxShadow: active ? `0 0 10px ${color}40` : "none",
      transition: "box-shadow 0.3s ease",
    }}>
      <div style={{ fontSize: 16, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 8, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</div>
    </div>
  );
}
