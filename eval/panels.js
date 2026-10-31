// Opens a caller as its own bundled-Chromium process, with a WAV file standing in for the microphone.
import { chromium } from '@playwright/test';

export async function openPanel(baseUrl, room, wavPath) {
  const browser = await chromium.launch({
    args: [
      '--use-fake-ui-for-media-stream',
      '--use-fake-device-for-media-stream',
      `--use-file-for-fake-audio-capture=${wavPath}%noloop`,
      '--autoplay-policy=no-user-gesture-required',
      '--mute-audio',
      // A granted real mic exposes real host candidates; a fake one hides them behind slow mDNS names.
      '--disable-features=WebRtcHideLocalIpsWithMdns',
    ],
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(`${baseUrl}/?room=${room}`);
  return { browser, page };
}

// Joins A first so the roles match the scripts. The script lead-in absorbs the short stagger.
export async function joinCall(a, b) {
  await a.page.click('#join-button');
  await a.page.waitForFunction(() => document.getElementById('status').textContent !== '');
  await b.page.click('#join-button');
}
