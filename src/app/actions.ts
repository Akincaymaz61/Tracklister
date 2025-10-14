"use server";

import { z } from "zod";
import { getTrackListFlow } from "@/ai/flows/get-track-list-flow";
import { getYoutubeTrackListFlow } from "@/ai/flows/get-yt-track-list-flow";

const spotifyFormSchema = z.object({
  playlistUrl: z.string().min(1, { message: "Please enter a URL." }),
});

const youtubeFormSchema = z.object({
    playlistUrl: z.string().min(1, { message: "Please enter a URL." }),
});

type Track = {
  title: string;
  artist: string;
  album: string;
  duration: number;
  releaseDate: string;
  albumArtUrl?: string;
  explicit: boolean;
};

type Playlist = {
    name: string;
    owner: string;
    imageUrl?: string;
    total: number;
    tracks: Track[];
}


export async function getTrackList(playlistUrl: string): Promise<{ data?: Playlist; error?: string }> {
  try {
    const validatedUrl = spotifyFormSchema.safeParse({ playlistUrl });
    if (!validatedUrl.success) {
      return { error: "Invalid URL provided. Please enter a complete and valid URL." };
    }
    
    const playlist = await getTrackListFlow(validatedUrl.data.playlistUrl);

    return { data: playlist };
  } catch (error) {
    console.error(error);
    if (error instanceof Error) {
        // Provide a more user-friendly error message
        if (error.message.includes('Authentication failed')) {
            return { error: "Could not authenticate with Spotify. Please check your API credentials in the .env file."};
        }
        if (error.message.includes('Failed to fetch playlist')) {
            return { error: "Could not fetch the playlist. Please ensure the URL is correct and the playlist is public." };
        }
        return { error: `An unexpected error occurred: ${error.message}` };
    }
    return { error: "An unexpected error occurred. Please try again later." };
  }
}

export async function getYoutubeTrackList(playlistUrl: string): Promise<{ data?: Playlist; error?: string }> {
    return { error: "YouTube Music feature is temporarily disabled due to a technical issue. We are working on it." };
}
