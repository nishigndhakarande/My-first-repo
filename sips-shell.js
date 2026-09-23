/* ==========================================================================
   SIPS SHELL
   Single source of truth for: sidebar nav items, role-based visibility,
   and the toast/confirm UI that replaces alert()/confirm() app-wide.
   Visual only — does not change what any button DOES, only how feedback
   is shown. All existing sb.from(...) calls, workflows and role checks
   in each page are untouched.
   ========================================================================== */

/* ---- Icon set — clean line icons (24x24, stroke=currentColor) used by the
   floating nav rail. Kept as tiny inline SVG strings (no icon-font/CDN
   dependency) so the rail renders identically offline and in every browser. ---- */
const SIPS_ICON = {
  grid:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="3.5" width="7" height="7" rx="2"/><rect x="13.5" y="3.5" width="7" height="7" rx="2"/><rect x="3.5" y="13.5" width="7" height="7" rx="2"/><rect x="13.5" y="13.5" width="7" height="7" rx="2"/></svg>',
  chat:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.4 8.4 0 0 1-8.4 8.4c-1.3 0-2.6-.3-3.7-.9L3 21l1.9-5.7a8.3 8.3 0 0 1-.9-3.7A8.4 8.4 0 0 1 12.5 3H13a8 8 0 0 1 8 8v.5Z"/></svg>',
  calendar:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="4.5" width="17" height="16" rx="3"/><path d="M16 2.5v4M8 2.5v4M3.5 9.5h17"/></svg>',
  wallet:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7.5a2 2 0 0 1 2-2h12.5a1 1 0 0 1 1 1V9"/><path d="M3 7.5v10a2 2 0 0 0 2 2h14a1 1 0 0 0 1-1v-4.5"/><circle cx="17" cy="14" r="1.4"/></svg>',
  layers:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="3.5" width="17" height="13.5" rx="2.2"/><circle cx="8.7" cy="8.7" r="1.6"/><path d="M20.5 14 16 9.5l-4 4-3-3-5.3 5.3"/></svg>',
  shield:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3.2 19 6v6c0 4.4-2.9 7.4-7 8.8-4.1-1.4-7-4.4-7-8.8V6l7-2.8Z"/><path d="M9 12.3l2 2 4-4"/></svg>',
  tasks:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9.5 6h11M9.5 12h11M9.5 18h11"/><path d="M4 6.3l1.1 1.1L7 5.3M4 12.3l1.1 1.1L7 11.3M4 18.3l1.1 1.1L7 17.3"/></svg>',
  bell:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M18.5 8.5a6.5 6.5 0 0 0-13 0c0 7.5-3 9.5-3 9.5h19s-3-2-3-9.5Z"/><path d="M13.7 21.5a2 2 0 0 1-3.4 0"/></svg>',
  check:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M8 12.3l2.8 2.8L16.5 9"/></svg>',
  truck:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="1.5" y="7" width="13" height="9.5" rx="1.4"/><path d="M14.5 10h4l3.5 3.5v3h-7.5"/><circle cx="6" cy="18.3" r="1.7"/><circle cx="17.8" cy="18.3" r="1.7"/></svg>',
  globe:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3c2.6 2.4 4 5.6 4 9s-1.4 6.6-4 9c-2.6-2.4-4-5.6-4-9s1.4-6.6 4-9Z"/></svg>',
  upload:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 15.5v-11M7.2 8.8 12 4l4.8 4.8"/><path d="M4.5 15.5v3.2a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-3.2"/></svg>',
  building:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2.8" width="10" height="18.4" rx="1.2"/><rect x="14" y="8.5" width="6" height="12.7" rx="1.2"/><path d="M7 7h1.2M7 11h1.2M7 15h1.2M17 12h1M17 16h1"/></svg>',
  users:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3.2"/><path d="M2.8 20c0-3.4 2.8-6.2 6.2-6.2s6.2 2.8 6.2 6.2"/><circle cx="18" cy="9" r="2.3"/><path d="M15.6 14.4c2.5.4 4.4 2.5 4.4 5.6"/></svg>',
  help:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3.3"/><path d="M6.2 6.2 9.5 9.5M17.8 6.2 14.5 9.5M6.2 17.8 9.5 14.5M17.8 17.8 14.5 14.5"/></svg>',
};

