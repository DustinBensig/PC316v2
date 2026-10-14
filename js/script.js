/* =====================================================================
   EnrollEase - script.js
   Every HTML page is an empty shell: <body data-page="login">.
   This file looks at data-page and draws that page's content.

   HOW TO EDIT:
   - Change appointment types / time slots in section 1.
   - Each page lives in section 6 as PAGES.<name> with two functions:
       render() -> returns the page's HTML
       setup()  -> attaches button clicks and form logic after drawing
   - All data is saved in the browser (localStorage). Nothing leaves it.
   ===================================================================== */


/* ---------- 1. SETTINGS ---------- */
const APPOINTMENT_TYPES = [
  'Enrollment Assistance', 'Document Submission', 'Payment / Cashier',
  'Subject Advising', 'Records Request'
];
const TIME_SLOTS = [
  '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM',
  '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM'
];
const PAGES_WITHOUT_LOGIN = ['index', 'login', 'register'];
const currentPage = document.body.dataset.page;


/* ---------- 2. SAVING AND LOADING DATA ---------- */
function loadData(key, fallback) {
  try {
    const text = localStorage.getItem(key);
    return text ? JSON.parse(text) : fallback;
  } catch (error) {
    return fallback;
  }
}
function saveData(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

// A demo account so you can log in right away.
if (!loadData('ee_users')) {
  saveData('ee_users', [{
    name: 'Juan Dela Cruz', sid: '2024-00123', email: 'juan@student.edu',
    password: 'demo1234', contact: '0917 123 4567',
    program: 'BS Information Technology', year: '2nd Year', enrolled: '2024-06-10'
  }]);
}
// Dark / light mode
document.documentElement.dataset.theme = loadData('ee_theme', 'light');

function allUsers()        { return loadData('ee_users', []); }
function allAppointments() { return loadData('ee_appointments', []); }
function currentUser()     { return allUsers().find(u => u.sid === loadData('ee_session')); }
function myAppointments()  { return allAppointments().filter(a => a.sid === loadData('ee_session')); }


/* ---------- 3. SMALL HELPERS ---------- */
const select = css => document.querySelector(css);

function goTo(pageName) { location.href = pageName + '.html'; }

// Show a message on the next page (used after login/logout redirects).
function flashMessage(text) { sessionStorage.setItem('ee_flash', text); }

// Today as "YYYY-MM-DD" (the format of <input type="date">).
function todayString() {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 10);
}

// "2026-10-14" -> "Wed, Oct 14, 2026"
function formatDate(dateString) {
  return new Date(dateString + 'T00:00').toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
  });
}

// Real Date object of an appointment (needed to know if it is in the past).
function appointmentDateTime(appt) {
  const hour12 = parseInt(appt.time.slice(0, 2), 10) % 12;
  const hour24 = hour12 + (appt.time.endsWith('PM') ? 12 : 0);
  const minutes = appt.time.slice(3, 5);
  return new Date(appt.date + 'T' + String(hour24).padStart(2, '0') + ':' + minutes + ':00');
}

function isPast(appt) {
  return appt.status === 'Completed' || appointmentDateTime(appt) < new Date();
}

