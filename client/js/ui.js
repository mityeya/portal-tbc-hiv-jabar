// UI global: navbar sticky/scroll, hamburger drawer mobile, scroll-reveal.
(function () {
  const navbar = document.querySelector('.navbar');
  function onScroll() { if (navbar) navbar.classList.toggle('scrolled', window.scrollY > 20); }
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

  const hamburger = document.querySelector('.hamburger');
  const navLinks = document.querySelector('.nav-links');
  const backdrop = document.querySelector('.nav-drawer-backdrop');
  function closeDrawer() { navLinks && navLinks.classList.remove('open'); backdrop && backdrop.classList.remove('show'); }
  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => { const open = navLinks.classList.toggle('open'); backdrop && backdrop.classList.toggle('show', open); });
    navLinks.querySelectorAll('a').forEach((a) => a.addEventListener('click', closeDrawer));
  }
  backdrop && backdrop.addEventListener('click', closeDrawer);

  const reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && reveals.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in-view'); io.unobserve(e.target); } });
    }, { threshold: 0.12 });
    reveals.forEach((el) => io.observe(el));
  } else { reveals.forEach((el) => el.classList.add('in-view')); }

  const y = document.querySelector('[data-year]');
  if (y) y.textContent = new Date().getFullYear();
})();
