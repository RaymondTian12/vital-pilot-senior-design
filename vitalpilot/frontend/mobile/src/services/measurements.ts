export type HeightUnit = "ft" | "cm" | "m";
export type WeightUnit = "lb" | "kg";
export function normalizeMeasurements(
  heightUnit: HeightUnit,
  feet: string,
  inches: string,
  metricHeight: string,
  weightUnit: WeightUnit,
  weight: string,
) {
  const f = Number(feet),
    i = Number(inches),
    h = Number(metricHeight),
    w = Number(weight);
  let totalInches: number;
  if (heightUnit === "ft") {
    if (
      !feet.trim() ||
      !inches.trim() ||
      !Number.isInteger(f) ||
      !Number.isInteger(i) ||
      f < 0 ||
      f > 9 ||
      i < 0 ||
      i > 11
    )
      throw new Error("Enter feet and inches from 0–11.");
    totalInches = f * 12 + i;
  } else {
    if (!metricHeight.trim() || !Number.isFinite(h) || h <= 0)
      throw new Error("Enter a positive height.");
    totalInches = Math.round((heightUnit === "m" ? h * 100 : h) / 2.54);
  }
  if (totalInches <= 0 || totalInches > 119)
    throw new Error("Enter a height between 1 and 119 inches (about 302 cm).");
  if (!weight.trim() || !Number.isFinite(w) || w <= 0)
    throw new Error("Enter a positive weight.");
  return {
    height_feet: Math.floor(totalInches / 12),
    height_inches: totalInches % 12,
    weight: weightUnit === "kg" ? w / 0.45359237 : w,
  };
}
