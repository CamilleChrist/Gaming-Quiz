import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import GameResults from "../components/GameResults.vue";

describe("GameResults", () => {
  it("announces a tie and shows the shared rank on the podium", () => {
    // Les rangs sont calculés par RoomView
    const ranking = [
      { id: "a", name: "Alice", score: 300, rank: 1 },
      { id: "b", name: "Bob", score: 300, rank: 1 },
      { id: "c", name: "Chloé", score: 100, rank: 3 },
    ];
    const wrapper = mount(GameResults, { props: { ranking, playerId: "a" } });

    expect(wrapper.text()).toContain("Égalité entre Alice et Bob");
    const ranks = wrapper.findAll("li").map((item) => item.text().trim().slice(-1));
    expect(ranks).toEqual(["1", "1", "3"]);
  });
});
