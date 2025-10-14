// import YTMusic from 'ytmusic-api';

class YouTubeMusicClient {
  private client: any; //YTMusic;

  constructor() {
    // this.client = new YTMusic();
  }

  public async initialize() {
    // await this.client.initialize();
  }

  public async getPlaylist(playlistId: string): Promise<any> {
    try {
      // const playlist = await this.client.getPlaylist(playlistId);
      // return playlist;
      console.log("YouTube Music support is temporarily disabled.");
      return Promise.resolve({ tracks: [] });
    } catch (error) {
      console.error(`Failed to fetch YouTube Music playlist ${playlistId}:`, error);
      throw new Error('Invalid YouTube Music playlist URL or failed to fetch details.');
    }
  }
}

let ytMusicClient: YouTubeMusicClient | null = null;

export async function getYouTubeMusicClient(): Promise<YouTubeMusicClient> {
  if (ytMusicClient) {
    return ytMusicClient;
  }
  
  ytMusicClient = new YouTubeMusicClient();
  await ytMusicClient.initialize();
  return ytMusicClient;
}
