"use client";

import React, { useRef, useMemo, Suspense, Component } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Html, ContactShadows, Float, Text } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";
import { DIRECTORS } from "../lib/engines";
import type { DirectorConfig } from "../lib/engines";
import type { UITask } from "./TasksPanel";
import type { EngineId } from "@ac360/types";

// ─── Layout ──────────────────────────────────────────────────────────────────

const DESK_GRID: { id: EngineId; x: number; z: number; zone: string }[] = [
  // CEO corner — back-right
  { id: "ceo_advisor",               x:  20,  z: -17, zone: "direccion" },
  // Marketing & Growth — back row (left + center)
  { id: "director_marketing",        x: -18,  z: -14, zone: "marketing" },
  { id: "director_meta_ads",         x: -12,  z: -14, zone: "marketing" },
  { id: "director_google_ads",       x:  -6,  z: -14, zone: "marketing" },
  { id: "director_sem",              x:   0,  z: -14, zone: "marketing" },
  { id: "director_seo",              x:   6,  z: -14, zone: "marketing" },
  { id: "director_contenido",        x:  12,  z: -14, zone: "contenido" },
  { id: "director_embudos",          x:  18,  z: -14, zone: "contenido" },
  // Sales + CRM + Ops — mid row
  { id: "director_comercial",        x: -18,  z:  -7, zone: "ventas" },
  { id: "director_crm_ghl",          x: -12,  z:  -7, zone: "ventas" },
  { id: "director_financiero",       x:  -6,  z:  -7, zone: "finanzas" },
  { id: "director_operaciones",      x:   0,  z:  -7, zone: "operaciones" },
  { id: "director_automatizaciones", x:   6,  z:  -7, zone: "operaciones" },
  { id: "director_llamadas_ia",      x:  12,  z:  -7, zone: "ia" },
  { id: "director_producto",         x:  18,  z:  -7, zone: "ia" },
];

const ZONE_META: Record<string, { label: string; color: string }> = {
  direccion:   { label: "Dirección General",  color: "#f59e0b" },
  marketing:   { label: "Marketing & Growth", color: "#ec4899" },
  contenido:   { label: "Contenido",          color: "#a855f7" },
  ventas:      { label: "Ventas & CRM",       color: "#3b82f6" },
  finanzas:    { label: "Finanzas",           color: "#10b981" },
  operaciones: { label: "Operaciones",        color: "#8b5cf6" },
  ia:          { label: "IA & Producto",      color: "#06b6d4" },
};

const IDLE_SPOTS: THREE.Vector3[] = [
  new THREE.Vector3(-4, 0, 5),
  new THREE.Vector3(4,  0, 6),
  new THREE.Vector3(0,  0, 8),
  new THREE.Vector3(-8, 0, 4),
  new THREE.Vector3(8,  0, 4),
];

const SKIN_TONES  = ["#f5c9a0","#c8906c","#f0b090","#d4956a","#f5d0b0","#e8a87c","#c07850","#f0b88a","#d4a574","#e8956c","#f5d0b0","#c89060","#e0a070","#d4956a","#f0c8a0"];
const HAIR_COLORS = ["#1a0a00","#0d0d0d","#3d1f00","#1c1c1c","#5c3d1a","#0a0520","#2a1200","#8B4513","#1a0a00","#0d0d0d","#2d1200","#0a0a0a","#4a2800","#190d00","#0a0520"];
const SUIT_TINTS  = [0.9, 0.85, 0.92, 0.88, 0.9, 0.85, 0.92, 0.88, 0.9, 0.87, 0.92, 0.86, 0.9, 0.88, 0.92];

function darken(hex: string, factor: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgb(${Math.round(r * factor)},${Math.round(g * factor)},${Math.round(b * factor)})`;
}

// ─── Error boundary ───────────────────────────────────────────────────────────

class CanvasErrorBoundary extends Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; fallback: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() { return { hasError: true }; }
  override render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}

// ─── 2.5D Fallback ────────────────────────────────────────────────────────────

function FallbackOffice({ directors, tasks, activeDirectorId, onDirectorSelect }: {
  directors: DirectorConfig[];
  tasks: UITask[];
  activeDirectorId: EngineId | null;
  onDirectorSelect: (id: EngineId) => void;
}) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))", gap: 8, padding: 16, overflow: "auto", height: "100%", background: "#030308" }}>
      {directors.map((d) => {
        const task = tasks.find((t) => t.engineId === d.id && t.status === "in_progress");
        const isActive = d.id === activeDirectorId;
        return (
          <button key={d.id} onClick={() => onDirectorSelect(d.id)} style={{ background: isActive ? `${d.color}22` : "#0d0d18", border: `1px solid ${isActive ? d.color : "#1e1e3a"}`, borderRadius: 10, padding: "10px 8px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <div style={{ fontSize: 22 }}>{d.icon}</div>
            <div style={{ fontSize: 10, fontWeight: 700, color: d.color }}>{d.shortName}</div>
            {task && (
              <div style={{ width: "100%", height: 3, borderRadius: 2, background: `${d.color}33`, position: "relative" }}>
                <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${task.progress}%`, borderRadius: 2, background: d.color, transition: "width 0.3s" }} />
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ─── Office floor ─────────────────────────────────────────────────────────────

function OfficeFloor() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, -0.02, 0]}>
      <planeGeometry args={[56, 52]} />
      <meshStandardMaterial color="#0b0b18" roughness={0.2} metalness={0.55} />
    </mesh>
  );
}

// ─── Ceiling with LED panels ──────────────────────────────────────────────────

