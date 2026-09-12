(() => {
  const parseColor = (c) => {
    const m = String(c).match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
    if (!m) return null;
    return { r: +m[1], g: +m[2], b: +m[3], a: m[4] === undefined ? 1 : +m[4] };
  };
  const relLum = ({ r, g, b }) => {
    const f = (v) => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const contrast = (fg, bg) => {
    const L1 = relLum(fg);
    const L2 = relLum(bg);
    const lighter = Math.max(L1, L2);
    const darker = Math.min(L1, L2);
    return (lighter + 0.05) / (darker + 0.05);
  };
  const solidBg = (el) => {
    let n = el;
    while (n && n !== document.documentElement) {
      const bg = parseColor(getComputedStyle(n).backgroundColor);
      if (bg && bg.a >= 0.95) return bg;
      n = n.parentElement;
    }
    return parseColor(getComputedStyle(document.body).backgroundColor) || { r: 255, g: 255, b: 255, a: 1 };
  };

  const meta = {
    title: document.title,
    description: document.querySelector('meta[name="description"]')?.content || null,
    canonical: document.querySelector('link[rel="canonical"]')?.href || null,
    robots: document.querySelector('meta[name="robots"]')?.content || null,
    ogTitle: document.querySelector('meta[property="og:title"]')?.content || null,
    ogDesc: document.querySelector('meta[property="og:description"]')?.content || null,
    ogImage: document.querySelector('meta[property="og:image"]')?.content || null,
    ogType: document.querySelector('meta[property="og:type"]')?.content || null,
    twitterCard: document.querySelector('meta[name="twitter:card"]')?.content || null,
    lang: document.documentElement.lang || null,
    viewportMeta: document.querySelector('meta[name="viewport"]')?.content || null,
    h1Count: document.querySelectorAll('h1').length,
    h1Texts: [...document.querySelectorAll('h1')].map((h) => h.textContent.trim().slice(0, 100)),
    jsonLd: [...document.querySelectorAll('script[type="application/ld+json"]')].map((s) => {
      try {
        const j = JSON.parse(s.textContent || '');
        return j['@type'] || (j['@graph'] ? 'graph' : 'object');
      } catch {
        return 'invalid';
      }
    }),
  };

  const imgs = [...document.querySelectorAll('img')].map((img) => {
    const r = img.getBoundingClientRect();
    const nw = img.naturalWidth;
    const nh = img.naturalHeight;
    const dw = Math.round(r.width);
    const dh = Math.round(r.height);
    const naturalRatio = nw && nh ? +(nw / nh).toFixed(3) : null;
    const displayRatio = dw && dh ? +(dw / dh).toFixed(3) : null;
    const ratioDelta = naturalRatio && displayRatio ? Math.abs(naturalRatio - displayRatio) : null;
    const oversize = nw && dw ? +(nw / Math.max(dw, 1)).toFixed(2) : null;
    return {
      src: (img.currentSrc || img.src || '').replace(/^https?:\/\/[^/]+/, '').slice(0, 100),
      alt: (img.alt || '').slice(0, 60),
      hasAlt: img.hasAttribute('alt'),
      nw,
      nh,
      dw,
      dh,
      naturalRatio,
      displayRatio,
      ratioDelta,
      objectFit: getComputedStyle(img).objectFit,
      loading: img.loading || null,
      oversizeFactor: oversize,
      oversized: oversize != null && oversize > 2.5 && dw > 80,
      stretched: ratioDelta != null && ratioDelta > 0.08 && dw > 40 && nh > 0,
      zeroSize: dw === 0 || dh === 0,
    };
  });

  const a11y = {
    imagesMissingAlt: imgs.filter((i) => !i.hasAlt).length,
    buttonsNoName: [...document.querySelectorAll('button')].filter((b) => {
      const name = (b.getAttribute('aria-label') || b.textContent || '').trim();
      return !name;
    }).length,
    linksNoName: [...document.querySelectorAll('a')].filter((a) => {
      const name = (a.getAttribute('aria-label') || a.textContent || '').trim();
      return !name && !a.querySelector('img[alt]');
    }).length,
    inputsNoLabel: [...document.querySelectorAll('input,select,textarea')]
      .filter((el) => {
        if (el.type === 'hidden') return false;
        const id = el.id;
        const labelled =
          el.getAttribute('aria-label') ||
          el.getAttribute('aria-labelledby') ||
          (id && document.querySelector(`label[for="${CSS.escape(id)}"]`));
        return !labelled;
      })
      .map((el) => ({ tag: el.tagName, name: el.name || el.id || el.placeholder || '' }))
      .slice(0, 20),
  };

  const contrastFails = [];
  const sampleEls = [
    ...document.querySelectorAll('a,button,h1,h2,h3,p,nav a,span,label'),
  ].slice(0, 200);
  for (const el of sampleEls) {
    const cs = getComputedStyle(el);
    const fg = parseColor(cs.color);
    if (!fg || fg.a < 0.5) continue;
    const rect = el.getBoundingClientRect();
    if (rect.width < 8 || rect.height < 8) continue;
    const bg = solidBg(el);
    const ratio = +contrast(fg, bg).toFixed(2);
    const fontSize = parseFloat(cs.fontSize);
    const bold = parseInt(cs.fontWeight, 10) >= 600;
    const large = fontSize >= 18 || (fontSize >= 14 && bold);
    const passAA = large ? ratio >= 3 : ratio >= 4.5;
    if (!passAA) {
      contrastFails.push({
        tag: el.tagName.toLowerCase(),
        text: (el.textContent || '').trim().slice(0, 40),
        ratio,
        color: cs.color,
        bg: `rgb(${bg.r},${bg.g},${bg.b})`,
        fontSize,
      });
    }
  }
  const seen = new Set();
  const contrastUnique = contrastFails
    .filter((c) => {
      const k = `${c.text}|${c.ratio}|${c.color}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    })
    .slice(0, 20);

  const overflowX = document.documentElement.scrollWidth > window.innerWidth + 2;
  const stickyCtas = [...document.querySelectorAll('*')]
    .filter((el) => getComputedStyle(el).position === 'fixed')
    .filter((el) => el.getBoundingClientRect().height > 0)
    .map((el) => ({
      text: (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 70),
      bottom: getComputedStyle(el).bottom,
      top: getComputedStyle(el).top,
      className: String(el.className || '').slice(0, 100),
    }))
    .slice(0, 10);

  const header = document.querySelector('header') || document.querySelector('[role="banner"]');
  const headerText = header ? header.innerText.replace(/\s+/g, ' ').slice(0, 200) : '';
  const buyButtons = [...document.querySelectorAll('a,button')]
    .filter((el) => /bilet al|satın al|satış/i.test(el.textContent || ''))
    .map((el) => {
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      return {
        text: (el.textContent || '').trim().slice(0, 40),
        visible: r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none',
        w: Math.round(r.width),
        h: Math.round(r.height),
        y: Math.round(r.top),
      };
    });

  return {
    viewport: { w: window.innerWidth, h: window.innerHeight, dpr: window.devicePixelRatio },
    url: location.href,
    path: location.pathname,
    meta,
    a11y,
    imageStats: {
      total: imgs.length,
      missingAlt: imgs.filter((i) => !i.hasAlt).length,
      oversized: imgs.filter((i) => i.oversized).length,
      stretched: imgs.filter((i) => i.stretched).length,
      zeroSize: imgs.filter((i) => i.zeroSize).length,
      samples: imgs.filter((i) => i.dw > 40).slice(0, 15),
      worstOversized: imgs
        .filter((i) => i.oversized)
        .sort((a, b) => b.oversizeFactor - a.oversizeFactor)
        .slice(0, 8),
      stretchedSamples: imgs.filter((i) => i.stretched).slice(0, 8),
    },
    contrastFails: contrastUnique,
    layout: {
      overflowX,
      scrollWidth: document.documentElement.scrollWidth,
      stickyCtas,
      headerCity: {
        hasCityInHeader: /Antalya|İstanbul|Muğla|Ankara|İzmir/.test(headerText),
        snippet: headerText,
      },
      buyButtons,
    },
  };
})()
