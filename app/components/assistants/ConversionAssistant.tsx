"use client";

import { extractConversionSkills, toggleConversion } from "../../lib/tabletop-assistant-rules.mjs";
import type { AssistantPanelProps } from "./types";

type ConversionState = {
  version: number;
  sides: Record<string, "yang" | "yin">;
};

export function ConversionAssistant({ hero, state, onChange }: AssistantPanelProps) {
  const skills = extractConversionSkills(hero);
  const current = (state as ConversionState | null) ?? { version: 1, sides: {} };

  return (
    <div className="assistant-flow">
      <div className="assistant-callout"><b>转换技状态</b><span>默认从“阳”开始；技能发动后自动转换到另一状态。</span></div>
      <div className="conversion-list">
        {skills.map((item: { id: string; name: string; yang: string; yin: string }) => {
          const side = current.sides[item.id] ?? "yang";
          const next = toggleConversion(side);
          return (
            <article className={`conversion-card ${side}`} key={item.id}>
              <header><div><small>{side === "yang" ? "YANG / 阳" : "YIN / 阴"}</small><h3>{item.name}</h3></div><strong>{side === "yang" ? "阳" : "阴"}</strong></header>
              <p>{side === "yang" ? item.yang : item.yin}</p>
              <div>
                <button onClick={() => onChange({ ...current, sides: { ...current.sides, [item.id]: next } })} type="button">
                  发动并转换为{next === "yang" ? "阳" : "阴"}
                </button>
                <button className="secondary-action" onClick={() => onChange({ ...current, sides: { ...current.sides, [item.id]: side === "yang" ? "yin" : "yang" } })} type="button">手动纠正状态</button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
