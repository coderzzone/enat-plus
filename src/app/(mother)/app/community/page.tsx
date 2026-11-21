'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { 
  MessageSquare, 
  Heart, 
  Send, 
  Plus, 
  Sparkles, 
  User, 
  MessageCircle, 
  AlertCircle, 
  Loader2,
  X 
} from 'lucide-react';

export default function MothersCommunityPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeChannel, setActiveChannel] = useState<'first_trimester' | 'second_trimester' | 'third_trimester' | 'new_moms' | 'wellness'>('second_trimester');
  const [showNewPostModal, setShowNewPostModal] = useState(false);
  
  // New post state
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [authorName, setAuthorName] = useState('Mother');
  const [submittingPost, setSubmittingPost] = useState(false);
  
  // Comments state
  const [expandedCommentsPostId, setExpandedCommentsPostId] = useState<string | null>(null);
  const [commentsMap, setCommentsMap] = useState<Record<string, any[]>>({});
  const [commentInput, setCommentInput] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadUserAndPosts();
  }, []);

  async function loadUserAndPosts() {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single();
        if (profile?.full_name) {
          setAuthorName(profile.full_name.split(' ')[0] + ' M.');
        }
      }

      const { data, error: err } = await supabase
        .from('community_posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (err) throw err;
      setPosts(data || []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load community discussions.');
    } finally {
      setLoading(false);
    }
  }

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;
    setSubmittingPost(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      const { data: post, error: postErr } = await supabase
        .from('community_posts')
        .insert({
          mother_id: user ? user.id : null,
          author_name: authorName,
          channel: activeChannel,
          title: newTitle.trim(),
          content: newContent.trim(),
          likes_count: 0,
        })
        .select()
        .single();

      if (postErr) throw postErr;

      setPosts((prev) => [post, ...prev]);
      setShowNewPostModal(false);
      setNewTitle('');
      setNewContent('');
    } catch (err: any) {
      setError(err?.message || 'Failed to submit post.');
    } finally {
      setSubmittingPost(false);
    }
  };

  const handleLikePost = async (postId: string, currentLikes: number) => {
    try {
      const supabase = createClient();
      const updated = currentLikes + 1;

      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, likes_count: updated } : p))
      );

      await supabase
        .from('community_posts')
        .update({ likes_count: updated })
        .eq('id', postId);
    } catch (err) {
      console.error('Error liking post:', err);
    }
  };

  const handleToggleComments = async (postId: string) => {
    if (expandedCommentsPostId === postId) {
      setExpandedCommentsPostId(null);
      return;
    }

    setExpandedCommentsPostId(postId);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('community_comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (!error && data) {
        setCommentsMap((prev) => ({ ...prev, [postId]: data }));
      }
    } catch (err) {
      console.error('Error loading comments:', err);
    }
  };

  const handleAddComment = async (postId: string) => {
    if (!commentInput.trim()) return;
    setSubmittingComment(true);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('community_comments')
        .insert({
          post_id: postId,
          mother_id: user ? user.id : null,
          author_name: authorName,
          content: commentInput.trim(),
        })
        .select()
        .single();

      if (!error && data) {
        setCommentsMap((prev) => ({
          ...prev,
          [postId]: [...(prev[postId] || []), data],
        }));
        setCommentInput('');
      }
    } catch (err) {
      console.error('Error posting comment:', err);
    } finally {
      setSubmittingComment(false);
    }
  };

  const channels = [
    { id: 'first_trimester', label: '🌸 1st Trimester' },
    { id: 'second_trimester', label: '🌿 2nd Trimester' },
    { id: 'third_trimester', label: '🌟 3rd Trimester' },
    { id: 'new_moms', label: '👶 New Mothers' },
    { id: 'wellness', label: '🥗 Nutrition & Rest' },
  ];

  const filteredPosts = posts.filter((p) => p.channel === activeChannel);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-stone-500">
        <Loader2 className="w-8 h-8 animate-spin text-enat-700 mb-2" />
        <p className="text-xs">Connecting to Mothers Community...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-xl bg-pink-100 text-pink-700 flex items-center justify-center">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-stone-900">Mothers Community Hub</h1>
            <p className="text-xs text-stone-500">Peer support, shared milestones & encouragement</p>
          </div>
        </div>

        <button
          onClick={() => setShowNewPostModal(true)}
          className="inline-flex items-center bg-enat-700 hover:bg-enat-800 text-white text-xs font-semibold px-3 py-2 rounded-xl shadow-2xs transition"
        >
          <Plus className="w-4 h-4 mr-1" /> New Post
        </button>
      </div>

      {/* Community Channels (Horizontal Scroll) */}
      <div className="flex space-x-1.5 overflow-x-auto pb-1 scrollbar-thin">
        {channels.map((ch) => {
          const isSelected = activeChannel === ch.id;
          return (
            <button
              key={ch.id}
              onClick={() => setActiveChannel(ch.id as any)}
              className={`flex-shrink-0 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                isSelected
                  ? 'bg-enat-700 text-white shadow-2xs'
                  : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
              }`}
            >
              {ch.label}
            </button>
          );
        })}
      </div>

      {/* Posts Feed */}
      <div className="space-y-3">
        {filteredPosts.map((post) => {
          const isCommentsOpen = expandedCommentsPostId === post.id;
          const comments = commentsMap[post.id] || [];

          return (
            <div key={post.id} className="bg-white rounded-2xl border border-stone-200 p-4 shadow-2xs space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 rounded-full bg-pink-50 text-pink-700 flex items-center justify-center text-xs font-bold">
                    {post.author_name ? post.author_name.charAt(0) : 'M'}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-stone-800">{post.author_name}</span>
                    <span className="text-[10px] text-stone-400 ml-2">
                      {new Date(post.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleLikePost(post.id, post.likes_count)}
                  className="flex items-center space-x-1 text-xs text-rose-600 hover:text-rose-700 p-1 rounded-lg hover:bg-rose-50 transition"
                >
                  <Heart className="w-4 h-4 fill-rose-100 text-rose-600" />
                  <span className="text-[11px] font-semibold">{post.likes_count}</span>
                </button>
              </div>

              <div>
                <h3 className="text-xs font-bold text-stone-900 leading-snug">{post.title}</h3>
                <p className="text-xs text-stone-600 mt-1 leading-relaxed bg-stone-50/70 p-3 rounded-xl border border-stone-100">
                  {post.content}
                </p>
              </div>

              <div className="border-t border-stone-100 pt-2 flex items-center justify-between">
                <button
                  onClick={() => handleToggleComments(post.id)}
                  className="inline-flex items-center space-x-1.5 text-xs text-stone-500 hover:text-enat-700 font-medium"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Comments ({comments.length})</span>
                </button>
              </div>

              {/* Comments Section */}
              {isCommentsOpen && (
                <div className="border-t border-stone-100 pt-2 space-y-2">
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {comments.map((c) => (
                      <div key={c.id} className="text-xs p-2 bg-stone-50 rounded-lg">
                        <span className="font-bold text-stone-800">{c.author_name}: </span>
                        <span className="text-stone-600">{c.content}</span>
                      </div>
                    ))}
                    {comments.length === 0 && (
                      <p className="text-[11px] text-stone-400 italic">No comments yet. Share some supportive words!</p>
                    )}
                  </div>

                  <div className="flex space-x-2">
                    <input
                      type="text"
                      placeholder="Write a supportive reply..."
                      value={commentInput}
                      onChange={(e) => setCommentInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddComment(post.id);
                      }}
                      className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-enat-600"
                    />
                    <button
                      onClick={() => handleAddComment(post.id)}
                      disabled={submittingComment}
                      className="px-3 py-1.5 bg-enat-700 text-white rounded-xl text-xs font-semibold hover:bg-enat-800"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {filteredPosts.length === 0 && (
          <div className="bg-white rounded-2xl border border-dashed border-stone-200 p-8 text-center text-stone-400 space-y-2">
            <MessageSquare className="w-8 h-8 text-stone-300 mx-auto" />
            <p className="text-xs font-semibold text-stone-700">No discussions yet in this channel.</p>
            <p className="text-[11px] text-stone-400">Be the first mother to start a conversation!</p>
          </div>
        )}
      </div>

      {/* New Post Modal */}
      {showNewPostModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-2xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-xl border border-stone-200">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-stone-900">Start a Community Discussion</h3>
              <button
                onClick={() => setShowNewPostModal(false)}
                className="text-stone-400 hover:text-stone-700 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreatePost} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Channel</label>
                <select
                  value={activeChannel}
                  onChange={(e) => setActiveChannel(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-enat-600 bg-white"
                >
                  {channels.map((ch) => (
                    <option key={ch.id} value={ch.id}>
                      {ch.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Topic Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tips for morning nausea or gentle stretching"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-enat-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Your Message *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Share your thoughts, experiences or questions for fellow mothers..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-enat-600"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowNewPostModal(false)}
                  className="px-3.5 py-2 text-xs font-medium text-stone-600 hover:bg-stone-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingPost}
                  className="px-4 py-2 text-xs font-semibold bg-enat-700 hover:bg-enat-800 text-white rounded-xl shadow-2xs transition disabled:opacity-50"
                >
                  {submittingPost ? 'Posting...' : 'Publish Topic'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
