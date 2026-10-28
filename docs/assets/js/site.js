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

  // Case kit (template de case): barra de seções, índice da jornada e visualizador de figuras.
  // Só roda nas páginas com .ck; sem JavaScript, as âncoras continuam funcionando.
  var ck = d.querySelector('.ck');
  if (ck) {
    var reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    var rail = d.querySelector('.ck-rail');
    // A barra de seções fica logo abaixo do menu fixo global; --ck-stk é a altura dele.
    var setStk = function () { if (stk) d.documentElement.style.setProperty('--ck-stk', stk.offsetHeight + 'px'); };
    setStk();

    // Item ativo de uma navegação por âncoras: a última seção cujo topo já passou da linha logo abaixo
    // das barras fixas. Um IntersectionObserver numa faixa de 1px nessa linha avisa quando algum topo cruza.
    var spy = function (nav, extra, onChange) {
      var links = Array.prototype.slice.call(nav.querySelectorAll('a[href^="#"]'));
      var targets = links.map(function (a) { return d.getElementById(a.getAttribute('href').slice(1)); });
      var current = null, io = null;
      var line = function () { return (stk ? stk.offsetHeight : 0) + (rail ? rail.offsetHeight : 0) + extra() + 24; };
      var update = function () {
        var y = line(), on = null;
        targets.forEach(function (t, k) { if (t && t.getBoundingClientRect().top <= y) on = links[k]; });
        if (on === current) return;
        current = on;
        links.forEach(function (a) { if (a === on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
        if (on && onChange) onChange(on);
      };
      var observe = function () {
        if (io) io.disconnect();
        var y = line(), h = window.innerHeight || 800;
        io = new IntersectionObserver(update, { rootMargin: -y + 'px 0px ' + -Math.max(h - y - 1, 0) + 'px 0px' });
        targets.forEach(function (t) { if (t) io.observe(t); });
        update();
      };
      if ('IntersectionObserver' in window) observe(); else update();
      // Saltos de rolagem (âncoras, Home/End) podem cruzar a linha sem disparar o observador: confere também na rolagem.
      var queued = false;
      window.addEventListener('scroll', function () {
        if (queued) return;
        queued = true;
        requestAnimationFrame(function () { queued = false; update(); });
      }, { passive: true });
      return observe;
    };
    var none = function () { return 0; };
    var refresh = [];
    if (rail) refresh.push(spy(rail, none, function (a) {
      // No mobile a barra rola na horizontal: mantém o item ativo à vista.
      var box = a.parentNode;
      if (box.scrollWidth <= box.clientWidth) return;
      var left = a.offsetLeft - 16;
      if (left < box.scrollLeft || a.offsetLeft + a.offsetWidth > box.scrollLeft + box.clientWidth) box.scrollTo({ left: left, behavior: reduce ? 'auto' : 'smooth' });
    }));
    var jr = d.querySelector('.ck-jr__idx');
    // No mobile o índice vira uma barra de progresso fixa logo abaixo da barra de seções.
    if (jr) refresh.push(spy(jr, function () { return getComputedStyle(jr).flexDirection === 'row' ? jr.offsetHeight : 0; }));
    var timer;
    window.addEventListener('resize', function () {
      clearTimeout(timer);
      timer = setTimeout(function () { setStk(); refresh.forEach(function (f) { f(); }); }, 150);
    });

    // Visualizador: abre qualquer figura em tamanho real (página completa rola dentro dele).
    var lb = d.querySelector('[data-ck-lightbox]');
    var zooms = all('[data-ck-zoom]');
    if (lb && zooms.length && typeof lb.showModal === 'function') {
      var stage = lb.querySelector('[data-ck-lb-stage]'), count = lb.querySelector('[data-ck-lb-count]');
      var title = lb.querySelector('[data-ck-lb-title]'), cap = lb.querySelector('[data-ck-lb-cap]'), notes = lb.querySelector('[data-ck-lb-notes]');
      var prev = lb.querySelector('[data-ck-lb-prev]'), next = lb.querySelector('[data-ck-lb-next]'), closeBtn = lb.querySelector('[data-ck-lb-close]');
      var at = 0, opener = null;
      var text = function (el) { return el ? el.textContent.replace(/\s+/g, ' ').trim() : ''; };
      var render = function (i) {
        at = i;
        var btn = zooms[i], img = btn.querySelector('img'), fig = btn.closest('figure');
        var w = +img.getAttribute('width') || img.naturalWidth || 1, h = +img.getAttribute('height') || img.naturalHeight || 1;
        var big = d.createElement('img');
        big.alt = img.alt;
        if (img.getAttribute('srcset')) { big.srcset = img.getAttribute('srcset'); big.sizes = '(max-width: 760px) 100vw, 1100px'; }
        big.src = img.getAttribute('src');
        stage.innerHTML = '';
        stage.appendChild(big);
        stage.classList.toggle('is-tall', h / w > 1.2);
        stage.scrollTop = 0;
        count.textContent = text(fig && fig.querySelector('.ck-cap b')) + ' · ' + (i + 1) + ' ' + lb.getAttribute('data-of') + ' ' + zooms.length;
        title.textContent = btn.getAttribute('data-ck-title') || img.alt;
        cap.textContent = text(fig && fig.querySelector('.ck-cap__t'));
        notes.innerHTML = '';
        (btn.getAttribute('data-ck-notes') || '').split('|').filter(Boolean).forEach(function (n) {
          var li = d.createElement('li'), b = d.createElement('b'), s = d.createElement('span');
          var parts = n.split('::');
          b.textContent = parts[0]; s.textContent = parts[1] || '';
          li.appendChild(b); li.appendChild(s); notes.appendChild(li);
        });
        prev.disabled = i === 0;
        next.disabled = i === zooms.length - 1;
      };
      var open = function (i, from) {
        opener = from;
        render(i);
        lb.showModal();
        d.documentElement.style.overflow = 'hidden';
        closeBtn.focus();
      };
      zooms.forEach(function (btn, i) { btn.addEventListener('click', function () { open(i, btn); }); });
      all('[data-ck-full]').forEach(function (b) {
        var target = b.parentNode.querySelector('[data-ck-zoom]');
        b.addEventListener('click', function () { open(zooms.indexOf(target), b); });
      });
      prev.addEventListener('click', function () { if (at > 0) render(at - 1); });
      next.addEventListener('click', function () { if (at < zooms.length - 1) render(at + 1); });
      closeBtn.addEventListener('click', function () { lb.close(); });
      lb.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowLeft' && at > 0) { e.preventDefault(); render(at - 1); }
        if (e.key === 'ArrowRight' && at < zooms.length - 1) { e.preventDefault(); render(at + 1); }
        // Foco preso no modal: Tab e Shift+Tab circulam entre os controles do visualizador.
        if (e.key === 'Tab') {
          var f = Array.prototype.slice.call(lb.querySelectorAll('button, [tabindex="0"]')).filter(function (x) { return !x.disabled; });
          var i = f.indexOf(d.activeElement);
          if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
          else if (!e.shiftKey && (i === -1 || i === f.length - 1)) { e.preventDefault(); f[0].focus(); }
        }
      });
      // Esc (cancel) e o botão fecham; o foco volta para quem abriu.
      lb.addEventListener('close', function () {
        d.documentElement.style.overflow = '';
        stage.innerHTML = '';
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
