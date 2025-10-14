import { Innertube, UniversalCache } from 'youtubei.js';
import type { MusicResponsiveListItem, MusicTwoRowItem } from 'youtubei.js/dist/src/parser/nodes';

class YouTubeMusicClient {
  private client: Innertube;

  constructor(client: Innertube) {
    this.client = client;
  }

  public async getPlaylist(playlistId: string): Promise<any> {
    try {
      // Fetch basic playlist info and video IDs first
      const playlist = await this.client.music.getPlaylist(playlistId);
      
      const videos = await playlist.getVideos();

      // Now fetch details for each video
      const videoDetails = await Promise.all(
        videos.map(video => this.client.getInfo(video.id))
      );

      // We need to merge the info from the playlist view and the full getInfo response
      // because some info (like artist/album) is better on the playlist view,
      // and other info (like duration) is only on the getInfo view.
      const combinedVideos = videos.map((playlistVideo: any) => {
        const fullDetail = videoDetails.find(d => d.basic_info.id === playlistVideo.id);
        return {
          id: playlistVideo.id,
          title: playlistVideo.title,
          artists: playlistVideo.artists,
          album: playlistVideo.album,
          thumbnails: playlistVideo.thumbnails,
          is_explicit: playlistVideo.is_explicit,
          duration: { seconds: fullDetail?.basic_info.duration || 0 }
        };
      });

      return {
        info: playlist.info,
        videos: combinedVideos
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
