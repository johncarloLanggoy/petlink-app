// ═══════════════════════════════════════════════════════════════════════
// PetLink — Homepage JavaScript
// ═══════════════════════════════════════════════════════════════════════
// NOTE: Navbar buttons (Login/Register vs Open Dashboard) ay server-side
// controlled na via Jinja template. Hindi na tayo gagamit ng JS para
// i-override ito para maiwasan ang conflict sa logout state.
// ═══════════════════════════════════════════════════════════════════════

// ── Check if user is logged in (para sa CTA buttons lang) ────────────
function isLoggedIn() {
  // Server-side na ang totoong check, pero dito sa JS we check
  // kung may Open Dashboard button na naka-render (indicator na naka-login)
  const dashboardBtn = document.querySelector('.dashboard-btn');
  if (dashboardBtn) return true;
  
  // Fallback: check localStorage (legacy)
  const token = localStorage.getItem('jwt_token') || sessionStorage.getItem('jwt_token');
  if (!token) return false;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const exp = payload.exp * 1000;
    if (Date.now() >= exp) {
      localStorage.removeItem('jwt_token');
      sessionStorage.removeItem('jwt_token');
      localStorage.removeItem('username');
      return false;
    }
    return true;
  } catch (e) {
    return false;
  }
}

// ── Get user role ─────────────────────────────────────────────────────
function getUserRole() {
  return localStorage.getItem('role') || sessionStorage.getItem('role') || 'user';
}

// ── Get redirect URL based on role ──────────────────────────────────
function getDashboardUrl() {
  // Kung may naka-render na dashboard URL sa button, gamitin ito
  const dashboardBtn = document.querySelector('.dashboard-btn');
  if (dashboardBtn && dashboardBtn.onclick) {
    // Try to extract URL from onclick — pero hindi reliable
  }
  
  const role = getUserRole();
  switch(role) {
    case 'admin':
      return '/admin';
    case 'staff':
      return '/staff';
    case 'vet':
      return '/vet';
    default:
      return '/dashboard';
  }
}

// ── Redirect to dashboard based on role ─────────────────────────────
function redirectToDashboard() {
  // Kung may naka-render na dashboard button (server-side), i-click ito
  const dashboardBtn = document.querySelector('.dashboard-btn');
  if (dashboardBtn) {
    // Kunin yung URL mula sa onclick attribute ng button
    const onclickAttr = dashboardBtn.getAttribute('onclick') || '';
    const match = onclickAttr.match(/href=['"]([^'"]+)['"]/);
    if (match && match[1]) {
      window.location.href = match[1];
      return;
    }
  }
  
  // Fallback
  window.location.href = getDashboardUrl();
}

// ── Open Auth Modal (redirects to login/register pages) ─────────────
function openAuthModal(type) {
  if (type === 'register') {
    window.location.href = '/register';
  } else {
    window.location.href = '/login';
  }
}

// ── Handle Main CTA Button Click ────────────────────────────────────
function handleMainCta() {
  if (isLoggedIn()) {
    redirectToDashboard();
  } else {
    window.location.href = '/login';
  }
}

// ── Handle hero CTA button click ─────────────────────────────────────
function handleHeroCta() {
  if (isLoggedIn()) {
    redirectToDashboard();
  } else {
    window.location.href = '/login';
  }
}

// ═══════════════════════════════════════════════════════════════════════
// ⚠️ updateNavbar() — DISABLED
// ─────────────────────────────────────────────────────────────────────
// Ito yung cause ng problema kung bakit lumalabas yung "Open Dashboard"
// kahit nag-logout ka na. Server-side (Flask session) na ang titingin
// kung naka-login ka o hindi.
//
// HUWAG BURAHIN ito — kailangan pa rin ito ng ibang functions.
// Pero HINDI NA TINATAWAG sa page load.
// ═══════════════════════════════════════════════════════════════════════
function updateNavbar() {
  const navButtons = document.getElementById('navButtons');
  
  console.log('🔄 updateNavbar() called — but DISABLED to avoid conflict with server-side rendering');
  
  // ⚠️ DISABLED: Hindi na natin ito gagamitin para mag-override ng navbar
  // Ang navbar ay server-side na controlled via Jinja template
  
  // Update CTA buttons lang (hero + main) — ito OK pa
  const heroCta = document.getElementById('heroCtaBtn');
  const mainCta = document.getElementById('mainCtaBtn');
  
  if (isLoggedIn()) {
    if (heroCta) {
      heroCta.innerHTML = '<i class="fas fa-tachometer-alt"></i> Go to Dashboard';
      heroCta.onclick = redirectToDashboard;
    }
    if (mainCta) {
      mainCta.innerHTML = '<i class="fas fa-tachometer-alt"></i> Open Dashboard';
      mainCta.className = 'btn-tutorial';
      mainCta.onclick = redirectToDashboard;
    }
  } else {
    if (heroCta) {
      heroCta.innerHTML = '<i class="fas fa-rocket"></i> Get Started';
      heroCta.onclick = () => window.location.href = '/login';
    }
    if (mainCta) {
      mainCta.innerHTML = '<i class="fas fa-sign-in-alt"></i> Login to Get Started';
      mainCta.className = 'btn-tutorial';
      mainCta.onclick = () => window.location.href = '/login';
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════
// SCROLL ANIMATIONS
// ═══════════════════════════════════════════════════════════════════════

// ── Smooth scroll animation for navigation links ────────────────────
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  });
});

