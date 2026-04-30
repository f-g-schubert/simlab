class CookieConsent extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        this.key = this.getAttribute("storage-key") || "consentGiven";

        if (localStorage.getItem(this.key)) return;

        this.render();
        this.addEvents();
    }

    render() {
        this.shadowRoot.innerHTML = `
        <style>
            :host {
                position: fixed;
                left: 50%;
                bottom: 24px;
                transform: translateX(-50%) translateY(40px);
                z-index: 9999;
                animation: slideIn 0.6s ease forwards;
                font-family: system-ui, sans-serif;
            }

            @keyframes slideIn {
                to {
                    transform: translateX(-50%) translateY(0);
                    opacity: 1;
                }
            }

            .box {
                backdrop-filter: blur(18px);
                background: rgba(20, 20, 30, 0.7);
                border-radius: 18px;
                padding: 18px 22px;
                display: flex;
                gap: 16px;
                align-items: center;
                color: #fff;
                box-shadow: 0 8px 40px rgba(0,0,0,0.4);
                border: 1px solid rgba(255,255,255,0.08);
                max-width: 520px;
            }

            .text {
                font-size: 0.9rem;
                opacity: 0.85;
                line-height: 1.4;
            }

            button {
                border: none;
                padding: 10px 16px;
                border-radius: 10px;
                cursor: pointer;
                font-weight: 600;
                transition: 0.25s;
            }

            .accept {
                background: #2d6cdf;
                color: white;
            }

            .accept:hover {
                background: #1f54b8;
            }

            a {
                color: #8ab4ff;
                text-decoration: none;
            }

            a:hover {
                text-decoration: underline;
            }
        </style>

        <div class="box">
            <div class="text">
                Diese Website verwendet technisch notwendige Speichertechnologien sowie den Dienst Supabase zur Bereitstellung von Benutzerkonten und Datenbankfunktionen.
                Weitere Informationen findest du in der 
                <a href="datenschutz.html">Datenschutzerklärung</a>.
            </div>
            <button class="accept">OK</button>
        </div>
        `;
    }

    addEvents() {
        this.shadowRoot.querySelector(".accept").addEventListener("click", () => {
            localStorage.setItem(this.key, "true");
            this.remove();
        });
    }
}

customElements.define("cookie-consent", CookieConsent);