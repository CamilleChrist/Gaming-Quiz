import { describe, it, expect } from "vitest";
import { normalizeTitle, isCorrectAnswer } from "../services/rawg";

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
