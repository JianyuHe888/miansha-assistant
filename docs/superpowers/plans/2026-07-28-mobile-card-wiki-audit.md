# Mobile Hero Card and Wiki Audit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a phone-first, vertically scrolling hero detail whose only repeated identity information lives on the hero card, while correcting classic artwork, editable counters, referenced-skill explanations, and special mechanic definitions.

**Architecture:** Keep runtime data static in `app/data/heroes.json`, but make the updater prefer exact mobile Wiki classic-art files. Keep UI state inside the existing hero detail and introduce one pure skill-reference index shared by `HeroDetail` and `SkillText`; extend the existing glossary and counter reducer instead of creating parallel state systems.

**Tech Stack:** React 19, TypeScript, CSS, Node.js ESM, `node:test`, Vinext, mobile Wiki API.

## Global Constraints

- `HeroCard` plus `VitalityTracker` is the complete and only hero card.
- The section below the card must not repeat name, faction, HP, pack, rarity, source pack, or pool.
- All extra explanations and assistant controls expand inline; no new modal or route.
- Artwork and skill text use the current mobile edition as the source of truth.
- Counter values are integers greater than or equal to zero.
- The production target is project `appgprj_6a6845a3fea48191bf03946ff90f9f7b`.

---

### Task 1: Lock the phone layout and metadata boundary with tests

**Files:**
- Create: `tests/mobile-card-layout.test.mjs`
- Modify: `tests/detail-information-layout.test.mjs`
- Modify: `app/components/HeroDetail.tsx`
- Modify: `app/globals.css`
- Modify: `package.json`

**Interfaces:**
- Consumes: existing `HeroCard`, `VitalityTracker`, `SkillAssistant`, and `SkillText`.
- Produces: `.hero-card-section` as the first detail section and `.hero-skill-section` as the scroll-following section.

- [ ] **Step 1: Write the failing structural test**

```js
test("detail renders one card and does not repeat printed identity fields", async () => {
  const source = await readFile(new URL("../app/components/HeroDetail.tsx", import.meta.url), "utf8");
  assert.match(source, /className="hero-card-section"/);
  assert.match(source, /className="hero-skill-section"/);
  assert.doesNotMatch(source, /modal-name-row|detail-badges|<dl>|hero\.sourcePack|hero\.rarity|hero\.pack/);
});

test("phone detail is a single vertically scrolling document", () => {
  assert.match(css, /@media \(max-width:\s*620px\)[\s\S]*?\.hero-modal\s*\{[^}]*grid-template-columns:\s*1fr[^}]*overflow-y:\s*auto/s);
  assert.match(css, /@media \(max-width:\s*620px\)[\s\S]*?\.hero-visual-column\s*\{[^}]*position:\s*static/s);
});
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run: `pnpm exec node --test tests/mobile-card-layout.test.mjs tests/detail-information-layout.test.mjs`

Expected: FAIL because the phone layout still uses `108px 1fr` and the duplicate metadata JSX is present.

- [ ] **Step 3: Remove duplicate JSX and add stable section labels**

```tsx
<div className="hero-card-section hero-visual-column">
  <HeroCard ... />
  <VitalityTracker hero={hero} onStateChange={setVitalityState} />
</div>
<div className="hero-skill-section modal-copy">
  {hero.faceToFace === "excluded" && hero.excludedReason && (
    <p className="excluded-reason">{hero.excludedReason}</p>
  )}
  <section className="modal-skills" aria-label="武将技能">...</section>
  <div className="modal-links">...</div>
