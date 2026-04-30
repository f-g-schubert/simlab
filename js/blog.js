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

let cachedLikes_forPost = 0;

let commentsChannel = null;
let likesChannel = null;

function switchView(view, postId = null) {

  // 👉 HARD CLEANUP ALL SUBSCRIPTIONS
  if (commentsChannel) {
    supabase.removeChannel(commentsChannel);
    commentsChannel = null;
  }

  if (likesChannel) {
    supabase.removeChannel(likesChannel);
    likesChannel = null;
  }

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

async function createPostCard(post, likeCount) {

  if (!post) {
    console.warn("createPostCard received invalid post:", post);
    return document.createElement("div");
  }

  const el = document.createElement("div");
  el.className = "post";

  const firstImage = Array.isArray(post.images) && post.images.length > 0
    ? post.images[0]
    : null;

  el.innerHTML = `
    <div class="post-header">
      <img src="${post.avatar || ''}" />
      <strong>${post.author || 'Unknown'}</strong>
    </div>

    ${firstImage ? `<img class="post-image" src="${firstImage}" />` : ""}

    <div class="post-content">
      ${truncateText(post.content || "")}
    </div>

    <div class="post-actions">
      ❤️ ${likeCount ?? 0} 💬 0
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
    if (!window.dbConnectionTested) {
      window.dbConnectionTested = true;
      await testConnection();
    }

    allPosts = await getBlog();

    for (const post of allPosts) {

      // 👉 SAFETY GUARD
      if (!post || !post.id) continue;

      const likeCount = await getLikesCount(post.id, post.likes || 0);

      const node = await createPostCard(post, likeCount);

      // 👉 FINAL SAFETY CHECK
      if (node instanceof Node) {
        feedView.appendChild(node);
      } else {
        console.warn("Invalid node skipped:", node);
      }
    }

  } catch (error) {
    console.error("Fehler beim Laden des Feeds:", error);
    feedView.innerHTML = "<p>Fehler beim Laden der Blog-Beiträge</p>";
  }
}

async function renderDetail(postId) {
  try {
    const post = allPosts.find(p => p.id === postId) || await getBlogById(postId);
    const likeCount = await getLikesCount(postId, post.likes);
    cachedLikes_forPost = post.likes;
    loadComments(postId);
    subscribeComments(postId);
    subscribeLikes(postId);
    
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

          <div class="comment-input glass-field">
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
          const guestId = user
            ? null
            : (localStorage.getItem("guest_id") || crypto.randomUUID());

          if (!user) {
            localStorage.setItem("guest_id", guestId);
          }

          try {
            await likeBlogPost(postId, user?.id, guestId);
          } catch (error) {
            if (error.code !== "23505") {
              console.error("Like Fehler:", error);
            }
          }

        } catch (error) {
          console.error("Like Fehler:", error);
        }
      });
    
    setTimeout(() => {
      const sendBtn = document.getElementById("sendComment");
      const textEl = document.getElementById("commentText");

      if (!sendBtn) return;

      sendBtn.addEventListener("click", async () => {
        const text = textEl.value.trim();
        if (!text) return;

        const { data: { user } } = await supabase.auth.getUser();

        await addComment(postId, text, user);

        textEl.value = "";
        loadComments(postId);
      });
    }, 0);

  } catch (error) {
    console.error("Fehler beim Laden des Beitrags:", error);
    detailView.innerHTML = "<p>Fehler beim Laden des Beitrags</p>";
  }
}

async function loadComments(postId) {
  const comments = await getComments(postId);

  const list = document.getElementById("commentList");
  if (!list) return;

  list.innerHTML = "";

  if (!comments.length) {
    list.innerHTML = "<p>Noch keine Kommentare</p>";
    return;
  }

  comments.forEach(c => {
    const div = document.createElement("div");
    div.className = "comment";
    div.classList.add("glass-comment");
    div.innerHTML = `
      <strong>${c.user_name}</strong>
      <p>${c.text}</p>
      <small>${new Date(c.created_at).toLocaleString()}</small>
    `;
    list.appendChild(div);
  });
}

// Initialize
renderFeed();


/* SUBSCRIPTIONS */
function subscribeComments(postId) {
  // cleanup alte subscription
  if (commentsChannel) {
    supabase.removeChannel(commentsChannel);
    commentsChannel = null;
  }

  commentsChannel = supabase
    .channel("comments-global-channel")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "comments"
      },
      (payload) => {
        const row = payload.new || payload.old;

        // 👉 MANUAL FILTER (WICHTIG)
        if (row?.post_id === postId) {
          loadComments(postId);
        }
      }
    )
    .subscribe();
}

function subscribeLikes(postId) {
  // cleanup alte subscription
  if (likesChannel) {
    supabase.removeChannel(likesChannel);
    likesChannel = null;
  }

  likesChannel = supabase
    .channel("likes-global-channel")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "likes"
      },
      async (payload) => {
        const row = payload.new || payload.old;

        // 👉 MANUAL FILTER (WICHTIG)
        if (!row || row.post_id !== postId) return;

        // optional: nur UI update, kein DB call
        const likeCount = await getLikesCount(postId, cachedLikes_forPost);

        const btn = document.getElementById("likeBtn");
        if (btn) btn.innerHTML = `❤️ ${likeCount}`;
      }
    )
    .subscribe();
}