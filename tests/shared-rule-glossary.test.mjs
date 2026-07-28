import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import heroes from "../app/data/heroes.json" with { type: "json" };

const glossaryUrl = new URL("../app/lib/shared-rule-glossary.mjs", import.meta.url);

async function loadGlossary() {
  const source = await readFile(glossaryUrl, "utf8").catch(() => "");
  assert.ok(source, "shared-rule-glossary.mjs should exist");
  return import(`${glossaryUrl.href}?test=${Date.now()}`);
}

test("shared rule glossary expands the complete 协力 and 整肃 rules", async () => {
  const { SHARED_RULE_GLOSSARY } = await loadGlossary();
  const byId = new Map(SHARED_RULE_GLOSSARY.map((rule) => [rule.id, rule]));

  assert.deepEqual(
    byId.get("collaboration").items.map((item) => item.label),
    ["同仇", "并进", "疏财", "勠力"],
  );
  assert.match(byId.get("collaboration").items[0].description, /伤害值之和不小于4/);
  assert.match(byId.get("collaboration").items[1].description, /总计摸过至少8张牌/);
  assert.match(byId.get("discipline").summary, /摸两张牌.*回复1点体力/);
  assert.deepEqual(
    byId.get("discipline").items.map((item) => item.label),
    ["擂进", "变阵", "鸣止"],
  );
});

test("all audited shared mechanics used by identity heroes tokenize as clickable rules", async () => {
  const { tokenizeSharedRuleText } = await loadGlossary();
  const auditedTerms = [
    "协力",
    "整肃",
    "仁区",
    "智囊",
    "谋弈",
    "护甲",
    "蓄力技",
    "持恒技",
    "追思",
    "议事",
    "乘势",
    "明置牌",
    "背水",
    "主公技",
    "锁定技",
    "限定技",
    "觉醒技",
    "转换技",
    "使命技",
    "势力技",
    "昂扬技",
    "激昂",
    "结党",
    "拼点",
    "翻面",
    "重铸",
    "横置",
    "废除",
    "复原武将牌",
  ];

  let occurrences = 0;
  for (const hero of heroes) {
    for (const skill of hero.skills) {
      for (const term of auditedTerms) {
        if (!skill.description.includes(term)) continue;
        occurrences += 1;
        const tokens = tokenizeSharedRuleText(skill.description);
        assert.ok(
          tokens.some((token) => token.kind === "rule" && token.text.includes(term)),
          `${hero.name}/${skill.name} should expand ${term}`,
        );
      }
    }
  }

  assert.ok(occurrences > 400, "the audit should cover the full hero pool, not a few examples");
});

test("昂扬技 explains its 激昂 reset condition", async () => {
  const { SHARED_RULE_GLOSSARY, tokenizeSharedRuleText } = await loadGlossary();
  const rule = SHARED_RULE_GLOSSARY.find((item) => item.id === "rousing-skill");

  assert.deepEqual(rule.terms, ["昂扬技", "激昂"]);
  assert.match(rule.summary, /可刷新的限定技/);
  assert.match(rule.summary, /发动后失效/);
  assert.match(rule.summary, /重置.*再次发动/);

  const tokens = tokenizeSharedRuleText("昂扬技。激昂：执行过两个选项。");
  assert.equal(tokens.filter((token) => token.kind === "rule").length, 2);
  assert.ok(
    tokens
      .filter((token) => token.kind === "rule")
      .every((token) => token.ruleId === "rousing-skill"),
  );
});

test("shared rules open inside the existing skill card", async () => {
  const source = await readFile(new URL("../app/components/SkillText.tsx", import.meta.url), "utf8");
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");

  assert.match(source, /tokenizeSharedRuleText/);
  assert.match(source, /className="shared-rule-link"/);
  assert.match(source, /className="shared-rule-panel"/);
  assert.match(source, /规则补充/);
  assert.match(css, /\.shared-rule-panel/);
  assert.doesNotMatch(source, /role="dialog"|aria-modal/);
});
