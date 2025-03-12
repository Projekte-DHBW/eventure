export type CreateEvent = {
    title: string;
    description: string;
    visibility: "public" | "private" | "unlisted";
    category: "music" | "sports" | "culture" | "other";
    coverImageUrl?: string;
    maxParticipants?: number;
}

export type UpdateEvent = Partial<CreateEvent>