class GlassMediaSection extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: "open" });
    }

    connectedCallback() {
        const mediaType = this.getAttribute("type") || "image"; // image | video
        const src = this.getAttribute("src") || "";
        const title = this.getAttribute("title") || "";
        const text = this.getAttribute("text") || "";
        const reverse = this.hasAttribute("reverse");

        this.shadowRoot.innerHTML = `
        <style>
            :host {
                display: block;
                margin: 60px auto;
                max-width: 1200px;
            }

            .wrapper {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 40px;
                align-items: center;
            }

            .wrapper.reverse {
                direction: rtl;
            }

            .wrapper.reverse * {
                direction: ltr;
            }

            .glass {
                backdrop-filter: blur(20px);
                background: rgba(255,255,255,0.08);
                border: 1px solid rgba(255,255,255,0.15);
                border-radius: 20px;
                padding: 30px;
                box-shadow: 0 10px 40px rgba(0,0,0,0.3);
            }

            h2 {
                margin-top: 0;
                font-size: 28px;
            }

            p {
                opacity: 0.8;
                line-height: 1.6;
            }

            .media {
                border-radius: 20px;
                overflow: hidden;
            }

            img, video {
                width: 100%;
                height: 100%;
                object-fit: cover;
                display: block;
            }

            @media(max-width: 900px){
                .wrapper {
                    grid-template-columns: 1fr;
                }
            }
        </style>

        <div class="wrapper ${reverse ? "reverse" : ""}">
            <div class="media glass">
                ${
                    mediaType === "video"
                        ? `<video src="${src}" autoplay muted loop playsinline></video>`
                        : `<img src="${src}" />`
                }
            </div>

            <div class="glass">
                <h2>${title}</h2>
                <p>${text}</p>
            </div>
        </div>
        `;
    }
}

customElements.define("glass-media-section", GlassMediaSection);