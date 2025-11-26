import React, { useState, useEffect, useRef } from 'react';
import { UploadCloud, X, Layers, PlusSquare, Bell, Heart, UserCheck, Sparkles, Send } from 'lucide-react';
import { generateGeminiResponse } from '../services/gemini';
import firebase from 'firebase/compat/app';
import { db, appId } from '../services/firebase';
import { Movie } from '../types';

// --- Creator Studio ---
export const CreatorStudio = ({ user, onNavigate, movies }: { user: any, onNavigate: any, movies: Movie[] }) => {
    const [form, setForm] = useState({ text: '', media: null as string | null, tag: 'general', quizTopic: '' });
    const [loading, setLoading] = useState(false);
    const [mode, setMode] = useState('post');
  
    const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const reader = new FileReader();
          reader.onload = (ev) => {
              if (ev.target?.result) setForm({ ...form, media: ev.target.result as string });
          };
          reader.readAsDataURL(e.target.files[0]);
      }
    };
  
    const handleUpload = async () => {
      if (!user) return alert("Please login first.");
      setLoading(true);
  
      let postData: any = {
          uid: user.uid,
          name: user.displayName,
          channel: form.tag,
          likes: [],
          comments: [],
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
      };
  
      if (mode === 'quiz') {
          const prompt = `Generate a single multiple-choice trivia question about "${form.quizTopic}". 
          Format strictly as: Question|Option1|Option2|Option3|Option4|CorrectOptionIndex(0-3).`;
          const response = await generateGeminiResponse(prompt);
          const parts = response.split('|');
          
          if (parts.length === 6) {
              postData = {
                  ...postData,
                  type: 'quiz',
                  text: `Trivia Challenge: ${form.quizTopic}`,
                  quiz: {
                      question: parts[0],
                      options: [parts[1], parts[2], parts[3], parts[4]],
                      correct: parseInt(parts[5])
                  }
              };
          } else {
              alert("Failed to generate quiz. AI might be busy. Try again.");
              setLoading(false);
              return;
          }
      } else {
          postData = {
              ...postData,
              type: 'normal',
              text: form.text,
              mediaUrl: form.media, 
          };
      }
  
      try {
        if (db) {
            await db.collection(`artifacts/${appId}/public/data/posts`).add(postData);
            setForm({ text: '', media: null, tag: 'general', quizTopic: '' });
            onNavigate('feed');
        } else {
            alert("Database unavailable in this preview.");
        }
      } catch (e) { console.error(e); }
      setLoading(false);
    };
  
    return (
      <div className="max-w-2xl mx-auto p-6 animate-fade-in text-white pt-10">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2"><UploadCloud className="text-red-600"/> Creator Studio</h2>
        
        <div className="flex gap-4 mb-6">
           <button onClick={() => setMode('post')} className={`flex-1 py-3 rounded-lg font-bold transition border ${mode === 'post' ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-900 text-gray-400 border-gray-700 hover:border-gray-500'}`}>Standard Post</button>
           <button onClick={() => setMode('quiz')} className={`flex-1 py-3 rounded-lg font-bold transition border ${mode === 'quiz' ? 'bg-yellow-500 text-black border-yellow-500' : 'bg-gray-900 text-gray-400 border-gray-700 hover:border-gray-500'}`}>AI Quiz Generator</button>
        </div>
  
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 shadow-xl">
          <div className="mb-4">
             <label className="block text-sm font-bold mb-2 text-gray-400">Tag Movie / Show</label>
             <select 
               value={form.tag} 
               onChange={e => setForm({...form, tag: e.target.value})}
               className="w-full bg-black border border-gray-700 rounded-lg p-3 text-white outline-none focus:border-red-600 transition"
             >
               <option value="general">General (No specific title)</option>
               {movies.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
             </select>
          </div>
  
          {mode === 'post' ? (
              <>
                  <div className="mb-6">
                  <label className="block text-sm font-bold mb-2 text-gray-400">Caption</label>
                  <textarea 
                      value={form.text}
                      onChange={e => setForm({...form, text: e.target.value})}
                      className="w-full bg-black border border-gray-700 rounded-lg p-4 text-white outline-none focus:border-red-600 h-32 resize-none transition"
                      placeholder="What's on your mind?"
                  />
                  </div>
                  
                  <div className="mb-6">
                  <label className="block text-sm font-bold mb-2 text-gray-400">Media</label>
                  <div className="border-2 border-dashed border-gray-700 rounded-lg p-8 text-center hover:bg-gray-800 transition relative">
                      {form.media ? (
                      <div className="relative">
                          <img src={form.media} className="max-h-64 mx-auto rounded shadow-lg"/>
                          <button onClick={() => setForm({...form, media: null})} className="absolute top-0 right-0 bg-red-600 p-1 rounded-full text-white shadow-md transform translate-x-1/2 -translate-y-1/2 hover:scale-110"><X size={16}/></button>
                      </div>
                      ) : (
                      <label className="cursor-pointer flex flex-col items-center gap-2">
                          <UploadCloud size={40} className="text-gray-500"/>
                          <span className="text-gray-400 text-sm">Click to upload image</span>
                          <input type="file" className="hidden" onChange={handleFile} accept="image/*"/>
                      </label>
                      )}
                  </div>
                  </div>
              </>
          ) : (
              <div className="mb-6">
                  <label className="block text-sm font-bold mb-2 text-gray-400">Quiz Topic</label>
                  <input 
                      value={form.quizTopic}
                      onChange={e => setForm({...form, quizTopic: e.target.value})}
                      className="w-full bg-black border border-gray-700 rounded-lg p-4 text-white outline-none focus:border-yellow-500 transition"
                      placeholder="e.g., Star Wars Vehicles, 90s RomComs..."
                  />
                  <p className="text-xs text-gray-500 mt-2 flex items-center gap-1"><Sparkles size={12}/> AI will generate a question based on this topic.</p>
              </div>
          )}
  
          <div className="flex justify-end">
            <button 
              onClick={handleUpload} 
              disabled={loading || (mode === 'post' && !form.text && !form.media) || (mode === 'quiz' && !form.quizTopic)}
              className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-lg font-bold transition disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? 'Publishing...' : 'Publish'}
            </button>
          </div>
        </div>
      </div>
    );
};

