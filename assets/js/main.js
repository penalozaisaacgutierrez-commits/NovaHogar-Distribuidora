/**
 * NovaHogar Distribuidora — JavaScript principal
 * Requiere config.js (OV_CONFIG) cargado previamente.
 */
(function () {
  "use strict";

  var cfg = typeof OV_CONFIG !== "undefined" ? OV_CONFIG : {};
  var CONSENT_KEY = "ov_cookie_consent";

  window.dataLayer = window.dataLayer || [];
  function gtag() {
    window.dataLayer.push(arguments);
  }
  window.gtag = gtag;

  gtag("consent", "default", {
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    analytics_storage: "denied",
    wait_for_update: 500,
  });

  function applyConsentMode(value) {
    if (typeof gtag !== "function" || !value) return;
    gtag("consent", "update", {
      ad_storage: value.marketing ? "granted" : "denied",
      ad_user_data: value.marketing ? "granted" : "denied",
      ad_personalization: value.marketing ? "granted" : "denied",
      analytics_storage: value.analytics ? "granted" : "denied",
    });
  }

  try {
    var stored = localStorage.getItem(CONSENT_KEY);
    if (stored) applyConsentMode(JSON.parse(stored));
  } catch (e) {}

  function $(sel, ctx) {
    return (ctx || document).querySelector(sel);
  }

  function $$(sel, ctx) {
    return Array.from((ctx || document).querySelectorAll(sel));
  }

  function setText(sel, text) {
    if (text == null) return;
    $$(sel).forEach(function (el) {
      el.textContent = text;
    });
  }

  function injectJsonLd(id, data) {
    var el = document.getElementById(id);
    if (!el) {
      el = document.createElement("script");
      el.type = "application/ld+json";
      el.id = id;
      document.head.appendChild(el);
    }
    el.textContent = JSON.stringify(data);
  }

  function siteOrigin() {
    return String(cfg.sitioUrl || "https://novahogar-distribuidora.onrender.com/").replace(
      /\/?$/,
      "/"
    );
  }

  function injectSeoExtras() {
    var origin = siteOrigin();
    var file = (location.pathname.split("/").pop() || "index.html").toLowerCase();
    if (!file || file === "/") file = "index.html";

    var names = {
      "index.html": "Inicio",
      "quienes-somos.html": "Quiénes somos",
      "ubicacion.html": "Ubicación en Medellín",
      "contacto.html": "Contacto",
      "search-console.html": "Google Search Console",
      "politicas-google-ads.html": "Políticas de Google Ads",
      "privacidad.html": "Privacidad",
      "terminos-y-condiciones.html": "Términos",
      "politica-cookies.html": "Cookies",
    };

    var crumbs = [{ "@type": "ListItem", position: 1, name: "Inicio", item: origin }];
    if (file !== "index.html" && names[file]) {
      crumbs.push({
        "@type": "ListItem",
        position: 2,
        name: names[file],
        item: origin + file,
      });
    }
    injectJsonLd("ld-breadcrumb", {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: crumbs,
    });

    if (cfg.geoLat != null && cfg.geoLng != null) {
      injectJsonLd("ld-local", {
        "@context": "https://schema.org",
        "@type": ["FurnitureStore", "WholesaleStore"],
        name: cfg.nombre,
        url: origin,
        email: cfg.email,
        telephone: cfg.telefono && cfg.telefono.indexOf("NÚMERO") === -1 ? cfg.telefono : undefined,
        foundingDate: String(cfg.anioFundacion || 2013),
        image: origin + "assets/img/logo.svg",
        address: {
          "@type": "PostalAddress",
          streetAddress: "Carrera 50 # 25-20, Guayabal",
          addressLocality: cfg.ciudad || "Medellín",
          addressRegion: cfg.departamento || "Antioquia",
          postalCode: "050024",
          addressCountry: "CO",
        },
        geo: {
          "@type": "GeoCoordinates",
          latitude: cfg.geoLat,
          longitude: cfg.geoLng,
        },
        hasMap: cfg.mapsUrl,
        areaServed: ["Medellín", "Antioquia", "Colombia"],
        priceRange: "$$$",
      });
    }
  }

  function assetPrefix() {
    var script = document.querySelector('script[src*="assets/js/main.js"]');
    if (!script) return "";
    var src = script.getAttribute("src") || "";
    var idx = src.indexOf("assets/js/main.js");
    if (idx <= 0) return "";
    return src.slice(0, idx);
  }

  function resolveAsset(path) {
    if (!path) return path;
    if (/^(https?:)?\/\//i.test(path) || path.charAt(0) === "/" || path.indexOf("data:") === 0) {
      return path;
    }
    return assetPrefix() + path;
  }

  var FALLBACK =
    cfg.imagenFallback ||
    "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1200&auto=format&fit=crop&q=75";

  function getViewportImageWidth() {
    var w = window.innerWidth || 1280;
    if (w <= 480) return 640;
    if (w <= 768) return 828;
    if (w <= 1024) return 1200;
    return 1920;
  }

  function imgUrl(url, width) {
    if (!url) return FALLBACK;
    var targetW = width || getViewportImageWidth();
    if (url.indexOf("unsplash.com") > -1) {
      if (/[?&]w=\d+/.test(url)) url = url.replace(/([?&])w=\d+/, "$1w=" + targetW);
      else url += (url.indexOf("?") > -1 ? "&" : "?") + "w=" + targetW;
      if (/[?&]q=\d+/.test(url)) url = url.replace(/([?&])q=\d+/, "$1q=80");
      else url += "&q=80";
      if (url.indexOf("auto=format") === -1) url += "&auto=format&fit=crop";
    }
    return url;
  }

  function heroSrcSet(url) {
    if (!url || url.indexOf("unsplash.com") === -1) return "";
    var base = url.split("?")[0];
    return (
      base + "?w=640&q=80&auto=format&fit=crop 640w, " +
      base + "?w=828&q=80&auto=format&fit=crop 828w, " +
      base + "?w=1280&q=80&auto=format&fit=crop 1280w, " +
      base + "?w=1920&q=80&auto=format&fit=crop 1920w"
    );
  }

  function imgTag(url, alt, loading, width) {
    var src = resolveAsset(imgUrl(url, width || 800));
    return (
      '<img src="' +
      src +
      '" alt="' +
      (alt || "") +
      '" loading="' +
      (loading || "lazy") +
      '" decoding="async" width="' +
      (width || 800) +
      '" height="' +
      Math.round((width || 800) * 0.72) +
      '">'
    );
  }

  function bindImageFallbacks(root) {
    $$("img", root || document).forEach(function (img) {
      if (img.dataset.fallbackBound) return;
      img.dataset.fallbackBound = "1";
      img.addEventListener("error", function () {
        if (img.src !== FALLBACK) img.src = FALLBACK;
      });
    });
  }

  function digitsOnly(value) {
    return String(value || "").replace(/\D/g, "");
  }

  function whatsappNumber() {
    var num = digitsOnly(cfg.whatsapp || cfg.telefono || "");
    if (!num) return "";
    if (num.indexOf("57") === 0 && num.length >= 12) return num;
    if (num.length === 10 || num.length === 11) return "57" + num;
    return num;
  }

  function whatsappUrl(extraMessage) {
    var num = whatsappNumber();
    if (!num) return "#contacto";
    var url = "https://wa.me/" + num;
    if (extraMessage) url += "?text=" + encodeURIComponent(extraMessage);
    return url;
  }

  function bindWhatsAppFast() {
    var href = whatsappUrl();
    $$("[data-cfg-href='whatsapp']").forEach(function (el) {
      el.href = href;
      el.setAttribute("rel", "noopener noreferrer");
      if (href.indexOf("wa.me") === 0 || href.indexOf("https://wa.me") === 0) {
        el.addEventListener("click", function (e) {
          e.preventDefault();
          window.location.href = href;
        });
      }
    });
  }

  function injectConfig() {
    if ($("#hero-carousel") && cfg.tituloSeo) {
      document.title = cfg.tituloSeo;
    }

    var metaDesc = $('meta[name="description"]');
    if (metaDesc && cfg.descripcionMeta && $("#hero-carousel")) {
      metaDesc.content = cfg.descripcionMeta;
    }

    setText("[data-cfg='nombre']", cfg.nombre);
    setText("[data-cfg='rubro']", cfg.rubro);
    setText("[data-cfg='slogan']", cfg.slogan);
    setText("[data-cfg='brandSub']", cfg.brandSub);
    setText("[data-cfg='direccion']", cfg.direccion);
    setText("[data-cfg='heroUbacion']", cfg.heroUbacion);
    setText("[data-cfg='email']", cfg.email);
    setText("[data-cfg='telefono']", cfg.telefono);
    setText("[data-cfg='whatsappDisplay']", cfg.whatsappDisplay || cfg.telefono);
    setText("[data-cfg='horario']", cfg.horario);
    setText("[data-cfg='idCampana']", cfg.idCampana);
    setText("[data-cfg='titularNombre']", cfg.titularNombre);
    setText("[data-cfg='titularCargo']", cfg.titularCargo);
    setText("[data-cfg='verificanteNombre']", cfg.verificanteNombre || cfg.titularNombre);
    setText("[data-cfg='anioInicio']", String(cfg.anioInicio || 2013));
    setText("[data-cfg='anioFundacion']", String(cfg.anioFundacion || cfg.anioInicio || 2013));

    if (cfg.googleSiteVerification) {
      var ver = document.querySelector('meta[name="google-site-verification"]');
      if (!ver) {
        ver = document.createElement("meta");
        ver.setAttribute("name", "google-site-verification");
        document.head.appendChild(ver);
      }
      ver.setAttribute("content", cfg.googleSiteVerification);
    }
    setText("[data-cfg='ciudad']", cfg.ciudad);
    setText("[data-cfg='mision']", cfg.mision);
    setText("[data-cfg='vision']", cfg.vision);

    if (cfg.antiguedadAnios != null) {
      setText("[data-cfg='antiguedadAnios']", String(cfg.antiguedadAnios));
    }

    if (cfg.quienesSomos) {
      setText("[data-cfg='quienesTitulo']", cfg.quienesSomos.titulo);
      setText("[data-cfg='quienesDescripcion']", cfg.quienesSomos.descripcion);
      setText("[data-cfg='quienesSomos']", cfg.quienesSomos.quienes);
      setText("[data-cfg='quienesTrayectoria']", cfg.quienesSomos.trayectoria);
      setText("[data-cfg='quienesDedicacion']", cfg.quienesSomos.dedicacion);
      setText("[data-cfg='quienesServicios']", cfg.quienesSomos.servicios);
      setText("[data-cfg='quienesClientes']", cfg.quienesSomos.clientes);
      setText("[data-cfg='quienesMisionBreve']", cfg.quienesSomos.misionBreve);
      setText("[data-cfg='sitioWebDesde']", cfg.quienesSomos.sitioWebDesde);
      setText("[data-cfg='pilarSomos']", cfg.quienesSomos.pilarSomos);
      setText("[data-cfg='pilarDedicacion']", cfg.quienesSomos.pilarDedicacion);
      setText("[data-cfg='pilarOfrecemos']", cfg.quienesSomos.pilarOfrecemos);
      setText("[data-cfg='pilarBrindamos']", cfg.quienesSomos.pilarBrindamos);
      setText("[data-cfg='ubicacionLarga']", cfg.quienesSomos.ubicacionLarga);
    }

    $$("[data-cfg-href='email']").forEach(function (el) {
      var mail = cfg.email || "";
      el.href = mail.indexOf("@") > -1 ? "mailto:" + mail : "#contacto";
    });

    $$("[data-cfg-href='telefono']").forEach(function (el) {
      var num = whatsappNumber();
      el.href = num ? "tel:+" + num : "#contacto";
    });

    bindWhatsAppFast();

    var hiddenCamp = $("#campana-id-hidden");
    if (hiddenCamp) hiddenCamp.value = cfg.idCampana || "";

    $$("[data-cfg-src]").forEach(function (el) {
      var key = el.getAttribute("data-cfg-src");
      if (key && cfg[key]) {
        el.src = resolveAsset(cfg[key]);
        if (key === "logo") el.alt = cfg.logoAlt || cfg.nombre;
      }
    });

    setText("[data-cfg='sitioDominio']", cfg.sitioDominio || "");
    setText("[data-cfg='sitioUrl']", cfg.sitioUrl || "");

    if (cfg.sitioUrl) {
      $$("[data-cfg-href='sitioUrl']").forEach(function (el) {
        el.href = cfg.sitioUrl;
      });
      var canonical = document.querySelector('link[rel="canonical"]');
      if (canonical) {
        canonical.href = cfg.sitioUrl.replace(/\/?$/, "/") + (canonical.getAttribute("data-page") || "");
      }
    }

    $$("[data-map]").forEach(function (iframe) {
      var q = encodeURIComponent(cfg.mapaQuery || cfg.direccion || "Medellín, Antioquia, Colombia");
      iframe.src =
        "https://maps.google.com/maps?q=" + q + "&t=&z=16&ie=UTF8&iwloc=&output=embed";
    });

    $$("[data-cfg-href='mapsUrl']").forEach(function (el) {
      el.href = cfg.mapsUrl ||
        "https://www.google.com/maps/search/?api=1&query=" +
          encodeURIComponent(cfg.mapaQuery || cfg.direccion || "Medellín, Antioquia");
    });
  }

  function buildHeroSlide(img, index, isActive) {
    var src = imgUrl(img.url, index === 0 ? getViewportImageWidth() : 1280);
    var srcset = heroSrcSet(img.url);
    return (
      '<div class="hero-slide' +
      (isActive ? " active" : "") +
      '">' +
      '<img src="' +
      src +
      '"' +
      (srcset ? ' srcset="' + srcset + '" sizes="100vw"' : "") +
      ' alt="' +
      img.alt +
      '" width="1920" height="1080" loading="' +
      (index === 0 ? "eager" : "lazy") +
      '"' +
      (index === 0 ? ' fetchpriority="high"' : "") +
      ' decoding="async">' +
      "</div>"
    );
  }

  function initHeroCarousel() {
    var container = $("#hero-carousel");
    if (!container || !cfg.heroImagenes || !cfg.heroImagenes.length) return;

    container.innerHTML = cfg.heroImagenes
      .map(function (img, i) {
        return buildHeroSlide(img, i, i === 0);
      })
      .join("");

    var indicators = $("#hero-indicators");
    if (indicators) {
      indicators.innerHTML = cfg.heroImagenes
        .map(function (_, i) {
          return (
            '<button class="hero-indicator' +
            (i === 0 ? " active" : "") +
            '" type="button" aria-label="Imagen ' +
            (i + 1) +
            '" data-index="' +
            i +
            '"></button>'
          );
        })
        .join("");
    }

    var current = 0;
    var slides = $$(".hero-slide", container);
    var dots = $$(".hero-indicator");

    function goTo(index) {
      slides[current].classList.remove("active");
      if (dots[current]) dots[current].classList.remove("active");
      current = index;
      slides[current].classList.add("active");
      if (dots[current]) dots[current].classList.add("active");
    }

    function next() {
      goTo((current + 1) % slides.length);
    }

    var interval = setInterval(next, 7000);

    dots.forEach(function (dot) {
      dot.addEventListener("click", function () {
        clearInterval(interval);
        goTo(parseInt(dot.dataset.index, 10));
        interval = setInterval(next, 7000);
      });
    });
  }

  function initHeader() {
    var header = $(".site-header");
    var toggle = $(".nav-toggle");
    var nav = $(".nav-principal");

    if (header) {
      var onScroll = function () {
        header.classList.toggle("scrolled", window.scrollY > 40);
      };
      onScroll();
      window.addEventListener("scroll", onScroll, { passive: true });
    }

    if (toggle && nav) {
      toggle.addEventListener("click", function () {
        var open = nav.classList.toggle("open");
        toggle.classList.toggle("active", open);
        toggle.setAttribute("aria-expanded", open);
        document.body.style.overflow = open ? "hidden" : "";
      });

      $$(".nav-principal a").forEach(function (link) {
        link.addEventListener("click", function () {
          nav.classList.remove("open");
          toggle.classList.remove("active");
          toggle.setAttribute("aria-expanded", "false");
          document.body.style.overflow = "";
        });
      });
    }
  }

  function initReveal() {
    var els = $$(".reveal, .reveal-left, .reveal-right");
    if (!els.length) return;

    if (!("IntersectionObserver" in window)) {
      els.forEach(function (el) {
        el.classList.add("visible");
      });
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );

    els.forEach(function (el) {
      observer.observe(el);
    });
  }

  function initCounters() {
    var stats = $$(".stat-number[data-target]");
    if (!stats.length) return;

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var el = entry.target;
          var target = parseInt(el.dataset.target, 10);
          var suffix = el.dataset.suffix || "";
          var duration = 2000;
          var start = performance.now();

          function animate(now) {
            var progress = Math.min((now - start) / duration, 1);
            var eased = 1 - Math.pow(1 - progress, 3);
            el.textContent = Math.floor(eased * target) + suffix;
            if (progress < 1) requestAnimationFrame(animate);
            else el.textContent = target + suffix;
          }

          requestAnimationFrame(animate);
          observer.unobserve(el);
        });
      },
      { threshold: 0.45 }
    );

    stats.forEach(function (s) {
      observer.observe(s);
    });
  }

  function buildTimeline() {
    var container = $("#timeline");
    if (!container || !cfg.historia) return;

    container.innerHTML = cfg.historia
      .map(function (item) {
        return (
          '<div class="timeline-item reveal">' +
          '<div class="timeline-dot"></div>' +
          '<div class="timeline-content">' +
          '<div class="timeline-year">' +
          item.anio +
          "</div>" +
          "<h4>" +
          item.titulo +
          "</h4>" +
          "<p>" +
          item.texto +
          "</p>" +
          "</div>" +
          '<div class="timeline-image">' +
          imgTag(item.imagen, item.titulo, "lazy", 800) +
          "</div>" +
          "</div>"
        );
      })
      .join("");
  }

  function buildValues() {
    var container = $("#values-grid");
    if (!container || !cfg.valores) return;

    container.innerHTML = cfg.valores
      .map(function (v) {
        return (
          '<div class="value-card reveal">' +
          '<div class="value-icon">' +
          v.icono +
          "</div>" +
          "<h4>" +
          v.titulo +
          "</h4>" +
          "<p>" +
          v.texto +
          "</p>" +
          "</div>"
        );
      })
      .join("");
  }

  function buildServices() {
    var container = $("#services-grid");
    if (!container || !cfg.servicios) return;

    container.innerHTML = cfg.servicios
      .map(function (s) {
        return (
          '<article class="service-card reveal">' +
          '<div class="service-card-image">' +
          imgTag(s.imagen, s.titulo, "lazy", 800) +
          "</div>" +
          '<div class="service-card-body">' +
          "<h4>" +
          s.titulo +
          "</h4>" +
          "<p>" +
          s.texto +
          "</p>" +
          "</div>" +
          "</article>"
        );
      })
      .join("");
  }

  function buildProcess() {
    var container = $("#process-grid");
    if (!container || !cfg.proceso) return;

    container.innerHTML = cfg.proceso
      .map(function (p) {
        return (
          '<div class="process-step reveal">' +
          '<div class="process-number">' +
          p.paso +
          "</div>" +
          "<h4>" +
          p.titulo +
          "</h4>" +
          "<p>" +
          p.texto +
          "</p>" +
          "</div>"
        );
      })
      .join("");
  }

  function buildStats() {
    var container = $("#stats-grid");
    if (!container || !cfg.estadisticas) return;

    container.innerHTML = cfg.estadisticas
      .map(function (s) {
        return (
          '<div class="stat-item reveal">' +
          '<div class="stat-number" data-target="' +
          s.numero +
          '" data-suffix="' +
          s.sufijo +
          '">0' +
          s.sufijo +
          "</div>" +
          '<div class="stat-label">' +
          s.etiqueta +
          "</div>" +
          "</div>"
        );
      })
      .join("");
  }

  function buildSectors() {
    var container = $("#sectors-grid");
    if (!container || !cfg.sectores) return;

    container.innerHTML = cfg.sectores
      .map(function (s) {
        return (
          '<div class="sector-card reveal">' +
          "<h4>" +
          s.titulo +
          "</h4>" +
          "<p>" +
          s.texto +
          "</p>" +
          "</div>"
        );
      })
      .join("");
  }

  function buildCatalog() {
    var container = $("#catalog-grid");
    if (!container || !cfg.catalogoLineas) return;

    container.innerHTML = cfg.catalogoLineas
      .map(function (s) {
        return (
          '<div class="sector-card reveal">' +
          "<h4>" +
          s.titulo +
          "</h4>" +
          "<p>" +
          s.texto +
          "</p>" +
          "</div>"
        );
      })
      .join("");
  }

  function buildGallery() {
    var container = $("#gallery-grid");
    if (!container || !cfg.galeria) return;

    container.innerHTML = cfg.galeria
      .map(function (g, i) {
        return (
          '<div class="gallery-item reveal" data-index="' +
          i +
          '" role="button" tabindex="0" aria-label="' +
          g.caption +
          '">' +
          imgTag(g.url, g.alt, "lazy", 900) +
          '<div class="gallery-overlay"><span class="gallery-caption">' +
          g.caption +
          "</span></div></div>"
        );
      })
      .join("");

    initLightbox();
  }

  function initLightbox() {
    var lightbox = $("#lightbox");
    if (!lightbox || !cfg.galeria) return;

    var lbImg = $("#lightbox-img");
    var btnClose = $(".lightbox-close");
    var btnPrev = $(".lightbox-prev");
    var btnNext = $(".lightbox-next");
    var currentIdx = 0;

    function open(idx) {
      currentIdx = idx;
      lbImg.src = imgUrl(cfg.galeria[idx].url, 1600);
      lbImg.alt = cfg.galeria[idx].alt;
      lightbox.classList.add("active");
      document.body.style.overflow = "hidden";
    }

    function close() {
      lightbox.classList.remove("active");
      document.body.style.overflow = "";
    }

    function nav(dir) {
      currentIdx = (currentIdx + dir + cfg.galeria.length) % cfg.galeria.length;
      lbImg.src = imgUrl(cfg.galeria[currentIdx].url, 1600);
      lbImg.alt = cfg.galeria[currentIdx].alt;
    }

    $$(".gallery-item").forEach(function (item) {
      item.addEventListener("click", function () {
        open(parseInt(item.dataset.index, 10));
      });
      item.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          open(parseInt(item.dataset.index, 10));
        }
      });
    });

    if (btnClose) btnClose.addEventListener("click", close);
    if (btnPrev) btnPrev.addEventListener("click", function () { nav(-1); });
    if (btnNext) btnNext.addEventListener("click", function () { nav(1); });

    lightbox.addEventListener("click", function (e) {
      if (e.target === lightbox) close();
    });

    document.addEventListener("keydown", function (e) {
      if (!lightbox.classList.contains("active")) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") nav(-1);
      if (e.key === "ArrowRight") nav(1);
    });
  }

  function buildTeam() {
    var container = $("#team-grid");
    if (!container || !cfg.equipo) return;

    container.innerHTML = cfg.equipo
      .map(function (m) {
        return (
          '<div class="team-card' +
          (m.destacado ? " team-card--lead" : "") +
          ' reveal">' +
          '<div class="team-photo">' +
          imgTag(m.imagen, m.nombre, "lazy", 600) +
          "</div>" +
          "<h4>" +
          m.nombre +
          "</h4>" +
          "<p>" +
          m.cargo +
          "</p>" +
          (m.bio ? '<p class="team-bio">' + m.bio + "</p>" : "") +
          "</div>"
        );
      })
      .join("");
  }

  function buildTestimonials() {
    var track = $("#testimonial-track");
    var dotsContainer = $("#testimonial-dots");
    if (!track || !cfg.testimonios) return;

    track.innerHTML = cfg.testimonios
      .map(function (t) {
        return (
          '<div class="testimonial-slide">' +
          '<blockquote class="testimonial-quote">«' +
          t.texto +
          '»</blockquote>' +
          '<div class="testimonial-author">' +
          t.autor +
          "</div>" +
          '<div class="testimonial-role">' +
          t.cargo +
          "</div></div>"
        );
      })
      .join("");

    if (dotsContainer) {
      dotsContainer.innerHTML = cfg.testimonios
        .map(function (_, i) {
          return (
            '<button class="testimonial-dot' +
            (i === 0 ? " active" : "") +
            '" type="button" aria-label="Testimonio ' +
            (i + 1) +
            '" data-index="' +
            i +
            '"></button>'
          );
        })
        .join("");
    }

    var current = 0;
    var dots = $$(".testimonial-dot");
    var total = cfg.testimonios.length;

    function goTo(idx) {
      current = idx;
      track.style.transform = "translateX(-" + current * 100 + "%)";
      dots.forEach(function (d, i) {
        d.classList.toggle("active", i === current);
      });
    }

    dots.forEach(function (dot) {
      dot.addEventListener("click", function () {
        goTo(parseInt(dot.dataset.index, 10));
      });
    });

    setInterval(function () {
      goTo((current + 1) % total);
    }, 8000);
  }

  function buildFAQ() {
    var container = $("#faq-list");
    if (!container || !cfg.faq) return;

    container.innerHTML = cfg.faq
      .map(function (f, i) {
        return (
          '<div class="faq-item" data-index="' +
          i +
          '">' +
          '<button class="faq-question" type="button" aria-expanded="false">' +
          f.pregunta +
          '<span class="faq-icon" aria-hidden="true">+</span></button>' +
          '<div class="faq-answer"><p>' +
          f.respuesta +
          "</p></div></div>"
        );
      })
      .join("");

    $$(".faq-question").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var item = btn.closest(".faq-item");
        var isActive = item.classList.contains("active");

        $$(".faq-item").forEach(function (fi) {
          fi.classList.remove("active");
          fi.querySelector(".faq-question").setAttribute("aria-expanded", "false");
        });

        if (!isActive) {
          item.classList.add("active");
          btn.setAttribute("aria-expanded", "true");
        }
      });
    });

    injectJsonLd("ld-faq", {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: cfg.faq.map(function (f) {
        return {
          "@type": "Question",
          name: f.pregunta,
          acceptedAnswer: { "@type": "Answer", text: f.respuesta },
        };
      }),
    });
  }

  function initForm() {
    var form = $("#contact-form");
    if (!form) return;

    form.addEventListener("submit", function (e) {
      e.preventDefault();

      var terms = $("#form-terms");
      var termsError = $("#terms-error");
      var success = $("#form-success");

      if (termsError) termsError.classList.remove("visible");

      if (!terms || !terms.checked) {
        if (termsError) termsError.classList.add("visible");
        if (terms) terms.focus();
        return;
      }

      var nombre = (form.querySelector('[name="nombre"]') || {}).value || "";
      var empresa = (form.querySelector('[name="empresa"]') || {}).value || "";
      var mensaje = (form.querySelector('[name="mensaje"]') || {}).value || "";
      var servicio = (form.querySelector('[name="servicio"]') || {}).value || "";

      var composed =
        "Consulta desde el sitio web de NovaHogar Distribuidora\n" +
        "ID de campaña: " +
        (cfg.idCampana || "") +
        "\nNombre: " +
        nombre +
        "\nEmpresa: " +
        empresa +
        "\nInterés: " +
        servicio +
        "\n\n" +
        mensaje;

      var dest = whatsappUrl(composed);
      if (dest.indexOf("wa.me") > -1) window.location.href = dest;

      if (success) {
        success.classList.add("visible");
        success.textContent =
          "Su mensaje está listo. Si WhatsApp no se abrió, use el botón flotante o el correo institucional. Nos comunicaremos a la brevedad.";
      }

      form.reset();
      var hidden = $("#campana-id-hidden");
      if (hidden) hidden.value = cfg.idCampana || "";

      setTimeout(function () {
        if (success) success.classList.remove("visible");
      }, 8000);
    });
  }

  function initCookies() {
    var banner = $("#cookie-banner");
    var modal = $("#cookie-modal");
    if (!banner) return;

    if (!localStorage.getItem(CONSENT_KEY)) {
      setTimeout(function () {
        banner.classList.add("visible");
      }, 800);
    }

    function saveConsent(value) {
      localStorage.setItem(CONSENT_KEY, JSON.stringify(value));
      applyConsentMode(value);
      banner.classList.remove("visible");
      if (modal) modal.classList.remove("visible");
    }

    var btnAccept = $("#cookie-accept");
    var btnReject = $("#cookie-reject");
    var btnConfig = $("#cookie-configure");
    var btnSave = $("#cookie-save");
    var btnModalClose = $("#cookie-modal-close");

    if (btnAccept) {
      btnAccept.addEventListener("click", function () {
        saveConsent({ necessary: true, analytics: true, marketing: true });
      });
    }

    if (btnReject) {
      btnReject.addEventListener("click", function () {
        saveConsent({ necessary: true, analytics: false, marketing: false });
      });
    }

    if (btnConfig && modal) {
      btnConfig.addEventListener("click", function () {
        modal.classList.add("visible");
      });
    }

    if (btnSave) {
      btnSave.addEventListener("click", function () {
        saveConsent({
          necessary: true,
          analytics: $("#cookie-analytics") ? $("#cookie-analytics").checked : false,
          marketing: $("#cookie-marketing") ? $("#cookie-marketing").checked : false,
        });
      });
    }

    if (btnModalClose && modal) {
      btnModalClose.addEventListener("click", function () {
        modal.classList.remove("visible");
      });
    }

    if (modal) {
      modal.addEventListener("click", function (e) {
        if (e.target === modal) modal.classList.remove("visible");
      });
    }
  }

  function initParallax() {
    var els = $$("[data-parallax]");
    if (!els.length || window.matchMedia("(max-width: 768px)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    window.addEventListener(
      "scroll",
      function () {
        els.forEach(function (el) {
          var rect = el.getBoundingClientRect();
          if (rect.top < window.innerHeight && rect.bottom > 0) {
            var offset = (rect.top / window.innerHeight) * 40;
            el.style.backgroundPosition = "center " + offset + "px";
          }
        });
      },
      { passive: true }
    );
  }

  function yearStamp() {
    setText("[data-cfg='anioActual']", String(new Date().getFullYear()));
  }

  function escapeHtml(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function buildGoogleAdsSection() {
    var container = $("#google-ads-content");
    if (!container || typeof OV_GOOGLE_ADS === "undefined") return;

    var ads = OV_GOOGLE_ADS;
    var titulares = ads.titulares || [];
    var descripciones = ads.descripciones || [];
    var keywords = ads.palabrasClaveCampana || [];
    var keywordsExacta = ads.palabrasClaveExacta || [];
    var keywordsFrase = ads.palabrasClaveConcordancia || [];
    var checklist = ads.checklistPoliticas || [];
    var sitioUrl = cfg.sitioUrl || ads.urlFinal || "";
    var dominio = cfg.sitioDominio || ads.urlVisualizacion || "";

    var html =
      '<div class="gads-layout">' +
      '<div class="gads-preview-wrap">' +
      '<p class="gads-preview-label">Vista previa del anuncio de búsqueda</p>' +
      '<div class="gads-mock" aria-label="Vista previa de anuncio en Google">' +
      '<div class="gads-mock-badge">Anuncio</div>' +
      '<div class="gads-mock-url"><a href="' +
      sitioUrl +
      '" target="_blank" rel="noopener noreferrer">' +
      escapeHtml(dominio) +
      " › mayorista</a></div>" +
      '<div class="gads-mock-title" id="gads-mock-title">' +
      escapeHtml(titulares[0] ? titulares[0].texto : cfg.nombre) +
      "</div>" +
      '<div class="gads-mock-desc" id="gads-mock-desc">' +
      escapeHtml(descripciones[0] ? descripciones[0].texto : "") +
      "</div></div>" +
      '<p class="gads-preview-note">URL final: <a href="' +
      sitioUrl +
      '" target="_blank" rel="noopener noreferrer">' +
      escapeHtml(sitioUrl) +
      "</a></p>" +
      '<p class="gads-preview-note">El anuncio y esta página dicen lo mismo: ventas de muebles al mayor. No fingimos menudeo ni precios milagro.</p>' +
      "</div><div class=\"gads-blocks\">";

    html +=
      '<div class="gads-block"><h3 class="gads-block-title"><span>' +
      titulares.length +
      "</span> Titulares <small>máximo 30 caracteres</small></h3><div class=\"gads-headlines-grid\">";
    titulares.forEach(function (t, i) {
      html +=
        '<div class="gads-headline-chip"><span class="gads-chip-num">' +
        (i + 1) +
        "</span><span>" +
        escapeHtml(t.texto) +
        '</span><span class="gads-chip-count">' +
        t.texto.length +
        "/30</span></div>";
    });
    html += "</div></div>";

    html +=
      '<div class="gads-block"><h3 class="gads-block-title"><span>' +
      descripciones.length +
      "</span> Descripciones <small>máximo 90 caracteres</small></h3>";
    descripciones.forEach(function (d, i) {
      html +=
        '<div class="gads-desc-card"><span class="gads-chip-num">' +
        (i + 1) +
        "</span><p>" +
        escapeHtml(d.texto) +
        '</p><span class="gads-chip-count">' +
        d.texto.length +
        "/90</span></div>";
    });
    html += "</div>";

    html +=
      '<div class="gads-block"><h3 class="gads-block-title"><span>' +
      keywordsExacta.length +
      "</span> Concordancia exacta <small>copiar con corchetes [ ] en Google Ads</small></h3><div class=\"gads-keywords-cloud\">";
    keywordsExacta.forEach(function (k, i) {
      html +=
        '<span class="gads-keyword-tag gads-keyword-exact"><span class="gads-kw-num">' +
        (i + 1) +
        "</span> " +
        escapeHtml(k) +
        "</span>";
    });
    html += "</div></div>";

    html +=
      '<div class="gads-block"><h3 class="gads-block-title"><span>' +
      keywords.length +
      "</span> Palabras clave <small>amplia (referencia)</small></h3><div class=\"gads-keywords-cloud\">";
    keywords.forEach(function (k, i) {
      html +=
        '<span class="gads-keyword-tag"><span class="gads-kw-num">' +
        (i + 1) +
        "</span> " +
        escapeHtml(k) +
        "</span>";
    });
    html += "</div></div>";

    if (keywordsFrase.length) {
      html +=
        '<div class="gads-block"><h3 class="gads-block-title">Concordancia de frase</h3><div class="gads-keywords-cloud">';
      keywordsFrase.forEach(function (k, i) {
        html +=
          '<span class="gads-keyword-tag"><span class="gads-kw-num">' +
          (i + 1) +
          "</span> " +
          escapeHtml(k) +
          "</span>";
      });
      html += "</div></div>";
    }

    if (ads.anunciante) {
      var a = ads.anunciante;
      html +=
        '<div class="gads-block"><h3 class="gads-block-title">Datos del anunciante</h3><ul class="gads-checklist">' +
        "<li><strong>Nombre:</strong> " +
        escapeHtml(a.nombreComercial) +
        "</li><li><strong>Verificante:</strong> " +
        escapeHtml(a.verificante) +
        " · " +
        escapeHtml(a.cargoVerificante || "") +
        "</li><li><strong>Dirección:</strong> " +
        escapeHtml(cfg.direccion || a.direccion) +
        "</li><li><strong>Correo:</strong> " +
        escapeHtml(cfg.email || a.email) +
        "</li><li><strong>WhatsApp:</strong> " +
        escapeHtml(cfg.telefono || a.telefono) +
        "</li><li><strong>ID de campaña:</strong> " +
        escapeHtml(cfg.idCampana || a.idCampana) +
        "</li><li><strong>URL final:</strong> " +
        escapeHtml(a.urlFinal) +
        "</li></ul></div>";
    }

    if (checklist.length) {
      html +=
        '<div class="gads-block"><h3 class="gads-block-title">Cumplimiento de políticas</h3><ul class="gads-checklist">';
      checklist.forEach(function (item) {
        html += "<li>" + escapeHtml(item) + "</li>";
      });
      html += "</ul></div>";
    }

    html += "</div></div>";
    container.innerHTML = html;

    var mockTitle = $("#gads-mock-title");
    var mockDesc = $("#gads-mock-desc");
    if (mockTitle && titulares.length && descripciones.length) {
      var n = 0;
      setInterval(function () {
        n = (n + 1) % titulares.length;
        mockTitle.textContent = titulares[n].texto;
        mockDesc.textContent = descripciones[n % descripciones.length].texto;
      }, 4000);
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    injectConfig();
    injectSeoExtras();
    yearStamp();
    initHeader();
    initHeroCarousel();
    buildTimeline();
    buildValues();
    buildServices();
    buildProcess();
    buildStats();
    buildSectors();
    buildCatalog();
    buildGallery();
    buildTeam();
    buildTestimonials();
    buildFAQ();
    initReveal();
    initCounters();
    initForm();
    initCookies();
    initParallax();
    bindImageFallbacks();
    buildGoogleAdsSection();
  });
})();
