import React, { useState, useEffect } from 'react';
import { ArrowLeft, Play, Plus, Check, Heart, Calendar, Tv, DollarSign, BarChart3, Sparkles, MessageSquare, Star, Settings, LogOut, User as UserIcon, Clapperboard } from 'lucide-react';
import { Movie, Post, CastMember } from '../types';
import { PostCard, AIQuizModule, RatingSpeedometer } from '../components/Content';
import { TrailerModal } from '../components/UI';
import { generateGeminiResponse } from '../services/gemini';
import firebase from 'firebase/compat/app';
import { db, appId } from '../services/firebase';

// --- Movie Detail ---
export const MovieDetail = ({ movie, onBack, user, onSelectCast, movies, onNavigate }: any) => {
    const [isInWatchLater, setIsInWatchLater] = useState(false);
    const [isLiked, setIsLiked] = useState(false);
    const [aiInsights, setAiInsights] = useState("");
    const [loadingAi, setLoadingAi] = useState(false);
    const [relatedPosts, setRelatedPosts] = useState<Post[]>([]);
    const [showTrailer, setShowTrailer] = useState(false);
    const [userRating, setUserRating] = useState(0);
    const [speedometerValue, setSpeedometerValue] = useState(4);
  
    useEffect(() => {
      if (!user || !db) return;
      const q = db.collection(`artifacts/${appId}/public/data/posts`).where('channel', '==', movie.id);
      const unsub = q.onSnapshot((snap: any) => {
        const all = snap.docs.map((d: any) => ({id: d.id, ...d.data()} as Post));
        all.sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        setRelatedPosts(all);
      });
      return () => unsub();
    }, [movie.id, user]);
  
    const toggleWatchLater = async () => {
       if(!user) return;
       setIsInWatchLater(!isInWatchLater);
       if (db) {
        const userRef = db.doc(`artifacts/${appId}/public/data/users/${user.uid}`);
        if(!isInWatchLater) await userRef.update({ watchLater: firebase.firestore.FieldValue.arrayUnion(movie.id) });
        else await userRef.update({ watchLater: firebase.firestore.FieldValue.arrayRemove(movie.id) });
       }
    };
  
    const toggleLike = async () => {
       if(!user) return;
       setIsLiked(!isLiked);
       if (db) {
        const userRef = db.doc(`artifacts/${appId}/public/data/users/${user.uid}`);
        if(!isLiked) await userRef.update({ likedMovies: firebase.firestore.FieldValue.arrayUnion(movie.id) });
        else await userRef.update({ likedMovies: firebase.firestore.FieldValue.arrayRemove(movie.id) });
       }
    };
  
    const getInsights = async () => {
      if (aiInsights) return; 
      setLoadingAi(true);
      const prompt = `Generate 3 interesting trivia facts about the movie "${movie.title}". Keep it short and engaging.`;
      const text = await generateGeminiResponse(prompt);
      setAiInsights(text);
      setLoadingAi(false);
    };
  
    return (
      <div className="min-h-screen bg-gray-950 pb-20 animate-fade-in relative text-white">
        <button onClick={onBack} className="fixed top-6 left-6 z-50 bg-black/50 p-3 rounded-full text-white backdrop-blur-md hover:bg-white/20 transition"><ArrowLeft/></button>
        <TrailerModal isOpen={showTrailer} onClose={() => setShowTrailer(false)} trailerId={movie.trailerId} />
  
        <div className="h-[60vh] relative">
          <img src={movie.backdrop} className="w-full h-full object-cover"/>
          <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-transparent to-transparent"></div>
          <div className="absolute bottom-0 left-0 w-full p-8 bg-gradient-to-t from-gray-950 to-transparent">
            <div className="max-w-7xl mx-auto">
              <h1 className="text-5xl font-bold text-white mb-4 drop-shadow-lg">{movie.title}</h1>
              <div className="flex gap-4 text-gray-300 text-sm mb-6 items-center">
                <span className="bg-green-600 text-white px-2 py-0.5 rounded font-bold">{movie.rating} Match</span>
                <span>{movie.year}</span>
                <span>{movie.genre.join(", ")}</span>
                <span className="flex gap-2">
                   {movie.availableLanguages?.slice(0,3).map((l: string) => <span key={l} className="border border-gray-500 px-1 rounded text-xs uppercase">{l}</span>)}
                </span>
              </div>
              <div className="flex gap-4">
                 <button onClick={() => setShowTrailer(true)} className="bg-white text-black px-8 py-3 rounded-lg font-bold flex items-center gap-2 hover:bg-gray-200 transition"><Play fill="currentColor"/> Play Trailer</button>
                 <button onClick={toggleWatchLater} className={`px-8 py-3 rounded-lg font-bold flex items-center gap-2 border transition ${isInWatchLater ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-500 hover:bg-gray-800'}`}>
                    {isInWatchLater ? <Check size={20}/> : <Plus size={20}/>} Watch Later
                 </button>
                 <button onClick={toggleLike} className={`p-3 rounded-full border transition ${isLiked ? 'bg-red-600 border-red-600 text-white' : 'border-gray-500 hover:bg-gray-800'}`}>
                    <Heart size={20} className={isLiked ? 'fill-current' : ''}/>
                 </button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-6 py-8 text-gray-300 leading-relaxed text-lg grid grid-cols-1 lg:grid-cols-3 gap-8">
           <div className="lg:col-span-2">
              <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-6 mb-8 flex flex-wrap gap-6 items-start">
                 <div>
                    <h4 className="text-gray-500 text-xs font-bold uppercase mb-1 flex items-center gap-1"><Calendar size={12}/> Release Date</h4>
                    <p className="text-white font-bold">{movie.releaseDate || 'Coming Soon'}</p>
                 </div>
                 <div>
                    <h4 className="text-gray-500 text-xs font-bold uppercase mb-1 flex items-center gap-1"><Tv size={12}/> Platform</h4>
                    <p className="text-white font-bold">{movie.availability.platform}</p>
                 </div>
                 <div>
                    <h4 className="text-gray-500 text-xs font-bold uppercase mb-1 flex items-center gap-1"><DollarSign size={12}/> Box Office</h4>
                    <p className="text-green-400 font-bold">{movie.boxOffice?.collection || 'N/A'}</p>
                 </div>
              </div>
  
              <p className="mb-6">{movie.about}</p>
              
              <div className="bg-purple-900/20 border border-purple-500/30 rounded-xl p-6 mb-10">
                  <div className="flex items-center justify-between mb-4">
                      <h3 className="text-white font-bold text-lg flex items-center gap-2"><Sparkles size={20} className="text-purple-400"/> AI Insights</h3>
                      {!aiInsights && <button onClick={getInsights} disabled={loadingAi} className="text-xs bg-purple-600 px-3 py-1 rounded-full text-white font-bold hover:bg-purple-500 transition">{loadingAi ? 'Generating...' : 'Generate Facts'}</button>}
                  </div>
                  {aiInsights && <div className="text-sm text-gray-300 whitespace-pre-line animate-fade-in">{aiInsights}</div>}
              </div>
  
              <AIQuizModule movie={movie} user={user} />
  
              <div className="border-t border-gray-800 pt-8 mt-10">
                  <h3 className="text-white font-bold text-2xl mb-6 flex items-center gap-2"><MessageSquare className="text-blue-500"/> Community & Reviews</h3>
                  <div onClick={() => onNavigate('upload')} className="bg-gray-900 p-4 rounded-xl mb-6 cursor-pointer border border-gray-800 hover:border-gray-600 transition flex items-center gap-4 group">
                      <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center group-hover:bg-red-600 transition text-white"><Plus/></div>
                      <p className="text-gray-400 text-sm group-hover:text-white">Post art, memes, or review {movie.title}...</p>
                  </div>
                  <div className="space-y-6">
                      {relatedPosts.map(post => (
                          <PostCard key={post.id} post={post} user={user} onNavigate={onNavigate} movies={movies} />
                      ))}
                      {relatedPosts.length === 0 && <p className="text-gray-500 text-center italic">No posts yet.</p>}
                  </div>
              </div>
           </div>
           
           <div className="space-y-6">
               <div className="bg-gray-900 p-6 rounded-xl border border-gray-800">
                  <h4 className="text-white font-bold mb-4 text-center">Rate This Title</h4>
                  <div className="flex justify-center gap-2 mb-6">
                     {[1, 2, 3, 4, 5].map(star => (
                        <button key={star} onClick={() => setUserRating(star)} className="transition hover:scale-110">
                           <Star size={28} className={`${star <= userRating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-600'}`}/>
                        </button>
                     ))}
                  </div>
                  <RatingSpeedometer value={speedometerValue} onChange={setSpeedometerValue} interactive={true} />
               </div>
  
               <div className="bg-gray-900 p-6 rounded-xl border border-gray-800">
                 <h4 className="text-white font-bold mb-4">Cast & Crew</h4>
                 <div className="flex flex-wrap gap-4">
                    <div onClick={() => onSelectCast({ name: movie.director, role: 'Director' })} className="cursor-pointer text-center w-20 group">
                        <div className="w-20 h-20 rounded-full bg-gray-800 mb-2 overflow-hidden border-2 border-transparent group-hover:border-red-600 transition">
                             <UserIcon className="w-full h-full p-4 text-gray-600"/>
                        </div>
                        <p className="text-xs font-bold truncate text-white group-hover:text-red-500">{movie.director}</p>
                        <p className="text-[10px] text-gray-500">Director</p>
                    </div>
                    {movie.cast.map((c: CastMember, i: number) => (
                       <div key={i} onClick={() => onSelectCast({...c, role: 'Actor'})} className="cursor-pointer text-center w-20 group">
                          <img src={c.image} className="w-20 h-20 rounded-full object-cover mb-2 border-2 border-transparent group-hover:border-red-600 transition"/>
                          <p className="text-xs font-bold truncate text-white group-hover:text-red-500">{c.name}</p>
                          <p className="text-[10px] text-gray-500">Actor</p>
                       </div>
                    ))}
                 </div>
               </div>
           </div>
        </div>
      </div>
    );
};

