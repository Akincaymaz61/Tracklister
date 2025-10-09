"use server";

import { z } from "zod";
import { getTrackListFlow } from "@/ai/flows/get-track-list-flow";

const formSchema = z.object({
  playlistUrl: z.string().url(),
});

type Track = {
  title: string;
  artist: string;
};


export async function getTrackList(playlistUrl: string): Promise<{ data?: Track[]; error?: string }> {
  try {
    const validatedUrl = formSchema.safeParse({ playlistUrl });
    if (!validatedUrl.success) {
      return { error: "Invalid URL provided. Please enter a complete and valid URL." };
    }
    
    const tracks = await getTrackListFlow(validatedUrl.data.playlistUrl);

    return { data: tracks };
  } catch (error) {
    console.error(error);
    if (error instanceof Error) {
        // Provide a more user-friendly error message
        if (error.message.includes('Authentication failed')) {
            return { error: "Could not authenticate with Spotify. Please check your API credentials in the .env file."};
        }
        return { error: `An unexpected error occurred: ${error.message}` };
    }
    return { error: "An unexpected error occurred. Please try again later." };
  }
}
