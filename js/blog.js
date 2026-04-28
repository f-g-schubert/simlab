// blog.js
import { getDB_dataFor, likePost, addComment } from "./db.js";

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

async function renderFeed() {
  feedView.innerHTML = "";
  const posts = await getDB_dataFor("blog");

  posts.forEach(post => {
    feedView.appendChild(createPostCard(post));
  });
}

async function renderDetail(postId) {
  const posts = await getDB_dataFor("blog");
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
        <span id="likeBtn">❤️ ${post.likes}</span>
      </div>

      <div class="comments">
        <h3>Kommentare</h3>

        <div id="commentList">
          ${post.comments.map(c => `
            <div class="comment">
              <strong>${c.user_name}</strong>: ${c.text}
            </div>
          `).join("")}
        </div>

        <input id="commentInput" placeholder="Kommentar..." />
        <button id="commentBtn">Senden</button>

      </div>
    </div>
  `;

  document.getElementById("backBtn")
    .addEventListener("click", () => switchView("feed"));

  document.getElementById("likeBtn")
    .addEventListener("click", async () => {
      await likePost(postId);
      renderDetail(postId);
    });

  document.getElementById("commentBtn")
    .addEventListener("click", async () => {
      const text = document.getElementById("commentInput").value;
      if (!text) return;

      await addComment(postId, text);
      renderDetail(postId);
    });
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

function getGuestId() {
  let id = localStorage.getItem("guest_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("guest_id", id);
  }
  return id;
}

renderFeed();