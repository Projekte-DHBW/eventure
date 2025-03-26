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
  coverImageUrl?: string;
  maxParticipants?: number;
  location?: string;
  eventDate?: Date;
  isOnline?: boolean;
  meetingLink?: string;
  occurrences?: EventOccurrence[];
  invitations?: Invitation[];
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
  eventDate?: string; // ISO8601 Datumsformat als String
  location?: string;
  isOnline?: boolean;
  meetingLink?: string;
  createdAt?: string; // Hinzugefügte Eigenschaft
  updatedAt?: string; // Hinzugefügte Eigenschaft
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
