import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");

test("desktop hero detail gives the information column substantially more room", () => {
  assert.match(
    css,
    /\.hero-modal\s*\{[^}]*width:\s*min\(1120px,\s*100%\)[^}]*grid-template-columns:\s*minmax\(220px,\s*275px\)\s+minmax\(0,\s*1fr\)/s,
  );
  assert.match(
    css,
    /\.hero-modal\.assistant-expanded\s*\{[^}]*grid-template-columns:\s*minmax\(210px,\s*255px\)\s+minmax\(400px,\s*\.9fr\)\s+minmax\(380px,\s*1\.2fr\)/s,
  );
});

test("hero information typography remains readable while the phone card becomes full width", () => {
  assert.match(css, /\.skill-item h4\s*\{[^}]*font-size:\s*17px/s);
  assert.match(css, /\.skill-item p\s*\{[^}]*font-size:\s*14px[^}]*line-height:\s*1\.78/s);
  assert.match(
    css,
    /@media \(max-width:\s*620px\)[\s\S]*?\.hero-modal\s*\{[^}]*grid-template-columns:\s*1fr/s,
  );
  assert.match(
    css,
    /@media \(max-width:\s*620px\)[\s\S]*?\.hero-visual-column\s*\{[^}]*width:\s*min\(100%,\s*430px\)/s,
  );
});

test("hero art fits the complete source image without enlarged cropping", () => {
  const rule = css.match(/\.hero-art\s*\{([^}]*)\}/s)?.[1] ?? "";

  assert.match(rule, /inset:\s*0/);
  assert.match(rule, /width:\s*100%/);
  assert.match(rule, /height:\s*100%/);
  assert.match(rule, /object-fit:\s*contain/);
  assert.match(rule, /object-position:\s*center bottom/);
  assert.doesNotMatch(rule, /width:\s*(?:10[1-9]|1[1-9]\d|[2-9]\d\d)%/);
  assert.doesNotMatch(rule, /left:\s*-/);
  assert.doesNotMatch(rule, /object-fit:\s*cover/);
});
