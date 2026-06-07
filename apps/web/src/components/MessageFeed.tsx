"use client";

import type { EngineId } from "@ac360/types";
import { DIRECTOR_MAP } from "../lib/engines";

export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  text: string;
  timestamp: Date;
  engineId?: EngineId;
  skillId?: string;
  skillName?: string;
  isTyping?: boolean;
}

interface MessageFeedProps {
  messages: Message[];
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" });
}

function SystemMessage({ text, timestamp }: { text: string; timestamp: Date }) {
  return (
    <div
      className="msg-enter"
      style={{ display: "flex", justifyContent: "center", padding: "4px 0" }}
    >
      <div
        style={{
          fontSize: 11,
          color: "var(--color-text-dim)",
          background: "var(--color-surface-2)",
          border: "1px solid var(--color-border-subtle)",
          borderRadius: 20,
          padding: "3px 12px",
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <span
          style={{
            width: 5,
            height: 5,
            borderRadius: "50%",
            background: "var(--color-success)",
            display: "inline-block",
          }}
        />
        {text}
        <span style={{ color: "var(--color-text-dim)" }}>{formatTime(timestamp)}</span>
      </div>
    </div>
  );
}

function UserMessage({ text, timestamp }: { text: string; timestamp: Date }) {
  return (
    <div
      className="msg-enter"
      style={{ display: "flex", justifyContent: "flex-end", gap: 10, padding: "2px 0" }}
    >
      <div style={{ maxWidth: "72%", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
        <div
          style={{
            background: "var(--color-accent)",
            color: "#fff",
            borderRadius: "16px 16px 4px 16px",
            padding: "10px 14px",
            fontSize: 14,
            lineHeight: 1.55,
            wordBreak: "break-word",
          }}
        >
          {text}
        </div>
        <span style={{ fontSize: 10, color: "var(--color-text-dim)" }}>{formatTime(timestamp)}</span>
      </div>
    </div>
  );
}

function AssistantMessage({
  text,
  timestamp,
  engineId,
  skillName,
  isTyping,
}: {
  text: string;
  timestamp: Date;
  engineId?: EngineId;
  skillName?: string;
  isTyping?: boolean;
}) {
  const director = engineId ? DIRECTOR_MAP[engineId] : null;

  return (
    <div
      className="msg-enter"
      style={{ display: "flex", gap: 10, padding: "2px 0", alignItems: "flex-start" }}
    >
      {/* Avatar */}
      <div
        style={{
          width: 30,
          height: 30,
          borderRadius: 8,
          background: director ? `${director.color}20` : "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
          border: `1px solid ${director ? director.color + "40" : "var(--color-border)"}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 13,
          flexShrink: 0,
          marginTop: 2,
        }}
      >
        {director ? director.icon : "🤖"}
      </div>

      <div style={{ maxWidth: "78%", display: "flex", flexDirection: "column", gap: 4 }}>
        {/* Director + Skill tags */}
        {director && !isTyping && (
          <div style={{ display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap" }}>
            <span
              style={{
                fontSize: 9,
                fontWeight: 600,
                letterSpacing: "0.06em",
                color: director.color,
                background: `${director.color}15`,
                border: `1px solid ${director.color}30`,
                borderRadius: 4,
                padding: "2px 6px",
                textTransform: "uppercase",
              }}
            >
              {director.icon} {director.shortName}
            </span>
            {skillName && (
              <span
                style={{
                  fontSize: 9,
                  color: "var(--color-text-muted)",
                  background: "var(--color-surface-3)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 4,
                  padding: "2px 6px",
                }}
              >
                {skillName}
              </span>
            )}
          </div>
        )}

        {/* Bubble */}
        <div
          style={{
            background: "var(--color-surface-2)",
            border: "1px solid var(--color-border)",
            borderRadius: "4px 16px 16px 16px",
            padding: "10px 14px",
            fontSize: 14,
            lineHeight: 1.6,
            color: "var(--color-text)",
            wordBreak: "break-word",
          }}
        >
          {isTyping ? (
            <div style={{ display: "flex", gap: 4, alignItems: "center", height: 18 }}>
              <span className="typing-dot" />
              <span className="typing-dot" />
              <span className="typing-dot" />
            </div>
          ) : (
            <span style={{ whiteSpace: "pre-wrap" }}>{text}</span>
          )}
        </div>

        {!isTyping && (
          <span style={{ fontSize: 10, color: "var(--color-text-dim)" }}>{formatTime(timestamp)}</span>
        )}
      </div>
    </div>
  );
}

export default function MessageFeed({ messages }: MessageFeedProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {messages.map((msg) => {
        if (msg.role === "system") {
          return <SystemMessage key={msg.id} text={msg.text} timestamp={msg.timestamp} />;
        }
        if (msg.role === "user") {
          return <UserMessage key={msg.id} text={msg.text} timestamp={msg.timestamp} />;
        }
        return (
          <AssistantMessage
            key={msg.id}
            text={msg.text}
            timestamp={msg.timestamp}
            engineId={msg.engineId}
            skillName={msg.skillName}
            isTyping={msg.isTyping}
          />
        );
      })}
    </div>
  );
}
