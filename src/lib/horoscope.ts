import { NAKSHATRAS, PORUTHAMS } from "@/lib/constants";
import type { Porutham } from "@/types";

/**
 * Nakshatra (star) compatibility table based on traditional Tamil astrology.
 * Each nakshatra is assigned a numeric index (0-26) from the NAKSHATRAS array.
 * Compatibility is calculated using traditional rules for each porutham.
 */

// Gana classification: Deva (0), Manushya (1), Rakshasa (2)
const GANA_MAP: Record<string, number> = {
  Ashwini: 0, Mrigashira: 0, Punarvasu: 0, Pushya: 0,
  Hasta: 0, Swati: 0, Anuradha: 0, Shravana: 0, Revati: 0,
  Bharani: 1, Rohini: 1, Ardra: 1, "Purva Phalguni": 1,
  "Uttara Phalguni": 1, "Purva Ashadha": 1, "Uttara Ashadha": 1,
  "Purva Bhadrapada": 1, "Uttara Bhadrapada": 1,
  Krittika: 2, Ashlesha: 2, Magha: 2, Chitra: 2,
  Vishakha: 2, Jyeshtha: 2, Mula: 2, Dhanishta: 2, Shatabhisha: 2,
};

// Yoni (animal) classification
const YONI_MAP: Record<string, string> = {
  Ashwini: "horse", Bharani: "elephant", Krittika: "goat", Rohini: "serpent",
  Mrigashira: "serpent", Ardra: "dog", Punarvasu: "cat", Pushya: "goat",
  Ashlesha: "cat", Magha: "rat", "Purva Phalguni": "rat",
  "Uttara Phalguni": "cow", Hasta: "buffalo", Chitra: "tiger",
  Swati: "buffalo", Vishakha: "tiger", Anuradha: "deer",
  Jyeshtha: "deer", Mula: "dog", "Purva Ashadha": "monkey",
  "Uttara Ashadha": "mongoose", Shravana: "monkey", Dhanishta: "lion",
  Shatabhisha: "horse", "Purva Bhadrapada": "lion",
  "Uttara Bhadrapada": "cow", Revati: "elephant",
};

// Yoni enemy pairs
const YONI_ENEMIES = new Set([
  "horse-buffalo", "buffalo-horse",
  "elephant-lion", "lion-elephant",
  "goat-monkey", "monkey-goat",
  "serpent-mongoose", "mongoose-serpent",
  "dog-deer", "deer-dog",
  "cat-rat", "rat-cat",
  "tiger-cow", "cow-tiger",
]);

// Rashi lord mapping
const RASHI_LORD: Record<string, string> = {
  "Mesha (Aries)": "Mars", "Vrishabha (Taurus)": "Venus",
  "Mithuna (Gemini)": "Mercury", "Karka (Cancer)": "Moon",
  "Simha (Leo)": "Sun", "Kanya (Virgo)": "Mercury",
  "Tula (Libra)": "Venus", "Vrischika (Scorpio)": "Mars",
  "Dhanu (Sagittarius)": "Jupiter", "Makara (Capricorn)": "Saturn",
  "Kumbha (Aquarius)": "Saturn", "Meena (Pisces)": "Jupiter",
};

// Friendly planet pairs
const PLANET_FRIENDS = new Set([
  "Sun-Moon", "Moon-Sun", "Sun-Mars", "Mars-Sun", "Sun-Jupiter", "Jupiter-Sun",
  "Moon-Mercury", "Mercury-Moon", "Moon-Jupiter", "Jupiter-Moon",
  "Mars-Jupiter", "Jupiter-Mars", "Mercury-Venus", "Venus-Mercury",
  "Jupiter-Saturn", "Saturn-Jupiter", "Venus-Saturn", "Saturn-Venus",
]);

// Vasya mapping
const VASYA_MAP: Record<string, string[]> = {
  "Mesha (Aries)": ["Simha (Leo)", "Vrischika (Scorpio)"],
  "Vrishabha (Taurus)": ["Karka (Cancer)", "Tula (Libra)"],
  "Mithuna (Gemini)": ["Kanya (Virgo)"],
  "Karka (Cancer)": ["Vrischika (Scorpio)", "Dhanu (Sagittarius)"],
  "Simha (Leo)": ["Tula (Libra)"],
  "Kanya (Virgo)": ["Mithuna (Gemini)", "Meena (Pisces)"],
  "Tula (Libra)": ["Makara (Capricorn)", "Kanya (Virgo)"],
  "Vrischika (Scorpio)": ["Karka (Cancer)"],
  "Dhanu (Sagittarius)": ["Meena (Pisces)"],
  "Makara (Capricorn)": ["Mesha (Aries)", "Kumbha (Aquarius)"],
  "Kumbha (Aquarius)": ["Mesha (Aries)"],
  "Meena (Pisces)": ["Makara (Capricorn)"],
};

