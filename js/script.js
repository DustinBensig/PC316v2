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
