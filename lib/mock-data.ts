export interface ProvinceDto {
  id: number;
  name: string;
  name_en: string;
  region_name: 'North' | 'South' | 'Northeast' | 'Central' | 'East' | 'West';
  latitude: number;
  longitude: number;
  image_url: string;
}

export interface PlaceDto {
  id: number;
  name: string;
  name_en: string;
  detail: string;
  detail_en: string;
  province_id: number;
  latitude: number;
  longitude: number;
  best_season: 'summer' | 'winter' | 'rainy' | 'all_year';
  rating: number;
  thumbnail_url: string;
  image_urls: string[];
  categories: string[];
  province?: ProvinceDto;
}

export interface PlaceDetailDto extends PlaceDto {
  place_reviews: PlaceReview[];
}

export interface EventDto {
  id: number;
  name: string;
  name_en: string;
  detail: string;
  detail_en: string;
  start_date: string; // ISO string
  end_date: string; // ISO string
  province_id: number;
  latitude: number;
  longitude: number;
  is_recurring: boolean;
  is_highlight: boolean;
  rating: number;
  thumbnail_url: string;
  image_urls: string[];
  categories: string[];
  province?: ProvinceDto;
}

export interface EventDetailDto extends EventDto {
  event_reviews: EventReview[];
}

export interface PlaceReview {
    id: number;
    place_id: number;
    user_id: string;
    rating: number;
    comment: string;
    date: string; // ISO string
    // Added for UI compatibility if needed, though not in strict DTO, 
    // often reviews include user info. I'll stick to strict DTO but might need to mock user name in UI.
    user_name?: string; 
    avatar_url?: string;
}

export interface EventReview {
    id: number;
    event_id: number;
    user_id: string;
    rating: number;
    comment: string;
    date: string; // ISO string
    user_name?: string;
    avatar_url?: string;
}

// Trip มีได้หลาย Provinces และหลาย Days
export interface TripDto {
  id: number;
  user_id: string;
  name: string;
  start_date: string; // ISO date
  end_date: string; // ISO date
  status: 'draft' | 'upcoming' | 'completed';
  provinces: ProvinceDto[]; // Updated to include provinces array
  budget?: any;
}

export interface TripDetailDto extends TripDto {
  TripDays: TripDay[];
}

export interface TripDay {
  id: number;
  day_number: number;
  date: string; // ISO date
  items: TripItem[];
}

export interface TripItem {
  id: number;
  place_id?: number;
  event_id?: number;
  note?: string;
  order: number;
  start_time?: string; // HH:mm
  end_time?: string;   // HH:mm
  // Enriched fields
  place?: PlaceDto;
  event?: EventDto;
}

// --- Mock Data ---

export const provinces: ProvinceDto[] = [
  {
    id: 1,
    name: "เชียงใหม่",
    name_en: "Chiang Mai",
    region_name: "North",
    latitude: 18.7932,
    longitude: 99.1539,
    image_url: "https://picsum.photos/1000/600?random=1",
  },
  {
    id: 2,
    name: "ภูเก็ต",
    name_en: "Phuket",
    region_name: "South",
    latitude: 7.8549,
    longitude: 98.2435,
    image_url: "https://picsum.photos/1000/600?random=2",
  },
  {
    id: 3,
    name: "กรุงเทพมหานคร",
    name_en: "Bangkok",
    region_name: "Central",
    latitude: 13.7842,
    longitude: 100.5696,
    image_url: "https://picsum.photos/1000/600?random=3",
  },
  {
    id: 4,
    name: "สุราษฎร์ธานี",
    name_en: "Surat Thani",
    region_name: "South",
    latitude: 9.1760,
    longitude: 99.1672,
    image_url: "https://picsum.photos/1000/600?random=4",
  },
  {
    id: 5,
    name: "กระบี่",
    name_en: "Krabi",
    region_name: "South",
    latitude: 8.0463,
    longitude: 98.7909,
    image_url: "https://picsum.photos/1000/600?random=5",
  },
  {
    id: 6,
    name: "ชลบุรี",
    name_en: "Chon Buri",
    region_name: "East",
    latitude: 13.3619,
    longitude: 100.9850,
    image_url: "https://picsum.photos/1000/600?random=6",
  }
];

