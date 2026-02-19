
const TMDB_API_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500'; // w500 is a good size for the modal

export interface TmdbPersonResult {
    imageUrl: string | null;
    error?: string;
}

interface TmdbSearchResponse {
    results: {
        id: number;
        name: string;
        profile_path: string | null;
        [key: string]: any;
    }[];
}

/**
 * Searches for a person (celebrity) on TMDB and returns their profile image URL.
 * @param accessToken TMDB API Read Access Token (v4)
 * @param query Person's name (e.g. "Taylor Swift")
 * @returns Promise<TmdbPersonResult>
 */
export const searchPerson = async (accessToken: string, query: string): Promise<TmdbPersonResult> => {
    if (!accessToken) {
        return { imageUrl: null, error: 'TMDB Access Token is missing' };
    }

    try {
        const url = `${TMDB_API_URL}/search/person?query=${encodeURIComponent(query)}&include_adult=false&language=en-US&page=1`;

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'accept': 'application/json'
            }
        });

        if (!response.ok) {
            return { imageUrl: null, error: `TMDB API Error: ${response.status} ${response.statusText}` };
        }

        const data: TmdbSearchResponse = await response.json();

        if (data.results && data.results.length > 0) {
            const person = data.results[0];
            if (person.profile_path) {
                return { imageUrl: `${IMAGE_BASE_URL}${person.profile_path}` };
            } else {
                return { imageUrl: null, error: 'Person found, but no image available' };
            }
        }

        return { imageUrl: null, error: 'No results found on TMDB' };

    } catch (error) {
        return { imageUrl: null, error: `Network Error: ${error instanceof Error ? error.message : String(error)}` };
    }
};

export const testTmdbConnection = async (accessToken: string): Promise<{ success: boolean; message?: string }> => {
    try {
        const url = `${TMDB_API_URL}/authentication`;
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'accept': 'application/json'
            }
        });

        if (response.ok) {
            return { success: true, message: 'Connection Successful' };
        } else {
            return { success: false, message: `Access Denied: ${response.status}` };
        }
    } catch (error) {
        return { success: false, message: `Connection Failed: ${error instanceof Error ? error.message : String(error)}` };
    }
};
