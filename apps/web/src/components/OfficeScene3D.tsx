"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { EngineId } from "@ac360/types";
import type { UITask } from "./TasksPanel";
import { DIRECTORS, DIRECTOR_MAP } from "../lib/engines";

// ─── Props ─────────────────────────────────────────────────────────────────────
interface Props {
  tasks: UITask[];
  activeDirectorId: EngineId | null;
  onDirectorSelect: (id: EngineId) => void;
}

type AgentStatus = "idle" | "working" | "done" | "failed";

// ─── CSS animations (injected once) ────────────────────────────────────────────
const OFFICE_CSS = `
@keyframes idle-bob    { 0%,100%{transform:translateY(0px)}  50%{transform:translateY(-4px)} }
@keyframes idle-bob2   { 0%,100%{transform:translateY(-2px)} 50%{transform:translateY(3px)}  }
@keyframes type-work   {
  0%,100%{transform:translateY(0) rotate(-1deg)}
  33%{transform:translateY(-2px) rotate(1.5deg)}
  66%{transform:translateY(-1px) rotate(-0.5deg)}
}
@keyframes done-fly    { 0%{transform:translateX(-50%) translateY(0) scale(0.8);opacity:0} 40%{opacity:1} 100%{transform:translateX(-50%) translateY(-28px) scale(1.1);opacity:0} }
@keyframes spin        { to{transform:rotate(360deg)} }
@keyframes led-pulse   { 0%,100%{opacity:0.4} 50%{opacity:1} }
@keyframes glow-pulse  { 0%,100%{opacity:0.6} 50%{opacity:1} }
@keyframes shimmer     { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
@keyframes grid-pulse  { 0%,100%{opacity:0.025} 50%{opacity:0.05} }
@keyframes panel-in    { from{transform:translateX(20px);opacity:0} to{transform:translateX(0);opacity:1} }
@keyframes avatar-in   { from{transform:translate(-50%,-50%) scale(0.88);opacity:0} to{transform:translate(-50%,-50%) scale(1);opacity:1} }
@keyframes alert-ring  { 0%,100%{transform:scale(1);opacity:0.8} 50%{transform:scale(1.3);opacity:0} }
@keyframes monitor-flicker { 0%,97%,100%{opacity:1} 98%{opacity:0.85} }
@keyframes scan-line   { 0%{top:0} 100%{top:100%} }
`;

// ─── Room definitions ───────────────────────────────────────────────────────────
interface RoomDef {
  id: string;
  label: string;
  l: number; t: number; w: number; h: number;
  color: string;
  icon: string;
}

const ROOMS: RoomDef[] = [
  { id:"marketing",   label:"MARKETING",    l:0,  t:0,  w:26, h:42, color:"#ec4899", icon:"📣" },
  { id:"reception",   label:"RECEPCIÓN",    l:26, t:0,  w:48, h:14, color:"#4f7eff", icon:"🏢" },
  { id:"direccion",   label:"DIRECCIÓN",    l:74, t:0,  w:26, h:25, color:"#f59e0b", icon:"👑" },
  { id:"comercial",   label:"COMERCIAL",    l:26, t:14, w:48, h:24, color:"#3b82f6", icon:"💼" },
  { id:"contenido",   label:"CONTENIDO",    l:74, t:25, w:26, h:23, color:"#a855f7", icon:"✍️" },
  { id:"ia",          label:"SALA IA",      l:0,  t:42, w:26, h:38, color:"#14b8a6", icon:"⚡" },
  { id:"meetings",    label:"MEETINGS",     l:26, t:38, w:48, h:22, color:"#06b6d4", icon:"🤝" },
  { id:"operaciones", label:"OPERACIONES",  l:74, t:48, w:26, h:22, color:"#8b5cf6", icon:"⚙️" },
  { id:"finanzas",    label:"FINANZAS",     l:26, t:60, w:48, h:20, color:"#10b981", icon:"💰" },
];

// Director → room
const DIR_ROOM: Record<string, string> = {
  director_marketing:"marketing", director_meta_ads:"marketing",
  director_sem:"marketing",       director_seo:"marketing",
  ceo_advisor:"direccion",        director_producto:"direccion",
  director_comercial:"comercial", director_embudos:"comercial",
  director_contenido:"contenido",
  director_automatizaciones:"ia", director_crm_ghl:"ia", director_llamadas_ia:"ia",
  director_operaciones:"operaciones",
  director_financiero:"finanzas", director_google_ads:"finanzas",
};

