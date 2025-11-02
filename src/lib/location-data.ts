/**
 * Comprehensive Location Data for G1 Group CRM
 * Includes major ports, airports, cities worldwide
 */

export interface LocationData {
  id: string
  name: string
  type: 'port' | 'airport' | 'city' | 'warehouse' | 'border_crossing'
  country: string
  countryCode: string
  city?: string
  coordinates: {
    lat: number
    lng: number
  }
  code?: string // IATA/ICAO for airports, UN/LOCODE for ports
  timezone?: string
  searchTerms: string[] // For easy searching
}

// Major Seaports Worldwide
export const MAJOR_PORTS: LocationData[] = [
  // Asia-Pacific
  {
    id: 'port-shanghai',
    name: 'Port of Shanghai',
    type: 'port',
    country: 'China',
    countryCode: 'CN',
    city: 'Shanghai',
    coordinates: { lat: 31.2304, lng: 121.4737 },
    code: 'CNSHA',
    timezone: 'Asia/Shanghai',
    searchTerms: ['shanghai', 'china', 'port', 'yangshan']
  },
  {
    id: 'port-singapore',
    name: 'Port of Singapore',
    type: 'port',
    country: 'Singapore',
    countryCode: 'SG',
    city: 'Singapore',
    coordinates: { lat: 1.2644, lng: 103.8220 },
    code: 'SGSIN',
    timezone: 'Asia/Singapore',
    searchTerms: ['singapore', 'port', 'psa']
  },
  {
    id: 'port-shenzhen',
    name: 'Port of Shenzhen',
    type: 'port',
    country: 'China',
    countryCode: 'CN',
    city: 'Shenzhen',
    coordinates: { lat: 22.5431, lng: 114.0579 },
    code: 'CNSZX',
    timezone: 'Asia/Shanghai',
    searchTerms: ['shenzhen', 'china', 'port']
  },
  {
    id: 'port-ningbo',
    name: 'Port of Ningbo-Zhoushan',
    type: 'port',
    country: 'China',
    countryCode: 'CN',
    city: 'Ningbo',
    coordinates: { lat: 29.8683, lng: 121.5440 },
    code: 'CNNGB',
    timezone: 'Asia/Shanghai',
    searchTerms: ['ningbo', 'zhoushan', 'china', 'port']
  },
  {
    id: 'port-hongkong',
    name: 'Port of Hong Kong',
    type: 'port',
    country: 'Hong Kong',
    countryCode: 'HK',
    city: 'Hong Kong',
    coordinates: { lat: 22.3193, lng: 114.1694 },
    code: 'HKHKG',
    timezone: 'Asia/Hong_Kong',
    searchTerms: ['hong kong', 'hongkong', 'port', 'kwai chung']
  },
  {
    id: 'port-busan',
    name: 'Port of Busan',
    type: 'port',
    country: 'South Korea',
    countryCode: 'KR',
    city: 'Busan',
    coordinates: { lat: 35.1796, lng: 129.0756 },
    code: 'KRPUS',
    timezone: 'Asia/Seoul',
    searchTerms: ['busan', 'korea', 'port', 'pusan']
  },
  {
    id: 'port-guangzhou',
    name: 'Port of Guangzhou',
    type: 'port',
    country: 'China',
    countryCode: 'CN',
    city: 'Guangzhou',
    coordinates: { lat: 23.1291, lng: 113.2644 },
    code: 'CNCAN',
    timezone: 'Asia/Shanghai',
    searchTerms: ['guangzhou', 'canton', 'china', 'port']
  },
  {
    id: 'port-qingdao',
    name: 'Port of Qingdao',
    type: 'port',
    country: 'China',
    countryCode: 'CN',
    city: 'Qingdao',
    coordinates: { lat: 36.0671, lng: 120.3826 },
    code: 'CNTAO',
    timezone: 'Asia/Shanghai',
    searchTerms: ['qingdao', 'tsingtao', 'china', 'port']
  },
  {
    id: 'port-tianjin',
    name: 'Port of Tianjin',
    type: 'port',
    country: 'China',
    countryCode: 'CN',
    city: 'Tianjin',
    coordinates: { lat: 39.1422, lng: 117.1767 },
    code: 'CNTXG',
    timezone: 'Asia/Shanghai',
    searchTerms: ['tianjin', 'china', 'port']
  },
  {
    id: 'port-dubai',
    name: 'Port of Jebel Ali',
    type: 'port',
    country: 'United Arab Emirates',
    countryCode: 'AE',
    city: 'Dubai',
    coordinates: { lat: 25.0073, lng: 55.1135 },
    code: 'AEJEA',
    timezone: 'Asia/Dubai',
    searchTerms: ['dubai', 'jebel ali', 'uae', 'port']
  },
  
  // Europe
  {
    id: 'port-rotterdam',
    name: 'Port of Rotterdam',
    type: 'port',
    country: 'Netherlands',
    countryCode: 'NL',
    city: 'Rotterdam',
    coordinates: { lat: 51.9244, lng: 4.4777 },
    code: 'NLRTM',
    timezone: 'Europe/Amsterdam',
    searchTerms: ['rotterdam', 'netherlands', 'port', 'europoort']
  },
  {
    id: 'port-antwerp',
    name: 'Port of Antwerp',
    type: 'port',
    country: 'Belgium',
    countryCode: 'BE',
    city: 'Antwerp',
    coordinates: { lat: 51.2194, lng: 4.4025 },
    code: 'BEANR',
    timezone: 'Europe/Brussels',
    searchTerms: ['antwerp', 'belgium', 'port', 'antwerpen']
  },
  {
    id: 'port-hamburg',
    name: 'Port of Hamburg',
    type: 'port',
    country: 'Germany',
    countryCode: 'DE',
    city: 'Hamburg',
    coordinates: { lat: 53.5511, lng: 9.9937 },
    code: 'DEHAM',
    timezone: 'Europe/Berlin',
    searchTerms: ['hamburg', 'germany', 'port']
  },
  {
    id: 'port-felixstowe',
    name: 'Port of Felixstowe',
    type: 'port',
    country: 'United Kingdom',
    countryCode: 'GB',
    city: 'Felixstowe',
    coordinates: { lat: 51.9544, lng: 1.3520 },
    code: 'GBFXT',
    timezone: 'Europe/London',
    searchTerms: ['felixstowe', 'uk', 'britain', 'port']
  },
  {
    id: 'port-valencia',
    name: 'Port of Valencia',
    type: 'port',
    country: 'Spain',
    countryCode: 'ES',
    city: 'Valencia',
    coordinates: { lat: 39.4699, lng: -0.3763 },
    code: 'ESVLC',
    timezone: 'Europe/Madrid',
    searchTerms: ['valencia', 'spain', 'port']
  },
  {
    id: 'port-piraeus',
    name: 'Port of Piraeus',
    type: 'port',
    country: 'Greece',
    countryCode: 'GR',
    city: 'Athens',
    coordinates: { lat: 37.9467, lng: 23.6472 },
    code: 'GRPIR',
    timezone: 'Europe/Athens',
    searchTerms: ['piraeus', 'athens', 'greece', 'port']
  },
  
  // Americas
  {
    id: 'port-losangeles',
    name: 'Port of Los Angeles',
    type: 'port',
    country: 'United States',
    countryCode: 'US',
    city: 'Los Angeles',
    coordinates: { lat: 33.7361, lng: -118.2639 },
    code: 'USLAX',
    timezone: 'America/Los_Angeles',
    searchTerms: ['los angeles', 'la', 'usa', 'port', 'san pedro']
  },
  {
    id: 'port-longbeach',
    name: 'Port of Long Beach',
    type: 'port',
    country: 'United States',
    countryCode: 'US',
    city: 'Long Beach',
    coordinates: { lat: 33.7701, lng: -118.1937 },
    code: 'USLGB',
    timezone: 'America/Los_Angeles',
    searchTerms: ['long beach', 'usa', 'port', 'california']
  },
  {
    id: 'port-newyork',
    name: 'Port of New York/New Jersey',
    type: 'port',
    country: 'United States',
    countryCode: 'US',
    city: 'New York',
    coordinates: { lat: 40.6700, lng: -74.0400 },
    code: 'USNYC',
    timezone: 'America/New_York',
    searchTerms: ['new york', 'new jersey', 'usa', 'port', 'ny', 'nj']
  },
  {
    id: 'port-savannah',
    name: 'Port of Savannah',
    type: 'port',
    country: 'United States',
    countryCode: 'US',
    city: 'Savannah',
    coordinates: { lat: 32.0809, lng: -81.0912 },
    code: 'USSAV',
    timezone: 'America/New_York',
    searchTerms: ['savannah', 'georgia', 'usa', 'port']
  },
  {
    id: 'port-panama',
    name: 'Port of Balboa (Panama Canal)',
    type: 'port',
    country: 'Panama',
    countryCode: 'PA',
    city: 'Panama City',
    coordinates: { lat: 8.9536, lng: -79.5670 },
    code: 'PABLB',
    timezone: 'America/Panama',
    searchTerms: ['panama', 'balboa', 'canal', 'port']
  },
  {
    id: 'port-santos',
    name: 'Port of Santos',
    type: 'port',
    country: 'Brazil',
    countryCode: 'BR',
    city: 'Santos',
    coordinates: { lat: -23.9618, lng: -46.3322 },
    code: 'BRSSZ',
    timezone: 'America/Sao_Paulo',
    searchTerms: ['santos', 'brazil', 'port', 'sao paulo']
  },
  
  // Middle East & Africa
  {
    id: 'port-tangier',
    name: 'Tanger-Med Port',
    type: 'port',
    country: 'Morocco',
    countryCode: 'MA',
    city: 'Tangier',
    coordinates: { lat: 35.8758, lng: -5.5564 },
    code: 'MATNG',
    timezone: 'Africa/Casablanca',
    searchTerms: ['tangier', 'tanger', 'morocco', 'port']
  },
  {
    id: 'port-suez',
    name: 'Port of Suez',
    type: 'port',
    country: 'Egypt',
    countryCode: 'EG',
    city: 'Suez',
    coordinates: { lat: 29.9668, lng: 32.5498 },
    code: 'EGSUZ',
    timezone: 'Africa/Cairo',
    searchTerms: ['suez', 'egypt', 'port', 'canal']
  },
  {
    id: 'port-alexandria',
    name: 'Port of Alexandria',
    type: 'port',
    country: 'Egypt',
    countryCode: 'EG',
    city: 'Alexandria',
    coordinates: { lat: 31.2001, lng: 29.9187 },
    code: 'EGALY',
    timezone: 'Africa/Cairo',
    searchTerms: ['alexandria', 'egypt', 'port']
  },
  {
    id: 'port-port-said',
    name: 'Port Said Port',
    type: 'port',
    country: 'Egypt',
    countryCode: 'EG',
    city: 'Port Said',
    coordinates: { lat: 31.2653, lng: 32.3019 },
    code: 'EGPSD',
    timezone: 'Africa/Cairo',
    searchTerms: ['port said', 'egypt', 'suez canal', 'port']
  },
  
  // Turkey Ports
  {
    id: 'port-istanbul-ambarli',
    name: 'Port of Ambarlı (Istanbul)',
    type: 'port',
    country: 'Turkey',
    countryCode: 'TR',
    city: 'Istanbul',
    coordinates: { lat: 40.9736, lng: 28.6850 },
    code: 'TRAMB',
    timezone: 'Europe/Istanbul',
    searchTerms: ['istanbul', 'ambarli', 'turkey', 'port']
  },
  {
    id: 'port-izmir',
    name: 'Port of Izmir (Alsancak)',
    type: 'port',
    country: 'Turkey',
    countryCode: 'TR',
    city: 'Izmir',
    coordinates: { lat: 38.4382, lng: 27.1431 },
    code: 'TRIZM',
    timezone: 'Europe/Istanbul',
    searchTerms: ['izmir', 'alsancak', 'turkey', 'port', 'smyrna']
  },
  {
    id: 'port-mersin',
    name: 'Port of Mersin',
    type: 'port',
    country: 'Turkey',
    countryCode: 'TR',
    city: 'Mersin',
    coordinates: { lat: 36.8121, lng: 34.6415 },
    code: 'TRMER',
    timezone: 'Europe/Istanbul',
    searchTerms: ['mersin', 'turkey', 'port']
  },
  {
    id: 'port-gemlik',
    name: 'Port of Gemlik',
    type: 'port',
    country: 'Turkey',
    countryCode: 'TR',
    city: 'Bursa',
    coordinates: { lat: 40.4297, lng: 29.1570 },
    code: 'TRGEM',
    timezone: 'Europe/Istanbul',
    searchTerms: ['gemlik', 'bursa', 'turkey', 'port']
  },
  {
    id: 'port-iskenderun',
    name: 'Port of Iskenderun',
    type: 'port',
    country: 'Turkey',
    countryCode: 'TR',
    city: 'Iskenderun',
    coordinates: { lat: 36.5875, lng: 36.1675 },
    code: 'TRISK',
    timezone: 'Europe/Istanbul',
    searchTerms: ['iskenderun', 'alexandretta', 'turkey', 'port']
  },
  
  // East Africa Ports
  {
    id: 'port-mombasa',
    name: 'Port of Mombasa',
    type: 'port',
    country: 'Kenya',
    countryCode: 'KE',
    city: 'Mombasa',
    coordinates: { lat: -4.0435, lng: 39.6682 },
    code: 'KEMBA',
    timezone: 'Africa/Nairobi',
    searchTerms: ['mombasa', 'kenya', 'port', 'kilindini']
  },
  {
    id: 'port-dar-es-salaam',
    name: 'Port of Dar es Salaam',
    type: 'port',
    country: 'Tanzania',
    countryCode: 'TZ',
    city: 'Dar es Salaam',
    coordinates: { lat: -6.8160, lng: 39.2803 },
    code: 'TZDAR',
    timezone: 'Africa/Dar_es_Salaam',
    searchTerms: ['dar es salaam', 'tanzania', 'port']
  },
  {
    id: 'port-djibouti',
    name: 'Port of Djibouti',
    type: 'port',
    country: 'Djibouti',
    countryCode: 'DJ',
    city: 'Djibouti',
    coordinates: { lat: 11.5950, lng: 43.1481 },
    code: 'DJJIB',
    timezone: 'Africa/Djibouti',
    searchTerms: ['djibouti', 'port']
  },
  {
    id: 'port-berbera',
    name: 'Port of Berbera',
    type: 'port',
    country: 'Somalia',
    countryCode: 'SO',
    city: 'Berbera',
    coordinates: { lat: 10.4396, lng: 45.0143 },
    code: 'SOBER',
    timezone: 'Africa/Mogadishu',
    searchTerms: ['berbera', 'somalia', 'somaliland', 'port']
  },
  {
    id: 'port-mogadishu',
    name: 'Port of Mogadishu',
    type: 'port',
    country: 'Somalia',
    countryCode: 'SO',
    city: 'Mogadishu',
    coordinates: { lat: 2.0469, lng: 45.3182 },
    code: 'SOMGQ',
    timezone: 'Africa/Mogadishu',
    searchTerms: ['mogadishu', 'somalia', 'port']
  },
  {
    id: 'port-zanzibar',
    name: 'Port of Zanzibar',
    type: 'port',
    country: 'Tanzania',
    countryCode: 'TZ',
    city: 'Zanzibar',
    coordinates: { lat: -6.1659, lng: 39.1983 },
    code: 'TZZNZ',
    timezone: 'Africa/Dar_es_Salaam',
    searchTerms: ['zanzibar', 'tanzania', 'port']
  },
  {
    id: 'port-massawa',
    name: 'Port of Massawa',
    type: 'port',
    country: 'Eritrea',
    countryCode: 'ER',
    city: 'Massawa',
    coordinates: { lat: 15.6089, lng: 39.4523 },
    code: 'ERMSW',
    timezone: 'Africa/Asmara',
    searchTerms: ['massawa', 'mitsiwa', 'eritrea', 'port']
  },
  {
    id: 'port-lamu',
    name: 'Port of Lamu',
    type: 'port',
    country: 'Kenya',
    countryCode: 'KE',
    city: 'Lamu',
    coordinates: { lat: -2.2717, lng: 40.9020 },
    code: 'KELAM',
    timezone: 'Africa/Nairobi',
    searchTerms: ['lamu', 'kenya', 'port', 'lapsset']
  },
  {
    id: 'port-tanga',
    name: 'Port of Tanga',
    type: 'port',
    country: 'Tanzania',
    countryCode: 'TZ',
    city: 'Tanga',
    coordinates: { lat: -5.0689, lng: 39.0989 },
    code: 'TZTGT',
    timezone: 'Africa/Dar_es_Salaam',
    searchTerms: ['tanga', 'tanzania', 'port']
  },
  
  // West Africa Ports
  {
    id: 'port-lagos',
    name: 'Port of Lagos (Apapa)',
    type: 'port',
    country: 'Nigeria',
    countryCode: 'NG',
    city: 'Lagos',
    coordinates: { lat: 6.4474, lng: 3.3592 },
    code: 'NGLOS',
    timezone: 'Africa/Lagos',
    searchTerms: ['lagos', 'apapa', 'nigeria', 'port']
  },
  {
    id: 'port-tin-can',
    name: 'Tin Can Island Port',
    type: 'port',
    country: 'Nigeria',
    countryCode: 'NG',
    city: 'Lagos',
    coordinates: { lat: 6.4325, lng: 3.3456 },
    code: 'NGTCN',
    timezone: 'Africa/Lagos',
    searchTerms: ['tin can', 'lagos', 'nigeria', 'port']
  },
  {
    id: 'port-abidjan',
    name: 'Port of Abidjan',
    type: 'port',
    country: 'Ivory Coast',
    countryCode: 'CI',
    city: 'Abidjan',
    coordinates: { lat: 5.2489, lng: -3.9284 },
    code: 'CIABJ',
    timezone: 'Africa/Abidjan',
    searchTerms: ['abidjan', 'ivory coast', 'cote d\'ivoire', 'port']
  },
  {
    id: 'port-tema',
    name: 'Port of Tema',
    type: 'port',
    country: 'Ghana',
    countryCode: 'GH',
    city: 'Tema',
    coordinates: { lat: 5.6698, lng: 0.0115 },
    code: 'GHTEM',
    timezone: 'Africa/Accra',
    searchTerms: ['tema', 'ghana', 'port']
  },
  {
    id: 'port-takoradi',
    name: 'Port of Takoradi',
    type: 'port',
    country: 'Ghana',
    countryCode: 'GH',
    city: 'Takoradi',
    coordinates: { lat: 4.8845, lng: -1.7554 },
    code: 'GHTKD',
    timezone: 'Africa/Accra',
    searchTerms: ['takoradi', 'sekondi', 'ghana', 'port']
  },
  {
    id: 'port-dakar',
    name: 'Port of Dakar',
    type: 'port',
    country: 'Senegal',
    countryCode: 'SN',
    city: 'Dakar',
    coordinates: { lat: 14.6928, lng: -17.4467 },
    code: 'SNDKR',
    timezone: 'Africa/Dakar',
    searchTerms: ['dakar', 'senegal', 'port']
  },
  {
    id: 'port-cotonou',
    name: 'Port of Cotonou',
    type: 'port',
    country: 'Benin',
    countryCode: 'BJ',
    city: 'Cotonou',
    coordinates: { lat: 6.3654, lng: 2.4380 },
    code: 'BJCOO',
    timezone: 'Africa/Porto-Novo',
    searchTerms: ['cotonou', 'benin', 'port']
  },
  {
    id: 'port-lome',
    name: 'Port of Lomé',
    type: 'port',
    country: 'Togo',
    countryCode: 'TG',
    city: 'Lomé',
    coordinates: { lat: 6.1319, lng: 1.2253 },
    code: 'TGLFW',
    timezone: 'Africa/Lome',
    searchTerms: ['lome', 'togo', 'port']
  },
  {
    id: 'port-conakry',
    name: 'Port of Conakry',
    type: 'port',
    country: 'Guinea',
    countryCode: 'GN',
    city: 'Conakry',
    coordinates: { lat: 9.5092, lng: -13.7122 },
    code: 'GNCKR',
    timezone: 'Africa/Conakry',
    searchTerms: ['conakry', 'guinea', 'port']
  },
  {
    id: 'port-freetown',
    name: 'Port of Freetown',
    type: 'port',
    country: 'Sierra Leone',
    countryCode: 'SL',
    city: 'Freetown',
    coordinates: { lat: 8.4840, lng: -13.2299 },
    code: 'SLFNA',
    timezone: 'Africa/Freetown',
    searchTerms: ['freetown', 'sierra leone', 'port']
  },
  {
    id: 'port-monrovia',
    name: 'Port of Monrovia',
    type: 'port',
    country: 'Liberia',
    countryCode: 'LR',
    city: 'Monrovia',
    coordinates: { lat: 6.3156, lng: -10.8074 },
    code: 'LRMLW',
    timezone: 'Africa/Monrovia',
    searchTerms: ['monrovia', 'liberia', 'port']
  },
  {
    id: 'port-douala',
    name: 'Port of Douala',
    type: 'port',
    country: 'Cameroon',
    countryCode: 'CM',
    city: 'Douala',
    coordinates: { lat: 4.0511, lng: 9.7679 },
    code: 'CMDLA',
    timezone: 'Africa/Douala',
    searchTerms: ['douala', 'cameroon', 'port']
  },
  {
    id: 'port-luanda',
    name: 'Port of Luanda',
    type: 'port',
    country: 'Angola',
    countryCode: 'AO',
    city: 'Luanda',
    coordinates: { lat: -8.8084, lng: 13.2344 },
    code: 'AOLAD',
    timezone: 'Africa/Luanda',
    searchTerms: ['luanda', 'angola', 'port']
  },
  
  // South Africa Ports
  {
    id: 'port-durban',
    name: 'Port of Durban',
    type: 'port',
    country: 'South Africa',
    countryCode: 'ZA',
    city: 'Durban',
    coordinates: { lat: -29.8587, lng: 31.0218 },
    code: 'ZADUR',
    timezone: 'Africa/Johannesburg',
    searchTerms: ['durban', 'south africa', 'port']
  },
  {
    id: 'port-cape-town',
    name: 'Port of Cape Town',
    type: 'port',
    country: 'South Africa',
    countryCode: 'ZA',
    city: 'Cape Town',
    coordinates: { lat: -33.9081, lng: 18.4277 },
    code: 'ZACPT',
    timezone: 'Africa/Johannesburg',
    searchTerms: ['cape town', 'south africa', 'port']
  },
  {
    id: 'port-port-elizabeth',
    name: 'Port of Gqeberha (Port Elizabeth)',
    type: 'port',
    country: 'South Africa',
    countryCode: 'ZA',
    city: 'Gqeberha',
    coordinates: { lat: -33.9608, lng: 25.6022 },
    code: 'ZAPLZ',
    timezone: 'Africa/Johannesburg',
    searchTerms: ['port elizabeth', 'gqeberha', 'south africa', 'port']
  }
]

