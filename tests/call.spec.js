import path from 'node:path';
import { expect, test } from '@playwright/test';
import { renderCall } from '../eval/audio.js';
import { joinCall, openPanel } from '../eval/panels.js';

const BASE = 'http://localhost:3187';
const SCRIPT = [
  { speaker: 'A', text: 'The orange submarine leaves the harbor at midnight.' },
  { speaker: 'B', text: 'A purple elephant is dancing in the library.' },
  { speaker: 'A', text: 'Seven violins are hidden under the kitchen table.' },
  { speaker: 'B', text: 'My grandfather painted the bicycle bright yellow.' },
];

const inboundAudio = (page) =>
  page.evaluate(async () => {
    const stats = await window.claimcheck.pc.getStats();
    const inbound = [...stats.values()].find((entry) => entry.type === 'inbound-rtp' && entry.kind === 'audio');
    return { bytes: inbound?.bytesReceived ?? 0, energy: inbound?.totalAudioEnergy ?? 0 };
  });

const lines = (page) =>
  page.$$eval('#lyrics .line', (items) =>
    items.map((item) => ({ speaker: item.dataset.speaker, text: item.textContent.toLowerCase() })),
  );

const heard = (all, speaker, word) => all.some((line) => line.speaker === speaker && line.text.includes(word));

test('two panels talk over real WebRTC and each hears the other', async ({}, testInfo) => {
  const { tracks, seconds } = renderCall(SCRIPT, path.join(testInfo.outputDir, 'audio'));
  const room = `test-${Date.now()}`;
  const a = await openPanel(BASE, room, tracks.A);
  const b = await openPanel(BASE, room, tracks.B);

  try {
    expect(a.browser.browserType().executablePath()).toContain('ms-playwright');
    await joinCall(a, b);

    for (const { page } of [a, b]) {
      await expect.poll(() => page.evaluate(() => window.claimcheck.pc?.connectionState), { timeout: 10_000 }).toBe('connected');
    }

    await a.page.waitForTimeout((seconds + 1) * 1000);

    for (const { page } of [a, b]) {
      const inbound = await inboundAudio(page);
      expect(inbound.bytes).toBeGreaterThan(10_000);
      expect(inbound.energy).toBeGreaterThan(0);
    }

    // Panel B can only produce speaker A lines from audio it received, and panel A the reverse.
    await expect.poll(async () => {
      const seen = await lines(a.page);
      return heard(seen, 'A', 'submarine') && heard(seen, 'A', 'violins') && heard(seen, 'B', 'elephant') && heard(seen, 'B', 'bicycle');
    }, { timeout: 15_000 }).toBe(true);

    expect(await lines(b.page)).toEqual(await lines(a.page));

    for (const { page } of [a, b]) {
      await expect(page.locator('#lyrics .line.current')).toHaveCount(1);
      await expect(page.locator('#lyrics .line').last()).toHaveClass(/current/);
    }
  } finally {
    await a.browser.close();
    await b.browser.close();
  }
});
