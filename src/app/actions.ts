"use server";

import { z } from "zod";
import { getTrackListFlow } from "@/ai/flows/get-track-list-flow";
import { getYoutubeTrackListFlow } from "@/ai/flows/get-yt-track-list-flow";

const formSchema = z.object({
  playlistUrl: z.string().min(1, { message: "Please enter a URL." }),
});

type Track = {
  title: string;
  artist: string;
};

type Playlist = {
    name: string;
    owner: string;
    imageUrl?: string;
    total: number;
    tracks: Track[];
}

async function handlePlaylistRequest(
    playlistUrl: string, 
    flow: (url: string) => Promise<Playlist>,
    platformName: "Spotify" | "YouTube Music"
): Promise<{ data?: Playlist; error?: string }> {
    try {
        const validatedUrl = formSchema.safeParse({ playlistUrl });
        if (!validatedUrl.success) {
            return { error: "Invalid URL provided. Please enter a complete and valid URL." };
        }
        
        const playlist = await flow(validatedUrl.data.playlistUrl);
        return { data: playlist };

    } catch (error) {
        console.error(error);
        if (error instanceof Error) {
            if (error.message.includes('Authentication failed')) {
                return { error: `Could not authenticate with ${platformName}. Please check your API credentials.`};
            }
            if (error.message.includes('fetch') || error.message.includes('private') || error.message.includes('Invalid')) {
                return { error: `Could not process the playlist from ${platformName}. Please ensure the URL is correct and the playlist is public.` };
            }
            return { error: `An unexpected error occurred with ${platformName}: ${error.message}` };
        }
        return { error: `An unexpected error occurred. Please try again later.` };
    }
}


export async function getTrackList(playlistUrl: string): Promise<{ data?: Playlist; error?: string }> {
    return handlePlaylistRequest(playlistUrl, getTrackListFlow, "Spotify");
}

export async function getYoutubeTrackList(playlistUrl: string): Promise<{ data?: Playlist; error?: string }> {
    return handlePlaylistRequest(playlistUrl, getYoutubeTrackListFlow, "YouTube Music");
}
