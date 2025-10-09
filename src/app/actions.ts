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

async function fetchPlaylistData(playlistUrl: string): Promise<Track[]> {
  console.log(`Fetching playlist from: ${playlistUrl}`);
  return await getTrackListFlow(playlistUrl);
}


export async function getTrackList(playlistUrl: string): Promise<{ data?: Track[]; error?: string }> {
  try {
    const validatedUrl = formSchema.safeParse({ playlistUrl });
    if (!validatedUrl.success) {
      return { error: "Invalid URL provided. Please enter a complete and valid URL." };
    }
    
    const tracks = await fetchPlaylistData(validatedUrl.data.playlistUrl);

    if (!tracks || tracks.length === 0) {
      return { error: "Could not find any tracks in the playlist. It might be empty or private." };
    }

    return { data: tracks };
  } catch (error) {
    console.error(error);
    return { error: "An unexpected error occurred. Please try again later." };
  }
}
