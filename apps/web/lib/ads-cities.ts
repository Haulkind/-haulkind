// Google Ads landing page city data
// These pages are NOT added to nav/footer — they exist only for paid traffic

export interface AdsCityData {
  slug: string // URL path segment: /ads/[slug]
  city: string
  state: string
  h1: string
  title: string
  metaDescription: string
  subtitle: string
  neighborhoods?: string[]
}

export const ADS_CITIES: AdsCityData[] = [
  // Pennsylvania
  {
    slug: 'junk-removal-philadelphia',
    city: 'Philadelphia',
    state: 'PA',
    h1: 'Fast & Affordable Junk Removal in Philadelphia',
    title: 'Junk Removal Philadelphia PA — Same-Day Pickup | HaulKind',
    metaDescription: 'Book junk removal in Philadelphia starting at $99. Same-day pickup, live GPS tracking, no hidden fees. Serving all Philly neighborhoods.',
    subtitle: 'Transparent pricing starting at $99. Same-day pickup across all Philadelphia neighborhoods. Book online in 60 seconds.',
    neighborhoods: ['Center City', 'South Philly', 'Fishtown', 'Kensington', 'Manayunk', 'University City', 'Northern Liberties', 'Roxborough', 'Germantown', 'Port Richmond'],
  },
  {
    slug: 'junk-removal-bucks-county',
    city: 'Bucks County',
    state: 'PA',
    h1: 'Junk Removal in Bucks County — Fast Pickup, Fair Prices',
    title: 'Junk Removal Bucks County PA — Same-Day Service | HaulKind',
    metaDescription: 'Professional junk removal in Bucks County PA. Furniture, appliances, yard waste — we haul it all. Starting at $99.',
    subtitle: 'Serving Doylestown, Newtown, Langhorne, Levittown and all of Bucks County. Starting at $99.',
    neighborhoods: ['Doylestown', 'Newtown', 'Langhorne', 'Levittown', 'Warminster', 'Bensalem', 'Bristol', 'Yardley', 'Morrisville', 'Quakertown'],
  },
  {
    slug: 'junk-removal-montgomery-county',
    city: 'Montgomery County',
    state: 'PA',
    h1: 'Montgomery County Junk Removal — Book in 60 Seconds',
    title: 'Junk Removal Montgomery County PA | HaulKind',
    metaDescription: 'Junk removal in Montgomery County PA starting at $99. Same-day available. King of Prussia, Norristown, Conshohocken and more.',
    subtitle: 'King of Prussia, Norristown, Conshohocken, Lansdale and beyond. Transparent pricing, no surprises.',
    neighborhoods: ['King of Prussia', 'Norristown', 'Conshohocken', 'Lansdale', 'Ardmore', 'Abington', 'Cheltenham', 'Plymouth Meeting', 'Blue Bell', 'Ambler'],
  },
  {
    slug: 'junk-removal-delaware-county',
    city: 'Delaware County',
    state: 'PA',
    h1: 'Junk Removal in Delaware County — Same-Day Available',
    title: 'Junk Removal Delaware County PA — Pickup Today | HaulKind',
    metaDescription: 'Book junk removal in Delaware County PA. Media, Springfield, Upper Darby and all Delco towns. Starting at $99.',
    subtitle: 'Media, Springfield, Upper Darby, Havertown — all of Delco covered. Starting at $99.',
    neighborhoods: ['Media', 'Springfield', 'Upper Darby', 'Havertown', 'Drexel Hill', 'Swarthmore', 'Broomall', 'Ridley Park', 'Chester', 'Newtown Square'],
  },
  // New Jersey — NJ compliance: No "Junk Removal" or "Solid Waste Disposal" (A-901 required)
  // NJ services: Furniture Donation Pickup, Moving Labor, Furniture Assembly
  {
    slug: 'junk-removal-south-jersey',
    city: 'South Jersey',
    state: 'NJ',
    h1: 'Furniture Donation Pickup & Moving Help in South Jersey',
    title: 'Furniture Donation Pickup South Jersey NJ — Same-Day Service | HaulKind',
    metaDescription: 'Furniture donation pickup, moving labor, and furniture assembly across South Jersey. Camden, Cherry Hill, Voorhees and more. Starting at $99.',
    subtitle: 'Camden, Cherry Hill, Voorhees, Marlton, Mount Laurel and beyond. Donation pickup, moving labor & assembly starting at $99.',
    neighborhoods: ['Camden', 'Cherry Hill', 'Voorhees', 'Marlton', 'Mount Laurel', 'Haddonfield', 'Collingswood', 'Moorestown', 'Medford', 'Turnersville'],
  },
  {
    slug: 'junk-removal-trenton',
    city: 'Trenton',
    state: 'NJ',
    h1: 'Furniture Donation Pickup & Moving Help in Trenton',
    title: 'Furniture Donation Pickup Trenton NJ — Same-Day Service | HaulKind',
    metaDescription: 'Furniture donation pickup, moving labor, and furniture assembly in Trenton NJ. Starting at $99. Same-day and next-day available.',
    subtitle: 'Serving Trenton and surrounding Mercer County. Donation pickup, moving labor & assembly.',
    neighborhoods: ['Downtown Trenton', 'Chambersburg', 'Mill Hill', 'West Ward', 'North Trenton', 'Hamilton', 'Ewing', 'Lawrence', 'Princeton Junction'],
  },
  {
    slug: 'junk-removal-princeton',
    city: 'Princeton',
    state: 'NJ',
    h1: 'Furniture Donation Pickup & Moving Help in Princeton',
    title: 'Furniture Donation Pickup Princeton NJ | HaulKind',
    metaDescription: 'Furniture donation pickup, moving labor, and furniture assembly in Princeton NJ. Starting at $99. Live driver tracking.',
    subtitle: 'Serving Princeton, West Windsor, Plainsboro and all of central New Jersey. Donation pickup & moving help.',
    neighborhoods: ['Downtown Princeton', 'West Windsor', 'Plainsboro', 'Lawrenceville', 'Pennington', 'Hopewell', 'Skillman', 'Rocky Hill'],
  },
  // NYC Boroughs
  {
    slug: 'junk-removal-brooklyn',
    city: 'Brooklyn',
    state: 'NY',
    h1: 'Brooklyn Junk Removal — Same-Day Pickup Available',
    title: 'Junk Removal Brooklyn NY — Book Online | HaulKind',
    metaDescription: 'Fast junk removal in Brooklyn NY. Furniture, appliances, apartment cleanouts. Starting at $99. Book in 60 seconds.',
    subtitle: 'Brownsville to Williamsburg, Park Slope to Bushwick — we cover all of Brooklyn.',
    neighborhoods: ['Williamsburg', 'Park Slope', 'Bushwick', 'Bed-Stuy', 'DUMBO', 'Flatbush', 'Crown Heights', 'Bay Ridge', 'Greenpoint', 'Sunset Park'],
  },
  {
    slug: 'junk-removal-queens',
    city: 'Queens',
    state: 'NY',
    h1: 'Queens Junk Removal — Affordable, Fast, Professional',
    title: 'Junk Removal Queens NY — Same-Day Service | HaulKind',
    metaDescription: 'Junk removal in Queens NY starting at $99. Astoria, Flushing, Jamaica and all neighborhoods. Same-day pickup.',
    subtitle: 'Astoria, Flushing, Jamaica, Long Island City and every corner of Queens. Starting at $99.',
    neighborhoods: ['Astoria', 'Flushing', 'Jamaica', 'Long Island City', 'Forest Hills', 'Bayside', 'Jackson Heights', 'Elmhurst', 'Rego Park', 'Woodside'],
  },
  {
    slug: 'junk-removal-bronx',
    city: 'The Bronx',
    state: 'NY',
    h1: 'Bronx Junk Removal — Book Online, Pickup Today',
    title: 'Junk Removal Bronx NY | HaulKind',
    metaDescription: 'Professional junk removal in the Bronx. Furniture, appliances, cleanouts. Starting at $99. Track your driver live.',
    subtitle: 'Serving all Bronx neighborhoods. Same-day and next-day slots available.',
    neighborhoods: ['Riverdale', 'Fordham', 'Pelham Bay', 'Mott Haven', 'Kingsbridge', 'Tremont', 'Hunts Point', 'Throgs Neck', 'Parkchester', 'Co-op City'],
  },
  {
    slug: 'junk-removal-staten-island',
    city: 'Staten Island',
    state: 'NY',
    h1: 'Staten Island Junk Removal — Fast & Affordable',
    title: 'Junk Removal Staten Island NY | HaulKind',
    metaDescription: 'Junk removal in Staten Island starting at $99. Furniture, appliances, yard waste. Same-day available. No hidden fees.',
    subtitle: 'North Shore to South Shore — all of Staten Island covered. Transparent pricing, no surprises.',
    neighborhoods: ['St. George', 'New Dorp', 'Tottenville', 'Great Kills', 'Stapleton', 'Todt Hill', 'Eltingville', 'Annadale', 'Huguenot', 'Port Richmond'],
  },
  {
    slug: 'junk-removal-manhattan',
    city: 'Manhattan',
    state: 'NY',
    h1: 'Manhattan Junk Removal — Same-Day Pickup in NYC',
    title: 'Junk Removal Manhattan NY — Book Online | HaulKind',
    metaDescription: 'Fast junk removal in Manhattan. Apartment cleanouts, furniture, appliances. Starting at $99. Book in 60 seconds.',
    subtitle: 'Apartment cleanouts, furniture removal, and more. Serving all of Manhattan.',
    neighborhoods: ['Upper East Side', 'Upper West Side', 'Harlem', 'Midtown', 'Chelsea', 'East Village', 'SoHo', 'Tribeca', 'Washington Heights', 'Financial District'],
  },
  // NYC Suburbs
  {
    slug: 'junk-removal-long-island',
    city: 'Long Island',
    state: 'NY',
    h1: 'Long Island Junk Removal — Fast Pickup, Fair Prices',
    title: 'Junk Removal Long Island NY | HaulKind',
    metaDescription: 'Junk removal across Long Island — Nassau and Suffolk County. Furniture, appliances, yard waste. Starting at $99.',
    subtitle: 'Nassau County, Suffolk County — Hempstead to Montauk. Starting at $99.',
    neighborhoods: ['Hempstead', 'Babylon', 'Huntington', 'Islip', 'Brookhaven', 'Oyster Bay', 'North Hempstead', 'Smithtown', 'Garden City', 'Freeport'],
  },
  {
    slug: 'junk-removal-westchester',
    city: 'Westchester County',
    state: 'NY',
    h1: 'Westchester Junk Removal — Book in 60 Seconds',
    title: 'Junk Removal Westchester County NY | HaulKind',
    metaDescription: 'Junk removal in Westchester County. White Plains, Yonkers, New Rochelle and more. Starting at $99.',
    subtitle: 'White Plains, Yonkers, New Rochelle, Scarsdale and all of Westchester.',
    neighborhoods: ['White Plains', 'Yonkers', 'New Rochelle', 'Scarsdale', 'Mount Vernon', 'Tarrytown', 'Mamaroneck', 'Larchmont', 'Ossining', 'Peekskill'],
  },
  {
    slug: 'junk-removal-jersey-city',
    city: 'Jersey City',
    state: 'NJ',
    h1: 'Furniture Donation Pickup & Moving Help in Jersey City',
    title: 'Furniture Donation Pickup Jersey City NJ | HaulKind',
    metaDescription: 'Furniture donation pickup, moving labor, and furniture assembly in Jersey City NJ. Starting at $99. No hidden fees.',
    subtitle: 'Downtown, the Heights, Journal Square and all of Jersey City. Donation pickup & moving help starting at $99.',
    neighborhoods: ['Downtown', 'The Heights', 'Journal Square', 'Bergen-Lafayette', 'Greenville', 'West Side', 'McGinley Square', 'Liberty State Park area'],
  },
  {
    slug: 'junk-removal-newark',
    city: 'Newark',
    state: 'NJ',
    h1: 'Furniture Donation Pickup & Moving Help in Newark',
    title: 'Furniture Donation Pickup Newark NJ — Same-Day | HaulKind',
    metaDescription: 'Furniture donation pickup, moving labor, and furniture assembly in Newark NJ starting at $99. Same-day available. Book online.',
    subtitle: 'Serving all of Newark and surrounding Essex County. Donation pickup, moving labor & assembly.',
    neighborhoods: ['Ironbound', 'North Ward', 'South Ward', 'West Ward', 'Central Ward', 'Vailsburg', 'Forest Hill', 'Roseville', 'University Heights'],
  },
  {
    slug: 'junk-removal-hoboken',
    city: 'Hoboken',
    state: 'NJ',
    h1: 'Furniture Donation Pickup & Moving Help in Hoboken',
    title: 'Furniture Donation Pickup Hoboken NJ | HaulKind',
    metaDescription: 'Furniture donation pickup, moving labor, and furniture assembly in Hoboken NJ. Starting at $99. Book in 60 seconds.',
    subtitle: 'Furniture donation pickup and moving help across Hoboken. Starting at $99.',
    neighborhoods: ['Uptown Hoboken', 'Midtown Hoboken', 'Downtown Hoboken', 'Northwest Hoboken', 'Southwest Hoboken'],
  },
]
