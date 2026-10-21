import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import HomeView from "../views/HomeView.vue";

describe("HomeView", () => {
  it("enables the create button once a pseudo is entered", async () => {
    const wrapper = mount(HomeView);
    const createButton = wrapper.get("button");
    expect(createButton.attributes("disabled")).toBeDefined();

    await wrapper.get("#pseudo").setValue("Camille");
    expect(createButton.attributes("disabled")).toBeUndefined();
  });

  it("prefills the room code from the invitation link", () => {
    const wrapper = mount(HomeView, { props: { code: "AB12CD" } });
    expect(wrapper.get("#room-code").element.value).toBe("AB12CD");
  });
});
