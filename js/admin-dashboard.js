// admin-dashboard.js
import { supabase } from './supabase.js';
import { AuthService } from './auth-service.js';

const SUPABASE_URL = 'https://pepkapxyjareghuphjoq.supabase.co';

let currentPage = "posts";
let galleryFiles = []; // files + urls gemischt

init();

/* =========================================================
   INIT
========================================================= */
async function init() {
    const { data } = await supabase.auth.getSession();

    if (!data.session) {
        window.location.href = "./auth-service.html";
        return;
    }

    bindUI();
    initModal();
    initUpload();
    initTabs();
    initRealtime();

    loadPage("posts");
}

/* =========================================================
   BASIC UI
========================================================= */
function bindUI() {
    document.querySelectorAll("[data-page]").forEach(btn => {
        btn.onclick = () => {
            currentPage = btn.dataset.page;
            loadPage(currentPage);
        };
    });

    document.getElementById("logoutBtn").onclick = () => AuthService.logout();
}

async function loadPage(page) {
    const el = document.getElementById("contentArea");

    if (page === "posts") return renderPosts(el);
    if (page === "projects") return renderProjects(el);
    if (page === "events") return renderEvents(el);
    if (page === "users") return renderUsers(el);
}

/* =========================================================
   MODAL SYSTEM (TABS)
========================================================= */
const modal = document.getElementById("modal");
const modalForm = document.getElementById("modalForm");
let modalSubmit = null;

function initModal() {
    document.getElementById("modalCancel").onclick =
    document.getElementById("modalClose").onclick = closeModal;

    document.getElementById("modalSave").onclick = async () => {
        await modalSubmit();
        closeModal();
    };
}

function openModal({ title, fields, showUpload = false, isEvent = false, onSubmit }) {
    document.getElementById("modalTitle").innerText = title;

    modalForm.innerHTML = "";
    galleryFiles = [];

    fields.forEach(f => {
        modalForm.innerHTML += `
            <label>${f.label}</label>
            <input name="${f.name}" type="${f.type || "text"}" value="${f.value || ""}">
        `;
    });

    document.getElementById("dropzone").style.display = showUpload ? "block" : "none";
    document.getElementById("gallery").style.display = showUpload ? "flex" : "none";
    document.getElementById("eventFields").classList.toggle("hidden", !isEvent);

    modalSubmit = async () => {
        const data = Object.fromEntries(new FormData(modalForm).entries());

        const uploaded = await uploadGallery();

        await onSubmit(data, uploaded);
    };

    modal.classList.remove("hidden");
}

function closeModal() {
    modal.classList.add("hidden");
}

/* =========================================================
   TABS
========================================================= */
function initTabs() {
    document.querySelectorAll(".modal-tabs button").forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll(".modal-tabs button").forEach(b => b.classList.remove("active"));
            document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));

            btn.classList.add("active");
            document.getElementById("tab-" + btn.dataset.tab).classList.add("active");
        };
    });
}

/* =========================================================
   DRAG & DROP + GALLERY
========================================================= */
function initUpload() {
    const dropzone = document.getElementById("dropzone");
    const input = dropzone.querySelector("input");
    const gallery = document.getElementById("gallery");

    dropzone.onclick = () => input.click();

    input.onchange = e => addFiles(e.target.files);

    dropzone.ondragover = e => {
        e.preventDefault();
        dropzone.classList.add("drag");
    };

    dropzone.ondragleave = () => dropzone.classList.remove("drag");

    dropzone.ondrop = e => {
        e.preventDefault();
        addFiles(e.dataTransfer.files);
    };

    function addFiles(files) {
        galleryFiles.push(...files);
        renderGallery();
    }

    function renderGallery() {
        gallery.innerHTML = "";

        galleryFiles.forEach((file, index) => {
            const el = document.createElement("div");
            el.className = "gallery-item";
            el.draggable = true;

            el.innerHTML = `
                <span>${file.name || file}</span>
                <button data-i="${index}">✕</button>
            `;

            el.querySelector("button").onclick = () => {
                galleryFiles.splice(index, 1);
                renderGallery();
            };

            // DRAG SORT
            el.ondragstart = () => el.classList.add("dragging");

            el.ondragend = () => {
                el.classList.remove("dragging");
                const items = [...gallery.children];
                galleryFiles = items.map(i => galleryFiles[i.dataset.index]);
                renderGallery();
            };

            el.dataset.index = index;
            gallery.appendChild(el);
        });
    }
}