// --- User Profile ---
export const UserProfile = ({ targetUserId, currentUser, onBack, onSignOut, movies }: any) => {
    const [profile, setProfile] = useState<any>(null);
    const [activeTab, setActiveTab] = useState('videos');
    const [posts, setPosts] = useState<Post[]>([]);
  
    useEffect(() => {
      if (!db || !targetUserId) return; 
      const fetchProfile = async () => {
          const docSnap = await db.doc(`artifacts/${appId}/public/data/users/${targetUserId}`).get();
          if (docSnap.exists) setProfile(docSnap.data());
      };
      const q = db.collection(`artifacts/${appId}/public/data/posts`).where('uid', '==', targetUserId);
      const unsub = q.onSnapshot((snap: any) => setPosts(snap.docs.map((d: any) => ({id: d.id, ...d.data()} as Post))));
      fetchProfile();
      return () => unsub();
    }, [targetUserId]);
  
    if (!profile) return <div className="text-white p-10 text-center">Loading Profile...</div>;
    const isOwner = currentUser?.uid === targetUserId;
  
    return (
      <div className="min-h-screen bg-black animate-fade-in pb-20 text-white">
        <div className="h-40 bg-gradient-to-r from-gray-800 to-gray-900 relative">
           <button onClick={onBack} className="absolute top-4 left-4 bg-black/50 p-2 rounded-full hover:bg-black text-white"><ArrowLeft/></button>
        </div>
        <div className="px-6 -mt-12 flex justify-between items-end max-w-5xl mx-auto">
           <div className="flex items-end gap-4">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-red-600 to-orange-500 border-4 border-black flex items-center justify-center text-4xl font-bold shadow-lg">{profile.name?.[0]}</div>
              <div className="mb-2">
                 <h1 className="text-2xl font-bold">{profile.name}</h1>
                 <p className="text-gray-400 text-sm">@{profile.name?.replace(/\s/g,'').toLowerCase()} • {profile.followers?.length || 0} subscribers</p>
              </div>
           </div>
           {isOwner && (
              <button onClick={() => setActiveTab('settings')} className="mb-4 bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-full font-bold text-sm flex items-center gap-2 border border-gray-700"><Settings size={16}/> Manage</button>
           )}
        </div>
  
        <div className="mt-8 border-b border-gray-800 px-6 flex gap-6 max-w-5xl mx-auto">
           {['videos', 'settings'].map(t => (
              <button key={t} onClick={() => setActiveTab(t)} className={`pb-3 font-bold capitalize ${activeTab === t ? 'text-white border-b-2 border-white' : 'text-gray-500'}`}>{t}</button>
           ))}
        </div>
  
        <div className="p-6 max-w-5xl mx-auto">
           {activeTab === 'settings' && isOwner ? (
              <div className="space-y-6">
                 <div className="bg-gray-900 p-6 rounded-xl border border-gray-800">
                    <h3 className="font-bold text-lg mb-4">Account</h3>
                    <button onClick={onSignOut} className="text-white bg-red-600/20 hover:bg-red-600 hover:text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition"><LogOut size={20}/> Sign Out</button>
                 </div>
              </div>
           ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {posts.map(p => (
                      <div key={p.id} className="bg-gray-900 p-4 rounded-xl border border-gray-800 hover:border-gray-600 transition">
                         <p className="text-gray-300 line-clamp-3 mb-2">{p.text}</p>
                         <p className="text-xs text-gray-500">{new Date(p.createdAt?.seconds * 1000).toLocaleDateString()}</p>
                      </div>
                  ))}
                  {posts.length === 0 && <p className="text-gray-500 col-span-3 text-center py-10">No activities yet.</p>}
              </div>
           )}
        </div>
      </div>
    );
};

