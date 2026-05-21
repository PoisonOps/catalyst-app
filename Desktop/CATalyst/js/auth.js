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
        forgotKey: (e) => { if (e.key === 'Enter') this.forgotPassword(); },
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

    const forgotToggle = document.getElementById('forgot-pw-toggle');
    if (forgotToggle) { forgotToggle.onclick = () => this.showForgotPassword(); }

    const forgotBack = document.getElementById('forgot-back');
    if (forgotBack) { forgotBack.onclick = () => this.hideForgotPassword(); }

    const forgotBtn = document.getElementById('forgot-btn');
    if (forgotBtn) { forgotBtn.onclick = () => this.forgotPassword(); }

    const forgotEmail = document.getElementById('forgot-email');
    if (forgotEmail) { forgotEmail.removeEventListener('keydown', this._handlers.forgotKey); forgotEmail.addEventListener('keydown', this._handlers.forgotKey); }

    const gLoginBtn = document.getElementById('google-login-btn');
    if (gLoginBtn) { gLoginBtn.onclick = () => this.loginWithGoogle(); }

    const gSignupBtn = document.getElementById('google-signup-btn');
    if (gSignupBtn) { gSignupBtn.onclick = () => this.loginWithGoogle(); }
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
        // Email confirmation off — auto-login immediately
        this.currentUser = data.user;
        DB.initTrial();
        DB.logEvent('signup', data.user.id);
        this.onLogin(data.user);
      } else {
        // Email confirmation is on — user must verify before logging in
        this.showError('');
        this.hideError();
        this._showSignupPending();
      }
    } catch (err) {
      const msg = err.message || '';
      if (msg.includes('already registered') || msg.includes('already been registered')) {
        this.showError('This email is already registered. Try logging in instead.');
      } else {
        this.showError('Signup failed. Please try again.');
      }
    } finally { hideLoading(); }
  },

  _showSignupPending() {
    // Replace the signup form content with a confirmation message
    const form = document.getElementById('tab-signup');
    form.innerHTML = `
      <div style="text-align:center;padding:1rem 0;">
        <div style="font-size:2rem;margin-bottom:0.75rem;">📧</div>
        <p style="font-weight:600;color:var(--text);margin-bottom:0.5rem;">Check your email</p>
        <p style="font-size:0.85rem;color:var(--text2);line-height:1.5;">
          We sent a confirmation link to your inbox.<br>
          Click it to activate your account, then log in here.
        </p>
        <button class="btn-primary" style="margin-top:1.25rem;" onclick="
          document.querySelectorAll('.auth-form').forEach(f=>f.classList.remove('active'));
          document.querySelectorAll('.auth-tab').forEach(t=>t.classList.remove('active'));
          document.getElementById('tab-login').classList.add('active');
          document.querySelector('.auth-tab[data-tab=\\'login\\']').classList.add('active');
        ">Go to Login</button>
      </div>
    `;
  },

  demoMode() {
    USE_DEMO = true;
    const demoName = 'Demo User';
    this.currentUser = { id: 'demo', email: 'demo@catalyst.app', user_metadata: { full_name: demoName } };
    DB.logEvent('demo_started');

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

    if (!USE_DEMO) DB.initTrial();
    DB.startSession();
    DB.updateStreak();

    // Day-7 return check — fire once per user when they come back on day 7+
    if (!USE_DEMO && user.id !== 'demo') {
      const trial = DB._getLocal('cat_trial', null);
      const firedKey = `cat_day7_fired_${user.id}`;
      if (trial && !localStorage.getItem(firedKey)) {
        const elapsed = Date.now() - trial.started_at;
        if (elapsed >= 7 * 86400000) {
          DB.logEvent('day7_return', user.id);
          localStorage.setItem(firedKey, '1');
        }
      }
    }

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

  showForgotPassword() {
    document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
    document.getElementById('tab-forgot').classList.add('active');
    document.getElementById('forgot-success').classList.add('hidden');
    document.getElementById('forgot-email').value = '';
    this.hideError();
  },

  hideForgotPassword() {
    document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
    document.getElementById('tab-login').classList.add('active');
    document.querySelector('.auth-tab[data-tab="login"]').classList.add('active');
    this.hideError();
  },

  async forgotPassword() {
    const email = document.getElementById('forgot-email').value.trim();
    if (!email) { this.showError('Please enter your email'); return; }
    if (!_EMAIL_RE.test(email)) { this.showError('Enter a valid email'); return; }
    showLoading('Sending...');
    try {
      const { error } = await sbClient.auth.resetPasswordForEmail(email, {
        redirectTo: 'https://catalyst-app-six.vercel.app/reset-password.html'
      });
      if (error) throw error;
      this.hideError();
      document.getElementById('forgot-success').classList.remove('hidden');
    } catch (err) {
      const msg = (err.message || '').toLowerCase();
      if (msg.includes('rate limit') || msg.includes('too many') || msg.includes('over_email')) {
        this.showError('A reset link was already sent to this email. Check your inbox and spam folder.');
      } else {
        this.showError('Could not send reset link. Try again.');
      }
    } finally { hideLoading(); }
  },

  async loginWithGoogle() {
    try {
      const { error } = await sbClient.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: 'https://catalyst-app-six.vercel.app' }
      });
      if (error) throw error;
    } catch (err) {
      this.showError('Google sign-in failed. Try again.');
    }
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
