# Auditoria SEO — HaulKind (site público `apps/web`)

Data: 2026-09-28. Somente leitura; nenhum arquivo alterado nesta fase.
Framework: Next.js 14 App Router. Domínio canônico: `https://haulkind.com` (www → 301 no `middleware.ts`).

## 1. Homepage (`/`)

| Item | Onde | Valor atual |
|---|---|---|
| Title | `app/layout.tsx` `metadata.title.default` | `HaulKind - Fast Local Hauling & Moving Help \| PA, NY` |
| Template | idem | `%s \| HaulKind` |
| Meta description | `app/layout.tsx` | `Affordable hauling, moving labor & furniture donation pickup in PA & NY. All-in pricing from $99. Same-day service. Get a free quote now!` |
| Keywords | `app/layout.tsx` | lista genérica (hauling service, moving help, …) |
| Canonical | `app/layout.tsx` `alternates.canonical: '/'` + `metadataBase` | `https://haulkind.com/` |
| OpenGraph | `app/layout.tsx` | title `HaulKind — Fast, Fair Hauling & Moving Help`; desc `Same-day hauling, donation pickup & furniture assembly in PA & NY…`; image `/og-image.png` 1200×630 |
| Twitter | `app/layout.tsx` | `summary_large_image`; desc `Same-day hauling & moving help in PA & NY…` |
| Robots meta | `app/layout.tsx` | index/follow, max-image-preview large |
| H1 | `components/landing/HeroSection.tsx` | `Fast, Fair Hauling & Moving Help — PA & NY` |
| Subheadline | idem | `Same-day pickup. Upfront pricing. Real-time tracking. We show up on time — guaranteed.` |
| Acima da dobra | `app/page.tsx` | faixa de preço `Half a truck starting at $279 — all-in pricing…` + selos |
| JSON-LD | `app/layout.tsx` (inline `<script type="application/ld+json">`) | `LocalBusiness` com `address` Philadelphia/PA (sem rua), `geo`, `areaServed: [Pennsylvania, New York]`, `serviceType` (Hauling, Moving Labor, Donation Pickup, Furniture Assembly, Mattress Swap, Loading & Unloading), `aggregateRating 5.0/7`, `hasOfferCatalog` (4 ofertas) |

Componentes da home: `HeroSection`, `WhyDifferent`, `PriceCalculator`, `HowItWorks`, `ComparisonTable`, `Guarantees`, `Testimonials`, `OurStory`, `CTASection`. Não há bloco por estado.

## 2. Header / Footer

- `components/Header.tsx`: menu desktop "Hauling Services" (Furniture Pickup, Appliance Pickup, Property Clearing, Commercial, Electronics Recycling, What We Take); menu mobile item **"Hauling (PA Only)"**.
- `components/Footer.tsx`:
  - Descrição: **"…in Pennsylvania and New York. Hauling services available in PA only."**
  - "Popular Service Areas" (PA & NY): links `/junk-removal-*`. **Dois links quebrados**: `/junk-removal-new-york-ny` (slug real é `new-york-city-ny`) e `/junk-removal-king-of-prussia-pa` (cidade não existe em `lib/geo/cities.ts`) → 404.

## 3. Sitemap e robots

- `app/sitemap.ts`: índice de sitemaps. Chunk 0 = páginas core + `/service-areas/[state]` + `/service-areas/[state]/[city]` + blog. Chunks 1..11 = um por serviço (`SERVICES` em `lib/seo-data.ts`) × todas as cidades de `lib/geo/cities.ts`.
  - **Escala real: 51 estados / 124 cidades (115 fora de NJ) × 11 serviços ≈ 1.265 páginas serviço+cidade + 50 páginas estaduais + 115 páginas municipais**, quase todas em estados sem operação (AK, AL, CA, TX, …).
  - NJ é excluído inteiramente do sitemap.
- `app/robots.ts`: `Disallow` para `/api/`, `/driver/`, `/quote/tracking`, e todos os padrões NJ legados (`/service-areas/new-jersey`, `/*-nj`, `/ads/*-nj`, `/ads/hauling-<cidades NJ>`). Sitemap declarado: `https://haulkind.com/sitemap.xml`.

