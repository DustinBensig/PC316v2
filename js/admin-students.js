(() => {
  const root = document.querySelector('#student-management');
  if (!root) return;

  const api = '../api/admin/students.php';
  const csrfToken = root.dataset.csrf || '';
  const canManage = root.dataset.canManage === 'true';
  const canAudit = root.dataset.canAudit === 'true';
  const tableBody = root.querySelector('#student-table-body');
  const message = root.querySelector('#student-management-message');
  const searchForm = root.querySelector('#student-search');
  const auditPanel = root.querySelector('#student-audit-panel');
  const auditBody = root.querySelector('#student-audit-body');
  const dialog = document.createElement('dialog');
  dialog.className = 'student-dialog';
  document.body.append(dialog);

  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);

  const request = async (url, options = {}) => {
    const response = await fetch(url, { credentials: 'same-origin', ...options });
    const result = await response.json();
    if (response.status === 401) {
      window.location.href = '../admin-login/admin-login.html';
      throw new Error('Authentication required.');
    }
    if (!response.ok || !result.success) {
      throw new Error(result.message || 'The student service is unavailable.');
    }
    return result;
  };

  const setMessage = (text, isError = false) => {
    message.textContent = text;
    message.classList.toggle('alert', isError);
  };

  const showDialog = html => {
    dialog.innerHTML = html;
    dialog.showModal();
  };

  const closeDialog = () => dialog.close();

  const field = (name, label, type = 'text', required = true, maxlength = '') => `
    <label>${label}
      <input name="${name}" type="${type}" ${required ? 'required' : ''} ${maxlength ? `maxlength="${maxlength}"` : ''}>
    </label>`;

  const openStudentForm = async (studentId = null) => {
    let student = null;
    if (studentId !== null) {
      try {
        student = (await request(`${api}?id=${encodeURIComponent(studentId)}`)).student;
      } catch (error) {
        setMessage(error.message, true);
        return;
      }
    }

    const editing = student !== null;
    showDialog(`
      <form id="student-editor" class="student-editor" novalidate>
        <h2>${editing ? 'Edit Student' : 'Add Student'}</h2>
        <p class="panel-caption">Campus: Daanbantayan Campus</p>
        ${field('studentId', 'Student ID', 'text', true, '7')}
        ${field('firstName', 'First Name', 'text', true, '100')}
        ${field('middleName', 'Middle Name', 'text', true, '100')}
        ${field('lastName', 'Last Name', 'text', true, '100')}
        ${field('email', 'Email', 'email', true, '190')}
        ${field('contactNumber', 'Contact Number', 'tel', true, '32')}
        ${field('program', 'Program', 'text', true, '150')}
        <label>Year Level
          <select name="yearLevel" required>
            <option value="">Select Year Level</option>
            <option value="1st Year">1st Year</option>
            <option value="2nd Year">2nd Year</option>
            <option value="3rd Year">3rd Year</option>
            <option value="4th Year">4th Year</option>
          </select>
        </label>
        <label>Student Status
          <select name="studentStatus" required>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </label>
        ${editing ? '' : `${field('password', 'Initial Password', 'password', true, '72')}${field('confirmPassword', 'Confirm Initial Password', 'password', true, '72')}`}
        <p class="panel-caption">The enrollment week is assigned automatically from the selected year level.</p>
        <p class="student-dialog-message" role="alert"></p>
        <div class="student-dialog-actions">
          <button type="button" class="button" data-close>Cancel</button>
          <button type="submit" class="button primary">${editing ? 'Save Changes' : 'Create Student'}</button>
        </div>
      </form>`);

    const form = dialog.querySelector('#student-editor');
    if (student) {
      for (const [key, value] of Object.entries({
        id: student.id,
        studentId: student.studentId,
        firstName: student.firstName,
        middleName: student.middleName,
        lastName: student.lastName,
        email: student.email,
        contactNumber: student.contactNumber,
        program: student.program,
        yearLevel: student.yearLevel,
        studentStatus: student.studentStatus
      })) {
        if (form.elements.namedItem(key)) form.elements.namedItem(key).value = value ?? '';
      }
    }

    dialog.querySelector('[data-close]').onclick = closeDialog;
    form.onsubmit = async event => {
      event.preventDefault();
      const values = Object.fromEntries(new FormData(form).entries());
      const data = {
        ...values,
        id: student?.id,
        action: editing ? 'update' : 'create',
        csrf_token: csrfToken
      };
      const submit = form.querySelector('button[type="submit"]');
      submit.disabled = true;
      try {
        const result = await request(api, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        closeDialog();
        setMessage(result.message);
        await loadStudents();
      } catch (error) {
        dialog.querySelector('.student-dialog-message').textContent = error.message;
      } finally {
        submit.disabled = false;
      }
    };
  };

  const renderStudents = students => {
    if (!students.length) {
      tableBody.innerHTML = '<tr><td colspan="7" class="empty-state">No student records match these filters.</td></tr>';
      return;
    }
    tableBody.innerHTML = students.map(student => `
      <tr>
        <td>${escapeHtml(student.studentId)}</td>
        <td>${escapeHtml(student.name)}</td>
        <td>${escapeHtml(student.program)}</td>
        <td>${escapeHtml(student.yearLevel)}</td>
        <td>${escapeHtml(student.campus)}</td>
        <td>${escapeHtml(student.studentStatus)}</td>
        <td class="student-actions">
          <button class="button small" type="button" data-action="view" data-id="${student.id}">View</button>
          ${canManage ? `<button class="button small" type="button" data-action="edit" data-id="${student.id}">Edit</button>
          <button class="button small" type="button" data-action="${student.studentStatus === 'Active' ? 'deactivate' : 'activate'}" data-id="${student.id}">${student.studentStatus === 'Active' ? 'Deactivate' : 'Activate'}</button>` : ''}
        </td>
      </tr>`).join('');
  };

  const loadStudents = async () => {
    tableBody.innerHTML = '<tr><td colspan="7" class="empty-state">Loading students…</td></tr>';
    const params = new URLSearchParams(new FormData(searchForm));
    try {
      const result = await request(`${api}?${params}`);
      renderStudents(result.students);
    } catch (error) {
      tableBody.innerHTML = `<tr><td colspan="7" class="empty-state">${escapeHtml(error.message)}</td></tr>`;
    }
  };

  const formatAuditData = raw => {
    if (!raw) return '—';
    let data = raw;
    if (typeof raw === 'string') {
      try { data = JSON.parse(raw); } catch { return escapeHtml(raw); }
    }
    return `<details><summary>View</summary><pre>${escapeHtml(JSON.stringify(data, null, 2))}</pre></details>`;
  };

  const loadAudit = async () => {
    auditBody.innerHTML = '<tr><td colspan="6" class="empty-state">Loading audit logs…</td></tr>';
    try {
      const result = await request(`${api}?audit=1`);
      if (!result.auditLogs.length) {
        auditBody.innerHTML = '<tr><td colspan="6" class="empty-state">No audit log entries found.</td></tr>';
        return;
      }
      auditBody.innerHTML = result.auditLogs.map(log => `
        <tr>
          <td>${escapeHtml(log.date_created)}</td>
          <td>${escapeHtml(log.username || '—')}</td>
          <td>${escapeHtml(log.student_number || '—')}</td>
          <td>${escapeHtml(log.action)}</td>
          <td>${formatAuditData(log.old_data)}</td>
          <td>${formatAuditData(log.new_data)}</td>
        </tr>`).join('');
    } catch (error) {
      auditBody.innerHTML = `<tr><td colspan="6" class="empty-state">${escapeHtml(error.message)}</td></tr>`;
    }
  };

  searchForm.onsubmit = event => {
    event.preventDefault();
    loadStudents();
  };
  tableBody.onclick = async event => {
    const button = event.target.closest('button[data-action]');
    if (!button) return;
    const action = button.dataset.action;
    const id = button.dataset.id;
    if (action === 'view') {
      try {
        const student = (await request(`${api}?id=${encodeURIComponent(id)}`)).student;
        const entries = [
          ['Student ID', student.studentId],
          ['Name', student.name],
          ['Email', student.email],
          ['Contact Number', student.contactNumber],
          ['Program', student.program],
          ['Year Level', student.yearLevel],
          ['Campus', student.campus],
          ['Student Status', student.studentStatus],
          ['Assigned Enrollment Week', student.assignedEnrollmentWeek]
        ];
        showDialog(`<div class="student-editor"><h2>Student Details</h2><dl>${entries.map(([key, value]) => `<dt>${escapeHtml(key)}</dt><dd>${escapeHtml(value || '—')}</dd>`).join('')}</dl><div class="student-dialog-actions"><button type="button" class="button" data-close>Close</button></div></div>`);
        dialog.querySelector('[data-close]').onclick = closeDialog;
      } catch (error) {
        setMessage(error.message, true);
      }
      return;
    }
    if (action === 'edit') {
      openStudentForm(id);
      return;
    }
    const nextAction = action === 'activate' ? 'activate' : 'deactivate';
    if (nextAction === 'deactivate' && !window.confirm('Deactivate this student account?')) return;
    button.disabled = true;
    try {
      const result = await request(api, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: nextAction, id: Number(id), csrf_token: csrfToken })
      });
      setMessage(result.message);
      await loadStudents();
      if (auditPanel.hidden === false && canAudit) await loadAudit();
    } catch (error) {
      setMessage(error.message, true);
      button.disabled = false;
    }
  };

  const addButton = root.querySelector('#add-student-button');
  if (addButton) addButton.onclick = () => openStudentForm();
  const auditToggle = root.querySelector('#student-audit-toggle');
  if (auditToggle && canAudit) {
    auditToggle.onclick = async () => {
      auditPanel.hidden = !auditPanel.hidden;
      if (!auditPanel.hidden) await loadAudit();
    };
  }
  loadStudents();
})();
