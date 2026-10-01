/* Ortak yardımcılar: güvenli DOM üretimi, biçimlendirme, saklama. */
(function () {
  const Demo = (window.Demo = window.Demo || {});

  const DAY_NAMES = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];
  const MONTH_NAMES = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
  const BOOKING_WINDOW_DAYS = 14;

  /** Metni her zaman textContent ile basar; HTML enjekte edilemez. */
  Demo.el = function (tag, attrs, ...children) {
    const node = document.createElement(tag);
    Object.entries(attrs || {}).forEach(([key, value]) => {
      if (value == null || value === false) return;
      if (key === "class") node.className = value;
      else if (key === "text") node.textContent = value;
      else if (key.startsWith("on")) node.addEventListener(key.slice(2), value);
      else node.setAttribute(key, value === true ? "" : value);
    });
    children.flat().forEach((child) => {
      if (child == null || child === false) return;
      node.append(child.nodeType ? child : document.createTextNode(String(child)));
    });
    return node;
  };

  Demo.money = (amount) => new Intl.NumberFormat("tr-TR").format(Math.round(amount)) + " TL";

  Demo.upcomingDays = function () {
    const today = new Date();
    return Array.from({ length: BOOKING_WINDOW_DAYS }, (_, offset) => {
      const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() + offset + 1);
      return {
        key: `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`,
        weekday: DAY_NAMES[date.getDay()],
        day: date.getDate(),
        label: `${date.getDate()} ${MONTH_NAMES[date.getMonth()]} ${DAY_NAMES[date.getDay()]}`,
      };
    });
  };

  Demo.formatDate = (date) => `${date.getDate()} ${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;

  /** Aynı girdi için hep aynı sonucu veren basit karma; "dolu" saatleri sabit tutar. */
  Demo.hash = function (text) {
    let value = 2166136261;
    for (let i = 0; i < text.length; i += 1) value = Math.imul(value ^ text.charCodeAt(i), 16777619) >>> 0;
    return value >>> 7;
  };

  Demo.waLink = (phone, text) => `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;

  Demo.store = {
    read(key) {
      try {
        return JSON.parse(localStorage.getItem(key)) || [];
      } catch (error) {
        return [];
      }
    },
    append(key, item) {
      try {
        localStorage.setItem(key, JSON.stringify([...Demo.store.read(key), item]));
      } catch (error) {
        /* Gizli sekmede saklama kapalı olabilir; demo yine çalışır. */
      }
    },
  };

  /** Tek seçimli çip grubu; seçim değişince onChange çağrılır. */
  Demo.chipGroup = function (options, onChange, selectedIndex) {
    const buttons = options.map((option, index) =>
      Demo.el(
        "button",
        {
          class: "chip",
          type: "button",
          "aria-pressed": String(index === selectedIndex),
          onclick: () => {
            buttons.forEach((button, i) => button.setAttribute("aria-pressed", String(i === index)));
            onChange(option, index);
          },
        },
        option.label,
        option.meta ? Demo.el("small", { text: option.meta }) : null
      )
    );
    return Demo.el("div", { class: "chips" }, buttons);
  };

  Demo.stepLabel = (number, text) =>
    Demo.el("div", { class: "step__label" }, Demo.el("i", { text: String(number) }), text);
})();
