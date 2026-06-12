// Playwright script to test the CATalyst onboarding tour
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const SCREENSHOT_DIR = '/Users/poison/Desktop/CATalyst/tour-screenshots';
if (!fs.existsSync(SCREENSHOT_DIR)) fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

async function shot(page, name) {
  const p = path.join(SCREENSHOT_DIR, `${name}.png`);
  await page.screenshot({ path: p, fullPage: false });
  console.log(`[screenshot] ${p}`);
  return p;
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();

  // Collect all console messages and errors
  const consoleLogs = [];
  const jsErrors = [];
  page.on('console', msg => {
    consoleLogs.push(`[${msg.type()}] ${msg.text()}`);
  });
  page.on('pageerror', err => {
    jsErrors.push(err.message);
  });

  console.log('\n=== STEP 1: Open the app ===');
  await page.goto('http://localhost:3333', { waitUntil: 'networkidle' });
  await shot(page, '01-initial-load');

  // ─── Check DOM structure ───────────────────────────────────────
  console.log('\n=== STEP 2: Check #app-screen / #auth-screen ===');
  const appScreenDisplay  = await page.$eval('#app-screen',  el => getComputedStyle(el).display).catch(() => 'NOT FOUND');
  const authScreenDisplay = await page.$eval('#auth-screen', el => getComputedStyle(el).display).catch(() => 'NOT FOUND');
  console.log(`#app-screen display:  ${appScreenDisplay}`);
  console.log(`#auth-screen display: ${authScreenDisplay}`);

  // ─── Bypass auth: show app, hide auth ─────────────────────────
  console.log('\n=== STEP 3: Bypass auth screen ===');
  await page.evaluate(() => {
    const app  = document.getElementById('app-screen');
    const auth = document.getElementById('auth-screen');
    if (app)  app.style.display  = 'flex';
    if (auth) auth.style.display = 'none';
  });
  await shot(page, '02-app-screen-shown');

  // ─── Navigate to dashboard via App.navigate ───────────────────
  console.log('\n=== STEP 4: Navigate to dashboard ===');
  const navResult = await page.evaluate(() => {
    try {
      if (typeof App !== 'undefined' && App.navigate) {
        App.navigate('dashboard');
        return 'App.navigate(dashboard) called';
      }
      // Fallback: manually show dashboard page
      document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
      const dash = document.getElementById('page-dashboard');
      if (dash) { dash.classList.remove('hidden'); return 'manual show dashboard'; }
      return 'App not found, no dashboard element';
    } catch(e) { return 'Error: ' + e.message; }
  });
  console.log('Navigation result:', navResult);
  await page.waitForTimeout(600);
  await shot(page, '03-dashboard');

  // ─── Check all tour target elements ───────────────────────────
  console.log('\n=== STEP 5: Check tour target elements ===');
  const targets = [
    '#start-practice-btn',
    '#filter-toggle-btn',
    '#q-timer',
    '#question-card',
    '#solution-box',
    '#answer-area',
    '#end-practice-btn',
    '#fix-mode-entry',
  ];

  const elementStatus = {};
  for (const sel of targets) {
    const result = await page.evaluate((s) => {
      const el = document.querySelector(s);
      if (!el) return { exists: false };
      const r = el.getBoundingClientRect();
      const style = getComputedStyle(el);
      return {
        exists: true,
        visible: style.display !== 'none' && style.visibility !== 'hidden',
        inDOM: document.contains(el),
        tagName: el.tagName,
        id: el.id,
        classes: el.className,
        rect: { top: Math.round(r.top), left: Math.round(r.left), w: Math.round(r.width), h: Math.round(r.height) }
      };
    }, sel);
    elementStatus[sel] = result;
    const mark = result.exists ? '✓' : '✗ MISSING';
    const vis  = result.exists ? (result.visible ? 'visible' : 'hidden') : '';
    console.log(`  ${mark} ${sel}  ${vis}  ${result.exists ? JSON.stringify(result.rect) : ''}`);
  }

  // Navigate to practice page to check those elements
  console.log('\n=== STEP 5b: Navigate to practice page and re-check ===');
  await page.evaluate(() => {
    try {
      if (typeof App !== 'undefined' && App.navigate) App.navigate('practice');
      else {
        document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
        const prac = document.getElementById('page-practice');
        if (prac) prac.classList.remove('hidden');
      }
    } catch(e) {}
  });
  await page.waitForTimeout(800);
  await shot(page, '04-practice-page');

  const practiceTargets = ['#filter-toggle-btn','#q-timer','#question-card','#solution-box','#answer-area','#end-practice-btn','#fix-mode-entry'];
  console.log('Re-checking on practice page:');
  for (const sel of practiceTargets) {
    const result = await page.evaluate((s) => {
      const el = document.querySelector(s);
      if (!el) return { exists: false };
      const r = el.getBoundingClientRect();
      const style = getComputedStyle(el);
      return {
        exists: true,
        visible: style.display !== 'none' && style.visibility !== 'hidden',
        tagName: el.tagName,
        rect: { top: Math.round(r.top), left: Math.round(r.left), w: Math.round(r.width), h: Math.round(r.height) }
      };
    }, sel);
    const mark = result.exists ? '✓' : '✗ MISSING';
    const vis  = result.exists ? (result.visible ? 'visible' : 'hidden') : '';
    console.log(`  ${mark} ${sel}  ${vis}  ${result.exists ? JSON.stringify(result.rect) : ''}`);
  }

  // Navigate back to dashboard before starting tour
  await page.evaluate(() => {
    try { App.navigate('dashboard'); } catch(e) {
      document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
      const d = document.getElementById('page-dashboard');
      if (d) d.classList.remove('hidden');
    }
  });
  await page.waitForTimeout(400);

  // ─── Trigger the tour ─────────────────────────────────────────
  console.log('\n=== STEP 6: Trigger the onboarding tour ===');
  const tourResult = await page.evaluate(() => {
    try {
      if (typeof Onboarding === 'undefined') return 'Onboarding object NOT FOUND';
      localStorage.removeItem('cat_tour_done_fake123');
      sessionStorage.removeItem('tour_snoozed');
      Onboarding._userId = 'fake123';
      Onboarding._start();
      return 'Onboarding._start() called successfully';
    } catch(e) { return 'Error: ' + e.message + '\n' + e.stack; }
  });
  console.log('Tour trigger result:', tourResult);

  // Wait for tooltip to fade in (uses double-RAF + CSS transition)
  await page.waitForTimeout(500);
  await shot(page, '05-tour-welcome');

  // ─── Inspect welcome tooltip ──────────────────────────────────
  console.log('\n=== STEP 7: Inspect welcome tooltip ===');
  const tooltipState = await page.evaluate(() => {
    const overlay  = document.querySelector('.tour-overlay');
    const spotlight= document.querySelector('.tour-spotlight');
    const tooltip  = document.querySelector('.tour-tooltip');
    if (!tooltip) return { found: false };

    const r = tooltip.getBoundingClientRect();
    return {
      found: true,
      tooltipHTML: tooltip.innerHTML.substring(0, 600),
      tooltipRect: { top: Math.round(r.top), left: Math.round(r.left), w: Math.round(r.width), h: Math.round(r.height) },
      tooltipOpacity: getComputedStyle(tooltip).opacity,
      overlayFound: !!overlay,
      overlayOpacity: overlay ? getComputedStyle(overlay).opacity : 'N/A',
      spotlightOpacity: spotlight ? getComputedStyle(spotlight).opacity : 'N/A',
      progressText: tooltip.querySelector('.tt-progress')?.textContent,
      titleText: tooltip.querySelector('.tt-title')?.textContent,
      btnText: tooltip.querySelector('.tt-btn')?.textContent,
      hasSnooze: !!tooltip.querySelector('.js-snooze'),
      hasDone: !!tooltip.querySelector('.js-done'),
      vpW: window.innerWidth, vpH: window.innerHeight,
    };
  });
  console.log('Tooltip state:', JSON.stringify(tooltipState, null, 2));

  // ─── Centering check ──────────────────────────────────────────
  if (tooltipState.found && tooltipState.tooltipRect) {
    const { top, left, w, h } = tooltipState.tooltipRect;
    const centerX = left + w / 2;
    const centerY = top + h / 2;
    const vpW = tooltipState.vpW || 1280;
    const vpH = tooltipState.vpH || 800;
    const offCenterX = Math.abs(centerX - vpW / 2);
    const offCenterY = Math.abs(centerY - vpH / 2);
    console.log(`\nCentering check: center=(${Math.round(centerX)},${Math.round(centerY)}) viewport=(${vpW/2},${vpH/2})`);
    console.log(`Off-center: X=${Math.round(offCenterX)}px  Y=${Math.round(offCenterY)}px`);
    console.log(offCenterX < 50 && offCenterY < 80 ? '→ CENTERED OK' : '→ MAY BE OFF-CENTER');
  }

  // ─── Click "Let's go" ─────────────────────────────────────────
  console.log('\n=== STEP 8: Click the primary button ===');
  const btn = await page.$('.tour-tooltip .tt-btn');
  if (btn) {
    const btnText = await btn.textContent();
    console.log(`Clicking button: "${btnText.trim()}"`);
    await btn.click();
    await page.waitForTimeout(700);
    await shot(page, '06-after-letsgo');

    const step2State = await page.evaluate(() => {
      const tooltip = document.querySelector('.tour-tooltip');
      if (!tooltip) return { found: false };
      return {
        found: true,
        progressText: tooltip.querySelector('.tt-progress')?.textContent,
        titleText: tooltip.querySelector('.tt-title')?.textContent,
        btnText: tooltip.querySelector('.tt-btn')?.textContent,
        hasSnooze: !!tooltip.querySelector('.js-snooze'),
        hasDone: !!tooltip.querySelector('.js-done'),
        tooltipOpacity: getComputedStyle(tooltip).opacity,
        spotlightOpacity: (() => {
          const s = document.querySelector('.tour-spotlight');
          return s ? getComputedStyle(s).opacity : 'N/A';
        })(),
      };
    });
    console.log('Step 2 state:', JSON.stringify(step2State, null, 2));
  } else {
    console.log('ERROR: .tt-btn not found in tooltip');
  }

  // ─── Test "Not now" (snooze) ──────────────────────────────────
  console.log('\n=== STEP 9: Test secondary buttons ===');
  // First, restart the tour at step 2 which has snooze/done buttons
  const secondaryResult = await page.evaluate(() => {
    try {
      // Ensure we're at a step that has snooze/done
      Onboarding._start();
      // Advance to step 1 (filters) which has buttons
      Onboarding._step = 2; // 'filters' step has btn + snooze + done
      Onboarding._showStep(2);
      return 'shown step 2 (filters)';
    } catch(e) { return 'Error: ' + e.message; }
  });
  console.log('Show step 2 result:', secondaryResult);
  await page.waitForTimeout(500);
  await shot(page, '07-step-filters');

  // Check snooze and done buttons exist
  const hasSnooze = await page.$('.js-snooze');
  const hasDone   = await page.$('.js-done');
  console.log(`Snooze button present: ${!!hasSnooze}`);
  console.log(`Done button present:   ${!!hasDone}`);

  if (hasSnooze) {
    const snoozeText = await hasSnooze.textContent();
    console.log(`Snooze button text: "${snoozeText.trim()}"`);
  }
  if (hasDone) {
    const doneText = await hasDone.textContent();
    console.log(`Done button text: "${doneText.trim()}"`);
  }

  // Test "Not now" — should snooze tour
  console.log('\n=== STEP 10: Click "Not now" (snooze) ===');
  if (hasSnooze) {
    await hasSnooze.click();
    await page.waitForTimeout(600);
    await shot(page, '08-after-snooze');
    const afterSnooze = await page.evaluate(() => {
      return {
        tooltipGone: !document.querySelector('.tour-tooltip'),
        snoozed: sessionStorage.getItem('tour_snoozed'),
        tourDone: localStorage.getItem('cat_tour_done_fake123'),
      };
    });
    console.log('After snooze:', JSON.stringify(afterSnooze, null, 2));
  }

  // Test "I've got it" — restart and test done
  console.log('\n=== STEP 11: Test "I\'ve got it" button ===');
  await page.evaluate(() => {
    localStorage.removeItem('cat_tour_done_fake123');
    sessionStorage.removeItem('tour_snoozed');
    Onboarding._overlay = null;
    Onboarding._spotlight = null;
    Onboarding._tooltip = null;
    Onboarding._active = false;
    Onboarding._start();
    Onboarding._step = 2;
    Onboarding._showStep(2);
  });
  await page.waitForTimeout(500);

  const doneBtn2 = await page.$('.js-done');
  if (doneBtn2) {
    await doneBtn2.click();
    await page.waitForTimeout(600);
    await shot(page, '09-after-done');
    const afterDone = await page.evaluate(() => ({
      tooltipGone: !document.querySelector('.tour-tooltip'),
      tourDone: localStorage.getItem('cat_tour_done_fake123'),
    }));
    console.log('After "I\'ve got it":', JSON.stringify(afterDone, null, 2));
  }

  // ─── CSS class inspection ─────────────────────────────────────
  console.log('\n=== STEP 12: Check tour CSS classes are defined ===');
  const cssCheck = await page.evaluate(() => {
    // Try creating tour elements and checking they get styled
    const testDiv = document.createElement('div');
    testDiv.className = 'tour-tooltip';
    document.body.appendChild(testDiv);
    const styles = getComputedStyle(testDiv);
    const result = {
      position: styles.position,
      zIndex: styles.zIndex,
      background: styles.backgroundColor,
    };
    testDiv.remove();
    return result;
  });
  console.log('tour-tooltip CSS:', JSON.stringify(cssCheck));

  // ─── Console errors summary ───────────────────────────────────
  console.log('\n=== CONSOLE LOGS ===');
  consoleLogs.forEach(l => console.log(l));

  console.log('\n=== JS ERRORS ===');
  if (jsErrors.length === 0) {
    console.log('None');
  } else {
    jsErrors.forEach(e => console.log('ERROR:', e));
  }

  await browser.close();
  console.log('\n=== TEST COMPLETE ===');
  console.log('Screenshots saved to:', SCREENSHOT_DIR);
})().catch(err => {
  console.error('FATAL:', err);
  process.exit(1);
});
