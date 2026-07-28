import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import heroes from "../app/data/heroes.json" with { type: "json" };
import externalReferences from "../app/data/skill-references.json" with { type: "json" };

const rulesUrl = new URL("../app/lib/skill-reference-rules.mjs", import.meta.url);

async function loadRules() {
  const source = await readFile(rulesUrl, "utf8").catch(() => "");
  assert.ok(source, "skill-reference-rules.mjs should exist");
  return import(`${rulesUrl.href}?test=${Date.now()}`);
}

test("all thirteen 似故 quoted skills resolve to current definitions", async () => {
  const { buildSkillReferenceIndex, tokenizeSkillReferences } = await loadRules();
  const index = buildSkillReferenceIndex(heroes);
  const mogao = heroes.find((hero) => hero.name === "魔曹操");
  const sigu = mogao.skills.find((skill) => skill.name === "似故");
  const expected = [
    "智迟",
    "刚烈",
    "反馈",
    "遗计",
    "节命",
    "放逐",
    "矢北",
    "称象",
    "智愚",
    "鸡肋",
    "贲育",
    "筹策",
    "武魂",
  ];

  for (const name of expected) {
    assert.ok(index.get(name)?.description, `${name} should have a current definition`);
  }
  assert.deepEqual(
    tokenizeSkillReferences(sigu.description, index)
      .filter((token) => token.kind === "skill")
      .map((token) => token.reference.name),
    expected,
  );
  const externalNames = new Set(externalReferences.map((reference) => reference.name));
  assert.ok(externalNames.has("鸡肋"));
  assert.ok(externalNames.has("贲育"));
});

test("quoted marks and card names stay plain unless they are indexed skill names", async () => {
  const { buildSkillReferenceIndex, tokenizeSkillReferences } = await loadRules();
  const index = buildSkillReferenceIndex(heroes);
  const tokens = tokenizeSkillReferences("获得“霆”标记，视为使用【杀】。", index);
  assert.ok(tokens.every((token) => token.kind === "text"));
  const indexedMark = tokenizeSkillReferences("获得“烈”标记。", index);
  assert.ok(indexedMark.every((token) => token.kind === "text"));
});

test("referenced skills expand inside the current skill card", async () => {
  const [detail, skillText, css] = await Promise.all([
    readFile(new URL("../app/components/HeroDetail.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/components/SkillText.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);

  assert.match(detail, /buildSkillReferenceIndex/);
  assert.match(detail, /skillReferenceIndex=\{skillReferenceIndex\}/);
  assert.match(skillText, /tokenizeSkillReferences/);
  assert.match(skillText, /className="skill-reference-link"/);
  assert.match(skillText, /className="skill-reference-panel"/);
  assert.match(skillText, /相关技能/);
  assert.match(css, /\.skill-reference-panel/);
  assert.doesNotMatch(skillText, /role="dialog"|aria-modal/);
});
