# Portfólio Renato Oliveira · Designer de Produto

Portfólio bilíngue (EN/PT) para captar clientes no Brasil e no exterior. Este projeto foi desenhado num canvas de Design no claude.ai e trazido para cá para três etapas, nesta ordem:

1. **Conversão** do protótipo para um site estático que roda localmente.
2. **Auditoria visual.**
3. **Auditoria técnica**, antes das próximas etapas (deploy, formulário, analytics).

Escreva com o Renato em português (PT-BR).

## Regras para o agente

- Os **textos (PT e EN) já foram aprovados** pelo Renato. Não reescreva a copy sem pedir; aponte o problema e sugira.
- As **decisões de marca abaixo são finais**. Na auditoria visual, relate desvios; não "melhore" o estilo por conta própria.
- Antes de qualquer mudança visual ou estrutural, apresente o achado e a proposta e espere aprovação.
- Na conversão, o objetivo é **paridade visual** com o protótipo, não um redesign.

## O formato atual (`src/*.dc.html`)

As páginas usam o formato próprio do canvas de Design. **Elas não abrem direto no navegador**: dependem de um runtime (`support.js`) que não acompanha o pacote. Como ler:

- `<x-dc>` envolve o markup da página.
- `<helmet>` contém o `<link>` das fontes e o `<style>` da página. As classes `ro-*` ficam ali.
- `{{campo}}` são valores vindos de `renderVals()`.
- `<sc-for list="{{x}}" as="item">` é um loop; `<sc-if value="{{cond}}">` é uma condicional.
- `<script type="text/x-dc" data-dc-script data-props='…'>` tem `class Component extends DCLogic`:
  - `this.state` / `this.setState()` funcionam como no React.
  - `componentDidMount` / `componentWillUnmount` existem; o scroll do menu fixo é registrado ali.
  - `renderVals()` retorna os valores usados no template.
- `/_blob/<id>` são imagens. Todas estão em `assets/<id>.<ext>`; basta trocar o caminho.
- `canvas.json` é só o layout dos quadros no canvas (posições e tamanhos); serve como referência das alturas de cada página em 1440px.
- `Sistema.dc.html` é o quadro do design system. É documentação, não uma página do site.

## Mapa de páginas

| Arquivo | Página | Rota sugerida |
|---|---|---|
| `Main.dc.html` | Home | `/` |
| `Sobre.dc.html` | Sobre | `/sobre` · `/about` |
| `Projetos.dc.html` | Projetos (título "Cases") | `/projetos` · `/work` |
| `CaseStrategi.dc.html` | Case · Sistema visual Grupo Strategi | `/projetos/strategi` |
| `Case.dc.html` | Case · Identidade e Portal Hub Sebrae RN | `/projetos/hub-sebrae-rn` |
| `Contato.dc.html` | Contato | `/contato` · `/contact` |
| `Privacidade.dc.html` | Política de privacidade (LGPD + menção ao GDPR) | `/privacidade` · `/privacy` |

Os links entre as páginas hoje apontam para `Arquivo.dc.html`. Ajuste-os na conversão.

## Idiomas (i18n)

- Cada página tem `T = { pt: {...}, en: {...} }` e arrays de dados no mesmo formato (`S`, `C`, `D` etc.).
- **Detecção automática:**
  - Se houver escolha salva em `localStorage['ro-lang']`, ela vale.
  - Senão, navegador `pt-*` abre em PT; qualquer outro idioma abre em EN, que é o padrão internacional.
  - Clicar no seletor salva a escolha.
- O seletor mostra **EN | PT**, nessa ordem. Cada página tem dois seletores: o do header e o do menu fixo.
- O wrapper raiz recebe `lang="en"` ou `lang="pt-BR"`.
- **Decisão para a auditoria técnica:** hoje a troca de idioma acontece só no navegador, com a mesma URL. Para SEO internacional, considere URLs separadas por idioma, com `hreflang` e sitemap. Proponha antes de implementar.

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

**Gradiente**

- Usado só nos heroes. Ângulo 205°, cores #A9B6FF → #6E80F7 → #3A50EE → #253CEA → #1E32D6.
- **O hero da Home fica como está.**

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

**Componentes:** botões pill com ponto e seta que gira para ↗ no hover. Raios de 16px (campos), 20px (cards e imagens) e 999px (pills).

**Fotografia:** duotone azul.

**Comportamento**

- Menu fixo: aparece ao rolar (`.ro-stk` / `.ro-on`). Itens com hover azul.
- Navegação centralizada: grid de 3 colunas (`.ro-hd`) acima de 900px; flex abaixo disso.

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
| `00279768….webp` | Retrato duotone | Home, Sobre |
| `e9d6ba4d….jpg` | Capa do case Strategi | Home, Projetos, CaseStrategi |
| `4cb226fe….jpg` | Capa do Hub / paleta | Home, Projetos, Case |
| `bb4e355b….jpg` | Home do portal Hub (página inteira, 989 KB) | Case |
| `e9e118ca….jpg` | Experiência anterior do Hub | Case |
| `7d12821e…`, `52a5296a…`, `3e7aac78….jpg` | Logo, tipografia e grafismos do Hub | Case |
| demais `.jpg` | Peças do sistema Strategi | CaseStrategi |
| `cd5db177….jpg` | Exemplo de foto duotone | Sistema |
| `_nao-usados/` | Imagens enviadas que não estão em uso | — |

## Pendências conhecidas (antes do lançamento)

**Imagens**

- Placeholders no case Hub: cerca de 17 marcadores `[Tela · …]` / `[Screen · …]` e `[Imagem …]`.
- Placeholders no case Strategi: 6.

**Links e textos**

- O link do currículo em PDF está vazio (`href="#"`) no rodapé da Home e no Sobre.
- O placeholder `[+ outras]` / `[+ more]` continua na lista de ferramentas do Sobre.

**Formulário de Contato**

- Ainda não envia: é só estado local.
- É preciso conectar um serviço gratuito (Formspree, Web3Forms ou Netlify Forms).
- Depois, atualizar a seção "Compartilhamento" da política de privacidade com o serviço escolhido.

**Analytics e cookies**

- O Google Analytics está previsto, mas não instalado.
- Ao ativar, criar um banner de consentimento: o GA só carrega depois do aceite, como diz a política.

**Outros**

- Revisão de marca do case Hub (uso das marcas Sebrae).
- Validação jurídica da política de privacidade.

## Checklist sugerido para a auditoria técnica

**Acessibilidade (WCAG 2.2 AA)**

- Contraste do texto branco sobre o gradiente.
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
