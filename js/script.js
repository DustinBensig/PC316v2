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
  "Registrar's Office (Document Evaluation & COR Release)",
  "Cashier & Accounting (Assessment & Payment)",
  "Campus Health Services (Clinic Medical Clearance)",
  "Guidance & Counseling (Clearance & Good Moral)",
  "Department Advising (Program Head & Subject Loading)"
];

const OFFICE_DETAILS = {
  "Registrar's Office (Document Evaluation & COR Release)": {
    dept: "Registrar",
    prefix: "REG",
    window: "Registrar Windows 1 & 2 (Administration Building)",
    docs: [
      "Signed Pre-Enrollment Advising Sheet",
      "Previous Semester Official Grade Slip",
      "Valid CTU Student ID Card",
      "Official Clearance Slip"
    ]
  },
  "Cashier & Accounting (Assessment & Payment)": {
    dept: "Cashier",
    prefix: "CSH",
    window: "Cashier Windows 3 & 4 (Administration Building)",
    docs: [
      "Encoded Assessment Form",
      "Validated Assessment Slip",
      "Valid CTU Student ID Card",
      "Official Receipt Slip (if paying balance)"
    ]
  },
  "Campus Health Services (Clinic Medical Clearance)": {
    dept: "Clinic",
    prefix: "CLN",
    window: "Clinic Windows 1 & 2 (Health Services Building)",
    docs: [
      "Annual Physical Examination Form",
      "Signed Health Declaration Slip",
      "Chest X-Ray / Laboratory Result Slip",
      "Valid CTU Student ID Card"
    ]
  },
  "Guidance & Counseling (Clearance & Good Moral)": {
    dept: "Guidance",
    prefix: "GDC",
    window: "Student Affairs & Guidance Office (Room 204)",
    docs: [
      "Student Conduct & Good Moral Application Slip",
      "Student Handbook Clearance Form",
      "Valid CTU Student ID Card"
    ]
  },
  "Department Advising (Program Head & Subject Loading)": {
    dept: "CodeTech",
    prefix: "ADV",
    window: "Department Head Office (Faculty Building)",
    docs: [
      "Curriculum Checklist Slip (BSIT 2nd Year)",
      "Previous Semester Grade Evaluation Form",
      "Pre-Enrollment Advising Sheet"
    ]
  }
};

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
let users = loadData('ee_users');
if (!users || !Array.isArray(users) || users.length === 0 || !users.some(u => u.sid === '2024-00123')) {
  const demoUser = {
    name: 'Juan Dela Cruz', sid: '2024-00123', email: 'juan@student.edu',
    password: 'demo1234', contact: '0917 123 4567',
    program: 'BS Information Technology', year: '2nd Year', section: 'BSIT 2-A', enrolled: '2024-06-10',
    status: 'Regular / Officially Enrolled'
  };
  users = Array.isArray(users) ? [...users.filter(u => u.sid !== '2024-00123'), demoUser] : [demoUser];
  saveData('ee_users', users);
}
// Dark / light mode
document.documentElement.dataset.theme = loadData('ee_theme', 'light');

function allUsers()        { return loadData('ee_users', []); }
function allAppointments() { return loadData('ee_appointments', []); }
function currentUser()     {
  const user = allUsers().find(u => u.sid === loadData('ee_session'));
  if (user && !user.section) {
    user.section = user.program && user.program.toLowerCase().includes('information technology') ? 'BSIT 2-A' : 'Section 2-A';
  }
  return user;
}
function myAppointments()  {
  syncFromAdminDashboard();
  return allAppointments().filter(a => a.sid === loadData('ee_session'));
}

/* Two-Way Sync between Student Bookings and Admin Dashboard */
function syncToAdminDashboard(appt, user) {
  try {
    const adminAppts = loadData('enrolle_admin_appointments', []);
    const deptInfo = OFFICE_DETAILS[appt.type] || { dept: 'Registrar' };
    const adminAppt = {
      id: `EA-${appt.id.slice(-4)}`,
      student: user.name,
      studentId: user.sid,
      program: user.program,
      department: deptInfo.dept,
      date: appt.date,
      time: appt.time,
      status: 'Pending',
      clinic: 'Cleared',
      guidance: 'Cleared',
      payment: 'Paid',
      registrar: 'Completed',
      documents: 'Verified'
    };
    saveData('enrolle_admin_appointments', [adminAppt, ...adminAppts.filter(a => a.id !== adminAppt.id)]);

    const adminStudents = loadData('enrolle_admin_students', {});
    adminStudents[user.sid] = {
      studentId: user.sid,
      name: user.name,
      email: user.email,
      program: user.program,
      homeDepartment: deptInfo.dept === 'Registrar' || deptInfo.dept === 'Cashier' ? 'CodeTech' : deptInfo.dept,
      active: true
    };
    saveData('enrolle_admin_students', adminStudents);
  } catch (e) {
    console.warn('Sync to admin error:', e);
  }
}

function syncFromAdminDashboard() {
  try {
    const adminAppts = loadData('enrolle_admin_appointments', []);
    const studentAppts = loadData('ee_appointments', []);
    if (!adminAppts.length || !studentAppts.length) return;

    let modified = false;
    studentAppts.forEach(sa => {
      const match = adminAppts.find(aa => aa.id === `EA-${sa.id.slice(-4)}` || (aa.studentId === sa.sid && aa.date === sa.date && aa.time === sa.time));
      if (match && match.status && match.status !== sa.status) {
        sa.status = match.status;
        modified = true;
      }
    });
    if (modified) {
      saveData('ee_appointments', studentAppts);
    }
  } catch (e) {}
}


