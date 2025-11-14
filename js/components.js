// js/components.js
import { supabase } from './supabaseClient.js';
import { createElement, useState, useEffect, useRef } from 'https://cdn.jsdelivr.net/npm/react@18.2.0/+esm';
import React from 'https://cdn.jsdelivr.net/npm/react@18.2.0/+esm';
import ReactDOM from 'https://cdn.jsdelivr.net/npm/react-dom@18.2.0/+esm';

const { useCallback } = React;

function useAuthState() {
  const [user, setUser] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let mounted=true;
    async function init(){
      const { data } = await supabase.auth.getSession();
      setUser(data?.session?.user ?? null);
      setLoading(false);
    }
    init();

    const { subscription } = supabase.auth.onAuthStateChange((_ev,sess) => {
      setUser(sess?.user ?? null);
    });

    return () => { mounted=false; subscription?.unsubscribe?.(); };
  }, []);

  return { user, loading };
}

function Header({ user, onSignOut, goTo }) {
  return (
    <div className="app-shell flex items-center justify-between py-4">
      <div className="flex items-center gap-4">
        <div className="header-title cursor-pointer" onClick={()=>goTo('feed')}>Synq</div>
        <div className="small-muted hidden sm:block">Creators • Privacy • Discovery</div>
      </div>

      <div className="flex items-center gap-3">
        <button className="px-3 py-2 rounded-lg card" onClick={()=>goTo('feed')}>Feed</button>
        <button className="px-3 py-2 rounded-lg card" onClick={()=>goTo('profile')}>Profile</button>
        <button className="px-3 py-2 rounded-lg card" onClick={()=>goTo('notifications')}>Notifications</button>
        {user ? (
          <button className="px-3 py-2 rounded-lg bg-red-600 hover:opacity-90" onClick={onSignOut}>Sign out</button>
        ) : null}
      </div>
    </div>
  );
}

function Toast({ message }) {
  if (!message) return null;
  return <div className="toast">{message}</div>;
}

/* --------------------
   AUTH COMPONENT
   -------------------- */
function Auth({ onSuccess, showToast }) {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [mode, setMode] = React.useState('login'); // login | signup
  const [loading, setLoading] = React.useState(false);

  async function submit(e){
    e?.preventDefault();
    setLoading(true);
    if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({ email, password }, { options: { emailRedirectTo: window.location.href }});
      if (error) showToast(error.message);
      else showToast('Check email to confirm (if email confirmation enabled).');
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) showToast(error.message);
      else {
        showToast('Signed in');
        onSuccess?.();
      }
    }
    setLoading(false);
  }

  return (
    <div className="max-w-xl mx-auto mt-8 p-6 card">
      <h2 className="text-2xl font-bold mb-2">Sign in or create account</h2>
      <form onSubmit={submit} className="space-y-3">
        <input className="input w-full p-3 rounded-lg bg-transparent border border-slate-700" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
        <input className="input w-full p-3 rounded-lg bg-transparent border border-slate-700" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} type="password" />
        <div className="flex gap-2">
          <button className="px-4 py-2 rounded-lg bg-violet-600" type="submit">{loading? '...' : mode==='login' ? 'Sign In' : 'Sign Up'}</button>
          <button type="button" className="px-4 py-2 rounded-lg card" onClick={()=>setMode(mode==='login'?'signup':'login')}>{mode==='login'?'Create account':'Have an account?'}</button>
        </div>
      </form>
    </div>
  );
}

/* --------------------
   COMPOSER
   -------------------- */
