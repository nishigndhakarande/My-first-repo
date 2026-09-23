const SUPABASE_URL = 'https://tlorepamqatsmrdpsttx.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_yLXE201tGNBWp4H49FdIlQ_OICGk29t';

// supabase-js CDN aadhi load zala pahije. Nasel tar clear sanga (silent fail nako).
if(typeof supabase === 'undefined'){
  alert('Supabase library load nahi zali. Ya page var supabase-js CDN <script> ha auth-guard.js chya AADHI ahe ka bagh.');
}

// ---------------------------------------------------------------------------
// "Keep me signed in" storage adapter (fix for #12).
// login.html sets the localStorage flag 'sips_keep_signed_in' to '1' or '0'
// BEFORE calling signInWithPassword, based on the checkbox. This adapter
// writes new session tokens to localStorage (persists across browser
// restarts) or sessionStorage (cleared when the tab/browser closes)
// accordingly. Reads check both, so existing sessions created before this
// fix shipped (always in localStorage) keep working without being logged
// out. If the flag was never set, we default to persisting (old behaviour).
// ---------------------------------------------------------------------------
const sipsAuthStorage = {
  getItem: (key) => {
    try { return window.sessionStorage.getItem(key) ?? window.localStorage.getItem(key); }
    catch(e){ return null; }
  },
  setItem: (key, value) => {
    try {
      const persist = window.localStorage.getItem('sips_keep_signed_in') !== '0';
      if(persist){ window.localStorage.setItem(key, value); window.sessionStorage.removeItem(key); }
      else { window.sessionStorage.setItem(key, value); window.localStorage.removeItem(key); }
    } catch(e){}
  },
  removeItem: (key) => {
    try { window.localStorage.removeItem(key); window.sessionStorage.removeItem(key); } catch(e){}
  }
};

const sb = (typeof supabase !== 'undefined')
  ? supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { storage: sipsAuthStorage, persistSession: true, autoRefreshToken: true }
    })
  : null;

async function requireAuth(){
  if(!sb){
    alert('Database connection (sb) taiyar nahi. Supabase library load zali ka bagh.');
    return null;
  }

  const { data: { session } } = await sb.auth.getSession();
  if(!session){
    window.location.href = 'login.html';
    return null;
  }

  const { data: profile, error } = await sb
    .from('profiles')
    .select('role, full_name, company_id, is_active')
    .eq('id', session.user.id)
    .single();

  if(error || !profile){
    alert('Profile sapadla nahi. Admin la sanga.');
    window.location.href = 'login.html';
    return null;
  }

  if(profile.is_active === false){
    alert('Ha account deactivate kela aahe. Admin la sanga.');
    await sb.auth.signOut();
    window.location.href = 'login.html';
    return null;
  }

  return { session, role: profile.role, fullName: profile.full_name, companyId: profile.company_id };
}

// User la disaycha project ids parat karto. Company/project isolation is
// out of scope (removed per request) — RLS now only blocks inactive users,
// so this returns all projects for any active user, same as before.
async function fetchAssignedProjectIds(userId){
  if(!sb) return [];
  const { data, error } = await sb.from('projects').select('id');
  if(error){ console.warn('fetchAssignedProjectIds:', error.message); return []; }
  return (data || []).map(r => r.id);
}