/* ---------- 3. SMALL HELPERS ---------- */
const select = css => document.querySelector(css);

const studentInitials = name => (name || 'Student').trim().split(/\s+/).map(p => p[0]).slice(0, 2).join('').toUpperCase();

function getCurriculumSubjects(program = '', year = '', section = '') {
  const prog = (program || '').toLowerCase();
  const yr = (year || '').toLowerCase();
  const sec = section || (prog.includes('it') || prog.includes('information') ? 'BSIT 2-A' : 'Section 2-A');

  if (prog.includes('computer science') || prog.includes('bscs')) {
    return [
      { code: 'CS 211', title: 'Design and Analysis of Algorithms', lec: 2.0, lab: 3.0, units: 3.0, schedule: 'MWF 09:00 AM - 10:30 AM', room: 'CS Lab 1', instructor: 'Prof. A. Gonzales' },
      { code: 'CS 212', title: 'Automata and Formal Language Theory', lec: 3.0, lab: 0.0, units: 3.0, schedule: 'TTH 01:00 PM - 02:30 PM', room: 'Room 401', instructor: 'Prof. R. Mendoza' },
      { code: 'CS 213', title: 'Computer Organization & Architecture', lec: 2.0, lab: 3.0, units: 3.0, schedule: 'MWF 01:00 PM - 02:30 PM', room: 'CS Lab 4', instructor: 'Prof. L. Alcantara' },
      { code: 'MATH 201', title: 'Linear Algebra & Differential Calculus', lec: 3.0, lab: 0.0, units: 3.0, schedule: 'TTH 08:30 AM - 10:00 AM', room: 'Room 205', instructor: 'Prof. D. Garcia' },
      { code: 'GE 108', title: 'Science, Technology, and Society', lec: 3.0, lab: 0.0, units: 3.0, schedule: 'Sat 08:00 AM - 11:00 AM', room: 'Room 102', instructor: 'Prof. E. Morales' },
      { code: 'PE 3', title: 'Physical Activities Toward Health & Fitness', lec: 2.0, lab: 0.0, units: 2.0, schedule: 'Fri 03:00 PM - 05:00 PM', room: 'University Gym', instructor: 'Coach C. Perez' }
    ];
  }

  if (prog.includes('hospitality') || prog.includes('bshm')) {
    return [
      { code: 'HM 211', title: 'Front Office Operations & Management', lec: 2.0, lab: 3.0, units: 3.0, schedule: 'MWF 08:30 AM - 10:00 AM', room: 'HM Front Desk Lab', instructor: 'Chef R. Santos' },
      { code: 'HM 212', title: 'Food & Beverage Service Procedures', lec: 2.0, lab: 3.0, units: 3.0, schedule: 'TTH 01:00 PM - 03:00 PM', room: 'Dining Hall Lab', instructor: 'Prof. J. Navarro' },
      { code: 'HM 213', title: 'Culinary Arts & Professional Kitchen Work', lec: 1.0, lab: 6.0, units: 3.0, schedule: 'MWF 01:00 PM - 04:00 PM', room: 'Commercial Kitchen', instructor: 'Chef M. Cruz' },
      { code: 'HM 214', title: 'Tourism Planning & Sustainable Development', lec: 3.0, lab: 0.0, units: 3.0, schedule: 'TTH 09:00 AM - 10:30 AM', room: 'Room 302', instructor: 'Prof. C. Flores' },
      { code: 'GE 105', title: 'Purposive Communication in Hospitality', lec: 3.0, lab: 0.0, units: 3.0, schedule: 'Sat 08:00 AM - 11:00 AM', room: 'Room 104', instructor: 'Prof. A. Ramos' },
      { code: 'PE 3', title: 'Physical Education 3 (Folk Dance & Fitness)', lec: 2.0, lab: 0.0, units: 2.0, schedule: 'Fri 03:00 PM - 05:00 PM', room: 'University Gym', instructor: 'Coach C. Perez' }
    ];
  }

  if (prog.includes('industrial') || prog.includes('bit')) {
    return [
      { code: 'BIT 211', title: 'Industrial Materials Testing & Metallurgy', lec: 2.0, lab: 3.0, units: 3.0, schedule: 'MWF 08:30 AM - 10:00 AM', room: 'Mech Tech Lab', instructor: 'Engr. D. Tolentino' },
      { code: 'BIT 212', title: 'Computer-Aided Drafting & Design (CADD)', lec: 1.0, lab: 6.0, units: 3.0, schedule: 'TTH 01:00 PM - 03:00 PM', room: 'CAD/CAM Lab', instructor: 'Engr. J. Mercado' },
      { code: 'BIT 213', title: 'Occupational Safety, Health & Environmental Law', lec: 3.0, lab: 0.0, units: 3.0, schedule: 'TTH 08:30 AM - 10:00 AM', room: 'Room 203', instructor: 'Engr. S. Lopez' },
      { code: 'BIT 214', title: 'Industrial Electronics & Motor Controls', lec: 2.0, lab: 3.0, units: 3.0, schedule: 'MWF 01:00 PM - 02:30 PM', room: 'Electrical Lab', instructor: 'Engr. B. Castro' },
      { code: 'GE 106', title: 'The Contemporary World', lec: 3.0, lab: 0.0, units: 3.0, schedule: 'Sat 08:00 AM - 11:00 AM', room: 'Room 202', instructor: 'Prof. V. Bautista' },
      { code: 'PE 3', title: 'Physical Education 3 (Recreational Activities)', lec: 2.0, lab: 0.0, units: 2.0, schedule: 'Fri 03:00 PM - 05:00 PM', room: 'University Gym', instructor: 'Coach C. Perez' }
    ];
  }

  if (prog.includes('education') || prog.includes('coed') || prog.includes('bsed')) {
    return [
      { code: 'ED 211', title: 'The Child and Adolescent Learners & Principles', lec: 3.0, lab: 0.0, units: 3.0, schedule: 'MWF 08:30 AM - 10:00 AM', room: 'Education Hall 1', instructor: 'Dr. F. Manalo' },
      { code: 'ED 212', title: 'Facilitating Learner-Centered Teaching', lec: 3.0, lab: 0.0, units: 3.0, schedule: 'TTH 01:00 PM - 02:30 PM', room: 'Room 102', instructor: 'Dr. G. Aquino' },
      { code: 'ED 213', title: 'Assessment in Learning 1', lec: 3.0, lab: 0.0, units: 3.0, schedule: 'MWF 01:00 PM - 02:30 PM', room: 'Room 103', instructor: 'Prof. T. Soriano' },
      { code: 'ED 214', title: 'The Teaching Profession & School Culture', lec: 3.0, lab: 0.0, units: 3.0, schedule: 'TTH 08:30 AM - 10:00 AM', room: 'Room 104', instructor: 'Dr. E. Hernandez' },
      { code: 'GE 107', title: 'Art Appreciation', lec: 3.0, lab: 0.0, units: 3.0, schedule: 'Sat 08:00 AM - 11:00 AM', room: 'Room 205', instructor: 'Prof. K. Miranda' },
      { code: 'PE 3', title: 'Physical Education 3 (Rhythmic Activities)', lec: 2.0, lab: 0.0, units: 2.0, schedule: 'Fri 03:00 PM - 05:00 PM', room: 'University Gym', instructor: 'Coach C. Perez' }
    ];
  }

  // Default: BS Information Technology (2nd Year by default or based on year)
  if (yr.includes('1st')) {
    return [
      { code: 'CC 101', title: 'Introduction to Computing', lec: 2.0, lab: 3.0, units: 3.0, schedule: 'MWF 08:00 AM - 09:30 AM', room: 'Lab 1', instructor: 'Prof. N. Lim' },
      { code: 'CC 102', title: 'Fundamentals of Programming', lec: 2.0, lab: 3.0, units: 3.0, schedule: 'TTH 09:00 AM - 10:30 AM', room: 'Lab 2', instructor: 'Prof. M. Santos' },
      { code: 'MATH 101', title: 'Discrete Mathematics', lec: 3.0, lab: 0.0, units: 3.0, schedule: 'MWF 10:00 AM - 11:00 AM', room: 'Room 202', instructor: 'Prof. D. Garcia' },
      { code: 'GE 101', title: 'Understanding the Self', lec: 3.0, lab: 0.0, units: 3.0, schedule: 'TTH 01:00 PM - 02:30 PM', room: 'Room 203', instructor: 'Prof. L. Cruz' },
      { code: 'GE 102', title: 'Readings in Philippine History', lec: 3.0, lab: 0.0, units: 3.0, schedule: 'Sat 08:00 AM - 11:00 AM', room: 'Room 101', instructor: 'Prof. R. Morales' },
      { code: 'NSTP 1', title: 'National Service Training Program 1', lec: 3.0, lab: 0.0, units: 3.0, schedule: 'Sun 08:00 AM - 11:00 AM', room: 'Grandstand', instructor: 'Lt. B. Villanueva' },
      { code: 'PE 1', title: 'Movement Competency Training', lec: 2.0, lab: 0.0, units: 2.0, schedule: 'Fri 01:00 PM - 03:00 PM', room: 'Gymnasium', instructor: 'Coach C. Perez' }
    ];
  }

  // Default BSIT 2nd Year (Sections 2-A, 2-B, etc.)
  return [
    { code: 'P ELEC 2', title: 'Web Systems and Technologies', lec: 2.0, lab: 3.0, units: 3.0, schedule: 'MWF 09:00 AM - 10:30 AM', room: 'Lab 3', instructor: 'Prof. E. Villanueva' },
    { code: 'IT 211', title: 'Data Structures and Algorithms', lec: 2.0, lab: 3.0, units: 3.0, schedule: 'TTH 01:00 PM - 02:30 PM', room: 'Lab 1', instructor: 'Prof. M. Aranas' },
    { code: 'IT 212', title: 'Advanced Database Management Systems', lec: 2.0, lab: 3.0, units: 3.0, schedule: 'MWF 01:00 PM - 02:30 PM', room: 'Lab 2', instructor: 'Prof. R. Dizon' },
    { code: 'IT 213', title: 'Object-Oriented Programming 2', lec: 2.0, lab: 3.0, units: 3.0, schedule: 'TTH 08:30 AM - 10:00 AM', room: 'Lab 3', instructor: 'Prof. K. Tan' },
    { code: 'IT 214', title: 'Quantitative Methods & Analytics', lec: 3.0, lab: 0.0, units: 3.0, schedule: 'Sat 08:00 AM - 11:00 AM', room: 'Room 304', instructor: 'Prof. J. Reyes' },
    { code: 'GE 104', title: 'Mathematics in the Modern World', lec: 3.0, lab: 0.0, units: 3.0, schedule: 'MWF 10:30 AM - 11:30 AM', room: 'Room 201', instructor: 'Prof. S. Ramos' },
    { code: 'PE 3', title: 'Physical Activities Toward Health & Fitness', lec: 2.0, lab: 0.0, units: 2.0, schedule: 'Fri 03:00 PM - 05:00 PM', room: 'University Gym', instructor: 'Coach C. Perez' }
  ];
}

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
  const fieldError = select('#error-' + fieldId);
  if (fieldError) {
    fieldError.textContent = message;
  } else {
    const loginError = select('#login-error');
    if (loginError) {
      loginError.textContent = message;
      loginError.hidden = false;
    }
  }
  return false;
}