function Ceiling() {
  const strips: [number, number, number][] = [
    [-9, 4.1, -14], [0, 4.1, -14], [9, 4.1, -14],
    [-9, 4.1, -7],  [0, 4.1, -7],  [9, 4.1, -7],
    [0,  4.1, 0],   [0,  4.1, 8],
  ];
  return (
    <group>
      <mesh position={[0, 4.1, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[56, 52]} />
        <meshStandardMaterial color="#080812" roughness={0.9} />
      </mesh>
      {strips.map(([x, y, z], i) => (
        <mesh key={i} position={[x, y, z]}>
          <boxGeometry args={[5, 0.04, 0.3]} />
          <meshStandardMaterial color="#c8d8ff" emissive="#c8d8ff" emissiveIntensity={1.8} />
        </mesh>
      ))}
    </group>
  );
}

// ─── Perimeter walls ──────────────────────────────────────────────────────────

function Walls() {
  return (
    <group>
      {/* North wall */}
      <mesh position={[0, 2, -25.9]} castShadow>
        <boxGeometry args={[56, 4.2, 0.15]} />
        <meshStandardMaterial color="#0a0a1c" roughness={0.9} />
      </mesh>
      {/* South wall */}
      <mesh position={[0, 2, 25.9]}>
        <boxGeometry args={[56, 4.2, 0.15]} />
        <meshStandardMaterial color="#0a0a1c" roughness={0.9} />
      </mesh>
      {/* West wall */}
      <mesh position={[-27.9, 2, 0]}>
        <boxGeometry args={[0.15, 4.2, 52]} />
        <meshStandardMaterial color="#0a0a1c" roughness={0.9} />
      </mesh>
      {/* East wall */}
      <mesh position={[27.9, 2, 0]}>
        <boxGeometry args={[0.15, 4.2, 52]} />
        <meshStandardMaterial color="#0a0a1c" roughness={0.9} />
      </mesh>
      {/* Wall accent LED strips */}
      <mesh position={[0, 3.85, -25.85]}>
        <boxGeometry args={[54, 0.06, 0.04]} />
        <meshStandardMaterial color="#4f7eff" emissive="#4f7eff" emissiveIntensity={3} />
      </mesh>
      <mesh position={[0, 0.08, -25.85]}>
        <boxGeometry args={[54, 0.05, 0.04]} />
        <meshStandardMaterial color="#4f7eff" emissive="#4f7eff" emissiveIntensity={2} />
      </mesh>
      <mesh position={[-27.85, 3.85, 0]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[50, 0.06, 0.04]} />
        <meshStandardMaterial color="#4f7eff" emissive="#4f7eff" emissiveIntensity={2} />
      </mesh>
      <mesh position={[27.85, 3.85, 0]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[50, 0.06, 0.04]} />
        <meshStandardMaterial color="#4f7eff" emissive="#4f7eff" emissiveIntensity={2} />
      </mesh>
    </group>
  );
}

// ─── Zone floor highlights ────────────────────────────────────────────────────

function ZoneFloor({ x, z, w, d, color }: { x: number; z: number; w: number; d: number; color: string }) {
  return (
    <mesh position={[x, -0.01, z]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[w, d]} />
      <meshStandardMaterial color={color} transparent opacity={0.07} roughness={1} />
    </mesh>
  );
}

// ─── Glass partition ──────────────────────────────────────────────────────────

function GlassWall({ x, y, z, w, h, rotY = 0 }: { x: number; y: number; z: number; w: number; h: number; rotY?: number }) {
  return (
    <group position={[x, y, z]} rotation={[0, rotY, 0]}>
      <mesh castShadow>
        <boxGeometry args={[w, h, 0.06]} />
        <meshStandardMaterial color="#4f7eff" transparent opacity={0.09} roughness={0.05} metalness={0.1} />
      </mesh>
      {/* Top frame */}
      <mesh position={[0, h / 2, 0]}>
        <boxGeometry args={[w, 0.06, 0.07]} />
        <meshStandardMaterial color="#1e2a4a" metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Bottom frame */}
      <mesh position={[0, -h / 2, 0]}>
        <boxGeometry args={[w, 0.06, 0.07]} />
        <meshStandardMaterial color="#1e2a4a" metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Glow top edge */}
      <mesh position={[0, h / 2 + 0.03, 0]}>
        <boxGeometry args={[w, 0.03, 0.04]} />
        <meshStandardMaterial color="#4f7eff" emissive="#4f7eff" emissiveIntensity={2} />
      </mesh>
    </group>
  );
}

// ─── KPI Screen (north wall) ──────────────────────────────────────────────────

function KPIScreen({ position, tasks }: { position: [number, number, number]; tasks: UITask[] }) {
  const completed  = tasks.filter((t) => t.status === "completed").length;
  const inProgress = tasks.filter((t) => t.status === "in_progress").length;
  const totalTokens = tasks.reduce((sum, t) => sum + (t.estimatedTokens ?? 0), 0);

  return (
    <group position={position}>
      {/* Frame */}
      <mesh castShadow>
        <boxGeometry args={[8, 4.5, 0.14]} />
        <meshStandardMaterial color="#080814" roughness={0.4} metalness={0.7} />
      </mesh>
      {/* Screen glow bg */}
      <mesh position={[0, 0, 0.08]}>
        <boxGeometry args={[7.5, 4.0, 0.02]} />
        <meshStandardMaterial color="#03060f" emissive="#030820" emissiveIntensity={1.5} />
      </mesh>
      {/* Bezel glow */}
      <mesh position={[0, 0, 0.07]}>
        <boxGeometry args={[7.6, 4.1, 0.01]} />
        <meshStandardMaterial color="#4f7eff" emissive="#4f7eff" emissiveIntensity={0.6} transparent opacity={0.4} />
      </mesh>
      {/* HTML overlay */}
      <Html transform position={[0, 0, 0.15]} scale={0.25} style={{ pointerEvents: "none" }}>
        <div style={{ width: 720, height: 390, background: "transparent", fontFamily: "monospace", color: "#c8d8ff", padding: 20, boxSizing: "border-box" }}>
          <div style={{ fontSize: 14, fontWeight: 900, letterSpacing: "0.15em", color: "#4f7eff", marginBottom: 14, textTransform: "uppercase" }}>
            ▶ ALLCLOSING360 — Live Dashboard
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12, marginBottom: 16 }}>
            {[
              { label: "TAREAS COMPLETADAS", value: completed, color: "#10b981", icon: "✓" },
              { label: "EN PROCESO",         value: inProgress, color: "#f59e0b", icon: "⚡" },
              { label: "DIRECTORES ACTIVOS", value: 15,        color: "#4f7eff", icon: "👥" },
              { label: "TOKENS USADOS",      value: totalTokens > 0 ? `${(totalTokens / 1000).toFixed(1)}K` : "—", color: "#a855f7", icon: "🧠" },
            ].map((kpi) => (
              <div key={kpi.label} style={{ background: `${kpi.color}11`, border: `1px solid ${kpi.color}33`, borderRadius: 8, padding: "10px 12px" }}>
                <div style={{ fontSize: 22, fontWeight: 900, color: kpi.color }}>{kpi.icon} {kpi.value}</div>
                <div style={{ fontSize: 9, color: "#6080a0", marginTop: 4, letterSpacing: "0.08em" }}>{kpi.label}</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 10, color: "#2a3a5a", borderTop: "1px solid #1a2a4a", paddingTop: 10, letterSpacing: "0.06em" }}>
            SISTEMA OPERATIVO IA · 15 DIRECTORES · 47 SKILLS · TIEMPO REAL
          </div>
        </div>
      </Html>
    </group>
  );
}

// ─── Secondary screen ─────────────────────────────────────────────────────────

