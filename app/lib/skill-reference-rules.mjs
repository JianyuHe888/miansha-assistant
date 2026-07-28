import externalReferences from "../data/skill-references.json" with { type: "json" };

const QUOTED_TEXT_PATTERN = /[“「『]([^”」』]+)[”」』]/g;

export function buildSkillReferenceIndex(heroes) {
  const candidates = [
    ...heroes.flatMap((hero) =>
      hero.skills
        .filter((skill) => skill.name && skill.description)
        .map((skill) => ({
          name: skill.name,
          description: skill.description,
          heroId: hero.id,
          heroName: hero.name,
          kind: skill.kind,
          presetLevel: hero.presetLevel ?? 99,
        })),
    ),
    ...externalReferences.map((reference) => ({
      ...reference,
      kind: "external",
      presetLevel: 100,
    })),
  ];

  candidates.sort(
    (left, right) =>
      Number(left.kind !== "base") - Number(right.kind !== "base") ||
      left.presetLevel - right.presetLevel ||
      left.heroName.localeCompare(right.heroName, "zh-CN") ||
      String(left.heroId).localeCompare(String(right.heroId), "zh-CN"),
  );

  const index = new Map();
  for (const candidate of candidates) {
    if (!index.has(candidate.name)) index.set(candidate.name, candidate);
  }
  return index;
}

export function tokenizeSkillReferences(text, index) {
  if (!/技能|视为拥有/.test(text)) return [{ kind: "text", text }];

  const tokens = [];
  let cursor = 0;

  for (const match of text.matchAll(QUOTED_TEXT_PATTERN)) {
    const start = match.index ?? 0;
    if (start > cursor) tokens.push({ kind: "text", text: text.slice(cursor, start) });

    const reference = index.get(match[1]);
    if (reference) {
      tokens.push({ kind: "skill", text: match[0], reference });
    } else {
      tokens.push({ kind: "text", text: match[0] });
    }
    cursor = start + match[0].length;
  }

  if (cursor < text.length) tokens.push({ kind: "text", text: text.slice(cursor) });
  return tokens.filter((token) => token.text);
}
