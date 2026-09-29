import { getCityBySlug } from '@/lib/geo'
import type { GeoCity } from '@/lib/geo'
import {
  NJ_LABOR_SERVICE_SLUGS,
  NJ_LABOR_CITY_SLUGS,
  NJ_CITY_PAGE_SERVICE,
  type NJLaborServiceSlug,
} from '@/lib/nj-allowed-paths'

export interface NJLaborService {
  slug: NJLaborServiceSlug
  name: string
  shortName: string
  quoteHref: string
  priceLine: string
  title: string
  metaDescription: string
  h1: string
  intro: string
  tasks: string[]
  faqs: Array<{ q: string; a: string }>
}

const QUOTE_LABOR = '/quote?service=labor-only'
const QUOTE_ASSEMBLY = '/quote?service=assembly'

export const NJ_LABOR_SERVICES: readonly NJLaborService[] = [
  {
    slug: 'moving-labor',
    name: 'Moving Labor',
    shortName: 'Moving Labor',
    quoteHref: QUOTE_LABOR,
    priceLine: 'From $79/hr per helper. 2-hour minimum.',
    title: 'Moving Labor in New Jersey | Hourly Movers from $79/hr',
    metaDescription:
      'Hire hourly moving labor in New Jersey. Insured helpers load and unload your truck, carry heavy items and move furniture. Upfront pricing, live GPS tracking. Book online.',
    h1: 'Moving Labor in New Jersey',
    intro:
      'You rent the truck or container; we bring the muscle. HaulKind moving helpers arrive at your New Jersey address on time, load and unload carefully and work by the hour, so you only pay for what you need.',
    tasks: [
      'Loading rental trucks, PODS and storage containers',
      'Unloading at your new home or apartment',
      'Carrying furniture up and down stairs',
      'Wrapping and protecting furniture for transport',
      'Moving items into or out of storage units',
      'Rearranging furniture inside your home',
    ],
    faqs: [
      {
        q: 'Do you provide a truck in New Jersey?',
        a: 'No. In New Jersey HaulKind provides labor only. You supply the truck, trailer or container and our helpers do the loading, unloading and carrying.',
      },
      {
        q: 'How many helpers do I need?',
        a: 'Most apartment moves need two helpers. Larger homes, pianos or long carries usually need three or four. You choose the crew size when you book.',
      },
      {
        q: 'Is there a minimum booking?',
        a: 'Yes, two hours per helper. After the minimum, time is billed in 30-minute increments.',
      },
    ],
  },
  {
    slug: 'moving-help',
    name: 'Moving Help',
    shortName: 'Moving Help',
    quoteHref: QUOTE_LABOR,
    priceLine: 'Hourly helpers from $79/hr. Same-day available in most NJ areas.',
    title: 'Moving Help in New Jersey | Loading, Lifting & Assembly',
    metaDescription:
      'Local moving help across New Jersey: hourly helpers for loading and unloading, heavy lifting, furniture assembly and in-home furniture moving. Upfront pricing and live GPS tracking.',
    h1: 'Moving Help in New Jersey',
    intro:
      'HaulKind connects New Jersey residents with vetted local pros for the physical part of a move: loading, unloading, heavy lifting, furniture assembly and rearranging rooms. Book online, track your helper live and pay a clear hourly rate.',
    tasks: [
      'Loading and unloading trucks, pods and vans',
      'Heavy lifting: sofas, dressers, appliances, safes',
      'Furniture assembly and disassembly',
      'In-home furniture moving and rearranging',
      'Mattress swaps and bedroom setups',
      'Help receiving large deliveries',
    ],
    faqs: [
      {
        q: 'What moving services does HaulKind offer in New Jersey?',
        a: 'Moving labor, loading and unloading, heavy lifting, furniture assembly, in-home furniture moving and mattress swaps. We do not offer hauling, junk removal or any disposal service in New Jersey.',
      },
      {
        q: 'Which parts of New Jersey do you cover?',
        a: 'Hudson, Essex, Union, Mercer, Camden and Burlington counties, including Jersey City, Newark, Elizabeth, Trenton, Princeton, Camden, Cherry Hill and Mount Laurel. Enter your address in the quote tool to confirm coverage.',
      },
      {
        q: 'Can I book same-day?',
        a: 'Often, yes. Availability depends on your area and the time of day. The quote tool shows the earliest open slot for your address.',
      },
    ],
  },
  {
    slug: 'furniture-assembly',
    name: 'Furniture Assembly',
    shortName: 'Furniture Assembly',
    quoteHref: QUOTE_ASSEMBLY,
    priceLine: 'Flat-rate assembly quotes. Tools included.',
    title: 'Furniture Assembly in New Jersey | Beds, Desks, Wardrobes',
    metaDescription:
      'Professional furniture assembly in New Jersey. Beds, wardrobes, desks, shelving and flat-pack furniture built at your home. Upfront pricing, insured pros, book online.',
    h1: 'Furniture Assembly in New Jersey',
    intro:
      'Skip the instruction manual. HaulKind assembly pros build flat-pack and boxed furniture at your New Jersey home, level it, place it where you want it and take the packaging out to your recycling.',
    tasks: [
      'Bed frames, bunk beds and headboards',
      'Wardrobes, dressers and closet systems',
      'Desks, office chairs and bookcases',
      'Dining tables and chairs',
      'TV stands and media consoles',
      'Disassembly before a move and reassembly after',
    ],
    faqs: [
      {
        q: 'Do I need to supply tools?',
        a: 'No. Our pros bring their own drills, drivers and levels. You just need the furniture and the hardware that came with it.',
      },
      {
        q: 'Do you assemble IKEA and Wayfair furniture?',
        a: 'Yes. We assemble furniture from IKEA, Wayfair, Amazon, Target, Ashley and most other retailers.',
      },
      {
        q: 'What happens to the boxes?',
        a: 'We break down the packaging and place it with your household recycling. We do not haul packaging or old furniture away in New Jersey.',
      },
    ],
  },
  {
    slug: 'loading-unloading',
    name: 'Loading & Unloading',
    shortName: 'Loading & Unloading',
    quoteHref: QUOTE_LABOR,
    priceLine: 'From $79/hr per helper. 2-hour minimum.',
    title: 'Loading & Unloading Help in New Jersey | Truck & POD Labor',
    metaDescription:
      'Hire loading and unloading help in New Jersey for rental trucks, PODS and storage units. Experienced hourly helpers, upfront pricing, live GPS tracking. Book online.',
    h1: 'Loading & Unloading Help in New Jersey',
    intro:
      'Renting a truck or container is the easy part. Loading it safely so nothing shifts on the Turnpike takes practice. HaulKind helpers pack your truck tight, protect your furniture and unload it room by room at the other end.',
    tasks: [
      'Loading U-Haul, Penske and Budget rental trucks',
      'Packing PODS and portable storage containers',
      'Unloading into apartments, condos and houses',
      'Placing furniture in the right rooms',
      'Loading and unloading storage units',
      'Helping with donation drop-off loads',
    ],
    faqs: [
      {
        q: 'Can you load in one NJ city and unload in another?',
        a: 'Yes, as two bookings: a loading crew at the origin and an unloading crew at the destination. Book both in the quote tool.',
      },
      {
        q: 'Do you bring moving blankets and straps?',
        a: 'Helpers bring basic straps and dollies. Blankets and boxes are usually supplied with your truck rental; let us know in the booking notes if you need extra.',
      },
      {
        q: 'What about stairs and walk-ups?',
        a: 'Stairs are fine. Tell us the floor and whether there is an elevator so we can staff the job correctly.',
      },
    ],
  },
  {
    slug: 'heavy-lifting',
    name: 'Heavy Lifting',
    shortName: 'Heavy Lifting',
    quoteHref: QUOTE_LABOR,
    priceLine: 'From $79/hr per helper. 2-hour minimum.',
    title: 'Heavy Lifting Help in New Jersey | Furniture, Appliances, Safes',
    metaDescription:
      'Need heavy lifting help in New Jersey? Insured helpers move sofas, appliances, safes and gym equipment within your home or into your vehicle. Upfront hourly pricing, book online.',
    h1: 'Heavy Lifting Help in New Jersey',
    intro:
      'Some items are simply too heavy or awkward for one person. HaulKind heavy-lifting helpers come to your New Jersey home with the right equipment to move oversized pieces safely, without damaging floors, walls or your back.',
    tasks: [
      'Sofas, sectionals and sleeper couches',
      'Refrigerators, washers, dryers and ranges',
      'Safes, pianos and gym equipment',
      'Moving items between floors',
      'Loading large purchases into your vehicle',
      'Positioning furniture after delivery',
    ],
    faqs: [
      {
        q: 'Is there a weight limit?',
        a: 'For most household items, no. For very heavy pieces like upright pianos or large safes, tell us the approximate weight so we can send enough helpers and equipment.',
      },
      {
        q: 'Will you take the old appliance away?',
        a: 'Not in New Jersey. We can move it to your garage, curb or into your own vehicle, but hauling and disposal are not offered in NJ.',
      },
      {
        q: 'Are your helpers insured?',
        a: 'Yes. HaulKind pros are vetted and insured, and every job is tracked live in the app.',
      },
    ],
  },
]

