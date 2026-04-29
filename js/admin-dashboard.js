import { supabase } from './supabase.js';
import { AuthService } from './auth-service.js';

const SUPABASE_URL = 'https://pepkapxyjareghuphjoq.supabase.co';

/* =========================================================
   STATE
========================================================= */
let currentPage = "posts";
let modalMode = null;
let modalContextId = null;

let galleryFiles = []; // string URLs + File objects

/* =========================================================
   INIT
========================================================= */
init();

async function init() {
    const { data } = await supabase.auth.getSession();

    if (!data.session) {
        window.location.href = "./auth-service.html";
        return;
    }

    bindUI();
    initModal();
    initTabs();
    initUpload();
    initRealtime();

    loadPage("posts");
}

/* =========================================================
   NAV / UI
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
   MODAL CORE
========================================================= */
const modal = document.getElementById("modal");
const form = document.getElementById("modalForm");

let onSubmitHandler = null;

function initModal() {
    document.getElementById("modalCancel").onclick =
    document.getElementById("modalClose").onclick = closeModal;

    document.getElementById("modalSave").onclick = async () => {
        if (onSubmitHandler) await onSubmitHandler();
        closeModal();
    };
}

function openModal({ title, fields = [], contextId = null, type = "default", useMedia = false, useEvent = false, onSubmit }) {
    modalMode = type;
    modalContextId = contextId;

    document.getElementById("modalTitle").innerText = title;

    form.innerHTML = "";
    galleryFiles = [];

    // CONTENT FIELDS
    fields.forEach(f => {
        form.innerHTML += `
            <div class="field">
                <label>${f.label}</label>
                <input name="${f.name}" type="${f.type || "text"}" value="${f.value || ""}" />
            </div>
        `;
    });

    // MEDIA VISIBILITY
    document.getElementById("tab-media").style.display = useMedia ? "block" : "none";

    // EVENT FIELDS
    document.getElementById("eventFields").classList.toggle("hidden", !useEvent);

    onSubmitHandler = async () => {
        const data = Object.fromEntries(new FormData(form).entries());
        const images = await uploadGallery();

        await onSubmit(data, images);
        loadPage(currentPage);
    };

    modal.classList.remove("hidden");
}

function closeModal() {
    modal.classList.add("hidden");
}

/* =========================================================
   TABS (FIXED)
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
   UPLOAD + DRAG DROP
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
            el.dataset.index = index;

            el.innerHTML = `
                <span>${file.name || file}</span>
                <button class="glass-button">✕</button>
            `;

            el.querySelector("button").onclick = () => {
                galleryFiles.splice(index, 1);
                renderGallery();
            };

            /* =========================
               DRAG SORT FIX (REAL ARRAY SWAP)
            ========================= */
            el.ondragstart = () => el.classList.add("dragging");

            el.ondragend = () => {
                el.classList.remove("dragging");
            };

            el.ondragover = (e) => {
                e.preventDefault();

                const dragging = document.querySelector(".dragging");
                if (!dragging || dragging === el) return;

                const from = Number(dragging.dataset.index);
                const to = Number(el.dataset.index);

                const moved = galleryFiles.splice(from, 1)[0];
                galleryFiles.splice(to, 0, moved);

                renderGallery();
            };

            gallery.appendChild(el);
        });
    }
}

/* =========================================================
   UPLOAD TO SUPABASE
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
        <button class="glass-button" id="newPost">+ Neu</button>

        ${data.map(p => `
            <div class="item glass">
                <b>${p.content?.slice(0,60)}</b>
                <button class="glass-button" onclick="editPost(${p.id})">Edit</button>
                <button class="glass-button" onclick="deletePost(${p.id})">Delete</button>
            </div>
        `).join("")}
    `;

    document.getElementById("newPost").onclick = () => {
        openModal({
            title: "Neuer Post",
            useMedia: true,
            fields: [{ name: "content", label: "Inhalt" }],
            onSubmit: async (data, images) => {
                await supabase.from("blog").insert([{
                    content: data.content,
                    images
                }]);
            }
        });
    };
}

window.deletePost = id =>
    supabase.from("blog").delete().eq("id", id).then(() => loadPage("posts"));

window.editPost = async (id) => {
    const { data } = await supabase.from("blog").select("*").eq("id", id).single();

    openModal({
        title: "Post bearbeiten",
        useMedia: true,
        fields: [{ name: "content", label: "Inhalt", value: data.content }],
        onSubmit: async (form, images) => {
            await supabase.from("blog").update({
                content: form.content,
                images
            }).eq("id", id);
        }
    });

    galleryFiles = data.images || [];
    setTimeout(renderGallery, 0);
};

/* =========================================================
   PROJECTS
========================================================= */
async function renderProjects(container) {
    const { data } = await supabase.from("projects").select("*");

    container.innerHTML = `
        <h2>Projekte</h2>
        <button class="glass-button" id="newProject">+ Neu</button>

        ${data.map(p => `
            <div class="item glass">
                ${p.title}
                <button class="glass-button" onclick="deleteProject(${p.id})">Delete</button>
            </div>
        `).join("")}
    `;

    document.getElementById("newProject").onclick = () => {
        openModal({
            title: "Projekt",
            useMedia: true,
            fields: [
                { name: "title", label: "Titel" },
                { name: "description", label: "Beschreibung" }
            ],
            onSubmit: async (form, images) => {
                await supabase.from("projects").insert([{
                    ...form,
                    gallery: images
                }]);
            }
        });
    };
}

window.deleteProject = id =>
    supabase.from("projects").delete().eq("id", id).then(() => loadPage("projects"));

/* =========================================================
   EVENTS (NO MEDIA)
========================================================= */
async function renderEvents(container) {
    const { data } = await supabase.from("events").select("*");

    container.innerHTML = `
        <h2>Events</h2>
        <button class="glass-button" id="newEvent">+ Neu</button>

        ${data.map(e => `
            <div class="item glass">
                ${e.title}
                <button class="glass-button" onclick="deleteEvent(${e.id})">Delete</button>
            </div>
        `).join("")}
    `;

    document.getElementById("newEvent").onclick = () => {
        openModal({
            title: "Event",
            useEvent: true,
            fields: [
                { name: "title", label: "Titel" },
                { name: "location", label: "Ort" }
            ],
            onSubmit: async (form) => {
                await supabase.from("events").insert([form]);
            }
        });
    };
}

window.deleteEvent = id =>
    supabase.from("events").delete().eq("id", id).then(() => loadPage("events"));

/* =========================================================
   USERS
========================================================= */
async function renderUsers(container) {
    const { data } = await supabase.from("profiles").select("*");

    container.innerHTML = data.map(u => `
        <div class="item glass">
            ${u.first_name} ${u.last_name}
            <button class="glass-button" onclick="setRole('${u.id}','admin')">Admin</button>
        </div>
    `).join("");
}

window.setRole = (id, role) =>
    supabase.from("profiles").update({ role }).eq("id", id);

/* =========================================================
   REALTIME
========================================================= */
function initRealtime() {
    supabase.channel("admin-realtime")
        .on("postgres_changes", { event: "*", schema: "public" }, () => {
            loadPage(currentPage);
        })
        .subscribe();
}