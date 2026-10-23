import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Heart, MessageCircle, Repeat2, Send, MoreHorizontal, 
  Image as ImageIcon, Hash, X, Check, Sparkles, Plus, 
  Share2, Bookmark, CheckCircle2, User
} from 'lucide-react';
import { CommunityPost, CommunityComment, UserProfile } from '../../types';
import confetti from 'canvas-confetti';

const UserAvatar: React.FC<{ url?: string; name?: string; size?: string; iconSize?: string }> = ({
  url,
  name,
  size = 'w-9 h-9',
  iconSize = 'w-4 h-4',
}) => {
  if (url) {
    return <img src={url} alt={name || 'Creator'} className={`${size} rounded-full object-cover ring-1 ring-zinc-200 shrink-0`} />;
  }
  return (
    <div className={`${size} rounded-full bg-zinc-100 border border-zinc-200/90 flex items-center justify-center text-zinc-400 shrink-0`}>
      <User className={iconSize} />
    </div>
  );
};

interface CommunityViewProps {
  posts?: CommunityPost[];
  userProfile: UserProfile;
  onLikePost?: (postId: string) => void;
  onAddComment?: (postId: string, comment: string) => void;
  onCreatePost?: (newPost: Omit<CommunityPost, 'id' | 'likes' | 'isLiked' | 'commentsCount' | 'comments' | 'createdAt'>) => void;
  onNotify: (msg: string, type?: 'success' | 'info' | 'exp') => void;
}

