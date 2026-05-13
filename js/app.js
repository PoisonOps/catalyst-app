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
    window.addEventListener('beforeunload', () => DB.endSession());
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
      this._handlers.upgradeClick = () => modal.classList.remove('hidden');
      this._handlers.closeUpgradeClick = () => modal.classList.add('hidden');
      this._handlers.upgradeModalClick = (e) => { if (e.target === modal) modal.classList.add('hidden'); };
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
  }
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
        // ✅ Session found — auto-login without showing auth screen
        Auth.currentUser = session.user;
        Auth.onLogin(session.user);
      } else {
        // Check if last session was demo mode
        if (localStorage.getItem('cat_demo_active') === 'true') {
          Auth.demoMode();
        } else {
          authEl.classList.add('active');
          Auth.init();
        }
      }
    }).catch(() => {
      hideLoading();
      if (localStorage.getItem('cat_demo_active') === 'true') {
        Auth.demoMode();
      } else {
        authEl.classList.add('active');
        Auth.init();
      }
    });

  } else {
    // No Supabase — check for demo persistence
    if (localStorage.getItem('cat_demo_active') === 'true') {
      USE_DEMO = true;
      Auth.currentUser = {
        id: 'demo',
        email: 'demo@catalyst.app',
        user_metadata: { full_name: localStorage.getItem('cat_demo_name') || 'Demo User' }
      };
      Auth.onLogin(Auth.currentUser);
      showToast('Welcome back (demo mode) 👋', 'success');
    } else {
      USE_DEMO = true;
      authEl.classList.add('active');
      Auth.init();
    }
  }
});
