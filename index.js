import React, { useState, useEffect, useRef } from 'react';
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { Heart, MessageCircle, Send, User, LogOut, Home, PlusCircle, Search, Bookmark, Menu, X, Camera, Image as ImageIcon, Smile, MoreHorizontal, Edit, Trash2, UserPlus, UserCheck, Bell, Settings, Grid, Film, Share2, Copy, ThumbsUp } from 'lucide-react';

const supabase = createClient(
  'https://qpfjchiucjhfvyohqhih.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwZmpjaGl1Y2poZnZ5b2hxaGloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5MDczMjksImV4cCI6MjA3NTQ4MzMyOX0.kcx9Sr7qGbWudJdf155tXg0gWWX6P1RYavo-lKCoQkU'
);

function FollowersFollowingList({ userId, type }) {
  const [list, setList] = useState([]);
  const [loadingList, setLoadingList] = useState(true);

  useEffect(() => {
    async function fetchList() {
      setLoadingList(true);
      const relationColumn = type === 'followers' ? 'following_id' : 'follower_id';

      const { data } = await supabase
        .from('follows')
        .select('*, follower:profiles!follows_follower_id_fkey(username), following:profiles!follows_following_id_fkey(username)')
        .or(`${relationColumn}.eq.${userId}`)
        .order('created_at', { ascending: false });

      if (data) {
        const users = data.map((item) =>
          type === 'followers'
            ? { id: item.follower_id, username: item.follower?.username || 'User' }
            : { id: item.following_id, username: item.following?.username || 'User' }
        );
        setList(users);
      }
      setLoadingList(false);
    }
    fetchList();
  }, [userId, type]);

  if (loadingList) {
    return <p className="text-gray-400 text-center py-10">Loading...</p>;
  }

  if (list.length === 0) {
    return <p className="text-gray-400 text-center py-10">No {type} found</p>;
  }

  return (
    <div className="space-y-4">
      {list.map((user) => (
        <div key={user.id} className="flex items-center gap-4 p-4 bg-gray-800 rounded-xl">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-bold">
            {user.username[0].toUpperCase()}
          </div>
          <div className="font-semibold">{user.username}</div>
        </div>
      ))}
    </div>
  );
}

