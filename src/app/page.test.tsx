import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Home from './page';
import * as actions from './actions';

// Mock the actions module
jest.mock('./actions', () => ({
  getTrackList: jest.fn(),
}));

const mockGetTrackList = actions.getTrackList as jest.Mock;

const mockPlaylist = {
  name: 'Test Playlist',
  owner: 'Test Owner',
  imageUrl: 'https://example.com/image.jpg',
  total: 5,
  tracks: [
    { title: 'Track 1', artist: 'Artist 1', album: 'Album 1', duration: 200000, releaseDate: '2023-01-01', explicit: false },
    { title: 'Track 2', artist: 'Artist 2', album: 'Album 2', duration: 220000, releaseDate: '2023-02-01', explicit: true },
    { title: 'Track 3', artist: 'Artist 3', album: 'Album 3', duration: 180000, releaseDate: '2023-03-01', explicit: false },
    { title: 'Track 4', artist: 'Artist 4', album: 'Album 4', duration: 240000, releaseDate: '2023-04-01', explicit: true },
    { title: 'Track 5', artist: 'Artist 5', album: 'Album 5', duration: 210000, releaseDate: '2023-05-01', explicit: false },
  ],
};

describe('Home component', () => {
  beforeEach(() => {
    // Reset mocks before each test
    mockGetTrackList.mockClear();
  });

  it('should render the main page title', () => {
    render(<Home />);
    expect(screen.getByText('Track Lister')).toBeInTheDocument();
  });

  it('should update the total tracks count when excluding explicit tracks', async () => {
    mockGetTrackList.mockResolvedValue({ data: mockPlaylist });

    render(<Home />);

    // Simulate user input and form submission
    const input = screen.getByPlaceholderText('https://open.spotify.com/playlist/...');
    fireEvent.change(input, { target: { value: 'https://open.spotify.com/playlist/test' } });

    const submitButton = screen.getByRole('button', { name: /Get Track List/i });
    fireEvent.click(submitButton);

    // Wait for the playlist to be displayed
    await waitFor(() => {
      expect(screen.getByText('Test Playlist')).toBeInTheDocument();
    });

    // Initial total tracks count
    expect(screen.getByText('Total tracks')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();

    // Find and click the "Exclude explicit" checkbox
    const excludeCheckbox = screen.getByLabelText('Exclude explicit');
    fireEvent.click(excludeCheckbox);

    // After clicking the checkbox, the total tracks count should be updated
    // This is the part that is expected to fail due to the bug
    await waitFor(() => {
        expect(screen.getByText('3')).toBeInTheDocument();
    });
  });
});