// Major International Airports
export const MAJOR_AIRPORTS: LocationData[] = [
  // Asia-Pacific
  {
    id: 'airport-beijing',
    name: 'Beijing Capital International Airport',
    type: 'airport',
    country: 'China',
    countryCode: 'CN',
    city: 'Beijing',
    coordinates: { lat: 40.0799, lng: 116.6031 },
    code: 'PEK',
    timezone: 'Asia/Shanghai',
    searchTerms: ['beijing', 'china', 'airport', 'pek']
  },
  {
    id: 'airport-shanghai-pudong',
    name: 'Shanghai Pudong International Airport',
    type: 'airport',
    country: 'China',
    countryCode: 'CN',
    city: 'Shanghai',
    coordinates: { lat: 31.1443, lng: 121.8083 },
    code: 'PVG',
    timezone: 'Asia/Shanghai',
    searchTerms: ['shanghai', 'pudong', 'china', 'airport', 'pvg']
  },
  {
    id: 'airport-hongkong',
    name: 'Hong Kong International Airport',
    type: 'airport',
    country: 'Hong Kong',
    countryCode: 'HK',
    city: 'Hong Kong',
    coordinates: { lat: 22.3080, lng: 113.9185 },
    code: 'HKG',
    timezone: 'Asia/Hong_Kong',
    searchTerms: ['hong kong', 'airport', 'hkg', 'chek lap kok']
  },
  {
    id: 'airport-singapore',
    name: 'Singapore Changi Airport',
    type: 'airport',
    country: 'Singapore',
    countryCode: 'SG',
    city: 'Singapore',
    coordinates: { lat: 1.3644, lng: 103.9915 },
    code: 'SIN',
    timezone: 'Asia/Singapore',
    searchTerms: ['singapore', 'changi', 'airport', 'sin']
  },
  {
    id: 'airport-tokyo-narita',
    name: 'Tokyo Narita International Airport',
    type: 'airport',
    country: 'Japan',
    countryCode: 'JP',
    city: 'Tokyo',
    coordinates: { lat: 35.7647, lng: 140.3864 },
    code: 'NRT',
    timezone: 'Asia/Tokyo',
    searchTerms: ['tokyo', 'narita', 'japan', 'airport', 'nrt']
  },
  {
    id: 'airport-seoul-incheon',
    name: 'Incheon International Airport',
    type: 'airport',
    country: 'South Korea',
    countryCode: 'KR',
    city: 'Seoul',
    coordinates: { lat: 37.4602, lng: 126.4407 },
    code: 'ICN',
    timezone: 'Asia/Seoul',
    searchTerms: ['seoul', 'incheon', 'korea', 'airport', 'icn']
  },
  {
    id: 'airport-dubai',
    name: 'Dubai International Airport',
    type: 'airport',
    country: 'United Arab Emirates',
    countryCode: 'AE',
    city: 'Dubai',
    coordinates: { lat: 25.2532, lng: 55.3657 },
    code: 'DXB',
    timezone: 'Asia/Dubai',
    searchTerms: ['dubai', 'uae', 'airport', 'dxb']
  },
  {
    id: 'airport-delhi',
    name: 'Indira Gandhi International Airport',
    type: 'airport',
    country: 'India',
    countryCode: 'IN',
    city: 'New Delhi',
    coordinates: { lat: 28.5562, lng: 77.1000 },
    code: 'DEL',
    timezone: 'Asia/Kolkata',
    searchTerms: ['delhi', 'india', 'airport', 'del']
  },
  
  // Europe
  {
    id: 'airport-london-heathrow',
    name: 'London Heathrow Airport',
    type: 'airport',
    country: 'United Kingdom',
    countryCode: 'GB',
    city: 'London',
    coordinates: { lat: 51.4700, lng: -0.4543 },
    code: 'LHR',
    timezone: 'Europe/London',
    searchTerms: ['london', 'heathrow', 'uk', 'airport', 'lhr']
  },
  {
    id: 'airport-paris-cdg',
    name: 'Paris Charles de Gaulle Airport',
    type: 'airport',
    country: 'France',
    countryCode: 'FR',
    city: 'Paris',
    coordinates: { lat: 49.0097, lng: 2.5479 },
    code: 'CDG',
    timezone: 'Europe/Paris',
    searchTerms: ['paris', 'charles de gaulle', 'france', 'airport', 'cdg']
  },
  {
    id: 'airport-frankfurt',
    name: 'Frankfurt Airport',
    type: 'airport',
    country: 'Germany',
    countryCode: 'DE',
    city: 'Frankfurt',
    coordinates: { lat: 50.0379, lng: 8.5622 },
    code: 'FRA',
    timezone: 'Europe/Berlin',
    searchTerms: ['frankfurt', 'germany', 'airport', 'fra']
  },
  {
    id: 'airport-amsterdam',
    name: 'Amsterdam Airport Schiphol',
    type: 'airport',
    country: 'Netherlands',
    countryCode: 'NL',
    city: 'Amsterdam',
    coordinates: { lat: 52.3105, lng: 4.7683 },
    code: 'AMS',
    timezone: 'Europe/Amsterdam',
    searchTerms: ['amsterdam', 'schiphol', 'netherlands', 'airport', 'ams']
  },
  {
    id: 'airport-madrid',
    name: 'Adolfo Suárez Madrid-Barajas Airport',
    type: 'airport',
    country: 'Spain',
    countryCode: 'ES',
    city: 'Madrid',
    coordinates: { lat: 40.4983, lng: -3.5676 },
    code: 'MAD',
    timezone: 'Europe/Madrid',
    searchTerms: ['madrid', 'barajas', 'spain', 'airport', 'mad']
  },
  
  // Americas
  {
    id: 'airport-atlanta',
    name: 'Hartsfield-Jackson Atlanta International Airport',
    type: 'airport',
    country: 'United States',
    countryCode: 'US',
    city: 'Atlanta',
    coordinates: { lat: 33.6407, lng: -84.4277 },
    code: 'ATL',
    timezone: 'America/New_York',
    searchTerms: ['atlanta', 'georgia', 'usa', 'airport', 'atl']
  },
  {
    id: 'airport-losangeles',
    name: 'Los Angeles International Airport',
    type: 'airport',
    country: 'United States',
    countryCode: 'US',
    city: 'Los Angeles',
    coordinates: { lat: 33.9416, lng: -118.4085 },
    code: 'LAX',
    timezone: 'America/Los_Angeles',
    searchTerms: ['los angeles', 'lax', 'usa', 'airport']
  },
  {
    id: 'airport-chicago',
    name: "O'Hare International Airport",
    type: 'airport',
    country: 'United States',
    countryCode: 'US',
    city: 'Chicago',
    coordinates: { lat: 41.9742, lng: -87.9073 },
    code: 'ORD',
    timezone: 'America/Chicago',
    searchTerms: ['chicago', 'ohare', 'usa', 'airport', 'ord']
  },
  {
    id: 'airport-newyork-jfk',
    name: 'John F. Kennedy International Airport',
    type: 'airport',
    country: 'United States',
    countryCode: 'US',
    city: 'New York',
    coordinates: { lat: 40.6413, lng: -73.7781 },
    code: 'JFK',
    timezone: 'America/New_York',
    searchTerms: ['new york', 'jfk', 'kennedy', 'usa', 'airport']
  },
  {
    id: 'airport-miami',
    name: 'Miami International Airport',
    type: 'airport',
    country: 'United States',
    countryCode: 'US',
    city: 'Miami',
    coordinates: { lat: 25.7959, lng: -80.2870 },
    code: 'MIA',
    timezone: 'America/New_York',
    searchTerms: ['miami', 'florida', 'usa', 'airport', 'mia']
  },
  {
    id: 'airport-toronto',
    name: 'Toronto Pearson International Airport',
    type: 'airport',
    country: 'Canada',
    countryCode: 'CA',
    city: 'Toronto',
    coordinates: { lat: 43.6777, lng: -79.6248 },
    code: 'YYZ',
    timezone: 'America/Toronto',
    searchTerms: ['toronto', 'pearson', 'canada', 'airport', 'yyz']
  },
  {
    id: 'airport-mexico',
    name: 'Mexico City International Airport',
    type: 'airport',
    country: 'Mexico',
    countryCode: 'MX',
    city: 'Mexico City',
    coordinates: { lat: 19.4363, lng: -99.0721 },
    code: 'MEX',
    timezone: 'America/Mexico_City',
    searchTerms: ['mexico city', 'mexico', 'airport', 'mex']
  },
  
  // Middle East & Africa
  {
    id: 'airport-doha',
    name: 'Hamad International Airport',
    type: 'airport',
    country: 'Qatar',
    countryCode: 'QA',
    city: 'Doha',
    coordinates: { lat: 25.2731, lng: 51.6086 },
    code: 'DOH',
    timezone: 'Asia/Qatar',
    searchTerms: ['doha', 'qatar', 'airport', 'doh', 'hamad']
  },
  {
    id: 'airport-cairo',
    name: 'Cairo International Airport',
    type: 'airport',
    country: 'Egypt',
    countryCode: 'EG',
    city: 'Cairo',
    coordinates: { lat: 30.1219, lng: 31.4056 },
    code: 'CAI',
    timezone: 'Africa/Cairo',
    searchTerms: ['cairo', 'egypt', 'airport', 'cai']
  },
  
  // Turkey Airports
  {
    id: 'airport-istanbul-new',
    name: 'Istanbul Airport',
    type: 'airport',
    country: 'Turkey',
    countryCode: 'TR',
    city: 'Istanbul',
    coordinates: { lat: 41.2753, lng: 28.7519 },
    code: 'IST',
    timezone: 'Europe/Istanbul',
    searchTerms: ['istanbul', 'turkey', 'airport', 'ist', 'new']
  },
  {
    id: 'airport-istanbul-sabiha',
    name: 'Sabiha Gökçen International Airport',
    type: 'airport',
    country: 'Turkey',
    countryCode: 'TR',
    city: 'Istanbul',
    coordinates: { lat: 40.8986, lng: 29.3092 },
    code: 'SAW',
    timezone: 'Europe/Istanbul',
    searchTerms: ['istanbul', 'sabiha', 'gokcen', 'turkey', 'airport', 'saw']
  },
  {
    id: 'airport-ankara',
    name: 'Ankara Esenboğa Airport',
    type: 'airport',
    country: 'Turkey',
    countryCode: 'TR',
    city: 'Ankara',
    coordinates: { lat: 40.1281, lng: 32.9951 },
    code: 'ESB',
    timezone: 'Europe/Istanbul',
    searchTerms: ['ankara', 'esenboga', 'turkey', 'airport', 'esb']
  },
  {
    id: 'airport-antalya',
    name: 'Antalya Airport',
    type: 'airport',
    country: 'Turkey',
    countryCode: 'TR',
    city: 'Antalya',
    coordinates: { lat: 36.8987, lng: 30.8005 },
    code: 'AYT',
    timezone: 'Europe/Istanbul',
    searchTerms: ['antalya', 'turkey', 'airport', 'ayt']
  },
  {
    id: 'airport-izmir-adnan',
    name: 'İzmir Adnan Menderes Airport',
    type: 'airport',
    country: 'Turkey',
    countryCode: 'TR',
    city: 'Izmir',
    coordinates: { lat: 38.2924, lng: 27.1570 },
    code: 'ADB',
    timezone: 'Europe/Istanbul',
    searchTerms: ['izmir', 'adnan menderes', 'turkey', 'airport', 'adb', 'smyrna']
  },
  
  // East Africa Airports
  {
    id: 'airport-nairobi-jkia',
    name: 'Jomo Kenyatta International Airport',
    type: 'airport',
    country: 'Kenya',
    countryCode: 'KE',
    city: 'Nairobi',
    coordinates: { lat: -1.3192, lng: 36.9278 },
    code: 'NBO',
    timezone: 'Africa/Nairobi',
    searchTerms: ['nairobi', 'kenya', 'airport', 'nbo', 'jomo kenyatta', 'jkia']
  },
  {
    id: 'airport-dar-es-salaam',
    name: 'Julius Nyerere International Airport',
    type: 'airport',
    country: 'Tanzania',
    countryCode: 'TZ',
    city: 'Dar es Salaam',
    coordinates: { lat: -6.8781, lng: 39.2026 },
    code: 'DAR',
    timezone: 'Africa/Dar_es_Salaam',
    searchTerms: ['dar es salaam', 'tanzania', 'airport', 'dar', 'julius nyerere']
  },
  {
    id: 'airport-kilimanjaro',
    name: 'Kilimanjaro International Airport',
    type: 'airport',
    country: 'Tanzania',
    countryCode: 'TZ',
    city: 'Arusha',
    coordinates: { lat: -3.4294, lng: 37.0745 },
    code: 'JRO',
    timezone: 'Africa/Dar_es_Salaam',
    searchTerms: ['kilimanjaro', 'arusha', 'tanzania', 'airport', 'jro']
  },
  {
    id: 'airport-addis-ababa',
    name: 'Addis Ababa Bole International Airport',
    type: 'airport',
    country: 'Ethiopia',
    countryCode: 'ET',
    city: 'Addis Ababa',
    coordinates: { lat: 8.9779, lng: 38.7993 },
    code: 'ADD',
    timezone: 'Africa/Addis_Ababa',
    searchTerms: ['addis ababa', 'ethiopia', 'airport', 'add', 'bole']
  },
  {
    id: 'airport-entebbe',
    name: 'Entebbe International Airport',
    type: 'airport',
    country: 'Uganda',
    countryCode: 'UG',
    city: 'Entebbe',
    coordinates: { lat: 0.0424, lng: 32.4435 },
    code: 'EBB',
    timezone: 'Africa/Kampala',
    searchTerms: ['entebbe', 'kampala', 'uganda', 'airport', 'ebb']
  },
  {
    id: 'airport-kigali',
    name: 'Kigali International Airport',
    type: 'airport',
    country: 'Rwanda',
    countryCode: 'RW',
    city: 'Kigali',
    coordinates: { lat: -1.9686, lng: 30.1395 },
    code: 'KGL',
    timezone: 'Africa/Kigali',
    searchTerms: ['kigali', 'rwanda', 'airport', 'kgl']
  },
  {
    id: 'airport-djibouti',
    name: 'Djibouti-Ambouli International Airport',
    type: 'airport',
    country: 'Djibouti',
    countryCode: 'DJ',
    city: 'Djibouti',
    coordinates: { lat: 11.5473, lng: 43.1595 },
    code: 'JIB',
    timezone: 'Africa/Djibouti',
    searchTerms: ['djibouti', 'ambouli', 'airport', 'jib']
  },
  {
    id: 'airport-zanzibar',
    name: 'Abeid Amani Karume International Airport',
    type: 'airport',
    country: 'Tanzania',
    countryCode: 'TZ',
    city: 'Zanzibar',
    coordinates: { lat: -6.2220, lng: 39.2249 },
    code: 'ZNZ',
    timezone: 'Africa/Dar_es_Salaam',
    searchTerms: ['zanzibar', 'tanzania', 'airport', 'znz', 'karume']
  },
  {
    id: 'airport-mombasa',
    name: 'Moi International Airport',
    type: 'airport',
    country: 'Kenya',
    countryCode: 'KE',
    city: 'Mombasa',
    coordinates: { lat: -4.0348, lng: 39.5942 },
    code: 'MBA',
    timezone: 'Africa/Nairobi',
    searchTerms: ['mombasa', 'kenya', 'airport', 'mba', 'moi']
  },
  {
    id: 'airport-mogadishu',
    name: 'Aden Adde International Airport',
    type: 'airport',
    country: 'Somalia',
    countryCode: 'SO',
    city: 'Mogadishu',
    coordinates: { lat: 2.0144, lng: 45.3047 },
    code: 'MGQ',
    timezone: 'Africa/Mogadishu',
    searchTerms: ['mogadishu', 'somalia', 'airport', 'mgq', 'aden adde']
  },
  {
    id: 'airport-hargeisa',
    name: 'Hargeisa Egal International Airport',
    type: 'airport',
    country: 'Somalia',
    countryCode: 'SO',
    city: 'Hargeisa',
    coordinates: { lat: 9.5182, lng: 44.0887 },
    code: 'HGA',
    timezone: 'Africa/Mogadishu',
    searchTerms: ['hargeisa', 'somaliland', 'somalia', 'airport', 'hga', 'egal']
  },
  {
    id: 'airport-asmara',
    name: 'Asmara International Airport',
    type: 'airport',
    country: 'Eritrea',
    countryCode: 'ER',
    city: 'Asmara',
    coordinates: { lat: 15.2919, lng: 38.9107 },
    code: 'ASM',
    timezone: 'Africa/Asmara',
    searchTerms: ['asmara', 'eritrea', 'airport', 'asm']
  },
  
  // West Africa Airports
  {
    id: 'airport-lagos',
    name: 'Murtala Muhammed International Airport',
    type: 'airport',
    country: 'Nigeria',
    countryCode: 'NG',
    city: 'Lagos',
    coordinates: { lat: 6.5774, lng: 3.3212 },
    code: 'LOS',
    timezone: 'Africa/Lagos',
    searchTerms: ['lagos', 'nigeria', 'airport', 'los', 'murtala muhammed']
  },
  {
    id: 'airport-abuja',
    name: 'Nnamdi Azikiwe International Airport',
    type: 'airport',
    country: 'Nigeria',
    countryCode: 'NG',
    city: 'Abuja',
    coordinates: { lat: 9.0068, lng: 7.2632 },
    code: 'ABV',
    timezone: 'Africa/Lagos',
    searchTerms: ['abuja', 'nigeria', 'airport', 'abv', 'nnamdi azikiwe']
  },
  {
    id: 'airport-accra',
    name: 'Kotoka International Airport',
    type: 'airport',
    country: 'Ghana',
    countryCode: 'GH',
    city: 'Accra',
    coordinates: { lat: 5.6052, lng: -0.1667 },
    code: 'ACC',
    timezone: 'Africa/Accra',
    searchTerms: ['accra', 'ghana', 'airport', 'acc', 'kotoka']
  },
  {
    id: 'airport-abidjan',
    name: 'Félix Houphouët-Boigny International Airport',
    type: 'airport',
    country: 'Ivory Coast',
    countryCode: 'CI',
    city: 'Abidjan',
    coordinates: { lat: 5.2539, lng: -3.9263 },
    code: 'ABJ',
    timezone: 'Africa/Abidjan',
    searchTerms: ['abidjan', 'ivory coast', 'cote d\'ivoire', 'airport', 'abj', 'felix houphouet']
  },
  {
    id: 'airport-dakar',
    name: 'Blaise Diagne International Airport',
    type: 'airport',
    country: 'Senegal',
    countryCode: 'SN',
    city: 'Dakar',
    coordinates: { lat: 14.6700, lng: -17.0733 },
    code: 'DSS',
    timezone: 'Africa/Dakar',
    searchTerms: ['dakar', 'senegal', 'airport', 'dss', 'blaise diagne']
  },
  {
    id: 'airport-douala',
    name: 'Douala International Airport',
    type: 'airport',
    country: 'Cameroon',
    countryCode: 'CM',
    city: 'Douala',
    coordinates: { lat: 4.0061, lng: 9.7195 },
    code: 'DLA',
    timezone: 'Africa/Douala',
    searchTerms: ['douala', 'cameroon', 'airport', 'dla']
  },
  {
    id: 'airport-conakry',
    name: 'Conakry International Airport',
    type: 'airport',
    country: 'Guinea',
    countryCode: 'GN',
    city: 'Conakry',
    coordinates: { lat: 9.5769, lng: -13.6120 },
    code: 'CKY',
    timezone: 'Africa/Conakry',
    searchTerms: ['conakry', 'guinea', 'airport', 'cky']
  },
  {
    id: 'airport-freetown',
    name: 'Freetown Lungi International Airport',
    type: 'airport',
    country: 'Sierra Leone',
    countryCode: 'SL',
    city: 'Freetown',
    coordinates: { lat: 8.6164, lng: -13.1955 },
    code: 'FNA',
    timezone: 'Africa/Freetown',
    searchTerms: ['freetown', 'lungi', 'sierra leone', 'airport', 'fna']
  },
  {
    id: 'airport-monrovia',
    name: 'Roberts International Airport',
    type: 'airport',
    country: 'Liberia',
    countryCode: 'LR',
    city: 'Monrovia',
    coordinates: { lat: 6.2338, lng: -10.3623 },
    code: 'ROB',
    timezone: 'Africa/Monrovia',
    searchTerms: ['monrovia', 'roberts', 'liberia', 'airport', 'rob']
  },
  {
    id: 'airport-cotonou',
    name: 'Cadjehoun Airport',
    type: 'airport',
    country: 'Benin',
    countryCode: 'BJ',
    city: 'Cotonou',
    coordinates: { lat: 6.3572, lng: 2.3843 },
    code: 'COO',
    timezone: 'Africa/Porto-Novo',
    searchTerms: ['cotonou', 'cadjehoun', 'benin', 'airport', 'coo']
  },
  {
    id: 'airport-lome',
    name: 'Gnassingbé Eyadéma International Airport',
    type: 'airport',
    country: 'Togo',
    countryCode: 'TG',
    city: 'Lomé',
    coordinates: { lat: 6.1656, lng: 1.2545 },
    code: 'LFW',
    timezone: 'Africa/Lome',
    searchTerms: ['lome', 'togo', 'airport', 'lfw', 'gnassingbe', 'eyadema']
  },
  {
    id: 'airport-luanda',
    name: 'Quatro de Fevereiro Airport',
    type: 'airport',
    country: 'Angola',
    countryCode: 'AO',
    city: 'Luanda',
    coordinates: { lat: -8.8584, lng: 13.2312 },
    code: 'LAD',
    timezone: 'Africa/Luanda',
    searchTerms: ['luanda', 'angola', 'airport', 'lad', 'quatro de fevereiro']
  },
  
  // South Africa Airports
  {
    id: 'airport-johannesburg',
    name: 'O.R. Tambo International Airport',
    type: 'airport',
    country: 'South Africa',
    countryCode: 'ZA',
    city: 'Johannesburg',
    coordinates: { lat: -26.1392, lng: 28.2460 },
    code: 'JNB',
    timezone: 'Africa/Johannesburg',
    searchTerms: ['johannesburg', 'south africa', 'airport', 'jnb', 'tambo']
  },
  {
    id: 'airport-cape-town',
    name: 'Cape Town International Airport',
    type: 'airport',
    country: 'South Africa',
    countryCode: 'ZA',
    city: 'Cape Town',
    coordinates: { lat: -33.9648, lng: 18.6017 },
    code: 'CPT',
    timezone: 'Africa/Johannesburg',
    searchTerms: ['cape town', 'south africa', 'airport', 'cpt']
  },
  {
    id: 'airport-durban',
    name: 'King Shaka International Airport',
    type: 'airport',
    country: 'South Africa',
    countryCode: 'ZA',
    city: 'Durban',
    coordinates: { lat: -29.6144, lng: 31.1197 },
    code: 'DUR',
    timezone: 'Africa/Johannesburg',
    searchTerms: ['durban', 'south africa', 'airport', 'dur', 'king shaka']
  }
]

