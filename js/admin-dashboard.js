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

function openBlogModal({ data = null, onSubmit }) {
    modalOnSubmit = onSubmit;
    galleryFiles = data?.images || [];

    document.getElementById("modalTitle").innerText =
        data ? "Post bearbeiten" : "Neuer Post";

    document.getElementById("eventFields").classList.add("hidden");

    form.innerHTML = `
        <div class="field glass-field">
            <label>Inhalt</label>
            <textarea name="content">${data?.content || ""}</textarea>
        </div>

        <div class="field glass-field">
            <label>Bild-URL</label>
            <input id="imageUrlInput" placeholder="https://..." />
            <button type="glass-button" id="addImageUrl">Hinzufügen</button>
        </div>
    `;

    setupMediaSection(true);

    document.getElementById("addImageUrl").onclick = () => {
        const val = document.getElementById("imageUrlInput").value;
        if (val) {
            galleryFiles.push(val);
            renderGallery();
        }
    };

    renderGallery();
    modal.classList.remove("hidden");
}

function openProjectModal({ data = null, onSubmit }) {
    modalOnSubmit = onSubmit;
    galleryFiles = data?.gallery || [];

    document.getElementById("modalTitle").innerText =
        data ? "Projekt bearbeiten" : "Neues Projekt";

    document.getElementById("eventFields").classList.add("hidden");

    form.innerHTML = `
        <div class="field glass-field">
            <label>Titel</label>
            <input name="title" placeholder="Projektname" value="${data?.title || ""}" />
        </div>

        <div class="field glass-field">
            <label>Kurzbeschreibung</label>
            <input name="description" placeholder="Kurz erklärt worum es geht" value="${data?.description || ""}" />
        </div>

        <div class="field glass-field">
            <label>Ausführlicher Text</label>
            <textarea name="fullText" placeholder="Detaillierte Beschreibung">${data?.fullText || ""}</textarea>

        </div>

        <div class="field glass-field">
            <label>Kategorie</label>
            <input name="category" placeholder="z.B. Forschung, App, KI" value="${data?.category || ""}" />
        </div>

        <div class="field glass-field">
            <label>Status</label>
            <input name="status" placeholder="z.B. in Entwicklung, abgeschlossen" value="${data?.status || ""}" />
        </div>

        <div class="field glass-field">
            <label>Cover Bild</label>
            <input name="cover" placeholder="https://cover-image.com" value="${data?.cover || ""}" />
        </div>

        <div class="field glass-field">
            <label>Tags</label>
            <input name="tags" placeholder="ai, research, medical" value="${data?.tags?.join(",") || ""}" />
        </div>

        <div class="field glass-field">
            <label>Bild hinzufügen</label>
            <input id="imageUrlInput" placeholder="https://image-url.com" />
            <button type="button" id="addImageUrl" class="glass-button">Hinzufügen</button>
        </div>
    `;

    setupMediaSection(true);

    document.getElementById("addImageUrl").onclick = () => {
        const val = document.getElementById("imageUrlInput").value;
        if (val) {
            galleryFiles.push(val);
            renderGallery();
        }
    };

    renderGallery();
    modal.classList.remove("hidden");
}

