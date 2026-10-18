// Gera o site estático em docs/ a partir dos protótipos src/*.dc.html.
// Ferramenta local (Node 18+, sem dependências). O GitHub Pages publica só docs/.
// As versões redimensionadas das imagens usam o System.Drawing do Windows
// (PowerShell); em outro sistema o build segue só com os originais.
// O site é gerado em .docs-build/, validado com tools/check.mjs e só então
// trocado por docs/. A versão anterior fica em .docs-old/ durante a troca.
// Uso: node tools/build.mjs

import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'src');
const ASSETS = path.join(ROOT, 'assets');
const OUT = path.join(ROOT, 'docs');
const STAGE = path.join(ROOT, '.docs-build');
const OLD = path.join(ROOT, '.docs-old');

// URL pública do site, com barra final. Enquanto estiver vazia, canonical,
// hreflang, og:url, og:image e sitemap.xml não são gerados (exigem URL absoluta).
const SITE_URL = '';

// Access Key do Web3Forms (formulário de Contato), criada em web3forms.com com o
// e-mail que deve receber as mensagens. A chave vai para o HTML público por
// desenho do serviço (o envio é feito pelo navegador). Cole só a chave, no
// formato UUID. Enquanto estiver vazia, o formulário é gerado, mas o site.js
// mostra a mensagem de erro em vez de enviar, e o check.mjs lista a pendência.
const WEB3FORMS_ACCESS_KEY = '17b90597-e687-4401-8919-5e7657236335';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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
  ]]
};
const EXTRA_CSS = {
  'Sobre.dc.html': '@media (max-width:760px){.ro-ey{flex:1 1 auto !important;min-width:0}}'
};

// Menu responsivo (≤960px): logo à esquerda e botão de menu à direita; o painel
// é montado pelo site.js a partir do menu fixo. 960px porque, em PT, a grade de
// 3 colunas do desktop quebra o CTA em duas linhas abaixo de ~940px.
// Sem JavaScript (sem a classe ro-js), o cabeçalho segue como antes.
const MENU_BP = 960;
const MENU_LABELS = { en: ['Open menu', 'Close menu'], pt: ['Abrir menu', 'Fechar menu'] };
const MENU_ICON = '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true" focusable="false"><path d="M3 5.5h14M3 10h14M3 14.5h14"/></svg>';
const MENU_CSS = [
  '.ro-burger{display:none;flex:none;margin-left:auto;width:44px;height:44px;padding:0;border:1px solid #DADADA;border-radius:999px;background:transparent;color:#000000;align-items:center;justify-content:center;cursor:pointer;transition:color .2s,border-color .2s,background .2s}',
  '.ro-burger:hover{color:#253CEA;border-color:#253CEA}',
  '.ro-burger svg{display:block}',
  '.ro-burger-w{color:#FFFFFF;border-color:rgba(255,255,255,.5)}',
  '.ro-burger-w:hover{background:#FFFFFF;border-color:#FFFFFF;color:#253CEA}',
  '.ro-burger-w:focus-visible{outline-color:#FFFFFF}',
  '@media (max-width:' + MENU_BP + 'px){.ro-js .ro-hd{display:flex !important;flex-wrap:nowrap !important}.ro-js .ro-hd>nav,.ro-js .ro-hd>.ro-burger~*{display:none !important}.ro-js .ro-burger{display:inline-flex}}',
  'html.ro-menu-lock{overflow:hidden}',
  '.ro-menu{position:fixed;inset:0;z-index:100;display:flex;flex-direction:column;background:#FFFFFF;color:#000000;overflow-y:auto;overscroll-behavior:contain;animation:roMenuIn .3s cubic-bezier(.2,.7,.2,1) both}',
  '.ro-menu .ro-burger{display:inline-flex}',
  '.ro-menu-bar{border-bottom:1px solid #EAEAEA}',
  '.ro-menu-bar>div,.ro-menu-in{width:100%;max-width:1280px;margin:0 auto;padding:12px 24px;display:flex;align-items:center;justify-content:space-between;gap:20px}',
  '.ro-menu-in{flex-direction:column;align-items:stretch;justify-content:flex-start;padding:16px 24px 40px}',
  '.ro-menu nav{display:flex;flex-direction:column}',
  '.ro-menu nav a{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:18px 0;border-bottom:1px solid #EAEAEA;color:#000000;opacity:1;text-decoration:none;font:500 clamp(28px,7.5vw,40px)/1.1 \'Geist\',sans-serif;letter-spacing:-.03em}',
  '.ro-menu nav a:hover,.ro-menu nav a[aria-current="page"]{color:#253CEA}',
  '.ro-menu nav a[aria-current="page"]::after{content:"";flex:none;width:10px;height:10px;border-radius:50%;background:#253CEA}',
  '.ro-menu-ft{display:flex;flex-wrap:wrap;align-items:center;gap:12px;margin-top:32px}',
  '@media (max-height:480px){.ro-menu nav a{padding:10px 0;font-size:24px}.ro-menu-in{padding-top:4px}.ro-menu-ft{margin-top:20px}}',
  '@keyframes roMenuIn{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:none}}',
  '@media (prefers-reduced-motion:reduce){.ro-menu{animation:none}.ro-burger{transition:none}}'
].join('\n');

