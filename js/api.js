// api.js - Quản lý chuyến đi TVK
const GAS_URL = 'https://script.google.com/macros/s/AKfycby-fepLSS8nFnVgom0yGzBRzLFru-Yh2rvP-xo62aNEaBJxjoZGlQNnIxi-tqzfdCf63w/exec';
const CLOUDINARY_CLOUD = 'dbmyz96cd';
const CLOUDINARY_PRESET = 'dangoai';

const API = {
  async call(data) {
    try {
      const params = new URLSearchParams();
      for (const k in data) {
        if (data[k] !== undefined && data[k] !== null) {
          params.append(k, typeof data[k]==='object' ? JSON.stringify(data[k]) : data[k]);
        }
      }
      const res = await fetch(GAS_URL+'?'+params.toString(), {method:'GET',redirect:'follow'});
      const text = await res.text();
      try { return JSON.parse(text); } catch(e) { return {error:'Lỗi phản hồi server'}; }
    } catch(e) { return {error:'Lỗi kết nối: '+e.message}; }
  },
  login: (u,p) => API.call({action:'login',username:u,password:p}),
  getUsers: () => API.call({action:'getUsers'}),
  createUser: d => API.call({action:'createUser',...d}),
  updateUser: d => API.call({action:'updateUser',...d}),
  deleteUser: id => API.call({action:'deleteUser',id}),
  getConfig: () => API.call({action:'getConfig'}),
  updateConfig: updates => API.call({action:'updateConfig',updates:JSON.stringify(updates)}),
  getHS: p => API.call({action:'getHS',...(p||{})}),
  importHS: rows => API.call({action:'importHS',rows:JSON.stringify(rows)}),
  updateHS: d => API.call({action:'updateHS',...d}),
  deleteHS: id => API.call({action:'deleteHS',id}),
  clearHS: () => API.call({action:'clearHS'}),
  getXe: p => API.call({action:'getXe',...(p||{})}),
  createXe: d => API.call({action:'createXe',...d}),
  updateXe: d => API.call({action:'updateXe',...d}),
  deleteXe: id => API.call({action:'deleteXe',id}),
  getPhong: p => API.call({action:'getPhong',...(p||{})}),
  createPhong: d => API.call({action:'createPhong',...d}),
  updatePhong: d => API.call({action:'updatePhong',...d}),
  deletePhong: id => API.call({action:'deletePhong',id}),
  getSuKien: p => API.call({action:'getSuKien',...(p||{})}),
  createSuKien: d => API.call({action:'createSuKien',...d}),
  updateSuKien: d => API.call({action:'updateSuKien',...d}),
  deleteSuKien: id => API.call({action:'deleteSuKien',id}),
  getDiemDanh: p => API.call({action:'getDiemDanh',...(p||{})}),
  saveDiemDanh: d => API.call({action:'saveDiemDanh',...d,items:JSON.stringify(d.items)}),
  deleteDiemDanh: id => API.call({action:'deleteDiemDanh',id}),
  getDashboard: p => API.call({action:'getDashboard',...(p||{})}),
  getSuCo: p => API.call({action:'getSuCo',...(p||{})}),
  createSuCo: d => API.call({action:'createSuCo',...d}),
  updateSuCo: d => API.call({action:'updateSuCo',...d}),
};

// ================================================================
// CLOUDINARY UPLOAD
// ================================================================
async function uploadToCloudinary(file, onProgress) {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_PRESET);
    formData.append('folder', 'tvk_chuyen_di');
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`);
    xhr.upload.onprogress = e => { if (onProgress && e.lengthComputable) onProgress(Math.round(e.loaded/e.total*100)); };
    xhr.onload = () => {
      try {
        const r = JSON.parse(xhr.responseText);
        if (r.secure_url) resolve(r.secure_url);
        else reject(new Error('Upload thất bại'));
      } catch(e) { reject(e); }
    };
    xhr.onerror = () => reject(new Error('Lỗi kết nối'));
    xhr.send(formData);
  });
}

// ================================================================
// HELPERS
// ================================================================
function getCurrentUser() {
  const u = sessionStorage.getItem('cd_user');
  return u ? JSON.parse(u) : null;
}
function fmtDate(d) {
  if (!d||d===''||d==='—') return '—';
  if (/^\d{4}-\d{2}-\d{2}$/.test(d)) { const p=d.split('-'); return p[2]+'/'+p[1]+'/'+p[0]; }
  return d;
}
function todayISO() {
  const d = new Date();
  return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
}
function nowStr() {
  const d = new Date();
  return String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0');
}
function showToast(msg, type) {
  let t = document.getElementById('toast');
  if (!t) { t=document.createElement('div'); t.id='toast'; document.body.appendChild(t); }
  t.className='toast '+(type||'success');
  t.textContent=msg; t.style.display='block';
  clearTimeout(t._t); t._t=setTimeout(()=>t.style.display='none', 3500);
}
function showLoad(msg) {
  const o=document.getElementById('loadOvl'),m=document.getElementById('loadMsg');
  if(o){o.style.display='flex';if(m)m.textContent=msg||'Đang xử lý...';}
}
function hideLoad() { const o=document.getElementById('loadOvl');if(o)o.style.display='none'; }
function V(id){const e=document.getElementById(id);return e?e.value.trim():'';}
function S(id,val){const e=document.getElementById(id);if(e)e.value=(val===undefined?'':val);}
function hasRole(...roles){const u=getCurrentUser();return u&&roles.includes(u.role);}

// Parse Excel/CSV
function parseCSV(text) {
  const lines = text.split('\n').map(l=>l.trim()).filter(Boolean);
  if (!lines.length) return [];
  const headers = lines[0].split(',').map(h=>h.trim().replace(/"/g,''));
  return lines.slice(1).map(line => {
    const vals = line.split(',').map(v=>v.trim().replace(/"/g,''));
    const obj = {};
    headers.forEach((h,i) => obj[h] = vals[i]||'');
    return obj;
  });
}

