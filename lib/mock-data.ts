export interface Province {
  province_id: number;
  name: string;
  name_en: string;
  region_name: 'North' | 'South' | 'Northeast' | 'Central' | 'East' | 'West';
  latitude: number;
  longitude: number;
  image_url: string;
}

export interface PlaceCategory {
  category_id: number;
  name: string;
  name_en: string;
}

export interface Place {
  place_id: number;
  name: string;
  name_en: string;
  introduction: string;
  detail: string;
  category_id: number;
  province_id: number;
  latitude: number;
  longitude: number;
  location_type: string; // e.g., 'beach', 'mountain', 'temple', 'market'
  best_season: 'summer' | 'winter' | 'rainy' | 'all_year';
  tags: string[];
  rating: number;
  thumbnail_url: string;
  image_urls: string[];
  reviews: Review[];
}

export interface Event {
  event_id: number;
  name: string;
  name_en: string;
  start_date: string; // ISO string
  end_date: string; // ISO string
  province_id: number;
  event_type: string; // e.g., 'festival', 'cultural', 'sports', 'music'
  is_recurring: boolean;
  is_highlight: boolean;
  tags: string[];
  image_url: string;
  image_urls: string[];
  description: string;
  rating: number;
  reviews: Review[];
}

export interface Review {
  review_id: number;
  user_name: string;
  rating: number;
  comment: string;
  date: string;
  avatar_url?: string;
}

export interface TripItem {
  item_id: number;
  place_id?: number;
  event_id?: number;
  note?: string;
  order: number;
  start_time?: string; // HH:mm
  end_time?: string;   // HH:mm
}

export interface TripDay {
  day_id: number;
  day_number: number;
  date: string; // ISO date
  items: TripItem[];
}

export interface Trip {
  trip_id: number;
  user_id: string;
  name: string;
  start_date: string; // ISO date
  end_date: string; // ISO date
  province_id?: number;
  province_name?: string; // Helper for UI
  status: 'draft' | 'upcoming' | 'completed';
  cover_image?: string;
  days: TripDay[];
}

// --- Mock Data ---

export const provinces: Province[] = [
  {
    province_id: 1,
    name: "เชียงใหม่",
    name_en: "Chiang Mai",
    region_name: "North",
    latitude: 18.7932,
    longitude: 99.1539,
    image_url: "https://picsum.photos/1000/600?random=1",
  },
  {
    province_id: 2,
    name: "ภูเก็ต",
    name_en: "Phuket",
    region_name: "South",
    latitude: 7.8549,
    longitude: 98.2435,
    image_url: "https://picsum.photos/1000/600?random=2",
  },
  {
    province_id: 3,
    name: "กรุงเทพมหานคร",
    name_en: "Bangkok",
    region_name: "Central",
    latitude: 13.7842,
    longitude: 100.5696,
    image_url: "https://picsum.photos/1000/600?random=3",
  },
  {
    province_id: 4,
    name: "สุราษฎร์ธานี",
    name_en: "Surat Thani",
    region_name: "South",
    latitude: 9.1760,
    longitude: 99.1672,
    image_url: "https://picsum.photos/1000/600?random=4",
  },
  {
    province_id: 5,
    name: "กระบี่",
    name_en: "Krabi",
    region_name: "South",
    latitude: 8.0463,
    longitude: 98.7909,
    image_url: "https://picsum.photos/1000/600?random=5",
  },
  {
    province_id: 6,
    name: "ชลบุรี",
    name_en: "Chon Buri",
    region_name: "East",
    latitude: 13.3619,
    longitude: 100.9850,
    image_url: "https://picsum.photos/1000/600?random=6",
  }
];

