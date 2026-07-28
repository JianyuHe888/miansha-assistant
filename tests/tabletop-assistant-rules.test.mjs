import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  addCounter,
  adjustArmor,
  adjustMaxHp,
  applyDamage,
  calculateFuhanMaxHp,
  chooseMouyi,
  confirmMouyiHandoff,
  createCounterState,
  createHeroCounterState,
  createMouyiState,
  createVitalityState,
  drawFuhanCandidates,
  extractConversionSkills,
  getSuggestedCounters,
  getTabletopAssistantModules,
  loseHp,
  recordSimaFuChoice,
  recoverHp,
  setCounter,
  toggleConversion,
} from "../app/lib/tabletop-assistant-rules.mjs";
import { createSequenceRng } from "../app/lib/assistant-rules.mjs";

const skill = (name, description) => ({ name, description, kind: "base" });
const hero = (name, skills, extra = {}) => ({
  id: name,
  name,
  faction: "群",
  faceToFace: "native",
  skills,
  ...extra,
});

test("detects tabletop-only modules from current skill text", () => {
  assert.deepEqual(
    getTabletopAssistantModules(
      hero("兀突骨", [skill("燃殇", "你获得1枚“燃”标记。")]),
    ),
    ["trackers"],
  );
  assert.deepEqual(
    getTabletopAssistantModules(
      hero("赵襄", [
        skill("芳魂", "你获得1个“梅影”标记。"),
        skill("扶汉", "随机观看五张蜀势力武将牌并选择其中一张替换之。"),
      ]),
    ),
    ["trackers", "fuhan"],
  );
  assert.deepEqual(
    getTabletopAssistantModules(
      hero("谋徐晃", [skill("断粮", "你与其进行一次“谋弈”。")]),
    ),
    ["mouyi"],
  );
  assert.deepEqual(
    getTabletopAssistantModules(
      hero("严颜", [skill("拒战", "转换技，阳：……；阴：……")]),
    ),
    ["conversion"],
  );
  assert.deepEqual(
    getTabletopAssistantModules(hero("司马孚", [skill("蹇襄", "不能与上次对其选择的选项相同。")])),
    ["alternating-choice"],
  );
  assert.deepEqual(
    getTabletopAssistantModules(hero("曹髦", [skill("潜龙", "游戏开始时，你获得20点“道心”值。")])),
    ["trackers"],
  );
  assert.deepEqual(
    getTabletopAssistantModules(hero("谋华雄", [skill("扬威", "游戏开始时，你获得2点护甲。")])),
    [],
  );
});

test("extracts named marks plus charge and armor counters without duplicates", () => {
  const counters = getSuggestedCounters(
    hero("测试将", [
      skill("甲", "获得1枚“燃”标记，然后移去一个“燃”标记。"),
      skill("乙", "蓄力技（2/4），你消耗1点蓄力点。"),
      skill("丙", "你获得2点护甲。"),
      skill("丁", "游戏开始时，你获得20点“道心”值（至多99点“道心”值）。"),
    ]),
  );
  assert.deepEqual(counters.map((counter) => counter.name), ["燃", "蓄力点", "护甲", "道心"]);
  assert.deepEqual(counters[0].skillNames, ["甲"]);
});

test("counter board tracks each seat independently and never goes below zero", () => {
  let state = createCounterState(["自己", "二号位"]);
  state = addCounter(state, "燃", "自己", 1);
  state = addCounter(state, "燃", "二号位", 2);
  state = addCounter(state, "燃", "自己", -5);
  assert.equal(state.entries["自己::燃"], 0);
  assert.equal(state.entries["二号位::燃"], 2);
  state = setCounter(state, "护甲", "自己", 4);
  assert.equal(state.entries["自己::护甲"], 4);
});

test("counter board initializes printed starting resources", () => {
  const state = createHeroCounterState(
    hero("资源将", [
      skill("甲", "游戏开始时，你获得2枚“暴怒”标记。"),
      skill("乙", "游戏开始时，你获得20点“道心”值（你至多拥有99点“道心”值）。"),
      skill("丙", "蓄力技（2/4），你可以消耗蓄力点。"),
    ]),
  );
  assert.equal(state.entries["自己::暴怒"], 2);
  assert.equal(state.entries["自己::道心"], 20);
  assert.equal(state.entries["自己::蓄力点"], 2);
  const suggestions = getSuggestedCounters(
    hero("资源将", [skill("乙", "游戏开始时，你获得20点“道心”值（你至多拥有99点“道心”值）。")]),
  );
  assert.equal(suggestions[0].max, 99);
});

