// Comportamentos do site estático (substitui o runtime do canvas).
// Copiado para docs/assets/js/site.js por tools/build.mjs.
(function () {
  var d = document, b = d.body;
  var all = function (sel) { return Array.prototype.slice.call(d.querySelectorAll(sel)); };
  var show = function (el, on) { if (on) el.removeAttribute('hidden'); else el.setAttribute('hidden', ''); };

  // Menu fixo: aparece depois do limite de rolagem de cada página.
  var stk = d.querySelector('.ro-stk');
  if (stk) {
    var mode = b.getAttribute('data-stk'), stuck = false;
    var limit = function () { return mode === 'hero' ? Math.min(window.innerHeight || 800, 960) - 80 : Number(mode); };
    var update = function () {
      var on = (window.scrollY || d.documentElement.scrollTop || 0) > limit();
      if (on !== stuck) { stuck = on; stk.classList.toggle('ro-on', on); }
    };
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
  }

  // Menu responsivo: os botões .ro-burger vêm do build; o painel é montado aqui
  // com cópias do logo, dos links, do seletor de idioma e do CTA do menu fixo.
  var burgers = all('.ro-burger'), src = d.querySelector('.ro-stk .ro-hd');
  try { if (!burgers.length || !src) throw 0;
    var labelOpen = burgers[0].getAttribute('aria-label'), labelClose = burgers[0].getAttribute('data-label-close');
    var menu = d.createElement('div');
    menu.id = 'ro-menu';
    menu.className = 'ro-menu';
    menu.hidden = true;
    menu.setAttribute('role', 'dialog');
    menu.setAttribute('aria-modal', 'true');
    menu.setAttribute('aria-label', 'Menu');
    var bar = d.createElement('div'), barIn = d.createElement('div');
    bar.className = 'ro-menu-bar';
    bar.appendChild(barIn);
    barIn.appendChild(src.firstElementChild.cloneNode(true));
    var closeBtn = d.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'ro-burger';
    closeBtn.setAttribute('aria-label', labelClose);
    closeBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true" focusable="false"><path d="M5 5l10 10M15 5L5 15"/></svg>';
    barIn.appendChild(closeBtn);
    var inner = d.createElement('div'), foot = d.createElement('div');
    inner.className = 'ro-menu-in';
    foot.className = 'ro-menu-ft';
    var nav = src.querySelector('nav').cloneNode(true), mainNav = d.querySelector('.ro-hd nav:not(.ro-stk nav)');
    nav.removeAttribute('style');  // o layout em lista vem do CSS do painel
    if (mainNav) nav.setAttribute('aria-label', mainNav.getAttribute('aria-label'));
    inner.appendChild(nav);
    // Grupo da direita: seletor de idioma e, quando existe, o CTA.
    var right = src.lastElementChild;
    (right.getAttribute('role') === 'group' ? [right] : Array.prototype.slice.call(right.children))
      .forEach(function (el) { foot.appendChild(el.cloneNode(true)); });
    inner.appendChild(foot);
    menu.appendChild(bar);
    menu.appendChild(inner);
    b.appendChild(menu);

    var mq = window.matchMedia('(max-width: 960px)'), opener = null;  // = MENU_BP em tools/build.mjs
    var setOpen = function (on, restoreFocus) {
      if (on === !menu.hidden) return;
      menu.hidden = !on;
      d.documentElement.classList.toggle('ro-menu-lock', on);
      Array.prototype.forEach.call(b.children, function (el) {
        if (el !== menu && el.tagName !== 'SCRIPT') { if (on) el.setAttribute('inert', ''); else el.removeAttribute('inert'); }
      });
      burgers.forEach(function (bt) {
        bt.setAttribute('aria-expanded', on ? 'true' : 'false');
        bt.setAttribute('aria-label', on ? labelClose : labelOpen);
      });
      if (on) closeBtn.focus();
      else if (restoreFocus && opener) opener.focus();
    };
    burgers.forEach(function (bt) {
      bt.addEventListener('click', function () { opener = bt; setOpen(menu.hidden, true); });
    });
    closeBtn.addEventListener('click', function () { setOpen(false, true); });
    menu.addEventListener('click', function (e) { if (e.target.closest('a')) setOpen(false, false); });
    d.addEventListener('keydown', function (e) {
      if (menu.hidden) return;
      if (e.key === 'Escape') { e.preventDefault(); setOpen(false, true); return; }
      if (e.key !== 'Tab') return;
      // Mantém o foco dentro do painel (reforço para navegadores sem inert).
      var items = all('.ro-menu a[href], .ro-menu button');
      var first = items[0], last = items[items.length - 1];
      if (e.shiftKey && d.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && d.activeElement === last) { e.preventDefault(); first.focus(); }
    });
    // Ao voltar para o layout desktop, o painel não pode continuar aberto.
    var onMq = function () { if (!mq.matches) setOpen(false, false); };
    if (mq.addEventListener) mq.addEventListener('change', onMq); else mq.addListener(onMq);
    // Página restaurada do histórico (bfcache) sempre volta com o painel fechado.
    window.addEventListener('pageshow', function () { setOpen(false, false); });
  } catch (e) {
    // Sem o painel montado, o botão não teria função: volta o cabeçalho original.
    d.documentElement.classList.remove('ro-js');
  }

  // Seletor de idioma: salva a escolha antes de seguir o link.
  all('a[data-lang]').forEach(function (a) {
    a.addEventListener('click', function () {
      try { localStorage.setItem('ro-lang', a.getAttribute('data-lang')); } catch (e) {}
    });
  });

  // Home: cards de serviço entram ao aparecer na tela, uma única vez. A classe que os esconde
  // (.ro-rv-on) só é aplicada aqui; sem JavaScript, sem IntersectionObserver ou com movimento
  // reduzido, os cards ficam visíveis desde o início.
  var reveal = all('.ro-rv');
  if (reveal.length && 'IntersectionObserver' in window && !(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('ro-rv-in');
        io.unobserve(en.target);
      });
    }, { threshold: 0.15 });
    d.documentElement.classList.add('ro-rv-on');
    reveal.forEach(function (el) { io.observe(el); });
  }

  // Case kit (template de case): barra de seções (com menu "Seções" no celular), índice da jornada e
  // visualizador de figuras. Só roda nas páginas com .ck; sem JavaScript, as âncoras continuam funcionando.
  var ck = d.querySelector('.ck-rail') ? d.querySelector('.ck') : null;
  if (ck) {
    var reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    var rail = d.querySelector('.ck-rail');
    // A barra de seções fica logo abaixo do menu fixo do site; --ck-stk é a altura real dele.
    var setStk = function () { if (stk) d.documentElement.style.setProperty('--ck-stk', stk.offsetHeight + 'px'); };
    setStk();
    var bars = function () { return (stk ? stk.offsetHeight : 0) + rail.offsetHeight; };

    // Item ativo de uma navegação por âncoras: a última seção cujo topo já passou da linha logo abaixo
    // das barras fixas. Um IntersectionObserver numa faixa de 1px nessa linha avisa quando algum topo cruza;
    // a rolagem também confere (saltos por âncora ou Home/End podem cruzar a linha sem disparar o observador).
    var spy = function (links, extra, onChange) {
      var targets = links.map(function (a) { return d.getElementById(a.getAttribute('href').slice(1)); });
      var current, io = null;
      var line = function () { return bars() + extra() + 32; };
      var update = function () {
        var y = line(), on = null;
        targets.forEach(function (t, k) { if (t && t.getBoundingClientRect().top <= y) on = links[k]; });
        if (on === current) return;
        current = on;
        links.forEach(function (a) { if (a === on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
        if (onChange) onChange(on);
      };
      var observe = function () {
        if (io) io.disconnect();
        if (!('IntersectionObserver' in window)) return update();
        var y = line(), h = window.innerHeight || 800;
        io = new IntersectionObserver(update, { rootMargin: -y + 'px 0px ' + -Math.max(h - y - 1, 0) + 'px 0px' });
        targets.forEach(function (t) { if (t) io.observe(t); });
        update();
      };
      var queued = false;
      window.addEventListener('scroll', function () {
        if (queued) return;
        queued = true;
        requestAnimationFrame(function () { queued = false; update(); });
      }, { passive: true });
      observe();
      return { refresh: observe };
    };
    var none = function () { return 0; };
    var watchers = [];
    var deskLinks = Array.prototype.slice.call(rail.querySelectorAll('.ck-rail__in a[href^="#"]'));
    watchers.push(spy(deskLinks, none, function (a) {
      // Quando a barra rola na horizontal, mantém o item ativo à vista.
      if (!a) return;
      var box = a.parentNode;
      if (box.scrollWidth <= box.clientWidth) return;
      if (a.offsetLeft < box.scrollLeft || a.offsetLeft + a.offsetWidth > box.scrollLeft + box.clientWidth) box.scrollTo({ left: a.offsetLeft - 16, behavior: reduce ? 'auto' : 'smooth' });
    }));

    // Celular: "n/5", nome da seção atual e o botão "Seções", que abre a lista; os links fecham a lista.
    var sheet = rail.querySelector('[data-ck-sheet]'), sheetBtn = rail.querySelector('[data-ck-sheet-btn]');
    var curName = rail.querySelector('[data-ck-cur]'), curN = rail.querySelector('[data-ck-n]');
    if (sheet && sheetBtn) {
      var sheetLinks = Array.prototype.slice.call(sheet.querySelectorAll('a[href^="#"]'));
      var setSheet = function (open, focusBtn) {
        sheet.hidden = !open;
        sheetBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
        if (open) (sheet.querySelector('[aria-current="true"]') || sheetLinks[0]).focus();
        if (!open && focusBtn) sheetBtn.focus();
      };
      sheetBtn.addEventListener('click', function () { setSheet(sheet.hidden); });
      sheetLinks.forEach(function (a) { a.addEventListener('click', function () { setSheet(false); }); });
      rail.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !sheet.hidden) { e.preventDefault(); setSheet(false, true); } });
      d.addEventListener('click', function (e) { if (!sheet.hidden && !rail.contains(e.target)) setSheet(false); });
      watchers.push(spy(sheetLinks, none, function (a) {
        var k = a ? sheetLinks.indexOf(a) : 0;
        if (curN) curN.textContent = (k + 1) + '/' + sheetLinks.length;
        if (curName) curName.textContent = (a || sheetLinks[0]).querySelector('[data-name]').textContent;
      }));
    }

    // Linha de progresso de leitura sob a barra de seções.
    var first = d.getElementById('contexto'), last = d.getElementById('resultados');
    var progress = function () {
      if (!first || !last) return;
      var start = first.getBoundingClientRect().top + window.scrollY - bars();
      var end = last.getBoundingClientRect().bottom + window.scrollY - window.innerHeight;
      var f = end > start ? (window.scrollY - start) / (end - start) : 0;
      rail.style.setProperty('--ck-pr', Math.round(Math.max(0, Math.min(1, f)) * 100) + '%');
    };
    var pq = false;
    window.addEventListener('scroll', function () {
      if (pq) return;
      pq = true;
      requestAnimationFrame(function () { pq = false; progress(); });
    }, { passive: true });
    progress();

    // Índice da jornada; no tablet e no celular vira uma barra de etapas fixa logo abaixo da barra de seções.
    var jr = d.querySelector('.ck-jr__idx');
    if (jr) watchers.push(spy(Array.prototype.slice.call(jr.querySelectorAll('a[href^="#"]')), function () { return getComputedStyle(jr).flexDirection === 'row' ? jr.offsetHeight : 0; }));
    var timer;
    window.addEventListener('resize', function () {
      clearTimeout(timer);
      timer = setTimeout(function () { setStk(); watchers.forEach(function (w) { w.refresh(); }); progress(); }, 150);
    });

    // Figuras A+ (§6.3): marcador que não cabe na 1ª dobra visível (ou cai no degradê) sai da tela
    // e vai, pequeno, para a régua; no visualizador ele continua sobre a página completa.
    var foldMarks = function () {
      all('.ck-ap .ck-zoom').forEach(function (z) {
        var shot = z.querySelector('.ck-shot'), ruler = z.closest('.ck-ap__row').querySelector('.ck-ruler__page');
        if (!shot) return;
        var limit = z.clientHeight - (z.closest('.ck-win') ? 100 : 40);
        // a régua mostra a fração da página que a janela exibe na altura atual
        if (ruler && z.closest('.ck-win') && shot.offsetHeight) {
          var pct = Math.min(100, Math.round(z.clientHeight / shot.offsetHeight * 100)), lab = ruler.parentNode.querySelector('small');
          ruler.querySelector('.ck-ruler__vis').style.setProperty('--vis', pct + '%');
          if (lab) lab.textContent = lab.textContent.replace(/^\d+%/, pct + '%');
        }
        Array.prototype.slice.call(shot.querySelectorAll('.ck-mark')).forEach(function (m) {
          var out = parseFloat(m.style.top) / 100 * shot.offsetHeight > limit;
          m.hidden = out;
          if (!ruler || !z.closest('.ck-win')) return;
          var rm = ruler.querySelector('[data-from="' + m.textContent + '"]');
          if (out && !rm) {
            rm = d.createElement('span');
            rm.className = 'ck-ruler__mark'; rm.textContent = m.textContent; rm.style.top = m.style.top;
            rm.setAttribute('data-from', m.textContent);
            ruler.appendChild(rm);
          }
          if (!out && rm) rm.remove();
        });
      });
    };
    foldMarks();
    window.addEventListener('load', foldMarks);
    window.addEventListener('resize', foldMarks);

    // Visualizador (§6.4): abre qualquer figura em tamanho real. Cada botão [data-ck-zoom] é uma versão;
    // as versões de uma mesma figura (data-ck-g) viram abas Desktop/Mobile. ← → percorrem todas em sequência.
    var lb = d.querySelector('[data-ck-lightbox]');
    var items = all('[data-ck-zoom]');
    if (lb && items.length && typeof lb.showModal === 'function') {
      var q = function (s) { return lb.querySelector(s); };
      var stage = q('[data-ck-lb-stage]'), page = q('[data-ck-lb-page]'), side = q('[data-ck-lb-side]');
      var prev = q('[data-ck-lb-prev]'), next = q('[data-ck-lb-next]'), closeBtn = q('[data-ck-lb-close]'), more = q('[data-ck-lb-more]');
      var tabs = Array.prototype.slice.call(lb.querySelectorAll('[data-ck-lb-tab]'));
      var fits = Array.prototype.slice.call(lb.querySelectorAll('[data-ck-lb-fit]'));
      var miniBox = q('[data-ck-lb-mini]'), mini = d.createElement('img'), rect = q('[data-ck-lb-rect]'), pct = q('[data-ck-lb-pct]'), scaleTxt = q('[data-ck-lb-scale]'), bar = q('[data-ck-lb-progress]');
      mini.alt = '';
      miniBox.insertBefore(mini, miniBox.firstChild);
      var at = 0, opener = null, fit = 'fit';
      var A = function (el, n) { return el.getAttribute('data-ck-' + n) || ''; };
      var small = function () { return !!(window.matchMedia && window.matchMedia('(max-width: 760px)').matches); };
      var group = function (i) { var g = A(items[i], 'g'); return items.filter(function (x) { return A(x, 'g') === g; }); };
      var track = function () {
        var max = stage.scrollHeight - stage.clientHeight, f = max > 0 ? stage.scrollTop / max : 0;
        var mh = mini.clientHeight || 1, vis = Math.min(1, stage.clientHeight / (page.offsetHeight || 1));
        var rh = Math.max(6, Math.round(mh * vis));
        rect.style.height = rh + 'px';
        rect.style.top = Math.round(f * (mh - rh)) + 'px';
        pct.textContent = Math.round(f * 100) + lb.getAttribute('data-page');
        bar.style.width = Math.round(f * 100) + '%';
      };
      var size = function () {
        var it = items[at], v = A(it, 'v'), w = +A(it, 'w'), h = +A(it, 'h');
        var avail = stage.clientWidth - (small() ? 0 : 144);
        var width;
        if (v === 'mobile') width = Math.min(390, avail);
        else if (v === 'desktop') width = small() ? avail : fit === 'real' ? 1440 : Math.max(320, Math.min(960, avail));
        else width = Math.max(200, Math.min(w, avail, (stage.clientHeight - 48) * w / h));
        page.style.width = Math.round(width) + 'px';
        scaleTxt.textContent = v === 'desktop' && !small() ? lb.getAttribute(fit === 'real' ? 'data-real' : 'data-fit') : '';
        track();
      };
      var render = function (i) {
        at = i;
        var it = items[i], g = group(i), v = A(it, 'v');
        var notesData = A(it, 'notes') ? A(it, 'notes').split(';').map(function (n) { return n.split('|'); }) : [];
        page.innerHTML = '';
        var img = d.createElement('img');
        img.alt = it.querySelector('img') ? it.querySelector('img').alt : '';
        img.width = +A(it, 'w'); img.height = +A(it, 'h');
        img.src = A(it, 'src');
        img.addEventListener('load', track);
        page.appendChild(img);
        notesData.forEach(function (p) {
          if (!p[1]) return;
          var m = d.createElement('span');
          m.className = 'ck-mark'; m.textContent = p[0];
          m.style.left = p[1] + '%'; m.style.top = p[2] + '%';
          m.setAttribute('aria-hidden', 'true');
          page.appendChild(m);
        });
        q('[data-ck-lb-fig]').textContent = A(it, 'fig');
        q('[data-ck-lb-title]').textContent = A(it, 'name');
        q('[data-ck-lb-count]').textContent = g.length > 1 ? (g.indexOf(it) + 1) + ' ' + lb.getAttribute('data-of') + ' ' + g.length : '';
        q('[data-ck-lb-step]').textContent = A(it, 'step');
        q('[data-ck-lb-h]').textContent = A(it, 'title') + (small() && v === 'desktop' ? ' · ' + lb.getAttribute('data-pinch') : '');
        q('[data-ck-lb-text]').textContent = A(it, 'text');
        var notes = q('[data-ck-lb-notes]');
        notes.innerHTML = '';
        notesData.forEach(function (p) {
          var li = d.createElement('li'), b = d.createElement('b'), s = d.createElement('span');
          b.textContent = p[0]; s.textContent = p[3] || '';
          li.appendChild(b); li.appendChild(s); notes.appendChild(li);
        });
        mini.src = A(it, 'src');
        mini.closest('.ck-lb__map').hidden = !v;
        tabs.forEach(function (t) {
          var target = g.filter(function (x) { return A(x, 'v') === t.getAttribute('data-ck-lb-tab'); })[0];
          t.disabled = !target || g.length < 2;
          t.setAttribute('aria-pressed', target === it ? 'true' : 'false');
        });
        q('.ck-lb__fit').hidden = v !== 'desktop';
        fits.forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-ck-lb-fit') === fit ? 'true' : 'false'); });
        prev.disabled = i === 0;
        next.disabled = i === items.length - 1;
        stage.scrollTop = 0;
        size();
      };
      var open = function (i, from) {
        opener = from;
        fit = 'fit';
        side.classList.remove('is-open');
        more.setAttribute('aria-expanded', 'false');
        more.textContent = lb.getAttribute('data-open');
        lb.showModal();
        d.documentElement.style.overflow = 'hidden';
        render(i);
        closeBtn.focus();
      };
      items.forEach(function (btn, i) { btn.addEventListener('click', function () { open(i, btn); }); });
      tabs.forEach(function (t) {
        t.addEventListener('click', function () {
          var target = group(at).filter(function (x) { return A(x, 'v') === t.getAttribute('data-ck-lb-tab'); })[0];
          if (target) render(items.indexOf(target));
        });
      });
      fits.forEach(function (b) { b.addEventListener('click', function () { fit = b.getAttribute('data-ck-lb-fit'); render(at); }); });
      prev.addEventListener('click', function () { if (at > 0) render(at - 1); });
      next.addEventListener('click', function () { if (at < items.length - 1) render(at + 1); });
      closeBtn.addEventListener('click', function () { lb.close(); });
      more.addEventListener('click', function () {
        var o = side.classList.toggle('is-open');
        more.setAttribute('aria-expanded', o ? 'true' : 'false');
        more.textContent = lb.getAttribute(o ? 'data-close' : 'data-open');
      });
      stage.addEventListener('scroll', track, { passive: true });
      window.addEventListener('resize', function () { if (lb.open) size(); });
      lb.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowLeft' && at > 0) { e.preventDefault(); render(at - 1); }
        if (e.key === 'ArrowRight' && at < items.length - 1) { e.preventDefault(); render(at + 1); }
        // Foco preso no diálogo: Tab e Shift+Tab circulam entre os controles visíveis.
        if (e.key === 'Tab') {
          var f = Array.prototype.slice.call(lb.querySelectorAll('button, [tabindex="0"]')).filter(function (x) { return !x.disabled && x.getClientRects().length; });
          var k = f.indexOf(d.activeElement);
          if (e.shiftKey && k <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
          else if (!e.shiftKey && (k === -1 || k === f.length - 1)) { e.preventDefault(); f[0].focus(); }
        }
      });
      // Esc (cancel) e o botão fecham; o foco volta para quem abriu.
      lb.addEventListener('close', function () {
        d.documentElement.style.overflow = '';
        page.innerHTML = '';
        if (opener) opener.focus();
      });
    }
  }

  // Grupo de botões com versões ativa/inativa geradas lado a lado.
  function choice(prefix, onPick) {
    var on = all('[data-if="' + prefix + '.on"]'), off = all('[data-if="' + prefix + '.off"]');
    var pick = function (i, focus) {
      on.forEach(function (el, j) { show(el, j === i); });
      off.forEach(function (el, j) { show(el, j !== i); });
      if (focus) on[i].focus();
      if (onPick) onPick(i);
    };
    off.forEach(function (el, i) { el.addEventListener('click', function () { pick(i, true); }); });
    return pick;
  }

  // Projetos: filtro por categoria.
  var keys = (b.getAttribute('data-filters') || '').split(',');
  choice('f', function (i) {
    all('[data-cat]').forEach(function (card) { show(card, keys[i] === 'all' || card.getAttribute('data-cat') === keys[i]); });
  });

  // Contato: tipo de projeto, copiar e-mail e envio pelo Web3Forms.
  var typeInput = d.querySelector('input[name="project_type"]');
  var pickType = choice('o', function (i) {
    if (typeInput) typeInput.value = all('[data-if="o.on"]')[i].textContent.trim();
  });
  var copyBtn = d.querySelector('[data-action="copy"]');
  if (copyBtn) {
    var status = copyBtn.parentNode.querySelector('[role="status"]'), timer;
    var mail = d.querySelector('a[href^="mailto:"]').getAttribute('href').slice(7);
    var setCopied = function (on) {
      all('[data-if="copied"]').forEach(function (el) { show(el, on); });
      all('[data-if="notCopied"]').forEach(function (el) { show(el, !on); });
      status.textContent = on ? b.getAttribute('data-msg-copied') : '';
    };
    copyBtn.addEventListener('click', function () {
      try { if (navigator.clipboard) navigator.clipboard.writeText(mail); } catch (e) {}
      setCopied(true);
      clearTimeout(timer);
      timer = setTimeout(function () { setCopied(false); }, 2200);
    });
  }
  var form = d.querySelector('form[data-action="submit"]');
  if (form) {
    var setSent = function (on) {
      all('[data-if="sent"]').forEach(function (el) { show(el, on); });
      all('[data-if="notSent"]').forEach(function (el) { show(el, !on); });
    };
    var sendBtn = form.querySelector('button[type="submit"]');
    var sendLabel = sendBtn.querySelector('.ro-send-l'), idleText = sendLabel.textContent;
    var alertBox = form.querySelector('[data-if="failed"]'), errorHtml = alertBox.innerHTML;
    var sending = false;
    var setSending = function (on) {
      sending = on;
      sendBtn.disabled = on;
      sendLabel.textContent = on ? b.getAttribute('data-msg-sending') : idleText;
    };
    // O alerta aparece vazio e recebe o texto em seguida, para os leitores de tela anunciarem.
    var setFailed = function (on) {
      alertBox.textContent = '';
      show(alertBox, on);
      if (on) setTimeout(function () { alertBox.innerHTML = errorHtml; }, 50);
    };
    // Sem JavaScript, o formulário segue pelo action/method do HTML.
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (sending) return;
      setFailed(false);
      if (!form.elements.access_key.value || !window.fetch) { setFailed(true); return; }
      setSending(true);
      var data = {};
      new FormData(form).forEach(function (v, k) { data[k] = v; });
      fetch(form.action, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(data)
      }).then(function (r) {
        return r.json().then(function (j) { if (!r.ok || !j.success) throw new Error(j.message || r.status); });
      }).then(function () {
        setSending(false);
        setSent(true);
      }, function () {
        // Mantém o que foi preenchido para a pessoa tentar de novo.
        setSending(false);
        setFailed(true);
      });
    });
    d.querySelector('[data-action="reset"]').addEventListener('click', function () {
      form.reset();
      pickType(0, false);
      setFailed(false);
      setSent(false);
    });
  }
})();
