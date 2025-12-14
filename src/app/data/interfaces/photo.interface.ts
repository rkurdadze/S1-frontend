export interface Photo {
    id?: number;         // Уникальный идентификатор фото
    name: string;       // Название фото
    image: string;      // Base64 или URL фото
    colorId?: number;
    colorName?: string;
}