export default function Synq() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('login');
  const [posts, setPosts] = useState([]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [newPost, setNewPost] = useState('');
  const [newStory, setNewStory] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [showCreateStory, setShowCreateStory] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState([]);
  const [stories, setStories] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [following, setFollowing] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [savedPosts, setSavedPosts] = useState([]);
  const [userPosts, setUserPosts] = useState([]);
  const [profileView, setProfileView] = useState('posts');
  const [showShareMenu, setShowShareMenu] = useState(null);
  const [editingBio, setEditingBio] = useState(false);
  const [newBio, setNewBio] = useState('');
  const [selectedStory, setSelectedStory] = useState(null);
  const [replyText, setReplyText] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (user) {
      if (view === 'feed') {
        fetchPosts();
        fetchStories();
      } else if (view === 'notifications') {
        fetchNotifications();
      } else if (view === 'profile') {
        fetchUserProfile();
      } else if (view === 'saved') {
        fetchSavedPosts();
      }
    }
  }, [user, view]);

  async function checkUser() {
    const { data: { session } } = await supabase.auth.getSession();
    setUser(session?.user || null);
    setLoading(false);
    if (session?.user) {
      setView('feed');
    }
  }

  async function signUp() {
    setError('');
    setSuccess('');
    if (!username || !email || !password) {
      setError('Please fill in all fields');
      return;
    }
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username, bio: bio || 'New to Synq! 🎉' }
      }
    });
    if (error) {
      setError(error.message);
    } else {
      setSuccess('Check your email to confirm your account!');
    }
  }

  async function signIn() {
    setError('');
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    if (error) {
      setError(error.message);
    } else {
      setUser(data.user);
      setView('feed');
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
    setView('login');
    setPosts([]);
    setStories([]);
  }

  async function createPost() {
    if (!newPost.trim()) return;
    
    const { error } = await supabase.from('posts').insert([
      {
        content: newPost,
        user_id: user.id,
        username: user.user_metadata.username || user.email.split('@')[0],
        image_url: null
      }
    ]);

    if (!error) {
      setNewPost('');
      setShowCreatePost(false);
      fetchPosts();
      setSuccess('Post created successfully! 🎉');
      setTimeout(() => setSuccess(''), 3000);
    }
  }

  async function createStory() {
    if (!newStory.trim()) return;
    
    const { error } = await supabase.from('stories').insert([
      {
        content: newStory,
        user_id: user.id,
        username: user.user_metadata.username || user.email.split('@')[0],
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      }
    ]);

    if (!error) {
      setNewStory('');
      setShowCreateStory(false);
      fetchStories();
      setSuccess('Story shared! Visible for 24 hours ⏰');
      setTimeout(() => setSuccess(''), 3000);
    }
  }

  async function fetchPosts() {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) {
      const postsWithCounts = await Promise.all(data.map(async (post) => {
        const { count: likesCount } = await supabase
          .from('likes')
          .select('*', { count: 'exact', head: true })
          .eq('post_id', post.id);
        
        const { count: commentsCount } = await supabase
          .from('comments')
          .select('*', { count: 'exact', head: true })
          .eq('post_id', post.id);

        const { data: liked } = await supabase
          .from('likes')
          .select('*')
          .eq('post_id', post.id)
          .eq('user_id', user.id)
          .single();

        const { data: saved } = await supabase
          .from('saved_posts')
          .select('*')
          .eq('post_id', post.id)
          .eq('user_id', user.id)
          .single();

        return {
          ...post,
          likes_count: likesCount || 0,
          comments_count: commentsCount || 0,
          is_liked: !!liked,
          is_saved: !!saved
        };
      }));
      setPosts(postsWithCounts);
    }
  }

  async function fetchStories() {
    const { data, error } = await supabase
      .from('stories')
      .select('*')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (data) {
      setStories(data);
    }
  }

  async function fetchNotifications() {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (data) {
      setNotifications(data);
    }
  }

  async function fetchUserProfile() {
    const { data: postsData } = await supabase
      .from('posts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (postsData) {
      setUserPosts(postsData);
    }

    const { count: followingCount } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', user.id);

    const { count: followersCount } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', user.id);

    setFollowing(followingCount || 0);
    setFollowers(followersCount || 0);
  }

  async function fetchSavedPosts() {
    const { data, error } = await supabase
      .from('saved_posts')
      .select('*, posts(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (data) {
      setSavedPosts(data.map(item => item.posts));
    }
  }

  async function toggleLike(postId, isLiked) {
    if (isLiked) {
      await supabase
        .from('likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', user.id);
    } else {
      await supabase.from('likes').insert([
        { post_id: postId, user_id: user.id }
      ]);
      
      const post = posts.find(p => p.id === postId);
      if (post && post.user_id !== user.id) {
        await supabase.from('notifications').insert([
          {
            user_id: post.user_id,
            type: 'like',
            content: `${user.user_metadata.username} liked your post`,
            from_user_id: user.id
          }
        ]);
      }
    }
    fetchPosts();
  }

  async function toggleSave(postId, isSaved) {
    if (isSaved) {
      await supabase
        .from('saved_posts')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', user.id);
      setSuccess('Removed from saved posts');
    } else {
      await supabase.from('saved_posts').insert([
        { post_id: postId, user_id: user.id }
      ]);
      setSuccess('Post saved! 📌');
    }
    setTimeout(() => setSuccess(''), 2000);
    fetchPosts();
  }

  async function addComment(postId) {
    if (!commentText.trim()) return;

    const { error } = await supabase.from('comments').insert([
      {
        post_id: postId,
        user_id: user.id,
        username: user.user_metadata.username || user.email.split('@')[0],
        content: commentText
      }
    ]);

    if (!error) {
      const post = posts.find(p => p.id === postId);
      if (post && post.user_id !== user.id) {
        await supabase.from('notifications').insert([
          {
            user_id: post.user_id,
            type: 'comment',
            content: `${user.user_metadata.username} commented on your post`,
            from_user_id: user.id
          }
        ]);
      }
      setCommentText('');
      fetchComments(postId);
      fetchPosts();
      setSuccess('Comment added! 💬');
      setTimeout(() => setSuccess(''), 2000);
    }
  }

  async function fetchComments(postId) {
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: false });

    if (data) {
      setComments(data);
    }
  }

  async function deletePost(postId) {
    const confirmed = window.confirm('Are you sure you want to delete this post?');
    if (!confirmed) return;

    await supabase.from('posts').delete().eq('id', postId).eq('user_id', user.id);
    fetchPosts();
    setSelectedPost(null);
    setSuccess('Post deleted successfully');
    setTimeout(() => setSuccess(''), 2000);
  }

  async function updateBio() {
    const { error } = await supabase.auth.updateUser({
      data: { bio: newBio }
    });

    if (!error) {
      setUser({ ...user, user_metadata: { ...user.user_metadata, bio: newBio } });
      setEditingBio(false);
      setSuccess('Bio updated! ✨');
      setTimeout(() => setSuccess(''), 2000);
    }
  }

  async function searchUsers() {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const { data: postsData } = await supabase
      .from('posts')
      .select('username, user_id')
      .ilike('username', `%${searchQuery}%`);

    if (postsData) {
      const uniqueUsers = Array.from(new Map(postsData.map(item => [item.user_id, item])).values());
      setSearchResults(uniqueUsers);
    }
  }

  async function followUser(userId) {
    const { error } = await supabase.from('follows').insert([
      { follower_id: user.id, following_id: userId }
    ]);

    if (!error) {
      await supabase.from('notifications').insert([
        {
          user_id: userId,
          type: 'follow',
          content: `${user.user_metadata.username} started following you`,
          from_user_id: user.id
        }
      ]);
      setSuccess('Following! 👥');
      setTimeout(() => setSuccess(''), 2000);
    }
  }

  function sharePost(post) {
    const shareText = `Check out this post on Synq: "${post.content}"`;
    if (navigator.share) {
      navigator.share({
        title: 'Synq Post',
        text: shareText,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(shareText);
      setSuccess('Link copied to clipboard! 📋');
      setTimeout(() => setSuccess(''), 2000);
    }
    setShowShareMenu(null);
  }

  useEffect(() => {
    if (searchQuery) {
      const timer = setTimeout(() => {
        searchUsers();
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl font-black mb-2 bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent animate-pulse">
            Synq
          </div>
          <div className="text-gray-400">Loading...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-5xl font-black mb-2 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
              Synq
            </h1>
            <p className="text-gray-600">Connect, Share, Inspire</p>
          </div>
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-xl text-sm">
              {success}
            </div>
          )}

          <div className="space-y-4">
            {view === 'signup' && (
              <>
                <input
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                />
                <input
                  type="text"
                  placeholder="Bio (optional)"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                />
              </>
            )}
            
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
            />
            
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (view === 'login' ? signIn() : signUp())}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
            />

            <button
              onClick={view === 'login' ? signIn : signUp}
              className="w-full bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 text-white py-3 rounded-xl font-bold hover:shadow-2xl transition-all transform hover:scale-105"
            >
              {view === 'login' ? 'Sign In' : 'Sign Up'}
            </button>

            <button
              onClick={() => {
                setView(view === 'login' ? 'signup' : 'login');
                setError('');
                setSuccess('');
              }}
              className="w-full text-purple-600 hover:text-purple-700 font-semibold"
            >
              {view === 'login' ? "Don't have an account? Sign Up" : 'Already have an account? Sign In'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Success Toast */}
      {success && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded-xl shadow-lg z-50 animate-bounce">
          {success}
        </div>
      )}

      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-3xl font-black bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent cursor-pointer" onClick={() => setView('feed')}>
            Synq
          </h1>
          
          {/* Search Bar */}
          {view === 'search' && (
            <div className="flex-1 max-w-md mx-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                />
              </div>
            </div>
          )}
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setView('feed')}
              className={`p-2 rounded-xl transition-all ${view === 'feed' ? 'bg-purple-600' : 'hover:bg-gray-800'}`}
              title="Home"
            >
              <Home size={24} />
            </button>
            <button
              onClick={() => setView('search')}
              className={`p-2 rounded-xl transition-all ${view === 'search' ? 'bg-purple-600' : 'hover:bg-gray-800'}`}
              title="Search"
            >
              <Search size={24} />
            </button>
            <button
              onClick={() => setView('notifications')}
              className={`p-2 rounded-xl transition-all relative ${view === 'notifications' ? 'bg-purple-600' : 'hover:bg-gray-800'}`}
              title="Notifications"
            >
              <Bell size={24} />
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {notifications.length > 9 ? '9+' : notifications.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setShowCreatePost(true)}
              className="p-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:shadow-lg transition-all"
              title="Create Post"
            >
              <PlusCircle size={24} />
            </button>
            <button
              onClick={() => setView('saved')}
              className={`p-2 rounded-xl transition-all ${view === 'saved' ? 'bg-purple-600' : 'hover:bg-gray-800'}`}
              title="Saved"
            >
              <Bookmark size={24} />
            </button>
            <button
              onClick={() => setView('profile')}
              className={`p-2 rounded-xl transition-all ${view === 'profile' ? 'bg-purple-600' : 'hover:bg-gray-800'}`}
              title="Profile"
            >
              <User size={24} />
            </button>
            <button
              onClick={signOut}
              className="p-2 text-red-400 hover:bg-red-900/20 rounded-xl"
              title="Sign Out"
            >
              <LogOut size={24} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* Search Results */}
        {view === 'search' && (
          <div className="max-w-2xl mx-auto">
            {searchResults.length > 0 ? (
              <div className="bg-gray-900 rounded-2xl p-6">
                <h2 className="text-xl font-bold mb-4">Users</h2>
                <div className="space-y-3">
                  {searchResults.map((result, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-800 rounded-xl hover:bg-gray-750 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-bold">
                          {result.username[0].toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-semibold">{result.username}</h3>
                          <p className="text-sm text-gray-400">Synq User</p>
                        </div>
                      </div>
                      <button
                        onClick={() => followUser(result.user_id)}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-xl font-semibold text-sm transition-colors flex items-center gap-2"
                      >
                        <UserPlus size={16} />
                        Follow
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : searchQuery ? (
              <div className="text-center text-gray-400 mt-10">
                <Search size={48} className="mx-auto mb-4 opacity-50" />
                <p>No users found</p>
              </div>
            ) : (
              <div className="text-center text-gray-400 mt-10">
                <Search size={48} className="mx-auto mb-4 opacity-50" />
                <p>Search for users to connect with</p>
              </div>
            )}
          </div>
        )}

        {/* Notifications */}
        {view === 'notifications' && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-gray-900 rounded-2xl p-6">
              <h2 className="text-2xl font-bold mb-6">Notifications</h2>
              {notifications.length > 0 ? (
                <div className="space-y-3">
                  {notifications.map((notif) => (
                    <div key={notif.id} className="flex items-center gap-3 p-4 bg-gray-800 rounded-xl hover:bg-gray-750 transition-colors">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        notif.type === 'like' ? 'bg-gradient-to-br from-red-400 to-pink-400' :
                        notif.type === 'comment' ? 'bg-gradient-to-br from-blue-400 to-purple-400' :
                        'bg-gradient-to-br from-green-400 to-teal-400'
                      }`}>
                        {notif.type === 'like' ? <Heart size={18} /> : 
                         notif.type === 'comment' ? <MessageCircle size={18} /> : 
                         <UserPlus size={18} />}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm">{notif.content}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(notif.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-400 py-10">
                  <Bell size={48} className="mx-auto mb-4 opacity-50" />
                  <p>No notifications yet</p>
                  <p className="text-sm mt-2">When someone likes or comments on your posts, you'll see it here</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Saved Posts */}
        {view === 'saved' && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-gray-900 rounded-2xl p-6 mb-6">
              <h2 className="text-2xl font-bold mb-6">Saved Posts</h2>
              {savedPosts.length > 0 ? (
                <div className="space-y-6">
                  {savedPosts.map((post) => post && (
                    <div key={post.id} className="bg-gray-800 rounded-xl p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full flex items-center justify-center text-white font-bold">
                          {post.username[0].toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-semibold">{post.username}</h3>
                          <p className="text-xs text-gray-400">
                            {new Date(post.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <p className="text-white whitespace-pre-wrap">{post.content}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-400 py-10">
                  <Bookmark size={48} className="mx-auto mb-4 opacity-50" />
                  <p>No saved posts yet</p>
                  <p className="text-sm mt-2">Save posts to view them later</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Profile View */}
        {view === 'profile' && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-gray-900 rounded-2xl p-6">
              {/* Profile header */}
              <div className="flex items-start gap-4 mb-6">
                <div className="w-24 h-24 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white text-4xl font-bold">
                  {user.user_metadata.username[0].toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold">{user.user_metadata.username}</h2>
                    {editingBio ? (
                      <div className="flex gap-2">
                        <button onClick={updateBio} className="px-3 py-1 bg-purple-600 rounded-xl text-sm">Save</button>
                        <button onClick={() => setEditingBio(false)} className="px-3 py-1 bg-gray-700 rounded-xl text-sm">Cancel</button>
                      </div>
                    ) : (
                      <button onClick={() => {
                        setEditingBio(true);
                        setNewBio(user.user_metadata.bio || '');
                      }} className="px-3 py-1 bg-gray-700 rounded-xl text-sm">Edit Profile</button>
                    )}
                  </div>
                  {editingBio ? (
                    <textarea
                      value={newBio}
                      onChange={(e) => setNewBio(e.target.value)}
                      placeholder="Tell us about yourself..."
                      className="w-full mt-2 px-4 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white"
                      rows="3"
                    />
                  ) : (
                    <p className="mt-2 text-gray-300">{user.user_metadata.bio || 'No bio yet.'}</p>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div className="flex justify-around text-center py-4 border-t border-b border-gray-800">
                <div>
                  <p className="text-lg font-bold">{userPosts.length}</p>
                  <p className="text-gray-400 text-sm">Posts</p>
                </div>
                <button onClick={() => setProfileView('followers')} className="cursor-pointer">
                  <p className="text-lg font-bold">{followers}</p>
                  <p className="text-gray-400 text-sm">Followers</p>
                </button>
                <button onClick={() => setProfileView('following')} className="cursor-pointer">
                  <p className="text-lg font-bold">{following}</p>
                  <p className="text-gray-400 text-sm">Following</p>
                </button>
              </div>

              {/* Tabs */}
              <div className="flex mt-6 gap-1">
                <button
                  onClick={() => setProfileView('posts')}
                  className={`flex-1 py-3 rounded-xl font-semibold ${profileView === 'posts' ? 'bg-purple-600' : 'bg-gray-800'}`}
                >
                  Posts
                </button>
                <button
                  onClick={() => setProfileView('saved')}
                  className={`flex-1 py-3 rounded-xl font-semibold ${profileView === 'saved' ? 'bg-purple-600' : 'bg-gray-800'}`}
                >
                  Saved
                </button>
                <button
                  onClick={() => setProfileView('followers')}
                  className={`flex-1 py-3 rounded-xl font-semibold ${profileView === 'followers' ? 'bg-purple-600' : 'bg-gray-800'}`}
                >
                  Followers
                </button>
                <button
                  onClick={() => setProfileView('following')}
                  className={`flex-1 py-3 rounded-xl font-semibold ${profileView === 'following' ? 'bg-purple-600' : 'bg-gray-800'}`}
                >
                  Following
                </button>
              </div>

              {/* Content based on tab */}
              <div className="mt-6">
                {profileView === 'posts' && (
                  userPosts.length > 0 ? (
                    <div className="space-y-6">
                      {userPosts.map(post => (
                        <div key={post.id} className="bg-gray-800 rounded-xl p-4">
                          <p className="text-white whitespace-pre-wrap">{post.content}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-gray-400 py-10">
                      <Grid size={48} className="mx-auto mb-4 opacity-50" />
                      <p>No posts yet</p>
                    </div>
                  )
                )}
                {profileView === 'saved' && (
                  savedPosts.length > 0 ? (
                    <div className="space-y-6">
                      {savedPosts.map(post => (
                        <div key={post.id} className="bg-gray-800 rounded-xl p-4">
                          <p className="text-white whitespace-pre-wrap">{post.content}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-gray-400 py-10">
                      <Bookmark size={48} className="mx-auto mb-4 opacity-50" />
                      <p>No saved posts</p>
                    </div>
                  )
                )}
                {profileView === 'followers' && (
                  <FollowersFollowingList userId={user.id} type={"followers"} />
                )}
                {profileView === 'following' && (
                  <FollowersFollowingList userId={user.id} type={"following"} />
                )}
              </div>
            </div>
          </div>
        )}

        {/* Feed */}
        {view === 'feed' && (
          <div className="max-w-2xl mx-auto space-y-6">
            {/* Stories Section */}
            <div className="bg-gray-900 rounded-2xl p-4">
              <div className="flex gap-4 overflow-x-auto py-2 no-scrollbar">
                {/* Button to create story */}
                <button onClick={() => setShowCreateStory(true)} className="flex-shrink-0 bg-gray-800 rounded-full w-16 h-16 flex items-center justify-center">
                  <PlusCircle size={24} />
                </button>
                
                {/* List of stories */}
                {stories.map(story => (
                  <button key={story.id} onClick={() => setSelectedStory(story)} className="flex-shrink-0">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
                      <div className="w-14 h-14 bg-gray-900 rounded-full flex items-center justify-center text-white font-bold">
                        {story.username[0].toUpperCase()}
                      </div>
                    </div>
                    <p className="text-xs text-center mt-1 truncate w-16">{story.username}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Posts */}
            {posts.length > 0 ? (
              posts.map((post) => (
                <div key={post.id} className="bg-gray-900 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-bold">
                        {post.username[0].toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-semibold">{post.username}</h3>
                        <p className="text-xs text-gray-400">
                          {new Date(post.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    {post.user_id === user.id && (
                      <button
                        onClick={() => deletePost(post.id)}
                        title="Delete Post"
                        className="text-red-500 hover:text-red-600"
                      >
                        <Trash2 size={20} />
                      </button>
                    )}
                  </div>
                  <p className="whitespace-pre-wrap mb-4">{post.content}</p>
                  <div className="flex items-center justify-between text-gray-400 text-sm">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => toggleLike(post.id, post.is_liked)}
                        className={`flex items-center gap-1 ${post.is_liked ? 'text-pink-500' : 'hover:text-pink-400'}`}
                        title={post.is_liked ? 'Unlike' : 'Like'}
                      >
                        <Heart size={18} />
                        {post.likes_count}
                      </button>
                      <button
                        onClick={() => {
                          setSelectedPost(post);
                          fetchComments(post.id);
                        }}
                        className="flex items-center gap-1 hover:text-blue-400"
                        title="Comments"
                      >
                        <MessageCircle size={18} />
                        {post.comments_count}
                      </button>
                      <button
                        onClick={() => toggleSave(post.id, post.is_saved)}
                        className={`flex items-center gap-1 ${post.is_saved ? 'text-yellow-400' : 'hover:text-yellow-300'}`}
                        title={post.is_saved ? 'Unsave' : 'Save'}
                      >
                        <Bookmark size={18} />
                      </button>
                      <div className="relative">
                        <button
                          onClick={() => setShowShareMenu(post.id === showShareMenu ? null : post.id)}
                          className="flex items-center gap-1 hover:text-green-400"
                          title="Share"
                        >
                          <Share2 size={18} />
                        </button>
                        {showShareMenu === post.id && (
                          <div className="absolute right-0 top-full mt-1 bg-gray-800 rounded-xl shadow-lg p-2 w-40 z-50">
                            <button
                              onClick={() => sharePost(post)}
                              className="w-full text-left px-3 py-2 hover:bg-gray-700 rounded-xl"
                            >
                              Copy Link
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Comments Section */}
                  {selectedPost && selectedPost.id === post.id && (
                    <div className="mt-4 bg-gray-800 rounded-xl p-4">
                      <div className="max-h-48 overflow-y-auto mb-3 space-y-3">
                        {comments.length > 0 ? (
                          comments.map((comment) => (
                            <div key={comment.id} className="flex items-start gap-3">
                              <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full flex items-center justify-center text-white font-bold text-xs">
                                {comment.username[0].toUpperCase()}
                              </div>
                              <div>
                                <p className="text-sm font-semibold">{comment.username}</p>
                                <p className="text-sm">{comment.content}</p>
                                <p className="text-xs text-gray-400">
                                  {new Date(comment.created_at).toLocaleString()}
                                </p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-gray-400 text-sm text-center">No comments yet</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Add a comment..."
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          className="flex-1 px-4 py-2 rounded-xl bg-gray-700 border border-gray-600 text-white outline-none focus:ring-2 focus:ring-purple-500"
                          onKeyPress={(e) => e.key === 'Enter' && addComment(post.id)}
                        />
                        <button
                          onClick={() => addComment(post.id)}
                          className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-xl font-semibold"
                        >
                          <Send size={18} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center text-gray-400 py-10">
                <Home size={48} className="mx-auto mb-4 opacity-50" />
                <p>No posts yet</p>
                <p className="text-sm mt-2">Create a post to get started</p>
              </div>
            )}
          </div>
        )}

        {/* Story Modal */}
        {selectedStory && (
          <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
            <div className="relative w-full max-w-md bg-gray-900 rounded-2xl p-6">
              <button onClick={() => setSelectedStory(null)} className="absolute top-4 right-4 text-gray-400 hover:text-white">
                <X size={24} />
              </button>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-bold">
                  {selectedStory.username[0].toUpperCase()}
                </div>
                <div>
                  <h3 className="font-semibold">{selectedStory.username}</h3>
                  <p className="text-xs text-gray-400">
                    {new Date(selectedStory.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="bg-gray-800 rounded-xl p-6 min-h-48 flex items-center justify-center">
                <p className="text-xl text-center">{selectedStory.content}</p>
              </div>
            </div>
          </div>
        )}

        {/* Create Post Modal */}
        {showCreatePost && (
          <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center p-4">
            <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Create Post</h2>
                <button onClick={() => setShowCreatePost(false)} className="text-gray-400 hover:text-white">
                  <X size={24} />
                </button>
              </div>
              <textarea
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                placeholder="What's on your mind?"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-400 resize-none mb-4"
                rows="4"
              />
              <button
                onClick={createPost}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-xl font-bold"
              >
                Post
              </button>
            </div>
          </div>
        )}

        {/* Create Story Modal */}
        {showCreateStory && (
          <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center p-4">
            <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Create Story</h2>
                <button onClick={() => setShowCreateStory(false)} className="text-gray-400 hover:text-white">
                  <X size={24} />
                </button>
              </div>
              <textarea
                value={newStory}
                onChange={(e) => setNewStory(e.target.value)}
                placeholder="What's happening? This will disappear in 24 hours"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-400 resize-none mb-4"
                rows="4"
              />
              <button
                onClick={createStory}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-xl font-bold"
              >
                Share Story
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