// Insere o botão de menu logo após cada navegação principal (antes do grupo da
// direita), nos dois cabeçalhos da página. Variante clara sobre o gradiente.
function addMenuButtons(body, lang, where) {
  const [open, close] = MENU_LABELS[lang];
  let n = 0;
  const out = body.replace(/<nav aria-label="Principal[^"]*"[^>]*>[\s\S]*?<\/nav>/g, (nav) => {
    n++;
    return nav + '\n<button type="button" class="ro-burger' + (/class="ro-nw"/.test(nav) ? ' ro-burger-w' : '') +
      '" aria-expanded="false" aria-controls="ro-menu" aria-label="' + open + '" data-label-close="' + close + '">' + MENU_ICON + '</button>';
  });
  if (n !== 2) throw new Error('Esperadas 2 navegações principais em ' + where + ', encontradas ' + n);
  return out;
}

// Rótulos de acessibilidade que vêm em português no protótipo (só leitores de tela).
const A11Y_EN = { 'Principal': 'Main', 'Principal (fixo)': 'Main (sticky)', 'Idioma': 'Language', 'Renato Oliveira, início': 'Renato Oliveira, home' };
function localizeA11y(body, lang) {
  if (lang !== 'en') return body;
  return body.replace(/aria-label="([^"]*)"/g, (m, v) => A11Y_EN[v] ? 'aria-label="' + A11Y_EN[v] + '"' : m);
}

// Estados interativos: as duas versões de cada <sc-if> listado são geradas e a
// inativa recebe `hidden`; assets/js/site.js alterna entre elas.
const DUAL = {
  'Projetos.dc.html': ['f.on', 'f.off'],
  'Contato.dc.html': ['copied', 'notCopied', 'o.on', 'o.off', 'sent', 'notSent', 'failed']
};
// Valores definidos no build, sobrepostos aos de renderVals().
const VALS = {
  'Contato.dc.html': () => ({ accessKey: WEB3FORMS_ACCESS_KEY })
};
// Atributos extras no primeiro elemento de cada item de um <sc-for>.
const FOR_ATTRS = {
  'Projetos.dc.html': { shown: (c) => ({ 'data-cat': c.cat }) }
};
// Imagens: carregamento imediato só para o que aparece na primeira tela; o resto
// é lazy. As demais ganham width/height (proporção) e, quando listadas em SIZES,
// srcset com versões JPG menores. Os originais em assets/ não são alterados.
const EAGER = ['dead834c', '77e36605', '00279768'];      // logos do topo e retrato do hero
const PRIORITY = ['00279768'];                           // retrato do hero: fetchpriority="high"
const EAGER_BY_PAGE = { 'Projetos.dc.html': ['e9d6ba4d', '4cb226fe'] };  // capas na primeira tela
const VARIANT_WIDTHS = [800, 1280];
const CASE_SIZES = '(min-width: 1280px) 1232px, calc(100vw - 48px)';
const SIZES = {
  // Capas recortadas em altura fixa (420px e 520px, proporção 4:3): largura efetiva.
  'Main.dc.html': { e9d6ba4d: '560px', '4cb226fe': '694px' },
  // Projetos fica sem srcset: com o filtro, um card sozinho ocupa 1232px.
  'CaseStrategi.dc.html': { '*': CASE_SIZES },
  'Case.dc.html': { '*': CASE_SIZES, bb4e355b: '(min-width: 1280px) 963px, calc(100vw - 96px)' }
};
// Home do portal Hub (1728×6646): recomprimida no tamanho original (qualidade 75,
// sem diferença visível em 1:1 nos testes) e com uma versão de 1000px.
const RECOMPRESS = { bb4e355b: { quality: 75, widths: [1000] } };
const JPEG_QUALITY = 82;

