"use server";
/**
 * @fileOverview A flow for extracting track information from a Spotify playlist URL.
 *
 * - getTrackListFlow - A function that takes a Spotify playlist URL and returns a list of tracks.
 */

import { ai } from "@/ai/genkit";
import { z } from "genkit";

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

const getTrackListFlow_flow = ai.defineFlow(
  {
    name: "getTrackListFlow",
    inputSchema: z.string(),
    outputSchema: TrackListSchema,
  },
  async (playlistUrl) => {
    const prompt = `You are an expert at parsing HTML to extract data.
      Below is the HTML from a Spotify playlist page.
      Please extract the title and artist for each track in the playlist.

      HTML:
      \`\`\`html
      ${await fetchHtml(playlistUrl)}
      \`\`\`
    `;

    const { output } = await ai.generate({
      prompt: prompt,
      output: {
        schema: TrackListSchema,
      },
    });

    return output ?? [];
  }
);

async function fetchHtml(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch playlist HTML: ${response.status} ${response.statusText}`);
    }
    return await response.text();
  } catch (e) {
    console.error(e);
    if (e instanceof Error) {
        throw new Error(`Failed to fetch playlist HTML: ${e.message}`);
    }
    throw new Error('An unknown error occurred while fetching the playlist HTML.');
  }
}
