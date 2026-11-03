(() => {
  "use strict";
  const pad = number => String(number).padStart(2, "0");
  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }
  function asset(value) {
    if (typeof value !== "string") return null;
    try {
      const url = new URL(value, location.href);
      const directory = new URL("./assets/photography/", location.href);
      return url.origin === location.origin && url.pathname.startsWith(directory.pathname) && /\.jpe?g$/i.test(url.pathname) ? url.href : null;
    } catch { return null; }
  }

  window.renderPortfolioPhotography = (projects = []) => {
    const gallery = document.getElementById("photography-gallery");
    const sections = [
      {id: "flat", label: "商品攝影"},
      {id: "commercial", label: "商業攝影"},
      {id: "beauty", label: "美容情境攝影"},
      {id: "product", label: "產品攝影"},
      {id: "family", label: "親子攝影"}
    ];
    const valid = projects.map(project => ({...project, photos: (project.photos || []).map(photo => ({...photo, src: asset(photo.src), preview: asset(photo.preview), thumbnail: asset(photo.thumbnail)})).filter(photo => photo.src && photo.preview && photo.thumbnail)})).filter(project => project.photos.length);
    if (!valid.length) return;
    const navigation = element("nav", "photo-navigation"); navigation.setAttribute("aria-label", "攝影分類");
    gallery.before(navigation);

    function buildProject(project, container) {
      const title = project.category;
      const article = element("article", "photo-project"); article.dataset.project = project.id;
      const photos = project.photos;
      const frame = element("div", "photo-stage"); frame.setAttribute("role", "region"); frame.setAttribute("aria-label", `${title}照片`);
      const mainLink = element("a", "photo-main"); mainLink.setAttribute("aria-label", `放大${title}照片`); mainLink.draggable = false;
      const image = element("img"); image.loading = "lazy"; image.decoding = "async"; image.draggable = false;
      mainLink.append(image);
      const previous = element("button", "photo-arrow is-previous", "←"); previous.type = "button"; previous.setAttribute("aria-label", `${title}：上一張照片`);
      const next = element("button", "photo-arrow is-next", "→"); next.type = "button"; next.setAttribute("aria-label", `${title}：下一張照片`);
      frame.append(mainLink, previous, next);
      const meta = element("div", "photo-meta");
      const counter = element("span", "photo-position"); counter.setAttribute("aria-live", "polite"); counter.setAttribute("aria-atomic", "true");
      meta.append(counter, element("span", "photo-help", "左右滑動換張 · 點擊大圖放大"));
      const thumbnails = element("div", "photo-thumbnails"); thumbnails.setAttribute("role", "group"); thumbnails.setAttribute("aria-label", `${title}縮圖，共 ${photos.length} 張`);
      const buttons = photos.map((photo, index) => {
        const button = element("button", "photo-thumbnail"); button.type = "button";
        button.setAttribute("aria-label", `${title}：第 ${index + 1} 張，共 ${photos.length} 張`);
        const thumb = element("img"); thumb.src = photo.thumbnail; thumb.alt = ""; thumb.loading = "lazy"; thumb.decoding = "async"; thumb.width = photo.width; thumb.height = photo.height;
        button.append(thumb);
        button.addEventListener("click", () => select(index)); thumbnails.append(button); return button;
      });
      article.append(frame, meta, thumbnails); container.append(article);
      let current = 0, gesture, suppressClick = false;
      function select(index, revealThumbnail = true) {
        current = Math.max(0, Math.min(photos.length - 1, index));
        const photo = photos[current];
        article.dataset.photoIndex = String(current);
        image.src = photo.preview; image.alt = photo.alt; image.width = photo.width; image.height = photo.height;
        mainLink.href = photo.src;
        counter.textContent = `${pad(current + 1)} / ${pad(photos.length)} 張`;
        previous.disabled = current === 0; next.disabled = current === photos.length - 1;
        buttons.forEach((button, i) => {
          if (i === current) button.setAttribute("aria-current", "true"); else button.removeAttribute("aria-current");
        });
        if (revealThumbnail) {
          const button = buttons[current];
          if (button.offsetLeft < thumbnails.scrollLeft || button.offsetLeft + button.offsetWidth > thumbnails.scrollLeft + thumbnails.clientWidth) {
            thumbnails.scrollTo({left: button.offsetLeft - (thumbnails.clientWidth - button.offsetWidth) / 2, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth"});
          }
        }
      }
      previous.addEventListener("click", () => select(current - 1)); next.addEventListener("click", () => select(current + 1));
      mainLink.addEventListener("keydown", event => {
        if (event.altKey || event.ctrlKey || event.metaKey) return;
        if (event.key === "ArrowLeft" || event.key === "ArrowRight") { event.preventDefault(); select(current + (event.key === "ArrowRight" ? 1 : -1)); }
      });
      frame.addEventListener("pointerdown", event => {
        if (event.button !== 0 || !event.isPrimary || event.target.closest("button")) return;
        gesture = {id: event.pointerId, x: event.clientX, y: event.clientY};
      });
      frame.addEventListener("pointercancel", () => { gesture = null; });
      frame.addEventListener("pointerup", event => {
        if (!gesture || gesture.id !== event.pointerId) return;
        const dx = event.clientX - gesture.x, dy = event.clientY - gesture.y;
        gesture = null;
        if (Math.abs(dx) < 45 || Math.abs(dx) < Math.abs(dy) * 1.3) return;
        event.preventDefault(); suppressClick = true; select(current + (dx < 0 ? 1 : -1));
        setTimeout(() => { suppressClick = false; }, 0);
      });
      mainLink.addEventListener("click", event => {
        if (suppressClick) { event.preventDefault(); return; }
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || typeof document.getElementById("image-viewer").showModal !== "function") return;
        event.preventDefault();
        window.dispatchEvent(new CustomEvent("portfolio:open-photos", {detail: {photos, index: current, opener: mainLink, onChange: select}}));
      });
      select(0, false);
    }

    sections.forEach(definition => {
      const projects = valid.filter(project => definition.id === "commercial" ? project.id.startsWith("fashion-") : project.id === definition.id);
      const count = projects.reduce((sum, project) => sum + project.photos.length, 0);
      const section = element("section", "photo-category"); section.id = `photo-${definition.id}`;
      const heading = element("header", "photo-category-heading");
      const headingText = element("div"); const h2 = element("h2", "", definition.label); h2.id = `${section.id}-title`;
      section.setAttribute("aria-labelledby", h2.id); headingText.append(h2);
      heading.append(headingText);
      if (definition.id !== "commercial") heading.append(element("span", "photo-total", count ? `${count} 張` : "整理中"));
      section.append(heading);
      const jump = element("button", "", definition.label); jump.type = "button";
      jump.addEventListener("click", () => section.scrollIntoView({behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start"})); navigation.append(jump);
      projects.forEach(project => buildProject(project, section));
      if (!count) section.append(element("p", "photo-pending", "作品整理中，敬請期待。"));
      gallery.append(section);
    });
    document.getElementById("photography-empty").hidden = true;
  };
})();
