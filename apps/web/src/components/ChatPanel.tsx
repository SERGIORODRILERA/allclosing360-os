"use client";

import { useRef, useEffect, useState, useCallback, KeyboardEvent } from "react";
import type { EngineId } from "@ac360/types";
import MessageFeed, { type Message } from "./MessageFeed";
import TasksPanel, { type UITask } from "./TasksPanel";
import { DIRECTOR_MAP } from "../lib/engines";

interface ChatPanelProps {
  messages: Message[];
  tasks: UITask[];
  activeDirectorId: EngineId | null;
  isProcessing: boolean;
  onSubmit: (text: string) => void;
  onClear: () => void;
  onExport: () => void;
  onViewResult: (task: UITask) => void;
}

const QUICK_HINTS = [
  "Crear oferta irresistible",
  "Campaña Meta Ads",
  "Reporte ejecutivo",
  "SOP operativo",
];

export default function ChatPanel({
  messages,
  tasks,
  activeDirectorId,
  isProcessing,
  onSubmit,
  onClear,
  onExport,
  onViewResult,
}: ChatPanelProps) {
  const [value, setValue] = useState("");
  const [micActive, setMicActive] = useState(false);
  const [micSupported, setMicSupported] = useState(true);
  const [interimText, setInterimText] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const feedRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const ttsChromeFix = useRef<ReturnType<typeof setInterval> | null>(null);
  const isSpeakingRef = useRef(false);
  const micShouldRestart = useRef(false);

  const activeTasks = tasks.filter((t) => t.status === "in_progress").length;
  const activeDirector = activeDirectorId ? DIRECTOR_MAP[activeDirectorId] : null;

  useEffect(() => {
    const w = window as unknown as Record<string, unknown>;
    setMicSupported(Boolean(w.SpeechRecognition || w.webkitSpeechRecognition));
  }, []);

  // TTS: speak text chunked by sentence, Chrome-safe
  const speak = useCallback((text: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    if (ttsChromeFix.current) clearInterval(ttsChromeFix.current);

    const sentences = text.match(/[^.!?¡¿]+[.!?]+/g) ?? [text];
    let idx = 0;

    const getVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      return (
        voices.find((v) => v.lang.startsWith("es") && v.localService) ??
        voices.find((v) => v.lang.startsWith("es")) ??
        null
      );
    };

    const speakNext = () => {
      if (idx >= sentences.length) {
        isSpeakingRef.current = false;
        setIsSpeaking(false);
        if (ttsChromeFix.current) clearInterval(ttsChromeFix.current);
        return;
      }
      const utt = new SpeechSynthesisUtterance(sentences[idx++]);
      const voice = getVoice();
      if (voice) utt.voice = voice;
      utt.lang = "es-ES";
      utt.rate = 1.05;
      utt.pitch = 1.0;
      utt.onend = () => setTimeout(speakNext, 80);
      utt.onerror = () => setTimeout(speakNext, 80);
      window.speechSynthesis.speak(utt);
    };

    isSpeakingRef.current = true;
    setIsSpeaking(true);
    speakNext();

    // Chrome cuts out after ~15s — keep it alive with pause/resume
    ttsChromeFix.current = setInterval(() => {
      if (isSpeakingRef.current && window.speechSynthesis.speaking) {
        window.speechSynthesis.pause();
        window.speechSynthesis.resume();
      }
    }, 13000);
  }, []);

  const stopSpeaking = useCallback(() => {
    if (typeof window !== "undefined") window.speechSynthesis?.cancel();
    isSpeakingRef.current = false;
    setIsSpeaking(false);
    if (ttsChromeFix.current) clearInterval(ttsChromeFix.current);
  }, []);

  // Scroll to bottom on new messages
  useEffect(() => {
    const el = feedRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  // Auto-speak the last assistant message (non-typing)
  const lastSpokenId = useRef<string | null>(null);
  useEffect(() => {
    const last = [...messages].reverse().find((m) => m.role === "assistant" && !m.isTyping && m.text);
    if (last && last.id !== lastSpokenId.current) {
      lastSpokenId.current = last.id;
      speak(last.text);
    }
  }, [messages, speak]);

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  function submit() {
    const text = value.trim();
    if (!text || isProcessing) return;
    onSubmit(text);
    setValue("");
    setInterimText("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  }

  function handleInput() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
  }

  function stopMic() {
    micShouldRestart.current = false;
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setMicActive(false);
    setInterimText("");
  }

  function toggleMic() {
    if (micActive) { stopMic(); return; }
    if (!micSupported) { alert("Tu navegador no soporta dictado por voz. Usa Chrome o Edge."); return; }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    const API = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!API) { alert("Usa Chrome o Edge para dictar."); return; }

    const r = new API();
    r.lang = "es-ES";
    r.continuous = true;       // don't stop after each sentence
    r.interimResults = true;
    r.onstart = () => setMicActive(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    r.onresult = (event: any) => {
      let interim = "";
      let final = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) final += t;
        else interim += t;
      }
      if (final) {
        setValue((prev) => (prev ? prev + " " + final : final).trim());
        setInterimText("");
      } else {
        setInterimText(interim);
      }
    };
    r.onerror = (e: { error: string }) => {
      if (e.error !== "no-speech") stopMic();
    };
    r.onend = () => {
      // Auto-restart if user hasn't stopped manually
      if (micShouldRestart.current && recognitionRef.current) {
        try { recognitionRef.current.start(); } catch { /* already running */ }
      } else {
        setMicActive(false);
        setInterimText("");
        recognitionRef.current = null;
      }
    };
    micShouldRestart.current = true;
    r.start();
    recognitionRef.current = r;
  }

  const hasValue = value.trim().length > 0;

  return (
    <aside
      style={{
        width: "var(--chat-width)",
        background: "var(--color-surface)",
        borderLeft: "1px solid var(--color-border)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        position: "relative",
        zIndex: 5,
      }}
    >
      {/* ── Header ── */}
      <header
        style={{
          padding: "12px 14px 10px",
          borderBottom: "1px solid var(--color-border)",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--color-text)", letterSpacing: "0.01em" }}>
            Command Chat
          </div>
          <div style={{ display: "flex", gap: 5 }}>
            {isSpeaking && (
              <button
                onClick={stopSpeaking}
                title="Silenciar voz"
                style={{
                  fontSize: 11, padding: "4px 8px", borderRadius: 6,
                  background: "rgba(79,126,255,0.15)", border: "1px solid var(--color-accent)",
                  color: "var(--color-accent)",
                }}
              >
                🔊
              </button>
            )}
            <button
              onClick={onExport}
              title="Exportar sesión"
              style={{
                fontSize: 11,
                padding: "4px 8px",
                borderRadius: 6,
                background: "var(--color-surface-2)",
                border: "1px solid var(--color-border)",
                color: "var(--color-text-muted)",
              }}
            >
              ⬇️
            </button>
            <button
              onClick={onClear}
              title="Limpiar memoria"
              style={{
                fontSize: 11,
                padding: "4px 8px",
                borderRadius: 6,
                background: "var(--color-surface-2)",
                border: "1px solid var(--color-border)",
                color: "var(--color-error)",
              }}
            >
              🗑️
            </button>
          </div>
        </div>

        {/* Status bar */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* Online/processing indicator */}
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <div
              className={isProcessing ? "status-dot-active" : ""}
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: isProcessing ? "var(--color-warning)" : "var(--color-success)",
              }}
            />
            <span style={{ fontSize: 10, color: "var(--color-text-dim)" }}>
              {isProcessing ? "Procesando…" : "Online"}
            </span>
          </div>

          {/* Active director pill */}
          {activeDirector && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                fontSize: 10,
                color: activeDirector.color,
                background: `${activeDirector.color}12`,
                border: `1px solid ${activeDirector.color}25`,
                borderRadius: 5,
                padding: "2px 7px",
              }}
            >
              <span>{activeDirector.icon}</span>
              <span>{activeDirector.shortName}</span>
            </div>
          )}

          {/* Active tasks badge */}
          {activeTasks > 0 && (
            <div
              style={{
                fontSize: 10,
                color: "var(--color-warning)",
                background: "rgba(251,191,36,0.1)",
                border: "1px solid rgba(251,191,36,0.2)",
                borderRadius: 5,
                padding: "2px 7px",
                marginLeft: "auto",
              }}
            >
              {activeTasks} tarea{activeTasks > 1 ? "s" : ""}
            </div>
          )}
        </div>
      </header>

      {/* ── Messages ── */}
      <div
        ref={feedRef}
        style={{ flex: 1, overflow: "auto", padding: "16px 14px" }}
      >
        <MessageFeed messages={messages} />
        <div style={{ height: 8 }} />
      </div>

      {/* ── Task list (always visible) ── */}
      {tasks.length > 0 && (
        <div
          style={{
            borderTop: "1px solid var(--color-border)",
            flexShrink: 0,
            maxHeight: 260,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <TasksPanel tasks={tasks} onViewResult={onViewResult} />
        </div>
      )}

      {/* ── Input area ── */}
      <div
        style={{
          padding: "10px 12px 12px",
          borderTop: "1px solid var(--color-border)",
          flexShrink: 0,
          background: "var(--color-surface)",
        }}
      >
        {/* Interim voice text */}
        {interimText && (
          <div
            style={{
              fontSize: 11,
              color: "var(--color-purple)",
              padding: "4px 8px",
              marginBottom: 6,
              background: "rgba(162,89,255,0.08)",
              borderRadius: 6,
              border: "1px solid rgba(162,89,255,0.18)",
              fontStyle: "italic",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <div style={{ display: "flex", gap: 2 }}>
              {[...Array(5)].map((_, i) => (
                <div key={i} className="voice-bar" style={{ height: 10 + (i % 3) * 5 }} />
              ))}
            </div>
            {interimText}
          </div>
        )}

        {/* Input box */}
        <div
          className="chat-input-box"
          style={{
            display: "flex",
            alignItems: "flex-end",
            gap: 6,
            background: "var(--color-surface-2)",
            border: `1px solid ${micActive ? "var(--color-purple)" : "var(--color-border)"}`,
            borderRadius: 12,
            padding: "7px 8px 7px 12px",
            transition: "border-color 0.15s, box-shadow 0.15s",
          }}
        >
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onInput={handleInput}
            disabled={isProcessing}
            rows={1}
            placeholder={micActive ? "Escuchando… habla ahora" : "Escribe u ordena al sistema…"}
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              color: "var(--color-text)",
              fontSize: 13,
              lineHeight: 1.5,
              resize: "none",
              minHeight: 22,
              maxHeight: 140,
              fontFamily: "inherit",
              overflowY: "auto",
            }}
          />

          <div style={{ display: "flex", alignItems: "center", gap: 5, flexShrink: 0, paddingBottom: 1 }}>
            {/* Mic button */}
            <button
              onClick={toggleMic}
              className={micActive ? "mic-active" : ""}
              title={micActive ? "Detener dictado" : micSupported ? "Dictado por voz (es-ES)" : "Voz no disponible (usa Chrome)"}
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: micActive ? "var(--color-purple)" : "var(--color-surface-3)",
                border: `1px solid ${micActive ? "var(--color-purple)" : "var(--color-border)"}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 14,
                color: micActive ? "#fff" : micSupported ? "var(--color-text-muted)" : "var(--color-text-dim)",
                transition: "all 0.2s",
                position: "relative",
                opacity: micSupported ? 1 : 0.45,
              }}
            >
              {micActive && (
                <>
                  <div className="mic-ring" />
                  <div className="mic-ring" />
                </>
              )}
              🎙
            </button>

            {/* Send */}
            <button
              onClick={submit}
              disabled={!hasValue || isProcessing}
              title="Enviar orden (Enter)"
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: hasValue && !isProcessing ? "var(--color-accent)" : "var(--color-surface-3)",
                border: `1px solid ${hasValue && !isProcessing ? "var(--color-accent)" : "var(--color-border)"}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 14,
                color: hasValue && !isProcessing ? "#fff" : "var(--color-text-dim)",
                transition: "all 0.2s",
              }}
            >
              ↑
            </button>
          </div>
        </div>

        {/* Voice visualization */}
        {micActive && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 3,
              marginTop: 8,
              padding: "6px 0",
            }}
          >
            {[...Array(9)].map((_, i) => (
              <div
                key={i}
                className="voice-bar"
                style={{ animationDelay: `${i * 0.07}s` }}
              />
            ))}
          </div>
        )}

        {/* Quick hints */}
        {!micActive && (
          <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 4 }}>
            {QUICK_HINTS.map((hint) => (
              <button
                key={hint}
                onClick={() => { setValue(hint); textareaRef.current?.focus(); }}
                disabled={isProcessing}
                style={{
                  fontSize: 10,
                  color: "var(--color-text-dim)",
                  padding: "2px 7px",
                  borderRadius: 4,
                  border: "1px solid var(--color-border-subtle)",
                  background: "transparent",
                  transition: "color 0.15s, border-color 0.15s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.color = "var(--color-text-muted)";
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--color-border)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.color = "var(--color-text-dim)";
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--color-border-subtle)";
                }}
              >
                {hint}
              </button>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
