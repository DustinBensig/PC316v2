() => {
  const DEFAULT_TYPE = "Registrar's Office (Document Evaluation & COR Release)";
  const PERIODS = [
    { name: 'Morning', time: '08:00 AM', label: '8:00 AM – 12:00 PM' },
    { name: 'Afternoon', time: '01:00 PM', label: '1:00 PM – 5:00 PM' }
  ];
  const ASSIGNED_WEEKS = {
    '1st Year': 1,
    '2nd Year': 2,
    '3rd Year': 3,
    '4th Year': 4,
    'Late Enrollee / Irregular': 5
  };
  const today = new Date();
  const state = {
    month: new Date(today.getFullYear(), today.getMonth(), 1),
    date: null,
    period: null
  };
  const byId = id => document.getElementById(id);
  const dateKey = date => [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0')
  ].join('-');
  const todayKey = dateKey(today);
  const FIRST_YEAR_FIRST_TERM_DOCUMENTS = [
    'Completed Enrollment Form',
    'Recent 2×2 ID Picture',
    'Student ID or valid government ID',
    'Certificate of Good Moral Character',
    'PSA Birth Certificate',
    'Previous semester grades / TOR (if applicable)',
    'Proof of payment / assessment slip'
  ];
  const CONTINUING_STUDENT_DOCUMENTS = [
    'Completed Enrollment Form',
    'Recent 2×2 ID Picture',
    'Student ID or valid government ID',
    'Clearance (department / clinic / guidance, as applicable)',
    'Previous semester grades / TOR (if applicable)',
    'Proof of payment / assessment slip'
  ];

  function readStored(key, fallback) {
    try {
      const value = localStorage.getItem(key);
      return value === null ? fallback : JSON.parse(value);
    } catch (error) {
      console.error(`Unable to read ${key} from browser storage.`, error);
      return fallback;
    }
  }

  function getCurrentUser() {
    const users = readStored('ee_users', []);
    const sessionId = readStored('ee_session', null);
    if (!Array.isArray(users) || !sessionId) return null;
    return users.find(user => user && user.sid === sessionId) || null;
  }

  function showError(message) {
    const error = byId('error-book');
    if (error) error.textContent = message;
  }

  function renderRequiredDocuments() {
    const container = byId('requiredDocuments');
    const year = byId('year').value;
    const term = byId('term').value;
    const documents = year && term
      ? year === '1st Year' && term === '1st Semester'
        ? FIRST_YEAR_FIRST_TERM_DOCUMENTS
        : CONTINUING_STUDENT_DOCUMENTS
      : null;

    container.replaceChildren();
    if (!documents) {
      const prompt = document.createElement('span');
      prompt.textContent = 'Select a year level and term to view required documents.';
      container.append(prompt);
      return;
    }

    documents.forEach(documentName => {
      const item = document.createElement('span');
      item.textContent = `✓ ${documentName}`;
      container.append(item);
    });
  }

  function bookedCount(date, periodName) {
    const appointments = readStored('ee_appointments', []);
    if (!Array.isArray(appointments)) return 0;
    return appointments.filter(appointment =>
      appointment.date === date &&
      appointment.status !== 'Cancelled' &&
      (appointment.period === periodName ||
        (!appointment.period && appointment.time === PERIODS.find(period => period.name === periodName).time))
    ).length;
  }

  function periodHasStarted(date, periodName) {
    if (date !== todayKey) return false;
    const time = PERIODS.find(period => period.name === periodName).time;
    const [clock, meridiem] = time.split(' ');
    const [hour, minute] = clock.split(':').map(Number);
    const hour24 = (hour % 12) + (meridiem === 'PM' ? 12 : 0);
    const start = new Date(`${date}T${String(hour24).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`);
    return start <= new Date();
  }

  function updateContinueButton() {
    byId('continue').disabled = !(
      state.date &&
      state.period &&
      byId('year').value &&
      byId('term').value &&
      byId('program').value
    );
  }

  function getDateWeek(dateValue) {
    const day = Number(dateValue.slice(-2));
    return Math.min(Math.ceil(day / 7), 5);
  }

  function renderCalendar() {
    const year = state.month.getFullYear();
    const month = state.month.getMonth();
    const assignedWeek = ASSIGNED_WEEKS[byId('year').value];
    byId('month').textContent = state.month.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric'
    });

    const firstWeekday = new Date(year, month, 1).getDay();
    const dayCount = new Date(year, month + 1, 0).getDate();
    const calendar = byId('calendar');
    calendar.innerHTML = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      .map(day => `<div class="weekday">${day}</div>`).join('');

    for (let blank = 0; blank < firstWeekday; blank += 1) {
      calendar.insertAdjacentHTML('beforeend', '<div class="calendar-empty"></div>');
    }

    for (let day = 1; day <= dayCount; day += 1) {
      const date = new Date(year, month, day);
      const value = dateKey(date);
      const weekday = date.getDay();
      const cohort = getDateWeek(value);
      const outsideAssignedWeek = assignedWeek !== undefined && cohort !== assignedWeek;
      const disabled = value < todayKey || weekday === 0 || weekday === 6 || outsideAssignedWeek;
      const selected = value === state.date;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `day week${cohort}${weekday === 0 || weekday === 6 ? ' weekend' : ''}${selected ? ' selected' : ''}`;
      button.textContent = String(day);
      button.disabled = disabled;
      button.setAttribute('aria-label', date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      }) + (outsideAssignedWeek ? ', outside your assigned enrollment week' : ''));
      if (!disabled) {
        button.addEventListener('click', () => {
          state.date = value;
          state.period = null;
          showError('');
          renderCalendar();
          renderPeriods();
          updateContinueButton();
        });
      }
      calendar.append(button);
    }
  }

  function renderPeriods() {
    const slotButtons = document.querySelectorAll('[data-slot]');
    slotButtons.forEach(button => {
      const periodName = button.dataset.slot;
      const started = state.date && periodHasStarted(state.date, periodName);
      const full = state.date && bookedCount(state.date, periodName) >= 150;
      button.classList.toggle('active', state.period === periodName);
      button.disabled = !state.date || full || started;
      const availability = button.querySelector('[data-availability]');
      if (availability) {
        availability.textContent = !state.date
          ? 'Choose a date first'
          : started ? 'This period has already started'
          : full ? 'Full (150/150)' : `Available (${150 - bookedCount(state.date, periodName)} slots)`;
      }
    });
    if (state.period && (bookedCount(state.date, state.period) >= 150 ||
      periodHasStarted(state.date, state.period))) state.period = null;
  }

  function setup() {
    const user = getCurrentUser();
    if (!user) {
      location.replace('login.html');
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
      ${inputField('regFirstName', 'First Name')}
      ${inputField('regMiddleName', 'Middle Name')}
      ${inputField('regLastName', 'Last Name')}
      ${inputField('regSid', 'Student ID', 'text', '', 'placeholder="8240000"')}
      ${inputField('regEmail', 'Email Address', 'email')}
      ${inputField('regContact', 'Phone Number', 'tel')}
      <label for="regProgram">Course / Program</label>
      <select id="regProgram">
        <option value="">Select course / program</option>
        <option>BS Information Technology</option>
        <option>BS Computer Science</option>
        <option>BS Information Systems</option>
        <option>BS Hospitality Management</option>
        <option>BS Industrial Technology</option>
        <option>BS Education</option>
      </select>
      <div class="err" id="error-regProgram"></div>
      <label for="regYear">Year Level</label>
      <select id="regYear">
        <option value="">Select year level</option>
        <option>1st Year</option><option>2nd Year</option>
        <option>3rd Year</option><option>4th Year</option>
      </select>
      <div class="err" id="error-regYear"></div>
      ${inputField('regPassword', 'Password', 'password', '', 'minlength="8" maxlength="72"')}
      ${inputField('regConfirm', 'Confirm Password', 'password', '', 'minlength="8" maxlength="72"')}
      <p class="muted">Campus: Daanbantayan Campus</p>
      <p id="registerMessage" role="alert" aria-live="polite"></p>
      <button class="btn" id="registerSubmit" type="submit"><span>Create Account</span></button>
      <p class="center">Have an account? <a href="login.html">Login</a></p>
    </form></div>`,

  setup() {
    const form = select('#registerForm');
    const message = select('#registerMessage');
    const submitButton = select('#registerSubmit');
    form.onsubmit = async event => {
      event.preventDefault();
      clearErrors();
      message.textContent = '';
      message.classList.remove('success');
      const firstName = select('#regFirstName').value.trim();
      const middleName = select('#regMiddleName').value.trim();
      const lastName = select('#regLastName').value.trim();
      const studentId = select('#regSid').value.trim();
      const email = select('#regEmail').value.trim();
      const phone = select('#regContact').value.trim();
      const program = select('#regProgram').value;
      const yearLevel = select('#regYear').value;
      const password = select('#regPassword').value;
      const confirmPassword = select('#regConfirm').value;

      let valid = true;
      if (!firstName) valid = showError('regFirstName', 'Enter your first name.');
      if (!middleName) valid = showError('regMiddleName', 'Enter your middle name.');
      if (!lastName) valid = showError('regLastName', 'Enter your last name.');
      if (!/^824\d{4}$/.test(studentId)) valid = showError('regSid', 'Enter your 7-digit Daanbantayan Student ID beginning with 824.');
      if (!/^\S+@\S+\.\S+$/.test(email)) valid = showError('regEmail', 'Enter a valid email address.');
      if (!/^[\d\s()+-]{7,32}$/.test(phone)) valid = showError('regContact', 'Enter a valid phone number.');
      if (!program) valid = showError('regProgram', 'Select your course or program.');
      if (!yearLevel) valid = showError('regYear', 'Select your year level.');
      if (password.length < 8 || password.length > 72) valid = showError('regPassword', 'Password must be 8 to 72 characters.');
      if (confirmPassword !== password) valid = showError('regConfirm', 'Passwords do not match.');
      if (!valid) return;

      submitButton.disabled = true;
      submitButton.querySelector('span').textContent = 'Creating account…';
      try {
        const response = await fetch('api/student/register.php', {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            studentId, firstName, middleName, lastName, email, phone,
            program, yearLevel, password, confirmPassword
          })
        });
        const result = await response.json();
        if (!response.ok || !result.success) {
          message.textContent = result.message || 'Account registration could not be completed.';
          return;
        }
        message.textContent = result.message || 'Account created successfully. Redirecting to sign in…';
        message.classList.add('success');
        form.reset();
        window.setTimeout(() => goTo('login'), 1500);
      } catch (error) {
        console.error('Student registration request failed.', error);
        message.textContent = 'The registration service is unavailable. Please try again.';
      } finally {
        submitButton.disabled = false;
        submitButton.querySelector('span').textContent = 'Create Account';
      }
    };

    document.querySelectorAll('.password-eye').forEach(toggle => {
      const password = toggle.closest('.password-group')?.querySelector('input');
      if (!password) return;
      toggle.onclick = () => {
        const visible = password.type === 'password';
        password.type = visible ? 'text' : 'password';
        toggle.setAttribute('aria-label', visible ? 'Hide password' : 'Show password');
        toggle.setAttribute('aria-pressed', String(visible));
      };
    });
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
        <p style="margin:0;opacity:.85">Welcome back · <span style="background:rgba(255,255,255,0.22);padding:2px 8px;border-radius:6px;font-weight:700;letter-spacing:0.3px">${escapeHtml(user.section || 'BSIT 2-A')}</span></p>
        <h1>${escapeHtml(user.name)}</h1>
        <p style="margin:0">${next
          ? 'Next appointment: ' + formatDate(next.date) + ' at ' + next.time + ' (' + next.type + ')'
          : 'You have no upcoming appointments.'}</p>
      </div>

      <!-- Quick Study Load & COR Summary Card -->
      <div class="card study-load-widget">
        <div class="study-load-main">
          <div class="study-load-info">
            <div class="study-load-tag">Official Study Load · 1st Semester A.Y. 2024-2025</div>
            <h3 class="study-load-title">${escapeHtml(user.program || 'BS Information Technology')}</h3>
            <div class="study-load-meta">
              <span class="load-pill">Section: <b>${escapeHtml(user.section || 'BLK_BSIT-2A_DAY')}</b></span>
              <span class="load-pill"><b>10</b> Enrolled Courses</span>
              <span class="load-pill"><b>28.00</b> Total Academic Units</span>
              <span class="load-pill status-pill">✓ Officially Enrolled</span>
            </div>
          </div>
          <div class="study-load-action">
            <a href="enrollment.html" class="btn btn-view-cor">
              <span>View Official CTU COR</span>
              <span class="arrow">➔</span>
            </a>
          </div>
        </div>
      </div>

      <div class="grid">
        ${tile('book-appointment.html', '📅', 'Book Appointment', '<p class="muted">Reserve a time slot</p>')}
        ${tile('my-schedule.html', '🗓️', 'My Schedule', '<p class="muted">Upcoming and past</p>')}
        ${tile('my-schedule.html', '🎟️', 'Queue Number',
               next ? `<div class="q">${next.queue}</div>` : '<p class="muted">No active queue</p>')}
        ${tile('enrollment.html', '🎓', 'Enrollment & COR', '<p class="muted">Official Study Load (COR)</p>')}
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
      <label for="type">Campus Office & Transaction Type</label>
      <select id="type">${APPOINTMENT_TYPES.map(t => `<option>${t}</option>`).join('')}</select>

      <div id="officeDocBox" class="doc-checklist-box">
        <div class="doc-checklist-header">
          <span class="doc-badge">Required Documents</span>
          <span id="officeLocationText" class="doc-location"></span>
        </div>
        <p class="doc-notice-sub">Please prepare the following required physical documents before arriving for your appointment:</p>
        <ul id="officeDocList" class="doc-checklist"></ul>
      </div>

      <label for="date">Appointment date</label>
      <input type="date" id="date">
      <label>Available times</label>
      <div id="slots"></div>
      <div class="err" id="error-book"></div>
      <button class="btn" id="continueButton" disabled>Continue to Summary</button>
    </div>`),

  setup() {
    const typeSelect = select('#type');
    const locText = select('#officeLocationText');
    const docList = select('#officeDocList');

    function updateDocChecklist() {
      const selectedType = typeSelect.value;
      const details = OFFICE_DETAILS[selectedType];
      if (details) {
        locText.textContent = '📍 ' + details.window;
        docList.innerHTML = details.docs.map(doc => `
          <li class="doc-item">
            <span class="doc-check-icon">✓</span>
            <span>${escapeHtml(doc)}</span>
          </li>
        `).join('');
      }
    }

    typeSelect.onchange = updateDocChecklist;
    updateDocChecklist();

    let chosenDate = null, chosenTime = null;
    setupTimePicker(null, (date, time) => {
      chosenDate = date;
      chosenTime = time;
      select('#continueButton').disabled = !time;
    });

    select('#continueButton').onclick = () => {
      if (!chosenDate || !chosenTime) return showError('book', 'Select a date and an available time.');
      sessionStorage.setItem('ee_draft', JSON.stringify({
        type: typeSelect.value, date: chosenDate, time: chosenTime
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

    const user = currentUser();
    const details = OFFICE_DETAILS[draft.type] || {};
    const qNum = nextQueueNumber(draft.date, draft.type);

    return withSidebar(`
      <h1>Appointment Summary</h1>
      <div class="card">
        <div style="display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--ln);padding-bottom:14px;margin-bottom:16px;flex-wrap:wrap;gap:12px">
          <div>
            <span style="font-size:11px;text-transform:uppercase;letter-spacing:1px;font-weight:700;color:var(--b2)">Campus Office Visit</span>
            <h3 style="margin:4px 0 0;font-size:18px">${escapeHtml(draft.type)}</h3>
            <div class="muted" style="font-size:13px;margin-top:2px">📍 ${escapeHtml(details.window || 'Administration Building')}</div>
          </div>
          <div style="text-align:right">
            <span style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:var(--mu)">Estimated Queue #</span>
            <div style="font-size:26px;font-weight:800;color:var(--b2);letter-spacing:1px">${qNum}</div>
          </div>
        </div>

        ${detailsList({
          'Student Name': user ? user.name : 'Enrolled Student',
          'Student ID': user ? user.sid : '2024-00123',
          'Section': user ? (user.section || 'BSIT 2-A') : 'BSIT 2-A',
          'Appointment Date': formatDate(draft.date),
          'Scheduled Time': draft.time,
          'Designated Window': details.window || 'Administration Building'
        })}

        <h3 class="sec" style="font-size:15px;margin-top:20px;display:flex;align-items:center;gap:6px">
          📋 <span>Required Documents to Present</span>
        </h3>
        <ul style="margin:8px 0 16px;padding-left:20px;line-height:1.7;color:var(--tx);font-size:14px">
          ${(details.docs || ['Valid CTU Student ID Card', 'Pre-Enrollment Advising Slip']).map(d => `<li><b>${escapeHtml(d)}</b></li>`).join('')}
        </ul>

        <div style="background:rgba(59,130,246,0.06);border:1px solid var(--ln);border-radius:8px;padding:12px 14px;margin-bottom:20px">
          <b style="font-size:13px;color:var(--b)">Important Reminder:</b>
          <p style="margin:4px 0 0;font-size:12.5px;color:var(--mu);line-height:1.5">
            Arrive at the designated office window 15 minutes before your schedule. Bring your physical documents and official CTU Student ID. Your digital queue ticket will be scanned upon arrival.
          </p>
        </div>

        <div class="row">
          <button class="btn alt" id="backButton">Back</button>
          <button class="btn" id="confirmButton">Confirm Appointment</button>
        </div>
      </div>`);
  },

  setup() {
    const draft = JSON.parse(sessionStorage.getItem('ee_draft'));
    if (!draft) return;
    select('#backButton').onclick = () => goTo('book-appointment');

    select('#confirmButton').onclick = () => {
      // Check again in case the slot was taken meanwhile.
      if (isSlotUnavailable(draft.date, draft.time)) {
        showToast('That slot was just taken. Choose another.', true);
        return setTimeout(() => goTo('book-appointment'), 1200);
      }
      const qNum = nextQueueNumber(draft.date, draft.type);
      const appointment = {
        id: 'a' + Date.now(),
        sid: loadData('ee_session'),
        type: draft.type,
        date: draft.date,
        time: draft.time,
        queue: qNum,
        status: 'Confirmed'
      };
      saveData('ee_appointments', allAppointments().concat(appointment));
      saveData('ee_last', appointment.id);

      // Two-way sync to Admin Dashboard (enrolle_admin_appointments & enrolle_admin_students)
      const user = currentUser();
      if (user) {
        syncToAdminDashboard(appointment, user);
      }

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
    return withSidebar(renderQueuePassCard(appt, 'Appointment Confirmed!'));
  },
  setup() {
    const printBtn = select('#printQueueBtn');
    if (printBtn) printBtn.onclick = () => window.print();
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
        const details = OFFICE_DETAILS[appt.type] || {};
        const popup = showModal(`
          <div style="text-align:center;margin-bottom:12px">
            <span style="font-size:11px;font-weight:700;color:var(--b2);letter-spacing:1px;text-transform:uppercase">Campus Queue Ticket</span>
            <div style="font-size:36px;font-weight:900;color:var(--b2);letter-spacing:1px;margin:2px 0">${appt.queue}</div>
            <div style="font-size:12.5px;color:var(--tx);font-weight:600">📍 ${escapeHtml(details.window || 'Administration Building')}</div>
          </div>
          ${detailsList({
            'Transaction': appt.type,
            'Date': formatDate(appt.date),
            'Time': appt.time,
            'Status': appt.status
          })}
          <div style="margin-top:14px;padding:10px 12px;background:rgba(59,130,246,0.06);border-radius:6px;font-size:12px;color:var(--mu)">
            <b style="color:var(--tx)">Required to bring:</b> ${(details.docs || ['Valid CTU Student ID Card']).join(', ')}
          </div>
          <br>
          <div class="row">
            <button class="btn alt" id="closeDetails">Close</button>
            <button class="btn" id="openPassSlip">View Queue Pass</button>
          </div>`);
        popup.querySelector('#closeDetails').onclick = () => popup.remove();
        popup.querySelector('#openPassSlip').onclick = () => {
          saveData('ee_last', appt.id);
          popup.remove();
          goTo('confirmation');
        };
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
      appt.queue = nextQueueNumber(newDate, appt.type);
      appt.status = 'Rescheduled';
      saveData('ee_appointments', list);
      saveData('ee_last', id);
      const user = currentUser();
      if (user) {
        syncToAdminDashboard(appt, user);
      }
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
    return withSidebar(renderQueuePassCard(appt, 'Appointment Rescheduled!'));
  },
  setup() {
    const printBtn = select('#printQueueBtn');
    if (printBtn) printBtn.onclick = () => window.print();
  }
};

/* 11. Official CTU Certificate of Registration (COR) */
PAGES.enrollment = {
  render() {
    const user = currentUser();
    const sectionRaw = user.section || (user.program && user.program.toLowerCase().includes('information technology') ? 'BSIT 2-A' : 'Section 2-A');
    const secLetter = sectionRaw.includes('2-B') ? '2B' : '2A';
    const blockName = `BLK_BSIT-${secLetter}_DAY`;

    const ctuSubjects = [
      { section: 'CO379', subject: 'MS31', desc: 'MILITARY SCIENCE 31', unit: '3.00', time: '08:00AM-12:00PM', day: 'Sat', room: 'FIELD' },
      { section: 'CO58', subject: 'GEC-E', desc: 'ETHICS', unit: '3.00', time: '11:00AM-12:00PM', day: 'M', room: 'ROOM 10' },
      { section: 'CO59', subject: 'GEE-ES', desc: 'ENVIRONMENTAL SCIENCE', unit: '3.00', time: '01:00PM-02:00PM', day: 'Tue', room: 'ROOM 10' },
      { section: 'CO60', subject: 'GEC-LWR', desc: 'LIFE AND WORKS OF RIZAL', unit: '3.00', time: '11:00AM-12:00PM', day: 'Tue', room: 'ROOM 10' },
      { section: 'CO61', subject: 'PC 212', desc: 'QUANTITATIVE METHODS (MODELING & SIMULATION)', unit: '3.00', time: '10:00AM-11:00AM', day: 'M', room: 'ROOM 10' },
      { section: 'CO62', subject: 'CC 214', desc: 'DATA STRUCTURES AND ALGORITHMS (LEC)', unit: '2.00', time: '08:00AM-10:00AM', day: 'M', room: 'ROOM 10' },
      { section: 'CO63', subject: 'CC 214L', desc: 'DATA STRUCTURES AND ALGORITHMS (LAB)', unit: '3.00', time: '08:00AM-11:00AM', day: 'TueWTh', room: 'ROOM 10' },
      { section: 'CO64', subject: 'P ELEC 1', desc: 'OBJECT - ORIENTED PROGRAMMING', unit: '3.00', time: '01:00PM-03:00PM', day: 'M', room: 'ROOM 10' },
      { section: 'CO65', subject: 'P ELEC 2', desc: 'WEB SYSTEMS AND TECHNOLOGIES', unit: '3.00', time: '03:00PM-04:00PM', day: 'MWF', room: 'ROOM 10' },
      { section: 'CO66', subject: 'PATHFIT 3', desc: 'PHYSICAL ACTIVITIES TOWARDS HEALTH AND FITNESS 3: DANCE/SPORTS/MARTIAL ARTS/GROU', unit: '2.00', time: '03:00PM-04:00PM', day: 'M', room: 'ROOM 10' }
    ];

    const ctuFees = [
      { fee: 'Tuition', amount: '4200.00' },
      { fee: 'Athletics Fee', amount: '200.00' },
      { fee: 'Computer Fee', amount: '400.00' },
      { fee: 'Cultural Fee', amount: '150.00' },
      { fee: 'Development Fee', amount: '2815.00' },
      { fee: 'Guidance Fee', amount: '90.00' },
      { fee: 'Laboratory Fee', amount: '750.00' },
      { fee: 'Library Fee', amount: '350.00' },
      { fee: 'Medical and Dental Fee', amount: '200.00' },
      { fee: 'Registration Fee', amount: '50.00' }
    ];

    return withSidebar(`
      <div class="row sp no-print" style="align-items: center; margin-bottom: 14px;">
        <div>
          <h1 style="margin: 0; font-size: 22px;">Enrollment & Study Load</h1>
          <p class="muted" style="margin: 2px 0 0 0; font-size: 13px;">Official CTU Certificate of Registration (COR)</p>
        </div>
        <button type="button" class="cor-mini-btn" id="printCorBtn" title="Print or save as PDF">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: -1px; margin-right: 4px;"><path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
          Print / Save PDF
        </button>
      </div>

      <div class="ctu-cor-wrapper">
        <div class="ctu-cor-sheet">
          <!-- Official Header -->
          <div class="ctu-cor-header">
            <div class="ctu-logo-col">
              <img src="img/ctu-logo.png" alt="CTU Seal" class="ctu-header-logo" onerror="this.style.opacity='0'">
            </div>
            <div class="ctu-center-col">
              <p class="ctu-rep">Republic of the Philippines</p>
              <h1 class="ctu-univ-name">CEBU TECHNOLOGICAL UNIVERSITY</h1>
              <h2 class="ctu-campus-name">DAANBANTAYAN CAMPUS</h2>
              <p class="ctu-address">Agujo, Daanbantayan, Cebu, Philippines</p>
              <p class="ctu-contact-line">Website: <a href="https://www.ctu.edu.ph" target="_blank">https://www.ctu.edu.ph</a> E-mail: <a href="mailto:info-daanbantayan@ctu.edu.ph">info-daanbantayan@ctu.edu.ph</a><br>Phone: +6332 239 6549 loc. 102</p>
            </div>
            <div class="ctu-logo-col">
              <img src="img/bagong-pilipinas.png" alt="Bagong Pilipinas" class="ctu-header-logo" onerror="this.style.opacity='0'">
            </div>
          </div>

          <hr class="ctu-divider-rule">
          <div class="ctu-mis-title">MANAGEMENT INFORMATION SYSTEM</div>

          <div class="ctu-doc-title-row">
            <div class="ctu-doc-title-main">CERTIFICATE OF REGISTRATION</div>
            <div class="ctu-doc-term">1st Semester SY 2025-2026</div>
            <div class="ctu-doc-timestamp">1/16/2026 9:46:00 AM</div>
          </div>

          <!-- Student Information Row -->
          <div class="ctu-student-info-row">
            <div class="ctu-info-item"><span class="lbl">ID Number :</span> <span class="val font-mono">${escapeHtml(user.sid)}</span></div>
            <div class="ctu-info-item"><span class="lbl">Name :</span> <span class="val">${escapeHtml(user.name.toUpperCase())}</span></div>
            <div class="ctu-info-item"><span class="val">${escapeHtml(user.program && user.program.includes('IT') ? 'BSIT 2' : (user.year || 'BSIT 2'))}</span></div>
            <div class="ctu-block-name">${escapeHtml(blockName)}</div>
          </div>

          <!-- Dual Column Tables: Subjects on Left (73%), Fees on Right (27%) -->
          <div class="ctu-tables-flex">
            <!-- Left: Subjects Table -->
            <div class="ctu-subjects-container">
              <table class="ctu-grid-table">
                <thead>
                  <tr>
                    <th>SECTION</th>
                    <th>SUBJECT</th>
                    <th>DESCRIPTION</th>
                    <th class="center">UNIT</th>
                    <th>TIME</th>
                    <th class="center">DAY</th>
                    <th>ROOM</th>
                  </tr>
                </thead>
                <tbody>
                  ${ctuSubjects.map(s => `
                    <tr>
                      <td class="center ctu-sub-code">${escapeHtml(s.section)}</td>
                      <td class="ctu-sub-code">${escapeHtml(s.subject)}</td>
                      <td class="ctu-sub-desc">${escapeHtml(s.desc)}</td>
                      <td class="center font-mono">${escapeHtml(s.unit)}</td>
                      <td style="white-space:nowrap">${escapeHtml(s.time)}</td>
                      <td class="center">${escapeHtml(s.day)}</td>
                      <td>${escapeHtml(s.room)}</td>
                    </tr>
                  `).join('')}
                </tbody>
                <tfoot>
                  <tr class="ctu-table-total-row">
                    <td colspan="3" class="right">Total Units</td>
                    <td class="center font-mono">28.00</td>
                    <td colspan="3"></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <!-- Right: Itemized Fees Table -->
            <div class="ctu-fees-container">
              <table class="ctu-grid-table">
                <thead>
                  <tr>
                    <th>FEE</th>
                    <th class="right">AMOUNT</th>
                  </tr>
                </thead>
                <tbody>
                  ${ctuFees.map(f => `
                    <tr>
                      <td>${escapeHtml(f.fee)}</td>
                      <td class="right font-mono">${escapeHtml(f.amount)}</td>
                    </tr>
                  `).join('')}
                </tbody>
                <tfoot>
                  <tr class="ctu-table-total-row">
                    <td class="right">Total Charges</td>
                    <td class="right font-mono">9205.00</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <!-- Signatures Section -->
          <div class="ctu-signatures-row">
            <div class="ctu-sig-col">
              <div class="ctu-sig-name">FAIMA M. ARRIESGADO</div>
              <hr class="ctu-sig-rule">
              <div class="ctu-sig-title">Registrar II</div>
            </div>
            <div class="ctu-sig-col ctu-sig-col-student">
              <hr class="ctu-sig-rule">
              <div class="ctu-sig-title">Student Signature</div>
            </div>
          </div>
        </div>
      </div>
    `);
  },
  setup() {
    const printBtn = select('#printCorBtn');
    if (printBtn) {
      printBtn.onclick = () => window.print();
    }
  }
};

/* 12. Profile */
PAGES.profile = {
  render() {
    const user = currentUser();
    const section = user.section || (user.program && user.program.toLowerCase().includes('information technology') ? 'BSIT 2-A' : 'Section 2-A');

    return withSidebar(`
      <div class="profile-page-wrapper">
        <!-- Top Profile Card -->
        <div class="card profile-header-card">
          <div class="profile-header-flex">
            <div class="profile-avatar">${studentInitials(user.name)}</div>
            <div class="profile-header-info">
              <h2 style="margin: 0 0 4px 0;">${escapeHtml(user.name)}</h2>
              <div class="profile-badge-row">
                <span class="badge-pill font-mono">${escapeHtml(user.sid)}</span>
                <span class="badge-pill badge-primary">${escapeHtml(section)}</span>
                <span class="badge-pill badge-success">Regular Student · Enrolled</span>
              </div>
            </div>
            <!-- Discreet, non-obvious edit button -->
            <button type="button" class="profile-mini-edit-btn" id="openEditContactBtn" title="Update Contact Info">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: -1px; margin-right: 4px;"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              Edit Contact
            </button>
          </div>
        </div>

        <!-- Academic & Student Details Grid -->
        <div class="card sec">
          <h3 style="margin: 0 0 14px 0; font-size: 16px;">Student Record & Academic Profile</h3>
          <dl class="profile-dl">
            <dt>Student ID</dt><dd class="font-mono"><b>${escapeHtml(user.sid)}</b></dd>
            <dt>Degree Program</dt><dd>${escapeHtml(user.program)}</dd>
            <dt>Year & Section</dt><dd><b>${escapeHtml(user.year)} · ${escapeHtml(section)}</b></dd>
            <dt>Institutional Email</dt><dd id="displayEmail">${escapeHtml(user.email)}</dd>
            <dt>Contact Number</dt><dd id="displayContact">${user.contact ? escapeHtml(user.contact) : '<span class="muted">Not provided</span>'}</dd>
            <dt>Academic Standing</dt><dd class="text-ok">Regular / In Good Standing</dd>
            <dt>Enrollment Status</dt><dd class="text-ok">Officially Enrolled</dd>
            <dt>Enrollment Date</dt><dd>${user.enrolled ? formatDate(user.enrolled) : 'October 15, 2024'}</dd>
          </dl>
        </div>
      </div>
    `);
  },

  setup() {
    select('#openEditContactBtn').onclick = () => {
      const user = currentUser();
      const popup = showModal(`
        <h3 style="margin-top:0;">Update Contact Information</h3>
        <p class="muted" style="margin-bottom:14px; font-size:13px;">Academic records (ID, Name, Section) are locked by Registrar. You may update your contact details below.</p>
        <form id="contactEditForm" novalidate>
          ${inputField('editEmail', 'Email Address', 'email', user.email)}
          ${inputField('editContact', 'Contact Number', 'tel', user.contact || '')}
          <div class="row" style="margin-top: 16px; gap: 10px;">
            <button type="button" class="btn alt" id="cancelContactEdit" style="flex: 1;">Cancel</button>
            <button type="submit" class="btn" style="flex: 1;">Save Changes</button>
          </div>
        </form>
      `);

      popup.querySelector('#cancelContactEdit').onclick = () => popup.remove();
      popup.querySelector('#contactEditForm').onsubmit = event => {
        event.preventDefault();
        clearErrors();
        const email = popup.querySelector('#editEmail').value.trim();
        const contact = popup.querySelector('#editContact').value.trim();

        let valid = true;
        if (!/^\S+@\S+\.\S+$/.test(email)) valid = showError('editEmail', 'Enter a valid email address.');
        if (contact && !/^[\d\s+-]{7,}$/.test(contact)) valid = showError('editContact', 'Enter a valid contact number.');
        if (!valid) return;

        const users = allUsers();
        const target = users.find(u => u.sid === user.sid);
        if (target) {
          target.email = email;
          target.contact = contact;
          saveData('ee_users', users);
        }

        const elEmail = select('#displayEmail');
        const elContact = select('#displayContact');
        if (elEmail) elEmail.textContent = email;
        if (elContact) elContact.textContent = contact || 'Not provided';

        popup.remove();
        showToast('Contact information saved.');
      };
    };
  }
};

/* 13. Settings */
PAGES.settings = {
  render() {
    const notify = loadData('ee_notifications', { email: 1, sms: 0, reminders: 1 });
    const user = currentUser();
    const section = user.section || (user.program && user.program.toLowerCase().includes('information technology') ? 'BSIT 2-A' : 'Section 2-A');
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
        ${detailsList({ 'Name': user.name, 'Student ID': user.sid, 'Section': section, 'Email': user.email })}
      </div>

      <!-- Security / Change Password with Clickable Button (Not in-your-face) -->
      <div class="card sec">
        <div class="row sp" style="align-items: center;">
          <div>
            <h3 style="margin: 0 0 4px 0;">Account Password</h3>
            <p class="muted" style="margin: 0; font-size: 13px;">•••••••••••• · Protected with local student security</p>
          </div>
          <button type="button" class="btn alt sm" id="openPasswordModal" style="padding: 8px 16px; font-size: 13px; font-weight: 600;">
            Change Password
          </button>
        </div>
      </div>

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

    // Change Password Modal Trigger
    select('#openPasswordModal').onclick = () => {
      const popup = showModal(`
        <h3 style="margin-top:0;">Change Password</h3>
        <p class="muted" style="margin-bottom:14px; font-size:13px;">Enter your current password and choose a new one.</p>
        <form id="modalPasswordForm" novalidate>
          ${inputField('oldPassword', 'Current password', 'password')}
          ${inputField('newPassword', 'New password', 'password')}
          ${inputField('confirmPassword', 'Confirm new password', 'password')}
          <div class="row" style="margin-top: 16px; gap: 10px;">
            <button type="button" class="btn alt" id="cancelPasswordModal" style="flex: 1;">Cancel</button>
            <button type="submit" class="btn" style="flex: 1;">Update</button>
          </div>
        </form>
      `);

      popup.querySelector('#cancelPasswordModal').onclick = () => popup.remove();
      popup.querySelector('#modalPasswordForm').onsubmit = event => {
        event.preventDefault();
        clearErrors();
        const users = allUsers();
        const user = users.find(u => u.sid === loadData('ee_session'));
        const oldPass = popup.querySelector('#oldPassword').value;
        const newPass = popup.querySelector('#newPassword').value;
        const confirmPass = popup.querySelector('#confirmPassword').value;

        let valid = true;
        if (oldPass !== user.password) valid = showError('oldPassword', 'Current password is incorrect.');
        if (newPass.length < 8) valid = showError('newPassword', 'Use at least 8 characters.');
        if (confirmPass !== newPass) valid = showError('confirmPassword', 'Passwords do not match.');
        if (!valid) return;

        user.password = newPass;
        saveData('ee_users', users);
        popup.remove();
        showToast('Password updated successfully.');
      };
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
  const usesStaticLoginShell = currentPage === 'login' && Boolean(select('#loginForm'));
  const html = usesStaticLoginShell ? '' : page.render(); // returns '' when it redirects away
  if (!usesStaticLoginShell) {
    select('#app').innerHTML = html;
  }
  if (usesStaticLoginShell) {
    page.setup();
    const passwordInput = select('#loginPassword');
    const passwordToggle = select('#togglePassword');
    if (passwordInput && passwordToggle) {
      passwordToggle.onclick = () => {
        const showingPassword = passwordInput.type === 'text';
        passwordInput.type = showingPassword ? 'password' : 'text';
        passwordToggle.classList.toggle('fa-eye', showingPassword);
        passwordToggle.classList.toggle('fa-eye-slash', !showingPassword);
      };
    }
  } else if (html && page.setup) {
    page.setup();
  }

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
