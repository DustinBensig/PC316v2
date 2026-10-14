(() => {
  "use strict";

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

  toggle?.addEventListener("click", () => {
    const showing = password.type === "text";
    password.type = showing ? "password" : "text";
    toggle.textContent = showing ? "Show" : "Hide";
    toggle.setAttribute("aria-label", `${showing ? "Show" : "Hide"} password`);
  });

  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    message.hidden = true;
    submit.disabled = true;
    submit.querySelector("span").textContent = "Signing in…";

    try {
      const response = await fetch("../api/admin/login.php", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({
          email: String(new FormData(form).get("email")).trim(),
          password: String(new FormData(form).get("password")),
          requested_role: role
        })
      });
      let result;
      try {
        result = await response.json();
      } catch {
        throw new Error("The sign-in service returned an invalid response. Contact your system administrator.");
      }
      if (!response.ok || result?.success !== true) {
        throw new Error(result?.message || (response.status === 401 || response.status === 403
          ? "The email, password, or assigned administrator role could not be verified."
          : "Unable to sign in right now. Please try again or contact MIS."));
      }
      const admin = result.admin;
      if (!admin || admin.department !== role || !admin.name) {
        throw new Error("The sign-in service did not confirm the administrator's assigned department.");
      }

      sessionStorage.setItem("enrolle_admin_authenticated_role", role);
      sessionStorage.setItem("enrolle_admin_authenticated_name", admin.name);
      sessionStorage.setItem("enrolle_admin_authenticated_email", admin.email || "");
      localStorage.setItem("enrolle_admin_role", JSON.stringify(role));
      window.location.assign("../admin-dashboard.html");
    } catch (error) {
      message.textContent = error instanceof TypeError
        ? "Cannot reach the PHP sign-in service. Configure api/admin/login.php and try again."
        : error.message;
      message.hidden = false;
    } finally {
      submit.disabled = false;
      submit.querySelector("span").textContent = `Sign in to ${role}`;
    }
  });
})();
