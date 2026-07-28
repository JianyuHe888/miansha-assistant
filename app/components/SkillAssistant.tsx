"use client";

import { useEffect, useState } from "react";
import { clearAssistantState, getAssistantStorageKey, loadAssistantState, saveAssistantState } from "../lib/assistant-rules.mjs";
import type { Hero } from "../lib/hero-types";
import { BaixiAssistant } from "./assistants/BaixiAssistant";
import { FortuneAssistant } from "./assistants/FortuneAssistant";
import { HuashenAssistant } from "./assistants/HuashenAssistant";
import { JiedangAssistant } from "./assistants/JiedangAssistant";
import { JingxieReference } from "./assistants/JingxieReference";
import { ZhengjingAssistant } from "./assistants/ZhengjingAssistant";
import { AlternatingChoiceAssistant } from "./assistants/AlternatingChoiceAssistant";
import { ConversionAssistant } from "./assistants/ConversionAssistant";
import { FuhanAssistant } from "./assistants/FuhanAssistant";
import { MouyiAssistant } from "./assistants/MouyiAssistant";
import { TrackerAssistant } from "./assistants/TrackerAssistant";

const REGISTRY = {
  huashen: { title: "化身助手", component: HuashenAssistant },
  zhengjing: { title: "整经助手", component: ZhengjingAssistant },
  baixi: { title: "水转百戏", component: BaixiAssistant },
  jingxie: { title: "精械对照", component: JingxieReference },
  mingyunqian: { title: "命运签", component: FortuneAssistant },
  jiedang: { title: "结党助手", component: JiedangAssistant },
  trackers: { title: "标记与蓄力", component: TrackerAssistant },
  fuhan: { title: "扶汉选将", component: FuhanAssistant },
  mouyi: { title: "谋弈", component: MouyiAssistant },
  conversion: { title: "转换技", component: ConversionAssistant },
  "alternating-choice": { title: "逐目标交替", component: AlternatingChoiceAssistant },
} as const;

export function SkillAssistant({
  hero,
  heroes,
  initialModuleId,
  onClose,
}: {
  hero: Hero;
  heroes: Hero[];
  initialModuleId?: string;
  onClose: () => void;
}) {
  const [activeId, setActiveId] = useState(initialModuleId ?? hero.assistantModules[0]);
  const [state, setState] = useState<unknown>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [resetNonce, setResetNonce] = useState(0);
  const entry = REGISTRY[activeId as keyof typeof REGISTRY];
  const storageKey = getAssistantStorageKey(activeId, hero.id);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setState(loadAssistantState(window.localStorage, storageKey, null));
      setConfirmReset(false);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [storageKey]);

  const update = (next: unknown) => {
    setState(next);
    saveAssistantState(window.localStorage, storageKey, next);
  };
  const reset = () => {
    clearAssistantState(window.localStorage, storageKey);
    setState(null);
    setConfirmReset(false);
    setResetNonce((value) => value + 1);
  };
  const Panel = entry?.component;

  return (
    <section
      aria-labelledby="assistant-title"
      className="assistant-inline"
      id="inline-skill-assistant"
      role="region"
    >
      <header className="assistant-header">
        <div><span>{hero.name} · 面杀技能模块</span><h2 id="assistant-title">{entry?.title ?? "辅助规则缺失"}</h2></div>
        <div className="assistant-header-actions">
          {confirmReset ? <><span>确定清空本模块？</span><button onClick={reset} type="button">确定</button><button onClick={() => setConfirmReset(false)} type="button">取消</button></> : <button onClick={() => setConfirmReset(true)} type="button">本局重置</button>}
          <button className="assistant-close" onClick={onClose} type="button">收起辅助</button>
        </div>
      </header>
      {hero.assistantModules.length > 1 && (
        <nav aria-label="辅助模块" className="assistant-tabs">
          {hero.assistantModules.map((id) => <button aria-pressed={activeId === id} key={id} onClick={() => { setState(null); setConfirmReset(false); setActiveId(id); }} type="button">{REGISTRY[id as keyof typeof REGISTRY]?.title ?? id}</button>)}
        </nav>
      )}
      <div className="assistant-panel">
        {Panel ? <Panel hero={hero} heroes={heroes} key={`${activeId}-${resetNonce}`} onChange={update} state={state} /> : <div className="assistant-missing"><h3>辅助规则缺失，该武将本局不可抽取</h3><p>请暂时从将池中移除此武将。</p></div>}
      </div>
    </section>
  );
}