function clearErrors() {
  document.querySelectorAll('.err').forEach(e => e.textContent = '');
  const loginError = select('#login-error');
  if (loginError) {
    loginError.textContent = '';
    loginError.hidden = true;
  }
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

  const activeAppointments = allAppointments().filter(a =>
    a.date === date && a.status !== 'Cancelled' && a.id !== ignoreId);
  const period = activeAppointments.find(a => a.time === time && a.period)?.period;
  if (period) {
    return activeAppointments.filter(a => a.period === period).length >= 150;
  }
  return activeAppointments.some(a => a.time === time);
}

function generateBarcodeSvg(code) {
  const bars = [];
  let x = 12;
  const str = String(code || 'CTU-PASS');
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i);
    const w1 = ((c * 3) % 4) + 1;
    const w2 = ((c * 7) % 3) + 1;
    bars.push(`<rect x="${x}" y="0" width="${w1}" height="42" fill="currentColor"/>`);
    x += w1 + 2;
    bars.push(`<rect x="${x}" y="0" width="${w2}" height="42" fill="currentColor"/>`);
    x += w2 + 3;
  }
  return `<svg viewBox="0 0 ${x + 12} 46" preserveAspectRatio="none" style="width:100%;max-width:280px;height:42px;display:block;margin:0 auto;color:var(--tx)">${bars.join('')}</svg>`;
}

