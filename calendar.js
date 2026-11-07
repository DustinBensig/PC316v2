function getStudentSchedule() {
    try {
        const users = JSON.parse(localStorage.getItem("ee_users") || "[]");
        const sessionId = JSON.parse(localStorage.getItem("ee_session") || "null");
        const student = Array.isArray(users)
            ? users.find(user => user && user.sid === sessionId)
            : null;

        if (!student) return null;

        const enrollmentType = [
            student.year,
            student.status,
            student.enrollmentType
        ].filter(Boolean).join(" ").toLowerCase();

        if (enrollmentType.includes("late") || enrollmentType.includes("irregular")) {
            return enrollmentSchedules.find(schedule => schedule.yearLevel === "late");
        }

        const year = enrollmentType.match(/\b([1-4])(?:st|nd|rd|th)?\s*year\b/);
        return year
            ? enrollmentSchedules.find(schedule => schedule.yearLevel === Number(year[1]))
            : null;
    } catch (error) {
        console.error("Unable to load the student enrollment schedule.", error);
        return null;
    }
}


// ENROLLMENT SCHEDULE
// These are sample dates.
// Later, retrieve these from your backend.

const enrollmentSchedules = [
    {
        yearLevel: 1,
        title: "First Year",
        start: "2026-11-09",
        end: "2026-11-13",
        color: "first"
    },
    {
        yearLevel: 2,
        title: "Second Year",
        start: "2026-11-16",
        end: "2026-11-20",
        color: "second"
    },
    {
        yearLevel: 3,
        title: "Third Year",
        start: "2026-11-23",
        end: "2026-11-27",
        color: "third"
    },
    {
        yearLevel: 4,
        title: "Fourth Year",
        start: "2026-11-30",
        end: "2026-12-04",
        color: "fourth"
    },
    {
        yearLevel: "late",
        title: "Late Enrollee / Irregular",
        start: "2026-12-07",
        end: "2026-12-11",
        color: "late"
    }
];


// CALENDAR ELEMENTS

const calendarMonth = document.getElementById("calendarMonth");
const calendarDays = document.getElementById("calendarDays");

const eventDate = document.getElementById("eventDate");
const eventDetails = document.getElementById("eventDetails");

const studentSchedule = document.getElementById("studentSchedule");

let currentDate = new Date(2026, 10, 1);
let selectedDate = null;


// DATE FORMAT

function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}


// FIND ENROLLMENT SCHEDULE

function getEnrollmentSchedule(date) {

    const selected = formatDate(date);

    return enrollmentSchedules.find(schedule => {

        return selected >= schedule.start &&
               selected <= schedule.end;

    });
}


// DISPLAY STUDENT SCHEDULE

function displayStudentSchedule() {

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const mySchedule = getStudentSchedule();

    if (!mySchedule) {
        studentSchedule.innerHTML =
            "No enrollment schedule available.";
        return;
    }

    const startDate = new Date(mySchedule.start + "T00:00:00");
    const endDate = new Date(mySchedule.end + "T00:00:00");

    let status;

    if (today < startDate) {
        status = "Upcoming";
    } else if (today <= endDate) {
        status = "Currently Open";
    } else {
        status = "Enrollment Period Ended";
    }

    studentSchedule.innerHTML = `
        <strong>${mySchedule.title} Schedule</strong><br>
        Date: ${startDate.toLocaleDateString("en-US", {
            month: "long",
            day: "numeric"
        })} - ${endDate.toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric"
        })}<br>
        Status: <strong>${status}</strong>
    `;
}


// DISPLAY SELECTED DATE DETAILS

function displayEvent(date) {

    const schedule = getEnrollmentSchedule(date);

    eventDate.textContent = date.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric"
    });

    if (schedule) {

        eventDetails.innerHTML = `
            <strong>${schedule.title}</strong><br>
            Enrollment is scheduled for ${schedule.title.toLowerCase()}.
        `;

    } else {

        eventDetails.textContent =
            "No enrollment scheduled for this date.";

    }
}


// GENERATE CALENDAR

function renderCalendar() {

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    calendarMonth.textContent = currentDate.toLocaleDateString(
        "en-US",
        {
            month: "long",
            year: "numeric"
        }
    );

    calendarDays.innerHTML = "";

    const firstDay = new Date(year, month, 1).getDay();

    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const previousMonthDays = new Date(year, month, 0).getDate();

    for (let i = 0; i < 42; i++) {

        const dayElement = document.createElement("div");

        dayElement.classList.add("calendar-day");

        let date;

        if (i < firstDay) {

            const day = previousMonthDays - firstDay + i + 1;

            date = new Date(year, month - 1, day);

            dayElement.classList.add("other-month");

        } else if (i >= firstDay + daysInMonth) {

            const day = i - firstDay - daysInMonth + 1;

            date = new Date(year, month + 1, day);

            dayElement.classList.add("other-month");

        } else {

            const day = i - firstDay + 1;

            date = new Date(year, month, day);

        }

        dayElement.textContent = date.getDate();

        // CHECK ENROLLMENT WEEK

        const schedule = getEnrollmentSchedule(date);

        if (schedule) {
            dayElement.classList.add(schedule.color);
        }

        // CHECK SELECTED DATE

        if (
            selectedDate &&
            formatDate(date) === formatDate(selectedDate)
        ) {
            dayElement.classList.add("selected");
        }

        // CLICK DATE

        dayElement.addEventListener("click", () => {

            selectedDate = new Date(
                date.getFullYear(),
                date.getMonth(),
                date.getDate()
            );

            currentDate = new Date(
                date.getFullYear(),
                date.getMonth(),
                1
            );

            displayEvent(selectedDate);

            renderCalendar();

        });

        calendarDays.appendChild(dayElement);
    }
}


// PREVIOUS MONTH

document.getElementById("prevMonth").addEventListener("click", () => {

    currentDate.setMonth(currentDate.getMonth() - 1);

    renderCalendar();

});


// NEXT MONTH

document.getElementById("nextMonth").addEventListener("click", () => {

    currentDate.setMonth(currentDate.getMonth() + 1);

    renderCalendar();

});


// INITIALIZE

renderCalendar();
displayStudentSchedule();