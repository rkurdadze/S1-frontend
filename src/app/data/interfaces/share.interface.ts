export interface ShareRequest {
    platform: 'facebook' | 'instagram';
    destination: 'feed' | 'story';
    caption: string;
    url: string;
    images: string[];
    colorName?: string | null;
    itemName?: string;
    description?: string;
    price?: number;
    itemId?: number;
}

export interface ShareResponse {
    shareUrl: string;
    expiresAt?: string;
}
