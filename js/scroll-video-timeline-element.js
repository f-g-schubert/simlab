class ScrollVideoTimelineElement extends HTMLElement {

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });

        this._items = [];
        this._videoSrc = "";

        this._active = false;
        this._raf = null;

        this._lastIndex = -1;
    }

    static get observedAttributes() {
        return ["items", "video-src"];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === "items") {
            try {
                this._items = JSON.parse(newValue);
                this.renderItems();
            } catch (e) {
                console.error("Invalid JSON in items attribute", e);
                this._items = [];
            }
        }

        if (name === "video-src") {
            this._videoSrc = newValue;
            if (this.video) this.video.src = newValue;
        }
    }

    set items(val) {
        this._items = val;
        this.renderItems();
    }

    set videoSrc(val) {
        this._videoSrc = val;
        if (this.video) this.video.src = val;
    }

    connectedCallback() {
        this.renderBase();
        this.renderItems();
        this.initObserver();
    }

    disconnectedCallback() {
        this.stopLoop();
        if (this._observer) this._observer.disconnect();
    }

    // =========================
    // RENDER BASE
    // =========================
    renderBase() {
        this.shadowRoot.innerHTML = `
            <section id="timelineScroll">
                <video id="video" muted playsinline preload="auto"></video>
                <div class="timeline"></div>
            </section>

            <style>
                :host {
                    display: block;
                }

                #timelineScroll {
                    position: relative;
                    height: 500vh;
                    scroll-snap-type: y mandatory;
                }

                video {
                    position: sticky;
                    top: 0;
                    width: 100%;
                    height: 100vh;
                    object-fit: cover;
                    display: block;
                    -webkit-transform: translateZ(0);
                    transform: translateZ(0);
                    -webkit-backface-visibility: hidden;
                    backface-visibility: hidden;
                    -webkit-user-select: none;
                    user-select: none;
                }

                .timeline {
                    position: sticky;
                    top: 0;
                    height: 100vh;
                    padding-left: 80px;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    z-index: 10;
                    pointer-events: auto;
                }

                .timeline::before {
                    content: "";
                    position: absolute;
                    left: 40px;
                    width: 3px;
                    background: white;
                    height: calc(var(--progress, 0) * 100%);
                }

                .timeline-item {
                    scroll-snap-align: center;
                    display: flex;
                    align-items: center;
                    margin: 30px 0;
                    opacity: 0.3;
                    transform: translateX(-30px);
                    transition: 0.5s;
                }

                .timeline-item.active {
                    opacity: 1;
                    transform: translateX(0);
                }

                .marker {
                    width: 22px;
                    height: 22px;
                    margin-right: 15px;
                    border-radius: 50%;
                    border: 2px solid white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 12px;
                    flex-shrink: 0;
                }

                .marker.filled {
                    background: white;
                    color: black;
                }

                .content {
                    color: white;
                }
            </style>
        `;

        this.section = this.shadowRoot.getElementById("timelineScroll");
        this.timeline = this.shadowRoot.querySelector(".timeline");
        this.video = this.shadowRoot.getElementById("video");

        if (this._videoSrc) {
            this.video.src = this._videoSrc;
        }
    }

    // =========================
    // RENDER ITEMS
    // =========================
    renderItems() {
        if (!this.timeline) return;

        this.timeline.innerHTML = "";

        this._items.forEach((item, i) => {
            const el = document.createElement("div");
            el.className = "timeline-item";
            el.dataset.index = i;

            // Marker
            const marker = document.createElement("div");
            marker.className = "marker";

            if (item.marker === "filled") marker.classList.add("filled");
            if (item.marker === "number") marker.textContent = i + 1;
            if (item.marker === "custom") marker.innerHTML = item.markerContent || "";

            // Content
            const content = document.createElement("div");
            content.className = "content";
            content.innerHTML = item.text || "";

            el.appendChild(marker);
            el.appendChild(content);

            this.timeline.appendChild(el);
        });
    }

    // =========================
    // OBSERVER
    // =========================
    initObserver() {
        this._observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                this._active = entry.isIntersecting;

                if (this._active) this.startLoop();
                else this.stopLoop();
            });
        });

        this._observer.observe(this.section);
    }

    // =========================
    // LOOP
    // =========================
    startLoop() {
        if (this._raf) return;

        const loop = () => {
            if (!this._active) return;

            this.update();
            this._raf = requestAnimationFrame(loop);
        };

        loop();
    }

    stopLoop() {
        cancelAnimationFrame(this._raf);
        this._raf = null;
    }

    // =========================
    // CORE LOGIC
    // =========================
    update() {
        if (!this.video || !this.section) return;

        const rect = this.section.getBoundingClientRect();
        const vh = window.innerHeight;
        const total = rect.height - vh;

        let progress = 0;
        if (total > 0) {
            progress = Math.min(Math.max(-rect.top / total, 0), 1);
        }

        this.timeline.style.setProperty("--progress", progress);

        // =========================
        // 🔥 BASELINE VIDEO (IMMER FUNKTIONIERT)
        // =========================
        const duration = this.video.duration;

        if (duration && this.video.readyState >= 2) {
            const baseTarget = duration * progress;
            this.video.currentTime += (baseTarget - this.video.currentTime) * 0.15;
        }

        // =========================
        // ITEM LOGIC (SAFE LAYER)
        // =========================
        const items = this._items || [];

        if (!items.length) return;

        const segmentSize = 1 / items.length;

        const index = Math.min(
            Math.floor(progress / segmentSize),
            items.length - 1
        );

        const current = items[index];
        const start = index * segmentSize;
        const local = (progress - start) / segmentSize;

        const mode = this.getAttribute("mode") || "scroll";

        // =========================
        // SEGMENT LAYER (OPTIONAL)
        // =========================
        if (mode === "segments" && current?.videoSegment) {

            const { start: s, end: e } = current.videoSegment;

            const itemMode = current.videoMode || "scroll";

            if (itemMode === "scroll") {
                const target = s + (e - s) * local;

                this.video.currentTime += (target - this.video.currentTime) * 0.15;
            }

            if (itemMode === "autoplay") {

                if (this._lastIndex !== index) {
                    this.video.currentTime = s;
                    this.video.play().catch(() => {});
                }

                if (this.video.currentTime >= e) {
                    this.video.pause();
                }
            }

            this._lastIndex = index;
        }

        // =========================
        // UI UPDATE (IMMER AUSFÜHREN!)
        // =========================
        this.shadowRoot.querySelectorAll(".timeline-item").forEach((el, i) => {
            el.classList.toggle("active", i === index);
        });
    }
}

customElements.define("scroll-video-timeline-element", ScrollVideoTimelineElement);