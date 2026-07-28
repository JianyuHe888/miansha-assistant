"use client";

import { useMemo, useState } from "react";
import {
  addCounter,
  createHeroCounterState,
  getSuggestedCounters,
  removeCounter,
  renameCounterSeat,
  setCounter,
} from "../../lib/tabletop-assistant-rules.mjs";
import type { AssistantPanelProps } from "./types";

type CounterState = {
  version: number;
  seats: string[];
  entries: Record<string, number>;
};

export function TrackerAssistant({ hero, state, onChange }: AssistantPanelProps) {
  const current = (state as CounterState | null) ?? createHeroCounterState(hero);
  const suggestions = useMemo(
    () => getSuggestedCounters(hero).filter((counter: { name: string }) => counter.name !== "护甲"),
    [hero],
  ) as { name: string; skillNames: string[]; initial: number; max: number | null }[];
  const [selectedMark, setSelectedMark] = useState(suggestions[0]?.name ?? "标记");
  const [selectedSeat, setSelectedSeat] = useState(current.seats[0] ?? "自己");
  const [customMark, setCustomMark] = useState("");
  const [seatDrafts, setSeatDrafts] = useState<Record<string, string>>({});
  const rows = Object.entries(current.entries)
    .filter(([, count]) => count > 0)
    .map(([key, count]) => {
      const separator = key.indexOf("::");
      return { seat: key.slice(0, separator), mark: key.slice(separator + 2), count };
    });

  const add = () => {
    const mark = customMark.trim() || selectedMark;
    if (!mark) return;
    onChange(addCounter(current, mark, selectedSeat, 1));
    setCustomMark("");
  };

  return (
    <div className="assistant-flow tracker-assistant">
      <div className="assistant-callout">
        <b>桌面标记台</b>
        <span>按座次记录数字标记和蓄力点；护甲请使用武将详情将面下方的体力台。</span>
      </div>

      <section className="tracker-setup" aria-label="添加标记">
        <label>
          <span>座次</span>
          <select onChange={(event) => setSelectedSeat(event.target.value)} value={selectedSeat}>
            {current.seats.map((seat) => <option key={seat}>{seat}</option>)}
          </select>
        </label>
        <label>
          <span>建议标记</span>
          <select disabled={!suggestions.length} onChange={(event) => setSelectedMark(event.target.value)} value={selectedMark}>
            {suggestions.length
              ? suggestions.map((counter) => <option key={counter.name}>{counter.name}</option>)
              : <option>标记</option>}
          </select>
        </label>
        <label>
          <span>或自定义</span>
          <input onChange={(event) => setCustomMark(event.target.value)} placeholder="输入标记名" value={customMark} />
        </label>
        <button onClick={add} type="button">添加 1 枚</button>
      </section>

      <section aria-label="当前标记">
        <div className="assistant-section-heading"><h3>当前桌面状态</h3><span>{rows.length} 项</span></div>
        {rows.length ? (
          <div className="tracker-rows">
            {rows.map((row) => (
              <article key={`${row.seat}-${row.mark}`}>
                <div>
                  <small>{row.seat}</small>
                  <strong>{row.mark}</strong>
                  {suggestions.find((item) => item.name === row.mark)?.max && <small>上限 {suggestions.find((item) => item.name === row.mark)?.max}</small>}
                </div>
                <div className="counter-controls">
                  <button aria-label={`${row.seat}${row.mark}减一`} onClick={() => onChange(addCounter(current, row.mark, row.seat, -1))} type="button">−</button>
                  <input
                    aria-label={`${row.seat}${row.mark}数量`}
                    className="counter-value-input"
                    max={suggestions.find((item) => item.name === row.mark)?.max ?? undefined}
                    min={0}
                    onChange={(event) => {
                      const maximum = suggestions.find((item) => item.name === row.mark)?.max;
                      const value = Number(event.target.value);
                      onChange(setCounter(
                        current,
                        row.mark,
                        row.seat,
                        maximum ? Math.min(maximum, value) : value,
                      ));
                    }}
                    onFocus={(event) => event.currentTarget.select()}
                    step={1}
                    type="number"
                    value={row.count}
                  />
                  <button aria-label={`${row.seat}${row.mark}加一`} onClick={() => onChange(addCounter(current, row.mark, row.seat, 1))} type="button">＋</button>
                  <button className="counter-remove" onClick={() => onChange(removeCounter(current, row.mark, row.seat))} type="button">清除</button>
                </div>
              </article>
            ))}
          </div>
        ) : <p className="assistant-footnote">还没有标记。选择座次和标记名后点击“添加 1 枚”。</p>}
      </section>

      <details className="seat-editor">
        <summary>修改座次名称</summary>
        <div>
          {current.seats.map((seat) => (
            <label key={seat}>
              <span>{seat}</span>
              <input
                onBlur={() => {
                  const next = seatDrafts[seat]?.trim();
                  if (!next || next === seat) return;
                  onChange(renameCounterSeat(current, seat, next));
                  setSelectedSeat((value) => value === seat ? next : value);
                  setSeatDrafts((value) => {
                    const updated = { ...value };
                    delete updated[seat];
                    return updated;
                  });
                }}
                onChange={(event) => setSeatDrafts((value) => ({ ...value, [seat]: event.target.value }))}
                value={seatDrafts[seat] ?? seat}
              />
            </label>
          ))}
        </div>
      </details>

      <section>
        <div className="assistant-section-heading"><h3>涉及的现行技能</h3><span>移动版身份局</span></div>
        <div className="assistant-rule-list">
          {hero.skills
            .filter((item) => /标记|蓄力技|蓄力点|护甲/.test(item.description))
            .map((item) => <article key={item.id}><b>{item.name}</b><p>{item.description}</p></article>)}
        </div>
      </section>
    </div>
  );
}
