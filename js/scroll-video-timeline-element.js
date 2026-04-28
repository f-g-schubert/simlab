class ScrollVideoTimelineElement extends HTMLElement {

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });

        this._items = [];
        this._videoSrc = "";

        this._active = false;
        this._raf = null;
        this._rafId = null;

        this._lastIndex = -1;
        
        // Bind methods for event listeners
        this._onScroll = this._onScroll.bind(this);
        this._onRAF = this._onRAF.bind(this);
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
            if (this.video) {
                this.video.src = newValue;
                this.video.load();
            }
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
        window.removeEventListener("scroll", this._onScroll);
        if (this._observer) this._observer.disconnect();
    }

    // =========================
    // RENDER BASE
    // =========================
    renderBase() {
        this.shadowRoot.innerHTML = `
            <section id="timelineScroll">
                <video id="video" muted playsinline preload="metadata">
                    <source src="${this._videoSrc}" type="video/mp4">
                </video>
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
                    background: #000;
                    -webkit-appearance: none;
                    -webkit-touch-callout: none;
                    max-width: 100%;
                    will-change: auto;
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
            // If source was already set before render, ensure video is loaded.
            this.video.load();
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

                if (this._active) {
                    window.addEventListener("scroll", this._onScroll, { passive: true });
                    this.startLoop();
                } else {
                    window.removeEventListener("scroll", this._onScroll);
                    this.stopLoop();
                }
            });
        }, {
            threshold: 0.1
        });

        this._observer.observe(this);
    }

    // =========================
    // LOOP
    // =========================
    startLoop() {
        if (this._rafId) return;
        this._rafId = requestAnimationFrame(this._onRAF);
    }

    stopLoop() {
        if (this._rafId) {
            cancelAnimationFrame(this._rafId);
            this._rafId = null;
        }
    }

    _onScroll() {
        if (this._active) {
            this._updateVideo();
        }
    }

    _onRAF() {
        if (this._active) {
            this._updateVideo();
            this._rafId = requestAnimationFrame(this._onRAF);
        }
    }

    _updateVideo() {
        const rect = this.section.getBoundingClientRect();
        const vh = window.innerHeight;
        const total = rect.height - vh;

        let progress = 0;
        if (total > 0) {
            progress = Math.min(Math.max(-rect.top / total, 0), 1);
        }

        this.timeline.style.setProperty("--progress", progress);

        if (this.video.duration && !isNaN(this.video.duration)) {
            const targetTime = this.video.duration * progress;
            const currentTime = this.video.currentTime || 0;
            if (Math.abs(targetTime - currentTime) > 0.1) {
                this.video.currentTime = targetTime;
            }
        }

        const items = this._items || [];
        const itemCount = items.length;
        let activeIndex = 0;

        if (itemCount > 0) {
            const segmentSize = 1 / itemCount;
            activeIndex = Math.min(Math.floor(progress / segmentSize), itemCount - 1);
        }

        this.shadowRoot.querySelectorAll(".timeline-item").forEach((el, i) => {
            el.classList.toggle("active", i === activeIndex);
        });
    }
}

customElements.define("scroll-video-timeline-element", ScrollVideoTimelineElement);