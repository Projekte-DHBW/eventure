export type EventLocation = {
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
};

export type EventOccurrence = {
  startDate: Date;
  endDate?: Date;
  location?: EventLocation;
};

export type Invitation = {
  email: string;
  message?: string;
};

export type CreateEvent = {
  title: string;
  description: string;
  visibility: 'public' | 'private' | 'unlisted';
  category: 'music' | 'sports' | 'culture' | 'other';
  maxParticipants?: number;
  coverImageUrl?: string;
  location?: string;
  eventDate?: Date;
  eventTime?: string;
  isOnline?: boolean;
  meetingLink?: string;
  occurrences?: Array<{
    startDate: Date;
    endDate?: Date;
    location: {
      address: string;
      city: string;
      state: string;
      country: string;
      postalCode?: string;
      latitude?: number;
      longitude?: number;
    };
  }>;
  invitations?: Array<{
    email: string;
    message?: string;
  }>;
};

export interface Event {
  id: string;
  title: string;
  description?: string;
  visibility: 'public' | 'private' | 'unlisted';
  category: string;
  coverImageUrl?: string;
  maxParticipants?: number;
  creator?: string;
  creatorObj?: any;
  eventDate?: string;
  location?: string;
  isOnline?: boolean;
  meetingLink?: string;
  createdAt?: string;
  updatedAt?: string;
  attendees?: any[];
}

export interface UpdateEvent {
  title?: string;
  description?: string;
  visibility?: 'public' | 'private' | 'unlisted';
  category?: string;
  coverImageUrl?: string;
  maxParticipants?: number;
  eventDate?: string | Date;
  eventTime?: string;
  location?: string;
  isOnline?: boolean;
  meetingLink?: string;
  invitations?: Array<{
    email: string;
  }>;
  occurrences?: Array<{
    startDate: string | Date;
    endDate?: string | Date;
    title?: string;
  }>;
}
