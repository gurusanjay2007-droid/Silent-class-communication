// =============================================
//  SCCS Login â€” Coordinated Institution System
// =============================================

// ---- Department & Subject Data ----
const DEPARTMENTS = [
  'Computer Science & Engineering (CSE)',
  'Electronics & Communication Engineering (ECE)',
  'Electrical & Electronics Engineering (EEE)',
  'Mechanical Engineering (ME)',
  'Civil Engineering (CE)',
  'Information Technology (IT)',
  'Artificial Intelligence & Data Science (AIDS)',
  'Computer Science & Business Systems (CSBS)',
  'Business Administration (MBA)',
  'Applied Sciences & Mathematics',
];

const SUBJECTS_BY_DEPT = {
  'Computer Science & Engineering (CSE)':['Data Structures & Algorithms','Object-Oriented Programming','Database Management Systems','Operating Systems','Computer Networks','Software Engineering','Theory of Computation','Compiler Design','Web Technologies','Artificial Intelligence','Machine Learning','Cloud Computing','Cyber Security','Mobile Application Development'],
  'Electronics & Communication Engineering (ECE)':['Signals & Systems','Digital Electronics','Analog Circuits','Communication Systems','Electromagnetic Theory','VLSI Design','Microprocessors & Microcontrollers','Digital Signal Processing','Wireless Communication','Antenna & Wave Propagation'],
  'Electrical & Electronics Engineering (EEE)':['Circuit Theory','Electrical Machines','Power Systems','Control Systems','Power Electronics','Measurements & Instrumentation','High Voltage Engineering','Renewable Energy Systems'],
  'Mechanical Engineering (ME)':['Engineering Mechanics','Thermodynamics','Fluid Mechanics','Manufacturing Technology','Kinematics & Dynamics','Heat Transfer','CAD/CAM','Automobile Engineering','Industrial Engineering','Robotics'],
  'Civil Engineering (CE)':['Structural Analysis','Fluid Mechanics','Geotechnical Engineering','Transportation Engineering','Environmental Engineering','Construction Management','Surveying','Concrete Technology','Steel Design'],
  'Information Technology (IT)':['Programming Fundamentals','Web Development','Database Systems','Network Administration','Software Testing','Information Security','Cloud Infrastructure','Big Data Analytics','Internet of Things'],
  'Artificial Intelligence & Data Science (AIDS)':['Statistics & Probability','Machine Learning','Deep Learning','Natural Language Processing','Computer Vision','Data Mining','Big Data Technologies','Business Analytics','AI Ethics & Governance'],
  'Computer Science & Business Systems (CSBS)':['Business Process Management','Enterprise Resource Planning','E-Commerce Technologies','Digital Marketing','Data Science for Business','Project Management','Software Architecture','Business Analytics'],
  'Business Administration (MBA)':['Principles of Management','Organizational Behaviour','Marketing Management','Financial Management','Human Resource Management','Operations Management','Business Analytics','Strategic Management','Entrepreneurship'],
  'Applied Sciences & Mathematics':['Engineering Mathematics I','Engineering Mathematics II','Engineering Physics','Engineering Chemistry','Statistics & Numerical Methods','Probability & Queuing Theory','Discrete Mathematics','Linear Algebra'],
};

// =============================================
//  REGISTRIES  (saved per institution)
// =============================================

function getInstitutions() {
  try { return JSON.parse(localStorage.getItem('sccs_institutions') || '[]'); } catch(e) { return []; }
}
function saveInstitutions(list) { localStorage.setItem('sccs_institutions', JSON.stringify(list)); }

function generateInstitutionId() {
  const year = new Date().getFullYear();
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const suffix = Array.from({length:6}, () => chars[Math.floor(Math.random()*chars.length)]).join('');
  return `SCCS-${year}-${suffix}`;
}
function findInstitution(id) {
  return getInstitutions().find(i => i.id === id.toUpperCase().trim());
}
function verifyInstitution(id, email, password) {
  const inst = findInstitution(id);
  if (!inst || inst.email.toLowerCase() !== email.toLowerCase().trim() || inst.password !== password) return null;
  return inst;
}

