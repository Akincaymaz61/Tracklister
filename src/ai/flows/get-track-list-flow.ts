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
    const rawHtml = await fetchHtml(playlistUrl);
    // Pre-process the HTML to extract only the relevant part for the tracks.
    // This helps the model focus and avoid issues with large HTML files.
    const mainContentRegex = /<main[^>]*>([\s\S]*?)<\/main>/;
    const mainContentMatch = rawHtml.match(mainContentRegex);
    const processedHtml = mainContentMatch ? mainContentMatch[1] : rawHtml;

    const prompt = `You are an expert at parsing HTML to extract data.
      Below is a snippet of HTML from a Spotify playlist page's main content area.
      Please extract the title and artist for **ALL** tracks in this snippet.
      It is critical that you return every single track and do not truncate the list.

      HTML Snippet:
      \`\`\`html
      ${processedHtml}
      \`\`\`
    `;

    // We are not awaiting the result of the generation
    // to avoid blocking the main thread.
    const { output } = await ai.generate({
      prompt: prompt,
      output: {
        schema: TrackListSchema,
      },
      config: {
        temperature: 0.1,
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
