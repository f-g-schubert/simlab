class Carousel extends HTMLElement {
    static groups = new Map(); // 🔥 Sync Engine

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });

        this.currentIndex = 0;
        this.intervalId = null;
        this.dots = [];
    }

    connectedCallback() {
        this.images = this.parseAttr("images", []);
        this.overlays = this.parseAttr("overlays", []);
        this.autoplay = this.getAttribute("autoplay") !== "false";
        this.intervalTime = Number(this.getAttribute("interval")) || 4000;
        this.syncGroup = this.getAttribute("sync-group");

        this.render();
        this.initCarousel();
        this.initObserver();
        this.registerSync();
    }

    /* =========================
        ATTR PARSER
    ========================= */
    parseAttr(name, fallback) {
        try {
            return JSON.parse(this.getAttribute(name)) || fallback;
        } catch {
            return fallback;
        }
    }

    /* =========================
        RENDER
    ========================= */
    render() {
        this.shadowRoot.innerHTML = `
            <section class="carousel">
                <div class="carousel-track"></div>
                <div class="carousel-dots"></div>
            </section>

            <style>
                .carousel {
                    margin-top: 120px;
                    overflow: hidden;
                    position: relative;
                }

                .carousel-track {
                    display: flex;
                    transition: transform 0.5s ease;
                }

                .slide {
                    position: relative;
                    min-width: 100%;
                    display: flex;
                    justify-content: center;
                }

                .slide img {
                    width: 80%;
                    border-radius: 15px;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.2);
                }

                .overlay {
                    position: absolute;
                    transform: translate(-50%, -50%);
                    pointer-events: auto;
                }

                .carousel-dots {
                    position: absolute;
                    bottom: 20px;
                    width: 100%;
                    display: flex;
                    justify-content: center;
                    gap: 12px;
                }

                .dot {
                    height: 12px;
                    width: 12px;
                    border-radius: 50%;
                    cursor: pointer;
                    background: rgba(255,255,255,0.2);
                    border: 1px solid rgba(255,255,255,0.3);
                }

                .dot.active {
                    background: white;
                    transform: scale(1.2);
                }
            </style>
        `;
    }

    /* =========================
        INIT CAROUSEL
    ========================= */
    initCarousel() {
        const track = this.shadowRoot.querySelector(".carousel-track");
        const dotsContainer = this.shadowRoot.querySelector(".carousel-dots");

        this.dots = [];

        this.images.forEach((src, i) => {
            const slide = document.createElement("div");
            slide.className = "slide";

            const img = document.createElement("img");
            img.src = src;

            slide.appendChild(img);

            // OVERLAYS
            this.addOverlays(slide, i);

            track.appendChild(slide);

            const dot = document.createElement("span");
            dot.className = "dot";
            dot.onclick = () => this.goTo(i);

            this.dots.push(dot);
            dotsContainer.appendChild(dot);
        });

        this.update();
        if (this.autoplay) this.start();
    }

    /* =========================
        OVERLAYS SYSTEM
    ========================= */
    addOverlays(slide, index) {
        const overlays = this.overlays.filter(o => o.image === index);

        overlays.forEach(o => {
            const el = document.createElement("div");
            el.className = "overlay";
            el.innerHTML = o.html;

            el.style.left = `${o.x}%`;
            el.style.top = `${o.y}%`;

            slide.appendChild(el);
        });
    }

    /* =========================
        CORE LOGIC
    ========================= */
    goTo(index) {
        this.currentIndex = index;
        this.update();

        if (this.syncGroup) {
            this.syncBroadcast(index);
        }

        this.restart();
    }

    update() {
        const track = this.shadowRoot.querySelector(".carousel-track");
        track.style.transform = `translateX(-${this.currentIndex * 100}%)`;

        this.dots.forEach((d, i) => {
            d.classList.toggle("active", i === this.currentIndex);
        });
    }

    /* =========================
        AUTOPLAY
    ========================= */
    start() {
        this.intervalId = setInterval(() => {
            this.goTo((this.currentIndex + 1) % this.images.length);
        }, this.intervalTime);
    }

    restart() {
        clearInterval(this.intervalId);
        this.start();
    }

    /* =========================
        SWIPE
    ========================= */
    initSwipe() {
        const track = this.shadowRoot.querySelector(".carousel-track");

        let startX = 0;

        track.addEventListener("touchstart", e => startX = e.touches[0].clientX);
        track.addEventListener("touchend", e => {
            const end = e.changedTouches[0].clientX;
            this.handleSwipe(startX, end);
        });
    }

    handleSwipe(start, end) {
        if (start - end > 50) {
            this.goTo((this.currentIndex + 1) % this.images.length);
        } else if (end - start > 50) {
            this.goTo((this.currentIndex - 1 + this.images.length) % this.images.length);
        }
    }

    /* =========================
        INTERSECTION OBSERVER
    ========================= */
    initObserver() {
        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    if (this.autoplay) this.start();
                } else {
                    clearInterval(this.intervalId);
                }
            });
        });

        observer.observe(this);
    }

    /* =========================
        SYNC ENGINE
    ========================= */
    registerSync() {
        if (!this.syncGroup) return;

        if (!Carousel.groups.has(this.syncGroup)) {
            Carousel.groups.set(this.syncGroup, []);
        }

        Carousel.groups.get(this.syncGroup).push(this);
    }

    syncBroadcast(index) {
        const group = Carousel.groups.get(this.syncGroup);
        if (!group) return;

        group.forEach(c => {
            if (c !== this) {
                c.currentIndex = index;
                c.update();
            }
        });
    }
}

customElements.define("carousel-element", Carousel);