// ---- Staff Registry ----
function getStaffRegistry(institutionId) {
  try { return JSON.parse(localStorage.getItem(`sccs_staff_${institutionId}`) || '[]'); } catch(e) { return []; }
}
function saveStaffRegistry(institutionId, list) {
  localStorage.setItem(`sccs_staff_${institutionId}`, JSON.stringify(list));
}
function registerStaff(profile) {
  const list = getStaffRegistry(profile.institutionId);
  // Check if staffId already exists
  const exists = list.find(s => s.staffId.toLowerCase() === profile.staffId.toLowerCase());
  if (exists) return { error: 'Staff ID already registered. Please use Staff Login.' };
  list.push({ ...profile, registeredAt: new Date().toISOString() });
  saveStaffRegistry(profile.institutionId, list);
  return { ok: true };
}
function findStaff(institutionId, staffId, password) {
  const list = getStaffRegistry(institutionId);
  return list.find(s => s.staffId.toLowerCase() === staffId.toLowerCase().trim() && s.password === password) || null;
}

// ---- Student Registry ----
function getStudentRegistry(institutionId) {
  try { return JSON.parse(localStorage.getItem(`sccs_students_${institutionId}`) || '[]'); } catch(e) { return []; }
}
function saveStudentRegistry(institutionId, list) {
  localStorage.setItem(`sccs_students_${institutionId}`, JSON.stringify(list));
}
function registerStudent(profile) {
  const list = getStudentRegistry(profile.institutionId);
  const exists = list.find(s => s.roll.toLowerCase() === profile.roll.toLowerCase());
  if (exists) return { error: 'Roll number already registered. Please use Student Login.' };
  list.push({ ...profile, registeredAt: new Date().toISOString() });
  saveStudentRegistry(profile.institutionId, list);
  return { ok: true };
}
function findStudent(institutionId, roll, password) {
  const list = getStudentRegistry(institutionId);
  return list.find(s => s.roll.toLowerCase() === roll.toLowerCase().trim() && s.password === password) || null;
}

// =============================================
//  PAGE NAVIGATION
// =============================================

function showPage(id) {
  document.querySelectorAll('.login-page').forEach(p => { p.classList.remove('active'); p.style.display = 'none'; });
  const page = document.getElementById(id);
  if (page) { page.style.display = 'block'; page.classList.add('active'); page.style.animation='none'; page.offsetHeight; page.style.animation=''; }
}

function updateStepDots(containerId, currentStep) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.querySelectorAll('.step-dot').forEach((dot, i) => {
    dot.classList.remove('active','done');
    if (i+1 < currentStep) dot.classList.add('done');
    else if (i+1 === currentStep) dot.classList.add('active');
  });
  container.querySelectorAll('.step-connector').forEach((c, i) => { c.classList.toggle('done', i+1 < currentStep); });
}

function requiredFields(ids) {
  let valid = true;
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.remove('input-error');
    if (!el.value || !el.value.trim()) { el.classList.add('input-error'); valid = false; }
  });
  return valid;
}

function shake(el) {
  if (!el) return;
  el.style.animation = 'none'; el.offsetHeight; el.style.animation = 'shakeForm 0.4s ease';
}

const shakeStyle = document.createElement('style');
shakeStyle.textContent = `@keyframes shakeForm{0%,100%{transform:translateX(0)}20%{transform:translateX(-8px)}40%{transform:translateX(8px)}60%{transform:translateX(-5px)}80%{transform:translateX(5px)}}`;
document.head.appendChild(shakeStyle);

function populateSelect(id, options, placeholder) {
  const el = document.getElementById(id);
  if (!el) return;
  el.innerHTML = `<option value="">${placeholder}</option>`;
  options.forEach(o => { const opt = document.createElement('option'); opt.value = o; opt.textContent = o; el.appendChild(opt); });
}

