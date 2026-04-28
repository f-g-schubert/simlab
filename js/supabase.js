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

// ============== Blog Functions ==============
export async function getBlog() {
    const { data, error } = await supabase
        .from('blog')
        .select('*')
        .order('date', { ascending: false });

    if (error) {
        console.error('Fehler beim Laden von Blog-Inhalten:', error);
        return [];
    }

    return data.map(item => ({
        ...item,
        liked: false, // client-side state
        comments: [] // client-side state
    }));
}

export async function getBlogById(id) {
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
}

export async function likeBlogPost(postId, userId = null, guestId = null) {
    const { error } = await supabase
        .from('likes')
        .insert([{
            post_id: postId,
            user_id: userId,
            guest_id: guestId
        }]);

    if (error) {
        console.error('Fehler beim Speichern von Like:', error);
        return false;
    }

    return true;
}

// ============== Projects Functions ==============
export async function getProjects() {
    const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('date', { ascending: false });

    if (error) {
        console.error('Fehler beim Laden von Projekten:', error);
        return [];
    }

    return data;
}

export async function getProjectById(id) {
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
}

export async function getProjectsByCategory(category) {
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
}

// ============== Events Functions ==============
export async function getEvents() {
    const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('start', { ascending: true });

    if (error) {
        console.error('Fehler beim Laden von Events:', error);
        return [];
    }

    return data;
}

export async function getEventById(id) {
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
}

export async function getEventsByDate(dateStr) {
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
}