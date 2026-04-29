// auth-service.js
import { supabase } from './supabase.js';

export class AuthService {

    static async isLoggedIn() {
        const { data } = await supabase.auth.getSession();
        return !!data.session;
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

    static async logout() {
        await supabase.auth.signOut();
        localStorage.removeItem("sb-access-token");

        window.dispatchEvent(new Event("auth-change"));

        window.location.href = "./";
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