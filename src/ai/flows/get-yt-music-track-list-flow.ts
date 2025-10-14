"use server";
/**
 * @fileOverview A flow for extracting track information from a YouTube Music playlist URL.
 *
 * - getYtMusicTrackListFlow - A function that takes a YouTube Music playlist URL and returns a list of tracks.
 */

import { ai } from "@/ai/genkit";
import { z } from "genkit";

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

// Helper function to extract playlist ID from URL
function getPlaylistIdFromUrl(url: string): string | null {
  try {
    const { searchParams } = new URL(url);
    return searchParams.get('list');
  } catch (error) {
    console.error('Invalid URL:', error);
    return null;
  }
}

export async function getYtMusicTrackListFlow(
  playlistUrl: string
): Promise<z.infer<typeof PlaylistSchema>> {
  const playlistId = getPlaylistIdFromUrl(playlistUrl);

  if (!playlistId) {
    // In a real implementation, you'd throw an error.
    // For this mock, we'll return a playlist indicating the issue.
    return {
      name: "Invalid YouTube Music URL",
      owner: "System",
      total: 0,
      tracks: [],
    };
  }

  // Simulate network delay for a more realistic experience
  await new Promise(resolve => setTimeout(resolve, 1500));

  // Return more detailed and realistic mock data
  return {
    name: "Mocked YouTube Music Playlist",
    owner: "YT Mock User",
    imageUrl: `https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg`, // A classic choice
    total: 5,
    tracks: [
      {
        title: "Never Gonna Give You Up",
        artist: "Rick Astley",
        album: "Whenever You Need Somebody",
        duration: 213000,
        releaseDate: "1987-07-27",
        albumArtUrl: `https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg`,
        explicit: false,
      },
      {
        title: "Bohemian Rhapsody",
        artist: "Queen",
        album: "A Night at the Opera",
        duration: 355000,
        releaseDate: "1975-10-31",
        albumArtUrl: "https://i.ytimg.com/vi/fJ9rUzIMcZQ/hqdefault.jpg",
        explicit: false,
      },
      {
        title: "Smells Like Teen Spirit",
        artist: "Nirvana",
        album: "Nevermind",
        duration: 301000,
        releaseDate: "1991-09-10",
        albumArtUrl: "https://i.ytimg.com/vi/hTWKbfoikeg/hqdefault.jpg",
        explicit: false,
      },
      {
        title: "WAP (feat. Megan Thee Stallion)",
        artist: "Cardi B",
        album: "WAP (feat. Megan Thee Stallion)",
        duration: 187000,
        releaseDate: "2020-08-07",
        albumArtUrl: "https://i.ytimg.com/vi/hsm4poTWjMs/hqdefault.jpg",
        explicit: true,
      },
      {
        title: "Blinding Lights",
        artist: "The Weeknd",
        album: "After Hours",
        duration: 200000,
        releaseDate: "2019-11-29",
        albumArtUrl: "https://i.ytimg.com/vi/4NRXx6U8ABQ/hqdefault.jpg",
        explicit: false,
      },
    ],
  };
}

const getYtMusicTrackListFlow_flow = ai.defineFlow(
  {
    name: "getYtMusicTrackListFlow",
    inputSchema: z.string(),
    outputSchema: PlaylistSchema,
  },
  async (playlistUrl) => {
    return getYtMusicTrackListFlow(playlistUrl);
  }
);