function populateCheckboxGrid(containerId, items, name) {
  const container = document.getElementById(containerId);
  if (!container) return;
  if (!items?.length) { container.innerHTML = '<p class="hint-text">No subjects available</p>'; return; }
  container.innerHTML = items.map(item => `<label class="checkbox-item"><input type="checkbox" name="${name}" value="${item}"/>${item}</label>`).join('');
}

// ---- Eye Toggle ----
document.querySelectorAll('.eye-btn').forEach(btn => {
  btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
  btn.addEventListener('click', () => {
    const target = document.getElementById(btn.dataset.target);
    if (!target) return;
    const isPass = target.type === 'password';
    target.type = isPass ? 'text' : 'password';
    btn.innerHTML = isPass
      ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`
      : `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
  });
});

// Role cards
document.querySelectorAll('.role-card').forEach(card => {
  card.addEventListener('click', () => {
    const role = card.dataset.role;
    showPage(`page-${role}`);
    if (role === 'staff')       { resetStaff(); switchStaffTab('login'); }
    if (role === 'student')     { resetStudent(); switchStudentTab('login'); }
    if (role === 'institution') { switchTab('login'); }
  });
  card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') card.click(); });
});

document.getElementById('back-from-institution').addEventListener('click', () => showPage('page-role'));
document.getElementById('back-from-staff').addEventListener('click',        () => showPage('page-role'));
document.getElementById('back-from-student').addEventListener('click',      () => showPage('page-role'));

// =============================================
//  INSTITUTION TABS
// =============================================

function switchTab(tab) {
  const reg = document.getElementById('inst-register-form');
  const log = document.getElementById('inst-login-form');
  const tReg = document.getElementById('tab-register');
  const tLog = document.getElementById('tab-login');
  if (tab === 'register') { reg.classList.remove('hidden'); log.classList.add('hidden'); tReg.classList.add('active'); tLog.classList.remove('active'); }
  else { log.classList.remove('hidden'); reg.classList.add('hidden'); tLog.classList.add('active'); tReg.classList.remove('active'); }
}
document.getElementById('tab-register').addEventListener('click', () => switchTab('register'));
document.getElementById('tab-login').addEventListener('click',    () => switchTab('login'));

// Institution Register
document.getElementById('inst-register-btn').addEventListener('click', () => {
  const name = document.getElementById('reg-inst-name');
  const city = document.getElementById('reg-city');
  const email = document.getElementById('reg-email');
  const password = document.getElementById('reg-password');
  const acYear = document.getElementById('reg-academic-year');
  let valid = true;
  [name, city, email, password, acYear].forEach(el => { el.classList.remove('input-error'); if (!el.value.trim()) { el.classList.add('input-error'); valid = false; } });
  if (!valid) { shake(document.getElementById('inst-register-form')); return; }
  const existing = getInstitutions().find(i => i.email.toLowerCase() === email.value.toLowerCase().trim());
  if (existing) { email.classList.add('input-error'); alert(`Email already registered under ${existing.id}`); return; }
  const newId = generateInstitutionId();
  const inst = { id:newId, name:name.value.trim(), city:city.value.trim(), email:email.value.trim(), password:password.value, academicYear:acYear.value, createdAt:new Date().toISOString() };
  const list = getInstitutions(); list.push(inst); saveInstitutions(list);
  document.getElementById('generated-id-value').textContent = newId;
  document.getElementById('inst-summary').innerHTML = `
    <div class="detail-row"><span class="detail-label">Institution</span><span class="detail-value">${inst.name}</span></div>
    <div class="detail-row"><span class="detail-label">City</span><span class="detail-value">${inst.city}</span></div>
    <div class="detail-row"><span class="detail-label">Admin Email</span><span class="detail-value">${inst.email}</span></div>
    <div class="detail-row"><span class="detail-label">Academic Year</span><span class="detail-value">${inst.academicYear}</span></div>`;
  showPage('page-id-generated');
});

document.getElementById('copy-id-btn').addEventListener('click', function() {
  const id = document.getElementById('generated-id-value').textContent;
  navigator.clipboard.writeText(id).then(() => { this.textContent='âœ“ Copied!'; this.classList.add('copied'); setTimeout(()=>{ this.textContent='Copy ID'; this.classList.remove('copied'); }, 2000); });
});

