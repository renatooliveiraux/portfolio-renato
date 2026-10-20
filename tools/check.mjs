// Valida o site gerado: links e imagens locais, rotas, idioma, metadados, restos de template
// e o formulário da seção de contato da Home (Web3Forms) nas duas versões.
// Uso: node tools/check.mjs [pasta]   (padrão docs/; ex.: node tools/check.mjs .docs-build)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = process.argv[2] ? path.resolve(process.argv[2]) : path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../docs');
const NAME = path.basename(OUT) + '/';
if (!fs.existsSync(OUT) || !fs.statSync(OUT).isDirectory()) {
  console.error('Pasta não encontrada: ' + OUT);
  process.exit(1);
}
console.log('Verificando ' + OUT);
const EXPECTED = ['', 'about', 'work', 'work/strategi', 'work/hub-sebrae-rn', 'privacy',
  'pt', 'pt/sobre', 'pt/projetos', 'pt/projetos/strategi', 'pt/projetos/hub-sebrae-rn', 'pt/privacidade'];
// URLs antigas da página Contato: redirecionam para a seção #contato da Home do mesmo idioma.
const REDIRECTS = { 'contact': '', 'pt/contato': 'pt' };
const HALF = EXPECTED.length / 2;

const problems = [], external = new Set(), placeholders = [];
const usedFiles = new Set();
const titles = new Map(), descs = new Map();

function resolveLocal(dir, ref) {
  const clean = ref.split('#')[0].split('?')[0];
  if (!clean) return null;
  let p = path.posix.normalize(path.posix.join(dir, clean));
  if (clean.endsWith('/') || p === '.') p = path.posix.join(p, 'index.html');
  return p;
}

