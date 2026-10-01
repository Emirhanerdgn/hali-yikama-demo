/* Fiyat hesaplayıcı ve aşı takvimi modülleri. */
(function () {
  const Demo = window.Demo;
  const { el } = Demo;

  /**
   * İki hesap modu:
   *  - "rate_qty": seçilen birim fiyat × miktar + ekler   (halı m², davet kişi sayısı)
   *  - "sum_mult": seçilen hizmetlerin toplamı × katsayı   (araç sınıfına göre oto bakım)
   */
  function compute(config, state) {
    const extras = config.extras.filter((_, i) => state.extras[i]);
    const extrasTotal = extras.reduce((sum, item) => sum + item.price, 0);
    if (config.mode === "sum_mult") {
      const base = extrasTotal * state.rate.price;
      return { total: base, lines: extras.map((item) => [item.label, item.price * state.rate.price]) };
    }
    const base = state.rate.price * state.quantity;
    const lines = [[`${state.rate.label} × ${state.quantity} ${config.quantity.unit}`, base]];
    return { total: base + extrasTotal, lines: lines.concat(extras.map((item) => [item.label, item.price])) };
  }

  Demo.modules = Demo.modules || {};

  Demo.modules.calculator = function (business, config) {
    const state = {
      rate: config.rates[0],
      quantity: config.quantity ? config.quantity.start : 1,
      extras: config.extras.map((item) => Boolean(item.on)),
    };
    const totalBox = el("b");
    const linesBox = el("ul", { class: "lines" });

    function draw() {
      const result = compute(config, state);
      totalBox.textContent = Demo.money(result.total);
      linesBox.replaceChildren(...result.lines.map(([label, price]) => el("li", {}, el("span", { text: label }), el("span", { text: Demo.money(price) }))));
    }

    const rateStep = el(
      "div",
      { class: "step" },
      Demo.stepLabel(1, config.rateLabel),
      Demo.chipGroup(
        config.rates.map((rate) => ({ ...rate, meta: rate.meta })),
        (rate) => {
          state.rate = rate;
          draw();
        },
        0
      )
    );

    const steps = [rateStep];

    if (config.quantity) {
      const output = el("output", { text: `${state.quantity} ${config.quantity.unit}` });
      const change = (delta) => {
        state.quantity = Math.min(config.quantity.max, Math.max(config.quantity.min, state.quantity + delta));
        output.textContent = `${state.quantity} ${config.quantity.unit}`;
        draw();
      };
      steps.push(
        el(
          "div",
          { class: "step" },
          Demo.stepLabel(2, config.quantity.label),
          el(
            "div",
            { class: "stepper" },
            el("button", { type: "button", "aria-label": "Azalt", onclick: () => change(-config.quantity.step) }, "−"),
            output,
            el("button", { type: "button", "aria-label": "Artır", onclick: () => change(config.quantity.step) }, "+")
          )
        )
      );
    }

    const extraButtons = config.extras.map((item, index) =>
      el(
        "button",
        {
          class: "chip",
          type: "button",
          "aria-pressed": String(state.extras[index]),
          onclick: (event) => {
            state.extras = state.extras.map((on, i) => (i === index ? !on : on));
            event.currentTarget.setAttribute("aria-pressed", String(state.extras[index]));
            draw();
          },
        },
        item.label
      )
    );
    steps.push(el("div", { class: "step" }, Demo.stepLabel(steps.length + 1, config.extrasLabel), el("div", { class: "chips" }, extraButtons)));

    const card = el(
      "div",
      { class: "card" },
      ...steps,
      el("div", { class: "total" }, el("span", { text: "Tahmini tutar" }), totalBox),
      linesBox,
      el("p", { class: "note", text: "Demo: fiyatlar örnektir, gerçek sitede işletmenin kendi fiyat listesi kullanılır." })
    );
    draw();
    return card;
  };

  /* Aşı takvimi: son aşı tarihinden sonraki tarihleri hesaplar. */
  const VACCINE_SCHEDULE = [
    { label: "Karma aşı tekrarı", months: 12 },
    { label: "Kuduz aşısı tekrarı", months: 12 },
    { label: "İç parazit uygulaması", months: 3 },
    { label: "Dış parazit uygulaması", months: 1 },
  ];

  function addMonths(date, months) {
    return new Date(date.getFullYear(), date.getMonth() + months, date.getDate());
  }

  Demo.modules.reminder = function () {
    const state = { name: "", date: "" };
    const results = el("div", { class: "results" });
    const errorBox = el("p", { class: "error", role: "alert" });

    function draw() {
      const last = new Date(state.date);
      if (!state.date || Number.isNaN(last.getTime()) || last > new Date()) {
        errorBox.textContent = "Lütfen geçmiş bir aşı tarihi seçin.";
        results.replaceChildren();
        return;
      }
      errorBox.textContent = "";
      const petName = state.name.trim() || "Dostunuz";
      results.replaceChildren(
        el("p", { class: "note", text: `${petName} için sıradaki tarihler:` }),
        ...VACCINE_SCHEDULE.map((item) => el("div", {}, el("span", { text: item.label }), el("b", { text: Demo.formatDate(addMonths(last, item.months)) })))
      );
    }

    return el(
      "div",
      { class: "card" },
      el(
        "div",
        { class: "fields" },
        el("label", { class: "field" }, "Dostunuzun adı", el("input", { type: "text", maxlength: "30", placeholder: "Örn. Mario", oninput: (e) => (state.name = e.target.value) })),
        el("label", { class: "field" }, "Son aşı / uygulama tarihi", el("input", { type: "date", oninput: (e) => (state.date = e.target.value) }))
      ),
      errorBox,
      el("button", { class: "btn btn--wide", type: "button", onclick: draw }, "Takvimi hesapla"),
      results,
      el("p", { class: "note", text: "Genel takvimdir; kesin tarihleri hekiminiz belirler. Gerçek sitede bu tarihlerde WhatsApp hatırlatması gönderilir." })
    );
  };
})();
