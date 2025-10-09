"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Loader2, Music, ListMusic, Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { getTrackList } from "./actions";

const formSchema = z.object({
  playlistUrl: z.string().url({ message: "Please enter a valid Spotify playlist URL." }),
});

type Track = {
  title: string;
  artist: string;
};

export default function Home() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      playlistUrl: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setTracks([]);

    const result = await getTrackList(values.playlistUrl);

    if (result.error) {
      toast({
        variant: "destructive",
        title: "An error occurred",
        description: result.error,
      });
    } else if (result.data) {
      setTracks(result.data);
    }
    
    setIsLoading(false);
  }

  function downloadTrackList() {
    const fileContent = tracks
      .map((track) => `${track.title} - ${track.artist}`)
      .join("\n");
    const blob = new Blob([fileContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "spotify-playlist.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
  
  return (
    <main className="flex min-h-screen flex-col items-center p-4 sm:p-8 md:p-12 lg:p-24 bg-background">
      <div className="z-10 w-full max-w-4xl items-center justify-center font-headline text-center">
        <div className="flex items-center justify-center gap-4 mb-4">
          <div className="p-3 rounded-full bg-accent/20 text-accent">
            <Music className="w-12 h-12" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground">
            Track Lister
          </h1>
        </div>
        <p className="text-lg text-muted-foreground mb-8">
          Paste your Spotify playlist URL to instantly get a list of songs and artists.
        </p>
      </div>

      <Card className="w-full max-w-2xl shadow-lg rounded-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <ListMusic className="w-6 h-6 text-accent" />
            Import Playlist
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="playlistUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Spotify Playlist URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://open.spotify.com/playlist/..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  "Get Track List"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {tracks.length > 0 && (
        <div className="w-full max-w-2xl mt-8">
          <Card className="shadow-lg rounded-lg">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-xl">Your Tracks</CardTitle>
                <Button variant="outline" size="sm" onClick={downloadTrackList}>
                  <Download className="mr-2 h-4 w-4" />
                  Download .txt
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ul className="divide-y divide-border">
                {tracks.map((track, index) => (
                  <li 
                    key={index}
                    className="p-4 flex items-center gap-4 animate-fade-in opacity-0"
                    style={{ animationDelay: `${index * 75}ms` }}
                  >
                    <div className="bg-primary text-primary-foreground rounded-full h-10 w-10 flex-shrink-0 flex items-center justify-center font-bold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{track.title}</p>
                      <p className="text-sm text-muted-foreground">{track.artist}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      )}
    </main>
  );
}