for (const dir of EXPECTED) {
  const rel = path.posix.join(dir, 'index.html');
  const file = path.join(OUT, rel);
  if (!fs.existsSync(file)) { problems.push('Rota ausente: /' + dir); continue; }
  const html = fs.readFileSync(file, 'utf8');
  const where = '/' + (dir ? dir + '/' : '');
  const isPt = dir === 'pt' || dir.startsWith('pt/');

  const lang = (html.match(/<html lang="([^"]+)"/) || [])[1];
  if (lang !== (isPt ? 'pt-BR' : 'en')) problems.push(where + ': <html lang> = ' + lang);
  if (!/<meta name="viewport"/.test(html)) problems.push(where + ': sem viewport');
  const title = (html.match(/<title>([^<]+)<\/title>/) || [])[1];
  const desc = (html.match(/<meta name="description" content="([^"]+)"/) || [])[1];
  if (!title || !desc) problems.push(where + ': title/description ausente');
  titles.set(title, (titles.get(title) || []).concat(where));
  descs.set(desc, (descs.get(desc) || []).concat(where));
  const h1 = (html.match(/<h1[\s>]/g) || []).length;
  if (h1 !== 1) problems.push(where + ': ' + h1 + ' <h1>');
  if (/\{\{|<sc-|<x-dc|<helmet|\.dc\.html|\/_blob\/|onClick=|onSubmit=/.test(html)) problems.push(where + ': resto de template');

  const ids = [...html.matchAll(/ id="([^"]+)"/g)].map((m) => m[1]);
  const dup = ids.filter((id, i) => ids.indexOf(id) !== i);
  if (dup.length) problems.push(where + ': ids duplicados ' + dup.join(', '));

  for (const m of html.matchAll(/<img\b[^>]*>/g)) {
    if (!/ alt="/.test(m[0])) problems.push(where + ': <img> sem alt');
    if (!/ width="\d+" height="\d+"/.test(m[0])) problems.push(where + ': <img> sem width/height');
    if (/ srcset="/.test(m[0]) !== / sizes="/.test(m[0])) problems.push(where + ': srcset sem sizes (ou o contrário)');
  }

  const refs = [...html.matchAll(/(?:href|src)="([^"]*)"/g)].map((m) => m[1])
    .concat([...html.matchAll(/srcset="([^"]*)"/g)].flatMap((m) => m[1].split(',').map((s) => s.trim().split(/\s+/)[0])));
  for (const ref of refs) {
    if (/^(https?:|mailto:)/.test(ref)) { external.add(ref.replace(/&amp;/g, '&')); continue; }
    if (ref === '#') { placeholders.push(where + ': link vazio href="#"'); continue; }
    if (ref.startsWith('/')) { problems.push(where + ': caminho absoluto ' + ref); continue; }
    const target = resolveLocal(dir || '.', ref);
    if (!target) continue;
    if (target.startsWith('..')) { problems.push(where + ': sai de ' + NAME + ' ' + ref); continue; }
    usedFiles.add(target);
    if (!fs.existsSync(path.join(OUT, target))) problems.push(where + ': quebrado ' + ref + ' -> ' + target);
  }

  // Seletores de idioma: dois por página, apontando para a rota equivalente.
  const links = [...html.matchAll(/<a href="([^"]+)" hreflang="[^"]+" lang="[^"]+" data-lang="(en|pt)"/g)];
  if (links.length !== 4) problems.push(where + ': ' + links.length + ' links de idioma (esperado 4)');
  const idx = EXPECTED.indexOf(dir), twin = EXPECTED[idx < HALF ? idx + HALF : idx - HALF];
  for (const [, href, l] of links) {
    const want = l === (isPt ? 'pt' : 'en') ? dir : twin;
    const got = resolveLocal(dir || '.', href).replace(/\/?index\.html$/, '').replace(/^\.$/, '');
    if (got !== want) problems.push(where + ': idioma ' + l + ' aponta para /' + got);
  }
  if ((html.match(/aria-current="true"/g) || []).length !== 2) problems.push(where + ': idioma ativo não marcado nos dois seletores');

  // Menu responsivo: um botão em cada cabeçalho, com estado e rótulos para leitores de tela.
  const burgers = html.match(/<button type="button" class="ro-burger[^"]*" aria-expanded="false" aria-controls="ro-menu" aria-label="[^"]+" data-label-close="[^"]+">/g) || [];
  if (burgers.length !== 2) problems.push(where + ': ' + burgers.length + ' botões de menu (esperado 2)');
  if (!/classList\.add\('ro-js'\)/.test(html)) problems.push(where + ': sem a ativação do menu responsivo (ro-js)');

  for (const m of html.matchAll(/>\s*(\[[^\]<]{2,80}\])\s*</g)) placeholders.push(where + ': ' + m[1]);

  if (dir === '' || dir === 'pt') {
    checkForm(html, where);
    if (!/<section id="contato"/.test(html)) problems.push(where + ': seção #contato ausente');
  }
  // Links para a âncora de contato precisam de um destino com id="contato".
  for (const m of html.matchAll(/href="([^"]*)#contato"/g)) {
    const page = m[1] ? resolveLocal(dir || '.', m[1]) : path.posix.join(dir, 'index.html');
    const t = path.join(OUT, page);
    if (!fs.existsSync(t) || !/ id="contato"/.test(fs.readFileSync(t, 'utf8'))) problems.push(where + ': âncora #contato sem destino em ' + page);
  }
}

for (const [dir, home] of Object.entries(REDIRECTS)) {
  const file = path.join(OUT, dir, 'index.html');
  if (!fs.existsSync(file)) { problems.push('Redirecionamento ausente: /' + dir + '/'); continue; }
  const html = fs.readFileSync(file, 'utf8');
  const to = (html.match(/http-equiv="refresh" content="0; url=([^"]+)"/) || [])[1];
  const want = home ? home + '/index.html' : 'index.html';
  if (!to || !to.endsWith('#contato') || resolveLocal(dir, to) !== want) problems.push('/' + dir + '/: redireciona para ' + to + ' (esperado a Home com #contato)');
  if (!/location\.replace\(/.test(html)) problems.push('/' + dir + '/: sem redirecionamento por script');
  if (!/name="robots" content="noindex"/.test(html)) problems.push('/' + dir + '/: sem noindex');
}

// Formulário de contato (seção #contato da Home): envio pelo Web3Forms, com fallback HTML.
function checkForm(html, where) {
  const forms = html.match(/<form\b[^>]*>[\s\S]*?<\/form>/g) || [];
  if (forms.length !== 1) { problems.push(where + ': ' + forms.length + ' formulários (esperado 1)'); return; }
  const form = forms[0], open = form.match(/<form\b[^>]*>/)[0];
  if (!/ action="https:\/\/api\.web3forms\.com\/submit"/.test(open)) problems.push(where + ': formulário sem action do Web3Forms');
  if (!/ method="POST"/i.test(open)) problems.push(where + ': formulário sem method="POST"');
  if (!/ data-action="submit"/.test(open)) problems.push(where + ': formulário sem data-action="submit" (envio via site.js)');
  const input = (name) => (form.match(new RegExp('<(?:input|textarea)\\b[^>]*name="' + name + '"[^>]*>')) || [])[0];
  const value = (tag) => (tag.match(/ value="([^"]*)"/) || [])[1];
  for (const name of ['access_key', 'subject', 'project_type']) {
    const tag = input(name);
    if (!tag) problems.push(where + ': campo ' + name + ' ausente');
    else if (!/ type="hidden"/.test(tag)) problems.push(where + ': campo ' + name + ' não é oculto');
    else if (name !== 'access_key' && !value(tag)) problems.push(where + ': campo ' + name + ' sem valor');
  }
  const key = input('access_key') && value(input('access_key'));
  if (input('access_key') && !key) placeholders.push(where + ': Access Key do Web3Forms vazia (WEB3FORMS_ACCESS_KEY em tools/build.mjs)');
  else if (key && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(key)) problems.push(where + ': Access Key do Web3Forms fora do formato UUID');
  const bot = input('botcheck');
  if (!bot) problems.push(where + ': campo botcheck ausente');
  else if (!/ type="checkbox"/.test(bot) || !/display: ?none/.test(bot)) problems.push(where + ': botcheck deve ser checkbox com display: none');
  for (const name of ['name', 'email', 'message']) {
    const tag = input(name);
    if (!tag) problems.push(where + ': campo ' + name + ' ausente');
    else if (!/ required[\s>]/.test(tag)) problems.push(where + ': campo ' + name + ' não é obrigatório');
    else if (!/ id="([^"]+)"/.test(tag) || !form.includes('<label for="' + tag.match(/ id="([^"]+)"/)[1] + '"')) problems.push(where + ': campo ' + name + ' sem <label>');
  }
  if (!/<button\b[^>]*type="submit"/.test(form)) problems.push(where + ': formulário sem botão de envio');
  if (!/<[a-z]+ data-if="failed" hidden role="alert"/.test(form)) problems.push(where + ': mensagem de erro com role="alert" ausente');
  if (!/data-if="sent" hidden role="status"/.test(html)) problems.push(where + ': estado de sucesso ausente');
  if (!/ data-msg-sending="[^"]+"/.test(html)) problems.push(where + ': texto de envio (data-msg-sending) ausente');
}

for (const [t, w] of titles) if (w.length > 1) problems.push('Título repetido em ' + w.join(', '));
for (const [t, w] of descs) if (w.length > 1) problems.push('Descrição repetida em ' + w.join(', '));

const imgDir = path.join(OUT, 'assets/img');
const imgs = fs.existsSync(imgDir) ? fs.readdirSync(imgDir) : [];
if (!imgs.length) problems.push('Pasta assets/img ausente ou vazia em ' + NAME);
for (const f of imgs) if (!usedFiles.has('assets/img/' + f)) problems.push('Imagem não usada em ' + NAME + ': ' + f);

console.log('Rotas verificadas: ' + EXPECTED.length + ' | imagens: ' + imgs.length + ' | links externos únicos: ' + external.size);
console.log('\nExternos:\n  ' + [...external].join('\n  '));
console.log('\nPendências de conteúdo (' + placeholders.length + '):\n  ' + placeholders.join('\n  '));
console.log('\nProblemas (' + problems.length + '):\n  ' + (problems.join('\n  ') || 'nenhum'));
process.exitCode = problems.length ? 1 : 0;