// --- Library View ---
export const LibraryView = ({ user, movies, onNavigate }: { user: any, movies: Movie[], onNavigate: any }) => {
    const [activeTab, setActiveTab] = useState('watchLater');
    const [profileData, setProfileData] = useState<any>(null);
    const [newPlaylistName, setNewPlaylistName] = useState('');
    const [isCreating, setIsCreating] = useState(false);
  
    useEffect(() => {
      if (!user || !db) return;
      const fetchUserData = async () => {
        const docRef = db.doc(`artifacts/${appId}/public/data/users/${user.uid}`);
        const snap = await docRef.get();
        if (snap.exists) setProfileData(snap.data());
      };
      fetchUserData();
    }, [user, isCreating]); 
  
    const createPlaylist = async () => {
      if (!newPlaylistName.trim() || !db) return;
      const newPlaylist = { id: Date.now().toString(), name: newPlaylistName, items: [] };
      await db.doc(`artifacts/${appId}/public/data/users/${user.uid}`).update({
        playlists: firebase.firestore.FieldValue.arrayUnion(newPlaylist)
      });
      setNewPlaylistName('');
      setIsCreating(false);
    };
  
    if (!user) return <div className="p-20 text-center text-white text-lg">Please login to view your library.</div>;
    if (!profileData) return <div className="p-20 text-center text-white text-lg">Loading Library...</div>;
  
    const getMoviesByIds = (ids: string[]) => movies.filter(m => ids?.includes(m.id));
  
    const renderMovieList = (list: Movie[]) => (
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6 mt-6 animate-fade-in">
        {list.length === 0 ? <p className="text-gray-500 col-span-4 text-center py-10 italic">This list is empty.</p> : 
         list.map(m => (
          <div key={m.id} onClick={() => onNavigate('movie', m)} className="cursor-pointer group">
             <div className="rounded-lg overflow-hidden shadow-md mb-2 bg-gray-900 relative">
                <img src={m.poster} className="w-full h-auto group-hover:scale-105 transition duration-500"/>
             </div>
             <p className="mt-2 text-white font-bold text-sm truncate group-hover:text-red-500">{m.title}</p>
             <p className="text-xs text-gray-500">{m.year}</p>
          </div>
        ))}
      </div>
    );
  
    return (
      <div className="max-w-7xl mx-auto p-6 text-white min-h-screen">
        <h1 className="text-3xl font-bold mb-8 flex items-center gap-3"><Layers className="text-red-600"/> Your Library</h1>
        
        <div className="flex gap-4 border-b border-gray-800 pb-1 mb-6 overflow-x-auto">
          <button onClick={() => setActiveTab('watchLater')} className={`pb-3 px-4 font-bold whitespace-nowrap transition ${activeTab === 'watchLater' ? 'border-b-2 border-red-600 text-white' : 'text-gray-500 hover:text-gray-300'}`}>Watch Later</button>
          <button onClick={() => setActiveTab('liked')} className={`pb-3 px-4 font-bold whitespace-nowrap transition ${activeTab === 'liked' ? 'border-b-2 border-red-600 text-white' : 'text-gray-500 hover:text-gray-300'}`}>Liked Content</button>
          {profileData.playlists?.map((pl: any) => (
             <button key={pl.id} onClick={() => setActiveTab(pl.id)} className={`pb-3 px-4 font-bold whitespace-nowrap transition ${activeTab === pl.id ? 'border-b-2 border-red-600 text-white' : 'text-gray-500 hover:text-gray-300'}`}>{pl.name}</button>
          ))}
          <button onClick={() => setIsCreating(true)} className="pb-3 px-4 font-bold text-blue-500 flex items-center gap-2 hover:text-blue-400 ml-auto"><PlusSquare size={16}/> New Playlist</button>
        </div>
  
        {isCreating && (
          <div className="bg-gray-900 p-4 rounded-lg mb-6 border border-gray-800 flex gap-2 items-center max-w-md animate-fade-in shadow-lg">
             <input value={newPlaylistName} onChange={e => setNewPlaylistName(e.target.value)} placeholder="Playlist Name" className="bg-black border border-gray-700 rounded px-3 py-2 text-white flex-1 outline-none focus:border-blue-500"/>
             <button onClick={createPlaylist} className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded font-bold text-sm text-white">Create</button>
             <button onClick={() => setIsCreating(false)} className="text-gray-400 px-2 hover:text-white"><X/></button>
          </div>
        )}
  
        {activeTab === 'watchLater' && renderMovieList(getMoviesByIds(profileData.watchLater))}
        {activeTab === 'liked' && renderMovieList(getMoviesByIds(profileData.likedMovies))}
        {profileData.playlists?.map((pl: any) => activeTab === pl.id && (
           <div key={pl.id} className="animate-fade-in">
              <div className="flex justify-between items-center mb-4">
                 <h2 className="text-xl font-bold text-gray-200">{pl.name}</h2>
                 <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded">{pl.items?.length || 0} items</span>
              </div>
              {renderMovieList(getMoviesByIds(pl.items || []))} 
           </div>
        ))}
      </div>
    );
};

