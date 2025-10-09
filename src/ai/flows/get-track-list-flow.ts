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
    const path = new URL(url).pathname;
    const parts = path.split('/');
    const playlistIndex = parts.findIndex(p => p === 'playlist');
    if (playlistIndex !== -1 && parts[playlistIndex + 1]) {
      return parts[playlistIndex + 1];
    }
    return null;
  } catch (error) {
    console.error("Invalid URL:", error);
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
    const response = await spotify.getPlaylist(playlistId);

    const tracks = response.tracks.items.map((item: any) => ({
        title: item.track.name,
        artist: item.track.artists.map((artist: any) => artist.name).join(', '),
    }));

    return tracks;
  }
);
