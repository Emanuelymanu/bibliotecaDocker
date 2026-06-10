export function normalizeImageUrl(url?: string | null, uploadsBaseUrl = '/upload/capa'): string {
    if (!url) {
        return '';
    }

    if (url.startsWith('data:') || url.startsWith('blob:') || url.startsWith('https://')) {
        return url;
    }

    if (url.startsWith('//')) {
        return `https:${url}`;
    }

    if (url.startsWith('http://')) {
        return url.replace(/^http:\/\//, 'https://');
    }

    return `${uploadsBaseUrl.replace(/\/$/, '')}/${url.replace(/^\//, '')}`;
}