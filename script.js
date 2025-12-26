// Wrap heading text into span elements to create per-letter animation
function wrapLetters(selector) {
  document.querySelectorAll(selector).forEach(el => {
    if (el.dataset.wrapped === "true") return;

    const text = el.textContent.trim();
    const fragment = document.createDocumentFragment();

    for (const char of text) {
      const span = document.createElement("span");
      span.textContent = char;
      span.classList.add("fancy-letter");
      fragment.appendChild(span);
    }

    el.textContent = "";
    el.appendChild(fragment);
    el.dataset.wrapped = "true";
  });
}

// Apply on page load
document.addEventListener("DOMContentLoaded", () => {
  wrapLetters(".header-text h1");
  wrapLetters(".about h2");
});

/*
  Google Sheets / Apps Script endpoints
  - Deploy a Google Apps Script Web App that accepts POST requests and appends rows to your sheet.
  - After you deploy the Apps Script, paste the deployed URL below into the matching variable.
*/
const SHEETS_ENDPOINT_COMBO4 = ''; // e.g. 'https://script.google.com/macros/s/AKfycbx.../exec'
const SHEETS_ENDPOINT_COMBO1 = ''; // paste your deployed Apps Script URL that writes to the provided spreadsheet
const SHEETS_ENDPOINT_COMBO2 = ''; // paste your deployed Apps Script URL for combo2 (optional)

