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

  // Seletor de idioma: salva a escolha antes de seguir o link.
  all('a[data-lang]').forEach(function (a) {
    a.addEventListener('click', function () {
      try { localStorage.setItem('ro-lang', a.getAttribute('data-lang')); } catch (e) {}
    });
  });

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

  // Contato: tipo de projeto, copiar e-mail e envio (ainda só local).
  var pickType = choice('o');
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
    form.addEventListener('submit', function (e) { e.preventDefault(); setSent(true); });
    d.querySelector('[data-action="reset"]').addEventListener('click', function () {
      form.reset();
      pickType(0, false);
      setSent(false);
    });
  }
})();