// Rajju groups
const RAJJU_MAP: Record<string, string> = {
  Ashwini: "foot", Ashlesha: "foot", Magha: "foot", Jyeshtha: "foot",
  Mula: "foot", Revati: "foot",
  Bharani: "hip", Pushya: "hip", "Purva Phalguni": "hip",
  Anuradha: "hip", "Purva Ashadha": "hip", "Uttara Bhadrapada": "hip",
  Krittika: "navel", Punarvasu: "navel", "Uttara Phalguni": "navel",
  Vishakha: "navel", "Uttara Ashadha": "navel", "Purva Bhadrapada": "navel",
  Rohini: "neck", Ardra: "neck", Hasta: "neck", Swati: "neck",
  Shravana: "neck", Shatabhisha: "neck",
  Mrigashira: "head", Chitra: "head", Dhanishta: "head",
};

// Vedha (obstruction) pairs
const VEDHA_PAIRS: [string, string][] = [
  ["Ashwini", "Jyeshtha"], ["Bharani", "Anuradha"],
  ["Krittika", "Vishakha"], ["Rohini", "Swati"],
  ["Ardra", "Shravana"], ["Punarvasu", "Uttara Ashadha"],
  ["Pushya", "Purva Ashadha"], ["Ashlesha", "Mula"],
  ["Magha", "Revati"], ["Purva Phalguni", "Uttara Bhadrapada"],
  ["Uttara Phalguni", "Purva Bhadrapada"], ["Hasta", "Shatabhisha"],
  ["Mrigashira", "Dhanishta"], ["Chitra", ""],
];

function getStarIndex(star: string): number {
  return NAKSHATRAS.indexOf(star as any);
}

/**
 * Compute the 10 poruthams between two profiles.
 */
