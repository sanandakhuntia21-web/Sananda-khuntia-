import React, { useState } from 'react';
import { Home, Compass, PlusSquare, Bell, Layers, Bot, User, X, LogOut, Settings, Moon, Sun, Monitor } from 'lucide-react';
import firebase from 'firebase/compat/app';
import { auth, db, appId } from '../services/firebase';

// --- Sidebar ---
export const Sidebar = ({ active, onNavigate, user }: { active: string, onNavigate: (page: string, data?: any) => void, user: any }) => {
  const links = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'feed', label: 'Feed', icon: Compass },
    { id: 'upload', label: 'Studio', icon: PlusSquare },
    { id: 'notifications', label: 'Activity', icon: Bell },
    { id: 'library', label: 'Library', icon: Layers },
    { id: 'cinegenie', label: 'AI Genie', icon: Bot },
    { id: 'profile', label: 'My Channel', icon: User },
  ];

  return (
    <div className="w-64 bg-black border-r border-gray-800 hidden md:flex flex-col sticky top-16 h-[calc(100vh-64px)]">
      <div className="p-4 space-y-1">
        {links.map(link => (
          <button 
            key={link.id}
            onClick={() => onNavigate(link.id === 'profile' ? 'profile' : link.id, user?.uid)}
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all font-medium ${active === link.id ? 'bg-red-600 text-white shadow-lg shadow-red-900/20' : 'text-gray-400 hover:bg-gray-900 hover:text-white'}`}
          >
            <link.icon size={20}/>
            {link.label}
          </button>
        ))}
      </div>
      
      <div className="mt-auto p-6 border-t border-gray-800">
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-3">Personal</p>
        {user ? (
             <div className="flex items-center gap-3 text-gray-400 hover:text-white cursor-pointer" onClick={() => onNavigate('profile', user.uid)}>
             <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center text-xs font-bold border border-gray-700">
               {user.email?.[0]?.toUpperCase() || user.displayName?.[0]?.toUpperCase() || '?'}
             </div>
             <div className="flex-1 min-w-0">
               <p className="text-sm font-bold truncate">{user.displayName || 'User'}</p>
               <p className="text-xs truncate text-gray-500">View Profile</p>
             </div>
          </div>
        ) : (
            <p className="text-sm text-gray-500 italic">Guest Mode</p>
        )}
      </div>
    </div>
  );
};

// --- Auth Modal ---
export const AuthModal = ({ isOpen, onClose, onLogin }: { isOpen: boolean, onClose: () => void, onLogin: (u: any) => void }) => {
    const [isRegister, setIsRegister] = useState(false);
    const [step, setStep] = useState('details');
    const [formData, setFormData] = useState({ email: '', password: '', phone: '', name: '' });
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
  
    if (!isOpen) return null;
  
    const handleVerifyAndRegister = async (e: React.FormEvent) => {
      e.preventDefault();
      if (otp !== '123456') return alert("Invalid OTP. Use 123456.");
      setLoading(true);
      try {
        if (!auth) throw new Error("Authentication service unavailable.");
        const cred = await auth.createUserWithEmailAndPassword(formData.email, formData.password);
        await cred.user.updateProfile({ displayName: formData.name });
        // Create user doc
        if (db) {
            await db.doc(`artifacts/${appId}/public/data/users/${cred.user.uid}`).set({
                uid: cred.user.uid,
                name: formData.name,
                email: formData.email,
                role: 'user',
                followers: [],
                following: [],
                watchLater: [],
                likedMovies: [],
                playlists: [],
                bio: 'ReelNexus Creator',
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
              });
        }
        onLogin(cred.user);
        onClose();
      } catch (err: any) { alert(err.message); } finally { setLoading(false); }
    };
  
    const handleLogin = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      try {
        if (!auth) throw new Error("Authentication service unavailable.");
        const cred = await auth.signInWithEmailAndPassword(formData.email, formData.password);
        onLogin(cred.user);
        onClose();
      } catch (err: any) { alert(err.message); } finally { setLoading(false); }
    };
  
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
        <div className="bg-gray-900 w-full max-w-md rounded-2xl p-8 border border-gray-800 text-white relative shadow-2xl">
          <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white"><X size={20}/></button>
          <h2 className="text-2xl font-bold text-white mb-6 text-center">{isRegister ? (step === 'otp' ? 'Verify OTP' : 'Create Account') : 'Welcome Back'}</h2>
          
          {step === 'otp' ? (
             <div className="space-y-4">
               <div className="bg-blue-900/30 border border-blue-500/50 p-4 rounded-lg text-sm text-blue-200">
                 <p className="font-bold mb-1">ℹ️ Demo Verification</p> 
                 Real SMS is disabled. Please use code <b>123456</b> to verify.
               </div>
               <input value={otp} onChange={e=>setOtp(e.target.value)} className="w-full bg-gray-950 border border-gray-700 p-4 rounded-lg text-white text-center tracking-[1em] font-mono text-xl focus:border-green-500 outline-none transition" placeholder="000000"/>
               <button onClick={handleVerifyAndRegister} className="w-full bg-green-600 hover:bg-green-700 py-3 rounded-lg font-bold text-white transition disabled:opacity-50" disabled={loading}>{loading ? 'Verifying...' : 'Verify & Sign Up'}</button>
             </div>
          ) : (
             <form onSubmit={isRegister ? (e) => {e.preventDefault(); setStep('otp')} : handleLogin} className="space-y-4">
               {isRegister && <input value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} placeholder="Full Name" className="w-full bg-black border border-gray-700 p-3 rounded-lg text-white focus:border-red-600 outline-none transition"/>}
               <input value={formData.email} onChange={e=>setFormData({...formData, email: e.target.value})} placeholder="Email Address" type="email" className="w-full bg-black border border-gray-700 p-3 rounded-lg text-white focus:border-red-600 outline-none transition"/>
               <input type="password" value={formData.password} onChange={e=>setFormData({...formData, password: e.target.value})} placeholder="Password" className="w-full bg-black border border-gray-700 p-3 rounded-lg text-white focus:border-red-600 outline-none transition"/>
               {isRegister && <input value={formData.phone} onChange={e=>setFormData({...formData, phone: e.target.value})} placeholder="Phone Number" className="w-full bg-black border border-gray-700 p-3 rounded-lg text-white focus:border-red-600 outline-none transition"/>}
               <button type="submit" className="w-full bg-red-600 hover:bg-red-700 py-3 rounded-lg font-bold text-white transition shadow-lg shadow-red-900/30 disabled:opacity-50" disabled={loading}>{loading ? 'Processing...' : (isRegister ? 'Next' : 'Login')}</button>
             </form>
          )}
          <p onClick={() => setIsRegister(!isRegister)} className="text-gray-400 text-center mt-6 cursor-pointer hover:text-white text-sm">
            {isRegister ? 'Already have an account? Login' : "Don't have an account? Sign Up"}
          </p>
        </div>
      </div>
    );
};

// --- Trailer Modal ---
export const TrailerModal = ({ isOpen, onClose, trailerId }: { isOpen: boolean, onClose: () => void, trailerId: string }) => {
    if (!isOpen) return null;
    return (
      <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 animate-fade-in backdrop-blur-sm">
        <button onClick={onClose} className="absolute top-6 right-6 text-white hover:text-red-500 transition bg-black/50 p-2 rounded-full"><X size={32} /></button>
        <div className="w-full max-w-5xl aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-gray-800">
          <iframe width="100%" height="100%" src={`https://www.youtube.com/embed/${trailerId}?autoplay=1`} title="Trailer" frameBorder="0" allowFullScreen></iframe>
        </div>
      </div>
    );
};