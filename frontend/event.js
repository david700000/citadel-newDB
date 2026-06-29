(function() {
  // ─── CONFIGURATION ───
  const API_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:3000' 
    : 'https://citadel-newdb.onrender.com'; 

  // ─── WARM-UP PING (Render free tier cold-start) ───
  fetch(`${API_URL}/health`, { method: 'GET', cache: 'no-store' }).catch(() => {});

  // ─── PRELOADER ───
  const preloader = document.getElementById('preloader');
  const hidePreloader = () => {
    if (preloader) {
      preloader.classList.add('hidden');
      setTimeout(() => { preloader.style.display = 'none'; }, 650);
    }
  };

  // ─── BURGER MENU ───
  const burger = document.getElementById('burger');
  const mobileNav = document.getElementById('mobileNav');
  if(burger) {
    burger.addEventListener('click', () => {
        mobileNav.classList.toggle('open');
    });
  }

  // ─── GET URL PARAMS ───
  const urlParams = new URLSearchParams(window.location.search);
  const eventTitle = urlParams.get('title');

  // ─── DYNAMIC FIELD RENDERER ───
  const slugify = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
  const toEventSlug = title => `event_${slugify(title)}`;
  function renderDynamicFields(fields) {
    const container = document.getElementById('reg-dynamic-fields');
    if (!container) return;
    container.innerHTML = '';

    const active = (fields || []).filter(f => f.active !== false);
    active.forEach(f => {
      const wrapper = document.createElement('div');
      wrapper.className = 'form-field';

      const label = document.createElement('label');
      label.setAttribute('for', `dyn-${f.field_key}`);
      label.textContent = f.label + (f.required ? ' *' : '');
      wrapper.appendChild(label);

      let input;
      if (f.type === 'dropdown' && Array.isArray(f.options) && f.options.length > 0) {
        input = document.createElement('select');
        input.id = `dyn-${f.field_key}`;
        input.name = f.field_key;
        if (f.required) input.required = true;
        const placeholder = document.createElement('option');
        placeholder.value = '';
        placeholder.textContent = `Select ${f.label}`;
        input.appendChild(placeholder);
        f.options.forEach(opt => {
          const o = document.createElement('option');
          o.value = opt;
          o.textContent = opt;
          input.appendChild(o);
        });
        // Match existing select styling
        input.style.cssText = 'width:100%;padding:12px 16px;border:1.5px solid #e2e8f0;border-radius:10px;font-size:14px;color:#1e293b;background:#f8fafc;outline:none;box-sizing:border-box;font-family:inherit;';
      } else if (f.type === 'date') {
        input = document.createElement('input');
        input.type = 'date';
        input.id = `dyn-${f.field_key}`;
        input.name = f.field_key;
        if (f.required) input.required = true;
      } else if (f.type === 'number') {
        input = document.createElement('input');
        input.type = 'number';
        input.id = `dyn-${f.field_key}`;
        input.name = f.field_key;
        input.placeholder = f.label;
        if (f.required) input.required = true;
      } else {
        input = document.createElement('input');
        input.type = 'text';
        input.id = `dyn-${f.field_key}`;
        input.name = f.field_key;
        input.placeholder = f.label;
        if (f.required) input.required = true;
      }

      wrapper.appendChild(input);
      container.appendChild(wrapper);
    });
  }

  // ─── LOAD EVENT DATA + CUSTOM FORM FIELDS ───
  async function loadEventData() {
    try {
      // Derive per-event form_type slug from URL param (same logic as CMS)
      const eventFormType = eventTitle ? toEventSlug(eventTitle) : null;
      const fetchCalls = [fetch(`${API_URL}/api/data`)];
      if (eventFormType) {
        fetchCalls.push(fetch(`${API_URL}/api/form-fields?form_type=${encodeURIComponent(eventFormType)}`));
      }
      const [dataRes, fieldsRes] = await Promise.all(fetchCalls);

      if (!dataRes.ok) throw new Error('Data fetch failed');
      const data = await dataRes.json();

      // Render custom registration fields
      if (fieldsRes.ok) {
        const fieldsData = await fieldsRes.json();
        const fields = Array.isArray(fieldsData) ? fieldsData : (fieldsData.fields || []);
        renderDynamicFields(fields);
      }

      if (data.global && data.global.logoImage) {
        const headerLogo = document.getElementById('header-logo');
        if (headerLogo) headerLogo.innerHTML = `<img src="${data.global.logoImage}" style="width:100%;height:100%;object-fit:contain;" alt="Logo">`;
        const footerLogo = document.getElementById('footer-logo');
        if (footerLogo) footerLogo.innerHTML = `<img src="${data.global.logoImage}" style="width:100%;height:100%;object-fit:contain;" alt="Logo">`;
      }

      const eventInfoContainer = document.getElementById('event-info-container');
      const regEventTitleInput = document.getElementById('reg-event-title');

      if (!eventTitle) {
        eventInfoContainer.innerHTML = '<h2>Event not found</h2><p>Please return to the home page and select a valid event.</p>';
        hidePreloader();
        return;
      }

      const event = data.events ? data.events.find(e => e.title === eventTitle) : null;

      if (!event) {
        eventInfoContainer.innerHTML = '<h2>Event not found</h2><p>The event you are looking for does not exist or has been removed.</p>';
      } else {
        // Populate the hidden input for form submission
        if (regEventTitleInput) regEventTitleInput.value = event.title;

        // Render event details
        let bannerMarkup = '';
        if (event.bannerImage) {
          bannerMarkup = `<img src="${event.bannerImage}" alt="Event Banner" style="width: 100%; max-height: 280px; object-fit: cover; border-radius: 12px; margin-bottom: 20px;">`;
        } else if (event.imageUrl) {
          bannerMarkup = `<img src="${event.imageUrl}" alt="${event.title}" style="width: 100%; max-height: 280px; object-fit: cover; border-radius: 12px; margin-bottom: 20px;">`;
        }

        let logoMarkup = '';
        if (event.logoImage) {
          logoMarkup = `<img src="${event.logoImage}" alt="Event Logo" style="height: 50px; object-fit: contain; margin-bottom: 12px; display: block;">`;
        }
        
        eventInfoContainer.innerHTML = `
          ${bannerMarkup}
          ${logoMarkup}
          <h2>${event.title}</h2>
          <div class="event-meta">
            <svg viewBox="0 0 24 24" style="width:20px;fill:currentColor;"><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/></svg>
            ${event.date}
          </div>
          <p>${event.description}</p>
        `;
      }

      // Hide preloader
      const elapsed = Date.now() - preloaderStart;
      const delay = Math.max(0, MIN_PRELOADER_MS - elapsed);
      setTimeout(hidePreloader, delay);

    } catch (err) {
      console.error(err);
      hidePreloader();
    }
  }

  // ─── FORM SUBMISSION ───
  const registerForm = document.getElementById('event-register-form');
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const submitBtn = document.getElementById('reg-submit-btn');
      const fname = document.getElementById('reg-fname').value.trim();
      const lname = document.getElementById('reg-lname').value.trim();
      const email = document.getElementById('reg-email').value.trim();
      const phone = document.getElementById('reg-phone').value.trim();
      const title = document.getElementById('reg-event-title').value;

      // Collect dynamic custom field values
      const customFields = {};
      const dynContainer = document.getElementById('reg-dynamic-fields');
      if (dynContainer) {
        dynContainer.querySelectorAll('input, select, textarea').forEach(el => {
          if (el.name) customFields[el.name] = el.value;
        });
      }

      submitBtn.textContent = 'Registering...';
      submitBtn.disabled = true;

      try {
        const res = await fetch(`${API_URL}/api/register-event`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: `${fname} ${lname}`, email, phone, eventTitle: title, customFields })
        });
        const data = await res.json();
        
        if (data.success) {
          submitBtn.textContent = '✓ Registered!';
          submitBtn.style.background = '#22c55e';
          alert(data.message || 'Successfully registered for the event!');
          registerForm.reset();
          // Re-render dynamic fields after reset to clear dropdowns properly
          setTimeout(loadEventData, 100);
        } else {
          throw new Error(data.error || 'Failed to register');
        }
      } catch (err) {
        console.error(err);
        alert('Error registering for event. Please try again.');
        submitBtn.textContent = 'Complete Registration';
        submitBtn.disabled = false;
      }
    });
  }

  window.addEventListener('DOMContentLoaded', loadEventData);
})();
