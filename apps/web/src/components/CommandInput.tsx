"use client";

import { useState, useRef, useEffect, KeyboardEvent } from "react";

interface CommandInputProps {
  onSubmit: (text: string) => void;
  disabled?: boolean;
}

const QUICK_COMMANDS = [
  "Crear oferta irresistible",
  "Crear campaña Meta Ads",
  "Analizar llamada de ventas",
  "Reporte ejecutivo semanal",
];

export default function CommandInput({ onSubmit, disabled }: CommandInputProps) {
  const [value, setValue] = useState("");
  const [micActive, setMicActive] = useState(false);
  const [micSupported, setMicSupported] = useState(true);
  const [interimText, setInterimText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const supported =
      typeof window !== "undefined" &&
      ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);
    setMicSupported(supported);
  }, []);

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  function submit() {
    const text = value.trim();
    if (!text || disabled) return;
    onSubmit(text);
    setValue("");
    setInterimText("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }

  function handleInput() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }

  function stopMic() {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setMicActive(false);
    setInterimText("");
  }

  function toggleMic() {
    if (micActive) {
      stopMic();
      return;
    }

    if (!micSupported) {
      alert("Tu navegador no soporta reconocimiento de voz. Usa Chrome o Edge para dictar.");
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    const SpeechRecognitionAPI = w.SpeechRecognition ?? w.webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      alert("Tu navegador no soporta reconocimiento de voz. Usa Chrome o Edge.");
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.lang = "es-ES";
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onstart = () => {
      setMicActive(true);
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      let interim = "";
      let final = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += transcript;
        } else {
          interim += transcript;
        }
      }
      if (final) {
        setValue((prev) => (prev ? prev + " " + final : final).trim());
        setInterimText("");
        textareaRef.current?.focus();
        handleInput();
      } else {
        setInterimText(interim);
      }
    };

    recognition.onerror = () => {
      stopMic();
    };

    recognition.onend = () => {
      setMicActive(false);
      setInterimText("");
      recognitionRef.current = null;
    };

    recognition.start();
    recognitionRef.current = recognition;
  }

  const hasValue = value.trim().length > 0;

  return (
    <div
      style={{
        padding: "10px 16px 14px",
        background: "var(--color-surface)",
        borderTop: "1px solid var(--color-border)",
        flexShrink: 0,
      }}
    >
      {/* Interim voice text indicator */}
      {interimText && (
        <div
          style={{
            fontSize: 12,
            color: "var(--color-purple)",
            padding: "4px 8px",
            marginBottom: 6,
            background: "rgba(168,85,247,0.08)",
            borderRadius: 6,
            border: "1px solid rgba(168,85,247,0.2)",
            fontStyle: "italic",
          }}
        >
          🎙 {interimText}
        </div>
      )}

      {/* Input box */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: 8,
          background: "var(--color-surface-2)",
          border: `1px solid ${micActive ? "var(--color-purple)" : "var(--color-border)"}`,
          borderRadius: 12,
          padding: "8px 10px 8px 14px",
          transition: "border-color 0.15s",
        }}
      >
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onInput={handleInput}
          disabled={disabled}
          rows={1}
          placeholder={
            micActive
              ? "Escuchando… habla ahora"
              : "Escribe o dicta una orden al sistema… (Enter para enviar)"
          }
          style={{
            flex: 1,
            background: "transparent",
            border: "none",
            outline: "none",
            color: "var(--color-text)",
            fontSize: 14,
            lineHeight: 1.5,
            resize: "none",
            minHeight: 24,
            maxHeight: 160,
            fontFamily: "inherit",
            overflowY: "auto",
          }}
        />

        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0, paddingBottom: 2 }}>
          {/* Mic button */}
          <button
            onClick={toggleMic}
            className={micActive ? "mic-active" : ""}
            title={
              !micSupported
                ? "Micrófono no soportado (usa Chrome o Edge)"
                : micActive
                ? "Detener dictado"
                : "Activar dictado por voz"
            }
            style={{
              width: 34,
              height: 34,
              borderRadius: "50%",
              background: micActive ? "var(--color-purple)" : "var(--color-surface-3)",
              border: `1px solid ${micActive ? "var(--color-purple)" : "var(--color-border)"}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 15,
              color: micActive ? "#fff" : micSupported ? "var(--color-text-muted)" : "var(--color-text-dim)",
              transition: "background 0.2s, border-color 0.2s, color 0.2s",
              opacity: micSupported ? 1 : 0.5,
            }}
          >
            🎙
          </button>

          {/* Send button */}
          <button
            onClick={submit}
            disabled={!hasValue || disabled}
            title="Enviar orden"
            style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              background: hasValue && !disabled ? "var(--color-accent)" : "var(--color-surface-3)",
              border: `1px solid ${hasValue && !disabled ? "var(--color-accent)" : "var(--color-border)"}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 14,
              color: hasValue && !disabled ? "#fff" : "var(--color-text-dim)",
              transition: "all 0.2s",
            }}
          >
            ↑
          </button>
        </div>
      </div>

      {/* Quick commands */}
      <div style={{ marginTop: 6, display: "flex", gap: 6, flexWrap: "wrap" }}>
        {QUICK_COMMANDS.map((hint) => (
          <button
            key={hint}
            onClick={() => {
              setValue(hint);
              textareaRef.current?.focus();
            }}
            disabled={disabled}
            style={{
              fontSize: 11,
              color: "var(--color-text-dim)",
              padding: "2px 8px",
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
    </div>
  );
}
