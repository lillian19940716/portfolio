(() => {
  "use strict";
  const categories = ["graphic", "photography", "film", "ai"];
  const links = [...document.querySelectorAll(".categories a[data-category]")];
  const sections = categories.map(id => document.getElementById(id));
  if (typeof ResizeObserver === "function") {
    const header = document.querySelector(".sidebar");
    const observer = new ResizeObserver(() => document.documentElement.style.setProperty("--nav-offset", `${header.getBoundingClientRect().height}px`));
    observer.observe(header);
  }
  function showCategory() {
    const hash = decodeURIComponent(location.hash.slice(1));
    const category = categories.includes(hash) ? hash : "graphic";
    document.body.dataset.category = category;
    sections.forEach(section => { section.hidden = section.id !== category; });
    if (category !== "film") document.querySelectorAll("#film-gallery video").forEach(video => video.pause());
    if (category !== "ai") window.suspendPortfolioAI?.();
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
  window.renderPortfolioPhotography(media.photography || []);
  window.renderPortfolioVideos(media.videos || []);
  window.renderPortfolioAI(window.PORTFOLIO_AI || {sections: [], projects: []});

  const dialog = document.getElementById("image-viewer");
  const image = document.getElementById("viewer-image");
  const stage = document.getElementById("viewer-stage");
  const zoom = document.getElementById("viewer-zoom");
  const previous = document.getElementById("viewer-prev");
  const next = document.getElementById("viewer-next");
  let viewerItems = [], currentIndex = 0, opener, onViewerChange;
  function renderImage(index) {
    currentIndex = index;
    const item = viewerItems[index];
    image.src = item.src; image.alt = item.alt;
    document.getElementById("viewer-title").textContent = item.alt;
    document.getElementById("viewer-original").href = item.src;
    document.getElementById("viewer-position").textContent = `${index + 1} / ${viewerItems.length}`;
    previous.disabled = index === 0; next.disabled = index === viewerItems.length - 1;
    stage.classList.remove("is-zoomed"); stage.scrollTo(0, 0);
    zoom.setAttribute("aria-pressed", "false"); zoom.textContent = "原尺寸";
    onViewerChange?.(index);
  }
  function openViewer(items, index, source, onChange) {
    if (!items.length) return;
    viewerItems = items; opener = source; onViewerChange = onChange;
    renderImage(index);
    dialog.showModal(); document.body.classList.add("viewer-open");
    document.getElementById("viewer-close").focus();
  }
  document.addEventListener("click", event => {
    const link = event.target.closest("a[data-viewer]");
    if (!link || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || typeof dialog.showModal !== "function") return;
    event.preventDefault();
    const items = [...document.querySelectorAll(`a[data-viewer="${link.dataset.viewer}"]`)];
    openViewer(items.map(item => ({src: item.href, alt: item.querySelector("img").alt})), items.indexOf(link), link);
  });
  window.addEventListener("portfolio:open-photos", event => {
    const {photos, index, opener, onChange} = event.detail;
    openViewer(photos, index, opener, onChange);
  });
  document.getElementById("viewer-close").addEventListener("click", () => dialog.close());
  dialog.addEventListener("close", () => { document.body.classList.remove("viewer-open"); image.removeAttribute("src"); onViewerChange = undefined; opener?.focus({preventScroll:true}); });
  previous.addEventListener("click", () => { if (currentIndex > 0) renderImage(currentIndex - 1); });
  next.addEventListener("click", () => { if (currentIndex < viewerItems.length - 1) renderImage(currentIndex + 1); });
  zoom.addEventListener("click", () => { const active = stage.classList.toggle("is-zoomed"); zoom.setAttribute("aria-pressed", String(active)); zoom.textContent = active ? "符合畫面" : "原尺寸"; });
  dialog.addEventListener("keydown", event => {
    if (event.key === "ArrowLeft" && !previous.disabled) { event.preventDefault(); previous.click(); }
    if (event.key === "ArrowRight" && !next.disabled) { event.preventDefault(); next.click(); }
  });
  image.draggable = false;
  let viewerGesture;
  stage.addEventListener("pointerdown", event => {
    if (event.button === 0 && event.isPrimary && !stage.classList.contains("is-zoomed")) viewerGesture = {id: event.pointerId, x: event.clientX, y: event.clientY};
  });
  stage.addEventListener("pointercancel", () => { viewerGesture = null; });
  stage.addEventListener("pointerup", event => {
    if (!viewerGesture || viewerGesture.id !== event.pointerId || stage.classList.contains("is-zoomed")) return;
    const dx = event.clientX - viewerGesture.x, dy = event.clientY - viewerGesture.y;
    viewerGesture = null;
    if (Math.abs(dx) < 45 || Math.abs(dx) < Math.abs(dy) * 1.3) return;
    if (dx < 0 && !next.disabled) next.click();
    if (dx > 0 && !previous.disabled) previous.click();
  });
})();
