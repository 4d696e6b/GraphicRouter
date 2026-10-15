import { readFile, access } from "node:fs/promises";
import { resolve, sep } from "node:path";
import { describe, expect, it, vi } from "vitest";
import config from "../../website/site.config.js";
import { renderWebsite } from "../../scripts/static-site-template.mjs";
import { downloadAction, validateConfig } from "../../scripts/static-site-release.mjs";
import { nextTab, copyText } from "../../website/interactions.js";
import { tabletDeviceLayout, tabletStoryFrame } from "../../website/scene.js";
import { readPptx } from "../engine/read-pptx";

const directory = resolve("website");
const html = await readFile(resolve(directory, "index.html"), "utf8");
const basic = await readFile(resolve(directory, "basic.html"), "utf8");
const data = JSON.parse(await readFile(resolve(directory, "assets/example-data.json"), "utf8"));

describe("standalone distribution surface", () => {
  it("keeps release config and authored HTML in sync without runtime initialization", () => {
    expect(renderWebsite(config, data)).toBe(html);
    expect(config.downloadUrl).toBeNull();
    expect(config.connectionUrl).toBe("https://chatgpt.com/plugins/plugin_asdk_app_sites_801c42220f4c8191bc43e3442008fd98");
    expect(html).not.toContain("data-plugin-download");
    expect(html).not.toContain("Download coming soon");
    expect(html.match(/data-plugin-connect href=/g)).toHaveLength(4);
    expect(html).toContain('href="https://graphicrouter.blue-hare-8389.chatgpt.site/install"');
    expect(html).toContain("Sample files only — not the plugin installer.");
  });
  it("authors every configured official download into HTML and omits cross-origin download attributes", () => {
    const release = { ...config, downloadUrl: "https://example.test/official-plugin.zip", releaseVersion: "1.2.3", supportedHostLabel: "Test host", availabilityNote: "Test fixture release", installationSteps: [{ title: "Download", text: "Test package" }, { title: "Install", text: "Test host" }, { title: "Open", text: "Test prompt" }] };
    const rendered = renderWebsite(release, data);
    expect(rendered.match(/data-plugin-download href="https:\/\/example.test\/official-plugin.zip"/g)).toHaveLength(4);
    expect(rendered).not.toContain('href="https://example.test/official-plugin.zip" download');
    expect(downloadAction({ ...release, downloadUrl: "assets/official-plugin.zip", downloadFileName: "official-plugin.zip" })).toContain('href="assets/official-plugin.zip" download="official-plugin.zip"');
  });
  it.each(["#", "javascript:alert(1)", "assets/../private.zip", "https://example.test/slides.pptx", "https://github.com/example/repo/archive/main.zip"])("rejects a misleading or unsafe artifact: %s", downloadUrl => {
    expect(() => validateConfig({ ...config, downloadUrl, supportedHostLabel: "Test host" })).toThrow();
  });
  it("retains an honest unavailable state when neither connection nor installer is configured", () => {
    const rendered = renderWebsite({ ...config, connectionUrl: null, setupUrl: null }, data);
    expect(rendered).toContain('disabled aria-describedby="download-status">Download coming soon');
    expect(rendered).not.toContain("data-plugin-connect");
  });
  it.each(["javascript:alert(1)", "//example.test/plugin", "https://example.test/\nplugin"])("rejects unsafe connection links: %s", connectionUrl => {
    expect(() => validateConfig({ ...config, connectionUrl })).toThrow();
  });
  it("works at a subdirectory using existing local files, without application endpoints", async () => {
    const origin = "https://example.test/nested/graphicrouter/";
    for (const [, value] of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
      if (value.startsWith("#") || value.startsWith("https://")) continue;
      const url = new URL(value, origin);
      expect(url.pathname).toContain("/nested/graphicrouter/");
      const file = resolve(directory, value); expect(file.startsWith(directory + sep)).toBe(true); await access(file);
    }
    for (const name of ["main.js", "interactions.js", "scene.js", "homepage-motion.js", "index.html", "basic.html"]) {
      const text = await readFile(resolve(directory, name), "utf8");
      expect(text).not.toMatch(/engine-provider|from\s+["']react|\/api\/|\/mcp\b|\/briefing\b|CANVA_CLIENT_SECRET|fetch\s*\(|XMLHttpRequest|WebSocket/);
    }
  });
  it("retains essentials, native navigation and all examples in a script-free page", () => {
    expect(basic).not.toMatch(/<script\b/);
    expect(basic).toContain(config.headline[0]); expect(basic).toContain('id="download"');
    expect(basic).toContain("Workflow illustration");
    expect(basic).not.toContain("tabletDevice");
    expect(basic).not.toContain("homepage-motion.js");
    expect(basic).toContain('class="mobileMenu"'); expect(basic).toContain("Hosted ChatGPT plugin");
    expect(basic.match(/data-plugin-connect href=/g)).toHaveLength(4);
    expect(basic).toContain("A designer’s process.");
    expect(basic).toContain(".showcasePanel[hidden]{display:grid!important}");
    expect(basic).toContain("Prepared after example:");
  });
  it("ships a real sample PowerPoint separately from the hosted plugin", async () => {
    const bytes = await readFile(resolve(directory, "assets/sample-presentation.pptx"));
    const parts = readPptx(bytes);
    expect([...parts.keys()].filter(key => /^ppt\/slides\/slide\d+\.xml$/.test(key))).toHaveLength(5);
    expect(parts.get("ppt/presentation.xml")).toContain("p:sldSz");
    expect(await readFile(resolve(directory, "assets/sample-speaker-notes.txt"), "utf8")).toContain("Expanded notes");
    expect(await readFile(resolve(directory, "assets/slide-3-violet.svg"), "utf8")).toContain("#7C3AED");
  });
});

describe("static-only enhancements", () => {
  it("supports roving tabs and clipboard recovery without a service", async () => {
    expect(nextTab("ArrowRight", 2, 3)).toBe(0); expect(nextTab("ArrowLeft", 0, 3)).toBe(2);
    expect(nextTab("Home", 2, 3)).toBe(0); expect(nextTab("End", 0, 3)).toBe(2); expect(nextTab("Tab", 0, 3)).toBeNull();
    const write = vi.fn(async () => {}); expect(await copyText("example", write)).toBe("copied"); expect(write).toHaveBeenCalledWith("example");
    expect(await copyText("example", async () => { throw new Error("Denied"); })).toBe("fallback");
  });
  it("frames short/mobile stages and reverses chapter progress deterministically", () => {
    for (const [width, height] of [[1344, 820], [1184, 688], [390, 812], [360, 768], [640, 328]]) {
      const { size } = tabletDeviceLayout(width, height);
      expect(size * .57 * 1.2).toBeLessThanOrEqual(width - 32 + .01);
      expect(size * .78 * 1.2).toBeLessThanOrEqual(height - 96 + .01);
    }
    const middle = tabletStoryFrame(.5); tabletStoryFrame(.9); expect(tabletStoryFrame(.5)).toEqual(middle);
    expect(middle.chapter).toBe(1); expect(tabletStoryFrame(.9).chapter).toBe(2);
    expect(tabletStoryFrame(.38).zoom).toBe(0); expect(tabletStoryFrame(NaN).progress).toBe(0);
  });
});