/* Reveal + parallax for background logo
   - increases opacity and applies a subtle translateY and scale based on scroll
   - optimized with requestAnimationFrame and passive listeners
   - disabled on small screens and respects reduced-motion
*/
function initBgLogo(){
  const el = document.getElementById('bgLogo');
  if(!el) return;

  // respect reduced motion
  if(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches){
    el.style.opacity = '0.12';
    return;
  }

  const minWidth = 700;
  let ticking = false;

  function update(){
    const scrollY = window.scrollY || window.pageYOffset;
    // control how quickly opacity ramps up and translate scales
    const opacityFactor = Math.min(1, scrollY / 600); // 0..1 over 600px
    const opacity = 0.06 + 0.5 * opacityFactor; // from 0.06 to ~0.56
    const translateY = Math.round(scrollY * 0.12); // subtle vertical parallax
    const scale = 1 + (0.06 * opacityFactor); // small scale up to ~1.06

    el.style.opacity = String(opacity);
    el.style.transform = `translateX(-50%) translateY(${translateY}px) scale(${scale})`;
    ticking = false;
  }

  function onScroll(){
    if(window.innerWidth < minWidth){
      el.style.opacity = '';
      el.style.transform = '';
      return;
    }
    if(!ticking){
      window.requestAnimationFrame(update);
      ticking = true;
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  // initial
  onScroll();
  return {
    destroy(){ window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); }
  };
}

document.addEventListener('DOMContentLoaded', ()=> initBgLogo());

/* Simple photo slider: autoplay + manual controls + dots */
function initSlider(id, options = {}){
  const root = document.getElementById(id);
  if(!root) return;

  const slidesWrap = root.querySelector('.slides');
  const slides = Array.from(root.querySelectorAll('.slide'));
  const prevBtn = root.querySelector('.prev');
  const nextBtn = root.querySelector('.next');
  const dotsWrap = root.querySelector('.dots');
  const interval = options.interval || 3500;
  let current = 0;
  let timer = null;

  // create dots
  slides.forEach((s, i) => {
    const d = document.createElement('button');
    d.className = 'dot';
    d.type = 'button';
    d.addEventListener('click', () => { goTo(i); });
    dotsWrap.appendChild(d);
  });

  const dots = Array.from(dotsWrap.children);

  function update(){
    const x = -current * 100;
    slidesWrap.style.transform = `translateX(${x}%)`;
    dots.forEach((d, i) => d.classList.toggle('active', i === current));
  }

  function goTo(i){
    current = (i + slides.length) % slides.length;
    update();
    resetTimer();
  }

  function next(){ goTo(current + 1); }
  function prev(){ goTo(current - 1); }

  function resetTimer(){
    if(timer) clearInterval(timer);
    timer = setInterval(next, interval);
  }

  if(nextBtn) nextBtn.addEventListener('click', next);
  if(prevBtn) prevBtn.addEventListener('click', prev);

  root.addEventListener('mouseenter', () => { if(timer) clearInterval(timer); });
  root.addEventListener('mouseleave', () => resetTimer());

  // init
  update();
  resetTimer();
  // reveal page content below the slider with a smooth slide-up transition
  if (typeof revealContent === 'function') {
    // small delay so slider paints first
    setTimeout(() => revealContent(), 420);
  }
}

// revealContent will add .visible to key sections so they slide up into view
function revealContent(){
  try{
    const about = document.querySelector('.about');
    const events = document.querySelector('.events');
    const techs = document.querySelectorAll('.tech, .nontech');
    if(about) about.classList.add('visible');
    if(events) events.classList.add('visible');
    techs.forEach(t => t.classList.add('visible'));
  }catch(e){/* silent */}
}

// --- Accessibility, keyboard, swipe and back-to-top behavior ---
function enhanceSliderAccessibility(rootId){
  const root = document.getElementById(rootId);
  if(!root) return;
  const slides = Array.from(root.querySelectorAll('.slide'));
  const prev = root.querySelector('.prev');
  const next = root.querySelector('.next');
  const dots = Array.from(root.querySelectorAll('.dot'));

  // keyboard navigation: left / right arrows
  window.addEventListener('keydown', (e)=>{
    if(['INPUT','TEXTAREA'].includes(document.activeElement.tagName)) return;
    if(e.key === 'ArrowLeft') prev && prev.click();
    if(e.key === 'ArrowRight') next && next.click();
  });

  // enable focusing dots & buttons for keyboard users
  [prev, next, ...dots].forEach(el => {
    if(!el) return;
    el.setAttribute('tabindex', '0');
  });

  // touch swipe support
  let startX = 0;
  let startY = 0;
  let tracking = false;

  root.addEventListener('touchstart', e => {
    const t = e.touches[0];
    startX = t.clientX; startY = t.clientY; tracking = true;
  }, { passive: true });

  root.addEventListener('touchmove', e => {
    // noop: allow scroll to be handled by browser
  }, { passive: true });

  root.addEventListener('touchend', e => {
    if(!tracking) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - startX;
    const dy = t.clientY - startY;
    // require mostly horizontal move and reasonable distance
    if(Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)){
      if(dx < 0) next && next.click(); else prev && prev.click();
    }
    tracking = false;
  });

  // show caption of active slide for screen readers / eyes
  function refreshCaptions(){
    slides.forEach(s => s.classList.remove('active'));
    const activeIndex = Array.from(root.querySelectorAll('.slides > .slide')).findIndex(s => {
      return s.style.transform === '' || s.style.transform === undefined ? false : true;
    });
    // simpler: use visible translateX to figure out index via computed transform
    const slidesWrap = root.querySelector('.slides');
    const transform = window.getComputedStyle(slidesWrap).transform;
    let idx = 0;
    if(transform && transform !== 'none'){
      const match = transform.match(/matrix\(([^,]+),/);
      // best-effort: compute ratio using translateX from matrix or fallback to 0
    }
    // fallback: find dot.active
    const dotActive = root.querySelector('.dot.active');
    if(dotActive){ idx = Array.from(root.querySelectorAll('.dot')).indexOf(dotActive); }
    if(idx < 0) idx = 0;
    const cur = root.querySelectorAll('.slide')[idx];
    if(cur) cur.classList.add('active');
  }

  // call periodically to sync caption visibility after slider update
  setInterval(refreshCaptions, 300);
}

// initialize slider accessibility + interactions after DOM ready
document.addEventListener('DOMContentLoaded', ()=>{
  enhanceSliderAccessibility('photo-slider');

  // back-to-top button behavior
  const back = document.getElementById('backToTop');
  if(back){
    const showAt = 240;
    window.addEventListener('scroll', () => {
      if(window.scrollY > showAt) back.classList.add('visible');
      else back.classList.remove('visible');
    }, { passive: true });

    back.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
});

// init 3D header interactivity (mousemove tilt + click pulse)
function initHeader3D(){
  const header = document.querySelector('.header-text');
  const title = header && header.querySelector('h1');
  if(!header || !title) return;

  // respect user's reduced motion preference
  if(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  let raf = null;
  let mouseX = 0, mouseY = 0;

  function onMove(e){
    const rect = header.getBoundingClientRect();
    const cx = rect.left + rect.width/2;
    const cy = rect.top + rect.height/2;
    const clientX = (e.touches ? e.touches[0].clientX : e.clientX);
    const clientY = (e.touches ? e.touches[0].clientY : e.clientY);
    // normalized -1..1
    mouseX = (clientX - cx) / (rect.width/2);
    mouseY = (clientY - cy) / (rect.height/2);

    if(raf) cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      const maxTilt = 10; // degrees
      const rotY = Math.max(-maxTilt, Math.min(maxTilt, mouseX * maxTilt));
      const rotX = Math.max(-maxTilt, Math.min(maxTilt, -mouseY * maxTilt));
      title.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg) translateZ(6px)`;

  // neon glow change to match movement: yellow rim + red outer glow
  const shadowX = Math.round(rotY * -1.6);
  const shadowY = Math.round(rotX * 1.3);
  // intensity based on pointer distance (0.8 - 1.8)
  const intensity = Math.min(1.8, 0.9 + (Math.abs(mouseX) + Math.abs(mouseY)) * 0.9);
  const yellowRim = `0 0 ${6 * intensity}px rgba(255,218,24,${0.9 * intensity})`;
  const redGlow = `0 0 ${18 * intensity}px rgba(255,40,40,${0.9 * intensity})`;
  const redSoft = `0 ${12 * intensity}px ${32 * intensity}px rgba(255,0,0,${0.32 * intensity})`;
  title.style.textShadow = `${yellowRim}, ${redGlow}, ${redSoft}`;
  title.style.filter = `drop-shadow(${shadowX}px ${shadowY}px ${8 * intensity}px rgba(255,40,40,${0.22 * intensity}))`;
    });
  }

  function onLeave(){
    if(raf) cancelAnimationFrame(raf);
    title.style.transform = '';
    title.style.textShadow = '';
  }

  header.addEventListener('mousemove', onMove);
  header.addEventListener('touchmove', onMove, { passive: true });
  header.addEventListener('mouseleave', onLeave);
  header.addEventListener('touchend', onLeave);

  // click/tap pulse
  title.addEventListener('click', ()=>{
    title.animate([
      { transform: title.style.transform || 'none', opacity: 1 },
      { transform: (title.style.transform || 'none') + ' scale(1.06)', opacity: 0.98 },
      { transform: title.style.transform || 'none', opacity: 1 }
    ], { duration: 420, easing: 'cubic-bezier(.2,.9,.2,1)' });
  });
}

document.addEventListener('DOMContentLoaded', ()=>{
  initHeader3D();
});

document.addEventListener('DOMContentLoaded', () => {
  initSlider('photo-slider', { interval: 4000 });
});

/* Parallax: subtle, performant slider translation on scroll
   - small movement amount controlled by speed (0.0 - 0.5)
   - disabled on narrow screens to avoid layout issues
*/
function initParallax(options = {}){
  const slider = document.getElementById('photo-slider');
  if(!slider) return;
  const speed = typeof options.speed === 'number' ? options.speed : 0.18;
  const minWidth = options.minWidth || 700; // disable on small screens

  let ticking = false;

  function update(){
    const rect = slider.getBoundingClientRect();
    const windowH = window.innerHeight;
    // distance from slider center to viewport center
    const sliderCenter = rect.top + rect.height / 2;
    const viewportCenter = windowH / 2;
    const distance = viewportCenter - sliderCenter;
    // smaller multiplier for subtle effect
    const translateY = distance * speed;
    slider.style.transform = `translate3d(0, ${translateY}px, 0)`;
    ticking = false;
  }

  function onScroll(){
    // disable when viewport narrower than minWidth
    if(window.innerWidth < minWidth){
      slider.style.transform = '';
      return;
    }

    if(!ticking){
      window.requestAnimationFrame(update);
      ticking = true;
    }
  }

  // Use passive listener for scroll performance
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);

  // initial position
  onScroll();
  return {
    destroy(){
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      slider.style.transform = '';
    }
  };
}

document.addEventListener('DOMContentLoaded', () => {
  // initialize parallax with a subtle speed; skip on small screens
  initParallax({ speed: 0.16, minWidth: 700 });
});

/* Animated translucent background photos using Pictures_Bg
   - subtle, slow floating motions implemented via requestAnimationFrame
   - respects prefers-reduced-motion and hides on small screens (CSS)
*/
function initBgPhotos(){
  const container = document.getElementById('bgPhotos');
  if(!container) return;

  // respect reduced motion and small screens
  if(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if(window.innerWidth < 900) return;

  const imgs = Array.from(container.querySelectorAll('.bg-photo'));
  if(!imgs.length) return;

  // prepare per-image motion params
  const params = imgs.map((el, i) => ({
    el,
    ampX: 8 + i * 6 + Math.random() * 8, // px
    ampY: 6 + i * 5 + Math.random() * 6, // px
    speed: 0.00035 + Math.random() * 0.00065, // radians per ms
    phase: Math.random() * Math.PI * 2,
    rotAmp: (2 + Math.random() * 6) // degrees
  }));

  let start = performance.now();
  let rafId = null;

  function tick(now){
    const t = now - start;
    params.forEach(p => {
      const x = Math.sin(t * p.speed + p.phase) * p.ampX;
      const y = Math.cos(t * (p.speed * 1.05) + p.phase) * p.ampY;
      const r = Math.sin(t * (p.speed * 0.9) + p.phase) * p.rotAmp;
      // tiny opacity breathing for life
      const baseOp = parseFloat(getComputedStyle(p.el).getPropertyValue('opacity')) || 0.06;
      const op = Math.max(0.02, Math.min(0.18, baseOp + Math.sin(t * p.speed * 1.2 + p.phase) * 0.02));
      p.el.style.transform = `translate(${x}px, ${y}px) rotate(${r}deg)`;
      p.el.style.opacity = String(op);
    });
    rafId = requestAnimationFrame(tick);
  }

  rafId = requestAnimationFrame(tick);

  // stop animations if window resized to small screens
  function onResize(){
    if(window.innerWidth < 900){ if(rafId) cancelAnimationFrame(rafId); imgs.forEach(i => { i.style.transform = ''; }); }
  }
  window.addEventListener('resize', onResize);

  return {
    destroy(){ if(rafId) cancelAnimationFrame(rafId); window.removeEventListener('resize', onResize); }
  };
}

document.addEventListener('DOMContentLoaded', ()=> initBgPhotos());

/* TechPage interactions: filters, modal register, details toggle, reveal on scroll */
function initTechPageInteractions(){
  const filterBtns = document.querySelectorAll('.filter-btn');
  const cards = Array.from(document.querySelectorAll('.event-card'));

  // filter behavior
  filterBtns.forEach(btn => btn.addEventListener('click', ()=>{
    const filter = btn.dataset.filter;
    filterBtns.forEach(b => { b.classList.toggle('active', b===btn); b.setAttribute('aria-pressed', String(b===btn)); });
    cards.forEach(c => {
      if(filter === 'all'){ c.style.display = ''; }
      else if(filter === 'tech'){ c.style.display = c.classList.contains('tech') ? '' : 'none'; }
      else if(filter === 'nontech'){ c.style.display = c.classList.contains('nontech') ? '' : 'none'; }
    });
    // center selected column for visual focus
    try{
      const colsWrap = document.querySelector('.events-columns');
      const techCol = document.querySelector('.tech-col');
      const nontechCol = document.querySelector('.nontech-col');
      if(!colsWrap) return;
      // on small screens avoid transform
      if(window.innerWidth < 900){ colsWrap.style.transform = ''; return; }
      if(filter === 'all'){
          colsWrap.style.transform = '';
          // reset 3D classes
          document.querySelectorAll('.section-col').forEach(sc => { sc.classList.remove('focused','behind'); });
      }else if(filter === 'tech' && techCol){
          centerColumnIntoView(colsWrap, techCol);
          // apply focused/behind styling
          document.querySelectorAll('.section-col').forEach(sc => sc.classList.remove('focused','behind'));
          techCol.classList.add('focused');
          if(nontechCol) nontechCol.classList.add('behind');
      }else if(filter === 'nontech' && nontechCol){
          centerColumnIntoView(colsWrap, nontechCol);
          // apply focused/behind styling
          document.querySelectorAll('.section-col').forEach(sc => sc.classList.remove('focused','behind'));
          nontechCol.classList.add('focused');
          if(techCol) techCol.classList.add('behind');
      }
    }catch(e){/* ignore */}
  }));

  // move a column element to the visual center of its container by translating the columns wrapper
  function centerColumnIntoView(wrapper, column){
    // Center the column relative to the viewport center (not a parent container)
    const colRect = column.getBoundingClientRect();
    const wrapperRect = wrapper.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportCenter = viewportWidth / 2;
    const colCenter = colRect.left + colRect.width / 2;
    let delta = Math.round(viewportCenter - colCenter);

    // Clamp translation so the wrapper doesn't move out of the viewport bounds.
    // After applying delta, wrapper's left = wrapperRect.left + delta, right = wrapperRect.right + delta
    // Compute min and max allowed delta to keep some padding from edges
    const edgePadding = 20; // px
    const minDelta = Math.min(0, viewportWidth - wrapperRect.right - edgePadding); // push left at most
    const maxDelta = Math.max(0, -wrapperRect.left + edgePadding); // push right at most
    if(delta < minDelta) delta = minDelta;
    if(delta > maxDelta) delta = maxDelta;

    wrapper.style.transform = `translateX(${delta}px)`;
  }

  // details toggle
  document.addEventListener('click', (e)=>{
    const btn = e.target.closest('.more-btn');
    if(!btn) return;
    const card = btn.closest('.event-card');
    const expanded = card.classList.toggle('expanded');
    btn.setAttribute('aria-expanded', String(expanded));
    card.classList.toggle('reveal', true); // ensure visible when expanded
  });



  // modal close and submit
  modal.addEventListener('click', (e)=>{
    if(e.target === modal || e.target.classList.contains('close-btn')){
      modal.classList.remove('active');
    }
  });
  window.addEventListener('keydown', (e)=>{ if(e.key === 'Escape') modal.classList.remove('active'); });

  // fake submission (placeholder) — in real app, post to server
  const submit = modal.querySelector('#submitReg');
  submit.addEventListener('click', ()=>{
    const form = modal.querySelector('#registerForm');
    const formData = new FormData(form);
    // Minimal validation already via required attributes
    // Show a quick thank-you state
    submit.textContent = 'Sending…';
    setTimeout(()=>{
      submit.textContent = 'Submitted ✓';
      setTimeout(()=>{ modal.classList.remove('active'); submit.textContent = 'Submit'; form.reset(); }, 900);
    }, 900);
  });

  // IntersectionObserver reveal
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(en => {
      if(en.isIntersecting){ en.target.classList.add('reveal'); io.unobserve(en.target); }
    });
  }, { threshold: 0.12 });
  cards.forEach(c => io.observe(c));

  // recompute centering on resize so selected column stays centered
  window.addEventListener('resize', () => {
    const active = document.querySelector('.filter-btn.active');
    const colsWrap = document.querySelector('.events-columns');
    const techCol = document.querySelector('.tech-col');
    const nontechCol = document.querySelector('.nontech-col');
    if(!colsWrap) return;
    if(window.innerWidth < 900){ colsWrap.style.transform = ''; return; }
    if(active && active.dataset.filter === 'tech' && techCol) centerColumnIntoView(colsWrap, techCol);
    else if(active && active.dataset.filter === 'nontech' && nontechCol) centerColumnIntoView(colsWrap, nontechCol);
    else colsWrap.style.transform = '';
  });
}

document.addEventListener('DOMContentLoaded', ()=> initTechPageInteractions());

/* Chatbot widget: lightweight local assistant with canned replies */
function initChatbot(){
  const widget = document.getElementById('chatbotWidget');
  if(!widget) return;
  const toggle = widget.querySelector('.chat-toggle');
  const panel = widget.querySelector('.chat-panel');
  const close = widget.querySelector('.chat-close');
  const body = widget.querySelector('.chat-body');
  const form = widget.querySelector('.chat-form');
  const input = widget.querySelector('.chat-input');
  const send = widget.querySelector('.chat-send');
  const quick = widget.querySelectorAll('.quick-btn');
  const askLabel = widget.querySelector('.ask-label');

  // simple persistence
  const STORAGE_KEY = 'mxcel_chat_history_v1';
  function loadHistory(){
    try{ const raw = localStorage.getItem(STORAGE_KEY); if(!raw) return []; return JSON.parse(raw); }catch(e){ return []; }
  }
  function saveHistory(arr){ try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(arr)); }catch(e){} }

  let history = loadHistory();

  function renderHistory(){ body.innerHTML = ''; history.forEach(m => appendMessage(m.type, m.text, false)); body.scrollTop = body.scrollHeight; }

  function appendMessage(type, text, save = true){
    const el = document.createElement('div'); el.className = 'msg ' + (type === 'user' ? 'user' : 'bot');
    el.innerHTML = `<div class="text">${escapeHtml(text)}</div><span class="time">${new Date().toLocaleTimeString()}</span>`;
    body.appendChild(el);
    body.scrollTop = body.scrollHeight;
    if(save){ history.push({ type, text, ts: Date.now() }); saveHistory(history); }
  }

  function escapeHtml(s){ return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

  // canned reply generator
  function botReplyFor(text){
    const t = String(text||'').toLowerCase();
    if(/event|events|club|workshop|competition/.test(t)) return 'We have technical workshops, paper presentations and cultural events — which category interests you?';
    if(/contact|phone|email|address/.test(t)) return 'Reach us at admin@kongu.edu or call +91-XXXXXXXXXX. You can also visit the Contact section on the website.';
  if(/about|who|what/.test(t)) return 'MXCEL-2K26 is a national symposium organised by the Mechanical Engineering dept. We host technical and non-technical events across two days.';
    if(/website|site|link/.test(t)) return 'All event details and registration links are available on the site. Use the Register buttons on the Events page.';
    if(/hello|hi|hey/.test(t)) return 'Hello! I am the event assistant — ask me about events, registration, or schedules.';
    return "I'm here to help — try 'Club Events', 'Contact Details' or 'About Club'.";
  }

  // open/close
  toggle.addEventListener('click', ()=>{ widget.classList.toggle('open'); if(widget.classList.contains('open')){ input.focus(); } });
  if(askLabel){ askLabel.addEventListener('click', ()=>{ widget.classList.add('open'); input.focus(); }); }
  close.addEventListener('click', ()=>{ widget.classList.remove('open'); });

  // quick buttons
  quick.forEach(b => b.addEventListener('click', ()=>{
    const q = b.textContent.trim(); appendMessage('user', q); setTimeout(()=>{ appendMessage('bot', botReplyFor(q)); }, 700);
  }));

  // send handler
  form.addEventListener('submit', (e)=>{ e.preventDefault(); const v = input.value.trim(); if(!v) return; appendMessage('user', v); input.value = ''; setTimeout(()=>{ appendMessage('bot', botReplyFor(v)); }, 700); });

  // render stored history
  renderHistory();
}

document.addEventListener('DOMContentLoaded', ()=> initChatbot());

/* Combo4 registration form handling: local submission + storage and simple validation */
function initComboReg(){
  const form = document.getElementById('combo4Form');
  if(!form) return;

  const googleFormUrl = 'https://forms.gle/REPLACE_WITH_YOUR_FORM'; // update if you have a real form
  const whatsappUrl = 'https://chat.whatsapp.com/REPLACE_WITH_GROUP_LINK';

  document.getElementById('openGoogleForm').addEventListener('click', ()=>{ window.open(googleFormUrl, '_blank'); });
  document.getElementById('openWhatsApp').addEventListener('click', ()=>{ window.open(whatsappUrl, '_blank'); });

  form.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const msg = document.getElementById('formMessage');
    msg.textContent = '';

    const data = new FormData(form);
    const name = data.get('name')?.toString().trim();
    const email = data.get('email')?.toString().trim();
    const phone = data.get('phone')?.toString().trim();
    const file = data.get('screenshot');

    if(!name || !email || !phone || !(file && file.size && file.name)){
      msg.textContent = 'Please fill all required fields and attach the payment screenshot.';
      msg.style.color = 'var(--yellow)';
      return;
    }

    // read file as base64 (small client-side persistence). In a real app, upload to server.
    const readFile = (f) => new Promise((res, rej)=>{
      const r = new FileReader();
      r.onload = ()=> res(r.result);
      r.onerror = ()=> rej(r.error);
      r.readAsDataURL(f);
    });

    msg.textContent = 'Submitting…';

    try{
      const fileData = await readFile(file);

      // Attempt to POST to Google Apps Script endpoint if configured, otherwise store locally
      if(SHEETS_ENDPOINT_COMBO4){
        try{
          await fetch(SHEETS_ENDPOINT_COMBO4, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ combo: 'combo4', name, email, phone, screenshot: fileData, ts: Date.now() })
          });
          msg.textContent = 'Thanks — registration submitted. Please complete the Google Form and join the WhatsApp group.';
          msg.style.color = 'var(--yellow)';
          form.reset();
          setTimeout(()=> window.open(googleFormUrl, '_blank'), 900);
          return;
        }catch(sendErr){
          // fail quietly to local fallback
        }
      }

      const storageKey = 'combo4_registrations_v1';
      const existing = JSON.parse(localStorage.getItem(storageKey) || '[]');
      existing.push({ name, email, phone, screenshot: fileData, ts: Date.now() });
      localStorage.setItem(storageKey, JSON.stringify(existing));

      msg.textContent = 'Thanks — registration saved locally. Please complete the Google Form and join the WhatsApp group.';
      msg.style.color = 'var(--yellow)';
      form.reset();
      // optional: open google form automatically after a short delay
      setTimeout(()=> window.open(googleFormUrl, '_blank'), 900);
    }catch(err){
      msg.textContent = 'Failed to read the screenshot file. Please try again.';
      msg.style.color = '#ff6b6b';
    }
  });
}

document.addEventListener('DOMContentLoaded', ()=> initComboReg());
document.addEventListener('DOMContentLoaded', ()=> initCombo1Reg());
document.addEventListener('DOMContentLoaded', ()=> initCombo2Reg());
document.addEventListener('DOMContentLoaded', ()=> initComboInteractions());

/* Parallax micro-interaction for the logo overlay on `.combo-page`.
   - nudges the ::before logo using CSS variables set here.
   - disabled when prefers-reduced-motion is enabled or on small screens.
*/
function initComboParallax(){
  const root = document.querySelector('.combo-page');
  if(!root) return;
  if(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if(window.innerWidth < 520) return;

  let raf = false;
  let targetX = 0, targetY = 0;

  function apply(){
    root.style.setProperty('--logo-offset-x', targetX + 'px');
    root.style.setProperty('--logo-offset-y', targetY + 'px');
    raf = false;
  }

  function schedule(){ if(!raf){ raf = requestAnimationFrame(apply); } }

  function onMove(e){
    const rect = root.getBoundingClientRect();
    const cx = rect.left + rect.width/2;
    const cy = rect.top + rect.height/2;
    const clientX = (e.touches && e.touches[0]) ? e.touches[0].clientX : e.clientX;
    const clientY = (e.touches && e.touches[0]) ? e.touches[0].clientY : e.clientY;
    const dx = (clientX - cx) / (rect.width/2); // -1..1
    const dy = (clientY - cy) / (rect.height/2);
    const maxX = Math.min(40, rect.width * 0.03); // cap relative to size
    const maxY = Math.min(28, rect.height * 0.02);
    targetX = Math.round(dx * maxX);
    targetY = Math.round(dy * maxY) - Math.round(window.scrollY * 0.02);
    schedule();
  }

  function onLeave(){ targetX = 0; targetY = 0; schedule(); }

  root.addEventListener('mousemove', onMove);
  root.addEventListener('touchmove', onMove, { passive: true });
  root.addEventListener('mouseleave', onLeave);
  window.addEventListener('scroll', ()=>{ targetY = Math.round(window.scrollY * 0.02); schedule(); }, { passive: true });
}

document.addEventListener('DOMContentLoaded', ()=> initComboParallax());

/* Spiral selector: compute spiral positions and attach interactions */
function initSpiralSelector(){
  const container = document.querySelector('.spiral-selector');
  if(!container) return;
  const buttons = Array.from(container.querySelectorAll('.spiral-btn'));
  const center = container.querySelector('.spiral-center');
  const openClass = 'open';
  let opened = false;

  // compute spiral positions for N items
  function layout(){
    const rect = container.getBoundingClientRect();
    const cx = rect.width/2; const cy = rect.height/2;
    const baseRadius = Math.min(rect.width, rect.height) * 0.18; // inner gap
    const spacing = Math.min(rect.width, rect.height) * 0.22; // radial increment
    const turns = 0.9; // how tight the spiral is
    const n = buttons.length;
    for(let i=0;i<n;i++){
      const t = i / (n-1 || 1);
      const angle = t * Math.PI * 2 * turns; // full circle times turns
      const radius = baseRadius + spacing * i;
      const x = cx + Math.cos(angle) * radius;
      const y = cy + Math.sin(angle) * radius;
      const btn = buttons[i];
      // animate from center outward when opening
      btn.style.left = x + 'px';
      btn.style.top = y + 'px';
    }
  }

  // open/close toggle animates buttons
  function setOpen(v){
    opened = !!v;
    container.classList.toggle(openClass, opened);
    if(opened){ layout(); buttons.forEach((b,i)=> b.style.transitionDelay = (i*60)+'ms'); }
    else { buttons.forEach(b=> b.style.transitionDelay = '0ms'); }
  }

  // click handlers
  buttons.forEach(btn => {
    btn.addEventListener('click', (e)=>{
      e.preventDefault();
      const target = btn.getAttribute('data-target');
      if(target){
        const el = document.querySelector(target);
        if(el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      // highlight
      buttons.forEach(b=> b.classList.remove('active'));
      btn.classList.add('active');
      // small pulse
      btn.animate([{ transform: 'scale(1.08)' }, { transform: 'scale(1)' }], { duration: 360, easing: 'cubic-bezier(.2,.9,.2,1)' });
    });
  });

  // center toggles open/close
  if(center){
    center.addEventListener('click', ()=> setOpen(!opened));
    center.addEventListener('keydown', (e)=>{ if(e.key === 'Enter' || e.key === ' ') setOpen(!opened); });
  }

  // layout on resize
  window.addEventListener('resize', ()=>{ if(opened) layout(); });

  // open briefly on page load to show feature, then collapse
  setTimeout(()=>{ setOpen(true); setTimeout(()=> setOpen(false), 1800); }, 700);
}

document.addEventListener('DOMContentLoaded', ()=> initSpiralSelector());

/* Floating tools subtle parallax: shift icons slightly with mouse for depth */
function initFloatingTools(){
  const container = document.getElementById('floatingTools');
  if(!container) return;
  if(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const tools = Array.from(container.querySelectorAll('.tool'));
  let raf = null;
  let mouseX = 0, mouseY = 0;

  function apply(){
    const cw = window.innerWidth; const ch = window.innerHeight;
    tools.forEach((t, i) => {
      const rect = t.getBoundingClientRect();
      // compute subtle offset from center based on mouse
      const dx = (mouseX - cw/2) / cw; // -0.5..0.5
      const dy = (mouseY - ch/2) / ch;
      const max = 18 + (i*2);
      const ox = Math.round(dx * max);
      const oy = Math.round(dy * max * 0.6);
      t.style.transform = t.style.transform.replace(/translate\([^)]*\)/,'') + ` translate(${ox}px, ${oy}px)`;
    });
    raf = null;
  }

  function schedule(){ if(!raf) raf = requestAnimationFrame(apply); }

  function onMove(e){ const p = (e.touches && e.touches[0]) ? e.touches[0] : e; mouseX = p.clientX; mouseY = p.clientY; schedule(); }

  window.addEventListener('mousemove', onMove);
  window.addEventListener('touchmove', onMove, { passive: true });
}

document.addEventListener('DOMContentLoaded', ()=> initFloatingTools());

/* Combo1 registration form handling: select limits + local submission */
function initCombo1Reg(){
  const form = document.getElementById('combo1Form');
  if(!form) return;

  const googleFormUrl = 'https://forms.gle/REPLACE_WITH_YOUR_COMBO1_FORM';
  const whatsappUrl = 'https://chat.whatsapp.com/REPLACE_WITH_GROUP_LINK';

  const openGoogleForm1Btn = document.getElementById('openGoogleForm1');
  const openWhatsApp1Btn = document.getElementById('openWhatsApp1');
  if(openGoogleForm1Btn) openGoogleForm1Btn.addEventListener('click', ()=>{ window.open(googleFormUrl, '_blank'); });
  if(openWhatsApp1Btn) openWhatsApp1Btn.addEventListener('click', ()=>{ window.open(whatsappUrl, '_blank'); });

  // Enforce selection limits: max 2 per group
  const techChecks = Array.from(form.querySelectorAll('input[name="tech"]'));
  const nontechChecks = Array.from(form.querySelectorAll('input[name="nontech"]'));

  function limitSelection(checks, max){
    checks.forEach(c => c.addEventListener('change', ()=>{
      const checked = checks.filter(x => x.checked);
      if(checked.length > max){
        // uncheck the last changed input
        c.checked = false;
        // give quick feedback
        const msg = document.getElementById('formMessage1');
        msg.textContent = `You can select up to ${max} items in this group.`;
        msg.style.color = 'var(--yellow)';
        setTimeout(()=>{ msg.textContent = ''; }, 1800);
      }
    }));
  }

  limitSelection(techChecks, 2);
  limitSelection(nontechChecks, 2);

  form.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const msg = document.getElementById('formMessage1');
    msg.textContent = '';

    const data = new FormData(form);
    const name = data.get('name')?.toString().trim();
    const email = data.get('email')?.toString().trim();
    const phone = data.get('phone')?.toString().trim();
    const file = data.get('screenshot');
    const tech = data.getAll('tech');
    const nontech = data.getAll('nontech');

    if(!name || !email || !phone || !(file && file.size && file.name)){
      msg.textContent = 'Please fill all required fields and attach the payment screenshot.';
      msg.style.color = 'var(--yellow)';
      return;
    }

    if(tech.length > 2 || nontech.length > 2){
      msg.textContent = 'Please select at most 2 technical and 2 non-technical events.';
      msg.style.color = 'var(--yellow)';
      return;
    }

    const readFile = (f) => new Promise((res, rej)=>{
      const r = new FileReader();
      r.onload = ()=> res(r.result);
      r.onerror = ()=> rej(r.error);
      r.readAsDataURL(f);
    });

    msg.textContent = 'Submitting…';

    try{
      const fileData = await readFile(file);

      // Attempt to POST to Google Apps Script endpoint if configured, otherwise store locally
      if(SHEETS_ENDPOINT_COMBO1){
        try{
          await fetch(SHEETS_ENDPOINT_COMBO1, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ combo: 'combo1', name, email, phone, tech, nontech, screenshot: fileData, ts: Date.now() })
          });
          msg.textContent = 'Thanks — registration submitted. Please complete the Google Form and join the WhatsApp group.';
          msg.style.color = 'var(--yellow)';
          form.reset();
          setTimeout(()=> window.open(googleFormUrl, '_blank'), 900);
          return;
        }catch(sendErr){
          // fall back to localStorage if network call fails
        }
      }

      const storageKey = 'combo1_registrations_v1';
      const existing = JSON.parse(localStorage.getItem(storageKey) || '[]');
      existing.push({ name, email, phone, tech, nontech, screenshot: fileData, ts: Date.now() });
      localStorage.setItem(storageKey, JSON.stringify(existing));

      msg.textContent = 'Thanks — registration saved locally. Please complete the Google Form and join the WhatsApp group.';
      msg.style.color = 'var(--yellow)';
      form.reset();
      setTimeout(()=> window.open(googleFormUrl, '_blank'), 900);
    }catch(err){
      msg.textContent = 'Failed to read the screenshot file. Please try again.';
      msg.style.color = '#ff6b6b';
    }
  });
}

/* Combo2 registration: allow up to 2 technical events and up to 1 workshop */
function initCombo2Reg(){
  const form = document.getElementById('combo2Form');
  if(!form) return;

  const googleFormUrl = 'https://forms.gle/REPLACE_WITH_YOUR_COMBO2_FORM';
  const whatsappUrl = 'https://chat.whatsapp.com/REPLACE_WITH_GROUP_LINK';

  const openGoogleForm2Btn = document.getElementById('openGoogleForm2');
  const openWhatsApp2Btn = document.getElementById('openWhatsApp2');
  if(openGoogleForm2Btn) openGoogleForm2Btn.addEventListener('click', ()=>{ window.open(googleFormUrl, '_blank'); });
  if(openWhatsApp2Btn) openWhatsApp2Btn.addEventListener('click', ()=>{ window.open(whatsappUrl, '_blank'); });

  const techChecks = Array.from(form.querySelectorAll('input[name="tech"]'));
  const workshopChecks = Array.from(form.querySelectorAll('input[name="workshop"]'));

  function limitSelection(checks, max){
    checks.forEach(c => c.addEventListener('change', ()=>{
      const checked = checks.filter(x => x.checked);
      if(checked.length > max){
        c.checked = false;
        const msg = document.getElementById('formMessage2');
        if(msg){
          msg.textContent = `You can select up to ${max} items in this group.`;
          msg.style.color = 'var(--yellow)';
          setTimeout(()=>{ msg.textContent = ''; }, 1800);
        }
      }
    }));
  }

  limitSelection(techChecks, 2);
  limitSelection(workshopChecks, 1);

  form.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const msg = document.getElementById('formMessage2');
    if(msg) msg.textContent = '';

    const data = new FormData(form);
    const name = data.get('name')?.toString().trim();
    const email = data.get('email')?.toString().trim();
    const phone = data.get('phone')?.toString().trim();
    const file = data.get('screenshot');
    const tech = data.getAll('tech');
    const workshop = data.getAll('workshop');

    if(!name || !email || !phone || !(file && file.size && file.name)){
      if(msg){ msg.textContent = 'Please fill all required fields and attach the payment screenshot.'; msg.style.color = 'var(--yellow)'; }
      return;
    }

    const readFile = (f) => new Promise((res, rej)=>{
      const r = new FileReader(); r.onload = ()=> res(r.result); r.onerror = ()=> rej(r.error); r.readAsDataURL(f);
    });

    if(msg) msg.textContent = 'Submitting…';

    try{
      const fileData = await readFile(file);

      if(SHEETS_ENDPOINT_COMBO2){
        try{
          await fetch(SHEETS_ENDPOINT_COMBO2, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ combo: 'combo2', name, email, phone, tech, workshop, screenshot: fileData, ts: Date.now() })
          });
          if(msg){ msg.textContent = 'Thanks — registration submitted. Please complete the Google Form and join the WhatsApp group.'; msg.style.color = 'var(--yellow)'; }
          form.reset();
          setTimeout(()=> window.open(googleFormUrl, '_blank'), 900);
          return;
        }catch(err){ /* fallback to localStorage */ }
      }

      const storageKey = 'combo2_registrations_v1';
      const existing = JSON.parse(localStorage.getItem(storageKey) || '[]');
      existing.push({ name, email, phone, tech, workshop, screenshot: fileData, ts: Date.now() });
      localStorage.setItem(storageKey, JSON.stringify(existing));

      if(msg){ msg.textContent = 'Thanks — registration saved locally. Please complete the Google Form and join the WhatsApp group.'; msg.style.color = 'var(--yellow)'; }
      form.reset();
      setTimeout(()=> window.open(googleFormUrl, '_blank'), 900);
    }catch(err){ if(msg){ msg.textContent = 'Failed to read the screenshot file. Please try again.'; msg.style.color = '#ff6b6b'; } }
  });
}

/* Combo page interactions: reveal-on-scroll, CTA ripple, smooth-internal-links */
function initComboInteractions(){
  // reveal combo sections when they enter the viewport
  const combos = Array.from(document.querySelectorAll('.combo-hero'));
  if(combos.length){
    const obs = new IntersectionObserver((entries)=>{
      entries.forEach(en => {
        if(en.isIntersecting){
          en.target.classList.add('visible');
          // once revealed, unobserve for performance
          obs.unobserve(en.target);
        }
      });
    }, { threshold: 0.12 });

    combos.forEach(c => obs.observe(c));
  }

  // ripple effect on CTA buttons
  document.querySelectorAll('.combo-cta').forEach(btn => {
    btn.addEventListener('click', (e)=>{
      // if external link will open new tab, still show ripple
      const rect = btn.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height) * 1.8;
      const ripple = document.createElement('span');
      ripple.className = 'ripple';
      ripple.style.width = ripple.style.height = size + 'px';
      ripple.style.left = (e.clientX - rect.left - size/2) + 'px';
      ripple.style.top = (e.clientY - rect.top - size/2) + 'px';
      // initial state
      ripple.style.transform = 'scale(0.01)';
      ripple.style.opacity = '0.0';
      ripple.style.transition = 'transform 520ms cubic-bezier(.2,.9,.2,1), opacity 520ms ease';
      btn.appendChild(ripple);
      // trigger expand
      requestAnimationFrame(()=>{ ripple.style.transform = 'scale(1)'; ripple.style.opacity = '0.85'; });
      // fade out after a short delay
      setTimeout(()=>{ ripple.style.opacity = '0'; }, 420);
      // cleanup
      setTimeout(()=>{ if(ripple && ripple.parentNode) ripple.parentNode.removeChild(ripple); }, 980);
    });
  });

  // smooth scroll for internal anchors (if any)
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e)=>{
      const href = a.getAttribute('href');
      if(href && href.length>1){
        const target = document.querySelector(href);
        if(target){ e.preventDefault(); target.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
      }
    });
  });
}

/* Copy/share and scroll-spy keyboard shortcuts for combos */
function initComboUtilities(){
  // copy link buttons
  document.querySelectorAll('.small-btn[data-copy]').forEach(btn => {
    btn.addEventListener('click', async ()=>{
      const selector = btn.getAttribute('data-copy');
      const url = location.origin + location.pathname + selector;
      try{ await navigator.clipboard.writeText(url); btn.textContent = 'Copied'; setTimeout(()=> btn.textContent = 'Copy link', 1400); }catch(e){ btn.textContent = 'Copy'; setTimeout(()=> btn.textContent = 'Copy link', 1400); }
    });
  });

  // share buttons (uses Web Share API when available)
  document.querySelectorAll('.small-btn[data-share]').forEach(btn => {
    btn.addEventListener('click', async ()=>{
      const selector = btn.getAttribute('data-share');
      const url = location.origin + location.pathname + selector;
      const title = document.title;
      if(navigator.share){ try{ await navigator.share({ title, url }); }catch(e){ /* noop */ } }
      else { try{ await navigator.clipboard.writeText(url); btn.textContent = 'Link copied'; setTimeout(()=> btn.textContent = 'Share', 1400); }catch(e){ btn.textContent = 'Share'; setTimeout(()=> btn.textContent = 'Share', 1400); } }
    });
  });

  // improve button feedback to keep icons and label
  document.querySelectorAll('.small-btn.copy').forEach(btn => {
    btn.addEventListener('click', ()=>{
      const label = btn.querySelector('.label');
      if(label){ const old = label.textContent; label.textContent = 'Copied ✓'; setTimeout(()=> label.textContent = old, 1400); }
    });
  });
  document.querySelectorAll('.small-btn.share').forEach(btn => {
    btn.addEventListener('click', ()=>{
      const label = btn.querySelector('.label');
      if(label){ const old = label.textContent; label.textContent = 'Shared'; setTimeout(()=> label.textContent = old, 1400); }
    });
  });

  // scroll spy to highlight subnav
  const navLinks = Array.from(document.querySelectorAll('.combo-subnav-inner a'));
  const sections = navLinks.map(a=> document.querySelector(a.getAttribute('href'))).filter(Boolean);
  if(sections.length){
    const spy = new IntersectionObserver((entries)=>{
      entries.forEach(en=>{
        if(en.isIntersecting){
          navLinks.forEach(l=> l.classList.toggle('active', l.getAttribute('href') === ('#'+en.target.id)));
        }
      });
    }, { threshold: 0.4 });
    sections.forEach(s=> spy.observe(s));
  }

  // keyboard shortcuts: 1-4 jump to combos
  window.addEventListener('keydown', (e)=>{
    if(document.activeElement && ['INPUT','TEXTAREA'].includes(document.activeElement.tagName)) return;
    if(e.key >= '1' && e.key <= '4'){
      const id = 'combo' + e.key;
      const el = document.getElementById(id);
      if(el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
}

/* ===== CONTACT FORM EMAILJS SEND ===== */
/* ===== CONTACT FORM EMAILJS SEND ===== */
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("contactForm");
  const status = document.getElementById("formStatus");

  if (!form || !status) return;

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    status.style.color = "#ffd54d";
    status.textContent = "Sending message...";

    emailjs.sendForm(
      "service_5gpihxi",     // your service ID
      "template_5i4w8tq",    // your template ID
      form,                  // ✅ FIXED: use form explicitly
      "PSFWFFT4yddMk0wzk"      // your public key
    )
    .then(() => {
      status.style.color = "#00ff99";
      status.textContent = "Message sent successfully! We’ll contact you soon.";
      form.reset();
    })
    .catch((error) => {
      status.style.color = "#ff6b6b";
      status.textContent = "Failed to send message.";
      console.error("EmailJS Error:", error);
    });
  });
});


emailjs.sendForm(
  "service_5gpihxi",
  "template_5i4w8tq",
  this,
  "PSFWFFT4yddMk0wzk"   // SAME public key here
);


