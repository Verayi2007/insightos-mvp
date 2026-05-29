(function () {
  const data = window.INSIGHTOS_SAMPLE;
  const state = {
    view: "today",
    query: "",
    theme: "全部",
    selectedArticleId: data.articles[0].id,
    selectedNodeId: "低价策略"
  };

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => Array.from(document.querySelectorAll(selector));

  const colors = {
    theme: "#0f766e",
    entity: "#2563eb",
    industry: "#c2410c",
    edge: "#9aa4b2"
  };

  function unique(values) {
    return [...new Set(values.filter(Boolean))];
  }

  function getThemes() {
    return unique(data.articles.flatMap((article) => article.themes));
  }

  function getEntities() {
    return unique(data.articles.flatMap((article) => article.entities));
  }

  function getIndustries() {
    return unique(data.articles.map((article) => article.industry));
  }

  function filteredArticles() {
    const query = state.query.trim().toLowerCase();
    return data.articles.filter((article) => {
      const matchesTheme = state.theme === "全部" || article.themes.includes(state.theme);
      const haystack = [article.title, article.industry, article.thesis, article.lesson, ...article.entities, ...article.themes]
        .join(" ")
        .toLowerCase();
      return matchesTheme && (!query || haystack.includes(query));
    });
  }

  function frequency(items) {
    return items.reduce((acc, item) => {
      acc[item] = (acc[item] || 0) + 1;
      return acc;
    }, {});
  }

  function topEntries(items, limit = 6) {
    return Object.entries(frequency(items))
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "zh-CN"))
      .slice(0, limit);
  }

  function setView(view) {
    state.view = view;
    $$(".view").forEach((element) => element.classList.remove("view-active"));
    $(`#${view}-view`).classList.add("view-active");
    $$(".nav-button").forEach((button) => button.classList.toggle("active", button.dataset.view === view));
    const titleMap = {
      today: "今日消化",
      articles: "文章卡片",
      graph: "主题图谱",
      review: "每周复盘"
    };
    $("#view-title").textContent = titleMap[view];
  }

  function renderMetrics() {
    const themeCount = getThemes().length;
    const entityCount = getEntities().length;
    const industryCount = getIndustries().length;
    const cards = [
      ["知识库条目", data.source.kbContentCount, "ima 已验证"],
      ["MVP 样本", data.articles.length, data.source.sampleScope],
      ["主题节点", themeCount, "由标题级样本归纳"],
      ["实体节点", entityCount, `${industryCount} 个行业视角`]
    ];
    $("#metrics").innerHTML = cards
      .map(
        ([label, value, hint]) => `
          <article class="metric-card">
            <span>${label}</span>
            <strong>${value}</strong>
            <p>${hint}</p>
          </article>
        `
      )
      .join("");
  }

  function renderToday() {
    const topThemes = topEntries(data.articles.flatMap((article) => article.themes), 4);
    const topIndustries = topEntries(data.articles.map((article) => article.industry), 4);
    const insights = [
      `消费和零售样本最密集，${topIndustries[0][0]}、${topIndustries[1][0]}共同指向“价格带重新分化”。`,
      `高频主题集中在${topThemes.map(([theme]) => theme).join("、")}，说明当前阅读材料更偏商业模型拆解。`,
      "AI、平台、连锁和供应链都出现了同一个判断框架：先拆成本结构，再看增长是否可复制。"
    ];
    $("#insight-list").innerHTML = insights.map((text) => `<article class="insight-item">${text}</article>`).join("");

    const questions = [
      "如果一个品牌靠低价增长，哪三个指标能证明它不是短期促销？",
      "当平台开始提高抽佣，生态里最先承压的是商家、用户还是监管关系？",
      "一个内容型品牌转型电商时，哪些资产可以迁移，哪些能力必须重建？"
    ];
    $("#daily-questions").innerHTML = questions.map((question) => `<li>${question}</li>`).join("");

    $("#recent-articles").innerHTML = data.articles
      .slice(0, 5)
      .map(
        (article) => `
          <button class="mini-article" data-article-id="${article.id}" type="button">
            <strong>${article.entities[0]}</strong>
            <span>${article.themes.slice(0, 2).join(" · ")}</span>
          </button>
        `
      )
      .join("");
  }

  function renderThemeFilters() {
    const themes = ["全部", ...getThemes()];
    $("#theme-filters").innerHTML = themes
      .map(
        (theme) => `
          <button class="chip ${theme === state.theme ? "chip-active" : ""}" data-theme="${theme}" type="button">${theme}</button>
        `
      )
      .join("");
  }

  function renderArticleList() {
    const articles = filteredArticles();
    $("#article-list").innerHTML = articles
      .map(
        (article) => `
          <button class="article-card ${article.id === state.selectedArticleId ? "article-card-active" : ""}" data-article-id="${article.id}" type="button">
            <span class="card-meta">${article.industry} · ${article.folder}</span>
            <strong>${article.title}</strong>
            <p>${article.thesis}</p>
            <span class="tag-line">${article.themes.slice(0, 3).join(" / ")}</span>
          </button>
        `
      )
      .join("");
    if (!articles.some((article) => article.id === state.selectedArticleId) && articles[0]) {
      state.selectedArticleId = articles[0].id;
    }
    renderArticleDetail();
  }

  function renderArticleDetail() {
    const article = data.articles.find((item) => item.id === state.selectedArticleId) || data.articles[0];
    $("#article-detail").innerHTML = `
      <div class="detail-kicker">${article.industry}</div>
      <h3>${article.entities[0]}</h3>
      <p class="detail-title">${article.title}</p>
      <div class="detail-block">
        <span>核心论点</span>
        <p>${article.thesis}</p>
      </div>
      <div class="detail-block">
        <span>决策启发</span>
        <p>${article.lesson}</p>
      </div>
      <div class="tag-cloud">
        ${article.entities.map((entity) => `<button data-node-id="${entity}" type="button">${entity}</button>`).join("")}
        ${article.themes.map((theme) => `<button data-node-id="${theme}" type="button">${theme}</button>`).join("")}
      </div>
    `;
  }

  function buildGraph() {
    const themeCounts = frequency(data.articles.flatMap((article) => article.themes));
    const entityCounts = frequency(data.articles.flatMap((article) => article.entities));
    const industryCounts = frequency(data.articles.map((article) => article.industry));
    const themeNodes = Object.entries(themeCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([id, count], index) => ({
        id,
        label: id,
        type: "theme",
        count,
        x: 220 + (index % 5) * 122,
        y: 130 + Math.floor(index / 5) * 142
      }));
    const entityNodes = Object.entries(entityCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([id, count], index) => ({
        id,
        label: id,
        type: "entity",
        count,
        x: 90 + (index % 2) * 730,
        y: 80 + index * 39
      }));
    const industryNodes = Object.entries(industryCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([id, count], index) => ({
        id,
        label: id,
        type: "industry",
        count,
        x: 270 + index * 94,
        y: 440
      }));
    const nodes = [...themeNodes, ...entityNodes, ...industryNodes];
    const nodeIds = new Set(nodes.map((node) => node.id));
    const edges = [];
    data.articles.forEach((article) => {
      article.entities.forEach((entity) => {
        article.themes.forEach((theme) => {
          if (nodeIds.has(entity) && nodeIds.has(theme)) edges.push([entity, theme]);
        });
      });
      article.themes.forEach((theme) => {
        if (nodeIds.has(theme) && nodeIds.has(article.industry)) edges.push([theme, article.industry]);
      });
    });
    return { nodes, edges };
  }

  function renderGraph() {
    const svg = $("#knowledge-graph");
    const { nodes, edges } = buildGraph();
    const byId = Object.fromEntries(nodes.map((node) => [node.id, node]));
    const edgeMarkup = edges
      .map(([from, to]) => {
        const a = byId[from];
        const b = byId[to];
        if (!a || !b) return "";
        return `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" class="graph-edge" />`;
      })
      .join("");
    const nodeMarkup = nodes
      .map((node) => {
        const radius = 18 + Math.min(node.count, 4) * 4;
        const active = node.id === state.selectedNodeId ? " graph-node-active" : "";
        return `
          <g class="graph-node${active}" data-node-id="${node.id}" tabindex="0" role="button" aria-label="${node.label}">
            <circle cx="${node.x}" cy="${node.y}" r="${radius}" fill="${colors[node.type]}" />
            <text x="${node.x}" y="${node.y + radius + 18}" text-anchor="middle">${node.label}</text>
          </g>
        `;
      })
      .join("");
    svg.innerHTML = `<g>${edgeMarkup}</g><g>${nodeMarkup}</g>`;
    renderNodeDetail();
  }

  function renderNodeDetail() {
    const node = state.selectedNodeId;
    const related = data.articles.filter(
      (article) => article.entities.includes(node) || article.themes.includes(node) || article.industry === node
    );
    const fallback = data.articles.slice(0, 3);
    const list = related.length ? related : fallback;
    $("#node-detail").innerHTML = `
      <div class="detail-kicker">Graph node</div>
      <h3>${node}</h3>
      <p class="detail-title">${related.length || fallback.length} 张卡片与该节点相关</p>
      <div class="node-articles">
        ${list
          .map(
            (article) => `
              <button data-article-id="${article.id}" type="button">
                <strong>${article.entities[0]}</strong>
                <span>${article.lesson}</span>
              </button>
            `
          )
          .join("")}
      </div>
    `;
  }

  function renderReview() {
    const topThemes = topEntries(data.articles.flatMap((article) => article.themes), 8);
    const topEntities = topEntries(data.articles.flatMap((article) => article.entities), 6);
    $("#weekly-review").innerHTML = `
      <div class="review-summary">
        <p>本周样本显示，阅读重心集中在消费分层、低价零售、连锁模型和 AI 商业化。最值得追踪的不是单个品牌爆红，而是“低价是否可持续”“渠道是否可复制”“情绪消费是否有复购”这三条判断线。</p>
      </div>
      <div class="rank-grid">
        <div>
          <h4>高频主题</h4>
          ${topThemes.map(([theme, count]) => `<span class="rank-item">${theme}<b>${count}</b></span>`).join("")}
        </div>
        <div>
          <h4>高频实体</h4>
          ${topEntities.map(([entity, count]) => `<span class="rank-item">${entity}<b>${count}</b></span>`).join("")}
        </div>
      </div>
    `;
    const decisions = [
      ["什么时候低价是护城河？", "当低价来自结构性成本优势，而不是补贴或营销预算。"],
      ["品牌转型要先看什么？", "看旧业务里能迁移到新场景的信任、内容、渠道和组织能力。"],
      ["平台利润率升高一定好吗？", "不一定，抽佣提高可能同步放大监管、商家流失和用户体验问题。"],
      ["AI 生意如何识别伪需求？", "把兴奋点拆成效率提升、替代能力和套利窗口，重点看复购。"]
    ];
    $("#decision-bank").innerHTML = decisions
      .map(
        ([question, answer]) => `
          <article class="decision-item">
            <strong>${question}</strong>
            <p>${answer}</p>
          </article>
        `
      )
      .join("");
  }

  function bindEvents() {
    $$(".nav-button").forEach((button) => button.addEventListener("click", () => setView(button.dataset.view)));
    $("#search-input").addEventListener("input", (event) => {
      state.query = event.target.value;
      renderArticleList();
    });
    $("#generate-review").addEventListener("click", () => {
      setView("review");
      renderReview();
    });
    document.addEventListener("click", (event) => {
      const articleButton = event.target.closest("[data-article-id]");
      if (articleButton) {
        state.selectedArticleId = articleButton.dataset.articleId;
        renderArticleList();
        setView("articles");
      }
      const themeButton = event.target.closest("[data-theme]");
      if (themeButton) {
        state.theme = themeButton.dataset.theme;
        renderThemeFilters();
        renderArticleList();
      }
      const nodeButton = event.target.closest("[data-node-id]");
      if (nodeButton) {
        state.selectedNodeId = nodeButton.dataset.nodeId;
        renderGraph();
        setView("graph");
      }
    });
  }

  function init() {
    renderMetrics();
    renderToday();
    renderThemeFilters();
    renderArticleList();
    renderGraph();
    renderReview();
    bindEvents();
  }

  init();
})();
