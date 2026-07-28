# Live Card Status Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the hero card reflect live vitality and self-owned counters, render yin-yang health as a styleable text symbol on phones, and support a persistent double-click flip state.

**Architecture:** Keep browser persistence in the existing vitality and assistant components, but add explicit state callbacks to `HeroDetail`. Pass the resulting snapshots into `HeroCard`, and use a pure rules helper plus a focused rendering component to derive self-owned mark badges.

**Tech Stack:** React 19, TypeScript, CSS, Node test runner, vinext

## Global Constraints

- Keep the complete-image `object-fit: contain` behavior.
- Show only the selected hero's own marks on the main card.
- Keep other seats' marks in the tracker panel.
- Do not add polling or a second persistence format.
- Preserve all existing vitality, armor, assistant, draw, and search behavior.

---

### Task 1: Lock the live card contract with failing tests

**Files:**
- Create: `tests/hero-card-state.test.mjs`
- Modify: `package.json`

**Interfaces:**
- Consumes: Existing hero rules, `HeroCard`, `HeroDetail`, `VitalityTracker`, `SkillAssistant`, and shared CSS.
- Produces: Regression coverage for text-form yin-yang symbols, self-mark derivation, and live card wiring.

- [ ] Add tests that require `U+FE0E`, `font-variant-emoji: text`, `getHeroCardCounters`, the `HeroCardMarks` component, state callbacks, and double-click flip behavior.
- [ ] Run the focused test and confirm it fails because those contracts do not exist yet.

### Task 2: Add pure main-card counter derivation

**Files:**
- Modify: `app/lib/tabletop-assistant-rules.mjs`
- Create: `app/components/HeroCardMarks.tsx`

**Interfaces:**
- Consumes: `getSuggestedCounters(hero)` and an optional counter state with `entries`.
- Produces: `getHeroCardCounters(hero, state)` returning `{ name, count }[]`, plus rendered mark badges.

- [ ] Include suggested non-armor marks even when their count is zero.
- [ ] Prefer the saved `自己::<mark>` count over the printed initial value.
- [ ] Include positive custom marks owned by `自己`.
- [ ] Exclude entries owned by other seats.

### Task 3: Synchronize live vitality and tracker state

**Files:**
- Modify: `app/components/VitalityTracker.tsx`
- Modify: `app/components/SkillAssistant.tsx`
- Modify: `app/components/HeroDetail.tsx`
- Modify: `app/components/HeroCard.tsx`
- Modify: `app/globals.css`

**Interfaces:**
- `VitalityTracker.onStateChange(next)` reports load, update, and reset.
- `SkillAssistant.onModuleStateChange(moduleId, next)` reports module load, update, and reset.
- `HeroCard.vitalityState` and `HeroCard.counterState` override printed values in detail view.
- `HeroCard.flipped` and `HeroCard.onFlip` expose the detail-only flip state.

- [ ] Force text-form yin-yang rendering.
- [ ] Lift current vitality and tracker state into `HeroDetail`.
- [ ] Pass current state to the detail hero card.
- [ ] Render compact mark badges above the card caption.
- [ ] Persist a per-hero flip boolean and toggle it from detail-card double-click/double-touch.
- [ ] Darken flipped cards and render a centered “翻面” label above the overlay.
- [ ] Run focused tests, then the full test/build suite and lint.
- [ ] Commit, push, and deploy the exact validated source to the existing public Sites project.
