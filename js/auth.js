// ============================================================
// AUTH.JS — Phase 2: demo persistence + trial/paid init
// ============================================================

// Email format regex — basic RFC-compatible check
const _EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const Auth = {
  currentUser: null,
  _initialized: false,
  _handlers: null,

  init() {
    if (!this._handlers) {
      this._handlers = {
        login: () => this.login(),
        signup: () => this.signup(),
        demo: () => this.demoMode(),
        loginKey: (e) => { if (e.key === 'Enter') this.login(); },
        signupKey: (e) => { if (e.key === 'Enter') this.signup(); },
        tabClick: (e) => {
          const tab = e.currentTarget;
          document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
          document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
          tab.classList.add('active');
          document.getElementById('tab-' + tab.dataset.tab).classList.add('active');
          this.hideError();
        }
      };
    }

    const lBtn = document.getElementById('login-btn');
    if (lBtn) { lBtn.removeEventListener('click', this._handlers.login); lBtn.addEventListener('click', this._handlers.login); }

    const sBtn = document.getElementById('signup-btn');
    if (sBtn) { sBtn.removeEventListener('click', this._handlers.signup); sBtn.addEventListener('click', this._handlers.signup); }

    const dBtn = document.getElementById('demo-btn');
    if (dBtn) { dBtn.removeEventListener('click', this._handlers.demo); dBtn.addEventListener('click', this._handlers.demo); }

    document.querySelectorAll('.auth-tab').forEach(tab => {
      tab.removeEventListener('click', this._handlers.tabClick);
      tab.addEventListener('click', this._handlers.tabClick);
    });

    const lPass = document.getElementById('login-password');
    if (lPass) { lPass.removeEventListener('keydown', this._handlers.loginKey); lPass.addEventListener('keydown', this._handlers.loginKey); }

    const sPass = document.getElementById('signup-password');
    if (sPass) { sPass.removeEventListener('keydown', this._handlers.signupKey); sPass.addEventListener('keydown', this._handlers.signupKey); }
  },

  async login() {
    if (USE_DEMO) { this.demoMode(); return; }
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    if (!email || !password) { this.showError('Please fill in all fields'); return; }
    if (!_EMAIL_RE.test(email)) { this.showError('Enter a valid email'); return; }
    showLoading('Logging in...');
    try {
      const { data, error } = await sbClient.auth.signInWithPassword({ email, password });
      if (error) throw error;
      this.currentUser = data.user;
      this.onLogin(data.user);
    } catch (err) {
      const msg = err.message || '';
      if (msg.includes('Invalid login credentials') || msg.includes('invalid_credentials')) {
        this.showError('Invalid credentials. Check your email and password.');
      } else {
        this.showError('Login failed. Please try again.');
      }
    } finally { hideLoading(); }
  },

  async signup() {
    if (USE_DEMO) { this.demoMode(); return; }
    const name = document.getElementById('signup-name').value.trim();
    const email = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('signup-password').value;
    if (!name || !email || !password) { this.showError('Please fill in all fields'); return; }
    if (!_EMAIL_RE.test(email)) { this.showError('Enter a valid email'); return; }
    if (password.length < 6) { this.showError('Password must be at least 6 characters'); return; }
    showLoading('Creating account...');
    try {
      const { data, error } = await sbClient.auth.signUp({ email, password, options: { data: { full_name: name } } });
      if (error) throw error;

      if (data.session) {
        // Session returned — auto-login immediately
        this.currentUser = data.user;
        DB.initTrial();
        this.onLogin(data.user);
      } else {
        // No session (email confirmation might be on in Supabase).
        // Attempt immediate sign-in so the user isn't blocked.
        const { data: loginData, error: loginErr } = await sbClient.auth.signInWithPassword({ email, password });
        if (loginErr) throw loginErr;
        this.currentUser = loginData.user;
        DB.initTrial();
        this.onLogin(loginData.user);
      }
    } catch (err) {
      const msg = err.message || '';
      if (msg.includes('already registered') || msg.includes('already been registered')) {
        this.showError('This email is already registered. Try logging in instead.');
      } else if (msg.includes('Email not confirmed')) {
        this.showError('Account created but email confirmation is required in Supabase. Disable it in Auth → Settings.');
      } else {
        this.showError('Signup failed. Please try again.');
      }
    } finally { hideLoading(); }
  },

  demoMode() {
    USE_DEMO = true;
    const demoName = 'Demo User';
    this.currentUser = { id: 'demo', email: 'demo@catalyst.app', user_metadata: { full_name: demoName } };

    // Persist demo mode so reload auto-resumes
    localStorage.setItem('cat_demo_active', 'true');
    localStorage.setItem('cat_demo_name', demoName);

    // Init trial for demo too
    DB.initTrial();

    this.onLogin(this.currentUser);
    showToast('Demo mode — data saved locally 📱', 'success');
  },

  onLogin(user) {
    const name = (user.user_metadata && user.user_metadata.full_name) || user.email || 'User';
    document.getElementById('user-name-display').textContent = name;
    document.getElementById('user-avatar').textContent = name[0].toUpperCase();

    // ── USER ISOLATION ─────────────────────────────────────────
    // All localStorage keys are namespaced by user ID in DB._getLocal/_setLocal.
    // No data clearing needed — each user has fully isolated storage.
    localStorage.setItem('cat_current_user_id', user.id);
    // ───────────────────────────────────────────────────────────

    document.getElementById('auth-screen').classList.remove('active');
    document.getElementById('auth-screen').style.display = 'none';
    document.getElementById('app-screen').style.display = 'flex';
    document.body.style.overflow = '';

    // Attach logout listener — use a named handler so we can safely remove+re-add
    // without cloneNode (cloneNode breaks when App.init() re-renders the sidebar area)
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.removeEventListener('click', Auth._logoutHandler);
      Auth._logoutHandler = () => Auth.logout();
      logoutBtn.addEventListener('click', Auth._logoutHandler);
    }

    // Show feedback FAB now that user is in app
    const fab = document.getElementById('feedback-fab');
    if (fab) fab.style.display = 'flex';

    DB.startSession();
    DB.updateStreak();

    if (typeof Practice !== 'undefined' && Practice.loadState) Practice.loadState();
    if (typeof ErrorLog !== 'undefined' && ErrorLog.loadState) ErrorLog.loadState();

    if (!App.initialized) {
      App.init();
    } else {
      const uid = Auth.currentUser ? Auth.currentUser.id : 'anon';
      const lastPage = localStorage.getItem(`last_page_${uid}`) || 'dashboard';
      App.navigate(lastPage);
    }
  },

  async logout() {
    DB.endSession();

    if (typeof Dashboard !== 'undefined' && Dashboard.clearMemory) Dashboard.clearMemory();
    if (typeof Practice !== 'undefined' && Practice.clearMemory) Practice.clearMemory();
    if (typeof TestMode !== 'undefined' && TestMode.clearMemory) TestMode.clearMemory();
    if (typeof ErrorLog !== 'undefined' && ErrorLog.clearMemory) ErrorLog.clearMemory();

    // Clear demo persistence
    localStorage.removeItem('cat_demo_active');
    localStorage.removeItem('cat_demo_name');

    if (!USE_DEMO && sbClient) {
      try { await sbClient.auth.signOut(); } catch (e) { }
    }
    this.currentUser = null;
    USE_DEMO = false;
    App.initialized = false;

    document.getElementById('app-screen').style.display = 'none';
    const authEl = document.getElementById('auth-screen');
    authEl.style.display = '';
    authEl.classList.add('active');

    document.getElementById('login-email').value = '';
    document.getElementById('login-password').value = '';
    this.hideError();

    document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
    document.querySelector('.auth-tab[data-tab="login"]').classList.add('active');
    document.getElementById('tab-login').classList.add('active');

    Auth.init(); // Ensure event listeners exist if they were skipped on auto-login
    showToast('Logged out');
  },

  showError(msg) {
    const el = document.getElementById('auth-error');
    el.textContent = msg;
    el.classList.remove('hidden');
  },
  hideError() {
    document.getElementById('auth-error').classList.add('hidden');
  }
};
