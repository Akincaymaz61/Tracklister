import { Innertube, UniversalCache } from 'youtubei.js';

class YouTubeMusicClient {
  private client: Innertube;

  constructor(client: Innertube) {
    this.client = client;
  }

  public async getPlaylist(playlistId: string): Promise<any> {
    try {
      // The getPlaylist method itself returns enough information.
      // Calling getVideos() and then getInfo() for each is inefficient and can cause errors.
      const playlist = await this.client.music.getPlaylist(playlistId);
      
      // The videos property on the playlist object already contains the tracks.
      return {
        info: playlist.info,
        videos: playlist.videos
      };
      
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
  
  const yt = await Innertube.create({ cache: new UniversalCache() });
  ytMusicClient = new YouTubeMusicClient(yt);
  return ytMusicClient;
}
