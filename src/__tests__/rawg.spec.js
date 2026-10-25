import { describe, it, expect } from "vitest";
import { normalizeTitle, isCorrectAnswer, computePoints } from "../services/rawg";

describe("normalizeTitle", () => {
  it("removes case, accents, apostrophes and punctuation", () => {
    expect(normalizeTitle("  Pokémon Gold, Silver ")).toBe("pokemon gold silver");
    expect(normalizeTitle("Baldur's Gate III")).toBe("baldurs gate iii");
  });
});

describe("isCorrectAnswer", () => {
  it("accepts the full title written loosely", () => {
    expect(isCorrectAnswer("the witcher 3 wild hunt", "The Witcher 3: Wild Hunt")).toBe(true);
  });

  it("accepts the main part of the title", () => {
    expect(isCorrectAnswer("The Witcher 3", "The Witcher 3: Wild Hunt")).toBe(true);
    expect(isCorrectAnswer("God of War", "God of War (2018)")).toBe(true);
  });

  it("rejects a wrong or empty answer", () => {
    expect(isCorrectAnswer("The Witcher", "The Witcher 3: Wild Hunt")).toBe(false);
    expect(isCorrectAnswer("  ", "Portal")).toBe(false);
  });
});

describe("computePoints", () => {
  it("gives nothing for a wrong answer", () => {
    expect(computePoints("Portal", "Half-Life 2", 30, 30)).toBe(0);
  });

  it("adds a speed bonus to a correct answer", () => {
    expect(computePoints("Portal", "Portal", 30, 30)).toBe(150);
    expect(computePoints("Portal", "Portal", 15, 30)).toBe(125);
    expect(computePoints("Portal", "Portal", 0, 30)).toBe(100);
  });
});
