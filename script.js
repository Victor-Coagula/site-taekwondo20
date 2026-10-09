const grid = document.getElementById("postsGrid");
const searchInput = document.getElementById("search");
const categoryFilter = document.getElementById("categoryFilter");
document.getElementById("year").textContent = new Date().getFullYear();

let posts = [];

function escapeHtml(text = "") {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatDate(date) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  }).format(new Date(date));
}

function renderPosts() {
  const term = searchInput.value.trim().toLowerCase();
  const category = categoryFilter.value;

  const filtered = posts.filter(post => {
    const matchesTerm =
      post.title.toLowerCase().includes(term) ||
      post.content.toLowerCase().includes(term) ||
      (post.category || "").toLowerCase().includes(term);

    const matchesCategory = !category || post.category === category;
    return matchesTerm && matchesCategory;
  });

  if (!filtered.length) {
    grid.innerHTML = `<p class="empty">Nenhuma publicação encontrada.</p>`;
    return;
  }

  grid.innerHTML = filtered.map(post => `
    <article class="post-card">
      ${
        post.image
          ? `<img class="post-image" src="${escapeHtml(post.image)}" alt="${escapeHtml(post.title)}" />`
          : `<div class="post-placeholder">TAEKWONDO</div>`
      }
      <div class="post-body">
        <div class="post-meta">${escapeHtml(post.category || "Geral")}</div>
        <h3>${escapeHtml(post.title)}</h3>
        <p>${escapeHtml(post.content)}</p>
        <div class="post-date">${formatDate(post.createdAt)}</div>
      </div>
    </article>
  `).join("");
}

function fillCategories() {
  const categories = [...new Set(posts.map(p => p.category).filter(Boolean))].sort();
  categoryFilter.innerHTML =
    `<option value="">Todas as categorias</option>` +
    categories.map(cat => `<option value="${escapeHtml(cat)}">${escapeHtml(cat)}</option>`).join("");
}

async function loadPosts() {
  try {
    const response = await fetch("/api/posts");
    posts = await response.json();
    fillCategories();
    renderPosts();
  } catch {
    grid.innerHTML = `<p class="empty">Não foi possível carregar as publicações.</p>`;
  }
}

searchInput.addEventListener("input", renderPosts);
categoryFilter.addEventListener("change", renderPosts);

loadPosts();
