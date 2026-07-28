"use client";

import { Fragment, useMemo, useState } from "react";
import type { HeroSkill } from "../lib/hero-types";
import { getSharedRule, tokenizeSharedRuleText } from "../lib/shared-rule-glossary.mjs";

function escapePattern(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function SkillText({
  skill,
  skillIndex,
  visited = new Set<string>(),
}: {
  skill: HeroSkill;
  skillIndex: Map<string, HeroSkill>;
  visited?: Set<string>;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [openRuleId, setOpenRuleId] = useState<string | null>(null);
  const children = useMemo(
    () => skill.grants.map((id) => skillIndex.get(id)).filter((item): item is HeroSkill => Boolean(item)),
    [skill.grants, skillIndex],
  );
  const byName = useMemo(() => new Map(children.map((child) => [child.name, child])), [children]);
  const pattern = useMemo(
    () => children.length
      ? new RegExp(`(${children.map((child) => escapePattern(child.name)).sort((a, b) => b.length - a.length).join("|")})`, "g")
      : null,
    [children],
  );
  const parts = pattern ? skill.description.split(pattern) : [skill.description];
  const mentioned = new Set(parts.filter((part) => byName.has(part)));
  const active = openId ? skillIndex.get(openId) : null;
  const activeRule = openRuleId ? getSharedRule(openRuleId) : null;

  const toggle = (child: HeroSkill) => {
    if (visited.has(child.id)) return;
    setOpenRuleId(null);
    setOpenId((current) => current === child.id ? null : child.id);
  };

  const toggleRule = (ruleId: string) => {
    setOpenId(null);
    setOpenRuleId((current) => current === ruleId ? null : ruleId);
  };

  return (
    <>
      <p>
        {parts.map((part, index) => {
          const child = byName.get(part);
          return child ? (
            <button
              aria-expanded={openId === child.id}
              className="granted-skill-link"
              key={`${child.id}-${index}`}
              onClick={() => toggle(child)}
              type="button"
            >
              {part}
            </button>
          ) : (
            <Fragment key={index}>
              {tokenizeSharedRuleText(part).map((token, tokenIndex) => token.kind === "rule" ? (
                <button
                  aria-expanded={openRuleId === token.ruleId}
                  className="shared-rule-link"
                  key={`${token.ruleId}-${tokenIndex}`}
                  onClick={() => toggleRule(token.ruleId)}
                  type="button"
                >
                  {token.text}
                </button>
              ) : <Fragment key={tokenIndex}>{token.text}</Fragment>)}
            </Fragment>
          );
        })}
      </p>
      {children.some((child) => !mentioned.has(child.name)) && (
        <div className="granted-skill-shortcuts">
          <span>点击查看：</span>
          {children.filter((child) => !mentioned.has(child.name)).map((child) => (
            <button
              aria-expanded={openId === child.id}
              key={child.id}
              onClick={() => toggle(child)}
              type="button"
            >
              {child.name}
            </button>
          ))}
        </div>
      )}
      {active && !visited.has(active.id) && (
        <aside className="granted-skill-panel" aria-label={`附加技能${active.name}`}>
          <div><span>附加技能</span><small>由「{skill.name}」获得</small></div>
          <h5>{active.name}</h5>
          <SkillText
            skill={active}
            skillIndex={skillIndex}
            visited={new Set([...visited, skill.id, active.id])}
          />
        </aside>
      )}
      {activeRule && (
        <aside className="shared-rule-panel" aria-label={`规则补充${activeRule.title}`}>
          <div><span>规则补充</span><small>移动版共享机制</small></div>
          <h5>{activeRule.title}</h5>
          <p>{activeRule.summary}</p>
          {activeRule.items.length > 0 && (
            <ul>
              {activeRule.items.map((item) => (
                <li key={item.label}><b>{item.label}</b><span>{item.description}</span></li>
              ))}
            </ul>
          )}
        </aside>
      )}
    </>
  );
}
