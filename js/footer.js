class GlassFooter extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: "open" });
    }

    getThemeColors(theme) {
        const themes = {
            blue: ["#00c6ff", "#0072ff"],
            purple: ["#a18cd1", "#6a11cb"],
            gold: ["#f7971e", "#ffd200"],
            custom: ["#00ffcc", "#3366ff"]
        };
        return themes[theme] || themes.blue;
    }

    getIcon(type) {
        const icons = {
            github: `<path d="M12 .5C5.7.5.5 5.7.5 12a11.5 11.5 0 008 11c.6.1.8-.3.8-.6v-2.3c-3.3.7-4-1.6-4-1.6-.5-1.2-1.3-1.5-1.3-1.5-1-.7.1-.7.1-.7 1.1.1 1.7 1.1 1.7 1.1 1 .1.7 1.5 2.8 2 .3-.7.5-1.2.9-1.5-2.7-.3-5.5-1.3-5.5-6a4.6 4.6 0 011.2-3.2 4.3 4.3 0 01.1-3.2s1-.3 3.3 1.2a11.4 11.4 0 016 0C17 5 18 5.3 18 5.3a4.3 4.3 0 01.1 3.2 4.6 4.6 0 011.2 3.2c0 4.7-2.8 5.7-5.5 6 .5.4.9 1.2.9 2.4v3.6c0 .3.2.7.8.6a11.5 11.5 0 008-11C23.5 5.7 18.3.5 12 .5z"/>`,
            twitter: `<path d="M23 3a10.9 10.9 0 01-3.1 1 4.5 4.5 0 002-2.5 9 9 0 01-2.8 1.1A4.5 4.5 0 0012 6a12.8 12.8 0 01-9-4.6 4.5 4.5 0 001.4 6 4.3 4.3 0 01-2-.5v.1a4.5 4.5 0 003.6 4.4 4.6 4.6 0 01-2 .1 4.5 4.5 0 004.2 3.2A9 9 0 010 19a12.7 12.7 0 006.9 2`,
            instagram: `<rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="18" cy="6" r="1.5"/>`,
            linkedin: `<path d="M4 3a2 2 0 110 4 2 2 0 010-4zm0 6h4v12H4zM10 9h3.6v1.6h.1c.5-.9 1.8-1.8 3.7-1.8 4 0 4.7 2.6 4.7 6v6h-4v-5.3c0-1.3 0-3-1.9-3s-2.2 1.5-2.2 2.9V21h-4z"/>`
        };
        return icons[type] || "";
    }

    connectedCallback() {
        const brand = this.getAttribute("brand") || "Brand";
        const description = this.getAttribute("description") || "";
        const links = JSON.parse(this.getAttribute("links") || "[]");
        const socials = JSON.parse(this.getAttribute("socials") || "[]");
        const theme = this.getAttribute("theme") || "blue";

        const [c1, c2] = this.getThemeColors(theme);
        const year = new Date().getFullYear();

        this.shadowRoot.innerHTML = `
        <style>
            :host { display:block; color:white; margin-top:10px; padding-top:10px; }

            .footer {
                position:relative;
                padding:60px 30px 30px;
                backdrop-filter: blur(25px);
                background: rgba(255,255,255,0.05);
                border-radius:30px 30px 0 0;
                overflow:hidden;

                isolation: isolate;
            }

            .footer::before {
                content:"";
                position:absolute;
                inset:0;
                padding:1px;
                border-radius:inherit;
                background: linear-gradient(120deg, ${c1}, ${c2}, ${c1});
                background-size:200% 200%;
                animation:move 6s linear infinite;

                pointer-events: none;
                z-index:0;

                -webkit-mask:
                  linear-gradient(#000 0 0) content-box,
                  linear-gradient(#000 0 0);
                -webkit-mask-composite:xor;
            }

            @keyframes move {
                0% {background-position:0%}
                100% {background-position:200%}
            }

            .container {
                display:grid;
                grid-template-columns:1.5fr repeat(2,1fr);
                gap:40px;
                max-width:1200px;
                margin:auto;
                position:relative;
                z-index:2;
            }

            .col a {
                display:block;
                margin:6px 0;
                color:rgba(255,255,255,0.6);
                text-decoration:none;
                transition:.25s;
            }

            .col a:hover {
                color:white;
                transform:translateX(6px);
                text-shadow:0 0 12px ${c1};
            }

            /* 🔥 Social Icons */
            .socials {
                display:flex;
                gap:14px;
                margin-top:20px;
            }

            .icon {
                width:42px;
                height:42px;
                display:flex;
                align-items:center;
                justify-content:center;
                border-radius:12px;
                background:rgba(255,255,255,0.05);
                transition:.35s;
                position:relative;
                overflow:hidden;
            }

            .icon svg {
                width:20px;
                height:20px;
                fill:white;
                transition:.35s;
            }

            .icon:hover {
                transform:translateY(-6px) scale(1.08);
                box-shadow:0 10px 25px rgba(0,0,0,0.3);
            }

            .icon:hover svg {
                transform:scale(1.2);
                filter:drop-shadow(0 0 6px ${c1});
            }

            .icon::after {
                content:"";
                position:absolute;
                inset:0;
                background:linear-gradient(120deg, transparent, ${c1}, transparent);
                opacity:0;
                transition:.4s;
                pointer-events: none;
            }

            .icon:hover::after {
                opacity:0.4;
            }

            .bottom {
                margin-top:50px;
                text-align:center;
                opacity:.5;
                font-size:14px;
                position:relative;
                z-index:2;
            }

            @media (max-width:800px) {
                .container { grid-template-columns:1fr; text-align:center; }
                .socials { justify-content:center; }
            }

            .glow {
                pointer-events: none;
                z-index: 0;
            }
        </style>

        <footer class="footer">
            <div class="container">
                <div>
                    <h2>${brand}</h2>
                    <p>${description}</p>

                    <div class="socials">
                        ${socials.map(s => `
                            <a class="icon" href="${s.href}">
                                <svg viewBox="0 0 24 24">${this.getIcon(s.type)}</svg>
                            </a>
                        `).join("")}
                    </div>
                </div>

                ${links.map(col => `
                    <div class="col">
                        <h4>${col.title}</h4>
                        ${col.items.map(i => `<a href="${i.href}">${i.label}</a>`).join("")}
                    </div>
                `).join("")}
            </div>

            <div class="bottom">
                <!--© ${year} ${brand}-->
            </div>
        </footer>
        `;
    }
}

customElements.define("glass-footer", GlassFooter);