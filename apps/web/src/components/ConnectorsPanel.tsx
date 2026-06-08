"use client";

import { useState, useEffect } from "react";
import {
  CONNECTORS, CONNECTOR_CATEGORIES, type ConnectorDef, type ConnectorStatus, type ConnectorCategory,
  loadConnectorStates, saveConnectorStates,
} from "../lib/connectors";
import ConnectorLogo from "./ConnectorLogo";

// ─── Priority connectors with env var config ──────────────────────────────────
interface PriorityConnector {
  id: string;
  name: string;
  color: string;
  icon: string;
  envVars: Array<{ key: string; label: string; placeholder: string; secret?: boolean }>;
  description: string;
}

const PRIORITY_CONNECTORS: PriorityConnector[] = [
  {
    id: "ghl",
    name: "GoHighLevel",
    color: "#22c55e",
    icon: "🏆",
    description: "CRM central — contactos, pipelines y automatizaciones",
    envVars: [
      { key: "GHL_API_KEY", label: "API Key", placeholder: "eyJhbGc...", secret: true },
      { key: "GHL_LOCATION_ID", label: "Location ID", placeholder: "abc123xyz" },
    ],
  },
  {
    id: "whatsapp",
    name: "WhatsApp Business",
    color: "#25D366",
    icon: "💬",
    description: "Mensajería directa a prospectos y clientes",
    envVars: [
      { key: "WHATSAPP_PHONE_NUMBER_ID", label: "Phone Number ID", placeholder: "123456789" },
      { key: "WHATSAPP_ACCESS_TOKEN", label: "Access Token", placeholder: "EAABs...", secret: true },
    ],
  },
  {
    id: "meta_ads",
    name: "Meta Ads",
    color: "#1877F2",
    icon: "📘",
    description: "Campañas Facebook e Instagram desde el Director Meta Ads",
    envVars: [
      { key: "META_AD_ACCOUNT_ID", label: "Ad Account ID", placeholder: "act_123456" },
      { key: "META_ACCESS_TOKEN", label: "Access Token", placeholder: "EAABs...", secret: true },
    ],
  },
  {
    id: "google_calendar",
    name: "Google Calendar",
    color: "#4285F4",
    icon: "📅",
    description: "Agenda reuniones y citas desde el chat",
    envVars: [
      { key: "GOOGLE_CLIENT_ID", label: "Client ID", placeholder: "123.apps.googleusercontent.com" },
      { key: "GOOGLE_CLIENT_SECRET", label: "Client Secret", placeholder: "GOCSPX-...", secret: true },
      { key: "GOOGLE_REFRESH_TOKEN", label: "Refresh Token", placeholder: "1//0eA...", secret: true },
    ],
  },
];

function PriorityConnectorCard({
  connector,
  status,
  onConfigure,
}: {
  connector: PriorityConnector;
  status: "configured" | "unconfigured";
  onConfigure: () => void;
}) {
  const isConfigured = status === "configured";
  return (
    <div style={{
      background: isConfigured ? `${connector.color}10` : "var(--color-surface-2)",
      border: `1px solid ${isConfigured ? connector.color + "40" : "var(--color-border)"}`,
      borderRadius: 12,
      padding: "14px 16px",
      display: "flex",
      alignItems: "center",
      gap: 12,
      transition: "all 0.2s",
      boxShadow: isConfigured ? `0 0 20px ${connector.color}12` : "none",
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: 10,
        background: `${connector.color}20`,
        border: `1px solid ${connector.color}40`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 18, flexShrink: 0,
      }}>{connector.icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: isConfigured ? connector.color : "var(--color-text)" }}>{connector.name}</div>
        <div style={{ fontSize: 10, color: "var(--color-text-dim)", marginTop: 1 }}>{connector.description}</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, flexShrink: 0 }}>
        <div style={{
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: "0.1em",
          color: isConfigured ? "#22d97a" : "var(--color-text-dim)",
          background: isConfigured ? "rgba(34,217,122,0.1)" : "var(--color-surface-4)",
          border: `1px solid ${isConfigured ? "rgba(34,217,122,0.25)" : "var(--color-border)"}`,
          borderRadius: 4,
          padding: "3px 8px",
          display: "flex",
          alignItems: "center",
          gap: 4,
        }}>
          {isConfigured ? (
            <><div style={{ width: 4, height: 4, borderRadius: "50%", background: "#22d97a" }} /> CONECTADO</>
          ) : "CONFIGURAR"}
        </div>
        <button
          onClick={onConfigure}
          style={{
            fontSize: 10, fontWeight: 600,
            padding: "5px 10px", borderRadius: 6,
            background: isConfigured ? "transparent" : `${connector.color}20`,
            border: `1px solid ${connector.color}40`,
            color: connector.color,
            cursor: "pointer",
            transition: "all 0.15s",
          }}
        >
          {isConfigured ? "Ver config" : "⚙️ Configurar"}
        </button>
      </div>
    </div>
  );
}