function renderQueuePassCard(appt, title = 'Appointment Confirmed!') {
  const user = currentUser();
  const details = OFFICE_DETAILS[appt.type] || {};
  return `
    <div class="card queue-pass-card" id="printableQueuePass">
      <div class="queue-pass-badge-header">
        <div class="queue-pass-stamp">OFFICIAL CAMPUS TRANSACTION PASS</div>
        <div class="queue-pass-univ">CEBU TECHNOLOGICAL UNIVERSITY · DAANBANTAYAN CAMPUS</div>
      </div>

      <div class="queue-pass-body">
        <div style="text-align:center;margin-bottom:14px">
          <div class="check" style="margin:0 auto 8px;width:44px;height:44px;font-size:22px;line-height:44px">✓</div>
          <h2 style="font-size:20px;margin:0 0 4px">${title}</h2>
          <p class="muted" style="margin:0;font-size:13px">Present this digital slip or printed copy upon arrival</p>
        </div>

        <div class="queue-pass-main-ticket">
          <div class="queue-pass-ticket-label">CAMPUS QUEUE TICKET</div>
          <div class="queue-pass-ticket-num">${appt.queue}</div>
          <div class="queue-pass-counter">📍 ${escapeHtml(details.window || 'Administration Building')}</div>
        </div>

        <div class="queue-pass-info-grid">
          <div class="queue-pass-field">
            <span class="q-label">Student Name</span>
            <span class="q-val">${escapeHtml(user ? user.name : 'Enrolled Student')}</span>
          </div>
          <div class="queue-pass-field">
            <span class="q-label">Student ID</span>
            <span class="q-val">${escapeHtml(user ? user.sid : '2024-00123')}</span>
          </div>
          <div class="queue-pass-field">
            <span class="q-label">Section & Program</span>
            <span class="q-val">${escapeHtml(user ? (user.section || 'BSIT 2-A') : 'BSIT 2-A')} · ${escapeHtml(user ? (user.program || 'BSIT') : 'BSIT')}</span>
          </div>
          <div class="queue-pass-field">
            <span class="q-label">Transaction Type</span>
            <span class="q-val">${escapeHtml(appt.type)}</span>
          </div>
          <div class="queue-pass-field">
            <span class="q-label">Appointment Date</span>
            <span class="q-val"><b>${formatDate(appt.date)}</b></span>
          </div>
          <div class="queue-pass-field">
            <span class="q-label">Designated Time Slot</span>
            <span class="q-val"><b>${appt.time}</b></span>
          </div>
        </div>

        <div class="queue-barcode-wrap">
          ${generateBarcodeSvg(appt.queue + '-' + appt.id)}
          <div class="queue-barcode-text">*CTU-DB-${appt.queue}-${appt.id.slice(-4)}*</div>
        </div>

        <div class="queue-pass-checklist-reminder">
          <b style="color:var(--b)">Required Documents to Bring:</b>
          <ul>
            ${(details.docs || ['Valid CTU Student ID Card', 'Pre-Enrollment Advising Slip']).map(d => `<li>${escapeHtml(d)}</li>`).join('')}
          </ul>
        </div>
      </div>

      <div class="queue-pass-actions no-print">
        <button class="btn alt" id="printQueueBtn" type="button">🖨️ Print / Save Pass</button>
        <a class="btn" href="dashboard.html">Back to Dashboard</a>
      </div>
    </div>`;
}

