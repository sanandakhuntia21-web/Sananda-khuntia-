import React, { useState, useEffect } from 'react';
import { Play, Monitor, Film, Search } from 'lucide-react';
import { Movie, Post } from '../types';
import { MovieHoverCard, PostCard } from '../components/Content';
import { db, appId } from '../services/firebase';

// --- Home View ---
export const HomeView = ({ movies, onNavigate }: { movies: Movie[], onNavigate: any }) => {
    const [filterType, setFilterType] = useState('All'); 
    const [filterGenre, setFilterGenre] = useState('All');
  
    const categories = ['All', 'Movie', 'Web Series', 'TV Show'];
    const genres = ['All', 'Action', 'Sci-Fi', 'Drama', 'Horror', 'Comedy', 'Thriller'];
  
    const filtered = movies.filter(m => {
      const typeMatch = filterType === 'All' || m.type === filterType;
      const genreMatch = filterGenre === 'All' || m.genre.includes(filterGenre);
      return typeMatch && genreMatch;
    });
  
    const renderRow = (title: string, data: Movie[]) => {
      if (data.length === 0) return null;
      return (
        <div className="mb-10 animate-fade-in group/row">
          <div className="flex justify-between items-end px-6 mb-4">
             <h3 className="text-white font-bold text-xl">{title}</h3>
             <span className="text-xs text-gray-500 font-bold uppercase tracking-wider cursor-pointer hover:text-white">See All</span>
          </div>
          <div className="flex gap-4 overflow-x-auto px-6 pb-8 scrollbar-hide relative">
            {data.map(m => (
              <MovieHoverCard key={m.id} movie={m} onNavigate={onNavigate} />
            ))}
          </div>
        </div>
      );
    };
  
    const heroMovie = filtered.find(m => m.status === 'Upcoming') || filtered[0];
  
    return (
      <div className="pb-20">
        <div className="sticky top-16 z-30 bg-gray-950/95 backdrop-blur border-b border-gray-800 py-3 px-6 flex flex-col md:flex-row gap-4 items-start md:items-center">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {categories.map(c => (
              <button key={c} onClick={() => setFilterType(c)} className={`px-4 py-1.5 rounded-full text-sm font-bold whitespace-nowrap transition ${filterType === c ? 'bg-white text-black' : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'}`}>{c}</button>
            ))}
          </div>
          <div className="w-px h-6 bg-gray-800 hidden md:block"></div>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {genres.map(g => (
              <button key={g} onClick={() => setFilterGenre(g)} className={`px-3 py-1 rounded text-xs font-medium border transition whitespace-nowrap ${filterGenre === g ? 'border-red-600 text-red-500 bg-red-500/10' : 'border-gray-700 text-gray-500 hover:border-gray-500'}`}>{g}</button>
            ))}
          </div>
        </div>
  
        {heroMovie && (
          <div className="relative h-[70vh] mb-12 group">
            <img src={heroMovie.backdrop} className="w-full h-full object-cover opacity-70 transition group-hover:opacity-50 duration-1000"/>
            <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/30 to-transparent"></div>
            <div className="absolute bottom-0 left-0 p-8 md:p-16 w-full max-w-4xl">
              <div className="flex items-center gap-3 mb-4">
                 <span className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded uppercase tracking-wider">Top Pick</span>
                 <span className="text-gray-300 text-sm font-bold border border-gray-600 px-2 py-1 rounded">{heroMovie.language}</span>
                 <span className="text-gray-300 text-sm font-bold border border-gray-600 px-2 py-1 rounded">{heroMovie.type}</span>
              </div>
              <h1 className="text-4xl md:text-7xl font-black text-white mb-4 drop-shadow-2xl leading-tight">{heroMovie.title}</h1>
              <p className="text-gray-200 text-lg md:text-xl mb-8 line-clamp-3 max-w-2xl drop-shadow-md leading-relaxed">{heroMovie.about}</p>
              <div className="flex gap-4">
                <button onClick={() => onNavigate('movie', heroMovie)} className="bg-white text-black px-8 py-3.5 rounded-lg font-bold flex items-center gap-2 hover:bg-gray-200 transition"><Play fill="currentColor" size={24}/> Watch Now</button>
                <button onClick={() => onNavigate('movie', heroMovie)} className="bg-gray-600/60 backdrop-blur-sm text-white px-8 py-3.5 rounded-lg font-bold flex items-center gap-2 hover:bg-gray-600/80 transition"><Monitor size={24}/> Details</button>
              </div>
            </div>
          </div>
        )}
  
        {renderRow("Trending Now", filtered.filter(m => m.rating > 4.5))}
        {renderRow("New Releases", filtered.filter(m => m.year >= 2024))}
        {renderRow("Action Thrillers", filtered.filter(m => m.genre.includes('Action')))}
      </div>
    );
};

