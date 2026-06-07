"use client";

import { useState, useRef, useEffect } from "react";
import { COMPANIES, type Company } from "../lib/companies";

interface CompanySelectorProps {
  selectedId: string;
  onSelect: (companyId: string) => void;
}

export default function CompanySelector({ selectedId, onSelect }: CompanySelectorProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = (COMPANIES.find((c) => c.id === selectedId) ?? COMPANIES[0])!;

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      {/* Trigger */}
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 7,
          padding: "5px 8px",
          background: "var(--color-surface-2)",
          border: "1px solid var(--color-border)",
          borderRadius: 8,
          cursor: "pointer",
          transition: "border-color 0.15s",
        }}
      >
        <span style={{ fontSize: 16 }}>{selected.emoji}</span>
        <div style={{ textAlign: "left" }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "var(--color-text)", lineHeight: 1.2 }}>
            {selected.name}
          </div>
          <div style={{ fontSize: 9, color: "var(--color-text-dim)" }}>{selected.sector}</div>
        </div>
        <span
          style={{
            fontSize: 8,
            color: "var(--color-text-dim)",
            marginLeft: 2,
            transition: "transform 0.2s",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            display: "inline-block",
          }}
        >
          ▼
        </span>
      </button>

      {/* Dropdown */}
      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            zIndex: 200,
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: 10,
            overflow: "hidden",
            boxShadow: "0 8px 30px rgba(0,0,0,0.5)",
            minWidth: 210,
            animation: "fade-in 0.12s ease-out",
          }}
        >
          {COMPANIES.map((company) => (
            <CompanyRow
              key={company.id}
              company={company}
              isSelected={company.id === selectedId}
              onSelect={() => { onSelect(company.id); setOpen(false); }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CompanyRow({
  company,
  isSelected,
  onSelect,
}: {
  company: Company;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: 9,
        padding: "9px 12px",
        background: isSelected ? "var(--color-accent-glow)" : "transparent",
        border: "none",
        borderBottom: "1px solid var(--color-border-subtle)",
        textAlign: "left",
        cursor: "pointer",
        transition: "background 0.12s",
      }}
      onMouseEnter={(e) => { if (!isSelected) (e.currentTarget as HTMLButtonElement).style.background = "var(--color-surface-2)"; }}
      onMouseLeave={(e) => { if (!isSelected) (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
    >
      <span style={{ fontSize: 18, flexShrink: 0 }}>{company.emoji}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: isSelected ? 600 : 400, color: isSelected ? "var(--color-accent)" : "var(--color-text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {company.name}
        </div>
        <div style={{ fontSize: 10, color: "var(--color-text-dim)" }}>{company.sector}</div>
      </div>
      {isSelected && (
        <span style={{ fontSize: 10, color: "var(--color-accent)", flexShrink: 0 }}>✓</span>
      )}
    </button>
  );
}
