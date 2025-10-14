"use server";

import { z } from "zod";
import { getTrackListFlow } from "@/ai/flows/get-track-list-flow";
import { getYtMusicTrackListFlow } from "@/ai/flows/get-yt-music-track-list-flow";

const formSchema = z.object({
  playlistUrl: z.string().min(1, { message: "Please enter a URL." }),
  service: z.enum(["spotify", "youtubemusic"]),
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


export async function getTrackList(playlistUrl: string, service: "spotify" | "youtubemusic"): Promise<{ data?: Playlist; error?: string }> {
  try {
    const validatedData = formSchema.safeParse({ playlistUrl, service });
    if (!validatedData.success) {
      return { error: "Invalid data provided. Please enter a complete and valid URL." };
    }
    
    let playlist;
    switch (service) {
      case "spotify":
        playlist = await getTrackListFlow(validatedData.data.playlistUrl);
        break;
      case "youtubemusic":
        playlist = await getYtMusicTrackListFlow(validatedData.data.playlistUrl);
        break;
      default:
        return { error: "Invalid service selected." };
    }

    return { data: playlist };
  } catch (error) {
    console.error(error);
    if (error instanceof Error) {
        // Provide a more user-friendly error message
        if (error.message.includes('Authentication failed')) {
            return { error: "Could not authenticate with the selected service. Please check your API credentials in the .env file."};
        }
        if (error.message.includes('Failed to fetch playlist')) {
            return { error: "Could not fetch the playlist. Please ensure the URL is correct and the playlist is public." };
        }
        return { error: `An unexpected error occurred: ${error.message}` };
    }
    return { error: "An unexpected error occurred. Please try again later." };
  }
}
