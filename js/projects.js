// projects.js
import { getDB_dataFor } from "./db.js";

const projects = getDB_dataFor("projects");
const grid = document.querySelector(".projects-grid");

function renderProjects(data) {
    grid.innerHTML = "";

    data.forEach(p => {
        const el = document.createElement("div");
        el.className = "project-card glass";

        el.innerHTML = `
            <img src="${p.cover}">
            <div class="project-content">
                <h3>${p.title}</h3>
                <p>${p.description}</p>

                <div class="tags">
                    ${p.tags.map(t => `<span>${t}</span>`).join("")}
                    <span class="status ${p.status}">${p.status}</span>
                </div>
            </div>
        `;

        el.addEventListener("click", (e) => {
            if (e.target.closest("button")) return; // verhindert Konflikt
            openProject(p.id);
        });
        grid.appendChild(el);
    });
}

renderProjects(projects);

const detail = document.getElementById("projectDetail");
const title = document.getElementById("detailTitle");
const text = document.getElementById("detailText");
const gallery = document.getElementById("gallery");

function openProject(id) {
    const p = projects.find(p => p.id === id);

    title.textContent = p.title;
    text.textContent = p.fullText;

    gallery.innerHTML = "";

    p.gallery.forEach(img => {
        const image = document.createElement("img");
        image.src = img;

        image.addEventListener("click", () => openFullscreen(img));

        gallery.appendChild(image);
    });

    detail.classList.remove("hidden");
}

document.getElementById("backBtn").addEventListener("click", () => {
    detail.classList.add("hidden");
});

const fs = document.getElementById("fullscreen");
const fsImg = document.getElementById("fullscreenImg");

function openFullscreen(src) {
    fsImg.src = src;
    fs.classList.remove("hidden");
}

fs.addEventListener("click", () => {
    fs.classList.add("hidden");
});

const filterButtons = document.querySelectorAll(".filters button");

filterButtons.forEach(btn => {
    btn.addEventListener("click", () => {

        document.querySelector(".filters .active")?.classList.remove("active");
        btn.classList.add("active");

        const cat = btn.textContent.toLowerCase();

        if (cat === "alle") {
            renderProjects(projects);
        } else {
            const filtered = projects.filter(p => p.category === cat);
            renderProjects(filtered);
        }
    });
});

const searchInput = document.getElementById("searchInput");

searchInput.addEventListener("input", () => {
    applyFilters();
});

let activeCategory = "alle";

document.querySelectorAll(".filters button").forEach(btn => {
    btn.addEventListener("click", () => {
        document.querySelector(".filters .active")?.classList.remove("active");
        btn.classList.add("active");

        activeCategory = btn.textContent.toLowerCase();
        applyFilters();
    });
});

function applyFilters() {
    const search = searchInput.value.toLowerCase();

    let filtered = projects;

    // Kategorie
    if (activeCategory !== "alle") {
        filtered = filtered.filter(p => p.category === activeCategory);
    }

    // Suche
    if (search) {
        filtered = filtered.filter(p =>
            p.title.toLowerCase().includes(search)
        );
    }

    renderProjects(filtered);
}