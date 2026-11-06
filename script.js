(() => {
  const DEFAULT_TYPE = "Registrar's Office (Document Evaluation & COR Release)";
  const PERIODS = [
    { name: 'Morning', time: '08:00 AM', label: '8:00 AM – 12:00 PM' },
    { name: 'Afternoon', time: '01:00 PM', label: '1:00 PM – 5:00 PM' }
  ];
  const ASSIGNED_WEEKS = {
    '1st Year': 1,
    '2nd Year': 2,
    '3rd Year': 3,
    '4th Year': 4,
    'Late Enrollee / Irregular': 5
  };
  const today = new Date();
  const state = {
    month: new Date(today.getFullYear(), today.getMonth(), 1),
    date: null,
    period: null
  };
  const byId = id => document.getElementById(id);
  const dateKey = date => [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0')
  ].join('-');
  const todayKey = dateKey(today);
  const FIRST_YEAR_FIRST_TERM_DOCUMENTS = [
    'Completed Enrollment Form',
    'Recent 2×2 ID Picture',
    'Student ID or valid government ID',
    'Certificate of Good Moral Character',
    'PSA Birth Certificate',
    'Previous semester grades / TOR (if applicable)',
    'Proof of payment / assessment slip'
  ];
  const CONTINUING_STUDENT_DOCUMENTS = [
    'Completed Enrollment Form',
    'Recent 2×2 ID Picture',
    'Student ID or valid government ID',
    'Clearance (department / clinic / guidance, as applicable)',
    'Previous semester grades / TOR (if applicable)',
    'Proof of payment / assessment slip'
  ];

  function readStored(key, fallback) {
    try {
      const value = localStorage.getItem(key);
      return value === null ? fallback : JSON.parse(value);
    } catch (error) {
      console.error(`Unable to read ${key} from browser storage.`, error);
      return fallback;
    }
  }

  function getCurrentUser() {
    const users = readStored('ee_users', []);
    const sessionId = readStored('ee_session', null);
    if (!Array.isArray(users) || !sessionId) return null;
    return users.find(user => user && user.sid === sessionId) || null;
  }

  function showError(message) {
    const error = byId('error-book');
    if (error) error.textContent = message;
  }

  function renderRequiredDocuments() {
    const container = byId('requiredDocuments');
    const year = byId('year').value;
    const term = byId('term').value;
    const documents = year && term
      ? year === '1st Year' && term === '1st Semester'
        ? FIRST_YEAR_FIRST_TERM_DOCUMENTS
        : CONTINUING_STUDENT_DOCUMENTS
      : null;

    container.replaceChildren();
    if (!documents) {
      const prompt = document.createElement('span');
      prompt.textContent = 'Select a year level and term to view required documents.';
      container.append(prompt);
      return;
    }

    documents.forEach(documentName => {
      const item = document.createElement('span');
      item.textContent = `✓ ${documentName}`;
      container.append(item);
    });
  }

  function bookedCount(date, periodName) {
    const appointments = readStored('ee_appointments', []);
    if (!Array.isArray(appointments)) return 0;
    return appointments.filter(appointment =>
      appointment.date === date &&
      appointment.status !== 'Cancelled' &&
      (appointment.period === periodName ||
        (!appointment.period && appointment.time === PERIODS.find(period => period.name === periodName).time))
    ).length;
  }

  function periodHasStarted(date, periodName) {
    if (date !== todayKey) return false;
    const time = PERIODS.find(period => period.name === periodName).time;
    const [clock, meridiem] = time.split(' ');
    const [hour, minute] = clock.split(':').map(Number);
    const hour24 = (hour % 12) + (meridiem === 'PM' ? 12 : 0);
    const start = new Date(`${date}T${String(hour24).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`);
    return start <= new Date();
  }

  function updateContinueButton() {
    byId('continue').disabled = !(
      state.date &&
      state.period &&
      byId('year').value &&
      byId('term').value &&
      byId('program').value
    );
  }

  function getDateWeek(dateValue) {
    const day = Number(dateValue.slice(-2));
    return Math.min(Math.ceil(day / 7), 5);
  }

  function renderCalendar() {
    const year = state.month.getFullYear();
    const month = state.month.getMonth();
    const assignedWeek = ASSIGNED_WEEKS[byId('year').value];
    byId('month').textContent = state.month.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric'
    });

    const firstWeekday = new Date(year, month, 1).getDay();
    const dayCount = new Date(year, month + 1, 0).getDate();
    const calendar = byId('calendar');
    calendar.innerHTML = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      .map(day => `<div class="weekday">${day}</div>`).join('');

    for (let blank = 0; blank < firstWeekday; blank += 1) {
      calendar.insertAdjacentHTML('beforeend', '<div class="calendar-empty"></div>');
    }

    for (let day = 1; day <= dayCount; day += 1) {
      const date = new Date(year, month, day);
      const value = dateKey(date);
      const weekday = date.getDay();
      const cohort = getDateWeek(value);
      const outsideAssignedWeek = assignedWeek !== undefined && cohort !== assignedWeek;
      const disabled = value < todayKey || weekday === 0 || weekday === 6 || outsideAssignedWeek;
      const selected = value === state.date;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `day week${cohort}${weekday === 0 || weekday === 6 ? ' weekend' : ''}${selected ? ' selected' : ''}`;
      button.textContent = String(day);
      button.disabled = disabled;
      button.setAttribute('aria-label', date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      }) + (outsideAssignedWeek ? ', outside your assigned enrollment week' : ''));
      if (!disabled) {
        button.addEventListener('click', () => {
          state.date = value;
          state.period = null;
          showError('');
          renderCalendar();
          renderPeriods();
          updateContinueButton();
        });
      }
      calendar.append(button);
    }
  }

  function renderPeriods() {
    const slotButtons = document.querySelectorAll('[data-slot]');
    slotButtons.forEach(button => {
      const periodName = button.dataset.slot;
      const started = state.date && periodHasStarted(state.date, periodName);
      const full = state.date && bookedCount(state.date, periodName) >= 150;
      button.classList.toggle('active', state.period === periodName);
      button.disabled = !state.date || full || started;
      const availability = button.querySelector('[data-availability]');
      if (availability) {
        availability.textContent = !state.date
          ? 'Choose a date first'
          : started ? 'This period has already started'
          : full ? 'Full (150/150)' : `Available (${150 - bookedCount(state.date, periodName)} slots)`;
      }
    });
    if (state.period && (bookedCount(state.date, state.period) >= 150 ||
      periodHasStarted(state.date, state.period))) state.period = null;
  }

  function setup() {
    const user = getCurrentUser();
    if (!user) {
      location.replace('login.html');
      return;
    }

    document.querySelectorAll('[data-slot]').forEach(button => {
      button.addEventListener('click', () => {
        if (!state.date || button.disabled) return;
        state.period = button.dataset.slot;
        showError('');
        renderPeriods();
        updateContinueButton();
      });
    });

    byId('prev').addEventListener('click', () => {
      state.month = new Date(state.month.getFullYear(), state.month.getMonth() - 1, 1);
      renderCalendar();
    });
    byId('next').addEventListener('click', () => {
      state.month = new Date(state.month.getFullYear(), state.month.getMonth() + 1, 1);
      renderCalendar();
    });
    byId('year').addEventListener('change', () => {
      const assignedWeek = ASSIGNED_WEEKS[byId('year').value];
      const dateIsOutsideAssignedWeek = state.date &&
        assignedWeek !== undefined &&
        getDateWeek(state.date) !== assignedWeek;
      if (dateIsOutsideAssignedWeek) {
        state.date = null;
        state.period = null;
        showError('That date is outside the week assigned to your year level. Please choose another date.');
      }
      renderRequiredDocuments();
      renderCalendar();
      renderPeriods();
      updateContinueButton();
    });
    byId('term').addEventListener('change', () => {
      renderRequiredDocuments();
      updateContinueButton();
    });
    byId('program').addEventListener('change', updateContinueButton);
    byId('continue').addEventListener('click', () => {
      if (!state.date || !state.period) {
        showError('Choose an available weekday and time period.');
        return;
      }
      if (bookedCount(state.date, state.period) >= 150) {
        state.period = null;
        renderPeriods();
        updateContinueButton();
        showError('That time period just filled up. Please select another.');
        return;
      }
      const selectedPeriod = PERIODS.find(period => period.name === state.period);
      const draft = {
        type: DEFAULT_TYPE,
        yearLevel: byId('year').value,
        term: byId('term').value,
        program: byId('program').value,
        date: state.date,
        time: selectedPeriod.time,
        period: selectedPeriod.name
      };
      try {
        sessionStorage.setItem('ee_draft', JSON.stringify(draft));
      } catch (error) {
        console.error('Unable to save the appointment draft.', error);
        showError('Your browser could not save this booking. Check storage permissions and try again.');
        return;
      }
      location.href = 'appointment-summary.html';
    });

    renderCalendar();
    renderPeriods();
    renderRequiredDocuments();
    updateContinueButton();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setup, { once: true });
  } else {
    setup();
  }
})();
