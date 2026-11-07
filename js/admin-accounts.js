(() => {
  "use strict";

  const root = document.querySelector("#admin-accounts-manager");
  if (!root) return;

  const csrfToken = root.dataset.csrf;
  const tableBody = root.querySelector("#admin-table-body");
  const messageEl = root.querySelector("#admin-accounts-message");
  const addBtn = root.querySelector("#add-admin-btn");
  const dialog = document.querySelector("#admin-dialog");

  let roles = [];
  let departments = [];

  function showMessage(text, isError = false) {
    if (!messageEl) return;
    messageEl.textContent = text;
    messageEl.className = isError ? "notice error" : "notice success";
    messageEl.hidden = false;
    setTimeout(() => {
      messageEl.hidden = true;
    }, 6000);
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, c => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[c]));
  }

  const showDialog = html => {
    if (!dialog) return;
    dialog.innerHTML = html;
    dialog.showModal();
  };

  const closeDialog = () => {
    if (!dialog) return;
    dialog.close();
  };

  async function loadAdmins() {
    try {
      const res = await fetch("../api/admin/accounts.php", {
        credentials: "same-origin",
        headers: { Accept: "application/json" }
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        showMessage(data.message || "Failed to load admin accounts.", true);
        return;
      }

      roles = data.roles || [];
      departments = data.departments || [];
      renderAdmins(data.admins || []);
    } catch (err) {
      showMessage("Error connecting to admin accounts service.", true);
    }
  }

  function renderAdmins(admins) {
    if (!admins.length) {
      tableBody.innerHTML = '<tr><td colspan="6" class="empty-state">No administrator accounts found.</td></tr>';
      return;
    }

    tableBody.innerHTML = admins.map(a => `
      <tr>
        <td>
          <strong>${escapeHtml(a.name || a.username)}</strong>
          <br><span class="student-id">@${escapeHtml(a.username)}</span>
        </td>
        <td>${escapeHtml(a.email)}</td>
        <td>
          <span class="badge ${a.isSharedAdmin ? 'badge-primary' : 'badge-secondary'}">
            ${escapeHtml(a.roleName || a.roleKey)}
          </span>
          ${a.departmentCode ? `<br><small class="muted">${escapeHtml(a.departmentName || a.departmentCode)}</small>` : ''}
        </td>
        <td>
          <span class="status-badge ${a.isActive ? 'status-confirmed' : 'status-cancelled'}">
            ${a.isActive ? 'Active' : 'Inactive'}
          </span>
        </td>
        <td>${escapeHtml(a.createdAt ? a.createdAt.split(' ')[0] : '—')}</td>
        <td>
          ${a.isSharedAdmin ? '<span class="muted">Protected</span>' : `
            <div style="display:flex; gap:6px;">
              <button type="button" class="button ${a.isActive ? 'button-danger' : 'button-success'}" style="padding: 4px 8px; font-size: 12px;" data-toggle-id="${a.id}" data-active="${a.isActive}">
                ${a.isActive ? 'Deactivate' : 'Activate'}
              </button>
              <button type="button" class="button" style="padding: 4px 8px; font-size: 12px;" data-reset-id="${a.id}" data-username="${escapeHtml(a.username)}">
                Reset PW
              </button>
            </div>
          `}
        </td>
      </tr>
    `).join("");

    tableBody.querySelectorAll("[data-toggle-id]").forEach(btn => {
      btn.onclick = () => toggleAdminStatus(btn.dataset.toggleId, btn.dataset.active === "true");
    });

    tableBody.querySelectorAll("[data-reset-id]").forEach(btn => {
      btn.onclick = () => openResetPasswordModal(btn.dataset.resetId, btn.dataset.username);
    });
  }

  async function toggleAdminStatus(adminId, currentActive) {
    const actionText = currentActive ? "deactivate" : "activate";
    if (!confirm(`Are you sure you want to ${actionText} this administrator account?`)) return;

    try {
      const res = await fetch("../api/admin/accounts.php", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          action: "toggle_status",
          adminId: parseInt(adminId, 10),
          csrf_token: csrfToken
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        showMessage(data.message || `Failed to ${actionText} admin account.`, true);
        return;
      }
      showMessage(data.message);
      await loadAdmins();
    } catch (err) {
      showMessage("Error updating admin account status.", true);
    }
  }

  function openResetPasswordModal(adminId, username) {
    showDialog(`
      <form id="reset-pw-form" class="student-editor" novalidate>
        <h2>Reset Password: @${escapeHtml(username)}</h2>
        <p class="panel-caption">Password must be 8–72 characters long and include at least one letter and one number.</p>
        <label>New Password
          <input type="password" name="newPassword" required minlength="8" maxlength="72" autocomplete="new-password">
        </label>
        <p id="reset-pw-error" class="notice error" hidden style="margin-top:8px;"></p>
        <div class="student-dialog-actions" style="margin-top:16px;">
          <button type="button" class="button" data-close>Cancel</button>
          <button type="submit" class="button primary">Update Password</button>
        </div>
      </form>
    `);

    const form = dialog.querySelector("#reset-pw-form");
    const errBox = dialog.querySelector("#reset-pw-error");
    dialog.querySelector("[data-close]").onclick = closeDialog;

    form.onsubmit = async e => {
      e.preventDefault();
      errBox.hidden = true;
      const newPassword = form.elements.newPassword.value;
      if (!/^(?=.*[A-Za-z])(?=.*\d).{8,72}$/.test(newPassword)) {
        errBox.textContent = "Password must be 8–72 characters long and include at least one letter and one number.";
        errBox.hidden = false;
        return;
      }

      try {
        const res = await fetch("../api/admin/accounts.php", {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({
            action: "reset_password",
            adminId: parseInt(adminId, 10),
            newPassword,
            csrf_token: csrfToken
          })
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          errBox.textContent = data.message || "Failed to reset password.";
          errBox.hidden = false;
          return;
        }
        closeDialog();
        showMessage(data.message);
      } catch (err) {
        errBox.textContent = "Error resetting password.";
        errBox.hidden = false;
      }
    };
  }

  function openCreateAdminModal() {
    const creatableRoles = roles.filter(r => r.role_key !== "SHARED_ADMIN");
    showDialog(`
      <form id="create-admin-form" class="student-editor" novalidate>
        <h2>Create Administrator Account</h2>
        <p class="panel-caption">Create a new department or MIS administrator account.</p>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
          <label>First Name
            <input type="text" name="firstName" required maxlength="100">
          </label>
          <label>Last Name
            <input type="text" name="lastName" required maxlength="100">
          </label>
        </div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-top:8px;">
          <label>Username
            <input type="text" name="username" required pattern="[A-Za-z0-9._-]{3,64}" maxlength="64" placeholder="e.g. reg_staff">
          </label>
          <label>Email Address
            <input type="email" name="email" required maxlength="190" placeholder="staff@example.com">
          </label>
        </div>
        <div style="margin-top:8px;">
          <label>Role
            <select name="roleId" required>
              <option value="">Select an administrator role...</option>
              ${creatableRoles.map(r => `<option value="${r.id}">${escapeHtml(r.role_name)} (${escapeHtml(r.role_key)})</option>`).join("")}
            </select>
          </label>
        </div>
        <div style="margin-top:8px;">
          <label>Initial Password
            <input type="password" name="password" required minlength="8" maxlength="72" autocomplete="new-password">
          </label>
          <small class="muted" style="font-size:11px;">Must be 8–72 characters, including at least one letter and one number.</small>
        </div>
        <p id="create-admin-error" class="notice error" hidden style="margin-top:12px;"></p>
        <div class="student-dialog-actions" style="margin-top:16px;">
          <button type="button" class="button" data-close>Cancel</button>
          <button type="submit" class="button primary">Create Admin</button>
        </div>
      </form>
    `);

    const form = dialog.querySelector("#create-admin-form");
    const errBox = dialog.querySelector("#create-admin-error");
    dialog.querySelector("[data-close]").onclick = closeDialog;

    form.onsubmit = async e => {
      e.preventDefault();
      errBox.hidden = true;
      const values = Object.fromEntries(new FormData(form).entries());

      if (!/^(?=.*[A-Za-z])(?=.*\d).{8,72}$/.test(values.password)) {
        errBox.textContent = "Password must be 8–72 characters long and include at least one letter and one number.";
        errBox.hidden = false;
        return;
      }

      try {
        const res = await fetch("../api/admin/accounts.php", {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({
            action: "create",
            username: values.username.trim(),
            email: values.email.trim(),
            firstName: values.firstName.trim(),
            lastName: values.lastName.trim(),
            password: values.password,
            roleId: parseInt(values.roleId, 10),
            csrf_token: csrfToken
          })
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          errBox.textContent = data.message || "Failed to create administrator account.";
          errBox.hidden = false;
          return;
        }
        closeDialog();
        showMessage(data.message);
        await loadAdmins();
      } catch (err) {
        errBox.textContent = "Error creating administrator account.";
        errBox.hidden = false;
      }
    };
  }

  if (addBtn) {
    addBtn.onclick = openCreateAdminModal;
  }

  loadAdmins();
})();
