"use server";
/**
 * @fileOverview A flow for extracting track information from a Spotify playlist URL.
 *
 * - getTrackListFlow - A function that takes a Spotify playlist URL and returns a list of tracks.
 */

import { ai } from "@/ai/genkit";
import { z } from "genkit";
import { getSpotifyClient } from "@/lib/spotify";

const TrackSchema = z.object({
  title: z.string().describe("The title of the track."),
  artist: z.string().describe("The primary artist of the track."),
});

const TrackListSchema = z.array(TrackSchema);

export async function getTrackListFlow(
  playlistUrl: string
): Promise<z.infer<typeof TrackListSchema>> {
  return getTrackListFlow_flow(playlistUrl);
}

// Helper function to extract playlist ID from URL
function getPlaylistIdFromUrl(url: string): string | null {
    try {
      const { pathname } = new URL(url);
      const pathParts = pathname.split('/').filter(Boolean); // filter Boolean removes empty strings
      const playlistIndex = pathParts.indexOf('playlist');
      
      if (playlistIndex > -1 && pathParts[playlistIndex + 1]) {
        return pathParts[playlistIndex + 1];
      }
      
      return null;
    } catch (error) {
      console.error('Invalid URL:', error);
      return null;
    }
}

const getTrackListFlow_flow = ai.defineFlow(
  {
    name: "getTrackListFlow",
    inputSchema: z.string(),
    outputSchema: TrackListSchema,
  },
  async (playlistUrl) => {
    const playlistId = getPlaylistIdFromUrl(playlistUrl);

    if (!playlistId) {
      throw new Error("Invalid Spotify playlist URL.");
    }

    const spotify = await getSpotifyClient();
    const playlist = await spotify.getPlaylist(playlistId);

    const tracks = playlist.tracks.items
      .filter((item: any) => item.track) // Filter out any items without a track object
      .map((item: any) => ({
        title: item.track.name,
        artist: item.track.artists.map((artist: any) => artist.name).join(', '),
    }));

    return tracks;
  }
);
