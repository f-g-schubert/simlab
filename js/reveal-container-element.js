class RevealContainerElement extends HTMLElement {

    static get observedAttributes() {
        return ["images", "interval", "angle", "bar-width", "bar-color", "bar-style", "speed"];
    }

    constructor() {
        super();
        this.attachShadow({ mode: "open" });

        this.index = 0;
        this.state = "wait";
        this.lastTime = 0;

        this.imgA = new Image();
        this.imgB = new Image();

        this.intersectionObserver = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) this.start();
            });
        }, { threshold: 0.2 });
    }

    connectedCallback() {
        this.render();
        this.parseAttributes();
        this.loadInitialImages();
        this.intersectionObserver.observe(this);
    }

    /* =========================
       SETUP
    ========================= */

    render() {
        this.shadowRoot.innerHTML = `
        <style>
            :host {
                display:block;
                margin:80px auto;
                width:90%;
                max-width:800px;
            }
            canvas {
                width:100%;
                display:block;
                border-radius:15px;
            }
        </style>
        <canvas></canvas>
        `;

        this.canvas = this.shadowRoot.querySelector("canvas");
        this.ctx = this.canvas.getContext("2d");

        this.canvas.width = 800;
        this.canvas.height = 400;
    }

    parseAttributes() {
        this.images = (this.getAttribute("images") || "")
            .split(",").map(s => s.trim()).filter(Boolean);

        this.interval = parseInt(this.getAttribute("interval")) || 3000;
        this.angle = parseFloat(this.getAttribute("angle")) || 45;
        this.barWidth = parseInt(this.getAttribute("bar-width")) || 120;
        this.barColor = this.getAttribute("bar-color") || "#ffffff";
        this.barStyle = this.getAttribute("bar-style") || "solid";

        // NEU: Geschwindigkeit
        this.speed = parseFloat(this.getAttribute("speed")) || 600; // px/s
    }

    loadInitialImages() {
        if (this.images.length < 2) return;

        this.imgA.src = this.images[0];
        this.imgB.src = this.images[1];
    }

    /* =========================
       LOOP
    ========================= */

    start() {
        if (this.running) return;
        this.running = true;
        requestAnimationFrame((t) => this.loop(t));
    }

    loop(time) {
        if (!this.running) return;

        if (!this.lastTime) this.lastTime = time;
        const delta = (time - this.lastTime) / 1000;
        this.lastTime = time;

        if (this.state === "wait") {
            this.drawStatic();

            if (!this.waitStart) this.waitStart = time;
            if (time - this.waitStart > this.interval) {
                this.state = "wipe";
                this.progress = -this.canvas.width;
            }
        }

        else if (this.state === "wipe") {
            this.progress += this.speed * delta;

            this.drawWipe(this.progress);

            if (this.progress > this.canvas.width) {
                this.commit();
            }
        }

        requestAnimationFrame((t) => this.loop(t));
    }

    /* =========================
       STATES
    ========================= */

    commit() {
        this.index = (this.index + 1) % this.images.length;

        this.imgA = this.imgB;
        this.imgB = new Image();
        this.imgB.src = this.images[(this.index + 1) % this.images.length];

        this.state = "wait";
        this.waitStart = null;
    }

    /* =========================
       DRAW
    ========================= */

    drawStatic() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        if (this.imgA.complete) {
            ctx.drawImage(this.imgA, 0, 0, this.canvas.width, this.canvas.height);
        }
    }

    drawWipe(progress) {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        ctx.clearRect(0, 0, w, h);

        if (!this.imgA.complete || !this.imgB.complete) return;

        // BASE
        ctx.drawImage(this.imgA, 0, 0, w, h);

        // ANGLE
        const angleRad = (this.angle * Math.PI) / 180;
        const offsetY = Math.tan(angleRad) * progress;

        // CLIP für Bild B
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(progress, -h);
        ctx.lineTo(progress + offsetY, h * 2);
        ctx.lineTo(-w, h * 2);
        ctx.lineTo(-w, -h);
        ctx.closePath();
        ctx.clip();

        ctx.drawImage(this.imgB, 0, 0, w, h);
        ctx.restore();

        // 🔥 DER SICHTBARE SLIDER (ENDLICH)
        ctx.save();

        ctx.strokeStyle = this.barColor;
        ctx.lineWidth = this.barWidth;

        if (this.barStyle.includes("glow")) {
            ctx.shadowBlur = 30;
            ctx.shadowColor = this.barColor;
        }

        if (this.barStyle.includes("dashed")) {
            ctx.setLineDash([20, 10]);
        }

        ctx.beginPath();
        ctx.moveTo(progress, -h);
        ctx.lineTo(progress + offsetY, h * 2);
        ctx.stroke();

        ctx.restore();
    }
}

customElements.define("reveal-container-element", RevealContainerElement);