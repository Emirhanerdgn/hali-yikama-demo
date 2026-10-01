/* Sayfa kurucu: ?b=<slug> ile gelen işletme verisinden siteyi çizer. */
(function () {
  const Demo = window.Demo;
  const { el } = Demo;

  const SLUG_PATTERN = /^[a-z0-9-]{1,40}$/;
  const MARQUEE_REPEAT = 4;
  const REVEAL_THRESHOLD = 0.12;

  const imagePath = (business, file) => `img/${business.slug}/${file}`;

  function richTitle(parts) {
    return parts.map((part) => (typeof part === "string" ? part : el("em", { text: part.em })));
  }

  function trustLine(business) {
    return el(
      "div",
      { class: "hero__trust" },
      el("span", { class: "stars", "aria-hidden": "true", text: "★★★★★" }),
      el("span", {}, el("b", { text: business.rating }), ` / 5 · Google'da ${business.reviewCount} yorum`)
    );
  }

  function heroActions(business) {
    return el(
      "div",
      { class: "hero__cta" },
      el("a", { class: "btn", href: "#modul" }, business.hero.cta),
      el("a", { class: "btn btn--ghost", href: `tel:${business.phone.replace(/\D/g, "")}` }, business.phone)
    );
  }

  function heroText(business) {
    return [
      el("span", { class: "eyebrow", text: business.hero.eyebrow }),
      el("h1", {}, richTitle(business.hero.title)),
      el("p", { class: "hero__lead", text: business.hero.lead }),
      heroActions(business),
      trustLine(business),
    ];
  }

  function renderHero(business) {
    const images = business.hero.images;
    if (business.hero.layout === "cover") {
      return el(
        "header",
        { class: "hero hero--cover" },
        el("div", { class: "hero__bg" }, el("img", { src: imagePath(business, images[0]), alt: business.name, fetchpriority: "high" })),
        el("div", { class: "wrap hero__in" }, heroText(business))
      );
    }
    return el(
      "header",
      { class: "hero" },
      el(
        "div",
        { class: "wrap hero__grid" },
        el("div", {}, heroText(business)),
        el(
          "div",
          { class: "collage" },
          images.map((file, index) =>
            el("figure", {}, el("img", { src: imagePath(business, file), alt: `${business.name} fotoğraf ${index + 1}`, loading: index ? "lazy" : "eager" }))
          ),
          el("div", { class: "badge" }, el("div", {}, el("b", { text: business.rating }), "Google puanı"))
        )
      )
    );
  }

  function renderDemoBar() {
    return el("div", { class: "demobar", role: "note", text: "Tasarım demosu · İşletmenin resmî sitesi değildir · Fiyatlar ve bazı bilgiler örnektir" });
  }

  function renderNav(business) {
    return el(
      "nav",
      { class: "nav", "aria-label": "Ana menü" },
      el(
        "div",
        { class: "wrap nav__in" },
        el("a", { class: "logo", href: "#" }, business.short, el("small", { text: business.sub })),
        el(
          "div",
          { class: "nav__links" },
          el("a", { href: "#hizmetler", text: business.servicesHead.nav }),
          el("a", { href: "#modul", text: business.modules[0].nav }),
          business.gallery.length ? el("a", { href: "#galeri", text: "Galeri" }) : null,
          el("a", { href: "#yorumlar", text: "Yorumlar" }),
          el("a", { href: "#iletisim", text: "İletişim" })
        ),
        el("a", { class: "btn", href: "#modul" }, business.hero.cta)
      )
    );
  }

  function renderMarquee(business) {
    const items = Array.from({ length: MARQUEE_REPEAT }, () => business.marquee).flat();
    return el("div", { class: "marquee", "aria-hidden": "true" }, el("div", { class: "marquee__track" }, items.map((text) => el("span", { text }))));
  }

  function sectionHead(head) {
    return el(
      "div",
      { class: "section__head reveal" },
      el("div", {}, el("span", { class: "eyebrow", text: head.eyebrow }), el("h2", { text: head.title })),
      el("p", { text: head.text })
    );
  }

  function renderServices(business) {
    return el(
      "section",
      { class: "section", id: "hizmetler" },
      el(
        "div",
        { class: "wrap" },
        sectionHead(business.servicesHead),
        el(
          "div",
          { class: "services reveal" },
          business.services.map((service, index) =>
            el(
              "article",
              { class: "service" },
              el("span", { class: "service__no", text: String(index + 1).padStart(2, "0") }),
              el("div", {}, el("h3", { text: service.t }), el("p", { text: service.d })),
              service.p ? el("span", { class: "service__price", text: service.p }) : null
            )
          )
        )
      )
    );
  }

  function renderModules(business) {
    return el(
      "section",
      { class: "section", id: "modul", style: "padding-top:0" },
      el(
        "div",
        { class: "wrap" },
        business.modules.map((module) =>
          el(
            "div",
            { class: "module reveal" },
            el(
              "div",
              { class: "module__intro" },
              el("span", { class: "eyebrow", text: module.eyebrow }),
              el("h2", { text: module.title }),
              el("p", { class: "muted", text: module.text, style: "color:var(--muted)" }),
              el("ul", {}, module.bullets.map((text) => el("li", { text })))
            ),
            Demo.modules[module.type](business, module.config)
          )
        )
      )
    );
  }

  function renderGallery(business) {
    if (!business.gallery.length) return null;
    return el(
      "section",
      { class: "section", id: "galeri", style: "padding-top:0" },
      el(
        "div",
        { class: "wrap" },
        sectionHead(business.galleryHead),
        el(
          "div",
          { class: "gallery reveal" },
          business.gallery.map((file, index) => el("figure", {}, el("img", { src: imagePath(business, file), alt: `${business.name} galeri ${index + 1}`, loading: "lazy" })))
        )
      )
    );
  }

  function renderReviews(business) {
    return el(
      "section",
      { class: "section section--deep", id: "yorumlar" },
      el(
        "div",
        { class: "wrap" },
        sectionHead({ eyebrow: "Misafirlerimiz anlatıyor", title: `${business.rating} puan, ${business.reviewCount} yorum.`, text: "Aşağıdakiler Google'daki gerçek müşteri yorumlarından alıntıdır." }),
        el(
          "div",
          { class: "reviews reveal" },
          business.reviews.map((text) =>
            el("figure", { class: "review" }, el("div", {}, el("span", { class: "stars", text: "★★★★★" }), el("blockquote", { text: `“${text}”` })), el("cite", { text: "Google yorumu" }))
          )
        )
      )
    );
  }

  function renderVisit(business) {
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${business.name} ${business.address}`)}`;
    return el(
      "section",
      { class: "section", id: "iletisim" },
      el(
        "div",
        { class: "wrap" },
        sectionHead({ eyebrow: "İletişim", title: "Bekleriz.", text: "Yol tarifi, çalışma saatleri ve telefon tek yerde." }),
        el(
          "div",
          { class: "visit reveal" },
          el("div", {}, el("span", { class: "eyebrow", text: "Adres" }), el("h3", { text: "Neredeyiz" }), el("p", { text: business.address }), el("a", { class: "link", href: mapsUrl, target: "_blank", rel: "noopener" }, "Yol tarifi al →")),
          el("div", {}, el("span", { class: "eyebrow", text: "Saatler" }), el("h3", { text: "Ne zaman" }), el("p", { text: business.hours })),
          el("div", {}, el("span", { class: "eyebrow", text: "Telefon" }), el("h3", { text: "Bize ulaşın" }), el("p", { text: business.phone }), el("a", { class: "link", href: `tel:${business.phone.replace(/\D/g, "")}` }, "Hemen ara →"))
        )
      )
    );
  }

  function renderFooter(business) {
    return el(
      "footer",
      { class: "footer" },
      el("div", { class: "wrap" }, el("span", { text: `© ${new Date().getFullYear()} ${business.name}` }), el("span", { text: "Bu sayfa işletme için hazırlanmış bir tanıtım demosudur." }))
    );
  }

  function watchReveals() {
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-in");
          observer.unobserve(entry.target);
        }),
      { threshold: REVEAL_THRESHOLD }
    );
    document.querySelectorAll(".reveal").forEach((node) => observer.observe(node));
  }

  function loadFonts(query) {
    document.head.append(
      el("link", { rel: "preconnect", href: "https://fonts.gstatic.com", crossorigin: "" }),
      el("link", { rel: "stylesheet", href: `https://fonts.googleapis.com/css2?${query}&display=swap` })
    );
  }

  function render(business) {
    document.documentElement.dataset.theme = business.theme;
    if (business.variant) document.documentElement.dataset.variant = business.variant;
    document.title = `${business.name} · ${business.sub}`;
    loadFonts(business.fonts);
    document.getElementById("app").replaceChildren(
      ...[renderDemoBar, renderNav, renderHero, renderMarquee, renderServices, renderModules, renderGallery, renderReviews, renderVisit, renderFooter].map((part) => part(business)).filter(Boolean)
    );
    Demo.assistant(business);
    watchReveals();
  }

  function fail(message) {
    document.getElementById("app").replaceChildren(
      el("div", { class: "wrap", style: "padding-block:6rem" }, el("h1", { text: "Demo bulunamadı" }), el("p", { text: message }), el("p", {}, el("a", { href: "index.html" }, "Demo listesine dön")))
    );
  }

  const slug = new URLSearchParams(location.search).get("b") || "";
  if (!SLUG_PATTERN.test(slug)) {
    fail("Adreste geçerli bir işletme kodu yok.");
    return;
  }
  const script = el("script", { src: `data/${slug}.js` });
  script.addEventListener("load", () => {
    const business = (window.DEMO_DATA || {})[slug];
    if (business) render(business);
    else fail("İşletme verisi okunamadı.");
  });
  script.addEventListener("error", () => fail(`"${slug}" için veri dosyası yok.`));
  document.head.append(script);
})();
