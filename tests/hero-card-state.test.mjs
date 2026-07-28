import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import * as rules from "../app/lib/tabletop-assistant-rules.mjs";

const source = (path) => readFile(new URL(path, import.meta.url), "utf8").catch(() => "");

test("main-card counters include self suggestions and custom marks but exclude other seats", () => {
  assert.equal(typeof rules.getHeroCardCounters, "function");

  const hero = {
    skills: [
      {
        name: "炎魂",
        description: "游戏开始时，你获得2枚“燃”标记。",
      },
    ],
  };
  const state = {
    version: 1,
    seats: ["自己", "二号位"],
    entries: {
      "自己::燃": 3,
      "二号位::燃": 9,
      "自己::自定义": 2,
    },
  };

  assert.deepEqual(rules.getHeroCardCounters(hero, state), [
    { name: "燃", count: 3 },
    { name: "自定义", count: 2 },
  ]);
  assert.deepEqual(rules.getHeroCardCounters(hero, null), [
    { name: "燃", count: 2 },
  ]);
});

test("phone yin-yang symbols force text presentation so live colors can change", async () => {
  const [component, css] = await Promise.all([
    source("../app/components/YinYangHealth.tsx"),
    source("../app/globals.css"),
  ]);

  assert.match(component, /\u262f\uFE0E/u);
  assert.match(css, /\.yin-yang-fish\s*\{[^}]*font-variant-emoji:\s*text/s);
});

test("detail hero card receives live vitality and counter state", async () => {
  const [card, detail, tracker, assistant, marks] = await Promise.all([
    source("../app/components/HeroCard.tsx"),
    source("../app/components/HeroDetail.tsx"),
    source("../app/components/VitalityTracker.tsx"),
    source("../app/components/SkillAssistant.tsx"),
    source("../app/components/HeroCardMarks.tsx"),
  ]);

  assert.match(card, /vitalityState/);
  assert.match(card, /counterState/);
  assert.match(card, /<HeroCardMarks/);
  assert.match(detail, /onStateChange=\{setVitalityState\}/);
  assert.match(detail, /onModuleStateChange=/);
  assert.match(tracker, /onStateChange/);
  assert.match(assistant, /onModuleStateChange/);
  assert.match(marks, /getHeroCardCounters/);
});

test("detail card toggles a persistent dark flip state on double click", async () => {
  const [card, detail, css] = await Promise.all([
    source("../app/components/HeroCard.tsx"),
    source("../app/components/HeroDetail.tsx"),
    source("../app/globals.css"),
  ]);

  assert.match(card, /onDoubleClick/);
  assert.match(card, /is-flipped/);
  assert.match(card, /flip-state/);
  assert.match(card, />翻面</);
  assert.match(detail, /getAssistantStorageKey\("card-face"/);
  assert.match(detail, /onFlip=/);
  assert.match(css, /\.hero-card\.is-flipped::after/);
  assert.match(css, /\.flip-state\s*\{/);
  assert.match(css, /touch-action:\s*manipulation/);
});

