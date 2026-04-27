class ScrollVideoElement extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: "open" });

        this._onScroll = this._onScroll.bind(this);
        this._observer = null;
        this._visible = false;
    }

    static get observedAttributes() {
        return ["video-src", "items"];
    }

    connectedCallback() {
        this._render();
        this._setupObserver();
    }

    attributeChangedCallback() {
        this._render(); // Re-render bei Änderungen
    }

    disconnectedCallback() {
        window.removeEventListener("scroll", this._onScroll);
        if (this._observer) this._observer.disconnect();
    }

    // =========================
    // RENDER
    // =========================
    _render() {
        const videoSrc = this.getAttribute("video-src") || "";
        const items = this._parseItems();

        this.shadowRoot.innerHTML = `
            <section class="videoScroll">
                <video class="video" src="${videoSrc}" muted playsinline></video>
                <div class="overlay">
                    <div class="overlay-inner"></div>
                </div>
            </section>

            <style>
                .videoScroll {
                    position: relative;
                    height: 300vh;
                }

                .video {
                    position: sticky;
                    top: 0;
                    width: 100%;
                    height: 100vh;
                    object-fit: cover;
                }

                .overlay {
                    position: sticky;
                    top: 0;
                    height: 100vh;
                    pointer-events: none;
                }

                .overlay-inner {
                    position: relative;
                    width: 100%;
                    height: 100%;
                }

                .overlay-item {
                    position: absolute;
                    opacity: 0;
                    transform: translateY(30px);
                    transition: 0.5s ease;
                    max-width: 900px;
                    padding: 40px;
                }

                .overlay-item.active {
                    opacity: 1;
                    transform: translateY(0);
                }
            </style>
        `;

        const overlayInner = this.shadowRoot.querySelector(".overlay-inner");

        items.forEach(item => {
            const el = document.createElement("div");
            el.className = "overlay-item";
            el.innerHTML = item.html;
            el.dataset.start = item.start;
            el.dataset.end = item.end;

            overlayInner.appendChild(el);
        });

        this.video = this.shadowRoot.querySelector("video");
        this.items = this.shadowRoot.querySelectorAll(".overlay-item");
    }

    // =========================
    // PARSE ATTRIBUTES
    // =========================
    _parseItems() {
        try {
            return JSON.parse(this.getAttribute("items") || "[]");
        } catch (e) {
            console.warn("Invalid items JSON", e);
            return [];
        }
    }

    // =========================
    // INTERSECTION OBSERVER
    // =========================
    _setupObserver() {
        this._observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                this._visible = entry.isIntersecting;

                if (this._visible) {
                    window.addEventListener("scroll", this._onScroll, { passive: true });
                } else {
                    window.removeEventListener("scroll", this._onScroll);
                }
            });
        }, {
            threshold: 0.1
        });

        this._observer.observe(this);
    }

    // =========================
    // SCROLL LOGIC (LOCAL + SAFE)
    // =========================
    _onScroll() {
        const section = this.shadowRoot.querySelector(".videoScroll");
        if (!section || !this.video) return;

        const rect = section.getBoundingClientRect();
        const scrollLength = window.innerHeight * 2; // stabiler als fixer Wert

        const progress = Math.min(
            Math.max(-rect.top / scrollLength, 0),
            1
        );

        // Video sync
        if (this.video.duration) {
            this.video.currentTime = this.video.duration * progress;
        }

        // Overlay sync
        this.items.forEach(el => {
            const start = parseFloat(el.dataset.start);
            const end = parseFloat(el.dataset.end);

            el.classList.toggle(
                "active",
                progress >= start && progress <= end
            );
        });
    }
}

customElements.define("scroll-video-element", ScrollVideoElement);