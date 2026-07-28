import { drawUnique } from "./assistant-rules.mjs";

const DEFAULT_SEATS = [
  "自己",
  "二号位",
  "三号位",
  "四号位",
  "五号位",
  "六号位",
  "七号位",
  "八号位",
];

const MOUYI_CONFIGS = {
  谋徐晃: {
    ownerLabel: "谋徐晃",
    opponentLabel: "目标角色",
    ownerOptions: [
      {
        title: "围城断粮",
        effect:
          "若其判定区没有【兵粮寸断】，将牌堆顶一张牌当无距离限制的【兵粮寸断】对其使用；否则获得其一张牌。",
        opponentEffect:
          "预防对方对你使用【兵粮寸断】；若你的判定区已有【兵粮寸断】，则预防其获得你一张牌。",
      },
      {
        title: "擂鼓进军",
        effect: "视为对其使用一张【决斗】。",
        opponentEffect: "预防对方对你使用【决斗】。",
      },
    ],
  },
  谋马超: {
    ownerLabel: "谋马超",
    opponentLabel: "目标角色",
    ownerOptions: [
      {
        title: "直取敌营",
        effect: "获得其一张牌。",
        opponentEffect: "预防对方获得你一张牌。",
      },
      {
        title: "扰阵疲敌",
        effect: "摸两张牌。",
        opponentEffect: "预防对方摸两张牌。",
      },
    ],
  },
  韩玄: {
    ownerLabel: "韩玄",
    opponentLabel: "【杀】的使用者",
    ownerOptions: [
      {
        title: "金蝉脱壳",
        effect: "随机弃置其一张手牌；若为基本牌，你获得之。",
        opponentEffect: "预防韩玄随机弃置你一张手牌，并在该牌为基本牌时获得之。",
      },
      {
        title: "弃履狂奔",
        effect: "此【杀】伤害-1。",
        opponentEffect: "预防此【杀】的伤害-1。",
      },
    ],
  },
  界张嶷: {
    ownerLabel: "界张嶷",
    opponentLabel: "目标角色",
    ownerOptions: [
      { title: "镇压", effect: "" },
      { title: "安抚", effect: "" },
    ],
    opponentOptions: [
      {
        title: "反抗",
        effect:
          "若对方选择【镇压】，其对你造成1点伤害并摸一张牌；若其选择【安抚】，你对其造成1点伤害，然后其摸一张牌。",
      },
      {
        title: "顺从",
        effect:
          "若对方选择【镇压】，其获得你一张牌，然后交给你两张牌；若其选择【安抚】，你交给其两张牌，牌数不足则改为你跳过下一个摸牌阶段。",
      },
    ],
    outcomes: {
      "0:0": "你对其造成1点伤害，然后摸一张牌。",
      "0:1": "你获得其一张牌，然后交给其两张牌。",
      "1:0": "你受到1点伤害，然后摸一张牌。",
      "1:1": "其交给你两张牌；若牌数不足两张，改为其跳过下一个摸牌阶段。",
    },
  },
};

function unique(items) {
  return [...new Set(items)];
}

function positiveInteger(value, fallback = 1) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function getTabletopAssistantModules(hero) {
  const text = hero.skills.map((item) => item.description).join("\n");
  const modules = [];
  const counters = getSuggestedCounters(hero).filter((counter) => counter.name !== "护甲");
  if (hero.name !== "周群" && (counters.length || /蓄力技|蓄力点/.test(text))) {
    modules.push("trackers");
  }
  if (hero.name === "赵襄") modules.push("fuhan");
  if (/谋弈/.test(text)) modules.push("mouyi");
  if (/转换技/.test(text)) modules.push("conversion");
  if (hero.name === "司马孚") modules.push("alternating-choice");
  return modules;
}

