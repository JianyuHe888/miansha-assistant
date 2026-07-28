import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("skill assistants stay inside the hero detail instead of opening another dialog", async () => {
  const [page, detail, assistant] = await Promise.all([
    source("../app/page.tsx"),
    source("../app/components/HeroDetail.tsx"),
    source("../app/components/SkillAssistant.tsx"),
  ]);

  assert.doesNotMatch(page, /assistantHero|setAssistantHero/);
  assert.match(detail, /<SkillAssistant[\s\S]*?hero=\{hero\}[\s\S]*?heroes=\{heroes\}/);
  assert.match(detail, /assistantOpen \? " assistant-expanded" : ""/);
  assert.match(assistant, /className="assistant-inline"/);
  assert.doesNotMatch(assistant, /assistant-backdrop|assistant-drawer|aria-modal="true"|role="dialog"/);
});

test("expanded assistants sit to the right on wide screens and below on narrow screens", async () => {
  const css = await source("../app/globals.css");

  assert.match(
    css,
    /\.hero-modal\.assistant-expanded\s*\{[^}]*grid-template-columns:\s*minmax\([^;]+;\s*[^}]*\}/s,
  );
  assert.match(
    css,
    /@media \(max-width: 900px\)[\s\S]*?\.hero-modal\.assistant-expanded\s*\{[^}]*grid-template-columns:\s*minmax\([^}]+\}[\s\S]*?\.hero-modal\.assistant-expanded \.assistant-inline\s*\{[^}]*grid-column:\s*1\s*\/\s*-1/s,
  );
});
