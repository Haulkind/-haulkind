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

## 13. O que NÃO mudou na rodada 1 (superado pela Parte 3)

- Rodada 1: nenhuma URL criada, removida ou redirecionada. **A Parte 3 (abaixo) altera isso de forma controlada** — 13 URLs NJ novas, nenhum redirect.
- Canonicals das páginas existentes inalterados.
- Páginas NJ: ver §17–§19 (decisão A aplicada).
- ~1.300 páginas de estados fora do mercado continuam indexáveis; só o texto de "drivers available" e as descrições deixaram de afirmar cobertura.
- `layout.tsx` mantém `address.addressLocality: Philadelphia` + `geo` — não removido; **confirmar se há base real em Philadelphia**, senão remover na próxima rodada.
- `/api/service-area-lookup` continua sem auto-aprovar NJ (comentário NJDEP); pedidos NJ caem no backend, que aprova NJ. Comportamento anterior preservado.

## 14. Verificação executada

- `tsc --noEmit` (apps/web): sem erros.
- `next build` (apps/web): sucesso, 83 páginas estáticas.
- `next lint`: **não há configuração ESLint no app web** (pré-existente; o comando pede para criar config). Não foi criada.
- HTML gerado (`.next/server/app`): `index.html`, `service-areas.html`, `services/moving-labor.html` com title/description/H1 novos; 0 ocorrências de "nationwide"/"all 50 states" na home e service-areas; blocos "NEW JERSEY" e "PA • DE • NY" presentes na home.
- Não executado: testes visuais/interativos, verificação em produção, GSC.

## 15. Decisões pendentes (rodada 1)

1. **URLs NJ**: ~~(a)/(b)/(c)~~ → **decidido: opção A** (só mão de obra, URLs novas semanticamente corretas; junk/cleanout NJ segue 410). Aplicado na Parte 3.
2. **Estados fora do mercado (47 + DC)**: manter indexáveis (atual), `noindex` temporário, ou remover do sitemap. Recomendo `noindex,follow` + retirar do sitemap em rodada separada, após olhar impressões no GSC.
3. **Endereço Philadelphia no JSON-LD global**: manter ou remover.
4. **Title duplicado "| HaulKind | HaulKind"**: 23 páginas ainda hardcodam o sufixo além do template — corrigido só nas 2 páginas tocadas; o restante é rodada separada.

## 16. Riscos de ranking / efeitos colaterais

- Mudança de title/H1 da home altera o foco de "hauling PA/NY" para "moving help NJ": queda temporária possível em consultas "junk removal philadelphia" na home (as páginas `/junk-removal-philadelphia-pa` e `/ads/*` continuam intactas e absorvem essas consultas).
- Trocar `LocalBusiness`→`Organization` nas páginas por cidade remove rich results de negócio local que dependiam de endereço inventado (risco de penalidade maior que o ganho).
- Delaware passa a ser aprovado pela cobertura (web + API) — só publicar se houver motoristas em DE; caso contrário remover `DE` dos dois `APPROVED_STATES`. **Parte 3: hauling/junk em DE fica atrás de feature flag desligada (§21).**
- API Railway precisa de redeploy para a mudança de DE no backend valer.

---

# Parte 3 — Decisão A aplicada: NJ labor-only + feature flag DE (mesma branch, sem deploy)

## 17. URLs NJ que CONTINUAM 410 Gone

O middleware (`apps/web/middleware.ts`) mantém os mesmos 5 padrões de 410; só a allowlist explícita de §18 passa. Nenhum redirect foi criado. Classes que continuam 410 (verificado com `curl` no build local):

| Classe | Padrão | Exemplos verificados (410) |
|---|---|---|
| Hub NJ e cidades | `/service-areas/new-jersey`, `/service-areas/new-jersey/*` | `/service-areas/new-jersey`, `/service-areas/new-jersey/newark-nj` |
| Todo pSEO de descarte em NJ | `/junk-removal-*-nj`, `/furniture-removal-*-nj`, `/couch-removal-*-nj`, `/mattress-removal-*-nj`, `/appliance-removal-*-nj`, `/garage-cleanout-*-nj`, `/basement-cleanout-*-nj`, `/curbside-pickup-*-nj`, `/donation-pickup-*-nj` | `/junk-removal-jersey-city-nj`, `/junk-removal-newark-nj`, `/garage-cleanout-trenton-nj`, `/donation-pickup-newark-nj` |
| pSEO labor antigo em NJ (slugs legados, não reaproveitados) | `/labor-only-moving-help-*-nj`; `/moving-help-*-nj` fora da lista curada | `/labor-only-moving-help-newark-nj`, `/moving-help-hoboken-nj`, `/moving-help-paterson-nj` |
| Combinações não curadas | `/[serviço]-[cidade]-nj` fora de §18 | `/furniture-assembly-jersey-city-nj`, `/moving-labor-jersey-city-nj` |
| Landing de anúncios | `/ads/*-nj`, `/ads/*-jersey`, `/ads/hauling-(south-jersey\|trenton\|princeton\|jersey-city\|newark\|hoboken)` | `/ads/hauling-newark`, `/ads/hauling-south-jersey` |