/* =========================================================
   UPLOAD MULTI
========================================================= */
async function uploadGallery() {
    const urls = [];

    for (const file of galleryFiles) {
        if (typeof file === "string") {
            urls.push(file);
            continue;
        }

        const name = `${Date.now()}-${file.name}`;

        await supabase.storage
            .from("blog-images")
            .upload(name, file);

        urls.push(`${SUPABASE_URL}/storage/v1/object/public/blog-images/${name}`);
    }

    return urls;
}

/* =========================================================
   BLOG
========================================================= */
async function renderPosts(container) {
    const { data } = await supabase.from("blog").select("*");

    container.innerHTML = `
        <h2>Blog</h2>
        <button id="newPost">+ Neu</button>
        ${data.map(p => `
            <div class="item">
                ${p.content?.slice(0,50)}
                <button onclick="editPost(${p.id})">Edit</button>
                <button onclick="deletePost(${p.id})">Delete</button>
            </div>
        `).join("")}
    `;

    document.getElementById("newPost").onclick = () => {
        openModal({
            title: "Neuer Post",
            showUpload: true,
            fields: [{ name: "content", label: "Inhalt" }],
            onSubmit: async (data, images) => {
                await supabase.from("blog").insert([{
                    content: data.content,
                    images
                }]);
                loadPage("posts");
            }
        });
    };
}

window.deletePost = id => supabase.from("blog").delete().eq("id", id).then(()=>loadPage("posts"));
window.editPost = id => console.log("TODO edit");

/* =========================================================
   PROJECTS
========================================================= */
async function renderProjects(container) {
    const { data } = await supabase.from("projects").select("*");

    container.innerHTML = `
        <h2>Projekte</h2>
        <button id="newProject">+ Neu</button>
        ${data.map(p => `
            <div class="item">
                ${p.title}
                <button onclick="deleteProject(${p.id})">Delete</button>
            </div>
        `).join("")}
    `;

    document.getElementById("newProject").onclick = () => {
        openModal({
            title: "Projekt",
            showUpload: true,
            fields: [
                { name: "title", label: "Titel" },
                { name: "description", label: "Beschreibung" }
            ],
            onSubmit: async (data, images) => {
                await supabase.from("projects").insert([{
                    ...data,
                    gallery: images
                }]);
                loadPage("projects");
            }
        });
    };
}

window.deleteProject = id => supabase.from("projects").delete().eq("id", id).then(()=>loadPage("projects"));

/* =========================================================
   EVENTS
========================================================= */
async function renderEvents(container) {
    const { data } = await supabase.from("events").select("*");

    container.innerHTML = `
        <h2>Events</h2>
        <button id="newEvent">+ Neu</button>
        ${data.map(e => `
            <div class="item">
                ${e.title}
                <button onclick="deleteEvent(${e.id})">Delete</button>
            </div>
        `).join("")}
    `;

    document.getElementById("newEvent").onclick = () => {
        openModal({
            title: "Event",
            isEvent: true,
            fields: [
                { name: "title", label: "Titel" },
                { name: "location", label: "Ort" }
            ],
            onSubmit: async (data) => {
                await supabase.from("events").insert([data]);
                loadPage("events");
            }
        });
    };
}

window.deleteEvent = id => supabase.from("events").delete().eq("id", id).then(()=>loadPage("events"));

/* =========================================================
   USERS
========================================================= */
async function renderUsers(container) {
    const { data } = await supabase.from("profiles").select("*");

    container.innerHTML = data.map(u => `
        <div class="item">
            ${u.first_name} ${u.last_name}
            <button onclick="setRole('${u.id}','admin')">Admin</button>
        </div>
    `).join("");
}

window.setRole = (id, role) => supabase.from("profiles").update({ role }).eq("id", id);

/* =========================================================
   REALTIME
========================================================= */
function initRealtime() {
    supabase.channel("db-changes")
        .on("postgres_changes", { event: "*", schema: "public" }, () => {
            loadPage(currentPage);
        })
        .subscribe();
}