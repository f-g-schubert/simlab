// navbar.js
import { AuthService } from './auth-service.js';
import { supabase } from './supabase.js';

class NavBar extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' }); // Erstellt einen isolierten Bereich
    }

    connectedCallback() {
        this.shadowRoot.innerHTML = `
        <header id="navbar" class="glass">
            <div class="nav-inner">

                <div class="nav-left">
                    <div id="burger">☰</div>

                    <div id="brand" class="brand" onclick="window.location.href = './';">
                        <img src="images/logo.png" class="logo">
                        <span class="title">Meine Seite</span>
                    </div>
                </div>

                <nav id="navMenu">
                    <ul>
                        <a style="border: 1px solid rgba(255,255,255,0.15);" class="glass-button" href="blog.html">Blog</a>
                        <a style="border: 1px solid rgba(255,255,255,0.15);" class="glass-button" href="projekte.html">Projekte</a>
                        <a style="border: 1px solid rgba(255,255,255,0.15);" class="glass-button" href="termine-und-veranstaltungen.html">Termine und Veranstaltungen</a>
                        <a style="border: 1px solid rgba(255,255,255,0.15);" class="glass-button" href="ueber-uns.html">Über uns</a>
                        <a style="border: 1px solid rgba(255,255,255,0.15);" class="glass-button" href="impressum.html">Impressum</a>

                        <div id="userArea" class="user-area">
                            <div id="userAvatar" class="avatar"></div>
                            
                            <div id="userMenu" class="user-menu glass">
                                <button id="navDashboard">Dashboard</button>
                                <button id="navLogout">Logout</button>
                            </div>
                        </div>
                    </ul>
                </nav>

            </div>

            <style>
            /* =========================
                GLASS NAVBAR
            ========================= */
            /* =========================
                GLASS NAVBAR SHRINK EFFECT
            ========================= */
            #navbar.glass {
                position: fixed;
                top: 0;
                width: 100%;
                z-index: 1000;
                backdrop-filter: blur(16px);
                background: rgba(255,255,255,0.1);
                border-bottom: 1px solid rgba(255,255,255,0.2);
                transition: all 0.3s ease;
            }

            /* Den Standard-Abstand der Liste zurücksetzen, falls der Browser hier pfuscht */
            nav ul {
                list-style: none;
                display: flex;
                gap: 20px;
                margin: 0;
                padding: 0;
            }

            /* --- EXTREMER SHRINK --- */

            #navbar.shrink .nav-inner {
                padding-top: 0;
                padding-bottom: 0;
            }

            /* Die Margins der Buttons und Dropdowns im Shrink-Modus verringern */
            #navbar.shrink .glass-button,
            #navbar.shrink .dropdown {
                margin-top: 2px;
                margin-bottom: 2px;
                padding-top: 6px;   /* Optional: Auch das Innen-Padding der Buttons leicht straffen */
                padding-bottom: 6px;
            }

            /* Sicherstellen, dass das Logo nicht die Höhe erzwingt */
            #navbar.shrink .logo {
                height: 22px; /* Noch ein Stück kleiner */
            }

            #navbar.shrink #navMenu a, 
            #navbar.shrink #navMenu button {
                font-size: 0.9rem;
            }

            /* 1. Navbar Hintergrund leicht anpassen für besseren Kontrast beim Scrollen */
            #navbar.shrink {
                backdrop-filter: blur(24px);
                background: rgba(255,255,255,0.15); 
                box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1); /* Sanfter Schatten beim Scrollen */
            }

            .nav-inner {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 16px 30px; /* Ursprüngliches Padding etwas großzügiger */
                transition: all 0.3s ease; /* WICHTIG: Animation hinzufügen */
            }

            /* 2. Padding drastisch reduzieren beim Scrollen */
            #navbar.shrink .nav-inner {
                padding: 4px 20px; 
            }

            /* LOGO + TITLE INLINE */
            .brand {
                display: flex;
                align-items: center;
                gap: 10px;
                cursor: pointer;
            }

            .title {
                font-size: 18px;
                font-weight: 600;
                transition: all 0.3s ease;
            }

            /* 3. Titel beim Scrollen verkleinern */
            #navbar.shrink .title {
                font-size: 15px; 
            }

            .logo {
                height: 36px;
                transition: all 0.3s ease;
            }

            /* 4. Logo beim Scrollen verkleinern */
            #navbar.shrink .logo {
                height: 24px; 
            }

            /* Burger */
            #burger {
                display: none;
                font-size: 26px;
                cursor: pointer;
            }

            /* Nav */
            #navMenu {
                display: flex
            }

            nav ul {
                list-style: none;
                display: flex;
                gap: 20px;
            }

            #navMenu a, #navMenu button {
                color: white;
                font-weight: 500;
                background: none;
                border: none;
                cursor: pointer;
            }

            /* ===== DROPDOWN FIX FINAL ===== */
            .dropdown {
                position: relative;
                color: white;
                backdrop-filter: blur(20px);
                background: rgba(255,255,255,0.08);
                border-radius: 20px;
                border: 1px solid rgba(255,255,255,0.15);
                transition: transform 0.3s ease;
                padding: 10px;
                margin: 10px;
                text-decoration: none;
                font-weight: 500;
            }

            /* IMMER VERSTECKT STANDARD */
            .dropdown-content {
                display: none;
                position: absolute;
                top: 110%;
                left: 0;

                min-width: 180px;
                padding: 8px 0;

                border-radius: 12px;
                background: rgba(0,0,0,0.75);
                backdrop-filter: blur(12px);
            }

            /* DESKTOP (Hover) */
            @media (hover: hover) {
                .dropdown:hover > .dropdown-content {
                    display: block;
                    color: white;
                    backdrop-filter: blur(20px);
                    background: rgba(255,255,255,0.08);
                    border-radius: 20px;
                    border: 1px solid rgba(255,255,255,0.15);
                    transition: transform 0.3s ease;
                    padding: 13px;
                    margin: 7px;
                    text-decoration: none;
                    font-weight: 500;
                }

                .user-area:hover .user-menu {
                    display: flex;
                    color: white;
                    backdrop-filter: blur(20px);
                    background: rgba(255,255,255,0.08);
                    border-radius: 20px;
                    border: 1px solid rgba(255,255,255,0.15);
                    transition: transform 0.3s ease;
                    padding: 13px;
                    margin: 7px;
                    text-decoration: none;
                    font-weight: 500;
                }
            }

            /* MOBILE (Click only) */
            .dropdown.open > .dropdown-content {
                display: block;
                color: white;
                backdrop-filter: blur(20px);
                background: rgba(255,255,255,0.08);
                border-radius: 20px;
                border: 1px solid rgba(255,255,255,0.15);
                transition: transform 0.3s ease;
                padding: 13px;
                margin: 7px;
                text-decoration: none;
                font-weight: 500;
            }

            /* Mobile */
            @media (max-width: 768px) {

                #burger {
                    display: block;
                }

                #navMenu {
                    position: absolute;
                    top: 70px;
                    left: 0;
                    width: 100%;
                    display: none;
                    flex-direction: column;
                    background: rgba(0,0,0,0.8);
                }

                #navMenu.open {
                    display: flex;
                }

                #navMenu ul {
                    flex-direction: column;
                    padding: 20px;
                }
            }

            /* =========================
                GLASS BUTTONS
            ========================= */
            main button {
            color: white;
            backdrop-filter: blur(20px);
            background: rgba(255,255,255,0.08);
            border-radius: 20px;
            border: 1px solid rgba(255,255,255,0.15);
            overflow: hidden;
            transition: transform 0.3s ease;
            padding: 10px;
            margin: 10px;
            }

            .glass-button {
            color: white;
            backdrop-filter: blur(20px);
            background: rgba(255,255,255,0.08);
            border-radius: 20px;
            border: 1px solid rgba(255,255,255,0.15);
            overflow: hidden;
            transition: transform 0.3s ease;
            padding: 10px;
            margin: 10px;
            text-decoration: none;
            font-weight: 500;
            }

            main button:hover,
            .glass-button:hover {
            transform: scale(1.05);
            }

            /* =========================
                USER AREA
            ========================= */
            .user-area {
                position: relative;
                cursor: pointer;
            }

            .user-area img {
                width: 36px;
                height: 36px;
                border-radius: 50%;
            }

            .user-menu {
                position: absolute;
                right: 0;
                top: 50px;

                display: none;
                flex-direction: column;
                padding: 10px;
            }

            .user-menu.active {
                display: flex;
                color: white;
                backdrop-filter: blur(20px);
                background: rgba(255,255,255,0.08);
                border-radius: 20px;
                border: 1px solid rgba(255,255,255,0.15);
                transition: transform 0.3s ease;
                padding: 13px;
                margin: 7px;
                text-decoration: none;
                font-weight: 500;
            }

            .avatar {
                width: 38px;
                height: 38px;
                border-radius: 50%;

                display: flex;
                align-items: center;
                justify-content: center;

                font-weight: 600;
                font-size: 14px;
                letter-spacing: 1px;

                background: rgba(255,255,255,0.2);
                color: rgba(255,255,255,0.4);

                transition: all 0.3s ease;
            }

            /* eingeloggt */
            .avatar.logged-in {
                background: rgba(20, 40, 120, 0.9);
                color: rgba(255,255,255,0.8);
            }
            </style>
        </header>
        `;

        /*
        // 1. HTML setzen
        this.innerHTML = html;

        // 2. Skripte finden und manuell "reaktivieren"
        const scripts = this.querySelectorAll('script');
        scripts.forEach(oldScript => {
            const newScript = document.createElement('script');
            
            // Inhalt kopieren
            newScript.textContent = oldScript.textContent;
            
            // Eventuelle Attribute (src, type etc.) kopieren
            Array.from(oldScript.attributes).forEach(attr => {
            newScript.setAttribute(attr.name, attr.value);
            });

            // Das alte Skript durch das neue ersetzen (triggert Ausführung)
            oldScript.parentNode.replaceChild(newScript, oldScript);
        });
        */

        // MARK: - NAVBAR

        /* =========================
        NAVBAR SHRINK
        ========================= */
        /* NAVBAR */
        const navbar = this.shadowRoot.getElementById("navbar");
        const burger = this.shadowRoot.getElementById("burger");
        const navMenu = this.shadowRoot.getElementById("navMenu");

        window.addEventListener("scroll", () => {
            navbar.classList.toggle("shrink", window.scrollY > 40);
        });

        burger.addEventListener("click", () => {
            navMenu.classList.toggle("open");
        });

        this.shadowRoot.querySelectorAll(".dropdown > button").forEach(btn => {
            btn.addEventListener("click", (e) => {
                e.preventDefault();

                const parent = btn.parentElement;

                /* alle schließen */
                this.shadowRoot.querySelectorAll(".dropdown").forEach(d => {
                    if (d !== parent) d.classList.remove("open");
                });

                /* togglen */
                parent.classList.toggle("open");
            });
        });

        /* Klick außerhalb = schließen */
        document.addEventListener("click", (e) => {
            // Prüft, ob sich die aktuelle Komponente (this) im Pfad des Klicks befindet
            if (!e.composedPath().includes(this)) {
                this.shadowRoot.querySelectorAll(".dropdown").forEach(d => d.classList.remove("open"));
            }
        });

        /* =========================
            USER AREA
        ========================= */
        const userMenu = this.shadowRoot.getElementById("userMenu");
        const avatar = this.shadowRoot.getElementById("userAvatar");

        /* =========================
           MENU TOGGLE
        ========================= */

        avatar.addEventListener("click", () => {
            userMenu.classList.toggle("active");
        });

        document.addEventListener("click", (e) => {
            if (!e.composedPath().includes(this)) {
                userMenu.classList.remove("active");
            }
        });

        /* =========================
           NAV ACTIONS
        ========================= */

        this.shadowRoot.addEventListener("click", async (e) => {
            if (e.target.id === "navLogin") {
                window.location.href = "./auth-service.html";
            }

            if (e.target.id === "navLogout") {
                await AuthService.logout();
                // SOFORT UI RESET (WICHTIG)
                avatar.classList.remove("logged-in");
                avatar.textContent = "";
                userMenu.innerHTML = `<button id="navLogin">Login</button>`;
                userMenu.classList.remove("active");
                window.dispatchEvent(new Event("auth-change"));
            }

            if (e.target.id === "navDashboard") {
                window.location.href = "./admin-dashboard.html";
            }

        });

        /* =========================

           USER UI (FIXED + SAFE)

        ========================= */

        const updateUserUI = async () => {

            const { data: { session } } = await supabase.auth.getSession();

            // ❌ Nicht eingeloggt

            if (!session) {

                avatar.classList.remove("logged-in");

                avatar.textContent = "";

                userMenu.innerHTML = `<button id="navLogin">Login</button>`;

                return;

            }

            const userId = session.user.id;

            try {

                const { data: profile, error } = await supabase

                    .from("profiles")

                    .select("first_name, last_name")

                    .eq("id", userId)

                    .maybeSingle(); // 🔥 WICHTIG: kein crash wenn leer

                if (error) throw error;

                avatar.classList.add("logged-in");

                if (profile) {

                    avatar.textContent = getInitials(

                        profile.first_name,

                        profile.last_name

                    );

                } else {

                    // 🔥 FALLBACK wenn kein Profil existiert

                    avatar.textContent = "??";

                }

                userMenu.innerHTML = `

                    <button id="navDashboard">Dashboard</button>

                    <button id="navLogout">Logout</button>

                `;

            } catch (err) {

                console.warn("Profile load failed:", err);

                avatar.classList.remove("logged-in");

                avatar.textContent = "?";

                userMenu.innerHTML = `

                    <button id="navDashboard">Dashboard</button>

                    <button id="navLogout">Logout</button>

                `;

            }

        };

        updateUserUI();

        window.addEventListener("auth-change", updateUserUI);

        /* =========================

           ACTIONS

        ========================= */

        this.shadowRoot.addEventListener("click", async (e) => {

            if (e.target.id === "navLogin") {

                window.location.href = "./auth-service.html";

            }

            if (e.target.id === "navLogout") {

                await AuthService.logout();

                avatar.classList.remove("logged-in");

                avatar.textContent = "";

                userMenu.innerHTML = `<button id="navLogin">Login</button>`;

                userMenu.classList.remove("active");

                window.dispatchEvent(new Event("auth-change"));

            }

            if (e.target.id === "navDashboard") {

                window.location.href = "./admin-dashboard.html";

            }

        });
    }
}

function getInitials(first, last) {
    if (!first || !last) return "?";

    return (first[0] + last[0]).toUpperCase();
}

customElements.define('liquid-glass-navbar', NavBar);