## 4. Middleware / redirects

- `middleware.ts`: `www` → 301; **qualquer URL NJ retorna HTTP 410 Gone** (`/service-areas/new-jersey(/…)`, `/<qualquer>-nj`, `/ads/*-nj`, `/ads/*-jersey`, `/ads/hauling-(south-jersey|trenton|princeton|jersey-city|newark|hoboken)`). Origem: commit `05e1c2a` (29/04/2026) "NJDEP compliance — Inspector Chris Farrar". O padrão `^/[a-z0-9-]+-nj$` bloqueia também `/moving-help-newark-nj`, `/labor-only-moving-help-*-nj` etc. → **hoje não existe nenhuma página NJ ativa**.
- `next.config.js` `redirects()`: `/junk-removal` → `/services/cleanout`, `/hauling` → `/services/cleanout`, `/moving-help` → `/services/moving-labor`, `/services` → `/quote`, etc.

## 5. Service areas

| Página | Arquivo | Title / H1 / texto |
|---|---|---|
| `/service-areas` | `app/service-areas/page.tsx` | Title **`Service Areas - Nationwide Hauling & Moving Help`**; desc **`…across all 50 states`**; OG **`Nationwide Coverage`**; H1 `Hauling & Moving Help Service Areas`; texto **`…and more nationwide`**; H2 `All 50 States` (grid com 50 estados, NJ removido) |
| `/service-areas/[state]` | `app/service-areas/[state]/page.tsx` | Title `Hauling & Moving Help in {State}`; H1 idem; lista de cidades + 8 serviços × cidade; `new-jersey` → notFound |
| `/service-areas/[state]/[city]` | `app/service-areas/[state]/[city]/page.tsx` | Title `Hauling & Moving Help in {City}, {ST}`; H1 `HaulKind Services in {City}, {ST}`; JSON-LD `LocalBusiness` com `address` na cidade (um LocalBusiness por cidade, telefone `+1-267-434-7689` ≠ layout `+1-609-456-8188`) |
| `/[service]-[city]` | `app/[slug]/page.tsx` | Title `{Service} in {City}, {ST} \| HaulKind`; H1 idem; JSON-LD `FAQPage` + `Service` (provider `LocalBusiness` com endereço na cidade) + `BreadcrumbList`; texto fixo **"We have drivers available near {City} today"** em todas as cidades |

Dados: `lib/geo/cities.ts` (51 estados), `lib/seo-data.ts` (`SERVICES`: junk-removal, furniture-removal, couch-removal, mattress-removal, appliance-removal, garage-cleanout, basement-cleanout, moving-help, labor-only-moving-help, curbside-pickup, donation-pickup), `lib/seo-data-national.ts` (geração de conteúdo, recusa NJ).

Cidades dos mercados reais em `lib/geo/cities.ts`:
- NJ (9): newark, jersey-city, paterson, elizabeth, camden, cherry-hill, trenton, princeton, mount-laurel — todas 410.
- PA (3): philadelphia, pittsburgh, allentown.
- DE (2): wilmington, dover.
- NY (5): new-york-city, buffalo, rochester, yonkers, syracuse.

## 6. Páginas de serviço (`/services/*`, `/assembly`, `/mattress-swap`, `/donation-pickup`)

| URL | Title atual | Observação |
|---|---|---|
| `/services/moving-labor` | `Moving Labor & Loading Help in PA & NY` | H1 idem; texto "across Pennsylvania and New York" |
| `/services/furniture` | `Furniture Pickup & Hauling in PA` | rodapé "available in Pennsylvania and New York only" |
| `/services/appliances` | `Appliance Pickup & Recycling in PA` | idem |
| `/services/cleanout` | `Property Clearing Services in PA` | idem |
| `/services/commercial` | `Commercial Hauling & Office Clearing in PA` | idem |
| `/services/electronics` | `Electronics Pickup & E-Waste Recycling in PA` | idem |
| `/services/what-we-take` | `What We Take — Items We Pick Up` | "available in Pennsylvania and New York" |
| `/assembly` | `Furniture Assembly Service \| HaulKind - We Build It For You` | desc "in Philadelphia" |
| `/mattress-swap` | `Mattress Swap & Removal Service \| Same-Day` | "Same-day available in PA & NY" |
| `/donation-pickup` | `Donation Pickup Service \| HaulKind…` | sem estado |
| `/pricing` | `Hauling & Moving Pricing - All-In Rates from $99` | — |
| `/contact` | `Contact HaulKind - Get in Touch \| PA & NY` | texto "serves Pennsylvania and New York" |
| `/faq` | `FAQ - Hauling & Moving Help Questions Answered` | resposta "We serve Pennsylvania and New York" |
| `/how-it-works` | `How It Works - …` | desc "in PA & NY" |
| `/blog` | `Blog — Tips, Guides & Local Resources` | desc "for PA & NY" |

