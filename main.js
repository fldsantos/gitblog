const ownerNameEl = document.getElementById("owner-name");
const ownerImageEl = document.getElementById("owner-image");
const ownerTaglineEl = document.getElementById("owner-tagline");
const searchInput = document.getElementById("search-input");
const entriesContainer = document.getElementById("entries");
const emptyState = document.getElementById("empty-state");
const tagFilterButton = document.getElementById("tag-filter-button");
const tagFilter = document.getElementById("tag-filter");

let allEntries = [];
let activeTag = null;

async function loadConfig() {
  try {
    const res = await fetch("config.json");
    if (!res.ok) throw new Error("Missing config.json");
    const cfg = await res.json();
    ownerNameEl.textContent = cfg.ownerName || "Blog Owner";
    ownerImageEl.src = cfg.ownerImage || "";
    ownerTaglineEl.textContent = cfg.tagline || "";
  } catch (err) {
    console.error(err);
  }
}

async function loadEntries() {
  try {
    const res = await fetch("entries.json");
    if (!res.ok) throw new Error("Run the build step to generate entries.json");
    const data = await res.json();
    allEntries = data.entries || [];
    renderEntries(allEntries);
    buildTagFilter(allEntries);
  } catch (err) {
    console.error(err);
    emptyState.classList.remove("hidden");
    emptyState.textContent = "No entries found. Run the build script.";
  }
}

function buildTagFilter(entries) {
  const tags = new Set();
  entries.forEach((entry) => entry.tags.forEach((tag) => tags.add(tag)));
  tagFilter.innerHTML = "";
  tags.forEach((tag) => {
    const el = document.createElement("span");
    el.className = `tag${activeTag === tag ? " active" : ""}`;
    el.textContent = tag;
    el.addEventListener("click", () => {
      activeTag = activeTag === tag ? null : tag;
      buildTagFilter(entries);
      filterEntries();
    });
    tagFilter.appendChild(el);
  });
}

function filterEntries() {
  const query = searchInput.value.toLowerCase();
  const filtered = allEntries.filter((entry) => {
    const matchesQuery =
      entry.title.toLowerCase().includes(query) ||
      entry.tags.some((t) => t.toLowerCase().includes(query));
    const matchesTag = !activeTag || entry.tags.includes(activeTag);
    return matchesQuery && matchesTag;
  });
  renderEntries(filtered);
}

function renderEntries(entries) {
  entriesContainer.innerHTML = "";
  if (!entries.length) {
    emptyState.classList.remove("hidden");
    return;
  }
  emptyState.classList.add("hidden");
  entries.forEach((entry) => {
    const card = document.createElement("article");
    card.className = "entry-card";
    card.innerHTML = `
      <a href="post.html?slug=${encodeURIComponent(entry.slug)}">
        <h2 class="entry-title">${entry.title}</h2>
        <div class="entry-tags">
          ${entry.tags.map((t) => `<span class="entry-tag">${t}</span>`).join("")}
        </div>
      </a>
    `;
    entriesContainer.appendChild(card);
  });
}

tagFilterButton.addEventListener("click", () => {
  tagFilter.classList.toggle("hidden");
});

searchInput.addEventListener("input", filterEntries);

loadConfig();
loadEntries();

