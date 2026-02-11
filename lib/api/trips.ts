import { TripDto, TripDetailDto } from '../mock-data';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface CreateTripRequest {
  name: string;
  start_date: string;
  end_date: string;
  province_ids: number[];
  status?: 'draft' | 'upcoming' | 'completed';
}

export interface UpdateTripRequest {
  name?: string;
  start_date?: string;
  end_date?: string;
  province_ids?: number[];
  status?: 'draft' | 'upcoming' | 'completed';
}

async function getAuthToken(): Promise<string | null> {
  // This will be replaced with actual Clerk auth token retrieval
  // For now, return null to indicate we're using mock data
  return null;
}

export async function createTrip(data: CreateTripRequest): Promise<TripDto> {
  const token = await getAuthToken();
  
  if (!token) {
    // Mock implementation - in real app this would throw or redirect to login
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${API_BASE_URL}/trips`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('Failed to create trip');
  }

  return response.json();
}

export async function getTrips(): Promise<TripDto[]> {
  const token = await getAuthToken();
  
  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${API_BASE_URL}/trips`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch trips');
  }

  return response.json();
}

export async function getTrip(id: number): Promise<TripDetailDto> {
  const token = await getAuthToken();
  
  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${API_BASE_URL}/trips/${id}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch trip');
  }

  return response.json();
}

export async function updateTrip(id: number, data: UpdateTripRequest): Promise<TripDto> {
  const token = await getAuthToken();
  
  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${API_BASE_URL}/trips/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('Failed to update trip');
  }

  return response.json();
}

export async function deleteTrip(id: number): Promise<void> {
  const token = await getAuthToken();
  
  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${API_BASE_URL}/trips/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to delete trip');
  }
}
