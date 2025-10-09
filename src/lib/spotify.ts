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
    const fields =
      'name,owner.display_name,images,tracks.total,tracks.next,tracks.items(track(name,artists(name),album(name,release_date,images),duration_ms,explicit))';
    
    let url = `https://api.spotify.com/v1/playlists/${playlistId}?fields=${fields}`;
    
    const initialResponse = await fetch(url, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!initialResponse.ok) {
        console.error(await initialResponse.text());
        throw new Error(`Failed to fetch playlist ${playlistId}`);
    }
    
    const data = await initialResponse.json();

    const playlistData = {
        name: data.name,
        owner: data.owner.display_name,
        imageUrl: data.images?.[0]?.url,
        total: data.tracks.total,
    };
    
    let allItems = data.tracks.items;
    let nextUrl = data.tracks.next;

    // Fetch subsequent pages if they exist
    while (nextUrl) {
      const response = await fetch(nextUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        console.error(await response.text());
        // In case of an error on a subsequent page, we stop and return what we have so far.
        console.error(`Failed to fetch next page for playlist ${playlistId}. Partial data will be returned.`);
        nextUrl = null; 
      } else {
        const pageData = await response.json();
        allItems = allItems.concat(pageData.items);
        nextUrl = pageData.next;
      }
    }
    
    return { ...playlistData, tracks: { items: allItems } };
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
