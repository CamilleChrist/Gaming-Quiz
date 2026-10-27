import { describe, it, expect } from "vitest";
import { normalizeTitle, computePoints, scoreRound } from "../services/rawg";

describe("normalizeTitle", () => {
  it("removes case, accents, apostrophes and punctuation", () => {
    expect(normalizeTitle("  Pokémon Gold, Silver ")).toBe("pokemon gold silver");
    expect(normalizeTitle("Baldur's Gate III")).toBe("baldurs gate iii");
  });
});

describe("computePoints", () => {
  const zelda = "The Legend of Zelda: Breath of the Wild";

  it("gives 100 for every word found, in any order, without accents or punctuation", () => {
    expect(computePoints("the legend of zelda breath of the wild", zelda)).toBe(100);
    expect(computePoints("Pokemon Gold", "Pokémon Gold")).toBe(100);
  });

  it("shares the points between the title words", () => {
    expect(computePoints("Zelda Breath of the Wild", zelda)).toBe(63); // 5 mots sur 8 = 62,5
    expect(computePoints("zelda", zelda)).toBe(13);
  });

  it("counts a repeated word only as often as in the title", () => {
    expect(computePoints("the the the the", zelda)).toBe(25); // « the » apparaît 2 fois
  });

  it("gives nothing for a wrong or empty answer", () => {
    expect(computePoints("Portal", "Half-Life 2")).toBe(0);
    expect(computePoints("  ", "Portal")).toBe(0);
  });
});

describe("scoreRound", () => {
  it("adds 50, 30 and 10 to the three fastest players who found the full title", () => {
    const answers = [
      { uid: "late", text: "Portal 2", submittedAt: 5 },
      { uid: "partial", text: "Portal 3", submittedAt: 0 },
      { uid: "first", text: "Portal 2", submittedAt: 2 },
      { uid: "second", text: "Portal 2", submittedAt: 3 },
      { uid: "third", text: "Portal 2", submittedAt: 4 },
    ];
    expect(scoreRound(answers, "Portal 2")).toEqual({ partial: 50, first: 150, second: 130, third: 110, late: 100 });
  });
});
