"use client";

import { useCallback, useEffect, useState } from "react";
import { getAssistantStorageKey, loadAssistantState, saveAssistantState } from "../lib/assistant-rules.mjs";
import type { Hero } from "../lib/hero-types";
import { createHeroCounterState, createVitalityState } from "../lib/tabletop-assistant-rules.mjs";
import { ArmorDisplay } from "./ArmorDisplay";
import { HeroCard } from "./HeroCard";
import { SkillAssistant } from "./SkillAssistant";
import { SkillText } from "./SkillText";
import { VitalityTracker } from "./VitalityTracker";
import { YinYangHealth } from "./YinYangHealth";

const POOL_LABELS = ["", "经典身份", "界限平衡", "进阶平衡", "完整将池"];
type CounterState = ReturnType<typeof createHeroCounterState>;
type VitalityState = ReturnType<typeof createVitalityState>;

export function HeroDetail({
  hero,
  heroes,
  onClose,
}: {
  hero: Hero;
  heroes: Hero[];
  onClose: () => void;
}) {
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [vitalityState, setVitalityState] = useState<VitalityState>(() => createVitalityState(hero));
  const [counterState, setCounterState] = useState<CounterState>(() => createHeroCounterState(hero));
  const [flipped, setFlipped] = useState(false);
  const baseSkills = hero.skills.filter((skill) => skill.kind === "base");
  const skillIndex = new Map(hero.skills.map((skill) => [skill.id, skill]));
  const trackerStorageKey = getAssistantStorageKey("trackers", hero.id);
  const flipStorageKey = getAssistantStorageKey("card-face", hero.id);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const initialCounters = createHeroCounterState(hero) as CounterState;
      setVitalityState(createVitalityState(hero) as VitalityState);
      setCounterState(loadAssistantState(window.localStorage, trackerStorageKey, initialCounters) as CounterState);
      setFlipped(Boolean(loadAssistantState(window.localStorage, flipStorageKey, false)));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [flipStorageKey, hero, trackerStorageKey]);

  const handleModuleStateChange = useCallback((moduleId: string, next: unknown) => {
    if (moduleId !== "trackers") return;
    setCounterState((next as CounterState | null) ?? createHeroCounterState(hero));
  }, [hero]);

  const toggleFlipped = () => {
    setFlipped((current) => {
      const next = !current;
      saveAssistantState(window.localStorage, flipStorageKey, next);
      return next;
    });
  };

  return (
    <div
      aria-labelledby="hero-detail-title"
      aria-modal="true"
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) onClose();
      }}
      role="dialog"
    >
      <div className={`hero-modal${assistantOpen ? " assistant-expanded" : ""}`}>
        <button aria-label="关闭" className="modal-close" onClick={onClose} type="button">×</button>
        <div className="hero-visual-column">
          <HeroCard
            counterState={counterState}
            flipped={flipped}
            hero={hero}
            onFlip={toggleFlipped}
            vitalityState={vitalityState}
          />
          <VitalityTracker hero={hero} onStateChange={setVitalityState} />
        </div>
        <div className="modal-copy">
          <span>CHARACTER CARD / 武将信息卡</span>
          <div className="modal-name-row">
            <div>
              <small>{hero.sourcePack} · {hero.rarity}</small>
              <h2 id="hero-detail-title">{hero.name}</h2>
            </div>
            <b className={`modal-faction faction-${hero.faction}`}>{hero.faction}</b>
          </div>
          <div className="detail-badges">
            <span>{POOL_LABELS[hero.presetLevel]}</span>
            {hero.faceToFace === "assisted" && <b>需辅助</b>}
            {hero.faceToFace === "excluded" && <b>不可面杀</b>}
          </div>
          <dl>
            <div><dt>势力</dt><dd>{hero.faction}</dd></div>
            <div>
              <dt>体力</dt>
              <dd className="detail-vitality">
                <YinYangHealth current={hero.hp} max={hero.maxHp ?? hero.hp} showNumbers />
                {hero.armor ? <ArmorDisplay armor={hero.armor} showNumbers /> : null}
              </dd>
            </div>
            <div><dt>系列</dt><dd>{hero.pack}</dd></div>
          </dl>
          {hero.faceToFace === "excluded" && hero.excludedReason && (
            <p className="excluded-reason">{hero.excludedReason}</p>
          )}
          <section className="modal-skills" aria-label="武将技能">
            <div className="modal-section-title"><span>SKILLS</span><h3>武将技能</h3></div>
            <div className="skill-list">
              {baseSkills.map((skill) => (
                <article className="skill-item" key={skill.id}>
                  <h4>{skill.name}</h4>
                  <SkillText skill={skill} skillIndex={skillIndex} />
                </article>
              ))}
            </div>
          </section>
          <div className="modal-links">
            {hero.faceToFace === "assisted" && (
              <button
                aria-controls="inline-skill-assistant"
                aria-expanded={assistantOpen}
                className="assistant-open-button"
                onClick={() => setAssistantOpen((open) => !open)}
                type="button"
              >
                {assistantOpen ? "收起面杀辅助" : "展开面杀辅助"}
              </button>
            )}
            <a href={hero.wikiUrl} rel="noreferrer" target="_blank">核对移动版现行技能 ↗</a>
          </div>
        </div>
        {assistantOpen && (
          <SkillAssistant
            hero={hero}
            heroes={heroes}
            onModuleStateChange={handleModuleStateChange}
            onClose={() => setAssistantOpen(false)}
          />
        )}
      </div>
    </div>
  );
}
