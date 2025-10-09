"use client";

import { useState } from "react";
import { useTheme } from "next-themes";
import Image from "next/image";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Loader2, Music, ListMusic, Download, Moon, Sun, ShieldAlert } from "lucide-react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"

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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { getTrackList } from "./actions";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";


const formSchema = z.object({
  playlistUrl: z.string().url({ message: "Please enter a valid Spotify playlist URL." }),
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

// Helper to format milliseconds into MM:SS
const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(0);
    return `${minutes}:${seconds.padStart(2, '0')}`;
};

function ThemeToggle() {
    const { theme, setTheme } = useTheme();
  
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setTheme(theme === "light" ? "dark" : "light")}
        aria-label="Toggle theme"
      >
        <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      </Button>
    );
}

export default function Home() {
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [excludeExplicit, setExcludeExplicit] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      playlistUrl: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setPlaylist(null);

    const result = await getTrackList(values.playlistUrl);

    if (result.error) {
      toast({
        variant: "destructive",
        title: "An error occurred",
        description: result.error,
      });
    } else if (result.data) {
      setPlaylist(result.data);
      if (result.data.tracks.length === 0) {
        toast({
            title: "No tracks found",
            description: "Could not find any tracks. The playlist might be empty or private.",
        });
      }
    }
    
    setIsLoading(false);
  }

  function downloadTrackList() {
    if (!playlist) return;
    const tracksToDownload = excludeExplicit
      ? playlist.tracks.filter(track => !track.explicit)
      : playlist.tracks;

    const fileContent = tracksToDownload
      .map((track) => `${track.title} - ${track.artist}`)
      .join("\n");
    const blob = new Blob([fileContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${playlist.name}-playlist.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
  
  return (
    <main className="flex min-h-screen flex-col items-center p-4 sm:p-8 md:p-12 lg:p-24 bg-background">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
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

      {playlist && playlist.tracks.length > 0 && (
        <div className="w-full max-w-4xl mt-8 flex flex-col lg:flex-row gap-8">
          <div className="lg:w-1/3">
            <Card className="shadow-lg rounded-lg sticky top-8">
                {playlist.imageUrl && (
                    <Image 
                        src={playlist.imageUrl}
                        alt={`Cover for ${playlist.name}`}
                        width={400}
                        height={400}
                        className="rounded-t-lg object-cover w-full aspect-square"
                    />
                )}
                <CardHeader>
                    <CardTitle>{playlist.name}</CardTitle>
                    <CardDescription>By {playlist.owner}</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex justify-between items-center text-sm text-muted-foreground">
                        <span>Total tracks</span>
                        <span className="font-bold">{playlist.total}</span>
                    </div>
                </CardContent>
            </Card>
          </div>
          <div className="lg:w-2/3">
            <Card className="shadow-lg rounded-lg">
                <CardHeader>
                  <div className="flex justify-between items-center">
                      <CardTitle className="text-xl">Your Tracks ({playlist.tracks.length})</CardTitle>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center space-x-2">
                          <Checkbox id="exclude-explicit" checked={excludeExplicit} onCheckedChange={(checked) => setExcludeExplicit(checked as boolean)} />
                          <Label htmlFor="exclude-explicit" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            Exclude explicit
                          </Label>
                        </div>
                        <Button variant="outline" size="sm" onClick={downloadTrackList}>
                          <Download className="mr-2 h-4 w-4" />
                          Download .txt
                        </Button>
                      </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                <div className="max-h-[600px] overflow-y-auto">
                    <ul className="divide-y divide-border">
                        {playlist.tracks.filter(track => !(excludeExplicit && track.explicit)).map((track, index) => (
                        <li 
                            key={index}
                            className="p-3 flex items-center gap-4 animate-fade-in opacity-0"
                            style={{ animationDelay: `${index * 30}ms` }}
                        >
                            {track.albumArtUrl ? (
                                <Image 
                                    src={track.albumArtUrl}
                                    alt={`Album art for ${track.album}`}
                                    width={48}
                                    height={48}
                                    className="rounded-md w-12 h-12 flex-shrink-0"
                                />
                            ) : (
                                <div className="bg-muted text-muted-foreground rounded-md h-12 w-12 flex-shrink-0 flex items-center justify-center font-bold text-sm">
                                    <Music className="w-6 h-6" />
                                </div>
                            )}

                            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-x-4">
                                <div className="flex items-center gap-2">
                                    {track.explicit && (
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger>
                                            <ShieldAlert className="w-4 h-4 text-muted-foreground" />
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <p>Explicit</p>
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    )}
                                    <p className="font-semibold text-foreground truncate">{track.title}</p>
                                </div>
                                <p className="text-sm text-muted-foreground truncate sm:hidden">{track.artist}</p>
                                <div className="hidden sm:block">
                                    <p className="text-sm text-muted-foreground truncate">{track.artist}</p>
                                </div>
                                <div className="hidden sm:block">
                                    <p className="text-sm text-foreground truncate">{track.album}</p>
                                    <p className="text-xs text-muted-foreground">{track.releaseDate}</p>
                                </div>
                            </div>
                            <div className="text-sm text-muted-foreground font-mono ml-auto">
                                {formatDuration(track.duration)}
                            </div>
                        </li>
                        ))}
                    </ul>
                </div>
                </CardContent>
            </Card>
          </div>
        </div>
      )}
    </main>
  );
}

    