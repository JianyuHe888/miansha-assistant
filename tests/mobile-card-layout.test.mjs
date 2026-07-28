import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const detail = await readFile(
  new URL("../app/components/HeroDetail.tsx", import.meta.url),
  "utf8",
);
const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");

test("detail renders one complete card and does not repeat printed identity fields", () => {
  assert.match(detail, /className="hero-card-section hero-visual-column"/);
  assert.match(detail, /className="hero-skill-section modal-copy"/);
  assert.match(
    detail,
    /className="hero-card-section hero-visual-column"[\s\S]*?<HeroCard[\s\S]*?<VitalityTracker/s,
  );
  assert.doesNotMatch(detail, /modal-name-row|detail-badges|<dl>|CHARACTER CARD/);
  assert.doesNotMatch(
    detail,
    /hero\.sourcePack|hero\.rarity|hero\.faction|hero\.pack|POOL_LABELS|YinYangHealth|ArmorDisplay/,
  );
});

test("phone detail is one vertically scrolling document with the card first", () => {
  assert.match(
    css,
    /@media \(max-width:\s*620px\)[\s\S]*?\.hero-modal\s*\{[^}]*grid-template-columns:\s*1fr[^}]*overflow-y:\s*auto/s,
  );
  assert.match(
    css,
    /@media \(max-width:\s*620px\)[\s\S]*?\.hero-visual-column\s*\{[^}]*position:\s*static[^}]*overflow:\s*visible/s,
  );
  assert.match(
    css,
    /@media \(max-width:\s*620px\)[\s\S]*?\.modal-copy\s*\{[^}]*max-height:\s*none[^}]*overflow:\s*visible/s,
  );
});
