const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const shots = path.resolve("test/shots");
fs.mkdirSync(shots, { recursive: true });

const errors = [];
const logs = [];

function sample(file) {
  const { execFileSync } = require("child_process");
  const bin = fs.existsSync("/usr/bin/magick") ? "magick" : "convert";
  const mean = execFileSync(bin, [file, "-format", "%[fx:mean]", "info:"]).toString().trim();
  const std = execFileSync(bin, [file, "-format", "%[fx:standard_deviation]", "info:"]).toString().trim();
  return { mean: Number(mean), std: Number(std) };
}

async function shot(page, name) {
  const file = path.join(shots, name);
  await page.screenshot({ path: file });
  const stats = sample(file);
  console.log("shot", name, JSON.stringify(stats));
  if (!(stats.std > 0.02)) errors.push(name + " looks blank std=" + stats.std);
  return file;
}

(async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ["--use-angle=swiftshader", "--enable-webgl", "--ignore-gpu-blocklist", "--enable-unsafe-swiftshader"],
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  page.on("pageerror", (err) => errors.push("pageerror: " + err.message));
  page.on("console", (msg) => {
    if (msg.type() === "error") logs.push(msg.text());
  });
  await page.goto("file:///workspace/web/index.html", { waitUntil: "load", timeout: 30000 });
  await page.waitForFunction(() => window.__PC && window.__PC.getState().booted, null, { timeout: 30000 });
  const menu = await page.evaluate(() => ({
    title: document.querySelector("h1") && document.querySelector("h1").textContent,
    play: !!document.querySelector("#play"),
    hidden: document.querySelector("#menu").hidden,
  }));
  console.log("menu", JSON.stringify(menu));
  await shot(page, "menu.png");
  await page.click("#play");
  await page.waitForTimeout(400);
  const test = await page.evaluate(async () => window.__PC.selfTest());
  console.log("selfTest", JSON.stringify(test));
  if (!test.ok) errors.push("selfTest " + test.failures.join(" | "));
  await page.evaluate(() => {
    const pc = window.__PC;
    document.getElementById("hint").classList.remove("show");
    document.getElementById("lockhint").classList.remove("show");
    document.querySelectorAll(".floater").forEach((el) => el.remove());
    pc.pines.length = 0;
    for (const p of pc.pandas) {
      p.throwCd = 99;
      p.windup = 0;
      if (p.fruit) p.fruit.visible = false;
    }
    pc.resetSpawn();
    const front = pc.pandas.find((p) => p.alive);
    if (front) pc.aimAt(front.body.x, front.body.y + 1.05, front.body.z);
  });
  await page.waitForTimeout(200);
  const state = await page.evaluate(() => window.__PC.getState());
  console.log("state", JSON.stringify(state));
  await shot(page, "desktop.png");
  await page.evaluate(() => window.__PC.setDebug(true));
  await page.waitForTimeout(150);
  await shot(page, "debug.png");
  await page.evaluate(() => window.__PC.setDebug(false));

  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => window.__PC.setTouch(true));
  await page.waitForTimeout(200);
  const touch = await page.evaluate(() => ({
    joy: getComputedStyle(document.getElementById("joystick")).display,
    actions: getComputedStyle(document.getElementById("actions")).display,
    guard: document.querySelector("#btn-place span").textContent,
    hotbar: document.querySelectorAll("#hotbar .slot").length,
  }));
  console.log("touch", JSON.stringify(touch));
  if (touch.joy === "none" || touch.actions === "none") errors.push("touch controls hidden " + JSON.stringify(touch));
  if (touch.guard !== "Guard") errors.push("sword place label is " + touch.guard);
  if (touch.hotbar !== 9) errors.push("hotbar " + touch.hotbar);
  const stick = await page.evaluate(async () => {
    const pc = window.__PC;
    pc.resetSpawn();
    const z0 = pc.player.z;
    const joy = document.getElementById("joystick");
    const rect = joy.getBoundingClientRect();
    const opts = {
      pointerId: 1,
      bubbles: true,
      clientX: rect.left + rect.width / 2,
      clientY: rect.top + 16,
      isPrimary: true,
    };
    joy.dispatchEvent(new PointerEvent("pointerdown", opts));
    await new Promise((r) => setTimeout(r, 450));
    joy.dispatchEvent(new PointerEvent("pointerup", { pointerId: 1, bubbles: true, clientX: opts.clientX, clientY: opts.clientY }));
    return { z0, z1: pc.player.z, dz: pc.player.z - z0 };
  });
  console.log("stick", JSON.stringify(stick));
  if (!(stick.dz < -0.4)) errors.push("joystick did not move forward " + JSON.stringify(stick));
  await page.evaluate(() => window.__PC.resetSpawn());
  await page.waitForTimeout(150);
  await shot(page, "mobile.png");

  await page.evaluate(() => window.__PC.selectSlot(4));
  await page.setViewportSize({ width: 844, height: 390 });
  await page.waitForTimeout(200);
  const placeLabel = await page.evaluate(() => document.querySelector("#btn-place span").textContent);
  console.log("landscape place label", placeLabel);
  if (placeLabel !== "Place") errors.push("dirt place label is " + placeLabel);
  await shot(page, "landscape.png");

  const gl = await page.evaluate(() => {
    const r = window.__PC.renderer;
    const ctx = r.getContext();
    return ctx ? ctx.getParameter(ctx.VERSION) : "no context";
  });
  console.log("gl", gl);
  if (!gl || gl === "no context") errors.push("no webgl");

  await browser.close();
  if (logs.length) console.log("console", logs.slice(0, 12).join("\n"));
  if (errors.length) {
    console.error("VERIFY FAIL\n" + errors.join("\n"));
    process.exit(1);
  }
  console.log("verify ok");
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
