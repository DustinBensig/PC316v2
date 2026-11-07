(() => {
    let users;
    let sessionId;

    try {
        users = JSON.parse(localStorage.getItem("ee_users") || "[]");
        sessionId = JSON.parse(localStorage.getItem("ee_session") || "null");
    } catch (error) {
        console.error("Unable to load the signed-in student account.", error);
        window.location.replace("login.html");
        return;
    }

    if (!Array.isArray(users) || !sessionId) {
        window.location.replace("login.html");
        return;
    }

    const user = users.find(account => account && account.sid === sessionId);

    if (!user || typeof user.name !== "string" || typeof user.sid !== "string") {
        window.location.replace("login.html");
        return;
    }

    document.querySelectorAll("[data-account-name]").forEach(element => {
        element.textContent = user.name;
    });

    document.querySelectorAll("[data-account-sid]").forEach(element => {
        element.textContent = user.sid;
    });

    let appointments;
    try {
        appointments = JSON.parse(localStorage.getItem("ee_appointments") || "[]");
        if (!Array.isArray(appointments)) {
            throw new TypeError("Saved appointments must be a list.");
        }
    } catch (error) {
        console.error("Unable to load the appointment queue.", error);
        appointments = [];
    }

    const now = new Date();
    const upcoming = appointments
        .map(appointment => {
            if (!appointment || appointment.sid !== sessionId || appointment.status === "Cancelled") {
                return null;
            }

            const time = String(appointment.time || "");
            const match = time.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
            if (!match || !appointment.date) return null;

            let hour = Number(match[1]) % 12;
            if (match[3].toUpperCase() === "PM") hour += 12;
            const appointmentTime = new Date(
                `${appointment.date}T${String(hour).padStart(2, "0")}:${match[2]}:00`
            );
            return Number.isNaN(appointmentTime.getTime()) ? null : { appointment, appointmentTime };
        })
        .filter(item => item && item.appointmentTime >= now)
        .sort((first, second) => first.appointmentTime - second.appointmentTime)[0]
        ?.appointment;

    const queueNumber = document.getElementById("dashboardQueueNumber");
    const queueSummary = document.getElementById("dashboardQueueSummary");
    const queueStatus = document.getElementById("dashboardQueueStatus");
    const queueTime = document.getElementById("dashboardQueueTime");
    const queueValue = upcoming && upcoming.queue ? upcoming.queue : "—";
    if (queueNumber) queueNumber.textContent = queueValue;
    if (queueSummary) queueSummary.textContent = queueValue;
    if (queueStatus) {
        queueStatus.textContent = upcoming
            ? "Upcoming appointment"
            : "No active queue";
    }
    if (queueTime) {
        queueTime.textContent = upcoming
            ? `${upcoming.date} · ${upcoming.time}`
            : "No upcoming appointment";
    }
})();
