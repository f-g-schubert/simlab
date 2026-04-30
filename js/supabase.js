// supabase.js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = 'https://pepkapxyjareghuphjoq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlcGthcHh5amFyZWdodXBoam9xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczNjQ2ODksImV4cCI6MjA5Mjk0MDY4OX0.jXY638xP2xNx3eenvSIsCcqWb3-vBI5GH6VCjum1NbE';

// EIN zentraler Client für gesamte App
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
    }
});

// Test database connection
export async function testConnection() {
    try {
        const { data, error } = await supabase.from('blog').select('count').limit(1);
        if (error) {
            console.warn('⚠️ Supabase Verbindung fehlgeschlagen:', error.message);
            console.warn('🔧 Mögliche Ursachen:');
            console.warn('   - RLS (Row Level Security) ist aktiviert');
            console.warn('   - Tabellenberechtigungen sind nicht für anon-Benutzer gesetzt');
            console.warn('   - Tabellen existieren nicht');
            console.warn('   - Netzwerkprobleme');
            return false;
        }
        console.log('✅ Supabase Verbindung erfolgreich');
        return true;
    } catch (error) {
        console.warn('⚠️ Supabase Netzwerkfehler:', error.message);
        return false;
    }
}

// ============== Blog Functions ==============
export async function getBlog() {
    try {
        const { data, error } = await supabase
            .from('blog')
            .select('*')
            .order('date', { ascending: false });

        if (error) {
            console.error('Fehler beim Laden von Blog-Inhalten:', error);
            return getFallbackBlogData();
        }

        return data.map(item => ({
            ...item,
            liked: false, // client-side state
            comments: [] // client-side state
        }));
    } catch (error) {
        console.error('Netzwerkfehler beim Laden von Blog-Inhalten:', error);
        return getFallbackBlogData();
    }
}

export async function getBlogById(id) {
    try {
        const { data, error } = await supabase
            .from('blog')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            console.error('Fehler beim Laden des Blog-Beitrags:', error);
            return null;
        }

        return {
            ...data,
            liked: false,
            comments: []
        };
    } catch (error) {
        console.error('Netzwerkfehler beim Laden des Blog-Beitrags:', error);
        return null;
    }
}

export async function likeBlogPost(postId, userId, guestId) {
  const identifier = userId ? { user_id: userId } : { guest_id: guestId };

  // check existing
  const { data: existing, error: checkError } = await supabase
    .from("likes")
    .select("id")
    .eq("post_id", postId)
    .match(identifier)
    .maybeSingle();

  if (checkError) throw checkError;

  // TOGGLE
  if (existing) {
    const { error } = await supabase
      .from("likes")
      .delete()
      .eq("id", existing.id);

    if (error) throw error;

    return { liked: false };
  }

  const { error } = await supabase
    .from("likes")
    .insert([
      {
        post_id: postId,
        ...identifier
      }
    ]);

  // 👉 IGNORE duplicate silently
  if (error && error.code !== "23505") throw error;

  return { liked: true };
}

// COMMENTS
export async function getComments(postId) {
  const { data, error } = await supabase
    .from("comments")
    .select("*")
    .eq("post_id", postId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data;
}

export async function addComment(postId, text, user) {
  const { data, error } = await supabase
    .from("comments")
    .insert([
      {
        post_id: postId,
        text,
        user_id: user?.id || null,
        user_name: user?.email || "Gast"
      }
    ]);

  if (error) throw error;
  return data;
}

export async function getLikesCount(postId, baseLikes = 0) {

  const { data, error } = await supabase
    .from("likes")
    .select("user_id, guest_id")
    .eq("post_id", String(postId));

  if (error) throw error;

  const unique = new Set();

  data.forEach(like => {
    if (like.user_id) {
      unique.add(`user-${like.user_id}`);
    } else if (like.guest_id) {
      unique.add(`guest-${like.guest_id}`);
    }
  });

  return baseLikes + unique.size;
}

// ============== Projects Functions ==============
export async function getProjects() {
    try {
        const { data, error } = await supabase
            .from('projects')
            .select('*')
            .order('date', { ascending: false });

        if (error) {
            console.error('Fehler beim Laden von Projekten:', error);
            return getFallbackProjectsData();
        }

        return data;
    } catch (error) {
        console.error('Netzwerkfehler beim Laden von Projekten:', error);
        return getFallbackProjectsData();
    }
}

export async function getProjectById(id) {
    try {
        const { data, error } = await supabase
            .from('projects')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            console.error('Fehler beim Laden des Projekts:', error);
            return null;
        }

        return data;
    } catch (error) {
        console.error('Netzwerkfehler beim Laden des Projekts:', error);
        return null;
    }
}

export async function getProjectsByCategory(category) {
    try {
        const { data, error } = await supabase
            .from('projects')
            .select('*')
            .eq('category', category)
            .order('date', { ascending: false });

        if (error) {
            console.error('Fehler beim Laden von Projekten nach Kategorie:', error);
            return [];
        }

        return data;
    } catch (error) {
        console.error('Netzwerkfehler beim Laden von Projekten nach Kategorie:', error);
        return [];
    }
}

// ============== Events Functions ==============
export async function getEvents() {
    try {
        const { data, error } = await supabase
            .from('events')
            .select('*')
            .order('start', { ascending: true });

        if (error) {
            console.error('Fehler beim Laden von Events:', error);
            return getFallbackEventsData();
        }

        return data;
    } catch (error) {
        console.error('Netzwerkfehler beim Laden von Events:', error);
        return getFallbackEventsData();
    }
}

export async function getEventById(id) {
    try {
        const { data, error } = await supabase
            .from('events')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            console.error('Fehler beim Laden des Events:', error);
            return null;
        }

        return data;
    } catch (error) {
        console.error('Netzwerkfehler beim Laden des Events:', error);
        return null;
    }
}

export async function getEventsByDate(dateStr) {
    try {
        const { data, error } = await supabase
            .from('events')
            .select('*')
            .gte('start', `${dateStr}T00:00:00`)
            .lt('start', `${dateStr}T23:59:59`)
            .order('start', { ascending: true });

        if (error) {
            console.error('Fehler beim Laden von Events nach Datum:', error);
            return [];
        }

        return data;
    } catch (error) {
        console.error('Netzwerkfehler beim Laden von Events nach Datum:', error);
        return [];
    }
}

// ============== Fallback Data (für Offline/Fehlerfälle) ==============
function getFallbackBlogData() {
    return [
        {
            id: 1,
            author: "SimLab",
            avatar: "./images/logo.png",
            date: "2026-04-24",
            content: "Willkommen bei SimLab! Wir arbeiten an spannenden Projekten. (Offline-Modus)",
            images: ["./images/1.jpg"],
            likes: 10,
            liked: false,
            comments: []
        }
    ];
}

function getFallbackProjectsData() {
    return [
        {
            id: 1,
            title: "Projekt Alpha",
            description: "Moderne Webplattform mit Fokus auf Performance.",
            fullText: "Hier steht die komplette Projektbeschreibung...",
            category: "web",
            status: "in arbeit",
            cover: "./images/1.jpg",
            gallery: ["./images/1.jpg", "./images/2.jpg", "./images/3.jpg"],
            tags: ["Web", "UI/UX"],
            date: "2026-04-20"
        }
    ];
}

function getFallbackEventsData() {
    return [
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
        }
    ];
}