// --- Notifications View ---
export const NotificationsView = ({ user }: { user: any }) => {
    const [notifs, setNotifs] = useState<any[]>([]);
  
    useEffect(() => {
      if (!user || !db) return;
      const q = db.collection(`artifacts/${appId}/public/data/notifications`).where('toUserId', '==', user.uid);
      
      const unsub = q.onSnapshot((snap: any) => {
          const data = snap.docs.map((d: any) => ({id: d.id, ...d.data()}));
          data.sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
          setNotifs(data);
      });
      return () => unsub();
    }, [user]);
  
    return (
      <div className="max-w-2xl mx-auto p-4 text-white min-h-screen pt-10">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2"><Bell className="text-red-500"/> Activity</h2>
        <div className="space-y-3">
          {notifs.map(n => (
            <div key={n.id} className="bg-gray-900 border border-gray-800 p-4 rounded-lg flex items-center gap-4 hover:bg-gray-800 transition shadow-sm">
              <div className={`p-3 rounded-full ${n.type === 'like' ? 'bg-pink-900/30 text-pink-500' : 'bg-blue-900/30 text-blue-500'}`}>
                {n.type === 'like' ? <Heart size={18}/> : <UserCheck size={18}/>}
              </div>
              <div>
                <p className="text-sm"><span className="font-bold text-gray-200">{n.fromName}</span> {n.type === 'like' ? 'liked your post.' : 'started following you.'}</p>
                <p className="text-xs text-gray-500 mt-1">Just now</p>
              </div>
            </div>
          ))}
          {notifs.length === 0 && <p className="text-gray-500 text-center py-20 bg-gray-900/30 rounded-lg border border-gray-800/50">No notifications yet.</p>}
        </div>
      </div>
    );
};

