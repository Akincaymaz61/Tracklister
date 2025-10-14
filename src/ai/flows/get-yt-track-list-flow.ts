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

    if (!playlist || !playlist.videos) {
      throw new Error("Could not retrieve playlist videos.");
    }

    const formattedTracks = playlist.videos
      .filter((track: any) => track && track.title) // Filter out any undefined/null tracks or tracks without a title
      .map((track: any) => {
        let artistName = 'Unknown Artist';
        if (track.artists && track.artists.length > 0) {
            artistName = track.artists.map((a: any) => a.name).join(', ');
        } else if (track.author) {
            artistName = Array.isArray(track.author) ? track.author.join(', ') : track.author;
        }

        return {
          title: track.title,
          artist: artistName,
        }
      });

    return {
        name: playlist.info.title || 'YouTube Music Playlist',
        owner: playlist.info.author || 'Unknown Owner',
        imageUrl: playlist.info.thumbnails?.at(-1)?.url,
        total: playlist.info.total_item_count || formattedTracks.length,
        tracks: formattedTracks,
    };
  }
);