`robots.txt` continua com `Disallow` para `/junk-removal-*-nj`, `/furniture-removal-*-nj`, `/mattress-removal-*-nj`, `/appliance-removal-*-nj`, `/electronics-removal-*-nj`, `/garage-cleanout-*-nj`, `/basement-cleanout-*-nj`, `/curbside-pickup-*-nj`, `/donation-pickup-*-nj`, `/labor-only-moving-help-*-nj`, `/ads/*-nj`. Removida só a linha `Disallow: /moving-help-*-nj` (conflitava com as páginas curadas de §18; as não curadas já respondem 410).

## 18. URLs NJ REABERTAS

**8 (mesma intenção, conteúdo novo).** Nenhum slug NJ de descarte foi reaproveitado. As 8 URLs de cidade em §19 usam o padrão `/moving-help-[cidade]-nj`; todas coincidem com slugs pSEO que existiram antes do 410 (as 8 cidades estão em `lib/geo/cities.ts`) e agora servem **conteúdo novo labor-only** (template `NJLaborPage`, não o pSEO nacional). Registrado aqui como substituição equivalente (mesma intenção: moving help), conforme exigido.

## 19. URLs NJ NOVAS (5 estaduais) + REABERTAS (8 cidades) — 13 no total, status 200, `index,follow`, canonical própria

| URL | Title | H1 | Meta description | Canonical |
|---|---|---|---|---|
| `/moving-labor-new-jersey` | Moving Labor in New Jersey \| Hourly Movers from $79/hr \| HaulKind | Moving Labor in New Jersey | Hire hourly moving labor in New Jersey. Insured helpers load and unload your truck, carry heavy items and move furniture. Upfront pricing, live GPS tracking. Book online. | `https://haulkind.com/moving-labor-new-jersey` |
| `/moving-help-new-jersey` | Moving Help in New Jersey \| Loading, Lifting & Assembly \| HaulKind | Moving Help in New Jersey | Local moving help across New Jersey: hourly helpers for loading and unloading, heavy lifting, furniture assembly and in-home furniture moving. Upfront pricing and live GPS tracking. | `https://haulkind.com/moving-help-new-jersey` |
| `/furniture-assembly-new-jersey` | Furniture Assembly in New Jersey \| Beds, Desks, Wardrobes \| HaulKind | Furniture Assembly in New Jersey | Professional furniture assembly in New Jersey. Beds, wardrobes, desks, shelving and flat-pack furniture built at your home. Upfront pricing, insured pros, book online. | `https://haulkind.com/furniture-assembly-new-jersey` |
| `/loading-unloading-new-jersey` | Loading & Unloading Help in New Jersey \| Truck & POD Labor \| HaulKind | Loading & Unloading Help in New Jersey | Hire loading and unloading help in New Jersey for rental trucks, PODS and storage units. Experienced hourly helpers, upfront pricing, live GPS tracking. Book online. | `https://haulkind.com/loading-unloading-new-jersey` |
| `/heavy-lifting-new-jersey` | Heavy Lifting Help in New Jersey \| Furniture, Appliances, Safes \| HaulKind | Heavy Lifting Help in New Jersey | Need heavy lifting help in New Jersey? Insured helpers move sofas, appliances, safes and gym equipment within your home or into your vehicle. Upfront hourly pricing, book online. | `https://haulkind.com/heavy-lifting-new-jersey` |
| `/moving-help-jersey-city-nj` | Moving Help in Jersey City, NJ \| Loading, Lifting & Assembly \| HaulKind | Moving Help in Jersey City, NJ | Hourly moving help in Jersey City, NJ (Hudson County): loading and unloading, heavy lifting, furniture assembly and in-home furniture moving. Upfront pricing, live GPS tracking. Book online. | `https://haulkind.com/moving-help-jersey-city-nj` |
| `/moving-help-newark-nj` | Moving Help in Newark, NJ \| Loading, Lifting & Assembly \| HaulKind | Moving Help in Newark, NJ | Hourly moving help in Newark, NJ (Essex County): … | `https://haulkind.com/moving-help-newark-nj` |
| `/moving-help-elizabeth-nj` | Moving Help in Elizabeth, NJ \| Loading, Lifting & Assembly \| HaulKind | Moving Help in Elizabeth, NJ | Hourly moving help in Elizabeth, NJ (Union County): … | `https://haulkind.com/moving-help-elizabeth-nj` |
| `/moving-help-trenton-nj` | Moving Help in Trenton, NJ \| Loading, Lifting & Assembly \| HaulKind | Moving Help in Trenton, NJ | Hourly moving help in Trenton, NJ (Mercer County): … | `https://haulkind.com/moving-help-trenton-nj` |
| `/moving-help-princeton-nj` | Moving Help in Princeton, NJ \| Loading, Lifting & Assembly \| HaulKind | Moving Help in Princeton, NJ | Hourly moving help in Princeton, NJ (Mercer County): … | `https://haulkind.com/moving-help-princeton-nj` |
| `/moving-help-camden-nj` | Moving Help in Camden, NJ \| Loading, Lifting & Assembly \| HaulKind | Moving Help in Camden, NJ | Hourly moving help in Camden, NJ (Camden County): … | `https://haulkind.com/moving-help-camden-nj` |
| `/moving-help-cherry-hill-nj` | Moving Help in Cherry Hill, NJ \| Loading, Lifting & Assembly \| HaulKind | Moving Help in Cherry Hill, NJ | Hourly moving help in Cherry Hill, NJ (Camden County): … | `https://haulkind.com/moving-help-cherry-hill-nj` |
| `/moving-help-mount-laurel-nj` | Moving Help in Mount Laurel, NJ \| Loading, Lifting & Assembly \| HaulKind | Moving Help in Mount Laurel, NJ | Hourly moving help in Mount Laurel, NJ (Burlington County): … | `https://haulkind.com/moving-help-mount-laurel-nj` |