function MonitorScreen({ position, color, label }: { position: [number, number, number]; color: string; label: string }) {
  return (
    <group position={position}>
      <mesh castShadow>
        <boxGeometry args={[3.5, 2.2, 0.1]} />
        <meshStandardMaterial color="#070710" roughness={0.4} metalness={0.7} />
      </mesh>
      <mesh position={[0, 0, 0.06]}>
        <boxGeometry args={[3.1, 1.9, 0.02]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.4} transparent opacity={0.9} />
      </mesh>
      <Html transform position={[0, 0, 0.1]} scale={0.18} style={{ pointerEvents: "none" }}>
        <div style={{ width: 380, height: 220, fontFamily: "monospace", color: "#fff", padding: 16, background: "transparent" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color, marginBottom: 8, letterSpacing: "0.1em" }}>{label.toUpperCase()}</div>
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} style={{ fontSize: 9, color: "#4060a0", borderBottom: "1px solid #0a1628", paddingBottom: 4, marginBottom: 4, display: "flex", justifyContent: "space-between" }}>
              <span>────────────────</span>
              <span style={{ color: color + "bb" }}>{Math.round(Math.random() * 100)}%</span>
            </div>
          ))}
        </div>
      </Html>
    </group>
  );
}

// ─── Neon sign ────────────────────────────────────────────────────────────────

function NeonSign({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={[10, 1.1, 0.1]} />
        <meshStandardMaterial color="#050510" roughness={0.6} />
      </mesh>
      <Text position={[0, 0, 0.07]} fontSize={0.46} color="#4f7eff" anchorX="center" anchorY="middle"
        // @ts-ignore
        material-emissive="#4f7eff" material-emissiveIntensity={3.5}>
        ALLCLOSING360 OS
      </Text>
      <mesh position={[0, -0.46, 0.07]}>
        <boxGeometry args={[9, 0.04, 0.01]} />
        <meshStandardMaterial color="#4f7eff" emissive="#4f7eff" emissiveIntensity={5} />
      </mesh>
      <mesh position={[0, 0.46, 0.07]}>
        <boxGeometry args={[9, 0.04, 0.01]} />
        <meshStandardMaterial color="#4f7eff" emissive="#4f7eff" emissiveIntensity={5} />
      </mesh>
    </group>
  );
}

// ─── Reception desk ───────────────────────────────────────────────────────────

function ReceptionDesk({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Main counter */}
      <mesh position={[0, 1.1, 0]} castShadow>
        <boxGeometry args={[6, 0.1, 1.2]} />
        <meshStandardMaterial color="#0f0f2a" roughness={0.2} metalness={0.6} />
      </mesh>
      {/* Counter glow edge */}
      <mesh position={[0, 1.16, -0.59]}>
        <boxGeometry args={[6, 0.04, 0.02]} />
        <meshStandardMaterial color="#4f7eff" emissive="#4f7eff" emissiveIntensity={3} />
      </mesh>
      {/* Body front panel */}
      <mesh position={[0, 0.55, -0.58]} castShadow>
        <boxGeometry args={[6, 1.1, 0.06]} />
        <meshStandardMaterial color="#080818" roughness={0.5} metalness={0.4} />
      </mesh>
      {/* Logo on front panel */}
      <Text position={[0, 0.55, -0.54]} fontSize={0.22} color="#4f7eff" anchorX="center" anchorY="middle"
        // @ts-ignore
        material-emissive="#4f7eff" material-emissiveIntensity={2}>
        ALLCLOSING360
      </Text>
      {/* Left wing */}
      <mesh position={[-3.5, 0.65, -0.2]} castShadow>
        <boxGeometry args={[1, 1.3, 0.8]} />
        <meshStandardMaterial color="#080818" roughness={0.5} />
      </mesh>
      {/* Right wing */}
      <mesh position={[3.5, 0.65, -0.2]} castShadow>
        <boxGeometry args={[1, 1.3, 0.8]} />
        <meshStandardMaterial color="#080818" roughness={0.5} />
      </mesh>
      {/* Small monitor on desk */}
      <mesh position={[1.5, 1.42, -0.2]}>
        <boxGeometry args={[0.8, 0.6, 0.04]} />
        <meshStandardMaterial color="#4f7eff" emissive="#4f7eff" emissiveIntensity={1.5} />
      </mesh>
      {/* Chair behind desk */}
      <mesh position={[0, 0.52, 0.5]}>
        <cylinderGeometry args={[0.25, 0.25, 0.06, 8]} />
        <meshStandardMaterial color="#1a1a3a" roughness={0.8} />
      </mesh>
    </group>
  );
}

// ─── Meeting table ────────────────────────────────────────────────────────────

function MeetingRoom({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Table surface */}
      <mesh position={[0, 0.78, 0]} castShadow receiveShadow>
        <boxGeometry args={[4.5, 0.08, 1.8]} />
        <meshStandardMaterial color="#0d0d22" roughness={0.2} metalness={0.5} />
      </mesh>
      {/* Table edge glow */}
      <mesh position={[0, 0.83, 0]}>
        <boxGeometry args={[4.5, 0.02, 1.8]} />
        <meshStandardMaterial color="#4f7eff" emissive="#4f7eff" emissiveIntensity={1.2} transparent opacity={0.6} />
      </mesh>
      {/* Table legs */}
      {([ [-2.0, -0.75], [2.0, -0.75], [-2.0, 0.75], [2.0, 0.75] ] as [number, number][]).map(([xo, zo], i) => (
        <mesh key={i} position={[xo, 0.38, zo]}>
          <cylinderGeometry args={[0.05, 0.05, 0.76, 8]} />
          <meshStandardMaterial color="#1a1a38" metalness={0.7} roughness={0.3} />
        </mesh>
      ))}
      {/* Chairs around table */}
      {([[-1.6, -1.15], [0, -1.15], [1.6, -1.15], [-1.6, 1.15], [0, 1.15], [1.6, 1.15]] as [number, number][]).map(([xo, zo], i) => (
        <group key={i} position={[xo, 0, zo]} rotation={[0, zo < 0 ? 0 : Math.PI, 0]}>
          <mesh position={[0, 0.48, 0]}>
            <cylinderGeometry args={[0.22, 0.22, 0.06, 8]} />
            <meshStandardMaterial color="#1a1a3a" roughness={0.8} />
          </mesh>
          <mesh position={[0, 0.76, 0.18]}>
            <boxGeometry args={[0.42, 0.44, 0.06]} />
            <meshStandardMaterial color="#1a1a3a" roughness={0.8} />
          </mesh>
          <mesh position={[0, 0.24, 0]}>
            <cylinderGeometry args={[0.03, 0.03, 0.48, 6]} />
            <meshStandardMaterial color="#111" />
          </mesh>
          <mesh position={[0, 0.04, 0]}>
            <cylinderGeometry args={[0.24, 0.24, 0.05, 5]} />
            <meshStandardMaterial color="#111" />
          </mesh>
        </group>
      ))}
      {/* Room label */}
      <Text position={[0, 1.8, -0.85]} fontSize={0.2} color="#4f7eff" anchorX="center" anchorY="middle"
        // @ts-ignore
        material-emissive="#4f7eff" material-emissiveIntensity={2}>
        SALA DE REUNIONES
      </Text>
    </group>
  );
}