export const places: PlaceDetailDto[] = [
  {
    id: 101,
    name: "วัดพระธาตุดอยสุเทพ",
    name_en: "Wat Phra That Doi Suthep",
    detail: "วัดพระธาตุดอยสุเทพราชวรวิหาร เป็นวัดเก่แก่และมีความสำคัญกับจังหวัดเชียงใหม่ ตั้งอยู่บนดอยสุเทพ",
    detail_en: "Wat Phra That Doi Suthep is a Theravada Buddhist temple in Chiang Mai Province, Thailand. The temple is often referred to as 'Doi Suthep' although this is actually the name of the mountain where it's located.",
    province_id: 1,
    latitude: 18.8049,
    longitude: 98.9213,
    best_season: "winter",
    categories: ["Culture", "Temple", "Viewpoint", "temple"], // Added lowercase to match old location_type logic if needed or just use consistent casing
    rating: 4.8,
    thumbnail_url: "https://picsum.photos/800/600?random=10",
    image_urls: [
      "https://picsum.photos/800/600?random=10",
      "https://picsum.photos/800/600?random=11",
      "https://picsum.photos/800/600?random=12"
    ],
    place_reviews: [
        { 
            id: 1, 
            place_id: 101,
            user_id: "user_101",
            user_name: "Sarah Jenkins", 
            rating: 5, 
            comment: "Absolutely breathtaking! The view from the top is worth every step. Make sure to go early to avoid the crowds.", 
            date: "2024-01-15",
            avatar_url: "https://picsum.photos/150/150?random=101"
        },
        { 
            id: 2,
            place_id: 101, 
            user_id: "user_102",
            user_name: "Michael Chen", 
            rating: 4, 
            comment: "Beautiful temple. The architecture is stunning. A bit difficult to find parking though.", 
            date: "2024-02-10",
            avatar_url: "https://picsum.photos/150/150?random=102"
        },
        {
            id: 3,
            place_id: 101,
            user_id: "user_103",
            user_name: "Emily Davis",
            rating: 5,
            comment: "A must-visit in Chiang Mai! I felt so peaceful here.",
            date: "2024-02-25",
            avatar_url: "https://picsum.photos/150/150?random=103"
        }
    ]
  },
  {
    id: 102,
    name: "หาดป่าตอง",
    name_en: "Patong Beach",
    detail: "หาดป่าตอง เป็นชายหาดที่มีชื่อเสียงมากที่สุดของเกาะภูเก็ต มีรีสอร์ท ร้านค้า ร้านอาหาร และแหล่งบันเทิงมากมาย...",
    detail_en: "Patong is the main tourist resort on the island of Phuket, and is the center of Phuket's nightlife and shopping.",
    province_id: 2,
    latitude: 7.8967,
    longitude: 98.2952,
    best_season: "summer",
    categories: ["Beach", "Nightlife", "Water Sports", "beach"],
    rating: 4.5,
    thumbnail_url: "https://picsum.photos/800/600?random=20",
    image_urls: [
      "https://picsum.photos/800/600?random=20",
      "https://picsum.photos/800/600?random=21"
    ],
    place_reviews: []
  },
  {
    id: 103,
    name: "วัดพระศรีรัตนศาสดาราม",
    name_en: "The Grand Palace",
    detail: "พระบรมมหาราชวัง เป็นที่ประทับของพระมหากษัตริย์สมัยรัตนโกสินทร์ และเป็นที่ตั้งของวัดพระศรีรัตนศาสดาราม...",
    detail_en: "The Grand Palace is a complex of buildings at the heart of Bangkok, Thailand. The palace has been the official residence of the Kings of Siam since 1782.",
    province_id: 3,
    latitude: 13.7500,
    longitude: 100.4900,
    best_season: "all_year",
    categories: ["History", "Architecture", "Culture", "temple"],
    rating: 4.9,
    thumbnail_url: "https://picsum.photos/800/600?random=30",
    image_urls: [
      "https://picsum.photos/800/600?random=30",
      "https://picsum.photos/800/600?random=31"
    ],
    place_reviews: []
  },
  {
    id: 104,
    name: "เขาสก",
    name_en: "Khao Sok National Park",
    detail: "อุทยานแห่งชาติเขาสก ครอบคลุมพื้นที่ป่าดิบชื้นที่ใหญ่ที่สุดในภาคใต้ มีเขื่อนรัชชประภาที่สวยงาม...",
    detail_en: "Khao Sok National Park is in Surat Thani Province, Thailand. It contains dense virgin jungle, towerlike limestone karst formations and the man-made Cheow Lan Lake.",
    province_id: 4,
    latitude: 8.9175,
    longitude: 98.5305,
    best_season: "rainy",
    categories: ["Nature", "Adventure", "Lake", "mountain"],
    rating: 4.7,
    thumbnail_url: "https://picsum.photos/800/600?random=40",
    image_urls: [
      "https://picsum.photos/800/600?random=40",
      "https://picsum.photos/800/600?random=41"
    ],
    place_reviews: []
  },
  {
    id: 105,
    name: "ไร่เลย์",
    name_en: "Railay Beach",
    detail: "หาดไร่เลย์ เป็นหาดที่ต้องเดินทางด้วยเรือเท่านั้น มีชื่อเสียงเรื่องหน้าผาหินปูนที่สวยงาม...",
    detail_en: "Railay is a large peninsula between the city of Krabi and Ao Nang in Thailand. It is accessible only by boat due to high limestone cliffs cutting off mainland access.",
    province_id: 5,
    latitude: 8.0108,
    longitude: 98.8398,
    best_season: "summer",
    categories: ["Beach", "Climbing", "Relax", "beach"],
    rating: 4.8,
    thumbnail_url: "https://picsum.photos/800/600?random=50",
    image_urls: [
      "https://picsum.photos/800/600?random=50",
      "https://picsum.photos/800/600?random=51"
    ],
    place_reviews: []
  },
  {
    id: 111,
    name: "วัดเจดีย์หลวง",
    name_en: "Wat Chedi Luang",
    detail: "วัดเจดีย์หลวงวรวิหาร เป็นวัดเก่าแก่ในจังหวัดเชียงใหม่...",
    detail_en: "Wat Chedi Luang is a Buddhist temple in the historic centre of Chiang Mai, Thailand.",
    province_id: 1,
    latitude: 18.7870,
    longitude: 98.9860,
    best_season: "all_year",
    categories: ["Culture", "Temple", "History", "temple"],
    rating: 4.6,
    thumbnail_url: "https://picsum.photos/800/600?random=111",
    image_urls: [],
    place_reviews: []
  },
  {
    id: 112,
    name: "ดอยอินทนนท์",
    name_en: "Doi Inthanon",
    detail: "อุทยานแห่งชาติดอยอินทนนท์ มีความสูงจากระดับน้ำทะเล 2,565 เมตร...",
    detail_en: "Doi Inthanon is the highest mountain in Thailand. It is in Chom Thong District, Chiang Mai Province.",
    province_id: 1,
    latitude: 18.5884,
    longitude: 98.4863,
    best_season: "winter",
    categories: ["Nature", "Mountain", "Viewpoint", "mountain"],
    rating: 4.9,
    thumbnail_url: "https://picsum.photos/800/600?random=112",
    image_urls: [],
    place_reviews: []
  },
  {
    id: 113,
    name: "ถนนคนเดินท่าแพ",
    name_en: "Sunday Walking Street",
    detail: "ถนนคนเดินท่าแพ จัดขึ้นทุกวันอาทิตย์...",
    detail_en: "Chiang Mai's Sunday Walking Street creates a vibrant scene of shopping, food, and culture.",
    province_id: 1,
    latitude: 18.7877,
    longitude: 98.9930,
    best_season: "all_year",
    categories: ["Shopping", "Food", "Culture", "market"],
    rating: 4.7,
    thumbnail_url: "https://picsum.photos/800/600?random=113",
    image_urls: [],
    place_reviews: []
  },
  {
    id: 114,
    name: "สวนสัตว์เชียงใหม่",
    name_en: "Chiang Mai Zoo",
    detail: "สวนสัตว์เชียงใหม่ มีสัตว์นานาชนิด...",
    detail_en: "Chiang Mai Zoo and Aquarium is a 200-acre zoo on the foothills of Doi Suthep.",
    province_id: 1,
    latitude: 18.8090,
    longitude: 98.9480,
    best_season: "winter",
    categories: ["Nature", "Family", "Animals", "zoo"],
    rating: 4.3,
    thumbnail_url: "https://picsum.photos/800/600?random=114",
    image_urls: [],
    place_reviews: []
  },
  {
    id: 115,
    name: "นิมมานเหมินท์",
    name_en: "Nimmanhemin Road",
    detail: "ถนนนิมมานเหมินท์ เต็มไปด้วยร้านคาเฟ่ ร้านอาหาร...",
    detail_en: "Nimmanhemin Road is the trendiest part of Chiang Mai, full of chic cafes, restaurants, and boutiques.",
    province_id: 1,
    latitude: 18.7970,
    longitude: 98.9680,
    best_season: "all_year",
    categories: ["Shopping", "Food", "Cafe", "city"],
    rating: 4.5,
    thumbnail_url: "https://picsum.photos/800/600?random=115",
    image_urls: [],
    place_reviews: []
  },
  {
    id: 116,
    name: "ม่อนแจ่ม",
    name_en: "Mon Jam",
    detail: "ม่อนแจ่ม อากาศหนาวเย็นตลอดปี...",
    detail_en: "Mon Jam is a mountaintop farming community with cool weather and sweeping views.",
    province_id: 1,
    latitude: 18.9350,
    longitude: 98.8220,
    best_season: "winter",
    categories: ["Nature", "Viewpoint", "Camping", "mountain"],
    rating: 4.6,
    thumbnail_url: "https://picsum.photos/800/600?random=116",
    image_urls: [],
    place_reviews: []
  },
  {
    id: 117,
    name: "วัดอุโมงค์",
    name_en: "Wat Umong",
    detail: "วัดอุโมงค์สวนพุทธธรรม...",
    detail_en: "Wat Umong is a 700-year-old Buddhist temple in Chiang Mai known for its tunnels and forest setting.",
    province_id: 1,
    latitude: 18.7830,
    longitude: 98.9510,
    best_season: "all_year",
    categories: ["Culture", "Temple", "Peaceful", "temple"],
    rating: 4.7,
    thumbnail_url: "https://picsum.photos/800/600?random=117",
    image_urls: [],
    place_reviews: []
  },
  {
    id: 118,
    name: "แกรนด์แคนยอนหางดง",
    name_en: "Grand Canyon Chiang Mai",
    detail: "แกรนด์แคนยอนเชียงใหม่...",
    detail_en: "The Grand Canyon Chiang Mai is a man-made water park in an old quarry.",
    province_id: 1,
    latitude: 18.6960,
    longitude: 98.8930,
    best_season: "summer",
    categories: ["Nature", "Adventure", "Swimming", "nature"],
    rating: 4.4,
    thumbnail_url: "https://picsum.photos/800/600?random=118",
    image_urls: [],
    place_reviews: []
  },
  {
    id: 119,
    name: "ไนท์บาซาร์",
    name_en: "Night Bazaar",
    detail: "เชียงใหม่ไนท์บาซาร์...",
    detail_en: "The Chiang Mai Night Bazaar is a famous shopping market known for handicrafts and souvenirs.",
    province_id: 1,
    latitude: 18.7850,
    longitude: 99.0000,
    best_season: "all_year",
    categories: ["Shopping", "Food", "Nightlife", "market"],
    rating: 4.2,
    thumbnail_url: "https://picsum.photos/800/600?random=119",
    image_urls: [],
    place_reviews: []
  },
  {
    id: 120,
    name: "อุทยานหลวงราชพฤกษ์",
    name_en: "Royal Park Rajapruek",
    detail: "อุทยานหลวงราชพฤกษ์...",
    detail_en: "Royal Park Rajapruek is a large botanical garden in Chiang Mai.",
    province_id: 1,
    latitude: 18.7460,
    longitude: 98.9250,
    best_season: "winter",
    categories: ["Nature", "Garden", "Flowers", "garden"],
    rating: 4.8,
    thumbnail_url: "https://picsum.photos/800/600?random=120",
    image_urls: [],
    place_reviews: []
  }
];