/* ---- Sidebar nav model (was duplicated 3x across the app — now one place) ---- */
const SIPS_NAV = [
  { section:'Overview', items:[
    { href:'#',                     icon:SIPS_ICON.grid, label:'My projects', domId:'navMyProjects' },
    { href:'collaboration.html',    icon:SIPS_ICON.chat, label:'Collaboration', badgeId:'collabNavBadge' },
  ]},
  { section:'Execution', items:[
    { href:'schedule.html', icon:SIPS_ICON.calendar, label:'Schedule' },
    { href:'budget.html',   icon:SIPS_ICON.wallet,   label:'Budget' },
    { href:'drawings.html', icon:SIPS_ICON.layers,   label:'Drawings & media' },
    { href:'quality.html',  icon:SIPS_ICON.shield,   label:'Quality & NCR' },
    { href:'mytasks.html',  icon:SIPS_ICON.tasks,    label:'My tasks' },
    { href:'#', icon:SIPS_ICON.bell, label:'Notifications', domId:'navNotifications', badgeId:'sideNotifBadge' },
    { href:'approvals.html',icon:SIPS_ICON.check, label:'Approvals', domId:'navApprovals', badgeId:'sideApprovalsBadge' },
  ]},
  { section:'Network', items:[
    { href:'vendors.html',       icon:SIPS_ICON.truck, label:'Vendors', dataPerm:'view_vendors' },
    { href:'client-portal.html', icon:SIPS_ICON.globe, label:'Client portal' },
  ]},
  { section:'Company', items:[
    { href:'#', icon:SIPS_ICON.upload, label:'Import data', domId:'navImportData', dataPerm:'import_project' },
    { href:'company.html',          icon:SIPS_ICON.building, label:'Company profile', dataPermGroup:'director-pm' },
    { href:'user-management.html',  icon:SIPS_ICON.users,    label:'User management', dataPermGroup:'director-pm' },
  ]},
];

/* NOTE: items are ALWAYS rendered regardless of role — sipsRenderShell runs
   before a page's auth check resolves, so role is often unknown at render
   time. Role-based show/hide happens AFTER auth resolves, via data-perm /
   data-perm-group attributes that each page's own existing permission logic
   (e.g. dashboard.html's applyPermissions()) reads and toggles — same
   pattern the original app used. Never filter items out of the array below
   based on role; doing so removes them from the DOM entirely, which breaks
   any page script that calls getElementById() on a nav item by its domId. */

function sipsRenderShell(opts){
  const mount = document.getElementById('sips-sidebar-mount');
  if(!mount) return;
  const active = (opts && opts.activeHref) || location.pathname.split('/').pop();
  const qs = (opts && opts.qs) || '';

  const sectionsHtml = SIPS_NAV.map(sec => {
    const itemsHtml = sec.items.map(it => {
      const isActive = it.href === active;
      const badge = it.badgeId ? `<span class="app-nav-badge" id="${it.badgeId}" style="display:none;"></span>` : '';
      const idAttr = it.domId ? ` id="${it.domId}"` : '';
      const permAttr = it.dataPerm ? ` data-perm="${it.dataPerm}"` : '';
      const permGroupAttr = it.dataPermGroup ? ` data-perm-group="${it.dataPermGroup}"` : '';
      const tag = it.href === '#' ? 'div' : 'a';
      const hrefAttr = it.href === '#' ? '' : ` href="${it.href}${qs}"`;
      return `<${tag} class="app-nav-item${isActive?' active':''}"${idAttr}${hrefAttr}${permAttr}${permGroupAttr} aria-label="${it.label}"><span class="ic">${it.icon}</span><span class="lbl">${it.label}</span>${badge}</${tag}>`;
    }).join('');
    return `<div class="app-nav-section"><span class="app-nav-section-label">${sec.section}</span>${itemsHtml}</div>`;
  }).join('');

  /* Floating icon-only rail on desktop; the same markup becomes an
     off-canvas drawer (icons + visible labels) under 900px via CSS alone —
     no separate mobile markup to keep in sync. The KinderSports logo is
     NOT repeated here: it lives once, in the page header, per the brief. */
  mount.innerHTML = `
    <div class="app-sidebar" id="app-sidebar">
      <a class="app-sidebar-brand" href="dashboard.html" aria-label="Kinder Sports — dashboard">
        <img src="assets/logo-mark-sm.png" alt="Kinder Sports">
      </a>
      <div class="app-sidebar-nav">${sectionsHtml}</div>
      <div class="app-sidebar-help">
        ${SIPS_ICON.help}
        <span class="lbl"><b>Need help?</b>support@kindersports.in<br>80874 44187</span>
      </div>
    </div>
    <div class="app-sidebar-backdrop" id="app-sidebar-backdrop"></div>`;

  const sidebar = document.getElementById('app-sidebar');
  const backdrop = document.getElementById('app-sidebar-backdrop');
  const hamburger = document.getElementById('app-hamburger-btn');
  if(hamburger){
    hamburger.addEventListener('click', ()=>{
      sidebar.classList.toggle('open');
      backdrop.classList.toggle('show');
    });
  }
  backdrop.addEventListener('click', ()=>{
    sidebar.classList.remove('open');
    backdrop.classList.remove('show');
  });
}