export const places: Place[] = [
  {
    place_id: 101,
    name: "วัดพระธาตุดอยสุเทพ",
    name_en: "Wat Phra That Doi Suthep",
    introduction: "วัดศักดิ์สิทธิ์คู่เมืองเชียงใหม่",
    detail: "วัดพระธาตุดอยสุเทพราชวรวิหาร เป็นวัดเก่แก่และมีความสำคัญกับจังหวัดเชียงใหม่ ตั้งอยู่บนดอยสุเทพ...",
    category_id: 1,
    province_id: 1,
    latitude: 18.8049,
    longitude: 98.9213,
    location_type: "temple",
    best_season: "winter",
    tags: ["Culture", "Temple", "Viewpoint"],
    rating: 4.8,
    thumbnail_url: "https://picsum.photos/800/600?random=10",
    image_urls: [
      "https://picsum.photos/800/600?random=10",
      "https://picsum.photos/800/600?random=11",
      "https://picsum.photos/800/600?random=12"
    ],
    reviews: [
        { 
            review_id: 1, 
            user_name: "Sarah Jenkins", 
            rating: 5, 
            comment: "Absolutely breathtaking! The view from the top is worth every step. Make sure to go early to avoid the crowds.", 
            date: "2024-01-15",
            avatar_url: "https://picsum.photos/150/150?random=101"
        },
        { 
            review_id: 2, 
            user_name: "Michael Chen", 
            rating: 4, 
            comment: "Beautiful temple. The architecture is stunning. A bit difficult to find parking though.", 
            date: "2024-02-10",
            avatar_url: "https://picsum.photos/150/150?random=102"
        },
        {
            review_id: 3,
            user_name: "Emily Davis",
            rating: 5,
            comment: "A must-visit in Chiang Mai! I felt so peaceful here.",
            date: "2024-02-25",
            avatar_url: "https://picsum.photos/150/150?random=103"
        }
    ]
  },
  {
    place_id: 102,
    name: "หาดป่าตอง",
    name_en: "Patong Beach",
    introduction: "ชายหาดที่มีชื่อเสียงที่สุดในภูเก็ต",
    detail: "หาดป่าตอง เป็นชายหาดที่มีชื่อเสียงมากที่สุดของเกาะภูเก็ต มีรีสอร์ท ร้านค้า ร้านอาหาร และแหล่งบันเทิงมากมาย...",
    category_id: 2,
    province_id: 2,
    latitude: 7.8967,
    longitude: 98.2952,
    location_type: "beach",
    best_season: "summer",
    tags: ["Beach", "Nightlife", "Water Sports"],
    rating: 4.5,
    thumbnail_url: "https://picsum.photos/800/600?random=20",
    image_urls: [
      "https://picsum.photos/800/600?random=20",
      "https://picsum.photos/800/600?random=21"
    ],
    reviews: []
  },
  {
    place_id: 103,
    name: "วัดพระศรีรัตนศาสดาราม",
    name_en: "The Grand Palace",
    introduction: "พระบรมมหาราชวังและวัดพระแก้ว",
    detail: "พระบรมมหาราชวัง เป็นที่ประทับของพระมหากษัตริย์สมัยรัตนโกสินทร์ และเป็นที่ตั้งของวัดพระศรีรัตนศาสดาราม...",
    category_id: 1,
    province_id: 3,
    latitude: 13.7500,
    longitude: 100.4900,
    location_type: "temple",
    best_season: "all_year",
    tags: ["History", "Architecture", "Culture"],
    rating: 4.9,
    thumbnail_url: "https://picsum.photos/800/600?random=30",
    image_urls: [
      "https://picsum.photos/800/600?random=30",
      "https://picsum.photos/800/600?random=31"
    ],
    reviews: []
  },
  {
    place_id: 104,
    name: "เขาสก",
    name_en: "Khao Sok National Park",
    introduction: "ป่าฝนที่สมบูรณ์ที่สุดในภาคใต้",
    detail: "อุทยานแห่งชาติเขาสก ครอบคลุมพื้นที่ป่าดิบชื้นที่ใหญ่ที่สุดในภาคใต้ มีเขื่อนรัชชประภาที่สวยงาม...",
    category_id: 3,
    province_id: 4,
    latitude: 8.9175,
    longitude: 98.5305,
    location_type: "mountain",
    best_season: "rainy",
    tags: ["Nature", "Adventure", "Lake"],
    rating: 4.7,
    thumbnail_url: "https://picsum.photos/800/600?random=40",
    image_urls: [
      "https://picsum.photos/800/600?random=40",
      "https://picsum.photos/800/600?random=41"
    ],
    reviews: []
  },
  {
    place_id: 105,
    name: "ไร่เลย์",
    name_en: "Railay Beach",
    introduction: "สวรรค์ของนักปีนเขาและคนรักทะเล",
    detail: "หาดไร่เลย์ เป็นหาดที่ต้องเดินทางด้วยเรือเท่านั้น มีชื่อเสียงเรื่องหน้าผาหินปูนที่สวยงาม...",
    category_id: 2,
    province_id: 5,
    latitude: 8.0108,
    longitude: 98.8398,
    location_type: "beach",
    best_season: "summer",
    tags: ["Beach", "Climbing", "Relax"],
    rating: 4.8,
    thumbnail_url: "https://picsum.photos/800/600?random=50",
    image_urls: [
      "https://picsum.photos/800/600?random=50",
      "https://picsum.photos/800/600?random=51"
    ],
    reviews: []
  },
  // Extra Mock Data for Chiang Mai to test Pagination (Need > 10 items)
  {
    place_id: 111,
    name: "วัดเจดีย์หลวง",
    name_en: "Wat Chedi Luang",
    introduction: "วัดเก่าแก่ใจกลางเมือง",
    detail: "วัดเจดีย์หลวงวรวิหาร เป็นวัดเก่าแก่ในจังหวัดเชียงใหม่...",
    category_id: 1,
    province_id: 1,
    latitude: 18.7870,
    longitude: 98.9860,
    location_type: "temple",
    best_season: "all_year",
    tags: ["Culture", "Temple", "History"],
    rating: 4.6,
    thumbnail_url: "https://picsum.photos/800/600?random=111",
    image_urls: [],
    reviews: []
  },
  {
    place_id: 112,
    name: "ดอยอินทนนท์",
    name_en: "Doi Inthanon",
    introduction: "ยอดเขาที่สูงที่สุดในไทย",
    detail: "อุทยานแห่งชาติดอยอินทนนท์ มีความสูงจากระดับน้ำทะเล 2,565 เมตร...",
    category_id: 3,
    province_id: 1,
    latitude: 18.5884,
    longitude: 98.4863,
    location_type: "mountain",
    best_season: "winter",
    tags: ["Nature", "Mountain", "Viewpoint"],
    rating: 4.9,
    thumbnail_url: "https://picsum.photos/800/600?random=112",
    image_urls: [],
    reviews: []
  },
  {
    place_id: 113,
    name: "ถนนคนเดินท่าแพ",
    name_en: "Sunday Walking Street",
    introduction: "ตลาดนัดวันอาทิตย์ที่ใหญ่ที่สุด",
    detail: "ถนนคนเดินท่าแพ จัดขึ้นทุกวันอาทิตย์...",
    category_id: 4,
    province_id: 1,
    latitude: 18.7877,
    longitude: 98.9930,
    location_type: "market",
    best_season: "all_year",
    tags: ["Shopping", "Food", "Culture"],
    rating: 4.7,
    thumbnail_url: "https://picsum.photos/800/600?random=113",
    image_urls: [],
    reviews: []
  },
  {
    place_id: 114,
    name: "สวนสัตว์เชียงใหม่",
    name_en: "Chiang Mai Zoo",
    introduction: "สวนสัตว์ขนาดใหญ่เชิงดอยสุเทพ",
    detail: "สวนสัตว์เชียงใหม่ มีสัตว์นานาชนิด...",
    category_id: 5,
    province_id: 1,
    latitude: 18.8090,
    longitude: 98.9480,
    location_type: "zoo",
    best_season: "winter",
    tags: ["Nature", "Family", "Animals"],
    rating: 4.3,
    thumbnail_url: "https://picsum.photos/800/600?random=114",
    image_urls: [],
    reviews: []
  },
  {
    place_id: 115,
    name: "นิมมานเหมินท์",
    name_en: "Nimmanhemin Road",
    introduction: "ย่านฮิปสเตอร์ของเชียงใหม่",
    detail: "ถนนนิมมานเหมินท์ เต็มไปด้วยร้านคาเฟ่ ร้านอาหาร...",
    category_id: 4,
    province_id: 1,
    latitude: 18.7970,
    longitude: 98.9680,
    location_type: "city",
    best_season: "all_year",
    tags: ["Shopping", "Food", "Cafe"],
    rating: 4.5,
    thumbnail_url: "https://picsum.photos/800/600?random=115",
    image_urls: [],
    reviews: []
  },
  {
    place_id: 116,
    name: "ม่อนแจ่ม",
    name_en: "Mon Jam",
    introduction: "ดอยสวยอากาศดี",
    detail: "ม่อนแจ่ม อากาศหนาวเย็นตลอดปี...",
    category_id: 3,
    province_id: 1,
    latitude: 18.9350,
    longitude: 98.8220,
    location_type: "mountain",
    best_season: "winter",
    tags: ["Nature", "Viewpoint", "Camping"],
    rating: 4.6,
    thumbnail_url: "https://picsum.photos/800/600?random=116",
    image_urls: [],
    reviews: []
  },
  {
    place_id: 117,
    name: "วัดอุโมงค์",
    name_en: "Wat Umong",
    introduction: "วัดป่าในอุโมงค์",
    detail: "วัดอุโมงค์สวนพุทธธรรม...",
    category_id: 1,
    province_id: 1,
    latitude: 18.7830,
    longitude: 98.9510,
    location_type: "temple",
    best_season: "all_year",
    tags: ["Culture", "Temple", "Peaceful"],
    rating: 4.7,
    thumbnail_url: "https://picsum.photos/800/600?random=117",
    image_urls: [],
    reviews: []
  },
  {
    place_id: 118,
    name: "แกรนด์แคนยอนหางดง",
    name_en: "Grand Canyon Chiang Mai",
    introduction: "สวนน้ำธรรมชาติ",
    detail: "แกรนด์แคนยอนเชียงใหม่...",
    category_id: 2,
    province_id: 1,
    latitude: 18.6960,
    longitude: 98.8930,
    location_type: "nature",
    best_season: "summer",
    tags: ["Nature", "Adventure", "Swimming"],
    rating: 4.4,
    thumbnail_url: "https://picsum.photos/800/600?random=118",
    image_urls: [],
    reviews: []
  },
  {
    place_id: 119,
    name: "ไนท์บาซาร์",
    name_en: "Night Bazaar",
    introduction: "ตลาดกลางคืนชื่อดัง",
    detail: "เชียงใหม่ไนท์บาซาร์...",
    category_id: 4,
    province_id: 1,
    latitude: 18.7850,
    longitude: 99.0000,
    location_type: "market",
    best_season: "all_year",
    tags: ["Shopping", "Food", "Nightlife"],
    rating: 4.2,
    thumbnail_url: "https://picsum.photos/800/600?random=119",
    image_urls: [],
    reviews: []
  },
  {
    place_id: 120,
    name: "อุทยานหลวงราชพฤกษ์",
    name_en: "Royal Park Rajapruek",
    introduction: "สวนพฤกษศาสตร์นานาชาติ",
    detail: "อุทยานหลวงราชพฤกษ์...",
    category_id: 3,
    province_id: 1,
    latitude: 18.7460,
    longitude: 98.9250,
    location_type: "garden",
    best_season: "winter",
    tags: ["Nature", "Garden", "Flowers"],
    rating: 4.8,
    thumbnail_url: "https://picsum.photos/800/600?random=120",
    image_urls: [],
    reviews: []
  }
];

