class TimelineStoryElement extends HTMLElement {

    constructor() {
        super();
        this.attachShadow({ mode: "open" });

        this._onScroll = this._onScroll.bind(this);
        this._isActive = false;

        this._progress = 0;
        this._targetProgress = 0;
    }

    connectedCallback() {
        this.render();
        this.initConfig();
        this.build();
        this.initObserver();
    }

    disconnectedCallback() {
        window.removeEventListener("scroll", this._onScroll);
        cancelAnimationFrame(this._raf);
        if (this.observer) this.observer.disconnect();
    }

    /* =========================
       CONFIG
    ========================= */
    initConfig() {
        try {
            this.config = JSON.parse(this.getAttribute("story-config")) || {};
        } catch {
            console.warn("Invalid JSON in story-config");
            this.config = {};
        }

        this.config.scrollLength ??= 2000;
        this.config.items ??= [];

        /* NEW */
        this.config.parallax ??= {};
        this.config.parallax.enabled ??= false;
        this.config.parallax.speed ??= 0.3;
        this.config.parallax.scale ??= 1;
        this.config.parallax.direction ??= "up";

        this.config.chapterMode ??= {};
        this.config.chapterMode.enabled ??= false;
        this.config.chapterMode.snap ??= true;
        this.config.chapterMode.lerp ??= 0.15;

        //new
        this.config.media ??= { enabled: false, mode: "fade", duration: 0.6 };
        this.config.autoDuration ??= { enabled: false, base: 0.2 };
        this.config.touch ??= { enabled: false, momentum: 0.08 };
        this.config.scrollLock ??= { enabled: false, strength: 1 };
    }

    /* =========================
       BUILD
    ========================= */
    build() {
        this.story = this.shadowRoot.querySelector(".story");
        this.timeline = this.shadowRoot.querySelector(".story-timeline");
        this.inner = this.shadowRoot.querySelector(".story-inner");
        this.media = this.shadowRoot.querySelector(".story-media");

        this.mediaLayers = [];

        if (this.config.media.enabled) {
            this.config.items.forEach((item, i) => {
                const layer = document.createElement("div");
                layer.className = "media-layer";
                layer.style.backgroundImage = `url(${item.media || ""})`;
                layer.style.opacity = i === 0 ? 1 : 0;

                this.media.appendChild(layer);
                this.mediaLayers.push(layer);
            });
        }

        /* Background */
        if (this.config.useImage && this.config.image) {
            this.media.style.backgroundImage = `url(${this.config.image})`;
        }

        /* Parallax vorbereiten */
        if (this.config.parallax.enabled) {
            this.media.style.willChange = "transform";
        }

        /* Items */
        this.items = [];

        this.config.items.forEach((item, index) => {

            const el = document.createElement("div");
            el.className = `story-item ${item.effect || ""}`;

            el.dataset.start = item.start;
            el.dataset.end = item.end;
            el.dataset.index = index;

            const marker = document.createElement("div");
            marker.className = "marker";

            if (item.marker?.type === "filled") {
                marker.classList.add("filled");
            }

            marker.innerHTML = item.marker?.label || "";

            if (item.marker?.color) {
                marker.style.borderColor = item.marker.color;
                marker.style.color = item.marker.color;
            }

            if (item.marker?.bg) {
                marker.style.background = item.marker.bg;
            }

            const content = document.createElement("div");
            content.className = "story-content";
            content.innerHTML = item.html;

            if (item.textStyle) {
                content.style.color = item.textStyle.color;
                content.style.fontSize = item.textStyle.size;
                content.style.fontFamily = item.textStyle.font;
            }

            el.appendChild(document.createElement("div"));
            el.appendChild(marker);
            el.appendChild(content);

            this.inner.appendChild(el);
            this.items.push(el);
        });
    }

