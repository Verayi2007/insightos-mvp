(function () {
  const data = window.INSIGHTOS_SAMPLE;
  const state = {
    view: "today",
    query: "",
    modelFilter: "全部",
    selectedArticleId: data.articles[0].id,
    selectedModel: data.decisionModels[0].name,
    selectedInstitution: data.institutions[0].name
  };

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => Array.from(document.querySelectorAll(selector));

  function unique(values) {
    return [...new Set(values.filter(Boolean))];
  }

  function countBy(values) {
    return values.reduce((acc, value) => {
      acc[value] = (acc[value] || 0) + 1;
      return acc;
    }, {});
  }

  function articlesForModel(name) {
    return data.articles.filter((article) => article.decisionModels.includes(name));
  }

  function articlesForInstitution(name) {
    return data.articles.filter((article) => article.institutions.includes(name));
  }

  function articleById(id) {
    return data.articles.find((article) => article.id === id) || data.articles[0];
  }

  function modelByName(name) {
    return data.decisionModels.find((model) => model.name === name) || data.decisionModels[0];
  }

  function institutionByName(name) {
    return data.institutions.find((institution) => institution.name === name) || data.institutions[0];
  }

  function allModels() {
    return unique(data.articles.flatMap((article) => article.decisionModels));
  }

  function allInstitutions() {
    return unique(data.articles.flatMap((article) => article.institutions));
  }

  function articleSearchText(article) {
    return [
      article.title,
      article.industry,
      article.thesis,
      article.lesson,
      ...article.decisionModels,
      ...article.institutions
    ].join(" ");
  }

  function filteredArticles() {
    const query = state.query.trim().toLowerCase();
    return data.articles.filter((article) => {
      const matchesModel = state.modelFilter === "全部" || article.decisionModels.includes(state.modelFilter);
      const matchesQuery = !query || articleSearchText(article).toLowerCase().includes(query);
      return matchesModel && matchesQuery;
    });
  }

  function filteredModels() {
    const query = state.query.trim().toLowerCase();
    if (!query) return data.decisionModels;
    return data.decisionModels.filter((model) => {
      const relatedTitles = articlesForModel(model.name).map((article) => article.title).join(" ");
      return [model.name, model.category, model.definition, ...model.signals, ...model.questions, relatedTitles]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }

  function filteredInstitutions() {
    const query = state.query.trim().toLowerCase();
    if (!query) return data.institutions;
    return data.institutions.filter((institution) => {
      const relatedTitles = articlesForInstitution(institution.name).map((article) => article.title).join(" ");
      return [institution.name, institution.type, institution.role, ...institution.evidence, ...institution.tags, relatedTitles]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }

  function topEntries(values, limit) {
    return Object.entries(countBy(values))
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "zh-CN"))
      .slice(0, limit);
  }

  function renderCountPill(count, noun) {
    return `<span class="count-pill">${count} ${noun}</span>`;
  }

  function setView(view) {
    state.view = view;
    $$(".view").forEach((element) => element.classList.remove("view-active"));
    $(`#${view}-view`).classList.add("view-active");
    $$(".nav-button").forEach((button) => button.classList.toggle("active", button.dataset.view === view));
    const titleMap = {
      today: "今日重点",
      articles: "文章卡片",
      models: "决策模型",
      institutions: "机构报告"
    };
    $("#view-title").textContent = titleMap[view];
  }

  function renderMetrics() {
    const cards = [
      ["文章样本", data.articles.length, "虚构 demo，不含真实正文"],
      ["决策模型", data.decisionModels.length, "从文章论证方式中抽取"],
      ["机构/报告", data.institutions.length, "咨询、投研、财报、白皮书"],
      ["关联索引", allModels().length + allInstitutions().length, "点击即可看到子目录文章"]
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
    const topModels = topEntries(data.articles.flatMap((article) => article.decisionModels), 3);
    const reportCount = data.institutions.filter((institution) => institution.type.includes("报告") || institution.type.includes("财报")).length;
    const insights = [
      `当前 MVP 已从主题图谱转向“索引式消化”：先提取 ${data.decisionModels.length} 个思维决策模型，再把相关文章归入模型子目录。`,
      `高频模型是 ${topModels.map(([name]) => name).join("、")}。这些模型比自由网络图更适合复盘，因为它们直接指向判断方式。`,
      `机构/报告库已区分咨询机构、投资机构、研究报告、财报观察等类型，其中报告类来源 ${reportCount} 个，便于后续做出处追踪。`
    ];

    $("#insight-list").innerHTML = insights.map((text) => `<article class="insight-item">${text}</article>`).join("");

    const questions = [
      "这篇文章背后的判断框架是什么？它能否迁移到别的行业？",
      "文章引用的机构、财报或报告是作为证据、观点来源，还是权威背书？",
      "同一个模型下的多篇文章，是否得出了相同结论，还是存在冲突？"
    ];
    $("#daily-questions").innerHTML = questions.map((question) => `<li>${question}</li>`).join("");

    const focusItems = [
      ...topEntries(data.articles.flatMap((article) => article.decisionModels), 3).map(([name, count]) => ({
        type: "模型",
        name,
        count,
        action: "model"
      })),
      ...topEntries(data.articles.flatMap((article) => article.institutions), 2).map(([name, count]) => ({
        type: "机构",
        name,
        count,
        action: "institution"
      }))
    ];

    $("#focus-strip").innerHTML = focusItems
      .map(
        (item) => `
          <button class="mini-article" data-${item.action}="${item.name}" type="button">
            <strong>${item.name}</strong>
            <span>${item.type} · ${item.count} 篇文章</span>
          </button>
        `
      )
      .join("");
  }

  function renderModelFilters() {
    const models = ["全部", ...allModels()];
    $("#model-filters").innerHTML = models
      .map(
        (model) => `
          <button class="chip ${model === state.modelFilter ? "chip-active" : ""}" data-model-filter="${model}" type="button">
            ${model}
          </button>
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
            <span class="tag-line">${article.decisionModels.slice(0, 2).join(" / ")}</span>
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
    const article = articleById(state.selectedArticleId);
    $("#article-detail").innerHTML = `
      <div class="detail-kicker">${article.industry}</div>
      <h3>${article.title}</h3>
      <div class="detail-block">
        <span>核心论点</span>
        <p>${article.thesis}</p>
      </div>
      <div class="detail-block">
        <span>决策启发</span>
        <p>${article.lesson}</p>
      </div>
      <div class="detail-block">
        <span>提取到的模型</span>
        <div class="tag-cloud">
          ${article.decisionModels.map((model) => `<button data-model="${model}" type="button">${model}</button>`).join("")}
        </div>
      </div>
      <div class="detail-block">
        <span>涉及机构/报告</span>
        <div class="tag-cloud">
          ${article.institutions.map((institution) => `<button data-institution="${institution}" type="button">${institution}</button>`).join("")}
        </div>
      </div>
    `;
  }

  function renderModelList() {
    const models = filteredModels();
    $("#model-list").innerHTML = models
      .map((model) => {
        const related = articlesForModel(model.name);
        return `
          <button class="catalog-card ${model.name === state.selectedModel ? "catalog-card-active" : ""}" data-model="${model.name}" type="button">
            <span class="card-meta">${model.category}</span>
            <strong>${model.name}</strong>
            <p>${model.definition}</p>
            ${renderCountPill(related.length, "篇文章")}
          </button>
        `;
      })
      .join("");

    if (!models.some((model) => model.name === state.selectedModel) && models[0]) {
      state.selectedModel = models[0].name;
    }
    renderModelDetail();
  }

  function renderModelDetail() {
    const model = modelByName(state.selectedModel);
    const related = articlesForModel(model.name);
    $("#model-detail").innerHTML = `
      <div class="detail-kicker">${model.category}</div>
      <h3>${model.name}</h3>
      <p class="detail-title">${model.definition}</p>
      <div class="detail-block">
        <span>识别信号</span>
        <div class="evidence-list">
          ${model.signals.map((signal) => `<span>${signal}</span>`).join("")}
        </div>
      </div>
      <div class="detail-block">
        <span>复盘问题</span>
        <ol class="compact-list">
          ${model.questions.map((question) => `<li>${question}</li>`).join("")}
        </ol>
      </div>
      <div class="detail-block">
        <span>子目录：相关文章</span>
        <div class="linked-articles">
          ${related
            .map(
              (article) => `
                <button data-article-id="${article.id}" type="button">
                  <strong>${article.title}</strong>
                  <span>${article.industry} · ${article.lesson}</span>
                </button>
              `
            )
            .join("")}
        </div>
      </div>
    `;
  }

  function renderInstitutionList() {
    const institutions = filteredInstitutions();
    $("#institution-list").innerHTML = institutions
      .map((institution) => {
        const related = articlesForInstitution(institution.name);
        return `
          <button class="catalog-card ${institution.name === state.selectedInstitution ? "catalog-card-active" : ""}" data-institution="${institution.name}" type="button">
            <span class="card-meta">${institution.type}</span>
            <strong>${institution.name}</strong>
            <p>${institution.role}</p>
            ${renderCountPill(related.length, "篇文章")}
          </button>
        `;
      })
      .join("");

    if (!institutions.some((institution) => institution.name === state.selectedInstitution) && institutions[0]) {
      state.selectedInstitution = institutions[0].name;
    }
    renderInstitutionDetail();
  }

  function renderInstitutionDetail() {
    const institution = institutionByName(state.selectedInstitution);
    const related = articlesForInstitution(institution.name);
    $("#institution-detail").innerHTML = `
      <div class="detail-kicker">${institution.type}</div>
      <h3>${institution.name}</h3>
      <p class="detail-title">${institution.role}</p>
      <div class="detail-block">
        <span>提取到的证据字段</span>
        <div class="evidence-list">
          ${institution.evidence.map((item) => `<span>${item}</span>`).join("")}
        </div>
      </div>
      <div class="detail-block">
        <span>标签</span>
        <div class="tag-cloud">
          ${institution.tags.map((tag) => `<button type="button">${tag}</button>`).join("")}
        </div>
      </div>
      <div class="detail-block">
        <span>子目录：相关文章</span>
        <div class="linked-articles">
          ${related
            .map(
              (article) => `
                <button data-article-id="${article.id}" type="button">
                  <strong>${article.title}</strong>
                  <span>${article.industry} · ${article.decisionModels.join(" / ")}</span>
                </button>
              `
            )
            .join("")}
        </div>
      </div>
    `;
  }

  function renderAll() {
    renderMetrics();
    renderToday();
    renderModelFilters();
    renderArticleList();
    renderModelList();
    renderInstitutionList();
  }

  function bindEvents() {
    $$(".nav-button").forEach((button) => button.addEventListener("click", () => setView(button.dataset.view)));
    $("#open-models").addEventListener("click", () => setView("models"));
    $("#search-input").addEventListener("input", (event) => {
      state.query = event.target.value;
      renderArticleList();
      renderModelList();
      renderInstitutionList();
    });

    document.addEventListener("click", (event) => {
      const articleButton = event.target.closest("[data-article-id]");
      if (articleButton) {
        state.selectedArticleId = articleButton.dataset.articleId;
        renderArticleList();
        setView("articles");
      }

      const filterButton = event.target.closest("[data-model-filter]");
      if (filterButton) {
        state.modelFilter = filterButton.dataset.modelFilter;
        renderModelFilters();
        renderArticleList();
        setView("articles");
      }

      const modelButton = event.target.closest("[data-model]");
      if (modelButton) {
        state.selectedModel = modelButton.dataset.model;
        renderModelList();
        setView("models");
      }

      const institutionButton = event.target.closest("[data-institution]");
      if (institutionButton) {
        state.selectedInstitution = institutionButton.dataset.institution;
        renderInstitutionList();
        setView("institutions");
      }
    });
  }

  renderAll();
  bindEvents();
})();