// Major Cities (for general locations)
export const MAJOR_CITIES: LocationData[] = [
  {
    id: 'city-london',
    name: 'London',
    type: 'city',
    country: 'United Kingdom',
    countryCode: 'GB',
    city: 'London',
    coordinates: { lat: 51.5074, lng: -0.1278 },
    timezone: 'Europe/London',
    searchTerms: ['london', 'uk', 'england']
  },
  {
    id: 'city-newyork',
    name: 'New York City',
    type: 'city',
    country: 'United States',
    countryCode: 'US',
    city: 'New York',
    coordinates: { lat: 40.7128, lng: -74.0060 },
    timezone: 'America/New_York',
    searchTerms: ['new york', 'nyc', 'manhattan', 'usa']
  },
  {
    id: 'city-tokyo',
    name: 'Tokyo',
    type: 'city',
    country: 'Japan',
    countryCode: 'JP',
    city: 'Tokyo',
    coordinates: { lat: 35.6762, lng: 139.6503 },
    timezone: 'Asia/Tokyo',
    searchTerms: ['tokyo', 'japan']
  },
  {
    id: 'city-dubai',
    name: 'Dubai',
    type: 'city',
    country: 'United Arab Emirates',
    countryCode: 'AE',
    city: 'Dubai',
    coordinates: { lat: 25.2048, lng: 55.2708 },
    timezone: 'Asia/Dubai',
    searchTerms: ['dubai', 'uae']
  },
  {
    id: 'city-paris',
    name: 'Paris',
    type: 'city',
    country: 'France',
    countryCode: 'FR',
    city: 'Paris',
    coordinates: { lat: 48.8566, lng: 2.3522 },
    timezone: 'Europe/Paris',
    searchTerms: ['paris', 'france']
  }
]

