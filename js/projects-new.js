// projects.js - Project Management with Supabase
import { getProjects, getProjectById, getProjectsByCategory } from "./supabase.js";

let allProjects = [];
const grid = document.querySelector(".projects-grid");
const detail = document.getElementById("projectDetail");
const title = document.getElementById("detailTitle");
const text = document.getElementById("detailText");
const gallery = document.getElementById("gallery");
const detail = document.getElementById("projectDetail");
const fs = document.getElementById("fullscreen");
const fsImg = document.getElementById("fullscreenImg");
const searchInput = document.getElementById("searchInput");
const filterButtons = document.querySelectorAll(".filters button");

let activeCategory = "alle";

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
            if (e.target.closest("button")) return;
            openProject(p.id);
        });
        grid.appendChild(el);
    });
}

async function openProject(id) {
    try {
        const p = allProjects.find(proj => proj.id === id) || await getProjectById(id);

        if (!p) {
            console.error("Projekt nicht gefunden");
            return;
        }

        title.textContent = p.title;
        text.textContent = p.fullText;

        gallery.innerHTML = "";

        if (p.gallery && p.gallery.length > 0) {
            p.gallery.forEach(img => {
                const image = document.createElement("img");
                image.src = img;

                image.addEventListener("click", () => openFullscreen(img));

                gallery.appendChild(image);
            });
        }

        detail.classList.remove("hidden");
    } catch (error) {
        console.error("Fehler beim Laden des Projekts:", error);
    }
}

function openFullscreen(src) {
    fsImg.src = src;
    fs.classList.remove("hidden");
}

fs.addEventListener("click", () => {
    fs.classList.add("hidden");
});

document.getElementById("backBtn").addEventListener("click", () => {
    detail.classList.add("hidden");
});

filterButtons.forEach(btn => {
    btn.addEventListener("click", () => {
        document.querySelector(".filters .active")?.classList.remove("active");
        btn.classList.add("active");

        activeCategory = btn.textContent.toLowerCase();
        applyFilters();
    });
});

searchInput.addEventListener("input", () => {
    applyFilters();
});

function applyFilters() {
    const search = searchInput.value.toLowerCase();
    let filtered = allProjects;

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

// Initialize
async function init() {
    try {
        allProjects = await getProjects();
        renderProjects(allProjects);
    } catch (error) {
        console.error("Fehler beim Laden der Projekte:", error);
        grid.innerHTML = "<p>Fehler beim Laden der Projekte</p>";
    }
}

init();