// Atributos extras no <body>, lidos pelo site.js.
const BODY_DATA = {
  // Mesma ordem do array de filtros em Projetos.dc.html.
  'Projetos.dc.html': () => ({ 'data-filters': 'all,product,web,brand' }),
  'Contato.dc.html': (v) => ({ 'data-msg-copied': v.t.copiedMsg, 'data-msg-sending': v.t.sending })
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
        // Links [texto](mailto:…) nos textos viram <a>, no mesmo estilo do link da nota de privacidade.
        return esc(v == null ? '' : v).replace(/\[([^\]]+)\]\((mailto:[^)\s]+)\)/g, '<a href="$2" style="color: #253CEA">$1</a>');
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

// Dimensões lidas do cabeçalho do arquivo (JPEG, PNG, WebP), sem dependências.
const sizeCache = new Map();
function imageSize(file) {
  if (sizeCache.has(file)) return sizeCache.get(file);
  const b = fs.readFileSync(file);
  let size = null;
  if (b.readUInt32BE(0) === 0x89504e47) size = [b.readUInt32BE(16), b.readUInt32BE(20)];
  else if (b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP') {
    const kind = b.toString('ascii', 12, 16);
    if (kind === 'VP8X') size = [1 + b.readUIntLE(24, 3), 1 + b.readUIntLE(27, 3)];
    else if (kind === 'VP8L') { const v = b.readUInt32LE(21); size = [(v & 0x3fff) + 1, ((v >> 14) & 0x3fff) + 1]; }
    else size = [b.readUInt16LE(26) & 0x3fff, b.readUInt16LE(28) & 0x3fff];
  } else {
    for (let i = 2; i < b.length - 8;) {
      const m = b[i + 1];
      if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) { size = [b.readUInt16BE(i + 7), b.readUInt16BE(i + 5)]; break; }
      i += 2 + b.readUInt16BE(i + 2);
    }
  }
  if (!size) throw new Error('Dimensões ilegíveis: ' + file);
  sizeCache.set(file, size);
  return size;
}

const CAN_RESIZE = process.platform === 'win32';

// Completa cada <img> com width/height, loading/decoding, prioridade e srcset/sizes.
function imgAttrs(body, file, dir, jobs) {
  const imgDir = rel(dir, 'assets/img');
  return body.replace(/<img ([^>]*)>/g, (tag, attrs) => {
    const src = attrs.match(/src="([^"]+)"/)[1];
    const name = src.slice(src.lastIndexOf('/') + 1);
    const id = name.slice(0, 8), hash = name.slice(0, name.lastIndexOf('.'));
    const [w, h] = imageSize(path.join(ASSETS, name));
    const extra = [];
    const isJpg = name.endsWith('.jpg');
    const sizes = isJpg && CAN_RESIZE && SIZES[file] ? SIZES[file][id] || SIZES[file]['*'] : null;
    const rec = isJpg && CAN_RESIZE ? RECOMPRESS[id] : null;
    let mainName = name;
    if (rec) {
      mainName = hash + '-' + w + '.jpg';
      jobs.set(mainName, { src: path.join(ASSETS, name), w, q: rec.quality });
    }
    if (sizes) {
      const widths = (rec ? rec.widths : VARIANT_WIDTHS).filter((x) => x < w);
      for (const x of widths) jobs.set(hash + '-' + x + '.jpg', { src: path.join(ASSETS, name), w: x, q: JPEG_QUALITY });
      const set = widths.map((x) => imgDir + hash + '-' + x + '.jpg ' + x + 'w').concat(imgDir + mainName + ' ' + w + 'w');
      extra.push('srcset="' + set.join(', ') + '"', 'sizes="' + sizes + '"');
    }
    const eager = EAGER.includes(id) || (EAGER_BY_PAGE[file] || []).includes(id);
    extra.push('width="' + w + '"', 'height="' + h + '"');
    extra.push(eager ? 'loading="eager"' : 'loading="lazy" decoding="async"');
    if (PRIORITY.includes(id)) extra.push('fetchpriority="high"');
    return '<img ' + attrs.replace('src="' + src + '"', 'src="' + imgDir + mainName + '"') + ' ' + extra.join(' ') + '>';
  });
}

