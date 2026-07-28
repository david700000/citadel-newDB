(function () {
  // ─── CONFIG ───
  const API_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:3000'
    : 'https://citadel-newdb-516a.onrender.com';

  // ─── STATE ───
  let authToken     = localStorage.getItem('adminToken');
  let adminRole     = localStorage.getItem('adminRole');
  let currentUserId = localStorage.getItem('adminUserId');
  let siteData      = { hero: [], events: [], sermons: [], gallery: [], global: {} };
  let hasUnsaved    = false;

  // ─── TOAST ───
  function showToast(message, type = 'success', duration = 3800, title = '') {
    const ICONS = { success: '✓', error: '✕', info: 'ℹ', warning: '⚠' };
    let container = document.getElementById('toast-container');
    if (!container) { container = document.createElement('div'); container.id = 'toast-container'; document.body.appendChild(container); }
    const t = document.createElement('div');
    t.className = 'toast toast-' + type;
    t.innerHTML = `<span class="toast-icon">${ICONS[type]||'✓'}</span><div class="toast-body">${title?`<div class="toast-title">${title}</div>`:''}<div class="toast-msg">${message}</div></div><button class="toast-close" onclick="this.parentElement.remove()">✕</button><div class="toast-bar" style="animation-duration:${duration}ms"></div>`;
    container.appendChild(t);
    setTimeout(() => { t.classList.add('removing'); setTimeout(() => t.remove(), 280); }, duration);
  }

  // ─── UNSAVED TRACKING ───
  window.markUnsaved = function() { hasUnsaved = true; document.title = '● Citadel — Command Centre'; };
  function clearUnsaved() { hasUnsaved = false; document.title = 'Citadel of Truth — Command Centre'; }
  window.addEventListener('beforeunload', e => { if (hasUnsaved) { e.preventDefault(); e.returnValue = ''; } });

  // ─── DOM REFS ───
  const authScreen    = document.getElementById('auth-screen');
  const dashboard     = document.getElementById('dashboard');
  const mobBar        = document.getElementById('mob-bar');
  const loginFormWrap = document.getElementById('login-form-wrap');
  const recoveryWrap  = document.getElementById('recovery-form-wrap');

  // ─── AUTH SCREEN TOGGLE ───
  function showLogin()    { loginFormWrap.style.display = 'flex'; recoveryWrap.style.display = 'none'; }
  function showRecovery() { loginFormWrap.style.display = 'none'; recoveryWrap.style.display = 'flex'; resetRecoveryForm(); }

  document.getElementById('goto-recovery')?.addEventListener('click', showRecovery);
  document.getElementById('goto-login')?.addEventListener('click', showLogin);
  document.getElementById('back-to-login-btn')?.addEventListener('click', showLogin);

  // ─── PASSWORD TOGGLE ───
  document.getElementById('toggle-pw')?.addEventListener('click', () => {
    const inp = document.getElementById('admin-password');
    inp.type = inp.type === 'password' ? 'text' : 'password';
  });
  document.getElementById('toggle-new-pw')?.addEventListener('click', () => {
    const inp = document.getElementById('reset-new-password');
    inp.type = inp.type === 'password' ? 'text' : 'password';
  });

  // ─── LOGIN ───
  function setLoginError(msg) {
    const el = document.getElementById('login-error');
    if (el) el.textContent = msg;
  }

  async function doLogin() {
    const email    = document.getElementById('admin-email').value.trim();
    const password = document.getElementById('admin-password').value;
    if (!email || !password) { setLoginError('Please fill in both fields.'); return; }

    const btn = document.getElementById('login-btn');
    const txt = document.getElementById('login-btn-text');
    btn.disabled = true; txt.textContent = 'Signing in…';
    setLoginError('');

    try {
      const res  = await fetch(`${API_URL}/api/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
      const data = await res.json();
      if (res.ok) {
        authToken = data.token; adminRole = data.role; currentUserId = data.userId || '';
        localStorage.setItem('adminToken', authToken);
        localStorage.setItem('adminRole', adminRole);
        localStorage.setItem('adminUserId', currentUserId);
        localStorage.setItem('adminEmail', email);
        initDashboard();
      } else {
        setLoginError(data.error || 'Login failed.');
        showToast(data.error || 'Invalid credentials', 'error');
        btn.disabled = false; txt.textContent = 'Sign In to Dashboard';
      }
    } catch {
      setLoginError('Cannot reach server. Check your connection.');
      showToast('Server unreachable', 'error');
      btn.disabled = false; txt.textContent = 'Sign In to Dashboard';
    }
  }

  document.getElementById('login-btn')?.addEventListener('click', doLogin);
  document.addEventListener('keydown', e => {
    if (e.key === 'Enter' && authScreen?.style.display !== 'none' && loginFormWrap?.style.display !== 'none') doLogin();
  });

  // ─── LOGOUT ───
  function doLogout() {
    authToken = null; adminRole = null; currentUserId = null;
    ['adminToken','adminRole','adminUserId','adminEmail'].forEach(k => localStorage.removeItem(k));
    authScreen.style.display = 'flex';
    dashboard.style.display = 'none';
    mobBar.style.display = 'none';
    showLogin();
    clearUnsaved();
  }
  document.getElementById('logout-btn')?.addEventListener('click', doLogout);

  // ─── HEARTBEAT ───
  function startTokenHeartbeat() {
    setInterval(async () => {
      if (!authToken) return;
      try {
        const res = await fetch(`${API_URL}/api/auth/verify`, { headers: { 'Authorization': `Bearer ${authToken}` } });
        if (res.status === 401 || res.status === 403) {
          showToast('Your access has been revoked. Signing you out.', 'error', 6000, 'Access Revoked');
          setTimeout(doLogout, 1500);
        }
      } catch { /* server unreachable, stay logged in */ }
    }, 30000);
  }

  // ─── RECOVERY — STEP INDICATOR ───
  let recoveryEmail = '';

  function setRecoveryStep(step) {
    ['rec-step-1','rec-step-2','rec-step-3','rec-step-done'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = 'none';
    });
    const target = document.getElementById('rec-step-' + (step === 'done' ? 'done' : step));
    if (target) target.style.display = 'block';

    // Update step dots
    const titles = { 1: 'Reset Password', 2: 'Enter Code', 3: 'New Password', done: 'All Done' };
    const subs   = { 1: 'Enter your email to receive a 6-digit recovery code', 2: 'Enter the code sent to your inbox', 3: 'Choose a strong new password', done: '' };
    document.getElementById('recovery-title').textContent    = titles[step] || '';
    document.getElementById('recovery-subtitle').textContent = subs[step] || '';

    const dots  = [1,2,3];
    const lines = [[1,2],[2,3]];
    dots.forEach(d => {
      const dot = document.getElementById('dot-' + d);
      if (!dot) return;
      dot.classList.remove('active','done');
      if (step === 'done' || d < (step === 'done' ? 4 : parseInt(step))) dot.classList.add('done');
      else if (d == parseInt(step)) dot.classList.add('active');
    });
    lines.forEach(([a,b]) => {
      const line = document.getElementById('line-' + a + b);
      if (line) line.classList.toggle('active', parseInt(step) > a || step === 'done');
    });

    // Hide back link on done screen
    const backLink = document.getElementById('recovery-back-link');
    if (backLink) backLink.style.display = step === 'done' ? 'none' : 'block';

    document.getElementById('recovery-error').textContent = '';
  }

  function setRecoveryError(msg) {
    const el = document.getElementById('recovery-error');
    if (el) el.textContent = msg;
  }

  function resetRecoveryForm() {
    recoveryEmail = '';
    setRecoveryStep(1);
    const el = document.getElementById('recovery-email');
    if (el) el.value = '';
    clearCodeBoxes();
  }

  // ─── RECOVERY — CODE BOXES ───
  function clearCodeBoxes() {
    document.querySelectorAll('.code-box').forEach(b => { b.value = ''; b.classList.remove('filled'); });
    document.getElementById('reset-code').value = '';
  }

  function initCodeBoxes() {
    const boxes = document.querySelectorAll('.code-box');
    boxes.forEach((box, i) => {
      box.addEventListener('input', e => {
        const val = e.target.value.replace(/\D/g,'');
        box.value = val.slice(-1);
        box.classList.toggle('filled', !!box.value);
        if (box.value && i < boxes.length - 1) boxes[i+1].focus();
        // Assemble full code
        const full = Array.from(boxes).map(b => b.value).join('');
        document.getElementById('reset-code').value = full;
        if (full.length === 6) document.getElementById('verify-code-btn')?.focus();
      });
      box.addEventListener('keydown', e => {
        if (e.key === 'Backspace' && !box.value && i > 0) boxes[i-1].focus();
        if (e.key === 'Enter') document.getElementById('verify-code-btn')?.click();
      });
      box.addEventListener('paste', e => {
        e.preventDefault();
        const pasted = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g,'');
        [...pasted.slice(0,6)].forEach((ch, idx) => {
          if (boxes[idx]) { boxes[idx].value = ch; boxes[idx].classList.add('filled'); }
        });
        document.getElementById('reset-code').value = pasted.slice(0,6);
        if (boxes[Math.min(pasted.length, 5)]) boxes[Math.min(pasted.length, 5)].focus();
      });
    });
  }
  initCodeBoxes();

  // ─── RECOVERY STEP 1: Send Code ───
  async function sendRecoveryCode(email) {
    const btn = document.getElementById('send-code-btn');
    const txt = document.getElementById('send-code-text');
    btn.disabled = true; txt.textContent = 'Sending…';
    setRecoveryError('');

    try {
      const res  = await fetch(`${API_URL}/api/forgot-password`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
      const data = await res.json();
      if (res.ok) {
        recoveryEmail = email;
        setRecoveryStep(2);
        setTimeout(() => document.querySelector('.code-box')?.focus(), 100);
        showToast('Recovery code sent! Check your email.', 'success', 5000, 'Code Sent');
      } else {
        setRecoveryError(data.error || 'Failed to send code. Check the email address.');
      }
    } catch {
      setRecoveryError('Cannot reach server. Check your connection.');
    } finally {
      btn.disabled = false; txt.textContent = 'Send Recovery Code';
    }
  }

  document.getElementById('send-code-btn')?.addEventListener('click', () => {
    const email = document.getElementById('recovery-email').value.trim();
    if (!email) { setRecoveryError('Please enter your email address.'); return; }
    sendRecoveryCode(email);
  });

  document.getElementById('resend-code-btn')?.addEventListener('click', () => {
    if (!recoveryEmail) { setRecoveryStep(1); return; }
    clearCodeBoxes();
    sendRecoveryCode(recoveryEmail);
  });

  // ─── RECOVERY STEP 2: Verify Code ───
  document.getElementById('verify-code-btn')?.addEventListener('click', async () => {
    const code = document.getElementById('reset-code').value;
    if (code.length !== 6) { setRecoveryError('Please enter the full 6-digit code.'); return; }

    const btn = document.getElementById('verify-code-btn');
    const txt = document.getElementById('verify-code-text');
    btn.disabled = true; txt.textContent = 'Verifying…';
    setRecoveryError('');

    try {
      const res  = await fetch(`${API_URL}/api/verify-code`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: recoveryEmail, code }) });
      const data = await res.json();
      if (res.ok) {
        setRecoveryStep(3);
        setTimeout(() => document.getElementById('reset-new-password')?.focus(), 100);
      } else {
        setRecoveryError(data.error || 'Invalid code. Please try again.');
        // Shake the code boxes
        document.getElementById('code-input-row').style.animation = 'none';
        setTimeout(() => { document.getElementById('code-input-row').style.animation = ''; clearCodeBoxes(); document.querySelector('.code-box')?.focus(); }, 50);
      }
    } catch {
      setRecoveryError('Server error. Please try again.');
    } finally {
      btn.disabled = false; txt.textContent = 'Verify Code';
    }
  });

  // ─── RECOVERY STEP 3: Reset Password ───
  document.getElementById('submit-reset-btn')?.addEventListener('click', async () => {
    const newPw  = document.getElementById('reset-new-password').value;
    const confPw = document.getElementById('reset-confirm-password').value;
    const code   = document.getElementById('reset-code').value;
    if (!newPw || newPw.length < 6) { setRecoveryError('Password must be at least 6 characters.'); return; }
    if (newPw !== confPw) { setRecoveryError('Passwords do not match.'); return; }

    const btn = document.getElementById('submit-reset-btn');
    const txt = document.getElementById('submit-reset-text');
    btn.disabled = true; txt.textContent = 'Saving…';
    setRecoveryError('');

    try {
      const res  = await fetch(`${API_URL}/api/reset-password`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: recoveryEmail, code, newPassword: newPw }) });
      const data = await res.json();
      if (res.ok) {
        setRecoveryStep('done');
      } else {
        setRecoveryError(data.error || 'Reset failed. The code may have expired.');
      }
    } catch {
      setRecoveryError('Server error. Please try again.');
    } finally {
      btn.disabled = false; txt.textContent = 'Set New Password';
    }
  });

  // ─── MOBILE SIDEBAR ───
  const sidebar  = document.getElementById('sidebar');
  const backdrop = document.getElementById('sidebar-backdrop');
  function openSidebar()  { sidebar.classList.add('open'); backdrop.classList.add('visible'); document.body.style.overflow = 'hidden'; }
  function closeSidebar() { sidebar.classList.remove('open'); backdrop.classList.remove('visible'); document.body.style.overflow = ''; }
  document.getElementById('mob-burger')?.addEventListener('click', () => sidebar.classList.contains('open') ? closeSidebar() : openSidebar());
  backdrop?.addEventListener('click', closeSidebar);

  // Mobile save
  document.getElementById('mob-save-btn')?.addEventListener('click', () => { syncInputsToData(); saveData(); });

  // ─── NAVIGATION ───
  const SECTION_NAMES = { 'hero-section':'Hero Slides','events-section':'Events','sermons-section':'Sermon Vault','gallery-section':'Community Gallery','global-section':'Global Assets','users-section':'Access Control','account-section':'My Account' };
  function switchSection(targetId) {
    document.querySelectorAll('.panel').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(a => a.classList.remove('active'));
    document.getElementById(targetId)?.classList.add('active');
    document.querySelectorAll(`.nav-item[data-target="${targetId}"]`).forEach(a => a.classList.add('active'));
    const tt = document.getElementById('topbar-title');
    if (tt) tt.textContent = SECTION_NAMES[targetId] || '';
    if (window.innerWidth <= 1024) closeSidebar();
  }
  document.querySelectorAll('.nav-item[data-target]').forEach(link => {
    link.addEventListener('click', e => { e.preventDefault(); switchSection(link.dataset.target); });
  });

  // ─── SAVE ALL ───
  document.getElementById('save-all-btn')?.addEventListener('click', () => { syncInputsToData(); saveData(); });

  async function saveData() {
    const btn    = document.getElementById('save-all-btn');
    const mobBtn = document.getElementById('mob-save-btn');
    if (btn) { btn.textContent = 'Saving…'; btn.disabled = true; }
    if (mobBtn) { mobBtn.textContent = 'Saving…'; mobBtn.disabled = true; }
    try {
      // Strip mongoose internal fields before sending
      const payload = JSON.parse(JSON.stringify(siteData, (key, val) => key === '__v' ? undefined : val));
      const res  = await fetch(`${API_URL}/api/data`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` }, body: JSON.stringify(payload) });
      // Handle non-JSON responses (e.g. 500 HTML error pages)
      const contentType = res.headers.get('content-type') || '';
      const data = contentType.includes('application/json') ? await res.json() : { error: `Server error (${res.status})` };
      if (res.ok) {
        showToast('Changes are now live on the website.', 'success', 4000, 'Deployed!');
        clearUnsaved();
      } else if (res.status === 401 || res.status === 403) {
        showToast('Session expired. Please sign in again.', 'error', 5000, 'Unauthorized');
        setTimeout(doLogout, 1500);
      } else {
        showToast(data.error || `Save failed (${res.status}).`, 'error', 5000, 'Error');
      }
    } catch (err) {
      showToast('Cannot reach server. Check your connection.', 'error', 5000, 'Error');
      console.error('Save error:', err);
    } finally {
      if (btn) {
        btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg> Deploy Changes`;
        btn.disabled = false;
      }
      if (mobBtn) { mobBtn.textContent = 'Save'; mobBtn.disabled = false; }
    }
  }

  // ─── FETCH DATA ───
  async function fetchData() {
    try {
      const res = await fetch(`${API_URL}/api/data`);
      if (!res.ok) throw new Error();
      siteData = await res.json();
      siteData.hero    = siteData.hero    || [];
      siteData.events  = siteData.events  || [];
      siteData.sermons = siteData.sermons || [];
      siteData.gallery = siteData.gallery || [];
      siteData.global  = siteData.global  || {};

      const gl = siteData.global;
      setGlobalField('global-logo',   gl.logoImage,   'preview-logo');
      setGlobalField('global-about',  gl.aboutImage,  'preview-about');
      setGlobalField('global-pastor', gl.pastorImage, 'preview-pastor');

      renderHero(); renderEvents(); renderSermons(); renderGallery();
    } catch {
      showToast('Failed to load site data. Please refresh.', 'error', 6000, 'Load Error');
    }
  }

  function setGlobalField(inputId, url, previewId) {
    const input = document.getElementById(inputId);
    const preview = document.getElementById(previewId);
    if (input) input.value = url || '';
    if (preview) preview.innerHTML = url ? `<img src="${url}" alt="">` : `<span>No image set</span>`;
  }

  // ─── SYNC INPUTS → STATE ───
  // Uses data-array / data-index / data-field attributes written on every input at render time
  // so sync always reads the current DOM value regardless of which section is visible
  function syncInputsToData() {
    document.querySelectorAll('[data-array][data-index][data-field]').forEach(el => {
      const arr   = el.dataset.array;
      const idx   = parseInt(el.dataset.index);
      const field = el.dataset.field;
      if (!siteData[arr] || !siteData[arr][idx]) return;
      siteData[arr][idx][field] = el.value;
    });
    // Global assets
    const logo   = document.getElementById('global-logo');
    const about  = document.getElementById('global-about');
    const pastor = document.getElementById('global-pastor');
    if (logo?.value)   siteData.global.logoImage   = logo.value;
    if (about?.value)  siteData.global.aboutImage  = about.value;
    if (pastor?.value) siteData.global.pastorImage = pastor.value;
  }

  // ─── IMAGE UPLOAD ───
  async function uploadImage(file, labelEl) {
    const formData = new FormData();
    formData.append('image', file);
    if (labelEl) { labelEl.textContent = 'Uploading…'; labelEl.style.pointerEvents = 'none'; }
    try {
      const res  = await fetch(`${API_URL}/api/upload`, { method: 'POST', headers: { 'Authorization': `Bearer ${authToken}` }, body: formData });
      const data = await res.json();
      if (res.ok) { showToast('Image uploaded successfully.', 'success', 3000); return data.url; }
      throw new Error(data.error || 'Upload failed');
    } catch (err) {
      showToast(err.message, 'error', 5000, 'Upload Failed');
      return null;
    } finally {
      if (labelEl) { labelEl.textContent = 'Upload Photo'; labelEl.style.pointerEvents = ''; }
    }
  }

  window.uploadGlobalImage = async (event, key) => {
    const file = event.target.files[0]; if (!file) return;
    const label = event.target.closest('.asset-actions')?.querySelector('.upload-label');
    if (label) { label.textContent = 'Uploading…'; label.style.pointerEvents = 'none'; }
    const url = await uploadImage(file);
    if (url) {
      siteData.global[key] = url;
      const inputMap   = { logoImage:'global-logo', aboutImage:'global-about', pastorImage:'global-pastor' };
      const previewMap = { logoImage:'preview-logo', aboutImage:'preview-about', pastorImage:'preview-pastor' };
      if (inputMap[key])   document.getElementById(inputMap[key]).value = url;
      if (previewMap[key]) document.getElementById(previewMap[key]).innerHTML = `<img src="${url}" alt="">`;
      markUnsaved();
    }
    if (label) { label.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg> Upload Image`; label.style.pointerEvents = ''; }
  };

  window.globalUrlInput = (input, key, previewId) => {
    siteData.global[key] = input.value;
    const preview = document.getElementById(previewId);
    if (preview) preview.innerHTML = input.value ? `<img src="${input.value}" alt="">` : '<span>No image set</span>';
    markUnsaved();
  };

  window.handleCardUpload = async (event, arrayName, index) => {
    const file = event.target.files[0]; if (!file) return;
    const card  = event.target.closest('.admin-card');
    const label = card?.querySelector('.upload-chip');
    const url   = await uploadImage(file, label);
    if (url) {
      // Update state
      siteData[arrayName][index].imageUrl = url;
      // Update preview
      const preview = card?.querySelector('.card-img-preview');
      if (preview) preview.innerHTML = `<img src="${url}" alt="">`;
      // Update the URL text input so syncInputsToData reads the correct value on save
      const urlInput = card?.querySelector('[data-field="imageUrl"]');
      if (urlInput) urlInput.value = url;
      markUnsaved();
    }
  };

  // ─── RENDER HELPERS ───
  const imgPreview = url => url ? `<div class="card-img-preview"><img src="${url}" alt=""></div>` : `<div class="card-img-preview"><span>No image</span></div>`;
  const field = (label, name, value, type = 'text') => {
    const tag = type === 'textarea'
      ? `<textarea data-field="${name}" oninput="markUnsaved()">${value||''}</textarea>`
      : `<input type="${type}" data-field="${name}" value="${(value||'').replace(/"/g,'&quot;')}" oninput="markUnsaved()">`;
    return `<div class="input-group"><label>${label}</label>${tag}</div>`;
  };

  // ─── HERO ───
  function renderHero() {
    const grid = document.getElementById('admin-hero-grid'); if (!grid) return;
    if (!siteData.hero.length) { grid.innerHTML = `<div class="empty-state"><div class="empty-state-icon">◈</div><p>No slides yet. Click "+ Add Slide".</p></div>`; return; }
    grid.innerHTML = siteData.hero.map((h,i) => {
      const af = (f, val, type='text') => {
        const attrs = `data-array="hero" data-index="${i}" data-field="${f}" oninput="markUnsaved()"`;
        return type === 'textarea'
          ? `<textarea ${attrs}>${val||''}</textarea>`
          : `<input type="text" ${attrs} value="${(val||'').replace(/"/g,'&quot;')}" placeholder="${f}">`;
      };
      return `
      <div class="admin-card" data-hero-index="${i}">
        <div class="card-top"><span class="card-label">Slide ${i+1}</span><button class="btn-icon danger" onclick="deleteHero(${i})">✕</button></div>
        ${imgPreview(h.imageUrl)}
        <div class="card-upload-row">
          <label class="upload-chip" for="upload-hero-${i}">↑ Upload Photo</label>
          <input type="file" id="upload-hero-${i}" accept="image/*" style="display:none" onchange="handleCardUpload(event,'hero',${i})">
          <div class="input-group"><label>Or paste image URL</label>${af('imageUrl', h.imageUrl)}</div>
        </div>
        <div class="input-group"><label>Eyebrow Text</label>${af('eyebrow', h.eyebrow)}</div>
        <div class="input-group"><label>Heading HTML</label>${af('headingHtml', h.headingHtml)}</div>
        <div class="input-group"><label>Description</label>${af('description', h.description, 'textarea')}</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          <div class="input-group"><label>Button 1 Text</label>${af('btn1Text', h.btn1Text)}</div>
          <div class="input-group"><label>Button 1 Link</label>${af('btn1Link', h.btn1Link)}</div>
          <div class="input-group"><label>Button 2 Text</label>${af('btn2Text', h.btn2Text)}</div>
          <div class="input-group"><label>Button 2 Link</label>${af('btn2Link', h.btn2Link)}</div>
        </div>
      </div>`;
    }).join('');
    // Wire image URL inputs for live preview
    siteData.hero.forEach((h,i) => {
      const card = grid.querySelector(`[data-hero-index="${i}"]`);
      const inp  = card?.querySelector('[data-field="imageUrl"]');
      if (inp) inp.addEventListener('input', () => {
        const p = card.querySelector('.card-img-preview');
        if (p) p.innerHTML = inp.value ? `<img src="${inp.value}" alt="">` : '<span>No image</span>';
      });
    });
  }
  window.addHeroSlide = () => { syncInputsToData(); siteData.hero.unshift({eyebrow:'Welcome',headingHtml:'New Slide',description:'',imageUrl:'',btn1Text:'',btn1Link:'',btn2Text:'',btn2Link:''}); renderHero(); markUnsaved(); };
  window.deleteHero   = idx => { if(!confirm('Delete this slide?')) return; siteData.hero.splice(idx,1); renderHero(); markUnsaved(); };

  // ─── EVENTS ───
  function renderEvents() {
    const grid = document.getElementById('admin-events-grid'); if (!grid) return;
    if (!siteData.events.length) { grid.innerHTML = `<div class="empty-state"><div class="empty-state-icon">◉</div><p>No events yet.</p></div>`; return; }
    grid.innerHTML = siteData.events.map((e,i) => {
      const af = (label, f, val, type='text') => {
        const attrs = `data-array="events" data-index="${i}" data-field="${f}" oninput="markUnsaved()"`;
        const tag = type === 'textarea'
          ? `<textarea ${attrs}>${val||''}</textarea>`
          : `<input type="text" ${attrs} value="${(val||'').replace(/"/g,'&quot;')}">`;
        return `<div class="input-group"><label>${label}</label>${tag}</div>`;
      };
      return `
      <div class="admin-card">
        <div class="card-top"><span class="card-label">Event ${i+1}</span><button class="btn-icon danger" onclick="deleteEvent(${i})">✕</button></div>
        ${imgPreview(e.imageUrl)}
        <div class="card-upload-row">
          <label class="upload-chip" for="upload-event-${i}">↑ Upload Photo</label>
          <input type="file" id="upload-event-${i}" accept="image/*" style="display:none" onchange="handleCardUpload(event,'events',${i})">
          <div class="input-group"><label>Or paste image URL</label><input type="text" data-array="events" data-index="${i}" data-field="imageUrl" value="${(e.imageUrl||'').replace(/"/g,'&quot;')}" oninput="markUnsaved()"></div>
        </div>
        ${af('Badge','badge',e.badge)}
        ${af('Date','date',e.date)}
        ${af('Title','title',e.title)}
        ${af('Description','description',e.description,'textarea')}
        ${af('Link Text','linkRef',e.linkRef)}
      </div>`;
    }).join('');
  }
  window.addEvent   = () => { syncInputsToData(); siteData.events.unshift({id:Date.now(),badge:'New',date:'TBD',title:'New Event',description:'',imageUrl:''}); renderEvents(); markUnsaved(); };
  window.deleteEvent = idx => { if(!confirm('Delete this event?')) return; siteData.events.splice(idx,1); renderEvents(); markUnsaved(); };

  // ─── SERMONS ───
  function renderSermons() {
    const grid = document.getElementById('admin-sermons-grid'); if (!grid) return;
    if (!siteData.sermons.length) { grid.innerHTML = `<div class="empty-state"><div class="empty-state-icon">◎</div><p>No sermons yet.</p></div>`; return; }
    grid.innerHTML = siteData.sermons.map((s,i) => {
      const af = (label, f, val, type='text') => {
        const attrs = `data-array="sermons" data-index="${i}" data-field="${f}" oninput="markUnsaved()"`;
        const tag = type === 'textarea'
          ? `<textarea ${attrs}>${val||''}</textarea>`
          : `<input type="text" ${attrs} value="${(val||'').replace(/"/g,'&quot;')}">`;
        return `<div class="input-group"><label>${label}</label>${tag}</div>`;
      };
      return `
      <div class="admin-card">
        <div class="card-top"><span class="card-label">Sermon ${i+1}</span><button class="btn-icon danger" onclick="deleteSermon(${i})">✕</button></div>
        ${imgPreview(s.imageUrl)}
        <div class="card-upload-row">
          <label class="upload-chip" for="upload-sermon-${i}">↑ Thumbnail</label>
          <input type="file" id="upload-sermon-${i}" accept="image/*" style="display:none" onchange="handleCardUpload(event,'sermons',${i})">
          <div class="input-group"><label>Or paste image URL</label><input type="text" data-array="sermons" data-index="${i}" data-field="imageUrl" value="${(s.imageUrl||'').replace(/"/g,'&quot;')}" oninput="markUnsaved()"></div>
        </div>
        ${af('Meta (Date / Series)','meta',s.meta)}
        ${af('Title','title',s.title)}
        ${af('Description','description',s.description,'textarea')}
        ${af('Video URL','videoUrl',s.videoUrl)}
        ${af('Audio URL','audioUrl',s.audioUrl)}
      </div>`;
    }).join('');
  }
  window.addSermon    = () => { syncInputsToData(); siteData.sermons.unshift({id:Date.now(),meta:'',title:'New Sermon',description:'',imageUrl:''}); renderSermons(); markUnsaved(); };
  window.deleteSermon = idx => { if(!confirm('Delete this sermon?')) return; siteData.sermons.splice(idx,1); renderSermons(); markUnsaved(); };

  // ─── GALLERY ───
  function renderGallery() {
    const grid = document.getElementById('admin-gallery-grid'); if (!grid) return;
    if (!siteData.gallery.length) { grid.innerHTML = `<div class="empty-state"><div class="empty-state-icon">◫</div><p>No gallery photos yet.</p></div>`; return; }
    grid.innerHTML = siteData.gallery.map((g,i) => `
      <div class="admin-card">
        <div class="card-top"><span class="card-label">Photo ${i+1}</span><button class="btn-icon danger" onclick="deleteGalleryImage(${i})">✕</button></div>
        ${imgPreview(g.imageUrl)}
        <div class="card-upload-row"><label class="upload-chip" for="upload-gallery-${i}">↑ Upload Photo</label><input type="file" id="upload-gallery-${i}" accept="image/*" style="display:none" onchange="handleCardUpload(event,'gallery',${i})"></div>
      </div>`).join('');
  }
  window.addGalleryImage    = () => { syncInputsToData(); siteData.gallery.unshift({id:Date.now(),imageUrl:''}); renderGallery(); markUnsaved(); };
  window.deleteGalleryImage = idx => { if(!confirm('Remove this photo?')) return; siteData.gallery.splice(idx,1); renderGallery(); markUnsaved(); };

  // ─── USERS ───
  async function fetchUsers() {
    try {
      const res = await fetch(`${API_URL}/api/users`, { headers: { 'Authorization': `Bearer ${authToken}` } });
      if (res.ok) renderUsers(await res.json());
      else showToast('Could not load users.', 'error');
    } catch { showToast('Failed to load users.', 'error'); }
  }

  function renderUsers(users) {
    const tbody = document.getElementById('users-table-body'); if (!tbody) return;
    if (!users.length) { tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;padding:32px;color:var(--muted)">No users found</td></tr>`; return; }
    tbody.innerHTML = users.map(u => {
      const isYou = u.id === currentUserId;
      return `<tr>
        <td><span class="user-email">${u.email}</span>${isYou?'<span class="user-you">(you)</span>':''}</td>
        <td><span class="role-badge ${u.role}">${u.role}</span></td>
        <td><span class="status-badge">Active</span></td>
        <td style="text-align:right">${!isYou?`<button class="revoke-btn" onclick="revokeUser('${u.id}','${u.email}')">Revoke Access</button>`:''}</td>
      </tr>`;
    }).join('');
  }

  window.toggleNewUserForm = () => {
    const form = document.getElementById('new-user-form'); if (!form) return;
    const visible = form.style.display !== 'none';
    form.style.display = visible ? 'none' : 'block';
    if (!visible) document.getElementById('new-user-email')?.focus();
  };

  window.createUser = async () => {
    const email    = document.getElementById('new-user-email').value.trim();
    const password = document.getElementById('new-user-password').value;
    const role     = document.getElementById('new-user-role').value;
    if (!email || !password) { showToast('Email and password required.', 'warning'); return; }
    try {
      const res  = await fetch(`${API_URL}/api/users`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` }, body: JSON.stringify({ email, password, role }) });
      const data = await res.json();
      if (res.ok) {
        showToast(`Account created. Login details sent to ${email}.`, 'success', 5000, 'User Created');
        document.getElementById('new-user-email').value = '';
        document.getElementById('new-user-password').value = '';
        document.getElementById('new-user-form').style.display = 'none';
        fetchUsers();
      } else {
        showToast(data.error || 'Failed to create user.', 'error');
      }
    } catch { showToast('Server error.', 'error'); }
  };

  window.revokeUser = async (id, email) => {
    if (!confirm(`Revoke access for ${email}? They will be signed out immediately and notified by email.`)) return;
    try {
      const res  = await fetch(`${API_URL}/api/users/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${authToken}` } });
      if (res.ok) {
        showToast(`${email} has been removed and notified.`, 'info', 5000, 'Access Revoked');
        fetchUsers();
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to revoke.', 'error');
      }
    } catch { showToast('Server error.', 'error'); }
  };

  // ─── ACCOUNT: CHANGE PASSWORD ───
  window.togglePw = (id, btn) => {
    const inp = document.getElementById(id);
    if (!inp) return;
    inp.type = inp.type === 'password' ? 'text' : 'password';
    btn.textContent = inp.type === 'password' ? '👁' : '🙈';
  };

  window.changePassword = async () => {
    const current = document.getElementById('current-password').value;
    const newPw   = document.getElementById('new-password').value;
    const confirm = document.getElementById('confirm-new-password').value;

    if (!current) { showToast('Enter your current password.', 'warning'); return; }
    if (!newPw || newPw.length < 6) { showToast('New password must be at least 6 characters.', 'warning'); return; }
    if (newPw !== confirm) { showToast('New passwords do not match.', 'error'); return; }
    if (current === newPw) { showToast('New password must differ from current password.', 'warning'); return; }

    const btn = document.getElementById('change-pw-btn');
    btn.textContent = 'Updating…'; btn.disabled = true;

    try {
      const res  = await fetch(`${API_URL}/api/auth/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
        body: JSON.stringify({ currentPassword: current, newPassword: newPw })
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Password updated successfully!', 'success', 4000, 'Done');
        document.getElementById('current-password').value  = '';
        document.getElementById('new-password').value      = '';
        document.getElementById('confirm-new-password').value = '';
      } else {
        showToast(data.error || 'Failed to update password.', 'error');
      }
    } catch {
      showToast('Server error. Please try again.', 'error');
    } finally {
      btn.textContent = 'Update Password'; btn.disabled = false;
    }
  };

  // ─── INIT DASHBOARD ───
  async function initDashboard() {
    authScreen.style.display = 'none';
    dashboard.style.display  = 'flex';
    mobBar.style.display     = 'flex';
    if (adminRole === 'superadmin') document.getElementById('nav-users')?.style.removeProperty('display');
    // Show logged-in email in My Account section
    const emailDisplay = document.getElementById('account-email-display');
    if (emailDisplay) {
      const stored = localStorage.getItem('adminEmail') || '';
      emailDisplay.textContent = stored || 'Logged in user';
    }
    await fetchData();
    if (adminRole === 'superadmin') fetchUsers();
    startTokenHeartbeat();
  }

  // ─── BOOT ───
  if (authToken) {
    initDashboard();
  } else {
    if (mobBar) mobBar.style.display = 'none';
  }

})();