// --- Feed View ---
export const FeedView = ({ user, users, onNavigate, movies }: { user: any, users: any[], onNavigate: any, movies: Movie[] }) => {
    const [posts, setPosts] = useState<Post[]>([]);
    const [tab, setTab] = useState('forYou'); 
  
    useEffect(() => {
      if (!db) return;
      const q = db.collection(`artifacts/${appId}/public/data/posts`).orderBy('createdAt', 'desc');
      const unsub = q.onSnapshot((snap: any) => {
        const all = snap.docs.map((d: any) => ({id: d.id, ...d.data()} as Post));
        if (tab === 'following' && user) {
          const myFollowing = users.find(u => u.uid === user.uid)?.following || [];
          setPosts(all.filter(p => myFollowing.includes(p.uid)));
        } else {
          setPosts(all);
        }
      });
      return () => unsub();
    }, [tab, user, users]);
  
    return (
      <div className="max-w-3xl mx-auto pt-6 pb-20 px-4">
        <div className="flex border-b border-gray-800 mb-6 sticky top-16 bg-gray-950 z-10">
          <button onClick={() => setTab('forYou')} className={`flex-1 py-3 text-center font-bold transition ${tab === 'forYou' ? 'text-white border-b-2 border-red-600' : 'text-gray-500 hover:text-gray-300'}`}>For You</button>
          <button onClick={() => setTab('following')} className={`flex-1 py-3 text-center font-bold transition ${tab === 'following' ? 'text-white border-b-2 border-red-600' : 'text-gray-500 hover:text-gray-300'}`}>Following</button>
        </div>
        <div className="space-y-6">
          {posts.map(post => (
            <PostCard key={post.id} post={post} user={user} onNavigate={onNavigate} movies={movies} />
          ))}
          {posts.length === 0 && <div className="text-center text-gray-500 py-10">No posts found. Be the first to post!</div>}
        </div>
      </div>
    );
};

// --- Search View ---
export const SearchView = ({ query, movies, onNavigate }: { query: string, movies: Movie[], onNavigate: any }) => {
    const matchedMovies = movies.filter(m => m.title.toLowerCase().includes(query.toLowerCase()));
    return (
      <div className="p-6 text-white max-w-7xl mx-auto">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><Search className="text-red-500"/> Results for "{query}"</h2>
        {matchedMovies.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {matchedMovies.map(m => (
                <div key={m.id} onClick={() => onNavigate('movie', m)} className="cursor-pointer group">
                <div className="aspect-[2/3] rounded-lg overflow-hidden bg-gray-800 mb-2 relative">
                    <img src={m.poster} className="w-full h-full object-cover group-hover:scale-105 transition duration-500"/>
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                        <Play fill="white" size={32}/>
                    </div>
                </div>
                <p className="font-bold text-sm truncate text-gray-200 group-hover:text-white">{m.title}</p>
                <p className="text-xs text-gray-500">{m.year}</p>
                </div>
            ))}
            </div>
        ) : (
            <div className="text-center py-20 text-gray-500">
                <Film size={48} className="mx-auto mb-4 opacity-20"/>
                <p>No matches found.</p>
            </div>
        )}
      </div>
    );
}