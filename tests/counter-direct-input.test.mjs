import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("tracker exposes a direct non-negative numeric value editor", async () => {
  const source = await readFile(
    new URL("../app/components/assistants/TrackerAssistant.tsx", import.meta.url),
    "utf8",
  );
  assert.match(source, /setCounter/);
  assert.match(source, /type="number"/);
  assert.match(source, /min=\{0\}/);
  assert.match(source, /className="counter-value-input"/);
  assert.match(source, /Number\(event\.target\.value\)/);
});

test("counter input has a readable touch target without hiding spin controls globally", async () => {
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(
    css,
    /\.counter-value-input\s*\{[^}]*width:\s*64px[^}]*height:\s*36px[^}]*text-align:\s*center/s,
  );
  assert.doesNotMatch(css, /\.counter-value-input::?-webkit-inner-spin-button[^}]*display:\s*none/s);
});