// Institution Login
document.getElementById('inst-login-btn').addEventListener('click', () => {
  const id = document.getElementById('login-inst-id');
  const email = document.getElementById('login-inst-email');
  const password = document.getElementById('login-inst-password');
  let valid = true;
  [id, email, password].forEach(el => { el.classList.remove('input-error'); if (!el.value.trim()) { el.classList.add('input-error'); valid = false; } });
  if (!valid) { shake(document.getElementById('inst-login-form')); return; }
  const inst = verifyInstitution(id.value, email.value, password.value);
  if (!inst) { [id,email,password].forEach(el=>el.classList.add('input-error')); shake(document.getElementById('inst-login-form')); alert('Invalid Institution ID, email, or password.'); return; }
  saveAndRedirect('institution', { institutionId:inst.id, institutionName:inst.name, email:inst.email }, '/');
});

// =============================================
//  STAFF REGISTER/LOGIN TABS
// =============================================

function switchStaffTab(tab) {
  const regSec = document.getElementById('staff-register-section');
  const logSec = document.getElementById('staff-login-section');
  const tReg   = document.getElementById('staff-tab-register');
  const tLog   = document.getElementById('staff-tab-login');
  if (tab === 'register') {
    regSec.classList.remove('hidden'); logSec.classList.add('hidden');
    tReg.classList.add('active'); tLog.classList.remove('active');
  } else {
    logSec.classList.remove('hidden'); regSec.classList.add('hidden');
    tLog.classList.add('active'); tReg.classList.remove('active');
    resetStaffLogin();
  }
}
document.getElementById('staff-tab-register').addEventListener('click', () => switchStaffTab('register'));
document.getElementById('staff-tab-login').addEventListener('click',    () => switchStaffTab('login'));

// =============================================
//  STAFF REGISTRATION  (5 steps)
// =============================================

let staffInstitutionId = null, staffInstitutionName = null, staffSelectedSubjects = [];

function resetStaff() { staffInstitutionId=null; staffInstitutionName=null; staffSelectedSubjects=[]; showStaffStep(1); }

function showStaffStep(n) {
  document.querySelectorAll('.staff-step').forEach(el => el.classList.add('hidden'));
  const el = document.getElementById(`staff-step-${n}`);
  if (el) el.classList.remove('hidden');
  updateStepDots('staff-steps', n);
}

// Step 1
document.getElementById('staff-verify-inst').addEventListener('click', () => {
  const idInput = document.getElementById('staff-inst-id');
  const resultEl = document.getElementById('staff-inst-result');
  idInput.classList.remove('input-error');
  if (!idInput.value.trim()) { idInput.classList.add('input-error'); shake(document.getElementById('staff-step-1')); return; }
  const inst = findInstitution(idInput.value.trim());
  resultEl.classList.remove('hidden','success','error');
  if (!inst) { resultEl.classList.add('error'); resultEl.innerHTML=`âœ— Institution ID not found.`; idInput.classList.add('input-error'); return; }
  resultEl.classList.add('success'); resultEl.innerHTML=`âœ“ Verified: <strong style="color:#fff;">${inst.name}</strong>`;
  staffInstitutionId = inst.id; staffInstitutionName = inst.name;
  setTimeout(() => showStaffStep(2), 900);
});

// Step 2 â†’ 3
document.getElementById('staff-step2-back').addEventListener('click', () => showStaffStep(1));
document.getElementById('staff-step2-next').addEventListener('click', () => {
  if (!requiredFields(['staff-full-name','staff-id','staff-designation','staff-qualification','staff-phone','staff-experience'])) { shake(document.getElementById('staff-step-2')); return; }
  document.getElementById('staff-inst-confirmed').innerHTML = `âœ“ ${staffInstitutionName} <span style="opacity:.6;margin-left:6px;">${staffInstitutionId}</span>`;
  showStaffStep(3);
});

