export interface CastMember {
  name: string;
  image?: string;
  role?: string;
}

export interface BoxOffice {
  budget: string;
  collection: string;
  verdict: string;
}

export interface Availability {
  platform: string;
  type: string;
}

export interface Movie {
  id: string;
  title: string;
  type: 'Movie' | 'Web Series' | 'TV Show' | 'Anime';
  genre: string[];
  language: string;
  availableLanguages: string[];
  year: number;
  rating: number;
  ageRating: string;
  poster: string;
  backdrop: string;
  about: string;
  trailerId: string;
  director: string;
  cast: CastMember[];
  availability: Availability;
  releaseDate?: string;
  ottDate?: string;
  boxOffice?: BoxOffice;
  status?: string;
}

export interface Comment {
  uid: string;
  name: string;
  text: string;
  createdAt: number;
}

export interface Quiz {
  question: string;
  options: string[];
  correct: number;
}

export interface Post {
  id: string;
  uid: string;
  name: string;
  channel: string;
  text?: string;
  mediaUrl?: string;
  type: 'normal' | 'quiz';
  quiz?: Quiz;
  likes: string[];
  comments: Comment[];
  createdAt: any; 
}

export interface Playlist {
  id: string;
  name: string;
  items: string[];
}

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: string;
  followers: string[];
  following: string[];
  watchLater: string[];
  likedMovies: string[];
  playlists: Playlist[];
  bio: string;
  createdAt: any;
}

export interface Notification {
  id: string;
  type: 'like' | 'follow';
  fromName: string;
  toUserId: string;
  createdAt: any;
}