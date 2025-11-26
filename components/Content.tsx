import React, { useState, useRef } from 'react';
import { Play, VolumeX, Check, Gamepad2, Trophy, HelpCircle, Heart, MessageCircle, Share, Film, UploadCloud, X, ArrowLeft, BarChart3, Star } from 'lucide-react';
import { Movie, Post } from '../types';
import { generateGeminiResponse } from '../services/gemini';
import firebase from 'firebase/compat/app';
import { db, appId } from '../services/firebase';

// --- Movie Hover Card ---
export const MovieHoverCard = ({ movie, onNavigate }: { movie: Movie, onNavigate: (page: string, data: any) => void }) => {
    const [isHovered, setIsHovered] = useState(false);
    const [playTrailer, setPlayTrailer] = useState(false);
    const timerRef = useRef<any>(null);
  
    const handleMouseEnter = () => {
      setIsHovered(true);
      timerRef.current = setTimeout(() => {
        setPlayTrailer(true);
      }, 1500);
    };
  
    const handleMouseLeave = () => {
      setIsHovered(false);
      setPlayTrailer(false);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  
    return (
      <div 
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={() => onNavigate('movie', movie)}
        className="flex-shrink-0 w-64 md:w-80 cursor-pointer group transition-all duration-500 hover:scale-110 hover:z-20 relative rounded-lg"
      >
        <div className="aspect-video rounded-lg overflow-hidden relative shadow-lg bg-gray-900 border border-gray-800">
           {!playTrailer ? (
              <img src={movie.backdrop} className="w-full h-full object-cover transition-opacity duration-500" loading="lazy" alt={movie.title}/>
           ) : (
              <iframe 
                 src={`https://www.youtube.com/embed/${movie.trailerId}?autoplay=1&mute=1&controls=0&modestbranding=1&loop=1`} 
                 className="w-full h-full object-cover pointer-events-none" 
                 title={movie.title}
              />
           )}
           
           <div className="absolute top-2 left-2 z-20">
              <span className={`px-2 py-0.5 rounded-sm text-[10px] font-bold shadow-md ${movie.ageRating === 'A (18+)' ? 'bg-red-600 text-white' : 'bg-gray-800/90 text-gray-200 border border-gray-600'}`}>
                 {movie.ageRating || 'U/A'}
              </span>
           </div>
           
           <div className={`absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'} flex flex-col justify-end p-4`}>
               {playTrailer && <div className="absolute top-2 right-2 bg-black/50 p-1 rounded-full"><VolumeX size={14} className="text-white"/></div>}
               <h4 className="text-white font-bold text-lg leading-tight drop-shadow-md">{movie.title}</h4>
               <div className="flex gap-2 text-xs text-gray-200 mt-1 font-medium">
                 <span className="text-green-400">{movie.rating} ★</span>
                 <span>{movie.year}</span>
                 <span className="border border-gray-500 px-1 rounded text-[10px]">{movie.type}</span>
               </div>
           </div>
        </div>
      </div>
    );
};

// --- AI Quiz ---
export const AIQuizModule = ({ movie, user }: { movie: Movie, user: any }) => {
    const [quiz, setQuiz] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [result, setResult] = useState<'correct' | 'incorrect' | null>(null);
  
    const startQuiz = async () => {
      setLoading(true);
      const prompt = `Generate a single multiple-choice trivia question about the movie "${movie.title}". 
      Format strictly as: Question|Option1|Option2|Option3|Option4|CorrectOptionIndex(0-3).`;
      
      const response = await generateGeminiResponse(prompt);
      try {
        const parts = response.split('|');
        if (parts.length === 6) {
          setQuiz({
            question: parts[0],
            options: [parts[1], parts[2], parts[3], parts[4]],
            correct: parseInt(parts[5])
          });
        } else {
            // Fallback
          setQuiz({
            question: `In which year was ${movie.title} released?`,
            options: [(movie.year-1).toString(), movie.year.toString(), (movie.year+1).toString(), (movie.year+2).toString()],
            correct: 1
          });
        }
      } catch (e) {
        console.error("Quiz Parse Error", e);
      }
      setLoading(false);
    };
  
    const handleAnswer = (index: number) => {
      if (selectedOption !== null) return;
      setSelectedOption(index);
      setResult(index === quiz.correct ? 'correct' : 'incorrect');
    };
  
    return (
      <div className="bg-gradient-to-br from-purple-900/40 to-blue-900/40 border border-purple-500/30 rounded-xl p-6 mt-6 relative overflow-hidden shadow-xl">
        <div className="flex items-center justify-between mb-4 relative z-10">
           <h3 className="text-white font-bold text-lg flex items-center gap-2"><Gamepad2 className="text-yellow-400"/> CineTrivia Challenge</h3>
           {!quiz && (
             <button onClick={startQuiz} disabled={loading} className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-4 py-1.5 rounded-full text-xs transition shadow-lg shadow-yellow-500/20">
               {loading ? 'Generating...' : 'Start Quiz'}
             </button>
           )}
        </div>
        
        {quiz && (
          <div className="animate-fade-in relative z-10">
            <p className="text-lg font-bold text-white mb-4 leading-relaxed">{quiz.question}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
               {quiz.options.map((opt: string, i: number) => (
                 <button 
                   key={i}
                   onClick={() => handleAnswer(i)}
                   disabled={selectedOption !== null}
                   className={`p-3 rounded-lg text-left text-sm font-medium transition border 
                     ${selectedOption === null ? 'bg-gray-800/50 border-gray-700 hover:bg-gray-700 hover:border-gray-500 text-gray-200' : ''}
                     ${selectedOption !== null && i === quiz.correct ? 'bg-green-600/20 border-green-500 text-green-400' : ''}
                     ${selectedOption === i && i !== quiz.correct ? 'bg-red-600/20 border-red-500 text-red-400' : ''}
                     ${selectedOption !== null && i !== selectedOption && i !== quiz.correct ? 'opacity-30' : ''}
                   `}
                 >
                   {opt}
                   {selectedOption !== null && i === quiz.correct && <Check size={16} className="float-right"/>}
                 </button>
               ))}
            </div>
            {result && (
              <div className="mt-4 text-center animate-fade-in">
                 {result === 'correct' ? 
                   <span className="text-green-400 font-bold flex items-center justify-center gap-2"><Trophy size={18}/> Correct! You know your stuff.</span> : 
                   <span className="text-red-400 font-bold">Oops! Better luck next time.</span>
                 }
                 <button onClick={() => {setQuiz(null); setSelectedOption(null); setResult(null);}} className="mt-2 text-xs text-gray-400 hover:text-white underline block mx-auto">Play Again</button>
              </div>
            )}
          </div>
        )}
        <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-purple-500/20 blur-3xl rounded-full pointer-events-none"></div>
      </div>
    );
};

// --- Post Card ---
export const PostCard = ({ post, user, onNavigate, movies }: { post: Post, user: any, onNavigate: any, movies: Movie[] }) => {
    const [showComments, setShowComments] = useState(false);
    const [newComment, setNewComment] = useState("");
    const [commentList, setCommentList] = useState(post.comments || []);
    const [voteSubmitted, setVoteSubmitted] = useState(false);
  
    const handleComment = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!user) return alert("Please login to comment.");
      if (!newComment.trim()) return;
  
      const commentData = {
        uid: user.uid,
        name: user.displayName || "User",
        text: newComment,
        createdAt: Date.now() 
      };
      
      if (db) {
        const ref = db.doc(`artifacts/${appId}/public/data/posts/${post.id}`);
        await ref.update({ comments: firebase.firestore.FieldValue.arrayUnion(commentData) });
      }
      setCommentList([...commentList, commentData]);
      setNewComment("");
    };
  
    const handleLike = async () => {
      if (!user) return alert("Please login to like.");
      if (db) {
        const ref = db.doc(`artifacts/${appId}/public/data/posts/${post.id}`);
        if (post.likes?.includes(user.uid)) {
            await ref.update({ likes: firebase.firestore.FieldValue.arrayRemove(user.uid) });
        } else {
            await ref.update({ likes: firebase.firestore.FieldValue.arrayUnion(user.uid) });
        }
      }
    };
  
    const linkedMovie = movies.find(m => m.id === post.channel);
  
    const renderText = (text?: string) => {
        if (!text) return null;
        const parts = text.split(/(@\w+)/g);
        return parts.map((part, i) => 
          part.startsWith('@') ? <span key={i} className="text-blue-400 font-bold cursor-pointer hover:underline">{part}</span> : part
        );
    };

    return (
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden mb-4 animate-fade-in hover:border-gray-700 transition">
        <div className="p-4 flex items-center gap-3">
          <div onClick={() => onNavigate('profile', post.uid)} className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center font-bold text-white cursor-pointer shadow-lg">
            {post.name?.[0]?.toUpperCase() || '?'}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h4 onClick={() => onNavigate('profile', post.uid)} className="font-bold text-white cursor-pointer hover:underline">{post.name}</h4>
              <span className="text-xs text-gray-500">• Just now</span>
              {post.channel !== 'general' && linkedMovie && (
                <span 
                  onClick={() => onNavigate('movie', linkedMovie)}
                  className="text-[10px] font-bold text-gray-300 bg-gray-800 px-2 py-0.5 rounded-full flex items-center gap-1 cursor-pointer hover:bg-gray-700 ml-auto border border-gray-700"
                >
                  <Film size={10}/> {linkedMovie.title}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500">@{post.name?.replace(/\s/g,'').toLowerCase()}</p>
          </div>
        </div>
  
        <div className="px-4 pb-2">
          {post.type === 'quiz' && post.quiz ? (
              <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700">
                  <div className="flex items-center gap-2 mb-3 text-yellow-400 font-bold text-sm">
                     <HelpCircle size={16}/> TRIVIA CHALLENGE
                  </div>
                  <h3 className="text-lg font-bold text-white mb-4">{post.quiz.question}</h3>
                  <div className="space-y-2">
                      {post.quiz.options.map((opt, i) => (
                          <button 
                             key={i}
                             onClick={() => setVoteSubmitted(true)}
                             disabled={voteSubmitted}
                             className={`w-full p-3 rounded-lg text-left text-sm font-medium transition relative overflow-hidden ${voteSubmitted && i === post.quiz?.correct ? 'bg-green-600/20 border border-green-500 text-green-400' : 'bg-gray-700/50 hover:bg-gray-700 text-gray-200'}`}
                          >
                             <span className="relative z-10">{opt}</span>
                             {voteSubmitted && (
                                 <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold">
                                     {i === post.quiz?.correct ? 'Correct' : ''} 
                                 </span>
                             )}
                          </button>
                      ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-3 text-center">{voteSubmitted ? "Thanks for voting!" : "Vote to see results"}</p>
              </div>
          ) : (
              <>
                  <p className="text-white mb-3 whitespace-pre-wrap leading-relaxed">{renderText(post.text)}</p>
                  {post.mediaUrl && (
                      <img src={post.mediaUrl} className="w-full h-auto max-h-[500px] object-cover bg-black rounded-lg border border-gray-800" loading="lazy" alt="Post content" />
                  )}
              </>
          )}
        </div>
  
        <div className="p-4 border-t border-gray-800">
          <div className="flex justify-between items-center mb-2">
            <div className="flex gap-6">
              <button onClick={handleLike} className={`flex items-center gap-2 transition ${post.likes?.includes(user?.uid) ? 'text-pink-500' : 'text-gray-400 hover:text-pink-500'}`}>
                <Heart size={20} className={post.likes?.includes(user?.uid) ? 'fill-current' : ''}/>
                <span className="text-sm font-bold">{post.likes?.length || 0}</span>
              </button>
              <button onClick={() => setShowComments(!showComments)} className="flex items-center gap-2 text-gray-400 hover:text-blue-500 transition">
                <MessageCircle size={20}/>
                <span className="text-sm font-bold">{commentList.length}</span>
              </button>
              <button className="text-gray-400 hover:text-green-500 transition"><Share size={20}/></button>
            </div>
          </div>
  
          {showComments && (
            <div className="pt-4 border-t border-gray-800 animate-fade-in">
              <div className="space-y-3 mb-4 max-h-48 overflow-y-auto custom-scrollbar">
                {commentList.map((c, i) => (
                  <div key={i} className="flex gap-2 text-sm">
                    <span className="font-bold text-white">{c.name}:</span>
                    <span className="text-gray-300">{renderText(c.text)}</span>
                  </div>
                ))}
                {commentList.length === 0 && <p className="text-xs text-gray-500">No comments yet.</p>}
              </div>
              {user && (
                <form onSubmit={handleComment} className="flex gap-2">
                  <input 
                    value={newComment} 
                    onChange={e => setNewComment(e.target.value)}
                    placeholder="Reply or tag @someone..." 
                    className="flex-1 bg-black border border-gray-700 rounded-full px-4 py-1.5 text-sm text-white outline-none focus:border-blue-500"
                  />
                  <button type="submit" className="text-blue-500 font-bold text-xs uppercase hover:text-blue-400">Post</button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    );
};

// --- Rating Components ---
export const RatingSpeedometer = ({ value, onChange, interactive = false }: { value: number, onChange: (v: number) => void, interactive?: boolean }) => {
    const segments = [
      { label: "Very Bad", color: "#ef4444" },
      { label: "Bad", color: "#f97316" },
      { label: "Normal", color: "#eab308" },
      { label: "Good", color: "#84cc16" },
      { label: "Very Good", color: "#22c55e" },
      { label: "Excellent", color: "#14b8a6" },
      { label: "Go for it", color: "#06b6d4" },
      { label: "Perfect", color: "#3b82f6" }
    ];
  
    const angle = (value / (segments.length - 1)) * 180; 
  
    return (
      <div className="flex flex-col items-center">
        <div className="relative w-64 h-32 overflow-hidden mb-4">
          <div className="absolute top-0 left-0 w-full h-full rounded-t-full bg-gray-800 border-4 border-gray-700 border-b-0 flex overflow-hidden">
             {segments.map((seg, i) => (
               <div 
                 key={i} 
                 onClick={() => interactive && onChange(i)}
                 className={`flex-1 h-full border-r border-gray-900/30 ${interactive ? 'cursor-pointer hover:opacity-80' : ''}`}
                 style={{ backgroundColor: seg.color, opacity: 0.2 }}
                 title={seg.label}
               ></div>
             ))}
          </div>
          <div 
             className="absolute top-0 left-0 w-full h-full rounded-t-full pointer-events-none"
             style={{
               background: `conic-gradient(from 270deg at 50% 100%, ${segments[value]?.color || 'transparent'} ${angle}deg, transparent 0deg)`,
               opacity: 0.5,
               transition: 'all 0.5s ease-out'
             }}
          ></div>
          <div 
            className="absolute bottom-0 left-1/2 w-1 h-28 bg-white origin-bottom rounded-full shadow-lg"
            style={{ 
              transform: `translateX(-50%) rotate(${angle - 90}deg)`,
              transition: 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)'
            }}
          >
             <div className="w-3 h-3 bg-white rounded-full absolute -top-1 -left-1 shadow-[0_0_10px_rgba(255,255,255,0.8)]"></div>
          </div>
          <div className="absolute bottom-0 left-1/2 w-4 h-4 bg-white rounded-full -translate-x-1/2 translate-y-1/2 shadow-xl z-10"></div>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-400 uppercase tracking-widest font-bold mb-1">Audience Verdict</p>
          <p className="text-2xl font-black" style={{ color: segments[value]?.color }}>
            {segments[value]?.label || "Select Rating"}
          </p>
        </div>
        {interactive && (
          <div className="flex justify-between w-full max-w-xs mt-4 px-2">
             <button onClick={() => onChange(Math.max(0, value - 1))} className="p-2 bg-gray-800 rounded-full hover:bg-gray-700"><ArrowLeft size={16}/></button>
             <div className="text-xs text-gray-500 flex flex-col items-center justify-center">
                <span>Adjust Rating</span>
             </div>
             <button onClick={() => onChange(Math.min(7, value + 1))} className="p-2 bg-gray-800 rounded-full hover:bg-gray-700"><ArrowLeft size={16} className="rotate-180"/></button>
          </div>
        )}
      </div>
    );
};