    /* =========================
       OBSERVER
    ========================= */
    initObserver() {
        this.observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                this._isActive = entry.isIntersecting;

                if (this._isActive) {
                    window.addEventListener("scroll", this._onScroll, { passive: true });
                    this._loop();
                } else {
                    window.removeEventListener("scroll", this._onScroll);
                    cancelAnimationFrame(this._raf);
                }
            });
        }, { threshold: 0.1 });

        this.observer.observe(this);
    }

    /* =========================
       SCROLL INPUT
    ========================= */
    _onScroll() {
        if (!this._isActive) return;

        const rect = this.getBoundingClientRect();
        const vh = window.innerHeight;

        const total = rect.height - vh;

        let rawProgress = total > 0
            ? Math.min(Math.max(-rect.top / total, 0), 1)
            : 0;

        /* CHAPTER MODE */
        if (this.config.chapterMode.enabled) {
            const steps = this.config.items.length;

            if (this.config.chapterMode.snap) {
                const step = Math.round(rawProgress * (steps - 1));
                this._targetProgress = step / (steps - 1);
            } else {
                this._targetProgress = rawProgress;
            }

        } else {
            this._targetProgress = rawProgress;
        }
    }

    /* =========================
       RAF LOOP
    ========================= */
    _loop() {

        const lerp = this.config.chapterMode.enabled
            ? this.config.chapterMode.lerp
            : 1;

        if (Math.abs(this._targetProgress - this._progress) < 0.001) {
            this._progress = this._targetProgress;
        } else {
            this._progress += (this._targetProgress - this._progress) * lerp;
        }

        this.timeline.style.setProperty("--progress", this._progress);

        /* ITEMS */
        this.items.forEach(el => {
            if (this.config.chapterMode.enabled) {

                const count = this.items.length;
                let index = Math.round(this._progress * (count - 1));

                this.items.forEach((el, i) => {
                    el.classList.toggle("active", i === index);
                });

                /* MEDIA SWITCH */
                if (this.config.media.enabled) {
                    this.mediaLayers.forEach((layer, i) => {
                        layer.style.opacity = i === index ? 1 : 0;
                    });
                }

            } else {

                this.items.forEach(el => {
                    const start = parseFloat(el.dataset.start);
                    const end = parseFloat(el.dataset.end);

                    el.classList.toggle(
                        "active",
                        this._progress >= start && this._progress <= end
                    );
                });
            }
        });

        /* PARALLAX */
        if (this.config.parallax.enabled) {
            const dir = this.config.parallax.direction === "down" ? 1 : -1;
            const speed = this.config.parallax.speed;
            const scale = this.config.parallax.scale;

            const y = (this._progress - 0.5) * 200 * speed * dir;

            this.media.style.transform = `
                translate3d(0, ${y}px, 0)
                scale(${scale})
            `;
        }

        if (this.config.autoDuration.enabled) {
            const totalText = this.config.items.reduce((acc, item) => {
                return acc + (item.html?.length || 0);
            }, 0);

            this.config.scrollLength = totalText * this.config.autoDuration.base;
        }

        if (this.config.touch.enabled) {
            let lastY = 0;

            window.addEventListener("touchstart", e => {
                lastY = e.touches[0].clientY;
            });

            window.addEventListener("touchmove", e => {
                const delta = lastY - e.touches[0].clientY;
                lastY = e.touches[0].clientY;

                this._targetProgress += delta * this.config.touch.momentum * 0.001;
                this._targetProgress = Math.max(0, Math.min(1, this._targetProgress));
            }, { passive: true });
        }

        if (this.config.scrollLock.enabled && this.config.chapterMode.enabled) {
            const count = this.items.length;
            const stepSize = 1 / (count - 1);

            const snapped = Math.round(this._targetProgress / stepSize) * stepSize;

            this._targetProgress += (snapped - this._targetProgress) * this.config.scrollLock.strength;
        }

        this._raf = requestAnimationFrame(() => this._loop());
    }

    /* =========================
       RENDER
    ========================= */
    render() {
        this.shadowRoot.innerHTML = `
        <style>
            :host { display:block; }

            .story {
                position: relative;
                height: 300vh;
            }

            .story-sticky {
                position: sticky;
                top: 0;
                height: 100vh;
                overflow: hidden;
            }

            .story-media {
                position: absolute;
                inset: 0;
                background-size: cover;
                background-position: center;
                transition: transform 0.1s linear;
            }

            .story-overlay {
                position: absolute;
                inset: 0;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .story-timeline {
                position: relative;
                width: 100%;
                max-width: 900px;
                padding: 40px 40px 40px 80px;
            }

            .story-timeline::before {
                content: "";
                position: absolute;
                left: 20px;
                top: 5vh;
                width: 3px;
                height: calc(var(--progress, 0) * 90vh);
                background: white;
                transition: height 0.2s ease-out;
            }

            .story-item {
                display: grid;
                grid-template-columns: 40px 60px 1fr;
                margin: 40px 0;

                opacity: 0;
                transform: translateY(60px) scale(0.98);
                transition: all 0.6s cubic-bezier(0.22,1,0.36,1);
            }

            .story-item.active { opacity:1; }

            .marker {
                grid-column:2;
                width:32px;height:32px;
                border-radius:50%;
                display:flex;
                align-items:center;
                justify-content:center;
                border:2px solid white;
            }

            .marker.filled {
                background:white;
                color:black;
            }

            .story-content { grid-column:3; }

            .fade-up { transform: translateY(60px); }
            .fade-up.active { transform: translateY(0); }

            .slide-right { transform: translateX(-60px); }
            .slide-right.active { transform: translateX(0); }

            .zoom { transform: scale(0.8); }
            .zoom.active { transform: scale(1); }

            .blur { filter: blur(10px); }
            .blur.active { filter: blur(0); }

            .media-layer {
                position:absolute;
                inset:0;
                background-size:cover;
                background-position:center;
                transition: opacity 0.6s ease;
            }

            .story-item {
                opacity: 0.3;
                transform: translateX(0) scale(0.95);
            }

            .story-item.active {
                opacity: 1;
                transform: translateX(40px) scale(1);
            }
        </style>

        <section class="story">
            <div class="story-sticky">
                <div class="story-media"></div>
                <div class="story-overlay">
                    <div class="story-timeline">
                        <div class="story-inner"></div>
                    </div>
                </div>
            </div>
        </section>
        `;
    }
}

customElements.define("timeline-story-element", TimelineStoryElement);