// Avatar positions (% of full container). Desk slightly below avatar.
const AVATAR_POS: Record<string, { l:number; t:number }> = {
  director_marketing:       { l:7,  t:11 },
  director_meta_ads:        { l:18, t:11 },
  director_sem:             { l:7,  t:25 },
  director_seo:             { l:18, t:25 },
  ceo_advisor:              { l:80, t:8  },
  director_producto:        { l:91, t:8  },
  director_comercial:       { l:39, t:22 },
  director_embudos:         { l:60, t:22 },
  director_contenido:       { l:84, t:33 },
  director_automatizaciones:{ l:7,  t:48 },
  director_crm_ghl:         { l:18, t:48 },
  director_llamadas_ia:     { l:7,  t:60 },
  director_operaciones:     { l:84, t:55 },
  director_financiero:      { l:39, t:67 },
  director_google_ads:      { l:60, t:67 },
};

// ─── Monitor ────────────────────────────────────────────────────────────────────
function Monitor({ color, w=34, h=22 }: { color:string; w?:number; h?:number }) {
  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:1,pointerEvents:"none"}}>
      <div style={{
        width:w, height:h, borderRadius:3,
        background:"#02050d",
        border:`1px solid ${color}45`,
        boxShadow:`0 0 14px ${color}20, inset 0 0 6px rgba(0,0,0,0.8)`,
        position:"relative",
        overflow:"hidden",
        animation:"monitor-flicker 8s ease-in-out infinite",
      }}>
        <div style={{position:"absolute",top:3,left:3,right:3,bottom:3,display:"flex",flexDirection:"column",gap:2}}>
          <div style={{height:2,width:"72%",background:color,borderRadius:1,opacity:0.85}} />
          <div style={{height:2,width:"50%",background:color,borderRadius:1,opacity:0.5}} />
          <div style={{height:2,width:"88%",background:color,borderRadius:1,opacity:0.65}} />
          <div style={{height:2,width:"40%",background:color,borderRadius:1,opacity:0.35}} />
          <div style={{height:2,width:"65%",background:color,borderRadius:1,opacity:0.55}} />
        </div>
        {/* scan line */}
        <div style={{
          position:"absolute",left:0,right:0,height:1,
          background:`linear-gradient(90deg,transparent,${color}60,transparent)`,
          animation:"scan-line 4s linear infinite",
          opacity:0.4,
        }} />
      </div>
      <div style={{width:3,height:5,background:"rgba(255,255,255,0.1)"}} />
      <div style={{width:14,height:2,borderRadius:1,background:"rgba(255,255,255,0.07)"}} />
    </div>
  );
}

