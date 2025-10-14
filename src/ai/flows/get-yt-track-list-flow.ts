"use server";
/**
 * @fileOverview A flow for extracting track information from a YouTube Music playlist URL.
 *
 * - getYoutubeTrackListFlow - A function that takes a YouTube Music playlist URL and returns a list of tracks.
 */

import { ai } from "@/ai/genkit";
import { z } from "zod";
import { getYouTubeMusicClient } from "@/lib/ytmusic";

const TrackSchema = z.object({
  title: z.string().describe("The title of the track."),
  artist: z.string().describe("The primary artist of the track."),
  album: z.string().describe("The album name."),
  duration: z.number().describe("The duration of the track in milliseconds."),
  releaseDate: z.string().describe("The release date of the album."),
  albumArtUrl: z.string().optional().describe("The URL of the album art."),
  explicit: z.boolean().describe("Whether the track is explicit."),
});

const PlaylistSchema = z.object({
  name: z.string().describe("The name of the playlist."),
  owner: z.string().describe("The owner of the playlist."),
  imageUrl: z.string().optional().describe("The URL of the playlist's cover image."),
  total: z.number().describe("Total number of tracks in the playlist."),
  tracks: z.array(TrackSchema),
});


export async function getYoutubeTrackListFlow(
  playlistUrl: string
): Promise<z.infer<typeof PlaylistSchema>> {
  return getYoutubeTrackListFlow_flow(playlistUrl);
}

function getPlaylistIdFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    return urlObj.searchParams.get('list');
  } catch (error) {
    console.error('Invalid URL:', error);
    return null;
  }
}

const getYoutubeTrackListFlow_flow = ai.defineFlow(
  {
    name: "getYoutubeTrackListFlow",
    inputSchema: z.string(),
    outputSchema: PlaylistSchema,
  },
  async (playlistUrl) => {
    const playlistId = getPlaylistIdFromUrl(playlistUrl);

    if (!playlistId) {
      throw new Error("Invalid YouTube Music playlist URL.");
    }
    
    const ytMusic = await getYouTubeMusicClient();
    const playlist = await ytMusic.getPlaylist(playlistId);

    const formattedTracks = playlist.videos.map((track: any) => ({
        title: track.title,
        artist: track.artists?.map((a: any) => a.name).join(', ') || 'Unknown Artist',
        album: track.album?.name || 'Unknown Album',
        duration: track.duration.seconds * 1000,
        releaseDate: '', // Not easily available
        albumArtUrl: track.thumbnails?.at(-1)?.url,
        explicit: track.is_explicit || false,
    }));

    return {
        name: playlist.info.title,
        owner: playlist.info.author,
        imageUrl: playlist.info.thumbnails?.at(-1)?.url,
        total: playlist.info.total_item_count,
        tracks: formattedTracks,
    };
  }
);
