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

// --- Mock Data ---

export const provinces: Province[] = [
  {
    province_id: 1,
    name: "เชียงใหม่",
    name_en: "Chiang Mai",
    region_name: "North",
    latitude: 18.7932,
    longitude: 99.1539,
    image_url: "https://images.unsplash.com/photo-1549480017-d76466a4b7e8?auto=format&fit=crop&q=80&w=1000",
  },
  {
    province_id: 2,
    name: "ภูเก็ต",
    name_en: "Phuket",
    region_name: "South",
    latitude: 7.8549,
    longitude: 98.2435,
    image_url: "https://images.unsplash.com/photo-1579543161678-0fa19d8540c4?auto=format&fit=crop&q=80&w=1000",
  },
  {
    province_id: 3,
    name: "กรุงเทพมหานคร",
    name_en: "Bangkok",
    region_name: "Central",
    latitude: 13.7842,
    longitude: 100.5696,
    image_url: "https://images.unsplash.com/photo-1627448868661-8cfdb396821d?auto=format&fit=crop&q=80&w=1000",
  },
  {
    province_id: 4,
    name: "สุราษฎร์ธานี",
    name_en: "Surat Thani",
    region_name: "South",
    latitude: 9.1760,
    longitude: 99.1672,
    image_url: "https://images.unsplash.com/photo-1552393351-4e76c2438814?auto=format&fit=crop&q=80&w=1000",
  },
  {
    province_id: 5,
    name: "กระบี่",
    name_en: "Krabi",
    region_name: "South",
    latitude: 8.0463,
    longitude: 98.7909,
    image_url: "https://images.unsplash.com/photo-1473484210082-965306ec46a2?auto=format&fit=crop&q=80&w=1000",
  },
  {
    province_id: 6,
    name: "ชลบุรี",
    name_en: "Chon Buri",
    region_name: "East",
    latitude: 13.3619,
    longitude: 100.9850,
    image_url: "https://images.unsplash.com/photo-1595180425666-9c4c449c2830?auto=format&fit=crop&q=80&w=1000",
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
    thumbnail_url: "https://images.unsplash.com/photo-1597405423856-7824888d3e26?auto=format&fit=crop&q=80&w=800",
    image_urls: [
      "https://images.unsplash.com/photo-1597405423856-7824888d3e26?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1587397750796-0f374786dca3?auto=format&fit=crop&q=80&w=800"
    ],
    reviews: [
        { 
            review_id: 1, 
            user_name: "Sarah Jenkins", 
            rating: 5, 
            comment: "Absolutely breathtaking! The view from the top is worth every step. Make sure to go early to avoid the crowds.", 
            date: "2024-01-15",
            avatar_url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150"
        },
        { 
            review_id: 2, 
            user_name: "Michael Chen", 
            rating: 4, 
            comment: "Beautiful temple. The architecture is stunning. A bit difficult to find parking though.", 
            date: "2024-02-10",
            avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150"
        },
        {
            review_id: 3,
            user_name: "Emily Davis",
            rating: 5,
            comment: "A must-visit in Chiang Mai! I felt so peaceful here.",
            date: "2024-02-25"
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
    thumbnail_url: "https://images.unsplash.com/photo-1563294406-8dce28266453?auto=format&fit=crop&q=80&w=800",
    image_urls: [
      "https://images.unsplash.com/photo-1563294406-8dce28266453?auto=format&fit=crop&q=80&w=800"
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
    thumbnail_url: "https://images.unsplash.com/photo-1510250953686-21ce2c744f4e?auto=format&fit=crop&q=80&w=800",
    image_urls: [
      "https://images.unsplash.com/photo-1510250953686-21ce2c744f4e?auto=format&fit=crop&q=80&w=800"
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
    thumbnail_url: "https://images.unsplash.com/photo-1598267252277-3e1db6f80a40?auto=format&fit=crop&q=80&w=800",
    image_urls: [
      "https://images.unsplash.com/photo-1598267252277-3e1db6f80a40?auto=format&fit=crop&q=80&w=800"
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
    thumbnail_url: "https://images.unsplash.com/photo-1506929562872-bb421503ef21?auto=format&fit=crop&q=80&w=800",
    image_urls: [
      "https://images.unsplash.com/photo-1506929562872-bb421503ef21?auto=format&fit=crop&q=80&w=800"
    ],
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
    image_url: "https://images.unsplash.com/photo-1510250953686-21ce2c744f4e?auto=format&fit=crop&q=80&w=800", // Placeholder if specific one not found
    image_urls: [
      "https://images.unsplash.com/photo-1510250953686-21ce2c744f4e?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1596422846543-75c6fc197f07?auto=format&fit=crop&q=80&w=800"
    ],
    description: "เทศกาลปล่อยโคมลอยยี่เป็งอันสวยงามตระการตา",
    rating: 4.9,
    reviews: [
        { review_id: 101, user_name: "Tourist A", rating: 5, comment: "Magical experience!", date: "2023-11-15" }
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
    image_url: "https://images.unsplash.com/photo-1596422846543-75c6fc197f07?auto=format&fit=crop&q=80&w=800",
    image_urls: [
       "https://images.unsplash.com/photo-1596422846543-75c6fc197f07?auto=format&fit=crop&q=80&w=800",
       "https://images.unsplash.com/photo-1510250953686-21ce2c744f4e?auto=format&fit=crop&q=80&w=800"
    ],
    description: "วันขึ้นปีใหม่ไทยและการเล่นน้ำสงกรานต์ที่สนุกสนาน",
    rating: 4.8,
    reviews: []
  }
];