// ─── Desk ─────────────────────────────────────────────────────────────────────

function Desk({ position, color }: { position: [number, number, number]; color: string }) {
  return (
    <group position={position}>
      {/* Surface */}
      <mesh position={[0, 0.75, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.6, 0.06, 0.8]} />
        <meshStandardMaterial color="#111122" roughness={0.3} metalness={0.4} />
      </mesh>
      {/* Desk edge glow */}
      <mesh position={[0, 0.78, -0.38]}>
        <boxGeometry args={[1.6, 0.025, 0.01]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.5} />
      </mesh>
      {/* Legs (metal) */}
      {([ [-0.72, 0], [0.72, 0] ] as [number, number][]).map(([xo, zo], i) => (
        <mesh key={i} position={[xo, 0.36, zo]} castShadow>
          <boxGeometry args={[0.05, 0.72, 0.05]} />
          <meshStandardMaterial color="#16163a" metalness={0.7} roughness={0.3} />
        </mesh>
      ))}
      {/* Back beam */}
      <mesh position={[0, 0.36, 0.36]}>
        <boxGeometry args={[1.4, 0.05, 0.05]} />
        <meshStandardMaterial color="#16163a" metalness={0.6} roughness={0.3} />
      </mesh>
      {/* Monitor */}
      <mesh position={[0, 1.14, 0.26]} castShadow>
        <boxGeometry args={[0.78, 0.52, 0.04]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2.5} roughness={0.3} />
      </mesh>
      {/* Monitor stand */}
      <mesh position={[0, 0.84, 0.26]}>
        <cylinderGeometry args={[0.02, 0.04, 0.2, 6]} />
        <meshStandardMaterial color="#222" metalness={0.5} />
      </mesh>
      {/* Keyboard */}
      <mesh position={[0, 0.78, -0.04]}>
        <boxGeometry args={[0.42, 0.018, 0.14]} />
        <meshStandardMaterial color="#0d0d20" roughness={0.7} />
      </mesh>
      {/* Small decoration */}
      <mesh position={[0.6, 0.78, -0.3]}>
        <cylinderGeometry args={[0.04, 0.04, 0.12, 6]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.8} />
      </mesh>
    </group>
  );
}

// ─── Chair ────────────────────────────────────────────────────────────────────

function Chair({ position, color }: { position: [number, number, number]; color: string }) {
  return (
    <group position={position}>
      {/* Seat cushion */}
      <mesh position={[0, 0.48, 0]} castShadow>
        <boxGeometry args={[0.5, 0.08, 0.48]} />
        <meshStandardMaterial color={darken(color, 0.35)} roughness={0.85} />
      </mesh>
      {/* Back rest */}
      <mesh position={[0, 0.82, 0.21]} castShadow>
        <boxGeometry args={[0.46, 0.58, 0.07]} />
        <meshStandardMaterial color={darken(color, 0.35)} roughness={0.85} />
      </mesh>
      {/* Back rest top */}
      <mesh position={[0, 1.1, 0.21]}>
        <boxGeometry args={[0.46, 0.04, 0.07]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.4} />
      </mesh>
      {/* Pole */}
      <mesh position={[0, 0.24, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 0.48, 6]} />
        <meshStandardMaterial color="#111" metalness={0.5} />
      </mesh>
      {/* Star base */}
      <mesh position={[0, 0.04, 0]}>
        <cylinderGeometry args={[0.27, 0.27, 0.05, 5]} />
        <meshStandardMaterial color="#111" metalness={0.5} />
      </mesh>
    </group>
  );
}

// ─── Plants ───────────────────────────────────────────────────────────────────

function Plant({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.2, 0]} castShadow>
        <cylinderGeometry args={[0.14, 0.11, 0.38, 8]} />
        <meshStandardMaterial color="#6b3e26" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.72, 0]} castShadow>
        <sphereGeometry args={[0.3, 9, 9]} />
        <meshStandardMaterial color="#1a7a3c" roughness={1} />
      </mesh>
      <mesh position={[0.22, 0.62, 0]} castShadow>
        <sphereGeometry args={[0.18, 7, 7]} />
        <meshStandardMaterial color="#1f8f44" roughness={1} />
      </mesh>
      <mesh position={[-0.2, 0.56, 0.1]} castShadow>
        <sphereGeometry args={[0.16, 7, 7]} />
        <meshStandardMaterial color="#167a38" roughness={1} />
      </mesh>
    </group>
  );
}

// ─── Lounge furniture ─────────────────────────────────────────────────────────

function Sofa({ position }: { position: [number, number, number] }) {
  return (
    <group position={position} rotation={[0, Math.PI, 0]}>
      <mesh position={[0, 0.24, 0]} castShadow>
        <boxGeometry args={[1.9, 0.48, 0.72]} />
        <meshStandardMaterial color="#1e2456" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.62, 0.3]} castShadow>
        <boxGeometry args={[1.88, 0.52, 0.2]} />
        <meshStandardMaterial color="#1e2456" roughness={0.9} />
      </mesh>
      {[-0.85, 0.85].map((x, i) => (
        <mesh key={i} position={[x, 0.52, 0]} castShadow>
          <boxGeometry args={[0.18, 0.36, 0.72]} />
          <meshStandardMaterial color="#181e45" roughness={0.9} />
        </mesh>
      ))}
      {[-0.58, 0, 0.58].map((x, i) => (
        <mesh key={i} position={[x, 0.52, -0.06]}>
          <boxGeometry args={[0.54, 0.12, 0.62]} />
          <meshStandardMaterial color="#252b65" roughness={0.8} />
        </mesh>
      ))}
      {/* Sofa accent glow */}
      <mesh position={[0, 0.72, 0.38]}>
        <boxGeometry args={[1.9, 0.03, 0.02]} />
        <meshStandardMaterial color="#4f7eff" emissive="#4f7eff" emissiveIntensity={2} />
      </mesh>
    </group>
  );
}

