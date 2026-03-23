export type TripType = "beach" | "adventure" | "city" | "cultural" | "default";

export const ALLOCATION_BY_TRIP_TYPE: Record<
  TripType,
  Record<string, number>
> = {
  beach: {
    accommodation: 0.5,
    food_dining: 0.2,
    transport: 0.1,
    activities: 0.15,
    shopping: 0.05,
    other: 0.0,
  },
  adventure: {
    accommodation: 0.35,
    food_dining: 0.2,
    transport: 0.2,
    activities: 0.2,
    shopping: 0.05,
    other: 0.0,
  },
  city: {
    accommodation: 0.4,
    food_dining: 0.3,
    transport: 0.15,
    activities: 0.1,
    shopping: 0.05,
    other: 0.0,
  },
  cultural: {
    accommodation: 0.35,
    food_dining: 0.25,
    transport: 0.15,
    activities: 0.2,
    shopping: 0.05,
    other: 0.0,
  },
  default: {
    accommodation: 0.45,
    food_dining: 0.25,
    transport: 0.15,
    activities: 0.1,
    shopping: 0.05,
    other: 0.0,
  },
};

const PROVINCE_TRIP_TYPE: Record<string, TripType> = {
  Phuket: "beach",
  Krabi: "beach",
  "Koh Samui": "beach",
  "Surat Thani": "beach",
  Trang: "beach",
  Rayong: "beach",
  Chonburi: "beach",
  "Hua Hin": "beach",
  "Phang-nga": "beach",
  กระบี่: "beach",
  ภูเก็ต: "beach",
  สุราษฎร์ธานี: "beach",
  ตรัง: "beach",
  ระยอง: "beach",
  ชลบุรี: "beach",
  พังงา: "beach",
  "Chiang Mai": "adventure",
  "Chiang Rai": "adventure",
  Pai: "adventure",
  Nan: "adventure",
  Loei: "adventure",
  Kanchanaburi: "adventure",
  เชียงใหม่: "adventure",
  เชียงราย: "adventure",
  น่าน: "adventure",
  เลย: "adventure",
  กาญจนบุรี: "adventure",
  Bangkok: "city",
  กรุงเทพมหานคร: "city",
  Ayutthaya: "cultural",
  Sukhothai: "cultural",
  "Nakhon Ratchasima": "cultural",
  อยุธยา: "cultural",
  สุโขทัย: "cultural",
  นครราชสีมา: "cultural",
};

export function detectTripType(province: string): TripType {
  return PROVINCE_TRIP_TYPE[province] ?? "default";
}

export function adjustBudgetProportionally(
  currentAllocations: Record<string, number>,
  changedCategory: string,
  newPercentage: number,
): Record<string, number> {
  const oldPercentage = currentAllocations[changedCategory] ?? 0;
  const delta = newPercentage - oldPercentage;

  const otherCategories = Object.keys(currentAllocations).filter(
    (k) => k !== changedCategory,
  );
  const otherTotal = otherCategories.reduce(
    (sum, k) => sum + currentAllocations[k],
    0,
  );

  const newAllocations: Record<string, number> = { ...currentAllocations };
  newAllocations[changedCategory] = newPercentage;

  if (otherTotal > 0) {
    for (const cat of otherCategories) {
      const proportion = currentAllocations[cat] / otherTotal;
      newAllocations[cat] = Math.max(
        0,
        currentAllocations[cat] - delta * proportion,
      );
    }
  }

  const sum = Object.values(newAllocations).reduce((a, b) => a + b, 0);
  if (sum > 0) {
    for (const key of Object.keys(newAllocations)) {
      newAllocations[key] = newAllocations[key] / sum;
    }
  }

  return newAllocations;
}

export function calculateAllocatedAmounts(
  totalBudget: number,
  allocations: Record<string, number>,
): Record<string, number> {
  const result: Record<string, number> = {};
  for (const [categoryId, percentage] of Object.entries(allocations)) {
    result[categoryId] = Math.round(totalBudget * percentage);
  }
  return result;
}

export function getDefaultAllocations(
  tripType: TripType,
): Record<string, number> {
  return { ...ALLOCATION_BY_TRIP_TYPE[tripType] };
}

export function getPercentagesFromCategories(
  categories: Array<{ id: string; allocated: number }>,
  totalBudget: number,
): Record<string, number> {
  const result: Record<string, number> = {};
  for (const cat of categories) {
    result[cat.id] = totalBudget > 0 ? cat.allocated / totalBudget : 0;
  }
  return result;
}