// ─── Desk ───────────────────────────────────────────────────────────────────────
function WorkDesk({ color, l, t }: { color:string; l:number; t:number }) {
  return (
    <div style={{
      position:"absolute",
      left:`${l}%`, top:`${t}%`,
      transform:"translate(-50%,-50%)",
      display:"flex", flexDirection:"column", alignItems:"center", gap:2,
      pointerEvents:"none", zIndex:2,
    }}>
      <Monitor color={color} />
      {/* Desk surface */}
      <div style={{
        width:80, height:26,
        borderRadius:6,
        background:"linear-gradient(160deg,#121828 0%,#090e1c 100%)",
        border:"1px solid rgba(255,255,255,0.07)",
        boxShadow:"0 4px 16px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.035)",
        display:"flex", alignItems:"center", justifyContent:"center", gap:5,
      }}>
        {/* Keyboard */}
        <div style={{
          width:32, height:9, borderRadius:2,
          background:"rgba(255,255,255,0.04)",
          border:"1px solid rgba(255,255,255,0.06)",
        }} />
        {/* Mousepad */}
        <div style={{
          width:14, height:11, borderRadius:3,
          background:`${color}08`,
          border:`1px solid ${color}15`,
        }} />
        {/* Small item */}
        <div style={{width:8,height:8,borderRadius:"50%",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.05)"}} />
      </div>
      {/* Chair */}
      <div style={{
        width:26, height:10, borderRadius:"50%",
        background:`${color}08`,
        border:`1px solid ${color}18`,
        marginTop:-6, zIndex:1,
      }} />
    </div>
  );
}

// ─── Human Avatar ───────────────────────────────────────────────────────────────
function HumanAvatar({
  dirId, status, isActive, bobIdx, onSelect, justDone,
}: {
  dirId: EngineId;
  status: AgentStatus;
  isActive: boolean;
  bobIdx: number;
  onSelect: (id: EngineId) => void;
  justDone: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const dir = DIRECTOR_MAP[dirId];
  const pos = AVATAR_POS[dirId as string];
  if (!dir || !pos) return null;

  const isWorking = status === "working";
  const bobAnim   = bobIdx % 2 === 0 ? "idle-bob" : "idle-bob2";
  const bobDur    = 1.8 + (bobIdx * 0.28) % 1.4;
  const bodyAnim  = isWorking
    ? `type-work ${0.38 + (bobIdx % 4) * 0.06}s ease-in-out infinite`
    : `${bobAnim} ${bobDur}s ease-in-out infinite`;

  // Hair colors variety
  const hairColors = ["#0f0800","#1a0800","#2d1200","#1a1200","#080808","#1a0f00"];
  const hairColor  = hairColors[bobIdx % hairColors.length];

  return (
    <div
      style={{
        position:"absolute",
        left:`${pos.l}%`, top:`${pos.t}%`,
        transform:"translate(-50%,-50%)",
        zIndex: isActive || hovered ? 35 : 15,
        cursor:"pointer",
        animation:"avatar-in 0.45s ease-out both",
      }}
      onClick={(e) => { e.stopPropagation(); onSelect(dirId); }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Done pop */}
      {justDone && (
        <div style={{
          position:"absolute", top:-10, left:"50%",
          animation:"done-fly 1.8s ease-out forwards",
          fontSize:20, zIndex:50, pointerEvents:"none",
        }}>✅</div>
      )}

      {/* Tooltip */}
      {hovered && !isActive && (
        <div style={{
          position:"absolute", bottom:"110%", left:"50%",
          transform:"translateX(-50%)",
          marginBottom:6,
          background:"rgba(4,7,16,0.97)",
          border:`1px solid ${dir.color}45`,
          borderRadius:10,
          padding:"9px 13px",
          whiteSpace:"nowrap",
          boxShadow:`0 10px 40px ${dir.color}25, 0 2px 8px rgba(0,0,0,0.6)`,
          backdropFilter:"blur(20px)",
          zIndex:100, pointerEvents:"none",
        }}>
          <div style={{fontSize:12,fontWeight:800,color:dir.color,marginBottom:2}}>{dir.humanName}</div>
          <div style={{fontSize:10,color:"rgba(255,255,255,0.55)"}}>
            {dir.name} · <span style={{color:"rgba(255,255,255,0.3)"}}>{dir.department}</span>
          </div>
          <div style={{
            marginTop:7, paddingTop:7,
            borderTop:"1px solid rgba(255,255,255,0.06)",
            fontSize:9, color:"#22c55e",
            display:"flex", alignItems:"center", gap:5,
          }}>
            <div style={{width:6,height:6,borderRadius:"50%",background:"#22c55e",boxShadow:"0 0 5px #22c55e"}} />
            ONLINE — click para activar
          </div>
        </div>
      )}

      {/* Working spinner */}
      {isWorking && (
        <div style={{
          position:"absolute", top:-5, left:"50%",
          transform:"translateX(-50%)",
          width:55, height:55, borderRadius:"50%",
          border:"2px solid transparent",
          borderTopColor:dir.color,
          borderRightColor:`${dir.color}50`,
          animation:"spin 1.1s linear infinite",
          pointerEvents:"none",
        }} />
      )}

      {/* Active glow ring */}
      {isActive && !isWorking && (
        <div style={{
          position:"absolute", top:-4, left:"50%",
          transform:"translateX(-50%)",
          width:52, height:52, borderRadius:"50%",
          border:`1.5px solid ${dir.color}55`,
          animation:"glow-pulse 2s ease-in-out infinite",
          pointerEvents:"none",
        }} />
      )}

      {/* Online status dot */}
      <div style={{
        position:"absolute", top:0, right:-1,
        width:9, height:9, borderRadius:"50%",
        background: isWorking ? "#fbbf24" : status === "failed" ? "#ef4444" : "#22c55e",
        border:"1.5px solid rgba(6,9,18,0.9)",
        boxShadow:`0 0 7px ${isWorking ? "#fbbf24" : "#22c55e"}`,
        animation:"glow-pulse 2.5s ease-in-out infinite",
        zIndex:10,
      }} />

      {/* Animated body */}
      <div style={{
        animation:bodyAnim,
        display:"flex", flexDirection:"column", alignItems:"center", gap:1,
        filter: isActive
          ? `drop-shadow(0 0 12px ${dir.color}) drop-shadow(0 3px 6px rgba(0,0,0,0.6))`
          : hovered
          ? `drop-shadow(0 0 7px ${dir.color}90) drop-shadow(0 2px 4px rgba(0,0,0,0.5))`
          : "drop-shadow(0 3px 6px rgba(0,0,0,0.5))",
        transform: hovered ? "scale(1.12)" : isActive ? "scale(1.07)" : "scale(1)",
        transition:"transform 0.22s ease, filter 0.22s ease",
      }}>
        {/* HEAD */}
        <div style={{
          width:28, height:28, borderRadius:"50%",
          background:"linear-gradient(135deg,#f2d9b8,#d4a574)",
          border:`2.5px solid ${isActive ? dir.color : hovered ? `${dir.color}70` : "rgba(255,255,255,0.12)"}`,
          position:"relative", flexShrink:0, overflow:"visible",
          boxShadow: isActive ? `0 0 14px ${dir.color}60` : "0 3px 8px rgba(0,0,0,0.4)",
          transition:"border-color 0.2s, box-shadow 0.2s",
        }}>
          {/* Hair */}
          <div style={{
            position:"absolute", top:-2, left:-2, right:-2,
            height:"52%",
            background:`linear-gradient(180deg,${hairColor},${hairColor}cc)`,
            borderRadius:"50% 50% 0 0",
          }} />
          {/* Eyes */}
          <div style={{position:"absolute",top:12,left:5,width:5,height:5,borderRadius:"50%",background:"#1a0800"}}>
            <div style={{width:2,height:2,borderRadius:"50%",background:"rgba(255,255,255,0.8)",marginLeft:2,marginTop:-1}} />
          </div>
          <div style={{position:"absolute",top:12,right:5,width:5,height:5,borderRadius:"50%",background:"#1a0800"}}>
            <div style={{width:2,height:2,borderRadius:"50%",background:"rgba(255,255,255,0.8)",marginLeft:1,marginTop:-1}} />
          </div>
          {/* Nose */}
          <div style={{position:"absolute",top:17,left:"50%",transform:"translateX(-50%)",width:3,height:2,borderRadius:"50%",background:"rgba(0,0,0,0.15)"}} />
          {/* Mouth */}
          <div style={{
            position:"absolute", bottom:5, left:"50%",
            transform:"translateX(-50%)",
            width:10, height:4,
            borderRadius:"0 0 6px 6px",
            border:"1px solid rgba(80,30,10,0.35)",
            borderTop:"none",
          }} />
        </div>

        {/* COLLAR */}
        <div style={{
          width:20, height:6,
          background:"rgba(255,255,255,0.08)",
          borderRadius:"3px 3px 0 0",
          flexShrink:0,
        }} />

        {/* TORSO / SHIRT */}
        <div style={{
          width:30, height:24,
          borderRadius:"4px 4px 6px 6px",
          background:`linear-gradient(180deg,${dir.color}ee 0%,${dir.color}88 100%)`,
          border:`1px solid ${dir.color}55`,
          display:"flex", alignItems:"center", justifyContent:"center",
          position:"relative", flexShrink:0,
        }}>
          <span style={{fontSize:8,fontWeight:900,color:"rgba(255,255,255,0.95)",letterSpacing:"0.06em"}}>
            {dir.initials}
          </span>

          {/* Arms when working */}
          {isWorking && (
            <>
              <div style={{
                position:"absolute", left:-10, top:"35%",
                width:10, height:4,
                background:`linear-gradient(90deg,${dir.color}aa,${dir.color})`,
                borderRadius:"3px 0 0 3px",
                animation:"type-work 0.38s ease-in-out infinite",
              }} />
              <div style={{
                position:"absolute", right:-10, top:"35%",
                width:10, height:4,
                background:`linear-gradient(270deg,${dir.color}aa,${dir.color})`,
                borderRadius:"0 3px 3px 0",
                animation:"type-work 0.38s ease-in-out infinite reverse",
              }} />
            </>
          )}
        </div>

        {/* LEGS */}
        <div style={{display:"flex",gap:5,marginTop:1}}>
          <div style={{width:11,height:10,borderRadius:"2px 2px 4px 4px",background:"rgba(255,255,255,0.1)"}} />
          <div style={{width:11,height:10,borderRadius:"2px 2px 4px 4px",background:"rgba(255,255,255,0.1)"}} />
        </div>
      </div>

      {/* Name tag */}
      <div style={{
        marginTop:4, fontSize:9, fontWeight:700,
        color: isActive ? dir.color : "rgba(255,255,255,0.6)",
        textAlign:"center", whiteSpace:"nowrap",
        background:"rgba(4,6,14,0.88)",
        padding:"2px 6px", borderRadius:4,
        letterSpacing:"0.03em",
        transition:"color 0.2s",
        backdropFilter:"blur(8px)",
      }}>
        {dir.humanName.split(" ")[0]}
      </div>
    </div>
  );
}

// ─── Room Zone ──────────────────────────────────────────────────────────────────
function RoomZone({ room, isActive }: { room:RoomDef; isActive:boolean }) {
  const [hov, setHov] = useState(false);
  const r = parseInt(room.color.slice(1,3),16);
  const g = parseInt(room.color.slice(3,5),16);
  const b = parseInt(room.color.slice(5,7),16);

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        position:"absolute",
        left:`${room.l}%`, top:`${room.t}%`,
        width:`${room.w}%`, height:`${room.h}%`,
        background: isActive
          ? `rgba(${r},${g},${b},0.09)`
          : hov
          ? `rgba(${r},${g},${b},0.05)`
          : `rgba(${r},${g},${b},0.03)`,
        borderRight:`1px solid rgba(255,255,255,0.035)`,
        borderBottom:`1px solid rgba(255,255,255,0.035)`,
        transition:"background 0.4s ease",
        boxShadow: isActive ? `inset 0 0 60px rgba(${r},${g},${b},0.08)` : "none",
      }}
    >
      {/* Label */}
      <div style={{
        position:"absolute", top:8, left:10,
        display:"flex", alignItems:"center", gap:5,
        zIndex:5, pointerEvents:"none",
      }}>
        <span style={{fontSize:11}}>{room.icon}</span>
        <div style={{
          fontSize:8.5, fontWeight:800,
          color: isActive ? room.color : "rgba(255,255,255,0.18)",
          letterSpacing:"0.13em",
          transition:"color 0.3s",
        }}>{room.label}</div>
      </div>

      {/* Active LED top strip */}
      {isActive && (
        <div style={{
          position:"absolute", top:0, left:0, right:0, height:2,
          background:`linear-gradient(90deg,transparent,${room.color},transparent)`,
          animation:"led-pulse 1.5s ease-in-out infinite",
        }} />
      )}

      {/* Glass wall effect on right */}
      {room.l + room.w < 100 && (
        <div style={{
          position:"absolute", right:0, top:"10%", bottom:"10%", width:1,
          background:`linear-gradient(180deg,transparent,rgba(255,255,255,0.06),rgba(255,255,255,0.1),rgba(255,255,255,0.06),transparent)`,
        }} />
      )}
    </div>
  );
}

