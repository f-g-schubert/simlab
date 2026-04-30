// admin-dashboard.js
import { supabase } from './supabase.js';
import { AuthService } from './auth-service.js';

const SUPABASE_URL = 'https://pepkapxyjareghuphjoq.supabase.co';

/* =========================================================
   STATE
========================================================= */
let currentPage = "posts";
let modalOnSubmit = null;
let galleryFiles = [];

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
   NAV
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

/* =========================================================
   PAGE LOADER
========================================================= */
async function loadPage(page) {
    const el = document.getElementById("contentArea");

    if (page === "posts") return renderPosts(el);
    if (page === "projects") return renderProjects(el);
    if (page === "events") return renderEvents(el);
    if (page === "users") return renderUsers(el);
}

/* =========================================================
   MODAL
========================================================= */
const modal = document.getElementById("modal");
const form = document.getElementById("modalForm");

function initModal() {
    document.getElementById("modalCancel").onclick =
    document.getElementById("modalClose").onclick = closeModal;

    document.getElementById("modalSave").onclick = async () => {
        if (!modalOnSubmit) return;

        try {
            const data = {
                ...Object.fromEntries(new FormData(form).entries()),
                eventDate: document.querySelector('[name="eventDate"]')?.value,
                eventStart: document.querySelector('[name="eventStart"]')?.value,
                eventEnd: document.querySelector('[name="eventEnd"]')?.value
            };
            const images = await uploadGallery();

            await modalOnSubmit(data, images);

            closeModal();
            loadPage(currentPage);

        } catch (err) {
            console.error("SAVE ERROR:", err);
            alert("Fehler beim Speichern. Siehe Konsole.");
        }
    };
}

