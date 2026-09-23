/* ==========================================================================
   SIPS MOBILE NAV — purely presentational bottom nav for phones.
   Reuses existing hrefs/hamburger/sidebar toggle already wired by
   sips-shell.js. Adds no data logic, no new endpoints, no permission
   changes. No-ops entirely above 900px (desktop identical to before).
   ========================================================================== */
(function(){
  function isMobile(){ return window.matchMedia('(max-width:900px)').matches; }

  var ICON = {
    home:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 11.5 12 4l8 7.5"/><path d="M6 10v9a1 1 0 0 0 1 1h3v-6h4v6h3a1 1 0 0 0 1-1v-9"/></svg>',
    calendar:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="4.5" width="17" height="16" rx="3"/><path d="M16 2.5v4M8 2.5v4M3.5 9.5h17"/></svg>',
    tasks:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.5 6h11M9.5 12h11M9.5 18h11"/><path d="M4 6.3l1.1 1.1L7 5.3M4 12.3l1.1 1.1L7 11.3M4 18.3l1.1 1.1L7 17.3"/></svg>',
    chat:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.4 8.4 0 0 1-8.4 8.4c-1.3 0-2.6-.3-3.7-.9L3 21l1.9-5.7a8.3 8.3 0 0 1-.9-3.7A8.4 8.4 0 0 1 12.5 3H13a8 8 0 0 1 8 8v.5Z"/></svg>',
    more:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/></svg>'
  };

  var NAV_ITEMS = [
    {href:'dashboard.html', icon:'home', label:'Home'},
    {href:'schedule.html', icon:'calendar', label:'Schedule'},
    {href:'mytasks.html', icon:'tasks', label:'Tasks'},
    {href:'collaboration.html', icon:'chat', label:'Chat'},
    {href:'#', icon:'more', label:'More', isMore:true}
  ];

  function currentPage(){ return location.pathname.split('/').pop() || 'dashboard.html'; }

  function buildNav(){
    if(document.getElementById('sips-bottom-nav')) return;
    var active = currentPage();
    var nav = document.createElement('div');
    nav.id = 'sips-bottom-nav';
    nav.innerHTML = NAV_ITEMS.map(function(it){
      var isActive = it.href === active;
      var tag = it.isMore ? 'div' : 'a';
      var hrefAttr = it.isMore ? '' : (' href="' + it.href + '"');
      return '<' + tag + ' class="snb-item' + (isActive?' active':'') + '"' + hrefAttr +
        ' data-nav="' + it.href + '" aria-label="' + it.label + '">' +
        '<div class="snb-ic">' + ICON[it.icon] + '</div><span>' + it.label + '</span></' + tag + '>';
    }).join('');
    document.body.appendChild(nav);

    // "More" opens the existing off-canvas sidebar drawer (same toggle sips-shell.js already wires)
    var moreBtn = nav.querySelector('[data-nav="#"]');
    if(moreBtn){
      moreBtn.addEventListener('click', function(){
        var sidebar = document.getElementById('app-sidebar');
        var backdrop = document.getElementById('app-sidebar-backdrop');
        if(sidebar && backdrop){
          sidebar.classList.add('open');
          backdrop.classList.add('show');
        }
      });
    }
  }

  function removeNav(){
    var nav = document.getElementById('sips-bottom-nav');
    if(nav) nav.remove();
  }

  function sync(){ isMobile() ? buildNav() : removeNav(); }

  document.addEventListener('DOMContentLoaded', sync);
  window.addEventListener('resize', sync);
})();