// Stops user text from being treated as HTML.
function escapeHtml(text) {
  return String(text).replace(/[&<>"]/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

// Small message in the top-right corner.
function showToast(message, isError) {
  const toast = document.createElement('div');
  toast.className = 'toast' + (isError ? ' e' : '');
  toast.textContent = message;
  document.body.append(toast);
  setTimeout(() => toast.remove(), 3200);
}

// Pop-up window. Returns the element so you can attach buttons inside it.
function showModal(html) {
  const overlay = document.createElement('div');
  overlay.className = 'modal';
  overlay.innerHTML = '<div class="card">' + html + '</div>';
  overlay.onclick = event => { if (event.target === overlay) overlay.remove(); };
  document.body.append(overlay);
  return overlay;
}

function logout() {
  localStorage.removeItem('ee_session');
  flashMessage('You have been logged out.');
  goTo('login');
}


/* ---------- 4. FORM HELPERS ---------- */
// A label + input + empty red error line.
function inputField(id, label, type = 'text', value = '', extra = '') {
  return `
    <label for="${id}">${label}</label>
    <input id="${id}" type="${type}" value="${escapeHtml(value)}" ${extra}>
    <div class="err" id="error-${id}"></div>`;
}

// Put a red message under a field. Always returns false (= "not valid").
function showError(fieldId, message) {
  select('#error-' + fieldId).textContent = message;
  return false;
}

function clearErrors() {
  document.querySelectorAll('.err').forEach(e => e.textContent = '');
}

// Label/value list used on summary, details and enrollment pages.
function detailsList(items) {
  const rows = Object.entries(items)
    .map(([label, value]) => `<dt>${label}</dt><dd>${escapeHtml(value)}</dd>`)
    .join('');
  return '<dl>' + rows + '</dl>';
}


/* ---------- 5. APPOINTMENT LOGIC ---------- */
// Give a new account two past appointments so "Past" isn't empty.
function addDemoPastAppointments(sid) {
  const list = allAppointments();
  if (list.some(a => a.sid === sid)) return;

  const daysAgo = n => {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d.toISOString().slice(0, 10);
  };
  list.push(
    { id: 'demo1-' + sid, sid, type: 'Enrollment Assistance', date: daysAgo(21), time: '09:00 AM', queue: 'Q-004', status: 'Completed' },
    { id: 'demo2-' + sid, sid, type: 'Document Submission',   date: daysAgo(9),  time: '02:00 PM', queue: 'Q-011', status: 'Completed' }
  );
  saveData('ee_appointments', list);
}

// A slot is unavailable if it already passed, is "busy" (simulated),
// or is already booked. ignoreId lets a reschedule skip its own slot.
function isSlotUnavailable(date, time, ignoreId) {
  if (date === todayString() && appointmentDateTime({ date, time }) < new Date()) return true;

  // Simulated: roughly 1 in 4 slots is busy, always the same for the same slot.
  let score = 0;
  for (const letter of date + time) score += letter.charCodeAt(0) * 7;
  if (score % 4 === 0) return true;

  return allAppointments().some(a =>
    a.date === date && a.time === time && a.status !== 'Cancelled' && a.id !== ignoreId);
}

// Queue numbers count up per day: Q-001, Q-002, ...
function nextQueueNumber(date) {
  const countThatDay = allAppointments().filter(a => a.date === date).length;
  return 'Q-' + String(countThatDay + 1).padStart(3, '0');
}

// Used by both Book and Reschedule pages: draws the time buttons
// when a date is chosen and reports the choice via onChange(date, time).
function setupTimePicker(ignoreId, onChange) {
  const dateInput = select('#date');
  const slotBox = select('#slots');
  dateInput.min = todayString();

  function drawSlots() {
    onChange(null, null);                       // clear any earlier choice
    const date = dateInput.value;

    if (!date) {
      slotBox.innerHTML = '<p class="muted">Pick a date to see available times.</p>';
      return;
    }
    const weekday = new Date(date + 'T00:00').getDay();   // 0 = Sunday, 6 = Saturday
    if (date < todayString() || weekday === 0 || weekday === 6) {
      slotBox.innerHTML = '<p class="err">Appointments are Monday to Friday, from today onward.</p>';
      return;
    }

    slotBox.innerHTML = TIME_SLOTS.map(time => {
      const off = isSlotUnavailable(date, time, ignoreId);
      return `<button type="button" class="slot ${off ? 'off' : ''}" data-time="${time}" ${off ? 'disabled' : ''}>
                ${time}<small>${off ? 'Unavailable' : 'Available'}</small></button>`;
    }).join('');

    slotBox.querySelectorAll('.slot:not(.off)').forEach(button => {
      button.onclick = () => {
        slotBox.querySelectorAll('.slot').forEach(b => b.classList.remove('sel'));
        button.classList.add('sel');
        onChange(date, button.dataset.time);
      };
    });
  }
  dateInput.onchange = drawSlots;
  drawSlots();
}


/* ---------- 6. LAYOUT (sidebar + page content) ---------- */
const MENU = [
  ['dashboard', '🏠', 'Dashboard'],
  ['book-appointment', '📅', 'Book Appointment'],
  ['my-schedule', '🗓️', 'My Schedule'],
  ['enrollment', '🎓', 'Enrollment Details'],
  ['profile', '👤', 'Profile'],
  ['settings', '⚙️', 'Settings']
];
// Which menu item stays highlighted on sub-pages.
const HIGHLIGHT = {
  'appointment-summary': 'book-appointment', 'confirmation': 'book-appointment',
  'reschedule': 'my-schedule', 'reschedule-confirmation': 'my-schedule'
};

function withSidebar(content) {
  const active = HIGHLIGHT[currentPage] || currentPage;
  const links = MENU.map(([page, icon, label]) =>
    `<a href="${page}.html" class="${page === active ? 'on' : ''}">${icon} ${label}</a>`).join('');

  return `
    <div class="shell">
      <aside class="side" id="sidebar">
        <div class="logo">Enroll<span>Ease</span></div>
        ${links}
        <a href="#" id="sidebarLogout">🚪 Logout</a>
      </aside>
      <main class="main">
        <div class="top">
          <button class="burger" id="menuButton" aria-label="Menu">☰</button>
          <b class="logo">EnrollEase</b>
        </div>
        ${content}
      </main>
    </div>`;
}


/* ---------- 7. THE PAGES ---------- */
const PAGES = {};

/* 1. Landing */
PAGES.index = {
  render: () => `
    <div class="hero"><div class="card">
      <svg width="120" height="110" viewBox="0 0 120 110" aria-hidden="true">
        <rect x="14" y="26" width="92" height="76" rx="12" fill="#dbeafe" stroke="#1d4ed8" stroke-width="4"/>
        <rect x="14" y="26" width="92" height="22" rx="12" fill="#1d4ed8"/>
        <path d="M60 4 22 18l38 14 38-14z" fill="#3b82f6"/>
        <circle cx="40" cy="70" r="7" fill="#1d4ed8"/><circle cx="60" cy="70" r="7" fill="#93c5fd"/>
        <circle cx="80" cy="70" r="7" fill="#93c5fd"/>
        <path d="m34 90 6 6 12-12" stroke="#16a34a" stroke-width="5" fill="none"/>
      </svg>
      <div class="logo">Enroll<span>Ease</span></div>
      <h2>Smarter Enrollment. Brighter Future.</h2>
      <p>Welcome! Book your enrollment appointment, get your queue number, and skip the long lines.</p>
      <a class="btn" href="register.html">Get Started</a>
      <p>Already have an account? <a href="login.html">Login</a></p>
    </div></div>`
};

/* 2. Login */
PAGES.login = {
  render: () => `
    <div class="auth"><form class="card" id="loginForm" novalidate>
      <div class="logo center">Enroll<span>Ease</span></div>
      <h2 class="center">Welcome back</h2>
      <p class="muted center">Demo: 2024-00123 / demo1234</p>
      ${inputField('loginId', 'Email Address or Student ID')}
      ${inputField('loginPassword', 'Password', 'password')}
      <a href="#" id="forgotLink">Forgot password?</a><br><br>
      <button class="btn" style="width:100%">Login</button>
      <p class="center">No account yet? <a href="register.html">Register</a></p>
      <p class="center admin-login-option">Are you an administrator? <a href="admin-login/admin-login.html">Admin sign in</a></p>
    </form></div>`,

  setup() {
    select('#loginForm').onsubmit = event => {
      event.preventDefault();
      clearErrors();
      const typedId = select('#loginId').value.trim();
      const typedPassword = select('#loginPassword').value;

      let valid = true;
      if (!typedId) valid = showError('loginId', 'Enter your email or student ID.');
      if (!typedPassword) valid = showError('loginPassword', 'Enter your password.');
      if (!valid) return;

      const user = allUsers().find(u =>
        u.email.toLowerCase() === typedId.toLowerCase() || u.sid === typedId);
      if (!user) return showError('loginId', 'No account found for that email or student ID.');
      if (user.password !== typedPassword) return showError('loginPassword', 'Incorrect password. Try again.');

      saveData('ee_session', user.sid);
      addDemoPastAppointments(user.sid);
      flashMessage('Welcome back, ' + user.name.split(' ')[0] + '!');
      goTo('dashboard');
    };

    select('#forgotLink').onclick = event => {
      event.preventDefault();
      const popup = showModal(`
        <h3>Reset password</h3>
        <p class="muted">Enter your email and we'll send reset instructions.</p>
        ${inputField('resetEmail', 'Email Address', 'email')}
        <button class="btn" id="sendReset">Send link</button>`);
      popup.querySelector('#sendReset').onclick = () => {
        const email = popup.querySelector('#resetEmail').value.trim();
        if (!/^\S+@\S+\.\S+$/.test(email)) return showError('resetEmail', 'Enter a valid email address.');
        popup.remove();
        showToast('Reset link sent to ' + email);
      };
    };
  }
};

/* 3. Register */
PAGES.register = {
  render: () => `
    <div class="auth"><form class="card" id="registerForm" novalidate>
      <div class="logo center">Enroll<span>Ease</span></div>
      <h2 class="center">Create Account</h2>
      ${inputField('regName', 'Full Name')}
      ${inputField('regSid', 'Student ID', 'text', '', 'placeholder="2024-00000"')}
      ${inputField('regEmail', 'Email Address', 'email')}
      ${inputField('regPassword', 'Password', 'password')}
      ${inputField('regConfirm', 'Confirm Password', 'password')}
      <button class="btn" style="width:100%">Create Account</button>
      <p class="center">Have an account? <a href="login.html">Login</a></p>
    </form></div>`,

  setup() {
    select('#registerForm').onsubmit = event => {
      event.preventDefault();
      clearErrors();
      const name = select('#regName').value.trim();
      const sid = select('#regSid').value.trim();
      const email = select('#regEmail').value.trim();
      const password = select('#regPassword').value;
      const confirm = select('#regConfirm').value;
      const users = allUsers();

      let valid = true;
      if (name.length < 3) valid = showError('regName', 'Enter your full name.');
      if (!/^[\w-]{5,}$/.test(sid)) valid = showError('regSid', 'Student ID needs at least 5 letters, numbers or dashes.');
      else if (users.some(u => u.sid === sid)) valid = showError('regSid', 'This Student ID is already registered.');
      if (!/^\S+@\S+\.\S+$/.test(email)) valid = showError('regEmail', 'Enter a valid email address.');
      else if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) valid = showError('regEmail', 'This email is already registered.');
      if (password.length < 8) valid = showError('regPassword', 'Password must be at least 8 characters.');
      if (confirm !== password) valid = showError('regConfirm', 'Passwords do not match.');
      if (!valid) return;

      users.push({
        name, sid, email, password, contact: '',
        program: 'BS Information Technology', year: '1st Year', enrolled: todayString()
      });
      saveData('ee_users', users);
      addDemoPastAppointments(sid);
      flashMessage('Account created! Please log in.');
      goTo('login');
    };
  }
};

/* 4. Dashboard */
PAGES.dashboard = {
  render() {
    const user = currentUser();
    const next = myAppointments()
      .filter(a => !isPast(a) && a.status !== 'Cancelled')
      .sort((a, b) => appointmentDateTime(a) - appointmentDateTime(b))[0];

    const tile = (href, icon, title, extra = '') =>
      `<a class="card tile" href="${href}"><div class="ic">${icon}</div><b>${title}</b>${extra}</a>`;

    return withSidebar(`
      <div class="banner">
        <p style="margin:0;opacity:.85">Welcome back,</p>
        <h1>${escapeHtml(user.name)}</h1>
        <p style="margin:0">${next
          ? 'Next appointment: ' + formatDate(next.date) + ' at ' + next.time + ' (' + next.type + ')'
          : 'You have no upcoming appointments.'}</p>
      </div>
      <div class="grid">
        ${tile('book-appointment.html', '📅', 'Book Appointment', '<p class="muted">Reserve a time slot</p>')}
        ${tile('my-schedule.html', '🗓️', 'My Schedule', '<p class="muted">Upcoming and past</p>')}
        ${tile('my-schedule.html', '🎟️', 'Queue Number',
               next ? `<div class="q">${next.queue}</div>` : '<p class="muted">No active queue</p>')}
        ${tile('enrollment.html', '🎓', 'Enrollment Details', '<p class="muted">Status and records</p>')}
        ${tile('profile.html', '👤', 'Profile', '<p class="muted">Your information</p>')}
        ${tile('settings.html', '⚙️', 'Settings', '<p class="muted">Preferences</p>')}
        <a class="card tile" href="#" id="dashboardLogout"><div class="ic">🚪</div><b>Logout</b></a>
      </div>`);
  },
  setup() {
    select('#dashboardLogout').onclick = event => { event.preventDefault(); logout(); };
  }
};

/* 5. Book appointment */
PAGES['book-appointment'] = {
  render: () => withSidebar(`
    <h1>Book Appointment</h1>
    <div class="card">
      <label for="type">Appointment type</label>
      <select id="type">${APPOINTMENT_TYPES.map(t => `<option>${t}</option>`).join('')}</select>
      <label for="date">Appointment date</label>
      <input type="date" id="date">
      <label>Available times</label>
      <div id="slots"></div>
      <div class="err" id="error-book"></div>
      <button class="btn" id="continueButton" disabled>Continue</button>
    </div>`),

  setup() {
    let chosenDate = null, chosenTime = null;
    setupTimePicker(null, (date, time) => {
      chosenDate = date;
      chosenTime = time;
      select('#continueButton').disabled = !time;
    });

    select('#continueButton').onclick = () => {
      if (!chosenDate || !chosenTime) return showError('book', 'Select a date and an available time.');
      // Keep the choice temporarily until the user confirms on the next page.
      sessionStorage.setItem('ee_draft', JSON.stringify({
        type: select('#type').value, date: chosenDate, time: chosenTime
      }));
      goTo('appointment-summary');
    };
  }
};

/* 6. Appointment summary */
PAGES['appointment-summary'] = {
  render() {
    const draft = JSON.parse(sessionStorage.getItem('ee_draft') || 'null');
    if (!draft) { goTo('book-appointment'); return ''; }

    return withSidebar(`
      <h1>Appointment Summary</h1>
      <div class="card">
        ${detailsList({
          'Appointment type': draft.type, 'Date': formatDate(draft.date),
          'Time': draft.time, 'Queue number': nextQueueNumber(draft.date)
        })}
        <h3 class="sec">Important instructions</h3>
        <ul class="muted">
          <li>Arrive 15 minutes before your time.</li>
          <li>Bring a valid school ID and printed requirements.</li>
          <li>Show your queue number at the registrar's desk.</li>
          <li>Missed slots may be released to other students.</li>
        </ul>
        <div class="row">
          <button class="btn alt" id="backButton">Back</button>
          <button class="btn" id="confirmButton">Confirm Appointment</button>
        </div>
      </div>`);
  },

  setup() {
    const draft = JSON.parse(sessionStorage.getItem('ee_draft'));
    select('#backButton').onclick = () => goTo('book-appointment');

    select('#confirmButton').onclick = () => {
      // Check again in case the slot was taken meanwhile.
      if (isSlotUnavailable(draft.date, draft.time)) {
        showToast('That slot was just taken. Choose another.', true);
        return setTimeout(() => goTo('book-appointment'), 1200);
      }
      const appointment = {
        id: 'a' + Date.now(), sid: loadData('ee_session'),
        type: draft.type, date: draft.date, time: draft.time,
        queue: nextQueueNumber(draft.date), status: 'Confirmed'
      };
      saveData('ee_appointments', allAppointments().concat(appointment));
      saveData('ee_last', appointment.id);          // so the next page can show it
      sessionStorage.removeItem('ee_draft');
      goTo('confirmation');
    };
  }
};

// The most recently booked/rescheduled appointment.
function lastAppointment() {
  return allAppointments().find(a => a.id === loadData('ee_last'));
}

/* 7. Confirmation */
PAGES.confirmation = {
  render() {
    const appt = lastAppointment();
    if (!appt) { goTo('dashboard'); return ''; }
    return withSidebar(`
      <div class="card big">
        <div class="check">✓</div>
        <h1>Appointment Confirmed!</h1>
        ${detailsList({ 'Date': formatDate(appt.date), 'Time': appt.time, 'Queue number': appt.queue })}
        <a class="btn" href="dashboard.html">Back to Dashboard</a>
      </div>`);
  }
};

/* 8. My schedule */
PAGES['my-schedule'] = {
  render() {
    const active = myAppointments().filter(a => a.status !== 'Cancelled');
    const upcoming = active.filter(a => !isPast(a)).sort((a, b) => appointmentDateTime(a) - appointmentDateTime(b));
    const past = active.filter(isPast).sort((a, b) => appointmentDateTime(b) - appointmentDateTime(a));

    const card = (appt, isUpcoming) => `
      <div class="card ap">
        <div>
          <b>${appt.type}</b>
          <div class="muted">${formatDate(appt.date)} · ${appt.time}${isUpcoming ? ' · Queue ' + appt.queue : ''}</div>
        </div>
        <span class="badge ${isUpcoming ? (appt.status === 'Rescheduled' ? 'p' : '') : 'd'}">
          ${isUpcoming ? appt.status : 'Completed'}</span>
        ${isUpcoming ? `<div class="row">
          <button class="btn sm alt" data-details="${appt.id}">View Details</button>
          <button class="btn sm" data-reschedule="${appt.id}">Reschedule</button></div>` : ''}
      </div>`;

    return withSidebar(`
      <h1>My Schedule</h1>
      <h2>Upcoming Appointments</h2>
      ${upcoming.map(a => card(a, true)).join('') ||
        '<div class="card muted">Nothing booked yet. <a href="book-appointment.html">Book an appointment</a></div>'}
      <h2 class="sec">Past Appointments</h2>
      ${past.map(a => card(a, false)).join('') || '<div class="card muted">No past appointments.</div>'}`);
  },

  setup() {
    document.querySelectorAll('[data-details]').forEach(button => {
      button.onclick = () => {
        const appt = allAppointments().find(a => a.id === button.dataset.details);
        const popup = showModal(`
          <h3>Appointment Details</h3>
          ${detailsList({ 'Type': appt.type, 'Date': formatDate(appt.date), 'Time': appt.time,
                          'Queue number': appt.queue, 'Status': appt.status })}
          <br><button class="btn" id="closeDetails">Close</button>`);
        popup.querySelector('#closeDetails').onclick = () => popup.remove();
      };
    });

    document.querySelectorAll('[data-reschedule]').forEach(button => {
      button.onclick = () => {
        sessionStorage.setItem('ee_reschedule_id', button.dataset.reschedule);
        goTo('reschedule');
      };
    });
  }
};

/* 9. Reschedule */
PAGES.reschedule = {
  render() {
    const appt = allAppointments().find(a => a.id === sessionStorage.getItem('ee_reschedule_id'));
    if (!appt) { goTo('my-schedule'); return ''; }

    return withSidebar(`
      <h1>Reschedule Appointment</h1>
      <div class="card">
        <h3>Current appointment</h3>
        ${detailsList({ 'Type': appt.type, 'Date': formatDate(appt.date),
                        'Time': appt.time, 'Queue number': appt.queue })}
      </div>
      <div class="card sec">
        <label for="date">New date</label>
        <input type="date" id="date">
        <label>New available time</label>
        <div id="slots"></div>
        <div class="row">
          <button class="btn alt" id="cancelButton">Cancel</button>
          <button class="btn" id="saveButton" disabled>Confirm New Schedule</button>
        </div>
      </div>`);
  },

  setup() {
    const id = sessionStorage.getItem('ee_reschedule_id');
    let newDate = null, newTime = null;

    setupTimePicker(id, (date, time) => {
      newDate = date;
      newTime = time;
      select('#saveButton').disabled = !time;
    });

    select('#cancelButton').onclick = () => {
      sessionStorage.removeItem('ee_reschedule_id');
      goTo('my-schedule');
    };

    select('#saveButton').onclick = () => {
      const list = allAppointments();
      const appt = list.find(a => a.id === id);
      appt.date = newDate;
      appt.time = newTime;
      appt.queue = nextQueueNumber(newDate);
      appt.status = 'Rescheduled';
      saveData('ee_appointments', list);
      saveData('ee_last', id);
      sessionStorage.removeItem('ee_reschedule_id');
      goTo('reschedule-confirmation');
    };
  }
};

/* 10. Reschedule confirmation */
PAGES['reschedule-confirmation'] = {
  render() {
    const appt = lastAppointment();
    if (!appt) { goTo('dashboard'); return ''; }
    return withSidebar(`
      <div class="card big">
        <div class="check">✓</div>
        <h1>Appointment Rescheduled!</h1>
        ${detailsList({ 'Updated date': formatDate(appt.date), 'Updated time': appt.time,
                        'Type': appt.type, 'Queue number': appt.queue })}
        <a class="btn" href="dashboard.html">Back to Dashboard</a>
      </div>`);
  }
};

/* 11. Enrollment details */
PAGES.enrollment = {
  render() {
    const user = currentUser();
    const startYear = new Date(user.enrolled + 'T00:00').getFullYear();
    return withSidebar(`
      <h1>Enrollment Details</h1>
      <div class="card">${detailsList({
        'Student ID': user.sid, 'Student Name': user.name, 'Program': user.program,
        'Year Level': user.year, 'Enrollment Status': 'Officially Enrolled',
        'Enrollment Date': formatDate(user.enrolled),
        'Academic Year': startYear + '–' + (startYear + 1)
      })}</div>`);
  }
};

/* 12. Profile */
PAGES.profile = {
  render() {
    const user = currentUser();
    return withSidebar(`
      <h1>Profile</h1>
      <form class="card" id="profileForm">
        ${inputField('pName', 'Full Name', 'text', user.name, 'disabled')}
        ${inputField('pSid', 'Student ID', 'text', user.sid, 'disabled')}
        ${inputField('pEmail', 'Email', 'email', user.email, 'disabled')}
        ${inputField('pContact', 'Contact Number', 'tel', user.contact, 'disabled')}
        ${inputField('pProgram', 'Program', 'text', user.program, 'disabled')}
        ${inputField('pYear', 'Year Level', 'text', user.year, 'disabled')}
        <div class="row">
          <button type="button" class="btn alt" id="editButton">Edit Profile</button>
          <button class="btn" id="saveButton" disabled>Save Changes</button>
        </div>
      </form>`);
  },

  setup() {
    // Student ID can never be edited.
    const editableIds = ['pName', 'pEmail', 'pContact', 'pProgram', 'pYear'];
    const setEditing = on => {
      editableIds.forEach(id => select('#' + id).disabled = !on);
      select('#saveButton').disabled = !on;
    };

    select('#editButton').onclick = () => { setEditing(true); select('#pName').focus(); };

    select('#profileForm').onsubmit = event => {
      event.preventDefault();
      clearErrors();
      const value = id => select('#' + id).value.trim();

      let valid = true;
      if (value('pName').length < 3) valid = showError('pName', 'Enter your full name.');
      if (!/^\S+@\S+\.\S+$/.test(value('pEmail'))) valid = showError('pEmail', 'Enter a valid email.');
      if (value('pContact') && !/^[\d\s+-]{7,}$/.test(value('pContact'))) valid = showError('pContact', 'Enter a valid contact number.');
      if (!valid) return;

      const users = allUsers();
      const user = users.find(u => u.sid === loadData('ee_session'));
      user.name = value('pName');
      user.email = value('pEmail');
      user.contact = value('pContact');
      user.program = value('pProgram');
      user.year = value('pYear');
      saveData('ee_users', users);

      setEditing(false);
      showToast('Profile saved.');
    };
  }
};

/* 13. Settings */
PAGES.settings = {
  render() {
    const notify = loadData('ee_notifications', { email: 1, sms: 0, reminders: 1 });
    const user = currentUser();
    const toggle = (key, label) => `
      <div class="row sp" style="margin:10px 0">
        <span>${label}</span>
        <span class="sw"><input type="checkbox" data-notify="${key}" ${notify[key] ? 'checked' : ''}><i></i></span>
      </div>`;

    return withSidebar(`
      <h1>Settings</h1>
      <div class="card"><h3>Notifications</h3>
        ${toggle('email', 'Email notifications')}
        ${toggle('sms', 'SMS notifications')}
        ${toggle('reminders', 'Appointment reminders')}
      </div>
      <div class="card sec"><h3>Appearance</h3>
        <div class="row sp"><span>Dark mode</span>
          <span class="sw"><input type="checkbox" id="darkToggle" ${loadData('ee_theme') === 'dark' ? 'checked' : ''}><i></i></span>
        </div>
      </div>
      <div class="card sec"><h3>Account</h3>
        ${detailsList({ 'Name': user.name, 'Student ID': user.sid, 'Email': user.email })}
      </div>
      <form class="card sec" id="passwordForm"><h3>Change password</h3>
        ${inputField('oldPassword', 'Current password', 'password')}
        ${inputField('newPassword', 'New password', 'password')}
        ${inputField('confirmPassword', 'Confirm new password', 'password')}
        <button class="btn">Update Password</button>
      </form>
      <div class="sec"><button class="btn alt" id="settingsLogout">Logout</button></div>`);
  },

  setup() {
    document.querySelectorAll('[data-notify]').forEach(box => {
      box.onchange = () => {
        const notify = loadData('ee_notifications', {});
        notify[box.dataset.notify] = box.checked ? 1 : 0;
        saveData('ee_notifications', notify);
        showToast('Notification settings saved.');
      };
    });

    select('#darkToggle').onchange = event => {
      const theme = event.target.checked ? 'dark' : 'light';
      saveData('ee_theme', theme);
      document.documentElement.dataset.theme = theme;
    };

    select('#settingsLogout').onclick = logout;

    select('#passwordForm').onsubmit = event => {
      event.preventDefault();
      clearErrors();
      const users = allUsers();
      const user = users.find(u => u.sid === loadData('ee_session'));
      const newPassword = select('#newPassword').value;

      let valid = true;
      if (select('#oldPassword').value !== user.password) valid = showError('oldPassword', 'Current password is incorrect.');
      if (newPassword.length < 8) valid = showError('newPassword', 'Use at least 8 characters.');
      if (select('#confirmPassword').value !== newPassword) valid = showError('confirmPassword', 'Passwords do not match.');
      if (!valid) return;

      user.password = newPassword;
      saveData('ee_users', users);
      event.target.reset();
      showToast('Password updated.');
    };
  }
};


/* ---------- 8. START THE APP ---------- */
const loggedIn = Boolean(currentUser());
const needsLogin = !PAGES_WITHOUT_LOGIN.includes(currentPage);

if (needsLogin && !loggedIn) {
  flashMessage('Please log in to continue.');
  goTo('login');
} else if (loggedIn && (currentPage === 'login' || currentPage === 'register')) {
  goTo('dashboard');
} else {
  const page = PAGES[currentPage];
  const html = page.render();           // returns '' when it redirects away
  select('#app').innerHTML = html;
  if (html && page.setup) page.setup();

  // Sidebar buttons (only exist on logged-in pages)
  const menuButton = select('#menuButton');
  if (menuButton) menuButton.onclick = () => select('#sidebar').classList.toggle('open');
  const sidebarLogout = select('#sidebarLogout');
  if (sidebarLogout) sidebarLogout.onclick = event => { event.preventDefault(); logout(); };

  // Show a message left by the previous page
  const message = sessionStorage.getItem('ee_flash');
  if (message) {
    sessionStorage.removeItem('ee_flash');
    showToast(message);
  }
}