function CoffeeMachine({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.45, 0]} castShadow>
        <boxGeometry args={[0.38, 0.9, 0.32]} />
        <meshStandardMaterial color="#16162a" roughness={0.4} metalness={0.6} />
      </mesh>
      <mesh position={[0, 0.64, 0.165]}>
        <boxGeometry args={[0.22, 0.18, 0.01]} />
        <meshStandardMaterial color="#00ccff" emissive="#00ccff" emissiveIntensity={2} />
      </mesh>
      <mesh position={[0, 0.28, 0.22]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.025, 0.025, 0.12, 6]} />
        <meshStandardMaterial color="#888" metalness={0.8} />
      </mesh>
      <mesh position={[0, 0.12, 0.1]}>
        <cylinderGeometry args={[0.05, 0.04, 0.09, 8]} />
        <meshStandardMaterial color="#e8e0d0" roughness={0.6} />
      </mesh>
    </group>
  );
}

// ─── Director avatar (Sims-style humanoid) ────────────────────────────────────

interface AvatarProps {
  director: DirectorConfig;
  dirIndex: number;
  homePos: [number, number, number];
  isActive: boolean;
  task?: UITask;
  onSelect: () => void;
}

type WalkPhase = "desk" | "walk_out" | "at_spot" | "walk_home";

