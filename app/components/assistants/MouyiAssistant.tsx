"use client";

import { useState } from "react";
import {
  chooseMouyi,
  confirmMouyiHandoff,
  createMouyiState,
  getMouyiConfig,
  getMouyiOpponentOptions,
} from "../../lib/tabletop-assistant-rules.mjs";
import type { AssistantPanelProps } from "./types";

type MouyiState = ReturnType<typeof createMouyiState>;

export function MouyiAssistant({ hero }: AssistantPanelProps) {
  const [flow, setFlow] = useState<MouyiState>(() => createMouyiState(hero.name));
  const config = getMouyiConfig(hero.name);
  if (!config) return <p className="assistant-error">该武将缺少谋弈配置。</p>;

  if (flow.phase === "owner") {
    return (
      <div className="private-choice mouyi-private">
        <span>仅 {config.ownerLabel} 玩家查看</span>
        <h3>选择你的谋略</h3>
        <p>选完后页面会遮住答案，再把手机递给 {config.opponentLabel}。</p>
        <div>
          {config.ownerOptions.map((option: { title: string; effect: string }, index: number) => (
            <button key={option.title} onClick={() => setFlow(chooseMouyi(flow, "owner", index))} type="button">
              <b>{option.title}</b><small>{option.effect || "按双方选择组合结算"}</small>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (flow.phase === "handoff") {
    return (
      <div className="assistant-empty mouyi-handoff">
        <span className="assistant-emblem">递</span>
        <h3>发动者已经选好</h3>
        <p>答案已遮挡。现在请把手机递给 {config.opponentLabel}，由对方点击下方按钮后选择。</p>
        <button onClick={() => setFlow(confirmMouyiHandoff(flow))} type="button">我已接过手机</button>
      </div>
    );
  }

  if (flow.phase === "opponent") {
    const opponentOptions = getMouyiOpponentOptions(hero.name);
    return (
      <div className="private-choice mouyi-private">
        <span>仅 {config.opponentLabel} 查看</span>
        <h3>{config.opponentOptions ? "选择你的应对" : "猜测对方选择的谋略"}</h3>
        <p>点击后立即同时翻开双方选择。</p>
        <div>
          {opponentOptions.map((option: { title: string; effect: string }, index: number) => (
            <button key={option.title} onClick={() => setFlow(chooseMouyi(flow, "opponent", index))} type="button">
              <b>{option.title}</b><small>{option.effect}</small>
            </button>
          ))}
        </div>
      </div>
    );
  }

  const opponentOptions = getMouyiOpponentOptions(hero.name);
  return (
    <div className="assistant-result mouyi-result">
      <span>谋弈揭晓</span>
      <div className="mouyi-reveal">
        <article><small>{config.ownerLabel}</small><strong>{config.ownerOptions[flow.ownerChoice].title}</strong></article>
        <i>对</i>
        <article><small>{config.opponentLabel}</small><strong>{opponentOptions[flow.opponentChoice].title}</strong></article>
      </div>
      <h3>{flow.success === null ? "按组合结算" : flow.success ? "谋弈成功" : "谋略被识破"}</h3>
      <p>{flow.effect}</p>
      <button onClick={() => setFlow(createMouyiState(hero.name))} type="button">开始下一次谋弈</button>
    </div>
  );
}
