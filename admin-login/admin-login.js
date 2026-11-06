(() => {
  "use strict";

  // ---------------------------------------------------------------
  // CONSTANT ADMIN ACCOUNTS (client-side only)
  // ---------------------------------------------------------------
  const ADMIN_ACCOUNTS = Object.freeze([
    { email: "mis@enrolle.local",       password: "Admin@MIS2026",       name: "MIS Administrator",       role: "MIS" },
    { email: "ssg@enrolle.local",       password: "Admin@SSG2026",       name: "SSG Administrator",       role: "SSG" },
    { email: "codetech@enrolle.local",  password: "Admin@CodeTech2026",  name: "CodeTech Administrator",  role: "CodeTech" },
    { email: "coed@enrolle.local",      password: "Admin@COED2026",      name: "COED Administrator",      role: "COED" },
    { email: "hm@enrolle.local",        password: "Admin@HM2026",        name: "HM Administrator",        role: "HM" },
    { email: "bit@enrolle.local",       password: "Admin@BIT2026",       name: "BIT Administrator",       role: "BIT" },
    { email: "registrar@enrolle.local", password: "Admin@Registrar2026", name: "Registrar Administrator", role: "Registrar" },
    { email: "clinic@enrolle.local",    password: "Admin@Clinic2026",    name: "Clinic Administrator",    role: "Clinic" },
    { email: "cashier@enrolle.local",   password: "Admin@Cashier2026",   name: "Cashier Administrator",   role: "Cashier" },
    { email: "guidance@enrolle.local",  password: "Admin@Guidance2026",  name: "Guidance Administrator",  role: "Guidance" }
  ]);

  window.EnrolleAdminAuth = {
    authenticate(email, password, requestedRole) {
      const normalizedEmail = String(email).trim().toLowerCase();
      const account = ADMIN_ACCOUNTS.find((entry) =>
        entry.email === normalizedEmail && entry.password === password &&
        (!requestedRole || entry.role === requestedRole || entry.role === "MIS")
      );
      if (!account) return null;
      return { email: account.email, name: account.name, role: account.role };
    }
  };

  const MAX_ATTEMPTS = 5;
  const LOCKOUT_MS = 5 * 60 * 1000;

  const roles = [
    ["MIS", "MIS", "Main system administrator", "mis-admin-login.html"],
    ["SSG", "SSG", "Student government", "ssg-admin-login.html"],
    ["CodeTech", "CodeTech", "Technology department", "codetech-admin-login.html"],
    ["COED", "COED", "College of Education", "coed-admin-login.html"],
    ["HM", "HM", "Hospitality Management", "hm-admin-login.html"],
    ["BIT", "BIT", "Industrial Technology", "bit-admin-login.html"],
    ["Registrar", "Registrar", "Enrollment records", "registrar-admin-login.html"],
    ["Clinic", "Clinic", "Medical clearance", "clinic-admin-login.html"],
    ["Cashier", "Cashier", "Payments and history", "cashier-admin-login.html"],
    ["Guidance", "Guidance", "Guidance clearance", "guidance-admin-login.html"]
  ];

  // ---------------------------------------------------------------
  // Helpers for admin-dashboard.html:
  //   EnrolleAuth.require()               -> redirects if not logged in
  //   EnrolleAuth.require(["Registrar"])  -> restricts by role (MIS always allowed)
  //   EnrolleAuth.logout()
  // ---------------------------------------------------------------
  const LOGIN_INDEX = "admin-login.html";
  const read = (key) => { try { return JSON.parse(localStorage.getItem(key)); } catch { return null; } };

  window.EnrolleAuth = {
    current() { return read("enrolle_admin_session"); },
    require(allowed, loginPage = LOGIN_INDEX) {
      const s = this.current();
      if (!s || (allowed && s.role !== "MIS" && !allowed.includes(s.role))) {
        window.location.replace(loginPage);
        return null;
      }
      return s;
    },
    logout(loginPage = LOGIN_INDEX) {
      ["enrolle_admin_session", "enrolle_admin_role", "enrolle_admin_lock"].forEach((k) => localStorage.removeItem(k));
      window.location.assign(loginPage);
    }
  };

  const role = document.body.dataset.adminRole;
  if (!role) {
    const links = document.querySelector("#admin-role-links");
    if (links) {
      links.innerHTML = roles.map(([key, label, description, href]) =>
        `<a class="role-link" href="${href}"><strong>${key === "CodeTech" ? "CT" : key === "Registrar" ? "R" : key.slice(0, 1)}</strong><span>${label}<small>${description}</small></span></a>`
      ).join("");
    }
    return;
  }

  const form = document.querySelector("#admin-login-form");
  const message = document.querySelector("#login-message");
  const submit = form?.querySelector('[type="submit"]');
  const password = document.querySelector("#admin-password");
  const toggle = document.querySelector(".password-toggle");

  const showError = (text) => { message.textContent = text; message.hidden = false; };

  toggle?.addEventListener("click", () => {
    const showing = password.type === "text";
    password.type = showing ? "password" : "text";
    toggle.textContent = showing ? "Show" : "Hide";
    toggle.setAttribute("aria-label", `${showing ? "Show" : "Hide"} password`);
  });

  form?.addEventListener("submit", (event) => {
    event.preventDefault();
    message.hidden = true;

    // Lockout check
    const lock = read("enrolle_admin_lock") || { attempts: 0, until: 0 };
    if (lock.until > Date.now()) {
      const mins = Math.ceil((lock.until - Date.now()) / 60000);
      showError(`Too many failed attempts. Try again in ${mins} minute(s).`);
      return;
    }

    const data = new FormData(form);
    const email = String(data.get("email")).trim().toLowerCase();
    const pass = String(data.get("password"));

    const account = window.EnrolleAdminAuth.authenticate(email, pass, role);

    if (!account) {
      lock.attempts += 1;
      if (lock.attempts >= MAX_ATTEMPTS) { lock.until = Date.now() + LOCKOUT_MS; lock.attempts = 0; }
      localStorage.setItem("enrolle_admin_lock", JSON.stringify(lock));
      showError("The email, password, or assigned administrator role could not be verified.");
      return;
    }

    const session = { ...account, signedInAt: Date.now() };
    try {
      localStorage.removeItem("enrolle_admin_lock");
      localStorage.removeItem("ee_session");
      localStorage.setItem("enrolle_admin_session", JSON.stringify(session));
    } catch (error) {
      console.error("Unable to save the administrator sign-in session.", error);
      showError("Unable to save your sign-in on this browser. Check that browser storage is enabled and try again.");
      return;
    }
    window.location.assign("../admin-dashboard.html");
  });
})();