// Step 3 â†’ 4
document.getElementById('staff-step3-back').addEventListener('click', () => showStaffStep(2));
document.getElementById('staff-step3-next').addEventListener('click', () => {
  if (!requiredFields(['staff-email','staff-password'])) { shake(document.getElementById('staff-step-3')); return; }
  populateSelect('staff-dept', DEPARTMENTS, '-- Select Your Department --');
  showStaffStep(4);
});

// Step 4 â†’ 5  (department â†’ subjects)
document.getElementById('staff-dept').addEventListener('change', function() {
  const subjects = SUBJECTS_BY_DEPT[this.value] || [];
  populateCheckboxGrid('staff-subject-checkboxes', subjects, 'staff-subject');
  populateSelect('staff-subject-session', subjects, '-- Select Subject for Today --');
});
document.getElementById('staff-step4-back').addEventListener('click', () => showStaffStep(3));
document.getElementById('staff-step4-next').addEventListener('click', () => {
  if (!document.getElementById('staff-dept').value) { document.getElementById('staff-dept').classList.add('input-error'); shake(document.getElementById('staff-step-4')); return; }
  staffSelectedSubjects = [...document.querySelectorAll('#staff-subject-checkboxes input:checked')].map(c=>c.value);
  showStaffStep(5);
});

// Step 5 â†’ submit (register + redirect)
document.getElementById('staff-step5-back').addEventListener('click', () => showStaffStep(4));
document.getElementById('staff-submit').addEventListener('click', () => {
  const selectedYears    = [...document.querySelectorAll('input[name="staff-year-cb"]:checked')].map(c=>c.value);
  const selectedSections = [...document.querySelectorAll('input[name="staff-section-cb"]:checked')].map(c=>c.value);
  let valid = true;
  if (!selectedYears.length) { document.getElementById('staff-year-checkboxes').style.outline='2px solid #f87171'; valid=false; } else { document.getElementById('staff-year-checkboxes').style.outline=''; }
  if (!selectedSections.length) { document.getElementById('staff-section-checkboxes').style.outline='2px solid #f87171'; valid=false; } else { document.getElementById('staff-section-checkboxes').style.outline=''; }
  if (!requiredFields(['staff-active-year','staff-active-section','staff-subject-session'])) valid=false;
  if (!valid) { shake(document.getElementById('staff-step-5')); return; }

  const profile = {
    institutionId: staffInstitutionId, institutionName: staffInstitutionName,
    fullName:     document.getElementById('staff-full-name').value,
    staffId:      document.getElementById('staff-id').value,
    designation:  document.getElementById('staff-designation').value,
    qualification:document.getElementById('staff-qualification').value,
    phone:        document.getElementById('staff-phone').value,
    experience:   document.getElementById('staff-experience').value,
    email:        document.getElementById('staff-email').value,
    password:     document.getElementById('staff-password').value,
    dept:         document.getElementById('staff-dept').value,
    years: selectedYears, sections: selectedSections, subjects: staffSelectedSubjects,
  };
  const result = registerStaff(profile);
  if (result.error) { alert(result.error); return; }

  saveAndRedirect('staff', {
    ...profile,
    year:    document.getElementById('staff-active-year').value,
    section: document.getElementById('staff-active-section').value,
    subject: document.getElementById('staff-subject-session').value,
  }, '/teacher-portal');
});

// =============================================
//  STAFF LOGIN (single form)
// =============================================

function resetStaffLogin() {
  const f = document.getElementById('sl-form');
  if(f) f.reset();
  const r = document.getElementById('sl-result');
  if(r) r.classList.add('hidden');
}