(`…` = mesmo texto da linha de Jersey City, trocando cidade/condado.)

Conteúdo de cada página (`apps/web/components/seo/NJLaborPage.tsx`, dados em `apps/web/lib/nj-labor-pages.ts`): H1, intro estadual ou local (condado + nota da cidade a partir de `lib/cities.ts`), lista de tarefas do serviço, aviso explícito **"HaulKind does not offer hauling, junk removal, cleanouts or any disposal service in New Jersey"**, 4 FAQs por serviço, links internos para os outros 4 serviços NJ e para as 8 cidades, CTA para `/quote/labor-only` ou `/quote/assembly`. JSON-LD: `Service` (provider `Organization`, `areaServed` State/City — sem endereço ou coordenadas inventados), `FAQPage`, `BreadcrumbList`.

**Cobertura das prioridades pedidas:** implementadas Jersey City, Newark, Elizabeth (norte), Trenton, Princeton (Mercer County), Camden, Cherry Hill (Camden County), Mount Laurel (Burlington County). **Não criadas** (sem dados verificados em `lib/cities.ts` — criar exigiria inventar condado/bairros/ZIPs): Hoboken, Edison, Woodbridge, Lakewood, Toms River, Brick, Asbury Park, Long Branch, Point Pleasant, e páginas de condado. Páginas de cidade limitadas a **Moving Help** (1 serviço × 8 cidades) para não gerar 40 páginas quase idênticas; os outros 4 serviços têm só a página estadual.

## 20. Sitemap antes → depois

| Chunk | Antes | Depois |
|---|---|---|
| `/sitemap/0.xml` (core + service-areas + blog) | 187 URLs; 0 URLs NJ | **200 URLs**; +13 URLs NJ de §19 (prioridade 0.9 estadual / 0.8 cidade). `/service-areas/delaware`, `/service-areas/delaware/{wilmington,dover}-de` mantidos |
| `/sitemap/1..7.xml`, `/sitemap/10..11.xml` (serviços de descarte: junk, furniture, couch, mattress, appliance, garage, basement, curbside, donation) | 115 URLs cada (inclui `…-wilmington-de`, `…-dover-de`) | **113 URLs cada** — as 2 URLs DE saem enquanto `NEXT_PUBLIC_ENABLE_DE_HAULING` ≠ `true` (18 URLs no total) |
| `/sitemap/8.xml`, `/sitemap/9.xml` (moving-help, labor-only-moving-help) | 115 | 115 (DE labor mantido) |
| URLs NJ pSEO antigas | ausentes | ausentes (inalterado) |

## 21. Delaware — feature flag