// --- Cast Profile ---
export const CastProfile = ({ person, movies, onBack, onSelectMovie }: any) => {
    const personMovies = movies.filter((m: Movie) => m.cast.some(c => c.name === person.name) || m.director === person.name);
    
    return (
      <div className="min-h-screen bg-black animate-fade-in p-6 pb-20 text-white">
        <button onClick={onBack} className="mb-6 flex items-center gap-2 text-gray-400 hover:text-white"><ArrowLeft/> Back</button>
        <div className="flex flex-col items-center mb-12 text-center">
          <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-gray-800 shadow-2xl mb-4 bg-gray-800">
             {person.image ? <img src={person.image} className="w-full h-full object-cover"/> : <UserIcon className="w-full h-full p-8 text-gray-600"/>}
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">{person.name}</h1>
          <p className="text-blue-500 font-medium text-lg mb-4">{person.role || 'Artist'}</p>
        </div>
        
        <div className="max-w-6xl mx-auto">
            <h3 className="text-2xl font-bold text-white mb-6 px-4 flex items-center gap-2 border-b border-gray-800 pb-2"><Clapperboard/> Filmography</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6 px-4">
            {personMovies.map((m: Movie) => (
                <div key={m.id} onClick={() => onSelectMovie(m)} className="cursor-pointer group">
                <div className="aspect-[2/3] rounded-xl overflow-hidden relative bg-gray-900 shadow-lg mb-2">
                    <img src={m.poster} className="w-full h-full object-cover transition duration-500 group-hover:scale-110 opacity-80 group-hover:opacity-100"/>
                </div>
                <p className="text-white font-bold text-sm truncate group-hover:text-red-500">{m.title}</p>
                <p className="text-xs text-gray-500">{m.year}</p>
                </div>
            ))}
            </div>
        </div>
      </div>
    );
};