function Composer({ user, onPosted, showToast }) {
  const [text, setText] = React.useState('');
  const [file, setFile] = React.useState(null);
  const [loading, setLoading] = React.useState(false);

  async function submit(){
    if (!text.trim() && !file) { showToast('Add text or image'); return; }
    setLoading(true);

    try {
      let image_url = null;
      if (file) {
        const path = `posts/${user.id}/${Date.now()}-${file.name}`;
        const { error: uploadErr } = await supabase.storage.from('posts').upload(path, file);
        if (uploadErr) throw uploadErr;
        const { data } = supabase.storage.from('posts').getPublicUrl(path);
        image_url = data.publicUrl;
      }

      const { error } = await supabase.from('posts').insert([{
        user_id: user.id,
        username: user.user_metadata?.username ?? user.email.split('@')[0],
        content: text,
        image_url
      }]);

      if (error) throw error;
      setText('');
      setFile(null);
      onPosted?.();
      showToast('Posted!');
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Failed to post');
    } finally { setLoading(false); }
  }

  return (
    <div className="card my-4">
      <textarea className="w-full p-3 bg-transparent border border-slate-700 rounded-lg" rows="3" placeholder="What's happening?" value={text} onChange={e=>setText(e.target.value)}></textarea>
      <div className="flex items-center gap-3 mt-3">
        <input type="file" onChange={e=>setFile(e.target.files[0])} />
        <div className="flex-1" />
        <button className="px-4 py-2 rounded-lg bg-emerald-500" onClick={submit} disabled={loading}>{loading?'Posting...':'Post'}</button>
      </div>
    </div>
  );
}

/* --------------------
   POST CARD
   -------------------- */
function PostCard({ post, currentUser, onAction, showToast }) {
  const [likesCount, setLikesCount] = React.useState(post.likes_count ?? 0);
  const [liked, setLiked] = React.useState(post.is_liked ?? false);
  const [comments, setComments] = React.useState([]);
  const [commentText, setCommentText] = React.useState('');
  const [saving, setSaving] = React.useState(false);

  useEffect(()=> {
    setLikesCount(post.likes_count ?? 0);
    setLiked(post.is_liked ?? false);
  }, [post]);

  async function toggleLike(){
    // optimistic
    const prevLiked = liked;
    setLiked(!prevLiked);
    setLikesCount(c => prevLiked ? c-1 : c+1);

    try {
      if (prevLiked) {
        await supabase.from('likes').delete().eq('post_id', post.id).eq('user_id', currentUser.id);
      } else {
        await supabase.from('likes').insert([{ post_id: post.id, user_id: currentUser.id }]);
        if (post.user_id !== currentUser.id) {
          await supabase.from('notifications').insert([{ user_id: post.user_id, type: 'like', content: `${currentUser.email} liked your post`, from_user_id: currentUser.id }]);
        }
      }
      onAction?.();
    } catch (err) {
      console.error(err);
      // rollback
      setLiked(prevLiked);
      setLikesCount(c => prevLiked ? c+1 : c-1);
      showToast('Action failed');
    }
  }

  async function postComment(){
    if (!commentText.trim()) return;
    setSaving(true);
    try {
      await supabase.from('comments').insert([{ post_id: post.id, user_id: currentUser.id, username: currentUser.user_metadata?.username ?? currentUser.email.split('@')[0], content: commentText }]);
      setCommentText('');
      onAction?.();
      showToast('Comment added');
    } catch (err) {
      console.error(err);
      showToast('Failed to add comment');
    } finally { setSaving(false); }
  }

  return (
    <div className="card my-4">
      <div className="flex items-start gap-3">
        <div className="avatar">{(post.username || post.user_id || 'U').slice(0,1).toUpperCase()}</div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold">{post.username ?? 'User'}</div>
              <div className="small-muted text-xs">{new Date(post.created_at).toLocaleString()}</div>
            </div>
          </div>

          <div className="mt-3 whitespace-pre-wrap">{post.content}</div>
          {post.image_url && <img src={post.image_url} alt="post image" className="rounded-lg mt-3 w-full max-h-96 object-cover" />}

          <div className="flex items-center gap-3 mt-3">
            <button className={`px-3 py-1 rounded-lg ${liked ? 'bg-pink-600' : 'card'}`} onClick={toggleLike}>❤️ {likesCount}</button>
            <button className="px-3 py-1 rounded-lg card">💬 {post.comments_count ?? 0}</button>
          </div>

          <div className="mt-3">
            <input className="w-full p-2 rounded-lg bg-transparent border border-slate-700" placeholder="Write a comment..." value={commentText} onChange={e=>setCommentText(e.target.value)} />
            <div className="flex justify-end mt-2">
              <button className="px-3 py-1 rounded-lg bg-sky-600" onClick={postComment} disabled={saving}>{saving?'...' : 'Reply'}</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* --------------------
   FEED COMPONENT
   -------------------- */
function Feed({ user, showToast }) {
  const [posts, setPosts] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      // Fetch posts with counts and whether current user liked/saved
      const { data } = await supabase.rpc('get_feed', { p_user_id: user?.id ?? null, p_limit: 30 });
      // rpc returns posts with likes_count, comments_count and is_liked fields when implemented
      setPosts(data ?? []);
    } catch (err) {
      console.error(err);
      showToast('Failed to load feed');
    } finally { setLoading(false); }
  }, [user, showToast]);

  React.useEffect(() => {
    if (user) load();
    // subscribe realtime posts + likes + comments changes
    const subs = [
      supabase.channel('all-posts').on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => load()),
      supabase.channel('all-likes').on('postgres_changes', { event: '*', schema: 'public', table: 'likes' }, () => load()),
      supabase.channel('all-comments').on('postgres_changes', { event: '*', schema: 'public', table: 'comments' }, () => load())
    ];

    subs.forEach(s => s.subscribe());
    return () => subs.forEach(s => s.unsubscribe());
  }, [user, load]);

  return (
    <div>
      <Composer user={user} onPosted={load} showToast={showToast} />
      {loading ? <div className="small-muted">Loading feed...</div> : null}
      {posts.map(p => <PostCard key={p.id} post={p} currentUser={user} onAction={load} showToast={showToast} />)}
    </div>
  );
}

