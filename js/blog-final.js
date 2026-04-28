// blog.js - Blogging with Supabase
import { getBlog, getBlogById, likeBlogPost } from "./supabase.js";

const feedView = document.getElementById("feedView");
const detailView = document.getElementById("detailView");

let currentView = "feed";
let selectedPostId = null;
let allPosts = [];

function switchView(view, postId = null) {
  currentView = view;
  selectedPostId = postId;

  if (view === "feed") {
    feedView.style.display = "block";
    detailView.style.display = "none";
    renderFeed();
  } else {
    feedView.style.display = "none";
    detailView.style.display = "block";
    renderDetail(postId);
  }
}

function truncateText(text, max = 200) {
  if (text.length <= max) return text;
  return text.slice(0, max) + `<span class="more"> …mehr</span>`;
}

function createPostCard(post) {
  const el = document.createElement("div");
  el.className = "post";

  const firstImage = post.images && post.images[0] ? post.images[0] : '';

  el.innerHTML = `
    <div class="post-header">
      <img src="${post.avatar}" />
      <strong>${post.author}</strong>
    </div>

    ${firstImage ? `<img class="post-image" src="${firstImage}" />` : ""}

    <div class="post-content">
      ${truncateText(post.content)}
    </div>

    <div class="post-actions">
      ❤️ ${post.likes} 💬 0
    </div>
  `;

  el.addEventListener("click", () => {
    switchView("detail", post.id);
  });

  return el;
}

async function renderFeed() {
  feedView.innerHTML = "";
  try {
    allPosts = await getBlog();
    allPosts.forEach(post => {
      feedView.appendChild(createPostCard(post));
    });
  } catch (error) {
    console.error("Fehler beim Laden des Feeds:", error);
    feedView.innerHTML = "<p>Fehler beim Laden der Blog-Beiträge</p>";
  }
}

async function renderDetail(postId) {
  try {
    const post = allPosts.find(p => p.id === postId) || await getBlogById(postId);
    
    if (!post) {
      detailView.innerHTML = "<p>Beitrag nicht gefunden</p>";
      return;
    }

    const firstImage = post.images && post.images[0] ? post.images[0] : '';

    detailView.innerHTML = `
      <button id="backBtn">← Zurück</button>

      <div class="post-detail">

        <div class="post-header">
          <img src="${post.avatar}" />
          <strong>${post.author}</strong>
          <small>${post.date}</small>
        </div>

        ${firstImage ? `
          <div class="image-gallery">
            ${post.images.map(img => `<img src="${img}" />`).join("")}
          </div>
        ` : ""}

        <div class="post-content full">
          ${post.content}
        </div>

        <div class="post-actions">
          <button id="likeBtn" class="like-btn">❤️ ${post.likes}</button>
        </div>

        <div class="comments">
          <h3>Kommentare</h3>

          <div id="commentList">
            <p>Kommentare werden bald unterstützt</p>
          </div>

        </div>
      </div>
    `;

    document.getElementById("backBtn")
      .addEventListener("click", () => switchView("feed"));

    document.getElementById("likeBtn")
      .addEventListener("click", async () => {
        try {
          await likeBlogPost(postId);
          post.likes += 1;
          renderDetail(postId);
        } catch (error) {
          console.error("Fehler beim Speichern des Likes:", error);
        }
      });

  } catch (error) {
    console.error("Fehler beim Laden des Beitrags:", error);
    detailView.innerHTML = "<p>Fehler beim Laden des Beitrags</p>";
  }
}

// Initialize
renderFeed();