// Gera as versões JPG em lote com o System.Drawing (sem arquivo .ps1, para não
// depender da política de execução de scripts).
function runResizeJobs(jobs, outDir) {
  if (!jobs.size) return;
  const list = [...jobs].map(([out, j]) => ({ src: j.src, out: path.join(outDir, out), w: j.w, q: j.q }));
  const ps = [
    'Add-Type -AssemblyName System.Drawing',
    '$codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq "image/jpeg" }',
    'foreach ($j in ($env:RO_JOBS | ConvertFrom-Json)) {',
    '  $img = [System.Drawing.Image]::FromFile($j.src)',
    '  $h = [int][Math]::Round($img.Height * $j.w / $img.Width)',
    '  $bmp = New-Object System.Drawing.Bitmap ([int]$j.w), $h',
    '  $g = [System.Drawing.Graphics]::FromImage($bmp)',
    '  $g.InterpolationMode = "HighQualityBicubic"; $g.PixelOffsetMode = "HighQuality"; $g.CompositingQuality = "HighQuality"',
    '  $wrap = New-Object System.Drawing.Imaging.ImageAttributes; $wrap.SetWrapMode("TileFlipXY")',
    '  $g.DrawImage($img, (New-Object System.Drawing.Rectangle 0, 0, $j.w, $h), 0, 0, $img.Width, $img.Height, "Pixel", $wrap)',
    '  $ep = New-Object System.Drawing.Imaging.EncoderParameters 1',
    '  $ep.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter ([System.Drawing.Imaging.Encoder]::Quality), ([long]$j.q)',
    '  $bmp.Save($j.out, $codec, $ep)',
    '  $g.Dispose(); $bmp.Dispose(); $img.Dispose(); $wrap.Dispose()',
    '}'
  ].join('\n');
  const encoded = Buffer.from('$ErrorActionPreference = "Stop"\n' + ps, 'utf16le').toString('base64');
  const r = spawnSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-EncodedCommand', encoded], { env: { ...process.env, RO_JOBS: JSON.stringify(list) }, encoding: 'utf8' });
  if (r.status !== 0) throw new Error('Falha ao redimensionar imagens:\n' + (r.stderr || r.stdout));
  for (const j of list) if (!fs.existsSync(j.out)) throw new Error('Imagem não gerada: ' + j.out);
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
    // Ativa o menu responsivo antes da primeira pintura (sem JavaScript, fica o cabeçalho original).
    '<script>document.documentElement.classList.add(\'ro-js\');</script>',
    '<link rel="preconnect" href="https://fonts.googleapis.com">',
    '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>',
    page.fontLink,
    '<style>\n' + page.style + '\n[hidden]{display:none !important}\n' + MENU_CSS + (EXTRA_CSS[file] ? '\n' + EXTRA_CSS[file] : '') + '\n</style>',
    // Se o site.js não carregar, volta o cabeçalho original (sem botão de menu inoperante).
    '<script src="' + rel(dir, 'assets/js') + 'site.js" defer onerror="document.documentElement.classList.remove(\'ro-js\')"></script>'
  );
  return lines.join('\n');
}

function build(OUT) {
  if (WEB3FORMS_ACCESS_KEY && !UUID.test(WEB3FORMS_ACCESS_KEY)) {
    throw new Error('WEB3FORMS_ACCESS_KEY inválida em tools/build.mjs: use a chave UUID fornecida pelo Web3Forms.');
  }
  if (!WEB3FORMS_ACCESS_KEY) console.warn('Aviso: WEB3FORMS_ACCESS_KEY vazia em tools/build.mjs; o formulário de Contato não envia.');
  const usedImgs = new Set();
  const jobs = new Map();
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
      const vals = Object.assign(renderVals(page.script, lang), VALS[file] ? VALS[file]() : {});
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
          return rel(dir, 'assets/img') + f;
        });
      body = localizeA11y(addMenuButtons(body, lang, file + ' (' + lang + ')'), lang);
      body = imgAttrs(body, file, dir, jobs);
      for (const m of body.matchAll(/assets\/img\/([0-9a-f]{32}\.\w+)/g)) usedImgs.add(m[1]);
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
  runResizeJobs(jobs, path.join(OUT, 'assets/img'));
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

  const required = Object.values(ROUTES).flatMap((r) => [r.en, r.pt]).map((d) => path.join(d, 'index.html'))
    .concat('.nojekyll', 'assets/js/site.js', SITE_URL ? ['sitemap.xml'] : [])
    .concat([...usedImgs, ...jobs.keys()].map((f) => path.join('assets/img', f)));
  const missing = required.filter((f) => !fs.existsSync(path.join(OUT, f)));
  if (missing.length) throw new Error('Arquivos ausentes na geração:\n  ' + missing.join('\n  '));

  console.log(pages.length + ' páginas, ' + usedImgs.size + ' imagens originais e ' + jobs.size + ' versões redimensionadas em ' + path.basename(OUT) + '/');
}

