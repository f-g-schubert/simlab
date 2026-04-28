import { getDB_DataSet } from "./db.js";
// import { initRealtime } from "./realtime.js"; // ⬅️ (REALTIME AKTIVIEREN)

let DB = null;

initDashboard();

/* =========================
    INIT
========================= */
async function initDashboard() {
    try {
        DB = await getDB_DataSet();

        renderEvents();
        renderBlog();
        renderProjects();

        /* =========================
            REALTIME AKTIVIEREN
        ========================= */

        /*
        // ❗ ENTKOMMENTIEREN FÜR REALTIME:
        initRealtime(async () => {
            DB = await getDB_DataSet();

            renderEvents();
            renderBlog();
            renderProjects();
        });
        */

    } catch (e) {
        console.error("Dashboard Fehler:", e);
    }
}

/* =========================
    HELPERS
========================= */
function getTimeLabel(dateString) {
    const now = new Date();
    const eventDate = new Date(dateString);

    const diffTime = eventDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return "Vergangen";
    if (diffDays === 0) return "Heute";
    if (diffDays === 1) return "Morgen";
    if (diffDays < 7) return `In ${diffDays} Tagen`;

    const weeks = Math.ceil(diffDays / 7);
    return `In ${weeks} Woche${weeks > 1 ? "n" : ""}`;
}

function truncate(text, length) {
    if (!text) return "";
    return text.length > length ? text.substring(0, length) + "..." : text;
}

function formatDate(date) {
    return new Date(date).toLocaleDateString();
}

/* =========================
    RENDER EVENTS
========================= */
function renderEvents() {
    if (!DB?.events) return;

    const container = document.querySelector("#eventsPreview .card-content");
    if (!container) return;

    const events = [...DB.events]
        .sort((a, b) => new Date(a.start) - new Date(b.start))
        .slice(0, 3);

    container.innerHTML = events.map(event => `
        <div class="preview-item">
            <div class="preview-color" style="background:${event.color}"></div>

            <div class="preview-text">
                <strong>${event.title}</strong>
                <span>${new Date(event.start).toLocaleDateString()}</span>
                <small>${getTimeLabel(event.start)}</small>
            </div>
        </div>
    `).join("");
}

/* =========================
    RENDER BLOG
========================= */
function renderBlog() {
    if (!DB?.blog) return;

    const container = document.querySelector("#blogPreview .card-content");
    if (!container) return;

    const posts = [...DB.blog]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 3);

    container.innerHTML = posts.map(post => `
        <div class="preview-item">
            <img src="${post.images?.[0] || ''}" class="preview-img">

            <div class="preview-text">
                <strong>${post.author}</strong>
                <span>${formatDate(post.date)}</span>
                <small>${truncate(post.content, 80)}</small>
            </div>
        </div>
    `).join("");
}

/* =========================
    RENDER PROJECTS
========================= */
function renderProjects() {
    if (!DB?.projects) return;

    const container = document.querySelector("#projectsPreview .card-content");
    if (!container) return;

    const projects = [...DB.projects]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 3);

    container.innerHTML = projects.map(project => `
        <div class="preview-item">
            <img src="${project.cover}" class="preview-img">

            <div class="preview-text">
                <strong>${project.title}</strong>
                <span>${project.status}</span>
                <small>${truncate(project.description, 80)}</small>
            </div>
        </div>
    `).join("");
}