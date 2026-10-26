(() => {
  "use strict";

  const departments = ["SSG", "CodeTech", "COED", "HM", "BIT", "Registrar", "Clinic", "Cashier", "Guidance"];
  const roleNames = { MIS: "MIS · Main Admin", SSG: "SSG Admin", CodeTech: "CodeTech Admin", COED: "COED Admin", HM: "HM Admin", BIT: "BIT Admin", Registrar: "Registrar Admin", Clinic: "Clinic Admin", Cashier: "Cashier Admin", Guidance: "Guidance Admin" };
  const permissionCatalog = {
    SSG: [["appointments.read.assigned", "View assigned appointments"], ["appointments.update.assigned", "Update SSG appointments"], ["students.read.assigned", "View assigned student information"], ["announcements.manage", "Manage announcements"]],
    CodeTech: [["appointments.read.assigned", "View assigned appointments"], ["appointments.update.assigned", "Update CodeTech appointments"], ["students.read.assigned", "View assigned student information"], ["documents.verify.assigned", "Verify required documents"]],
    COED: [["appointments.read.assigned", "View assigned appointments"], ["appointments.update.assigned", "Update COED appointments"], ["students.read.assigned", "View assigned student information"], ["documents.verify.assigned", "Verify required documents"]],
    HM: [["appointments.read.assigned", "View assigned appointments"], ["appointments.update.assigned", "Update HM appointments"], ["students.read.assigned", "View assigned student information"], ["documents.verify.assigned", "Verify required documents"]],
    BIT: [["appointments.read.assigned", "View assigned appointments"], ["appointments.update.assigned", "Update BIT appointments"], ["students.read.assigned", "View assigned student information"], ["documents.verify.assigned", "Verify required documents"]],
    Registrar: [["students.read", "View enrollment student records"], ["enrollment_records.read", "Review enrollment records"], ["enrollment_records.update", "Update enrollment status"], ["documents.review", "Review student documents"]],
    Clinic: [["clearances.medical.read", "View medical clearance records"], ["clearances.medical.update", "Update medical clearance"]],
    Cashier: [["payments.read", "View payment records and history"], ["payments.update", "Record payment status"]],
    Guidance: [["clearances.guidance.read", "View guidance clearance records"], ["clearances.guidance.update", "Update guidance clearance"]]
  };
  const icons = { dashboard: "▦", appointments: "▤", students: "♙", workflow: "⇢", records: "▧", documents: "▣", clearances: "✓", payments: "₱", announcements: "◉", admins: "♧", reports: "▥", activity: "◷", settings: "⚙" };
  const names = ["Alyssa Santos", "Miguel Reyes", "Sofia Garcia", "Daniel Cruz", "Isabella Flores", "Nathan Lim", "Camille Ramos", "Ethan Dela Cruz", "Mia Mendoza", "Joshua Tan", "Gabrielle Bautista", "Liam Navarro", "Chloe Aquino", "Noah Villanueva"];
  const programs = ["BS Information Technology", "BS Computer Science", "BS Education", "BS Hospitality Management", "BS Industrial Technology"];
  const today = new Date();
  const dateString = (offset) => {
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() + offset);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  };
  const statuses = ["Pending", "Approved", "Completed", "Submitted", "Rescheduled", "Rejected", "Cancelled"];
  const initials = (text) => text.split(/\s+/).map((part) => part[0]).slice(0, 2).join("").toUpperCase();
  const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
  const slug = (value) => String(value).toLowerCase().replace(/\s+/g, "-");
  const load = (key, fallback) => {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  };
  const save = (key, value) => localStorage.setItem(key, JSON.stringify(value));
  const demoAppointments = names.map((student, index) => ({
    id: `EA-${2401 + index}`, student, studentId: `2026-${String(index + 101).padStart(5, "0")}`,
    program: programs[index % programs.length], department: departments[index % departments.length],
    date: dateString(index % 5), time: ["08:30 AM", "09:00 AM", "10:30 AM", "11:00 AM", "01:00 PM", "02:30 PM"][index % 6],
    status: ["Pending", "Approved", "Completed", "Submitted", "Pending", "Approved", "Completed"][index % 7],
    clinic: ["Cleared", "Pending", "Cleared", "Pending", "Not Cleared"][index % 5],
    guidance: ["Cleared", "Pending", "Cleared", "Referred"][index % 4],
    payment: ["Paid", "Pending", "Unpaid", "Paid"][index % 4],
    registrar: ["Completed", "Pending", "Completed"][index % 3],
    documents: index % 3 === 0 ? "Needs review" : "Verified"
  }));

  let appointments = load("enrolle_admin_appointments", demoAppointments);
  let studentAccounts = load("enrolle_admin_students", Object.fromEntries(demoAppointments.map((item, index) => [item.studentId, {
    studentId: item.studentId,
    name: item.student,
    email: `${item.student.toLowerCase().replace(/\s+/g, ".")}@student.college.edu`,
    program: item.program,
    homeDepartment: ["CodeTech", "COED", "HM", "BIT"][index % 4],
    active: true
  }])));
  let admins = load("enrolle_admin_accounts", [
    { name: "Maria L. Dizon", email: "mis@college.edu", department: "MIS", role: "Main Admin", active: true },
    ...departments.map((department, index) => ({ name: `${["Angela", "Brian", "Carla", "David", "Elena", "Francis", "Grace", "Henry", "Iris"][index]} ${["Torres", "Reyes", "Garcia", "Cruz", "Lim", "Ramos", "Santos", "Tan", "Mendoza"][index]}`, email: `${department.toLowerCase()}@college.edu`, department, role: roleNames[department], active: true }))
  ]);
  let rolePermissions = load("enrolle_admin_role_permissions", Object.fromEntries(Object.entries(permissionCatalog).map(([department, permissions]) => [department, permissions.map(([key]) => key)])));
  let systemSettings = load("enrolle_admin_settings", { academicYear: "2026–2027", appointmentDays: "Monday–Friday", openingTime: "08:00", closingTime: "17:00", studentNotifications: true });
  let announcements = load("enrolle_admin_announcements", [
    { title: "Enrollment week office hours", body: "Offices are open from 8:00 AM to 5:00 PM during enrollment week.", author: "SSG", created: dateString(0) },
    { title: "Document checklist reminder", body: "Please bring your student ID and original supporting documents to your appointment.", author: "SSG", created: dateString(-1) }
  ]);
  let notifications = load("enrolle_admin_notifications", [
    { message: "4 student requirements are awaiting review.", created: "Just now", read: false, department: "MIS" },
    { message: "Enrollment status updated for EA-2402.", created: "18 min ago", read: false, department: "SSG" },
    { message: "Registrar confirmed 3 completed records.", created: "1 hour ago", read: true, department: "Registrar" }
  ]);
  let activity = load("enrolle_admin_activity", [
    { message: "<strong>Registrar</strong> completed 3 enrollment records.", time: "12 minutes ago", department: "Registrar" },
    { message: "<strong>Clinic</strong> marked a medical clearance as pending.", time: "36 minutes ago", department: "Clinic" },
    { message: "<strong>Cashier</strong> recorded a student payment.", time: "1 hour ago", department: "Cashier" }
  ]);
  // Strict Route Guard: Require authenticated session from admin login
  const authenticatedRole = sessionStorage.getItem("enrolle_admin_authenticated_role");
  if (!authenticatedRole || !roleNames[authenticatedRole]) {
    sessionStorage.removeItem("enrolle_admin_authenticated_role");
    sessionStorage.removeItem("enrolle_admin_authenticated_name");
    sessionStorage.removeItem("enrolle_admin_authenticated_email");
    localStorage.removeItem("enrolle_admin_role");
    window.location.replace("admin-login/admin-login.html?auth=required");
    return;
  }
  let role = authenticatedRole;
  let activeSection = "dashboard";
  let searchQuery = "";
  let statusFilter = "All statuses";
  let toastTimer;

  const app = document.querySelector("#admin-app");
  const navForRole = (activeRole) => {
    const menu = [["dashboard", "Overview"]];
    if (activeRole === "MIS") menu.push(["appointments", "Appointments"], ["students", "Students"], ["workflow", "Enrollment workflow"], ["announcements", "Announcements"], ["admins", "Admin accounts"], ["reports", "Reports"], ["activity", "Activity log"], ["settings", "System settings"]);
    else {
      if (hasPermission("appointments.read.assigned")) menu.push(["appointments", "Appointments"]);
      if (hasPermission("students.read") || hasPermission("students.read.assigned")) menu.push(["students", "Students"]);
      if (hasPermission("students.read") || hasPermission("students.read.assigned") || hasPermission("appointments.read.assigned")) menu.push(["workflow", "Enrollment workflow"]);
      if (hasPermission("enrollment_records.read")) menu.push(["records", "Enrollment records"]);
      if (hasPermission("documents.verify.assigned") || hasPermission("documents.review")) menu.push(["documents", "Documents"]);
      if (hasPermission("clearances.medical.read") || hasPermission("clearances.guidance.read")) menu.push(["clearances", "Clearances"]);
      if (hasPermission("payments.read")) menu.push(["payments", "Payments"]);
      if (hasPermission("announcements.manage")) menu.push(["announcements", "Announcements"]);
    }
    return menu;
  };
  const currentAdmin = () => {
    const admin = admins.find((entry) => entry.department === role) || admins[0];
    const signedInName = sessionStorage.getItem("enrolle_admin_authenticated_name");
    return signedInName ? { ...admin, name: signedInName } : admin;
  };
  const hasPermission = (permission) => role === "MIS" || (rolePermissions[role] || []).includes(permission);
  const visibleNotifications = () => role === "MIS" ? notifications : notifications.filter((item) => item.department === role || item.department === "all");
  const canAccessSection = (section) => {
    if (section === "dashboard" || role === "MIS") return true;
    if (section === "appointments") return hasPermission("appointments.read.assigned");
    if (section === "students") return hasPermission("students.read") || hasPermission("students.read.assigned");
    if (section === "workflow") return hasPermission("students.read") || hasPermission("students.read.assigned") || hasPermission("appointments.read.assigned");
    if (section === "documents") return hasPermission("documents.verify.assigned") || hasPermission("documents.review");
    if (section === "records") return hasPermission("enrollment_records.read");
    if (section === "clearances") return hasPermission(role === "Clinic" ? "clearances.medical.read" : "clearances.guidance.read");
    if (section === "payments") return hasPermission("payments.read");
    if (section === "announcements") return hasPermission("announcements.manage");
    return false;
  };
  const canEditField = (field) => {
    if (role === "MIS") return true;
    if (field === "status") return canUpdateAppointment();
    if (field === "documents") return hasPermission(role === "Registrar" ? "documents.review" : "documents.verify.assigned");
    if (field === "registrar") return hasPermission("enrollment_records.update");
    if (field === "clinic") return hasPermission("clearances.medical.update");
    if (field === "guidance") return hasPermission("clearances.guidance.update");
    if (field === "payment") return hasPermission("payments.update");
    return false;
  };
  const scoped = () => {
    const activeStudents = (item) => role === "MIS" || studentAccounts[item.studentId]?.active !== false;
    if (role === "MIS" || role === "Registrar" || ["Clinic", "Guidance", "Cashier"].includes(role)) return appointments.filter(activeStudents);
    return appointments.filter((item) => item.department === role && activeStudents(item));
  };
  const searched = (items) => {
    const query = searchQuery.trim().toLowerCase();
    return items.filter((item) => !query || [item.student, item.studentId, item.program, item.department, ...(role === "MIS" || hasPermission("appointments.read.assigned") ? [item.id] : [])].some((value) => String(value || "").toLowerCase().includes(query)));
  };
  const appointmentsForSection = () => {
    const items = searched(scoped());
    return statusFilter === "All statuses" ? items : items.filter((item) => item.status === statusFilter);
  };
  const canUpdateAppointment = () => role === "MIS" || (hasPermission("appointments.read.assigned") && hasPermission("appointments.update.assigned"));
  const titleFor = (section) => ({
    dashboard: "Dashboard overview", appointments: "Appointments", students: "Students",
    workflow: "Enrollment workflow", records: "Enrollment records", documents: "Document verification",
    clearances: `${role} clearance`, payments: "Payment tracking", announcements: "Announcements",
    admins: "Administrator accounts", reports: "Enrollment reports", activity: "Activity log",
    settings: "System settings"
  })[section] || "Dashboard overview";
  const readableDate = (date) => new Date(`${date}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const statusPill = (status) => `<span class="status ${slug(status)}">${escapeHtml(status)}</span>`;
  const scopedTitle = () => role === "MIS" ? "All departments" : `${role} · restricted department view`;

  function renderSidebar() {
    const menu = navForRole(role);
    return `<aside class="sidebar" id="sidebar">
      <div class="brand"><span class="brand-mark">E</span><span class="brand-name">enroll<span>ease</span></span></div>
      <div class="nav-label">Workspace</div>
      <nav class="nav-list" aria-label="Admin navigation">
        ${menu.map(([key, label]) => `<button class="nav-link ${activeSection === key ? "active" : ""}" data-section="${key}"><span class="nav-icon" aria-hidden="true">${icons[key] || "◦"}</span><span>${label}</span>${key === "appointments" && scoped().filter((item) => item.status === "Pending").length ? `<span class="nav-count">${scoped().filter((item) => item.status === "Pending").length}</span>` : ""}</button>`).join("")}
      </nav>
      <div class="sidebar-bottom">
        <div class="role-card"><small>ACTIVE ADMIN ROLE</small><strong>${escapeHtml(roleNames[role])}</strong><span class="role-badge">${role === "MIS" ? "Full system access" : `${escapeHtml(role)} data only`}</span></div>
      </div>
    </aside>`;
  }

  function renderTopbar() {
    const admin = currentAdmin();
    return `<header class="topbar">
      <div class="topbar-left"><button class="icon-button hamburger" id="menu-toggle" aria-label="Open navigation">☰</button><div class="breadcrumb">Administration <span aria-hidden="true">/</span> <b>${escapeHtml(titleFor(activeSection))}</b></div></div>
      <div class="topbar-right">
        <label class="search-box"><span aria-hidden="true">⌕</span><input id="global-search" type="search" value="${escapeHtml(searchQuery)}" placeholder="Search students, ID..." aria-label="Search students and appointments"></label>
        <button class="icon-button" id="notification-toggle" aria-label="Notifications">♧${visibleNotifications().some((item) => !item.read) ? '<span class="notification-dot"></span>' : ""}</button>
        <div class="profile"><span class="avatar">${initials(admin.name)}</span><span><span class="profile-name">${escapeHtml(admin.name)}</span><span class="profile-role">${escapeHtml(roleNames[role])}</span></span></div>
        <button class="button small signout-button" id="admin-signout" type="button">Sign out</button>
      </div>
    </header>`;
  }

  function renderHeading(title, subtitle, action = "") {
    return `<div class="page-heading"><div><div class="eyebrow">Wednesday, ${today.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</div><h1>${escapeHtml(title)}</h1><p class="heading-subtitle">${escapeHtml(subtitle)}</p></div>${action}</div>`;
  }

  function renderStats() {
    const items = scoped();
    const todayCount = items.filter((item) => item.date === dateString(0)).length;
    const pending = items.filter((item) => item.status === "Pending").length;
    const approved = items.filter((item) => item.status === "Approved").length;
    const completed = items.filter((item) => item.status === "Completed").length;
    const cancelled = items.filter((item) => ["Cancelled", "Rejected"].includes(item.status)).length;
    const students = role === "MIS" ? Object.keys(studentAccounts).length : new Set(items.map((item) => item.studentId)).size;
    let stats;
    if (role === "Clinic") stats = [["Students with medical requirements", students, "♙", "", "Medical-clearance records"], ["Cleared", items.filter((item) => item.clinic === "Cleared").length, "✓", "green", "Medical status"], ["Pending", items.filter((item) => item.clinic === "Pending").length, "◷", "amber", "Medical status"], ["Not cleared", items.filter((item) => item.clinic === "Not Cleared").length, "×", "red", "Medical status"]];
    else if (role === "Guidance") stats = [["Students with guidance requirements", students, "♙", "", "Guidance-clearance records"], ["Cleared", items.filter((item) => item.guidance === "Cleared").length, "✓", "green", "Guidance status"], ["Pending", items.filter((item) => item.guidance === "Pending").length, "◷", "amber", "Guidance status"], ["Referred", items.filter((item) => item.guidance === "Referred").length, "×", "red", "Guidance status"]];
    else if (role === "Cashier") stats = [["Students with payment requirements", students, "♙", "", "Payment records"], ["Paid", items.filter((item) => item.payment === "Paid").length, "✓", "green", "Payment status"], ["Pending", items.filter((item) => item.payment === "Pending").length, "◷", "amber", "Payment status"], ["Unpaid", items.filter((item) => item.payment === "Unpaid").length, "×", "red", "Payment status"]];
    else if (role === "Registrar") stats = [["Student records", students, "♙", "", "Enrollment records"], ["Records to review", items.filter((item) => item.registrar === "Pending").length, "◷", "amber", "Registrar queue"], ["Requirements confirmed", items.filter((item) => item.registrar === "Completed").length, "✓", "green", "Registrar status"]];
    else stats = [["Total Students", students, "♙", "", "In your assigned view"], ["Today's Appointments", todayCount, "▤", "blue", `${items.length} appointments in scope`], ["Pending Appointments", pending, "◷", "amber", "Awaiting review"], ["Approved Appointments", approved, "✓", "green", "Ready to proceed"], ["Completed Appointments", completed, "✓", "green", "Appointment finished"], ["Cancelled", cancelled, "×", "red", "Rejected or cancelled"]];
    return `<div class="stats-grid">${stats.map(([label, value, icon, color, foot]) => `<article class="stat-card"><div class="stat-top"><span>${label}</span><span class="stat-icon ${color}">${icon}</span></div><div class="stat-value">${value}</div><div class="stat-foot">${foot}</div></article>`).join("")}</div>`;
  }

  function renderCalendar() {
    const mondayOffset = (today.getDay() + 6) % 7;
    const monday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - mondayOffset);
    const dates = Array.from({ length: 7 }, (_, index) => new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + index));
    const marks = scoped();
    return `<div class="calendar">${dates.map((date) => {
      const iso = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
      const count = marks.filter((item) => item.date === iso).length;
      return `<div class="calendar-day ${iso === dateString(0) ? "today" : ""}"><div class="calendar-weekday">${date.toLocaleDateString("en-US", { weekday: "short" })}</div><div class="calendar-date">${date.getDate()}</div>${count ? `<span class="calendar-dot"></span>${count > 1 ? '<span class="calendar-dot alt"></span>' : ""}` : ""}</div>`;
    }).join("")}</div>`;
  }

  function renderActivity() {
    const events = role === "MIS" ? activity : activity.filter((item) => item.department === role);
    return events.length ? `<div class="activity-list">${events.slice(0, 5).map((event, index) => `<div class="activity-item"><span class="activity-marker ${index % 3 === 1 ? "green" : index % 3 === 2 ? "amber" : ""}"></span><div class="activity-copy">${event.message}<span class="activity-time">${escapeHtml(event.time)}</span></div></div>`).join("")}</div>` : '<div class="empty-state">No department activity recorded yet.</div>';
  }

  function renderProgress() {
    const list = scoped();
    const countFor = (key, value) => list.filter((item) => item[key] === value).length;
    const total = Math.max(1, list.length);
    let data;
    if (role === "MIS") data = [["Department", countFor("status", "Completed")], ["Registrar", countFor("registrar", "Completed")], ["Clinic", countFor("clinic", "Cleared")], ["Guidance", countFor("guidance", "Cleared")], ["Cashier", countFor("payment", "Paid")]];
    else if (role === "Registrar") data = [["Enrollment records", countFor("registrar", "Completed")]];
    else if (role === "Clinic") data = [["Medical clearance", countFor("clinic", "Cleared")]];
    else if (role === "Guidance") data = [["Guidance clearance", countFor("guidance", "Cleared")]];
    else if (role === "Cashier") data = [["Payments", countFor("payment", "Paid")]];
    else if (hasPermission("appointments.read.assigned")) {
      data = [["Appointments", countFor("status", "Completed")]];
      if (hasPermission("documents.verify.assigned")) data.push(["Documents verified", countFor("documents", "Verified")]);
    } else data = [["Students", students]];
    return data.map(([label, count]) => `<div class="progress-row"><span>${label}</span><span class="progress-track"><span class="progress-fill" style="display:block;width:${Math.round(count / total * 100)}%"></span></span><span>${Math.round(count / total * 100)}%</span></div>`).join("");
  }

  function renderWorkflow() {
    const items = searched(scoped()).slice(0, 8);
    let steps;
    if (role === "MIS") steps = [["Department", "status", "Completed"], ["Registrar", "registrar", "Completed"], ["Clinic", "clinic", "Cleared"], ["Guidance", "guidance", "Cleared"], ["Cashier", "payment", "Paid"]];
    else if (role === "Registrar") steps = [["Enrollment record", "registrar", "Completed"]];
    else if (role === "Clinic") steps = [["Medical clearance", "clinic", "Cleared"]];
    else if (role === "Guidance") steps = [["Guidance clearance", "guidance", "Cleared"]];
    else if (role === "Cashier") steps = [["Payment", "payment", "Paid"]];
    else {
      steps = [];
      if (hasPermission("appointments.read.assigned")) steps.push(["Department appointment", "status", "Completed"]);
      if (hasPermission("documents.verify.assigned")) steps.push(["Documents", "documents", "Verified"]);
    }
    if (!steps.length) return '<div class="empty-state">Workflow details are not included in this role.</div>';
    if (!items.length) return '<div class="empty-state">No student enrollment records are in this view.</div>';
    return items.map((item) => {
      let current = false;
      const stepMarkup = steps.map(([label, key, doneValue], index) => {
        const done = item[key] === doneValue || (key === "status" && item.status === "Approved");
        const state = done ? "done" : current ? "" : "current";
        const stepStatus = item[key] || "Pending";
        if (!done && !current) current = true;
        return `${index ? '<span class="workflow-line"></span>' : ""}<div class="workflow-step ${state}"><span class="step-dot">${done ? "✓" : index + 1}</span>${label}<small>${escapeHtml(stepStatus)}</small></div>`;
      }).join("");
      const overviewStatus = role === "MIS" || hasPermission("appointments.read.assigned") ? item.status : role === "Registrar" ? item.registrar : "";
      return `<article class="panel" style="margin-bottom:12px"><div class="panel-heading"><div><h3 class="panel-title">${escapeHtml(item.student)} <span class="student-id">${escapeHtml(item.studentId)} · ${escapeHtml(item.department)}</span></h3><p class="panel-caption">${escapeHtml(item.program)}</p></div>${overviewStatus ? statusPill(overviewStatus) : ""}</div><div class="workflow">${stepMarkup}</div></article>`;
    }).join("");
  }

  function rowAction(item) {
    if (role === "Clinic") return canEditField("clinic") ? `<button class="table-action" data-action="status" data-field="clinic" data-options="Cleared|Pending|Not Cleared" data-id="${escapeHtml(item.id)}">Update clearance</button>` : "View only";
    if (role === "Guidance") return canEditField("guidance") ? `<button class="table-action" data-action="status" data-field="guidance" data-options="Cleared|Pending|Referred" data-id="${escapeHtml(item.id)}">Update status</button>` : "View only";
    if (role === "Cashier") return canEditField("payment") ? `<button class="table-action" data-action="status" data-field="payment" data-options="Paid|Pending|Unpaid" data-id="${escapeHtml(item.id)}">Record payment</button>` : "View only";
    if (role === "Registrar") return canEditField("registrar") ? `<button class="table-action" data-action="status" data-field="registrar" data-options="Completed|Pending" data-id="${escapeHtml(item.id)}">Review record</button>` : "View only";
    return canUpdateAppointment() ? `<button class="table-action" data-action="edit" data-id="${escapeHtml(item.id)}">Update</button>` : `<button class="table-action" data-action="view" data-id="${escapeHtml(item.id)}">View</button>`;
  }

  function renderAppointmentTable(items, compact = false) {
    if (!items.length) return '<div class="empty-state">No appointments match your filters.</div>';
    const showOfficeStatus = !compact && (role === "MIS" || hasPermission("documents.verify.assigned"));
    const officeLabel = role === "MIS" ? "Registrar" : "Documents";
    const officeStatus = role === "MIS" ? "registrar" : "documents";
    return `<div class="table-wrap"><table><thead><tr>
      <th style="width:95px">Ticket</th>
      <th>Student</th>
      <th>Office / Dept</th>
      <th>Transaction & Notes</th>
      <th>Date & Time</th>
      <th>Status</th>
      ${showOfficeStatus ? `<th>${officeLabel}</th>` : ""}
      <th>Action</th>
    </tr></thead><tbody>${items.map((item) => `<tr>
      <td><span class="ticket-tag font-mono"><strong>${escapeHtml(item.queue || item.id)}</strong></span></td>
      <td><div class="student-cell"><span class="mini-avatar">${initials(item.student)}</span><span><span class="student-name">${escapeHtml(item.student)}</span><span class="student-id">${escapeHtml(item.studentId)}${item.program ? ` · ${escapeHtml(item.program)}` : ''}</span></span></div></td>
      <td><span class="dept-pill">${escapeHtml(item.department)}</span></td>
      <td style="white-space:normal;max-width:260px">
        <strong style="color:var(--ink);font-size:12px;display:block">${escapeHtml(item.service || item.department)}</strong>
        ${item.note ? `<div class="admin-note-snippet" title="${escapeHtml(item.note)}">📝 <em>${escapeHtml(item.note)}</em></div>` : '<span style="color:#a0aec0;font-size:11px">General Transaction</span>'}
      </td>
      <td><div style="font-weight:600">${readableDate(item.date)}</div><div style="color:var(--muted);font-size:11px">${escapeHtml(item.time)}</div></td>
      <td>${statusPill(item.status)}</td>
      ${showOfficeStatus ? `<td>${statusPill(item[officeStatus])}</td>` : ""}
      <td>${rowAction(item)}</td></tr>`).join("")}</tbody></table></div>`;
  }

  function renderOfficeQueue() {
    const items = searched(scoped());
    const field = role === "Clinic" ? "clinic" : role === "Guidance" ? "guidance" : role === "Cashier" ? "payment" : role === "Registrar" ? "registrar" : "documents";
    const label = role === "Clinic" ? "Medical clearance" : role === "Guidance" ? "Guidance status" : role === "Cashier" ? "Payment status" : role === "Registrar" ? "Enrollment record" : "Document status";
    const action = role === "Clinic" ? ["clinic", "Cleared|Pending|Not Cleared", "Update clearance"] :
      role === "Guidance" ? ["guidance", "Cleared|Pending|Referred", "Update status"] :
      role === "Cashier" ? ["payment", "Paid|Pending|Unpaid", "Record payment"] :
      role === "Registrar" ? ["registrar", "Completed|Pending", "Review record"] : ["documents", "Verified|Needs review|Missing", "Verify documents"];
    return items.length ? `<div class="table-wrap"><table><thead><tr><th>Student</th><th>Student ID</th><th>Department</th><th>${label}</th><th></th></tr></thead><tbody>${items.slice(0, 6).map((item) => `<tr><td><div class="student-cell"><span class="mini-avatar">${initials(item.student)}</span><span class="student-name">${escapeHtml(item.student)}</span></div></td><td>${escapeHtml(item.studentId)}</td><td>${escapeHtml(item.department)}</td><td>${statusPill(item[field])}</td><td>${canEditField(field) ? `<button class="table-action" data-action="status" data-field="${action[0]}" data-options="${action[1]}" data-id="${escapeHtml(item.id)}">${action[2]}</button>` : "View only"}</td></tr>`).join("")}</tbody></table></div>` : '<div class="empty-state">No records match your search.</div>';
  }

  function renderStudentOverview(items, compact = false) {
    const showEnrollment = role === "Registrar";
    const showAppointments = role === "MIS" || hasPermission("appointments.read.assigned");
    const showDocuments = role === "MIS" || hasPermission("documents.verify.assigned");
    const statusLabel = showEnrollment ? "Enrollment record" : showAppointments ? "Appointment status" : showDocuments ? "Documents" : "";
    if (!items.length) return '<div class="empty-state">No students match your search.</div>';
    return `<div class="table-wrap"><table><thead><tr><th>Student</th><th>Student ID</th><th>Program</th><th>Department</th>${statusLabel ? `<th>${statusLabel}</th>` : ""}${showAppointments && !showEnrollment ? "<th>Appointment</th>" : ""}<th></th></tr></thead><tbody>${items.slice(0, compact ? 5 : items.length).map((item) => `<tr><td><div class="student-cell"><span class="mini-avatar">${initials(item.student)}</span><span class="student-name">${escapeHtml(item.student)}</span></div></td><td>${escapeHtml(item.studentId)}</td><td>${escapeHtml(item.program)}</td><td>${escapeHtml(item.department)}</td>${statusLabel ? `<td>${statusPill(showEnrollment ? item.registrar : showAppointments ? item.status : item.documents)}</td>` : ""}${showAppointments && !showEnrollment ? `<td>${readableDate(item.date)}</td>` : ""}<td><button class="table-action" data-action="view" data-id="${escapeHtml(item.id)}">View profile</button></td></tr>`).join("")}</tbody></table></div>`;
  }

  function renderOfficeSnapshot() {
    const field = role === "Clinic" ? "clinic" : role === "Guidance" ? "guidance" : role === "Cashier" ? "payment" : role === "Registrar" ? "registrar" : "documents";
    const label = role === "Clinic" ? "Medical clearance" : role === "Guidance" ? "Guidance clearance" : role === "Cashier" ? "Payment" : role === "Registrar" ? "Enrollment record" : "Documents";
    const options = role === "Clinic" ? ["Cleared", "Pending", "Not Cleared"] :
      role === "Guidance" ? ["Cleared", "Pending", "Referred"] :
      role === "Cashier" ? ["Paid", "Pending", "Unpaid"] : role === "Registrar" ? ["Completed", "Pending"] : ["Verified", "Needs review", "Missing"];
    return `<section class="panel"><div class="panel-heading"><div><h2 class="panel-title">${label} activity</h2><p class="panel-caption">Status counts for records assigned to ${escapeHtml(role)}.</p></div></div><div class="progress-list">${options.map((status) => {
      const count = scoped().filter((item) => item[field] === status).length;
      const percent = scoped().length ? Math.round(count / scoped().length * 100) : 0;
      return `<div class="progress-row"><span>${escapeHtml(status)}</span><span class="progress-track"><span class="progress-fill" style="display:block;width:${percent}%"></span></span><span>${count}</span></div>`;
    }).join("")}</div></section>`;
  }

  function renderDashboard() {
    const list = searched(scoped());
    const action = role === "MIS" ? '<button class="button primary" data-action="section" data-target="reports">＋ Generate report</button>' : "";
    const officeOnly = ["Clinic", "Guidance", "Cashier", "Registrar"].includes(role);
    const recentTitle = role === "Clinic" ? "Medical clearance queue" : role === "Guidance" ? "Guidance clearance queue" : role === "Cashier" ? "Payment requirements" : role === "Registrar" ? "Enrollment record review" : hasPermission("appointments.read.assigned") ? "Recent appointments" : "Assigned students";
    return `${renderHeading(`Good morning, ${escapeHtml(currentAdmin().name.split(" ")[0])}`, scopedTitle(), action)}
      ${renderStats()}<div class="dashboard-grid">
        <div><section class="panel"><div class="panel-heading"><div><h2 class="panel-title">${recentTitle}</h2><p class="panel-caption">${list.length} student records in this view</p></div><button class="text-link" data-action="section" data-target="${role === "Clinic" || role === "Guidance" ? "clearances" : role === "Cashier" ? "payments" : role === "Registrar" ? "records" : hasPermission("appointments.read.assigned") ? "appointments" : "students"}">View all →</button></div>${officeOnly ? renderOfficeQueue() : hasPermission("appointments.read.assigned") ? renderAppointmentTable(list.slice(0, 5), true) : renderStudentOverview(list, true)}</section>
          <section class="panel"><div class="panel-heading"><div><h2 class="panel-title">Enrollment progress</h2><p class="panel-caption">Requirement completion across your assigned records</p></div></div>${renderProgress()}</section>
          <section class="panel"><div class="panel-heading"><div><h2 class="panel-title">Enrollment workflow</h2><p class="panel-caption">Current requirement status for recent students</p></div><button class="text-link" data-action="section" data-target="workflow">View workflow →</button></div>${renderWorkflow()}</section>
        </div>
        <div>${officeOnly || !hasPermission("appointments.read.assigned") ? hasPermission("documents.verify.assigned") ? renderOfficeSnapshot() : '<section class="panel"><div class="panel-heading"><div><h2 class="panel-title">Assigned students</h2><p class="panel-caption">Student records available to your role</p></div></div><div class="detail-tile"><span>Students in this view</span><strong>' + new Set(scoped().map((item) => item.studentId)).size + '</strong></div></section>' : `<section class="panel"><div class="panel-heading"><div><h2 class="panel-title">Appointment calendar</h2><p class="panel-caption">${today.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</p></div><span class="status submitted">This week</span></div>${renderCalendar()}</section>`}
          <section class="panel"><div class="panel-heading"><div><h2 class="panel-title">Department activity</h2><p class="panel-caption">${role === "MIS" ? "Latest system updates" : `${role} updates`}</p></div><button class="text-link" data-action="section" data-target="${role === "MIS" ? "activity" : "workflow"}">View →</button></div>${renderActivity()}</section>
          <section class="panel"><div class="panel-heading"><div><h2 class="panel-title">Pending requests</h2><p class="panel-caption">Items that may need your attention</p></div><button class="text-link" data-action="section" data-target="${role === "MIS" ? "appointments" : role === "Clinic" || role === "Guidance" ? "clearances" : role === "Cashier" ? "payments" : "appointments"}">View →</button></div>${renderPending()}</section>
        </div>
      </div>`;
  }

  function renderPending() {
    const pending = scoped().filter((item) => {
      if (role === "Clinic") return item.clinic === "Pending" || item.clinic === "Not Cleared";
      if (role === "Guidance") return item.guidance === "Pending" || item.guidance === "Referred";
      if (role === "Cashier") return item.payment !== "Paid";
      if (role === "Registrar") return item.registrar === "Pending";
      if (!hasPermission("appointments.read.assigned")) return hasPermission("documents.verify.assigned") && item.documents !== "Verified";
      return item.status === "Pending";
    }).slice(0, 4);
    return pending.length ? `<div class="activity-list">${pending.map((item) => {
      const value = role === "Clinic" ? item.clinic : role === "Guidance" ? item.guidance : role === "Cashier" ? item.payment : role === "Registrar" ? item.registrar : hasPermission("appointments.read.assigned") ? item.status : item.documents;
      const appointmentId = role === "MIS" || hasPermission("appointments.read.assigned") ? `${escapeHtml(item.id)} · ` : "";
      return `<div class="activity-item"><span class="activity-marker amber"></span><div class="activity-copy"><strong>${escapeHtml(item.student)}</strong> · ${escapeHtml(item.studentId)}<span class="activity-time">${appointmentId}${escapeHtml(item.department)} · ${escapeHtml(value)}</span></div></div>`;
    }).join("")}</div>` : '<div class="empty-state">You are all caught up.</div>';
  }

  function renderAppointments() {
    const options = ["All statuses", ...statuses];
    return `${renderHeading("Appointments", `${scoped().length} records · ${scopedTitle()}`)}
      <section class="panel"><div class="toolbar"><div class="toolbar-group"><select class="filter-select" id="status-filter" aria-label="Filter by status">${options.map((item) => `<option ${item === statusFilter ? "selected" : ""}>${item}</option>`).join("")}</select><select class="filter-select" id="department-filter" aria-label="Filter by department" ${role !== "MIS" ? "disabled" : ""}><option>All departments</option>${departments.map((item) => `<option>${item}</option>`).join("")}</select></div><button class="button" data-action="export">↓ Export CSV</button></div><div id="appointments-table">${renderAppointmentTable(filterDepartment(appointmentsForSection()), false)}</div></section>`;
  }

  function filterDepartment(items) {
    const value = document.querySelector("#department-filter")?.value;
    return value && value !== "All departments" ? items.filter((item) => item.department === value) : items;
  }

  function renderStudents() {
    if (role === "MIS") {
      const query = searchQuery.trim().toLowerCase();
      const students = Object.values(studentAccounts).filter((item) => !query || [item.name, item.studentId, item.email, item.program, item.homeDepartment].some((value) => String(value || "").toLowerCase().includes(query)));
      return `${renderHeading("Students", `${Object.keys(studentAccounts).length} registered student accounts · All departments`, '<button class="button primary" data-action="new-student">＋ Add student</button>')}
        <section class="panel"><div class="toolbar"><p class="panel-caption">MIS can edit student profiles and activate or deactivate accounts.</p><button class="button" data-action="export-students">↓ Export CSV</button></div><div class="table-wrap"><table><thead><tr><th>Student</th><th>Student ID</th><th>Email</th><th>Program</th><th>Home department</th><th>Account status</th><th></th></tr></thead><tbody>${students.length ? students.map((student) => `<tr><td>${escapeHtml(student.name)}</td><td>${escapeHtml(student.studentId)}</td><td>${escapeHtml(student.email)}</td><td>${escapeHtml(student.program)}</td><td>${escapeHtml(student.homeDepartment)}</td><td>${statusPill(student.active ? "Active" : "Deactivated")}</td><td><button class="table-action" data-action="edit-student" data-id="${escapeHtml(student.studentId)}">Edit</button> · <button class="table-action" data-action="toggle-student" data-id="${escapeHtml(student.studentId)}">${student.active ? "Deactivate" : "Reactivate"}</button></td></tr>`).join("") : '<tr><td colspan="7" class="empty-state">No students match your search.</td></tr>'}</tbody></table></div></section>`;
    }
    const items = searched(scoped());
    return `${renderHeading("Students", `${new Set(scoped().map((item) => item.studentId)).size} students · ${scopedTitle()}`)}
      <section class="panel"><div class="toolbar"><p class="panel-caption">Student information is restricted to your assigned office role.</p><button class="button" data-action="export">↓ Export CSV</button></div>
      ${renderStudentOverview(items)}</section>`;
  }

  function renderClearances() {
    const field = role === "Clinic" ? "clinic" : "guidance";
    const options = role === "Clinic" ? ["Cleared", "Pending", "Not Cleared"] : ["Cleared", "Pending", "Referred"];
    const items = searched(scoped());
    return `${renderHeading(`${role} clearance`, `Student ${role.toLowerCase()} clearances · ${items.length} records`)}<section class="panel"><div class="notice">You can view and update ${escapeHtml(role.toLowerCase())} clearance records only. Changes are logged and notify the student in the connected system.</div><div class="table-wrap"><table><thead><tr><th>Student</th><th>Student ID</th><th>Program</th><th>Clearance status</th><th>Action</th></tr></thead><tbody>${items.length ? items.map((item) => `<tr><td><div class="student-cell"><span class="mini-avatar">${initials(item.student)}</span><span class="student-name">${escapeHtml(item.student)}</span></div></td><td>${escapeHtml(item.studentId)}</td><td>${escapeHtml(item.program)}</td><td>${statusPill(item[field])}</td><td>${canEditField(field) ? `<button class="table-action" data-action="status" data-id="${escapeHtml(item.id)}" data-field="${field}" data-options="${options.join("|")}">Update status</button>` : "View only"}</td></tr>`).join("") : '<tr><td colspan="5" class="empty-state">No outstanding clearances.</td></tr>'}</tbody></table></div></section>`;
  }

  function renderPayments() {
    const items = searched(scoped());
    return `${renderHeading("Payment tracking", `${items.length} students with payment requirements`)}<section class="panel"><div class="notice">Cashier access is limited to payment status and payment history. Other department records are not available in this view.</div><div class="table-wrap"><table><thead><tr><th>Student</th><th>Student ID</th><th>Program</th><th>Payment status</th><th>Payment history</th><th>Action</th></tr></thead><tbody>${items.length ? items.map((item) => `<tr><td><div class="student-cell"><span class="mini-avatar">${initials(item.student)}</span><span class="student-name">${escapeHtml(item.student)}</span></div></td><td>${escapeHtml(item.studentId)}</td><td>${escapeHtml(item.program)}</td><td>${statusPill(item.payment)}</td><td>${item.payment === "Paid" ? "Payment recorded" : "No payment recorded"}</td><td>${canEditField("payment") ? `<button class="table-action" data-action="status" data-id="${escapeHtml(item.id)}" data-field="payment" data-options="Paid|Pending|Unpaid">Record payment</button>` : "View only"}</td></tr>`).join("") : '<tr><td colspan="6" class="empty-state">No outstanding payments.</td></tr>'}</tbody></table></div></section>`;
  }

  function renderRecords() {
    const items = searched(scoped());
    return `${renderHeading("Enrollment records", `${items.length} student records · Registrar access`)}<section class="panel"><div class="notice">Registrar can review enrollment requirements and records. Medical, guidance, and payment details remain with their assigned offices.</div><div class="table-wrap"><table><thead><tr><th>Student</th><th>Student ID</th><th>Program</th><th>Home department</th><th>Enrollment record</th><th>Review</th></tr></thead><tbody>${items.length ? items.map((item) => `<tr><td>${escapeHtml(item.student)}</td><td>${escapeHtml(item.studentId)}</td><td>${escapeHtml(item.program)}</td><td>${escapeHtml(item.department)}</td><td>${statusPill(item.registrar)}</td><td>${canEditField("registrar") ? `<button class="table-action" data-action="status" data-id="${escapeHtml(item.id)}" data-field="registrar" data-options="Completed|Pending">Update record</button>` : "View only"}</td></tr>`).join("") : '<tr><td colspan="6" class="empty-state">No enrollment records found.</td></tr>'}</tbody></table></div></section>`;
  }

  function renderDocuments() {
    const items = searched(scoped());
    return `${renderHeading("Document verification", `${items.length} student records in your permitted view`)}<section class="panel"><div class="notice">Verify required documents for your assigned department only. The PHP API should validate department ownership on every update.</div><div class="table-wrap"><table><thead><tr><th>Student</th><th>Student ID</th><th>Program</th><th>Department</th><th>Documents</th><th>Action</th></tr></thead><tbody>${items.length ? items.map((item) => `<tr><td>${escapeHtml(item.student)}</td><td>${escapeHtml(item.studentId)}</td><td>${escapeHtml(item.program)}</td><td>${escapeHtml(item.department)}</td><td>${statusPill(item.documents)}</td><td>${canEditField("documents") ? `<button class="table-action" data-action="document" data-id="${escapeHtml(item.id)}">Mark verified</button>` : "View only"}</td></tr>`).join("") : '<tr><td colspan="6" class="empty-state">No documents to review.</td></tr>'}</tbody></table></div></section>`;
  }

  function renderAnnouncements() {
    return `${renderHeading("Announcements", "Publish enrollment updates for students.", '<button class="button primary" data-action="new-announcement">＋ New announcement</button>')}<div class="notice">SSG can create and manage announcements. For all other roles, this section is not available.</div>${announcements.map((item) => `<article class="panel" style="margin-bottom:12px"><div class="panel-heading"><div><h2 class="panel-title">${escapeHtml(item.title)}</h2><p class="panel-caption">${escapeHtml(item.author)} · ${readableDate(item.created)}</p></div></div><p class="heading-subtitle">${escapeHtml(item.body)}</p></article>`).join("")}`;
  }

  function renderAdmins() {
    return `${renderHeading("Admin accounts", "Manage department access, roles, permissions, and account status.", '<button class="button primary" data-action="new-admin">＋ Add administrator</button>')}<section class="panel"><div class="notice">Only MIS can manage administrator accounts and role permissions. Permission changes apply to every administrator assigned to that department role.</div><div class="table-wrap"><table><thead><tr><th>Administrator</th><th>Email</th><th>Department</th><th>Role</th><th>Status</th><th>Access</th></tr></thead><tbody>${admins.map((admin, index) => `<tr><td>${escapeHtml(admin.name)}</td><td>${escapeHtml(admin.email)}</td><td>${escapeHtml(admin.department)}</td><td>${escapeHtml(admin.role)}</td><td>${statusPill(admin.active ? "Active" : "Deactivated")}</td><td>${index ? `<button class="table-action" data-action="permissions" data-index="${index}">Permissions</button> · <button class="table-action" data-action="toggle-admin" data-index="${index}">${admin.active ? "Deactivate" : "Reactivate"}</button>` : '<span class="student-id">Full access</span>'}</td></tr>`).join("")}</tbody></table></div></section>`;
  }

  function renderReports() {
    return `${renderHeading("Enrollment reports", "Monitor appointment and requirement completion across departments.", '<button class="button primary" data-action="export">↓ Download CSV</button>')}<div class="stats-grid">${departments.map((department) => { const total = appointments.filter((item) => item.department === department).length; const done = appointments.filter((item) => item.department === department && item.status === "Completed").length; return `<article class="stat-card"><div class="stat-top"><span>${escapeHtml(department)}</span><span class="stat-icon">${icons[department.toLowerCase()] || "▦"}</span></div><div class="stat-value">${total}</div><div class="stat-foot">${done} completed · ${total ? Math.round(done / total * 100) : 0}%</div></article>`; }).join("")}</div><section class="panel"><div class="panel-heading"><div><h2 class="panel-title">Student enrollment requirements</h2><p class="panel-caption">Status summary from all departments</p></div></div>${renderProgress()}</section>`;
  }

  function renderActivityLog() {
    return `${renderHeading("Activity log", "Recent administrator actions across the system.")}<section class="panel"><div class="activity-list">${activity.map((event) => `<div class="activity-item"><span class="activity-marker"></span><div class="activity-copy">${event.message}<span class="activity-time">${escapeHtml(event.department)} · ${escapeHtml(event.time)}</span></div></div>`).join("")}</div></section>`;
  }

  function renderSettings() {
    return `${renderHeading("System settings", "Configure enrollment system preferences.", '<button class="button primary" data-action="edit-settings">Edit settings</button>')}<div class="notice">Prototype values are stored in this browser. Store production settings in MySQL or PHP environment configuration; keep SMTP credentials server-side.</div><section class="panel"><div class="detail-grid"><div class="detail-tile"><span>System name</span><strong>College Enrollment Appointment System</strong></div><div class="detail-tile"><span>Academic year</span><strong>${escapeHtml(systemSettings.academicYear)}</strong></div><div class="detail-tile"><span>Appointment days</span><strong>${escapeHtml(systemSettings.appointmentDays)}</strong></div><div class="detail-tile"><span>Appointment hours</span><strong>${escapeHtml(systemSettings.openingTime)}–${escapeHtml(systemSettings.closingTime)}</strong></div><div class="detail-tile"><span>Student notifications</span><strong>${systemSettings.studentNotifications ? "Enabled" : "Disabled"} · SMTP / PHPMailer integration ready</strong></div><div class="detail-tile"><span>Database target</span><strong>MySQL · database/schema.sql</strong></div></div></section>`;
  }

  function renderContent() {
    if (!canAccessSection(activeSection)) return `${renderHeading("Access restricted", "This role does not have permission to open this section.")}<section class="panel"><div class="empty-state">Ask MIS to review this department role's permissions.</div></section>`;
    if (activeSection === "dashboard") return renderDashboard();
    if (activeSection === "appointments") return renderAppointments();
    if (activeSection === "students") return renderStudents();
    if (activeSection === "workflow") return `${renderHeading("Enrollment workflow", "Track each student's progress through required offices.")}${renderWorkflow()}`;
    if (activeSection === "clearances") return renderClearances();
    if (activeSection === "payments") return renderPayments();
    if (activeSection === "records") return renderRecords();
    if (activeSection === "documents") return renderDocuments();
    if (activeSection === "announcements") return renderAnnouncements();
    if (activeSection === "admins") return renderAdmins();
    if (activeSection === "reports") return renderReports();
    if (activeSection === "activity") return renderActivityLog();
    if (activeSection === "settings") return renderSettings();
    return renderDashboard();
  }

  function render() {
    if (!navForRole(role).some(([key]) => key === activeSection)) activeSection = "dashboard";
    app.innerHTML = `<div class="app-shell">${renderSidebar()}<div class="main-column">${renderTopbar()}<main class="content">${role === "MIS" ? "" : '<div class="notice">Department-scoped preview: this dashboard filters information by the selected role. Enforce the same permissions in the PHP API before production.</div>'}${renderContent()}<div class="footer-note">EnrollEase · Enrollment Appointment Management System</div></main></div></div>`;
    bindEvents();
  }

  function announce(message, department = role, studentId = null, notificationType = "system_update") {
    notifications.unshift({
      message,
      created: "Just now",
      read: false,
      department,
      studentId,
      recipientEmail: studentId ? studentAccounts[studentId]?.email || null : null,
      notificationType
    });
    save("enrolle_admin_notifications", notifications);
  }

  function studentDepartment(program) {
    const normalized = String(program || "").toLowerCase();
    if (normalized.includes("education")) return "COED";
    if (normalized.includes("hospitality")) return "HM";
    if (normalized.includes("industrial technology")) return "BIT";
    return "CodeTech";
  }

  function mapStudentAppointmentStatus(status) {
    return ({ Confirmed: "Submitted", Completed: "Completed", Rescheduled: "Rescheduled", Cancelled: "Cancelled" })[status] || (statuses.includes(status) ? status : "Submitted");
  }

  function mapAdminAppointmentStatus(status) {
    return ({ Submitted: "Confirmed", Approved: "Confirmed", Pending: "Confirmed", Rejected: "Cancelled", Rescheduled: "Rescheduled", Completed: "Completed", Cancelled: "Cancelled" })[status] || "Confirmed";
  }

  function syncStudentPortal() {
    const portalAppointmentsText = localStorage.getItem("ee_appointments");
    if (!portalAppointmentsText) return;
    const portalAppointments = JSON.parse(portalAppointmentsText);
    const portalUsers = JSON.parse(localStorage.getItem("ee_users") || "[]");
    const userById = new Map(portalUsers.map((user) => [user.sid, user]));
    const syncedIds = new Set(load("enrolle_admin_portal_ids", []));
    let appointmentsChanged = false;
    let studentsChanged = false;

    portalAppointments.forEach((source) => {
      const user = userById.get(source.sid);
      if (!user || !source.id) return;
      const studentId = String(user.sid);
      const homeDepartment = studentDepartment(user.program);
      if (!studentAccounts[studentId]) {
        studentAccounts[studentId] = { studentId, name: user.name, email: user.email || "", program: user.program, homeDepartment, active: true };
        studentsChanged = true;
      }
      const appointmentId = `PORTAL-${source.id}`;
      const sourceType = String(source.type || "");
      const department = /payment|cashier/i.test(sourceType) ? "Cashier" :
        /document|records/i.test(sourceType) ? "Registrar" : homeDepartment;
      const status = mapStudentAppointmentStatus(source.status);
      const existing = appointments.find((item) => item.portalId === String(source.id));
      if (existing) {
        const portalStatusChanged = existing.portalStatus !== source.status;
        if (portalStatusChanged || existing.date !== source.date || existing.time !== source.time) appointmentsChanged = true;
        Object.assign(existing, { student: user.name, studentId, program: user.program, department, date: source.date, time: source.time, portalStatus: source.status });
        if (portalStatusChanged) existing.status = status;
      } else {
        appointments.push({
          id: appointmentId,
          portalId: String(source.id),
          portalStatus: source.status,
          type: sourceType,
          student: user.name,
          studentId,
          program: user.program,
          department,
          date: source.date,
          time: source.time,
          status,
          clinic: "Pending",
          guidance: "Pending",
          payment: "Pending",
          registrar: "Pending",
          documents: "Needs review"
        });
        appointmentsChanged = true;
        if (!syncedIds.has(String(source.id)) && status === "Submitted") {
          announce("Appointment submitted and received for review.", department, studentId, "appointment_submitted");
        }
      }
      syncedIds.add(String(source.id));
    });

    if (studentsChanged) save("enrolle_admin_students", studentAccounts);
    if (appointmentsChanged) save("enrolle_admin_appointments", appointments);
    save("enrolle_admin_portal_ids", [...syncedIds]);
  }

  function logActivity(message, department = role) {
    activity.unshift({ message, time: "Just now", department });
    activity = activity.slice(0, 30);
    save("enrolle_admin_activity", activity);
  }

  function showToast(message) {
    document.querySelector(".toast")?.remove();
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.setAttribute("role", "status");
    toast.textContent = message;
    document.body.append(toast);
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.remove(), 3000);
  }

  function signOut() {
    const loginPages = {
      MIS: "admin-login/mis-admin-login.html", SSG: "admin-login/ssg-admin-login.html", CodeTech: "admin-login/codetech-admin-login.html",
      COED: "admin-login/coed-admin-login.html", HM: "admin-login/hm-admin-login.html", BIT: "admin-login/bit-admin-login.html",
      Registrar: "admin-login/registrar-admin-login.html", Clinic: "admin-login/clinic-admin-login.html",
      Cashier: "admin-login/cashier-admin-login.html", Guidance: "admin-login/guidance-admin-login.html"
    };
    const targetUrl = (loginPages[role] || "admin-login/admin-login.html") + "?logged_out=1";
    sessionStorage.removeItem("enrolle_admin_authenticated_role");
    sessionStorage.removeItem("enrolle_admin_authenticated_name");
    sessionStorage.removeItem("enrolle_admin_authenticated_email");
    localStorage.removeItem("enrolle_admin_role");
    window.location.replace(targetUrl);
  }

  function openModal(title, subtitle, fields, onSubmit) {
    const overlay = document.createElement("div");
    overlay.className = "overlay";
    overlay.innerHTML = `<form class="modal" id="admin-modal"><div class="modal-heading"><div><h2>${escapeHtml(title)}</h2><p>${escapeHtml(subtitle)}</p></div><button type="button" class="icon-button" data-close aria-label="Close dialog">×</button></div>${fields}<div class="modal-actions"><button class="button" type="button" data-close>Cancel</button><button class="button primary" type="submit">Save changes</button></div></form>`;
    overlay.addEventListener("click", (event) => { if (event.target === overlay) overlay.remove(); });
    overlay.querySelectorAll("[data-close]").forEach((button) => button.addEventListener("click", () => overlay.remove()));
    overlay.querySelector("form").addEventListener("submit", (event) => {
      event.preventDefault();
      onSubmit(new FormData(event.currentTarget), overlay);
    });
    document.body.append(overlay);
    overlay.querySelector("input, select, textarea")?.focus();
  }

  function updateStatus(id, field, value) {
    const item = appointments.find((appointment) => appointment.id === id && scoped().some((visible) => visible.id === id));
    if (!item) {
      showToast("This record is outside your department access.");
      return;
    }
    if (!canEditField(field)) {
      showToast("You do not have permission to update this requirement.");
      return;
    }
    item[field] = value;
    if (field === "status" && item.portalId) {
      const portalAppointments = JSON.parse(localStorage.getItem("ee_appointments") || "[]");
      const portalAppointment = portalAppointments.find((appointment) => String(appointment.id) === item.portalId);
      if (portalAppointment) {
        portalAppointment.status = mapAdminAppointmentStatus(value);
        item.portalStatus = portalAppointment.status;
        localStorage.setItem("ee_appointments", JSON.stringify(portalAppointments));
      } else {
        showToast("The student portal appointment is no longer available; the dashboard status was saved.");
      }
    }
    save("enrolle_admin_appointments", appointments);
    const kind = field === "status" ? "appointment" : field === "payment" ? "payment" : `${field} requirement`;
    const appointmentNotifications = { Submitted: "Appointment submitted", Approved: "Appointment approved", Rejected: "Appointment rejected", Rescheduled: "Appointment rescheduled", Completed: "Appointment completed" };
    const isComplete = ["Completed", "Cleared", "Paid", "Verified"].includes(value);
    const isMissing = ["Pending", "Not Cleared", "Unpaid", "Referred", "Missing", "Needs review"].includes(value);
    const notification = field === "status" ? appointmentNotifications[value] || `Appointment status updated to ${value}` :
      isComplete ? `${kind} completed` : isMissing ? `${kind} missing or requires follow-up` : `${kind} updated to ${value}`;
    const notificationType = field === "status"
      ? (appointmentNotifications[value] ? `appointment_${value.toLowerCase()}` : "appointment_status_updated")
      : isComplete ? "requirement_completed" : isMissing ? "requirement_missing" : "requirement_status_updated";
    announce(`${notification} for ${item.student}.`, role, item.studentId, notificationType);
    logActivity(`<strong>${escapeHtml(role)}</strong> updated ${escapeHtml(item.student)}'s ${escapeHtml(kind)} to ${escapeHtml(value)}.`);
    const completeIds = load("enrolle_admin_completed_enrollments", []);
    if (item.status === "Completed" && item.registrar === "Completed" && item.clinic === "Cleared" && item.guidance === "Cleared" && item.payment === "Paid" && !completeIds.includes(item.id)) {
      completeIds.push(item.id);
      save("enrolle_admin_completed_enrollments", completeIds);
      announce(`Enrollment completed for ${item.student}.`, role, item.studentId, "enrollment_completed");
    }
    render();
    showToast(`${kind[0].toUpperCase()}${kind.slice(1)} status updated.`);
  }

  function openStatusModal(id, field = "status", options = statuses) {
    const item = scoped().find((appointment) => appointment.id === id);
    if (!item) return showToast("This record is outside your department access.");
    if (!canEditField(field)) return showToast("You cannot update this requirement for this role.");
    const labels = { status: "Appointment status", clinic: "Medical clearance", guidance: "Guidance clearance", payment: "Payment status", registrar: "Enrollment record", documents: "Document status" };
    openModal("Update student requirement", `${item.student} · ${item.id}`, `<div class="form-field"><label for="status-value">${labels[field] || "Status"}</label><select class="field-select" id="status-value" name="value">${options.map((option) => `<option ${item[field] === option ? "selected" : ""}>${escapeHtml(option)}</option>`).join("")}</select></div>`, (form, overlay) => {
      updateStatus(id, field, String(form.get("value")));
      overlay.remove();
    });
  }

  function openStudent(id) {
    const item = scoped().find((appointment) => appointment.id === id);
    if (!item) return showToast("This record is outside your department access.");
    const fields = [
      ["Queue Ticket", item.queue || item.id],
      ["Student ID", item.studentId],
      ["Student Name", item.student],
      ["Program", item.program || "Undergraduate"],
      ["Assigned Department", item.department],
      ["Specific Transaction", item.service || item.department],
      ["Appointment Schedule", `${readableDate(item.date)} · ${item.time}`],
      ["Appointment Status", item.status]
    ];
    if (item.note) {
      fields.push(["Student Reason / Notes", item.note]);
    }
    if (item.docs && item.docs.length) {
      fields.push(["Required Documents", Array.isArray(item.docs) ? item.docs.join(", ") : String(item.docs)]);
    }
    if (role === "MIS" || hasPermission("documents.verify.assigned") || hasPermission("documents.review")) fields.push(["Documents", item.documents]);
    if (role === "MIS" || role === "Registrar") fields.push(["Enrollment record", item.registrar]);
    if (role === "MIS" || role === "Clinic") fields.push(["Medical clearance", item.clinic]);
    if (role === "MIS" || role === "Guidance") fields.push(["Guidance clearance", item.guidance]);
    if (role === "MIS" || role === "Cashier") fields.push(["Payment", item.payment]);

    openModal(item.student, `${item.queue || item.id} · ${item.studentId} · ${item.department}`, `<div class="detail-grid">${fields.map(([label, value]) => `<div class="detail-tile ${label === 'Student Reason / Notes' || label === 'Required Documents' ? 'full-width highlight' : ''}"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`).join("")}</div>`, (_form, overlay) => overlay.remove());
    const submit = document.querySelector("#admin-modal [type='submit']");
    if (submit) { submit.textContent = "Done"; submit.addEventListener("click", (event) => { event.preventDefault(); document.querySelector(".overlay")?.remove(); }); }
  }

  function openAdminModal() {
    const fields = `<div class="form-field"><label for="admin-name">Administrator name</label><input class="field-input" id="admin-name" name="name" required maxlength="100"></div><div class="form-field"><label for="admin-email">Work email</label><input class="field-input" id="admin-email" name="email" type="email" required maxlength="190"></div><div class="form-field"><label for="admin-department">Department</label><select class="field-select" id="admin-department" name="department">${departments.map((department) => `<option>${department}</option>`).join("")}</select></div>`;
    openModal("Add administrator", "Create a department administrator account.", fields, (form, overlay) => {
      const department = String(form.get("department"));
      const email = String(form.get("email")).trim();
      if (admins.some((admin) => admin.email.toLowerCase() === email.toLowerCase())) return showToast("An administrator already uses this email address.");
      if (!rolePermissions[department]?.length) return showToast("Assign at least one permission to this department role first.");
      admins.push({ name: String(form.get("name")).trim(), email, department, role: roleNames[department], active: true });
      save("enrolle_admin_accounts", admins);
      logActivity(`<strong>MIS</strong> created an administrator account for ${escapeHtml(department)}.`, "MIS");
      overlay.remove();
      render();
      showToast("Administrator account added.");
    });
  }

  function openStudentAccountModal(studentId = "") {
    if (role !== "MIS") return showToast("Only MIS can manage student accounts.");
    const existing = studentAccounts[studentId];
    const fields = `<div class="form-field"><label for="student-name">Student name</label><input class="field-input" id="student-name" name="name" required maxlength="150" value="${escapeHtml(existing?.name || "")}"></div><div class="form-field"><label for="student-id">Student ID</label><input class="field-input" id="student-id" name="studentId" required maxlength="40" ${existing ? "readonly" : ""} value="${escapeHtml(existing?.studentId || "")}"></div><div class="form-field"><label for="student-email">Student email</label><input class="field-input" id="student-email" name="email" type="email" required maxlength="190" value="${escapeHtml(existing?.email || "")}"></div><div class="form-field"><label for="student-program">Program</label><select class="field-select" id="student-program" name="program">${programs.map((program) => `<option ${existing?.program === program ? "selected" : ""}>${escapeHtml(program)}</option>`).join("")}</select></div><div class="form-field"><label for="student-department">Home department</label><select class="field-select" id="student-department" name="homeDepartment">${["CodeTech", "COED", "HM", "BIT"].map((department) => `<option ${existing?.homeDepartment === department ? "selected" : ""}>${department}</option>`).join("")}</select></div>`;
    openModal(existing ? "Edit student account" : "Add student account", existing ? `${existing.name} · ${existing.studentId}` : "Create a student profile for enrollment.", fields, (form, overlay) => {
      const id = String(form.get("studentId")).trim();
      const email = String(form.get("email")).trim();
      if (!existing && studentAccounts[id]) return showToast("A student account already uses this student ID.");
      if (Object.values(studentAccounts).some((student) => student.studentId !== studentId && student.email.toLowerCase() === email.toLowerCase())) return showToast("A student account already uses this email address.");
      const student = { studentId: id, name: String(form.get("name")).trim(), email, program: String(form.get("program")), homeDepartment: String(form.get("homeDepartment")), active: existing?.active ?? true };
      if (existing) delete studentAccounts[studentId];
      studentAccounts[id] = student;
      appointments.forEach((item) => {
        if (item.studentId === studentId || item.studentId === id) {
          item.studentId = id;
          item.student = student.name;
          item.program = student.program;
        }
      });
      save("enrolle_admin_students", studentAccounts);
      save("enrolle_admin_appointments", appointments);
      logActivity(`<strong>MIS</strong> ${existing ? "updated" : "created"} the student account for ${escapeHtml(student.name)}.`, "MIS");
      overlay.remove();
      render();
      showToast(existing ? "Student account updated." : "Student account created.");
    });
  }

  function openPermissionsModal(index) {
    const admin = admins[index];
    const available = permissionCatalog[admin?.department];
    if (!admin || !available || admin.department === "MIS") return showToast("Permissions can only be assigned to a department role.");
    const current = rolePermissions[admin.department] || [];
    const fields = `<div class="notice">These permissions are shared by all ${escapeHtml(admin.department)} administrators. Department assignment is still enforced separately.</div>${available.map(([key, label]) => `<label style="display:flex;align-items:center;gap:9px;margin:12px 0;color:#596477;font-size:11px"><input type="checkbox" name="permissions" value="${escapeHtml(key)}" ${current.includes(key) ? "checked" : ""} style="width:15px;height:15px;margin:0">${escapeHtml(label)}</label>`).join("")}`;
    openModal(`Manage ${admin.department} permissions`, `${admin.role} · ${admin.department}`, fields, (form, overlay) => {
      const selected = form.getAll("permissions").map(String);
      if (!selected.length) return showToast("A department role must retain at least one permission.");
      rolePermissions[admin.department] = selected;
      save("enrolle_admin_role_permissions", rolePermissions);
      logActivity(`<strong>MIS</strong> updated permissions for the ${escapeHtml(admin.department)} role.`, "MIS");
      overlay.remove();
      showToast(`${admin.department} role permissions updated.`);
    });
  }

  function openAnnouncementModal() {
    openModal("New announcement", "Create a student-facing enrollment announcement.", `<div class="form-field"><label for="announcement-title">Title</label><input class="field-input" id="announcement-title" name="title" required maxlength="150"></div><div class="form-field"><label for="announcement-body">Message</label><textarea class="field-input" id="announcement-body" name="body" rows="4" required maxlength="1000"></textarea></div>`, (form, overlay) => {
      if (role !== "SSG" && role !== "MIS") return showToast("Only SSG can publish announcements.");
      announcements.unshift({ title: String(form.get("title")).trim(), body: String(form.get("body")).trim(), author: role, created: dateString(0) });
      save("enrolle_admin_announcements", announcements);
      announce("A new enrollment announcement has been published.");
      logActivity(`<strong>${escapeHtml(role)}</strong> published an enrollment announcement.`);
      overlay.remove();
      render();
      showToast("Announcement published.");
    });
  }

  function openSettingsModal() {
    if (role !== "MIS") return showToast("Only MIS can manage system settings.");
    const fields = `<div class="form-field"><label for="setting-year">Academic year</label><input class="field-input" id="setting-year" name="academicYear" required maxlength="9" value="${escapeHtml(systemSettings.academicYear)}"></div><div class="form-field"><label for="setting-days">Appointment days</label><select class="field-select" id="setting-days" name="appointmentDays">${["Monday–Friday", "Monday–Saturday", "All week"].map((days) => `<option ${systemSettings.appointmentDays === days ? "selected" : ""}>${days}</option>`).join("")}</select></div><div class="detail-grid"><div class="form-field"><label for="setting-open">Opening time</label><input class="field-input" id="setting-open" name="openingTime" type="time" required value="${escapeHtml(systemSettings.openingTime)}"></div><div class="form-field"><label for="setting-close">Closing time</label><input class="field-input" id="setting-close" name="closingTime" type="time" required value="${escapeHtml(systemSettings.closingTime)}"></div></div><label style="display:flex;align-items:center;gap:9px;margin-top:12px;color:#596477;font-size:11px"><input type="checkbox" name="studentNotifications" value="enabled" ${systemSettings.studentNotifications ? "checked" : ""} style="width:15px;height:15px;margin:0">Enable student notifications</label>`;
    openModal("Edit system settings", "Update enrollment schedule and notification preferences.", fields, (form, overlay) => {
      const openingTime = String(form.get("openingTime"));
      const closingTime = String(form.get("closingTime"));
      if (openingTime >= closingTime) return showToast("Closing time must be later than opening time.");
      systemSettings = {
        academicYear: String(form.get("academicYear")).trim(),
        appointmentDays: String(form.get("appointmentDays")),
        openingTime,
        closingTime,
        studentNotifications: form.get("studentNotifications") === "enabled"
      };
      save("enrolle_admin_settings", systemSettings);
      logActivity("<strong>MIS</strong> updated system settings.", "MIS");
      overlay.remove();
      render();
      showToast("System settings saved.");
    });
  }

  function exportCsv() {
    const headers = ["Student", "Student ID", "Program", "Department"];
    const fields = ["student", "studentId", "program", "department"];
    if (role === "MIS") {
      headers.push("Appointment ID", "Date", "Time", "Appointment status", "Enrollment record", "Documents", "Medical clearance", "Guidance clearance", "Payment");
      fields.push("id", "date", "time", "status", "registrar", "documents", "clinic", "guidance", "payment");
    } else if (role === "Registrar") {
      headers.push("Enrollment record", "Documents");
      fields.push("registrar", "documents");
    } else if (role === "Clinic") {
      headers.push("Medical clearance");
      fields.push("clinic");
    } else if (role === "Guidance") {
      headers.push("Guidance clearance");
      fields.push("guidance");
    } else if (role === "Cashier") {
      headers.push("Payment status", "Payment history");
      fields.push("payment", "payment");
    } else {
      if (hasPermission("appointments.read.assigned")) {
        headers.push("Date", "Time", "Appointment status");
        fields.push("date", "time", "status");
      }

      function exportStudentsCsv() {
        if (role !== "MIS") return showToast("Only MIS can export registered student accounts.");
        const csvRows = [["Student", "Student ID", "Email", "Program", "Home department", "Account status"],
          ...Object.values(studentAccounts).filter((student) => !searchQuery.trim() || [student.name, student.studentId, student.email, student.program, student.homeDepartment].some((value) => value.toLowerCase().includes(searchQuery.trim().toLowerCase()))).map((student) => [student.name, student.studentId, student.email, student.program, student.homeDepartment, student.active ? "Active" : "Deactivated"])];
        const csv = csvRows.map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(",")).join("\r\n");
        const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
        const link = document.createElement("a");
        link.href = url;
        link.download = `student-accounts-${dateString(0)}.csv`;
        link.click();
        URL.revokeObjectURL(url);
        showToast("Student account report exported.");
      }
      if (hasPermission("documents.verify.assigned")) { headers.push("Documents"); fields.push("documents"); }
    }
    const rows = searched(scoped()).map((item) => fields.map((field) => item[field]));
    const csv = [headers, ...rows].map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `enrollment-report-${role.toLowerCase()}-${dateString(0)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast("Your scoped report has been exported.");
  }

  function bindEvents() {
    document.querySelectorAll("[data-section]").forEach((button) => button.addEventListener("click", () => {
      activeSection = button.dataset.section;
      document.querySelector("#sidebar").classList.remove("open");
      render();
    }));
    document.querySelector("#menu-toggle")?.addEventListener("click", () => document.querySelector("#sidebar").classList.toggle("open"));
    document.querySelector("#admin-signout")?.addEventListener("click", signOut);
    document.querySelector("#global-search")?.addEventListener("input", (event) => {
      searchQuery = event.target.value;
      if (activeSection === "dashboard" || activeSection === "appointments" || activeSection === "students" || activeSection === "workflow" || activeSection === "clearances" || activeSection === "payments") {
        const cursor = event.target.selectionStart;
        render();
        const input = document.querySelector("#global-search");
        input?.focus();
        input?.setSelectionRange(cursor, cursor);
      }
    });
    document.querySelector("#status-filter")?.addEventListener("change", (event) => { statusFilter = event.target.value; render(); });
    document.querySelector("#department-filter")?.addEventListener("change", () => {
      const table = document.querySelector("#appointments-table");
      if (table) table.innerHTML = renderAppointmentTable(filterDepartment(appointmentsForSection()), false);
    });
    document.querySelector("#notification-toggle")?.addEventListener("click", () => {
      const visible = visibleNotifications();
      notifications = notifications.map((item) => visible.includes(item) ? { ...item, read: true } : item);
      save("enrolle_admin_notifications", notifications);
      openModal("Notifications", "Recent system updates and student requirement notices.", visible.length ? `<div class="activity-list">${visible.slice(0, 8).map((item) => `<div class="activity-item"><span class="activity-marker ${item.read ? "" : "amber"}"></span><div class="activity-copy">${escapeHtml(item.message)}<span class="activity-time">${escapeHtml(item.created)}</span></div></div>`).join("")}</div>` : '<div class="empty-state">You are all caught up.</div>', (_form, overlay) => overlay.remove());
      const submit = document.querySelector("#admin-modal [type='submit']");
      if (submit) { submit.textContent = "Done"; submit.addEventListener("click", (event) => { event.preventDefault(); document.querySelector(".overlay")?.remove(); }); }
      document.querySelector(".overlay")?.addEventListener("click", (event) => { if (event.target.classList.contains("overlay")) render(); }, { once: true });
      render();
    });
    document.querySelectorAll("[data-action]").forEach((button) => button.addEventListener("click", () => {
      const action = button.dataset.action;
      if (action === "section") { activeSection = button.dataset.target; render(); }
      if (action === "export") exportCsv();
      if (action === "export-students") exportStudentsCsv();
      if (action === "edit") openStatusModal(button.dataset.id);
      if (action === "view") openStudent(button.dataset.id);
      if (action === "status") openStatusModal(button.dataset.id, button.dataset.field, button.dataset.options.split("|"));
      if (action === "document") openStatusModal(button.dataset.id, "documents", ["Verified", "Needs review", "Missing"]);
      if (action === "new-admin" && role === "MIS") openAdminModal();
      if (action === "new-student" && role === "MIS") openStudentAccountModal();
      if (action === "edit-student" && role === "MIS") openStudentAccountModal(button.dataset.id);
      if (action === "new-announcement" && (role === "SSG" || role === "MIS")) openAnnouncementModal();
      if (action === "permissions" && role === "MIS") openPermissionsModal(Number(button.dataset.index));
      if (action === "edit-settings" && role === "MIS") openSettingsModal();
      if (action === "toggle-admin" && role === "MIS") {
        const admin = admins[Number(button.dataset.index)];
        if (!admin || admin.department === "MIS") return;
        admin.active = !admin.active;
        save("enrolle_admin_accounts", admins);
        logActivity(`<strong>MIS</strong> ${admin.active ? "reactivated" : "deactivated"} the ${escapeHtml(admin.department)} administrator account.`, "MIS");
        render();
        showToast(`Administrator account ${admin.active ? "reactivated" : "deactivated"}.`);
      }
      if (action === "toggle-student" && role === "MIS") {
        const student = studentAccounts[button.dataset.id];
        if (!student) return;
        student.active = !student.active;
        save("enrolle_admin_students", studentAccounts);
        logActivity(`<strong>MIS</strong> ${student.active ? "reactivated" : "deactivated"} the student account for ${escapeHtml(student.name)}.`, "MIS");
        render();
        showToast(`Student account ${student.active ? "reactivated" : "deactivated"}.`);
      }
    }));
  }

  window.addEventListener("storage", (event) => {
    if (event.key !== "ee_appointments" && event.key !== "ee_users") return;
    syncStudentPortal();
    render();
  });

  function mountDemoRoleSwitcher() {
    const card = document.querySelector(".role-card");
    if (!card || sessionStorage.getItem("enrolle_admin_authenticated_role")) return;
    card.insertAdjacentHTML("beforeend", `<label for="role-preview" style="display:block;margin-top:12px;color:#aeb8ca;font-size:10px">Demo role preview</label><select id="role-preview" style="width:100%;margin-top:6px;padding:7px;border:1px solid #42516a;border-radius:7px;color:#e9edf6;background:#23314a;font-size:10px">${Object.entries(roleNames).map(([key, value]) => `<option value="${key}" ${role === key ? "selected" : ""}>${escapeHtml(value)}</option>`).join("")}</select>`);
    document.querySelector("#role-preview").addEventListener("change", (event) => {
      role = event.target.value;
      save("enrolle_admin_role", role);
      activeSection = "dashboard";
      searchQuery = "";
      render();
    });
  }

  const originalRender = render;
  render = function renderWithRolePreview() {
    originalRender();
    mountDemoRoleSwitcher();
  };
  syncStudentPortal();
  render();
})();
