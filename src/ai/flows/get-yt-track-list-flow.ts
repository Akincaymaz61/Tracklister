"use server";
/**
 * @fileOverview A flow for extracting track information from a YouTube Music playlist URL using Genkit AI.
 * - getYoutubeTrackListFlow - A function that takes a YouTube Music playlist URL and returns a list of tracks.
 */

import { ai } from "@/ai/genkit";
import { z } from "zod";

// Schema for a single track
const TrackSchema = z.object({
  title: z.string().describe("The title of the track."),
  artist: z.string().describe("The primary artist of the track."),
});

// Schema for the entire playlist structure that the AI will return
const PlaylistSchema = z.object({
  name: z.string().describe("The name of the playlist."),
  owner: z.string().describe("The owner of the playlist."),
  imageUrl: z.string().optional().describe("The URL of the playlist's cover image."),
  total: z.number().describe("Total number of tracks in the playlist."),
  tracks: z.array(TrackSchema),
});

export type YoutubePlaylist = z.infer<typeof PlaylistSchema>;

export async function getYoutubeTrackListFlow(
  playlistUrl: string
): Promise<YoutubePlaylist> {
  return getYoutubeTrackListFlow_flow(playlistUrl);
}

// Define the Genkit prompt. This is where the magic happens.
const youtubePlaylistPrompt = ai.definePrompt({
    name: "youtubePlaylistExtractor",
    input: { schema: z.string() },
    output: { schema: PlaylistSchema },
    prompt: `You are an expert at parsing web pages. Analyze the content of the provided YouTube Music playlist URL and extract the playlist details.
    
    From the URL, you must extract:
    1.  The playlist name.
    2.  The name of the playlist owner/creator.
    3.  A URL for the playlist's cover image (if available).
    4.  The total number of tracks.
    5.  A list of all tracks, where each track includes a 'title' and an 'artist'.

    Return the information in a valid JSON object that matches the specified output schema.
    
    Playlist URL: {{{input}}}`,
    config: {
        // Use a powerful model for better parsing accuracy
        model: "gemini-1.5-pro-latest"
    }
});


const getYoutubeTrackListFlow_flow = ai.defineFlow(
  {
    name: "getYoutubeTrackListFlow",
    inputSchema: z.string(),
    outputSchema: PlaylistSchema,
  },
  async (playlistUrl) => {
    // A simple check for a valid URL structure.
    if (!playlistUrl || !playlistUrl.startsWith('http')) {
        throw new Error("Invalid YouTube Music playlist URL provided.");
    }
    
    try {
        // Call the AI prompt with the playlist URL.
        const { output } = await youtubePlaylistPrompt(playlistUrl);

        if (!output) {
            throw new Error("The AI model could not extract playlist data. The playlist might be empty, private, or the URL is incorrect.");
        }
        
        // The output should already match the PlaylistSchema, so we can return it directly.
        return output;

    } catch (error) {
        console.error("Error in getYoutubeTrackListFlow:", error);
        // Re-throw a more user-friendly error.
        throw new Error("Failed to process the YouTube Music playlist with AI. Please try again.");
    }
  }
);