## 7. Referências inconsistentes encontradas

- "PA & NY" / "Pennsylvania and New York": `layout.tsx` (4×), `HeroSection.tsx`, `Footer.tsx`, `blog/page.tsx`, `mattress-swap/page.tsx`, `contact/page.tsx` (4×), `how-it-works/page.tsx`, `services/*` (7 arquivos), `faq/page.tsx`, blog MDX `junk-removal-cost-philadelphia-2026.mdx`.
- "Nationwide" / "All 50 States": `service-areas/page.tsx` (title, description, OG, texto, H2).
- "PA Only" (hauling): `Header.tsx` (mobile), `Footer.tsx`, `PriceCalculator.tsx` (badge), `quote/haul-away/location/page.tsx` ("exclusive to Pennsylvania").
- Delaware: **nenhuma menção** no site além das 2 cidades no banco geo; `app/api/service-area-lookup/route.ts` aprova apenas `MA, PA, NY, CT`; backend `server/_core/webCompatRoutes.ts` aprova `NJ, MA, PA, NY, CT`. DE não está em nenhuma lista.
- Junk removal + NJ: bloqueado por `middleware` (410), `sitemap`, `robots`, `seo-data*.ts`, `ads-cities.ts`, `PriceCalculator` (botão removido do DOM para ZIP 07xxx–08xxx), `LeadCaptureModal`, `quote/haul-away/location`. Lógica `isNJZip` **duplicada em 3 componentes**.

## 8. Detecção por ZIP/estado (estado atual)

- `isNJZip()` copiado em `PriceCalculator.tsx`, `LeadCaptureModal.tsx`, `quote/haul-away/location/page.tsx` (ZIP 07001–08999).
- Não existe configuração central de disponibilidade por estado; regras NJ estão espalhadas.
- Serviços PA/DE/NY não têm regra; hauling é rotulado "PA Only" na UI, contradizendo links do footer "Hauling Brooklyn/Buffalo/Rochester".

## 9. Páginas antigas / fora do mercado

- 47 estados fora de NJ/PA/DE/NY (+DC) publicados e listados no sitemap: `/service-areas/<estado>`, `/service-areas/<estado>/<cidade>`, `/<serviço>-<cidade>` — ~1.300 URLs com texto "Drivers Available… today" e cobertura que não existe.
- NJ: ~100 URLs legadas já em 410 (não há equivalente ativo).
- `/ads/*`: landing pages pagas PA/NY (`lib/ads-cities.ts`), NJ removidas.

## 10. Riscos identificados antes de qualquer alteração

1. Reabrir URLs NJ exige revisar a regra 410 criada por exigência do inspetor NJDEP — decisão de negócio/compliance, não técnica.
2. Delaware não é aprovado pela API de cobertura; anunciar DE sem ajustar cobertura gera orçamento recusado.
3. Remover ~1.300 páginas fora do mercado pode derrubar impressões em GSC, mas essas impressões não geram serviço real.
4. Dois links do footer já retornam 404.
5. Telefones divergentes nos schemas (`+1-609-456-8188` vs `+1-267-434-7689`).

---

# Parte 2 — Alterações aplicadas (branch `devin/1790637104-seo-nj-repositioning`, sem deploy)

## 11. Arquivos modificados

