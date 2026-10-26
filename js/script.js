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


/* ---------- 1. SETTINGS & ENROLLMENT TRANSACTION DEFINITIONS ---------- */
const ENROLLMENT_OFFICES = {
  "Department Chair & Academic Advising": {
    dept: "Advising",
    adminDept: "CodeTech",
    prefix: "ADV",
    defaultWindow: "Department Chairperson Office (College Faculty Building)",
    description: "Course schedule adjustments, adding/dropping subjects, overload/underload, prerequisite waivers, and curriculum evaluation.",
    services: {
      "Adding, Dropping, or Changing Subjects": {
        code: "ADD_DROP",
        window: "Department Chairperson Office (Faculty Hall, Room 101)",
        docs: [
          "Pre-Enrollment Advising Sheet",
          "Certificate of Registration (COR) / Assessment Form",
          "Official Adding/Dropping Form (Signed by Instructor & Chairperson)",
          "Valid CTU Student ID Card"
        ],
        hint: "Enter affected subject codes and section:",
        placeholder: "e.g., Drop CC 103 (Sec A), Add IT 211 (Sec B)"
      },
      "Schedule Conflict Resolution": {
        code: "SCHED_CONFLICT",
        window: "Department Chairperson Office (Faculty Hall, Room 101)",
        docs: [
          "Pre-Enrollment Advising Form",
          "Class Schedule Printout showing overlapping lecture/lab hours",
          "Department Chairperson Special Block Override Endorsement",
          "Valid CTU Student ID Card"
        ],
        hint: "Specify overlapping subjects and days/hours:",
        placeholder: "e.g., CC 104 Lab (Mon 1-4PM) overlaps with MATH 102 (Mon 2-3:30PM)"
      },
      "Overload / Underload Request": {
        code: "OVER_UNDERLOAD",
        window: "College Dean / Chairperson Office (Faculty Hall)",
        docs: [
          "Evaluation of Grades / Academic History Summary",
          "Overload/Underload Application Form with Justification",
          "Graduating Senior Evaluation Form (for overload) or Working Student Certificate (for underload)",
          "Valid CTU Student ID Card"
        ],
        hint: "State total requested units & reason (graduating / working student):",
        placeholder: "e.g., Requesting 29 units (Graduating student needing 1 extra subject)"
      },
      "Prerequisite Waiver & Petition Class": {
        code: "PREREQ_PETITION",
        window: "Department Chairperson Office (Faculty Hall, Room 102)",
        docs: [
          "Official Prerequisite Waiver Form signed by Instructor & Chair",
          "Transcript of Records / COG showing prerequisite deficiency",
          "Petition Class Request Form with list of petitioning students",
          "Valid CTU Student ID Card"
        ],
        hint: "Enter the advanced subject and missing prerequisite subject code:",
        placeholder: "e.g., Requesting simultaneous enrollment in IT 212 while clearing IT 102"
      },
      "Curriculum Evaluation & Crediting": {
        code: "CURR_EVAL",
        window: "Department Academic Evaluator Desk (Faculty Hall)",
        docs: [
          "Official Transcript of Records (TOR) or Certified Copy of Grades",
          "Official Course Description / Syllabus from previous institution or program",
          "Curriculum Crediting & Validation Application Slip",
          "Valid CTU Student ID Card"
        ],
        hint: "State your previous course/school and subjects for crediting:",
        placeholder: "e.g., Shiftee from BSIE 1st Year crediting GE Math, GE Purposive Comm"
      }
    }
  },

  "Registrar’s Office (Records & Admission)": {
    dept: "Registrar",
    adminDept: "Registrar",
    prefix: "REG",
    defaultWindow: "Registrar Counter Windows 1 & 2 (Administration Building)",
    description: "Academic records, INC grade completion, document submissions, official COR stamping, and late registration.",
    services: {
      "INC (Incomplete) Completion & Grade Correction": {
        code: "INC_CORRECTION",
        window: "Registrar Window 1 (Evaluation & Grades Section)",
        docs: [
          "Official Signed INC Completion Form from Subject Instructor",
          "Official Grade Sheet copy with Dean's signature",
          "INC Completion Fee Official Receipt Slip",
          "Valid CTU Student ID Card"
        ],
        hint: "Subject code, instructor name, and academic term of INC:",
        placeholder: "e.g., CC 102 - OOP (1st Sem 2025-2026, Prof. Santos)"
      },
      "Submission of Lacking Requirements": {
        code: "LACKING_DOCS",
        window: "Registrar Window 2 (Admissions & Records Section)",
        docs: [
          "Original & Photocopy of Lacking Document (PSA Birth Cert / Form 137 / Form 138 / Good Moral)",
          "Lacking Requirements Tracking Slip from initial registration",
          "Valid CTU Student ID Card"
        ],
        hint: "List the documents you are submitting today:",
        placeholder: "e.g., Original PSA Birth Certificate and Certified True Copy Form 137"
      },
      "COR Printing, Validation & Stamping": {
        code: "COR_VALIDATION",
        window: "Registrar Window 1 & 2 (Administration Building)",
        docs: [
          "Printed Pre-Assessment / Enrollment Slip",
          "Approved Advising Form for the current semester",
          "Clearance Slip (Medical, Guidance, Department)",
          "Valid CTU Student ID Card"
        ],
        hint: "Note any specific requirements (e.g., need 2 stamped original copies):",
        placeholder: "e.g., 1st Semester 2026-2027 Official COR Stamping"
      },
      "Document Requests & Claiming (TOR, COG, CAV)": {
        code: "DOC_REQUEST",
        window: "Registrar Releasing Counter (Admin Building)",
        docs: [
          "Official Document Request Form / Claim Slip",
          "Official Receipt Slip for document fee",
          "University Clearance Slip",
          "Valid CTU Student ID Card (or Authorization Letter with IDs if representative)"
        ],
        hint: "Document requested and Claiming Reference Slip #:",
        placeholder: "e.g., Transcript of Records (TOR) & Certificate of Good Moral"
      },
      "Late Registration Processing": {
        code: "LATE_REG",
        window: "Registrar Window 3 (Special Processing Desk)",
        docs: [
          "Letter of Explanation for Late Enrollment addressed to Registrar & Campus Director",
          "Endorsement from Department Chairperson",
          "Pre-Enrollment Advising Sheet",
          "Valid CTU Student ID Card"
        ],
        hint: "Briefly specify the reason for late registration:",
        placeholder: "e.g., Delayed submission of transfer credentials / medical emergency"
      }
    }
  },

  "MIS / Campus IT Support": {
    dept: "MIS",
    adminDept: "MIS",
    prefix: "MIS",
    defaultWindow: "MIS & ICT Center (Administration Building, 2nd Floor, Room 208)",
    description: "Student portal account recovery, curriculum sync errors, clearance overrides, and campus ID photo capture/re-issuance.",
    services: {
      "Student Portal Account Recovery": {
        code: "PORTAL_RECOVERY",
        window: "MIS Counter 1 (User Accounts & Support Desk)",
        docs: [
          "Valid CTU Student ID Card or Valid Government ID",
          "Proof of Enrollment (Recent COR or Grade Slip)",
          "Registered University / Personal Email Address"
        ],
        hint: "Describe account issue (forgot password, email changed, locked portal):",
        placeholder: "e.g., Locked out of CTU Portal, registered phone number no longer active"
      },
      "System Tagging & Curriculum Sync Fix": {
        code: "CURR_SYNC_FIX",
        window: "MIS Counter 2 (Database & Systems Desk)",
        docs: [
          "Official Grade Evaluation Slip / Transcript proving passed subjects",
          "Signed Pre-Enrollment Advising Slip showing correct curriculum year",
          "Valid CTU Student ID Card"
        ],
        hint: "Specify error details (e.g., tagged in wrong year, passed subject marked uncompleted):",
        placeholder: "e.g., CC 101 passed in 1st sem still showing 'prerequisite missing' for CC 102"
      },
      "Clearance Hold Digital Override": {
        code: "CLEARANCE_OVERRIDE",
        window: "MIS Counter 1 (User Accounts & Support Desk)",
        docs: [
          "Signed Physical Clearance Slip from the office in question (Clinic, Guidance, or Cashier)",
          "Department Endorsement Slip",
          "Valid CTU Student ID Card"
        ],
        hint: "Which office cleared you physically that is still holding you online?:",
        placeholder: "e.g., Clinic signed physical clearance on Oct 24, but portal still shows Clinic Hold"
      },
      "Campus ID Data Capture & Re-issuance": {
        code: "ID_CAPTURE",
        window: "MIS ID Capture & Biometrics Booth (Room 210)",
        docs: [
          "Officially Validated Certificate of Registration (COR)",
          "Affidavit of Loss (if replacing lost ID) or Surrender of Damaged ID",
          "Payment Receipt for ID Replacement (if applicable)",
          "Valid Government ID or Barangay Certificate"
        ],
        hint: "Specify: New ID Capture, Lost ID Replacement, or Damaged RFID chip:",
        placeholder: "e.g., Replacement ID (Lost RFID card with Affidavit of Loss attached)"
      }
    }
  },

  "Accounting, Cashier & Scholarship Office": {
    dept: "Cashier",
    adminDept: "Cashier",
    prefix: "CSH",
    defaultWindow: "Cashier & Accounting Windows 3 & 4 (Administration Building)",
    description: "Fee assessment adjustments, UniFAST verification, scholarship validation, promissory notes, and payments.",
    services: {
      "Fee Assessment & Re-assessment": {
        code: "FEE_ASSESSMENT",
        window: "Accounting Assessment Window 3 (Admin Building)",
        docs: [
          "Pre-Enrollment Assessment Slip",
          "Certificate of Free Higher Education (UniFAST) Eligibility Status",
          "Official Grade History (if calculating retake/over-staying units)",
          "Valid CTU Student ID Card"
        ],
        hint: "Detail the billing or assessment discrepancy:",
        placeholder: "e.g., Regular 2nd year student mistakenly assessed tuition under UniFAST RA 10931"
      },
      "Scholarship Validation & Stipend Processing": {
        code: "SCHOLARSHIP_VALIDATION",
        window: "Scholarship & Grants Counter Window 4 (Admin Building)",
        docs: [
          "Official Scholarship Award Notice / Certificate (CHED, TES, TDP, Provincial/LGU, DOST)",
          "Officially Enrolled Certificate of Registration (COR) for the current term",
          "Official Statement of Account or Billing Slip",
          "Valid CTU Student ID Card & Landbank ATM Card Photocopy (if stipend)"
        ],
        hint: "Scholarship program name and awardee ID number:",
        placeholder: "e.g., CHED Tulong Dunong Program (TDP) / TES Awardee Batch 2024"
      },
      "Promissory Note Approval": {
        code: "PROMISSORY_NOTE",
        window: "Accounting Head Office (Admin Building, Room 105)",
        docs: [
          "Completed Promissory Note Application Form signed by Parent/Guardian",
          "Photocopy of Parent/Guardian Valid Government ID with 3 specimen signatures",
          "Previous Semester Statement of Account",
          "Valid CTU Student ID Card"
        ],
        hint: "Back account amount and agreed target payment date:",
        placeholder: "e.g., PHP 3,500 balance from previous summer class, payment promise by Midterms"
      },
      "Miscellaneous & Special Payments": {
        code: "MISC_PAYMENTS",
        window: "Cashier Window 4 (Payments Desk)",
        docs: [
          "Order of Payment Slip issued by the concerned department",
          "Exact payment amount or check payable to Cebu Technological University",
          "Valid CTU Student ID Card"
        ],
        hint: "Payment purpose (Graduation fee, Lost ID, NSTP fee, Manuals):",
        placeholder: "e.g., Payment for Lost CTU Student RFID card replacement fee (PHP 150)"
      }
    }
  },

  "Clinic, Guidance & Student Affairs (OSAS)": {
    dept: "Clinic",
    adminDept: "Clinic",
    prefix: "OSA",
    defaultWindow: "University Health Services & OSAS Center (Student Activity Building)",
    description: "Mandatory medical & dental checkups, guidance intake/exit counseling, and multi-office clearance sign-offs.",
    services: {
      "Medical & Dental Physical Examination": {
        code: "MED_EXAM",
        window: "Campus Health Clinic (Health Services Building, Ground Floor)",
        docs: [
          "Annual Physical Examination Form (CTU Clinic Form 1)",
          "Recent Chest X-Ray Film / Digital Radiologist Result (within last 6 months)",
          "Complete Blood Count (CBC) and Urinalysis Laboratory Result Slips",
          "Dental Examination Record Form",
          "Valid CTU Student ID Card"
        ],
        hint: "State if routine annual exam, freshman entry exam, or OJT clinical clearance:",
        placeholder: "e.g., Annual enrollment medical clearance (BSIT 2nd Year, X-Ray film ready)"
      },
      "Guidance Intake & Exit Interview": {
        code: "GUIDANCE_INTERVIEW",
        window: "Guidance & Counseling Center (OSAS Building, Room 204)",
        docs: [
          "Student Cumulative Record / Guidance Intake Form",
          "Referral Slip (if referred by Department Chair for Academic Probation)",
          "Exit / Shifting Clearance Form (if shifting or transferring out)",
          "Valid CTU Student ID Card"
        ],
        hint: "Purpose: Freshman Intake, Academic Probation counseling, or Shifting Interview:",
        placeholder: "e.g., Shifting counseling from BSIE to BSIT / Academic advising follow-up"
      },
      "Clearance Signing & Organization Validation": {
        code: "CLEARANCE_SIGNING",
        window: "OSAS Student Affairs Counter & Library Clearance Desk",
        docs: [
          "Official Student Clearance Slip (Multi-Office Sign-off Form)",
          "Supreme Student Council (SSC) & College Org Membership Receipts",
          "University Library Borrower's Card & Clearance Stamped Book Return Slip",
          "Valid CTU Student ID Card"
        ],
        hint: "List offices you need signed (e.g. SSC, Library, Campus Laboratory):",
        placeholder: "e.g., Supreme Student Council (SSC) validation & Campus Library clearance"
      }
    }
  }
};