/* ---- Toast system: replaces alert() for non-blocking feedback ---- */
function sipsEnsureToastRoot(){
  let root = document.getElementById('toast-root');
  if(!root){
    root = document.createElement('div');
    root.id = 'toast-root';
    document.body.appendChild(root);
  }
  return root;
}
function sipsToast(message, kind){
  const root = sipsEnsureToastRoot();
  const el = document.createElement('div');
  el.className = 'toast' + (kind === 'error' ? ' err' : kind === 'success' ? ' ok' : '');
  el.innerHTML = `<span>${message}</span><button class="toast-close" aria-label="Dismiss">&times;</button>`;
  el.querySelector('.toast-close').onclick = ()=> el.remove();
  root.appendChild(el);
  setTimeout(()=>{ el.remove(); }, kind === 'error' ? 6000 : 3800);
}

/* ---- Confirm dialog: replaces confirm(), returns a Promise<boolean> ----
   Usage: const ok = await sipsConfirm('Delete this item?', 'This cannot be undone.');
   Same call sites, same true/false outcome as native confirm() — visual only. */
function sipsConfirm(title, body, confirmLabel){
  return new Promise((resolve)=>{
    const overlay = document.createElement('div');
    overlay.className = 'confirm-overlay';
    overlay.innerHTML = `
      <div class="confirm-box">
        <h4>${title}</h4>
        <p>${body || ''}</p>
        <div class="confirm-actions">
          <button class="btn sm" id="sips-confirm-cancel">Cancel</button>
          <button class="btn sm danger-outline" id="sips-confirm-ok">${confirmLabel || 'Confirm'}</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    const done = (val)=>{ overlay.remove(); resolve(val); };
    overlay.querySelector('#sips-confirm-cancel').onclick = ()=> done(false);
    overlay.querySelector('#sips-confirm-ok').onclick = ()=> done(true);
    overlay.addEventListener('click', (e)=>{ if(e.target === overlay) done(false); });
  });
}

/* ---- Shared empty/loading/error state renderer ---- */
function sipsState(kind, title, body){
  const icon = kind === 'error' ? '&#9888;' : kind === 'loading' ? '&#8943;' : '&#9675;';
  return `<div class="state-block${kind==='error'?' state-error':''}">
    <div class="state-icon">${icon}</div>
    <div class="state-title">${title}</div>
    ${body ? `<div class="state-body">${body}</div>` : ''}
  </div>`;
}

/* ---- Scroll-affordance for horizontally-scrollable strips/tables ----
   Purely presentational: finds every element with the .scroll-hint-x class
   (a right-edge shadow is drawn by CSS) and toggles a .at-scroll-end class
   once the user has scrolled it to the end, hiding the shadow so it doesn't
   falsely suggest there's more content. No markup restructuring needed —
   works directly on the scrolling element itself. Safe to call multiple
   times (idempotent — re-checking an already-wired element is a no-op
   thanks to the dataset flag). Call this after any dynamic content that
   populates a .scroll-hint-x container finishes rendering. */
function sipsWireScrollHints(root){
  const scope = root || document;
  scope.querySelectorAll('.scroll-hint-x').forEach(el=>{
    const check = ()=>{
      const atEnd = el.scrollWidth - el.clientWidth <= el.scrollLeft + 4;
      const scrollable = el.scrollWidth - el.clientWidth > 4;
      el.classList.toggle('at-scroll-end', atEnd || !scrollable);
    };
    check();
    if(el.dataset.scrollHintWired) return;
    el.dataset.scrollHintWired = '1';
    el.addEventListener('scroll', check, { passive: true });
    window.addEventListener('resize', check);
    if(window.ResizeObserver) new ResizeObserver(check).observe(el);
  });
}
document.addEventListener('DOMContentLoaded', ()=> sipsWireScrollHints());