// Combine all locations
export const ALL_LOCATIONS: LocationData[] = [
  ...MAJOR_PORTS,
  ...MAJOR_AIRPORTS,
  ...MAJOR_CITIES
]

// Search function
export function searchLocations(query: string, types?: LocationData['type'][]): LocationData[] {
  if (!query || query.length < 2) return []
  
  const lowerQuery = query.toLowerCase()
  
  let locations = ALL_LOCATIONS
  
  // Filter by type if specified
  if (types && types.length > 0) {
    locations = locations.filter(loc => types.includes(loc.type))
  }
  
  return locations
    .filter(location => {
      return (
        location.name.toLowerCase().includes(lowerQuery) ||
        location.city?.toLowerCase().includes(lowerQuery) ||
        location.country.toLowerCase().includes(lowerQuery) ||
        location.code?.toLowerCase().includes(lowerQuery) ||
        location.searchTerms.some(term => term.includes(lowerQuery))
      )
    })
    .slice(0, 20) // Limit to 20 results
}

// Get location by ID
export function getLocationById(id: string): LocationData | undefined {
  return ALL_LOCATIONS.find(loc => loc.id === id)
}

// Get locations by country
export function getLocationsByCountry(countryCode: string): LocationData[] {
  return ALL_LOCATIONS.filter(loc => loc.countryCode === countryCode)
}

// Get locations by type
export function getLocationsByType(type: LocationData['type']): LocationData[] {
  return ALL_LOCATIONS.filter(loc => loc.type === type)
}

// Calculate distance between two coordinates (Haversine formula)
export function calculateDistance(
  coord1: { lat: number; lng: number },
  coord2: { lat: number; lng: number }
): number {
  const R = 6371 // Earth's radius in kilometers
  const dLat = toRadians(coord2.lat - coord1.lat)
  const dLon = toRadians(coord2.lng - coord1.lng)
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(coord1.lat)) *
    Math.cos(toRadians(coord2.lat)) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2)
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distance = R * c
  
  return Math.round(distance * 10) / 10 // Round to 1 decimal place
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180)
}

// Get all unique countries
export function getAllCountries(): Array<{ code: string; name: string }> {
  const countriesMap = new Map<string, string>()
  
  ALL_LOCATIONS.forEach(loc => {
    if (!countriesMap.has(loc.countryCode)) {
      countriesMap.set(loc.countryCode, loc.country)
    }
  })
  
  return Array.from(countriesMap.entries())
    .map(([code, name]) => ({ code, name }))
    .sort((a, b) => a.name.localeCompare(b.name))
}

