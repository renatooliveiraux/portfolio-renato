// Gera o site estático em docs/ a partir dos protótipos src/*.dc.html.
// Ferramenta local (Node 18+, sem dependências). O GitHub Pages publica só docs/.
// Uso: node tools/build.mjs

import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'src');
const ASSETS = path.join(ROOT, 'assets');
const OUT = path.join(ROOT, 'docs');

// URL pública do site, com barra final. Enquanto estiver vazia, canonical,
// hreflang, og:url, og:image e sitemap.xml não são gerados (exigem URL absoluta).
const SITE_URL = '';

// Rotas aprovadas: EN na raiz, PT em /pt/.
const ROUTES = {
  'Main.dc.html':         { en: '',                   pt: 'pt' },
  'Sobre.dc.html':        { en: 'about',              pt: 'pt/sobre' },
  'Projetos.dc.html':     { en: 'work',               pt: 'pt/projetos' },
  'CaseStrategi.dc.html': { en: 'work/strategi',      pt: 'pt/projetos/strategi' },
  'Case.dc.html':         { en: 'work/hub-sebrae-rn', pt: 'pt/projetos/hub-sebrae-rn' },
  'Contato.dc.html':      { en: 'contact',            pt: 'pt/contato' },
  'Privacidade.dc.html':  { en: 'privacy',            pt: 'pt/privacidade' }
};

// Metadados aprovados por Renato em 2026-10-14.
const META = {
  'Main.dc.html': {
    en: ['Renato Oliveira · Product Designer, from brand to interface', 'Product Designer based in Brazil, available for remote work with international clients. 15 years in design and more than 5 in UI/UX.'],
    pt: ['Renato Oliveira · Designer de Produto, da marca à interface', 'Designer de Produto com 15 anos em design e mais de 5 em UI/UX. SaaS, aplicativos mobile, dashboards de BI, Design Systems e branding digital.']
  },
  'Sobre.dc.html': {
    en: ['About · Renato Oliveira, Product Designer', 'How I work across the product lifecycle, from user research to high-fidelity interfaces. Background, principles, industries and tools.'],
    pt: ['Sobre · Renato Oliveira, Designer de Produto', 'Como atuo em todo o ciclo de produto, da pesquisa com usuários à interface em alta fidelidade. Trajetória, princípios, setores e ferramentas.']
  },
  'Projetos.dc.html': {
    en: ['Work · Renato Oliveira, Product Designer', 'Case studies in product, web and branding: the Grupo Strategi visual system and the Hub Sebrae RN identity and portal, from problem to outcome.'],
    pt: ['Projetos · Renato Oliveira, Designer de Produto', 'Cases de produto, web e branding: o sistema visual do Grupo Strategi e a identidade e o portal do Hub Sebrae RN, do problema ao resultado.']
  },
  'CaseStrategi.dc.html': {
    en: ['Grupo Strategi visual system · Renato Oliveira', 'Branding: a single visual language for Grupo Strategi’s five business lines, from social media to events, and a Figma template library.'],
    pt: ['Sistema visual do Grupo Strategi · Renato Oliveira', 'Branding: uma linguagem visual única para as cinco frentes do Grupo Strategi, das redes sociais aos eventos, com biblioteca de templates no Figma.']
  },
  'Case.dc.html': {
    en: ['Hub Sebrae RN Identity and Portal · Renato Oliveira', 'Hub Sebrae RN identity and portal, a consulting platform for small businesses. Designed at Grupo Strategi, from brand concept to desktop and mobile UI.'],
    pt: ['Identidade e Portal do Hub Sebrae RN · Renato Oliveira', 'Identidade e portal do Hub Sebrae RN, plataforma de consultorias para pequenos negócios. Projeto desenvolvido no Grupo Strategi, da marca às interfaces.']
  },
  'Contato.dc.html': {
    en: ['Contact · Renato Oliveira, Product Designer', 'Tell me about your product, context and goals. Product design, UI/UX, websites and branding for digital products. Reach me by email, WhatsApp or LinkedIn.'],
    pt: ['Contato · Renato Oliveira, Designer de Produto', 'Conte sobre seu produto, contexto e objetivos. Product design, UI/UX, sites e branding para produtos digitais. Contato por e-mail, WhatsApp ou LinkedIn.']
  },
  'Privacidade.dc.html': {
    en: ['Privacy policy · Renato Oliveira', 'What data this site collects, why, for how long and how to exercise your rights under Brazil’s LGPD, with a note on the GDPR for EU visitors.'],
    pt: ['Política de privacidade · Renato Oliveira', 'Quais dados este site coleta, por que, por quanto tempo e como exercer seus direitos pela LGPD, com menção ao GDPR para visitantes da União Europeia.']
  }
};

