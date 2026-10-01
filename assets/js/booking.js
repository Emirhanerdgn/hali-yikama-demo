/* Randevu / rezervasyon modülü: seçenek → gün → saat → iletişim → onay. */
(function () {
  const Demo = window.Demo;
  const { el } = Demo;

  const MIN_NAME_LENGTH = 2;
  const MIN_PHONE_DIGITS = 10;
  const BUSY_RATIO = 4; // her 4 saatten yaklaşık 1'i dolu görünür

  function isBusy(slug, dayKey, slot) {
    return Demo.hash(`${slug}|${dayKey}|${slot}`) % BUSY_RATIO === 0;
  }

  function validate(state) {
    if (!state.day) return "Lütfen bir gün seçin.";
    if (!state.slot) return "Lütfen bir saat seçin.";
    if (state.name.trim().length < MIN_NAME_LENGTH) return "Lütfen adınızı yazın.";
    if (state.phone.replace(/\D/g, "").length < MIN_PHONE_DIGITS) return "Lütfen geçerli bir telefon numarası yazın.";
    return "";
  }

  function summaryRows(config, state) {
    const rows = [[config.optionLabel, state.option.label]];
    if (config.quantity) rows.push([config.quantity.label, `${state.quantity} ${config.quantity.unit}`]);
    rows.push(["Tarih", state.day.label], ["Saat", state.slot], ["Ad", state.name.trim()]);
    return rows;
  }

  function renderDone(card, business, config, state, restart) {
    const rows = summaryRows(config, state);
    const message = `Merhaba, ${business.name} sitesinden ${config.noun} talebi:\n` + rows.map(([k, v]) => `${k}: ${v}`).join("\n");
    const contact = business.whatsapp
      ? el("a", { class: "btn", href: Demo.waLink(business.whatsapp, message), target: "_blank", rel: "noopener" }, "WhatsApp ile işletmeye ilet")
      : el("a", { class: "btn", href: `tel:${business.phone.replace(/\D/g, "")}` }, "İşletmeyi ara");

    card.replaceChildren(
      el(
        "div",
        { class: "done" },
        el("div", { class: "done__icon", text: "✓" }),
        el("h3", { text: config.doneTitle }),
        el("dl", {}, rows.flatMap(([k, v]) => [el("dt", { text: k }), el("dd", { text: v })])),
        contact,
        el("button", { class: "btn btn--ghost", type: "button", onclick: restart }, "Yeni " + config.noun),
        el("p", { class: "note", text: "Demo: gerçek sitede talep işletmenin takvimine düşer ve müşteriye otomatik hatırlatma gider." })
      )
    );
  }

  function renderForm(card, business, config) {
    const days = Demo.upcomingDays();
    const storeKey = `demo-bookings-${business.slug}`;
    const state = { option: config.options[0], quantity: config.quantity ? config.quantity.start : null, day: null, slot: null, name: "", phone: "" };
    const slotsBox = el("div", { class: "slots" });
    const errorBox = el("p", { class: "error", role: "alert" });

    function drawSlots() {
      if (!state.day) {
        slotsBox.replaceChildren(el("p", { class: "note", text: "Önce bir gün seçin." }));
        return;
      }
      const mine = Demo.store.read(storeKey);
      const buttons = config.slots.map((slot) => {
        const taken = isBusy(business.slug, state.day.key, slot) || mine.some((b) => b.day === state.day.key && b.slot === slot);
        return el(
          "button",
          {
            class: "slot",
            type: "button",
            disabled: taken,
            "aria-pressed": String(state.slot === slot),
            onclick: () => {
              state.slot = slot;
              drawSlots();
            },
          },
          slot
        );
      });
      slotsBox.replaceChildren(...buttons);
    }

    const dayButtons = days.map((day) =>
      el(
        "button",
        {
          class: "day",
          type: "button",
          "aria-pressed": "false",
          onclick: (event) => {
            dayButtons.forEach((button) => button.setAttribute("aria-pressed", "false"));
            event.currentTarget.setAttribute("aria-pressed", "true");
            state.day = day;
            state.slot = null;
            drawSlots();
          },
        },
        el("span", { text: day.weekday }),
        el("b", { text: String(day.day) })
      )
    );

    let stepNo = 1;
    const steps = [
      el("div", { class: "step" }, Demo.stepLabel(stepNo++, config.optionLabel), Demo.chipGroup(config.options, (option) => (state.option = option), 0)),
    ];

    if (config.quantity) {
      const output = el("output", { text: `${state.quantity} ${config.quantity.unit}` });
      const change = (delta) => {
        state.quantity = Math.min(config.quantity.max, Math.max(config.quantity.min, state.quantity + delta));
        output.textContent = `${state.quantity} ${config.quantity.unit}`;
      };
      steps.push(
        el(
          "div",
          { class: "step" },
          Demo.stepLabel(stepNo++, config.quantity.label),
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

    steps.push(
      el("div", { class: "step" }, Demo.stepLabel(stepNo++, "Gün"), el("div", { class: "days" }, dayButtons)),
      el("div", { class: "step" }, Demo.stepLabel(stepNo++, "Saat"), slotsBox),
      el(
        "div",
        { class: "step" },
        Demo.stepLabel(stepNo++, "İletişim"),
        el(
          "div",
          { class: "fields" },
          el("label", { class: "field" }, "Adınız", el("input", { type: "text", autocomplete: "name", maxlength: "60", oninput: (e) => (state.name = e.target.value) })),
          el("label", { class: "field" }, "Telefon", el("input", { type: "tel", autocomplete: "tel", maxlength: "20", placeholder: "05xx xxx xx xx", oninput: (e) => (state.phone = e.target.value) }))
        )
      )
    );

    const submit = el(
      "button",
      {
        class: "btn btn--wide",
        type: "button",
        onclick: () => {
          const problem = validate(state);
          errorBox.textContent = problem;
          if (problem) return;
          Demo.store.append(storeKey, { day: state.day.key, slot: state.slot });
          renderDone(card, business, config, state, () => renderForm(card, business, config));
        },
      },
      config.cta
    );

    card.replaceChildren(...steps, errorBox, submit);
    drawSlots();
  }

  Demo.modules = Demo.modules || {};
  Demo.modules.booking = function (business, config) {
    const card = el("div", { class: "card" });
    renderForm(card, business, config);
    return card;
  };
})();
