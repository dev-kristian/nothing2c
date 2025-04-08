import { FriendsWatchlistItem } from "@/types";
import { RefObject, useEffect } from "react";

export function handleAddMovieTitle(
  inputMovieTitle: string,
  movieTitles: FriendsWatchlistItem[],
  setMovieTitles: React.Dispatch<React.SetStateAction<FriendsWatchlistItem[]>>,
  setInputMovieTitle: React.Dispatch<React.SetStateAction<string>>
) {
  if (inputMovieTitle.trim() !== "") {
    const newMovie: FriendsWatchlistItem = {
      id: Date.now(),
      title: inputMovieTitle.trim(),
      poster_path: null,
      vote_average: 0,
      media_type: "movie",
      weighted_score: 0,
    };
    setMovieTitles([...movieTitles, newMovie]);
    setInputMovieTitle("");
  }
}

export function removeMovieTitle(
  index: number,
  movieTitles: FriendsWatchlistItem[],
  setMovieTitles: React.Dispatch<React.SetStateAction<FriendsWatchlistItem[]>>
) {
  setMovieTitles(movieTitles.filter((_, i) => i !== index));
}

export function handleInputChange(
  e: React.ChangeEvent<HTMLInputElement>,
  setInputMovieTitle: React.Dispatch<React.SetStateAction<string>>,
  friendsWatchlistItems: { movie: FriendsWatchlistItem[]; tv: FriendsWatchlistItem[] },
  setSuggestions: React.Dispatch<React.SetStateAction<FriendsWatchlistItem[]>>
) {
  const value = e.target.value;
  setInputMovieTitle(value);
  if (value.length > 1) {
    const allSuggestions = [...friendsWatchlistItems.movie, ...friendsWatchlistItems.tv];
    const filteredSuggestions = allSuggestions
      .filter((item) => item.title?.toLowerCase().includes(value.toLowerCase()))
      .slice(0, 3); 

    setSuggestions(filteredSuggestions);
  } else {
    setSuggestions([]);
  }
}

export function handleSuggestionClick(
    movie: FriendsWatchlistItem,
    setInputMovieTitle: React.Dispatch<React.SetStateAction<string>>,
    movieTitles: FriendsWatchlistItem[],
    setMovieTitles: React.Dispatch<React.SetStateAction<FriendsWatchlistItem[]>>,
    setSuggestions: React.Dispatch<React.SetStateAction<FriendsWatchlistItem[]>>,
    addMovieToPoll?: (movieTitle: string) => Promise<void>
  ) {
    setInputMovieTitle('');
    setSuggestions([]);

    if (movieTitles && setMovieTitles) {
      if (!movieTitles.some(existing => existing.id === movie.id && existing.media_type === movie.media_type)) {
         setMovieTitles([...movieTitles, movie]);
      }
    }

    if (addMovieToPoll && movie.title) {
      addMovieToPoll(movie.title).catch((error) => {
        console.error('Error adding movie to poll:', error);
      });
    }
  }

export function useOutsideClickHandler(
  inputContainerRef: RefObject<HTMLDivElement>,
  setSuggestions: React.Dispatch<React.SetStateAction<FriendsWatchlistItem[]>>
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
