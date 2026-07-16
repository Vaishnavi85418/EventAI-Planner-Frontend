/*
  api.js
  Simple fetch wrappers and auth helpers to connect the frontend to a FastAPI backend.
  - Attaches `window.api` with organized endpoint groups
  - Uses localStorage for storing JWT access token
  - Defaults API base to http://localhost:8000 (override with window.API_BASE_URL)
*/
(function(){
  const API_BASE = window.API_BASE_URL || 'http://localhost:8000';
  const TOKEN_KEY = 'eventai_token';

  function setToken(token){ if(token) localStorage.setItem(TOKEN_KEY, token); }
  function getToken(){ return localStorage.getItem(TOKEN_KEY); }
  function removeToken(){ localStorage.removeItem(TOKEN_KEY); }

  async function handleResponse(res){
    const text = await res.text();
    let data = null;
    try{ data = text ? JSON.parse(text) : null; }catch(e){ data = text; }
    if(!res.ok){
      const message = data && data.detail ? data.detail : (data && data.message) ? data.message : res.statusText;
      const err = { status: res.status, message, data };
      throw err;
    }
    return data;
  }

  function buildQuery(params){
    if(!params) return '';
    if(typeof params === 'string') return params ? `?${params}` : '';
    const s = new URLSearchParams(params);
    return s.toString() ? `?${s.toString()}` : '';
  }

  async function request(path, opts = {}){
    const headers = Object.assign({'Accept':'application/json'}, opts.headers || {});
    if(!(opts.body instanceof FormData)) headers['Content-Type'] = headers['Content-Type'] || 'application/json';
    const token = getToken();
    if(token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(API_BASE + path, Object.assign({}, opts, { headers }));
    return handleResponse(res);
  }

  // Auth helpers
  const auth = {
    async register(payload){ return request('/auth/register', { method:'POST', body: JSON.stringify(payload) }); },
    async login(payload){
      const data = await request('/auth/login', { method:'POST', body: JSON.stringify(payload) });
      if(data && data.access_token) setToken(data.access_token);
      return data;
    },
    async logout(){ removeToken(); return { success:true }; },
    async me(){ return request('/auth/me'); },
    async updateProfile(payload){ return request('/auth/profile', { method:'PUT', body: JSON.stringify(payload) }); },
    async changePassword(payload){ return request('/auth/change-password', { method:'PUT', body: JSON.stringify(payload) }); },
    async deleteAccount(){ return request('/auth/delete-account', { method:'DELETE' }); },
    setToken, getToken, removeToken
  };

  // Events
  const events = {
    async create(payload){ return request('/events', { method:'POST', body: JSON.stringify(payload) }); },
    async list(query){ return request('/events' + buildQuery(query)); },
    async get(id){ return request(`/events/${id}`); },
    async update(id,payload){ return request(`/events/${id}`, { method:'PUT', body: JSON.stringify(payload) }); },
    async remove(id){ return request(`/events/${id}`, { method:'DELETE' }); }
  };

  // Budgets
  const budgets = {
    async create(payload){ return request('/budgets', { method:'POST', body: JSON.stringify(payload) }); },
    async list(event_id){ return request(`/budgets/${event_id}`); },
    async update(id,payload){ return request(`/budgets/${id}`, { method:'PUT', body: JSON.stringify(payload) }); },
    async remove(id){ return request(`/budgets/${id}`, { method:'DELETE' }); }
  };

  // Expenses
  const expenses = {
    async create(payload){ return request('/expenses', { method:'POST', body: JSON.stringify(payload) }); },
    async list(event_id){ return request(`/expenses/${event_id}`); },
    async update(id,payload){ return request(`/expenses/${id}`, { method:'PUT', body: JSON.stringify(payload) }); },
    async remove(id){ return request(`/expenses/${id}`, { method:'DELETE' }); }
  };

  // Guests
  const guests = {
    async create(payload){ return request('/guests', { method:'POST', body: JSON.stringify(payload) }); },
    async list(event_id){ return request(`/guests/${event_id}`); },
    async update(id,payload){ return request(`/guests/${id}`, { method:'PUT', body: JSON.stringify(payload) }); },
    async remove(id){ return request(`/guests/${id}`, { method:'DELETE' }); }
  };

  // Vendors
  const vendors = {
    async create(payload){ return request('/vendors', { method:'POST', body: JSON.stringify(payload) }); },
    async list(query){ return request('/vendors' + buildQuery(query)); },
    async listByEvent(event_id){ return request(`/vendors/${event_id}`); },
    async update(id,payload){ return request(`/vendors/${id}`, { method:'PUT', body: JSON.stringify(payload) }); },
    async remove(id){ return request(`/vendors/${id}`, { method:'DELETE' }); }
  };

  // Tasks
  const tasks = {
    async create(payload){ return request('/tasks', { method:'POST', body: JSON.stringify(payload) }); },
    async list(event_id){ return request(`/tasks/${event_id}`); },
    async update(id,payload){ return request(`/tasks/${id}`, { method:'PUT', body: JSON.stringify(payload) }); },
    async remove(id){ return request(`/tasks/${id}`, { method:'DELETE' }); }
  };

  // AI placeholder endpoints
  const ai = {
    async suggestions(payload){ return request('/ai/suggestions', { method:'POST', body: JSON.stringify(payload) }); },
    async checklist(payload){ return request('/ai/checklist', { method:'POST', body: JSON.stringify(payload) }); },
    async budgetAnalysis(payload){ return request('/ai/budget-analysis', { method:'POST', body: JSON.stringify(payload) }); }
  };

  // Expose API on window for simple usage from non-module scripts
  window.api = { API_BASE, auth, events, budgets, expenses, guests, vendors, tasks, ai };

})();