| Arquivo | O que mudou |
|---|---|
| `apps/web/lib/service-availability.ts` (novo) | Fonte única: `MARKET_STATES` (NJ, PA, DE, NY), `HAULING_STATES` (PA, DE, NY), catálogo de serviços por categoria, `isServiceAvailable`, `getStateFromZip`/`isNJZip`, textos `NJ_LABOR_NOTICE` e `HAULING_ELIGIBILITY_NOTICE` |
| `apps/web/app/layout.tsx` | Title/description/OG/Twitter globais; JSON-LD `areaServed` NJ+PA+DE+NY, `serviceType` ampliado, oferta Hauling com `areaServed` PA/DE/NY, oferta Moving Labor com NJ/PA/DE/NY |
| `apps/web/components/landing/HeroSection.tsx` | H1 e subheadline |
| `apps/web/components/landing/MarketSplit.tsx` (novo) + `index.ts` + `app/page.tsx` | Bloco "NEW JERSEY — Moving Help & Labor" vs "PA • DE • NY — Moving Help & Hauling" acima da dobra |
| `apps/web/components/landing/PriceCalculator.tsx`, `LeadCaptureModal.tsx`, `app/quote/haul-away/location/page.tsx` | `isNJZip` local removido (3 cópias) → import central; badge "PA Only" → "PA · DE · NY"; mensagens NJ centralizadas |
| `apps/web/components/Header.tsx` | "Hauling Services"/"Hauling (PA Only)" → "Hauling (PA, DE & NY)"; link "Moving Labor" no desktop; "Moving Labor (NJ, PA, DE & NY)" no mobile |
| `apps/web/components/Footer.tsx` | Texto de marca; coluna NJ (labor/assembly/mattress/hourly); coluna hauling PA/DE/NY; removidos 3 links 404 (`king-of-prussia-pa`, `new-york-ny`, `brooklyn-ny`) |
| `apps/web/app/service-areas/page.tsx` | Title/desc/OG sem "Nationwide/All 50 States"; H1 `Moving Help & Hauling Service Areas`; seção "Where HaulKind Operates" (NJ card + PA/DE/NY) e seção "Other Locations" (estados legados, com aviso de disponibilidade limitada). Nenhuma URL removida. |
| `apps/web/app/service-areas/[state]/page.tsx` | Descrição/hero condicionais: estados de mercado → "eligible service areas"; demais → "limited availability, check coverage". Title mantido (ranking). |
| `apps/web/app/service-areas/[state]/[city]/page.tsx`, `app/[slug]/page.tsx` | JSON-LD: removido `address`/`geo` inventado por cidade, `LocalBusiness` → `Organization` (mantido `areaServed`); telefone `+1-267-434-7689` → `+1-609-456-8188`; "We have drivers available near {City} today" agora só em NJ/PA/DE/NY, fora disso "check coverage" |
| `apps/web/app/services/moving-labor/page.tsx` | Title/desc/H1/JSON-LD/cidades para NJ, PA, DE, NY; âncoras `#loading-unloading`, `#heavy-lifting`; aviso hauling PA/DE/NY |
| `apps/web/app/services/{furniture,appliances,cleanout,commercial,electronics,what-we-take}/page.tsx` | Rodapé "PA and NY only" → "eligible PA, DE & NY service areas only. Not offered in New Jersey." |
| `apps/web/app/{contact,faq,how-it-works,mattress-swap}/page.tsx` | "PA & NY" → NJ (labor) + PA/DE/NY (hauling) |
| `apps/web/app/api/service-area-lookup/route.ts` | `DE` adicionado a `APPROVED_STATES` e `stateMap` |
| `server/_core/webCompatRoutes.ts` | `DE` adicionado a `APPROVED_STATES` e `stateMap` (API Railway — precisa redeploy da API) |

## 12. Antes → Depois (homepage)

| Campo | Antes | Depois |
|---|---|---|
| Title | `HaulKind - Fast Local Hauling & Moving Help \| PA, NY` | `HaulKind \| Moving Help NJ + Hauling PA, DE & NY` |
| Meta description | `Affordable hauling, moving labor & furniture donation pickup in PA & NY. All-in pricing from $99…` | `Book moving labor, furniture assembly and heavy lifting in NJ. Hauling and junk removal are available in eligible PA, DE & NY service areas. Upfront pricing and live GPS.` |
| H1 | `Fast, Fair Hauling & Moving Help — PA & NY` | `Moving Help in New Jersey. Hauling in PA, DE & NY.` |
| Subheadline | `Same-day pickup. Upfront pricing. Real-time tracking…` | `Book trusted local pros for moving labor, loading and unloading, furniture assembly, heavy lifting, mattress swaps and hauling services. Upfront pricing, easy booking and live GPS tracking.` |
| JSON-LD areaServed | PA, NY | NJ, PA, DE, NY (hauling offer: PA, DE, NY) |