// ─── Reception area ─────────────────────────────────────────────────────────────
function Reception() {
  return (
    <div style={{
      position:"absolute",
      left:"26%", top:"0%",
      width:"48%", height:"14%",
      display:"flex", flexDirection:"column",
      alignItems:"center", justifyContent:"center",
      gap:3, zIndex:8, pointerEvents:"none",
    }}>
      {/* Logo */}
      <div style={{
        fontSize:20, fontWeight:900, letterSpacing:"0.18em",
        background:"linear-gradient(90deg,#4f7eff,#a78bfa,#4f7eff)",
        backgroundSize:"200% 100%",
        WebkitBackgroundClip:"text",
        WebkitTextFillColor:"transparent",
        animation:"shimmer 5s linear infinite",
      }}>ALLCLOSING360</div>
      <div style={{
        fontSize:8, color:"rgba(79,126,255,0.5)",
        letterSpacing:"0.32em", fontWeight:600,
      }}>AI COMMERCIAL OPERATING SYSTEM</div>
      {/* Reception counter */}
      <div style={{
        position:"absolute", bottom:8,
        width:"55%", height:14,
        borderRadius:7,
        background:"linear-gradient(90deg,#0d1428,#131e3a,#0d1428)",
        border:"1px solid rgba(79,126,255,0.18)",
        boxShadow:"0 0 20px rgba(79,126,255,0.08)",
        display:"flex", alignItems:"center", justifyContent:"center",
        gap:8,
      }}>
        <div style={{width:30,height:4,borderRadius:2,background:"rgba(79,126,255,0.25)"}} />
        <div style={{width:6,height:6,borderRadius:"50%",background:"rgba(34,197,94,0.6)",boxShadow:"0 0 5px #22c55e"}} />
        <div style={{width:20,height:4,borderRadius:2,background:"rgba(79,126,255,0.15)"}} />
      </div>
    </div>
  );
}

