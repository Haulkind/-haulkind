// Local SEO data for service + city landing pages
// Each combination gets a unique page with unique content

export interface CityData {
  name: string
  state: string
  stateAbbr: string
  slug: string // e.g. "philadelphia-pa"
  population: string
  description: string // unique city flavor text
  neighborhoods: string[]
  zipCodes: string[]
  nearbyAreas: string[]
}

export interface ServiceData {
  name: string
  slug: string // e.g. "junk-removal"
  shortName: string
  description: string
  category: 'removal' | 'cleanout' | 'moving' | 'pickup'
  items: string[] // what we remove/help with
  benefits: string[]
  priceRange: string
  priceNote: string
}

export const CITIES: CityData[] = [
  {
    name: 'Philadelphia',
    state: 'Pennsylvania',
    stateAbbr: 'PA',
    slug: 'philadelphia-pa',
    population: '1.6 million',
    description: 'As the largest city in Pennsylvania and a hub of history and culture, Philadelphia generates a massive amount of household and commercial waste. From rowhomes in South Philly to apartments in Center City, residents and businesses need reliable junk removal and hauling services they can trust.',
    neighborhoods: ['Center City', 'South Philadelphia', 'Fishtown', 'Kensington', 'Manayunk', 'Germantown', 'University City', 'Northern Liberties', 'Roxborough', 'Port Richmond'],
    zipCodes: ['19101', '19102', '19103', '19104', '19106', '19107', '19111', '19114', '19116', '19120', '19121', '19122', '19123', '19124', '19125', '19130', '19131', '19132', '19133', '19134', '19135', '19136', '19137', '19138', '19139', '19140', '19141', '19142', '19143', '19144', '19145', '19146', '19147', '19148', '19149', '19150', '19151', '19152', '19153', '19154'],
    nearbyAreas: ['Camden', 'Cherry Hill', 'King of Prussia', 'Bala Cynwyd', 'Conshohocken'],
  },
  {
    name: 'Camden',
    state: 'New Jersey',
    stateAbbr: 'NJ',
    slug: 'camden-nj',
    population: '73,000',
    description: 'Located just across the Delaware River from Philadelphia, Camden is undergoing a major revitalization. Whether you need furniture donation pickup, moving labor, or furniture assembly, HaulKind provides fast and affordable services throughout Camden and surrounding areas.',
    neighborhoods: ['Fairview', 'Parkside', 'Centerville', 'Whitman Park', 'Cooper Grant', 'Lanning Square', 'Bergen Square', 'Cramer Hill', 'East Camden', 'Pyne Poynt'],
    zipCodes: ['08101', '08102', '08103', '08104', '08105'],
    nearbyAreas: ['Philadelphia', 'Cherry Hill', 'Gloucester City', 'Pennsauken', 'Collingswood'],
  },
  {
    name: 'Cherry Hill',
    state: 'New Jersey',
    stateAbbr: 'NJ',
    slug: 'cherry-hill-nj',
    population: '74,000',
    description: 'Cherry Hill is one of the most desirable suburban communities in South Jersey, known for its excellent schools and family-friendly neighborhoods. Homeowners here regularly need help with furniture donation pickup, moving labor, and furniture assembly that respects their property and schedule.',
    neighborhoods: ['Barclay', 'Kingston', 'Erlton', 'Springdale', 'Cherry Hill Mall area', 'Woodcrest', 'Chapel Avenue corridor', 'Greentree', 'Haddonfield border', 'Voorhees border'],
    zipCodes: ['08002', '08003', '08034'],
    nearbyAreas: ['Camden', 'Haddonfield', 'Voorhees', 'Marlton', 'Moorestown'],
  },
  {
    name: 'Trenton',
    state: 'New Jersey',
    stateAbbr: 'NJ',
    slug: 'trenton-nj',
    population: '90,000',
    description: 'As the capital of New Jersey, Trenton is a city with deep roots and a growing demand for professional hauling and courier services. From government buildings to residential neighborhoods, Trenton residents and property managers need dependable furniture donation pickup, moving labor, and furniture assembly at fair prices.',
    neighborhoods: ['Chambersburg', 'Mill Hill', 'Downtown', 'North Trenton', 'South Trenton', 'West Ward', 'East Ward', 'Wilbur Section', 'Hiltonia', 'Ewing border'],
    zipCodes: ['08608', '08609', '08610', '08611', '08618', '08619', '08620', '08628', '08629', '08638'],
    nearbyAreas: ['Princeton', 'Hamilton', 'Ewing', 'Lawrence', 'Bordentown'],
  },
  {
    name: 'Princeton',
    state: 'New Jersey',
    stateAbbr: 'NJ',
    slug: 'princeton-nj',
    population: '31,000',
    description: 'Home to one of the world\'s most prestigious universities, Princeton combines academic prestige with charming small-town living. Residents, students moving out, and local businesses frequently need professional furniture donation pickup, moving labor, and furniture assembly that is punctual, clean, and reasonably priced.',
    neighborhoods: ['Downtown Princeton', 'Princeton Junction', 'Riverside', 'Littlebrook', 'Western Section', 'Witherspoon-Jackson', 'Canal Walk', 'Franklin Park border', 'Plainsboro border', 'Lawrence border'],
    zipCodes: ['08540', '08541', '08542', '08543', '08544'],
    nearbyAreas: ['Trenton', 'Plainsboro', 'West Windsor', 'Lawrenceville', 'Cranbury'],
  },
  {
    name: 'Mount Laurel',
    state: 'New Jersey',
    stateAbbr: 'NJ',
    slug: 'mount-laurel-nj',
    population: '43,000',
    description: 'Mount Laurel is a thriving Burlington County township known for its mix of residential communities and commercial centers along Route 73. Families and businesses here rely on efficient furniture donation pickup, moving labor, and furniture assembly for everything from moving help to office relocations.',
    neighborhoods: ['Larchmont', 'Rancocas Woods', 'Hartford', 'Masonville', 'Fellowship', 'Elbo Lane', 'Ramblewood', 'Birchfield', 'Mount Laurel Center', 'Centerton'],
    zipCodes: ['08054'],
    nearbyAreas: ['Cherry Hill', 'Moorestown', 'Marlton', 'Maple Shade', 'Medford'],
  },
]