// ── Scroll animation - reveal elements when they come into view ──────
const observerOptions = {
  threshold: 0.2,
  rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, observerOptions);

// Observe feature cards
const cards = document.querySelectorAll('.card');
cards.forEach(card => observer.observe(card));

// Observe about section
const aboutSection = document.querySelector('.about-content');
if (aboutSection) observer.observe(aboutSection);

// Observe stat items
const statItems = document.querySelectorAll('.stat-item');
statItems.forEach(item => observer.observe(item));

// ── Navbar shrink on scroll ──────────────────────────────────────────
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  if (window.scrollY > 50) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }
});

// ── Scroll progress bar ──────────────────────────────────────────────
const scrollProgress = document.getElementById('scrollProgress');
window.addEventListener('scroll', () => {
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
  const scrollPercentage = (scrollTop / scrollHeight) * 100;
  scrollProgress.style.width = scrollPercentage + '%';
});

// ── Counter animation for stats ──────────────────────────────────────
function animateCounter(element, target) {
  let current = 0;
  const increment = target / 50;
  const timer = setInterval(() => {
    current += increment;
    if (current >= target) {
      element.textContent = target.toLocaleString() + '+';
      clearInterval(timer);
    } else {
      element.textContent = Math.floor(current).toLocaleString() + '+';
    }
  }, 30);
}

// Trigger counter when stats become visible
const statsObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const statNumbers = entry.target.querySelectorAll('.stat-number');
      statNumbers.forEach(stat => {
        const targetValue = parseInt(stat.textContent);
        if (!isNaN(targetValue) && stat.getAttribute('data-animated') !== 'true') {
          stat.setAttribute('data-animated', 'true');
          animateCounter(stat, targetValue);
        }
      });
      statsObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.5 });

const statsSection = document.querySelector('.stats');
if (statsSection) statsObserver.observe(statsSection);

// ── Parallax effect for hero section ──────────────────────────────────
window.addEventListener('scroll', () => {
  const scrolled = window.pageYOffset;
  const hero = document.querySelector('.hero');
  if (hero) {
    hero.style.backgroundPositionY = scrolled * 0.5 + 'px';
  }
});

// ── Add floating animation delay to cards ────────────────────────────
cards.forEach((card, index) => {
  card.style.transitionDelay = `${index * 0.1}s`;
});

// ── Preload animation for elements already visible on page load ──────
setTimeout(() => {
  cards.forEach(card => {
    const rect = card.getBoundingClientRect();
    if (rect.top < window.innerHeight - 100) {
      card.classList.add('visible');
    }
  });
  if (aboutSection && aboutSection.getBoundingClientRect().top < window.innerHeight - 100) {
    aboutSection.classList.add('visible');
  }
  statItems.forEach(item => {
    if (item.getBoundingClientRect().top < window.innerHeight - 100) {
      item.classList.add('visible');
    }
  });
}, 100);

// ═══════════════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════════════

// ── Initialize CTA buttons (PERO HINDI ang navbar) ───────────────────
// Ang navbar ay server-side na controlled. Yung CTA buttons lang (hero + main)
// ang aayusin natin via JS.
updateNavbar(); // ← Ito ngayon, CTA buttons lang ang ini-update (navbar disabled)

// ═══════════════════════════════════════════════════════════════════════
// GLOBAL EXPORTS
// ═══════════════════════════════════════════════════════════════════════

window.isLoggedIn = isLoggedIn;
window.getUserRole = getUserRole;
window.getDashboardUrl = getDashboardUrl;
window.redirectToDashboard = redirectToDashboard;
window.handleHeroCta = handleHeroCta;
window.handleMainCta = handleMainCta;
window.updateNavbar = updateNavbar;
window.openAuthModal = openAuthModal;