`/service-areas`: Title `Service Areas - Nationwide Hauling & Moving Help` → `Service Areas - Moving Help in NJ, Hauling in PA, DE & NY`; H1 `Hauling & Moving Help Service Areas` → `Moving Help & Hauling Service Areas`; H2 `All 50 States` → `Where HaulKind Operates` + `Other Locations`.

`/services/moving-labor`: Title `…in PA & NY` → `…in NJ, PA, DE & NY`; H1 idem.

## 13. O que NÃO mudou (de propósito)

- **Nenhuma URL criada, removida ou redirecionada.** `sitemap.ts`, `robots.ts`, `middleware.ts` (410 NJ) e `next.config.js` intactos.
- Canonicals inalterados.
- Páginas NJ continuam em 410 — aguardando decisão (ver §15).
- ~1.300 páginas de estados fora do mercado continuam indexáveis; só o texto de "drivers available" e as descrições deixaram de afirmar cobertura.
- `layout.tsx` mantém `address.addressLocality: Philadelphia` + `geo` — não removido; **confirmar se há base real em Philadelphia**, senão remover na próxima rodada.
- `/api/service-area-lookup` continua sem auto-aprovar NJ (comentário NJDEP); pedidos NJ caem no backend, que aprova NJ. Comportamento anterior preservado.

## 14. Verificação executada

- `tsc --noEmit` (apps/web): sem erros.
- `next build` (apps/web): sucesso, 83 páginas estáticas.
- `next lint`: **não há configuração ESLint no app web** (pré-existente; o comando pede para criar config). Não foi criada.
- HTML gerado (`.next/server/app`): `index.html`, `service-areas.html`, `services/moving-labor.html` com title/description/H1 novos; 0 ocorrências de "nationwide"/"all 50 states" na home e service-areas; blocos "NEW JERSEY" e "PA • DE • NY" presentes na home.
- Não executado: testes visuais/interativos, verificação em produção, GSC.

## 15. Decisões pendentes (bloqueiam a próxima rodada)

1. **URLs NJ**: (a) reabrir só `/moving-help-*-nj`, `/labor-only-moving-help-*-nj`, `/donation-pickup-*-nj` e `/service-areas/new-jersey` com conteúdo labor-only, mantendo 410 para junk/cleanout NJ; (b) manter tudo 410; (c) só relatório. Impacto de (a): exige alterar `middleware.ts`, `robots.ts`, `sitemap.ts`, `seo-data-national.ts` e verificar com o compliance NJDEP.
2. **Estados fora do mercado (47 + DC)**: manter indexáveis (atual), `noindex` temporário, ou remover do sitemap. Recomendo `noindex,follow` + retirar do sitemap em rodada separada, após olhar impressões no GSC.
3. **Endereço Philadelphia no JSON-LD global**: manter ou remover.
4. **Title duplicado "| HaulKind | HaulKind"**: 23 páginas ainda hardcodam o sufixo além do template — corrigido só nas 2 páginas tocadas; o restante é rodada separada.

## 16. Riscos de ranking / efeitos colaterais

- Mudança de title/H1 da home altera o foco de "hauling PA/NY" para "moving help NJ": queda temporária possível em consultas "junk removal philadelphia" na home (as páginas `/junk-removal-philadelphia-pa` e `/ads/*` continuam intactas e absorvem essas consultas).
- Trocar `LocalBusiness`→`Organization` nas páginas por cidade remove rich results de negócio local que dependiam de endereço inventado (risco de penalidade maior que o ganho).
- Delaware passa a ser aprovado pela cobertura (web + API) — só publicar se houver motoristas em DE; caso contrário remover `DE` dos dois `APPROVED_STATES`.
- API Railway precisa de redeploy para a mudança de DE no backend valer.
