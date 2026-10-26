(() => {
  "use strict";

  const SUPABASE_URL = "https://rkihpmmafukxeddpnlla.supabase.co";
  const SUPABASE_KEY = "sb_publishable_OJg1am3Xg7SF9Fu1jKKMrA_fyAxz-ML";

  const DEFAULT_ADMIN_HASH = "ac9689e2272427085e35b9d3e3e8bed88cb3434828b43b86fc0596cad4c6e270"; // 'admin1234'

  const FALLBACK_ADMINS = {
    MIS: { name: "Maria L. Dizon", email: "mis@college.edu", department: "MIS", role: "Main Admin" },
    SSG: { name: "Angela Torres", email: "ssg@college.edu", department: "SSG", role: "SSG Admin" },
    CodeTech: { name: "Brian Reyes", email: "codetech@college.edu", department: "CodeTech", role: "CodeTech Admin" },
    COED: { name: "Carla Garcia", email: "coed@college.edu", department: "COED", role: "COED Admin" },
    HM: { name: "David Cruz", email: "hm@college.edu", department: "HM", role: "HM Admin" },
    BIT: { name: "Elena Lim", email: "bit@college.edu", department: "BIT", role: "BIT Admin" },
    Registrar: { name: "Francis Ramos", email: "registrar@college.edu", department: "Registrar", role: "Registrar Admin" },
    Clinic: { name: "Grace Santos", email: "clinic@college.edu", department: "Clinic", role: "Clinic Admin" },
    Cashier: { name: "Henry Tan", email: "cashier@college.edu", department: "Cashier", role: "Cashier Admin" },
    Guidance: { name: "Iris Mendoza", email: "guidance@college.edu", department: "Guidance", role: "Guidance Admin" }
  };

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

  async function sha256Hex(text) {
    const enc = new TextEncoder().encode(text);
    const buf = await crypto.subtle.digest("SHA-256", enc);
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
  }

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

  // Check URL parameters for alerts
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get("auth") === "required" && message) {
    message.textContent = "Authentication required. Please sign in to access the administrator portal.";
    message.hidden = false;
  } else if (urlParams.get("logged_out") === "1" && message) {
    message.textContent = "You have been signed out successfully.";
    message.style.borderColor = "#93c5fd";
    message.style.backgroundColor = "#eff6ff";
    message.style.color = "#1e40af";
    message.hidden = false;
  }

  toggle?.addEventListener("click", () => {
    const showing = password.type === "text";
    password.type = showing ? "password" : "text";
    toggle.textContent = showing ? "Show" : "Hide";
    toggle.setAttribute("aria-label", `${showing ? "Show" : "Hide"} password`);
  });

  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (message) message.hidden = true;
    if (submit) {
      submit.disabled = true;
      submit.querySelector("span").textContent = "Verifying…";
    }

    try {
      const email = String(new FormData(form).get("email")).trim().toLowerCase();
      const enteredPassword = String(new FormData(form).get("password"));
      const inputHash = await sha256Hex(enteredPassword);

      let authenticatedAdmin = null;

      // 1. Try Supabase Cloud Database (ee_admin_accounts)
      try {
        const queryUrl = `${SUPABASE_URL}/rest/v1/ee_admin_accounts?email=eq.${encodeURIComponent(email)}&department=eq.${encodeURIComponent(role)}&is_active=eq.true`;
        const res = await fetch(queryUrl, {
          headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`
          }
        });
        if (res.ok) {
          const records = await res.json();
          if (Array.isArray(records) && records.length > 0) {
            const row = records[0];
            if (row.password_hash === inputHash) {
              authenticatedAdmin = {
                name: row.name,
                email: row.email,
                department: row.department,
                role: row.role || role
              };
            }
          }
        }
      } catch (dbErr) {
        console.warn("Supabase admin lookup notice:", dbErr.message);
      }

      // 2. Fallback to authorized departmental credentials if DB table is unpopulated or offline
      if (!authenticatedAdmin) {
        const expected = FALLBACK_ADMINS[role];
        if (expected && expected.email.toLowerCase() === email && inputHash === DEFAULT_ADMIN_HASH) {
          authenticatedAdmin = expected;
        }
      }

      if (!authenticatedAdmin) {
        throw new Error("Invalid work email, password, or department role. Please check your credentials.");
      }

      // Save authenticated session
      sessionStorage.setItem("enrolle_admin_authenticated_role", role);
      sessionStorage.setItem("enrolle_admin_authenticated_name", authenticatedAdmin.name);
      sessionStorage.setItem("enrolle_admin_authenticated_email", authenticatedAdmin.email);
      localStorage.setItem("enrolle_admin_role", JSON.stringify(role));

      window.location.assign("../admin-dashboard.html");
    } catch (error) {
      if (message) {
        message.style.borderColor = "";
        message.style.backgroundColor = "";
        message.style.color = "";
        message.textContent = error.message;
        message.hidden = false;
      }
    } finally {
      if (submit) {
        submit.disabled = false;
        submit.querySelector("span").textContent = `Sign in to ${role}`;
      }
    }
  });
})();