export function getSuggestedCounters(hero) {
  const byName = new Map();
  const upsert = (name, skillName) => {
    const current = byName.get(name) ?? {
      name,
      skillNames: [],
      initial: 0,
      max: null,
    };
    current.skillNames = unique([...current.skillNames, skillName]);
    byName.set(name, current);
    return current;
  };

  for (const item of hero.skills) {
    const description = item.description;
    for (const match of description.matchAll(/[“「]([^”」\n]{1,10})[”」]值/g)) {
      const name = match[1].trim();
      upsert(name, item.name);
    }
    const markerPatterns = [
      /[“「]([^”」\n]{1,10})[”」](?:标记|的?数(?:量)?)/g,
      /(?:枚|个)[“「]([^”」\n]{1,10})[”」]/g,
    ];
    for (const pattern of markerPatterns) {
      for (const match of description.matchAll(pattern)) {
        const name = match[1].trim();
        if (!name || /【|】/.test(name)) continue;
        upsert(name, item.name);
      }
    }

    if (/蓄力技|蓄力点/.test(description)) {
      const current = upsert("蓄力点", item.name);
      for (const match of description.matchAll(/蓄力技[（(](\d+)\/(\d+)[）)]/g)) {
        current.initial += Number.parseInt(match[1], 10);
        current.max = (current.max ?? 0) + Number.parseInt(match[2], 10);
      }
    }
    if (/护甲/.test(description)) {
      upsert("护甲", item.name);
    }
  }

  const text = hero.skills.map((item) => item.description).join("\n");
  for (const counter of byName.values()) {
    const escaped = counter.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const initial = text.match(
      new RegExp(`(?:游戏开始时|登场时)[^。；]{0,60}?获得(\\d+)(?:枚|个|点)[“「]${escaped}[”」]`),
    );
    if (initial && counter.initial === 0) {
      counter.initial = Number.parseInt(initial[1], 10);
    }
    const max = text.match(
      new RegExp(`(?:至多拥有|上限(?:为|至多为)?)(\\d+)(?:枚|个|点)?[“「]?${escaped}`),
    );
    if (max && counter.max === null) {
      counter.max = Number.parseInt(max[1], 10);
    }
  }

  return [...byName.values()];
}

export function createCounterState(seats = DEFAULT_SEATS) {
  return { version: 1, seats: [...seats], entries: {} };
}

export function createHeroCounterState(hero, seats = DEFAULT_SEATS) {
  const state = createCounterState(seats);
  for (const counter of getSuggestedCounters(hero)) {
    if (counter.name === "护甲" || counter.initial < 1) continue;
    state.entries[`自己::${counter.name}`] = counter.initial;
  }
  return state;
}

export function getHeroCardCounters(hero, state = null) {
  const entries = state?.entries ?? {};
  const counters = [];
  const seen = new Set();

  for (const counter of getSuggestedCounters(hero)) {
    if (counter.name === "护甲") continue;
    const saved = entries[`自己::${counter.name}`];
    counters.push({
      name: counter.name,
      count: Number.isFinite(saved) ? Math.max(0, Math.round(saved)) : counter.initial,
    });
    seen.add(counter.name);
  }

  for (const [key, count] of Object.entries(entries)) {
    if (!key.startsWith("自己::") || !Number.isFinite(count) || count <= 0) continue;
    const name = key.slice("自己::".length);
    if (!name || name === "护甲" || seen.has(name)) continue;
    counters.push({ name, count: Math.max(0, Math.round(count)) });
    seen.add(name);
  }

  return counters;
}

export function addCounter(state, mark, seat, delta = 1) {
  const key = `${seat}::${mark}`;
  const current = Number(state.entries?.[key]) || 0;
  return {
    ...state,
    entries: {
      ...state.entries,
      [key]: Math.max(0, current + Number(delta || 0)),
    },
  };
}

export function setCounter(state, mark, seat, value) {
  const key = `${seat}::${mark}`;
  return {
    ...state,
    entries: {
      ...state.entries,
      [key]: Math.max(0, Number.parseInt(value, 10) || 0),
    },
  };
}

export function removeCounter(state, mark, seat) {
  const key = `${seat}::${mark}`;
  const entries = { ...state.entries };
  delete entries[key];
  return { ...state, entries };
}

export function renameCounterSeat(state, previous, next) {
  const label = String(next).trim() || previous;
  const entries = {};
  for (const [key, value] of Object.entries(state.entries ?? {})) {
    const prefix = `${previous}::`;
    entries[key.startsWith(prefix) ? `${label}::${key.slice(prefix.length)}` : key] = value;
  }
  return {
    ...state,
    seats: state.seats.map((seat) => (seat === previous ? label : seat)),
    entries,
  };
}

export function drawFuhanCandidates(heroes, ownerName = "赵襄", rng) {
  const candidates = heroes.filter(
    (candidate) =>
      candidate.faction === "蜀" &&
      candidate.name !== ownerName &&
      candidate.faceToFace !== "excluded",
  );
  return drawUnique(candidates, 5, new Set(), rng);
}

export function calculateFuhanMaxHp(removedMeiying, playerCount) {
  return Math.min(
    Math.max(0, Number.parseInt(removedMeiying, 10) || 0),
    positiveInteger(playerCount),
  );
}

export function getMouyiConfig(heroName) {
  return MOUYI_CONFIGS[heroName] ?? null;
}