// Queue numbers count up per day and office prefix: REG-001, CSH-001, etc.
function nextQueueNumber(date, type = '') {
  const prefix = (type && OFFICE_DETAILS[type]?.prefix) ? OFFICE_DETAILS[type].prefix : 'Q';
  const countThatDay = allAppointments().filter(a => a.date === date && (a.queue || '').startsWith(prefix)).length;
  return `${prefix}-${String(countThatDay + 1).padStart(3, '0')}`;
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
  ['dashboard', '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 10.5L12 3L21 10.5V20H14V14H10V20H3V10.5Z"/></svg>', 'Dashboard', 'dashboard.html'],
  ['book-appointment', '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 2V7M17 2V7M3 10H21"/><path d="M8 14H10M14 14H16"/></svg>', 'Book Appointment', 'book-appointment.html'],
  ['my-schedule', '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 6V12L16 15"/></svg>', 'My Appointment', 'my-schedule.html'],
  ['queue-number', '<svg viewBox="0 0 24 24" fill="white" aria-hidden="true"><circle cx="12" cy="7" r="3.2"/><path d="M6.5 18.5C6.5 15.5 8.8 13 12 13C15.2 13 17.5 15.5 17.5 18.5V20H6.5V18.5Z"/><circle cx="5.5" cy="8" r="2.5"/><path d="M5.5 12C3.3 12 2 13.8 2 16V19H5V18.5C5 16.7 5.5 15.1 6.6 13.9C6.2 13.2 5.8 12.6 5.5 12Z"/><circle cx="18.5" cy="8" r="2.5"/><path d="M18.5 12C20.7 12 22 13.8 22 16V19H19V18.5C19 16.7 18.5 15.1 17.4 13.9C17.8 13.2 18.2 12.6 18.5 12Z"/></svg>', 'Queue Number', 'queue-number.html'],
  ['enrollment', '<svg viewBox="0 0 24 24" fill="white" aria-hidden="true"><circle cx="6.5" cy="6.5" r="3.2"/><path d="M1.5 20V18C1.5 14.7 3.8 12.5 6.5 12.5C9.2 12.5 11.5 14.7 11.5 18V20H1.5Z"/><path d="M13 3.5H22.5V5.8H13V3.5Z"/><path d="M13 8.2H22.5V10.5H13V8.2Z"/><path d="M13 12.9H22.5V15.2H13V12.9Z"/></svg>', 'Enrollment Details', 'enrollment.html'],
  ['campus-map', '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6L9 3L15 6L21 3V18L15 21L9 18L3 21V6Z"/><path d="M9 3V18M15 6V21"/></svg>', 'Campus Map', 'campus-map.html'],
  ['profile', '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="7" r="4"/><path d="M4 21V19C4 15.5 7 13 12 13C17 13 20 15.5 20 19V21H4Z"/></svg>', 'Profile', 'profile.html'],
  ['settings', '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2L14 4.5L17 4L18 7L21 9L19.5 12L21 15L18 17L17 20L14 19.5L12 22L10 19.5L7 20L6 17L3 15L4.5 12L3 9L6 7L7 4L10 4.5L12 2Z"/><circle cx="12" cy="12" r="3"/></svg>', 'Settings', 'settings.html']
];
// Which menu item stays highlighted on sub-pages.
const HIGHLIGHT = {
  'appointment-summary': 'book-appointment', 'confirmation': 'book-appointment',
  'reschedule': 'my-schedule', 'reschedule-confirmation': 'my-schedule'
};