export function computePoruthams(
  starA: string,
  starB: string,
  rashiA: string,
  rashiB: string
): { poruthams: Porutham[]; matchedCount: number; totalCount: number } {
  const idxA = getStarIndex(starA);
  const idxB = getStarIndex(starB);
  const hasBothStars = idxA >= 0 && idxB >= 0;

  const results: Porutham[] = PORUTHAMS.map((p, i) => {
    let isCompatible: boolean | "partial" = "partial";
    let description = "";

    if (!hasBothStars) {
      description = "Star data incomplete for one or both profiles.";
      return { name: p.name, tamilName: p.tamilName, isCompatible: "partial", description };
    }

    switch (i) {
      case 0: {
        // Dina Porutham — count from bride's star to groom's, mod 9
        const diff = ((idxB - idxA + 27) % 27) + 1;
        const remainder = diff % 9;
        isCompatible = remainder !== 2 && remainder !== 4 && remainder !== 6 && remainder !== 8;
        description = isCompatible
          ? "Day compatibility is favorable."
          : "Day compatibility is unfavorable.";
        break;
      }
      case 1: {
        // Gana Porutham
        const gA = GANA_MAP[starA] ?? 1;
        const gB = GANA_MAP[starB] ?? 1;
        if (gA === gB) {
          isCompatible = true;
          description = "Same Gana — excellent temperament match.";
        } else if ((gA === 0 && gB === 1) || (gA === 1 && gB === 0)) {
          isCompatible = true;
          description = "Deva-Manushya combination — compatible.";
        } else if ((gA === 0 && gB === 2) || (gA === 2 && gB === 0)) {
          isCompatible = false;
          description = "Deva-Rakshasa combination — not ideal.";
        } else {
          isCompatible = "partial";
          description = "Mixed Gana — partially compatible.";
        }
        break;
      }
      case 2: {
        // Mahendra Porutham
        const diff = ((idxB - idxA + 27) % 27) + 1;
        isCompatible = diff % 7 === 1 || diff % 7 === 3 || diff % 7 === 5;
        description = isCompatible
          ? "Mahendra match ensures prosperity and longevity."
          : "Mahendra not matched — not critical.";
        break;
      }
      case 3: {
        // Stree Deergha
        const diff = ((idxB - idxA + 27) % 27);
        isCompatible = diff >= 13;
        if (!isCompatible && diff >= 7) isCompatible = "partial";
        description = isCompatible === true
          ? "Stree Deergha — favorable for the bride's well-being."
          : isCompatible === "partial"
          ? "Stree Deergha partially met."
          : "Stree Deergha not met.";
        break;
      }
      case 4: {
        // Yoni Porutham
        const yA = YONI_MAP[starA] || "unknown";
        const yB = YONI_MAP[starB] || "unknown";
        if (yA === yB) {
          isCompatible = true;
          description = "Same Yoni — excellent physical and emotional compatibility.";
        } else if (YONI_ENEMIES.has(`${yA}-${yB}`)) {
          isCompatible = false;
          description = "Enemy Yoni — potential conflict in compatibility.";
        } else {
          isCompatible = "partial";
          description = "Neutral Yoni — acceptable match.";
        }
        break;
      }
      case 5: {
        // Rasi Porutham
        if (!rashiA || !rashiB) {
          isCompatible = "partial";
          description = "Rashi data incomplete.";
        } else {
          const rashis = [
            "Mesha (Aries)", "Vrishabha (Taurus)", "Mithuna (Gemini)",
            "Karka (Cancer)", "Simha (Leo)", "Kanya (Virgo)",
            "Tula (Libra)", "Vrischika (Scorpio)", "Dhanu (Sagittarius)",
            "Makara (Capricorn)", "Kumbha (Aquarius)", "Meena (Pisces)",
          ];
          const rA = rashis.indexOf(rashiA);
          const rB = rashis.indexOf(rashiB);
          if (rA < 0 || rB < 0) {
            isCompatible = "partial";
            description = "Rashi not recognized.";
          } else {
            const diff = ((rB - rA + 12) % 12) + 1;
            isCompatible = [1, 2, 3, 4, 5, 7, 9, 11].includes(diff);
            description = isCompatible
              ? "Rashi positions are harmonious."
              : "Rashi positions indicate some tension.";
          }
        }
        break;
      }
      case 6: {
        // Rasiyathipathi (Rashi lord compatibility)
        if (!rashiA || !rashiB) {
          isCompatible = "partial";
          description = "Rashi data needed for lord analysis.";
        } else {
          const lordA = RASHI_LORD[rashiA] || "";
          const lordB = RASHI_LORD[rashiB] || "";
          if (!lordA || !lordB) {
            isCompatible = "partial";
            description = "Cannot determine Rashi lords.";
          } else if (lordA === lordB) {
            isCompatible = true;
            description = "Same Rashi lord — natural harmony.";
          } else if (PLANET_FRIENDS.has(`${lordA}-${lordB}`)) {
            isCompatible = true;
            description = `${lordA} and ${lordB} are friendly planets.`;
          } else {
            isCompatible = false;
            description = `${lordA} and ${lordB} are not naturally friendly.`;
          }
        }
        break;
      }
      case 7: {
        // Vasya Porutham
        if (!rashiA || !rashiB) {
          isCompatible = "partial";
          description = "Rashi data needed for Vasya analysis.";
        } else {
          const vasyaA = VASYA_MAP[rashiA] || [];
          const vasyaB = VASYA_MAP[rashiB] || [];
          if (vasyaA.includes(rashiB) || vasyaB.includes(rashiA)) {
            isCompatible = true;
            description = "Vasya compatibility present — mutual attraction.";
          } else if (rashiA === rashiB) {
            isCompatible = true;
            description = "Same Rashi — Vasya naturally matched.";
          } else {
            isCompatible = false;
            description = "No Vasya compatibility between these Rashis.";
          }
        }
        break;
      }
      case 8: {
        // Rajju Porutham
        const rajjuA = RAJJU_MAP[starA] || "";
        const rajjuB = RAJJU_MAP[starB] || "";
        if (!rajjuA || !rajjuB) {
          isCompatible = "partial";
          description = "Cannot determine Rajju group.";
        } else {
          isCompatible = rajjuA !== rajjuB;
          description = isCompatible
            ? "Different Rajju groups — safe and compatible."
            : "Same Rajju group — considered inauspicious in tradition.";
        }
        break;
      }
      case 9: {
        // Vedha Porutham
        const hasVedha = VEDHA_PAIRS.some(
          ([a, b]) =>
            (a === starA && b === starB) || (a === starB && b === starA)
        );
        isCompatible = !hasVedha;
        description = isCompatible
          ? "No Vedha obstruction — compatible."
          : "Vedha obstruction detected between these stars.";
        break;
      }
    }

    return { name: p.name, tamilName: p.tamilName, isCompatible, description };
  });

  const matchedCount = results.filter((p) => p.isCompatible === true).length;
  return { poruthams: results, matchedCount, totalCount: results.length };
}

/**
 * Generate dosham compatibility result text.
 */
export function doshamResult(
  doshamA: boolean | null,
  doshamB: boolean | null
): string {
  if (doshamA === false && doshamB === false) return "Neither has dosham — no concerns.";
  if (doshamA === true && doshamB === true) return "Both have dosham — cancels out, acceptable.";
  if (doshamA === true || doshamB === true) return "One has dosham — consult an astrologer.";
  return "Dosham status unknown for one or both — verify with horoscope.";
}
