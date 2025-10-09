"use server";

import { z } from "zod";

const formSchema = z.object({
  playlistUrl: z.string().url(),
});

type Track = {
  title: string;
  artist: string;
};

// This is a mock function. In a real application, you would
// use the Genkit AI flow to fetch and parse the playlist data.
async function fetchPlaylistData(playlistUrl: string): Promise<Track[]> {
  console.log(`Fetching playlist from: ${playlistUrl}`);
  
  // Simulate network delay to mimic an AI call
  await new Promise(resolve => setTimeout(resolve, 1500));

  // In a real application, this is where you would call your AI flow, for example:
  // import { getTrackListFlow } from '@/ai/flows/get-track-list';
  // return await getTrackListFlow(playlistUrl);
  //
  // For demonstration purposes, we return mock data.
  return [
    { title: "Bohemian Rhapsody", artist: "Queen" },
    { title: "Stairway to Heaven", artist: "Led Zeppelin" },
    { title: "Hotel California", artist: "Eagles" },
    { title: "Like a Rolling Stone", artist: "Bob Dylan" },
    { title: "Smells Like Teen Spirit", artist: "Nirvana" },
    { title: "Imagine", artist: "John Lennon" },
    { title: "One", artist: "U2" },
    { title: "Billie Jean", artist: "Michael Jackson" },
    { title: "Hey Jude", artist: "The Beatles" },
    { title: "Sweet Child O' Mine", artist: "Guns N' Roses" },
  ].sort(() => 0.5 - Math.random()); // Randomize for variety
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
