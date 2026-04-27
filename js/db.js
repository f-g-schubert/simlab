// db.js

const DB = {
    blog: [
        {
            id: 1,
            author: "SimLab",
            avatar: "./images/logo.png",
            date: "2026-04-24",
            content: "Sehr langer Text ...",
            images: ["./images/1.jpg"],
            likes: 10,
            liked: false,
            comments: []
        }
    ],

    projects: [
        {
            id: 1,
            title: "Projekt Alpha",
            description: "Moderne Webplattform mit Fokus auf Performance.",
            fullText: "Hier steht die komplette Projektbeschreibung...",
            category: "web",
            status: "in arbeit",
            cover: "./images/1.jpg",

            gallery: [
                "./images/1.jpg",
                "./images/2.jpg",
                "./images/3.jpg"
            ],

            tags: ["Web", "UI/UX"],
            date: "2026-04-20"
        },

        {
            id: 2,
            title: "Projekt Beta",
            description: "Interne Automatisierungslösung.",
            fullText: "Detaillierte Beschreibung vom Projekt Beta...",
            category: "software",
            status: "abgeschlossen",
            cover: "./images/2.jpg",

            gallery: [
                "./images/2.jpg",
                "./images/3.jpg"
            ],

            tags: ["Automation"],
            date: "2026-04-18"
        },

        {
            id: 3,
            title: "Projekt Gamma",
            description: "Mobile Anwendung für iOS und Android.",
            fullText: "Detaillierte Beschreibung vom Projekt Gamma...",
            category: "mobile",
            status: "konzept",
            cover: "./images/2.jpg",

            gallery: [
                "./images/2.jpg",
                "./images/3.jpg"
            ],

            tags: ["Automation"],
            date: "2026-04-18"
        }
    ],

    events: [
        {
            id: 1,
            title: "Workshop Webdesign",
            start: "2026-05-05T10:00",
            end: "2026-05-05T16:00",
            location: "Hamburg",
            description: "Intensiver Workshop zu modernen UI/UX Prinzipien.",
            info: "Laptop erforderlich",
            requirements: ["Grundkenntnisse HTML", "Eigenes Gerät"],
            tags: ["Workshop", "UI/UX"],
            color: "#4f46e5"
        },
        {
            id: 2,
            title: "Release Event Projekt Alpha",
            start: "2026-05-10T18:00",
            end: "2026-05-10T21:00",
            location: "Online",
            description: "Vorstellung des Projekts Alpha.",
            info: "Livestream",
            requirements: [],
            tags: ["Release"],
            color: "#22c55e"
        }
    ]
};

export function getDB_DataSet() {
    return DB;
}

export function getDB_dataFor(page) {
    return getDB_DataSet()[page] || [];
}

/*
async function getDB_DataSet() {
  const res = await fetch("/api/posts");
  return await res.json();
}
*/