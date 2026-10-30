(() => {
  "use strict";
  const categories = ["graphic", "photography", "film"];
  const links = [...document.querySelectorAll("[data-category]")];
  const sections = categories.map(id => document.getElementById(id));
  function showCategory() {
    const hash = decodeURIComponent(location.hash.slice(1));
    const category = categories.includes(hash) ? hash : "graphic";
    document.body.dataset.category = category;
    sections.forEach(section => { section.hidden = section.id !== category; });
    if (category !== "film") document.querySelectorAll("#film-gallery video").forEach(video => video.pause());
    links.forEach(link => {
      if (link.dataset.category === category) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
    document.getElementById("page-index").hidden = category !== "graphic";
    document.title = `${document.getElementById(`${category === "film" ? "film" : category}-title`).textContent}｜沛瑜作品集`;
    const page = document.getElementById(hash);
    if (page && hash.startsWith("page-")) page.scrollIntoView();
    else if (categories.includes(hash)) window.scrollTo({top: 0, behavior: "instant"});
  }
  window.addEventListener("hashchange", showCategory);
  showCategory();

  const media = window.PORTFOLIO_MEDIA || {};
  for (const [index, photo] of (media.photography || []).entries()) {
    if (!photo.src) continue;
    const figure = document.createElement("figure");
    figure.className = "work";
    const link = document.createElement("a");
    link.className = "image-link";
    link.href = photo.src;
    link.dataset.viewer = "photography";
    link.setAttribute("aria-label", `放大攝影作品 ${index + 1}`);
    const img = document.createElement("img");
    img.src = photo.src;
    img.alt = photo.alt || `攝影作品 ${index + 1}`;
    img.loading = "lazy";
    img.decoding = "async";
    link.append(img); figure.append(link);
    document.getElementById("photography-gallery").append(figure);
    document.getElementById("photography-empty").hidden = true;
  }
  window.renderPortfolioVideos(media.videos || []);

  const dialog = document.getElementById("image-viewer");
  const image = document.getElementById("viewer-image");
  const stage = document.getElementById("viewer-stage");
  const zoom = document.getElementById("viewer-zoom");
  const previous = document.getElementById("viewer-prev");
  const next = document.getElementById("viewer-next");
  let viewerLinks = [], currentIndex = 0, opener;
  function renderImage(index) {
    currentIndex = index;
    const link = viewerLinks[index];
    const original = link.querySelector("img");
    image.src = link.href; image.alt = original.alt;
    document.getElementById("viewer-title").textContent = original.alt;
    document.getElementById("viewer-original").href = link.href;
    document.getElementById("viewer-position").textContent = `${index + 1} / ${viewerLinks.length}`;
    previous.disabled = index === 0; next.disabled = index === viewerLinks.length - 1;
    stage.classList.remove("is-zoomed"); stage.scrollTo(0, 0);
    zoom.setAttribute("aria-pressed", "false"); zoom.textContent = "原尺寸";
  }
  document.addEventListener("click", event => {
    const link = event.target.closest("a[data-viewer]");
    if (!link || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || typeof dialog.showModal !== "function") return;
    event.preventDefault(); opener = link;
    viewerLinks = [...document.querySelectorAll(`a[data-viewer="${link.dataset.viewer}"]`)];
    renderImage(viewerLinks.indexOf(link));
    dialog.showModal(); document.body.classList.add("viewer-open");
    document.getElementById("viewer-close").focus();
  });
  document.getElementById("viewer-close").addEventListener("click", () => dialog.close());
  dialog.addEventListener("close", () => { document.body.classList.remove("viewer-open"); image.removeAttribute("src"); opener?.focus({preventScroll:true}); });
  previous.addEventListener("click", () => { if (currentIndex > 0) renderImage(currentIndex - 1); });
  next.addEventListener("click", () => { if (currentIndex < viewerLinks.length - 1) renderImage(currentIndex + 1); });
  zoom.addEventListener("click", () => { const active = stage.classList.toggle("is-zoomed"); zoom.setAttribute("aria-pressed", String(active)); zoom.textContent = active ? "符合畫面" : "原尺寸"; });
  dialog.addEventListener("keydown", event => {
    if (event.key === "ArrowLeft" && !previous.disabled) { event.preventDefault(); previous.click(); }
    if (event.key === "ArrowRight" && !next.disabled) { event.preventDefault(); next.click(); }
  });
})();
