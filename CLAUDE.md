# Portfólio Renato Oliveira · Designer de Produto

Portfólio bilíngue (EN/PT) para captar clientes no Brasil e no exterior. Este projeto foi desenhado num canvas de Design no claude.ai e trazido para cá. O Claude Design continua como referência visual e histórica, mas não é mais o ambiente de edição principal.

Etapas:

1. **Conversão** do protótipo para site estático: concluída.
2. **Auditoria visual:** diagnóstico entregue em 2026-10-18.
3. **Refinamento visual autoral:** fase atual (ver abaixo).
4. **Auditoria técnica**, antes das próximas etapas (deploy, analytics).

Escreva com o Renato em português (PT-BR).

## Fase atual: refinamento visual autoral

A conversão para site estático está concluída. A fase atual é de refinamento visual autoral. O objetivo é aprofundar a identidade existente com decisões específicas e justificadas, preservar seus elementos fundamentais e melhorar a consistência, a experiência responsiva e a apresentação dos projetos. As alterações devem ser realizadas em etapas controladas, aprovadas antes da implementação e validadas visualmente.

### Elementos fundamentais da identidade

São referências de marca:

- Tipografias Geist e Manrope.
- Paleta e gradiente de marca existentes.
- Logotipo e fotografia em duotone.
- Conceito do hero da Home: retrato sobre azul sólido `#253CEA` e título monumental.
- Haste diagonal, cunha e demais grafismos já estabelecidos (lista em "Marca").
- Rodapé preto com CTA editorial.
- Pílula com ponto e seta giratória como assinatura de ação.

Esses elementos não devem ser substituídos arbitrariamente. Aplicação, proporções, escala, espaçamento e consistência podem ser refinados mediante justificativa e aprovação.

O conceito do hero deve ser preservado, mas correções de responsividade, enquadramento e espaçamento são permitidas.

### Critérios de autoria visual

- Reduza soluções genéricas ou previsíveis sem confundir originalidade com excesso de efeitos.
- Avalie composição, hierarquia tipográfica, ritmo, espaçamento, repetição de componentes, uso de cores, grafismos, imagens e comportamento responsivo.
- Não adicione tendências, texturas, gradientes, animações, sombras ou elementos decorativos apenas para tornar a interface diferente.
- Todo grafismo novo deve ter função clara e, quando apropriado, derivar da geometria da identidade existente, especialmente do monograma R.

### Uso da skill `anthropic-skills:frontend-design`

- A skill atua como apoio crítico para composição, hierarquia, intencionalidade, distinção visual e contenção estética.
- As recomendações genéricas da skill não substituem as tipografias, as cores, o gradiente, os elementos fundamentais nem o conceito visual aprovado da marca.
- Em conflito entre a skill e este arquivo, prevalecem as instruções deste arquivo.

### Aprovação e validação

- O refinamento ocorre por etapas. Antes de cada implementação, apresente o escopo e aguarde aprovação.
- Em mudanças visuais, compare capturas antes e depois em 390 px, 820 px e 1440 px, abrangendo as páginas afetadas. Inclua outras larguras quando necessário.
- Verifique também acessibilidade, navegação, formulários, links, conteúdo em português e inglês e possíveis regressões funcionais.
- Uma mudança não está aprovada só porque o código compila ou passa nos testes automatizados.

### Arquitetura

- O código estático é a fonte de verdade. Não introduza frameworks Node, novas dependências ou mudanças de arquitetura para o refinamento.
- Fluxo atual: `node tools/build.mjs` gera `docs/` (publicado no GitHub Pages) a partir de `src/*.dc.html`, `assets/` e `tools/site.js`. O build valida o resultado com `tools/check.mjs` antes de trocar `docs/`. Uma edição feita direto em `docs/` é sobrescrita no próximo build.
- O build também injeta CSS próprio (menu responsivo, `PATCHES` e `EXTRA_CSS` em `tools/build.mjs`).
- `site/` é um scaffold Astro sem uso. As instruções `site/CLAUDE.md` e `site/AGENTS.md` (comandos `astro dev`) podem estar obsoletas e precisam de avaliação separada; não as siga para este projeto.