export interface NJLaborCity {
  city: GeoCity
  slug: string
  localNote: string
}

// One sentence of local context per city; nothing about offices or depots.
const CITY_NOTES: Record<(typeof NJ_LABOR_CITY_SLUGS)[number], string> = {
  'jersey-city':
    'High-rise buildings along the waterfront and walk-ups in the Heights and Journal Square mean elevator reservations and stair carries are part of most Jersey City moves.',
  newark:
    'From Ironbound row houses to Downtown apartments, Newark moves often involve tight parking and multi-floor carries.',
  elizabeth:
    'Elizabeth moves range from Elmora two-families to Bayway apartments, with plenty of stairs and shared driveways.',
  trenton:
    'Row homes in Chambersburg and Mill Hill and apartments near Downtown are typical Trenton jobs, often with street parking only.',
  princeton:
    'Princeton bookings are frequently student and faculty moves around the university calendar, plus furniture assembly for new households.',
  camden:
    'Camden jobs are often loading and unloading for moves across the river to and from Philadelphia.',
  'cherry-hill':
    'Cherry Hill is mostly single-family homes with garages, so basement-to-truck and room-to-room furniture moves are common.',
  'mount-laurel':
    'Mount Laurel and nearby Burlington County towns see a lot of new-home setups: unloading trucks and assembling bedroom and office furniture.',
}

