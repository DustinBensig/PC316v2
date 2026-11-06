(() => {
  "use strict";

  const form = document.querySelector("#admin-login-form");
  if (!form) return;

  const message = document.querySelector("#login-message");
  const submit = form.querySelector('[type="submit"]');

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    message.hidden = true;
    submit.disabled = true;
    submit.querySelector("span").textContent = "Signing in…";

    try {
      const sessionResponse = await fetch("../api/admin/session.php", {
        credentials: "same-origin",
        headers: { "Accept": "application/json" }
      });
      if (!sessionResponse.ok) {
        throw new Error("The sign-in service is unavailable. Please try again later.");
      }
      const session = await sessionResponse.json();

      const response = await fetch("../api/admin/login.php", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({
          username: String(new FormData(form).get("username")).trim(),
          password: String(new FormData(form).get("password")),
          csrf_token: session.csrf_token
        })
      });
      let result;
      try {
        result = await response.json();
      } catch {
        throw new Error("The sign-in service returned an invalid response. Contact your system administrator.");
      }
      if (!response.ok || result?.success !== true) {
        throw new Error(result?.message || (response.status === 401
          ? "The username or password is incorrect."
          : "Unable to sign in right now. Please try again."));
      }

      window.location.assign("../admin/dashboard.php");
    } catch (error) {
      message.textContent = error instanceof TypeError
        ? "Cannot reach the PHP sign-in service. Open this site through its configured web server."
        : error.message;
      message.hidden = false;
    } finally {
      submit.disabled = false;
      submit.querySelector("span").textContent = "Login";
    }
  });
})();
