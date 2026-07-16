document.addEventListener('DOMContentLoaded',()=>{
  const sidebar = document.getElementById('sidebar');
  const toggle = document.getElementById('sidebarToggle');
  const createBtn = document.getElementById('createEventBtn');
  const modal = document.getElementById('createEventModal');
  const closeModalBtns = document.querySelectorAll('.modal-close');
  const form = document.getElementById('createEventForm');

  // Auth UI
  const signInBtn = document.getElementById('signInBtn');
  const signOutBtn = document.getElementById('signOutBtn');
  const loginModal = document.getElementById('loginModal');
  const closeLogin = document.getElementById('closeLogin');
  const loginForm = document.getElementById('loginForm');
  const profileEl = document.getElementById('profile');
  const profileName = document.getElementById('profileName');

  const eventsListEl = document.getElementById('eventsList');
  const vendorsListEl = document.getElementById('vendorsList');
  const aiSuggestionsEl = document.getElementById('aiSuggestions');
  const budgetBarsEl = document.getElementById('budgetBars');

  let events = [
    {name:'Summer Gala',date:'2026-08-12',guests:320,budget:8000},
    {name:'Product Launch',date:'2026-09-05',guests:120,budget:12000},
    {name:'Wedding Expo',date:'2026-07-30',guests:800,budget:6500}
  ];

  const vendors = [
    {name:'Stellar Catering',category:'Catering'},
    {name:'Bright Lights',category:'Lighting'},
    {name:'Flora Events',category:'Florist'}
  ];

  const budget = [
    {name:'Venue',value:40},
    {name:'Catering',value:30},
    {name:'Entertainment',value:15},
    {name:'Decor',value:10},
    {name:'Misc',value:5}
  ];

  const suggestions = [
    'Consider negotiating a bundled discount with your top 3 vendors.',
    'Shift 8% of decor budget to guest experience for higher satisfaction.',
    'Offer early-bird tickets to secure 15% of attendees earlier.'
  ];

  function renderEvents(){
    eventsListEl.innerHTML = '';
    events.forEach(e=>{
      const li = document.createElement('li');
      li.innerHTML = `<div><strong>${e.name}</strong><div class="muted">${e.date} · ${e.guests} guests</div></div><div class="price">$${e.budget}</div>`;
      eventsListEl.appendChild(li);
    });
  }

  function renderVendors(){
    vendorsListEl.innerHTML = '';
    vendors.forEach(v=>{
      const d = document.createElement('div'); d.className='vendor';
      d.innerHTML = `<h4>${v.name}</h4><div class="muted">${v.category}</div>`;
      vendorsListEl.appendChild(d);
    });
  }

  function renderSuggestions(){
    aiSuggestionsEl.innerHTML = '';
    suggestions.forEach(s=>{
      const d = document.createElement('div'); d.className='ai-suggestion';
      d.textContent = s; aiSuggestionsEl.appendChild(d);
    });
  }

  function renderBudget(){
    budgetBarsEl.innerHTML = '';
    budget.forEach(b=>{
      const row = document.createElement('div'); row.className='budget-row';
      const label = document.createElement('div'); label.style.width='120px'; label.textContent = `${b.name}`;
      const bar = document.createElement('div'); bar.className='bar';
      const fill = document.createElement('div'); fill.className='fill'; fill.style.width = b.value + '%';
      bar.appendChild(fill);
      const percent = document.createElement('div'); percent.style.width='48px'; percent.textContent = b.value + '%';
      row.appendChild(label); row.appendChild(bar); row.appendChild(percent);
      budgetBarsEl.appendChild(row);
    });
  }

  renderEvents(); renderVendors(); renderSuggestions(); renderBudget();

  // Attempt to load remote events if authenticated
  async function tryLoadRemote(){
    try{
      if(window.api && window.api.auth && window.api.auth.getToken()){
        const me = await window.api.auth.me().catch(()=>null);
        if(me){
          profileName.textContent = me.full_name || me.email || 'Me';
          profileEl.style.display = 'flex';
          signInBtn.style.display = 'none';
          signOutBtn.style.display = 'inline-block';
          // fetch events from backend
          const remoteEvents = await window.api.events.list();
          if(Array.isArray(remoteEvents) && remoteEvents.length){
            events = remoteEvents.map(e=>({name:e.title||e.name, date: e.date||'', guests: e.guest_limit||0, budget: e.expected_budget||0, id: e.id}));
            renderEvents();
          }
        }
      }
    }catch(err){
      console.warn('Failed to load remote events', err);
      showToast('Failed to load remote events', 'error');
    }
            showToast('Event created', 'success');
  }
  tryLoadRemote();

  // Sidebar toggle for small screens
  toggle.addEventListener('click',()=>{
    sidebar.classList.toggle('open');
  });

  // Open modal
  createBtn.addEventListener('click',()=>{
    modal.setAttribute('aria-hidden','false');
  });
  closeModalBtns.forEach(b=>b.addEventListener('click',()=>{ modal.setAttribute('aria-hidden','true'); }));

  // Submit create event form
  form.addEventListener('submit',(ev)=>{
    ev.preventDefault();
    const fd = new FormData(form);
    const newEvent = {name:fd.get('name'), date:fd.get('date'), budget: Number(fd.get('budget')||0), guests:0};
    ;(async ()=>{
      // If authenticated, post to backend; otherwise use local
      if(window.api && window.api.auth && window.api.auth.getToken()){
        try{
          const payload = { title: newEvent.name, date: newEvent.date, expected_budget: newEvent.budget };
          await window.api.events.create(payload);
          await tryLoadRemote();
        }catch(err){ showToast('Failed to create event: '+(err.message||JSON.stringify(err)), 'error'); }
      }else{
        events.unshift(newEvent);
        renderEvents();
      }
      modal.setAttribute('aria-hidden','true');
      form.reset();
    })();
  });

  // Auth flows
  signInBtn?.addEventListener('click',()=>{ loginModal.setAttribute('aria-hidden','false'); });
  signOutBtn?.addEventListener('click',()=>{ if(window.api && window.api.auth){ window.api.auth.logout(); profileEl.style.display='none'; signOutBtn.style.display='none'; signInBtn.style.display='inline-block'; events = events; renderEvents(); }});
    signOutBtn?.addEventListener('click',()=>{ showToast('Signed out', 'info'); });
  closeLogin?.addEventListener('click',()=>{ loginModal.setAttribute('aria-hidden','true'); });

  loginForm?.addEventListener('submit', async (ev)=>{
    ev.preventDefault();
    const fd = new FormData(loginForm);
    const payload = { email: fd.get('email'), password: fd.get('password') };
    try{
      await window.api.auth.login(payload);
      await tryLoadRemote();
      loginModal.setAttribute('aria-hidden','true');
      loginForm.reset();
        showToast('Signed in', 'success');
    }catch(err){
      showToast('Login failed: ' + (err.message||JSON.stringify(err)), 'error');
    }
  });

  // Toast helper
  function showToast(message, type='success', ttl=4500){
    const container = document.getElementById('toastContainer');
    if(!container) return console.warn('No toast container');
    const t = document.createElement('div'); t.className = `toast toast--${type}`;
    t.innerHTML = `<div class="msg">${message}</div><button class="close">&times;</button>`;
    const closeBtn = t.querySelector('.close');
    closeBtn.addEventListener('click', ()=> { t.remove(); });
    container.appendChild(t);
    setTimeout(()=>{ t.remove(); }, ttl);
  }

  // Simple fade-in animation
  document.querySelectorAll('.card, .stat-card').forEach((el,i)=>{ el.style.animation = `fadeIn .45s ease ${i*0.03}s both`; });

});

/* small keyframes injected for fadeIn */
const s = document.createElement('style'); s.textContent = `@keyframes fadeIn {from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}`; document.head.appendChild(s);