// ─── Meeting room table ─────────────────────────────────────────────────────────
function MeetingTable() {
  const chairs = Array.from({length:8},(_,i) => {
    const angle = (i/8)*Math.PI*2 - Math.PI/2;
    return { x:50+Math.cos(angle)*42, y:50+Math.sin(angle)*42 };
  });
  return (
    <div style={{
      position:"absolute",
      left:"26%", top:"38%",
      width:"48%", height:"22%",
      pointerEvents:"none", zIndex:3,
    }}>
      {chairs.map((c,i) => (
        <div key={i} style={{
          position:"absolute",
          left:`${c.x}%`, top:`${c.y}%`,
          transform:"translate(-50%,-50%)",
          width:16, height:16, borderRadius:"50%",
          background:"linear-gradient(135deg,#0f1628,#090d1a)",
          border:"1px solid rgba(6,182,212,0.28)",
          boxShadow:"0 2px 8px rgba(0,0,0,0.4)",
        }} />
      ))}
      <div style={{
        position:"absolute", left:"50%", top:"50%",
        transform:"translate(-50%,-50%)",
        width:78, height:78, borderRadius:"50%",
        background:"linear-gradient(135deg,#0f1628,#080d1a)",
        border:"1.5px solid rgba(6,182,212,0.32)",
        boxShadow:"0 6px 30px rgba(0,0,0,0.7), 0 0 35px rgba(6,182,212,0.08)",
        display:"flex", alignItems:"center", justifyContent:"center",
      }}>
        <div style={{fontSize:24,opacity:0.35}}>🤝</div>
      </div>
      <div style={{
        position:"absolute", bottom:4, left:"12%", right:"12%", height:1,
        background:"linear-gradient(90deg,transparent,rgba(6,182,212,0.5),transparent)",
        animation:"led-pulse 3s ease-in-out infinite",
      }} />
    </div>
  );
}

