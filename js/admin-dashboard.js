// admin-dashboard.js
import { supabase } from './supabase.js';
import { AuthService } from './auth-service.js';

init();

async function init() {
    const { data } = await supabase.auth.getSession();

    if (!data.session) {
        window.location.href = "./login.html";
        return;
    }

    bindUI();
    loadPage("posts");
}

function bindUI() {
    document.querySelectorAll("[data-page]").forEach(btn => {
        btn.addEventListener("click", () => {
            loadPage(btn.dataset.page);
        });
    });

    document.getElementById("logoutBtn").onclick = () => AuthService.logout();
}

async function loadPage(page) {
    const container = document.getElementById("contentArea");

    if (page === "posts") return renderPosts(container);
    if (page === "projects") return renderProjects(container);
    if (page === "events") return renderEvents(container);
}

////////////////////////////////////////////////////////////
// BLOG
////////////////////////////////////////////////////////////

async function renderPosts(container) {
    const { data } = await supabase.from("blog").select("*").order("date", { ascending: false });

    container.innerHTML = `
        <h2>Blog</h2>
        <button id="newPost">+ Neuer Beitrag</button>
        <div class="list">
            ${data.map(p => `
                <div class="item">
                    <b>${p.content.substring(0,50)}...</b>
                    <button onclick="editPost(${p.id})">Edit</button>
                    <button onclick="deletePost(${p.id})">Delete</button>
                </div>
            `).join("")}
        </div>
    `;

    document.getElementById("newPost").onclick = () => createPost();
}

window.createPost = async function () {
    const content = prompt("Inhalt:");
    if (!content) return;

    await supabase.from("blog").insert([{ content, date: new Date() }]);
    loadPage("posts");
}

window.deletePost = async function (id) {
    await supabase.from("blog").delete().eq("id", id);
    loadPage("posts");
}

window.editPost = async function (id) {
    const content = prompt("Neuer Inhalt:");
    if (!content) return;

    await supabase.from("blog").update({ content }).eq("id", id);
    loadPage("posts");
}

////////////////////////////////////////////////////////////
// PROJECTS
////////////////////////////////////////////////////////////

async function renderProjects(container) {
    const { data } = await supabase.from("projects").select("*");

    container.innerHTML = `
        <h2>Projekte</h2>
        <button id="newProject">+ Neues Projekt</button>
        <div class="list">
            ${data.map(p => `
                <div class="item">
                    <b>${p.title}</b>
                    <button onclick="editProject(${p.id})">Edit</button>
                    <button onclick="deleteProject(${p.id})">Delete</button>
                </div>
            `).join("")}
        </div>
    `;

    document.getElementById("newProject").onclick = () => createProject();
}

window.createProject = async function () {
    const title = prompt("Titel:");
    if (!title) return;

    await supabase.from("projects").insert([{ title }]);
    loadPage("projects");
}

window.deleteProject = async function (id) {
    await supabase.from("projects").delete().eq("id", id);
    loadPage("projects");
}

window.editProject = async function (id) {
    const title = prompt("Neuer Titel:");
    if (!title) return;

    await supabase.from("projects").update({ title }).eq("id", id);
    loadPage("projects");
}

////////////////////////////////////////////////////////////
// EVENTS
////////////////////////////////////////////////////////////

async function renderEvents(container) {
    const { data } = await supabase.from("events").select("*");

    container.innerHTML = `
        <h2>Events</h2>
        <button id="newEvent">+ Neues Event</button>
        <div class="list">
            ${data.map(e => `
                <div class="item">
                    <b>${e.title}</b>
                    <button onclick="editEvent(${e.id})">Edit</button>
                    <button onclick="deleteEvent(${e.id})">Delete</button>
                </div>
            `).join("")}
        </div>
    `;

    document.getElementById("newEvent").onclick = () => createEvent();
}

window.createEvent = async function () {
    const title = prompt("Event Titel:");
    if (!title) return;

    await supabase.from("events").insert([{ title }]);
    loadPage("events");
}

window.deleteEvent = async function (id) {
    await supabase.from("events").delete().eq("id", id);
    loadPage("events");
}

window.editEvent = async function (id) {
    const title = prompt("Neuer Titel:");
    if (!title) return;

    await supabase.from("events").update({ title }).eq("id", id);
    loadPage("events");
}