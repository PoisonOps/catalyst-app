// ============================================================
// APP.JS — Boot, routing, theme, feedback, upgrade
// Phase 2: session persistence + trial/upgrade system
// ============================================================

function showLoading(text = 'Loading...') {
  document.getElementById('loading-text').textContent = text;
  document.getElementById('loading-overlay').classList.remove('hidden');
}
function hideLoading() {
  document.getElementById('loading-overlay').classList.add('hidden');
}
function showToast(msg, type = '') {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.className = 'toast ' + type;
  toast.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => toast.classList.remove('show'), 3000);
}

const App = {
  currentPage: 'dashboard',
  initialized: false,

  async init() {
    if (this.initialized) return;
    this.initialized = true;
    this._initTheme();
    this._initNav();
    this._initFeedback();
    this._initUpgrade();

    if (typeof Dashboard !== 'undefined') await Dashboard.init();
    if (typeof Practice !== 'undefined') await Practice.init();
    if (typeof TestMode !== 'undefined') await TestMode.init();
    if (typeof Review !== 'undefined') await Review.init();
    if (typeof ErrorLog !== 'undefined') await ErrorLog.init();

    const uid = Auth.currentUser ? Auth.currentUser.id : 'anon';
    const lastPage = localStorage.getItem(`last_page_${uid}`) || 'dashboard';
    this.navigate(lastPage);
    this._handleDeepLink();
    window.addEventListener('beforeunload', () => DB.endSession());

    if (typeof Onboarding !== 'undefined' && Auth.currentUser) {
      Onboarding.maybeStart(Auth.currentUser.id);
    }
  },

  // Handle #fix hash from push notification click — opens Fix Mode directly
  _handleDeepLink() {
    if (window.location.hash !== '#fix') return;
    history.replaceState(null, '', window.location.pathname);
    setTimeout(() => {
      if (typeof Practice !== 'undefined') Practice.loadFixSession();
    }, 400);
  },

  _handlers: null,

  _initNav() {
    if (!this._handlers) this._handlers = {};
    if (!this._handlers.navClick) {
      this._handlers.navClick = (e) => {
        e.preventDefault();
        this.navigate(e.currentTarget.dataset.page);
        if (window.innerWidth <= 900) document.getElementById('sidebar').classList.remove('open');
      };
      this._handlers.hamburgerClick = () => {
        document.getElementById('sidebar').classList.toggle('open');
      };
      this._handlers.upgradeBtnClick = () => {
        document.getElementById('upgrade-modal').classList.remove('hidden');
        document.body.style.overflow = 'hidden';
      };
      this._handlers.overlayClick = () => {
        document.getElementById('sidebar').classList.remove('open');
      };
    }

    document.querySelectorAll('.nav-item').forEach(item => {
      item.removeEventListener('click', this._handlers.navClick);
      item.addEventListener('click', this._handlers.navClick);
    });

    const hamburger = document.getElementById('hamburger');
    if (hamburger) {
      hamburger.removeEventListener('click', this._handlers.hamburgerClick);
      hamburger.addEventListener('click', this._handlers.hamburgerClick);
    }

    const upgradeBtn = document.getElementById('sidebar-upgrade-btn');
    if (upgradeBtn) {
      upgradeBtn.removeEventListener('click', this._handlers.upgradeBtnClick);
      upgradeBtn.addEventListener('click', this._handlers.upgradeBtnClick);
    }

    const overlay = document.getElementById('sidebar-overlay');
    if (overlay) {
      overlay.removeEventListener('click', this._handlers.overlayClick);
      overlay.addEventListener('click', this._handlers.overlayClick);
    }
  },

  navigate(page) {
    // Always clear any modal scroll lock when navigating away
    document.body.style.overflow = '';
    // Hide paywall — will re-show below if the gate catches this page
    const paywallEl = document.getElementById('paywall-overlay');
    if (paywallEl) paywallEl.classList.add('hidden');

    // Paywall gate: block Practice and Error Log when trial has expired
    const GATED_PAGES = ['practice', 'errorlog'];
    if (GATED_PAGES.includes(page) && typeof DB !== 'undefined') {
      // Race condition guard: on fresh devices initTrial() creates a local "active" trial
      // before syncTrialFromSupabase has finished. Wait for sync then re-enter navigate().
      const uid = Auth.currentUser ? Auth.currentUser.id : null;
      if (uid && DB._syncedUserId !== uid) {
        DB.waitForSync(uid).then(() => this.navigate(page));
        return;
      }
      if (DB.isTrialExpired() && !DB.isPaid()) {
        this.showPaywall();
        return;
      }
    }

    // Bug B fix: always reset auto-load guard when leaving practice so re-entry works
    if (page !== 'practice' && typeof Practice !== 'undefined') Practice._hasAutoLoaded = false;
    this.currentPage = page;
    const uid = Auth.currentUser ? Auth.currentUser.id : 'anon';
    localStorage.setItem(`last_page_${uid}`, page);
    document.querySelectorAll('.nav-item').forEach(item => item.classList.toggle('active', item.dataset.page === page));
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const pageEl = document.getElementById('page-' + page);
    if (pageEl) pageEl.classList.add('active');

    if (page === 'dashboard') Dashboard.refresh();
    if (page === 'review') Review.load();
    if (page === 'errorlog') ErrorLog.render();
    if (page === 'practice') Practice.onPageEnter();
    window.scrollTo(0, 0);
  },

  _initTheme() {
    const saved = localStorage.getItem('cat_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', saved);
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
      themeToggle.textContent = saved === 'dark' ? '☀️' : '🌙';
      if (!this._handlers) this._handlers = {};
      if (!this._handlers.themeClick) {
        this._handlers.themeClick = () => {
          const current = document.documentElement.getAttribute('data-theme');
          const next = current === 'dark' ? 'light' : 'dark';
          document.documentElement.setAttribute('data-theme', next);
          localStorage.setItem('cat_theme', next);
          document.getElementById('theme-toggle').textContent = next === 'dark' ? '☀️' : '🌙';
        };
      }
      themeToggle.removeEventListener('click', this._handlers.themeClick);
      themeToggle.addEventListener('click', this._handlers.themeClick);
    }
  },

  // ── FEEDBACK ───────────────────────────────────────────────

  _initFeedback() {
    const fab = document.getElementById('feedback-fab');
    const modal = document.getElementById('feedback-modal');
    if (!fab || !modal) return;

    if (!this._handlers) this._handlers = {};
    if (!this._handlers.fabClick) {
      this._handlers.fabClick = () => modal.classList.remove('hidden');
      this._handlers.cancelFbClick = () => modal.classList.add('hidden');
      this._handlers.saveFbClick = async () => {
        const type = document.getElementById('fb-type').value;
        const message = document.getElementById('fb-message').value.trim();
        if (!message) { showToast('Please write your feedback', 'error'); return; }

        await DB.saveFeedback({
          user_id: Auth.currentUser && Auth.currentUser.id,
          type,
          message
        });
        modal.classList.add('hidden');
        document.getElementById('fb-message').value = '';
        showToast('Thank you for your feedback! 💬', 'success');
      };
      this._handlers.fbModalClick = (e) => { if (e.target === modal) modal.classList.add('hidden'); };
    }

    fab.removeEventListener('click', this._handlers.fabClick);
    fab.addEventListener('click', this._handlers.fabClick);

    const cancelFbBtn = document.getElementById('cancel-fb-btn');
    if (cancelFbBtn) {
      cancelFbBtn.removeEventListener('click', this._handlers.cancelFbClick);
      cancelFbBtn.addEventListener('click', this._handlers.cancelFbClick);
    }

    const saveFbBtn = document.getElementById('save-fb-btn');
    if (saveFbBtn) {
      saveFbBtn.removeEventListener('click', this._handlers.saveFbClick);
      saveFbBtn.addEventListener('click', this._handlers.saveFbClick);
    }

    modal.removeEventListener('click', this._handlers.fbModalClick);
    modal.addEventListener('click', this._handlers.fbModalClick);
  },

  // ── UPGRADE / PAYMENT ──────────────────────────────────────

  _initUpgrade() {
    const btn = document.getElementById('upgrade-btn');
    const modal = document.getElementById('upgrade-modal');
    const closeBtn = document.getElementById('close-upgrade-btn');
    if (!btn || !modal) return;

    if (!this._handlers) this._handlers = {};
    if (!this._handlers.upgradeClick) {
      const lockScroll = () => { document.body.style.overflow = 'hidden'; };
      const unlockScroll = () => { document.body.style.overflow = ''; };
      this._handlers.upgradeClick = () => { modal.classList.remove('hidden'); lockScroll(); };
      this._handlers.closeUpgradeClick = () => { modal.classList.add('hidden'); unlockScroll(); };
      this._handlers.upgradeModalClick = (e) => { if (e.target === modal) { modal.classList.add('hidden'); unlockScroll(); } };
    }

    btn.removeEventListener('click', this._handlers.upgradeClick);
    btn.addEventListener('click', this._handlers.upgradeClick);

    if (closeBtn) {
      closeBtn.removeEventListener('click', this._handlers.closeUpgradeClick);
      closeBtn.addEventListener('click', this._handlers.closeUpgradeClick);
    }

    modal.removeEventListener('click', this._handlers.upgradeModalClick);
    modal.addEventListener('click', this._handlers.upgradeModalClick);

    // Show trial banner if applicable
    this._renderTrialBanner();
  },

  _renderTrialBanner() {
    const status = DB.getTrialStatus();
    const banner = document.getElementById('trial-banner');
    if (!banner) return;

    if (DB.isPaid()) {
      banner.style.display = 'none';
      return;
    }

    if (status.active) {
      banner.style.display = 'flex';
      const daysLeft = document.getElementById('trial-days-left');
      if (daysLeft) daysLeft.textContent = status.daysLeft;
    } else if (!status.active && status.started) {
      // Trial expired
      banner.style.display = 'flex';
      banner.classList.add('trial-expired');
      const daysLeft = document.getElementById('trial-days-left');
      if (daysLeft) daysLeft.textContent = '0';
    }
  },

  // ── PAYWALL ────────────────────────────────────────────────────
  _pendingCount: 0,

  showPaywall() {
    const overlay = document.getElementById('paywall-overlay');
    if (!overlay) return;
    const numEl = document.getElementById('pw-mistake-count');
    if (numEl) numEl.textContent = this._pendingCount > 0 ? this._pendingCount : '—';
    overlay.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    if (typeof DB !== 'undefined' && typeof Auth !== 'undefined')
      DB.logEvent('paywall_shown', Auth.currentUser ? Auth.currentUser.id : null);
  },
};