## Regras para o agente

- Os **textos (PT e EN) já foram aprovados** pelo Renato. Não reescreva a copy sem pedir; aponte o problema e sugira.
- Antes de qualquer mudança visual ou estrutural, apresente o achado e a proposta e espere aprovação.
- Se uma instrução entrar em conflito com outra ou exigir uma decisão adicional, registre o conflito e não invente uma resolução.

## O formato das fontes (`src/*.dc.html`)

As páginas usam o formato próprio do canvas de Design. **Elas não abrem direto no navegador**: dependem de um runtime (`support.js`) que não acompanha o pacote. O `tools/build.mjs` faz a renderização estática. Como ler:

- `<x-dc>` envolve o markup da página.
- `<helmet>` contém o `<link>` das fontes e o `<style>` da página. As classes `ro-*` ficam ali.
- `{{campo}}` são valores vindos de `renderVals()`.
- `<sc-for list="{{x}}" as="item">` é um loop; `<sc-if value="{{cond}}">` é uma condicional.
- `<script type="text/x-dc" data-dc-script data-props='…'>` tem `class Component extends DCLogic`:
  - `this.state` / `this.setState()` funcionam como no React.
  - `componentDidMount` / `componentWillUnmount` existem; o scroll do menu fixo é registrado ali.
  - `renderVals()` retorna os valores usados no template.
- `/_blob/<id>` são imagens. Todas estão em `assets/<id>.<ext>`; o build troca o caminho.
- `canvas.json` é só o layout dos quadros no canvas (posições e tamanhos); serve como referência das alturas de cada página em 1440px.
- `Sistema.dc.html` é o quadro do design system. É documentação, não uma página do site.

## Mapa de páginas

Rotas geradas pelo build (`ROUTES` em `tools/build.mjs`): EN na raiz, PT em `/pt/`.

| Arquivo | Página | EN | PT |
|---|---|---|---|
| `Main.dc.html` | Home | `/` | `/pt/` |
| `Sobre.dc.html` | Sobre | `/about/` | `/pt/sobre/` |
| `Projetos.dc.html` | Projetos (título "Cases") | `/work/` | `/pt/projetos/` |
| `CaseStrategi.dc.html` | Case · Sistema visual Grupo Strategi | `/work/strategi/` | `/pt/projetos/strategi/` |
| `Case.dc.html` | Case · Identidade e Portal Hub Sebrae RN | `/work/hub-sebrae-rn/` | `/pt/projetos/hub-sebrae-rn/` |
| `Contato.dc.html` | Contato | `/contact/` | `/pt/contato/` |
| `Privacidade.dc.html` | Política de privacidade (LGPD + menção ao GDPR) | `/privacy/` | `/pt/privacidade/` |

Nas fontes, os links entre páginas continuam como `Arquivo.dc.html`; o build os converte para as rotas acima.

## Idiomas (i18n)

- Cada página tem `T = { pt: {...}, en: {...} }` e arrays de dados no mesmo formato (`S`, `C`, `D` etc.).
- Cada idioma tem a própria URL (ver "Mapa de páginas").
- **Detecção automática:** só a Home EN (`/`) redireciona.
  - Se houver escolha salva em `localStorage['ro-lang']`, ela vale.
  - Senão, navegador `pt-*` vai para `/pt/`; qualquer outro idioma fica em EN, que é o padrão internacional.
  - Clicar no seletor salva a escolha.
- O seletor mostra **EN | PT**, nessa ordem. No site estático, cada opção é um link para a página equivalente no outro idioma. Cada página tem dois seletores: o do header e o do menu fixo.
- O `<html>` recebe `lang="en"` ou `lang="pt-BR"`.
- `canonical`, `hreflang`, `og:url`, `og:image` e `sitemap.xml` já são gerados pelo build, mas só quando `SITE_URL` estiver preenchida em `tools/build.mjs` (hoje está vazia).

## Marca

**Tipografia**

- Geist é a fonte principal: títulos e interface, peso 500, tracking negativo.
- Manrope é a secundária: textos corridos.