// Legacy APPOINTMENT_TYPES array kept for backwards compatibility
const APPOINTMENT_TYPES = Object.keys(ENROLLMENT_OFFICES);

// Central helper to resolve office details, prefixes, windows, and required documents
function getOfficeDetails(officeName, serviceName) {
  if (!serviceName && officeName) {
    if (ENROLLMENT_OFFICES[officeName]) {
      const o = ENROLLMENT_OFFICES[officeName];
      const firstServiceKey = Object.keys(o.services)[0];
      const s = o.services[firstServiceKey];
      return {
        office: officeName,
        service: firstServiceKey,
        dept: o.dept,
        adminDept: o.adminDept,
        prefix: o.prefix,
        window: s.window || o.defaultWindow,
        docs: s.docs,
        hint: s.hint,
        placeholder: s.placeholder
      };
    }
    for (const [off, offData] of Object.entries(ENROLLMENT_OFFICES)) {
      if (offData.services[officeName]) {
        const s = offData.services[officeName];
        return {
          office: off,
          service: officeName,
          dept: offData.dept,
          adminDept: offData.adminDept,
          prefix: offData.prefix,
          window: s.window,
          docs: s.docs,
          hint: s.hint,
          placeholder: s.placeholder
        };
      }
    }
    for (const [off, offData] of Object.entries(ENROLLMENT_OFFICES)) {
      for (const [srv, srvData] of Object.entries(offData.services)) {
        if (officeName.includes(srv) || officeName.toLowerCase().includes(offData.dept.toLowerCase())) {
          return {
            office: off,
            service: srv,
            dept: offData.dept,
            adminDept: offData.adminDept,
            prefix: offData.prefix,
            window: srvData.window,
            docs: srvData.docs,
            hint: srvData.hint,
            placeholder: srvData.placeholder
          };
        }
      }
    }
  }

  const o = ENROLLMENT_OFFICES[officeName];
  if (o) {
    const s = o.services[serviceName];
    if (s) {
      return {
        office: officeName,
        service: serviceName,
        dept: o.dept,
        adminDept: o.adminDept,
        prefix: o.prefix,
        window: s.window,
        docs: s.docs,
        hint: s.hint,
        placeholder: s.placeholder
      };
    }
    return {
      office: officeName,
      service: serviceName || '',
      dept: o.dept,
      adminDept: o.adminDept,
      prefix: o.prefix,
      window: o.defaultWindow,
      docs: ["Valid CTU Student ID Card", "Pre-Enrollment Advising Sheet"]
    };
  }

  return {
    office: officeName || 'Campus Office',
    service: serviceName || officeName || 'General Transaction',
    dept: 'Registrar',
    adminDept: 'Registrar',
    prefix: 'Q',
    window: 'Administration Building',
    docs: ['Valid CTU Student ID Card', 'Pre-Enrollment Advising Sheet']
  };
}

// Populate OFFICE_DETAILS dictionary for instant lookup
const OFFICE_DETAILS = {};
for (const [offName, offData] of Object.entries(ENROLLMENT_OFFICES)) {
  OFFICE_DETAILS[offName] = {
    dept: offData.dept,
    adminDept: offData.adminDept,
    prefix: offData.prefix,
    window: offData.defaultWindow,
    docs: ["Valid CTU Student ID Card", "Pre-Enrollment Advising Sheet"]
  };
  for (const [srvName, srvData] of Object.entries(offData.services)) {
    OFFICE_DETAILS[srvName] = {
      office: offName,
      service: srvName,
      dept: offData.dept,
      adminDept: offData.adminDept,
      prefix: offData.prefix,
      window: srvData.window,
      docs: srvData.docs,
      hint: srvData.hint,
      placeholder: srvData.placeholder
    };
    OFFICE_DETAILS[`${offName} - ${srvName}`] = OFFICE_DETAILS[srvName];
  }
}

// Preserve legacy keys so previous sessions/fixtures continue to function seamlessly
OFFICE_DETAILS["Registrar's Office (Document Evaluation & COR Release)"] = OFFICE_DETAILS["COR Printing, Validation & Stamping"];
OFFICE_DETAILS["Cashier & Accounting (Assessment & Payment)"] = OFFICE_DETAILS["Fee Assessment & Re-assessment"];
OFFICE_DETAILS["Campus Health Services (Clinic Medical Clearance)"] = OFFICE_DETAILS["Medical & Dental Physical Examination"];
OFFICE_DETAILS["Guidance & Counseling (Clearance & Good Moral)"] = OFFICE_DETAILS["Guidance Intake & Exit Interview"];
OFFICE_DETAILS["Department Advising (Program Head & Subject Loading)"] = OFFICE_DETAILS["Adding, Dropping, or Changing Subjects"];

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
const defaultCtuUser = {
  name: 'CAPECENIO, LLYOD', sid: '8240873', email: 'capecenio.llyod@ctu.edu.ph',
  password: 'demo1234', contact: '0912 345 6789',
  program: 'Bachelor of Science in Information Technology', programCode: 'BSIT', yearLevel: 2, year: '2nd Year', section: 'BSIT 2-A', enrolled: '2024-06-10',
  status: 'Officially Enrolled'
};
const secondaryDemo = {
  name: 'Juan Dela Cruz', sid: '2024-00123', email: 'juan@student.edu',
  password: 'demo1234', contact: '0917 123 4567',
  program: 'Bachelor of Science in Information Technology', programCode: 'BSIT', yearLevel: 2, year: '2nd Year', section: 'BSIT 2-A', enrolled: '2024-06-10',
  status: 'Officially Enrolled'
};

if (!users || !Array.isArray(users) || users.length === 0 || !users.some(u => u.sid === '8240873')) {
  users = Array.isArray(users) ? [...users.filter(u => u.sid !== '8240873' && u.sid !== '2024-00123'), defaultCtuUser, secondaryDemo] : [defaultCtuUser, secondaryDemo];
  saveData('ee_users', users);
}
// Session is set only when user logs in
// Dark / light mode
document.documentElement.dataset.theme = loadData('ee_theme', 'light');

function allUsers()        { return loadData('ee_users', []); }
function allAppointments() { return loadData('ee_appointments', []); }
function currentUser()     {
  const sessionSid = loadData('ee_session');
  if (!sessionSid) return null;
  const user = allUsers().find(u => String(u.sid) === String(sessionSid));
  if (user) {
    if (!user.programCode) {
      const p = (user.program || '').toUpperCase();
      if (p.includes('HOSPITALITY') || p === 'BSHM') user.programCode = 'BSHM';
      else if (p.includes('INDUSTRIAL ENGINEERING') || p === 'BSIE') user.programCode = 'BSIE';
      else if (p.includes('ELEMENTARY') || p === 'BEED') user.programCode = 'BEED';
      else if (p.includes('SECONDARY') || p === 'BSED') user.programCode = 'BSED';
      else if (p.includes('LIVELIHOOD') || p === 'BTLED') user.programCode = 'BTLED';
      else if (p.includes('FISHERIES') || p === 'BSF') user.programCode = 'BSF';
      else if (p.includes('COMPUTER TECH') || p === 'BIT-CT') user.programCode = 'BIT-CT';
      else if (p.includes('ELECTRONICS') || p === 'BIT-ET') user.programCode = 'BIT-ET';
      else if (p.includes('AUTOMOTIVE') || p === 'BIT-AT') user.programCode = 'BIT-AT';
      else user.programCode = 'BSIT';
    }
    if (!user.yearLevel) {
      const yStr = String(user.year || '');
      if (yStr.includes('1')) user.yearLevel = 1;
      else if (yStr.includes('2')) user.yearLevel = 2;
      else if (yStr.includes('3')) user.yearLevel = 3;
      else if (yStr.includes('4')) user.yearLevel = 4;
      else user.yearLevel = 2;
    }
    if (!user.section) {
      user.section = `${user.programCode} ${user.yearLevel}-A`;
    }
  }
  return user;
}
function myAppointments()  {
  syncFromAdminDashboard();
  const sessionSid = loadData('ee_session');
  if (!sessionSid) return [];
  return allAppointments().filter(a => String(a.sid) === String(sessionSid));
}