`apps/web/lib/service-availability.ts`: `DE_HAULING_ENABLED = process.env.NEXT_PUBLIC_ENABLE_DE_HAULING === 'true'`; `HAULING_STATES = DE_HAULING_ENABLED ? ['PA','DE','NY'] : ['PA','NY']`. **Flag desligada por padrão** (variável não existe no Railway). Tudo o que menciona hauling deriva de `HAULING_*` (labels `PA & NY`, `PA • NY`, `Pennsylvania and New York`, `areaServed` do JSON-LD Hauling), portanto no build atual **não existe afirmação de junk/hauling em DE**:

| Onde | Flag OFF (atual) | Flag ON |
|---|---|---|
| Home title/H1/desc, `/service-areas`, Header, Footer, MarketSplit, PriceCalculator, rodapé dos `/services/*` | "PA & NY" | "PA, DE & NY" |
| Footer link `Hauling Wilmington`; MarketSplit links junk DE | ocultos | visíveis |
| `/service-areas/delaware` | Title/H1 `Moving Help & Furniture Assembly in Delaware`, lista só serviços de labor, aviso "Hauling and junk removal are not currently offered in Delaware" | `Hauling & Moving Help in Delaware` (como PA/NY) |
| `/service-areas/delaware/[city]-de` | Title labor-only, grid só `moving-help`/`labor-only-moving-help`, aviso idem | todos os serviços |
| `/junk-removal-wilmington-de` e demais 17 pSEO de descarte em DE | **200 mantido** (URL não removida/redirecionada), mas `robots: noindex,follow`, fora do sitemap, e badge "Check Availability" em vez de "Drivers Available" | `index,follow`, no sitemap, "Drivers Available" |
| `/moving-help-wilmington-de`, `/labor-only-moving-help-*-de`, JSON-LD `areaServed` da Organization e da oferta Moving Labor | Delaware incluído (labor é permitido) | idem |
| Formulário `/quote/haul-away/location` (fluxo junk) | ZIP 197–199 **ou** estado `DE` digitado → bloqueia com a mensagem "available in eligible Pennsylvania and New York service areas only" | passa |
| `/api/service-area-lookup` e `server/_core/webCompatRoutes.ts` | `DE` continua em `APPROVED_STATES` (cobertura de endereço, independente de serviço — necessário para labor em DE). O bloqueio de descarte é feito no formulário, antes dessa chamada, que é apenas best-effort. | idem |

Para ligar: definir `NEXT_PUBLIC_ENABLE_DE_HAULING=true` no serviço web do Railway e redeployar (variável é lida em build).

## 22. Links internos para NJ

- Home (`MarketSplit`): 5 links estaduais NJ + "Moving Help in NJ".
- Footer: 5 links estaduais + Jersey City, Newark, Trenton, Cherry Hill + Mattress Swap + Hourly Help.
- `/service-areas`: card NJ com 5 serviços + 8 cidades.
- Cada página NJ linka os outros 4 serviços e as 8 cidades.

## 23. Verificação executada (rodada 2)

- `tsc --noEmit`: sem erros. `next build`: sucesso (83 páginas estáticas). `next lint`: continua sem config ESLint no app (não criada).
- `next start` local + `curl`: as 13 URLs de §19 → 200 com title/H1/description/canonical/robots acima e 4 blocos JSON-LD; 10 URLs de §17 → 410; `/junk-removal-wilmington-de` → 200 + `noindex,follow`; `/service-areas/delaware` e `/service-areas/delaware/wilmington-de` → labor-only; home sem "DE" nos labels de hauling; sitemap conforme §20.
- Não executado: testes visuais/interativos, produção, GSC, redeploy.

## 24. Riscos / efeitos colaterais desta rodada

- 4 URLs `/moving-help-{jersey-city,newark,trenton,princeton}-nj` saem de 410 para 200 com conteúdo novo — Google pode levar semanas para reprocessar após um 410; esperado.
- 18 pSEO de descarte em DE passam a `noindex`: se já tinham impressões, elas caem até a flag ser ligada. Alternativa mais agressiva (410/redirect) foi evitada para não mexer em URL.
- `robots.txt` deixou de bloquear `/moving-help-*-nj`; os slugs não curados respondem 410, então não há risco de indexar página velha.
- `isDisposalAllowedForZip` ainda deixa passar ZIP desconhecido (fora de 070–199) — o bloqueio por estado digitado cobre o caso DE/NJ; outros estados não são mercado e seguem para o backend como antes.
- Nenhuma alteração em migrations, banco, API de pedidos ou apps (PWA/Android).
