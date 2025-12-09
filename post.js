const titleEl = document.getElementById("post-title");
const tagsEl = document.getElementById("post-tags");
const bodyEl = document.getElementById("post-body");

function getSlug() {
  const params = new URLSearchParams(window.location.search);
  return params.get("slug");
}

async function loadPost() {
  const slug = getSlug();
  if (!slug) {
    titleEl.textContent = "Missing post";
    bodyEl.textContent = "No slug provided in the URL.";
    return;
  }

  try {
    const metaRes = await fetch("entries.json");
    const meta = await metaRes.json();
    const entry = (meta.entries || []).find((e) => e.slug === slug);
    if (!entry) {
      titleEl.textContent = "Post not found";
      bodyEl.textContent = "It may have been removed.";
      return;
    }

    titleEl.textContent = entry.title;
    tagsEl.innerHTML = entry.tags.map((t) => `<span class="entry-tag">${t}</span>`).join("");

    const postRes = await fetch(entry.path);
    const markdown = await postRes.text();
    const html = marked.parse(markdown);
    bodyEl.innerHTML = DOMPurify.sanitize(html);
  } catch (err) {
    console.error(err);
    titleEl.textContent = "Error loading post";
    bodyEl.textContent = "Please try again later.";
  }
}

loadPost();

