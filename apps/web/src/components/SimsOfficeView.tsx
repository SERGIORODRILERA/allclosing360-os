"use client";

import dynamic from "next/dynamic";
import type { EngineId } from "@ac360/types";
import type { UITask } from "./TasksPanel"; // eslint-disable-line @typescript-eslint/no-unused-vars

const SimsOffice3D = dynamic(() => import("./SimsOffice3D"), {
  ssr: false,
  loading: () => (
    <div style={{
      width: "100%",
      height: "100%",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      background: "#030308",
      gap: 14,
    }}>
      <div style={{
        width: 48, height: 48,
        border: "3px solid rgba(79,126,255,0.15)",
        borderTop: "3px solid #4f7eff",
        borderRadius: "50%",
        animation: "spin 0.9s linear infinite",
      }} />
      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em" }}>
        Cargando oficina 3D…
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  ),
});

interface Props {
  tasks: UITask[];
  activeDirectorId: EngineId | null;
  onDirectorSelect: (id: EngineId) => void;
  onViewResult?: (task: UITask) => void;
}

export default function SimsOfficeView(props: Props) {
  return <SimsOffice3D tasks={props.tasks} activeDirectorId={props.activeDirectorId} onDirectorSelect={props.onDirectorSelect} />;
}