// Ajustes do site estático aprovados por Renato em 2026-10-14, aplicados ao
// template sem alterar src/. Cada trecho precisa existir exatamente uma vez.
const PATCHES = {
  // Eyebrow do hero pode quebrar linha em telas estreitas (CSS em EXTRA_CSS).
  'Sobre.dc.html': [[
    '<p style="margin: 0; flex: none; font: 500 14px \'Geist\', sans-serif; letter-spacing: .12em; text-transform: uppercase; color: #FFFFFF">{{t.eyebrow}}</p>',
    '<p class="ro-ey" style="margin: 0; flex: none; font: 500 14px \'Geist\', sans-serif; letter-spacing: .12em; text-transform: uppercase; color: #FFFFFF">{{t.eyebrow}}</p>'
  ]],
  // Grade de cards: mínimo de 340px limitado à largura disponível (igual no desktop).
  'Projetos.dc.html': [[
    'grid-template-columns: repeat(auto-fit, minmax(340px, 1fr))',
    'grid-template-columns: repeat(auto-fit, minmax(min(340px, 100%), 1fr))'
  ]],
  // Formulário oculto até haver serviço de envio: sem ele, a confirmação seria fictícia.
  // Para reativar, remova este ajuste e volte 'o.on', 'o.off', 'sent', 'notSent' em DUAL.
  'Contato.dc.html': [[
    /\n<div class="ro-up ro-d2" style="flex: 1 1 460px;[\s\S]*?<\/form>\n<\/sc-if>\n<\/div>/,
    ''
  ]]
};
const EXTRA_CSS = {
  'Sobre.dc.html': '@media (max-width:760px){.ro-ey{flex:1 1 auto !important;min-width:0}}'
};

// Estados interativos: as duas versões de cada <sc-if> listado são geradas e a
// inativa recebe `hidden`; assets/js/site.js alterna entre elas.
const DUAL = {
  'Projetos.dc.html': ['f.on', 'f.off'],
  'Contato.dc.html': ['copied', 'notCopied']
};
// Atributos extras no primeiro elemento de cada item de um <sc-for>.
const FOR_ATTRS = {
  'Projetos.dc.html': { shown: (c) => ({ 'data-cat': c.cat }) }
};
// Atributos extras no <body>, lidos pelo site.js.
const BODY_DATA = {
  // Mesma ordem do array de filtros em Projetos.dc.html.
  'Projetos.dc.html': () => ({ 'data-filters': 'all,product,web,brand' }),
  'Contato.dc.html': (v) => ({ 'data-msg-copied': v.t.copiedMsg })
};

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const rel = (from, to) => (path.posix.relative(from || '.', to || '.') || '.') + '/';