export const events: Event[] = [
  {
    event_id: 201,
    name: "ยี่เป็ง",
    name_en: "Yi Peng Lantern Festival",
    start_date: "2024-11-15T00:00:00Z",
    end_date: "2024-11-16T23:59:59Z",
    province_id: 1,
    event_type: "festival",
    is_recurring: true,
    is_highlight: true,
    tags: ["Culture", "Lanterns", "Night"],
    image_url: "https://picsum.photos/800/600?random=60", 
    image_urls: [
      "https://picsum.photos/800/600?random=60",
      "https://picsum.photos/800/600?random=61"
    ],
    description: "เทศกาลปล่อยโคมลอยยี่เป็งอันสวยงามตระการตา",
    rating: 4.9,
    reviews: [
        { review_id: 101, user_name: "Tourist A", rating: 5, comment: "Magical experience!", date: "2023-11-15", avatar_url: "https://picsum.photos/150/150?random=201" }
    ]
  },
  {
    event_id: 202,
    name: "สงกรานต์",
    name_en: "Songkran Festival",
    start_date: "2024-04-13T00:00:00Z",
    end_date: "2024-04-15T23:59:59Z",
    province_id: 3,
    event_type: "festival",
    is_recurring: true,
    is_highlight: true,
    tags: ["Fun", "Water", "Tradition"],
    image_url: "https://picsum.photos/800/600?random=70",
    image_urls: [
       "https://picsum.photos/800/600?random=70",
       "https://picsum.photos/800/600?random=71"
    ],
    description: "วันขึ้นปีใหม่ไทยและการเล่นน้ำสงกรานต์ที่สนุกสนาน",
    rating: 4.8,
    reviews: []
  }
];

