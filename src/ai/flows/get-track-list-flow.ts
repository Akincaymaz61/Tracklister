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
  album: z.string().describe("The album name."),
  duration: z.number().describe("The duration of the track in milliseconds."),
  releaseDate: z.string().describe("The release date of the album."),
  albumArtUrl: z.string().optional().describe("The URL of the album art."),
});

const PlaylistSchema = z.object({
  name: z.string().describe("The name of the playlist."),
  owner: z.string().describe("The owner of the playlist."),
  imageUrl: z.string().optional().describe("The URL of the playlist's cover image."),
  total: z.number().describe("Total number of tracks in the playlist."),
  tracks: z.array(TrackSchema),
});


export async function getTrackListFlow(
  playlistUrl: string
): Promise<z.infer<typeof PlaylistSchema>> {
  return getTrackListFlow_flow(playlistUrl);
}

// Helper function to extract playlist ID from URL
function getPlaylistIdFromUrl(url: string): string | null {
  try {
    const { pathname } = new URL(url);
    const pathParts = pathname.split('/').filter(Boolean); // filter Boolean removes empty strings
    const playlistIndex = pathParts.indexOf('playlist');
    
    if (playlistIndex > -1 && pathParts[playlistIndex + 1]) {
      // Return only the ID, stripping any query params
      return pathParts[playlistIndex + 1].split('?')[0];
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
    outputSchema: PlaylistSchema,
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
        album: item.track.album.name,
        duration: item.track.duration_ms,
        releaseDate: item.track.album.release_date,
        albumArtUrl: item.track.album.images?.[0]?.url,
    }));

    return {
        name: playlist.name,
        owner: playlist.owner,
        imageUrl: playlist.imageUrl,
        total: playlist.total,
        tracks: tracks,
    };
  }
);