document.getElementById('sl-login-btn').addEventListener('click', () => {
  if (!requiredFields(['sl-inst-id','sl-staff-id','sl-password'])) { shake(document.getElementById('sl-form')); return; }
  const resultEl = document.getElementById('sl-result');
  resultEl.classList.remove('hidden','success','error');

  const instId = document.getElementById('sl-inst-id').value.toUpperCase().trim();
  const inst = findInstitution(instId);
  if (!inst) { resultEl.classList.add('error'); resultEl.innerHTML='âœ— Institution ID not found.'; document.getElementById('sl-inst-id').classList.add('input-error'); return; }

  const staff = findStaff(instId, document.getElementById('sl-staff-id').value, document.getElementById('sl-password').value);
  if (!staff) {
    resultEl.classList.add('error');
    resultEl.innerHTML='âœ— Staff ID or password incorrect. Not registered? Use New Registration.';
    shake(document.getElementById('sl-form')); return;
  }
  
  resultEl.classList.add('success');
  resultEl.innerHTML = `âœ“ Welcome back, <strong style="color:#fff;">${staff.fullName}</strong>!`;
  
  setTimeout(() => saveAndRedirect('staff', staff, '/teacher-portal'), 700);
});

// =============================================
//  STUDENT REGISTER/LOGIN TABS
// =============================================

function switchStudentTab(tab) {
  const regSec = document.getElementById('stu-register-section');
  const logSec = document.getElementById('stu-login-section');
  const tReg   = document.getElementById('stu-tab-register');
  const tLog   = document.getElementById('stu-tab-login');
  if (tab === 'register') {
    regSec.classList.remove('hidden'); logSec.classList.add('hidden');
    tReg.classList.add('active'); tLog.classList.remove('active');
  } else {
    logSec.classList.remove('hidden'); regSec.classList.add('hidden');
    tLog.classList.add('active'); tReg.classList.remove('active');
  }
}
document.getElementById('stu-tab-register').addEventListener('click', () => switchStudentTab('register'));
document.getElementById('stu-tab-login').addEventListener('click',    () => switchStudentTab('login'));

// =============================================
//  STUDENT REGISTRATION (3 steps)
// =============================================

let stuInstitutionId = null, stuInstitutionName = null;

function resetStudent() { stuInstitutionId=null; stuInstitutionName=null; showStudentStep(1); }

function showStudentStep(n) {
  document.querySelectorAll('.student-step').forEach(el => el.classList.add('hidden'));
  const el = document.getElementById(`student-step-${n}`);
  if (el) el.classList.remove('hidden');
  updateStepDots('student-steps', n);
}

document.getElementById('stu-verify-inst').addEventListener('click', () => {
  const idInput = document.getElementById('stu-inst-id');
  const resultEl = document.getElementById('stu-inst-result');
  idInput.classList.remove('input-error');
  if (!idInput.value.trim()) { idInput.classList.add('input-error'); shake(document.getElementById('student-step-1')); return; }
  const inst = findInstitution(idInput.value.trim());
  resultEl.classList.remove('hidden','success','error');
  if (!inst) { resultEl.classList.add('error'); resultEl.innerHTML='âœ— Institution ID not found.'; idInput.classList.add('input-error'); return; }
  resultEl.classList.add('success'); resultEl.innerHTML=`âœ“ Verified: <strong style="color:#fff;">${inst.name}</strong>`;
  stuInstitutionId=inst.id; stuInstitutionName=inst.name;
  setTimeout(()=>showStudentStep(2), 900);
});

document.getElementById('stu-step2-back').addEventListener('click', () => showStudentStep(1));
document.getElementById('stu-step2-next').addEventListener('click', () => {
  if (!requiredFields(['stu-name','stu-roll','stu-email','stu-password'])) { shake(document.getElementById('student-step-2')); return; }
  document.getElementById('stu-inst-confirmed').innerHTML = `âœ“ ${stuInstitutionName}`;
  populateSelect('stu-dept', DEPARTMENTS, '-- Select Your Department --');
  showStudentStep(3);
});

document.getElementById('stu-step3-back').addEventListener('click', () => showStudentStep(2));
document.getElementById('student-submit').addEventListener('click', () => {
  if (!requiredFields(['stu-dept','stu-year','stu-section'])) { shake(document.getElementById('student-step-3')); return; }
  const profile = {
    institutionId:   stuInstitutionId,
    institutionName: stuInstitutionName,
    fullName: document.getElementById('stu-name').value,
    roll:     document.getElementById('stu-roll').value,
    email:    document.getElementById('stu-email').value,
    password: document.getElementById('stu-password').value,
    dept:     document.getElementById('stu-dept').value,
    year:     document.getElementById('stu-year').value,
    section:  document.getElementById('stu-section').value,
  };
  const result = registerStudent(profile);
  if (result.error) { alert(result.error); return; }
  saveAndRedirect('student', profile, '/student-portal');
});

