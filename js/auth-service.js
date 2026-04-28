// auth-service.js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabase = createClient(
    'https://pepkapxyjareghuphjoq.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlcGthcHh5amFyZWdodXBoam9xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczNjQ2ODksImV4cCI6MjA5Mjk0MDY4OX0.jXY638xP2xNx3eenvSIsCcqWb3-vBI5GH6VCjum1NbE'
);

export class AuthService {

    static getToken() {
        return localStorage.getItem("sb-access-token");
    }

    static isLoggedIn() {
        return !!this.getToken();
    }

    static async login(email, password) {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) throw error;

        // Supabase speichert automatisch Session im localStorage
        localStorage.setItem("sb-access-token", data.session.access_token);

        return data;
    }

    static async register(email, password) {
        return await supabase.auth.signUp({ email, password });
    }

    static async logout() {
        await supabase.auth.signOut();
        localStorage.removeItem("sb-access-token");
        location.reload();
    }

    static async getUser() {
        const { data, error } = await supabase.auth.getUser();
        if (error) throw error;

        // Mapping auf dein bestehendes Format
        return {
            firstName: data.user.user_metadata?.firstName || "User",
            lastName: data.user.user_metadata?.lastName || "",
            email: data.user.email
        };
    }
}