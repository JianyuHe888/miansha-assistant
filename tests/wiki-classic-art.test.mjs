import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import heroes from "../app/data/heroes.json" with { type: "json" };

test("SP关羽 uses the mobile Wiki classic full artwork", () => {
  const hero = heroes.find((entry) => entry.name === "SP关羽");
  assert.ok(hero, "SP关羽 should be in the identity pool");
  assert.match(hero.image, /^https:\/\/patchwiki\.biligame\.com\/images\/msgs\//);
  assert.doesNotMatch(hero.image, /\/thumb\//);
});

test("the generated pool primarily uses exact Wiki classic artwork", () => {
  const classicArtCount = heroes.filter((hero) =>
    /^https:\/\/patchwiki\.biligame\.com\/images\/msgs\//.test(hero.image),
  ).length;
  assert.ok(
    classicArtCount >= 500,
    `expected at least 500 Wiki classic artworks, found ${classicArtCount}`,
  );
});

test("updater resolves Wiki art for the complete Wiki pool and prefers it", async () => {
  const source = await readFile(
    new URL("../scripts/update-mobile-heroes.mjs", import.meta.url),
    "utf8",
  );
  assert.match(source, /readWikiImages\(\s*wikiHeroes/);
  assert.match(
    source,
    /image:\s*wikiImages\.get\(wikiHero\.wikiName\)\s*\?\?\s*official\?\.image/,
  );
  assert.doesNotMatch(source, /readWikiImages\(\s*unmatchedWikiHeroes/);
});