// =============================================
//  STUDENT LOGIN (single form)
// =============================================

document.getElementById('sli-login-btn').addEventListener('click', () => {
  if (!requiredFields(['sli-inst-id','sli-roll','sli-password'])) { shake(document.getElementById('stu-login-form')); return; }
  const resultEl = document.getElementById('sli-result');
  resultEl.classList.remove('hidden','success','error');

  const instId = document.getElementById('sli-inst-id').value.toUpperCase().trim();
  const inst   = findInstitution(instId);
  if (!inst) { resultEl.classList.add('error'); resultEl.innerHTML='âœ— Institution ID not found.'; document.getElementById('sli-inst-id').classList.add('input-error'); return; }

  const student = findStudent(instId, document.getElementById('sli-roll').value, document.getElementById('sli-password').value);
  if (!student) {
    resultEl.classList.add('error');
    resultEl.innerHTML='âœ— Roll number or password is incorrect. Not registered? Use New Registration.';
    shake(document.getElementById('stu-login-form')); return;
  }
  resultEl.classList.add('success');
  resultEl.innerHTML = `âœ“ Welcome back, <strong style="color:#fff;">${student.fullName || student.roll}</strong>!`;
  setTimeout(() => saveAndRedirect('student', student, '/student-portal'), 700);
});

// =============================================
//  SESSION SAVE + REDIRECT
// =============================================

function saveAndRedirect(role, data, dest) {
  localStorage.setItem('sccs_session', JSON.stringify({ role, ...data }));
  localStorage.removeItem('sccs_session_start');
  const colors = {institution:'#f59e0b', staff:'#7c3aed', student:'#06b6d4'};
  const icons  = {
    institution:`<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 21h18M3 7l9-4 9 4M4 7v14M20 7v14M9 21V11h6v10"/></svg>`,
    staff:`<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>`,
    student:`<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>`,
  };
  const labels = {institution:'Opening Admin Panelâ€¦', staff:'Opening Teacher Dashboardâ€¦', student:'Opening Student Portalâ€¦'};
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;background:#05050f;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:20px;';
  overlay.innerHTML = `
    <div style="width:72px;height:72px;border-radius:50%;background:${colors[role]};display:flex;align-items:center;justify-content:center;color:#fff;animation:successPop .5s cubic-bezier(.34,1.56,.64,1) both;">${icons[role]}</div>
    <div style="font-family:'Space Grotesk',sans-serif;font-size:1.4rem;font-weight:700;color:#f4f4ff;">Login Successful!</div>
    <div style="color:#a0a0c0;font-size:.9rem;">${labels[role]}</div>
    <div style="width:220px;height:4px;background:rgba(255,255,255,.07);border-radius:99px;overflow:hidden;">
      <div id="rdr-bar" style="height:100%;width:0%;background:${colors[role]};border-radius:99px;transition:width 1.4s ease;"></div>
    </div>`;
  document.body.appendChild(overlay);
  requestAnimationFrame(() => { document.getElementById('rdr-bar').style.width='100%'; });
  setTimeout(() => { window.location.href = dest; }, 1500);
}

// =============================================
//  INIT + HASH ROUTING
// =============================================

function routeByHash() {
  const hash = window.location.hash.replace('#','');
  if (hash === 'institution') { showPage('page-institution'); switchTab('login'); }
  else if (hash === 'staff')   { showPage('page-staff'); switchStaffTab('login'); }
  else if (hash === 'student') { showPage('page-student'); switchStudentTab('login'); }
  else showPage('page-role');
}
window.addEventListener('hashchange', routeByHash);

function initDropdowns() {
  ['staff-dept','stu-dept'].forEach(id => populateSelect(id, DEPARTMENTS, '-- Select Department --'));
}

function init() {
  initDropdowns();
  routeByHash();
}
init();

