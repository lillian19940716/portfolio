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
  const filmGallery = document.getElementById("film-gallery");
  const videoGroups = new Map();
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function createVideoGroup(name, portrait) {
    const section = document.createElement("section"); section.className = "video-group";
    const heading = document.createElement("h2"); heading.id = `video-group-${videoGroups.size + 1}`; heading.textContent = name;
    section.setAttribute("aria-labelledby", heading.id);
    const stage = document.createElement("div"); stage.className = `device-stage ${portrait ? "is-phone" : "is-computer"}`;
    const shell = document.createElement("div"); shell.className = "device-shell";
    const reel = document.createElement("div"); reel.className = "video-reel"; reel.tabIndex = 0;
    reel.setAttribute("role", "region"); reel.setAttribute("aria-label", `${name}，${portrait ? "上下" : "左右"}切換影片`);
    shell.append(reel); stage.append(shell);
    let swipeHint;
    if (portrait) {
      swipeHint = document.createElement("div"); swipeHint.className = "device-swipe-hint"; swipeHint.setAttribute("aria-hidden", "true");
      swipeHint.innerHTML = '<svg viewBox="0 0 140 190" fill="none" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="swipe-arrow-gradient" x1="63" y1="48" x2="63" y2="17" gradientUnits="userSpaceOnUse"><stop stop-color="#8fc600" stop-opacity=".08"/><stop offset=".5" stop-color="#8fc600" stop-opacity=".6"/><stop offset="1" stop-color="#8fc600"/></linearGradient><linearGradient id="swipe-wrist-gradient" x1="0" y1="145" x2="0" y2="185" gradientUnits="userSpaceOnUse"><stop stop-color="#fff"/><stop offset=".45" stop-color="#fff" stop-opacity=".7"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient><mask id="swipe-wrist-fade" maskUnits="userSpaceOnUse" x="0" y="0" width="140" height="190"><rect width="140" height="190" fill="url(#swipe-wrist-gradient)"/></mask></defs><path class="swipe-arrow" d="M63 47V20m-6 7 6-7 6 7" stroke="url(#swipe-arrow-gradient)" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/><g mask="url(#swipe-wrist-fade)"><path d="M42 185c-9-8-14-17-14-29l1-30c0-11-8-28-7-34 1-7 8-8 13-2 6 8 8 20 9 29l1 14 6-14V62c0-9 2-15 9-16 7-1 11 3 11 13l1 39c6-6 13-3 17 4l7 12c5-4 11 0 15 6l6 9c6-1 10 5 14 11 10 14 11 25 3 36l-5 9H42Z" fill="#fff" fill-opacity=".93" stroke="#8b9085" stroke-width="1.1" stroke-linejoin="round"/><path d="m72 98 5 20m19-4 6 12m15 3 5 8M45 133l-5 21" stroke="#969b90" stroke-width="1.1" stroke-linecap="round"/></g></svg>';
      stage.append(swipeHint);
    }
    if (!portrait) { const stand = document.createElement("div"); stand.className = "monitor-stand"; stand.setAttribute("aria-hidden", "true"); stage.append(stand); }
    const caption = document.createElement("p"); caption.className = "device-current-category"; caption.hidden = portrait;
    caption.setAttribute("aria-live", "polite"); stage.append(caption);
    const controls = document.createElement("div"); controls.className = "device-controls";
    const previous = document.createElement("button"); previous.type = "button"; previous.textContent = portrait ? "↑" : "←"; previous.setAttribute("aria-label", `${name}：上一支影片`);
    const status = document.createElement("div"); status.className = "device-status";
    const position = document.createElement("span"); position.className = "device-position"; position.setAttribute("aria-live", "polite"); position.setAttribute("aria-atomic", "true");
    const hint = document.createElement("p"); status.append(position, hint);
    const next = document.createElement("button"); next.type = "button"; next.textContent = portrait ? "↓" : "→"; next.setAttribute("aria-label", `${name}：下一支影片`);
    controls.append(previous, status, next); stage.append(controls); section.append(heading, stage); filmGallery.append(section);
    let current = 0;
    function update() {
      const total = reel.children.length;
      caption.textContent = reel.children[current]?.dataset.videoCategory || "";
      position.textContent = `${String(current + 1).padStart(2, "0")} / ${String(total).padStart(2, "0")}`;
      previous.disabled = current === 0; next.disabled = current === total - 1;
      previous.hidden = next.hidden = total < 2;
      hint.textContent = total > 1 ? `${portrait ? "上下" : "左右"}滑動，探索下一支作品` : "點選播放影片";
      [...reel.children].forEach((slide, index) => { if (index !== current) slide.querySelector("video")?.pause(); });
    }
    function move(delta) {
      const target = Math.max(0, Math.min(reel.children.length - 1, current + delta));
      reel.scrollTo({top: portrait ? target * reel.clientHeight : 0, left: portrait ? 0 : target * reel.clientWidth, behavior: reduceMotion ? "instant" : "smooth"});
    }
    previous.addEventListener("click", () => move(-1)); next.addEventListener("click", () => move(1));
    reel.addEventListener("scroll", () => {
      const size = portrait ? reel.clientHeight : reel.clientWidth;
      if (!size) return;
      const selected = Math.max(0, Math.min(reel.children.length - 1, Math.round((portrait ? reel.scrollTop : reel.scrollLeft) / size)));
      if (selected !== current) { current = selected; if (swipeHint) swipeHint.hidden = true; update(); }
    }, {passive: true});
    reel.addEventListener("keydown", event => {
      if (event.target !== reel) return;
      const backward = portrait ? "ArrowUp" : "ArrowLeft", forward = portrait ? "ArrowDown" : "ArrowRight";
      if (event.key === backward || event.key === forward) { event.preventDefault(); move(event.key === backward ? -1 : 1); }
    });
    return {reel, update};
  }
  function localVideoAsset(value, extension) {
    if (typeof value !== "string") return null;
    let url;
    try { url = new URL(value, location.href); } catch { return null; }
    const directory = new URL("./assets/video/", location.href);
    return url.origin === location.origin && url.pathname.startsWith(directory.pathname) && extension.test(url.pathname) ? url.href : null;
  }
  for (const [index, video] of (media.videos || []).entries()) {
    const source = localVideoAsset(video.src, /\.mp4$/i);
    let embed;
    if (!source) {
      try { embed = new URL(video.embed); } catch { continue; }
      const allowed = embed.protocol === "https:" && ((embed.hostname === "www.youtube-nocookie.com" && /^\/embed\/[\w-]+$/.test(embed.pathname)) || (embed.hostname === "player.vimeo.com" && /^\/video\/\d+$/.test(embed.pathname)));
      if (!allowed) continue;
    }
    const groupName = video.category || "影片作品";
    const portrait = video.height > video.width;
    const groupTitle = portrait ? groupName : "寬幅影片";
    if (!videoGroups.has(groupTitle)) {
      videoGroups.set(groupTitle, createVideoGroup(groupTitle, portrait));
    }
    const article = document.createElement("article"); article.className = "video-work";
    article.dataset.videoCategory = groupName;
    const label = video.title || `${groupName}，作品 ${index + 1}`;
    article.setAttribute("aria-label", label);
    const frame = document.createElement("div"); frame.className = "video-frame";
    if (source) {
      const player = document.createElement("video");
      player.src = source; player.controls = true; player.preload = "none"; player.playsInline = true;
      player.setAttribute("aria-label", label);
      if (Number.isFinite(video.width) && video.width > 0 && Number.isFinite(video.height) && video.height > 0) {
        player.width = video.width; player.height = video.height;
        frame.style.aspectRatio = `${video.width} / ${video.height}`;
        if (video.height > video.width) article.classList.add("is-portrait");
      }
      const poster = localVideoAsset(video.poster, /\.(?:jpe?g|png|webp)$/i);
      if (poster) player.poster = poster;
      player.addEventListener("play", () => {
        filmGallery.querySelectorAll("video").forEach(other => { if (other !== player) other.pause(); });
      });
      const fallback = document.createElement("p"); fallback.className = "video-error"; fallback.hidden = true;
      fallback.append("影片暫時無法播放，請重新整理或 ");
      const direct = document.createElement("a"); direct.href = source; direct.textContent = "直接開啟影片"; fallback.append(direct);
      player.addEventListener("error", () => { fallback.hidden = false; });
      frame.append(player); article.append(frame, fallback);
    } else {
      const iframe = document.createElement("iframe");
      iframe.src = embed.href; iframe.title = label; iframe.loading = "lazy"; iframe.allowFullscreen = true;
      iframe.allow = "accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen";
      iframe.referrerPolicy = "strict-origin-when-cross-origin";
      frame.append(iframe); article.append(frame);
    }
    if (video.title) { const heading = document.createElement("h3"); heading.textContent = video.title; article.append(heading); }
    if (video.description) { const description = document.createElement("p"); description.textContent = video.description; article.append(description); }
    videoGroups.get(groupTitle).reel.append(article);
    document.getElementById("film-empty").hidden = true;
  }
  videoGroups.forEach(group => group.update());

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