export const SERVICES: ServiceData[] = [
  {
    name: 'Junk Removal',
    slug: 'junk-removal',
    shortName: 'junk removal',
    description: 'Full-service junk removal where our team loads, hauls, and disposes of your unwanted items. We handle everything from single items to full truckloads.',
    category: 'removal',
    items: ['Old furniture', 'Broken appliances', 'Electronics and e-waste', 'Yard debris', 'Construction scraps', 'Boxes and packing materials', 'Mattresses and bed frames', 'Exercise equipment', 'Hot tubs and spas', 'General household clutter'],
    benefits: ['Same-day pickup available', 'We do all the heavy lifting', 'Eco-friendly disposal and recycling', 'Transparent upfront pricing', 'No hidden fees'],
    priceRange: '$99 - $529',
    priceNote: 'Based on truck volume. 1/8 truck starts at $99. Disposal included.',
  },
  {
    name: 'Furniture Removal',
    slug: 'furniture-removal',
    shortName: 'furniture removal',
    description: 'Professional furniture removal and disposal. We carefully remove couches, tables, dressers, desks, and any other furniture from your home or office, including hard-to-reach spaces like basements and upper floors.',
    category: 'removal',
    items: ['Couches and sectionals', 'Dining tables and chairs', 'Bedroom sets and dressers', 'Office desks and cubicles', 'Bookshelves and cabinets', 'Entertainment centers', 'Patio furniture', 'Recliners and armchairs', 'Bed frames and headboards', 'Futons and sleeper sofas'],
    benefits: ['Careful removal from any room or floor', 'We navigate tight hallways and stairs', 'Donation of usable items when possible', 'Same-day removal available', 'No damage to your walls or floors'],
        priceRange: '$99 - $389',
        priceNote: 'Price depends on the number and size of items.',
  },
  {
    name: 'Couch Removal',
    slug: 'couch-removal',
    shortName: 'couch removal',
    description: 'Getting rid of an old couch or sofa is one of the hardest disposal tasks for homeowners. Our team specializes in removing couches of all sizes, including sectionals, sleeper sofas, and loveseats, from any room in your home.',
    category: 'removal',
    items: ['Standard sofas', 'Sectional couches', 'Sleeper sofas and pullout couches', 'Loveseats', 'Recliners', 'Futons', 'Chaise lounges', 'Outdoor sofas', 'Theater seating', 'Oversized armchairs'],
    benefits: ['We fit through tight doorways and hallways', 'Removal from any floor including basements', 'Responsible disposal or donation', 'Fast scheduling, often same-day', 'No need to move it yourself'],
        priceRange: '$99 - $279',
        priceNote: 'Single couch starts at $99. Disposal included. Sectionals and multiples may cost more.',
  },
  {
    name: 'Mattress Removal',
    slug: 'mattress-removal',
    shortName: 'mattress removal',
    description: 'Mattress disposal is restricted in many areas due to health regulations. HaulKind handles the pickup, hauling, and proper disposal of mattresses and box springs so you do not have to deal with the hassle.',
    category: 'removal',
    items: ['King-size mattresses', 'Queen-size mattresses', 'Full and twin mattresses', 'Box springs', 'Memory foam mattresses', 'Adjustable bed bases', 'Crib mattresses', 'Futon mattresses', 'Air mattresses (deflated)', 'Mattress toppers and pads'],
    benefits: ['Compliant disposal meeting local regulations', 'Pickup from any room in your home', 'Available same-day in most areas', 'Recycling when facilities are available', 'Bundle with other items for savings'],
    priceRange: '$99 - $189',
    priceNote: 'Single mattress removal starts at $99. Disposal included.',
  },
  {
    name: 'Appliance Removal',
    slug: 'appliance-removal',
    shortName: 'appliance removal',
    description: 'Large appliances are heavy, awkward, and often contain materials that require special handling. Our crew safely disconnects (when applicable), removes, and properly disposes of or recycles your old appliances.',
    category: 'removal',
    items: ['Refrigerators and freezers', 'Washing machines and dryers', 'Dishwashers', 'Ovens and stoves', 'Microwaves', 'Air conditioners and window units', 'Water heaters', 'Dehumidifiers', 'Trash compactors', 'Small kitchen appliances (bulk)'],
    benefits: ['Safe handling of heavy appliances', 'Freon-safe disposal for refrigerators', 'Recycling of metals and components', 'Removal from basements or upper floors', 'No scratching your floors or walls'],
        priceRange: '$99 - $389',
        priceNote: 'Single appliance starts at $99. Disposal included. Multiple appliances get volume pricing.',
  },
  {
    name: 'Garage Cleanout',
    slug: 'garage-cleanout',
    shortName: 'garage cleanout',
    description: 'Reclaim your garage space with a full cleanout service. We remove everything you no longer need, from old tools and boxes to broken furniture and seasonal clutter, leaving you with a clean, usable garage.',
    category: 'cleanout',
    items: ['Old tools and equipment', 'Broken lawn equipment', 'Boxes of stored items', 'Holiday decorations you no longer want', 'Old paint cans and chemicals (non-hazardous)', 'Bicycles and sports gear', 'Shelving and workbenches', 'Auto parts and tires', 'Excess building materials', 'General accumulated clutter'],
    benefits: ['Full cleanout in one visit', 'We sort, load, and haul everything', 'Sweep-clean finish available', 'Donation of usable items', 'Same-day or next-day scheduling'],
    priceRange: '$169 - $529',
    priceNote: 'Based on volume. Half-garage starts at $199.',
  },
  {
    name: 'Basement Cleanout',
    slug: 'basement-cleanout',
    shortName: 'basement cleanout',
    description: 'Basements are notorious for accumulating years of stored items, old furniture, and forgotten belongings. Our team handles complete basement cleanouts, carrying everything up stairs and out of your home so you can reclaim the space.',
    category: 'cleanout',
    items: ['Old furniture and mattresses', 'Boxes of stored belongings', 'Broken exercise equipment', 'Water-damaged items', 'Old electronics', 'Unused appliances', 'Shelving and storage racks', 'Seasonal decorations', 'Old carpeting and padding', 'General basement clutter'],
    benefits: ['We carry everything up the stairs', 'Full cleanout in a single visit', 'Ideal for pre-sale or renovation prep', 'Water damage cleanup support', 'Proper disposal of all items'],
    priceRange: '$279 - $529',
    priceNote: 'Based on volume and stair access. Most basements fall in the $299-$449 range.',
  },
  {
    name: 'Moving Help',
    slug: 'moving-help',
    shortName: 'moving help',
    description: 'Need extra hands for your move? Our experienced movers provide loading, unloading, and heavy lifting help by the hour. Perfect for apartment moves, storage unit loads, and rearranging furniture within your home.',
    category: 'moving',
    items: ['Loading a moving truck or pod', 'Unloading at your new location', 'Rearranging furniture within your home', 'Moving items to or from storage units', 'Heavy item relocation (pianos, safes, etc.)', 'Apartment moves within a building', 'Curbside to indoor delivery of large purchases', 'Office moves and furniture rearrangement', 'Staging furniture for home sales', 'Seasonal furniture swaps (patio, holiday)'],
    benefits: ['Hourly pricing with no minimums beyond 2 hours', 'Experienced and insured movers', 'Flexible scheduling including weekends', 'You direct the work, we do the lifting', 'Great for DIY moves where you just need muscle'],
    priceRange: '$79/hr per helper',
    priceNote: 'Most moves need 2 helpers. 2-hour minimum.',
  },
  {
    name: 'Labor Only Moving Help',
    slug: 'labor-only-moving-help',
    shortName: 'labor-only moving help',
    description: 'Hire strong, reliable labor without the full moving truck. Our workers come to your location and handle the physical work: lifting, carrying, loading, and unloading. You provide the transportation; we provide the manpower.',
    category: 'moving',
    items: ['Loading your rental truck (U-Haul, Penske, etc.)', 'Unloading a packed container or pod', 'Carrying heavy items up or down stairs', 'Moving furniture between rooms', 'Loading donations into your vehicle', 'Helping with storage unit organization', 'Shifting heavy appliances for cleaning or repair', 'Assisting with furniture assembly after delivery', 'Estate or garage sale setup and breakdown', 'Event setup and teardown (tables, chairs, etc.)'],
    benefits: ['Pay only for the labor you need', 'No truck rental fees from us', 'Flexible 2-hour minimum', 'Workers arrive on time and ready', 'Insured and background-checked helpers'],
    priceRange: '$79/hr per helper',
    priceNote: 'Book 1-4 helpers depending on job size. 2-hour minimum.',
  },
  {
    name: 'Curbside Pickup',
    slug: 'curbside-pickup',
    shortName: 'curbside pickup',
    description: 'Already moved your items to the curb? HaulKind offers fast curbside pickup for bulky furniture, appliances, and household items.',
    category: 'pickup',
    items: ['Bulky furniture left at the curb', 'Mattresses and box springs', 'Large appliances', 'Bags of yard waste or debris', 'Construction materials and lumber', 'Old grills and outdoor equipment', 'Broken electronics', 'Bagged clothing and household items', 'Rolled carpeting', 'Boxes of household junk'],
    benefits: ['Fast same-day or next-day pickup', 'No need to be home for pickup', 'Lower cost since items are already outside', 'We clean up the area after pickup', 'Great for post-move or renovation cleanup'],
    priceRange: '$89 - $399',
    priceNote: 'Curbside pickup starts lower since we skip the indoor labor.',
  },
  {
    name: 'Donation Pickup',
    slug: 'donation-pickup',
    shortName: 'donation pickup',
    description: 'Have items in good condition that deserve a second life? HaulKind picks up your donations and delivers them to local charities and donation centers. We handle the heavy lifting so your usable furniture, appliances, and household goods reach people who need them.',
    category: 'pickup',
    items: ['Gently used furniture', 'Working appliances', 'Clothing and shoes (bagged)', 'Books and media', 'Kitchenware and small electronics', 'Toys and games', 'Sporting goods', 'Office furniture and supplies', 'Home decor items', 'Bedding and linens (clean)'],
    benefits: ['Items go to local charities, not landfills', 'We handle all the heavy lifting', 'Potential tax deduction for donated items', 'Feel good about giving back to the community', 'Combine donation and furniture pickup in one trip'],
        priceRange: '$99 - $389',
        priceNote: 'Pricing similar to haul away. Disposal included. Donation routing at no extra charge.',
  },
]