/* Two-Way Sync between Student Bookings and Admin Dashboard */
function syncToAdminDashboard(appt, user) {
  try {
    const adminAppts = loadData('enrolle_admin_appointments', []);
    const details = getOfficeDetails(appt.office || appt.type, appt.service);

    // Route Academic Advising to the student's specific college admin
    let targetDept = details.adminDept || details.dept || 'Registrar';
    if (targetDept === 'Advising' || targetDept === 'CodeTech') {
      const prog = (user.program || '').toUpperCase();
      if (prog.includes('HOSPITALITY') || prog.includes('BSHM')) targetDept = 'HM';
      else if (prog.includes('EDUCATION') || prog.includes('BSED') || prog.includes('BEED') || prog.includes('BTLED')) targetDept = 'COED';
      else if (prog.includes('INDUSTRIAL') || prog.includes('BSIE') || prog.includes('BIT')) targetDept = 'BIT';
      else targetDept = 'CodeTech';
    }

    const adminAppt = {
      id: `EA-${appt.id.slice(-4)}`,
      student: user.name,
      studentId: user.sid,
      program: user.program,
      department: targetDept,
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
      homeDepartment: targetDept === 'Registrar' || targetDept === 'Cashier' ? 'CodeTech' : targetDept,
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
  sessionStorage.removeItem('ee_session');
  sessionStorage.removeItem('ee_draft');
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
    {
      id: 'demo1-' + sid,
      sid,
      office: 'Department Chair & Academic Advising',
      service: 'Curriculum Evaluation & Crediting',
      type: 'Curriculum Evaluation & Crediting',
      note: 'Curriculum evaluation and pre-requisite verification',
      date: daysAgo(21),
      time: '09:00 AM',
      queue: 'ADV-014',
      status: 'Completed'
    },
    {
      id: 'demo2-' + sid,
      sid,
      office: 'Registrar’s Office (Records & Admission)',
      service: 'Submission of Lacking Requirements',
      type: 'Submission of Lacking Requirements',
      note: 'Form 137 / PSA Birth Certificate verified',
      date: daysAgo(9),
      time: '02:00 PM',
      queue: 'REG-008',
      status: 'Completed'
    }
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

/* Standalone Offline QR Code Engine (Kazuhiko Arase - MIT License) */
/**
 * Minified by jsDelivr using Terser v5.37.0.
 * Original file: /npm/qrcode-generator@1.4.4/qrcode.js
 *
 * Do NOT use SRI with dynamically generated files! More information: https://www.jsdelivr.com/using-sri-with-dynamic-files
 */
var qrcode=function(){var t=function(t,r){var e=t,n=g[r],o=null,i=0,a=null,u=[],f={},c=function(t,r){o=function(t){for(var r=new Array(t),e=0;e<t;e+=1){r[e]=new Array(t);for(var n=0;n<t;n+=1)r[e][n]=null}return r}(i=4*e+17),l(0,0),l(i-7,0),l(0,i-7),s(),h(),d(t,r),e>=7&&v(t),null==a&&(a=p(e,n,u)),w(a,r)},l=function(t,r){for(var e=-1;e<=7;e+=1)if(!(t+e<=-1||i<=t+e))for(var n=-1;n<=7;n+=1)r+n<=-1||i<=r+n||(o[t+e][r+n]=0<=e&&e<=6&&(0==n||6==n)||0<=n&&n<=6&&(0==e||6==e)||2<=e&&e<=4&&2<=n&&n<=4)},h=function(){for(var t=8;t<i-8;t+=1)null==o[t][6]&&(o[t][6]=t%2==0);for(var r=8;r<i-8;r+=1)null==o[6][r]&&(o[6][r]=r%2==0)},s=function(){for(var t=B.getPatternPosition(e),r=0;r<t.length;r+=1)for(var n=0;n<t.length;n+=1){var i=t[r],a=t[n];if(null==o[i][a])for(var u=-2;u<=2;u+=1)for(var f=-2;f<=2;f+=1)o[i+u][a+f]=-2==u||2==u||-2==f||2==f||0==u&&0==f}},v=function(t){for(var r=B.getBCHTypeNumber(e),n=0;n<18;n+=1){var a=!t&&1==(r>>n&1);o[Math.floor(n/3)][n%3+i-8-3]=a}for(n=0;n<18;n+=1){a=!t&&1==(r>>n&1);o[n%3+i-8-3][Math.floor(n/3)]=a}},d=function(t,r){for(var e=n<<3|r,a=B.getBCHTypeInfo(e),u=0;u<15;u+=1){var f=!t&&1==(a>>u&1);u<6?o[u][8]=f:u<8?o[u+1][8]=f:o[i-15+u][8]=f}for(u=0;u<15;u+=1){f=!t&&1==(a>>u&1);u<8?o[8][i-u-1]=f:u<9?o[8][15-u-1+1]=f:o[8][15-u-1]=f}o[i-8][8]=!t},w=function(t,r){for(var e=-1,n=i-1,a=7,u=0,f=B.getMaskFunction(r),c=i-1;c>0;c-=2)for(6==c&&(c-=1);;){for(var g=0;g<2;g+=1)if(null==o[n][c-g]){var l=!1;u<t.length&&(l=1==(t[u]>>>a&1)),f(n,c-g)&&(l=!l),o[n][c-g]=l,-1==(a-=1)&&(u+=1,a=7)}if((n+=e)<0||i<=n){n-=e,e=-e;break}}},p=function(t,r,e){for(var n=A.getRSBlocks(t,r),o=b(),i=0;i<e.length;i+=1){var a=e[i];o.put(a.getMode(),4),o.put(a.getLength(),B.getLengthInBits(a.getMode(),t)),a.write(o)}var u=0;for(i=0;i<n.length;i+=1)u+=n[i].dataCount;if(o.getLengthInBits()>8*u)throw"code length overflow. ("+o.getLengthInBits()+">"+8*u+")";for(o.getLengthInBits()+4<=8*u&&o.put(0,4);o.getLengthInBits()%8!=0;)o.putBit(!1);for(;!(o.getLengthInBits()>=8*u||(o.put(236,8),o.getLengthInBits()>=8*u));)o.put(17,8);return function(t,r){for(var e=0,n=0,o=0,i=new Array(r.length),a=new Array(r.length),u=0;u<r.length;u+=1){var f=r[u].dataCount,c=r[u].totalCount-f;n=Math.max(n,f),o=Math.max(o,c),i[u]=new Array(f);for(var g=0;g<i[u].length;g+=1)i[u][g]=255&t.getBuffer()[g+e];e+=f;var l=B.getErrorCorrectPolynomial(c),h=k(i[u],l.getLength()-1).mod(l);for(a[u]=new Array(l.getLength()-1),g=0;g<a[u].length;g+=1){var s=g+h.getLength()-a[u].length;a[u][g]=s>=0?h.getAt(s):0}}var v=0;for(g=0;g<r.length;g+=1)v+=r[g].totalCount;var d=new Array(v),w=0;for(g=0;g<n;g+=1)for(u=0;u<r.length;u+=1)g<i[u].length&&(d[w]=i[u][g],w+=1);for(g=0;g<o;g+=1)for(u=0;u<r.length;u+=1)g<a[u].length&&(d[w]=a[u][g],w+=1);return d}(o,n)};f.addData=function(t,r){var e=null;switch(r=r||"Byte"){case"Numeric":e=M(t);break;case"Alphanumeric":e=x(t);break;case"Byte":e=m(t);break;case"Kanji":e=L(t);break;default:throw"mode:"+r}u.push(e),a=null},f.isDark=function(t,r){if(t<0||i<=t||r<0||i<=r)throw t+","+r;return o[t][r]},f.getModuleCount=function(){return i},f.make=function(){if(e<1){for(var t=1;t<40;t++){for(var r=A.getRSBlocks(t,n),o=b(),i=0;i<u.length;i++){var a=u[i];o.put(a.getMode(),4),o.put(a.getLength(),B.getLengthInBits(a.getMode(),t)),a.write(o)}var g=0;for(i=0;i<r.length;i++)g+=r[i].dataCount;if(o.getLengthInBits()<=8*g)break}e=t}c(!1,function(){for(var t=0,r=0,e=0;e<8;e+=1){c(!0,e);var n=B.getLostPoint(f);(0==e||t>n)&&(t=n,r=e)}return r}())},f.createTableTag=function(t,r){t=t||2;var e="";e+='<table style="',e+=" border-width: 0px; border-style: none;",e+=" border-collapse: collapse;",e+=" padding: 0px; margin: "+(r=void 0===r?4*t:r)+"px;",e+='">',e+="<tbody>";for(var n=0;n<f.getModuleCount();n+=1){e+="<tr>";for(var o=0;o<f.getModuleCount();o+=1)e+='<td style="',e+=" border-width: 0px; border-style: none;",e+=" border-collapse: collapse;",e+=" padding: 0px; margin: 0px;",e+=" width: "+t+"px;",e+=" height: "+t+"px;",e+=" background-color: ",e+=f.isDark(n,o)?"#000000":"#ffffff",e+=";",e+='"/>';e+="</tr>"}return e+="</tbody>",e+="</table>"},f.createSvgTag=function(t,r,e,n){var o={};"object"==typeof arguments[0]&&(t=(o=arguments[0]).cellSize,r=o.margin,e=o.alt,n=o.title),t=t||2,r=void 0===r?4*t:r,(e="string"==typeof e?{text:e}:e||{}).text=e.text||null,e.id=e.text?e.id||"qrcode-description":null,(n="string"==typeof n?{text:n}:n||{}).text=n.text||null,n.id=n.text?n.id||"qrcode-title":null;var i,a,u,c,g=f.getModuleCount()*t+2*r,l="";for(c="l"+t+",0 0,"+t+" -"+t+",0 0,-"+t+"z ",l+='<svg version="1.1" xmlns="http://www.w3.org/2000/svg"',l+=o.scalable?"":' width="'+g+'px" height="'+g+'px"',l+=' viewBox="0 0 '+g+" "+g+'" ',l+=' preserveAspectRatio="xMinYMin meet"',l+=n.text||e.text?' role="img" aria-labelledby="'+y([n.id,e.id].join(" ").trim())+'"':"",l+=">",l+=n.text?'<title id="'+y(n.id)+'">'+y(n.text)+"</title>":"",l+=e.text?'<description id="'+y(e.id)+'">'+y(e.text)+"</description>":"",l+='<rect width="100%" height="100%" fill="white" cx="0" cy="0"/>',l+='<path d="',a=0;a<f.getModuleCount();a+=1)for(u=a*t+r,i=0;i<f.getModuleCount();i+=1)f.isDark(a,i)&&(l+="M"+(i*t+r)+","+u+c);return l+='" stroke="transparent" fill="black"/>',l+="</svg>"},f.createDataURL=function(t,r){t=t||2,r=void 0===r?4*t:r;var e=f.getModuleCount()*t+2*r,n=r,o=e-r;return I(e,e,(function(r,e){if(n<=r&&r<o&&n<=e&&e<o){var i=Math.floor((r-n)/t),a=Math.floor((e-n)/t);return f.isDark(a,i)?0:1}return 1}))},f.createImgTag=function(t,r,e){t=t||2,r=void 0===r?4*t:r;var n=f.getModuleCount()*t+2*r,o="";return o+="<img",o+=' src="',o+=f.createDataURL(t,r),o+='"',o+=' width="',o+=n,o+='"',o+=' height="',o+=n,o+='"',e&&(o+=' alt="',o+=y(e),o+='"'),o+="/>"};var y=function(t){for(var r="",e=0;e<t.length;e+=1){var n=t.charAt(e);switch(n){case"<":r+="&lt;";break;case">":r+="&gt;";break;case"&":r+="&amp;";break;case'"':r+="&quot;";break;default:r+=n}}return r};return f.createASCII=function(t,r){if((t=t||1)<2)return function(t){t=void 0===t?2:t;var r,e,n,o,i,a=1*f.getModuleCount()+2*t,u=t,c=a-t,g={"██":"█","█ ":"▀"," █":"▄","  ":" "},l={"██":"▀","█ ":"▀"," █":" ","  ":" "},h="";for(r=0;r<a;r+=2){for(n=Math.floor((r-u)/1),o=Math.floor((r+1-u)/1),e=0;e<a;e+=1)i="█",u<=e&&e<c&&u<=r&&r<c&&f.isDark(n,Math.floor((e-u)/1))&&(i=" "),u<=e&&e<c&&u<=r+1&&r+1<c&&f.isDark(o,Math.floor((e-u)/1))?i+=" ":i+="█",h+=t<1&&r+1>=c?l[i]:g[i];h+="\n"}return a%2&&t>0?h.substring(0,h.length-a-1)+Array(a+1).join("▀"):h.substring(0,h.length-1)}(r);t-=1,r=void 0===r?2*t:r;var e,n,o,i,a=f.getModuleCount()*t+2*r,u=r,c=a-r,g=Array(t+1).join("██"),l=Array(t+1).join("  "),h="",s="";for(e=0;e<a;e+=1){for(o=Math.floor((e-u)/t),s="",n=0;n<a;n+=1)i=1,u<=n&&n<c&&u<=e&&e<c&&f.isDark(o,Math.floor((n-u)/t))&&(i=0),s+=i?g:l;for(o=0;o<t;o+=1)h+=s+"\n"}return h.substring(0,h.length-1)},f.renderTo2dContext=function(t,r){r=r||2;for(var e=f.getModuleCount(),n=0;n<e;n++)for(var o=0;o<e;o++)t.fillStyle=f.isDark(n,o)?"black":"white",t.fillRect(n*r,o*r,r,r)},f};t.stringToBytes=(t.stringToBytesFuncs={default:function(t){for(var r=[],e=0;e<t.length;e+=1){var n=t.charCodeAt(e);r.push(255&n)}return r}}).default,t.createStringToBytes=function(t,r){var e=function(){for(var e=S(t),n=function(){var t=e.read();if(-1==t)throw"eof";return t},o=0,i={};;){var a=e.read();if(-1==a)break;var u=n(),f=n()<<8|n();i[String.fromCharCode(a<<8|u)]=f,o+=1}if(o!=r)throw o+" != "+r;return i}(),n="?".charCodeAt(0);return function(t){for(var r=[],o=0;o<t.length;o+=1){var i=t.charCodeAt(o);if(i<128)r.push(i);else{var a=e[t.charAt(o)];"number"==typeof a?(255&a)==a?r.push(a):(r.push(a>>>8),r.push(255&a)):r.push(n)}}return r}};var r,e,n,o,i,a=1,u=2,f=4,c=8,g={L:1,M:0,Q:3,H:2},l=0,h=1,s=2,v=3,d=4,w=5,p=6,y=7,B=(r=[[],[6,18],[6,22],[6,26],[6,30],[6,34],[6,22,38],[6,24,42],[6,26,46],[6,28,50],[6,30,54],[6,32,58],[6,34,62],[6,26,46,66],[6,26,48,70],[6,26,50,74],[6,30,54,78],[6,30,56,82],[6,30,58,86],[6,34,62,90],[6,28,50,72,94],[6,26,50,74,98],[6,30,54,78,102],[6,28,54,80,106],[6,32,58,84,110],[6,30,58,86,114],[6,34,62,90,118],[6,26,50,74,98,122],[6,30,54,78,102,126],[6,26,52,78,104,130],[6,30,56,82,108,134],[6,34,60,86,112,138],[6,30,58,86,114,142],[6,34,62,90,118,146],[6,30,54,78,102,126,150],[6,24,50,76,102,128,154],[6,28,54,80,106,132,158],[6,32,58,84,110,136,162],[6,26,54,82,110,138,166],[6,30,58,86,114,142,170]],e=1335,n=7973,i=function(t){for(var r=0;0!=t;)r+=1,t>>>=1;return r},(o={}).getBCHTypeInfo=function(t){for(var r=t<<10;i(r)-i(e)>=0;)r^=e<<i(r)-i(e);return 21522^(t<<10|r)},o.getBCHTypeNumber=function(t){for(var r=t<<12;i(r)-i(n)>=0;)r^=n<<i(r)-i(n);return t<<12|r},o.getPatternPosition=function(t){return r[t-1]},o.getMaskFunction=function(t){switch(t){case l:return function(t,r){return(t+r)%2==0};case h:return function(t,r){return t%2==0};case s:return function(t,r){return r%3==0};case v:return function(t,r){return(t+r)%3==0};case d:return function(t,r){return(Math.floor(t/2)+Math.floor(r/3))%2==0};case w:return function(t,r){return t*r%2+t*r%3==0};case p:return function(t,r){return(t*r%2+t*r%3)%2==0};case y:return function(t,r){return(t*r%3+(t+r)%2)%2==0};default:throw"bad maskPattern:"+t}},o.getErrorCorrectPolynomial=function(t){for(var r=k([1],0),e=0;e<t;e+=1)r=r.multiply(k([1,C.gexp(e)],0));return r},o.getLengthInBits=function(t,r){if(1<=r&&r<10)switch(t){case a:return 10;case u:return 9;case f:case c:return 8;default:throw"mode:"+t}else if(r<27)switch(t){case a:return 12;case u:return 11;case f:return 16;case c:return 10;default:throw"mode:"+t}else{if(!(r<41))throw"type:"+r;switch(t){case a:return 14;case u:return 13;case f:return 16;case c:return 12;default:throw"mode:"+t}}},o.getLostPoint=function(t){for(var r=t.getModuleCount(),e=0,n=0;n<r;n+=1)for(var o=0;o<r;o+=1){for(var i=0,a=t.isDark(n,o),u=-1;u<=1;u+=1)if(!(n+u<0||r<=n+u))for(var f=-1;f<=1;f+=1)o+f<0||r<=o+f||0==u&&0==f||a==t.isDark(n+u,o+f)&&(i+=1);i>5&&(e+=3+i-5)}for(n=0;n<r-1;n+=1)for(o=0;o<r-1;o+=1){var c=0;t.isDark(n,o)&&(c+=1),t.isDark(n+1,o)&&(c+=1),t.isDark(n,o+1)&&(c+=1),t.isDark(n+1,o+1)&&(c+=1),0!=c&&4!=c||(e+=3)}for(n=0;n<r;n+=1)for(o=0;o<r-6;o+=1)t.isDark(n,o)&&!t.isDark(n,o+1)&&t.isDark(n,o+2)&&t.isDark(n,o+3)&&t.isDark(n,o+4)&&!t.isDark(n,o+5)&&t.isDark(n,o+6)&&(e+=40);for(o=0;o<r;o+=1)for(n=0;n<r-6;n+=1)t.isDark(n,o)&&!t.isDark(n+1,o)&&t.isDark(n+2,o)&&t.isDark(n+3,o)&&t.isDark(n+4,o)&&!t.isDark(n+5,o)&&t.isDark(n+6,o)&&(e+=40);var g=0;for(o=0;o<r;o+=1)for(n=0;n<r;n+=1)t.isDark(n,o)&&(g+=1);return e+=Math.abs(100*g/r/r-50)/5*10},o),C=function(){for(var t=new Array(256),r=new Array(256),e=0;e<8;e+=1)t[e]=1<<e;for(e=8;e<256;e+=1)t[e]=t[e-4]^t[e-5]^t[e-6]^t[e-8];for(e=0;e<255;e+=1)r[t[e]]=e;var n={glog:function(t){if(t<1)throw"glog("+t+")";return r[t]},gexp:function(r){for(;r<0;)r+=255;for(;r>=256;)r-=255;return t[r]}};return n}();function k(t,r){if(void 0===t.length)throw t.length+"/"+r;var e=function(){for(var e=0;e<t.length&&0==t[e];)e+=1;for(var n=new Array(t.length-e+r),o=0;o<t.length-e;o+=1)n[o]=t[o+e];return n}(),n={getAt:function(t){return e[t]},getLength:function(){return e.length},multiply:function(t){for(var r=new Array(n.getLength()+t.getLength()-1),e=0;e<n.getLength();e+=1)for(var o=0;o<t.getLength();o+=1)r[e+o]^=C.gexp(C.glog(n.getAt(e))+C.glog(t.getAt(o)));return k(r,0)},mod:function(t){if(n.getLength()-t.getLength()<0)return n;for(var r=C.glog(n.getAt(0))-C.glog(t.getAt(0)),e=new Array(n.getLength()),o=0;o<n.getLength();o+=1)e[o]=n.getAt(o);for(o=0;o<t.getLength();o+=1)e[o]^=C.gexp(C.glog(t.getAt(o))+r);return k(e,0).mod(t)}};return n}var A=function(){var t=[[1,26,19],[1,26,16],[1,26,13],[1,26,9],[1,44,34],[1,44,28],[1,44,22],[1,44,16],[1,70,55],[1,70,44],[2,35,17],[2,35,13],[1,100,80],[2,50,32],[2,50,24],[4,25,9],[1,134,108],[2,67,43],[2,33,15,2,34,16],[2,33,11,2,34,12],[2,86,68],[4,43,27],[4,43,19],[4,43,15],[2,98,78],[4,49,31],[2,32,14,4,33,15],[4,39,13,1,40,14],[2,121,97],[2,60,38,2,61,39],[4,40,18,2,41,19],[4,40,14,2,41,15],[2,146,116],[3,58,36,2,59,37],[4,36,16,4,37,17],[4,36,12,4,37,13],[2,86,68,2,87,69],[4,69,43,1,70,44],[6,43,19,2,44,20],[6,43,15,2,44,16],[4,101,81],[1,80,50,4,81,51],[4,50,22,4,51,23],[3,36,12,8,37,13],[2,116,92,2,117,93],[6,58,36,2,59,37],[4,46,20,6,47,21],[7,42,14,4,43,15],[4,133,107],[8,59,37,1,60,38],[8,44,20,4,45,21],[12,33,11,4,34,12],[3,145,115,1,146,116],[4,64,40,5,65,41],[11,36,16,5,37,17],[11,36,12,5,37,13],[5,109,87,1,110,88],[5,65,41,5,66,42],[5,54,24,7,55,25],[11,36,12,7,37,13],[5,122,98,1,123,99],[7,73,45,3,74,46],[15,43,19,2,44,20],[3,45,15,13,46,16],[1,135,107,5,136,108],[10,74,46,1,75,47],[1,50,22,15,51,23],[2,42,14,17,43,15],[5,150,120,1,151,121],[9,69,43,4,70,44],[17,50,22,1,51,23],[2,42,14,19,43,15],[3,141,113,4,142,114],[3,70,44,11,71,45],[17,47,21,4,48,22],[9,39,13,16,40,14],[3,135,107,5,136,108],[3,67,41,13,68,42],[15,54,24,5,55,25],[15,43,15,10,44,16],[4,144,116,4,145,117],[17,68,42],[17,50,22,6,51,23],[19,46,16,6,47,17],[2,139,111,7,140,112],[17,74,46],[7,54,24,16,55,25],[34,37,13],[4,151,121,5,152,122],[4,75,47,14,76,48],[11,54,24,14,55,25],[16,45,15,14,46,16],[6,147,117,4,148,118],[6,73,45,14,74,46],[11,54,24,16,55,25],[30,46,16,2,47,17],[8,132,106,4,133,107],[8,75,47,13,76,48],[7,54,24,22,55,25],[22,45,15,13,46,16],[10,142,114,2,143,115],[19,74,46,4,75,47],[28,50,22,6,51,23],[33,46,16,4,47,17],[8,152,122,4,153,123],[22,73,45,3,74,46],[8,53,23,26,54,24],[12,45,15,28,46,16],[3,147,117,10,148,118],[3,73,45,23,74,46],[4,54,24,31,55,25],[11,45,15,31,46,16],[7,146,116,7,147,117],[21,73,45,7,74,46],[1,53,23,37,54,24],[19,45,15,26,46,16],[5,145,115,10,146,116],[19,75,47,10,76,48],[15,54,24,25,55,25],[23,45,15,25,46,16],[13,145,115,3,146,116],[2,74,46,29,75,47],[42,54,24,1,55,25],[23,45,15,28,46,16],[17,145,115],[10,74,46,23,75,47],[10,54,24,35,55,25],[19,45,15,35,46,16],[17,145,115,1,146,116],[14,74,46,21,75,47],[29,54,24,19,55,25],[11,45,15,46,46,16],[13,145,115,6,146,116],[14,74,46,23,75,47],[44,54,24,7,55,25],[59,46,16,1,47,17],[12,151,121,7,152,122],[12,75,47,26,76,48],[39,54,24,14,55,25],[22,45,15,41,46,16],[6,151,121,14,152,122],[6,75,47,34,76,48],[46,54,24,10,55,25],[2,45,15,64,46,16],[17,152,122,4,153,123],[29,74,46,14,75,47],[49,54,24,10,55,25],[24,45,15,46,46,16],[4,152,122,18,153,123],[13,74,46,32,75,47],[48,54,24,14,55,25],[42,45,15,32,46,16],[20,147,117,4,148,118],[40,75,47,7,76,48],[43,54,24,22,55,25],[10,45,15,67,46,16],[19,148,118,6,149,119],[18,75,47,31,76,48],[34,54,24,34,55,25],[20,45,15,61,46,16]],r=function(t,r){var e={};return e.totalCount=t,e.dataCount=r,e},e={};return e.getRSBlocks=function(e,n){var o=function(r,e){switch(e){case g.L:return t[4*(r-1)+0];case g.M:return t[4*(r-1)+1];case g.Q:return t[4*(r-1)+2];case g.H:return t[4*(r-1)+3];default:return}}(e,n);if(void 0===o)throw"bad rs block @ typeNumber:"+e+"/errorCorrectionLevel:"+n;for(var i=o.length/3,a=[],u=0;u<i;u+=1)for(var f=o[3*u+0],c=o[3*u+1],l=o[3*u+2],h=0;h<f;h+=1)a.push(r(c,l));return a},e}(),b=function(){var t=[],r=0,e={getBuffer:function(){return t},getAt:function(r){var e=Math.floor(r/8);return 1==(t[e]>>>7-r%8&1)},put:function(t,r){for(var n=0;n<r;n+=1)e.putBit(1==(t>>>r-n-1&1))},getLengthInBits:function(){return r},putBit:function(e){var n=Math.floor(r/8);t.length<=n&&t.push(0),e&&(t[n]|=128>>>r%8),r+=1}};return e},M=function(t){var r=a,e=t,n={getMode:function(){return r},getLength:function(t){return e.length},write:function(t){for(var r=e,n=0;n+2<r.length;)t.put(o(r.substring(n,n+3)),10),n+=3;n<r.length&&(r.length-n==1?t.put(o(r.substring(n,n+1)),4):r.length-n==2&&t.put(o(r.substring(n,n+2)),7))}},o=function(t){for(var r=0,e=0;e<t.length;e+=1)r=10*r+i(t.charAt(e));return r},i=function(t){if("0"<=t&&t<="9")return t.charCodeAt(0)-"0".charCodeAt(0);throw"illegal char :"+t};return n},x=function(t){var r=u,e=t,n={getMode:function(){return r},getLength:function(t){return e.length},write:function(t){for(var r=e,n=0;n+1<r.length;)t.put(45*o(r.charAt(n))+o(r.charAt(n+1)),11),n+=2;n<r.length&&t.put(o(r.charAt(n)),6)}},o=function(t){if("0"<=t&&t<="9")return t.charCodeAt(0)-"0".charCodeAt(0);if("A"<=t&&t<="Z")return t.charCodeAt(0)-"A".charCodeAt(0)+10;switch(t){case" ":return 36;case"$":return 37;case"%":return 38;case"*":return 39;case"+":return 40;case"-":return 41;case".":return 42;case"/":return 43;case":":return 44;default:throw"illegal char :"+t}};return n},m=function(r){var e=f,n=t.stringToBytes(r),o={getMode:function(){return e},getLength:function(t){return n.length},write:function(t){for(var r=0;r<n.length;r+=1)t.put(n[r],8)}};return o},L=function(r){var e=c,n=t.stringToBytesFuncs.SJIS;if(!n)throw"sjis not supported.";!function(){var t=n("友");if(2!=t.length||38726!=(t[0]<<8|t[1]))throw"sjis not supported."}();var o=n(r),i={getMode:function(){return e},getLength:function(t){return~~(o.length/2)},write:function(t){for(var r=o,e=0;e+1<r.length;){var n=(255&r[e])<<8|255&r[e+1];if(33088<=n&&n<=40956)n-=33088;else{if(!(57408<=n&&n<=60351))throw"illegal char at "+(e+1)+"/"+n;n-=49472}n=192*(n>>>8&255)+(255&n),t.put(n,13),e+=2}if(e<r.length)throw"illegal char at "+(e+1)}};return i},D=function(){var t=[],r={writeByte:function(r){t.push(255&r)},writeShort:function(t){r.writeByte(t),r.writeByte(t>>>8)},writeBytes:function(t,e,n){e=e||0,n=n||t.length;for(var o=0;o<n;o+=1)r.writeByte(t[o+e])},writeString:function(t){for(var e=0;e<t.length;e+=1)r.writeByte(t.charCodeAt(e))},toByteArray:function(){return t},toString:function(){var r="";r+="[";for(var e=0;e<t.length;e+=1)e>0&&(r+=","),r+=t[e];return r+="]"}};return r},S=function(t){var r=t,e=0,n=0,o=0,i={read:function(){for(;o<8;){if(e>=r.length){if(0==o)return-1;throw"unexpected end of file./"+o}var t=r.charAt(e);if(e+=1,"="==t)return o=0,-1;t.match(/^\s$/)||(n=n<<6|a(t.charCodeAt(0)),o+=6)}var i=n>>>o-8&255;return o-=8,i}},a=function(t){if(65<=t&&t<=90)return t-65;if(97<=t&&t<=122)return t-97+26;if(48<=t&&t<=57)return t-48+52;if(43==t)return 62;if(47==t)return 63;throw"c:"+t};return i},I=function(t,r,e){for(var n=function(t,r){var e=t,n=r,o=new Array(t*r),i={setPixel:function(t,r,n){o[r*e+t]=n},write:function(t){t.writeString("GIF87a"),t.writeShort(e),t.writeShort(n),t.writeByte(128),t.writeByte(0),t.writeByte(0),t.writeByte(0),t.writeByte(0),t.writeByte(0),t.writeByte(255),t.writeByte(255),t.writeByte(255),t.writeString(","),t.writeShort(0),t.writeShort(0),t.writeShort(e),t.writeShort(n),t.writeByte(0);var r=a(2);t.writeByte(2);for(var o=0;r.length-o>255;)t.writeByte(255),t.writeBytes(r,o,255),o+=255;t.writeByte(r.length-o),t.writeBytes(r,o,r.length-o),t.writeByte(0),t.writeString(";")}},a=function(t){for(var r=1<<t,e=1+(1<<t),n=t+1,i=u(),a=0;a<r;a+=1)i.add(String.fromCharCode(a));i.add(String.fromCharCode(r)),i.add(String.fromCharCode(e));var f,c,g,l=D(),h=(f=l,c=0,g=0,{write:function(t,r){if(t>>>r!=0)throw"length over";for(;c+r>=8;)f.writeByte(255&(t<<c|g)),r-=8-c,t>>>=8-c,g=0,c=0;g|=t<<c,c+=r},flush:function(){c>0&&f.writeByte(g)}});h.write(r,n);var s=0,v=String.fromCharCode(o[s]);for(s+=1;s<o.length;){var d=String.fromCharCode(o[s]);s+=1,i.contains(v+d)?v+=d:(h.write(i.indexOf(v),n),i.size()<4095&&(i.size()==1<<n&&(n+=1),i.add(v+d)),v=d)}return h.write(i.indexOf(v),n),h.write(e,n),h.flush(),l.toByteArray()},u=function(){var t={},r=0,e={add:function(n){if(e.contains(n))throw"dup key:"+n;t[n]=r,r+=1},size:function(){return r},indexOf:function(r){return t[r]},contains:function(r){return void 0!==t[r]}};return e};return i}(t,r),o=0;o<r;o+=1)for(var i=0;i<t;i+=1)n.setPixel(i,o,e(i,o));var a=D();n.write(a);for(var u=function(){var t=0,r=0,e=0,n="",o={},i=function(t){n+=String.fromCharCode(a(63&t))},a=function(t){if(t<0);else{if(t<26)return 65+t;if(t<52)return t-26+97;if(t<62)return t-52+48;if(62==t)return 43;if(63==t)return 47}throw"n:"+t};return o.writeByte=function(n){for(t=t<<8|255&n,r+=8,e+=1;r>=6;)i(t>>>r-6),r-=6},o.flush=function(){if(r>0&&(i(t<<6-r),t=0,r=0),e%3!=0)for(var o=3-e%3,a=0;a<o;a+=1)n+="="},o.toString=function(){return n},o}(),f=a.toByteArray(),c=0;c<f.length;c+=1)u.writeByte(f[c]);return u.flush(),"data:image/gif;base64,"+u};return t}();qrcode.stringToBytesFuncs["UTF-8"]=function(t){return function(t){for(var r=[],e=0;e<t.length;e++){var n=t.charCodeAt(e);n<128?r.push(n):n<2048?r.push(192|n>>6,128|63&n):n<55296||n>=57344?r.push(224|n>>12,128|n>>6&63,128|63&n):(e++,n=65536+((1023&n)<<10|1023&t.charCodeAt(e)),r.push(240|n>>18,128|n>>12&63,128|n>>6&63,128|63&n))}return r}(t)},function(t){"function"==typeof define&&define.amd?define([],t):"object"==typeof exports&&(module.exports=t())}((function(){return qrcode}));
//# sourceMappingURL=/sm/26b4b0d0b1e283d6b3ec9857ac597d7a60c76ac17be1ef4c965f03086de426bb.map
if (typeof window !== 'undefined' && typeof qrcode !== 'undefined') window.qrcode = qrcode;
if (typeof globalThis !== 'undefined' && typeof qrcode !== 'undefined') globalThis.qrcode = qrcode;

function generateQrCodeSvg(text, options = {}) {
  try {
    const fn = (typeof qrcode === 'function')
      ? qrcode
      : ((typeof window !== 'undefined' && window.qrcode) || (typeof globalThis !== 'undefined' && globalThis.qrcode));
    if (!fn) throw new Error('QR code generator unavailable');
    const qr = fn(options.typeNumber || 0, options.errorCorrectionLevel || 'M');
    qr.addData(String(text || 'CTU-PASS'));
    qr.make();
    return qr.createSvgTag({
      cellSize: options.cellSize || 4,
      margin: options.margin !== undefined ? options.margin : 6,
      scalable: true,
      title: options.title || 'Official Campus Transaction Pass QR Code',
      alt: options.alt || 'Scan QR Code for Campus Queue Pass'
    });
  } catch (err) {
    console.error('Failed to generate QR Code SVG:', err);
    return '<svg viewBox="0 0 100 100" width="100%" height="100%"><rect width="100" height="100" fill="#f3f4f6"/><text x="50" y="55" font-size="10" text-anchor="middle" fill="#6b7280">QR Error</text></svg>';
  }
}

function generateBarcodeSvg(code) {
  return generateQrCodeSvg(code);
}

function renderQueuePassCard(appt, title = 'Appointment Confirmed!') {
  const user = currentUser();
  const details = getOfficeDetails(appt.office || appt.type, appt.service);
  const displayOffice = appt.office || details.office || 'Campus Office';
  const displayService = appt.service || appt.type;

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
            <span class="q-val">${escapeHtml(user ? user.sid : '8240873')}</span>
          </div>
          <div class="queue-pass-field">
            <span class="q-label">Section & Program</span>
            <span class="q-val">${escapeHtml(user ? (user.section || 'BSIT 2-A') : 'BSIT 2-A')} · ${escapeHtml(user ? (user.program || 'BSIT') : 'BSIT')}</span>
          </div>
          <div class="queue-pass-field">
            <span class="q-label">Campus Office</span>
            <span class="q-val">${escapeHtml(displayOffice)}</span>
          </div>
          <div class="queue-pass-field">
            <span class="q-label">Specific Transaction</span>
            <span class="q-val"><b>${escapeHtml(displayService)}</b></span>
          </div>
          <div class="queue-pass-field">
            <span class="q-label">Appointment Date</span>
            <span class="q-val"><b>${formatDate(appt.date)}</b></span>
          </div>
          <div class="queue-pass-field">
            <span class="q-label">Designated Time Slot</span>
            <span class="q-val"><b>${appt.time}</b></span>
          </div>
          ${appt.note ? `
          <div class="queue-pass-field" style="grid-column: 1 / -1; background: rgba(59,130,246,0.05); border: 1px solid var(--ln); border-radius: 6px; padding: 8px 12px;">
            <span class="q-label">Subject / Reference Notes</span>
            <span class="q-val" style="color:var(--b2);font-weight:600;font-size:13px">${escapeHtml(appt.note)}</span>
          </div>
          ` : ''}
        </div>

        <div class="queue-qr-wrap">
          <div class="queue-qr-box">
            ${generateQrCodeSvg('CTU-PASS: ' + appt.queue + ' | ID: ' + (user ? user.sid : '8240873') + ' | ' + appt.date + ' ' + appt.time + ' | ' + displayOffice + ' - ' + displayService + ' | Ref: ' + appt.id)}
          </div>
          <div class="queue-qr-code-text">*CTU-DB-${appt.queue}-${appt.id.slice(-4)}*</div>
          <div class="queue-qr-subtext">Scan QR code using any smartphone camera or kiosk scanner to verify appointment authenticity</div>
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

// Queue numbers count up per day and office prefix: ADV-001, REG-001, MIS-001, CSH-001, OSA-001
function nextQueueNumber(date, officeOrService = '', service = '') {
  const details = getOfficeDetails(officeOrService, service);
  const prefix = details.prefix || 'Q';
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
        <div class="sidebar-cloud-status" id="misCloudStatus" title="CTU MIS Central Database">
          <span class="cloud-dot online pulse"></span>
          <span class="cloud-text">CTU MIS: Online</span>
        </div>
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
  render: () => {
    const user = currentUser();
    return `
    <div class="auth"><form class="card" id="loginForm" novalidate>
      <div class="logo center">Enroll<span>Ease</span></div>
      <h2 class="center">Welcome back</h2>
      ${user ? `
      <div style="background:rgba(59,130,246,0.08);border:1px solid var(--ln);border-radius:10px;padding:10px 12px;margin-bottom:14px;font-size:13px;text-align:center">
        Active session: <b>${escapeHtml(user.name)}</b> (${escapeHtml(user.sid)})<br>
        <a href="dashboard.html" style="font-weight:700">Go to Dashboard ➔</a>
      </div>` : ''}
      <p class="muted center">Demo ID: <b>8240873</b> / Password: <b>demo1234</b></p>
      ${inputField('loginId', 'Email Address or Student ID')}
      ${inputField('loginPassword', 'Password', 'password')}
      <a href="#" id="forgotLink">Forgot password?</a><br><br>
      <button class="btn" style="width:100%">Login</button>
      <p class="center">No account yet? <a href="register.html">Register</a></p>
      <p class="center admin-login-option">Are you an administrator? <a href="admin-login/admin-login.html">Admin sign in</a></p>
    </form></div>`;
  },

  setup() {
    select('#loginForm').onsubmit = async event => {
      event.preventDefault();
      clearErrors();
      const typedId = select('#loginId').value.trim();
      const typedPassword = select('#loginPassword').value;

      let valid = true;
      if (!typedId) valid = showError('loginId', 'Enter your email or student ID.');
      if (!typedPassword) valid = showError('loginPassword', 'Enter your password.');
      if (!valid) return;

      let user = allUsers().find(u =>
        u.email.toLowerCase() === typedId.toLowerCase() || u.sid === typedId);

      // Query CTU Central MIS Cloud Database to sync master record
      if (window.CtuMis) {
        try {
          const master = await window.CtuMis.getStudent(typedId);
          if (master) {
            const progMap = {
              'BSIT': 'Bachelor of Science in Information Technology',
              'BSHM': 'Bachelor of Science in Hospitality Management',
              'BSIE': 'Bachelor of Science in Industrial Engineering',
              'BEED': 'Bachelor of Elementary Education',
              'BSED': 'Bachelor of Secondary Education Major in Mathematics',
              'BTLED': 'Bachelor in Technology and Livelihood Education Major in Home Economics',
              'BSF': 'Bachelor of Science in Fisheries',
              'BIT-CT': 'Bachelor of Industrial Technology Major in Computer Technology',
              'BIT-ET': 'Bachelor of Industrial Technology Major in Electronics Technology',
              'BIT-AT': 'Bachelor of Industrial Technology Major in Automotive Technology',
              'BSCS': 'Bachelor of Science in Computer Science'
            };
            const programName = progMap[master.program_code] || master.program_code;
            const yrString = `${master.year_level === 1 ? '1st' : (master.year_level === 2 ? '2nd' : (master.year_level === 3 ? '3rd' : '4th'))} Year`;

            user = {
              name: master.full_name,
              sid: master.student_id,
              email: master.email || `${master.student_id}@student.ctu.edu.ph`,
              password: (user && user.password) ? user.password : 'demo1234',
              contact: master.contact || '0912 345 6789',
              program: programName,
              programCode: master.program_code,
              yearLevel: master.year_level,
              year: yrString,
              section: master.section,
              blockName: master.block_name,
              status: master.academic_status || 'Officially Enrolled'
            };
            const remaining = allUsers().filter(u => u.sid !== user.sid);
            saveData('ee_users', [...remaining, user]);
          }
        } catch (e) {
          console.warn('MIS login lookup notice:', e);
        }
      }

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
      ${inputField('regSid', 'Student ID (7 digits)', 'text', '', 'placeholder="8240873" maxlength="7"')}
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
      if (!/^\d{7}$/.test(sid)) valid = showError('regSid', 'Student ID must be exactly 7 digits (e.g. 8240873).');
      else if (users.some(u => u.sid === sid)) valid = showError('regSid', 'This Student ID is already registered.');
      if (!/^\S+@\S+\.\S+$/.test(email)) valid = showError('regEmail', 'Enter a valid email address.');
      else if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) valid = showError('regEmail', 'This email is already registered.');
      if (password.length < 8) valid = showError('regPassword', 'Password must be at least 8 characters.');
      if (confirm !== password) valid = showError('regConfirm', 'Passwords do not match.');
      if (!valid) return;

      users.push({
        name, sid, email, password, contact: '',
        program: 'Bachelor of Science in Information Technology',
        programCode: 'BSIT',
        yearLevel: 1,
        year: '1st Year',
        section: 'BSIT 1-A',
        enrolled: todayString(),
        status: 'Officially Enrolled'
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
            <div class="study-load-tag">Official Study Load · 1st Semester A.Y. 2025-2026</div>
            <h3 class="study-load-title">${escapeHtml(user.program || 'Bachelor of Science in Information Technology')}</h3>
            <div class="study-load-meta">
              <span class="load-pill">Block: <b>${escapeHtml(user.blockName || user.section || 'BLK_BSIT-2A_DAY')}</b></span>
              <span class="load-pill"><b id="dashCourseCount">--</b> Enrolled Courses</span>
              <span class="load-pill"><b id="dashUnitsCount">--</b> Total Academic Units</span>
              <span class="load-pill status-pill">✓ ${escapeHtml(user.status || 'Officially Enrolled')}</span>
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

    // Fetch dynamic load count and units for this specific student's course & year
    if (window.CtuMis) {
      const user = currentUser();
      const prog = user.programCode || user.program || 'BSIT';
      const yr = user.yearLevel || user.year || 2;
      window.CtuMis.getCurriculum(prog, yr).then(subs => {
        if (subs && subs.length) {
          const countEl = select('#dashCourseCount');
          const unitsEl = select('#dashUnitsCount');
          if (countEl) countEl.textContent = subs.length;
          if (unitsEl) {
            const total = subs.reduce((sum, s) => sum + (parseFloat(s.unit) || 0), 0);
            unitsEl.textContent = total.toFixed(2);
          }
        }
      }).catch(() => {});
    }
  }
};

/* 5. Book appointment */
PAGES['book-appointment'] = {
  render() {
    const offices = Object.keys(ENROLLMENT_OFFICES);
    return withSidebar(`
      <div style="margin-bottom:18px">
        <span style="font-size:11px;font-weight:700;color:var(--b2);text-transform:uppercase;letter-spacing:1px">Campus Enrollment Services</span>
        <h1 style="margin:2px 0 6px">Book Appointment</h1>
        <p class="muted" style="margin:0;font-size:13.5px">Select your destination campus office, specific enrollment service, and preferred schedule.</p>
      </div>

      <div class="card">
        <!-- Step 1: Office Selection -->
        <label for="officeSelect">1. Campus Office / Department</label>
        <select id="officeSelect" style="font-weight:600">
          <option value="">-- Choose Campus Office / Department --</option>
          ${offices.map(o => `<option value="${escapeHtml(o)}">${escapeHtml(o)}</option>`).join('')}
        </select>
        <div id="officeDescText" class="muted" style="font-size:12.5px;margin-top:4px;min-height:16px"></div>

        <!-- Step 2: Specific Service Selection -->
        <div id="serviceContainer" style="margin-top:16px;display:none">
          <label for="serviceSelect">2. Specific Purpose / Service</label>
          <select id="serviceSelect">
            <option value="">-- Select Specific Transaction Purpose --</option>
          </select>
        </div>

        <!-- Step 3: Contextual Note / Subject Input -->
        <div id="noteContainer" style="margin-top:16px;display:none">
          <label for="studentNote" id="studentNoteLabel">Affected Subject Code(s) or Specific Details (Optional)</label>
          <input type="text" id="studentNote" placeholder="e.g., CC 103 lab conflicting with MATH 101 lecture" maxlength="160">
          <div id="studentNoteHint" class="muted" style="font-size:12px;margin-top:4px">
            Providing subject codes or reference details in advance expedites verification at the window.
          </div>
        </div>

        <!-- Step 4: Dynamic Required Documents Checklist & Counter Location -->
        <div id="officeDocBox" class="doc-checklist-box" style="display:none;margin-top:20px">
          <div class="doc-checklist-header">
            <span class="doc-badge" id="serviceBadge">Required Documents</span>
            <span id="officeLocationText" class="doc-location"></span>
          </div>
          <p class="doc-notice-sub" style="margin:4px 0 10px;font-size:12.5px">
            Please prepare the following required physical documents before arriving for your appointment:
          </p>
          <ul id="officeDocList" class="doc-checklist"></ul>
        </div>

        <!-- Step 5: Date & Slots -->
        <div id="dateTimeContainer" style="margin-top:20px;display:none">
          <label for="date">3. Appointment Date</label>
          <input type="date" id="date">
          <label style="margin-top:14px">4. Available Time Slots</label>
          <div id="slots"><p class="muted">Pick a date to see available times.</p></div>
        </div>

        <div class="err" id="error-book" style="margin-top:12px"></div>
        <button class="btn" id="continueButton" disabled style="margin-top:20px;width:100%;max-width:280px">Continue to Summary</button>
      </div>`);
  },

  setup() {
    const officeSelect = select('#officeSelect');
    const officeDescText = select('#officeDescText');
    const serviceContainer = select('#serviceContainer');
    const serviceSelect = select('#serviceSelect');
    const noteContainer = select('#noteContainer');
    const noteInput = select('#studentNote');
    const noteLabel = select('#studentNoteLabel');
    const docBox = select('#officeDocBox');
    const locText = select('#officeLocationText');
    const docList = select('#officeDocList');
    const serviceBadge = select('#serviceBadge');
    const dateTimeContainer = select('#dateTimeContainer');
    const continueBtn = select('#continueButton');

    // Retrieve previous draft if student pressed "Back" on summary
    const savedDraft = JSON.parse(sessionStorage.getItem('ee_draft') || 'null');

    let chosenOffice = '';
    let chosenService = '';
    let chosenDate = null;
    let chosenTime = null;

    function renderServicesForOffice(officeName, preselectService = '') {
      const officeData = ENROLLMENT_OFFICES[officeName];
      if (!officeData) {
        serviceContainer.style.display = 'none';
        noteContainer.style.display = 'none';
        docBox.style.display = 'none';
        dateTimeContainer.style.display = 'none';
        officeDescText.textContent = '';
        continueBtn.disabled = true;
        return;
      }

      officeDescText.textContent = officeData.description || '';
      serviceSelect.innerHTML = `<option value="">-- Select Specific Transaction Purpose --</option>` +
        Object.keys(officeData.services).map(srv =>
          `<option value="${escapeHtml(srv)}"${srv === preselectService ? ' selected' : ''}>${escapeHtml(srv)}</option>`
        ).join('');

      serviceContainer.style.display = 'block';

      if (preselectService && officeData.services[preselectService]) {
        serviceSelect.value = preselectService;
        updateServiceDetails(officeName, preselectService);
      } else {
        noteContainer.style.display = 'none';
        docBox.style.display = 'none';
        dateTimeContainer.style.display = 'none';
        continueBtn.disabled = true;
      }
    }

    function updateServiceDetails(officeName, serviceName) {
      const officeData = ENROLLMENT_OFFICES[officeName];
      if (!officeData || !serviceName || !officeData.services[serviceName]) {
        noteContainer.style.display = 'none';
        docBox.style.display = 'none';
        dateTimeContainer.style.display = 'none';
        continueBtn.disabled = true;
        return;
      }

      const srvData = officeData.services[serviceName];

      // Update contextual note field
      noteLabel.textContent = srvData.hint || 'Affected Subject Code(s) or Specific Details (Optional)';
      noteInput.placeholder = srvData.placeholder || 'e.g., CC 103 conflicting with MATH 101';
      noteContainer.style.display = 'block';

      // Update document checklist and window location
      serviceBadge.textContent = `${officeData.prefix} Checklist`;
      locText.textContent = '📍 ' + (srvData.window || officeData.defaultWindow);
      docList.innerHTML = (srvData.docs || []).map(doc => `
        <li class="doc-item">
          <span class="doc-check-icon">✓</span>
          <span>${escapeHtml(doc)}</span>
        </li>
      `).join('');
      docBox.style.display = 'block';

      // Show date/time picker
      dateTimeContainer.style.display = 'block';
      continueBtn.disabled = !(chosenOffice && chosenService && chosenDate && chosenTime);
    }

    officeSelect.onchange = () => {
      chosenOffice = officeSelect.value;
      chosenService = '';
      chosenDate = null;
      chosenTime = null;
      const dateInput = select('#date');
      if (dateInput) dateInput.value = '';
      const slotBox = select('#slots');
      if (slotBox) slotBox.innerHTML = '<p class="muted">Pick a date to see available times.</p>';
      continueBtn.disabled = true;
      clearErrors();
      renderServicesForOffice(chosenOffice);
    };

    serviceSelect.onchange = () => {
      chosenService = serviceSelect.value;
      clearErrors();
      updateServiceDetails(chosenOffice, chosenService);
    };

    setupTimePicker(null, (date, time) => {
      chosenDate = date;
      chosenTime = time;
      continueBtn.disabled = !(chosenOffice && chosenService && chosenDate && chosenTime);
    });

    continueBtn.onclick = () => {
      if (!chosenOffice || !chosenService) {
        return showError('book', 'Please select both an office and a specific transaction purpose.');
      }
      if (!chosenDate || !chosenTime) {
        return showError('book', 'Select an appointment date and an available time slot.');
      }

      const draft = {
        office: chosenOffice,
        service: chosenService,
        type: chosenService, // Backwards compatible identifier
        note: (noteInput.value || '').trim(),
        date: chosenDate,
        time: chosenTime
      };

      sessionStorage.setItem('ee_draft', JSON.stringify(draft));
      goTo('appointment-summary');
    };

    // If returning from summary, restore selected inputs including date and slot
    if (savedDraft && savedDraft.office && ENROLLMENT_OFFICES[savedDraft.office]) {
      officeSelect.value = savedDraft.office;
      chosenOffice = savedDraft.office;
      chosenService = savedDraft.service || savedDraft.type || '';
      renderServicesForOffice(chosenOffice, chosenService);
      if (savedDraft.note) {
        noteInput.value = savedDraft.note;
      }
      if (savedDraft.date) {
        const dateInput = select('#date');
        if (dateInput) {
          dateInput.value = savedDraft.date;
          dateInput.dispatchEvent(new Event('change'));
          if (savedDraft.time) {
            chosenDate = savedDraft.date;
            chosenTime = savedDraft.time;
            setTimeout(() => {
              const matchingSlot = select(`.slot[data-time="${savedDraft.time}"]`);
              if (matchingSlot && !matchingSlot.disabled) {
                matchingSlot.classList.add('sel');
                continueBtn.disabled = false;
              }
            }, 60);
          }
        }
      }
    }
  }
};

/* 6. Appointment summary */
PAGES['appointment-summary'] = {
  render() {
    const draft = JSON.parse(sessionStorage.getItem('ee_draft') || 'null');
    if (!draft) { goTo('book-appointment'); return ''; }

    const user = currentUser();
    const details = getOfficeDetails(draft.office || draft.type, draft.service);
    const qNum = nextQueueNumber(draft.date, draft.office || draft.type, draft.service);

    const summaryDetails = {
      'Student Name': user ? user.name : 'Enrolled Student',
      'Student ID': user ? user.sid : '8240873',
      'Section & Program': `${user ? (user.section || 'BSIT 2-A') : 'BSIT 2-A'} · ${user ? (user.program || 'BSIT') : 'BSIT'}`,
      'Campus Office': draft.office || details.office || 'Campus Office',
      'Specific Purpose': draft.service || draft.type,
      'Appointment Date': formatDate(draft.date),
      'Scheduled Time': draft.time,
      'Designated Window': details.window || 'Administration Building'
    };

    if (draft.note) {
      summaryDetails['Affected Subjects / Notes'] = draft.note;
    }

    return withSidebar(`
      <h1>Appointment Summary</h1>
      <div class="card">
        <div style="display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--ln);padding-bottom:14px;margin-bottom:16px;flex-wrap:wrap;gap:12px">
          <div>
            <span style="font-size:11px;text-transform:uppercase;letter-spacing:1px;font-weight:700;color:var(--b2)">${escapeHtml(draft.office || 'Campus Office Visit')}</span>
            <h3 style="margin:4px 0 0;font-size:18px">${escapeHtml(draft.service || draft.type)}</h3>
            <div class="muted" style="font-size:13px;margin-top:2px">📍 ${escapeHtml(details.window || 'Administration Building')}</div>
          </div>
          <div style="text-align:right">
            <span style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:var(--mu)">Estimated Queue #</span>
            <div style="font-size:26px;font-weight:800;color:var(--b2);letter-spacing:1px">${qNum}</div>
          </div>
        </div>

        ${detailsList(summaryDetails)}

        <h3 class="sec" style="font-size:15px;margin-top:20px;display:flex;align-items:center;gap:6px">
          📋 <span>Required Physical Documents to Present</span>
        </h3>
        <ul style="margin:8px 0 16px;padding-left:20px;line-height:1.7;color:var(--tx);font-size:14px">
          ${(details.docs || ['Valid CTU Student ID Card', 'Pre-Enrollment Advising Slip']).map(d => `<li><b>${escapeHtml(d)}</b></li>`).join('')}
        </ul>

        <div style="background:rgba(59,130,246,0.06);border:1px solid var(--ln);border-radius:8px;padding:12px 14px;margin-bottom:20px">
          <b style="font-size:13px;color:var(--b)">Important Reminder:</b>
          <p style="margin:4px 0 0;font-size:12.5px;color:var(--mu);line-height:1.5">
            Arrive at <b>${escapeHtml(details.window || 'the designated window')}</b> 15 minutes before your schedule. Bring your physical documents and official CTU Student ID. Your digital queue ticket will be scanned upon arrival.
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
      const qNum = nextQueueNumber(draft.date, draft.office || draft.type, draft.service);
      const appointment = {
        id: 'a' + Date.now(),
        sid: loadData('ee_session'),
        office: draft.office || 'Campus Office',
        service: draft.service || draft.type,
        type: draft.service || draft.type,
        note: draft.note || '',
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

      // Sync appointment to EnrollEase Supabase Cloud Database
      if (window.EnrollEaseCloud) {
        window.EnrollEaseCloud.saveAppointment(appointment);
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

    const card = (appt, isUpcoming) => {
      const details = getOfficeDetails(appt.office || appt.type, appt.service);
      const displayOffice = appt.office || details.office || 'Campus Office';
      const displayService = appt.service || appt.type;
      return `
        <div class="card ap">
          <div>
            <div style="font-size:11px;font-weight:700;color:var(--b2);text-transform:uppercase;letter-spacing:0.5px">${escapeHtml(displayOffice)}</div>
            <b style="font-size:15px">${escapeHtml(displayService)}</b>
            ${appt.note ? `<div style="font-size:12.5px;color:var(--mu);margin-top:2px">Ref: <i>${escapeHtml(appt.note)}</i></div>` : ''}
            <div class="muted" style="font-size:13px;margin-top:3px">${formatDate(appt.date)} · ${appt.time}${isUpcoming ? ' · Queue <b style="color:var(--b)">' + appt.queue + '</b>' : ''}</div>
          </div>
          <span class="badge ${isUpcoming ? (appt.status === 'Rescheduled' ? 'p' : '') : 'd'}">
            ${isUpcoming ? appt.status : 'Completed'}</span>
          ${isUpcoming ? `<div class="row">
            <button class="btn sm alt" data-details="${appt.id}">View Details</button>
            <button class="btn sm" data-reschedule="${appt.id}">Reschedule</button></div>` : ''}
        </div>`;
    };

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
        if (!appt) return;
        const details = getOfficeDetails(appt.office || appt.type, appt.service);
        const modalDetails = {
          'Campus Office': appt.office || details.office || 'Campus Office',
          'Transaction': appt.service || appt.type,
          'Date': formatDate(appt.date),
          'Time': appt.time,
          'Status': appt.status,
          'Designated Window': details.window || 'Administration Building'
        };
        if (appt.note) {
          modalDetails['Subject / Details'] = appt.note;
        }

        const popup = showModal(`
          <div style="text-align:center;margin-bottom:12px">
            <span style="font-size:11px;font-weight:700;color:var(--b2);letter-spacing:1px;text-transform:uppercase">Campus Queue Ticket</span>
            <div style="font-size:36px;font-weight:900;color:var(--b2);letter-spacing:1px;margin:2px 0">${appt.queue}</div>
            <div style="font-size:12.5px;color:var(--tx);font-weight:600">📍 ${escapeHtml(details.window || 'Administration Building')}</div>
          </div>
          ${detailsList(modalDetails)}
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

    const reschedDetails = {
      'Campus Office': appt.office || 'Campus Office',
      'Transaction Purpose': appt.service || appt.type,
      'Current Date': formatDate(appt.date),
      'Current Time': appt.time,
      'Current Queue Ticket': appt.queue
    };
    if (appt.note) {
      reschedDetails['Subject / Reference'] = appt.note;
    }

    return withSidebar(`
      <h1>Reschedule Appointment</h1>
      <div class="card">
        <h3>Current Appointment</h3>
        ${detailsList(reschedDetails)}
      </div>
      <div class="card sec">
        <label for="date">Select New Date</label>
        <input type="date" id="date">
        <label style="margin-top:14px">Select New Available Time</label>
        <div id="slots"></div>
        <div class="row" style="margin-top:18px">
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
      if (!appt) return;
      appt.date = newDate;
      appt.time = newTime;
      appt.queue = nextQueueNumber(newDate, appt.office || appt.type, appt.service);
      appt.status = 'Rescheduled';
      saveData('ee_appointments', list);
      saveData('ee_last', id);
      const user = currentUser();
      if (user) {
        syncToAdminDashboard(appt, user);
      }
      if (window.EnrollEaseCloud) {
        window.EnrollEaseCloud.saveAppointment(appt);
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
            <div class="ctu-info-item"><span class="val" id="ctuProgDisplay">${escapeHtml((user.programCode || 'BSIT') + ' ' + (user.yearLevel || (user.year ? user.year[0] : '2')))}</span></div>
            <div class="ctu-block-name" id="ctuBlockDisplay">${escapeHtml(user.blockName || blockName)}</div>
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
                <tbody id="ctuSubjectsTbody">
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
                    <td class="center font-mono" id="ctuTotalUnits">28.00</td>
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
                <tbody id="ctuFeesTbody">
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
                    <td class="right font-mono" id="ctuTotalCharges">9205.00</td>
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

    // Dynamic Query to CTU Central MIS Cloud Database
    if (window.CtuMis) {
      const user = currentUser();
      const prog = user.programCode || user.program || 'BSIT';
      const yr = user.yearLevel || user.year || 2;

      Promise.all([
        window.CtuMis.getCurriculum(prog, yr),
        window.CtuMis.getFees(prog, yr),
        window.CtuMis.getStudent(user.sid)
      ]).then(([remoteSubjects, remoteFees, masterStudent]) => {
        if (remoteSubjects && remoteSubjects.length) {
          const subBody = select('#ctuSubjectsTbody');
          const totalUnitsCell = select('#ctuTotalUnits');
          if (subBody) {
            subBody.innerHTML = remoteSubjects.map(s => `
              <tr>
                <td class="center ctu-sub-code">${escapeHtml(s.section_code || s.section || '')}</td>
                <td class="ctu-sub-code">${escapeHtml(s.subject_code || s.subject || '')}</td>
                <td class="ctu-sub-desc">${escapeHtml(s.description || s.desc || '')}</td>
                <td class="center font-mono">${escapeHtml(Number(s.unit).toFixed(2))}</td>
                <td style="white-space:nowrap">${escapeHtml(s.time || '')}</td>
                <td class="center">${escapeHtml(s.day || '')}</td>
                <td>${escapeHtml(s.room || '')}</td>
              </tr>
            `).join('');
            const total = remoteSubjects.reduce((sum, s) => sum + (parseFloat(s.unit) || 0), 0);
            if (totalUnitsCell) totalUnitsCell.textContent = total.toFixed(2);
          }
        }

        if (remoteFees && remoteFees.length) {
          const feeBody = select('#ctuFeesTbody');
          const totalChargesCell = select('#ctuTotalCharges');
          if (feeBody) {
            feeBody.innerHTML = remoteFees.map(f => `
              <tr>
                <td>${escapeHtml(f.fee_name || f.fee || '')}</td>
                <td class="right font-mono">${escapeHtml(Number(f.amount).toFixed(2))}</td>
              </tr>
            `).join('');
            const total = remoteFees.reduce((sum, f) => sum + (parseFloat(f.amount) || 0), 0);
            if (totalChargesCell) totalChargesCell.textContent = total.toFixed(2);
          }
        }

        if (masterStudent) {
          if (masterStudent.block_name) {
            const blockEl = select('#ctuBlockDisplay');
            if (blockEl) blockEl.textContent = masterStudent.block_name;
          }
          if (masterStudent.program_code) {
            const progEl = select('#ctuProgDisplay');
            if (progEl) progEl.textContent = `${masterStudent.program_code} ${masterStudent.year_level || ''}`;
          }
        }
      }).catch(err => {
        console.warn('Live MIS fetch notice (using cached load):', err);
      });
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
} else if (loggedIn && currentPage === 'register') {
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

  // Live CTU Central MIS Cloud Connection Health Check
  const cloudBadge = select('#misCloudStatus');
  if (cloudBadge && window.CtuMis) {
    window.CtuMis.checkConnection().then(res => {
      if (res.connected) {
        cloudBadge.innerHTML = `<span class="cloud-dot online pulse"></span><span class="cloud-text">CTU MIS: Online (${res.latency}ms)</span>`;
        cloudBadge.title = `Connected to CTU MIS Central Cloud Database (Singapore)\nLatency: ${res.latency}ms`;
      } else {
        cloudBadge.innerHTML = `<span class="cloud-dot fallback"></span><span class="cloud-text">CTU MIS: Offline</span>`;
      }
    }).catch(() => {});
  }

  // Show a message left by the previous page
  const message = sessionStorage.getItem('ee_flash');
  if (message) {
    sessionStorage.removeItem('ee_flash');
    showToast(message);
  }
}