function withSidebar(content) {
  const active = HIGHLIGHT[currentPage] || currentPage;
  const links = MENU.map(([page, icon, label, href]) =>
    `<a href="${href}" class="nav-link${page === active ? ' active' : ''}"${page === active ? ' aria-current="page"' : ''}>${icon}<span>${label}</span></a>`).join('');

  return `
    <div class="dashboard app-dashboard" style="height:auto;min-height:calc(100vh - 16px);overflow:visible">
      <aside class="sidebar" id="sidebar">
        <div class="brand">
          <svg class="brand-logo" viewBox="0 0 60 55" aria-hidden="true">
            <path d="M30 2L2 19L30 36L58 19L30 2Z" fill="white"/>
            <path d="M10 25V37L30 50L50 37V25L30 37L10 25Z" fill="white"/>
            <path d="M51 21V37H56V18Z" fill="white"/>
          </svg>
          <div class="brand-name">
            <strong>EnrollEase</strong>
            <span>Smarter Enrollment.</span>
            <span>Bright Future.</span>
          </div>
        </div>
        <nav class="sidebar-nav" aria-label="Student navigation">
          ${links}
        </nav>
        <div class="sidebar-curve"></div>
      </aside>
      <main class="main-area" style="height:auto;min-height:calc(100vh - 16px)">
        <div class="top">
          <button class="burger" id="menuButton" aria-label="Menu">☰</button>
          <b class="logo">EnrollEase</b>
        </div>
        <div class="app-page-content">${content}</div>
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
      ${inputField('loginId', 'Email, Student ID, or Admin Email')}
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

      const admin = window.EnrolleAdminAuth?.authenticate(typedId, typedPassword);
      if (admin) {
        try {
          localStorage.removeItem('ee_session');
          localStorage.setItem('enrolle_admin_session', JSON.stringify({
            ...admin,
            signedInAt: Date.now()
          }));
        } catch (error) {
          console.error('Unable to save the administrator sign-in session.', error);
          return showError('loginId', 'Unable to save your sign-in. Check that browser storage is enabled and try again.');
        }
        window.location.assign('admin-dashboard.html');
        return;
      }

      const user = allUsers().find(u =>
        (typeof u.email === 'string' && u.email.toLowerCase() === typedId.toLowerCase()) ||
        u.sid === typedId);
      if (!user) return showError('loginId', 'Wrong email or student ID. Check it and try again.');
      if (user.password !== typedPassword) return showError('loginPassword', 'Wrong password. Try again.');

      try {
        saveData('ee_session', user.sid);
        localStorage.removeItem('enrolle_admin_session');
      } catch (error) {
        console.error('Unable to save the student sign-in session.', error);
        return showError('loginId', 'Unable to save your sign-in. Check that browser storage is enabled and try again.');
      }
      addDemoPastAppointments(user.sid);
      flashMessage('Welcome back, ' + user.name.split(' ')[0] + '!');
      goTo('dashboard');
    };

    select('#forgotLink').onclick = event => {
      event.preventDefault();
      const popup = showModal(`
        <h3>Reset password</h3>
        <p class="muted">Enter your registered email and choose a new password. This demo updates the password stored in this browser.</p>
        <form id="resetPasswordForm" novalidate>
          ${inputField('resetEmail', 'Email Address', 'email')}
          ${inputField('resetPassword', 'New password', 'password')}
          ${inputField('resetConfirm', 'Confirm new password', 'password')}
          <button class="btn" type="submit">Update password</button>
        </form>`);
      popup.querySelector('#resetPasswordForm').onsubmit = resetEvent => {
        resetEvent.preventDefault();
        const email = popup.querySelector('#resetEmail').value.trim();
        if (!/^\S+@\S+\.\S+$/.test(email)) return showError('resetEmail', 'Enter a valid email address.');
        const users = allUsers();
        const user = users.find(account =>
          typeof account.email === 'string' && account.email.toLowerCase() === email.toLowerCase()
        );
        if (!user) return showError('resetEmail', 'No account was found for that email address.');
        const password = popup.querySelector('#resetPassword').value;
        const confirmation = popup.querySelector('#resetConfirm').value;
        if (password.length < 8) return showError('resetPassword', 'Password must be at least 8 characters.');
        if (password !== confirmation) return showError('resetConfirm', 'Passwords do not match.');
        user.password = password;
        try {
          saveData('ee_users', users);
        } catch (error) {
          console.error('Unable to save the password reset.', error);
          return showError('resetPassword', 'Unable to save your new password. Check browser storage and try again.');
        }
        popup.remove();
        showToast('Password updated. You can now sign in with your new password.');
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
      ${inputField('regSid', 'Student ID / LRN', 'text', '', 'placeholder="Student ID or LRN"')}
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
      const contact = select('#regContact').value.trim();
      const program = select('#regProgram').value;
      const year = select('#regYear').value;
      const password = select('#regPassword').value;
      const confirm = select('#regConfirm').value;
      const users = allUsers();

      let valid = true;
      if (name.length < 3) valid = showError('regName', 'Enter your full name.');
      if (!/^[\w-]{5,}$/.test(sid)) valid = showError('regSid', 'Enter a valid Student ID or LRN (at least 5 letters, numbers or dashes).');
      else if (users.some(u => u.sid === sid)) valid = showError('regSid', 'This Student ID / LRN is already registered.');
      if (!/^\S+@\S+\.\S+$/.test(email)) valid = showError('regEmail', 'Enter a valid email address.');
      else if (users.some(u => typeof u.email === 'string' && u.email.toLowerCase() === email.toLowerCase())) valid = showError('regEmail', 'This email is already registered.');
      if (!contact) valid = showError('regContact', 'Enter your phone number.');
      if (!program) valid = showError('regProgram', 'Select your course or program.');
      if (!year) valid = showError('regYear', 'Select your year level.');
      if (password.length < 8) valid = showError('regPassword', 'Password must be at least 8 characters.');
      if (confirm !== password) valid = showError('regConfirm', 'Passwords do not match.');
      if (!valid) return;

      users.push({
        name, sid, email, password, contact, program, year,
        section: program.includes('Information Technology') ? `BSIT ${year.charAt(0)}-A` : 'Section 1-A',
        enrolled: todayString(),
        status: 'Regular / Officially Enrolled'
      });
      try {
        saveData('ee_users', users);
      } catch (error) {
        console.error('Unable to save the new student account.', error);
        return showError('regEmail', 'Unable to save your account. Check browser storage and try again.');
      }
      try {
        addDemoPastAppointments(sid);
        saveData('ee_session', sid);
      } catch (error) {
        console.error('Unable to initialize the new student account.', error);
        return showError('regEmail', 'Your account could not be fully initialized. Check browser storage and try again.');
      }
      flashMessage('Account created successfully!');
      goTo('dashboard');
    };

    document.querySelectorAll('.password-eye').forEach(toggle => {
      const password = toggle.closest('.password-group')?.querySelector('input');
      if (!password) return;
      const togglePassword = () => {
        const visible = password.type === 'password';
        password.type = visible ? 'text' : 'password';
        toggle.classList.toggle('fa-eye', !visible);
        toggle.classList.toggle('fa-eye-slash', visible);
        toggle.setAttribute('aria-label', visible ? 'Hide password' : 'Show password');
      };
      toggle.addEventListener('click', togglePassword);
      toggle.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          togglePassword();
        }
      });
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
        ${tile('my-schedule.html', '🗓️', 'My Appointment', '<p class="muted">Upcoming and past</p>')}
        ${tile('queue-number.html', '🎟️', 'Queue Number',
               next ? `<div class="q">${next.queue}</div>` : '<p class="muted">No active queue</p>')}
        ${tile('enrollment.html', '🎓', 'Enrollment & COR', '<p class="muted">Official Study Load (COR)</p>')}
        ${tile('profile.html', '👤', 'Profile', '<p class="muted">Your information</p>')}
        ${tile('settings.html', '⚙️', 'Settings', '<p class="muted">Preferences</p>')}
      </div>`);
  },
  setup() {
    if (select('.app-shell')) {
      setupDashboardView();
    }
  }
};

