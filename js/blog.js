// blog.js
import { getDB_dataFor, getDB_DataSet } from "./db.js";

/*const feed = document.getElementById("feed");

function createPost(post) {
  const el = document.createElement("div");
  el.className = "post";

  el.innerHTML = `
    <div class="post-header">
      <img src="${post.avatar}" />
      <div>
        <strong>${post.author}</strong><br>
        <small>${post.date}</small>
      </div>
    </div>

    ${post.image ? `<img class="post-image" src="${post.image}" />` : ""}

    <div class="post-content">
      ${post.content}
    </div>

    <div class="post-actions">
      ❤️ ${post.likes}
      💬 ${post.comments}
    </div>
  `;

  return el;
}

function renderFeed() {
  const posts = getDB_DataSet();

  posts.forEach(post => {
    const postEl = createPost(post);
    feed.appendChild(postEl);
  });
}

renderFeed();*/

const feedView = document.getElementById("feedView");
const detailView = document.getElementById("detailView");

let currentView = "feed";
let selectedPostId = null;

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

  el.innerHTML = `
    <div class="post-header">
      <img src="${post.avatar}" />
      <strong>${post.author}</strong>
    </div>

    <img class="post-image" src="${post.images[0]}" />

    <div class="post-content">
      ${truncateText(post.content)}
    </div>

    <div class="post-actions">
      ❤️ ${post.likes} 💬 ${post.comments.length}
    </div>
  `;

  // 👉 Klick = Detail öffnen
  el.addEventListener("click", () => {
    switchView("detail", post.id);
  });

  return el;
}

function renderFeed() {
  feedView.innerHTML = "";
  const posts = getDB_dataFor("blog");

  posts.forEach(post => {
    feedView.appendChild(createPostCard(post));
  });
}

function renderDetail(postId) {
  const posts = getDB_dataFor("blog");
  const post = posts.find(p => p.id === postId);

  detailView.innerHTML = `
    <button id="backBtn">← Zurück</button>

    <div class="post-detail">

      <div class="post-header">
        <img src="${post.avatar}" />
        <strong>${post.author}</strong>
      </div>

      <div class="image-gallery">
        ${post.images.map(img => `<img src="${img}" />`).join("")}
      </div>

      <div class="post-content full">
        ${post.content}
      </div>

      <div class="post-actions">
        ❤️ ${post.likes}
      </div>

      <div class="comments">
        <h3>Kommentare</h3>
        ${post.comments.map(c => `
          <div class="comment">
            <strong>${c.user}</strong>: ${c.text}
          </div>
        `).join("")}
      </div>

    </div>
  `;

  document.getElementById("backBtn")
    .addEventListener("click", () => switchView("feed"));
}

// MARK: - Vorbereitung
/* =========================
    Vorberietung für Interaktionen
========================= */
function toggleLike(postId) {
  const posts = getDB_dataFor("blog");
  const post = posts.find(p => p.id === postId);

  post.liked = !post.liked;
  post.likes += post.liked ? 1 : -1;

  if (currentView === "feed") renderFeed();
  else renderDetail(postId);
}

function addComment(postId, text) {
  const posts = getDB_dataFor("blog");
  const post = posts.find(p => p.id === postId);

  post.comments.push({
    id: Date.now(),
    user: "Du",
    text
  });

  renderDetail(postId);
}

renderFeed();