
/* Pages that must NEVER force a redirect to login (public + the login page itself). */
const PUBLIC_PAGES = ['login','index','about','contact','apply','register','signup',''];

function currentPage() {
  return (location.pathname.split('/').pop() || 'index.html').replace('.html','');
}

const App = {

  init() {
    App.bindUI();
    App.applyStoredTheme();
    const page = currentPage();
    // On login/public pages we DO NOT run auth-gating or redirect — this was
    // the v7 bug that broke the login page bootstrap and caused redirect loops.
    if (PUBLIC_PAGES.includes(page)) {
      App.initAuthTabs();
      return;
    }
    App.applyRoleVisibility();
    App.loadPageData();
  },

  /* Re-apply saved dark/light preference */
  applyStoredTheme() {
    const saved = localStorage.getItem('sc-theme');
    if (saved) document.body.dataset.theme = saved;
  },

  /* Ensure the login page shows the Sign-in tab by default (replaces the old
     T.switchAuthTab call that failed because templates.js is not shipped). */
  initAuthTabs() {
    if (document.getElementById('signin-form')) App.switchAuthTab('signin');
  },

  applyRoleVisibility() {
    if (!sb) { App.applyRoleDashboard('demo', { full_name:'Demo User', role:'admin' }); return; }
    sb.auth.getUser().then(({ data: { user } }) => {
      if (!user) { location.href = 'login.html'; return; }
      sb.from('profiles').select('full_name,email,role,status').eq('id', user.id).single().then(({ data }) => {
        const role = (data && data.role) || 'student';
        const status = (data && data.status) || 'pending';
        const name = (data && data.full_name) || user.user_metadata?.full_name || user.email || 'User';
        if (status === 'pending') {
          document.body.innerHTML = '<div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:40px"><div style="max-width:440px;text-align:center;background:white;padding:40px;border-radius:16px;box-shadow:0 10px 30px rgba(0,0,0,0.1)"><h2 style="margin-bottom:12px">⏳ Account pending approval</h2><p style="color:var(--gray-600)">Your account is awaiting admin approval. You will receive an email once it is activated.</p></div></div>';
          return;
        }
        if (status === 'suspended') {
          document.body.innerHTML = '<div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:40px"><div style="max-width:440px;text-align:center;background:white;padding:40px;border-radius:16px"><h2>🚫 Account suspended</h2><p>Please contact the school administrator.</p></div></div>';
          return;
        }
        const isStaff = ['super_admin','admin','principal','proprietor','head_teacher','staff','teacher','bursar'].includes(role);
        const isAdmin = ['super_admin','admin','principal','proprietor','head_teacher','bursar'].includes(role);
        App.currentRole = role; App.currentUserName = name; App.currentProfile = data || {};
        document.querySelectorAll('[data-admin-only]').forEach(el => el.style.display = isAdmin ? '' : 'none');
        document.querySelectorAll('[data-staff-only]').forEach(el => el.style.display = isStaff ? '' : 'none');
        document.querySelectorAll('[data-signout]').forEach(el => el.style.display = '');
        App.applyRoleDashboard(role, { full_name:name, email:user.email, role });
        App.applyRoleNav(role);
      });
    });
  },

  applyRoleDashboard(role, profile) {
    const name = (profile && (profile.full_name || profile.email)) || 'User';
    const prettyRole = String(role || 'user').replace(/_/g,' ').replace(/w/g, c => c.toUpperCase());
    ['user-display-name','dash-user-name'].forEach(id => { const el=document.getElementById(id); if(el) el.textContent=name; });
    ['user-display-role','dash-user-role'].forEach(id => { const el=document.getElementById(id); if(el) el.textContent=prettyRole; });
    const groups = document.querySelectorAll('[data-dash-role]');
    if (groups.length) {
      groups.forEach(el => {
        const roles = (el.getAttribute('data-dash-role')||'').split(/s+/);
        const show = roles.includes(role) || (role === 'teacher' && roles.includes('staff')) || (role === 'super_admin' && roles.includes('admin'));
        el.style.display = show ? '' : 'none';
      });
      if (![...groups].some(el => el.style.display !== 'none')) {
        const first = document.querySelector('[data-dash-role="student"]'); if(first) first.style.display='';
      }
    }
    const q=document.getElementById('dash-quick-links');
    if(q){
      const links = role==='parent' ? [['My Child','student-profile.html'],['Fees','fees.html'],['Results','results.html'],['Messages','inbox.html']] :
        (role==='student' ? [['Take CBT','cbt-exam.html'],['Assignments','assignments.html'],['Timetable','timetable.html'],['My Results','results.html']] :
        (['staff','teacher'].includes(role) ? [['Attendance','attendance.html'],['Results','results.html'],['CBT','cbt.html'],['Broadsheets','academic_records.html'],['Report Cards','report-cards.html']] :
        [['Academic Setup','academic_setup.html'],['Students','students.html'],['Approvals','approvals.html'],['Analytics','analytics.html'],['Storage','storage.html']]));
      q.innerHTML = links.map(x=>'<a class="btn btn-outline btn-sm" href="'+x[1]+'">'+x[0]+'</a>').join('');
    }
  },


  applyRoleNav(role) {
    const aliases = { teacher:'staff', super_admin:'admin' };
    document.querySelectorAll('[data-role-allow]').forEach(el => {
      const allow = (el.getAttribute('data-role-allow') || '').split(/s+/).filter(Boolean);
      const ok = allow.includes(role) || allow.includes(aliases[role]);
      el.style.display = ok ? '' : 'none';
    });
  },

  /* ----- Auth (now METHODS of App so login forms calling
     App.handleSignIn / App.handleSignUp actually resolve — v7 bug fix) ----- */
  async handleSignIn(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const email = (fd.get('email') || '').trim();
    const password = fd.get('password') || '';
    if (!sb) { toast('Database not configured. Edit assets/js/config.js with your Supabase URL and anon key.', 'warning', 7000); return; }
    const btn = e.target.querySelector('button[type=submit]');
    if (btn) { btn.disabled = true; btn.dataset.label = btn.textContent; btn.textContent = 'Signing in…'; }
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error) {
      if (btn) { btn.disabled = false; btn.textContent = btn.dataset.label || 'Sign in'; }
      toast(error.message || 'Sign-in failed. Check your email and password.', 'danger', 6000);
      return;
    }
    App.logActivity('login', 'auth', email);
    location.href = 'dashboard.html';
  },

  async handleSignUp(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    if (!sb) { toast('Database not configured. Edit assets/js/config.js with your Supabase keys.', 'warning', 7000); return; }
    const btn = e.target.querySelector('button[type=submit]');
    if (btn) { btn.disabled = true; btn.dataset.label = btn.textContent; btn.textContent = 'Submitting…'; }
    const { data, error } = await sb.auth.signUp({
      email: (fd.get('email') || '').trim(),
      password: fd.get('password') || '',
      options: { data: { full_name: fd.get('full_name'), phone: fd.get('phone'), role: fd.get('role') } }
    });
    if (btn) { btn.disabled = false; btn.textContent = btn.dataset.label || 'Request access'; }
    if (error) { toast(error.message || 'Could not create the request.', 'danger', 6000); return; }
    toast('✅ Request sent. Check your email to confirm, then wait for admin approval.', 'success', 7000);
    if (e.target.reset) e.target.reset();
    App.switchAuthTab('signin');
  },

  /* Tab switcher — moved into App so the login page no longer depends on the
     builder-only templates.js (which is never shipped to the school site). */
  switchAuthTab(tab) {
    const s = document.getElementById('signin-form');
    const u = document.getElementById('signup-form');
    const ts = document.getElementById('tab-signin');
    const tu = document.getElementById('tab-signup');
    if (!s || !u) return;
    if (tab === 'signup') {
      s.style.display = 'none'; u.style.display = 'block';
      if (tu) tu.className = 'btn btn-primary'; if (ts) ts.className = 'btn btn-outline';
    } else {
      s.style.display = 'block'; u.style.display = 'none';
      if (ts) ts.className = 'btn btn-primary'; if (tu) tu.className = 'btn btn-outline';
    }
  },

  /* Lightweight, free audit log (no AI, no paid service) */
  logActivity(action, entity, entityId, details) {
    if (!sb) return;
    try {
      sb.auth.getUser().then(({ data }) => {
        const u = data && data.user;
        sb.from('activity_log').insert({
          actor_id: u ? u.id : null,
          actor_email: u ? u.email : entityId,
          action, entity, entity_id: String(entityId || ''),
          details: details || null
        }).then(() => {}, () => {});
      });
    } catch (_) {}
  },

  bindUI() {
    document.addEventListener('click', e => {
      const a = e.target.closest('[data-app-action]');
      if (a) {
        const fn = a.dataset.appAction;
        if (App[fn]) App[fn](a);
      }
    });
  },

  toggleDarkMode() {
    const cur = document.body.dataset.theme || 'light';
    document.body.dataset.theme = cur === 'dark' ? 'light' : 'dark';
    localStorage.setItem('sc-theme', document.body.dataset.theme);
  },

  signOut() {
    if (!sb) { location.href = 'login.html'; return; }
    sb.auth.signOut().then(() => location.href = 'login.html');
  },

  toggleSidebar() {
    const el = document.getElementById('app-sidebar');
    if (el) el.classList.toggle('open');
  },

  switchCampus(name) {
    localStorage.setItem('sc-campus', name);
    location.reload();
  },

  /* Page-aware data loaders */
  async loadPageData() {
    const path = location.pathname.split('/').pop().replace('.html','') || 'dashboard';
    if (path === 'dashboard' && App.loadDashboard) App.loadDashboard();
    if (path === 'voting' && typeof VotingUI !== 'undefined') VotingUI.renderPollList();
    if (path === 'notifications' && typeof Notifications !== 'undefined') Notifications.loadDropdownItems();
    // Generic CRUD list for any module page that has a schema definition.
    if (typeof CRUD !== 'undefined' && CRUD.def && CRUD.def(path)) { try { CRUD.renderList(path); } catch (e) {} }
    if (App['load_' + path]) App['load_' + path]();
  },

  async loadDashboard() {
    try {
      const [students, staff, fees, announcements, polls] = await Promise.all([
        sb.from('students').select('id', { count: 'exact', head: true }),
        sb.from('staff').select('id',     { count: 'exact', head: true }),
        sb.from('fee_payments').select('amount_paid'),
        sb.from('announcements').select('*').order('created_at', { ascending: false }).limit(5),
        sb.from('polls').select('*').eq('status','open').order('created_at',{ascending:false}).limit(3)
      ]);
      const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
      set('stat-students', students.count || 0);
      set('stat-staff', staff.count || 0);
      set('stat-fees', (fees.data || []).reduce((a,b) => a + (b.amount_paid || 0), 0).toLocaleString());
      set('stat-announcements', (announcements.data || []).length);
      const annEl = document.getElementById('dash-announcements');
      if (annEl) annEl.innerHTML = (announcements.data || []).length
        ? announcements.data.map(a => '<div style="padding:10px 0;border-bottom:1px solid var(--gray-200)"><strong>'+esc(a.title)+'</strong><div style="font-size:0.82rem;color:var(--gray-500)">'+new Date(a.created_at).toLocaleString()+'</div></div>').join('')
        : '<p style="color:var(--gray-500)">No announcements yet.</p>';
      const pollEl = document.getElementById('dash-polls');
      if (pollEl) pollEl.innerHTML = (polls.data || []).length
        ? polls.data.map(p => '<div style="padding:10px 0;border-bottom:1px solid var(--gray-200)"><a href="voting.html?poll='+p.id+'"><strong>'+esc(p.title)+'</strong></a><span class="badge badge-success" style="margin-left:8px">open</span></div>').join('')
        : '<p style="color:var(--gray-500)">No active polls.</p>';
      // Chart
      const ctx = document.getElementById('dash-chart');
      if (ctx && window.Chart) {
        var _sc = (students.count || 0), _fp = (fees.data || []).length;
        new Chart(ctx, { type: 'doughnut', data: { labels:['Paid','Pending'], datasets:[{ data:[_fp, Math.max(0, _sc - _fp)], backgroundColor:['#10b981','#e2e8f0'] }] }, options: { responsive:true, plugins:{ legend:{ position:'bottom' } } } });
      }
    } catch (e) { console.warn('Dashboard load failed (demo mode):', e.message); }
  },

  /* Modal — now opens the REAL CRUD form for the module (fixes the old
     "Form will be generated for ..." placeholder). */
  openAddModal(type) {
    if (typeof CRUD !== 'undefined' && CRUD.def && CRUD.def(type)) { CRUD.openForm(type); return; }
    if (typeof openModal === 'function') openModal('Add ' + type, '<p>This module is view-only or has a dedicated page.</p>');
  }
};

/* ----- Modal helpers ----- */
function openModal(title, body, footer) {
  const b = document.getElementById('modal-backdrop');
  if (!b) return;
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-body').innerHTML = body;
  document.getElementById('modal-footer').innerHTML = footer || '<button class="btn btn-outline" onclick="closeModal()">Close</button>';
  b.classList.add('show');
}
function closeModal() {
  const b = document.getElementById('modal-backdrop');
  if (b) b.classList.remove('show');
}
function toast(msg, type='info', ms=3500) {
  const c = document.getElementById('toast-container');
  if (!c) return;
  const t = document.createElement('div');
  t.className = 'toast toast-' + type;
  t.innerHTML = '<div class="toast-msg">' + esc(msg) + '</div>';
  c.appendChild(t);
  setTimeout(() => { t.style.animation = 'slideOut 0.3s ease forwards'; setTimeout(() => t.remove(), 300); }, ms);
}
function esc(s) {
  return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

/* Backwards-compatible global aliases (in case any inline handler still
   references the bare function names instead of App.*). */
function handleSignIn(e){ return App.handleSignIn(e); }
function handleSignUp(e){ return App.handleSignUp(e); }

/* Boot */
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', App.init);
else App.init();