// ─── Director info panel ────────────────────────────────────────────────────────
function DirectorPanel({
  dirId, tasks, onClose, onChat,
}: {
  dirId: string;
  tasks: UITask[];
  onClose: () => void;
  onChat: (id: EngineId) => void;
}) {
  const dir = DIRECTOR_MAP[dirId as EngineId];
  if (!dir) return null;

  const myTasks   = tasks.filter(t => t.engineId === dirId);
  const active    = myTasks.filter(t => t.status === "in_progress");
  const completed = myTasks.filter(t => t.status === "completed");
  const latest    = myTasks.slice(0,4);

  return (
    <div style={{
      position:"absolute", right:12, top:12, bottom:12,
      width:270,
      background:"rgba(5,8,18,0.97)",
      border:`1px solid ${dir.color}28`,
      borderRadius:16,
      boxShadow:`0 20px 70px rgba(0,0,0,0.7), 0 0 50px ${dir.color}0a`,
      backdropFilter:"blur(24px)",
      display:"flex", flexDirection:"column",
      overflow:"hidden", zIndex:60,
      animation:"panel-in 0.3s ease-out",
    }}>
      {/* Header */}
      <div style={{
        padding:"14px 14px 10px",
        borderBottom:`1px solid ${dir.color}12`,
        background:`linear-gradient(180deg,${dir.color}0e,transparent)`,
        flexShrink:0,
      }}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{
              width:44, height:44, borderRadius:12,
              background:`linear-gradient(135deg,${dir.color},${dir.color}88)`,
              border:`1px solid ${dir.color}50`,
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:14, fontWeight:900, color:"white",
              boxShadow:`0 4px 20px ${dir.color}30`,
              flexShrink:0,
            }}>{dir.initials}</div>
            <div>
              <div style={{fontSize:14,fontWeight:800,color:"white"}}>{dir.humanName}</div>
              <div style={{fontSize:10,color:dir.color,marginTop:1}}>{dir.name}</div>
              <div style={{fontSize:9,color:"rgba(255,255,255,0.35)",marginTop:1}}>{dir.department}</div>
            </div>
          </div>
          <button onClick={onClose} style={{
            background:"none", border:"none",
            color:"rgba(255,255,255,0.3)", cursor:"pointer",
            fontSize:20, lineHeight:1, padding:"2px 4px",
          }}>×</button>
        </div>
        <p style={{
          margin:"10px 0 0",
          fontSize:10.5, color:"rgba(255,255,255,0.45)",
          lineHeight:1.55,
        }}>{dir.description}</p>
      </div>

      {/* Stats */}
      <div style={{
        padding:"10px 14px",
        borderBottom:`1px solid rgba(255,255,255,0.04)`,
        display:"flex", gap:8, flexShrink:0,
      }}>
        {[
          { n:completed.length, label:"HECHAS",   color:"#22c55e" },
          { n:active.length,    label:"ACTIVAS",  color:"#fbbf24" },
          { n:myTasks.length,   label:"TOTAL",    color:"rgba(255,255,255,0.3)" },
        ].map(s => (
          <div key={s.label} style={{
            flex:1, textAlign:"center", padding:"8px 4px",
            background:`${s.color}0c`, borderRadius:8,
            border:`1px solid ${s.color}18`,
          }}>
            <div style={{fontSize:22,fontWeight:900,color:s.color,lineHeight:1}}>{s.n}</div>
            <div style={{fontSize:7.5,color:"rgba(255,255,255,0.35)",marginTop:3,letterSpacing:"0.1em"}}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tasks */}
      <div style={{flex:1,overflow:"auto",padding:"10px 14px"}}>
        <div style={{fontSize:8.5,color:"rgba(255,255,255,0.25)",letterSpacing:"0.12em",marginBottom:8}}>
          TAREAS RECIENTES
        </div>
        {latest.length === 0 ? (
          <div style={{fontSize:10,color:"rgba(255,255,255,0.2)",textAlign:"center",marginTop:24,lineHeight:1.8}}>
            Sin tareas aún.<br/>
            <span style={{color:"rgba(255,255,255,0.15)"}}>Envía un mensaje para comenzar.</span>
          </div>
        ) : latest.map(task => (
          <div key={task.id} style={{
            padding:"9px 10px",
            background:"rgba(255,255,255,0.025)",
            border:`1px solid rgba(255,255,255,0.055)`,
            borderRadius:9, marginBottom:6,
          }}>
            <div style={{
              fontSize:9.5, fontWeight:600,
              color: task.status === "completed" ? "#22c55e"
                   : task.status === "in_progress" ? "#fbbf24"
                   : task.status === "failed" ? "#ef4444"
                   : "rgba(255,255,255,0.55)",
              display:"flex", alignItems:"center", gap:5,
            }}>
              <span>{task.status === "completed" ? "✅" : task.status === "in_progress" ? "⚙️" : task.status === "failed" ? "❌" : "⏳"}</span>
              <span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{task.title}</span>
            </div>
            {task.status === "in_progress" && task.currentStep && (
              <div style={{fontSize:8,color:"rgba(255,255,255,0.3)",marginTop:4,paddingLeft:16}}>
                {task.currentStep}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* CTA */}
      <div style={{padding:"12px 14px",borderTop:`1px solid ${dir.color}12`,flexShrink:0}}>
        <button
          onClick={() => { onChat(dir.id); onClose(); }}
          style={{
            width:"100%", padding:"11px 0",
            background:`linear-gradient(135deg,${dir.color}cc,${dir.color}88)`,
            border:"none", borderRadius:10,
            color:"white", fontSize:12, fontWeight:800,
            cursor:"pointer", letterSpacing:"0.05em",
            boxShadow:`0 4px 20px ${dir.color}30`,
            transition:"opacity 0.15s",
          }}
          onMouseEnter={e => (e.currentTarget.style.opacity="0.85")}
          onMouseLeave={e => (e.currentTarget.style.opacity="1")}
        >
          💬 Hablar con {dir.humanName.split(" ")[0]}
        </button>
      </div>
    </div>
  );
}

// ─── Status bar ─────────────────────────────────────────────────────────────────
function StatusBar({ tasks, selectedDirPanel }: { tasks:UITask[]; selectedDirPanel:string|null }) {
  const working  = DIRECTORS.filter(d => tasks.some(t => t.engineId === d.id && t.status === "in_progress"));
  const done     = tasks.filter(t => t.status === "completed").length;

  return (
    <div style={{
      position:"absolute", bottom:8, left:8, right: selectedDirPanel ? 298 : 8,
      height:32,
      background:"rgba(4,7,16,0.9)",
      border:"1px solid rgba(255,255,255,0.06)",
      borderRadius:10,
      backdropFilter:"blur(16px)",
      display:"flex", alignItems:"center",
      padding:"0 12px", gap:14, zIndex:20,
      transition:"right 0.3s ease",
    }}>
      {/* Pulse dot */}
      <div style={{width:7,height:7,borderRadius:"50%",background:"#22c55e",animation:"glow-pulse 2s ease-in-out infinite",boxShadow:"0 0 6px #22c55e",flexShrink:0}} />
      <div style={{fontSize:9,color:"rgba(255,255,255,0.45)",letterSpacing:"0.08em",fontWeight:600}}>
        ALLCLOSING360 OS
      </div>
      <div style={{width:1,height:14,background:"rgba(255,255,255,0.08)"}} />
      <div style={{fontSize:9,color:"rgba(255,255,255,0.3)"}}>
        <span style={{color:"#fbbf24",fontWeight:700}}>{working.length}</span> activos
      </div>
      <div style={{fontSize:9,color:"rgba(255,255,255,0.3)"}}>
        <span style={{color:"#22c55e",fontWeight:700}}>{done}</span> completadas
      </div>
      {working.length > 0 && (
        <>
          <div style={{width:1,height:14,background:"rgba(255,255,255,0.08)"}} />
          <div style={{fontSize:9,color:"rgba(255,255,255,0.4)",display:"flex",alignItems:"center",gap:5}}>
            <div style={{width:5,height:5,borderRadius:"50%",border:"1.5px solid #fbbf24",borderTopColor:"transparent",animation:"spin 1s linear infinite"}} />
            {working.map(d => d.humanName.split(" ")[0]).join(", ")} trabajando…
          </div>
        </>
      )}
      <div style={{marginLeft:"auto",fontSize:8,color:"rgba(255,255,255,0.2)"}}>
        {DIRECTORS.length} directores · haz click en un avatar para interactuar
      </div>
    </div>
  );
}

// ─── Plant decoration ───────────────────────────────────────────────────────────
function Plant({ l, t }: { l:number; t:number }) {
  return (
    <div style={{
      position:"absolute", left:`${l}%`, top:`${t}%`,
      transform:"translate(-50%,-50%)",
      fontSize:18, pointerEvents:"none", zIndex:4,
      filter:"drop-shadow(0 2px 4px rgba(0,0,0,0.4))",
      animation:"idle-bob 4s ease-in-out infinite",
    }}>🌿</div>
  );
}

// ─── MAIN COMPONENT ─────────────────────────────────────────────────────────────
export default function OfficeScene3D({ tasks, activeDirectorId, onDirectorSelect }: Props) {
  const [agentStates, setAgentStates] = useState<Record<string, AgentStatus>>({});
  const [doneFlash,   setDoneFlash]   = useState<Record<string, boolean>>({});
  const [panelDir,    setPanelDir]    = useState<string | null>(null);
  const prevStates = useRef<Record<string, AgentStatus>>({});

  // Compute agent states from tasks
  useEffect(() => {
    const next: Record<string, AgentStatus> = {};
    for (const d of DIRECTORS) {
      const dTasks = tasks.filter(t => t.engineId === d.id);
      if (dTasks.some(t => t.status === "in_progress"))       next[d.id] = "working";
      else if (dTasks.some(t => t.status === "failed"))       next[d.id] = "failed";
      else if (dTasks.some(t => t.status === "completed"))    next[d.id] = "done";
      else                                                    next[d.id] = "idle";
    }

    // Flash for newly completed
    for (const [id, s] of Object.entries(next)) {
      if (s === "done" && prevStates.current[id] === "working") {
        setDoneFlash(p => ({ ...p, [id]: true }));
        setTimeout(() => setDoneFlash(p => ({ ...p, [id]: false })), 2200);
      }
    }
    prevStates.current = next;
    setAgentStates(next);
  }, [tasks]);

  const handleSelect = useCallback((id: EngineId) => {
    setPanelDir(prev => prev === id ? null : id);
    onDirectorSelect(id);
  }, [onDirectorSelect]);

  const activeRoom = activeDirectorId ? DIR_ROOM[activeDirectorId as string] : null;

  // Desk positions offset slightly below avatar
  const deskPositions = Object.entries(AVATAR_POS).map(([id, pos]) => ({
    id, l: pos.l, t: pos.t + 7,
  }));

  return (
    <div style={{
      position:"relative", width:"100%", height:"100%",
      background:"#070b12",
      overflow:"hidden",
      fontFamily:"'Inter','SF Pro Display',system-ui,sans-serif",
    }}>
      <style>{OFFICE_CSS}</style>

      {/* Floor grid */}
      <div style={{
        position:"absolute", inset:0,
        backgroundImage:`
          linear-gradient(rgba(79,126,255,0.028) 1px,transparent 1px),
          linear-gradient(90deg,rgba(79,126,255,0.028) 1px,transparent 1px)
        `,
        backgroundSize:"44px 44px",
        animation:"grid-pulse 7s ease-in-out infinite",
      }} />

      {/* Ambient center glow */}
      <div style={{
        position:"absolute", left:"50%", top:"45%",
        transform:"translate(-50%,-50%)",
        width:700, height:500, borderRadius:"50%",
        background:"radial-gradient(ellipse,rgba(79,126,255,0.035) 0%,transparent 65%)",
        pointerEvents:"none",
      }} />

      {/* ROOM ZONES */}
      {ROOMS.map(room => (
        <RoomZone key={room.id} room={room} isActive={activeRoom === room.id} />
      ))}

      {/* RECEPTION */}
      <Reception />

      {/* MEETING TABLE */}
      <MeetingTable />

      {/* DESKS — drawn before avatars so avatars appear on top */}
      {deskPositions.map(dp => {
        const dir = DIRECTOR_MAP[dp.id as EngineId];
        if (!dir) return null;
        return <WorkDesk key={dp.id} color={dir.color} l={dp.l} t={dp.t} />;
      })}

      {/* PLANTS */}
      <Plant l={3}  t={39} />
      <Plant l={24} t={3}  />
      <Plant l={73} t={3}  />
      <Plant l={97} t={37} />
      <Plant l={73} t={79} />
      <Plant l={25} t={82} />

      {/* AVATARS */}
      {DIRECTORS.map((dir, i) => (
        <HumanAvatar
          key={dir.id}
          dirId={dir.id}
          status={agentStates[dir.id] ?? "idle"}
          isActive={activeDirectorId === dir.id}
          bobIdx={i}
          onSelect={handleSelect}
          justDone={!!doneFlash[dir.id]}
        />
      ))}

      {/* DIRECTOR PANEL */}
      {panelDir && (
        <DirectorPanel
          dirId={panelDir}
          tasks={tasks}
          onClose={() => setPanelDir(null)}
          onChat={handleSelect}
        />
      )}

      {/* STATUS BAR */}
      <StatusBar tasks={tasks} selectedDirPanel={panelDir} />
    </div>
  );
}
