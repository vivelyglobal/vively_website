// User authentication for regular users (not admin)
// Handles login, signup, logout, and session persistence

(function() {
  const API_BASE = '/.netlify/functions';
  const TOKEN_KEY = 'vively_user_token';
  const USER_KEY = 'vively_user_data';

  // DOM elements
  const loginModal = document.getElementById('login-modal');
  const loginLink = document.getElementById('login-link');
  const mobileLoginLink = document.getElementById('mobile-login-link');
  const modalClose = document.getElementById('modal-close');
  const userProfile = document.getElementById('user-profile');
  const mobileUserProfile = document.getElementById('mobile-user-profile');
  const logoutBtn = document.getElementById('logout-btn');
  const mobileLogoutBtn = document.getElementById('mobile-logout-btn');
  const userLoginForm = document.getElementById('user-login-form');
  const userSignupForm = document.getElementById('user-signup-form');
  const signupToggle = document.getElementById('signup-toggle');
  const loginToggle = document.getElementById('login-toggle');
  const googleLoginBtn = document.getElementById('google-login-btn');

  // Initialize auth state on page load
  function initAuth() {
    checkAuthStatus();
    setupEventListeners();
  }

  // Check if user is already logged in
  function checkAuthStatus() {
    const token = localStorage.getItem(TOKEN_KEY);
    const userData = localStorage.getItem(USER_KEY);

    if (token && userData) {
      const user = JSON.parse(userData);
      setAuthUI(true, user);
    } else {
      setAuthUI(false);
    }
  }

  // Update UI based on auth status
  function setAuthUI(isLoggedIn, user = null) {
    if (isLoggedIn && user) {
      // Show user profile, hide login
      if (userProfile) userProfile.style.display = 'flex';
      if (loginLink) loginLink.style.display = 'none';
      
      if (mobileUserProfile) mobileUserProfile.style.display = 'block';
      if (mobileLoginLink) mobileLoginLink.style.display = 'none';

      const userName = document.getElementById('user-name');
      const mobileUserName = document.getElementById('mobile-user-name');
      
      if (userName) userName.textContent = `Hi, ${user.name || user.email}`;
      if (mobileUserName) mobileUserName.textContent = `Logged in as: ${user.name || user.email}`;
    } else {
      // Show login, hide profile
      if (userProfile) userProfile.style.display = 'none';
      if (loginLink) loginLink.style.display = 'inline-flex';
      
      if (mobileUserProfile) mobileUserProfile.style.display = 'none';
      if (mobileLoginLink) mobileLoginLink.style.display = 'block';
    }
  }

  // Setup event listeners
  function setupEventListeners() {
    // Modal open/close
    if (loginLink) {
      loginLink.addEventListener('click', (e) => {
        e.preventDefault();
        openLoginModal();
      });
    }
    
    if (mobileLoginLink) {
      mobileLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        openLoginModal();
      });
    }

    if (modalClose) {
      modalClose.addEventListener('click', closeLoginModal);
    }

    if (loginModal) {
      loginModal.addEventListener('click', (e) => {
        if (e.target === loginModal) closeLoginModal();
      });
    }

    // Form toggles
    if (signupToggle) {
      signupToggle.addEventListener('click', (e) => {
        e.preventDefault();
        toggleAuthForms();
      });
    }

    if (loginToggle) {
      loginToggle.addEventListener('click', (e) => {
        e.preventDefault();
        toggleAuthForms();
      });
    }

    // Form submissions
    if (userLoginForm) {
      userLoginForm.addEventListener('submit', handleLogin);
    }

    if (userSignupForm) {
      userSignupForm.addEventListener('submit', handleSignup);
    }

    // Google login (placeholder)
    if (googleLoginBtn) {
      googleLoginBtn.addEventListener('click', (e) => {
        e.preventDefault();
        handleGoogleLogin();
      });
    }

    // Logout
    if (logoutBtn) {
      logoutBtn.addEventListener('click', handleLogout);
    }

    if (mobileLogoutBtn) {
      mobileLogoutBtn.addEventListener('click', handleLogout);
    }
  }

  function openLoginModal() {
    if (loginModal) {
      loginModal.style.display = 'flex';
      document.body.style.overflow = 'hidden';
    }
  }

  function closeLoginModal() {
    if (loginModal) {
      loginModal.style.display = 'none';
      document.body.style.overflow = '';
      // Reset forms
      if (userLoginForm) userLoginForm.reset();
      if (userSignupForm) userSignupForm.reset();
    }
  }

  function toggleAuthForms() {
    const loginContainer = document.querySelector('.login-form-container');
    const signupContainer = document.querySelector('.signup-form-container');
    
    if (loginContainer && signupContainer) {
      const loginHidden = loginContainer.style.display === 'none';
      loginContainer.style.display = loginHidden ? 'block' : 'none';
      signupContainer.style.display = loginHidden ? 'none' : 'block';
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
        body: JSON.stringify({ email, password, action: 'login' })
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || 'Login failed');
        return;
      }

      // Store token and user data
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));

      // Update UI
      setAuthUI(true, data.user);
      closeLoginModal();

      // Optionally redirect or show success
      console.log('User logged in:', data.user.email);
    } catch (error) {
      console.error('Login error:', error);
      alert('Login failed: ' + error.message);
    }
  }

  async function handleSignup(e) {
    e.preventDefault();
    
    const name = document.getElementById('signup-name')?.value;
    const email = document.getElementById('signup-email')?.value;
    const password = document.getElementById('signup-password')?.value;

    if (!name || !email || !password) {
      alert('Please fill in all fields');
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/auth-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, action: 'register' })
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || 'Signup failed');
        return;
      }

      // Store token and user data
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));

      // Update UI
      setAuthUI(true, data.user);
      closeLoginModal();

      console.log('User registered:', data.user.email);
    } catch (error) {
      console.error('Signup error:', error);
      alert('Signup failed: ' + error.message);
    }
  }

  function handleGoogleLogin() {
    // Placeholder for Google OAuth
    // In production, implement OAuth flow with Google
    alert('Google login coming soon! For now, use email/password.');
  }

  function handleLogout() {
    // Clear stored data
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);

    // Update UI
    setAuthUI(false);

    // Close mobile menu if open
    const mobileMenu = document.querySelector('.mobile-menu');
    if (mobileMenu && mobileMenu.classList.contains('open')) {
      mobileMenu.classList.remove('open');
      document.querySelector('.nav-burger').classList.remove('is-open');
    }

    console.log('User logged out');
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAuth);
  } else {
    initAuth();
  }

  // Export for external use
  window.VivelyAuth = {
    getToken: () => localStorage.getItem(TOKEN_KEY),
    getUser: () => {
      const userData = localStorage.getItem(USER_KEY);
      return userData ? JSON.parse(userData) : null;
    },
    isLoggedIn: () => !!localStorage.getItem(TOKEN_KEY),
    logout: handleLogout
  };
})();