</div>
```

- [ ] **Step 4: Make the phone modal a vertical document**

```css
@media (max-width: 620px) {
  .modal-backdrop { padding: 0; place-items: stretch; overflow-y: auto; }
  .hero-modal { width: 100%; min-height: 100dvh; max-height: none; grid-template-columns: 1fr; gap: 0; padding: 44px 10px max(24px, env(safe-area-inset-bottom)); overflow-y: auto; align-items: start; }
  .hero-modal.assistant-expanded { grid-template-columns: 1fr; }
  .hero-visual-column { width: min(100%, 430px); max-height: none; margin-inline: auto; position: static; overflow: visible; }
  .modal-copy { width: min(100%, 680px); max-height: none; margin: 28px auto 0; padding: 0; overflow: visible; }
}
```

- [ ] **Step 5: Run the focused tests**

Run: `pnpm exec node --test tests/mobile-card-layout.test.mjs tests/detail-information-layout.test.mjs tests/inline-assistant.test.mjs`

Expected: all tests PASS.

### Task 2: Prefer exact mobile Wiki classic artwork

**Files:**
- Create: `tests/wiki-classic-art.test.mjs`
- Modify: `scripts/update-mobile-heroes.mjs`
- Modify: `app/data/heroes.json`
- Modify: `package.json`

**Interfaces:**
- Consumes: `readWikiHeroes()`, `readWikiImages(wikiHeroes)`, official hero lookup.
- Produces: each generated hero’s `image`, preferring `Map<string,string>` returned by `readWikiImages`.

- [ ] **Step 1: Write the failing artwork-source test**

```js
test("SP关羽 uses the mobile Wiki classic full artwork", () => {
  const hero = heroes.find((entry) => entry.name === "SP关羽");
  assert.match(hero.image, /^https:\/\/patchwiki\.biligame\.com\/images\/msgs\//);
  assert.doesNotMatch(hero.image, /\/thumb\//);
});

test("updater resolves Wiki art for the complete Wiki pool", async () => {
  const source = await readFile(new URL("../scripts/update-mobile-heroes.mjs", import.meta.url), "utf8");
  assert.match(source, /readWikiImages\(wikiHeroes\)/);
  assert.match(source, /wikiImages\.get\(wikiHero\.name\)\s*\?\?\s*official\?\.image/);
  assert.doesNotMatch(source, /readWikiImages\(unmatchedWikiHeroes\)/);
});
```

- [ ] **Step 2: Run the artwork test and verify it fails**

Run: `pnpm exec node --test tests/wiki-classic-art.test.mjs`

Expected: FAIL because SP关羽 still points at `www.sanguosha.cn` and only unmatched heroes use Wiki images.

- [ ] **Step 3: Fetch classic art for every Wiki hero and prefer it**

```js
const wikiImages = await readWikiImages(wikiHeroes);
const fallbackImage = wikiImages.get(wikiHero.name) ?? "";
// ...
image: fallbackImage || official?.image || "",
```

`readWikiImages` must keep its exact filename match for `文件:${name}-经典形象.<ext>` and normalize thumbnail URLs to the original `/images/msgs/` URL.

- [ ] **Step 4: Regenerate current mobile data**

Run: `pnpm run data:update`

Expected: the command writes a refreshed `app/data/heroes.json`; SP关羽 points to `patchwiki.biligame.com/images/msgs/...`, and the updater reports the full identity hero count.

- [ ] **Step 5: Run the artwork and pool tests**

Run: `pnpm exec node --test tests/wiki-classic-art.test.mjs tests/mobile-pool-rules.test.mjs tests/granted-skill-rules.test.mjs`

Expected: all tests PASS.

### Task 3: Add direct numeric editing for every mark

**Files:**
- Create: `tests/counter-direct-input.test.mjs`
- Modify: `app/components/assistants/TrackerAssistant.tsx`
- Modify: `app/globals.css`
- Modify: `package.json`

**Interfaces:**
- Consumes: `setCounter(state, mark, seat, value)` from `tabletop-assistant-rules.mjs`.
- Produces: one controlled `.counter-value-input` per seat/mark row.

- [ ] **Step 1: Write the failing component-source test**

```js
test("tracker exposes a direct non-negative numeric value editor", async () => {
  const source = await readFile(new URL("../app/components/assistants/TrackerAssistant.tsx", import.meta.url), "utf8");
  assert.match(source, /setCounter/);
  assert.match(source, /type="number"/);
  assert.match(source, /min=\{0\}/);
  assert.match(source, /className="counter-value-input"/);
});
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `pnpm exec node --test tests/counter-direct-input.test.mjs`

Expected: FAIL because the current UI renders a `<b>` value with only plus/minus buttons.

- [ ] **Step 3: Replace the static value with a controlled number input**

```tsx
<input
  aria-label={`${row.seat}${selectedMark}数量`}
  className="counter-value-input"
  max={selected?.max ?? undefined}
  min={0}
  onChange={(event) => onChange(setCounter(current, selectedMark, row.seat, Number(event.target.value) || 0))}
  step={1}
  type="number"
  value={row.count}
/>
```

- [ ] **Step 4: Style the input as the central counter value**

```css
.counter-value-input {
  width: 64px;
  height: 36px;
  border: 1px solid var(--line);
  background: rgba(255,255,255,.55);
  color: var(--ink);
  font: 700 15px/1 system-ui, sans-serif;
  text-align: center;
}
```

- [ ] **Step 5: Run counter tests**

Run: `pnpm exec node --test tests/counter-direct-input.test.mjs tests/tabletop-assistant-rules.test.mjs tests/hero-card-state.test.mjs`

Expected: all tests PASS, including setting values greater than one in a single update.

### Task 4: Explain quoted skills and audit special mechanic terms

**Files:**
- Create: `app/lib/skill-reference-rules.mjs`
- Create: `app/data/skill-references.json`
- Create: `tests/skill-reference-rules.test.mjs`
- Modify: `app/components/HeroDetail.tsx`
- Modify: `app/components/SkillText.tsx`
- Modify: `app/lib/shared-rule-glossary.mjs`
- Modify: `scripts/update-mobile-heroes.mjs`
- Modify: `tests/shared-rule-glossary.test.mjs`
- Modify: `app/globals.css`
- Modify: `package.json`

**Interfaces:**
- Produces: `buildSkillReferenceIndex(heroes): Map<string, { name, description, heroId, heroName }>` and `tokenizeSkillReferences(text, index): Array<{ kind: "text" | "skill"; text: string; reference?: object }>`.
- Consumes: the index in `SkillText` through prop `skillReferenceIndex`.
- Produces: `app/data/skill-references.json` for quoted skills such as “鸡肋”和“贲育” whose owners are outside the generated identity pool.

- [ ] **Step 1: Write failing pure-rule tests**

```js
test("all thirteen 似故 quoted skills resolve to current definitions", () => {
  const index = buildSkillReferenceIndex(heroes);
  const expected = ["智迟", "刚烈", "反馈", "遗计", "节命", "放逐", "矢北", "称象", "智愚", "鸡肋", "贲育", "筹策", "武魂"];
  for (const name of expected) assert.ok(index.get(name)?.description, name);
});

test("昂扬技 and 激昂 tokenize as the same resettable-limited rule", () => {
  const tokens = tokenizeSharedRuleText("昂扬技。激昂：执行过两个选项。");
  assert.equal(tokens.filter((token) => token.kind === "rule").length, 2);
});
```

- [ ] **Step 2: Run the focused tests and verify they fail**

Run: `pnpm exec node --test tests/skill-reference-rules.test.mjs tests/shared-rule-glossary.test.mjs`

Expected: FAIL because the skill-reference module and the “昂扬技/激昂” glossary entry do not exist.

- [ ] **Step 3: Implement deterministic skill-reference indexing**

```js
export function buildSkillReferenceIndex(heroes) {
  const candidates = heroes.flatMap((hero) =>
    hero.skills.map((skill) => ({
      name: skill.name,
      description: skill.description,
      heroId: hero.id,
      heroName: hero.name,
      kind: skill.kind,
      presetLevel: hero.presetLevel,
    })),
  );
  candidates.sort((a, b) =>
    Number(a.kind !== "base") - Number(b.kind !== "base")
    || a.presetLevel - b.presetLevel
    || a.heroName.localeCompare(b.heroName, "zh-CN")
    || a.heroId.localeCompare(b.heroId),
  );
  return new Map(candidates.map((entry) => [entry.name, entry]));
}
```

`tokenizeSkillReferences` must only convert text captured inside Chinese quote marks when the complete quoted value exists in the index; other quoted marks and card names remain plain text.

- [ ] **Step 4: Render referenced definitions inside the current skill card**

```tsx
const referenceTokens = tokenizeSkillReferences(skill.description, skillReferenceIndex);
// A clicked `skill` token sets `openReference`.
{openReference && (
  <section className="skill-reference-panel">
    <div><span>相关技能</span><small>{openReference.heroName}</small></div>
    <h5>{openReference.name}</h5>
    <p>{openReference.description}</p>
  </section>
)}
```

Build the index once in `HeroDetail` with `useMemo(() => buildSkillReferenceIndex(heroes), [heroes])` and pass it to every `SkillText`.

- [ ] **Step 5: Add the mobile-rule definition**

```js
{
  id: "rousing",
  terms: ["昂扬技", "激昂"],
  title: "昂扬技 / 激昂",
  summary: "昂扬技是一种可刷新的限定技：发动后失效；达到该技能写明的“激昂”条件后重置，之后可以再次发动。",
  items: [],
}
```

- [ ] **Step 6: Run reference and glossary tests**

Run: `pnpm exec node --test tests/skill-reference-rules.test.mjs tests/shared-rule-glossary.test.mjs`

Expected: all tests PASS; the thirteen `似故` names and both 神马超 terms resolve.

### Task 5: Full verification, GitHub sync, and Sites release

**Files:**
- Modify: `.openai/hosting.json` only if the hosting service returns new opaque metadata.
- Verify: all files changed in Tasks 1–4.

**Interfaces:**
- Consumes: a clean, committed source tree and the existing Sites project ID.
- Produces: a GitHub `main` commit and a public Sites version from that exact commit.

- [ ] **Step 1: Run the complete verification suite**

Run: `pnpm test`

Expected: unit tests, Vinext production build, and rendered HTML test all PASS.

- [ ] **Step 2: Run lint and inspect the generated data**

Run: `pnpm run lint`

Expected: exit code 0.

Run: `node -e "const h=require('./app/data/heroes.json'); const sp=h.find(x=>x.name==='SP关羽'); console.log(h.length, sp.image)"`

Expected: the identity pool count and a non-thumbnail `patchwiki.biligame.com/images/msgs/` SP关羽 URL.

- [ ] **Step 3: Commit and push the exact source state**

```bash
git add app scripts tests docs package.json
git commit -m "Improve mobile hero cards and rules"
git push origin main
```

Expected: GitHub `main` points to the new commit.

- [ ] **Step 4: Package the committed source and save a Sites version**

Run the installed Sites packaging script against the repository, then save a version with the commit SHA from Step 3.

Expected: Sites returns a new saved version for project `appgprj_6a6845a3fea48191bf03946ff90f9f7b`.

- [ ] **Step 5: Deploy and inspect the production version**

Deploy the saved version with public access and inspect until deployment status is terminal.

Expected: `https://miansha-assistant.johnnyho8.chatgpt.site` serves the new version.
