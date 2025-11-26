import React, { useState, useEffect } from 'react';
import { Film, Search, Bell, Plus, Menu } from 'lucide-react';
import firebase from 'firebase/compat/app';
import { auth, db, appId } from './services/firebase';
import { Movie } from './types';
import { INITIAL_MOVIES } from './constants';
import { Sidebar, AuthModal } from './components/UI';
import { HomeView, FeedView, SearchView } from './views/Discovery';
import { MovieDetail, UserProfile, CastProfile } from './views/Details';
import { CreatorStudio, LibraryView, NotificationsView, CineGenieView } from './views/UserSpace';

const App = () => {
  const [user, setUser] = useState<any>(null);
  const [view, setView] = useState({ type: 'home', data: null as any });
  const [movies, setMovies] = useState<Movie[]>([]);
  const [users, setUsers] = useState<any[]>([]); 
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!auth) return;
    const init = async () => {
       if (!auth.currentUser) await auth.signInAnonymously();
    };
    init();
    
    return auth.onAuthStateChanged(async (u: any) => {
      setUser(u);
      if (u && db) {
        const userRef = db.doc(`artifacts/${appId}/public/data/users/${u.uid}`);
        try {
            const snap = await userRef.get();
            if (!snap.exists) {
                await userRef.set({
                    uid: u.uid,
                    name: u.isAnonymous ? 'Guest' : (u.displayName || 'User'),
                    email: u.email || '',
                    role: 'user',
                    followers: [],
                    following: [],
                    watchLater: [],
                    likedMovies: [],
                    playlists: [],
                    bio: 'CineSphere Viewer',
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            }
        } catch (e) {
            console.error("Error checking/creating user doc:", e);
        }
      }
    });
  }, []);

  useEffect(() => {
    if (!db) {
        setMovies(INITIAL_MOVIES);
        return;
    }
    const q = db.collection(`artifacts/${appId}/public/data/movies`).orderBy('createdAt', 'desc');
    const unsub = q.onSnapshot((s: any) => {
      const ms = s.docs.map((d: any) => ({id: d.id, ...d.data()} as Movie));
      // Use initial movies if DB is empty
      if (ms.length === 0) {
         setMovies(INITIAL_MOVIES);
      } else {
         setMovies(ms);
      }
    }, (err: any) => {
        console.error("Firestore read error", err);
        setMovies(INITIAL_MOVIES);
    });
    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (!db) return;
    const q = db.collection(`artifacts/${appId}/public/data/users`);
    const unsub = q.onSnapshot((s: any) => setUsers(s.docs.map((d: any) => d.data())));
    return () => unsub();
  }, [user]);

  const navigate = (type: string, data: any = null) => {
    setView({ type, data });
    setSidebarOpen(false);
    if (type !== 'search') setSearchQuery('');
  };

  return (
    <div className="min-h-screen bg-gray-950 font-sans text-white flex flex-col">
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} onLogin={() => {}} />
      
      {/* Top Bar */}
      <nav className="sticky top-0 z-50 bg-black/95 backdrop-blur border-b border-gray-800 h-16 px-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="md:hidden text-gray-400">
                <Menu/>
            </button>
            <div onClick={() => navigate('home')} className="flex items-center gap-2 cursor-pointer">
            <Film className="text-red-600 w-8 h-8"/>
            <span className="text-xl font-bold tracking-tighter hidden sm:block">CINESPHERE</span>
            </div>
        </div>

        <div className="flex-1 max-w-xl relative">
           <input 
             value={searchQuery}
             onChange={(e) => {
               setSearchQuery(e.target.value);
               if (e.target.value) navigate('search');
               else if (view.type === 'search') navigate('home');
             }}
             placeholder="Search movies, shows, or creators..." 
             className="w-full bg-gray-900 border border-gray-700 rounded-full pl-5 pr-12 py-2 text-sm focus:border-red-600 outline-none text-white transition-all focus:bg-black placeholder-gray-500"
           />
           <button className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-gray-800 rounded-full text-gray-400 hover:text-white"><Search size={16}/></button>
        </div>

        <div className="flex items-center gap-2 sm:gap-4 justify-end">
          <button onClick={() => navigate('upload')} className="hidden md:flex items-center gap-2 bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded-full text-xs font-bold border border-gray-700 transition">
            <Plus size={14} className="text-red-500"/> Create
          </button>
          <button onClick={() => navigate('notifications')} className="relative p-2 hover:bg-gray-800 rounded-full transition text-gray-400 hover:text-white">
            <Bell size={20}/>
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-600 rounded-full border border-black"></span>
          </button>
          {user && !user.isAnonymous ? (
             <div onClick={() => navigate('profile', user.uid)} className="w-9 h-9 bg-gradient-to-r from-red-600 to-orange-600 rounded-full cursor-pointer border-2 border-gray-900 text-sm font-bold flex items-center justify-center shadow-lg">
                {user.email?.[0]?.toUpperCase()}
             </div>
          ) : (
             <button onClick={() => setIsAuthOpen(true)} className="text-sm font-bold bg-red-600 hover:bg-red-700 px-4 py-2 rounded-full transition shadow-lg shadow-red-900/30">Sign In</button>
          )}
        </div>
      </nav>

      <div className="flex flex-1 relative">
        <div className={`${sidebarOpen ? 'block fixed inset-0 z-40 bg-black/50 md:static md:bg-transparent md:block' : 'hidden md:block'}`}>
            <Sidebar active={view.type} onNavigate={navigate} user={user} />
        </div>
        <main className="flex-1 overflow-x-hidden w-full">
          {view.type === 'home' && <HomeView movies={movies} onNavigate={navigate} />}
          {view.type === 'library' && <LibraryView user={user} movies={movies} onNavigate={navigate} />}
          {view.type === 'feed' && <FeedView user={user} users={users} onNavigate={navigate} movies={movies} />}
          {view.type === 'upload' && <CreatorStudio user={user} onNavigate={navigate} movies={movies} />}
          {view.type === 'notifications' && <NotificationsView user={user} />}
          {view.type === 'cinegenie' && <CineGenieView user={user} />}
          {view.type === 'search' && <SearchView query={searchQuery} movies={movies} onNavigate={navigate} />}
          {view.type === 'profile' && <UserProfile targetUserId={view.data} currentUser={user} onBack={() => navigate('home')} onSignOut={() => auth.signOut()} movies={movies} />}
          {view.type === 'movie' && <MovieDetail movie={view.data} onBack={() => navigate('home')} user={user} movies={movies} onNavigate={navigate} onSelectCast={(p: any) => navigate('cast', p)} />}
          {view.type === 'cast' && <CastProfile person={view.data} movies={movies} onBack={() => navigate('home')} onSelectMovie={(m: any) => navigate('movie', m)} />}
        </main>
      </div>
    </div>
  );
};

export default App;