// Generate unique FAQ content per service+city combination
export function generateFAQs(service: ServiceData, city: CityData): { question: string; answer: string }[] {
  const faqs = [
    {
      question: `How much does ${service.shortName} cost in ${city.name}, ${city.stateAbbr}?`,
      answer: `${service.name} in ${city.name} starts at ${service.priceRange}. ${service.priceNote} Get an instant quote on our website with your specific details for an exact price.`,
    },
    {
      question: `Can I get same-day ${service.shortName} in ${city.name}?`,
      answer: `Yes, HaulKind offers same-day ${service.shortName} in ${city.name} and surrounding ${city.stateAbbr} areas when crews are available. Book early in the day for the best availability. We also offer flexible scheduling for future dates.`,
    },
    {
      question: `What areas in ${city.name} does HaulKind serve?`,
      answer: `We serve all of ${city.name} including ${city.neighborhoods.slice(0, 5).join(', ')}, and surrounding areas like ${city.nearbyAreas.slice(0, 3).join(', ')}. Enter your address in our quote tool to confirm coverage.`,
    },
    {
      question: `Do I need to be home for ${service.shortName}?`,
      answer: service.category === 'pickup'
        ? `For curbside pickup, you typically do not need to be home as long as items are accessible. For indoor pickup in ${city.name}, someone should be present to show our team what needs to go.`
        : `For ${service.shortName} in ${city.name}, we recommend being present so you can point out exactly what needs to go. However, you can also leave detailed instructions and grant access if you cannot be there.`,
    },
    {
      question: `How do I book ${service.shortName} in ${city.name}, ${city.stateAbbr}?`,
      answer: `Booking is easy. Visit our website, enter your ${city.name} address, select your service type, and get an instant quote. You can schedule online in under 60 seconds. We accept all major credit cards and payment is collected after the job is confirmed.`,
    },
  ]

  // Add service-specific FAQ (only for non-NJ or non-waste services)
  // NJ pages are 410 Gone — these branches never run for NJ cities.
  if (service.category === 'removal' && city.stateAbbr !== 'NJ') {
    faqs.push({
      question: `What happens to my items after ${service.shortName}?`,
      answer: `After picking up your items in ${city.name}, our team sorts materials for recycling, donation, and responsible handling. We partner with local recycling facilities and donation centers in the ${city.name} area. Usable items are donated whenever possible.`,
    })
  }

  if (service.category === 'cleanout' && city.stateAbbr !== 'NJ') {
    faqs.push({
      question: `How long does a ${service.shortName} take in ${city.name}?`,
      answer: `Most ${service.shortName} jobs in ${city.name} take between 1-4 hours depending on the amount of material. A standard single-car garage or small basement can usually be cleared in about 2 hours. Larger spaces or heavily packed areas may take longer.`,
    })
  }

  if (service.category === 'moving') {
    faqs.push({
      question: `How many helpers do I need for my move in ${city.name}?`,
      answer: `For a typical apartment move in ${city.name}, 2 helpers is standard. For larger homes or moves involving heavy items like pianos or safes, we recommend 3-4 helpers. You can choose the number when booking, and we will advise if we think you need more.`,
    })
  }

  return faqs
}

