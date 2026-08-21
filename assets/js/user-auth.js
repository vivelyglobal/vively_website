// Multi-step user signup + login handler
(function() {
  const API_BASE = '/.netlify/functions';
  const TOKEN_KEY = 'vively_user_token';
  const USER_KEY = 'vively_user_data';

  // Current signup state
  let signupState = {
    email: null,
    userData: {},
  };

  // =========================
  // INITIALIZATION
  // =========================
  async function init() {
    checkAuthStatus();
    // Wait for signup modal to load first
    await loadSignupModalComponent();
    setupLoginModal();
    setupSignupMultiStep();
    setupLogout();
    // Delegated fallbacks so the toggles always work, even if a re-render
    // wiped the direct handlers or the modal loaded after setup.
    setupDelegatedToggles();

    // Expose simple portal-level helpers so any page (e.g. campaigns)
    // can open auth UI without duplicating modal logic.
    window.vivelyOpenLoginModal = () => {
      const loginLink = document.getElementById('login-link');
      if (loginLink) {
        loginLink.click();
        return;
      }
      const loginModal = document.getElementById('login-modal');
      if (loginModal) loginModal.style.display = 'flex';
    };

    window.vivelyOpenSignupModal = () => {
      const loginModal = document.getElementById('login-modal');
      if (loginModal) loginModal.style.display = 'flex';
      const loginContainer = document.querySelector('.login-form-container');
      if (loginContainer) loginContainer.style.display = 'none';
      showSignupStep(1);
    };
  }

  function checkAuthStatus() {
    const token = localStorage.getItem(TOKEN_KEY);
    const userData = localStorage.getItem(USER_KEY);

    if (token && userData) {
      const user = JSON.parse(userData);
      updateAuthUI(true, user);
    } else {
      updateAuthUI(false);
    }
  }

  // =========================
  // LOGIN MODAL (existing login)
  // =========================
  function setupLoginModal() {
    const loginModal = document.getElementById('login-modal');
    const loginLink = document.getElementById('login-link');
    const mobileLoginLink = document.getElementById('mobile-login-link');
    const modalClose = document.getElementById('modal-close');
    const userLoginForm = document.getElementById('user-login-form');
    const googleLoginBtn = document.getElementById('google-login-btn');

    // Open modal (always start on login view)
    const showLoginView = () => {
      const loginContainer = document.querySelector('.login-form-container');
      const signupContainer = document.querySelector('.signup-form-container');
      if (loginContainer) loginContainer.style.display = 'block';
      if (signupContainer) signupContainer.style.display = 'none';
      if (loginModal) loginModal.style.display = 'flex';
    };

    if (loginLink) loginLink.addEventListener('click', (e) => {
      e.preventDefault();
      showLoginView();
    });

    if (mobileLoginLink) mobileLoginLink.addEventListener('click', (e) => {
      e.preventDefault();
      showLoginView();
    });

    // Close modal
    if (modalClose) modalClose.addEventListener('click', () => {
      if (loginModal) loginModal.style.display = 'none';
    });

    if (loginModal) {
      loginModal.addEventListener('click', (e) => {
        if (e.target === loginModal) loginModal.style.display = 'none';
      });
    }

    // Form submit
    if (userLoginForm) {
      userLoginForm.addEventListener('submit', handleLogin);
    }

    // Google login — render official Google Sign-In button (reliable popup)
    initGoogleSignIn();

    // Retain click handler on the fallback custom button (only shown if GSI failed)
    if (googleLoginBtn) {
      googleLoginBtn.addEventListener('click', handleGoogleLogin);
    }

    // Toggle to signup (keeps modal open, swaps inner containers)
    const signupToggle = document.getElementById('signup-toggle');
    if (signupToggle) {
      signupToggle.addEventListener('click', (e) => {
        e.preventDefault();
        // Ensure modal is open
        if (loginModal) loginModal.style.display = 'flex';
        // Hide login form, show signup form
        const loginContainer = document.querySelector('.login-form-container');
        if (loginContainer) loginContainer.style.display = 'none';
        showSignupStep(1);
      });
    }
  }

  async function handleLogin(e) {
    e.preventDefault();

    const email = document.getElementById('user-email')?.value;
    const password = document.getElementById('user-password')?.value;

    if (!email || !password) {
      alert('Please enter email and password');
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/auth-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || 'Login failed');
        return;
      }

      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      updateAuthUI(true, data.user);

      const loginModal = document.getElementById('login-modal');
      if (loginModal) loginModal.style.display = 'none';
    } catch (error) {
      console.error('Login error:', error);
      alert('Login failed');
    }
  }

  // Google login handler — Google Identity Services (GIS)
  function handleGoogleLogin() {
    const clientId = document.querySelector('[data-google-client-id]')?.dataset.googleClientId;
    if (!clientId) {
      showAuthError('Google Sign-In not configured (missing GOOGLE_CLIENT_ID)');
      return;
    }
    if (typeof google === 'undefined' || !google.accounts || !google.accounts.id) {
      // Script isn't ready yet — kick a re-render attempt (it will retry
      // for a few seconds) and show a non-blocking hint.
      showAuthError('Loading Google Sign-In… please wait a moment and try again.');
      initGoogleSignIn();
      return;
    }
    try {
      google.accounts.id.initialize({
        client_id: clientId,
        callback: handleGoogleCredential,
        auto_select: false,
        ux_mode: 'popup',
      });
      // Show the One Tap / account chooser prompt
      google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          console.warn('Google prompt not shown:', notification.getNotDisplayedReason?.() || notification.getSkippedReason?.());
        }
      });
    } catch (err) {
      console.error('Google init error:', err);
      showAuthError('Failed to start Google Sign-In: ' + err.message);
    }
  }

  // Renders the official Google Sign-In button (guaranteed popup, no FedCM issues).
  // Waits for the gsi/client script to load before rendering.
  let googleInitialized = false;
  function initGoogleSignIn() {
    const clientId = document.querySelector('[data-google-client-id]')?.dataset.googleClientId;
    const container = document.getElementById('google-signin-container');
    const fallbackBtn = document.getElementById('google-login-btn');

    if (!clientId || !container) {
      console.warn('[Google] missing client ID or #google-signin-container');
      if (fallbackBtn) fallbackBtn.style.display = 'inline-flex';
      return;
    }

    // Already rendered on a previous setupLoginModal() pass — don't stack buttons.
    if (container.childElementCount > 0) return;

    let attempts = 0;
    const maxAttempts = 60; // ~6s total

    const tryRender = () => {
      if (typeof google !== 'undefined' && google.accounts && google.accounts.id) {
        try {
          if (!googleInitialized) {
            google.accounts.id.initialize({
              client_id: clientId,
              callback: handleGoogleCredential,
              auto_select: false,
              ux_mode: 'popup',
              // Disable FedCM — it's flaky on localhost and causes silent failures.
              use_fedcm_for_prompt: false,
            });
            googleInitialized = true;
          }
          google.accounts.id.renderButton(container, {
            theme: 'outline',
            size: 'large',
            type: 'standard',
            text: 'continue_with',
            shape: 'rectangular',
            logo_alignment: 'left',
            width: 320,
          });
          console.log('[Google] Sign-In button rendered');
        } catch (err) {
          console.error('[Google] renderButton failed:', err);
          showAuthError(
            'Google Sign-In failed to initialize. Make sure ' +
              location.origin +
              ' is added to your OAuth client "Authorized JavaScript origins" in Google Cloud Console.'
          );
          if (fallbackBtn) fallbackBtn.style.display = 'inline-flex';
        }
        return;
      }
      if (++attempts >= maxAttempts) {
        console.warn('[Google] gsi/client script did not load, showing fallback button');
        showAuthError(
          'Could not load Google Sign-In script (https://accounts.google.com/gsi/client). ' +
            'Check your network / ad-blocker and reload.'
        );
        if (fallbackBtn) fallbackBtn.style.display = 'inline-flex';
        return;
      }
      setTimeout(tryRender, 100);
    };
    tryRender();
  }

  // Shows a small red error line inside the login form (non-blocking).
  function showAuthError(message) {
    const host = document.querySelector('.login-form-container');
    if (!host) return;
    let box = host.querySelector('.auth-error-inline');
    if (!box) {
      box = document.createElement('div');
      box.className = 'auth-error-inline';
      box.style.cssText =
        'color:#c53030;background:#fff5f5;border:1px solid #fed7d7;padding:8px 10px;border-radius:4px;font-size:12px;margin:8px 0;';
      host.insertBefore(box, host.firstChild);
    }
    box.textContent = message;
  }

  // Receives Google ID token, exchanges for Vively JWT
  async function handleGoogleCredential(response) {
    if (!response || !response.credential) {
      showAuthError('Google Sign-In returned no credential.');
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/auth-google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: response.credential }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const detail = data.details ? ` (${data.details})` : '';
        showAuthError((data.error || 'Google sign-in failed') + detail);
        return;
      }

      // Backend says: account doesn't exist yet → send user through the
      // full signup flow with Google data prefilled. Backend has already
      // stashed the verified googleId server-side, so create-account can
      // link it without trusting anything from this browser.
      if (data.needsSignup && data.prefill) {
        startGoogleSignupFlow(data.prefill);
        return;
      }

      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      updateAuthUI(true, data.user);
      const loginModal = document.getElementById('login-modal');
      if (loginModal) loginModal.style.display = 'none';
    } catch (err) {
      console.error('Google credential error:', err);
      showAuthError('Google sign-in failed: ' + err.message);
    }
  }

  // Kick off the multi-step signup flow with values prefilled from Google.
  // Email is locked (Google-verified), full name is prefilled but editable.
  function startGoogleSignupFlow(prefill) {
    const loginModal = document.getElementById('login-modal');
    const loginContainer = document.querySelector('.login-form-container');
    const signupContainer = document.querySelector('.signup-form-container');
    if (loginModal) loginModal.style.display = 'flex';
    if (loginContainer) loginContainer.style.display = 'none';
    if (signupContainer) signupContainer.style.display = 'block';

    // Remember we're in the Google branch for later prefill of step 2.
    signupState.googleSignup = true;
    signupState.googlePrefill = prefill;

    // Prefill + lock the email input on step 1.
    showSignupStep(1);
    const emailInput = document.getElementById('signup-email-input');
    if (emailInput) {
      emailInput.value = prefill.email || '';
      emailInput.readOnly = true;
      emailInput.style.background = '#f7f7f5';
      emailInput.style.cursor = 'not-allowed';
      // Add a small notice above the input the first time we render this.
      const form = document.getElementById('signup-email-form');
      if (form && !form.querySelector('.google-prefill-note')) {
        const note = document.createElement('p');
        note.className = 'google-prefill-note';
        note.style.cssText =
          'font-size:12px;color:#666;margin:0 0 12px;padding:8px 10px;background:#f0f7ff;border:1px solid #d6e4ff;border-radius:4px;';
        note.textContent =
          'Signing up with Google — we\u2019ll send a 6-digit code to this email to confirm it\u2019s you.';
        form.insertBefore(note, form.firstChild);
      }
    }
  }

  // =========================
  // MULTI-STEP SIGNUP
  // =========================
  async function loadSignupModalComponent() {
    try {
      const container = document.getElementById("signup-modal-container");
      if (!container) {
        console.warn("signup-modal-container not found");
        return;
      }

      const html = await fetch("/assets/components/signup-modal.html").then(
        (r) => r.text()
      );
      container.innerHTML = html;
      console.log("Signup modal loaded");
    } catch (error) {
      console.error("Error loading signup modal:", error);
    }
  }

  function setupSignupMultiStep() {
    // Setup handlers immediately (modal should now be in DOM)
    setupSignupStep1();
    setupSignupStep1b();
    setupSignupStep2();
    setupSignupStep3();
    setupSignupStep4();
  }

  // === STEP 1: Email ===
  function setupSignupStep1() {
    const form = document.getElementById('signup-email-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const email = document.getElementById('signup-email-input')?.value;
      if (!email) {
        alert('Please enter your email');
        return;
      }

      const btn = form.querySelector('button');
      const originalText = btn.textContent;
      btn.disabled = true;
      btn.textContent = 'Sending...';

      try {
        const response = await fetch(`${API_BASE}/auth-signup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'send-code',
            email,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          alert(data.error || 'Failed to send code');
          return;
        }

        signupState.email = email;
        document.getElementById('verify-email-display').textContent = email;
        showSignupStep('1b');

        // Dev-only: log the code to the browser console so you can test
        // without an inbox. `devCode` is only returned by the backend when
        // NODE_ENV !== 'production'. We intentionally do NOT auto-fill the
        // inputs — the user must type the code exactly as they would in prod.
        if (data.devCode) {
          const note = data.devNote ? ` (${data.devNote})` : '';
          console.info(`[dev] Verification code for ${email}: ${data.devCode}${note}`);
        }
      } catch (error) {
        console.error('Send code error:', error);
        alert('Failed to send verification code');
      } finally {
        btn.disabled = false;
        btn.textContent = originalText;
      }
    });

    // Login link in step 1 (swap back to login form)
    const loginToggle = document.getElementById('login-toggle-1');
    if (loginToggle) {
      loginToggle.addEventListener('click', (e) => {
        e.preventDefault();
        const loginModal = document.getElementById('login-modal');
        if (loginModal) loginModal.style.display = 'flex';
        // Hide signup container, show login container
        const signupContainer = document.querySelector('.signup-form-container');
        if (signupContainer) signupContainer.style.display = 'none';
        const loginContainer = document.querySelector('.login-form-container');
        if (loginContainer) loginContainer.style.display = 'block';
      });
    }
  }

  // === STEP 1b: Verify Code ===
  function setupSignupStep1b() {
    const codeInputs = document.querySelectorAll('.code-input');
    const form = document.getElementById('signup-verify-code-form');
    const hiddenCodeInput = document.getElementById('signup-code');

    // Auto-advance between code input fields
    codeInputs.forEach((input, index) => {
      input.addEventListener('input', (e) => {
        if (e.target.value && index < codeInputs.length - 1) {
          codeInputs[index + 1].focus();
        }
      });

      input.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && !e.target.value && index > 0) {
          codeInputs[index - 1].focus();
        }
      });
    });

    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Combine code inputs
        const code = Array.from(codeInputs).map((i) => i.value).join('');
        if (code.length !== 6) {
          alert('Please enter a 6-digit code');
          return;
        }

        const btn = form.querySelector('button');
        const originalText = btn.textContent;
        btn.disabled = true;
        btn.textContent = 'Verifying...';

        try {
          const response = await fetch(`${API_BASE}/auth-signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'verify-code',
              email: signupState.email,
              code,
            }),
          });

          const data = await response.json();

          if (!response.ok) {
            alert(data.error || 'Verification failed');
            return;
          }

          showSignupStep(2);
        } catch (error) {
          console.error('Verify code error:', error);
          alert('Verification failed');
        } finally {
          btn.disabled = false;
          btn.textContent = originalText;
        }
      });
    }

    // Resend code link
    const resendLink = document.getElementById('resend-code-link');
    if (resendLink) {
      resendLink.addEventListener('click', (e) => {
        e.preventDefault();
        setupSignupStep1(); // Reset and re-trigger step 1
        showSignupStep(1);
      });
    }
  }

  // === STEP 2: Profile Info ===
  function setupSignupStep2() {
    const btn = document.getElementById('signup-next-2');
    if (!btn) return;

    // Populate DOB Year + Day dropdowns and wire month/year -> day clamping.
    setupDobSelects();

    // Wire "Other" text-input reveal for country dropdowns.
    setupOtherToggle('signup-nationality', 'signup-nationality-other');
    setupOtherToggle('signup-residence', 'signup-residence-other');
    setupOtherToggle('signup-second-nationality', 'signup-second-nationality-other');

    btn.addEventListener('click', async (e) => {
      e.preventDefault();

      const username = document.getElementById('signup-username')?.value;
      const fullName = document.getElementById('signup-full-name')?.value;
      const gender = document.querySelector('input[name="gender"]:checked')?.value;
      const nationality = getSelectOrOther('signup-nationality', 'signup-nationality-other');
      const secondNationality = getSelectOrOther('signup-second-nationality', 'signup-second-nationality-other');
      const residence = getSelectOrOther('signup-residence', 'signup-residence-other');
      const dobMonth = document.getElementById('signup-dob-month')?.value;
      const dobDay = document.getElementById('signup-dob-day')?.value;
      const dobYear = document.getElementById('signup-dob-year')?.value;
      const dob = dobMonth && dobDay && dobYear
        ? `${dobYear}-${dobMonth}-${dobDay.padStart(2, '0')}`
        : '';

      if (!username || !fullName || !gender || !nationality || !residence || !dob) {
        alert('Please fill in all required fields');
        return;
      }

      signupState.userData = {
        ...signupState.userData,
        username,
        fullName,
        gender,
        nationality,
        secondNationality: secondNationality || null,
        residence,
        dob,
      };

      showSignupStep(3);
    });
  }

  // Populate DOB day + year <select>s and keep day options valid for the
  // chosen month/year (e.g. no Feb 30, respects leap years).
  function setupDobSelects() {
    const monthSel = document.getElementById('signup-dob-month');
    const daySel = document.getElementById('signup-dob-day');
    const yearSel = document.getElementById('signup-dob-year');
    if (!monthSel || !daySel || !yearSel) return;
    if (yearSel.dataset.populated === '1') return; // idempotent

    // Years: current year down to 100 years ago. Default header year = current - 20
    // (rough median for signup demographic — user still has to pick).
    const currentYear = new Date().getFullYear();
    for (let y = currentYear; y >= currentYear - 100; y--) {
      const opt = document.createElement('option');
      opt.value = String(y);
      opt.textContent = String(y);
      yearSel.appendChild(opt);
    }
    yearSel.dataset.populated = '1';

    function daysInMonth(month, year) {
      if (!month) return 31;
      const m = parseInt(month, 10);
      const y = parseInt(year, 10) || 2000; // fallback for leap calc
      return new Date(y, m, 0).getDate();
    }

    function refreshDays() {
      const prev = daySel.value;
      const max = daysInMonth(monthSel.value, yearSel.value);
      // Clear except placeholder
      daySel.innerHTML = '<option value="">Day</option>';
      for (let d = 1; d <= max; d++) {
        const opt = document.createElement('option');
        opt.value = String(d);
        opt.textContent = String(d);
        daySel.appendChild(opt);
      }
      // Restore prior selection if still valid
      if (prev && parseInt(prev, 10) <= max) daySel.value = prev;
    }

    monthSel.addEventListener('change', refreshDays);
    yearSel.addEventListener('change', refreshDays);
    refreshDays();
  }

  // When user picks "Other" in a <select>, show the paired free-text <input>.
  // Otherwise hide it and clear its value so it doesn't linger in state.
  function setupOtherToggle(selectId, inputId) {
    const sel = document.getElementById(selectId);
    const inp = document.getElementById(inputId);
    if (!sel || !inp) return;
    if (sel.dataset.otherWired === '1') return; // idempotent
    sel.dataset.otherWired = '1';

    const sync = () => {
      if (sel.value === 'Other') {
        inp.style.display = 'block';
      } else {
        inp.style.display = 'none';
        inp.value = '';
      }
    };
    sel.addEventListener('change', sync);
    sync();
  }

  // Return trimmed "Other" text when select === 'Other', else the select value.
  function getSelectOrOther(selectId, inputId) {
    const sel = document.getElementById(selectId);
    if (!sel) return '';
    if (sel.value === 'Other') {
      return (document.getElementById(inputId)?.value || '').trim();
    }
    return sel.value;
  }

  // === STEP 3: Socials ===
  function setupSignupStep3() {
    const btn = document.getElementById('signup-next-3');
    if (!btn) return;

    btn.addEventListener('click', async (e) => {
      e.preventDefault();

      const phone = document.getElementById('signup-phone')?.value;
      const countryCode = document.getElementById('signup-country-code')?.value;
      const instagram = document.getElementById('signup-instagram')?.value;
      const tiktok = document.getElementById('signup-tiktok')?.value;
      const youtube = document.getElementById('signup-youtube')?.value;
      const bio = document.getElementById('signup-bio')?.value;
      const portfolioUrl = document.getElementById('signup-portfolio')?.value;
      const inviterUsername = document.getElementById('signup-inviter')?.value;

      // Validate required
      if (!phone || !instagram) {
        alert('Phone and Instagram are required');
        return;
      }

      // Get categories
      const categoryCheckboxes = document.querySelectorAll('input[name="categories"]:checked');
      const categories = Array.from(categoryCheckboxes).map((cb) => cb.value);

      if (categories.length === 0) {
        alert('Please select at least one content category');
        return;
      }

      signupState.userData = {
        ...signupState.userData,
        phone,
        countryCode,
        instagram,
        tiktok,
        youtube,
        bio,
        portfolioUrl: portfolioUrl || null,
        inviterUsername: inviterUsername || null,
        categories,
      };

      showSignupStep(4);
    });
  }

  // === STEP 4: Terms & Create ===
  function setupSignupStep4() {
    const form = document.getElementById('signup-final-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const password = document.getElementById('signup-password')?.value || '';
      const confirmPassword = document.getElementById('signup-password-confirm')?.value || '';
      const terms = document.getElementById('signup-terms')?.checked;
      const age = document.getElementById('signup-age')?.checked;
      const marketingOptIn = document.getElementById('signup-marketing')?.checked;

      if (!password || password.length < 8) {
        alert('Password must be at least 8 characters');
        return;
      }

      if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
        alert('Password must include at least one letter and one number');
        return;
      }

      if (password !== confirmPassword) {
        alert('Password confirmation does not match');
        return;
      }

      if (!terms || !age) {
        alert('Please agree to terms and confirm age');
        return;
      }

      const btn = form.querySelector('button');
      const originalText = btn.textContent;
      btn.disabled = true;
      btn.textContent = 'Creating account...';

      try {
        const response = await fetch(`${API_BASE}/auth-signup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'create-account',
            email: signupState.email,
            userData: {
              ...signupState.userData,
              password,
              marketingOptIn,
            },
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          alert(data.error || 'Account creation failed');
          return;
        }

        // Save token and user
        localStorage.setItem(TOKEN_KEY, data.token);
        localStorage.setItem(USER_KEY, JSON.stringify(data.user));
        updateAuthUI(true, data.user);

        // Close signup form + the outer login modal that wraps it.
        const container = document.querySelector('.signup-form-container');
        if (container) container.style.display = 'none';
        const loginModal = document.getElementById('login-modal');
        if (loginModal) loginModal.style.display = 'none';
        // Reset login-form to visible for next time user opens the modal.
        const loginContainer = document.querySelector('.login-form-container');
        if (loginContainer) loginContainer.style.display = 'block';

        // Reset signup state
        signupState = { email: null, userData: {} };
      } catch (error) {
        console.error('Account creation error:', error);
        alert('Failed to create account');
      } finally {
        btn.disabled = false;
        btn.textContent = originalText;
      }
    });
  }

  // =========================
  // STEP NAVIGATION
  // =========================
  function showSignupStep(stepNum) {
    // Show signup container if hidden
    const container = document.querySelector('.signup-form-container');
    if (container) {
      container.style.display = 'block';
    }

    // Hide all steps
    document.querySelectorAll('.signup-step').forEach((el) => {
      el.style.display = 'none';
    });

    // Show selected step
    const stepEl = document.getElementById(`signup-step-${stepNum}`);
    if (stepEl) {
      stepEl.style.display = 'block';
    } else {
      console.warn(`Signup step ${stepNum} not found`);
    }

    // If we're in the Google-signup branch and just arrived at step 2,
    // prefill the full name field. Email stays locked from step 1.
    if (stepNum === 2 && signupState.googleSignup && signupState.googlePrefill) {
      const nameInput = document.getElementById('signup-full-name');
      if (nameInput && !nameInput.value) {
        nameInput.value = signupState.googlePrefill.name || '';
      }
    }
  }

  // =========================
  // AUTH UI & LOGOUT
  // =========================
  function updateAuthUI(isLoggedIn, user = null) {
    const userProfile = document.getElementById('user-profile');
    const loginLink = document.getElementById('login-link');
    const mobileUserProfile = document.getElementById('mobile-user-profile');
    const mobileLoginLink = document.getElementById('mobile-login-link');

    if (isLoggedIn && user) {
      if (userProfile) userProfile.style.display = 'flex';
      if (loginLink) loginLink.style.display = 'none';
      if (mobileUserProfile) mobileUserProfile.style.display = 'block';
      if (mobileLoginLink) mobileLoginLink.style.display = 'none';

      const userName = document.getElementById('user-name');
      const mobileUserName = document.getElementById('mobile-user-name');

      if (userName) userName.textContent = `Hi, ${user.username || user.email}`;
      if (mobileUserName) mobileUserName.textContent = `${user.username || user.email}`;
    } else {
      if (userProfile) userProfile.style.display = 'none';
      if (loginLink) loginLink.style.display = 'inline-flex';
      if (mobileUserProfile) mobileUserProfile.style.display = 'none';
      if (mobileLoginLink) mobileLoginLink.style.display = 'block';
    }
  }

  function setupLogout() {
    const logoutBtn = document.getElementById('logout-btn');
    const mobileLogoutBtn = document.getElementById('mobile-logout-btn');

    const handleLogout = (e) => {
      e?.preventDefault();
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      updateAuthUI(false);
      const loginModal = document.getElementById('login-modal');
      if (loginModal) loginModal.style.display = 'none';
    };

    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
    if (mobileLogoutBtn) mobileLogoutBtn.addEventListener('click', handleLogout);
  }

  // Delegated click handler that survives DOM re-renders.
  // Attached to document.body ONCE — routes clicks on the signup/login
  // toggle links to the right view, even if the direct listeners set up
  // inside setupLoginModal() somehow missed their targets (race, re-render).
  let delegatedTogglesBound = false;
  function setupDelegatedToggles() {
    if (delegatedTogglesBound) return;
    delegatedTogglesBound = true;

    document.body.addEventListener('click', (e) => {
      const target = e.target.closest(
        '#signup-toggle, #login-toggle-1, #login-link, #mobile-login-link'
      );
      if (!target) return;
      e.preventDefault();

      const loginModal = document.getElementById('login-modal');
      const loginContainer = document.querySelector('.login-form-container');
      const signupContainer = document.querySelector('.signup-form-container');

      if (target.id === 'signup-toggle') {
        // Login → Signup
        if (loginModal) loginModal.style.display = 'flex';
        if (loginContainer) loginContainer.style.display = 'none';
        if (signupContainer) signupContainer.style.display = 'block';
        showSignupStep(1);
      } else {
        // Signup → Login, or Login button pressed
        if (loginModal) loginModal.style.display = 'flex';
        if (loginContainer) loginContainer.style.display = 'block';
        if (signupContainer) signupContainer.style.display = 'none';
      }
    });
  }

  // =========================
  // TRIGGER INIT
  // =========================
  function startInit() {
    init().catch((error) => {
      console.error("Auth init error:", error);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startInit);
  } else {
    startInit();
  }
})();
