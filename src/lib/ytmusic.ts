"use server";

import { Innertube, UniversalCache } from 'youtubei.js';

class YouTubeMusicClient {
  private client: Innertube;

  constructor(client: Innertube) {
    this.client = client;
  }

  /**
   * Fetches a YouTube Music playlist using its ID.
   * This method is designed to be robust and uses the most direct way to get playlist info
   * from the youtubei.js library.
   * @param playlistId The ID of the playlist.
   * @returns The playlist data.
   */
  public async getPlaylist(playlistId: string): Promise<any> {
    try {
      // getPlaylist is the most reliable method for this purpose.
      // It fetches playlist info and a list of videos in a single call.
      const playlist = await this.client.music.getPlaylist(playlistId);
      return playlist;
      
    } catch (error) {
      console.error(`Failed to fetch YouTube Music playlist ${playlistId}:`, error);
      // Re-throw a more user-friendly error to be caught by the action handler.
      throw new Error('Invalid YouTube Music playlist URL or the playlist is private/unavailable.');
    }
  }
}

let ytMusicClient: YouTubeMusicClient | null = null;

export async function getYouTubeMusicClient(): Promise<YouTubeMusicClient> {
  if (ytMusicClient) {
    return ytMusicClient;
  }
  
  // Initialize the InnerTube client. Caching is enabled for performance.
  const yt = await Innertube.create({ cache: new UniversalCache() });
  ytMusicClient = new YouTubeMusicClient(yt);
  return ytMusicClient;
}