// Generate unique page content per service+city
export function generatePageContent(service: ServiceData, city: CityData) {
  const slug = `${service.slug}-${city.slug}`
  const url = `/${slug}`
  const title = `${service.name} in ${city.name}, ${city.stateAbbr} | HaulKind`
  const metaDescription = `Professional ${service.shortName} in ${city.name}, ${city.stateAbbr}. ${service.priceRange}. Same-day service, transparent pricing, live driver tracking. Book online in 60 seconds.`
  const h1 = `${service.name} in ${city.name}, ${city.stateAbbr}`

  return { slug, url, title, metaDescription, h1 }
}

// NJDEP compliance: NO service pages may be generated for ANY New Jersey city.
// All NJ-targeted service pages must return HTTP 410 Gone (handled by middleware
// + defense-in-depth notFound() in route handlers).

// Get all valid slug combinations for static generation
export function getAllSlugs(): string[] {
  const slugs: string[] = []
  for (const service of SERVICES) {
    for (const city of CITIES) {
      if (city.stateAbbr === 'NJ') continue
      slugs.push(`${service.slug}-${city.slug}`)
    }
  }
  return slugs
}

// Parse a slug back to service + city
export function parseSlug(slug: string): { service: ServiceData; city: CityData } | null {
  for (const service of SERVICES) {
    for (const city of CITIES) {
      if (slug === `${service.slug}-${city.slug}`) {
        if (city.stateAbbr === 'NJ') return null
        return { service, city }
      }
    }
  }
  return null
}