function parseDc(file) {
  const html = fs.readFileSync(path.join(SRC, file), 'utf8');
  const xdc = html.match(/<x-dc>([\s\S]*)<\/x-dc>/)[1];
  const helmet = xdc.match(/<helmet>([\s\S]*?)<\/helmet>/)[1];
  const template = xdc.replace(/<helmet>[\s\S]*?<\/helmet>/, '');
  const script = html.match(/<script type="text\/x-dc"[^>]*>([\s\S]*?)<\/script>/)[1];
  const stk = script.match(/var on = y > (\d+);/);
  return {
    template,
    fontLink: helmet.match(/<link [^>]*>/)[0],
    style: helmet.match(/<style>([\s\S]*?)<\/style>/)[1].trim(),
    script,
    stk: stk ? stk[1] : /var limit = Math\.min\(window\.innerHeight/.test(script) ? 'hero' : null
  };
}

// Executa o renderVals() original com o idioma fixo.
function renderVals(script, lang) {
  const ctx = vm.createContext({
    localStorage: { getItem: () => null, setItem() {} },
    navigator: { language: lang },
    window: {}, console
  });
  vm.runInContext('class DCLogic { constructor(p) { this.props = p || {}; this.state = {}; } setState(s) { Object.assign(this.state, s); } }', ctx);
  const Component = vm.runInContext(script + '\n;Component', ctx);
  return new Component({ lang }).renderVals();
}

// Seletor de idioma: <button> vira <a> para a página equivalente, mesmo visual.
function langButtonsToLinks(tpl) {
  return tpl.replace(/<button ([^>]*?)aria-label="(English|Português)"([^>]*)>(EN|PT)<\/button>/g, (m, a, label, b, text) => {
    const attrs = a + 'aria-label="' + label + '"' + b;
    const target = text === 'EN' ? 'en' : 'pt';
    const active = /aria-pressed="true"/.test(attrs);
    const style = attrs.match(/style="([^"]*)"/)[1];
    const lang = attrs.match(/ lang="([^"]*)"/)[1];
    return '<a href="@@LANG:' + target + '@@" hreflang="' + lang + '" lang="' + lang + '" data-lang="' + target + '"' +
      (active ? ' aria-current="true"' : '') + ' aria-label="' + label + '" title="' + label + '"' +
      ' style="' + style + '; display: inline-flex; align-items: center; text-decoration: none">' + text + '</a>';
  });
}

// Árvore mínima: só <sc-for>/<sc-if> viram nós; o resto é texto bruto.
function parseTree(tpl) {
  const root = { children: [] };
  const stack = [root];
  const re = /<(\/?)(sc-for|sc-if)\b([^>]*)>/g;
  let last = 0, m;
  while ((m = re.exec(tpl))) {
    stack[stack.length - 1].children.push(tpl.slice(last, m.index));
    last = re.lastIndex;
    if (m[1]) {
      const node = stack.pop();
      if (node.tag !== m[2]) throw new Error('Tag desbalanceada: ' + m[2]);
    } else {
      const attr = (n) => { const a = m[3].match(new RegExp(n + '="\\{\\{([^}]+)\\}\\}"')); return a && a[1]; };
      const node = { tag: m[2], expr: attr(m[2] === 'sc-for' ? 'list' : 'value'), as: (m[3].match(/as="([^"]+)"/) || [])[1], children: [] };
      stack[stack.length - 1].children.push(node);
      stack.push(node);
    }
  }
  if (stack.length !== 1) throw new Error('Tag sem fechamento');
  root.children.push(tpl.slice(last));
  return root;
}

function lookup(expr, scopes) {
  if (expr === 'true') return true;
  if (expr === 'false') return false;
  const [head, ...rest] = expr.split('.');
  const scope = scopes.find((s) => head in s);
  if (!scope) throw new Error('Valor indefinido: ' + expr);
  return rest.reduce((v, k) => (v == null ? v : v[k]), scope[head]);
}

function addAttrs(html, attrs) {
  return html.replace(/^(\s*(?:<!--[\s\S]*?-->\s*)*)<([a-zA-Z][\w-]*)/, (m, pre, tag) => pre + '<' + tag + attrs);
}
const attrString = (o) => Object.entries(o).map(([k, v]) => ' ' + k + '="' + esc(v) + '"').join('');

function render(node, scopes, cfg) {
  return node.children.map((c) => {
    if (typeof c === 'string') {
      return c.replace(/\{\{([^}]+)\}\}/g, (m, expr) => {
        const v = lookup(expr.trim(), scopes);
        if (typeof v === 'function' || (v && typeof v === 'object')) throw new Error('Valor não textual em ' + expr);
        return esc(v == null ? '' : v);
      });
    }
    const v = lookup(c.expr, scopes);
    if (c.tag === 'sc-if') {
      if (cfg.dual.includes(c.expr)) return addAttrs(render(c, scopes, cfg), ' data-if="' + c.expr + '"' + (v ? '' : ' hidden'));
      return v ? render(c, scopes, cfg) : '';
    }
    if (!Array.isArray(v)) throw new Error('Lista inválida: ' + c.expr);
    const extra = cfg.forAttrs[c.expr];
    return v.map((item) => {
      const out = render(c, [{ [c.as]: item }, ...scopes], cfg);
      return extra ? addAttrs(out, attrString(extra(item))) : out;
    }).join('');
  }).join('');
}

