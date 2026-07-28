"use client";

import { calculateFuhanMaxHp, drawFuhanCandidates } from "../../lib/tabletop-assistant-rules.mjs";
import type { AssistantPanelProps } from "./types";

type FuhanState = {
  version: number;
  candidateIds: string[];
  selectedId: string | null;
  removedMeiying: number;
  playerCount: number;
};

export function FuhanAssistant({ heroes, state, onChange }: AssistantPanelProps) {
  const current = state as FuhanState | null;
  const candidates = current?.candidateIds
    .map((id) => heroes.find((item) => item.id === id))
    .filter(Boolean) ?? [];
  const selected = heroes.find((item) => item.id === current?.selectedId);
  const maxHp = current
    ? calculateFuhanMaxHp(current.removedMeiying, current.playerCount)
    : 0;
  const draw = () => onChange({
    version: 1,
    candidateIds: drawFuhanCandidates(heroes).map((item: { id: string }) => item.id),
    selectedId: null,
    removedMeiying: 0,
    playerCount: 8,
  });

  if (!current) {
    return (
      <div className="assistant-empty">
        <span className="assistant-emblem">汉</span>
        <h3>扶汉 · 随机观看五名蜀将</h3>
        <p>从移动版身份局蜀势力武将中无重复随机抽取五名，排除赵襄和不可面杀武将。</p>
        <button onClick={draw} type="button">随机展示五名蜀将</button>
      </div>
    );
  }

  return (
    <div className="assistant-flow">
      <div className="assistant-callout">
        <b>扶汉候选</b>
        <span>{selected ? `已选择 ${selected.name}，可在下方继续核对技能。` : "点击一名武将作为替换目标。"}</span>
      </div>
      <div className="fuhan-grid">
        {candidates.map((candidate) => candidate && (
          <button
            aria-pressed={current.selectedId === candidate.id}
            key={candidate.id}
            onClick={() => onChange({ ...current, selectedId: candidate.id })}
            type="button"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt="" src={candidate.image} />
            <span><b>{candidate.name}</b><small>{candidate.hp}{candidate.maxHp ? `/${candidate.maxHp}` : ""} 体力 · {candidate.faction}</small></span>
          </button>
        ))}
      </div>

      <section className="fuhan-vitality">
        <label><span>本局累计移除“梅影”</span><input min="0" onChange={(event) => onChange({ ...current, removedMeiying: Number(event.target.value) })} type="number" value={current.removedMeiying} /></label>
        <label><span>游戏人数</span><input max="8" min="2" onChange={(event) => onChange({ ...current, playerCount: Number(event.target.value) })} type="number" value={current.playerCount} /></label>
        <div><span>替换后体力上限</span><strong>{maxHp}</strong><small>至多为游戏人数</small></div>
      </section>

      {selected && (
        <section>
          <div className="assistant-section-heading"><h3>{selected.name} · 基础技能</h3><span>{selected.sourcePack}</span></div>
          <div className="assistant-rule-list">
            {selected.skills.filter((item) => item.kind === "base").map((item) => (
              <article key={item.id}><b>{item.name}</b><p>{item.description}</p></article>
            ))}
          </div>
          <p className="assistant-footnote">将体力上限调整为 {maxHp}；若赵襄此时为全场体力值最低角色，再回复 1 点体力。</p>
        </section>
      )}
      <div className="assistant-actions"><button onClick={draw} type="button">重新随机五名</button></div>
    </div>
  );
}
