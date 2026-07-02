/**
 * Shared page sanitizer — hide anything that must NEVER appear in marketing assets:
 *   - the "Admin dashboard" link (admin-only, not for public)
 *   - the small sidebar collapse/expand rail handle (‹ / ›)
 * Call `await sanitize(page)` after navigation/interaction, right before any screenshot.
 */
async function sanitize(page) {
  await page.addStyleTag({
    content: `
      /* Hide admin dashboard link (matched by text via JS below; also cover common cases) */
      [href*="admin" i], [data-admin], .admin-dashboard { display: none !important; }
    `,
  }).catch(() => {});
  await page.evaluate(() => {
    const kill = (el) => { if (el) { el.style.setProperty('display', 'none', 'important'); el.remove?.(); } };
    // Admin dashboard: any link/button whose text mentions "Admin dashboard"
    document.querySelectorAll('a,button,div').forEach(el => {
      const t = (el.innerText || '').trim().toLowerCase();
      if (el.children.length <= 2 && /admin dashboard/.test(t)) kill(el);
    });
    // The sidebar collapse/expand rail: a tiny unlabeled square button on the panel edge.
    document.querySelectorAll('button').forEach(b => {
      const r = b.getBoundingClientRect();
      const l = (b.innerText || b.getAttribute('aria-label') || b.getAttribute('title') || '').trim();
      if (!l && r.width > 8 && r.width < 40 && r.height > 12 && r.height < 130) kill(b);
    });
  }).catch(() => {});
  await page.waitForTimeout(150);
}
module.exports = { sanitize };