function head(file, lang, page, dir) {
  const [title, desc] = META[file][lang];
  const lines = [
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    '<title>' + esc(title) + '</title>',
    '<meta name="description" content="' + esc(desc) + '">',
    '<meta property="og:type" content="website">',
    '<meta property="og:site_name" content="Renato Oliveira">',
    '<meta property="og:title" content="' + esc(title) + '">',
    '<meta property="og:description" content="' + esc(desc) + '">',
    '<meta property="og:locale" content="' + (lang === 'en' ? 'en_US' : 'pt_BR') + '">',
    '<meta property="og:locale:alternate" content="' + (lang === 'en' ? 'pt_BR' : 'en_US') + '">'
  ];
  if (SITE_URL) {
    const url = (r) => SITE_URL + (r ? r + '/' : '');
    lines.push(
      '<link rel="canonical" href="' + url(dir) + '">',
      '<link rel="alternate" hreflang="en" href="' + url(ROUTES[file].en) + '">',
      '<link rel="alternate" hreflang="pt-BR" href="' + url(ROUTES[file].pt) + '">',
      '<link rel="alternate" hreflang="x-default" href="' + url(ROUTES[file].en) + '">',
      '<meta property="og:url" content="' + url(dir) + '">',
      '<meta property="og:image" content="' + SITE_URL + 'assets/img/00279768a85e85a6c5dc80f7289a7651.webp">'
    );
  }
  // Só a home EN redireciona: escolha salva primeiro; sem escolha, navegador pt-* vai para /pt/.
  if (file === 'Main.dc.html' && lang === 'en') {
    lines.push('<script>(function(){var s=null;try{s=localStorage.getItem(\'ro-lang\');}catch(e){}var n=(navigator.language||\'\').toLowerCase();if(s===\'pt\'||(s!==\'en\'&&n.indexOf(\'pt\')===0))location.replace(\'pt/\'+location.search+location.hash);})();</script>');
  }
  lines.push(
    page.fontLink,
    '<style>\n' + page.style + '\n[hidden]{display:none !important}' + (EXTRA_CSS[file] ? '\n' + EXTRA_CSS[file] : '') + '\n</style>',
    '<script src="' + rel(dir, 'assets/js') + 'site.js" defer></script>'
  );
  return lines.join('\n');
}

