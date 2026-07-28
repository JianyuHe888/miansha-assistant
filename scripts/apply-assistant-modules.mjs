import { readFile, writeFile } from "node:fs/promises";
import faceToFaceConfig from "../app/data/face-to-face.json" with { type: "json" };
import { getTabletopAssistantModules } from "../app/lib/tabletop-assistant-rules.mjs";

const dataUrl = new URL("../app/data/heroes.json", import.meta.url);
const heroes = JSON.parse(await readFile(dataUrl, "utf8"));
const manualByHero = new Map();

for (const [moduleId, module] of Object.entries(faceToFaceConfig.modules)) {
  for (const heroName of module.heroNames) {
    const current = manualByHero.get(heroName) ?? [];
    current.push(moduleId);
    manualByHero.set(heroName, current);
  }
}

const next = heroes.map((hero) => {
  const assistantModules = [
    ...(manualByHero.get(hero.name) ?? []),
    ...getTabletopAssistantModules(hero),
  ];
  const excludedReason = faceToFaceConfig.excluded[hero.name];
  return {
    ...hero,
    faceToFace: excludedReason
      ? "excluded"
      : assistantModules.length
        ? "assisted"
        : "native",
    assistantModules,
    ...(excludedReason ? { excludedReason } : {}),
  };
});

await writeFile(dataUrl, `${JSON.stringify(next)}\n`, "utf8");

const moduleCounts = {};
for (const hero of next) {
  for (const moduleId of hero.assistantModules) {
    moduleCounts[moduleId] = (moduleCounts[moduleId] ?? 0) + 1;
  }
}
console.log(JSON.stringify({
  heroes: next.length,
  assisted: next.filter((hero) => hero.faceToFace === "assisted").length,
  moduleCounts,
}, null, 2));
