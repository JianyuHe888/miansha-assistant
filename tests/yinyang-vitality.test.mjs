import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = (path) => readFile(new URL(path, import.meta.url), "utf8").catch(() => "");

test("yin-yang health renders current and lost health with an accessible numeric label", async () => {
  const component = await source("../app/components/YinYangHealth.tsx");

  assert.ok(component, "YinYangHealth component should exist");
  assert.match(component, /☯/);
  assert.match(component, /current/);
  assert.match(component, /max/);
  assert.match(component, /is-lost/);
  assert.match(component, /aria-label/);
});

test("hero card, detail, and live vitality tracker share the yin-yang display", async () => {
  const [card, detail, tracker, css] = await Promise.all([
    source("../app/components/HeroCard.tsx"),
    source("../app/components/HeroDetail.tsx"),
    source("../app/components/VitalityTracker.tsx"),
    source("../app/globals.css"),
  ]);

  assert.match(card, /<YinYangHealth/);
  assert.doesNotMatch(card, />◆</);
  assert.match(detail, /<YinYangHealth/);
  assert.match(tracker, /<YinYangHealth/);
  assert.match(css, /\.yin-yang-health/);
  assert.match(css, /\.yin-yang-fish\.is-lost/);
});

test("armor uses a separate shield graphic everywhere vitality is shown", async () => {
  const [component, card, detail, tracker, css] = await Promise.all([
    source("../app/components/ArmorDisplay.tsx"),
    source("../app/components/HeroCard.tsx"),
    source("../app/components/HeroDetail.tsx"),
    source("../app/components/VitalityTracker.tsx"),
    source("../app/globals.css"),
  ]);

  assert.ok(component, "ArmorDisplay component should exist");
  assert.match(component, /armor-shield/);
  assert.match(component, /aria-label/);
  assert.match(card, /<ArmorDisplay/);
  assert.match(detail, /<ArmorDisplay/);
  assert.match(tracker, /<ArmorDisplay/);
  assert.match(css, /\.armor-shield/);
  assert.match(css, /clip-path:\s*polygon/);
});
