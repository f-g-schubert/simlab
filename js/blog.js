// blog.js
import {
  getBlog,
  getBlogById,
  likeBlogPost,
  supabase,
  testConnection,
  getComments,
  addComment,
  getLikesCount
} from "./supabase.js";

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

  // Handle images - content.images might be an array or undefined
  //const firstImage = post.images && post.images[0] ? post.images[0] : '';
  const firstImage = Array.isArray(post.images) && post.images.length > 0
  ? post.images[0]
  : null;

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

  // Click to open detail
  el.addEventListener("click", () => {
    switchView("detail", post.id);
  });

  return el;
}

async function renderFeed() {
  feedView.innerHTML = "";
  try {
    // Test database connection on first load
    if (!window.dbConnectionTested) {
      window.dbConnectionTested = true;
      await testConnection();
    }

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
    const likeCount = await getLikesCount(postId);
    
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
          <button id="likeBtn" class="like-btn">❤️ ${likeCount}</button>
        </div>

        <div class="comments">
          <h3>Kommentare</h3>

          <div id="commentList"></div>

          <div class="comment-input">
            <textarea id="commentText" placeholder="Kommentar schreiben..."></textarea>
            <button id="sendComment">Senden</button>
          </div>
        </div>
      </div>
    `;

    document.getElementById("backBtn")
      .addEventListener("click", () => switchView("feed"));

    document.getElementById("likeBtn")
      .addEventListener("click", async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          const guestId = user ? null : (localStorage.getItem("guest_id") || crypto.randomUUID());
          
          if (!user) {
            localStorage.setItem("guest_id", guestId);
          }
          
          await likeBlogPost(postId, user?.id, guestId);
          await likeBlogPost(postId, user?.id, guestId);

          // neu laden statt +1 lokal
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

async function loadComments() {
  const comments = await getComments(postId);

  const list = document.getElementById("commentList");
  list.innerHTML = "";

  if (!comments.length) {
    list.innerHTML = "<p>Noch keine Kommentare</p>";
    return;
  }

  comments.forEach(c => {
    const div = document.createElement("div");
    div.className = "comment";
    div.innerHTML = `
      <strong>${c.user_name}</strong>
      <p>${c.text}</p>
      <small>${new Date(c.created_at).toLocaleString()}</small>
    `;
    list.appendChild(div);
  });
}

document.getElementById("sendComment")
  .addEventListener("click", async () => {
    const text = document.getElementById("commentText").value.trim();
    if (!text) return;

    const { data: { user } } = await supabase.auth.getUser();

    try {
      await addComment(postId, text, user);
      document.getElementById("commentText").value = "";
      loadComments();
    } catch (err) {
      console.error(err);
    }
  });

loadComments();

// Initialize
renderFeed();