export const trips: Trip[] = [
  {
    trip_id: 1001,
    user_id: "user_1",
    name: "Chiang Mai Adventure",
    start_date: "2024-12-20",
    end_date: "2024-12-25",
    province_id: 1,
    province_name: "Chiang Mai",
    status: 'draft',
    cover_image: "https://picsum.photos/800/600?random=1",
    days: [
      { day_id: 1, day_number: 1, date: "2024-12-20", items: [] },
      { day_id: 2, day_number: 2, date: "2024-12-21", items: [] },
    ]
  },
  {
    trip_id: 1002,
    user_id: "user_1",
    name: "Phuket Beach Getaway",
    start_date: "2024-11-10",
    end_date: "2024-11-12",
    province_id: 2,
    province_name: "Phuket",
    status: 'upcoming',
    cover_image: "https://picsum.photos/800/600?random=2",
    days: [
       { day_id: 3, day_number: 1, date: "2024-11-10", items: [{ item_id: 1, place_id: 102, order: 1, start_time: "10:00", end_time: "12:00" }] },
    ]
  },
  {
    trip_id: 1003,
    user_id: "user_1",
    name: "Bangkok Food Tour",
    start_date: "2023-05-10",
    end_date: "2023-05-11",
    province_id: 3,
    province_name: "Bangkok",
    status: 'completed',
    cover_image: "https://picsum.photos/1000/600?random=3",
     days: []
  }
];

