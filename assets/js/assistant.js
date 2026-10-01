/* Soru-cevap asistanı. Demoda işletme bilgisinden kural tabanlı cevap verir;
   gerçek sitede aynı pencere Claude API'ye bağlanır. */
(function () {
  const Demo = window.Demo;
  const { el } = Demo;

  const TYPING_DELAY_MS = 550;
  const MAX_QUESTION_LENGTH = 200;

  const normalize = (text) =>
    text
      .toLocaleLowerCase("tr")
      .replace(/ı/g, "i")
      .replace(/ğ/g, "g")
      .replace(/ü/g, "u")
      .replace(/ş/g, "s")
      .replace(/ö/g, "o")
      .replace(/ç/g, "c");

  function builtInTopics(business) {
    return [
      { keys: ["saat", "acik", "kapan", "kacta", "kaca kadar"], answer: `Çalışma saatlerimiz: ${business.hours}.` },
      { keys: ["adres", "nerede", "konum", "yol", "nasil gel"], answer: `Adresimiz: ${business.address}. Sayfanın altındaki "Yol tarifi al" bağlantısıyla haritada açabilirsiniz.` },
      { keys: ["telefon", "numara", "ara", "iletisim", "whatsapp"], answer: `Bize ${business.phone} numarasından ulaşabilirsiniz.` },
      { keys: ["randevu", "rezervasyon", "yer ayir", "masa", "musait"], answer: `Sayfadaki "${business.modules[0].eyebrow}" bölümünden gün ve saat seçerek hemen ${business.modules[0].config.noun || "talep"} oluşturabilirsiniz.` },
    ];
  }

  function findAnswer(business, question) {
    const text = normalize(question);
    const topics = (business.faq || []).concat(builtInTopics(business));
    let best = null;
    topics.forEach((topic) => {
      const score = topic.keys.filter((key) => text.includes(key)).length;
      if (score > 0 && (!best || score > best.score)) best = { score, answer: topic.answer };
    });
    return best ? best.answer : `Bu soruyu ekibimize iletiyorum. Hızlı cevap için ${business.phone} numarasından da ulaşabilirsiniz.`;
  }

  Demo.assistant = function (business) {
    const log = el("div", { class: "assistant__log", "aria-live": "polite" });
    const input = el("input", { type: "text", maxlength: String(MAX_QUESTION_LENGTH), placeholder: "Sorunuzu yazın…", "aria-label": "Sorunuz" });

    function say(text, who) {
      log.append(el("div", { class: `msg msg--${who}`, text }));
      log.scrollTop = log.scrollHeight;
    }

    function ask(question) {
      const clean = question.trim().slice(0, MAX_QUESTION_LENGTH);
      if (!clean) return;
      say(clean, "me");
      setTimeout(() => say(findAnswer(business, clean), "bot"), TYPING_DELAY_MS);
    }

    const chips = el(
      "div",
      { class: "assistant__chips" },
      business.chips.map((chip) => el("button", { class: "chip", type: "button", onclick: () => ask(chip) }, chip))
    );

    const form = el(
      "form",
      {
        class: "assistant__form",
        onsubmit: (event) => {
          event.preventDefault();
          ask(input.value);
          input.value = "";
        },
      },
      input,
      el("button", { type: "submit", "aria-label": "Gönder" }, "➤")
    );

    const panel = el(
      "section",
      { class: "assistant", hidden: true, "aria-label": "Asistan" },
      el("div", { class: "assistant__head" }, el("b", { text: `${business.short} Asistan` }), el("span", { text: "7/24 cevap verir · demo sürümü" })),
      log,
      chips,
      form
    );

    const fab = el(
      "button",
      {
        class: "assistant__fab",
        type: "button",
        "aria-expanded": "false",
        onclick: () => {
          const willOpen = panel.hidden;
          panel.hidden = !willOpen;
          fab.setAttribute("aria-expanded", String(willOpen));
          if (willOpen && !log.childElementCount) say(business.greeting, "bot");
          if (willOpen) input.focus();
        },
      },
      el("i"),
      el("span", { text: "Bize sorun" })
    );

    document.body.append(panel, fab);
  };
})();
