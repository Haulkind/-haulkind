// Barrel export for geo module
export type { GeoCity, GeoState, ServiceData } from './types'
export {
  STATES,
  getAllCities,
  getStateByAbbr,
  getStateBySlug,
  getCityBySlug,
  getCitiesByState,
} from './cities'
