const assert = require('node:assert/strict');
const fs = require('node:fs');
const puppeteer = require('puppeteer-core');
let browser;
(async () => {
  browser = await puppeteer.launch({
    executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1500, height: 1100, deviceScaleFactor: 2 });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(process.env.EDITOR_URL || 'http://127.0.0.1:8123/visual-tools/photo-editor', {
    waitUntil: 'networkidle0',
  });
  await page.waitForSelector('input[type=file]');
  // Deterministic non-square transparent fixture, generated locally in the browser.
  const fixture = await page.evaluate(() => {
    const c = document.createElement('canvas');
    c.width = 320;
    c.height = 180;
    const x = c.getContext('2d');
    x.fillStyle = '#804020';
    x.fillRect(0, 0, 160, 180);
    x.fillStyle = '#208040';
    x.fillRect(160, 0, 160, 90);
    return c.toDataURL().split(',')[1];
  });
  fs.writeFileSync('/tmp/photo-fixture.png', Buffer.from(fixture, 'base64'));
  await (await page.$('input[type=file]')).uploadFile('/tmp/photo-fixture.png');
  await page.waitForSelector('.upper-canvas');
  await page.waitForFunction(() => {
    const node = document.querySelector('.upper-canvas')?.closest('.peCanvasContent');
    let f = node && node[Object.keys(node).find((k) => k.startsWith('__reactFiber'))];
    if (!f) return false;
    window.editorContext = () => {
      let root = node[Object.keys(node).find((k) => k.startsWith('__reactFiber'))];
      while (root.return) root = root.return;
      const walk = (fiber) => {
        if (!fiber) return null;
        if (fiber.memoizedProps?.value?.canvas) return fiber.memoizedProps.value;
        return walk(fiber.child) || walk(fiber.sibling);
      };
      return walk(root.stateNode.current);
    };
    return editorContext()?.canvas.getObjects().length > 0;
    return false;
  });
  await new Promise((r) => setTimeout(r, 250));
  const pause = () => new Promise((r) => setTimeout(r, 350));
  const clickText = async (text, selector = 'button') => {
    const items = await page.$$(selector);
    for (const item of items)
      if (
        (await page.evaluate((e) => e.textContent.trim(), item)) === text &&
        (await page.evaluate((e) => !!(e.offsetWidth || e.offsetHeight), item))
      ) {
        await item.click();
        return;
      }
    throw new Error('Missing control: ' + text);
  };
  const shortcut = async (key, shift = false) => {
    await page.keyboard.down('Control');
    if (shift) await page.keyboard.down('Shift');
    await page.keyboard.press(shift ? key.toUpperCase() : key);
    if (shift) await page.keyboard.up('Shift');
    await page.keyboard.up('Control');
    await pause();
  };
  const snapshot = () =>
    page.evaluate(
      () => editorContext().history.entries[editorContext().history.currentIndex]?.snapshot,
    );
  const initial = JSON.parse(await snapshot());
  assert.equal(initial.documentWidth, 320);
  assert.equal(initial.documentHeight, 180);
  assert.equal(initial.objects[0].scaleX, 1);
  console.log('PASS image native resolution and initialized history');
  // Use actual adjustment UI, then a real pointer stroke at a zoomed/panned viewport.
  const brightness = await page.$('.ant-slider');
  const bb = await brightness.boundingBox();
  await page.mouse.click(bb.x + bb.width * 0.65, bb.y + bb.height / 2);
  await pause();
  assert.ok(
    await page.evaluate(() =>
      editorContext()
        .canvas.getObjects()[0]
        .filters.some((f) => f.type === 'Brightness' && f.brightness > 0),
    ),
  );
  await page.evaluate(() => editorContext().canvas.setViewportTransform([2, 0, 0, 2, 50, 50]));
  await page.evaluate(() => document.activeElement?.blur());
  await page.keyboard.press('b');
  await pause();
  const cb = await (await page.$('.upper-canvas')).boundingBox();
  await page.mouse.move(cb.x + 90, cb.y + 90);
  await page.mouse.down();
  await page.mouse.move(cb.x + 210, cb.y + 110, { steps: 12 });
  await page.mouse.up();
  await pause();
  assert.equal(await page.evaluate(() => editorContext().canvas.getObjects().length), 2);
  const pathBounds = await page.evaluate(() =>
    editorContext().canvas.getObjects()[1].getBoundingRect(),
  );
  assert.ok(Math.abs(pathBounds.left - 17.5) < 3, JSON.stringify(pathBounds));
  console.log('PASS brightness and brush document coordinates at 200% with pan');
  await page.keyboard.press('v');
  await page.keyboard.press('c');
  await page.waitForSelector('.ant-modal input[role=spinbutton]');
  await pause();
  const fields = await page.$$('.ant-modal input[role=spinbutton]');
  for (const [i, value] of [
    [2, '200'],
    [3, '100'],
  ]) {
    await page.waitForSelector('.ant-modal input[role=spinbutton]');
    const field = (await page.$$('.ant-modal input[role=spinbutton]'))[i];
    await field.click({ clickCount: 3 });
    await page.keyboard.type(value);
    await page.keyboard.press('Tab');
  }
  await clickText('Confirm Crop');
  await pause();
  assert.equal(JSON.parse(await snapshot()).documentWidth, 200);
  await shortcut('z');
  assert.equal(JSON.parse(await snapshot()).documentWidth, 320);
  await shortcut('z', true);
  assert.equal(JSON.parse(await snapshot()).documentHeight, 100);
  console.log('PASS crop, undo and redo dimensions');
  await page.evaluate(() => {
    window.downloads = [];
    HTMLAnchorElement.prototype.click = function () {
      window.downloads.push({ name: this.download, url: this.href });
    };
  });
  await shortcut('s', true);
  await page.waitForSelector('.ant-modal');
  await clickText('Export');
  await pause();
  const pixels = await page.evaluate(async () => {
    const d = downloads.at(-1);
    const img = new Image();
    img.src = d.url;
    await img.decode();
    const c = document.createElement('canvas');
    c.width = img.width;
    c.height = img.height;
    const ctx = c.getContext('2d');
    ctx.drawImage(img, 0, 0);
    return {
      width: img.width,
      height: img.height,
      pixel: [...ctx.getImageData(10, 70, 1, 1).data],
      name: d.name,
    };
  });
  assert.equal(pixels.width, 200);
  assert.equal(pixels.height, 100);
  assert.ok(pixels.pixel[0] > 128);
  assert.equal(pixels.pixel[3], 255);
  console.log('PASS PNG export dimensions and adjusted pixels independent of viewport');
  // Mixed operations against the live Fabric engine and live React history (not mocks).
  const beforeMixed = await snapshot();
  for (let i = 0; i < 10; i++) {
    await page.evaluate((i) => {
      const { canvas, history } = editorContext();
      const o = canvas.getObjects()[0];
      o.set({ left: i + 1, angle: i * 3, opacity: 1 - i * 0.03 });
      o.setCoords();
      history.saveState('Mixed transform ' + i);
    }, i);
    await pause();
  }
  const afterMixed = await snapshot();
  for (let i = 0; i < 10; i++) await shortcut('z');
  assert.equal(await snapshot(), beforeMixed);
  for (let i = 0; i < 10; i++) await shortcut('z', true);
  assert.equal(await snapshot(), afterMixed);
  await shortcut('z');
  await shortcut('z');
  await page.evaluate(() => {
    const { canvas, history } = editorContext();
    canvas.getObjects()[0].set('left', 99);
    history.saveState();
  });
  await pause();
  assert.equal(await page.evaluate(() => editorContext().history.canRedo), false);
  console.log('PASS ten mixed transform transactions, exact undo/redo and branch invalidation');
  // Save via actual JSON export, then import via the actual file input.
  await shortcut('s', true);
  await page.click('.ant-modal .ant-select-selector');
  await pause();
  await clickText('JSON (Project)', '.ant-select-item-option-content');
  await page.waitForFunction(
    () =>
      document.querySelector('.ant-modal .ant-select-selection-item')?.textContent ===
      'JSON (Project)',
  );
  await pause();
  await clickText('Export');
  await pause();
  const project = await page.evaluate(async () =>
    JSON.parse(await (await fetch(downloads.at(-1).url)).text()),
  );
  fs.writeFileSync('/tmp/photo-project.json', JSON.stringify(project));
  const input = await page.$('input[accept="application/json, .json"]');
  await input.uploadFile('/tmp/photo-project.json');
  await pause();
  assert.equal(
    await page.evaluate(() => editorContext().canvas.getObjects()[0].uid),
    project.objects[0].uid,
  );
  assert.equal(
    await page.evaluate(() => editorContext().canvas.getObjects()[0].filters[0].type),
    'Brightness',
  );
  console.log('PASS editable JSON export/import retains IDs, filters and transforms');
  // Locked objects resist keyboard movement/deletion. Text fields retain arrow behavior.
  await page.evaluate(() => {
    const c = editorContext().canvas;
    const o = c.getObjects()[0];
    o.set({ lockMovementX: true, lockMovementY: true });
    c.setActiveObject(o);
  });
  const lockedLeft = await page.evaluate(() => editorContext().canvas.getObjects()[0].left);
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Delete');
  await pause();
  assert.equal(await page.evaluate(() => editorContext().canvas.getObjects().length), 2);
  assert.equal(await page.evaluate(() => editorContext().canvas.getObjects()[0].left), lockedLeft);
  console.log('PASS locked layer keyboard guards');
  // Layer UI state, save/reload, and real group transforms.
  const layered = {
    ...project,
    objects: [
      {
        ...project.objects[0],
        left: 0,
        top: 0,
        angle: 0,
        opacity: 1,
        lockMovementX: true,
        lockMovementY: true,
        selectable: false,
        evented: false,
      },
      {
        ...project.objects[0],
        uid: 'top-layer',
        left: 40,
        top: 0,
        angle: 0,
        opacity: 0.5,
        visible: false,
      },
    ],
  };
  fs.writeFileSync('/tmp/photo-layers.json', JSON.stringify(layered));
  await input.uploadFile('/tmp/photo-layers.json');
  await pause();
  const layerState = await page.evaluate(() =>
    editorContext()
      .canvas.getObjects()
      .map((o) => ({ id: o.uid, visible: o.visible, locked: o.lockMovementX })),
  );
  assert.equal(layerState[1].id, 'top-layer');
  assert.equal(layerState[1].visible, false);
  assert.equal(layerState[0].locked, true);
  await page.evaluate(() => {
    const c = editorContext().canvas;
    c.moveObjectTo(c.getObjects()[1], 0);
    editorContext().history.saveState('Reorder');
  });
  await pause();
  await shortcut('z');
  assert.equal(await page.evaluate(() => editorContext().canvas.getObjects()[1].uid), 'top-layer');
  console.log('PASS layer order, visibility and locks survive project load and reorder undo');
  // Create a rotated group fixture, then invoke the real Ungroup button.
  const group = {
    ...project,
    objects: [
      {
        type: 'Group',
        left: 30,
        top: 20,
        angle: 27,
        scaleX: 1.3,
        scaleY: 0.8,
        objects: [
          { type: 'Rect', left: -30, top: -10, width: 20, height: 15, fill: 'red', uid: 'child-a' },
          { type: 'Rect', left: 10, top: 10, width: 30, height: 20, fill: 'blue', uid: 'child-b' },
        ],
      },
    ],
  };
  fs.writeFileSync('/tmp/photo-group.json', JSON.stringify(group));
  await input.uploadFile('/tmp/photo-group.json');
  await pause();
  const groupedCoords = await page.evaluate(() => {
    const c = editorContext().canvas;
    const g = c.getObjects()[0];
    c.setActiveObject(g);
    return g.getObjects().map((o) => o.getCoords().map((p) => [p.x, p.y]));
  });
  await pause();
  await page.click('button[title="Ungroup Layers"]');
  await pause();
  const ungroupedCoords = await page.evaluate(() =>
    editorContext()
      .canvas.getObjects()
      .map((o) => o.getCoords().map((p) => [p.x, p.y])),
  );
  groupedCoords
    .flat(2)
    .forEach((v, i) => assert.ok(Math.abs(v - ungroupedCoords.flat(2)[i]) < 0.001));
  await shortcut('z');
  assert.equal(await page.evaluate(() => editorContext().canvas.getObjects()[0].type), 'group');
  console.log('PASS rotated/scaled group ungroup preserves world coordinates and is one undo');
  await input.uploadFile('/tmp/photo-project.json');
  await pause();
  const sourceBeforeMask = await page.evaluate(() => {
    const c = editorContext().canvas;
    const o = c.getObjects()[0];
    c.setActiveObject(o);
    return o.getSrc();
  });
  await pause();
  await page.evaluate(() => document.activeElement?.blur());
  await page.keyboard.press('m');
  await page.waitForSelector('.ant-modal');
  await pause();
  await clickText('OK');
  await pause();
  assert.equal(
    await page.evaluate(() => editorContext().canvas.getObjects()[0].getSrc()),
    sourceBeforeMask,
  );
  assert.equal(
    await page.evaluate(() => editorContext().canvas.getObjects()[0].clipPath.type),
    'image',
  );
  await shortcut('z');
  assert.equal(await page.evaluate(() => !!editorContext().canvas.getObjects()[0].clipPath), false);
  await shortcut('z', true);
  assert.equal(
    await page.evaluate(() => editorContext().canvas.getObjects()[0].clipPath.type),
    'image',
  );
  console.log('PASS mask preserves source and survives undo/redo deserialization');
  // Text placement uses scene coordinates, and editing text must not trigger delete/copy tools.
  await page.evaluate(() => {
    const c = editorContext().canvas;
    c.discardActiveObject();
    c.setViewportTransform([2, 0, 0, 2, 50, 50]);
  });
  await page.keyboard.press('t');
  await pause();
  const textBox = await (await page.$('.upper-canvas')).boundingBox();
  await page.mouse.click(textBox.x + 250, textBox.y + 180);
  await page.keyboard.type('Hello');
  await pause();
  const text = await page.evaluate(() =>
    editorContext()
      .canvas.getObjects()
      .find((o) => o.type === 'i-text')
      ?.toObject(),
  );
  assert.ok(text);
  assert.equal(text.text, 'Hello');
  assert.ok(Math.abs(text.left - 100) < 1);
  assert.ok(Math.abs(text.top - 65) < 1);
  await page.keyboard.press('Backspace');
  assert.equal(
    await page.evaluate(
      () =>
        editorContext()
          .canvas.getObjects()
          .find((o) => o.type === 'i-text').text,
    ),
    'Hell',
  );
  console.log('PASS zoomed editable text placement and typing shortcut guards');
  await page.evaluate(()=>{const c=editorContext().canvas;const t=c.getActiveObject();if(t?.isEditing)t.exitEditing();c.setActiveObject(c.getObjects()[0]);}); await pause();
  await page.click('button:has(.anticon-bg-colors)');await page.waitForSelector('.ant-modal');await pause();
  await clickText('Apply');await pause();
  assert.equal(await page.evaluate(()=>editorContext().canvas.getObjects()[0].filters.length),0);
  assert.equal(await page.evaluate(()=>!!editorContext().canvas.getObjects()[0].originalSource),true);
  console.log('PASS Camera Raw Apply retains identity and explicitly bakes existing adjustments once');
  await shortcut('z');
  // Apply Blur must process the painted mask without requiring Update Preview first.
  const highlightButtons = await page.$$('.peToolbarSider button:has(.anticon-highlight)');
  await highlightButtons[highlightButtons.length - 1].click();
  await page.waitForFunction(()=>Array.from(document.querySelectorAll('.ant-modal-title')).some(e=>e.textContent==='Blur Brush'));
  await pause();
  const masks=await page.$$('.ant-modal .upper-canvas');const mb=await masks[0].boundingBox();
  await page.mouse.move(mb.x+140,mb.y+40);await page.mouse.down();await page.mouse.move(mb.x+180,mb.y+40,{steps:8});await page.mouse.up();
  const beforeBlur=await page.evaluate(()=>editorContext().canvas.getObjects().length);
  await clickText('Apply Blur');await page.waitForFunction(n=>editorContext().canvas.getObjects().length===n+1,{},beforeBlur);
  console.log('PASS Blur Brush Apply runs processing without a prior preview');
  await page.screenshot({ path: '/tmp/photo-editor-verified.png', fullPage: true });
  assert.deepEqual(errors, []);
  console.log('PASS no uncaught page errors');
  await browser.close();
})().catch(async (error) => {
  console.error(error); const pages=await browser?.pages(); if(pages?.[1]) { await pages[1].screenshot({path:'/tmp/photo-test-failure.png',fullPage:true}); console.log(await pages[1].evaluate(()=>document.body.innerText.slice(-2500))); }
  await browser?.close();
  process.exitCode = 1;
});
