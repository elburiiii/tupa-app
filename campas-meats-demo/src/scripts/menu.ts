const toggle = document.querySelector<HTMLButtonElement>('[data-menu-toggle]');
const nav = document.getElementById('mobile-nav');
if (toggle && nav) {
  const set = (open: boolean) => {
    toggle.setAttribute('aria-expanded', String(open));
    nav.hidden = !open;
  };
  toggle.addEventListener('click', () => set(nav.hidden));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !nav.hidden) { set(false); toggle.focus(); }
  });
}