export const CommunityView: React.FC<CommunityViewProps> = ({
  posts: initialPosts = [],
  userProfile,
  onLikePost,
  onAddComment,
  onCreatePost,
  onNotify,
}) => {
  const [selectedTag, setSelectedTag] = useState<string>('All');

  // Local state for threads
  const [threads, setThreads] = useState<CommunityPost[]>(initialPosts);

  // Reposted thread IDs
  const [repostedIds, setRepostedIds] = useState<Record<string, boolean>>({});
  // Saved thread IDs
  const [savedIds, setSavedIds] = useState<Record<string, boolean>>({});

  // Active expanded replies per thread
  const [expandedThreadIds, setExpandedThreadIds] = useState<Record<string, boolean>>({
    'post-1': true, // Keep first thread expanded for immediate rich Threads experience
  });

  // Reply inputs per thread
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({});

  // Thread composer modal & inline state
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [composerContent, setComposerContent] = useState('');
  const [composerCategory, setComposerCategory] = useState<'Content Tips' | 'Collab Requests' | 'Brand Reviews' | 'Q&A'>('Content Tips');
  const [composerImageUrl, setComposerImageUrl] = useState('');

  // Quick preset image selector for composer
  const sampleImages = [
    { label: 'Laneige PR', url: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=600&q=80' },
    { label: 'Seongsu Cafe', url: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=600&q=80' },
    { label: 'Lighting Setup', url: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=600&q=80' },
  ];

  // Sync if initialPosts update
  React.useEffect(() => {
    if (initialPosts.length > 0) {
      setThreads(initialPosts);
    }
  }, [initialPosts]);

  // Categories list
  const categoryFilters = ['All', 'Content Tips', 'Collab Requests', 'Brand Reviews', 'Q&A'];

  // Filter threads
  const displayedThreads = threads.filter((thread) => {
    if (selectedTag === 'All') return true;
    return thread.category === selectedTag;
  });

  // Toggle Like
  const handleLike = (threadId: string) => {
    setThreads((prev) =>
      prev.map((t) => {
        if (t.id === threadId) {
          const nextLiked = !t.isLiked;
          const nextCount = nextLiked ? t.likes + 1 : Math.max(0, t.likes - 1);
          if (nextLiked) {
            onNotify(`Liked ${t.authorHandle}'s thread!`, 'info');
          }
          return { ...t, isLiked: nextLiked, likes: nextCount };
        }
        return t;
      })
    );
    if (onLikePost) onLikePost(threadId);
  };

  // Toggle Repost
  const handleRepost = (threadId: string, authorHandle: string) => {
    const isCurrentlyReposted = !!repostedIds[threadId];
    setRepostedIds((prev) => ({
      ...prev,
      [threadId]: !isCurrentlyReposted,
    }));
    if (!isCurrentlyReposted) {
      confetti({ particleCount: 35, spread: 50 });
      onNotify(`Reposted @${authorHandle.replace('@', '')}'s thread to your profile! +10 EXP`, 'success');
    } else {
      onNotify(`Removed repost`, 'info');
    }
  };

  // Toggle Bookmark / Save
  const handleSave = (threadId: string) => {
    const isSaved = !!savedIds[threadId];
    setSavedIds((prev) => ({
      ...prev,
      [threadId]: !isSaved,
    }));
    onNotify(isSaved ? 'Removed from saved' : 'Thread saved to bookmarks', 'info');
  };

  // Toggle expanded replies
  const toggleReplies = (threadId: string) => {
    setExpandedThreadIds((prev) => ({
      ...prev,
      [threadId]: !prev[threadId],
    }));
  };

  // Submit reply to a thread
  const handleReplySubmit = (threadId: string) => {
    const text = replyInputs[threadId]?.trim();
    if (!text) return;

    const newComment: CommunityComment = {
      id: `reply-${Date.now()}`,
      authorName: userProfile.fullName,
      authorAvatar: userProfile.avatarUrl,
      authorBadge: 'Level 1 Creator',
      content: text,
      createdAt: 'Just now',
      likes: 0,
      isLiked: false,
    };

    setThreads((prev) =>
      prev.map((t) => {
        if (t.id === threadId) {
          const updatedComments = [...(t.comments || []), newComment];
          return {
            ...t,
            comments: updatedComments,
            commentsCount: updatedComments.length,
          };
        }
        return t;
      })
    );

    setReplyInputs((prev) => ({ ...prev, [threadId]: '' }));
    setExpandedThreadIds((prev) => ({ ...prev, [threadId]: true }));
    onNotify('Reply posted to thread! +15 EXP', 'exp');
    if (onAddComment) onAddComment(threadId, text);
  };

  // Create new thread
  const handlePublishThread = (e: React.FormEvent) => {
    e.preventDefault();
    if (!composerContent.trim()) return;

    const tags = ['#VivelyThreads', `#${composerCategory.replace(/\s+/g, '')}`];
    const newThread: CommunityPost = {
      id: `thread-${Date.now()}`,
      category: composerCategory,
      authorName: userProfile.fullName,
      authorHandle: userProfile.socialHandles.instagram || '@creator',
      authorAvatar: userProfile.avatarUrl,
      authorLevel: 1,
      title: composerContent.trim().slice(0, 50),
      content: composerContent.trim(),
      tags,
      imageUrl: composerImageUrl || undefined,
      likes: 1,
      isLiked: true,
      commentsCount: 0,
      comments: [],
      createdAt: 'Just now',
    };

    setThreads([newThread, ...threads]);
    setComposerContent('');
    setComposerImageUrl('');
    setIsComposerOpen(false);
    confetti({ particleCount: 50, spread: 60 });
    onNotify('Thread posted to Community feed! +35 EXP', 'success');

    if (onCreatePost) {
      onCreatePost({
        category: composerCategory,
        authorName: userProfile.fullName,
        authorHandle: userProfile.socialHandles.instagram || '@creator',
        authorAvatar: userProfile.avatarUrl,
        authorLevel: 1,
        title: newThread.title,
        content: newThread.content,
        tags,
        imageUrl: newThread.imageUrl,
      });
    }
  };

  return (
    <div className="pb-24 max-w-md mx-auto min-h-screen bg-transparent text-zinc-900 select-none">
      {/* ========================================================================= */}
      {/* 1. CREATOR LOUNGE TOP NAVIGATION & HEADER                                 */}
      {/* ========================================================================= */}
      <div className="bg-transparent pt-1">
        {/* Top Creator Lounge Brand & Composer Trigger */}
        <div className="flex items-center justify-between px-4 py-2">
          <h1 className="font-black text-xl tracking-tight text-black font-sans">
            Creator Lounge
          </h1>

          <button
            type="button"
            onClick={() => setIsComposerOpen(true)}
            className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center hover:bg-zinc-800 transition-all active:scale-95 shadow-xs cursor-pointer"
            aria-label="New Post"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* Minimalist Horizontal Filter Chips */}
        <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar px-4 py-1.5 bg-transparent mb-1">
          {categoryFilters.map((cat) => {
            const isSelected = selectedTag === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedTag(cat)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  isSelected
                    ? 'bg-[#404040] text-white shadow-xs'
                    : 'bg-[#ECEEF2] text-zinc-800 hover:bg-[#E2E5EB]'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. INLINE "START A THREAD..." PROMPT BAR                                 */}
      {/* ========================================================================= */}
      <div 
        onClick={() => setIsComposerOpen(true)}
        className="px-4 py-3 border-b border-zinc-200/40 flex items-center space-x-3 cursor-pointer hover:bg-white/30 transition-colors"
      >
        <UserAvatar
          url={userProfile.avatarUrl}
          name={userProfile.fullName}
          size="w-9 h-9"
          iconSize="w-4 h-4"
        />
        <div className="flex-1 text-xs text-zinc-400 font-medium">
          Start a thread, ask about Seoul collabs...
        </div>
        <button
          type="button"
          className="px-3.5 py-1 rounded-full bg-zinc-100 text-zinc-700 text-xs font-bold hover:bg-black hover:text-white transition-all"
        >
          Post
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 3. THREADS FEED LIST                                                      */}
      {/* ========================================================================= */}
      <div className="divide-y divide-zinc-100">
        {displayedThreads.length === 0 ? (
          <div className="py-16 text-center text-zinc-400 text-xs">
            No threads found for this topic yet. Be the first to start a thread!
          </div>
        ) : (
          displayedThreads.map((thread) => {
            const isReposted = !!repostedIds[thread.id];
            const isSaved = !!savedIds[thread.id];
            const areRepliesOpen = !!expandedThreadIds[thread.id];
            const commentsList = thread.comments || [];

            return (
              <article key={thread.id} className="p-4 hover:bg-zinc-50/40 transition-colors">
                {/* Repost indicator badge if thread was reposted */}
                {isReposted && (
                  <div className="flex items-center space-x-1.5 text-[11px] font-semibold text-zinc-400 mb-2 pl-12">
                    <Repeat2 className="w-3.5 h-3.5" />
                    <span>You reposted</span>
                  </div>
                )}

                <div className="flex space-x-3">
                  {/* LEFT COLUMN: Author Avatar + Iconic Continuous Thread Line */}
                  <div className="flex flex-col items-center">
                    <img
                      src={thread.authorAvatar}
                      alt={thread.authorName}
                      className="w-9 h-9 rounded-full object-cover ring-1 ring-zinc-200 shrink-0 cursor-pointer"
                    />

                    {/* The signature Threads vertical connecting threadline */}
                    <div className="w-[2px] bg-zinc-200/90 rounded-full flex-1 my-1.5 min-h-[30px]" />

                    {/* Bottom overlapping mini avatars of repliers */}
                    {commentsList.length > 0 && (
                      <div className="relative w-6 h-6 flex items-center justify-center shrink-0">
                        {commentsList.slice(0, 2).map((c, i) => (
                          <img
                            key={c.id || i}
                            src={c.authorAvatar}
                            alt={c.authorName}
                            className={`w-4 h-4 rounded-full object-cover ring-1 ring-white absolute ${
                              i === 0 ? 'top-0 left-0' : 'bottom-0 right-0'
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* RIGHT COLUMN: Author Info, Content, Media, Action Buttons */}
                  <div className="flex-1 min-w-0 space-y-2">
                    {/* Header Row */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1.5 truncate">
                        <span className="font-bold text-xs text-zinc-900 truncate hover:underline cursor-pointer">
                          {thread.authorHandle.replace('@', '')}
                        </span>
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#5B4E8C] fill-[#B5A8DE] shrink-0" />
                        <span className="text-[10px] text-zinc-400 font-normal">
                          · {thread.createdAt}
                        </span>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0">
                        <span className="text-[10px] font-semibold bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-full">
                          {thread.category}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleSave(thread.id)}
                          className={`p-1 transition-colors cursor-pointer ${
                            isSaved ? 'text-black' : 'text-zinc-400 hover:text-black'
                          }`}
                          aria-label="Save thread"
                        >
                          <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-black' : ''}`} />
                        </button>
                      </div>
                    </div>

                    {/* Post Content */}
                    <div className="text-[13px] text-zinc-800 leading-relaxed break-words">
                      {thread.content}
                    </div>

                    {/* Tags */}
                    {thread.tags && thread.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        {thread.tags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="text-[11px] font-medium text-[#5B4E8C] hover:underline cursor-pointer"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Attached Image if any */}
                    {thread.imageUrl && (
                      <div className="mt-2 rounded-2xl overflow-hidden border border-zinc-100 shadow-xs max-h-72">
                        <img
                          src={thread.imageUrl}
                          alt="Thread media"
                          className="w-full h-full object-cover max-h-72 hover:scale-[1.01] transition-transform duration-300"
                        />
                      </div>
                    )}

                    {/* ACTION ROW (The iconic 4 Threads icons) */}
                    <div className="flex items-center space-x-5 pt-1 text-zinc-600">
                      {/* 1. Like Button */}
                      <button
                        type="button"
                        onClick={() => handleLike(thread.id)}
                        className="flex items-center space-x-1.5 text-xs group cursor-pointer transition-all active:scale-90"
                      >
                        <Heart
                          className={`w-4 h-4 transition-colors ${
                            thread.isLiked
                              ? 'fill-rose-500 text-rose-500 scale-110'
                              : 'group-hover:text-rose-500 text-zinc-700'
                          }`}
                        />
                        <span className={`text-[11px] font-medium ${thread.isLiked ? 'text-rose-500 font-bold' : ''}`}>
                          {thread.likes}
                        </span>
                      </button>

                      {/* 2. Reply Button */}
                      <button
                        type="button"
                        onClick={() => toggleReplies(thread.id)}
                        className="flex items-center space-x-1.5 text-xs text-zinc-700 hover:text-black cursor-pointer group transition-all active:scale-90"
                      >
                        <MessageCircle className="w-4 h-4 group-hover:text-black" />
                        <span className="text-[11px] font-medium">
                          {thread.commentsCount}
                        </span>
                      </button>

                      {/* 3. Repost Button */}
                      <button
                        type="button"
                        onClick={() => handleRepost(thread.id, thread.authorHandle)}
                        className={`flex items-center space-x-1.5 text-xs cursor-pointer group transition-all active:scale-90 ${
                          isReposted ? 'text-emerald-600 font-bold' : 'text-zinc-700 hover:text-emerald-600'
                        }`}
                      >
                        <Repeat2 className="w-4 h-4" />
                        {isReposted && <span className="text-[10px]">1</span>}
                      </button>

                      {/* 4. Share Button */}
                      <button
                        type="button"
                        onClick={() => {
                          onNotify('Thread link copied to clipboard!', 'info');
                        }}
                        className="text-zinc-700 hover:text-black cursor-pointer group transition-all active:scale-90"
                        aria-label="Share thread"
                      >
                        <Send className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                      </button>
                    </div>

                    {/* Footer summary: "8 replies · 42 likes" */}
                    <div 
                      onClick={() => toggleReplies(thread.id)}
                      className="text-[11px] text-zinc-400 font-normal hover:text-zinc-600 cursor-pointer pt-0.5"
                    >
                      {thread.commentsCount} {thread.commentsCount === 1 ? 'reply' : 'replies'} · {thread.likes} {thread.likes === 1 ? 'like' : 'likes'}
                    </div>

                    {/* ============================================================= */}
                    {/* THREADED REPLIES (Instagram Threads Style)                   */}
                    {/* ============================================================= */}
                    {areRepliesOpen && (
                      <div className="pt-2 space-y-3 mt-1 border-t border-zinc-100">
                        {/* Existing threaded replies */}
                        {commentsList.map((comment) => (
                          <div key={comment.id} className="flex space-x-2.5 pt-1.5">
                            <img
                              src={comment.authorAvatar}
                              alt={comment.authorName}
                              className="w-7 h-7 rounded-full object-cover shrink-0 ring-1 ring-zinc-200"
                            />
                            <div className="flex-1 bg-zinc-50/80 rounded-2xl p-2.5 space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-zinc-900">
                                  {comment.authorName}
                                </span>
                                <span className="text-[10px] text-zinc-400">
                                  {comment.createdAt}
                                </span>
                              </div>
                              <p className="text-xs text-zinc-800 leading-relaxed">
                                {comment.content}
                              </p>
                            </div>
                          </div>
                        ))}

                        {/* Inline Reply Composer */}
                        <div className="flex items-center space-x-2 pt-2">
                          <UserAvatar
                            url={userProfile.avatarUrl}
                            name={userProfile.fullName}
                            size="w-7 h-7"
                            iconSize="w-3.5 h-3.5"
                          />
                          <div className="flex-1 flex items-center bg-zinc-50 border border-zinc-200/80 rounded-full px-3 py-1.5 focus-within:border-zinc-400 focus-within:bg-white transition-all">
                            <input
                              type="text"
                              value={replyInputs[thread.id] || ''}
                              onChange={(e) =>
                                setReplyInputs({ ...replyInputs, [thread.id]: e.target.value })
                              }
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleReplySubmit(thread.id);
                              }}
                              placeholder={`Reply to ${thread.authorHandle}...`}
                              className="w-full text-xs bg-transparent text-zinc-900 focus:outline-none placeholder:text-zinc-400"
                            />
                            <button
                              type="button"
                              onClick={() => handleReplySubmit(thread.id)}
                              className="text-xs font-bold text-black hover:text-[#5B4E8C] px-2 py-0.5 cursor-pointer shrink-0 disabled:opacity-30"
                              disabled={!replyInputs[thread.id]?.trim()}
                            >
                              Post
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>

      {/* ========================================================================= */}
      {/* 4. NEW THREAD COMPOSER MODAL (Full Threads Experience)                     */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isComposerOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsComposerOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs"
            />

            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 280 }}
              className="relative w-full max-w-md bg-white rounded-t-[32px] sm:rounded-[32px] shadow-2xl z-10 p-5 space-y-4 max-h-[90vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
                <button
                  type="button"
                  onClick={() => setIsComposerOpen(false)}
                  className="text-xs font-medium text-zinc-500 hover:text-black cursor-pointer"
                >
                  Cancel
                </button>
                <span className="font-bold text-sm text-black">New thread</span>
                <span className="w-10" />
              </div>

              {/* Thread Composer Body */}
              <form onSubmit={handlePublishThread} className="space-y-4">
                <div className="flex space-x-3 items-start">
                  <div className="flex flex-col items-center">
                    <UserAvatar
                      url={userProfile.avatarUrl}
                      name={userProfile.fullName}
                      size="w-10 h-10"
                      iconSize="w-5 h-5"
                    />
                    <div className="w-[2px] bg-zinc-200 rounded-full flex-1 my-2 min-h-[40px]" />
                  </div>

                  <div className="flex-1 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-zinc-900">
                        {userProfile.socialHandles.instagram || userProfile.fullName}
                      </span>

                      {/* Topic Selector */}
                      <select
                        value={composerCategory}
                        onChange={(e) => setComposerCategory(e.target.value as any)}
                        className="text-[11px] font-semibold bg-zinc-100 text-zinc-700 px-2 py-1 rounded-lg focus:outline-none cursor-pointer"
                      >
                        <option value="Content Tips">Content Tips</option>
                        <option value="Collab Requests">Collab Requests</option>
                        <option value="Brand Reviews">Brand Reviews</option>
                        <option value="Q&A">Q&A</option>
                      </select>
                    </div>

                    <textarea
                      rows={4}
                      value={composerContent}
                      onChange={(e) => setComposerContent(e.target.value)}
                      placeholder="Start a thread... (e.g. Tips on Seoul brand gifting, collab calls, or rate inquiries)"
                      className="w-full text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none resize-none leading-relaxed"
                      autoFocus
                    />

                    {/* Attached Image Preview if selected */}
                    {composerImageUrl && (
                      <div className="relative rounded-2xl overflow-hidden border border-zinc-200 max-h-48 group">
                        <img
                          src={composerImageUrl}
                          alt="Attached media"
                          className="w-full h-48 object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => setComposerImageUrl('')}
                          className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/70 text-white flex items-center justify-center cursor-pointer hover:bg-black"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    {/* Quick Media Attachment Chips */}
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[10px] font-bold text-zinc-400 block">
                        Add sample photo attachment:
                      </span>
                      <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar">
                        {sampleImages.map((s) => (
                          <button
                            key={s.label}
                            type="button"
                            onClick={() => setComposerImageUrl(s.url)}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-medium border transition-all cursor-pointer whitespace-nowrap ${
                              composerImageUrl === s.url
                                ? 'bg-black text-white border-black'
                                : 'bg-zinc-50 text-zinc-600 border-zinc-200 hover:border-zinc-400'
                            }`}
                          >
                            📷 {s.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="flex items-center justify-between pt-3 border-t border-zinc-100">
                  <span className="text-[11px] text-zinc-400 font-medium">
                    Anyone can reply & quote
                  </span>

                  <button
                    type="submit"
                    disabled={!composerContent.trim()}
                    className="px-6 py-2 rounded-full bg-black text-white text-xs font-bold hover:bg-zinc-800 disabled:opacity-30 disabled:hover:bg-black transition-all cursor-pointer"
                  >
                    Post
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
