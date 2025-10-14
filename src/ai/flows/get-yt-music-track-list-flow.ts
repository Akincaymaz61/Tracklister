"use server";
/**
 * @fileOverview A flow for extracting track information from a YouTube Music playlist URL.
 *
 * - getYtMusicTrackListFlow - A function that takes a YouTube Music playlist URL and returns a list of tracks.
 */

import { ai } from "@/ai/genkit";
import { z } from "genkit";
import { chromium } from "playwright";

const TrackSchema = z.object({
  title: z.string().describe("The title of the track."),
  artist: z.string().describe("The primary artist of the track."),
  album: z.string().optional().describe("The album name."),
  duration: z.number().describe("The duration of the track in milliseconds."),
  releaseDate: z.string().optional().describe("The release date of the album."),
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

// Helper to convert MM:SS to milliseconds
function durationToMs(durationStr: string | null): number {
    if (!durationStr) return 0;
    const parts = durationStr.split(':').map(Number);
    let ms = 0;
    if (parts.length === 2) { // MM:SS
        ms = (parts[0] * 60 + parts[1]) * 1000;
    } else if (parts.length === 3) { // HH:MM:SS
        ms = (parts[0] * 3600 + parts[1] * 60 + parts[2]) * 1000;
    }
    return ms;
}

export async function getYtMusicTrackListFlow(
  playlistUrl: string
): Promise<z.infer<typeof PlaylistSchema>> {
  const browser = await chromium.launch();
  const page = await browser.new_page();

  try {
    await page.goto(playlistUrl);
    await page.waitForSelector('ytmusic-playlist-shelf-renderer');

    const playlistName = await page.locator('ytmusic-detail-header-renderer .title').innerText();
    const playlistOwner = await page.locator('ytmusic-detail-header-renderer .subtitle a').first().innerText();
    const coverImageUrl = await page.locator('ytmusic-detail-header-renderer img').getAttribute('src');

    const tracks = await page.locator('ytmusic-playlist-shelf-renderer #contents .ytmusic-playlist-shelf-renderer').all();

    const formattedTracks = [];
    for (const track of tracks) {
      const title = await track.locator('.title a').innerText();
      const artist = await track.locator('.secondary-flex-columns a').first().innerText();
      const album = await track.locator('.secondary-flex-columns a').nth(1).innerText().catch(() => undefined);
      const durationStr = await track.locator('.fixed-columns .secondary-flex-columns').innerText();

      formattedTracks.push({
        title,
        artist,
        album,
        duration: durationToMs(durationStr),
        releaseDate: undefined, // YT Music doesn't easily expose this on the playlist page
        albumArtUrl: await track.locator('img').getAttribute('src') || undefined,
        explicit: false, // YT Music doesn't flag explicit content in the same way
      });
    }

    return {
      name: playlistName,
      owner: playlistOwner,
      imageUrl: coverImageUrl || undefined,
      total: formattedTracks.length,
      tracks: formattedTracks,
    };
  } finally {
    await browser.close();
  }
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
