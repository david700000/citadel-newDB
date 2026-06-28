(function() {
  // ─── CONFIGURATION ───
  const API_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:3000' 
    : 'https://citadel-newdb.onrender.com'; 

  // ─── PRELOADER ───
  const preloader = document.getElementById('preloader');
  const hidePreloader = () => {
    if (preloader) {
      preloader.classList.add('hidden');
      setTimeout(() => { preloader.style.display = 'none'; }, 650);
    }
  };
  const preloaderStart = Date.now();

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

  async function loadEventData() {
    try {
      const response = await fetch(`${API_URL}/api/data`);
      if (!response.ok) throw new Error('Data fetch failed');
      const data = await response.json();

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
        let imageMarkup = '';
        if (event.imageUrl) {
          imageMarkup = `<img src="${event.imageUrl}" alt="${event.title}">`;
        }
        
        eventInfoContainer.innerHTML = `
          ${imageMarkup}
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
      const delay = Math.max(0, 800 - elapsed);
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
      const fname = document.getElementById('reg-fname').value;
      const lname = document.getElementById('reg-lname').value;
      const email = document.getElementById('reg-email').value;
      const phone = document.getElementById('reg-phone').value;
      const title = document.getElementById('reg-event-title').value;

      submitBtn.textContent = 'Registering...';
      submitBtn.disabled = true;

      try {
        const res = await fetch(`${API_URL}/api/register-event`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: `${fname} ${lname}`, email, phone, eventTitle: title })
        });
        const data = await res.json();
        
        if (data.success) {
          submitBtn.textContent = '✓ Registered!';
          submitBtn.style.background = '#22c55e';
          alert(data.message || 'Successfully registered for the event!');
          registerForm.reset();
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
