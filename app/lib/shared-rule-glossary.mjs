const rule = (id, title, terms, summary, items = []) => ({
  id,
  title,
  terms,
  summary,
  items,
});

export const SHARED_RULE_GLOSSARY = [
  rule(
    "collaboration",
    "协力",
    ["协力"],
    "选择一项协力目标并与技能指定的角色共同完成。到技能规定的结算时机，双方完成所选条件后，执行该技能写明的协力奖励。",
    [
      { label: "同仇", description: "你与其造成的伤害值之和不小于4。" },
      { label: "并进", description: "你与其总计摸过至少8张牌。" },
      { label: "疏财", description: "你与其弃置的牌中包含4种花色。" },
      { label: "勠力", description: "你与其使用或打出的牌中包含4种花色。" },
    ],
  ),
  rule(
    "discipline",
    "整肃",
    ["整肃"],
    "从“擂进、变阵、鸣止”中选择一项。若目标直到其弃牌阶段结束时没有整肃失败，其获得整肃奖励：选择摸两张牌，或回复1点体力。",
    [
      { label: "擂进", description: "出牌阶段内使用过至少三张牌，且这些牌的点数均严格递增。" },
      { label: "变阵", description: "出牌阶段内使用过至少两张牌，且这些牌的花色均相同。" },
      { label: "鸣止", description: "弃牌阶段内弃置过至少两张牌，且这些牌的花色均不相同。" },
    ],
  ),
  rule(
    "benevolence-area",
    "仁区",
    ["仁区"],
    "场上额外且独立的公共区域，不属于任何角色。仁区至多容纳6张“仁”牌；溢出时，将最早置入仁区的牌置入弃牌堆。",
  ),
  rule(
    "stratagem",
    "智囊",
    ["智囊牌", "智囊"],
    "移动版默认的智囊牌固定为三种普通锦囊牌：【过河拆桥】、【无懈可击】和【无中生有】。",
  ),
  rule(
    "mouyi",
    "谋弈",
    ["谋弈"],
    "双方各选择一个谋弈项。若技能写明的克制关系成立，发起方谋弈成功并执行对应效果；否则本次谋弈不执行成功效果。具体选项、克制关系和隐藏信息可在该武将的面杀辅助中完成。",
  ),
  rule(
    "armor",
    "护甲",
    ["护甲值", "护甲"],
    "角色因受到伤害而扣减体力时，改为先扣减等量护甲。伤害并未被防止，伤害后的结算仍会发生；失去体力不经过护甲。通常每名角色的护甲上限为5。",
  ),
  rule(
    "charge",
    "蓄力技",
    ["蓄力点数", "蓄力点", "蓄力值", "蓄力技", "蓄力"],
    "蓄力技（X/Y）中的X为游戏开始时的蓄力点数，Y为蓄力上限。多个蓄力技共用蓄力值时，将各技能的X、Y分别相加后生效；剩余蓄力点数仅自己可见。",
  ),
  rule(
    "persistent",
    "持恒技",
    ["持恒技"],
    "不会因其他技能造成的“技能失效”效果而失效。",
  ),
  rule(
    "remembrance",
    "追思",
    ["追思"],
    "获得一名未被追思过的已阵亡角色武将牌上的非主公技技能。同一名已阵亡角色不能被多名角色重复追思。",
  ),
  rule(
    "council",
    "议事",
    ["议事"],
    "发起者指定参与角色，参与者同时展示一张手牌，以牌的红、黑颜色提出意见；没有手牌的角色不展示。意见人数较多的颜色成为议事结果，再执行技能中对应颜色的效果；红黑人数相同时没有颜色结果。",
  ),
  rule(
    "momentum",
    "乘势",
    ["乘势"],
    "多分支技能中的附加效果：当每个分支的触发条件都已满足时，执行技能写明的“乘势”效果。满足条件后的乘势效果为强制执行。",
  ),
  rule(
    "face-up",
    "明置 / 明置牌",
    ["明置牌", "明置"],
    "“明置”是把一张背面朝上的游戏牌翻至正面；“明置牌”指对所有玩家可见的牌。一名角色的明置牌通常包含其装备区里的牌，但不包含判定区里的牌。",
  ),
  rule(
    "last-stand",
    "背水",
    ["背水"],
    "当技能列出两个普通选项与“背水”时，选择背水会依次执行前两个选项，再执行“背水：”后写明的代价或附加效果；若技能另写了条件，以该技能原文为准。",
  ),
  rule(
    "lord-skill",
    "主公技",
    ["主公技"],
    "仅当该角色的身份为主公时才能拥有或生效的技能。",
  ),
  rule(
    "locked-skill",
    "锁定技",
    ["锁定技"],
    "符合发动条件时必须发动，或作为状态持续生效的技能。",
  ),
  rule(
    "limited-skill",
    "限定技",
    ["限定技"],
    "一整局游戏通常只能发动一次的技能。",
  ),
  rule(
    "rousing-skill",
    "昂扬技 / 激昂",
    ["昂扬技", "激昂"],
    "昂扬技是一种可刷新的限定技：发动后失效；达到该技能写明的“激昂”条件后重置，之后可以再次发动。",
  ),
  rule(
    "awakening-skill",
    "觉醒技",
    ["觉醒技"],
    "同时具有锁定技和限定技的性质；满足觉醒条件时必须发动，且一局通常只会觉醒一次。",
  ),
  rule(
    "conversion-skill",
    "转换技",
    ["转换技"],
    "技能具有阴、阳两种形态。发动当前形态后切换到另一形态；未发动当前形态，不能直接使用另一形态。",
  ),
  rule(
    "mission-skill",
    "使命技",
    ["使命技"],
    "技能包含使命成功和/或使命失败的条件与效果；使命成功或失败结算后，角色会失去该使命技。",
  ),
  rule(
    "faction-skill",
    "势力技",
    ["势力技"],
    "双势力身份武将使用的技能类别。武将当前势力与技能标注的势力相符时，才拥有对应势力技。",
  ),
  rule(
    "coalition",
    "结党",
    ["结党"],
    "十常侍先随机查看一张本局未亮出的“常侍”牌作为主将，再查看至多四张未亮出的“常侍”牌，从中亮出一张与主将互相认可的牌作为副将，组成本轮双将。",
  ),
  rule(
    "point-duel",
    "拼点",
    ["拼点"],
    "双方都须有手牌，各将一张手牌扣置后同时亮出。点数较大者“赢”，另一方“没赢”；点数相同则双方都“没赢”。最后将两张拼点牌置入弃牌堆。",
  ),
  rule(
    "turn-over",
    "翻面",
    ["翻面"],
    "将武将牌翻至另一面。武将牌背面朝上的角色在其回合开始前翻回正面，并跳过该回合。",
  ),
  rule(
    "recast",
    "重铸",
    ["重铸"],
    "将牌置入弃牌堆，然后摸一张牌。重铸不等同于弃置。",
  ),
  rule(
    "chain",
    "横置",
    ["横置"],
    "将角色的武将牌横放，令其进入连环状态。处于连环状态的角色受到属性伤害时，会按座次向其他处于连环状态的角色传导。",
  ),
  rule(
    "abolished-area",
    "废除区域",
    ["废除区域", "废除"],
    "被废除的区域或装备栏失去功能，在恢复之前不能置入对应的牌。具体废除范围、恢复方式及附带效果以技能原文为准。",
  ),
  rule(
    "restore-general",
    "复原武将牌",
    ["复原武将牌"],
    "若武将牌背面朝上，将其翻回正面；若武将牌横置，将其重置。两种状态分别处理，不额外回复体力。",
  ),
];

const termEntries = SHARED_RULE_GLOSSARY
  .flatMap((item) => item.terms.map((term) => ({ term, ruleId: item.id })))
  .sort((left, right) => right.term.length - left.term.length);
const ruleIdByTerm = new Map(termEntries.map((entry) => [entry.term, entry.ruleId]));
const escapedTerms = termEntries.map(({ term }) => term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
const termPattern = new RegExp(`(${escapedTerms.join("|")})`, "g");
const ruleById = new Map(SHARED_RULE_GLOSSARY.map((item) => [item.id, item]));

export function getSharedRule(ruleId) {
  return ruleById.get(ruleId) ?? null;
}

export function tokenizeSharedRuleText(text) {
  return text
    .split(termPattern)
    .filter(Boolean)
    .map((part) => {
      const ruleId = ruleIdByTerm.get(part);
      return ruleId
        ? { kind: "rule", text: part, ruleId }
        : { kind: "text", text: part };
    });
}