export const events: EventDetailDto[] = [
  {
    id: 201,
    name: "ยี่เป็ง",
    name_en: "Yi Peng Lantern Festival",
    start_date: "2024-11-15T00:00:00Z",
    end_date: "2024-11-16T23:59:59Z",
    province_id: 1,
    is_recurring: true,
    is_highlight: true,
    categories: ["Culture", "Lanterns", "Night", "festival"],
    thumbnail_url: "https://picsum.photos/800/600?random=60", 
    image_urls: [
      "https://picsum.photos/800/600?random=60",
      "https://picsum.photos/800/600?random=61"
    ],
    detail: "เทศกาลปล่อยโคมลอยยี่เป็งอันสวยงามตระการตา",
    detail_en: "The spectacular Yi Peng Lantern Festival.",
    rating: 4.9,
    latitude: 18.7932,
    longitude: 99.1539,
    event_reviews: [
        { 
            id: 101, 
            event_id: 201,
            user_id: "user_201",
            user_name: "Tourist A", 
            rating: 5, 
            comment: "Magical experience!", 
            date: "2023-11-15", 
            avatar_url: "https://picsum.photos/150/150?random=201" 
        }
    ]
  },
  {
    id: 202,
    name: "สงกรานต์",
    name_en: "Songkran Festival",
    start_date: "2024-04-13T00:00:00Z",
    end_date: "2024-04-15T23:59:59Z",
    province_id: 3,
    is_recurring: true,
    is_highlight: true,
    categories: ["Fun", "Water", "Tradition", "festival"],
    thumbnail_url: "https://picsum.photos/800/600?random=70",
    image_urls: [
       "https://picsum.photos/800/600?random=70",
       "https://picsum.photos/800/600?random=71"
    ],
    detail: "วันขึ้นปีใหม่ไทยและการเล่นน้ำสงกรานต์ที่สนุกสนาน",
    detail_en: "Thai New Year and the fun water festival.",
    rating: 4.8,
    latitude: 13.7563,
    longitude: 100.5018,
    event_reviews: []
  }
];

export const trips: TripDetailDto[] = [
  {
    id: 1001,
    user_id: "user_1",
    name: "Chiang Mai Adventure",
    start_date: "2024-12-20",
    end_date: "2024-12-25",
    status: 'draft',
    provinces: [provinces[0]], // Chiang Mai
    TripDays: [
      { id: 1, day_number: 1, date: "2024-12-20", items: [] },
      { id: 2, day_number: 2, date: "2024-12-21", items: [] },
    ]
  },
  {
    id: 1002,
    user_id: "user_1",
    name: "Southern Thailand Beach Tour",
    start_date: "2024-11-10",
    end_date: "2024-11-12",
    status: 'upcoming',
    provinces: [provinces[1], provinces[4]], // Phuket and Krabi
    TripDays: [
       { id: 3, day_number: 1, date: "2024-11-10", items: [{ id: 1, place_id: 102, order: 1, start_time: "10:00", end_time: "12:00" }] },
    ]
  },
  {
    id: 1003,
    user_id: "user_1",
    name: "Bangkok Food Tour",
    start_date: "2023-05-10",
    end_date: "2023-05-11",
    status: 'completed',
    provinces: [provinces[2]], // Bangkok
    TripDays: []
  }
];
