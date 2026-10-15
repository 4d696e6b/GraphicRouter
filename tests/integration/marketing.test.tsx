import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { nextTab, prompts, searchContent } from "../../app/marketing/content";
import { tabletDeviceLayout, tabletStoryFrame } from "../../app/marketing/scene";
import { TabletStory } from "../../app/marketing/TabletStory";
import { copyPromptText } from "../../app/marketing/CopyPrompt";
import type { TabletData } from "../../app/marketing/types";

describe("marketing navigation and copy recovery", () => {
  it("searches actual questions and prompts with all query words", () => {
    expect(searchContent("violet headline").map(item => item.href)).toContain("#prompt-revise");
    expect(searchContent("fonts").map(item => item.href)).toContain("#faq-3");
    expect(searchContent("topic outcome").map(item => item.href)).toContain("/briefing");
    expect(searchContent("unmatched phrase")).toEqual([]);
    expect(searchContent("  ").length).toBeGreaterThan(5);
  });
  it("supports roving tab navigation, boundary keys, and leaves unrelated keys alone", () => {
    expect(nextTab("ArrowRight", 2, 3)).toBe(0);
    expect(nextTab("ArrowLeft", 0, 3)).toBe(2);
    expect(nextTab("Home", 2, 3)).toBe(0);
    expect(nextTab("End", 0, 3)).toBe(2);
    expect(nextTab("Tab", 0, 3)).toBeNull();
  });
  it("reports copy only after the write succeeds and provides fallback on denial", async () => {
    const write = vi.fn(async () => {});
    expect(await copyPromptText(prompts.revise, write)).toBe("copied");
    expect(write).toHaveBeenCalledWith(prompts.revise);
    expect(await copyPromptText(prompts.revise, async () => { throw new Error("Permission denied"); })).toBe("fallback");
  });
});

describe("tablet story framing and accessible fallback", () => {
  it.each([[1344, 820], [1184, 688], [704, 820], [390, 812], [360, 768], [720, 418]])("fits the actual %i × %i stage at maximum camera zoom", (width, height) => {
    const layout = tabletDeviceLayout(width, height);
    expect(layout.size * .57 * 1.2).toBeLessThanOrEqual(width - 32 + .01);
    expect(layout.size * .78 * 1.2).toBeLessThanOrEqual(height - 96 + .01);
    expect(layout.size).toBeGreaterThan(0);
  });
  it("pulls back for chapter changes and restores the same frame when scrolling backwards", () => {
    expect(tabletStoryFrame(.18).zoom).toBe(1);
    expect(tabletStoryFrame(.38).zoom).toBe(0);
    expect(tabletStoryFrame(.7).zoom).toBe(0);
    expect(tabletStoryFrame(.85).zoom).toBe(1);
    const middle = tabletStoryFrame(.5);
    expect(middle).toMatchObject({ chapter: 1, offset: 1 });
    tabletStoryFrame(.9);
    expect(tabletStoryFrame(.5)).toEqual(middle);
    expect(tabletStoryFrame(-1).chapter).toBe(0);
    expect(tabletStoryFrame(2).chapter).toBe(2);
    expect(tabletStoryFrame(NaN).progress).toBe(0);
  });
  it("has continuous bounded camera motion across both chapter transitions", () => {
    let previous = tabletStoryFrame(0);
    for (let n = 1; n <= 1000; n++) {
      const current = tabletStoryFrame(n / 1000);
      expect(current.zoom).toBeGreaterThanOrEqual(0); expect(current.zoom).toBeLessThanOrEqual(1);
      expect(Math.abs(current.zoom - previous.zoom)).toBeLessThan(.03);
      expect(current.offset - previous.offset).toBeGreaterThanOrEqual(0);
      expect(current.offset - previous.offset).toBeLessThan(.03);
      previous = current;
    }
  });
  it("renders all chapter explanations without JavaScript and hides transformed decoration from assistive technology", () => {
    const data: TabletData = { title: "Prepared test sample", idea: "Supplied facts", audience: "Judges", cover: "data:image/svg+xml,test", layout: "data:image/svg+xml,test", content: "data:image/svg+xml,test", finished: "data:image/svg+xml,test", violet: "data:image/svg+xml,violet" };
    const html = renderToStaticMarkup(<TabletStory data={data}/>);
    expect(html).toContain('aria-label="The tablet story in three chapters"');
    expect(html).toContain("01 / Brief"); expect(html).toContain("02 / Preview"); expect(html).toContain("03 / Refine");
    expect(html).toContain('data-chapter="0" aria-hidden="true"');
    expect(html).toContain("Earlier output is preserved.");
    expect(html).not.toContain("<button");
  });
});
