"use client";

import type { Hero } from "../lib/hero-types";
import { ArmorDisplay } from "./ArmorDisplay";
import { HeroCardMarks } from "./HeroCardMarks";
import { YinYangHealth } from "./YinYangHealth";

const POOL_LABELS = ["", "经典身份", "界限平衡", "进阶平衡", "完整将池"];

export function HeroCard({
  hero,
  compact = false,
  disabled = false,
  vitalityState,
  counterState,
  flipped = false,
  onFlip,
  onInspect,
}: {
  hero: Hero;
  compact?: boolean;
  disabled?: boolean;
  vitalityState?: { hp: number; maxHp: number; armor: number } | null;
  counterState?: { entries: Record<string, number> } | null;
  flipped?: boolean;
  onFlip?: () => void;
  onInspect?: (hero: Hero) => void;
}) {
  const className = [
    "hero-card",
    compact && "compact",
    disabled && "disabled",
    onFlip && "flippable",
    flipped && "is-flipped",
  ]
    .filter(Boolean)
    .join(" ");
  const currentHp = vitalityState?.hp ?? hero.hp;
  const maxHp = vitalityState?.maxHp ?? hero.maxHp ?? hero.hp;
  const armor = vitalityState?.armor ?? hero.armor ?? 0;

  return (
    <article
      aria-label={onFlip ? `${hero.name}武将牌，${flipped ? "已翻面" : "正面朝上"}，双击切换` : undefined}
      aria-pressed={onFlip ? flipped : undefined}
      className={className}
      data-faction={hero.faction}
      onDoubleClick={onFlip ? (event) => {
        event.preventDefault();
        onFlip();
      } : undefined}
      onKeyDown={onFlip ? (event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        onFlip();
      } : undefined}
      role={onFlip ? "button" : undefined}
      tabIndex={onFlip ? 0 : undefined}
    >
      <div className="card-grain" />
      <div className="card-topline">
        <span className="faction-seal">{hero.faction}</span>
        <span className="rarity">{hero.rarity}</span>
      </div>
      <div className="card-statuses">
        {hero.faceToFace === "assisted" && <span>需辅助</span>}
        {hero.faceToFace === "excluded" && <span>不可面杀</span>}
        <small>{POOL_LABELS[hero.presetLevel]}</small>
      </div>
      {/* Remote art comes from the official/mobile Wiki catalog and cannot use a fixed local loader. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        alt={`${hero.name}移动版武将形象`}
        className="hero-art"
        loading={compact ? "lazy" : "eager"}
        onError={(event) => {
          event.currentTarget.style.display = "none";
        }}
        src={hero.image}
      />
      <div className="silhouette" aria-hidden="true">将</div>
      <div className="ink-wash" />
      <HeroCardMarks hero={hero} state={counterState} />
      <div className="hero-caption">
        <div>
          <p>{hero.pack}</p>
          <h3>{hero.name}</h3>
        </div>
        <div className="hp">
          <YinYangHealth compact current={currentHp} max={maxHp} />
          {armor > 0 ? <ArmorDisplay armor={armor} compact /> : null}
        </div>
      </div>
      {flipped && <span aria-hidden="true" className="flip-state">翻面</span>}
      {onInspect && (
        <button
          aria-label={`查看${hero.name}`}
          className="card-hitarea"
          onClick={() => onInspect(hero)}
          type="button"
        />
      )}
    </article>
  );
}