// ── BOOT ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const authEl = document.getElementById('auth-screen');
  const appEl = document.getElementById('app-screen');
  authEl.classList.remove('active');
  appEl.style.display = 'none';

  const isConfigured = SUPABASE_URL && !SUPABASE_URL.includes('YOUR_');

  if (isConfigured) {
    // Phase 2: explicit session persistence options
    sbClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    });
    USE_DEMO = false;

    // Listen for auth state changes (handles token refresh, sign-out from another tab)
    sbClient.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        // Redirect to reset page — don't auto-login with recovery token
        window.location.href = '/reset-password.html';
        return;
      }
      if (event === 'SIGNED_OUT') {
        if (App.initialized) Auth.logout();
      } else if (event === 'TOKEN_REFRESHED' && session) {
        Auth.currentUser = session.user;
      }
    });

    showLoading('Starting...');
    sbClient.auth.getSession().then(result => {
      hideLoading();
      const session = result.data && result.data.session;
      if (session && session.user) {
        Auth.currentUser = session.user;
        Auth.onLogin(session.user);
      } else {
        authEl.classList.add('active');
        Auth.init();
      }
    }).catch(() => {
      hideLoading();
      authEl.classList.add('active');
      Auth.init();
    });

  } else {
    authEl.classList.add('active');
    Auth.init();
  }
});

