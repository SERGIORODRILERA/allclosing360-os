import type { EngineId } from "@ac360/types";
import { SKILLS, type SkillId } from "./skills";

export interface IntentResult {
  directorId: EngineId;
  skillId: SkillId;
  confidence: "alta" | "media" | "baja";
}

const FALLBACK_DIRECTOR: EngineId = "ceo_advisor";
const FALLBACK_SKILL: SkillId = "crear_reporte_ejecutivo";

export function detectIntent(text: string): IntentResult {
  const lower = text.toLowerCase();

  let bestSkillId: SkillId = FALLBACK_SKILL;
  let bestDirectorId: EngineId = FALLBACK_DIRECTOR;
  let bestScore = 0;

  for (const skill of SKILLS) {
    let score = 0;
    for (const keyword of skill.keywords) {
      if (lower.includes(keyword)) {
        score += keyword.split(" ").length * 2;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestSkillId = skill.id;
      bestDirectorId = skill.primaryDirector;
    }
  }

  const confidence: IntentResult["confidence"] =
    bestScore >= 4 ? "alta" : bestScore >= 2 ? "media" : "baja";

  return {
    directorId: bestDirectorId,
    skillId: bestSkillId,
    confidence,
  };
}
