(function () {
  // ─── CONFIG ───
  const API_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:3000'
    : 'https://citadel-newdb.onrender.com';

  // ─── STATE ───
  let authToken = localStorage.getItem('adminToken');
  let adminRole = localStorage.getItem('adminRole');
  let currentUserId = localStorage.getItem('adminUserId');
  let siteData = { hero: [], events: [], sermons: [], gallery: [], global: {} };
  let hasUnsaved = false;

  // ─── TOAST ───
  const ICONS = { success: '✓', error: '✕', info: 'ℹ', warning: '⚠' };
  function showToast(message, type = 'success', duration = 3800, title = '') {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = 'toast toast-' + type;
    toast.innerHTML = `
      <span class="toast-icon">${ICONS[type] || '✓'}</span>
      <div class="toast-body">
        ${title ? `<div class="toast-title">${title}</div>` : ''}
        <div class="toast-msg">${message}</div>
      </div>
      <button class="toast-close" onclick="this.parentElement.remove()">✕</button>
      <div class="toast-bar" style="animation-duration:${duration}ms"></div>`;
    container.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('removing');
      setTimeout(() => toast.remove(), 280);
    }, duration);
  }

  // ─── UNSAVED CHANGES TRACKING ───
  function markUnsaved() {
    hasUnsaved = true;
    document.title = '● Citadel Command Centre';
  }
  function clearUnsaved() {
    hasUnsaved = false;
    document.title = 'Citadel of Truth — Command Centre';
  }
  window.addEventListener('beforeunload', e => {
    if (hasUnsaved) { e.preventDefault(); e.returnValue = ''; }
  });

  // ─── MOBILE SIDEBAR ───
  const mobBurger = document.getElementById('mob-burger');
  const sidebar   = document.getElementById('sidebar');
  const backdrop  = document.getElementById('sidebar-backdrop');
  const mobBar    = document.getElementById('mob-bar');

  function openSidebar()  { sidebar.classList.add('open'); backdrop.classList.add('visible'); document.body.style.overflow = 'hidden'; }
  function closeSidebar() { sidebar.classList.remove('open'); backdrop.classList.remove('visible'); document.body.style.overflow = ''; }
  if (mobBurger) mobBurger.addEventListener('click', () => sidebar.classList.contains('open') ? closeSidebar() : openSidebar());
  if (backdrop)  backdrop.addEventListener('click', closeSidebar);

  // ─── MOBILE SAVE ───
  const mobSaveBtn = document.getElementById('mob-save-btn');
  if (mobSaveBtn) mobSaveBtn.addEventListener('click', () => { syncInputsToData(); saveData(); });

  // ─── LOGIN ───
  const loginOverlay = document.getElementById('login-overlay');
  const dashboard    = document.getElementById('dashboard');
  const loginBtn     = document.getElementById('login-btn');
  const loginError   = document.getElementById('login-error');
  const pwToggle     = document.getElementById('toggle-pw');
  const pwInput      = document.getElementById('admin-password');

  if (pwToggle && pwInput) {
    pwToggle.addEventListener('click', () => {
      const show = pwInput.type === 'password';
      pwInput.type = show ? 'text' : 'password';
      pwToggle.textContent = show ? '🙈' : '👁';
    });
  }

  async function doLogin() {
    const email    = document.getElementById('admin-email').value.trim();
    const password = pwInput.value;
    if (!email || !password) { loginError.textContent = 'Please fill in both fields.'; return; }
    loginBtn.disabled = true;
    document.getElementById('login-btn-text').textContent = 'Signing in…';
    loginError.textContent = '';
    try {
      const res  = await fetch(`${API_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok) {
        authToken     = data.token;
        adminRole     = data.role;
        currentUserId = data.userId || '';
        localStorage.setItem('adminToken',  authToken);
        localStorage.setItem('adminRole',   adminRole);
        localStorage.setItem('adminUserId', currentUserId);
        init();
      } else {
        loginError.textContent = data.error || 'Login failed.';
        showToast(data.error || 'Invalid credentials', 'error');
        loginBtn.disabled = false;
        document.getElementById('login-btn-text').textContent = 'Enter Dashboard';
      }
    } catch {
      loginError.textContent = 'Cannot reach server.';
      showToast('Cannot reach the server. Check your connection.', 'error');
      loginBtn.disabled = false;
      document.getElementById('login-btn-text').textContent = 'Enter Dashboard';
    }
  }

  if (loginBtn) loginBtn.addEventListener('click', doLogin);
  document.addEventListener('keydown', e => {
    if (e.key === 'Enter' && loginOverlay && loginOverlay.style.display !== 'none') doLogin();
  });

  // ─── FORGOT PASSWORD & RESET ───
  const forgotPwBtn = document.getElementById('forgot-pw-btn');
  const verifyCodeFields = document.getElementById('verify-code-fields');
  const verifyCodeBtn = document.getElementById('verify-code-btn');
  const newPwFields = document.getElementById('new-pw-fields');
  const submitResetBtn = document.getElementById('submit-reset-btn');
  const adminPasswordWrap = document.getElementById('admin-password-wrap');
  
  if (forgotPwBtn) {
    forgotPwBtn.addEventListener('click', async () => {
      const email = document.getElementById('admin-email').value.trim();
      if (!email) {
        loginError.textContent = 'Please enter your email address to reset password.';
        loginError.style.color = '#e74c3c';
        return;
      }
      forgotPwBtn.disabled = true;
      forgotPwBtn.textContent = 'Sending...';
      loginError.textContent = '';
      try {
        const res = await fetch(`${API_URL}/api/forgot-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });
        const data = await res.json();
        if (res.ok) {
          showToast('A recovery code has been sent to your email.', 'success', 6000, 'Email Sent');
          loginError.textContent = 'Check your email for the 6-digit code.';
          loginError.style.color = '#2ecc71';
          
          verifyCodeFields.style.display = 'flex';
          forgotPwBtn.style.display = 'none';
          if (adminPasswordWrap) adminPasswordWrap.style.display = 'none';
          if (loginBtn) loginBtn.style.display = 'none';
          
          // Make email read-only so they don't change it during the process
          document.getElementById('admin-email').readOnly = true;
          document.getElementById('admin-email').style.opacity = '0.7';
        } else {
          loginError.textContent = data.error || 'Failed to send recovery code.';
          loginError.style.color = '#e74c3c';
        }
      } catch (err) {
        loginError.textContent = 'Cannot reach server.';
        loginError.style.color = '#e74c3c';
      } finally {
        forgotPwBtn.disabled = false;
        forgotPwBtn.textContent = 'Forgot Password?';
      }
    });
  }

  if (verifyCodeBtn) {
    verifyCodeBtn.addEventListener('click', async () => {
      const email = document.getElementById('admin-email').value.trim();
      const code = document.getElementById('reset-code').value.trim();
      
      if (!code) {
        loginError.textContent = 'Please enter the 6-digit recovery code.';
        loginError.style.color = '#e74c3c';
        return;
      }
      
      verifyCodeBtn.disabled = true;
      verifyCodeBtn.querySelector('span').textContent = 'Verifying...';
      try {
        const res = await fetch(`${API_URL}/api/verify-code`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, code })
        });
        const data = await res.json();
        if (res.ok) {
          loginError.textContent = 'Code verified! Enter your new password.';
          loginError.style.color = '#2ecc71';
          verifyCodeFields.style.display = 'none';
          newPwFields.style.display = 'flex';
        } else {
          loginError.textContent = data.error || 'Invalid recovery code.';
          loginError.style.color = '#e74c3c';
        }
      } catch (err) {
        loginError.textContent = 'Cannot reach server.';
        loginError.style.color = '#e74c3c';
      } finally {
        verifyCodeBtn.disabled = false;
        verifyCodeBtn.querySelector('span').textContent = 'Verify Code';
      }
    });
  }

  if (submitResetBtn) {
    submitResetBtn.addEventListener('click', async () => {
      const email = document.getElementById('admin-email').value.trim();
      const code = document.getElementById('reset-code').value.trim();
      const newPassword = document.getElementById('reset-new-password').value;
      
      if (!newPassword) {
        loginError.textContent = 'Please enter a new password.';
        loginError.style.color = '#e74c3c';
        return;
      }
      
      submitResetBtn.disabled = true;
      submitResetBtn.querySelector('span').textContent = 'Updating...';
      try {
        const res = await fetch(`${API_URL}/api/reset-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, code, newPassword })
        });
        const data = await res.json();
        if (res.ok) {
          showToast('Password updated successfully! You can now log in.', 'success', 6000, 'Success');
          loginError.textContent = '';
          newPwFields.style.display = 'none';
          forgotPwBtn.style.display = 'inline-block';
          if (adminPasswordWrap) adminPasswordWrap.style.display = 'flex';
          if (loginBtn) loginBtn.style.display = 'flex';
          
          document.getElementById('admin-email').readOnly = false;
          document.getElementById('admin-email').style.opacity = '1';
          document.getElementById('admin-password').value = newPassword;
          document.getElementById('reset-code').value = '';
          document.getElementById('reset-new-password').value = '';
        } else {
          loginError.textContent = data.error || 'Failed to reset password.';
          loginError.style.color = '#e74c3c';
        }
      } catch (err) {
        loginError.textContent = 'Cannot reach server.';
        loginError.style.color = '#e74c3c';
      } finally {
        submitResetBtn.disabled = false;
        submitResetBtn.querySelector('span').textContent = 'Set New Password';
      }
    });
  }

  // ─── LOGOUT ───
  const logoutBtn = document.getElementById('logout-btn');
  function doLogout() {
    authToken = null; adminRole = null; currentUserId = null;
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminRole');
    localStorage.removeItem('adminUserId');
    loginOverlay.style.display = 'flex';
    dashboard.style.display    = 'none';
    mobBar.style.display       = 'none';
    clearUnsaved();
  }
  if (logoutBtn) logoutBtn.addEventListener('click', doLogout);

  // ─── FORCED LOGOUT (token revoked) ───
  // Polls every 2s to check if token is still valid for near-immediate logout
  function startTokenHeartbeat() {
    setInterval(async () => {
      if (!authToken) return;
      try {
        const res = await fetch(`${API_URL}/api/auth/verify`, {
          headers: { 'Authorization': `Bearer ${authToken}` }
        });
        if (res.status === 401 || res.status === 403) {
          showToast('Your access has been revoked. You have been signed out.', 'error', 6000, 'Session Ended');
          setTimeout(doLogout, 1500);
        }
      } catch { /* server unreachable, don't log out */ }
    }, 2000);
  }

  // ─── NAVIGATION ───
  const topbarTitle = document.getElementById('topbar-title');
  const SECTION_NAMES = {
    'hero-section':    'Hero Slides',
    'events-section':  'Events',
    'sermons-section': 'Sermon Vault',
    'gallery-section': 'Community Gallery',
    'global-section':  'Global Assets',
    'users-section':   'Access Control'
  };

  function switchSection(targetId) {
    document.querySelectorAll('.panel').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(a => a.classList.remove('active'));
    const target = document.getElementById(targetId);
    if (target) target.classList.add('active');
    document.querySelectorAll(`.nav-item[data-target="${targetId}"]`).forEach(a => a.classList.add('active'));
    if (topbarTitle) topbarTitle.textContent = SECTION_NAMES[targetId] || '';
    if (window.innerWidth <= 1024) closeSidebar();
  }

  document.querySelectorAll('.nav-item[data-target]').forEach(link => {
    link.addEventListener('click', e => { e.preventDefault(); switchSection(link.dataset.target); });
  });

  // ─── SAVE ALL ───
  const saveAllBtn = document.getElementById('save-all-btn');
  if (saveAllBtn) saveAllBtn.addEventListener('click', () => { syncInputsToData(); saveData(); });

  async function saveData() {
    if (!saveAllBtn) return;
    saveAllBtn.textContent = 'Saving…';
    saveAllBtn.disabled    = true;
    if (mobSaveBtn) { mobSaveBtn.textContent = 'Saving…'; mobSaveBtn.disabled = true; }
    try {
      const res  = await fetch(`${API_URL}/api/data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
        body: JSON.stringify(siteData)
      });
      const data = await res.json();
      if (res.ok) {
        showToast('All changes saved and live on the website.', 'success', 4000, 'Deployed!');
        clearUnsaved();
      } else {
        showToast(data.error || 'Save failed.', 'error', 5000, 'Error');
      }
    } catch {
      showToast('Cannot reach server. Changes not saved.', 'error', 5000, 'Error');
    } finally {
      saveAllBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg> Deploy Changes`;
      saveAllBtn.disabled = false;
      if (mobSaveBtn) { mobSaveBtn.textContent = 'Save'; mobSaveBtn.disabled = false; }
    }
  }

  // ─── FETCH DATA ───
  async function fetchData() {
    try {
      const res = await fetch(`${API_URL}/api/data`);
      if (!res.ok) throw new Error('Bad response');
      siteData = await res.json();
      siteData.hero    = siteData.hero    || [];
      siteData.events  = siteData.events  || [];
      siteData.sermons = siteData.sermons || [];
      siteData.gallery = siteData.gallery || [];
      siteData.global  = siteData.global  || {};

      // Populate global asset fields
      const gl = siteData.global;
      setGlobalField('global-logo',   gl.logoImage,   'preview-logo');
      setGlobalField('global-about',  gl.aboutImage,  'preview-about');
      setGlobalField('global-pastor', gl.pastorImage, 'preview-pastor');

      renderHero();
      renderEvents();
      renderSermons();
      renderGallery();
    } catch (err) {
      console.error('Failed to load data', err);
      showToast('Failed to load site data. Please refresh.', 'error', 6000, 'Load Error');
    }
  }

  function setGlobalField(inputId, url, previewId) {
    const input = document.getElementById(inputId);
    const preview = document.getElementById(previewId);
    if (input) input.value = url || '';
    if (preview && url) preview.innerHTML = `<img src="${url}" alt="">`;
  }

  // ─── SYNC INPUTS → DATA ───
  function syncInputsToData() {
    // Sync hero
    document.querySelectorAll('#admin-hero-grid .admin-card').forEach((card, i) => {
      if (!siteData.hero[i]) return;
      siteData.hero[i].eyebrow     = card.querySelector('[data-field="eyebrow"]')?.value     || '';
      siteData.hero[i].headingHtml = card.querySelector('[data-field="headingHtml"]')?.value || '';
      siteData.hero[i].description = card.querySelector('[data-field="description"]')?.value || '';
      siteData.hero[i].btn1Text    = card.querySelector('[data-field="btn1Text"]')?.value    || '';
      siteData.hero[i].btn1Link    = card.querySelector('[data-field="btn1Link"]')?.value    || '';
      siteData.hero[i].btn2Text    = card.querySelector('[data-field="btn2Text"]')?.value    || '';
      siteData.hero[i].btn2Link    = card.querySelector('[data-field="btn2Link"]')?.value    || '';
    });
    // Sync events
    document.querySelectorAll('#admin-events-grid .admin-card').forEach((card, i) => {
      if (!siteData.events[i]) return;
      siteData.events[i].badge       = card.querySelector('[data-field="badge"]')?.value       || '';
      siteData.events[i].date        = card.querySelector('[data-field="date"]')?.value        || '';
      siteData.events[i].title       = card.querySelector('[data-field="title"]')?.value       || '';
      siteData.events[i].description = card.querySelector('[data-field="description"]')?.value || '';
      siteData.events[i].linkRef     = card.querySelector('[data-field="linkRef"]')?.value     || '';
    });
    // Sync sermons
    document.querySelectorAll('#admin-sermons-grid .admin-card').forEach((card, i) => {
      if (!siteData.sermons[i]) return;
      siteData.sermons[i].meta        = card.querySelector('[data-field="meta"]')?.value        || '';
      siteData.sermons[i].title       = card.querySelector('[data-field="title"]')?.value       || '';
      siteData.sermons[i].description = card.querySelector('[data-field="description"]')?.value || '';
      siteData.sermons[i].videoUrl    = card.querySelector('[data-field="videoUrl"]')?.value    || '';
      siteData.sermons[i].audioUrl    = card.querySelector('[data-field="audioUrl"]')?.value    || '';
    });
    // Sync global
    siteData.global.logoImage   = document.getElementById('global-logo')?.value   || siteData.global.logoImage;
    siteData.global.aboutImage  = document.getElementById('global-about')?.value  || siteData.global.aboutImage;
    siteData.global.pastorImage = document.getElementById('global-pastor')?.value || siteData.global.pastorImage;
  }

  // ─── IMAGE UPLOAD ───
  async function uploadImage(file, btnEl) {
    const formData = new FormData();
    formData.append('image', file);
    if (btnEl) { btnEl.textContent = 'Uploading…'; btnEl.disabled = true; }
    try {
      const res  = await fetch(`${API_URL}/api/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${authToken}` },
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Image uploaded to Cloudinary.', 'success', 3000, 'Uploaded');
        return data.url;
      }
      throw new Error(data.error || 'Upload failed');
    } catch (err) {
      showToast(err.message, 'error', 5000, 'Upload Failed');
      return null;
    } finally {
      if (btnEl) { btnEl.textContent = 'Upload Photo'; btnEl.disabled = false; }
    }
  }

  window.uploadGlobalImage = async (event, key) => {
    const file = event.target.files[0];
    if (!file) return;
    const label = event.target.closest('.asset-actions')?.querySelector('.upload-label');
    if (label) label.textContent = 'Uploading…';
    const url = await uploadImage(file);
    if (url) {
      siteData.global[key] = url;
      const inputId  = { logoImage: 'global-logo', aboutImage: 'global-about', pastorImage: 'global-pastor' }[key];
      const previewId = { logoImage: 'preview-logo', aboutImage: 'preview-about', pastorImage: 'preview-pastor' }[key];
      if (inputId)  document.getElementById(inputId).value = url;
      if (previewId) document.getElementById(previewId).innerHTML = `<img src="${url}" alt="">`;
      markUnsaved();
    }
    if (label) {
      label.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg> Upload Image`;
    }
  };

  window.globalUrlInput = (input, key, previewId) => {
    siteData.global[key] = input.value;
    const preview = document.getElementById(previewId);
    if (preview) preview.innerHTML = input.value ? `<img src="${input.value}" alt="">` : '<span>No image set</span>';
    markUnsaved();
  };

  window.handleCardUpload = async (event, arrayName, index, fieldName = 'imageUrl') => {
    const file = event.target.files[0];
    if (!file) return;
    const btn = event.target.previousElementSibling;
    const url = await uploadImage(file, btn);
    if (url) {
      siteData[arrayName][index][fieldName] = url;
      // Update preview in card
      const card = event.target.closest('.admin-card');
      if (card) {
        const preview = card.querySelector('.card-img-preview');
        if (preview) preview.innerHTML = `<img src="${url}" alt="">`;
      }
      markUnsaved();
    }
  };

  // ─── RENDER HELPERS ───
  function imgPreview(url) {
    return url
      ? `<div class="card-img-preview"><img src="${url}" alt=""></div>`
      : `<div class="card-img-preview"><span>No image</span></div>`;
  }
  function field(label, name, value, type = 'text') {
    const tag = type === 'textarea'
      ? `<textarea data-field="${name}" oninput="markUnsaved()">${value || ''}</textarea>`
      : `<input type="${type}" data-field="${name}" value="${(value || '').replace(/"/g, '&quot;')}" oninput="markUnsaved()">`;
    return `<div class="input-group"><label>${label}</label>${tag}</div>`;
  }
  window.markUnsaved = markUnsaved;

  // ─── RENDER HERO ───
  function renderHero() {
    const grid = document.getElementById('admin-hero-grid');
    if (!grid) return;
    if (siteData.hero.length === 0) {
      grid.innerHTML = `<div class="empty-state"><div class="empty-state-icon">◈</div><p>No slides yet. Click "+ Add Slide" to create one.</p></div>`;
      return;
    }
    grid.innerHTML = siteData.hero.map((h, i) => `
      <div class="admin-card">
        <div class="card-top">
          <span class="card-label">Slide ${i + 1}</span>
          <div class="card-actions">
            <button class="btn-icon danger" onclick="deleteHero(${h.id})" title="Delete slide">✕</button>
          </div>
        </div>
        ${imgPreview(h.imageUrl)}
        <div class="card-upload-row">
          <label class="upload-chip" for="upload-hero-${i}">↑ Upload Photo</label>
          <input type="file" id="upload-hero-${i}" accept="image/*" style="display:none" onchange="handleCardUpload(event,'hero',${i})">
          ${field('Or Image URL', 'imageUrl_hero_' + i, h.imageUrl)}
        </div>
        ${field('Eyebrow Text', 'eyebrow', h.eyebrow)}
        ${field('Heading HTML', 'headingHtml', h.headingHtml)}
        ${field('Description', 'description', h.description, 'textarea')}
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          ${field('Button 1 Text', 'btn1Text', h.btn1Text)}
          ${field('Button 1 Link', 'btn1Link', h.btn1Link)}
          ${field('Button 2 Text', 'btn2Text', h.btn2Text)}
          ${field('Button 2 Link', 'btn2Link', h.btn2Link)}
        </div>
      </div>`).join('');

    // Wire up URL inputs for hero images
    siteData.hero.forEach((h, i) => {
      const urlInput = grid.querySelectorAll('[data-field="imageUrl_hero_' + i + '"]')[0];
      if (urlInput) urlInput.addEventListener('input', () => {
        siteData.hero[i].imageUrl = urlInput.value;
        const preview = urlInput.closest('.admin-card').querySelector('.card-img-preview');
        if (preview) preview.innerHTML = urlInput.value ? `<img src="${urlInput.value}" alt="">` : '<span>No image</span>';
        markUnsaved();
      });
    });
  }

  window.addHeroSlide = () => {
    syncInputsToData();
    siteData.hero.unshift({ id: Date.now(), eyebrow: 'Welcome', headingHtml: 'New Slide Title', description: '', imageUrl: '' });
    renderHero(); markUnsaved();
  };
  window.deleteHero = id => {
    if (!confirm('Delete this slide?')) return;
    siteData.hero = siteData.hero.filter(h => h.id != id);
    renderHero(); markUnsaved();
  };

  // ─── RENDER EVENTS ───
  function renderEvents() {
    const grid = document.getElementById('admin-events-grid');
    if (!grid) return;
    if (siteData.events.length === 0) {
      grid.innerHTML = `<div class="empty-state"><div class="empty-state-icon">◉</div><p>No events yet. Click "+ Add Event".</p></div>`;
      return;
    }
    grid.innerHTML = siteData.events.map((e, i) => `
      <div class="admin-card">
        <div class="card-top">
          <span class="card-label">Event ${i + 1}</span>
          <div class="card-actions">
            <button class="btn-icon danger" onclick="deleteEvent(${e.id})" title="Delete">✕</button>
          </div>
        </div>
        ${imgPreview(e.imageUrl)}
        <div class="card-upload-row">
          <label class="upload-chip" for="upload-event-${i}">↑ Upload Photo</label>
          <input type="file" id="upload-event-${i}" accept="image/*" style="display:none" onchange="handleCardUpload(event,'events',${i})">
        </div>
        ${field('Badge', 'badge', e.badge)}
        ${field('Date', 'date', e.date)}
        ${field('Title', 'title', e.title)}
        ${field('Description', 'description', e.description, 'textarea')}
        ${field('Link Text', 'linkRef', e.linkRef)}
      </div>`).join('');
  }

  window.addEvent = () => {
    syncInputsToData();
    siteData.events.unshift({ id: Date.now(), badge: 'New', date: 'TBD', title: 'New Event', description: '', imageUrl: '' });
    renderEvents(); markUnsaved();
  };
  window.deleteEvent = id => {
    if (!confirm('Delete this event?')) return;
    siteData.events = siteData.events.filter(e => e.id != id);
    renderEvents(); markUnsaved();
  };

  // ─── RENDER SERMONS ───
  function renderSermons() {
    const grid = document.getElementById('admin-sermons-grid');
    if (!grid) return;
    if (siteData.sermons.length === 0) {
      grid.innerHTML = `<div class="empty-state"><div class="empty-state-icon">◎</div><p>No sermons yet. Click "+ Add Sermon".</p></div>`;
      return;
    }
    grid.innerHTML = siteData.sermons.map((s, i) => `
      <div class="admin-card">
        <div class="card-top">
          <span class="card-label">Sermon ${i + 1}</span>
          <div class="card-actions">
            <button class="btn-icon danger" onclick="deleteSermon(${s.id})" title="Delete">✕</button>
          </div>
        </div>
        ${imgPreview(s.imageUrl)}
        <div class="card-upload-row">
          <label class="upload-chip" for="upload-sermon-${i}">↑ Upload Thumbnail</label>
          <input type="file" id="upload-sermon-${i}" accept="image/*" style="display:none" onchange="handleCardUpload(event,'sermons',${i})">
        </div>
        ${field('Meta (Date / Series)', 'meta', s.meta)}
        ${field('Title', 'title', s.title)}
        ${field('Description', 'description', s.description, 'textarea')}
        ${field('Video URL', 'videoUrl', s.videoUrl)}
        ${field('Audio URL', 'audioUrl', s.audioUrl)}
      </div>`).join('');
  }

  window.addSermon = () => {
    syncInputsToData();
    siteData.sermons.unshift({ id: Date.now(), meta: '', title: 'New Sermon', description: '', imageUrl: '' });
    renderSermons(); markUnsaved();
  };
  window.deleteSermon = id => {
    if (!confirm('Delete this sermon?')) return;
    siteData.sermons = siteData.sermons.filter(s => s.id != id);
    renderSermons(); markUnsaved();
  };

  // ─── RENDER GALLERY ───
  function renderGallery() {
    const grid = document.getElementById('admin-gallery-grid');
    if (!grid) return;
    if (siteData.gallery.length === 0) {
      grid.innerHTML = `<div class="empty-state"><div class="empty-state-icon">◫</div><p>No gallery photos. Click "+ Add Photo".</p></div>`;
      return;
    }
    grid.innerHTML = siteData.gallery.map((g, i) => `
      <div class="admin-card">
        <div class="card-top">
          <span class="card-label">Photo ${i + 1}</span>
          <div class="card-actions">
            <button class="btn-icon danger" onclick="deleteGalleryImage(${g.id})" title="Delete">✕</button>
          </div>
        </div>
        ${imgPreview(g.imageUrl)}
        <div class="card-upload-row">
          <label class="upload-chip" for="upload-gallery-${i}">↑ Upload Photo</label>
          <input type="file" id="upload-gallery-${i}" accept="image/*" style="display:none" onchange="handleCardUpload(event,'gallery',${i})">
        </div>
      </div>`).join('');
  }

  window.addGalleryImage = () => {
    syncInputsToData();
    siteData.gallery.unshift({ id: Date.now(), imageUrl: '' });
    renderGallery(); markUnsaved();
  };
  window.deleteGalleryImage = id => {
    if (!confirm('Remove this photo?')) return;
    siteData.gallery = siteData.gallery.filter(g => g.id != id);
    renderGallery(); markUnsaved();
  };

  // ─── USERS ───
  async function fetchUsers() {
    try {
      const res = await fetch(`${API_URL}/api/users`, { headers: { 'Authorization': `Bearer ${authToken}` } });
      if (res.ok) renderUsers(await res.json());
      else showToast('Could not load users.', 'error');
    } catch { showToast('Failed to load users.', 'error'); }
  }

  function renderUsers(users) {
    const tbody = document.getElementById('users-table-body');
    if (!tbody) return;
    if (users.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;padding:32px;color:var(--muted)">No users found</td></tr>`;
      return;
    }
    tbody.innerHTML = users.map(u => {
      const isYou = u.id === currentUserId || u.email === localStorage.getItem('adminEmail');
      return `<tr>
        <td>
          <span class="user-email">${u.email}</span>
          ${isYou ? '<span class="user-you">(you)</span>' : ''}
        </td>
        <td><span class="role-badge ${u.role}">${u.role}</span></td>
        <td><span class="status-badge">Active</span></td>
        <td style="text-align:right;">
          ${isYou 
            ? `<button class="revoke-btn" disabled style="opacity:0.3; cursor:not-allowed;" title="You cannot revoke your own access">Revoke Access</button>`
            : `<button class="revoke-btn" onclick="revokeUser('${u.id}','${u.email}')">Revoke Access</button>`}
        </td>
      </tr>`;
    }).join('');
  }

  window.toggleNewUserForm = () => {
    const form = document.getElementById('new-user-form');
    if (!form) return;
    const isVisible = form.style.display !== 'none';
    form.style.display = isVisible ? 'none' : 'block';
    if (!isVisible) document.getElementById('new-user-email')?.focus();
  };

  window.createUser = async () => {
    const email    = document.getElementById('new-user-email').value.trim();
    const password = document.getElementById('new-user-password').value;
    const role     = document.getElementById('new-user-role').value;
    if (!email || !password) { showToast('Email and password are required.', 'warning'); return; }

    try {
      const res  = await fetch(`${API_URL}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
        body: JSON.stringify({ email, password, role })
      });
      const data = await res.json();
      if (res.ok) {
        showToast(`${email} can now access the dashboard.`, 'success', 4000, 'User Created');
        document.getElementById('new-user-email').value    = '';
        document.getElementById('new-user-password').value = '';
        document.getElementById('new-user-form').style.display = 'none';
        fetchUsers();
      } else {
        showToast(data.error || 'Failed to create user.', 'error');
      }
    } catch { showToast('Server error. Try again.', 'error'); }
  };

  window.revokeUser = async (id, email) => {
    if (!confirm(`Revoke access for ${email}? They will be immediately signed out.`)) return;
    try {
      const res = await fetch(`${API_URL}/api/users/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if (res.ok) {
        showToast(`${email} has been removed and will be signed out immediately.`, 'info', 5000, 'Access Revoked');
        fetchUsers();
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to revoke.', 'error');
      }
    } catch { showToast('Server error.', 'error'); }
  };

  // ─── INIT ───
  async function init() {
    if (!authToken) return;
    loginOverlay.style.display = 'none';
    dashboard.style.display    = 'flex';
    if (mobBar) mobBar.style.display = 'flex';
    if (adminRole === 'superadmin') {
      document.getElementById('nav-users')?.style.removeProperty('display');
    }
    await fetchData();
    if (adminRole === 'superadmin') fetchUsers();
    startTokenHeartbeat();
  }

  // Boot
  if (authToken) {
    init();
  } else {
    if (mobBar) mobBar.style.display = 'none';
  }

})();