function setupDashboardView() {
  const user = currentUser();
  const appointments = myAppointments();
  const now = new Date();
  let visibleMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const activeAppointments = appointments.filter(appt =>
    appt.status !== 'Cancelled' && !isPast(appt)
  ).sort((first, second) =>
    appointmentDateTime(first) - appointmentDateTime(second)
  );
  const nextAppointment = activeAppointments[0];
  const initials = studentInitials(user.name);

  document.querySelectorAll('[data-dashboard-name]').forEach(element => {
    element.textContent = user.name;
  });
  document.querySelectorAll('[data-dashboard-initials]').forEach(element => {
    element.textContent = initials;
  });
  select('#dashboardName').textContent = user.name;
  select('#dashboardGreeting').textContent =
    `Good ${now.getHours() < 12 ? 'morning' : now.getHours() < 18 ? 'afternoon' : 'evening'},`;
  select('#dashboardStudentId').textContent = user.sid;
  select('#dashboardEnrollmentStatus').textContent = user.status || 'Not set';
  document.title = `EnrollEase | ${user.name} - Dashboard`;

  if (nextAppointment) {
    const nextDate = new Date(nextAppointment.date + 'T00:00');
    select('#dashboardNextDate').textContent = nextDate.toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    });
    select('#dashboardNextDay').textContent = nextDate.toLocaleDateString('en-US', {
      weekday: 'long'
    });
    select('#dashboardAppointmentStatus').textContent = nextAppointment.status || 'Pending';
    select('#dashboardAppointmentTime').textContent =
      `${formatDate(nextAppointment.date)} · ${nextAppointment.time}`;
    select('#dashboardQueue').textContent = nextAppointment.queue || '—';
    select('#dashboardSidebarQueue').textContent = nextAppointment.queue || '—';
    select('#dashboardQueueStatus').textContent = nextAppointment.queue
      ? 'On your appointment pass'
      : 'Assigned when appointment is confirmed';
    select('#dashboardWaitingTime').textContent =
      `${formatDate(nextAppointment.date)} · ${nextAppointment.time}`;
  } else {
    select('#dashboardNotifications').setAttribute('aria-label', 'No upcoming appointment reminders');
  }

  const search = select('#dashboardSearch');
  const appointmentsBox = select('#dashboardAppointments');

  function renderAppointments() {
    const query = search.value.trim().toLowerCase();
    const orderedAppointments = [
      ...activeAppointments,
      ...appointments.filter(appt =>
        !activeAppointments.includes(appt)
      ).sort((first, second) =>
        appointmentDateTime(second) - appointmentDateTime(first)
      )
    ];
    const matches = orderedAppointments.filter(appt => {
      const office = (OFFICE_DETAILS[appt.type] || {}).window || '';
      return `${appt.type} ${appt.date} ${appt.time} ${appt.queue || ''} ${appt.status || ''} ${office}`
        .toLowerCase().includes(query);
    }).slice(0, 3);

    appointmentsBox.innerHTML = matches.map(appt => {
      const date = new Date(appt.date + 'T00:00');
      const cancelled = appt.status === 'Cancelled';
      const completed = !cancelled && (appt.status === 'Completed' || isPast(appt));
      const statusText = cancelled ? 'Cancelled' : completed ? 'Completed' : (appt.status || 'Pending');
      const statusClass = cancelled ? 'cancelled' : completed ? 'done' :
        statusText.toLowerCase().replace(/[^a-z0-9_-]/g, '-');
      const office = (OFFICE_DETAILS[appt.type] || {}).window || 'Campus appointment';
      return `<a class="appointment-row" href="my-schedule.html" aria-label="View ${escapeHtml(appt.type)} on ${formatDate(appt.date)}">
        <span class="date-box">
          <b>${escapeHtml(date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase())}</b>
          <strong>${date.getDate()}</strong>
        </span>
        <span class="appt-info">
          <b>${escapeHtml(appt.type)}</b>
          <small>${escapeHtml(appt.time)}<br>${escapeHtml(office)}</small>
        </span>
        <span class="status ${statusClass}">${escapeHtml(statusText)}</span>
        <span class="appointment-arrow" aria-hidden="true">›</span>
      </a>`;
    }).join('');

    if (!matches.length) {
      const message = query
        ? 'No appointments match your search.'
        : 'No appointments yet. Book an appointment to get started.';
      appointmentsBox.innerHTML = `<p class="empty-appointments">${message}</p>`;
    }
  }

  function renderCalendar() {
    const monthStart = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1);
    const calendarStart = new Date(
      monthStart.getFullYear(),
      monthStart.getMonth(),
      1 - monthStart.getDay()
    );
    const appointmentDates = new Set(appointments
      .filter(appt => appt.status !== 'Cancelled')
      .map(appt => appt.date));
    const currentDate = todayString();
    select('#dashboardMonth').textContent = visibleMonth.toLocaleDateString('en-US', {
      month: 'long', year: 'numeric'
    });

    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      .map(day => `<span>${day}</span>`).join('');
    const days = Array.from({ length: 42 }, (_, index) => {
      const date = new Date(calendarStart.getFullYear(), calendarStart.getMonth(), calendarStart.getDate() + index);
      const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      const inCurrentMonth = date.getMonth() === visibleMonth.getMonth();
      const hasAppointment = appointmentDates.has(dateKey);
      const isToday = dateKey === currentDate;
      const disabled = !hasAppointment && (dateKey < currentDate || date.getDay() === 0 || date.getDay() === 6);
      const label = date.toLocaleDateString('en-US', {
        weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
      });
      return `<button type="button" class="calendar-day${inCurrentMonth ? '' : ' muted'}${isToday ? ' today' : ''}${hasAppointment ? ' has-appointment' : ''}" data-dashboard-day="${dateKey}" aria-label="${label}${hasAppointment ? ', has appointment' : ''}" ${disabled ? 'disabled' : ''}>${date.getDate()}</button>`;
    }).join('');
    select('#dashboardCalendar').innerHTML = weekdays + days;
  }

  function renderReminders() {
    const reminders = select('#dashboardReminders');
    if (!nextAppointment) {
      reminders.innerHTML = '<p class="empty-appointments">No upcoming appointment reminders.</p>';
      return;
    }

    const details = OFFICE_DETAILS[nextAppointment.type] || {};
    reminders.innerHTML = `
      <div class="notice">
        <b><span class="new-tag">UPCOMING</span> ${escapeHtml(nextAppointment.type)}</b>
        <p>${escapeHtml(formatDate(nextAppointment.date))} at ${escapeHtml(nextAppointment.time)}${details.window ? ` · ${escapeHtml(details.window)}` : ''}</p>
        <small>Appointment reminder</small>
      </div>
      <div class="notice">
        <b><span class="new-tag">REMINDER</span> Prepare your documents</b>
        <p>${(details.docs || ['Valid CTU Student ID Card']).map(escapeHtml).join(', ')}</p>
        <small>Before your appointment</small>
      </div>`;
  }

  search.addEventListener('input', renderAppointments);
  select('#dashboardNotifications').onclick = () => {
    showToast(nextAppointment
      ? `Next appointment: ${formatDate(nextAppointment.date)} at ${nextAppointment.time}.`
      : 'You have no upcoming appointment reminders.');
  };
  select('#dashboardPreviousMonth').onclick = () => {
    visibleMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() - 1, 1);
    renderCalendar();
  };
  select('#dashboardNextMonth').onclick = () => {
    visibleMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 1);
    renderCalendar();
  };
  select('#dashboardCalendar').addEventListener('click', event => {
    const day = event.target.closest('[data-dashboard-day]');
    if (!day || day.disabled) return;
    const date = day.dataset.dashboardDay;
    if (appointments.some(appt => appt.date === date)) {
      goTo('my-schedule');
      return;
    }
    sessionStorage.setItem('ee_dashboard_booking_date', date);
    goTo('book-appointment');
  });

  renderAppointments();
  renderCalendar();
  renderReminders();
}

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

    const dashboardDate = sessionStorage.getItem('ee_dashboard_booking_date');
    if (dashboardDate) {
      sessionStorage.removeItem('ee_dashboard_booking_date');
      if (dashboardDate >= todayString()) {
        select('#date').value = dashboardDate;
        select('#date').dispatchEvent(new Event('change'));
      }
    }

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
          'Course / Program': draft.program || (user ? user.program : '—'),
          'Year Level': draft.yearLevel || (user ? user.year : '—'),
          'Term': draft.term || '—',
          'Appointment Date': formatDate(draft.date),
          'Scheduled Time': draft.time,
          'Time Period': draft.period || '—',
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
        period: draft.period,
        program: draft.program,
        yearLevel: draft.yearLevel,
        term: draft.term,
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

