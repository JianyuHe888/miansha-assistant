"use client";

import { useEffect, useState } from "react";
import {
  adjustArmor,
  adjustMaxHp,
  applyDamage,
  createVitalityState,
  loseHp,
  recoverHp,
} from "../lib/tabletop-assistant-rules.mjs";
import { clearAssistantState, getAssistantStorageKey, loadAssistantState, saveAssistantState } from "../lib/assistant-rules.mjs";
import type { Hero } from "../lib/hero-types";

type VitalityState = ReturnType<typeof createVitalityState>;

function eventText(event: VitalityState["lastEvent"]) {
  if (!event) return "尚无结算记录";
  if (event.type === "damage") {
    return `受到 ${event.amount} 点伤害：护甲承担 ${event.armorLost}，体力减少 ${event.hpLost}（伤害事件仍成立）`;
  }
  if (event.type === "lose-hp") return `失去 ${event.hpLost} 点体力（无视护甲）`;
  if (event.type === "recover") return `回复 ${event.recovered} 点体力`;
  if (event.type === "max-hp") return `体力上限${event.delta >= 0 ? "+" : ""}${event.delta}`;
  if (event.type === "armor") return `护甲${event.delta >= 0 ? "+" : ""}${event.delta}`;
  return "状态已更新";
}

export function VitalityTracker({ hero }: { hero: Hero }) {
  const initial = createVitalityState(hero) as VitalityState;
  const [state, setState] = useState<VitalityState | null>(null);
  const storageKey = getAssistantStorageKey("vitality", hero.id);
  const current = state ?? initial;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const saved = loadAssistantState(window.localStorage, storageKey, initial) as VitalityState;
      setState(saved);
    }, 0);
    return () => window.clearTimeout(timer);
  // The initial state is derived from hero and should reload only when the hero changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  const update = (next: VitalityState) => {
    setState(next);
    saveAssistantState(window.localStorage, storageKey, next);
  };
  const reset = () => {
    clearAssistantState(window.localStorage, storageKey);
    setState(initial);
  };

  return (
    <section className="vitality-tracker" aria-label={`${hero.name}本局体力台`}>
      <header>
        <div><span>本局体力</span><strong>{current.hp}<small> / {current.maxHp}</small></strong></div>
        <div className="armor-value"><span>护甲</span><strong>{current.armor}</strong></div>
        <button onClick={reset} type="button">复原</button>
      </header>
      <div className="vitality-actions">
        <button className="damage-action" onClick={() => update(applyDamage(current, 1))} type="button"><b>受到伤害</b><small>−1 · 先扣护甲</small></button>
        <button className="lose-hp-action" onClick={() => update(loseHp(current, 1))} type="button"><b>失去体力</b><small>−1 · 无视护甲</small></button>
        <button className="recover-action" onClick={() => update(recoverHp(current, 1))} type="button"><b>回复体力</b><small>＋1 · 不超上限</small></button>
      </div>
      <div className="vitality-adjustments">
        <span>体力上限</span>
        <button aria-label="体力上限减一" onClick={() => update(adjustMaxHp(current, -1))} type="button">−</button>
        <b>{current.maxHp}</b>
        <button aria-label="体力上限加一" onClick={() => update(adjustMaxHp(current, 1))} type="button">＋</button>
        <span>护甲</span>
        <button aria-label="护甲减一" onClick={() => update(adjustArmor(current, -1))} type="button">−</button>
        <b>{current.armor}</b>
        <button aria-label="护甲加一" onClick={() => update(adjustArmor(current, 1))} type="button">＋</button>
      </div>
      <p>{eventText(current.lastEvent)}</p>
    </section>
  );
}
