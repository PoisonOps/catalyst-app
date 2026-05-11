// ============================================================
// AUTH.JS — Phase 2: demo persistence + trial/paid init
// ============================================================

const Auth = {
  currentUser: null,

  init() {
    document.getElementById('login-btn').addEventListener('click', () => this.login());
    document.getElementById('signup-btn').addEventListener('click', () => this.signup());
    document.getElementById('demo-btn').addEventListener('click', () => this.demoMode());
    // NOTE: logout listener is attached in onLogin() to cover all auth paths (real + demo + reload)

    document.querySelectorAll('.auth-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById('tab-' + tab.dataset.tab).classList.add('active');
        this.hideError();
      });
    });

    document.getElementById('login-password').addEventListener('keydown', e => { if (e.key === 'Enter') this.login(); });
    document.getElementById('signup-password').addEventListener('keydown', e => { if (e.key === 'Enter') this.signup(); });
  },

  async login() {
    if (USE_DEMO) { this.demoMode(); return; }
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    if (!email || !password) { this.showError('Please fill in all fields'); return; }
    showLoading('Logging in...');
    try {
      const { data, error } = await sbClient.auth.signInWithPassword({ email, password });
      if (error) throw error;
      this.currentUser = data.user;
      this.onLogin(data.user);
    } catch (err) {
      let msg = err.message || 'Login failed';
      if (msg.includes('Email not confirmed')) msg = '⚠️ Email not confirmed. Go to Supabase → Auth → Settings → disable "Enable email confirmations".';
      else if (msg.includes('Invalid login credentials')) msg = 'Wrong email or password.';
      this.showError(msg);
    } finally { hideLoading(); }
  },

  async signup() {
    if (USE_DEMO) { this.demoMode(); return; }
    const name = document.getElementById('signup-name').value.trim();
    const email = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('signup-password').value;
    if (!name || !email || !password) { this.showError('Please fill in all fields'); return; }
    if (password.length < 6) { this.showError('Password must be at least 6 characters'); return; }
    showLoading('Creating account...');
    try {
      const { data, error } = await sbClient.auth.signUp({ email, password, options: { data: { full_name: name } } });
      if (error) throw error;
      if (data.session) {
        this.currentUser = data.user;
        // Init trial on new signup
        DB.initTrial();
        this.onLogin(data.user);
      } else {
        this.showError('✅ Account created! Confirm your email, or disable email confirmation in Supabase Auth settings.');
      }
    } catch (err) {
      this.showError(err.message || 'Signup failed');
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