function EnvVarModal({ connector, onClose }: { connector: PriorityConnector; onClose: () => void }) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState<string | null>(null);

  function copyEnvBlock() {
    const block = connector.envVars.map((v) => `${v.key}=${values[v.key] ?? "tu_valor_aqui"}`).join("\n");
    navigator.clipboard.writeText(block).then(() => {
      setCopied("block");
      setTimeout(() => setCopied(null), 2000);
    });
  }

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(4,4,8,0.88)", backdropFilter: "blur(8px)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        width: "100%", maxWidth: 480,
        background: "var(--color-surface)",
        border: `1px solid ${connector.color}30`,
        borderRadius: 16,
        overflow: "hidden",
        boxShadow: `0 0 60px rgba(0,0,0,0.7), 0 0 30px ${connector.color}10`,
      }}>
        <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid var(--color-border)", background: `${connector.color}08`, display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ fontSize: 24 }}>{connector.icon}</div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: connector.color }}>{connector.name}</div>
            <div style={{ fontSize: 11, color: "var(--color-text-muted)", marginTop: 1 }}>Configuración de variables de entorno</div>
          </div>
          <button onClick={onClose} style={{ marginLeft: "auto", fontSize: 16, color: "var(--color-text-dim)", background: "none", border: "none" }}>✕</button>
        </div>

        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ fontSize: 12, color: "var(--color-text-muted)", lineHeight: 1.6, background: "rgba(79,126,255,0.06)", border: "1px solid rgba(79,126,255,0.15)", borderRadius: 8, padding: "10px 14px" }}>
            Configura estas variables en Vercel Dashboard → Settings → Environment Variables, o en tu archivo <code style={{ fontSize: 11, color: "#4f7eff" }}>.env.local</code> para desarrollo.
          </div>

          {connector.envVars.map((envVar) => (
            <div key={envVar.key}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", color: "var(--color-text-muted)", textTransform: "uppercase", marginBottom: 5 }}>
                {envVar.label}
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <code style={{
                  flex: 1,
                  fontSize: 10,
                  padding: "7px 10px",
                  background: "var(--color-surface-3)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 7,
                  color: "#4f7eff",
                  fontFamily: "monospace",
                  display: "block",
                }}>{envVar.key}</code>
                <input
                  type={envVar.secret ? "password" : "text"}
                  placeholder={envVar.placeholder}
                  value={values[envVar.key] ?? ""}
                  onChange={(e) => setValues((prev) => ({ ...prev, [envVar.key]: e.target.value }))}
                  style={{
                    flex: 2,
                    fontSize: 11,
                    padding: "7px 10px",
                    background: "var(--color-surface-3)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 7,
                    color: "var(--color-text)",
                    fontFamily: "monospace",
                    outline: "none",
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        <div style={{ padding: "14px 24px 20px", borderTop: "1px solid var(--color-border)", display: "flex", gap: 8 }}>
          <button
            onClick={copyEnvBlock}
            style={{ flex: 1, padding: "9px 0", borderRadius: 8, background: `${connector.color}20`, border: `1px solid ${connector.color}40`, color: connector.color, fontSize: 11, fontWeight: 700, cursor: "pointer" }}
          >
            {copied === "block" ? "✅ Copiado" : "📋 Copiar .env block"}
          </button>
          <button
            onClick={onClose}
            style={{ flex: 1, padding: "9px 0", borderRadius: 8, background: "var(--color-accent)", border: "none", color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer" }}
          >
            Configurar en Vercel →
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_CFG: Record<ConnectorStatus, { label: string; color: string; dot: string }> = {
  disconnected: { label: "Sin conectar",    color: "#4a4a6a", dot: "#4a4a6a" },
  demo:         { label: "Demo activo",     color: "#22c55e", dot: "#22c55e" },
  pending:      { label: "Pendiente OAuth", color: "#f59e0b", dot: "#f59e0b" },
  error:        { label: "Error",           color: "#ef4444", dot: "#ef4444" },
  active:       { label: "Activo",          color: "#6366f1", dot: "#6366f1" },
};

const RISK_CFG = {
  low:    { label: "Bajo",  color: "#22c55e" },
  medium: { label: "Medio", color: "#f59e0b" },
  high:   { label: "Alto",  color: "#ef4444" },
};

const AUTH_COLOR: Record<string, string> = {
  "OAuth2":           "#4285F4",
  "API Key":          "#22c55e",
  "Webhook":          "#f59e0b",
  "OAuth2 + API Key": "#a855f7",
};

export default function ConnectorsPanel() {
  const [states, setStates] = useState<Record<string, ConnectorStatus>>({});
  const [category, setCategory] = useState<ConnectorCategory | "Todos">("Todos");
  const [detail, setDetail] = useState<ConnectorDef | null>(null);
  const [oauthModal, setOauthModal] = useState<ConnectorDef | null>(null);
  const [testMsg, setTestMsg] = useState<{ id: string; msg: string; ok: boolean } | null>(null);
  const [envModal, setEnvModal] = useState<PriorityConnector | null>(null);
  // Priority connector statuses — for now driven by demo/disconnected states
  const [priorityStatus, setPriorityStatus] = useState<Record<string, "configured" | "unconfigured">>({});

  // Load persisted states
  useEffect(() => {
    const loaded = loadConnectorStates();
    setStates(loaded);
    // Derive priority statuses from connector states
    const ps: Record<string, "configured" | "unconfigured"> = {};
    for (const pc of PRIORITY_CONNECTORS) {
      ps[pc.id] = (loaded[pc.id] === "active" || loaded[pc.id] === "demo") ? "configured" : "unconfigured";
    }
    setPriorityStatus(ps);
  }, []);

  function getStatus(id: string): ConnectorStatus {
    return states[id] ?? "disconnected";
  }

  function setConnectorStatus(id: string, s: ConnectorStatus) {
    const next = { ...states, [id]: s };
    setStates(next);
    saveConnectorStates(next);
  }

  function handleConnect(c: ConnectorDef) {
    setOauthModal(c);
  }

  function handleActivateDemo(c: ConnectorDef) {
    setConnectorStatus(c.id, "demo");
    setOauthModal(null);
  }

  function handleTest(c: ConnectorDef) {
    const s = getStatus(c.id);
    if (s === "disconnected") {
      setTestMsg({ id: c.id, msg: "Primero conecta esta cuenta.", ok: false });
    } else {
      setTestMsg({ id: c.id, msg: "✅ Conexión demo OK — latencia 38ms", ok: true });
    }
    setTimeout(() => setTestMsg(null), 3500);
  }

  function handleDisconnect(id: string) {
    setConnectorStatus(id, "disconnected");
  }

  const filtered = category === "Todos"
    ? CONNECTORS
    : CONNECTORS.filter((c) => c.category === category);

  const totalConnected = CONNECTORS.filter((c) => getStatus(c.id) !== "disconnected").length;

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", position: "relative", zIndex: 1 }}>
      {/* ── Header ────────────────────────────────────────────────────────────── */}
      <div style={{ padding: "20px 24px 0", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", color: "var(--color-text-dim)", textTransform: "uppercase", marginBottom: 3 }}>
              Integraciones
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: "var(--color-text)", lineHeight: 1.1 }}>
              Hub de Conectores
            </div>
            <div style={{ fontSize: 12, color: "var(--color-text-muted)", marginTop: 3 }}>
              {CONNECTORS.length} conectores disponibles · {totalConnected} activos
            </div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            {[
              { label: "Activos", value: totalConnected, color: "var(--color-success)" },
              { label: "Disponibles", value: CONNECTORS.length - totalConnected, color: "var(--color-text-dim)" },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ background: "var(--color-surface-2)", border: "1px solid var(--color-border)", borderRadius: 8, padding: "8px 14px", textAlign: "center" }}>
                <div style={{ fontSize: 18, fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
                <div style={{ fontSize: 9, color: "var(--color-text-dim)", marginTop: 2, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Priority connectors */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: "var(--color-text-dim)", textTransform: "uppercase", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ color: "#fbbf24" }}>⭐</span> Conectores Prioritarios
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
            {PRIORITY_CONNECTORS.map((pc) => (
              <PriorityConnectorCard
                key={pc.id}
                connector={pc}
                status={priorityStatus[pc.id] ?? "unconfigured"}
                onConfigure={() => setEnvModal(pc)}
              />
            ))}
          </div>
        </div>

        {/* Category filter */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", paddingBottom: 16, borderBottom: "1px solid var(--color-border)" }}>
          {(["Todos", ...CONNECTOR_CATEGORIES] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat as ConnectorCategory | "Todos")}
              style={{
                fontSize: 11, fontWeight: 600,
                padding: "5px 12px", borderRadius: 20,
                background: category === cat ? "var(--color-accent)" : "var(--color-surface-2)",
                border: "1px solid " + (category === cat ? "transparent" : "var(--color-border)"),
                color: category === cat ? "#fff" : "var(--color-text-muted)",
                transition: "all 0.15s",
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* ── Main area: grid + detail panel ───────────────────────────────────── */}
      <div style={{ flex: 1, overflow: "hidden", display: "flex" }}>
        {/* Grid */}
        <div style={{ flex: 1, overflow: "auto", padding: "20px 24px" }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 12,
          }}>
            {filtered.map((c) => (
              <ConnectorCard
                key={c.id}
                connector={c}
                status={getStatus(c.id)}
                testMsg={testMsg?.id === c.id ? testMsg : null}
                isSelected={detail?.id === c.id}
                onSelect={() => setDetail(detail?.id === c.id ? null : c)}
                onConnect={() => handleConnect(c)}
                onTest={() => handleTest(c)}
                onDisconnect={() => handleDisconnect(c.id)}
              />
            ))}
          </div>
        </div>

        {/* Detail panel */}
        {detail && (
          <DetailPanel
            connector={detail}
            status={getStatus(detail.id)}
            onClose={() => setDetail(null)}
            onConnect={() => handleConnect(detail)}
            onDisconnect={() => handleDisconnect(detail.id)}
            onTest={() => handleTest(detail)}
          />
        )}
      </div>

      {/* ── OAuth / Connect modal ─────────────────────────────────────────────── */}
      {oauthModal && (
        <OAuthModal
          connector={oauthModal}
          onActivateDemo={() => handleActivateDemo(oauthModal)}
          onClose={() => setOauthModal(null)}
        />
      )}

      {/* ── Env var config modal ──────────────────────────────────────────────── */}
      {envModal && (
        <EnvVarModal
          connector={envModal}
          onClose={() => setEnvModal(null)}
        />
      )}
    </div>
  );
}

// ─── ConnectorCard ────────────────────────────────────────────────────────────
function ConnectorCard({
  connector, status, testMsg, isSelected,
  onSelect, onConnect, onTest, onDisconnect,
}: {
  connector: ConnectorDef;
  status: ConnectorStatus;
  testMsg: { msg: string; ok: boolean } | null;
  isSelected: boolean;
  onSelect: () => void;
  onConnect: () => void;
  onTest: () => void;
  onDisconnect: () => void;
}) {
  const cfg = STATUS_CFG[status];
  const isConnected = status !== "disconnected";

  return (
    <div
      style={{
        background: "var(--color-surface-2)",
        border: "1px solid " + (isSelected ? "var(--color-accent)" : isConnected ? cfg.dot + "40" : "var(--color-border)"),
        borderRadius: 12,
        padding: "14px",
        cursor: "pointer",
        transition: "border-color 0.2s, box-shadow 0.2s",
        boxShadow: isSelected ? "0 0 0 1px var(--color-accent)" : isConnected ? "0 0 14px " + cfg.dot + "18" : "none",
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
      onClick={onSelect}
    >
      {/* Top row */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <ConnectorLogo id={connector.id} size={38} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--color-text)", lineHeight: 1.2 }}>
            {connector.name}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 2 }}>
            <span style={{ fontSize: 9, color: "var(--color-text-dim)", background: "var(--color-surface-4)", padding: "1px 6px", borderRadius: 4 }}>
              {connector.category}
            </span>
            <span style={{ fontSize: 9, color: AUTH_COLOR[connector.authType] ?? "var(--color-text-dim)", background: (AUTH_COLOR[connector.authType] ?? "#666") + "18", padding: "1px 6px", borderRadius: 4 }}>
              {connector.authType}
            </span>
          </div>
        </div>
        {/* Status dot */}
        <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
          <div className={isConnected ? "status-dot-active" : undefined} style={{ width: 7, height: 7, borderRadius: "50%", background: cfg.dot }} />
          <span style={{ fontSize: 9, color: cfg.color, fontWeight: 600 }}>{cfg.label}</span>
        </div>
      </div>

      <div style={{ fontSize: 11, color: "var(--color-text-muted)", lineHeight: 1.5 }}>
        {connector.description}
      </div>

      {/* Test message */}
      {testMsg && (
        <div style={{ fontSize: 10, padding: "4px 8px", borderRadius: 5, background: testMsg.ok ? "rgba(34,217,122,0.1)" : "rgba(239,68,68,0.1)", color: testMsg.ok ? "#22c55e" : "#ef4444", border: "1px solid " + (testMsg.ok ? "rgba(34,217,122,0.2)" : "rgba(239,68,68,0.2)") }}>
          {testMsg.msg}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: "flex", gap: 6 }} onClick={(e) => e.stopPropagation()}>
        <ActionBtn
          icon="🌐"
          label="Abrir sitio"
          onClick={() => window.open(connector.officialUrl, "_blank", "noopener")}
          variant="ghost"
        />
        {isConnected ? (
          <ActionBtn icon="⬛" label="Desconectar" onClick={onDisconnect} variant="danger" />
        ) : (
          <ActionBtn icon="🔌" label="Conectar" onClick={onConnect} variant="primary" />
        )}
        <ActionBtn icon="🧪" label="Probar" onClick={onTest} variant="ghost" />
      </div>
    </div>
  );
}

function ActionBtn({ icon, label, onClick, variant }: { icon: string; label: string; onClick: () => void; variant: "ghost" | "primary" | "danger" }) {
  const styles: Record<string, React.CSSProperties> = {
    ghost:   { background: "var(--color-surface-3)", border: "1px solid var(--color-border)", color: "var(--color-text-muted)" },
    primary: { background: "var(--color-accent)", border: "1px solid transparent", color: "#fff" },
    danger:  { background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", color: "#ef4444" },
  };
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1, padding: "6px 4px", borderRadius: 7,
        fontSize: 10, fontWeight: 600,
        display: "flex", alignItems: "center", justifyContent: "center", gap: 3,
        transition: "opacity 0.15s",
        ...styles[variant],
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "0.8"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "1"; }}
    >
      {icon} {label}
    </button>
  );
}

// ─── Detail panel ─────────────────────────────────────────────────────────────
function DetailPanel({
  connector, status, onClose, onConnect, onDisconnect, onTest,
}: {
  connector: ConnectorDef;
  status: ConnectorStatus;
  onClose: () => void;
  onConnect: () => void;
  onDisconnect: () => void;
  onTest: () => void;
}) {
  const cfg = STATUS_CFG[status];
  const isConnected = status !== "disconnected";
  const risk = RISK_CFG[connector.risk];

  return (
    <div
      style={{
        width: 300, flexShrink: 0,
        borderLeft: "1px solid var(--color-border)",
        background: "var(--color-surface)",
        display: "flex", flexDirection: "column",
        overflow: "hidden",
        animation: "slide-down 0.2s ease-out",
      }}
    >
      {/* Header */}
      <div style={{ padding: "18px 18px 14px", borderBottom: "1px solid var(--color-border)", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <ConnectorLogo id={connector.id} size={44} />
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--color-text)" }}>{connector.name}</div>
            <div style={{ fontSize: 10, color: "var(--color-text-dim)", marginTop: 2 }}>{connector.category}</div>
          </div>
        </div>
        <button onClick={onClose} style={{ width: 26, height: 26, borderRadius: 6, background: "var(--color-surface-2)", border: "1px solid var(--color-border)", color: "var(--color-text-muted)", fontSize: 12 }}>✕</button>
      </div>

      <div style={{ flex: 1, overflow: "auto", padding: "16px 18px", display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Status */}
        <Section title="Estado">
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div className={isConnected ? "status-dot-active" : undefined} style={{ width: 8, height: 8, borderRadius: "50%", background: cfg.dot }} />
            <span style={{ fontSize: 12, color: cfg.color, fontWeight: 600 }}>{cfg.label}</span>
          </div>
          {isConnected && (
            <div style={{ fontSize: 10, color: "var(--color-text-dim)", marginTop: 4 }}>Última sync: ahora mismo (demo)</div>
          )}
        </Section>

        {/* Description */}
        <Section title="Descripción">
          <p style={{ fontSize: 12, color: "var(--color-text-muted)", lineHeight: 1.6 }}>{connector.description}</p>
        </Section>

        {/* Auth type */}
        <Section title="Autenticación">
          <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 5, background: (AUTH_COLOR[connector.authType] ?? "#666") + "18", color: AUTH_COLOR[connector.authType] ?? "var(--color-text-muted)", border: "1px solid " + (AUTH_COLOR[connector.authType] ?? "#666") + "30", fontWeight: 600 }}>
            {connector.authType}
          </span>
        </Section>

        {/* Reads */}
        <Section title="📖 Puede leer">
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {connector.reads.map((r) => (
              <div key={r} style={{ fontSize: 11, color: "var(--color-text-muted)", display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ width: 4, height: 4, borderRadius: "50%", background: "#22c55e", flexShrink: 0, display: "inline-block" }} />
                {r}
              </div>
            ))}
          </div>
        </Section>

        {/* Writes */}
        <Section title="✏️ Puede escribir">
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {connector.writes.map((w) => (
              <div key={w} style={{ fontSize: 11, color: "var(--color-text-muted)", display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ width: 4, height: 4, borderRadius: "50%", background: "#f59e0b", flexShrink: 0, display: "inline-block" }} />
                {w}
              </div>
            ))}
          </div>
        </Section>

        {/* Risk */}
        <Section title="Riesgo">
          <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 5, background: risk.color + "18", color: risk.color, border: "1px solid " + risk.color + "30", fontWeight: 600 }}>
            Riesgo {risk.label}
          </span>
        </Section>

        {/* Next steps */}
        {!isConnected && (
          <Section title="Próximos pasos">
            <ol style={{ paddingLeft: 16, display: "flex", flexDirection: "column", gap: 5 }}>
              {["Haz clic en Conectar cuenta", "Completa el flujo " + connector.authType + " (Fase 5)", "Verifica permisos y guarda", "Prueba la conexión"].map((s, i) => (
                <li key={i} style={{ fontSize: 11, color: "var(--color-text-muted)", lineHeight: 1.5 }}>{s}</li>
              ))}
            </ol>
          </Section>
        )}
      </div>

      {/* Actions */}
      <div style={{ padding: "12px 18px", borderTop: "1px solid var(--color-border)", display: "flex", flexDirection: "column", gap: 6, flexShrink: 0 }}>
        <button
          onClick={() => window.open(connector.officialUrl, "_blank", "noopener")}
          style={{ padding: "8px", borderRadius: 8, background: "var(--color-surface-2)", border: "1px solid var(--color-border)", color: "var(--color-text-muted)", fontSize: 11, fontWeight: 600 }}
        >
          🌐 Abrir sitio oficial
        </button>
        {isConnected ? (
          <button onClick={onDisconnect} style={{ padding: "8px", borderRadius: 8, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", color: "#ef4444", fontSize: 11, fontWeight: 600 }}>
            Desconectar
          </button>
        ) : (
          <button onClick={onConnect} style={{ padding: "8px", borderRadius: 8, background: "var(--color-accent)", border: "none", color: "#fff", fontSize: 11, fontWeight: 700 }}>
            🔌 Conectar cuenta
          </button>
        )}
        <button onClick={onTest} style={{ padding: "8px", borderRadius: 8, background: "var(--color-surface-2)", border: "1px solid var(--color-border)", color: "var(--color-text-muted)", fontSize: 11, fontWeight: 600 }}>
          🧪 Probar conexión
        </button>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-text-dim)", marginBottom: 6 }}>{title}</div>
      {children}
    </div>
  );
}

// ─── OAuth Modal ──────────────────────────────────────────────────────────────
function OAuthModal({ connector, onActivateDemo, onClose }: { connector: ConnectorDef; onActivateDemo: () => void; onClose: () => void }) {
  const risk = RISK_CFG[connector.risk];

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(4,4,8,0.85)", backdropFilter: "blur(8px)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, animation: "fade-in 0.2s ease-out" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        width: "100%", maxWidth: 520,
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: 16, overflow: "hidden",
        boxShadow: "0 0 60px rgba(0,0,0,0.7)",
        animation: "slide-down 0.25s ease-out",
      }}>
        {/* Header */}
        <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid var(--color-border)", background: "linear-gradient(135deg, rgba(99,102,241,0.08), transparent)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <ConnectorLogo id={connector.id} size={48} />
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "var(--color-text)" }}>{connector.name}</div>
              <div style={{ fontSize: 11, color: "var(--color-text-muted)", marginTop: 2 }}>Conexión real preparada para Fase 5</div>
            </div>
          </div>
          <div style={{ marginTop: 14, padding: "10px 14px", background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 8, fontSize: 12, color: "#818cf8", lineHeight: 1.5 }}>
            🔒 La integración OAuth real se activará en la Fase 5. Por ahora puedes activar el modo demo para explorar las funcionalidades.
          </div>
        </div>

        {/* Details */}
        <div style={{ padding: "18px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
          {[
            { label: "Proveedor", value: connector.name },
            { label: "Tipo de autenticación", value: connector.authType, colored: AUTH_COLOR[connector.authType] },
            { label: "Riesgo de acceso", value: "Riesgo " + risk.label, colored: risk.color },
          ].map(({ label, value, colored }) => (
            <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 12, color: "var(--color-text-muted)" }}>{label}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: colored ?? "var(--color-text)" }}>{value}</span>
            </div>
          ))}

          <div>
            <div style={{ fontSize: 11, color: "var(--color-text-dim)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6, fontWeight: 700 }}>Permisos que se solicitarán</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {connector.scopes.map((s) => (
                <span key={s} style={{ fontSize: 10, padding: "2px 7px", borderRadius: 4, background: "var(--color-surface-3)", border: "1px solid var(--color-border)", color: "var(--color-text-muted)", fontFamily: "monospace" }}>
                  {s}
                </span>
              ))}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <div style={{ fontSize: 10, color: "var(--color-text-dim)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 5, fontWeight: 700 }}>Podrá leer</div>
              {connector.reads.slice(0, 4).map((r) => (
                <div key={r} style={{ fontSize: 11, color: "var(--color-text-muted)", marginBottom: 2, display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ color: "#22c55e" }}>✓</span> {r}
                </div>
              ))}
            </div>
            <div>
              <div style={{ fontSize: 10, color: "var(--color-text-dim)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 5, fontWeight: 700 }}>Podrá escribir</div>
              {connector.writes.slice(0, 4).map((w) => (
                <div key={w} style={{ fontSize: 11, color: "var(--color-text-muted)", marginBottom: 2, display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ color: "#f59e0b" }}>✓</span> {w}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ padding: "14px 24px 20px", borderTop: "1px solid var(--color-border)", display: "flex", gap: 8 }}>
          <button
            onClick={onActivateDemo}
            style={{ flex: 2, padding: "10px 0", borderRadius: 10, background: "var(--color-accent)", border: "none", color: "#fff", fontSize: 13, fontWeight: 700 }}
          >
            🚀 Activar modo demo
          </button>
          <button
            onClick={onClose}
            style={{ flex: 1, padding: "10px 0", borderRadius: 10, background: "var(--color-surface-2)", border: "1px solid var(--color-border)", color: "var(--color-text-muted)", fontSize: 13, fontWeight: 600 }}
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}
