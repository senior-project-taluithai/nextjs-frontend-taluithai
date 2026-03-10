import { api } from '../api-client';

export type InteractionType = 'view' | 'save' | 'add_to_trip' | 'share';

export const interactionService = {
  track: async (params: {
    place_id?: number;
    event_id?: number;
    interaction_type: InteractionType;
  }): Promise<void> => {
    try {
      await api.post('/interactions', params);
    } catch {
      // Silently fail — tracking should never break the UX
    }
  },
};