function DirectorAvatar({ director, dirIndex, homePos, isActive, task, onSelect }: AvatarProps) {
  const groupRef    = useRef<THREE.Group>(null!);
  const torsoRef    = useRef<THREE.Group>(null!);
  const leftArmRef  = useRef<THREE.Group>(null!);
  const rightArmRef = useRef<THREE.Group>(null!);
  const leftLegRef  = useRef<THREE.Group>(null!);
  const rightLegRef = useRef<THREE.Group>(null!);

  const state = useRef<{
    phase:      WalkPhase;
    idleTimer:  number;
    timer:      number;
    currentPos: THREE.Vector3;
    targetPos:  THREE.Vector3;
    homeVec:    THREE.Vector3;
    spotIdx:    number;
  }>({
    phase:      "desk",
    idleTimer:  Math.random() * 12 + 6,
    timer:      0,
    spotIdx:    0,
    currentPos: new THREE.Vector3(...homePos),
    targetPos:  new THREE.Vector3(...homePos),
    homeVec:    new THREE.Vector3(...homePos),
  });

  const isBusy    = task?.status === "in_progress";
  const skinColor = SKIN_TONES[dirIndex % SKIN_TONES.length] ?? "#f5c9a0";
  const hairColor = HAIR_COLORS[dirIndex % HAIR_COLORS.length] ?? "#1a0a00";
  const color     = director.color;

  useFrame(({ clock }, delta) => {
    const g  = groupRef.current;
    const tb = torsoRef.current;
    const la = leftArmRef.current;
    const ra = rightArmRef.current;
    const ll = leftLegRef.current;
    const rl = rightLegRef.current;
    if (!g || !tb || !la || !ra || !ll || !rl) return;

    const s = state.current;
    const t = clock.elapsedTime;

    if (s.phase === "desk") {
      s.idleTimer -= delta;

      if (isBusy) {
        // Typing animation
        la.rotation.x = Math.sin(t * 5) * 0.22;
        ra.rotation.x = Math.sin(t * 5 + Math.PI) * 0.22;
        ll.rotation.x = 0; rl.rotation.x = 0;
        tb.rotation.y = Math.sin(t * 0.5) * 0.05;
        g.position.lerp(s.homeVec, 0.08);
        g.position.y = 0;
        s.idleTimer = Math.random() * 10 + 6;
      } else {
        // Idle breath/sway
        g.position.y = Math.sin(t * 1.2 + dirIndex) * 0.03;
        la.rotation.x = Math.sin(t * 0.9  + dirIndex) * 0.07;
        ra.rotation.x = Math.sin(t * 0.9  + dirIndex + 1.2) * 0.07;
        la.rotation.z = -0.08; ra.rotation.z = 0.08;
        ll.rotation.x = 0; rl.rotation.x = 0;
        tb.rotation.y = Math.sin(t * 0.22 + dirIndex) * 0.06;

        if (!isActive && s.idleTimer <= 0) {
          s.spotIdx   = Math.floor(Math.random() * IDLE_SPOTS.length);
          const spot  = IDLE_SPOTS[s.spotIdx];
          if (spot) { s.targetPos.copy(spot); s.phase = "walk_out"; }
          else { s.idleTimer = 10; }
        }
      }
    }

    if (s.phase === "walk_out" || s.phase === "walk_home") {
      const target = s.phase === "walk_out" ? s.targetPos : s.homeVec;
      const dir    = target.clone().sub(s.currentPos);
      const dist   = dir.length();

      if (dist < 0.25) {
        if (s.phase === "walk_out") {
          s.phase = "at_spot"; s.timer = 4 + Math.random() * 5;
        } else {
          s.phase = "desk"; s.idleTimer = Math.random() * 14 + 8;
          s.currentPos.copy(s.homeVec);
          g.position.set(s.homeVec.x, 0, s.homeVec.z);
          g.rotation.y = 0;
        }
      } else {
        dir.normalize().multiplyScalar(delta * 3.2);
        s.currentPos.add(dir);
        g.position.set(s.currentPos.x, Math.abs(Math.sin(t * 6)) * 0.05, s.currentPos.z);
        g.rotation.y = Math.atan2(dir.x, dir.z);
        // Walk swing
        la.rotation.x = Math.sin(t * 6)           * 0.55; la.rotation.z = -0.08;
        ra.rotation.x = Math.sin(t * 6 + Math.PI) * 0.55; ra.rotation.z = 0.08;
        ll.rotation.x = Math.sin(t * 6 + Math.PI) * 0.50;
        rl.rotation.x = Math.sin(t * 6)           * 0.50;
        tb.rotation.y = 0;
      }
    }

    if (s.phase === "at_spot") {
      s.timer -= delta;
      g.position.y  = Math.sin(t * 1.1) * 0.03;
      la.rotation.x = Math.sin(t * 0.8) * 0.09;
      ra.rotation.x = Math.sin(t * 0.8 + 0.6) * 0.09;
      la.rotation.z = -0.08; ra.rotation.z = 0.08;
      if (s.timer <= 0) { s.phase = "walk_home"; }
    }
  });

  const progress = task?.progress ?? 0;

  const ringBg = useMemo(() => {
    const s = new THREE.Shape(); s.absarc(0, 0, 0.42, 0, Math.PI * 2, false);
    const h = new THREE.Path();  h.absarc(0, 0, 0.35, 0, Math.PI * 2, true);
    s.holes.push(h); return s;
  }, []);

  const ringProg = useMemo(() => {
    const angle = ((progress / 100) * Math.PI * 2) || 0.001;
    const s = new THREE.Shape(); s.absarc(0, 0, 0.42, -Math.PI / 2, -Math.PI / 2 + angle, false);
    const h = new THREE.Path();  h.absarc(0, 0, 0.35, -Math.PI / 2 + angle, -Math.PI / 2, true);
    s.holes.push(h); return s;
  }, [progress]);

  // Hip height (leg group origin)
  const hipY   = 1.05;
  // Shoulder height (arm group origin)
  const shoulderY = 1.62;

  return (
    <group ref={groupRef} position={homePos} onClick={(e) => { e.stopPropagation(); onSelect(); }}>

      {/* ── Shoes ── */}
      {([-0.11, 0.11] as const).map((xo, i) => (
        <mesh key={i} position={[xo, 0.08, 0.04]} castShadow>
          <boxGeometry args={[0.13, 0.14, 0.24]} />
          <meshStandardMaterial color="#111118" roughness={0.8} />
        </mesh>
      ))}

      {/* ── Left leg group (pivot at hip) ── */}
      <group ref={leftLegRef} position={[-0.11, hipY, 0]}>
        {/* Thigh */}
        <mesh position={[0, -0.24, 0]} castShadow>
          <cylinderGeometry args={[0.10, 0.085, 0.46, 9]} />
          <meshStandardMaterial color="#12122a" roughness={0.8} />
        </mesh>
        {/* Calf */}
        <mesh position={[0, -0.68, 0]} castShadow>
          <cylinderGeometry args={[0.08, 0.075, 0.44, 9]} />
          <meshStandardMaterial color="#12122a" roughness={0.8} />
        </mesh>
      </group>

      {/* ── Right leg group ── */}
      <group ref={rightLegRef} position={[0.11, hipY, 0]}>
        <mesh position={[0, -0.24, 0]} castShadow>
          <cylinderGeometry args={[0.10, 0.085, 0.46, 9]} />
          <meshStandardMaterial color="#12122a" roughness={0.8} />
        </mesh>
        <mesh position={[0, -0.68, 0]} castShadow>
          <cylinderGeometry args={[0.08, 0.075, 0.44, 9]} />
          <meshStandardMaterial color="#12122a" roughness={0.8} />
        </mesh>
      </group>

      {/* ── Torso group ── */}
      <group ref={torsoRef}>
        {/* Waist band */}
        <mesh position={[0, hipY + 0.04, 0]} castShadow>
          <cylinderGeometry args={[0.22, 0.24, 0.14, 10]} />
          <meshStandardMaterial color={darken(color, SUIT_TINTS[dirIndex % SUIT_TINTS.length] ?? 0.9)} roughness={0.8} />
        </mesh>
        {/* Body/jacket — truncated cone (wider at shoulders) */}
        <mesh position={[0, 1.38, 0]} castShadow>
          <cylinderGeometry args={[0.22, 0.24, 0.56, 10]} />
          <meshStandardMaterial color={darken(color, SUIT_TINTS[dirIndex % SUIT_TINTS.length] ?? 0.9)} roughness={0.7} />
        </mesh>
        {/* Shirt front (accent strip) */}
        <mesh position={[0, 1.38, 0.16]}>
          <boxGeometry args={[0.1, 0.5, 0.04]} />
          <meshStandardMaterial color="#f0f0f0" roughness={0.9} />
        </mesh>
        {/* Shoulder pads */}
        {([-0.24, 0.24] as const).map((xo, i) => (
          <mesh key={i} position={[xo, shoulderY - 0.04, 0]} castShadow>
            <sphereGeometry args={[0.11, 8, 8]} />
            <meshStandardMaterial color={color} roughness={0.7} />
          </mesh>
        ))}
      </group>

      {/* ── Left arm group (pivot at shoulder) ── */}
      <group ref={leftArmRef} position={[-0.33, shoulderY, 0]}>
        {/* Upper arm */}
        <mesh position={[0, -0.18, 0]} castShadow>
          <cylinderGeometry args={[0.08, 0.075, 0.34, 8]} />
          <meshStandardMaterial color={darken(color, 0.82)} roughness={0.7} />
        </mesh>
        {/* Forearm */}
        <mesh position={[0, -0.48, 0]} castShadow>
          <cylinderGeometry args={[0.07, 0.065, 0.28, 8]} />
          <meshStandardMaterial color={skinColor} roughness={0.7} />
        </mesh>
        {/* Hand */}
        <mesh position={[0, -0.65, 0]} castShadow>
          <sphereGeometry args={[0.07, 8, 8]} />
          <meshStandardMaterial color={skinColor} roughness={0.6} />
        </mesh>
      </group>

      {/* ── Right arm group ── */}
      <group ref={rightArmRef} position={[0.33, shoulderY, 0]}>
        <mesh position={[0, -0.18, 0]} castShadow>
          <cylinderGeometry args={[0.08, 0.075, 0.34, 8]} />
          <meshStandardMaterial color={darken(color, 0.82)} roughness={0.7} />
        </mesh>
        <mesh position={[0, -0.48, 0]} castShadow>
          <cylinderGeometry args={[0.07, 0.065, 0.28, 8]} />
          <meshStandardMaterial color={skinColor} roughness={0.7} />
        </mesh>
        <mesh position={[0, -0.65, 0]} castShadow>
          <sphereGeometry args={[0.07, 8, 8]} />
          <meshStandardMaterial color={skinColor} roughness={0.6} />
        </mesh>
      </group>

      {/* ── Neck ── */}
      <mesh position={[0, 1.72, 0]} castShadow>
        <cylinderGeometry args={[0.09, 0.09, 0.16, 8]} />
        <meshStandardMaterial color={skinColor} roughness={0.7} />
      </mesh>

      {/* ── Head ── */}
      <mesh position={[0, 1.9, 0]} castShadow>
        <sphereGeometry args={[0.24, 16, 16]} />
        <meshStandardMaterial color={skinColor} roughness={0.65} />
      </mesh>
      {/* Eyes */}
      {([-0.09, 0.09] as const).map((xo, i) => (
        <group key={i} position={[xo, 1.95, 0.2]}>
          <mesh>
            <sphereGeometry args={[0.04, 7, 7]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>
          <mesh position={[0, 0, 0.02]}>
            <sphereGeometry args={[0.025, 6, 6]} />
            <meshStandardMaterial color="#0d0820" />
          </mesh>
        </group>
      ))}
      {/* Hair cap */}
      <mesh position={[0, 2.03, -0.02]}>
        <sphereGeometry args={[0.245, 12, 12, 0, Math.PI * 2, 0, Math.PI * 0.54]} />
        <meshStandardMaterial color={hairColor} roughness={0.9} />
      </mesh>
      {/* Ear */}
      {([-0.24, 0.24] as const).map((xo, i) => (
        <mesh key={i} position={[xo, 1.9, 0]}>
          <sphereGeometry args={[0.06, 6, 6]} />
          <meshStandardMaterial color={skinColor} roughness={0.7} />
        </mesh>
      ))}

      {/* ── Active glow ring ── */}
      {isActive && (
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.42, 0.5, 32]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={3} side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* ── Progress ring ── */}
      {isBusy && (
        <group position={[0, 2.7, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <mesh>
            <shapeGeometry args={[ringBg]} />
            <meshStandardMaterial color="#1a1a2e" side={THREE.DoubleSide} />
          </mesh>
          <mesh>
            <shapeGeometry args={[ringProg]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2} side={THREE.DoubleSide} />
          </mesh>
        </group>
      )}

      {/* ── Name label ── */}
      <Html position={[0, 2.95, 0]} center distanceFactor={14} style={{ pointerEvents: "none" }}>
        <div style={{ background: "rgba(6,6,18,0.92)", border: `1px solid ${color}66`, borderRadius: 5, padding: "3px 8px", whiteSpace: "nowrap", fontSize: 11, color, fontWeight: 700, fontFamily: "monospace", textShadow: `0 0 10px ${color}`, backdropFilter: "blur(4px)" }}>
          {director.shortName}
          {isBusy && <span style={{ marginLeft: 4, opacity: 0.7 }}>{progress}%</span>}
        </div>
      </Html>

      {/* ── Thought bubble ── */}
      {isBusy && task?.currentStep && (
        <Html position={[0.6, 2.3, 0]} distanceFactor={16} style={{ pointerEvents: "none" }}>
          <div style={{ background: "rgba(6,6,18,0.92)", border: `1px solid ${color}44`, borderRadius: 6, padding: "3px 8px", maxWidth: 130, fontSize: 9, color: "rgba(200,210,255,0.9)", fontFamily: "monospace", lineHeight: 1.4 }}>
            💭 {task.currentStep}
          </div>
        </Html>
      )}
    </group>
  );
}

// ─── Full scene ───────────────────────────────────────────────────────────────

function SceneContent({ tasks, activeDirectorId, onDirectorSelect }: {
  tasks: UITask[];
  activeDirectorId: EngineId | null;
  onDirectorSelect: (id: EngineId) => void;
}) {
  const taskByDirector = useMemo(() => {
    const m = new Map<string, UITask>();
    for (const t of tasks) {
      if (t.status === "in_progress" || t.status === "completed") {
        const ex = m.get(t.engineId);
        if (!ex || ex.status === "completed") m.set(t.engineId, t);
      }
    }
    return m;
  }, [tasks]);

  return (
    <>
      {/* ── Lighting ── */}
      <ambientLight intensity={0.45} color="#8899dd" />
      {/* Main sun */}
      <directionalLight position={[6, 20, 8]} intensity={1.4} color="#ffffff" castShadow
        shadow-mapSize-width={2048} shadow-mapSize-height={2048}
        shadow-camera-far={70} shadow-camera-left={-28} shadow-camera-right={28}
        shadow-camera-top={28} shadow-camera-bottom={-28} />
      {/* Zone accent lights */}
      <pointLight position={[-14, 3.8, -14]} intensity={1.6} color="#ec4899" distance={16} decay={2} />
      <pointLight position={[ 10, 3.8, -14]} intensity={1.2} color="#06b6d4" distance={16} decay={2} />
      <pointLight position={[-14, 3.8,  -7]} intensity={1.2} color="#3b82f6" distance={16} decay={2} />
      <pointLight position={[ 10, 3.8,  -7]} intensity={1.2} color="#8b5cf6" distance={16} decay={2} />
      {/* CEO corner */}
      <pointLight position={[20,  3.8, -17]} intensity={2.0} color="#f59e0b" distance={12} decay={2} />
      {/* Reception */}
      <pointLight position={[0,   3.5,  18]} intensity={1.6} color="#4f7eff" distance={18} decay={2} />
      {/* KPI screen glow */}
      <pointLight position={[0,   2.5, -24]} intensity={2.0} color="#4f7eff" distance={12} decay={2} />
      {/* Break room */}
      <pointLight position={[0,   3.0,   8]} intensity={1.0} color="#00ccff" distance={14} decay={2} />

      {/* ── Structure ── */}
      <OfficeFloor />
      <Ceiling />
      <Walls />

      {/* ── Zone floors ── */}
      <ZoneFloor x={-6}  z={-14} w={28} d={6}  color="#ec4899" />  {/* Marketing */}
      <ZoneFloor x={14}  z={-14} w={10} d={6}  color="#a855f7" />  {/* Contenido */}
      <ZoneFloor x={20}  z={-17} w={8}  d={5}  color="#f59e0b" />  {/* CEO */}
      <ZoneFloor x={-12} z={-7}  w={10} d={6}  color="#3b82f6" />  {/* Ventas */}
      <ZoneFloor x={-3}  z={-7}  w={8}  d={6}  color="#10b981" />  {/* Finanzas/Ops */}
      <ZoneFloor x={6}   z={-7}  w={8}  d={6}  color="#8b5cf6" />  {/* Operaciones */}
      <ZoneFloor x={15}  z={-7}  w={10} d={6}  color="#06b6d4" />  {/* IA */}
      <ZoneFloor x={0}   z={16}  w={18} d={10} color="#4f7eff" />  {/* Reception */}

      {/* ── Walls / partitions ── */}
      {/* North wall sign */}
      <NeonSign position={[0, 3.0, -25.6]} />
      {/* KPI screen on north wall */}
      <KPIScreen position={[0, 2.0, -25.55]} tasks={tasks} />
      {/* Side screens */}
      <MonitorScreen position={[-20, 2.2, -25.5]} color="#ec4899" label="Marketing KPIs" />
      <MonitorScreen position={[ 20, 2.2, -25.5]} color="#06b6d4" label="IA & Producto" />

      {/* CEO glass walls */}
      <GlassWall x={16.5} y={1.5} z={-15} w={0.08} h={3} rotY={Math.PI / 2} />
      <GlassWall x={22}   y={1.5} z={-14.5} w={5.5} h={3} />

      {/* Work floor / break room divider */}
      <GlassWall x={0} y={1.5} z={1.5} w={56} h={3} />
      {/* Glow strip on divider */}
      <mesh position={[0, 3.05, 1.5]}>
        <boxGeometry args={[56, 0.05, 0.05]} />
        <meshStandardMaterial color="#4f7eff" emissive="#4f7eff" emissiveIntensity={3} />
      </mesh>

      {/* Meeting room (left side) */}
      <GlassWall x={-22} y={1.5} z={4.5}  w={0.08} h={3} rotY={Math.PI / 2} />
      <GlassWall x={-22} y={1.5} z={9.5}  w={0.08} h={3} rotY={Math.PI / 2} />
      <GlassWall x={-18} y={1.5} z={7}    w={5.5}  h={3} />
      <GlassWall x={-25} y={1.5} z={7}    w={5.5}  h={3} />
      <MeetingRoom position={[-22, 0, 7]} />

      {/* ── Desks & chairs ── */}
      {DESK_GRID.map((dg) => {
        const dir = DIRECTORS.find((d) => d.id === dg.id);
        if (!dir) return null;
        return (
          <group key={dg.id}>
            <Desk  position={[dg.x, 0, dg.z]} color={dir.color} />
            <Chair position={[dg.x, 0, dg.z + 1.0]} color={dir.color} />
          </group>
        );
      })}

      {/* ── Avatars ── */}
      {DESK_GRID.map((dg, idx) => {
        const dir = DIRECTORS.find((d) => d.id === dg.id);
        if (!dir) return null;
        const task = taskByDirector.get(dg.id);
        return (
          <DirectorAvatar
            key={dg.id}
            director={dir}
            dirIndex={idx}
            homePos={[dg.x, 0, dg.z + 1.2]}
            isActive={activeDirectorId === dg.id}
            task={task}
            onSelect={() => onDirectorSelect(dg.id)}
          />
        );
      })}

      {/* ── Reception area ── */}
      <ReceptionDesk position={[0, 0, 18]} />
      {/* Welcome mat */}
      <mesh position={[0, -0.01, 21]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[4, 2.5]} />
        <meshStandardMaterial color="#0d1428" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.0, 21]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[3.5, 0.05]} />
        <meshStandardMaterial color="#4f7eff" emissive="#4f7eff" emissiveIntensity={1} />
      </mesh>

      {/* ── Break room props ── */}
      <CoffeeMachine position={[-10, 0, 8]} />
      <Sofa          position={[ 10, 0, 9]} />
      <Sofa          position={[-3,  0, 9]} />
      {/* Coffee table between sofas */}
      <mesh position={[3.5, 0.35, 9.5]} castShadow>
        <boxGeometry args={[1.4, 0.07, 0.7]} />
        <meshStandardMaterial color="#0d0d22" roughness={0.3} metalness={0.5} />
      </mesh>
      <mesh position={[3.5, 0.39, 9.5]}>
        <boxGeometry args={[1.4, 0.02, 0.7]} />
        <meshStandardMaterial color="#4f7eff" emissive="#4f7eff" emissiveIntensity={0.8} transparent opacity={0.5} />
      </mesh>

      {/* ── Vending machine / water ── */}
      <group position={[24, 0, -8]}>
        <mesh position={[0, 1.0, 0]} castShadow>
          <boxGeometry args={[0.72, 2.0, 0.5]} />
          <meshStandardMaterial color="#0d1632" roughness={0.5} metalness={0.3} />
        </mesh>
        <mesh position={[0, 1.1, 0.26]}>
          <boxGeometry args={[0.56, 1.2, 0.02]} />
          <meshStandardMaterial color="#0033aa" emissive="#0033aa" emissiveIntensity={1} transparent opacity={0.7} />
        </mesh>
        <mesh position={[0, 2.05, 0]}>
          <boxGeometry args={[0.7, 0.08, 0.48]} />
          <meshStandardMaterial color="#ffaa00" emissive="#ffaa00" emissiveIntensity={2.5} />
        </mesh>
      </group>

      {/* ── Plants ── */}
      <Float speed={0.5} rotationIntensity={0.08} floatIntensity={0.12}>
        <Plant position={[-25, 0, -22]} scale={1.3} />
      </Float>
      <Float speed={0.6} rotationIntensity={0.08} floatIntensity={0.1}>
        <Plant position={[25,  0, -22]} scale={1.1} />
      </Float>
      <Float speed={0.4} rotationIntensity={0.06} floatIntensity={0.1}>
        <Plant position={[-25, 0,  5]}  scale={1.4} />
      </Float>
      <Plant position={[25,  0,  5]}  scale={1.2} />
      <Plant position={[-6,  0,  5]}  scale={0.9} />
      <Plant position={[6,   0,  5]}  scale={1.0} />
      <Plant position={[-6,  0, 22]}  scale={1.1} />
      <Plant position={[6,   0, 22]}  scale={1.0} />
      <Plant position={[15,  0, 22]}  scale={0.9} />
      <Plant position={[-15, 0, 22]}  scale={0.9} />

      {/* ── Zone labels ── */}
      {Object.entries(ZONE_META).map(([zone, meta]) => {
        const dg = DESK_GRID.find((d) => d.zone === zone);
        if (!dg) return null;
        return (
          <Text
            key={zone}
            position={[dg.x, 3.6, dg.z - 3.2]}
            fontSize={0.18}
            color={meta.color}
            anchorX="center"
            anchorY="middle"
            // @ts-ignore
            material-emissive={meta.color}
            material-emissiveIntensity={1.5}
          >
            {meta.label.toUpperCase()}
          </Text>
        );
      })}

      {/* ── Shadows ── */}
      <ContactShadows position={[0, -0.01, 0]} scale={60} far={9} blur={2.5} opacity={0.55} color="#000011" />

      {/* ── Camera controls ── */}
      <OrbitControls
        enableDamping dampingFactor={0.06}
        maxPolarAngle={Math.PI / 2.1}
        minPolarAngle={Math.PI / 7}
        maxDistance={42}
        minDistance={5}
        target={[0, 1, -4]}
      />

      {/* ── Post-processing ── */}
      <EffectComposer>
        <Bloom luminanceThreshold={0.28} luminanceSmoothing={0.28} intensity={1.4} />
      </EffectComposer>
    </>
  );
}

// ─── Public interface ─────────────────────────────────────────────────────────

export interface OfficeScene3DProps {
  tasks: UITask[];
  activeDirectorId: EngineId | null;
  onDirectorSelect: (id: EngineId) => void;
}

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
        camera={{ position: [0, 22, 30], fov: 50 }}
        gl={{ antialias: true, alpha: false }}
        style={{ background: "#040410", width: "100%", height: "100%" }}
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