// --- CineGenie AI View ---
export const CineGenieView = ({ user }: { user: any }) => {
    const [messages, setMessages] = useState([
      { role: 'ai', text: "👋 Hi! I'm CineGenie. I can recommend movies, explain endings, or find where to watch your favorite shows. Ask me anything!" }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const endRef = useRef<any>(null);
  
    const handleSend = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!input.trim()) return;
  
      const userMsg = { role: 'user', text: input };
      setMessages(prev => [...prev, userMsg]);
      setInput('');
      setLoading(true);
  
      const prompt = `You are CineGenie, a passionate and helpful movie expert AI. 
      User Query: "${userMsg.text}"
      Provide a helpful, concise, and friendly response. If recommending movies, mention the genre and why it fits.`;
      
      const aiResponseText = await generateGeminiResponse(prompt);
      
      setMessages(prev => [...prev, { role: 'ai', text: aiResponseText }]);
      setLoading(false);
    };
  
    useEffect(() => {
      endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);
  
    return (
      <div className="max-w-4xl mx-auto p-4 h-[calc(100vh-80px)] flex flex-col">
        <div className="bg-gradient-to-r from-purple-900 to-blue-900 p-6 rounded-2xl mb-4 flex items-center gap-4 shadow-lg border border-white/10">
          <div className="bg-white/20 p-3 rounded-full">
            <Sparkles size={24} className="text-yellow-300 animate-pulse"/>
          </div>
          <div>
              <h2 className="text-2xl font-bold text-white">CineGenie AI</h2>
              <p className="text-purple-200 text-xs">Powered by Gemini 2.5</p>
          </div>
        </div>
        
        <div className="flex-1 bg-gray-900/50 rounded-2xl border border-gray-800 overflow-y-auto p-4 space-y-6 custom-scrollbar">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] p-4 rounded-2xl shadow-md ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-gray-800 text-gray-200 rounded-tl-none border border-gray-700'}`}>
                <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
              </div>
            </div>
          ))}
          {loading && (
             <div className="flex justify-start animate-pulse">
                <div className="bg-gray-800 p-4 rounded-2xl rounded-tl-none border border-gray-700">
                   <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-75"></div>
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-150"></div>
                   </div>
                </div>
             </div>
          )}
          <div ref={endRef}></div>
        </div>
        <form onSubmit={handleSend} className="mt-4 flex gap-2">
          <input 
            value={input} 
            onChange={(e) => setInput(e.target.value)} 
            placeholder="Ask for recommendations, trivia, or facts..." 
            className="flex-1 bg-gray-900 border border-gray-700 rounded-full px-6 py-4 text-white focus:border-purple-500 outline-none shadow-lg transition"
          />
          <button disabled={loading} className="bg-purple-600 hover:bg-purple-700 text-white p-4 rounded-full shadow-lg transition disabled:opacity-50">
             <Send size={20}/>
          </button>
        </form>
      </div>
    );
};