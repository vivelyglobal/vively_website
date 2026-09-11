// Component loader utility - loads reusable header and footer
// Also initializes user authentication UI

// Load the Google Identity Services script exactly once, using
// createElement so it actually executes. `innerHTML` never runs
// <script> tags, which is why the GSI script inside header.html
// was silently ignored — that's the "Could not load Google Sign-In
// script" error users saw.
function ensureGoogleSignInScript() {
  if (document.getElementById('vively-gsi-script')) return;
  if (window.google && window.google.accounts && window.google.accounts.id) return;
  const s = document.createElement('script');
  s.id = 'vively-gsi-script';
  s.src = 'https://accounts.google.com/gsi/client';
  s.async = true;
  s.defer = true;
  document.head.appendChild(s);
}

async function loadComponent(componentName, targetSelector) {
  try {
    const response = await fetch(`/assets/components/${componentName}.html`);
    if (!response.ok) throw new Error(`Failed to load ${componentName}`);
    
    const html = await response.text();
    const target = document.querySelector(targetSelector);
    
    if (!target) {
      console.warn(`Target selector "${targetSelector}" not found`);
      return;
    }
    
    target.insertAdjacentHTML('beforeend', html);
    
    // Reinitialize any scripts that need to run after component load
    if (componentName === 'header') {
      initHeaderScripts();
    }
    
    return true;
  } catch (error) {
    console.error(`Error loading component ${componentName}:`, error);
    return false;
  }
}

// Load header and footer on page load
async function loadPageComponents() {
  ensureGoogleSignInScript();
  // Load header at the beginning of body
  const headerContainer = document.querySelector('body');
  if (headerContainer) {
    const headerHtml = await fetch('/assets/components/header.html?v=2').then(r => r.text());
    headerContainer.insertAdjacentHTML('afterbegin', headerHtml);
    initHeaderScripts();
  }
  
  // Load footer at the end of body
  const footerContainer = document.querySelector('body');
  if (footerContainer) {
    const footerHtml = await fetch('/assets/components/footer.html').then(r => r.text());
    footerContainer.insertAdjacentHTML('beforeend', footerHtml);
    initFooterScripts();
  }
}

// Initialize header interactions (mobile menu, etc)
function initHeaderScripts() {
  const burger = document.querySelector(".nav-burger");
  const mobileMenu = document.querySelector(".mobile-menu");
  
  if (burger && mobileMenu) {
    burger.addEventListener("click", () => {
      mobileMenu.classList.toggle("open");
      burger.classList.remove("is-open");
    });
    
    mobileMenu.querySelectorAll("a").forEach((a) =>
      a.addEventListener("click", () => {
        mobileMenu.classList.remove("open");
        burger.classList.remove("is-open");
      })
    );
    
    // ARIA attributes
    burger.setAttribute("aria-expanded", "false");
    burger.setAttribute("aria-controls", "mobile-menu");
    mobileMenu.id = mobileMenu.id || "mobile-menu";
    
    const syncBurger = () =>
      burger.setAttribute("aria-expanded", mobileMenu.classList.contains("open") ? "true" : "false");
    
    burger.addEventListener("click", syncBurger);
    mobileMenu.querySelectorAll("a").forEach((a) => a.addEventListener("click", syncBurger));
  }
  
  // Load signup modal FIRST, then load user-auth.js so the auth script
  // never runs before its DOM (signup steps) exists. This eliminates the
  // race that made the "Sign up" link do nothing.
  loadSignupModal().finally(() => initUserAuthUI());
}

// Load signup modal component
async function loadSignupModal() {
  try {
    const container = document.getElementById("signup-modal-container");
    if (!container) return;
    
    const html = await fetch('/assets/components/signup-modal.html?v=2').then(r => r.text());
    container.innerHTML = html;
  } catch (error) {
    console.error('Error loading signup modal:', error);
  }
}

// Initialize user authentication UI
function initUserAuthUI() {
  // Guard against double-injection (happens if header re-renders)
  if (document.getElementById('vively-user-auth-script')) return;
  // Dynamically load user-auth.js script
  const script = document.createElement('script');
  script.id = 'vively-user-auth-script';
  script.src = '/assets/js/user-auth.js?v=2';
  script.defer = true;
  document.body.appendChild(script);
}

// Initialize footer scripts
function initFooterScripts() {
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
}

// Auto-load components if page has header-container and footer-container elements
document.addEventListener("DOMContentLoaded", async () => {
  // Kick off the Google Identity Services script as early as possible so
  // the login modal has it ready by the time the user opens the modal.
  ensureGoogleSignInScript();

  // If page uses component containers, load them
  const headerContainer = document.getElementById("header-container");
  const footerContainer = document.getElementById("footer-container");
  
  if (headerContainer) {
    const headerHtml = await fetch('/assets/components/header.html?v=2').then(r => r.text()).catch(() => '');
    if (headerHtml) headerContainer.innerHTML = headerHtml;
    initHeaderScripts();
  }
  
  if (footerContainer) {
    const footerHtml = await fetch('/assets/components/footer.html').then(r => r.text()).catch(() => '');
    if (footerHtml) footerContainer.innerHTML = footerHtml;
    initFooterScripts();
  }
});
