(() => {
  "use strict";

  const root = document.querySelector("#student-eligibility-manager");
  if (!root) return;

  const searchForm = document.querySelector("#eligibility-student-search");
  const studentNumberInput = document.querySelector("#eligibility-student-number");
  const editor = document.querySelector("#eligibility-record-editor");
  const message = document.querySelector("#eligibility-manager-message");
  const csrfToken = root.dataset.csrf;
  const apiUrl = "../api/admin/student-eligibility.php";
  const academicStatuses = ["applicant", "active", "inactive", "graduated", "dropped", "suspended", "enrolling", "enrolled"];
  const gradeStatuses = ["complete", "missing", "incomplete", "deficient", "failed", "pending"];
  const paymentStatuses = ["paid", "unpaid", "pending"];
  const holdStatuses = ["active", "released"];
  const requirementStatuses = ["unresolved", "in_progress", "resolved"];
  const documentStatuses = ["missing", "submitted", "verified", "rejected"];

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[character]));
  }

  function options(values, selected, labels = {}) {
    return values.map(value =>
      `<option value="${escapeHtml(value)}" ${String(value) === String(selected) ? "selected" : ""}>${escapeHtml(labels[value] || value)}</option>`
    ).join("");
  }

  function subjectRow(subject = {}) {
    return `<tr data-subject-row>
      <td><input data-field="subject" maxlength="150" value="${escapeHtml(subject.subject || "")}"></td>
      <td><select data-field="isRequired">
        <option value="true" ${subject.isRequired ? "selected" : ""}>Required</option>
        <option value="false" ${subject.isRequired ? "" : "selected"}>Not required</option>
      </select></td>
      <td><input data-field="grade" type="number" min="0" max="100" step="0.01" value="${escapeHtml(subject.grade ?? "")}" placeholder="No grade"></td>
      <td><select data-field="gradeStatus">${options(gradeStatuses, subject.gradeStatus || "missing")}</select></td>
    </tr>`;
  }

  function financialRow(record = {}) {
    return `<tr data-financial-row data-id="${escapeHtml(record.id ?? "")}">
      <td><input data-field="balance" type="number" min="0" max="99999999.99" step="0.01" value="${escapeHtml(record.balance ?? "0.00")}" required></td>
      <td><select data-field="paymentStatus">${options(paymentStatuses, record.paymentStatus || "pending")}</select></td>
      <td><input data-field="description" maxlength="255" value="${escapeHtml(record.description || "")}" placeholder="Description"></td>
    </tr>`;
  }

  function holdRow(hold = {}) {
    return `<tr data-hold-row data-id="${escapeHtml(hold.id ?? "")}">
      <td><input data-field="reason" maxlength="500" value="${escapeHtml(hold.reason || "")}" required></td>
      <td><select data-field="status">${options(holdStatuses, hold.status || "active")}</select></td>
    </tr>`;
  }

  function requirementRow(requirement = {}) {
    return `<tr data-requirement-row data-id="${escapeHtml(requirement.id ?? "")}">
      <td><input data-field="name" maxlength="180" value="${escapeHtml(requirement.name || "")}" required></td>
      <td><select data-field="status">${options(requirementStatuses, requirement.status || "unresolved", {
        unresolved: "Unresolved",
        in_progress: "In progress",
        resolved: "Resolved"
      })}</select></td>
      <td><select data-field="blocksEnrollment">
        <option value="true" ${requirement.blocksEnrollment !== false ? "selected" : ""}>Blocks enrollment</option>
        <option value="false" ${requirement.blocksEnrollment === false ? "selected" : ""}>Does not block</option>
      </select></td>
    </tr>`;
  }

  function documentRow(documentRecord) {
    return `<tr data-document-row data-document-type-id="${escapeHtml(documentRecord.documentTypeId)}">
      <td>${escapeHtml(documentRecord.name)}</td>
      <td><select data-field="status">${options(documentStatuses, documentRecord.status)}</select></td>
    </tr>`;
  }

  function renderRecord(record) {
    const student = record.student;
    const eligibility = record.eligibility;
    editor.innerHTML = `
      <section class="panel">
        <h2>${escapeHtml(student.name)} · ${escapeHtml(student.studentNumber)}</h2>
        <p>${escapeHtml(student.email)} · ${escapeHtml(student.program)} · Account ${student.accountActive ? "active" : "inactive"}</p>
        <h3>Current booking eligibility: ${eligibility.eligible ? "Eligible" : "Not eligible"}</h3>
        <ul>${eligibility.checks.map(check =>
          `<li><strong>${check.passed ? "✓" : "✗"} ${escapeHtml(check.label)}</strong>
            ${(check.reasons || []).map(reason => `<div>${escapeHtml(reason)}</div>`).join("")}</li>`
        ).join("")}</ul>
      </section>
      <form id="eligibility-record-form">
        <section class="panel">
          <h2>Student status</h2>
          <label for="eligibility-year-level">Year level</label>
          <select id="eligibility-year-level" name="yearLevel">
            <option value="">Not set</option>
            ${options(["First Year", "Second Year", "Third Year", "Fourth Year"], student.yearLevel)}
          </select>
          <label for="eligibility-academic-status">Academic status</label>
          <select id="eligibility-academic-status" name="academicStatus">${options(academicStatuses, student.academicStatus)}</select>
        </section>
        <section class="panel">
          <div class="toolbar"><h2>Required subjects and grades</h2><button class="button" type="button" data-add-row="subjects">Add subject</button></div>
          <div class="table-wrap"><table>
            <thead><tr><th>Subject</th><th>Enrollment requirement</th><th>Grade (0-100)</th><th>Grade status</th></tr></thead>
            <tbody data-rows="subjects">${record.subjects.map(subjectRow).join("")}</tbody>
          </table></div>
        </section>
        <section class="panel">
          <div class="toolbar"><h2>Financial records</h2><button class="button" type="button" data-add-row="financial">Add record</button></div>
          <div class="table-wrap"><table>
            <thead><tr><th>Balance</th><th>Payment status</th><th>Description</th></tr></thead>
            <tbody data-rows="financialRecords">${record.financialRecords.map(financialRow).join("")}</tbody>
          </table></div>
        </section>
        <section class="panel">
          <div class="toolbar"><h2>Enrollment holds</h2><button class="button" type="button" data-add-row="holds">Add hold</button></div>
          <div class="table-wrap"><table>
            <thead><tr><th>Reason</th><th>Status</th></tr></thead>
            <tbody data-rows="holds">${record.holds.map(holdRow).join("")}</tbody>
          </table></div>
        </section>
        <section class="panel">
          <div class="toolbar"><h2>Other enrollment requirements</h2><button class="button" type="button" data-add-row="requirements">Add requirement</button></div>
          <div class="table-wrap"><table>
            <thead><tr><th>Requirement</th><th>Status</th><th>Enrollment impact</th></tr></thead>
            <tbody data-rows="requirements">${record.requirements.map(requirementRow).join("")}</tbody>
          </table></div>
        </section>
        <section class="panel">
          <h2>Required documents</h2>
          <div class="table-wrap"><table>
            <thead><tr><th>Document</th><th>Status</th></tr></thead>
            <tbody data-rows="documents">${record.documents.map(documentRow).join("")}</tbody>
          </table></div>
        </section>
        <button class="button primary" type="submit">Save eligibility records</button>
      </form>`;
    editor.hidden = false;
  }

  function setMessage(text, isError = false) {
    message.textContent = text;
    message.className = isError ? "alert" : "notice";
  }

  async function parseResponse(response) {
    const result = await response.json();
    if (response.status === 401) {
      window.location.replace("../admin-login/admin-login.html");
      throw new Error("Your administrator session has expired.");
    }
    if (!response.ok || !result.success) {
      throw new Error(result.message || "The student record could not be loaded.");
    }
    return result;
  }

  async function loadRecord(studentNumber) {
    setMessage("Loading student eligibility records…");
    editor.hidden = true;
    const response = await fetch(`${apiUrl}?studentNumber=${encodeURIComponent(studentNumber)}`, {
      credentials: "same-origin"
    });
    const result = await parseResponse(response);
    renderRecord(result.record);
    setMessage("Student eligibility records loaded.");
  }

  function collectRows(selector, mapRow) {
    return Array.from(editor.querySelectorAll(selector)).map(mapRow);
  }

  function collectId(row) {
    const id = row.dataset.id || "";
    return id === "" ? null : Number(id);
  }

  function collectRecord() {
    const form = editor.querySelector("#eligibility-record-form");
    const subjects = collectRows("[data-subject-row]", row => ({
      subject: row.querySelector('[data-field="subject"]').value.trim(),
      isRequired: row.querySelector('[data-field="isRequired"]').value === "true",
      grade: row.querySelector('[data-field="grade"]').value,
      gradeStatus: row.querySelector('[data-field="gradeStatus"]').value
    })).filter(row => row.subject !== "");
    const financialRecords = collectRows("[data-financial-row]", row => ({
      id: collectId(row),
      balance: row.querySelector('[data-field="balance"]').value,
      paymentStatus: row.querySelector('[data-field="paymentStatus"]').value,
      description: row.querySelector('[data-field="description"]').value
    }));
    const holds = collectRows("[data-hold-row]", row => ({
      id: collectId(row),
      reason: row.querySelector('[data-field="reason"]').value,
      status: row.querySelector('[data-field="status"]').value
    }));
    const requirements = collectRows("[data-requirement-row]", row => ({
      id: collectId(row),
      name: row.querySelector('[data-field="name"]').value,
      status: row.querySelector('[data-field="status"]').value,
      blocksEnrollment: row.querySelector('[data-field="blocksEnrollment"]').value === "true"
    }));
    const documents = collectRows("[data-document-row]", row => ({
      documentTypeId: Number(row.dataset.documentTypeId),
      status: row.querySelector('[data-field="status"]').value
    }));
    return {
      csrf_token: csrfToken,
      studentNumber: studentNumberInput.value.trim(),
      yearLevel: form.elements.yearLevel.value || null,
      academicStatus: form.elements.academicStatus.value,
      subjects,
      financialRecords,
      holds,
      requirements,
      documents
    };
  }

  root.addEventListener("submit", async event => {
    if (event.target === searchForm) {
      event.preventDefault();
      if (!searchForm.reportValidity()) return;
      try {
        await loadRecord(studentNumberInput.value.trim());
      } catch (error) {
        setMessage(error.message || "The student record could not be loaded.", true);
      }
      return;
    }

    if (event.target.id !== "eligibility-record-form") return;
    event.preventDefault();
    const submitButton = event.target.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    setMessage("Saving eligibility records…");
    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(collectRecord())
      });
      const result = await parseResponse(response);
      renderRecord(result.record);
      setMessage("Eligibility records saved and the booking checks have been refreshed.");
    } catch (error) {
      setMessage(error.message || "The student record could not be saved.", true);
    } finally {
      if (submitButton.isConnected) submitButton.disabled = false;
    }
  });

  root.addEventListener("click", event => {
    const button = event.target.closest("[data-add-row]");
    if (!button) return;
    const rows = editor.querySelector(`[data-rows="${button.dataset.addRow}"]`);
    if (!rows) return;
    const templates = {
      subjects: subjectRow(),
      financial: financialRow(),
      holds: holdRow(),
      requirements: requirementRow()
    };
    if (templates[button.dataset.addRow]) {
      rows.insertAdjacentHTML("beforeend", templates[button.dataset.addRow]);
    }
  });

  const initialStudentNumber = studentNumberInput.value.trim();
  if (initialStudentNumber) {
    loadRecord(initialStudentNumber).catch(error => {
      setMessage(error.message || "The student record could not be loaded.", true);
    });
  }
})();
