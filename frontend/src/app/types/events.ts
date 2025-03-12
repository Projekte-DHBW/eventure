type CreateEvent = {
    title: string;
    description: string;
    visibility: "public" | "private" | "unlisted";
    category: "music" | "sports" | "culture" | "other";
    coverImageUrl?: string;
    maxParticipants?: number;
}

type UpdateEvent = Partial<CreateEvent>