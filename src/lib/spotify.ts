// A simple Spotify client.
// This is not a complete implementation of the Spotify API, but it's enough for our needs.
// You can find the full API documentation here: https://developer.spotify.com/documentation/web-api/
class SpotifyClient {
  private accessToken: string | null = null;
  private tokenExpiry: number | null = null;

  constructor(
    private clientId: string,
    private clientSecret: string,
  ) {}

  private async getAccessToken(): Promise<string> {
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization:
          'Basic ' +
          Buffer.from(this.clientId + ':' + this.clientSecret).toString(
            'base64'
          ),
      },
      body: 'grant_type=client_credentials',
    });

    if (!response.ok) {
      console.error(await response.text());
      throw new Error('Authentication failed');
    }

    const data = (await response.json()) as {
      access_token: string;
      expires_in: number;
    };
    this.accessToken = data.access_token;
    this.tokenExpiry = Date.now() + data.expires_in * 1000;
    return this.accessToken;
  }

  public async getPlaylist(playlistId: string): Promise<any> {
    const token = await this.getAccessToken();
    const initialUrl = `https://api.spotify.com/v1/playlists/${playlistId}/tracks?fields=items(track(name,artists(name))),next`;

    const initialResponse = await fetch(initialUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!initialResponse.ok) {
        console.error(await initialResponse.text());
        throw new Error(`Failed to fetch playlist ${playlistId}`);
    }

    const initialData = await initialResponse.json();
    let allItems: any[] = initialData.items;
    let nextUrl: string | null = initialData.next;

    while (nextUrl) {
      const response = await fetch(nextUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        console.error(await response.text());
        // If subsequent pages fail, we can decide to either throw or return what we have.
        // For now, let's throw to indicate an incomplete list.
        throw new Error(`Failed to fetch subsequent page for playlist ${playlistId}`);
      }
      
      const data = await response.json();
      allItems = allItems.concat(data.items);
      nextUrl = data.next;
    }
    
    // The Spotify API returns a paginated list of tracks. We've fetched all pages.
    // Now we combine them into a single object that looks like a simplified playlist response.
    return { tracks: { items: allItems } };
  }
}

let spotifyClient: SpotifyClient | null = null;

export async function getSpotifyClient(): Promise<SpotifyClient> {
  if (spotifyClient) {
    return spotifyClient;
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error(
      'SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET must be set in your environment variables.'
    );
  }

  spotifyClient = new SpotifyClient(clientId, clientSecret);
  return spotifyClient;
}