/* --------------------
   Profile
   -------------------- */
function Profile({ user, showToast }) {
  const [posts, setPosts] = React.useState([]);

  React.useEffect(()=> {
    async function load(){
      const { data } = await supabase.from('posts').select('*').eq('user_id', user.id).order('created_at', {ascending:false});
      setPosts(data ?? []);
    }
    load();
  }, [user]);

  return (
    <div>
      <div className="card p-4 mb-4">
        <div className="flex items-center gap-4">
          <div className="avatar text-2xl">{(user.user_metadata?.username ?? user.email)[0].toUpperCase()}</div>
          <div>
            <div className="text-xl font-bold">{user.user_metadata?.username ?? user.email.split('@')[0]}</div>
            <div className="small-muted">{user.user_metadata?.bio ?? 'No bio yet'}</div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">Posts</h3>
        {posts.map(p => <PostCard key={p.id} post={p} currentUser={user} showToast={showToast} />)}
      </div>
    </div>
  );
}

/* --------------------
   Notifications
   -------------------- */
function Notifications({ user }) {
  const [items, setItems] = React.useState([]);
  useEffect(()=> {
    async function load(){
      const { data } = await supabase.from('notifications').select('*').eq('user_id', user.id).order('created_at', { ascending:false }).limit(50);
      setItems(data ?? []);
    }
    load();
  }, [user]);

  return (
    <div>
      <h3 className="text-lg font-semibold mb-3">Notifications</h3>
      {items.length===0 ? <div className="small-muted">No notifications yet</div> : items.map(n => (
        <div key={n.id} className="card my-2 p-3">
          <div className="font-medium">{n.content}</div>
          <div className="small-muted text-xs mt-1">{new Date(n.created_at).toLocaleString()}</div>
        </div>
      ))}
    </div>
  );
}

/* --------------------
   MAIN APP
   -------------------- */
export function AppRoot() {
  const { user, loading } = useAuthState();
  const [route, setRoute] = React.useState('feed'); // 'feed' | 'profile' | 'notifications' | 'auth'
  const [toast, setToast] = React.useState('');

  useEffect(()=> {
    if (!user) setRoute('auth');
    else setRoute('feed');
  }, [user]);

  async function signOut() {
    await supabase.auth.signOut();
  }

  function showToast(msg){
    setToast(msg);
    setTimeout(()=> setToast(''), 3000);
  }

  return (
    <div>
      <Header user={user} onSignOut={signOut} goTo={(r)=>setRoute(r)} />
      <main className="app-shell">
        {route==='auth' && <Auth onSuccess={()=>setRoute('feed')} showToast={showToast} />}
        {route==='feed' && user && <Feed user={user} showToast={showToast} />}
        {route==='profile' && user && <Profile user={user} showToast={showToast} />}
        {route==='notifications' && user && <Notifications user={user} />}
      </main>
      <Toast message={toast} />
    </div>
  );
}

/* mount */
export function mountApp() {
  const root = document.getElementById('root');
  ReactDOM.createRoot(root).render(React.createElement(AppRoot));
}

// auto-mount when module loaded
mountApp();
