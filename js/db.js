// db.js

/*const DB = {
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
}*/

/*
async function getDB_DataSet() {
  const res = await fetch("/api/posts");
  return await res.json();
}
*/


// db.js
/*import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';
import { supabase } from './supabase.js';

const supabase = createClient(
    'https://pepkapxyjareghuphjoq.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlcGthcHh5amFyZWdodXBoam9xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczNjQ2ODksImV4cCI6MjA5Mjk0MDY4OX0.jXY638xP2xNx3eenvSIsCcqWb3-vBI5GH6VCjum1NbE'
);

async function fetchTable(table) {
    const { data, error } = await supabase
        .from(table)
        .select('*');

    if (error) {
        console.error(error);
        return [];
    }

    return data;
}

export async function getDB_DataSet() {
    const [blog, projects, events] = await Promise.all([
        fetchTable('blog'),
        fetchTable('projects'),
        fetchTable('events')
    ]);

    return {
        blog: blog.map(formatBlog),
        projects: projects.map(formatProjects),
        events: events.map(formatEvents)
    };
}

export async function getDB_dataFor(page) {
    const db = await getDB_DataSet();
    return db[page] || [];
}

function formatBlog(item) {
    return {
        ...item,
        liked: false // client-side
    };
}

function formatProjects(item) {
    return {
        ...item
    };
}

function formatEvents(item) {
    return {
        ...item
    };
}



export async function likePost(postId) {

  const { data: { user } } = await supabase.auth.getUser();

  const payload = {

    post_id: postId,

    user_id: user?.id || null,

    guest_id: user ? null : getGuestId()

  };

  // Like speichern

  const { error } = await supabase.from("likes").insert([payload]);

  if (error) return console.error(error);

  // Counter erhöhen

  await supabase.rpc("increment_likes", { post_id: postId });

}

export async function addComment(postId, text) {
  const { data: { user } } = await supabase.auth.getUser();

  await supabase.from("comments").insert([{
    post_id: postId,
    user_name: user
      ? user.user_metadata.firstName
      : "Gast",
    user_id: user?.id || null,
    text
  }]);
}

async function fetchBlog() {
  const { data } = await supabase
    .from("blog")
    .select(`
      *,
      comments (*)
    `);

  return data.map(post => ({
    ...post,
    liked: false
  }));
}*/



import { supabase } from './supabase.js';

/* =========================
    HELPERS
========================= */
function getGuestId() {
  let id = localStorage.getItem("guest_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("guest_id", id);
  }
  return id;
}

/* =========================
    FETCH
========================= */
async function fetchBlog() {
  const { data, error } = await supabase
    .from("blog")
    .select(`
      *,
      comments (*)
    `)
    .order('date', { ascending: false });

  if (error) {
    console.error(error);
    return [];
  }

  return data.map(post => ({
    ...post,
    liked: false
  }));
}

async function fetchTable(table) {
  const { data, error } = await supabase.from(table).select('*');
  if (error) return [];
  return data;
}

/* =========================
    PUBLIC API (DEIN FORMAT)
========================= */
export async function getDB_DataSet() {
  const [blog, projects, events] = await Promise.all([
    fetchBlog(),
    fetchTable('projects'),
    fetchTable('events')
  ]);

  return { blog, projects, events };
}

export async function getDB_dataFor(page) {
  const db = await getDB_DataSet();
  return db[page] || [];
}

/* =========================
    LIKE
========================= */
export async function likePost(postId) {
  const { data: { user } } = await supabase.auth.getUser();

  await supabase.from("likes").insert([{
    post_id: postId,
    user_id: user?.id || null,
    guest_id: user ? null : getGuestId()
  }]);

  await supabase.rpc("increment_likes", { post_id: postId });
}

/* =========================
    COMMENT
========================= */
export async function addComment(postId, text) {
  const { data: { user } } = await supabase.auth.getUser();

  await supabase.from("comments").insert([{
    post_id: postId,
    user_name: user ? user.user_metadata.firstName : "Gast",
    user_id: user?.id || null,
    text
  }]);
}