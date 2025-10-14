"use server";
/**
 * @fileOverview A flow for extracting track information from a YouTube Music playlist URL.
 * This file has been rewritten from scratch to be more robust and reliable.
 * - getYoutubeTrackListFlow - A function that takes a YouTube Music playlist URL and returns a list of tracks.
 */

import { ai } from "@/ai/genkit";
import { z } from "zod";
import { getYouTubeMusicClient } from "@/lib/ytmusic";

// Schema definition remains simple as requested: just title and artist.
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

/**
 * Extracts the playlist ID from a YouTube Music URL.
 * This version is robust and handles various URL formats, including those with extra parameters.
 * @param url The full YouTube Music playlist URL.
 * @returns The playlist ID string, or null if not found.
 */
function getPlaylistIdFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    // The playlist ID is always in the 'list' search parameter.
    return urlObj.searchParams.get('list');
  } catch (error) {
    console.error('Invalid URL provided to getPlaylistIdFromUrl:', error);
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
      throw new Error("Invalid YouTube Music playlist URL. Please check the link and try again.");
    }
    
    const ytMusic = await getYouTubeMusicClient();
    const playlist = await ytMusic.getPlaylist(playlistId);

    if (!playlist || !playlist.videos) {
      throw new Error("Could not retrieve playlist videos. The playlist might be empty or unavailable.");
    }

    const formattedTracks = playlist.videos
      // 1. Filter out any tracks that are undefined or don't have a title. This prevents crashes.
      .filter((track: any) => track && track.title)
      .map((track: any) => {
        let artistName = 'Unknown Artist';
        
        // 2. Robustly determine the artist name.
        // The library is inconsistent; sometimes it's in `artists`, sometimes in `author`.
        if (track.artists && Array.isArray(track.artists) && track.artists.length > 0) {
            // Prefer the `artists` array if it exists and is not empty.
            artistName = track.artists.map((a: any) => a.name).join(', ');
        } else if (track.author) {
            // Fallback to the `author` field.
            artistName = Array.isArray(track.author) ? track.author.join(', ') : track.author;
        }

        return {
          title: track.title,
          artist: artistName,
        };
      });

    // Construct the final playlist object to be returned.
    return {
        name: playlist.info.title || 'YouTube Music Playlist',
        owner: playlist.info.author || 'Unknown Owner',
        imageUrl: playlist.info.thumbnails?.at(-1)?.url, // Get the highest resolution thumbnail
        total: playlist.info.total_item_count || formattedTracks.length,
        tracks: formattedTracks,
    };
  }
);