function build() {
  fs.rmSync(OUT, { recursive: true, force: true });
  const usedImgs = new Set();
  const assetFiles = fs.readdirSync(ASSETS).filter((f) => fs.statSync(path.join(ASSETS, f)).isFile());
  const pages = [];

  for (const file of Object.keys(ROUTES)) {
    const page = parseDc(file);
    for (const [find, replace] of PATCHES[file] || []) {
      const hits = typeof find === 'string' ? page.template.split(find).length - 1 : (page.template.match(new RegExp(find.source, 'g')) || []).length;
      if (hits !== 1) throw new Error('Ajuste não encontrado exatamente uma vez em ' + file + ': ' + find);
      page.template = page.template.replace(find, replace);
    }
    const tpl = langButtonsToLinks(page.template).replace(/ on(Click|Submit)="\{\{([^}]+)\}\}"/g, ' data-action="$2"');
    const tree = parseTree(tpl);
    for (const lang of ['en', 'pt']) {
      const dir = ROUTES[file][lang];
      const vals = renderVals(page.script, lang);
      const cfg = { dual: DUAL[file] || [], forAttrs: FOR_ATTRS[file] || {} };
      let body = render(tree, [vals], cfg).trim();
      body = body
        .replace(/@@LANG:(en|pt)@@/g, (m, l) => rel(dir, ROUTES[file][l]))
        .replace(/href="([A-Za-z]+\.dc\.html)"/g, (m, f) => {
          if (!ROUTES[f]) throw new Error('Link sem rota: ' + f);
          return 'href="' + rel(dir, ROUTES[f][lang]) + '"';
        })
        .replace(/\/_blob\/([0-9a-f]+)/g, (m, id) => {
          const f = assetFiles.find((a) => a.startsWith(id + '.'));
          if (!f) throw new Error('Imagem ausente: ' + id);
          usedImgs.add(f);
          return rel(dir, 'assets/img') + f;
        });
      if (/\{\{|<sc-|on[A-Z][a-z]+="|\.dc\.html|_blob/.test(body)) throw new Error('Resto de template em ' + file + ' (' + lang + ')');
      const bodyAttrs = attrString(Object.assign({ 'data-stk': page.stk }, BODY_DATA[file] ? BODY_DATA[file](vals) : {}));
      const html = '<!doctype html>\n<html lang="' + (lang === 'en' ? 'en' : 'pt-BR') + '">\n<head>\n' +
        head(file, lang, page, dir) + '\n</head>\n<body' + bodyAttrs + '>\n' + body + '\n</body>\n</html>\n';
      const outFile = path.join(OUT, dir, 'index.html');
      fs.mkdirSync(path.dirname(outFile), { recursive: true });
      fs.writeFileSync(outFile, html);
      pages.push('/' + (dir ? dir + '/' : ''));
    }
  }

  fs.mkdirSync(path.join(OUT, 'assets/img'), { recursive: true });
  for (const f of usedImgs) fs.copyFileSync(path.join(ASSETS, f), path.join(OUT, 'assets/img', f));
  fs.mkdirSync(path.join(OUT, 'assets/js'), { recursive: true });
  fs.copyFileSync(path.join(ROOT, 'tools/site.js'), path.join(OUT, 'assets/js/site.js'));
  fs.writeFileSync(path.join(OUT, '.nojekyll'), '');

  if (SITE_URL) {
    const urls = Object.values(ROUTES).map((r) =>
      '  <url>\n    <loc>' + SITE_URL + (r.en ? r.en + '/' : '') + '</loc>\n' +
      '    <xhtml:link rel="alternate" hreflang="en" href="' + SITE_URL + (r.en ? r.en + '/' : '') + '"/>\n' +
      '    <xhtml:link rel="alternate" hreflang="pt-BR" href="' + SITE_URL + r.pt + '/"/>\n  </url>\n' +
      '  <url>\n    <loc>' + SITE_URL + r.pt + '/</loc>\n' +
      '    <xhtml:link rel="alternate" hreflang="en" href="' + SITE_URL + (r.en ? r.en + '/' : '') + '"/>\n' +
      '    <xhtml:link rel="alternate" hreflang="pt-BR" href="' + SITE_URL + r.pt + '/"/>\n  </url>\n').join('');
    fs.writeFileSync(path.join(OUT, 'sitemap.xml'), '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n' + urls + '</urlset>\n');
  }

  console.log(pages.length + ' páginas, ' + usedImgs.size + ' imagens em docs/');
}

build();