test("Fuhan draws five unique legal Shu identity heroes", () => {
  const heroes = [
    hero("赵襄", [], { faction: "蜀" }),
    ...Array.from({ length: 7 }, (_, index) =>
      hero(`蜀将${index}`, [], { faction: "蜀", faceToFace: index === 6 ? "excluded" : "native" }),
    ),
    hero("魏将", [], { faction: "魏" }),
  ];
  const result = drawFuhanCandidates(
    heroes,
    "赵襄",
    createSequenceRng([0, 0, 0, 0, 0]),
  );
  assert.equal(result.length, 5);
  assert.equal(new Set(result.map((candidate) => candidate.id)).size, 5);
  assert.ok(result.every((candidate) => candidate.faction === "蜀"));
  assert.ok(result.every((candidate) => candidate.name !== "赵襄"));
  assert.ok(result.every((candidate) => candidate.faceToFace !== "excluded"));
  assert.equal(calculateFuhanMaxHp(7, 5), 5);
  assert.equal(calculateFuhanMaxHp(2, 8), 2);
});

test("Mouyi hides the first choice until handoff and succeeds on different choices", () => {
  let state = createMouyiState("谋徐晃");
  assert.equal(state.phase, "owner");
  state = chooseMouyi(state, "owner", 0);
  assert.equal(state.phase, "handoff");
  assert.equal(state.ownerChoice, 0);
  state = confirmMouyiHandoff(state);
  assert.equal(state.phase, "opponent");
  state = chooseMouyi(state, "opponent", 1);
  assert.equal(state.phase, "result");
  assert.equal(state.success, true);
  assert.equal(state.effectTitle, "围城断粮");

  let failed = chooseMouyi(
    confirmMouyiHandoff(chooseMouyi(createMouyiState("韩玄"), "owner", 1)),
    "opponent",
    1,
  );
  assert.equal(failed.success, false);
  assert.equal(failed.effectTitle, "弃履狂奔");
});

test("Mouyi shows tactic effects to the opponent before they choose", async () => {
  const rules = await import("../app/lib/tabletop-assistant-rules.mjs");
  assert.equal(typeof rules.getMouyiOpponentOptions, "function");
  for (const heroName of ["谋徐晃", "谋马超", "韩玄", "界张嶷"]) {
    const options = rules.getMouyiOpponentOptions(heroName);
    assert.equal(options.length, 2);
    assert.ok(options.every((option) => option.effect));
  }
  assert.deepEqual(rules.getMouyiOpponentOptions("谋马超"), [
    {
      title: "识破【直取敌营】",
      effect: "预防对方获得你一张牌。",
    },
    {
      title: "识破【扰阵疲敌】",
      effect: "预防对方摸两张牌。",
    },
  ]);
});

test("Mouyi opponent buttons render their effect text", async () => {
  const source = await readFile(
    new URL("../app/components/assistants/MouyiAssistant.tsx", import.meta.url),
    "utf8",
  );
  assert.ok(source.includes("<b>{option.title}</b><small>{option.effect}</small>"));
});

test("conversion parser exposes both sides and toggles after use", () => {
  const skills = extractConversionSkills(
    hero("严颜", [
      skill("拒战", "转换技，\n\n阳：阳面效果；\n\n阴：阴面效果。"),
    ]),
  );
  assert.deepEqual(skills, [
    { id: "拒战", name: "拒战", yang: "阳面效果；", yin: "阴面效果。" },
  ]);
  assert.equal(toggleConversion("yang"), "yin");
  assert.equal(toggleConversion("yin"), "yang");
});

test("Sima Fu remembers the last choice separately for every target", () => {
  let state = {};
  state = recordSimaFuChoice(state, "二号位", 1);
  state = recordSimaFuChoice(state, "三号位", 2);
  assert.deepEqual(state, { 二号位: 1, 三号位: 2 });
  assert.throws(() => recordSimaFuChoice(state, "二号位", 1));
  state = recordSimaFuChoice(state, "二号位", 2);
  assert.equal(state.二号位, 2);
});

test("damage consumes armor first while losing HP bypasses armor", () => {
  let state = createVitalityState({ hp: 4, armor: 2 });
  state = applyDamage(state, 3);
  assert.deepEqual(
    { hp: state.hp, armor: state.armor, event: state.lastEvent },
    {
      hp: 3,
      armor: 0,
      event: { type: "damage", amount: 3, armorLost: 2, hpLost: 1 },
    },
  );
  state = adjustArmor(state, 2);
  state = loseHp(state, 2);
  assert.equal(state.hp, 1);
  assert.equal(state.armor, 2);
  assert.deepEqual(state.lastEvent, { type: "lose-hp", amount: 2, hpLost: 2 });
});

test("vitality recovery, max HP and armor obey current mobile limits", () => {
  let state = createVitalityState({ hp: 3, maxHp: 4 });
  state = recoverHp(state, 3);
  assert.equal(state.hp, 4);
  state = adjustMaxHp(state, -2);
  assert.deepEqual({ hp: state.hp, maxHp: state.maxHp }, { hp: 2, maxHp: 2 });
  state = adjustMaxHp(state, 1);
  state = adjustArmor(state, 99);
  assert.deepEqual(
    { hp: state.hp, maxHp: state.maxHp, armor: state.armor },
    { hp: 2, maxHp: 3, armor: 5 },
  );
});
