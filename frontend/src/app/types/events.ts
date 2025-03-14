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

export type EventManager = {
  userId: string;
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
  managers?: EventManager[];
  invitations?: Invitation[];
};

export type UpdateEvent = Partial<CreateEvent>;

export interface Event {
  id: string; // Add this property
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
  creator?: string; // User ID of creator
  creatorObj?: {
    // Optional creator object
    id: string;
    firstName: string;
    lastName: string;
  };
  // Additional properties for populated relations
  occurrences?: EventOccurrence[];
  managers?: EventManager[];
  invitations?: Invitation[];
  // Add any other properties your backend returns
}
