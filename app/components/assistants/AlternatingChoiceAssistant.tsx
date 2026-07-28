"use client";

import { recordSimaFuChoice } from "../../lib/tabletop-assistant-rules.mjs";
import type { AssistantPanelProps } from "./types";

const SEATS = ["自己", "二号位", "三号位", "四号位", "五号位", "六号位", "七号位", "八号位"];
const OPTIONS = [
  "伤害-1，然后伤害来源摸两张牌",
  "伤害+1，然后受伤角色摸三张牌",
];

type AlternatingState = { version: number; choices: Record<string, number> };

export function AlternatingChoiceAssistant({ state, onChange }: AssistantPanelProps) {
  const current = (state as AlternatingState | null) ?? { version: 1, choices: {} };
  return (
    <div className="assistant-flow">
      <div className="assistant-callout"><b>蹇襄逐目标记录</b><span>对同一名角色，不能选择与上次对其发动时相同的选项。</span></div>
      <div className="alternating-list">
        {SEATS.map((seat) => {
          const previous = current.choices[seat];
          return (
            <article key={seat}>
              <div><strong>{seat}</strong><small>{previous ? `上次：选项 ${previous}` : "尚未发动"}</small></div>
              <div>
                {OPTIONS.map((option, index) => {
                  const choice = index + 1;
                  return (
                    <button
                      disabled={previous === choice}
                      key={option}
                      onClick={() => onChange({ ...current, choices: recordSimaFuChoice(current.choices, seat, choice) })}
                      title={option}
                      type="button"
                    >
                      <b>选项 {choice}</b><span>{option}</span>
                    </button>
                  );
                })}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