function openModal({ title, type, data = {}, onSubmit }) {
    modalOnSubmit = onSubmit;
    form.innerHTML = "";
    galleryFiles = [];

    document.getElementById("modalTitle").innerText = title;

    // RESET SPECIAL UI
    document.getElementById("eventFields").classList.add("hidden");

    /* =========================
       FIELD DEFINITIONS
    ========================= */
    let fields = [];

    if (type === "blog") {
        fields = [
            { name: "content", label: "Inhalt", type: "textarea" }
        ];
    }

    if (type === "project") {
        fields = [
            { name: "title", label: "Titel" },
            { name: "description", label: "Kurzbeschreibung" },
            { name: "fullText", label: "Text", type: "textarea" },
            { name: "category", label: "Kategorie" },
            { name: "status", label: "Status" },
            { name: "cover", label: "Cover URL" },
            { name: "tags", label: "Tags (comma separated)" }
        ];
    }

    if (type === "event") {
        fields = [
            { name: "title", label: "Titel" },
            { name: "location", label: "Ort" },
            { name: "description", label: "Beschreibung", type: "textarea" },
            { name: "info", label: "Info" },
            { name: "requirements", label: "Requirements (comma separated)" },
            { name: "tags", label: "Tags (comma separated)" },
            { name: "color", label: "Farbe (#hex)" }
        ];

        document.getElementById("eventFields").classList.remove("hidden");
    }

    /* =========================
       RENDER FIELDS
    ========================= */
    fields.forEach(f => {
        const value = data[f.name] || "";

        form.innerHTML += `
            <div class="field">
                <label>${f.label}</label>
                ${
                    f.type === "textarea"
                        ? `<textarea name="${f.name}">${value}</textarea>`
                        : `<input name="${f.name}" value="${value}" />`
                }
            </div>
        `;
    });

    /* =========================
       IMAGE INPUT (blog + project)
    ========================= */
    if (type === "blog" || type === "project") {
        form.innerHTML += `
            <div class="field">
                <label>Bild-URL</label>
                <input id="imageUrlInput" placeholder="https://..." />
                <button type="button" id="addImageUrl">Hinzufügen</button>
            </div>
        `;

        setTimeout(() => {
            document.getElementById("addImageUrl").onclick = () => {
                const val = document.getElementById("imageUrlInput").value;
                if (val) {
                    galleryFiles.push(val);
                    renderGallery();
                }
            };
        });
    }

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
   UPLOAD SYSTEM
========================================================= */
function initUpload() {
    const dropzone = document.getElementById("dropzone");
    const input = dropzone.querySelector("input");

    dropzone.onclick = () => input.click();
    input.onchange = e => addFiles(e.target.files);

    dropzone.ondrop = e => {
        e.preventDefault();
        addFiles(e.dataTransfer.files);
    };

    function addFiles(files) {
        galleryFiles.push(...files);
        renderGallery();
    }
}

/* =========================================================
   GALLERY RENDER
========================================================= */
function renderGallery() {
    const gallery = document.getElementById("gallery");
    gallery.innerHTML = "";

    galleryFiles.forEach((file, i) => {
        const el = document.createElement("div");
        el.className = "gallery-item";

        el.innerHTML = `
            <span>${file.name || file}</span>
            <button>✕</button>
        `;

        el.querySelector("button").onclick = () => {
            galleryFiles.splice(i, 1);
            renderGallery();
        };

        gallery.appendChild(el);
    });
}

/* =========================================================
   UPLOAD
========================================================= */
async function uploadGallery() {
    const urls = [];

    for (const file of galleryFiles) {
        if (typeof file === "string") {
            urls.push(file);
            continue;
        }

        try {
            const name = `${Date.now()}-${file.name}`;

            const { error } = await supabase.storage
                .from("blog-images")
                .upload(name, file);

            if (error) throw error;

            urls.push(`${SUPABASE_URL}/storage/v1/object/public/blog-images/${name}`);

        } catch (err) {
            console.error("Upload Fehler:", err);
        }
    }

    return urls;
}

/* =========================================================
   BLOG
========================================================= */
async function renderPosts(container) {
    const { data, error } = await supabase.from("blog").select("*");

    if (error) return console.error(error);

    container.innerHTML = `
        <h2>Blog</h2>
        <button id="newPost">+ Neu</button>

        ${data.map(p => `
            <div class="item">
                ${p.content?.slice(0,60)}
                <button onclick="editPost(${p.id})">Edit</button>
                <button onclick="deletePost(${p.id})">Delete</button>
            </div>
        `).join("")}
    `;

    document.getElementById("newPost").onclick = () => {
        openModal({
            title: "Neuer Post",
            type: "blog",
            fields: [{ name: "content", label: "Inhalt" }],
            onSubmit: async (data, images) => {

                const { data: user } = await supabase.auth.getUser();

                const { data: profile } = await supabase
                    .from("profiles")
                    .select("*")
                    .eq("id", user.user.id)
                    .single();

                const { error } = await supabase.from("blog").insert([{
                    content: data.content || "",
                    images,
                    author: profile.last_name,
                    avatar: `./avatars/${profile.last_name}.png`
                }]);

                if (error) throw error;
            }
        });
    };
}

window.deletePost = id =>
    supabase.from("blog").delete().eq("id", id).then(() => loadPage("posts"));

window.editPost = async (id) => {
    const { data } = await supabase.from("blog").select("*").eq("id", id).single();

    openModal({
        title: "Edit Post",
        type: "blog",
        fields: [{ name: "content", label: "Inhalt", value: data.content }],
        onSubmit: async (form, images) => {
            await supabase.from("blog").update({
                content: form.content,
                images
            }).eq("id", id);
        }
    });

    galleryFiles = data.images || [];
    renderGallery();
};

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
            type: "project",
            fields: [
                { name: "title", label: "Titel" },
                { name: "description", label: "Beschreibung" }
            ],
            onSubmit: async (form, images) => {
                await supabase.from("projects").insert([{
                    title: form.title,
                    description: form.description,
                    fullText: form.fullText,
                    category: form.category,
                    status: form.status,
                    cover: form.cover,
                    gallery: images,
                    tags: form.tags ? form.tags.split(",") : [],
                    date: new Date()
                }]);
            }
        });
    };
}

window.deleteProject = id =>
    supabase.from("projects").delete().eq("id", id).then(() => loadPage("projects"));

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
            type: "event",
            fields: [
                { name: "title", label: "Titel" },
                { name: "location", label: "Ort" }
            ],
            onSubmit: async (form) => {

                const date = form.eventDate;
                const start = `${date}T${form.eventStart}`;
                const end = `${date}T${form.eventEnd}`;

                await supabase.from("events").insert([{
                    title: form.title,
                    location: form.location,
                    description: form.description,
                    info: form.info,
                    requirements: form.requirements ? form.requirements.split(",") : [],
                    tags: form.tags ? form.tags.split(",") : [],
                    color: form.color,
                    start,
                    end
                }]);
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
        <div class="item">
            ${u.first_name} ${u.last_name}
            <button onclick="setRole('${u.id}','admin')">Admin</button>
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