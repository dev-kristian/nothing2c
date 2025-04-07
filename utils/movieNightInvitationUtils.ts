import { FriendsWatchlistItem } from "@/types"; // Use FriendsWatchlistItem
import { RefObject, useEffect } from "react";

export function handleAddMovieTitle(
  inputMovieTitle: string,
  movieTitles: FriendsWatchlistItem[], // Use FriendsWatchlistItem
  setMovieTitles: React.Dispatch<React.SetStateAction<FriendsWatchlistItem[]>>, // Use FriendsWatchlistItem
  setInputMovieTitle: React.Dispatch<React.SetStateAction<string>>
) {
  if (inputMovieTitle.trim() !== "") {
    // Ensure the created object matches FriendsWatchlistItem (which extends Media)
    const newMovie: FriendsWatchlistItem = {
      id: Date.now(), // Use a temporary ID or handle properly if needed
      title: inputMovieTitle.trim(),
      poster_path: null, // Match Media type
      vote_average: 0, // Match Media type
      media_type: "movie", // Default or determine based on input?
      // release_date or first_air_date might be needed depending on Media definition
      weighted_score: 0, // Add required property from FriendsWatchlistItem
    };
    setMovieTitles([...movieTitles, newMovie]);
    setInputMovieTitle("");
  }
}

export function removeMovieTitle(
  index: number,
  movieTitles: FriendsWatchlistItem[], // Use FriendsWatchlistItem
  setMovieTitles: React.Dispatch<React.SetStateAction<FriendsWatchlistItem[]>> // Use FriendsWatchlistItem
) {
  setMovieTitles(movieTitles.filter((_, i) => i !== index));
}

export function handleInputChange(
  e: React.ChangeEvent<HTMLInputElement>,
  setInputMovieTitle: React.Dispatch<React.SetStateAction<string>>,
  // Assuming friendsWatchlistItems is the correct source data structure
  friendsWatchlistItems: { movie: FriendsWatchlistItem[]; tv: FriendsWatchlistItem[] },
  setSuggestions: React.Dispatch<React.SetStateAction<FriendsWatchlistItem[]>> // Use FriendsWatchlistItem
) {
  const value = e.target.value;
  setInputMovieTitle(value);
  if (value.length > 1) {
    const allSuggestions = [...friendsWatchlistItems.movie, ...friendsWatchlistItems.tv];
    const filteredSuggestions = allSuggestions
      .filter((item) => item.title?.toLowerCase().includes(value.toLowerCase()))
      .slice(0, 3); // Limit suggestions

    setSuggestions(filteredSuggestions);
  } else {
    setSuggestions([]);
  }
}

export function handleSuggestionClick(
    movie: FriendsWatchlistItem, // Use FriendsWatchlistItem
    setInputMovieTitle: React.Dispatch<React.SetStateAction<string>>,
    movieTitles: FriendsWatchlistItem[], // Use FriendsWatchlistItem
    setMovieTitles: React.Dispatch<React.SetStateAction<FriendsWatchlistItem[]>>, // Use FriendsWatchlistItem
    setSuggestions: React.Dispatch<React.SetStateAction<FriendsWatchlistItem[]>>, // Use FriendsWatchlistItem
    addMovieToPoll?: (movieTitle: string) => Promise<void>
  ) {
    setInputMovieTitle('');
    setSuggestions([]);

    if (movieTitles && setMovieTitles) {
      // Ensure not adding duplicates if needed
      if (!movieTitles.some(existing => existing.id === movie.id && existing.media_type === movie.media_type)) {
         setMovieTitles([...movieTitles, movie]);
      }
    }

    if (addMovieToPoll && movie.title) {
      addMovieToPoll(movie.title).catch((error) => {
        console.error('Error adding movie to poll:', error);
        // Optionally show a toast here
      });
    }
  }

export function useOutsideClickHandler(
  inputContainerRef: RefObject<HTMLDivElement>,
  setSuggestions: React.Dispatch<React.SetStateAction<FriendsWatchlistItem[]>> // Use FriendsWatchlistItem
) {
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (inputContainerRef.current && !inputContainerRef.current.contains(event.target as Node)) {
        setSuggestions([]);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [inputContainerRef, setSuggestions]);
}