**Cores**

| Uso | Valor |
|---|---|
| Azul R | `#253CEA` |
| Preto (texto, rodapé) | `#000000` |
| Branco | `#FFFFFF` |
| Cinza frio (seções, campos, superfícies) | `#F7F7F8`, substitui `#F5F5F5` |
| Apenas no gradiente e em detalhes | `#6E80F7`, `#A9B6FF`, navy `#050A2E` |

**Heroes e gradiente**

- **Fundo dos heroes:** azul sólido `#253CEA` em Home, Sobre, Projetos e Contato, por decisão do Renato em 2026-10-19 para alinhar o site à identidade da marca.
- **Banner da Home e do Sobre:** foto `988a63b4….jpg`, uma composição completa com fundo azul próprio (`#1F3EDB`).
  - Home: cobre o hero inteiro (`object-fit: cover`), ancorada no topo para não cortar a cabeça em telas largas.
  - Sobre: fica à direita, com 88% da altura, e uma máscara nas bordas funde o azul da foto ao `#253CEA`.
  - Nos dois, o arco e o escurecimento da base ficam acima da foto (`z-index: 1`). No Sobre, o arco passa na frente do ombro.
- **Gradiente** (205°, #A9B6FF → #6E80F7 → #3A50EE → #253CEA → #1E32D6): não é mais usado nos heroes. Continua só em detalhes: no ícone do card de Contato e nos fundos de reserva das capas em Projetos.
- O conceito do hero da Home é fixo (ver "Elementos fundamentais da identidade"); correções de responsividade, enquadramento e espaçamento são permitidas.

**Tom:** sóbrio e editorial. Rodapé preto.

**Grafismos**

- Eyebrow com fio fino.
- **Arcos:**
  - na entrada dos heroes;
  - nos rodapés de Home, Sobre e Projetos;
  - no bloco de resultado do case Hub;
  - em Contato, atrás do card do formulário.
- **Haste diagonal** (ponteiro): intro da Home e bio do Sobre.
- **Cunha** azul no bloco "Sobre" da Home.
- **Marca d'água** do símbolo nascendo da base da seção de serviços da Home: centralizada, opacidade 0,06.
- **Assinatura do rodapé:** símbolo + "DESIGNER DE PRODUTO".
- **Removidos de propósito, não reintroduzir:**
  - arco no hero de Projetos, porque sobrepunha o texto;
  - faixa de haste no rodapé, rejeitada pelo Renato.
- **Em avaliação: glow pulsante** (`.ro-glow`, nos heroes). Na Home e no Sobre ele fica coberto pela foto do banner; em Projetos e Contato continua visível sobre o azul sólido. Sem decisão definitiva. A decisão será tomada depois, comparando duas versões: com o glow atual e sem o glow, preservando o fundo dos heroes. Não altere o glow até essa comparação ser aprovada.

**Componentes:** botões pill com ponto e seta que gira para ↗ no hover. Raios de 16px (campos), 20px (cards e imagens) e 999px (pills).

- **Exceção intencional: molduras de dispositivos.** Os raios das molduras que simulam aparelhos (no case Hub: janela de navegador do portal desktop com 14px e moldura de celular com 28px) acompanham o aparelho representado e não seguem a escala 16/20/999. Não "corrija" esses valores para a escala geral.

**Fotografia:** duotone azul.

**Comportamento**

- Menu fixo: aparece ao rolar (`.ro-stk` / `.ro-on`). Itens com hover azul.
- Navegação centralizada: grid de 3 colunas (`.ro-hd`) acima de 900px; flex abaixo disso.
- Menu responsivo (adicionado pelo build): com JavaScript ativo, até 960px a navegação dá lugar a um botão de menu que abre um painel em tela cheia (`.ro-burger` / `.ro-menu`). Sem JavaScript, vale o cabeçalho original.

**Responsivo dos arcos**

- Arco do hero da Home: some abaixo de 1100px.
- Arco do Sobre: reduz abaixo de 1200px e some abaixo de 760px.
- Arco do resultado do Hub: some abaixo de 760px.

## Imagens (`assets/`)

| Arquivo | O que é | Onde |
|---|---|---|
| `dead834c….png` | Logo escuro | todas as páginas |
| `77e36605….png` | Logo branco | Home, Sobre, Projetos, Contato |
| `827aec2d….png` | Logo com símbolo azul e nome branco | rodapé da Home |
| `45a024ad….png` | Símbolo branco | assinatura do rodapé |
| `f4055127….png` | Símbolo azul | marca d'água da Home |
| `988a63b4….jpg` | Banner do hero: retrato duotone sobre azul (JPG qualidade 85, gerado do PNG original em `_nao-usados/`) | Home, Sobre e `og:image` |
| `e9d6ba4d….jpg` | Capa do case Strategi | Home, Projetos, CaseStrategi |
| `4cb226fe….jpg` | Capa do Hub / paleta | Home, Projetos, Case |
| `bb4e355b….jpg` | Home do portal Hub (página inteira, 989 KB) | Case |
| `80c99e23….jpg` | Home do portal Hub em tablet (original também em `_nao-usados/`) | Case |
| `e9e118ca….jpg` | Experiência anterior do Hub | Case |
| `7d12821e…`, `52a5296a…`, `3e7aac78….jpg` | Logo, tipografia e grafismos do Hub | Case |
| demais `.jpg` | Peças do sistema Strategi | CaseStrategi |
| `cd5db177….jpg` | Exemplo de foto duotone | Sistema |
| `_nao-usados/` | Imagens enviadas que não estão em uso | — |

## Pendências conhecidas (antes do lançamento)

**Imagens (pendências de auditoria, ainda não corrigidas)**

- Case Hub: cerca de 11 placeholders visíveis (`[Tela · …]` / `[Screen · …]` e `[Composição · Desktop + mobile]`).
- Case Hub: resolvida a repetição da imagem `4cb226fe`. Ela aparece uma única vez (`src/Case.dc.html`, linha 180); a capa duplicada foi removida e a figura que repetia a imagem agora usa `80c99e23` (linha 304). O mapa `SRC` das decisões ainda tem uma entrada `[04 · Cores]` com `4cb226fe`, mas nenhuma decisão a usa, então ela não aparece na página.
- Case Strategi: nenhum placeholder visível hoje; todas as seções de Aplicações têm imagens. Os textos `ph` continuam no código só como reserva.

**Links e textos**

- O link do currículo em PDF está vazio (`href="#"`) no rodapé da Home e no Sobre.
- O placeholder `[+ outras]` / `[+ more]` continua na lista de ferramentas do Sobre.

**Formulário de Contato**

- Já envia pelo Web3Forms (chave em `WEB3FORMS_ACCESS_KEY`, `tools/build.mjs`).
- A política de privacidade já cita o Web3Forms na seção de compartilhamento.

**Analytics e cookies**

- O Google Analytics está previsto, mas não instalado.
- Ao ativar, criar um banner de consentimento: o GA só carrega depois do aceite, como diz a política.

**Outros**

- Revisão de marca do case Hub (uso das marcas Sebrae).
- Validação jurídica da política de privacidade.

## Checklist sugerido para a auditoria técnica

**Acessibilidade (WCAG 2.2 AA)**

- Contraste do texto branco sobre o azul dos heroes e sobre a foto do banner.
- Foco visível e navegação por teclado.
- Textos alternativos.
- `aria-pressed` no seletor de idioma.
- Rótulos do formulário.
- `prefers-reduced-motion` para as animações.

**Performance**

- Converter imagens para AVIF/WebP com `srcset`.
- Lazy loading.
- Carregamento das fontes (`font-display`, subset).
- Peso dos estilos inline.

**SEO**

- `title` e `description` por página e idioma.
- Open Graph.
- `hreflang`, sitemap, canonical.
- HTML semântico (um `h1` por página).

**Código**

- Hoje quase todo o estilo é inline. Extrair tokens (cores, raios, tipografia) para CSS variables, sem mudar o visual.

**Privacidade**

- Nada deve rastrear antes do consentimento.
- Links da política em todos os rodapés.