export function getMouyiOpponentOptions(heroName) {
  const config = getMouyiConfig(heroName);
  if (!config) return [];
  return config.opponentOptions
    ? config.opponentOptions.map((option) => ({ ...option }))
    : config.ownerOptions.map((option) => ({
        title: `识破【${option.title}】`,
        effect: option.opponentEffect ?? option.effect,
      }));
}

export function createMouyiState(heroName) {
  if (!getMouyiConfig(heroName)) throw new Error(`不支持的谋弈武将：${heroName}`);
  return {
    version: 1,
    heroName,
    phase: "owner",
    ownerChoice: null,
    opponentChoice: null,
    success: null,
    effectTitle: null,
    effect: null,
  };
}

export function chooseMouyi(state, side, choice) {
  const index = Number.parseInt(choice, 10);
  if (![0, 1].includes(index)) throw new RangeError("谋弈选项必须为 0 或 1");
  const config = getMouyiConfig(state.heroName);
  if (!config) throw new Error("谋弈配置缺失");

  if (side === "owner") {
    if (state.phase !== "owner") throw new Error("当前不是发动者选择阶段");
    return { ...state, ownerChoice: index, phase: "handoff" };
  }
  if (side !== "opponent" || state.phase !== "opponent") {
    throw new Error("当前不是对方选择阶段");
  }

  const ownerOption = config.ownerOptions[state.ownerChoice];
  const outcome = config.outcomes?.[`${state.ownerChoice}:${index}`];
  const success = config.outcomes ? null : state.ownerChoice !== index;
  return {
    ...state,
    opponentChoice: index,
    phase: "result",
    success,
    effectTitle: ownerOption.title,
    effect: outcome ?? (success ? ownerOption.effect : "谋略被识破，本次无事发生。"),
  };
}

export function confirmMouyiHandoff(state) {
  if (state.phase !== "handoff") throw new Error("当前不能交接");
  return { ...state, phase: "opponent" };
}

export function extractConversionSkills(hero) {
  return hero.skills
    .filter((item) => /转换技/.test(item.description))
    .map((item) => {
      const yang = item.description.match(/阳：([\s\S]*?)(?=\n+\s*阴：)/)?.[1]?.trim() ?? "";
      const yin = item.description.match(/阴：([\s\S]*)/)?.[1]?.trim() ?? "";
      return {
        id: item.id ?? item.name,
        name: item.name,
        yang,
        yin,
      };
    })
    .filter((item) => item.yang || item.yin);
}

export function toggleConversion(side) {
  return side === "yin" ? "yang" : "yin";
}

export function recordSimaFuChoice(state, target, choice) {
  const index = Number.parseInt(choice, 10);
  if (![1, 2].includes(index)) throw new RangeError("蹇襄选项必须为 1 或 2");
  if (state[target] === index) throw new Error("不能与上次对该角色选择相同选项");
  return { ...state, [target]: index };
}

export function createVitalityState(hero) {
  const maxHp = Number.isFinite(hero.maxHp) ? hero.maxHp : hero.hp;
  return {
    version: 1,
    hp: Number(hero.hp) || 0,
    maxHp: Number(maxHp) || 0,
    armor: Math.min(5, Math.max(0, Number(hero.armor) || 0)),
    lastEvent: null,
  };
}

export function applyDamage(state, amount = 1) {
  const value = positiveInteger(amount);
  const armorLost = Math.min(state.armor, value);
  const hpLost = value - armorLost;
  return {
    ...state,
    hp: state.hp - hpLost,
    armor: state.armor - armorLost,
    lastEvent: { type: "damage", amount: value, armorLost, hpLost },
  };
}

export function loseHp(state, amount = 1) {
  const value = positiveInteger(amount);
  return {
    ...state,
    hp: state.hp - value,
    lastEvent: { type: "lose-hp", amount: value, hpLost: value },
  };
}

export function recoverHp(state, amount = 1) {
  const value = positiveInteger(amount);
  const recovered = Math.max(0, Math.min(value, state.maxHp - state.hp));
  return {
    ...state,
    hp: state.hp + recovered,
    lastEvent: { type: "recover", amount: value, recovered },
  };
}

export function adjustMaxHp(state, delta) {
  const nextMaxHp = Math.max(0, state.maxHp + Number(delta || 0));
  return {
    ...state,
    maxHp: nextMaxHp,
    hp: Math.min(state.hp, nextMaxHp),
    lastEvent: { type: "max-hp", delta: Number(delta || 0) },
  };
}

export function adjustArmor(state, delta) {
  const nextArmor = Math.min(5, Math.max(0, state.armor + Number(delta || 0)));
  return {
    ...state,
    armor: nextArmor,
    lastEvent: { type: "armor", delta: nextArmor - state.armor },
  };
}
