"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getAssistantStorageKey, loadAssistantState, saveAssistantState } from "../lib/assistant-rules.mjs";
import type { Hero } from "../lib/hero-types";
import { buildSkillReferenceIndex } from "../lib/skill-reference-rules.mjs";
import { createHeroCounterState, createVitalityState } from "../lib/tabletop-assistant-rules.mjs";
import { HeroCard } from "./HeroCard";
import { SkillAssistant } from "./SkillAssistant";
import { SkillText } from "./SkillText";
import { VitalityTracker } from "./VitalityTracker";

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
  const skillIndex = useMemo(
    () => new Map(hero.skills.map((skill) => [skill.id, skill])),
    [hero.skills],
  );
  const skillReferenceIndex = useMemo(
    () => buildSkillReferenceIndex(heroes),
    [heroes],
  );
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
      aria-label={`${hero.name}武将详情`}
      aria-modal="true"
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) onClose();
      }}
      role="dialog"
    >
      <div className={`hero-modal${assistantOpen ? " assistant-expanded" : ""}`}>
        <button aria-label="关闭" className="modal-close" onClick={onClose} type="button">×</button>
        <div className="hero-card-section hero-visual-column">
          <HeroCard
            counterState={counterState}
            flipped={flipped}
            hero={hero}
            onFlip={toggleFlipped}
            vitalityState={vitalityState}
          />
          <VitalityTracker hero={hero} onStateChange={setVitalityState} />
        </div>
        <div className="hero-skill-section modal-copy">
          {hero.faceToFace === "excluded" && hero.excludedReason && (
            <p className="excluded-reason">{hero.excludedReason}</p>
          )}
          <section className="modal-skills" aria-label="武将技能">
            <div className="modal-section-title"><span>SKILLS</span><h3>武将技能</h3></div>
            <div className="skill-list">
              {baseSkills.map((skill) => (
                <article className="skill-item" key={skill.id}>
                  <h4>{skill.name}</h4>
                  <SkillText
                    skill={skill}
                    skillIndex={skillIndex}
                    skillReferenceIndex={skillReferenceIndex}
                  />
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