/* 8. Queue numbers */
PAGES['queue-number'] = {
  render() {
    const upcoming = myAppointments()
      .filter(appt => appt.status !== 'Cancelled' && !isPast(appt))
      .sort((a, b) => appointmentDateTime(a) - appointmentDateTime(b));

    const tickets = upcoming.map(appt => {
      const details = OFFICE_DETAILS[appt.type] || {};
      return `
        <article class="card queue-ticket">
          <div class="queue-ticket-number">
            <span class="muted">YOUR QUEUE NUMBER</span>
            <strong>${escapeHtml(appt.queue || 'Not assigned')}</strong>
          </div>
          <div class="queue-ticket-details">
            <h2>${escapeHtml(appt.type)}</h2>
            <p>${escapeHtml(formatDate(appt.date))} · ${escapeHtml(appt.time)}</p>
            <p>📍 ${escapeHtml(details.window || 'Administration Building')}</p>
            <span class="badge">${escapeHtml(appt.status || 'Confirmed')}</span>
          </div>
        </article>`;
    }).join('');

    return withSidebar(`
      <h1>Queue Number</h1>
      <p class="queue-page-intro">Your queue number is linked to your upcoming appointment.</p>
      ${tickets || `
        <div class="card queue-empty">
          <h2>No active queue number</h2>
          <p class="muted">Book and confirm an appointment to receive your queue number.</p>
          <a class="btn" href="book-appointment.html">Book an appointment</a>
        </div>`}`);
  }
};

/* 9. My schedule */
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
      <h1>My Appointment</h1>
      <h2 id="queue-number">Upcoming Appointments</h2>
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
        <div class="card sec profile-actions">
          <h3>Account</h3>
          <p class="muted">Sign out of your student account on this device.</p>
          <button type="button" class="btn alt" id="profileLogout">Logout</button>
        </div>
      </div>
    `);
  },

  setup() {
    select('#profileLogout').onclick = logout;
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

      `);
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
} else if (loggedIn && currentPage === 'register') {
  goTo('dashboard');
} else {
  const page = PAGES[currentPage];
  const usesStaticLoginShell = currentPage === 'login' && Boolean(select('#loginForm'));
  const usesStaticRegisterShell = currentPage === 'register' && Boolean(select('#registerForm'));
  const usesStaticDashboard = currentPage === 'dashboard' && Boolean(select('.app-shell'));
  const usesExistingMarkup = usesStaticLoginShell || usesStaticRegisterShell || usesStaticDashboard;
  const html = usesExistingMarkup ? '' : page.render(); // returns '' when it redirects away
  if (!usesExistingMarkup) {
    select('#app').innerHTML = html;
  }
  if (usesStaticDashboard) {
    page.setup();
  } else if (usesStaticRegisterShell) {
    page.setup();
  } else if (usesStaticLoginShell) {
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
  // Show a message left by the previous page
  const message = sessionStorage.getItem('ee_flash');
  if (message) {
    sessionStorage.removeItem('ee_flash');
    showToast(message);
  }
}
