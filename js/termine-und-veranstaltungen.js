// termine-und-veranstaltungen.js
import { getDB_dataFor } from "./db.js";

const events = getDB_dataFor("events");

let currentDate = new Date();

const calendar = document.getElementById("calendar");
const monthLabel = document.getElementById("monthLabel");

function renderCalendar() {
    calendar.innerHTML = "";

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];

    monthLabel.textContent =
        currentDate.toLocaleString("de-DE", { month: "long", year: "numeric" });

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let i = 0; i < firstDay; i++) {
        calendar.innerHTML += `<div></div>`;
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

        const dayDiv = document.createElement("div");
        dayDiv.className = "day";

        // ⭐ HEUTE markieren
        if (dateStr === todayStr) {
            dayDiv.classList.add("today");
        }

        dayDiv.innerHTML = `<strong>${day}</strong>`;

        const dayEvents = events.filter(e => e.start.startsWith(dateStr));

        dayEvents.forEach(e => {
            const el = document.createElement("div");
            el.className = "event";
            el.style.background = e.color;
            el.textContent = e.title;

            el.addEventListener("click", () => openEvent(e));

            // RIGHT CLICK EXPORT
            el.addEventListener("contextmenu", (ev) => {
                ev.preventDefault();
                downloadICS(e);
            });

            // MOBILE LONG PRESS
            let pressTimer;
            el.addEventListener("touchstart", () => {
                pressTimer = setTimeout(() => downloadICS(e), 600);
            });
            el.addEventListener("touchend", () => clearTimeout(pressTimer));

            dayDiv.appendChild(el);
        });

        calendar.appendChild(dayDiv);
    }
}

renderCalendar();

document.getElementById("prevMonth").onclick = () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
};

document.getElementById("nextMonth").onclick = () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
};

function openEvent(e) {
    const modal = document.getElementById("eventModal");

    modal.innerHTML = `
        <h2>${e.title}</h2>
        <p><strong>Ort:</strong> ${e.location}</p>
        <p><strong>Zeit:</strong> ${e.start} - ${e.end}</p>
        <p>${e.description}</p>

        <p><strong>Voraussetzungen:</strong> ${e.requirements.join(", ") || "Keine"}</p>
        <p><strong>Info:</strong> ${e.info}</p>

        <div>
            ${e.tags.map(t => `<span>#${t}</span>`).join(" ")}
        </div>

        <button id="exportBtn">📅 Export</button>
        <button id="closeBtn">Schließen</button>
    `;

    modal.querySelector("#exportBtn").onclick = () => downloadICS(e);
    modal.querySelector("#closeBtn").onclick = closeModal;

    modal.classList.remove("hidden");
}

function closeModal() {
    document.getElementById("eventModal").classList.add("hidden");
}

function downloadICS(event) {
    if (typeof event === "number") {
        event = events.find(e => e.id === event);
    }

    const formatDate = (d) =>
        new Date(d).toISOString().replace(/[-:]/g, "").split(".")[0];

    const ics = `
BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
SUMMARY:${event.title}
DTSTART:${formatDate(event.start)}
DTEND:${formatDate(event.end)}
LOCATION:${event.location}
DESCRIPTION:${event.description}
END:VEVENT
END:VCALENDAR
`;

    const blob = new Blob([ics], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `${event.title}.ics`;
    a.click();

    URL.revokeObjectURL(url);
}

setTimeout(() => {
    document.querySelector(".today")?.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });
}, 100);