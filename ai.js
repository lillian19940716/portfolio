(() => {
  "use strict";
  const websiteClosers = new Set();
  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }
  function localImage(value) {
    if (typeof value !== "string") return null;
    try {
      const url = new URL(value, location.href);
      const directory = new URL("./assets/ai/", location.href);
      return url.origin === location.origin && url.pathname.startsWith(directory.pathname) && /\.(jpe?g|png|webp)$/i.test(url.pathname) ? url.href : null;
    } catch { return null; }
  }
  function webLink(value) {
    try {
      const url = new URL(value);
      return url.protocol === "https:" ? url.href : null;
    } catch { return null; }
  }
  function localVideo(value) {
    if (typeof value !== "string") return null;
    try {
      const url = new URL(value, location.href);
      const directory = new URL("./assets/ai/", location.href);
      return url.origin === location.origin && url.pathname.startsWith(directory.pathname) && /\.mp4$/i.test(url.pathname) ? url.href : null;
    } catch { return null; }
  }
  window.suspendPortfolioAI = () => {
    websiteClosers.forEach(close => close());
    document.querySelectorAll("#ai video[src]").forEach(video => {
      video.pause(); video.removeAttribute("src"); video.load();
      video.closest(".ai-demo-frame").querySelector("button").hidden = false;
    });
  };
  function renderImages(images, group, container, layout) {
    const grid = element("div", "ai-image-grid");
    if (layout === "wide") grid.classList.add("is-wide");
    images.forEach(item => {
      const src = localImage(item.src), preview = localImage(item.preview);
      if (!src || !preview) return;
      const figure = element("figure", "ai-image");
      const link = element("a", "ai-image-link"); link.href = src; link.dataset.viewer = group;
      link.setAttribute("aria-label", `放大${item.alt}`);
      const image = element("img"); image.src = preview; image.alt = item.alt;
      image.width = item.width; image.height = item.height; image.loading = "lazy"; image.decoding = "async";
      link.append(image); figure.append(link);
      if (item.caption) figure.append(element("figcaption", "", item.caption));
      grid.append(figure);
    });
    if (grid.children.length) container.append(grid);
  }
  function renderWebsite(website, projectId, container) {
    const href = webLink(website.href);
    if (!href) return;
    const block = element("section", "ai-website");
    block.append(element("h4", "ai-gallery-title", "專案網站"));
    if (website.cover) renderImages([website.cover], `${projectId}-website`, block, "wide");
    const cover = block.querySelector(".ai-image-grid");
    const controls = element("div", "ai-website-controls");
    const button = element("button", "", "站內預覽"); button.type = "button";
    button.setAttribute("aria-expanded", "false");
    const external = element("a", "", "另開網站 ↗"); external.href = href; external.target = "_blank"; external.rel = "noopener noreferrer";
    controls.append(button, external);
    if (cover) cover.before(controls); else block.append(controls);
    const preview = element("div", "ai-website-preview"); preview.id = `${projectId}-website-preview`; preview.hidden = true;
    button.setAttribute("aria-controls", preview.id);
    const close = () => {
      preview.replaceChildren(); preview.hidden = true; preview.removeAttribute("data-loaded");
      if (cover) cover.hidden = false;
      button.setAttribute("aria-expanded", "false"); button.textContent = "站內預覽";
    };
    websiteClosers.add(close);
    button.addEventListener("click", () => {
      if (!preview.hidden) { close(); return; }
      const frame = element("iframe"); frame.src = href; frame.title = website.title || "專案網站預覽";
      frame.referrerPolicy = "no-referrer"; frame.allow = "fullscreen";
      frame.addEventListener("load", () => { preview.dataset.loaded = "true"; });
      preview.append(frame); preview.hidden = false;
      if (cover) cover.hidden = true;
      button.setAttribute("aria-expanded", "true"); button.textContent = "關閉預覽";
    });
    block.append(preview); container.append(block);
  }
  function renderClips(clips, workflow, container) {
    clips.forEach(clip => {
      const src = localVideo(clip.src), poster = localImage(clip.poster);
      if (!src || !poster) return;
      const figure = element("figure", "ai-demo");
      figure.append(element("figcaption", "", clip.label));
      const frame = element("div", "ai-demo-frame"); frame.style.aspectRatio = `${clip.width} / ${clip.height}`;
      const video = element("video"); video.controls = true; video.playsInline = true; video.preload = "none"; video.poster = poster;
      video.width = clip.width; video.height = clip.height; video.setAttribute("aria-label", `${workflow.title}：${clip.label}`);
      const play = element("button", "ai-demo-play", "▶"); play.type = "button"; play.setAttribute("aria-label", `播放${workflow.title}：${clip.label}`);
      const error = element("p", "ai-demo-error", "影片暫時無法播放，請使用下方的「另開影片」。"); error.hidden = true;
      play.addEventListener("click", () => {
        error.hidden = true; video.src = src; video.load();
        video.play().then(() => { play.hidden = true; }).catch(() => { error.hidden = false; });
      });
      video.addEventListener("play", () => {
        document.querySelectorAll("#ai video[src]").forEach(other => {
          if (other !== video) {
            other.pause(); other.removeAttribute("src"); other.load();
            other.closest(".ai-demo-frame").querySelector("button").hidden = false;
          }
        });
        play.hidden = true;
      });
      video.addEventListener("error", () => { if (video.hasAttribute("src")) { error.hidden = false; play.hidden = false; } });
      frame.append(video, play, error); figure.append(frame);
      const direct = element("a", "ai-demo-direct", "另開影片 ↗"); direct.href = src; direct.target = "_blank"; direct.rel = "noopener";
      figure.append(direct); container.append(figure);
    });
  }
  function renderWorkflows(workflows, projectId, container) {
    workflows.forEach(workflow => {
      const section = element("section", "ai-workflow"); section.id = `ai-workflow-${workflow.id}`;
      const heading = element("header", "ai-workflow-heading");
      heading.append(element("h4", "", workflow.title));
      if (workflow.showSource !== false) heading.append(element("span", "ai-source", workflow.source.label));
      section.append(heading);
      if (workflow.summary) section.append(element("p", "ai-workflow-summary", workflow.summary));
      if (workflow.steps?.length) {
        const steps = element("ol", "ai-flow-steps"); steps.setAttribute("aria-label", `${workflow.title}流程`);
        workflow.steps.forEach(text => steps.append(element("li", "", text))); section.append(steps);
      }
      renderImages(workflow.images || [], `${projectId}-${workflow.id}`, section, "wide");
      renderClips(workflow.videos || [], workflow, section); container.append(section);
    });
  }
  function renderProject(project, container) {
    const article = element("article", "ai-project"); article.id = `ai-project-${project.id}`;
    const header = element("header", "ai-project-heading");
    const heading = element("h3", "", project.title); heading.id = `${article.id}-title`;
    article.setAttribute("aria-labelledby", heading.id);
    const source = project.source || {label: "作品來源待補充"};
    header.append(heading);
    if (project.showSource !== false) header.append(element("span", "ai-source", source.label));
    article.append(header);
    article.append(element("p", "ai-project-summary", project.summary));
    if (project.images?.length) {
      article.append(element("h4", "ai-gallery-title", "最終成品"));
      renderImages(project.images, `${project.id}-final`, article);
    }
    if (project.website) renderWebsite(project.website, project.id, article);
    if (project.workflows?.length) renderWorkflows(project.workflows, project.id, article);

    if (project.showRoles !== false && (project.aiRole || project.humanRole)) {
      const roles = element("dl", "ai-roles");
      for (const [label, text] of [["AI 協助", project.aiRole], ["設計整合", project.humanRole]]) {
        if (!text) continue;
        const row = element("div"); row.append(element("dt", "", label), element("dd", "", text)); roles.append(row);
      }
      article.append(roles);
    }
    const process = (project.process || []).filter(step => (step.images || []).length || step.text);
    if (process.length) {
      const details = element("details", "ai-process");
      details.open = project.processOpen === true;
      details.append(element("summary", "", "AI 提案與製作過程"));
      process.forEach((step, index) => {
        const block = element("section", "ai-process-step");
        if (step.layout === "compact-strip") block.classList.add("is-compact");
        block.append(element("h4", "", step.title));
        if (step.text) block.append(element("p", "", step.text));
        renderImages(step.images || [], `${project.id}-process-${index}`, block);
        details.append(block);
      }); article.append(details);
    }
    if (project.beforeAfter?.before && project.beforeAfter?.after) {
      const comparison = element("section", "ai-comparison");
      comparison.append(element("h4", "", project.beforeAfter.title || "原始影像與調整成果"));
      renderImages([project.beforeAfter.before, project.beforeAfter.after], `${project.id}-comparison`, comparison);
      article.append(comparison);
    }
    const links = (project.links || []).map(link => ({...link, href: webLink(link.href)})).filter(link => link.href && link.label);
    if (links.length) {
      const list = element("div", "ai-links");
      links.forEach(item => {
        const link = element("a", "", `${item.label} ↗`); link.href = item.href; link.target = "_blank"; link.rel = "noopener noreferrer"; list.append(link);
      }); article.append(list);
    }
    // Videos remain explicit, opt-in links until a project's actual media is supplied.
    if (project.video?.href && project.video?.label) {
      const href = webLink(project.video.href);
      if (href) {
        const link = element("a", "ai-video-link", `${project.video.label} ↗`); link.href = href; link.target = "_blank"; link.rel = "noopener noreferrer"; article.append(link);
      }
    }
    container.append(article); return article;
  }
  window.renderPortfolioAI = ({sections = [], projects = []} = {}) => {
    window.suspendPortfolioAI(); websiteClosers.clear();
    const gallery = document.getElementById("ai-gallery");
    gallery.replaceChildren();
    sections.forEach(definition => {
      const section = element("section", "ai-section"); section.id = `ai-${definition.id}`;
      const header = element("header", "ai-section-heading");
      header.append(element("p", "eyebrow", `${definition.number} / ${definition.english}`));
      const heading = element("h2", "", definition.title); heading.id = `${section.id}-title`;
      header.append(heading); section.setAttribute("aria-labelledby", heading.id); section.append(header);
      if (definition.description) section.append(element("p", "ai-section-description", definition.description));
      const items = projects.filter(project => project.section === definition.id && project.published === true);
      if (items.length) {
        items.forEach(project => renderProject(project, section));
      } else {
        const pending = element("div", "ai-pending");
        pending.append(element("p", "ai-pending-label", "內容整理中"));
        if (definition.pending) pending.append(element("p", "", definition.pending));
        section.append(pending);
      }
      gallery.append(section);
    });
  };
})();
