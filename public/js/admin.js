const loginView = document.getElementById("loginView");
const dashboardView = document.getElementById("dashboardView");
const loginForm = document.getElementById("loginForm");
const postForm = document.getElementById("postForm");
const adminPosts = document.getElementById("adminPosts");
const formMessage = document.getElementById("formMessage");
const loginMessage = document.getElementById("loginMessage");
const cancelEditBtn = document.getElementById("cancelEditBtn");
const currentImageBox = document.getElementById("currentImageBox");
const currentImage = document.getElementById("currentImage");

let posts = [];

function escapeHtml(text = "") {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function shortText(text, limit = 105) {
  return text.length > limit ? text.slice(0, limit) + "…" : text;
}

async function checkLogin() {
  const res = await fetch("/api/me");
  const data = await res.json();
  if (data.loggedIn) showDashboard();
  else showLogin();
}

function showLogin() {
  loginView.classList.remove("hidden");
  dashboardView.classList.add("hidden");
}

function showDashboard() {
  loginView.classList.add("hidden");
  dashboardView.classList.remove("hidden");
  loadPosts();
}

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  loginMessage.textContent = "Entrando...";

  const res = await fetch("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: document.getElementById("username").value,
      password: document.getElementById("password").value
    })
  });

  const data = await res.json();

  if (!res.ok) {
    loginMessage.textContent = data.error || "Não foi possível entrar.";
    return;
  }

  loginMessage.textContent = "";
  showDashboard();
});

document.getElementById("logoutBtn").addEventListener("click", async () => {
  await fetch("/api/logout", { method: "POST" });
  showLogin();
});

document.getElementById("refreshBtn").addEventListener("click", loadPosts);

async function loadPosts() {
  const res = await fetch("/api/posts");
  posts = await res.json();
  renderPosts();
}

function renderPosts() {
  if (!posts.length) {
    adminPosts.innerHTML = `<p class="empty">Nenhuma publicação ainda.</p>`;
    return;
  }

  adminPosts.innerHTML = posts.map(post => `
    <article class="admin-post">
      ${
        post.image
          ? `<img class="admin-thumb" src="${escapeHtml(post.image)}" alt="" />`
          : `<div class="admin-thumb placeholder">SEM FOTO</div>`
      }
      <div>
        <h3>${escapeHtml(post.title)}</h3>
        <p>${escapeHtml(post.category || "Geral")} • ${escapeHtml(shortText(post.content))}</p>
      </div>
      <div class="row-actions">
        <button class="mini-btn" onclick="editPost('${post.id}')">Editar</button>
        <button class="mini-btn delete" onclick="deletePost('${post.id}')">Excluir</button>
      </div>
    </article>
  `).join("");
}

window.editPost = function(id) {
  const post = posts.find(p => p.id === id);
  if (!post) return;

  document.getElementById("postId").value = post.id;
  document.getElementById("title").value = post.title;
  document.getElementById("category").value = post.category || "Geral";
  document.getElementById("content").value = post.content;
  document.getElementById("removeImage").checked = false;
  document.getElementById("image").value = "";
  document.getElementById("formTitle").textContent = "Editar publicação";
  cancelEditBtn.classList.remove("hidden");

  if (post.image) {
    currentImage.src = post.image;
    currentImageBox.classList.remove("hidden");
  } else {
    currentImageBox.classList.add("hidden");
  }

  window.scrollTo({ top: 0, behavior: "smooth" });
};

window.deletePost = async function(id) {
  const post = posts.find(p => p.id === id);
  if (!post) return;

  const confirmed = confirm(`Excluir a publicação "${post.title}"?`);
  if (!confirmed) return;

  const res = await fetch(`/api/posts/${id}`, { method: "DELETE" });
  const data = await res.json();

  if (!res.ok) {
    alert(data.error || "Erro ao excluir.");
    return;
  }

  await loadPosts();
  resetForm();
};

postForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const id = document.getElementById("postId").value;
  const formData = new FormData();
  formData.append("title", document.getElementById("title").value);
  formData.append("category", document.getElementById("category").value);
  formData.append("content", document.getElementById("content").value);

  const imageFile = document.getElementById("image").files[0];
  if (imageFile) formData.append("image", imageFile);

  if (document.getElementById("removeImage").checked) {
    formData.append("removeImage", "true");
  }

  formMessage.className = "message";
  formMessage.textContent = "Salvando...";

  const res = await fetch(id ? `/api/posts/${id}` : "/api/posts", {
    method: id ? "PUT" : "POST",
    body: formData
  });

  const data = await res.json();

  if (!res.ok) {
    if (res.status === 401) {
      showLogin();
      return;
    }
    formMessage.textContent = data.error || "Erro ao salvar.";
    return;
  }

  formMessage.className = "message success";
  formMessage.textContent = id ? "Publicação atualizada!" : "Publicação criada!";

  await loadPosts();

  setTimeout(() => {
    resetForm();
  }, 800);
});

cancelEditBtn.addEventListener("click", resetForm);

function resetForm() {
  postForm.reset();
  document.getElementById("postId").value = "";
  document.getElementById("formTitle").textContent = "Nova publicação";
  cancelEditBtn.classList.add("hidden");
  currentImageBox.classList.add("hidden");
  formMessage.textContent = "";
  formMessage.className = "message";
}

checkLogin();
