import axios from 'axios';

const API_KEY = process.env.GOOGLE_BOOKS_API_KEY;
const BASE_URL = "https://www.googleapis.com/books/v1/volumes";

function normalizeGoogleImageUrl(url?: string | null) {
    if (!url) {
        return null;
    }

    if (url.startsWith('//')) {
        return `https:${url}`;
    }

    if (url.startsWith('http://')) {
        return url.replace(/^http:\/\//, 'https://');
    }

    return url;
}

function normalizeGoogleBookItem<T extends { volumeInfo?: { imageLinks?: { thumbnail?: string; smallThumbnail?: string } } }>(item: T): T {
    const imageLinks = item.volumeInfo?.imageLinks;

    if (!imageLinks) {
        return item;
    }

    return {
        ...item,
        volumeInfo: {
            ...item.volumeInfo,
            imageLinks: {
                ...imageLinks,
                thumbnail: normalizeGoogleImageUrl(imageLinks.thumbnail) ?? undefined,
                smallThumbnail: normalizeGoogleImageUrl(imageLinks.smallThumbnail) ?? undefined
            }
        }
    };
}

export const fetchFromGoogle = async (query: string) => {
    const params: Record<string, string> = { q: query };

    if (API_KEY) {
        params.key = API_KEY;
    }

    const response = await axios.get(BASE_URL, { params });
    return (response.data.items ?? []).map(normalizeGoogleBookItem);
};