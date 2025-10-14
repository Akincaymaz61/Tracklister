import { getTrackList } from './actions';
import { getTrackListFlow } from '@/ai/flows/get-track-list-flow';
import { getYtMusicTrackListFlow } from '@/ai/flows/get-yt-music-track-list-flow';

jest.mock('@/ai/flows/get-track-list-flow');
jest.mock('@/ai/flows/get-yt-music-track-list-flow');

const mockGetTrackListFlow = getTrackListFlow as jest.Mock;
const mockGetYtMusicTrackListFlow = getYtMusicTrackListFlow as jest.Mock;

describe('getTrackList action', () => {
  beforeEach(() => {
    mockGetTrackListFlow.mockClear();
    mockGetYtMusicTrackListFlow.mockClear();
  });

  it('should call getTrackListFlow for spotify service', async () => {
    const playlistUrl = 'https://open.spotify.com/playlist/test';
    const service = 'spotify';

    await getTrackList(playlistUrl, service);

    expect(mockGetTrackListFlow).toHaveBeenCalledWith(playlistUrl);
    expect(mockGetYtMusicTrackListFlow).not.toHaveBeenCalled();
  });

  it('should call getYtMusicTrackListFlow for youtubemusic service', async () => {
    const playlistUrl = 'https://music.youtube.com/playlist/test';
    const service = 'youtubemusic';

    await getTrackList(playlistUrl, service);

    expect(mockGetYtMusicTrackListFlow).toHaveBeenCalledWith(playlistUrl);
    expect(mockGetTrackListFlow).not.toHaveBeenCalled();
  });

  it('should return an error for invalid service', async () => {
    const playlistUrl = 'https://example.com/playlist/test';
    const service = 'invalid-service' as any;

    const result = await getTrackList(playlistUrl, service);

    expect(result.error).toBe('Invalid data provided. Please enter a complete and valid URL.');
    expect(mockGetTrackListFlow).not.toHaveBeenCalled();
    expect(mockGetYtMusicTrackListFlow).not.toHaveBeenCalled();
  });
});
