(() => {
  "use strict";

  const root = document.querySelector("#eligibility-settings-manager");
  if (!root) return;

  const csrfToken = root.dataset.csrf;
  const apiUrl = "../api/admin/eligibility-settings.php";
  const statusesForm = root.querySelector("#allowed-statuses-form");
  const statusesContainer = root.querySelector("#statuses-checkboxes");
  const docTableBody = root.querySelector("#doc-types-table-body");
  const addDocForm = root.querySelector("#add-doc-type-form");
  const messageEl = root.querySelector("#eligibility-settings-message");

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

  async function loadSettings() {
    try {
      const res = await fetch(apiUrl, {
        credentials: "same-origin",
        headers: { Accept: "application/json" }
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        showMessage(data.message || "Failed to load eligibility settings.", true);
        return;
      }

      renderStatuses(data.allStatuses || [], data.allowedStatuses || []);
      renderDocTypes(data.documentTypes || []);
    } catch (err) {
      showMessage("Error connecting to eligibility settings API.", true);
    }
  }

  function renderStatuses(allStatuses, allowedStatuses) {
    const allowedSet = new Set(allowedStatuses.map(s => String(s).toLowerCase().trim()));
    statusesContainer.innerHTML = allStatuses.map(status => {
      const isChecked = allowedSet.has(status.toLowerCase());
      return `
        <label style="display:inline-flex; align-items:center; gap:6px; margin-right:16px; margin-bottom:8px; font-weight:normal; cursor:pointer;">
          <input type="checkbox" name="statuses[]" value="${escapeHtml(status)}" ${isChecked ? 'checked' : ''}>
          <span>${escapeHtml(status)}</span>
        </label>
      `;
    }).join("");
  }

  function renderDocTypes(docTypes) {
    if (!docTypes.length) {
      docTableBody.innerHTML = '<tr><td colspan="4" class="empty-state">No document types configured.</td></tr>';
      return;
    }

    docTableBody.innerHTML = docTypes.map(d => `
      <tr>
        <td>
          <strong id="doc-name-${d.id}">${escapeHtml(d.name)}</strong>
        </td>
        <td>
          <button type="button" class="button ${d.isRequired ? 'button-primary' : 'button-secondary'}" style="padding: 3px 8px; font-size: 11px;" data-toggle-required="${d.id}">
            ${d.isRequired ? 'Required' : 'Optional'}
          </button>
        </td>
        <td>
          <button type="button" class="button ${d.isActive ? 'button-success' : 'button-danger'}" style="padding: 3px 8px; font-size: 11px;" data-toggle-active="${d.id}">
            ${d.isActive ? 'Active' : 'Inactive'}
          </button>
        </td>
        <td>
          <button type="button" class="button" style="padding: 3px 8px; font-size: 11px;" data-rename-id="${d.id}" data-current-name="${escapeHtml(d.name)}">
            Rename
          </button>
        </td>
      </tr>
    `).join("");

    docTableBody.querySelectorAll("[data-toggle-required]").forEach(btn => {
      btn.onclick = () => toggleRequired(btn.dataset.toggleRequired);
    });

    docTableBody.querySelectorAll("[data-toggle-active]").forEach(btn => {
      btn.onclick = () => toggleActive(btn.dataset.toggleActive);
    });

    docTableBody.querySelectorAll("[data-rename-id]").forEach(btn => {
      btn.onclick = () => renameDocType(btn.dataset.renameId, btn.dataset.currentName);
    });
  }

  // 7c: Save allowed academic statuses
  if (statusesForm) {
    statusesForm.onsubmit = async e => {
      e.preventDefault();
      const checkboxes = statusesForm.querySelectorAll('input[name="statuses[]"]:checked');
      const selected = Array.from(checkboxes).map(cb => cb.value);

      if (selected.length === 0) {
        showMessage("At least one student status must be allowed for enrollment.", true);
        return;
      }

      try {
        const res = await fetch(apiUrl, {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({
            action: "update_allowed_statuses",
            statuses: selected,
            csrf_token: csrfToken
          })
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          showMessage(data.message || "Failed to update allowed statuses.", true);
          return;
        }
        showMessage(data.message);
      } catch (err) {
        showMessage("Error saving allowed statuses.", true);
      }
    };
  }

  // 7b: Add new document type
  if (addDocForm) {
    addDocForm.onsubmit = async e => {
      e.preventDefault();
      const nameInput = addDocForm.querySelector('input[name="name"]');
      const reqInput = addDocForm.querySelector('input[name="isRequired"]');
      const name = nameInput.value.trim();

      if (!name) return;

      try {
        const res = await fetch(apiUrl, {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({
            action: "add_document_type",
            name,
            isRequired: reqInput.checked,
            csrf_token: csrfToken
          })
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          showMessage(data.message || "Failed to add document type.", true);
          return;
        }
        nameInput.value = "";
        reqInput.checked = true;
        showMessage(data.message);
        await loadSettings();
      } catch (err) {
        showMessage("Error adding document type.", true);
      }
    };
  }

  async function toggleRequired(id) {
    try {
      const res = await fetch(apiUrl, {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          action: "toggle_required_document_type",
          id: parseInt(id, 10),
          csrf_token: csrfToken
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        showMessage(data.message || "Failed to update document type.", true);
        return;
      }
      showMessage(data.message);
      await loadSettings();
    } catch (err) {
      showMessage("Error updating document type.", true);
    }
  }

  async function toggleActive(id) {
    try {
      const res = await fetch(apiUrl, {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          action: "toggle_active_document_type",
          id: parseInt(id, 10),
          csrf_token: csrfToken
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        showMessage(data.message || "Failed to update document type status.", true);
        return;
      }
      showMessage(data.message);
      await loadSettings();
    } catch (err) {
      showMessage("Error updating document type status.", true);
    }
  }

  async function renameDocType(id, currentName) {
    const newName = prompt("Enter new document name:", currentName);
    if (!newName || newName.trim() === "" || newName.trim() === currentName) return;

    try {
      const res = await fetch(apiUrl, {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          action: "rename_document_type",
          id: parseInt(id, 10),
          name: newName.trim(),
          csrf_token: csrfToken
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        showMessage(data.message || "Failed to rename document type.", true);
        return;
      }
      showMessage(data.message);
      await loadSettings();
    } catch (err) {
      showMessage("Error renaming document type.", true);
    }
  }

  loadSettings();
})();
