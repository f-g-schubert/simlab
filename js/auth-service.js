// auth-service.js
export class AuthService {
    static getToken() {
        return localStorage.getItem("token");
    }

    static isLoggedIn() {
        return !!this.getToken();
    }

    static async login(username, password) {
        const res = await fetch("/api/login", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({ username, password })
        });

        const data = await res.json();
        localStorage.setItem("token", data.token);
        return data;
    }

    static logout() {
        localStorage.removeItem("token");
        location.reload();
    }

    static async getUser() {
        const res = await fetch("/api/me", {
            headers: {
                Authorization: "Bearer " + this.getToken()
            }
        });

        return await res.json();
    }
}