// Valida docs/: links e imagens locais, rotas, idioma, metadados e restos de template.
// Uso: node tools/check.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../docs');
const EXPECTED = ['', 'about', 'work', 'work/strategi', 'work/hub-sebrae-rn', 'contact', 'privacy',
  'pt', 'pt/sobre', 'pt/projetos', 'pt/projetos/strategi', 'pt/projetos/hub-sebrae-rn', 'pt/contato', 'pt/privacidade'];

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
    if (target.startsWith('..')) { problems.push(where + ': sai de docs/ ' + ref); continue; }
    usedFiles.add(target);
    if (!fs.existsSync(path.join(OUT, target))) problems.push(where + ': quebrado ' + ref + ' -> ' + target);
  }

  // Seletores de idioma: dois por página, apontando para a rota equivalente.
  const links = [...html.matchAll(/<a href="([^"]+)" hreflang="[^"]+" lang="[^"]+" data-lang="(en|pt)"/g)];
  if (links.length !== 4) problems.push(where + ': ' + links.length + ' links de idioma (esperado 4)');
  const idx = EXPECTED.indexOf(dir), twin = EXPECTED[idx < 7 ? idx + 7 : idx - 7];
  for (const [, href, l] of links) {
    const want = l === (isPt ? 'pt' : 'en') ? dir : twin;
    const got = resolveLocal(dir || '.', href).replace(/\/?index\.html$/, '').replace(/^\.$/, '');
    if (got !== want) problems.push(where + ': idioma ' + l + ' aponta para /' + got);
  }
  if ((html.match(/aria-current="true"/g) || []).length !== 2) problems.push(where + ': idioma ativo não marcado nos dois seletores');

  for (const m of html.matchAll(/>\s*(\[[^\]<]{2,80}\])\s*</g)) placeholders.push(where + ': ' + m[1]);
}

for (const [t, w] of titles) if (w.length > 1) problems.push('Título repetido em ' + w.join(', '));
for (const [t, w] of descs) if (w.length > 1) problems.push('Descrição repetida em ' + w.join(', '));

const imgs = fs.readdirSync(path.join(OUT, 'assets/img'));
for (const f of imgs) if (!usedFiles.has('assets/img/' + f)) problems.push('Imagem não usada em docs/: ' + f);

console.log('Rotas verificadas: ' + EXPECTED.length + ' | imagens: ' + imgs.length + ' | links externos únicos: ' + external.size);
console.log('\nExternos:\n  ' + [...external].join('\n  '));
console.log('\nPendências de conteúdo (' + placeholders.length + '):\n  ' + placeholders.join('\n  '));
console.log('\nProblemas (' + problems.length + '):\n  ' + (problems.join('\n  ') || 'nenhum'));
process.exitCode = problems.length ? 1 : 0;
