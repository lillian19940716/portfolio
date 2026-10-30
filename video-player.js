(() => {
  "use strict";
  const prefetched = new Map();

  // Warm the HTTP cache without creating another video decoder or keeping a blob in memory.
  function prefetchVideo(source) {
    if (!source || prefetched.has(source) || navigator.connection?.saveData) return;
    const request = fetch(source, {cache: "force-cache", credentials: "same-origin"})
      .then(async response => {
        if (!response.ok) throw new Error("Video prefetch failed");
        if (response.body) {
          const reader = response.body.getReader();
          while (!(await reader.read()).done) { /* Stream into the browser cache. */ }
        } else {
          await response.arrayBuffer();
        }
      }).catch(() => { prefetched.delete(source); });
    prefetched.set(source, request);
  }

  function localAsset(value, extension) {
    if (typeof value !== "string") return null;
    let url;
    try { url = new URL(value, location.href); } catch { return null; }
    const directory = new URL("./assets/video/", location.href);
    return url.origin === location.origin && url.pathname.startsWith(directory.pathname) && extension.test(url.pathname) ? url.href : null;
  }

  function normalize(item, index) {
    const source = localAsset(item.src, /\.mp4$/i);
    let embed;
    if (!source) {
      try { embed = new URL(item.embed); } catch { return null; }
      if (embed.protocol !== "https:" || !((embed.hostname === "www.youtube-nocookie.com" && /^\/embed\/[\w-]+$/.test(embed.pathname)) || (embed.hostname === "player.vimeo.com" && /^\/video\/\d+$/.test(embed.pathname)))) return null;
    }
    return {...item, source, embed: embed?.href, poster: localAsset(item.poster, /\.(?:jpe?g|png|webp)$/i), label: item.title || `${item.category || "影片作品"}，作品 ${index + 1}`};
  }

  window.renderPortfolioVideos = (items = []) => {
    const gallery = document.getElementById("film-gallery");
    const groups = new Map();
    items.forEach((item, index) => {
      const video = normalize(item, index);
      if (!video) return;
      const portrait = video.height > video.width;
      const name = portrait ? video.category || "直式影片" : "寬幅影片";
      if (!groups.has(name)) groups.set(name, {portrait, items: []});
      groups.get(name).items.push(video);
    });

    groups.forEach(({portrait, items}, name) => {
      const section = document.createElement("section"); section.className = "video-group";
      const heading = document.createElement("h2"); heading.id = `video-group-${gallery.children.length + 1}`; heading.textContent = name;
      section.setAttribute("aria-labelledby", heading.id);
      const stage = document.createElement("div"); stage.className = `device-stage ${portrait ? "is-phone" : "is-computer"}`;
      const shell = document.createElement("div"); shell.className = "device-shell";
      const screen = document.createElement("div"); screen.className = "video-screen"; screen.tabIndex = 0;
      screen.setAttribute("role", "region"); screen.setAttribute("aria-label", `${name}，${portrait ? "上下" : "左右"}切換影片`);

      // This element stays in the same visible position through every clip change.
      const player = document.createElement("video");
      player.controls = true; player.playsInline = true; player.preload = "auto";
      const cover = document.createElement("img"); cover.className = "video-cover"; cover.alt = ""; cover.setAttribute("aria-hidden", "true");
      const playButton = document.createElement("button"); playButton.type = "button"; playButton.className = "video-play";
      playButton.setAttribute("aria-label", "播放影片"); playButton.textContent = "▶";
      const loading = document.createElement("span"); loading.className = "video-loading"; loading.hidden = true;
      loading.setAttribute("role", "status"); loading.textContent = "影片緩衝中…";
      const fallback = document.createElement("div"); fallback.className = "video-error"; fallback.hidden = true;
      const message = document.createElement("p"); message.textContent = "影片暫時無法播放。";
      const retry = document.createElement("button"); retry.type = "button"; retry.textContent = "重新載入影片";
      fallback.append(message, retry); screen.append(player, cover, playButton, loading, fallback); shell.append(screen); stage.append(shell);
      let iframe;
      if (items.some(item => item.embed)) {
        iframe = document.createElement("iframe"); iframe.allowFullscreen = true; iframe.hidden = true;
        iframe.allow = "accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen";
        iframe.referrerPolicy = "strict-origin-when-cross-origin"; screen.append(iframe);
      }
      let swipeHint;
      if (portrait) {
        swipeHint = document.createElement("div"); swipeHint.className = "device-swipe-hint"; swipeHint.setAttribute("aria-hidden", "true");
        swipeHint.innerHTML = '<svg viewBox="0 0 140 190" fill="none" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="swipe-arrow-gradient" x1="63" y1="48" x2="63" y2="17" gradientUnits="userSpaceOnUse"><stop stop-color="#8fc600" stop-opacity=".08"/><stop offset=".5" stop-color="#8fc600" stop-opacity=".6"/><stop offset="1" stop-color="#8fc600"/></linearGradient><linearGradient id="swipe-wrist-gradient" x1="0" y1="145" x2="0" y2="185" gradientUnits="userSpaceOnUse"><stop stop-color="#fff"/><stop offset=".45" stop-color="#fff" stop-opacity=".7"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient><mask id="swipe-wrist-fade" maskUnits="userSpaceOnUse" x="0" y="0" width="140" height="190"><rect width="140" height="190" fill="url(#swipe-wrist-gradient)"/></mask></defs><path class="swipe-arrow" d="M63 47V20m-6 7 6-7 6 7" stroke="url(#swipe-arrow-gradient)" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/><g mask="url(#swipe-wrist-fade)"><path d="M42 185c-9-8-14-17-14-29l1-30c0-11-8-28-7-34 1-7 8-8 13-2 6 8 8 20 9 29l1 14 6-14V62c0-9 2-15 9-16 7-1 11 3 11 13l1 39c6-6 13-3 17 4l7 12c5-4 11 0 15 6l6 9c6-1 10 5 14 11 10 14 11 25 3 36l-5 9H42Z" fill="#fff" fill-opacity=".93" stroke="#8b9085" stroke-width="1.1" stroke-linejoin="round"/><path d="m72 98 5 20m19-4 6 12m15 3 5 8M45 133l-5 21" stroke="#969b90" stroke-width="1.1" stroke-linecap="round"/></g></svg>';
        stage.append(swipeHint);
      } else {
        const stand = document.createElement("div"); stand.className = "monitor-stand"; stand.setAttribute("aria-hidden", "true"); stage.append(stand);
      }
      const caption = document.createElement("p"); caption.className = "device-current-category"; caption.hidden = portrait;
      caption.setAttribute("aria-live", "polite"); stage.append(caption);
      const controls = document.createElement("div"); controls.className = "device-controls";
      const previous = document.createElement("button"); previous.type = "button"; previous.textContent = portrait ? "↑" : "←"; previous.setAttribute("aria-label", `${name}：上一支影片`);
      const status = document.createElement("div"); status.className = "device-status";
      const position = document.createElement("span"); position.className = "device-position"; position.setAttribute("aria-live", "polite"); position.setAttribute("aria-atomic", "true");
      const hint = document.createElement("p"); hint.textContent = items.length > 1 ? `${portrait ? "上下" : "左右"}滑動，探索下一支作品` : "點選播放影片";
      status.append(position, hint);
      const next = document.createElement("button"); next.type = "button"; next.textContent = portrait ? "↓" : "→"; next.setAttribute("aria-label", `${name}：下一支影片`);
      controls.append(previous, status, next); stage.append(controls);
      const direct = document.createElement("a"); direct.className = "video-direct"; direct.textContent = "單獨播放 ↗"; direct.target = "_blank"; direct.rel = "noopener";
      stage.append(direct); section.append(heading, stage); gallery.append(section);

      let current = 0, visible = false, loadedSource = "", generation = 0;
      let frameCallback = null, frameTimer = null;
      function clearFrameCheck() {
        if (frameCallback !== null) player.cancelVideoFrameCallback?.(frameCallback);
        if (frameTimer !== null) clearTimeout(frameTimer);
        frameCallback = frameTimer = null;
      }
      function confirmVisibleFrame() {
        clearFrameCheck();
        if (!player.requestVideoFrameCallback) { cover.hidden = true; loading.hidden = true; return; }
        const selectedGeneration = generation;
        screen.dataset.videoFrame = "pending";
        frameCallback = player.requestVideoFrameCallback((_, metadata) => {
          frameCallback = null;
          if (generation !== selectedGeneration) return;
          if (frameTimer !== null) clearTimeout(frameTimer);
          frameTimer = null;
          screen.dataset.videoFrame = "ready";
          screen.dataset.frameTime = String(metadata.mediaTime);
          cover.hidden = true; loading.hidden = true;
        });
        frameTimer = setTimeout(() => {
          frameTimer = null;
          const rect = screen.getBoundingClientRect();
          const onScreen = rect.bottom > 0 && rect.top < innerHeight && rect.right > 0 && rect.left < innerWidth;
          if (generation !== selectedGeneration || player.paused || player.readyState < 2 || player.currentTime < 0.1 || !onScreen || document.visibilityState !== "visible") return;
          player.pause();
          message.textContent = "畫面載入失敗，請重新載入影片。";
          fallback.hidden = false;
        }, 4000);
      }
      function prepareNext() {
        if (visible && document.body.dataset.category === "film" && player.readyState >= 3) prefetchVideo(items[current + 1]?.source);
      }
      function ensureLoaded() {
        if (!visible || document.body.dataset.category !== "film") return;
        const item = items[current];
        if (item.source && loadedSource !== item.source) {
          loadedSource = item.source; player.src = item.source; player.load();
        } else if (item.embed && iframe && iframe.getAttribute("src") !== item.embed) {
          iframe.src = item.embed;
        }
        prepareNext();
      }
      function select(index, userInitiated = false) {
        const selected = Math.max(0, Math.min(items.length - 1, index));
        const changed = selected !== current;
        generation += 1; current = selected;
        clearFrameCheck(); player.pause(); loading.hidden = fallback.hidden = true;
        message.textContent = "影片暫時無法播放。";
        if (iframe) { iframe.removeAttribute("src"); iframe.hidden = true; }
        const item = items[current];
        screen.dataset.videoIndex = String(current);
        screen.dataset.videoSource = item.source || item.embed;
        player.setAttribute("aria-label", item.label);
        if (item.poster) player.poster = item.poster; else player.removeAttribute("poster");
        if (item.poster) cover.src = item.poster; else cover.removeAttribute("src");
        cover.hidden = !item.source || !item.poster;
        playButton.hidden = !item.source;
        screen.dataset.videoFrame = "poster";
        delete screen.dataset.frameTime;
        if (item.width > 0 && item.height > 0) { player.width = item.width; player.height = item.height; }
        player.hidden = !item.source;
        if (iframe) { iframe.hidden = !item.embed; iframe.title = item.label; }
        if (changed) {
          loadedSource = "";
          if (!item.source) { player.removeAttribute("src"); player.load(); }
        }
        caption.textContent = item.category || "影片作品";
        position.textContent = `${String(current + 1).padStart(2, "0")} / ${String(items.length).padStart(2, "0")}`;
        previous.disabled = current === 0; next.disabled = current === items.length - 1;
        previous.hidden = next.hidden = items.length < 2;
        direct.href = item.source || item.embed;
        if (changed && swipeHint) swipeHint.hidden = true;
        if (userInitiated) visible = true;
        ensureLoaded();
      }
      function move(delta) {
        const selected = Math.max(0, Math.min(items.length - 1, current + delta));
        if (selected === current) return false;
        select(selected, true); return true;
      }
      previous.addEventListener("click", () => move(-1)); next.addEventListener("click", () => move(1));
      player.addEventListener("canplay", prepareNext);
      player.addEventListener("waiting", () => { loading.hidden = false; });
      ["canplay", "pause", "ended", "error"].forEach(event => player.addEventListener(event, () => { loading.hidden = true; }));
      ["pause", "ended", "error"].forEach(event => player.addEventListener(event, clearFrameCheck));
      player.addEventListener("playing", confirmVisibleFrame);
      player.addEventListener("play", () => {
        playButton.hidden = true;
        gallery.querySelectorAll("video").forEach(other => { if (other !== player) other.pause(); });
      });
      player.addEventListener("error", () => { if (player.hasAttribute("src")) fallback.hidden = false; });
      playButton.addEventListener("click", () => {
        visible = true; ensureLoaded();
        player.play().catch(() => { playButton.hidden = false; });
      });
      retry.addEventListener("click", () => {
        const selectedGeneration = generation;
        fallback.hidden = true; player.load();
        player.play().catch(() => { if (selectedGeneration === generation) fallback.hidden = false; });
      });

      // Gestures change the source, never the position of a playing video surface.
      let start, suppressClick = false;
      screen.addEventListener("pointerdown", event => {
        const rect = screen.getBoundingClientRect();
        if (event.button !== 0 || event.clientY > rect.bottom - 56) return;
        start = {id: event.pointerId, x: event.clientX, y: event.clientY};
      });
      screen.addEventListener("pointerup", event => {
        if (!start || start.id !== event.pointerId) return;
        const dx = event.clientX - start.x, dy = event.clientY - start.y;
        start = null;
        const axis = portrait ? dy : dx, cross = portrait ? dx : dy;
        if (Math.abs(axis) < 40 || Math.abs(axis) < Math.abs(cross) * 1.2) return;
        suppressClick = true; event.preventDefault();
        if (!move(axis < 0 ? 1 : -1) && portrait) window.scrollBy({top: -dy, behavior: "smooth"});
      });
      screen.addEventListener("pointercancel", () => { start = null; });
      screen.addEventListener("click", event => {
        if (suppressClick) { suppressClick = false; event.preventDefault(); event.stopPropagation(); }
      }, true);
      let wheelTotal = 0, lastWheel = 0, wheelLock = 0;
      screen.addEventListener("wheel", event => {
        if (event.ctrlKey) return;
        const axis = portrait ? event.deltaY : event.deltaX;
        const cross = portrait ? event.deltaX : event.deltaY;
        if (!axis || Math.abs(axis) < Math.abs(cross)) return;
        const direction = axis > 0 ? 1 : -1;
        if ((direction < 0 && current === 0) || (direction > 0 && current === items.length - 1)) return;
        event.preventDefault();
        const now = Date.now();
        if (now < wheelLock) return;
        if (now - lastWheel > 160) wheelTotal = 0;
        lastWheel = now; wheelTotal += axis;
        if (Math.abs(wheelTotal) >= 40) { move(wheelTotal > 0 ? 1 : -1); wheelTotal = 0; wheelLock = now + 500; }
      }, {passive: false});
      screen.addEventListener("keydown", event => {
        if (event.target !== screen) return;
        const backward = portrait ? "ArrowUp" : "ArrowLeft", forward = portrait ? "ArrowDown" : "ArrowRight";
        if (event.key === backward || event.key === forward) { event.preventDefault(); move(event.key === backward ? -1 : 1); }
      });
      if ("IntersectionObserver" in window) {
        new IntersectionObserver(entries => { visible = entries[0].isIntersecting; ensureLoaded(); }, {rootMargin: "120px 0px"}).observe(stage);
      } else { visible = true; }
      window.addEventListener("hashchange", () => {
        if (document.body.dataset.category === "film") ensureLoaded();
        else { player.pause(); if (iframe) iframe.removeAttribute("src"); }
      });
      select(0);
    });
    if (groups.size) document.getElementById("film-empty").hidden = true;
  };
})();