export function getNJLaborCities(): NJLaborCity[] {
  const out: NJLaborCity[] = []
  for (const slug of NJ_LABOR_CITY_SLUGS) {
    const city = getCityBySlug(`${slug}-nj`)
    if (!city) continue
    out.push({ city, slug, localNote: CITY_NOTES[slug] })
  }
  return out
}

export function getNJLaborService(slug: string): NJLaborService | undefined {
  return NJ_LABOR_SERVICES.find((s) => s.slug === slug)
}

export interface NJLaborPageData {
  service: NJLaborService
  city?: NJLaborCity
  url: string
}

// /moving-labor-new-jersey            -> state page
// /moving-help-jersey-city-nj         -> city page (moving-help only)
export function parseNJLaborSlug(slug: string): NJLaborPageData | null {
  const stateMatch = slug.match(new RegExp(`^(${NJ_LABOR_SERVICE_SLUGS.join('|')})-new-jersey$`))
  if (stateMatch) {
    const service = getNJLaborService(stateMatch[1])
    if (!service) return null
    return { service, url: `/${slug}` }
  }

  const cityMatch = slug.match(new RegExp(`^${NJ_CITY_PAGE_SERVICE}-(${NJ_LABOR_CITY_SLUGS.join('|')})-nj$`))
  if (cityMatch) {
    const service = getNJLaborService(NJ_CITY_PAGE_SERVICE)
    const city = getNJLaborCities().find((c) => c.slug === cityMatch[1])
    if (!service || !city) return null
    return { service, city, url: `/${slug}` }
  }

  return null
}

export function getAllNJLaborUrls(): string[] {
  const urls = NJ_LABOR_SERVICES.map((s) => `/${s.slug}-new-jersey`)
  for (const c of getNJLaborCities()) urls.push(`/${NJ_CITY_PAGE_SERVICE}-${c.slug}-nj`)
  return urls
}

export function njCityTitle(city: NJLaborCity): string {
  return `Moving Help in ${city.city.name}, NJ | Loading, Lifting & Assembly`
}

export function njCityMeta(city: NJLaborCity): string {
  return `Hourly moving help in ${city.city.name}, NJ (${city.city.county}): loading and unloading, heavy lifting, furniture assembly and in-home furniture moving. Upfront pricing, live GPS tracking. Book online.`
}

export function njCityH1(city: NJLaborCity): string {
  return `Moving Help in ${city.city.name}, NJ`
}
