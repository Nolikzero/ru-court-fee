/**
 * ru-court-fee — госпошлина в суды РФ по ст. 333.19 и 333.21 НК РФ
 * (редакция Федерального закона от 08.08.2024 № 176-ФЗ, действует с 08.09.2024).
 *
 * Все суммы — в рублях. Результат округляется до полного рубля (п. 6 ст. 52 НК РФ).
 */

export type Court = "general" | "arbitration";
export type Payer = "individual" | "organization";

interface Bracket {
  /** Верхняя граница цены иска, включительно */
  upTo: number;
  /** Фиксированная часть */
  base: number;
  /** Процент от суммы свыше `over` */
  rate: number;
  over: number;
}

/** Суды общей юрисдикции, мировые судьи — подп. 1 п. 1 ст. 333.19 НК РФ */
export const GENERAL_SCALE: readonly Bracket[] = [
  { upTo: 100_000, base: 4_000, rate: 0, over: 0 },
  { upTo: 300_000, base: 4_000, rate: 0.03, over: 100_000 },
  { upTo: 500_000, base: 10_000, rate: 0.025, over: 300_000 },
  { upTo: 1_000_000, base: 15_000, rate: 0.02, over: 500_000 },
  { upTo: 3_000_000, base: 25_000, rate: 0.01, over: 1_000_000 },
  { upTo: 8_000_000, base: 45_000, rate: 0.007, over: 3_000_000 },
  { upTo: 24_000_000, base: 80_000, rate: 0.0035, over: 8_000_000 },
  { upTo: 50_000_000, base: 136_000, rate: 0.003, over: 24_000_000 },
  { upTo: 100_000_000, base: 214_000, rate: 0.002, over: 50_000_000 },
  { upTo: Number.POSITIVE_INFINITY, base: 314_000, rate: 0.0015, over: 100_000_000 },
];
export const GENERAL_MAX = 900_000;

/** Арбитражные суды — подп. 1 п. 1 ст. 333.21 НК РФ */
export const ARBITRATION_SCALE: readonly Bracket[] = [
  { upTo: 100_000, base: 10_000, rate: 0, over: 0 },
  { upTo: 1_000_000, base: 10_000, rate: 0.05, over: 100_000 },
  { upTo: 10_000_000, base: 55_000, rate: 0.03, over: 1_000_000 },
  { upTo: 50_000_000, base: 325_000, rate: 0.01, over: 10_000_000 },
  { upTo: Number.POSITIVE_INFINITY, base: 725_000, rate: 0.005, over: 50_000_000 },
];
export const ARBITRATION_MAX = 10_000_000;

/** Фиксированные пошлины (неимущественные требования, жалобы) */
export const FIXED = {
  general: {
    nonProperty: { individual: 3_000, organization: 20_000 },
    appeal: { individual: 3_000, organization: 15_000 },
    cassation: { individual: 5_000, organization: 20_000 },
  },
  arbitration: {
    nonProperty: { individual: 10_000, organization: 30_000 },
    appeal: { individual: 10_000, organization: 30_000 },
    cassation: { individual: 20_000, organization: 50_000 },
  },
} as const;

/** Порог льготы для потребителей и ряда категорий — п. 3 ст. 333.36 НК РФ */
export const EXEMPTION_THRESHOLD = 1_000_000;

const roundRub = (v: number) => Math.round(v);

function assertAmount(claim: number) {
  if (!Number.isFinite(claim) || claim <= 0) {
    throw new RangeError(`Цена иска должна быть положительным числом, получено: ${claim}`);
  }
}

/** Пошлина по имущественному иску без льгот. */
export function propertyClaimFee(claim: number, court: Court = "general"): number {
  assertAmount(claim);
  const scale = court === "general" ? GENERAL_SCALE : ARBITRATION_SCALE;
  const max = court === "general" ? GENERAL_MAX : ARBITRATION_MAX;
  const b = scale.find((x) => claim <= x.upTo)!;
  return Math.min(roundRub(b.base + (claim - b.over) * b.rate), max);
}

/**
 * Иск потребителя (подп. 4 п. 2 и п. 3 ст. 333.36 НК РФ): до 1 млн ₽ — без пошлины,
 * свыше — пошлина с цены иска за вычетом пошлины, приходящейся на 1 млн ₽.
 */
export function consumerClaimFee(claim: number): number {
  assertAmount(claim);
  if (claim <= EXEMPTION_THRESHOLD) return 0;
  return propertyClaimFee(claim, "general") - propertyClaimFee(EXEMPTION_THRESHOLD, "general");
}

/** Заявление о выдаче судебного приказа — 50% пошлины по имущественному иску. */
export function courtOrderFee(claim: number, court: Court = "general"): number {
  return roundRub(propertyClaimFee(claim, court) * 0.5);
}

export function fixedFee(
  kind: "nonProperty" | "appeal" | "cassation",
  payer: Payer,
  court: Court = "general",
): number {
  return FIXED[court][kind][payer];
}