// ── PWA Install Prompt ────────────────────────────────────────
const PWAPrompt = {
  _deferred: null,      // Android: captured beforeinstallprompt event
  _KEY:      'cat_pwa_prompt_last',
  _COOLDOWN: 3 * 86400000, // 3 days in ms

  init() {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this._deferred = e;
    });
  },

  _isInstalled() {
    return window.navigator.standalone === true ||
           window.matchMedia('(display-mode: standalone)').matches;
  },
  _isMobile() {
    return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  },
  _isIOS() {
    return /iPhone|iPad|iPod/i.test(navigator.userAgent) && !window.MSStream;
  },

  // Called right after onboarding tour completes
  showAfterTour() {
    if (this._isInstalled() || !this._isMobile()) return;
    setTimeout(() => this._show(), 1000);
  },

  // Called on login — respects 3-day cooldown, skips if tour is running
  maybeShow() {
    if (this._isInstalled() || !this._isMobile()) return;
    if (typeof Onboarding !== 'undefined' && Onboarding._active) return;
    const last = parseInt(localStorage.getItem(this._KEY) || '0');
    if (Date.now() - last < this._COOLDOWN) return;
    setTimeout(() => this._show(), 12000); // 12s delay — well after login settles
  },

  _show() {
    if (this._isInstalled() || document.getElementById('pwa-prompt')) return;
    localStorage.setItem(this._KEY, Date.now().toString());

    const isIOS = this._isIOS();
    const el = document.createElement('div');
    el.id = 'pwa-prompt';

    const iosShareIcon = `<svg width="15" height="17" viewBox="0 0 15 17" fill="currentColor" style="vertical-align:-3px;margin:0 2px"><path d="M7.5 0L4 3.5h2.25V11h2.5V3.5H11L7.5 0zM1 13.5V15.5h13V13.5H1z"/></svg>`;

    el.innerHTML = isIOS ? `
      <div class="pwa-inner">
        <button class="pwa-close" id="pwa-close">✕</button>
        <div class="pwa-icon">⚡</div>
        <div class="pwa-title">Better on your home screen</div>
        <div class="pwa-sub">Opens instantly. Works offline. No App Store.</div>
        <div class="pwa-ios-steps">
          <div class="pwa-ios-step"><span class="pwa-num">1</span>Tap ${iosShareIcon} <strong>Share</strong> in Safari's toolbar</div>
          <div class="pwa-ios-step"><span class="pwa-num">2</span>Tap <strong>Add to Home Screen</strong></div>
        </div>
        <button class="pwa-later" id="pwa-later">Maybe later</button>
      </div>` : `
      <div class="pwa-inner">
        <button class="pwa-close" id="pwa-close">✕</button>
        <div class="pwa-icon">⚡</div>
        <div class="pwa-title">Better on your home screen</div>
        <div class="pwa-sub">Opens instantly. Works offline. No App Store.</div>
        <button class="pwa-add-btn" id="pwa-add">Add to Home Screen</button>
        <button class="pwa-later" id="pwa-later">Maybe later</button>
      </div>`;

    document.body.appendChild(el);
    requestAnimationFrame(() => el.classList.add('visible'));

    const dismiss = () => {
      el.classList.remove('visible');
      setTimeout(() => el.remove(), 350);
    };

    document.getElementById('pwa-close').onclick = dismiss;
    document.getElementById('pwa-later').onclick  = dismiss;

    if (!isIOS) {
      document.getElementById('pwa-add').onclick = async () => {
        dismiss();
        if (this._deferred) {
          this._deferred.prompt();
          await this._deferred.userChoice;
          this._deferred = null;
        }
      };
    }
  },
};

PWAPrompt.init();

// If redirected from landing page "Install App" button, show prompt immediately
if (new URLSearchParams(location.search).get('install') === '1') {
  history.replaceState({}, '', location.pathname);
  setTimeout(() => PWAPrompt._show(), 900);
}