// No Windows, renomear ou apagar uma pasta falha por instantes se algum arquivo
// estiver aberto (antivírus, indexador, Explorer). Tenta de novo antes de desistir.
const sleep = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
function retry(fn) {
  for (let i = 1; ; i++) {
    try { return fn(); } catch (e) {
      if (i >= 8 || !['EPERM', 'EBUSY', 'EACCES', 'ENOTEMPTY'].includes(e.code)) throw e;
      sleep(200 * i);
    }
  }
}
const remove = (dir) => retry(() => fs.rmSync(dir, { recursive: true, force: true }));
const move = (from, to) => retry(() => fs.renameSync(from, to));
const BUSY = 'Feche o que estiver usando a pasta (terminal aberto dentro dela, Explorer, servidor local) e rode de novo.';
const RESTORE = 'Para restaurar à mão: 1) feche o que estiver usando as pastas (terminal, Explorer, servidor local); ' +
  '2) se ainda existir uma pasta docs/, não a apague: renomeie para docs-falha/; 3) renomeie .docs-old/ para docs/; ' +
  '4) confira com: node tools/check.mjs docs. Não apague .docs-old/ antes de docs/ estar restaurada e validada.';

// Recupera uma execução interrompida. Ordem da troca: docs -> .docs-old,
// .docs-build -> docs, apaga .docs-old.
function recover() {
  const hasOut = fs.existsSync(OUT), hasOld = fs.existsSync(OLD);
  if (!hasOut && hasOld) {
    console.log('Execução anterior interrompida no meio da troca: restaurando docs/ a partir de .docs-old/.');
    try { move(OLD, OUT); } catch (e) {
      throw new Error('Não foi possível restaurar docs/; a versão anterior continua intacta em .docs-old/. ' + RESTORE + '\n' + e.message);
    }
  } else if (hasOld) {
    // Parece que a troca terminou e só a limpeza não. Antes de apagar a versão
    // anterior, confirma que docs/ está íntegra.
    try { validate(OUT); } catch (e) {
      throw new Error('docs/ e .docs-old/ existem e docs/ não passou na validação; nenhuma das duas foi alterada. ' +
        'Compare as duas e mantenha a correta. Se .docs-old/ for a boa: ' + RESTORE);
    }
    remove(OLD);
  }
  remove(STAGE);
}

function validate(dir) {
  const r = spawnSync(process.execPath, [path.join(ROOT, 'tools/check.mjs'), dir], { stdio: 'inherit' });
  if (r.error) throw r.error;
  if (r.status !== 0) throw new Error('A validação de ' + path.basename(dir) + '/ falhou (veja os problemas acima).');
}

function swap() {
  const hadOut = fs.existsSync(OUT);
  if (hadOut) {
    try { move(OUT, OLD); } catch (e) { throw new Error('Não foi possível mover docs/ (nada foi alterado). ' + BUSY + '\n' + e.message); }
  }
  try {
    move(STAGE, OUT);
  } catch (e) {
    if (hadOut) {
      try { move(OLD, OUT); } catch (e2) {
        throw new Error('A troca falhou e docs/ não pôde ser restaurada. A versão anterior está intacta em .docs-old/. ' +
          'Rodar o build de novo tenta restaurar sozinho. ' + RESTORE + '\n' + e.message + '\n' + e2.message);
      }
    }
    throw new Error('Não foi possível instalar a nova versão; docs/ foi mantida como estava. ' + BUSY + '\n' + e.message);
  }
  try { remove(OLD); } catch (e) {
    console.warn('Aviso: docs/ foi atualizada, mas .docs-old/ não pôde ser apagada agora (' + e.code + '). O próximo build apaga.');
  }
}

let phase = 'recover';
try {
  recover();
  phase = 'build';
  build(STAGE);
  validate(STAGE);
  phase = 'swap';
  swap();
  console.log('docs/ atualizada.');
} catch (e) {
  console.error('\nBuild interrompido: ' + e.message);
  if (phase === 'build') console.error('docs/ não foi alterada. O resultado da geração ficou em .docs-build/ para inspeção.');
  process.exitCode = 1;
}