function openEventModal({ data = null, onSubmit }) {
    modalOnSubmit = onSubmit;

    const start = data?.start ? new Date(data.start) : null;
    const end = data?.end ? new Date(data.end) : null;

    const formatTime = (d) =>
        d ? d.toISOString().split("T")[1].slice(0, 5) : "";

    form.innerHTML = `
        <div class="field glass-field">
            <label>Titel</label>
            <input name="title" placeholder="z.B. Neurochirurgie Workshop" value="${data?.title || ""}" />
        </div>

        <div class="field glass-field">
            <label>Ort</label>
            <input name="location" placeholder="z.B. Universitätsklinikum Hamburg" value="${data?.location || ""}" />
        </div>

        <div class="field glass-field">
            <label>Datum</label>
            <input type="date" name="eventDate"
                value="${start ? start.toISOString().split("T")[0] : ""}" />
        </div>

        <div class="field glass-field">
            <label>Startzeit</label>
            <input type="time" name="eventStart"
                value="${formatTime(start)}" />
        </div>

        <div class="field glass-field">
            <label>Endzeit</label>
            <input type="time" name="eventEnd"
                value="${formatTime(end)}" />
        </div>

        <div class="field glass-field">
            <label>Beschreibung</label>
            <textarea name="description" placeholder="Kurzbeschreibung des Events">${data?.description || ""}</textarea>
        </div>

        <div class="field glass-field">
            <label>Info</label>
            <input name="info" placeholder="Zusatzinfos (optional)" value="${data?.info || ""}" />
        </div>

        <div class="field glass-field">
            <label>Voraussetzungen</label>
            <input name="requirements" placeholder="z.B. Anatomie Grundkenntnisse" value="${data?.requirements?.join(",") || ""}" />
        </div>

        <div class="field glass-field">
            <label>Tags</label>
            <input name="tags" placeholder="z.B. chirurgie, workshop" value="${data?.tags?.join(",") || ""}" />
        </div>

        <div class="field glass-field">
            <label>Farbcode</label>
            <input name="color" placeholder="#999999" value="${data?.color || ""}" />
        </div>
    `;

    document.getElementById("modalTitle").innerText =
        data ? "Event bearbeiten" : "Neues Event";

    document.getElementById("eventFields").classList.remove("hidden");

    setupMediaSection(false);

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
    if (!dropzone) return;

    const input = dropzone.querySelector("input");

    dropzone.onclick = () => input.click();
    input.onchange = e => addFiles(e.target.files);

    dropzone.ondragover = e => e.preventDefault();

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
   GALLERY
========================================================= */
function renderGallery() {
    const gallery = document.getElementById("gallery");
    if (!gallery) return;

    gallery.innerHTML = "";

    galleryFiles.forEach((file, i) => {
        const el = document.createElement("div");
        el.className = "gallery-item";
        el.draggable = true;
        el.dataset.index = i;

        el.innerHTML = `
            <span>${file.name || file}</span>
            <button>✕</button>
        `;

        el.querySelector("button").onclick = () => {
            galleryFiles.splice(i, 1);
            renderGallery();
        };

        el.ondragstart = () => el.classList.add("dragging");
        el.ondragend = () => el.classList.remove("dragging");

        gallery.appendChild(el);
    });

    gallery.ondragover = e => {
        e.preventDefault();
        const dragging = document.querySelector(".dragging");
        const after = getDragAfterElement(gallery, e.clientY);

        if (after == null) {
            gallery.appendChild(dragging);
        } else {
            gallery.insertBefore(dragging, after);
        }
    };

    gallery.ondrop = () => {
        const newOrder = [];
        document.querySelectorAll(".gallery-item").forEach(el => {
            newOrder.push(galleryFiles[el.dataset.index]);
        });
        galleryFiles = newOrder;
        renderGallery(); // wichtig!
    };
}

function getDragAfterElement(container, y) {
    const els = [...container.querySelectorAll(".gallery-item:not(.dragging)")];

    return els.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;

        if (offset < 0 && offset > closest.offset) {
            return { offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

function setupMediaSection(enabled = false) {
    const container = document.getElementById("mediaContainer");
    if (!container) return;

    if (!enabled) {
        container.innerHTML = "<p>Keine Medien für diesen Typ</p>";
        return;
    }

    container.innerHTML = `
        <div class="dropzone" id="dropzone">
            <p>📁 Drag & Drop oder klicken</p>
            <input type="file" multiple hidden />
        </div>
        <div class="gallery" id="gallery"></div>
    `;

    initUpload();
    renderGallery();
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
        openBlogModal({
            onSubmit: async (data, images) => {
                const { data: user } = await supabase.auth.getUser();

                const { data: profile } = await supabase
                    .from("profiles")
                    .select("*")
                    .eq("id", user.user.id)
                    .single();

                await supabase.from("blog").insert([{
                    content: data.content || "",
                    images,
                    author: profile.last_name,
                    avatar: `./avatars/${profile.last_name}.png`
                }]);
            }
        });
    };
}

window.deletePost = id =>
    supabase.from("blog").delete().eq("id", id).then(() => loadPage("posts"));

window.editPost = async (id) => {
    const { data } = await supabase
        .from("blog")
        .select("*")
        .eq("id", id)
        .single();

    openBlogModal({
        data,
        onSubmit: async (form, images) => {
            await supabase.from("blog").update({
                content: form.content,
                images
            }).eq("id", id);
        }
    });
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
                <button onclick="editProject(${p.id})">Edit</button>
                <button onclick="deleteProject(${p.id})">Delete</button>
            </div>
        `).join("")}
    `;

    document.getElementById("newProject").onclick = () => {
        openProjectModal({
            onSubmit: async (form, images) => {

                const payload = {
                    title: form.title || "",
                    description: form.description || "",
                    fullText: form.fullText || "",
                    category: form.category || "",
                    status: form.status || "",
                    cover: form.cover || "",
                    gallery: images || [],
                    tags: form.tags ? form.tags.split(",").map(t => t.trim()) : [],
                    date: new Date().toISOString()
                };

                const { error } = await supabase.from("projects").insert([payload]);
                if (error) throw error;
            }
        });
    };
}

window.deleteProject = id =>
    supabase.from("projects").delete().eq("id", id).then(() => loadPage("projects"));

window.editProject = async (id) => {
    const { data } = await supabase
        .from("projects")
        .select("*")
        .eq("id", id)
        .single();

    openProjectModal({
        data,
        onSubmit: async (form, images) => {

            const payload = {
                title: form.title,
                description: form.description,
                fullText: form.fullText,
                category: form.category,
                status: form.status,
                cover: form.cover,
                gallery: images,
                tags: form.tags ? form.tags.split(",").map(t => t.trim()) : []
            };

            const { error } = await supabase
                .from("projects")
                .update(payload)
                .eq("id", id);

            if (error) throw error;
        }
    });
};

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
                <button onclick="editEvent(${e.id})">Edit</button>
                <button onclick="deleteEvent(${e.id})">Delete</button>
            </div>
        `).join("")}
    `;

    document.getElementById("newEvent").onclick = () => {
        openEventModal({
            onSubmit: async (form) => {

                if (!form.eventDate || !form.eventStart || !form.eventEnd) {
                    alert("Datum + Zeiten erforderlich");
                    return;
                }

                const start = new Date(`${form.eventDate}T${form.eventStart}`).toISOString();
                const end = new Date(`${form.eventDate}T${form.eventEnd}`).toISOString();

                const payload = {
                    title: form.title || "",
                    location: form.location || "",
                    description: form.description || "",
                    info: form.info || "",
                    requirements: form.requirements
                        ? form.requirements.split(",").map(r => r.trim())
                        : [],
                    tags: form.tags
                        ? form.tags.split(",").map(t => t.trim())
                        : [],
                    color: form.color || "#999999",
                    start,
                    end
                };

                const { error } = await supabase.from("events").insert([payload]);
                if (error) throw error;
            }
        });
    };
}

window.deleteEvent = id =>
    supabase.from("events").delete().eq("id", id).then(() => loadPage("events"));

window.editEvent = async (id) => {
    const { data } = await supabase
        .from("events")
        .select("*")
        .eq("id", id)
        .single();

    openEventModal({
        data,
        onSubmit: async (form) => {

            const start = new Date(`${form.eventDate}T${form.eventStart}`).toISOString();
            const end = new Date(`${form.eventDate}T${form.eventEnd}`).toISOString();

            const payload = {
                title: form.title,
                location: form.location,
                description: form.description,
                info: form.info,
                requirements: form.requirements
                    ? form.requirements.split(",").map(r => r.trim())
                    : [],
                tags: form.tags
                    ? form.tags.split(",").map(t => t.trim())
                    : [],
                color: form.color,
                start,
                end
            };

            const { error } = await supabase
                .from("events")
                .update(payload)
                .eq("id", id);

            if (error) throw error;
        }
    });
};

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