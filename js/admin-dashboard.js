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
        <div class="field">
            <label>Inhalt</label>
            <textarea name="content">${data?.content || ""}</textarea>
        </div>

        <div class="field">
            <label>Bild-URL</label>
            <input id="imageUrlInput" placeholder="https://..." />
            <button type="button" id="addImageUrl">Hinzufügen</button>
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
        <input name="title" placeholder="Titel" value="${data?.title || ""}" />
        <input name="description" placeholder="Kurzbeschreibung" value="${data?.description || ""}" />
        <textarea name="fullText" placeholder="Text">${data?.fullText || ""}</textarea>

        <input name="category" placeholder="Kategorie" value="${data?.category || ""}" />
        <input name="status" placeholder="Status" value="${data?.status || ""}" />
        <input name="cover" placeholder="Cover URL" value="${data?.cover || ""}" />

        <input name="tags" placeholder="tag1,tag2" value="${data?.tags?.join(",") || ""}" />

        <div class="field">
            <label>Bild-URL</label>
            <input id="imageUrlInput" placeholder="https://..." />
            <button type="button" id="addImageUrl">Hinzufügen</button>
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
        <input name="title" value="${data?.title || ""}" />
        <input name="location" value="${data?.location || ""}" />

        <input type="date" name="eventDate"
            value="${start ? start.toISOString().split("T")[0] : ""}" />

        <input type="time" name="eventStart"
            value="${formatTime(start)}" />

        <input type="time" name="eventEnd"
            value="${formatTime(end)}" />

        <textarea name="description">${data?.description || ""}</textarea>
        <input name="info" value="${data?.info || ""}" />

        <input name="requirements"
            value="${data?.requirements?.join(",") || ""}" />

        <input name="tags"
            value="${data?.tags?.join(",") || ""}" />

        <input name="color" value="${data?.color || ""}" />
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
                await supabase.from("projects").insert([{
                    ...form,
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

window.editProject = async (id) => {
    const { data } = await supabase
        .from("projects")
        .select("*")
        .eq("id", id)
        .single();

    openProjectModal({
        data,
        onSubmit: async (form, images) => {
            await supabase.from("projects").update({
                ...form,
                gallery: images,
                tags: form.tags ? form.tags.split(",") : []
            }).eq("id", id);
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

                const start = new Date(`${form.eventDate}T${form.eventStart}`);
                const end = new Date(`${form.eventDate}T${form.eventEnd}`);

                await supabase.from("events").insert([{
                    ...form,
                    start,
                    end,
                    tags: form.tags ? form.tags.split(",") : [],
                    requirements: form.requirements ? form.requirements.split(",") : []
                }]);
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
            const start = new Date(`${form.eventDate}T${form.eventStart}`);
            const end = new Date(`${form.eventDate}T${form.eventEnd}`);

            await supabase.from("events").update({
                ...form,
                start,
                end,
                tags: form.tags ? form.tags.split(",") : [],
                requirements: form.requirements ? form.requirements.split(",") : []
            }).eq("id", id);
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