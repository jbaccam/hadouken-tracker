const MEAT_KEYWORDS = [
  "chicken",
  "turkey",
  "beef",
  "pork",
  "lamb",
  "fish",
  "salmon",
  "tuna",
  "tilapia",
  "cod",
  "shrimp",
  "ground",
  "steak",
] as const;

const PREPARATION_KEYWORDS = [
  "raw",
  "cooked",
  "grilled",
  "baked",
  "fried",
  "roasted",
  "boiled",
  "seared",
  "poached",
  "smoked",
] as const;

const CUT_OR_TYPE_KEYWORDS = [
  "breast",
  "thigh",
  "wing",
  "drumstick",
  "tenderloin",
  "sirloin",
  "ribeye",
  "loin",
  "chop",
  "shoulder",
  "ground",
  "mince",
  "dark meat",
  "light meat",
  "lean",
  "extra lean",
  "90/10",
  "93/7",
] as const;

const CEREAL_SPECIFICITY_KEYWORDS = [
  "frosted flakes",
  "cheerios",
  "raisin bran",
  "special k",
  "cinnamon toast crunch",
  "fruity pebbles",
  "cocoa pebbles",
  "coco puffs",
  "lucky charms",
  "granola",
  "muesli",
  "oatmeal",
  "bran flakes",
] as const;

export interface SpecificityResult {
  isSpecific: boolean;
  message: string | null;
}

function hasAnyKeyword(input: string, keywords: readonly string[]) {
  return keywords.some((keyword) => input.includes(keyword));
}

export function validateFoodSpecificity(text: string): SpecificityResult {
  const normalized = text.trim().toLowerCase();

  if (!normalized) {
    return { isSpecific: false, message: "Please add a food description." };
  }

  const containsMeat = hasAnyKeyword(normalized, MEAT_KEYWORDS);
  if (!containsMeat) {
    const mentionsCereal = normalized.includes("cereal");
    const hasCerealType = hasAnyKeyword(normalized, CEREAL_SPECIFICITY_KEYWORDS);

    if (mentionsCereal && !hasCerealType) {
      return {
        isSpecific: false,
        message:
          "Be specific for cereal entries: include brand/type (example: 100g Kellogg's Frosted Flakes).",
      };
    }

    return { isSpecific: true, message: null };
  }

  const hasPreparation = hasAnyKeyword(normalized, PREPARATION_KEYWORDS);
  const hasCutOrType = hasAnyKeyword(normalized, CUT_OR_TYPE_KEYWORDS);

  if (hasPreparation && hasCutOrType) {
    return { isSpecific: true, message: null };
  }

  return {
    isSpecific: false,
    message:
      "Be specific for meat entries: include cooked/raw and cut/type (example: 200g cooked chicken breast).",
  };
}
