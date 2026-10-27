// Browser smoke check using Chromium's DevTools protocol, without extra packages.
// Start `npm run preview` and Chromium with --remote-debugging-port=9223 first.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { once } = require("node:events");

async function main() {
  const origin = process.env.DISTILAB_SMOKE_URL || "http://127.0.0.1:8082";
  const tabs = await (await fetch("http://127.0.0.1:9223/json/list")).json();
  const tab = tabs.find(
    (item) => item.type === "page" && item.url.startsWith(origin),
  );
  assert(tab, `Open ${origin} in the debugging browser first.`);
  const socket = new WebSocket(tab.webSocketDebuggerUrl);
  await once(socket, "open");
  let id = 0;
  const pending = new Map();
  const errors = [];
  socket.addEventListener("message", ({ data }) => {
    const message = JSON.parse(data);
    if (message.method === "Runtime.exceptionThrown")
      errors.push(message.params.exceptionDetails);
    const call = pending.get(message.id);
    if (call) {
      pending.delete(message.id);
      clearTimeout(call.timeout);
      if (message.error) call.reject(new Error(JSON.stringify(message.error)));
      else call.resolve(message.result);
    }
  });
  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const key = ++id;
      const timeout = setTimeout(() => {
        pending.delete(key);
        reject(new Error(`Timeout: ${method}`));
      }, 12000);
      pending.set(key, { resolve, reject, timeout });
      socket.send(JSON.stringify({ id: key, method, params }));
    });
  const evaluate = async (expression) => {
    const answer = await send("Runtime.evaluate", {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (answer.exceptionDetails)
      throw new Error(JSON.stringify(answer.exceptionDetails));
    return answer.result.value;
  };
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const waitFor = async (text) => {
    for (let i = 0; i < 60; i++) {
      if (
        await evaluate(
          `document.body.innerText.includes(${JSON.stringify(text)})`,
        )
      )
        return;
      await delay(150);
    }
    throw new Error(
      `Text not found: ${text}\n${await evaluate("document.body.innerText")}`,
    );
  };
  const click = async (label) => {
    const found = await evaluate(`(() => {
      const nodes = [...document.querySelectorAll('[role="button"], [role="tab"], [role="radio"], button')];
      const node = nodes.filter(n => !n.closest('[aria-hidden="true"]') && n.getClientRects().length > 0).findLast(n => n.getAttribute('aria-label') === ${JSON.stringify(label)} || n.textContent.trim() === ${JSON.stringify(label)});
      if (!node) return false;
      node.click(); return true;
    })()`);
    assert(found, `Clickable control missing: ${label}`);
    await delay(350);
  };
  const output = process.env.DISTILAB_SMOKE_OUTPUT
    ? path.resolve(process.env.DISTILAB_SMOKE_OUTPUT)
    : path.resolve(__dirname, "../artifacts/worksheet-browser");
  fs.mkdirSync(output, { recursive: true });
  const screenshot = async (name) => {
    const image = await send("Page.captureScreenshot", {
      format: "png",
      captureBeyondViewport: false,
    });
    fs.writeFileSync(
      path.join(output, name),
      Buffer.from(image.data, "base64"),
    );
  };
  const checkWidth = async () => {
    const sizes = await evaluate(
      "({viewport:innerWidth,content:document.documentElement.scrollWidth})",
    );
    assert(
      sizes.content <= sizes.viewport + 1,
      `Page overflows horizontally: ${JSON.stringify(sizes)}`,
    );
  };
  try {
    await send("Runtime.enable");
    await send("Page.enable");
    await send("Emulation.setDeviceMetricsOverride", {
      width: 390,
      height: 844,
      deviceScaleFactor: 1,
      mobile: true,
    });
    await send("Page.navigate", { url: origin });
    await waitFor("Data kasus");
    await send("Page.handleJavaScriptDialog", { accept: true }).catch(() => {});
    await evaluate("globalThis.confirm = () => true");
    if (process.argv.includes("--inspect")) {
      console.log(await evaluate("document.body.innerText"));
      return;
    }
    await checkWidth();
    await screenshot("ui-home-mobile.png");
    await click("Pengaturan model & data contoh");
    await waitFor("Isi data demonstrasi");
    await click("Isi data demonstrasi");
    // The previous method is persisted locally; do not assume a fresh session.
    await click("McCabe–Thiele");
    await click("Hitung kolom");
    await waitFor("tahap teoritis bulat");
    await checkWidth();
    await screenshot("ui-result-mobile.png");
    const summary = await evaluate("document.body.innerText");
    assert(summary.includes("Jumlah tray aktual memerlukan efisiensi tray"));
    assert(!summary.includes("Toleransi algoritma"));
    await click("Perhitungan");
    await waitFor("Garis operasi bagian atas");
    await evaluate(
      `([...document.querySelectorAll('[role="button"]')].find(n => /Garis operasi bagian atas/.test(n.getAttribute('aria-label') || ''))).click()`,
    );
    await waitFor("SUBSTITUSI");
    await checkWidth();
    await screenshot("ui-equations-mobile.png");
    assert(await evaluate("document.body.innerText.includes('Arti simbol')"));
    await click("Detail numerik & ketelitian");
    await waitFor("Toleransi algoritma");
    await click("Ubah parameter");
    await waitFor("Data kasus");
    await click("FUG");
    await click("Hitung kolom");
    await waitFor("tahap teoritis bulat");
    await click("Perhitungan");
    await waitFor("Fenske · tahap minimum");
    await evaluate(
      `([...document.querySelectorAll('[role="button"]')].find(n => /Fenske · tahap minimum/.test(n.getAttribute('aria-label') || ''))).click()`,
    );
    await waitFor("SUBSTITUSI");
    await checkWidth();
    await screenshot("ui-fug-mobile.png");
    await send("Emulation.setDeviceMetricsOverride", {
      width: 320,
      height: 740,
      deviceScaleFactor: 1,
      mobile: true,
    });
    await delay(250);
    await checkWidth();
    assert.equal(errors.length, 0, JSON.stringify(errors));
    const report = {
      success: true,
      methods: ["McCabe–Thiele", "FUG"],
      mobileWidths: [390, 320],
      uncaughtErrors: errors.length,
      summary,
    };
    fs.writeFileSync(
      path.join(output, "ui-browser-smoke.json"),
      JSON.stringify(report, null, 2),
    );
    console.log(
      "Browser smoke passed: worksheet, demo input, McCabe/FUG results, expandable equations, audit disclosure, mobile width, no uncaught errors.",
    );
  } finally {
    socket.close();
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
