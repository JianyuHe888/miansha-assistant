"use client";

import { Fragment, useMemo, useState } from "react";
import type { HeroSkill } from "../lib/hero-types";
import { getSharedRule, tokenizeSharedRuleText } from "../lib/shared-rule-glossary.mjs";
import { tokenizeSkillReferences } from "../lib/skill-reference-rules.mjs";

type SkillReference = {
  name: string;
  description: string;
  heroId: string;
  heroName: string;
};

function escapePattern(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function SkillText({
  skill,
  skillIndex,
  skillReferenceIndex,
  visited = new Set<string>(),
}: {
  skill: HeroSkill;
  skillIndex: Map<string, HeroSkill>;
  skillReferenceIndex: Map<string, SkillReference>;
  visited?: Set<string>;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [openRuleId, setOpenRuleId] = useState<string | null>(null);
  const [openReferenceName, setOpenReferenceName] = useState<string | null>(null);
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
  const activeReference = openReferenceName
    ? skillReferenceIndex.get(openReferenceName)
    : null;

  const toggle = (child: HeroSkill) => {
    if (visited.has(child.id)) return;
    setOpenRuleId(null);
    setOpenReferenceName(null);
    setOpenId((current) => current === child.id ? null : child.id);
  };

  const toggleRule = (ruleId: string) => {
    setOpenId(null);
    setOpenReferenceName(null);
    setOpenRuleId((current) => current === ruleId ? null : ruleId);
  };

  const toggleReference = (reference: SkillReference) => {
    setOpenId(null);
    setOpenRuleId(null);
    setOpenReferenceName((current) => current === reference.name ? null : reference.name);
  };

  const renderSharedRules = (text: string, keyPrefix: string) =>
    tokenizeSharedRuleText(text).map((token, tokenIndex) => token.kind === "rule" ? (
      <button
        aria-expanded={openRuleId === token.ruleId}
        className="shared-rule-link"
        key={`${keyPrefix}-${token.ruleId}-${tokenIndex}`}
        onClick={() => toggleRule(token.ruleId)}
        type="button"
      >
        {token.text}
      </button>
    ) : <Fragment key={`${keyPrefix}-text-${tokenIndex}`}>{token.text}</Fragment>);

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
          ) : tokenizeSkillReferences(part, skillReferenceIndex).map(
            (token, tokenIndex) => token.kind === "skill" ? (
              <button
                aria-expanded={openReferenceName === token.reference.name}
                className="skill-reference-link"
                key={`${token.reference.heroId}-${token.reference.name}-${index}-${tokenIndex}`}
                onClick={() => toggleReference(token.reference)}
                type="button"
              >
                {token.text}
              </button>
            ) : (
              <Fragment key={`${index}-${tokenIndex}`}>
                {renderSharedRules(token.text, `${index}-${tokenIndex}`)}
              </Fragment>
            ),
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
            skillReferenceIndex={skillReferenceIndex}
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
      {activeReference && (
        <aside
          className="skill-reference-panel"
          aria-label={`相关技能${activeReference.name}`}
        >
          <div><span>相关技能</span><small>{activeReference.heroName} · 移动版现行描述</small></div>
          <h5>{activeReference.name}</h5>
          <p>{activeReference.description}</p>
        </aside>
      )}
    </>
  );
}
