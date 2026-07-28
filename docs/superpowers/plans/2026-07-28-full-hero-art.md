# Full Hero Art Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every hero card show the complete source illustration without enlarged edge cropping.

**Architecture:** Keep the existing `HeroCard` component and its data flow unchanged. Enforce the display contract in the shared `.hero-art` CSS rule, with a source-level regression test that protects both desktop and mobile card renderings.

**Tech Stack:** React 19, TypeScript, CSS, Node test runner, vinext

## Global Constraints

- Preserve the current narrow portrait and wide information layout.
- Preserve the original image aspect ratio.
- Prefer a complete illustration over edge-to-edge filling.
- Do not change hero data, skill data, vitality controls, armor controls, or assistant modules.

---

### Task 1: Complete hero illustration rendering

**Files:**
- Modify: `tests/detail-information-layout.test.mjs`
- Modify: `app/globals.css`

**Interfaces:**
- Consumes: Existing `.hero-art` image element rendered by `HeroCard`.
- Produces: A shared CSS contract that fits the complete source image inside every hero card.

- [ ] **Step 1: Write the failing test**

```js
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
```

- [ ] **Step 2: Run the focused test and verify RED**

Run: `pnpm exec node --test tests/detail-information-layout.test.mjs`

Expected: FAIL because the current rule uses `width: 112%`, `height: 91%`, and `left: -6%`.

- [ ] **Step 3: Implement the minimal complete-image rule**

```css
.hero-art {
  position: absolute;
  z-index: 2;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: center bottom;
  filter: drop-shadow(0 8px 9px rgba(0,0,0,.4));
}
```

- [ ] **Step 4: Run focused and full verification**

Run: `pnpm exec node --test tests/detail-information-layout.test.mjs`

Expected: 3 tests pass.

Run: `pnpm test`

Expected: all unit, build, and rendered HTML tests pass.

Run: `pnpm run lint`

Expected: ESLint exits successfully.

- [ ] **Step 5: Commit and publish**

```bash
git add app/globals.css tests/detail-information-layout.test.mjs docs/superpowers/specs/2026-07-28-full-hero-art-design.md docs/superpowers/plans/2026-07-28-full-hero-art.md
git commit -m "Show complete hero illustrations"
git push origin main
```

Package the validated commit, save a Sites version, deploy it publicly to the existing project, and wait for a successful deployment status.

