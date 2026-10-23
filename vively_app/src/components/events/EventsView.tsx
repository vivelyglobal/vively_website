import React, { useState } from 'react';
import { 
  Heart, MapPin, User, Check, Calendar
} from 'lucide-react';
import { CreatorEvent } from '../../types';
import confetti from 'canvas-confetti';

interface EventsViewProps {
  events: CreatorEvent[];
  onToggleRsvp: (eventId: string) => void;
  onNotify: (msg: string, type?: 'success' | 'info' | 'exp') => void;
}

export const EventsView: React.FC<EventsViewProps> = ({
  events,
  onToggleRsvp,
  onNotify,
}) => {
  const [filterType, setFilterType] = useState<string>('All');
  const [favoritedIds, setFavoritedIds] = useState<Record<string, boolean>>({});

  const filters = ['All', 'Offline Event', 'Online Event', 'Brand Workshop'];

  // Normalized brand display helper
  const getBrandDetails = (ev: CreatorEvent) => {
    return {
      brandName: ev.host || 'Brand Event',
      brandLogoText: ev.host || 'EVENT',
      hasCircledT: false,
      typeBadge: ev.eventType || 'Offline Event',
      displayTitle: ev.title,
      timeAgo: 'Upcoming',
      tags: ev.tags && ev.tags.length > 0 ? ev.tags : ['Networking', 'Gift Bags'],
      dateTime: `${ev.date || 'TBD'} ${ev.time || ''}`.trim(),
      location: ev.locationName || 'Seoul Venue',
      address: ev.address || ev.locationName || 'Seoul, South Korea',
      joinedCount: ev.rsvpCount || 0,
      totalCapacity: ev.capacity || 50,
    };
  };

  const handleToggleFav = (eventId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavoritedIds((prev) => {
      const nextVal = !prev[eventId];
      onNotify(nextVal ? 'Saved to event favorites!' : 'Removed from favorites', 'info');
      return { ...prev, [eventId]: nextVal };
    });
  };

  const handleRsvpClick = (ev: CreatorEvent) => {
    onToggleRsvp(ev.id);
    if (!ev.isUserRsvpd) {
      confetti({ particleCount: 45, spread: 60 });
    }
  };

  // Filter items
  const filteredEvents = events.filter((ev) => {
    if (filterType === 'All') return true;
    const details = getBrandDetails(ev);
    return details.typeBadge === filterType;
  });

  return (
    <div className="pb-24 pt-1 px-4 max-w-md mx-auto select-none">
      {/* Filter Tabs matching Screenshot */}
      <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar py-2 mb-3">
        {filters.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilterType(f)}
            className={`shrink-0 px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              filterType === f
                ? 'bg-[#404040] text-white shadow-xs'
                : 'bg-[#ECEEF2] text-zinc-800 hover:bg-[#E2E5EB]'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Top Header */}
      <div className="pt-0.5 pb-2">
        <h2 className="font-extrabold text-xl text-zinc-900 tracking-tight leading-tight">
          Events and Meetups
        </h2>
        <p className="text-xs text-zinc-500 font-normal mt-0.5">
          Connect with brands and build influencers network in Seoul
        </p>
      </div>

      {/* Events List */}
      <div className="space-y-6 mt-1">
        {events.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center space-y-2.5 border border-zinc-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] mt-2">
            <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center mx-auto text-zinc-400">
              <Calendar className="w-6 h-6 text-zinc-400" />
            </div>
            <h3 className="font-bold text-sm text-zinc-900">No Upcoming Events</h3>
            <p className="text-xs text-zinc-500 max-w-xs mx-auto leading-relaxed">
              Creator meetups, brand networking mixers, and masterclasses will appear here once announced.
            </p>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center space-y-2.5 border border-zinc-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] mt-2">
            <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center mx-auto text-zinc-400">
              <Calendar className="w-6 h-6 text-zinc-400" />
            </div>
            <h3 className="font-bold text-sm text-zinc-800">No events found</h3>
            <p className="text-xs text-zinc-400 max-w-xs mx-auto">
              There are currently no upcoming events scheduled in this category. Check back soon!
            </p>
          </div>
        ) : (
          filteredEvents.map((ev) => {
            const details = getBrandDetails(ev);
            const isFav = !!favoritedIds[ev.id];

            return (
              <div key={ev.id} className="bg-white rounded-3xl p-4 shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                {/* The Light Grey Card Box */}
                <div className="relative rounded-[24px] bg-[#F4F4F6] p-6 flex flex-col items-center justify-center min-h-[150px] shadow-[0_2px_8px_rgba(0,0,0,0.02)] transition-all hover:shadow-[0_4px_16px_rgba(0,0,0,0.04)]">
                  {/* Top-Left: Badge */}
                  <div className="absolute top-3.5 left-3.5">
                    <span className="bg-[#404040] text-white text-[11px] font-semibold px-3.5 py-1 rounded-full tracking-tight shadow-xs">
                      {details.typeBadge}
                    </span>
                  </div>

                  {/* Top-Right: Heart Button */}
                  <button
                    type="button"
                    onClick={(e) => handleToggleFav(ev.id, e)}
                    className="absolute top-3.5 right-3.5 w-7 h-7 rounded-full bg-[#E5E6EA] hover:bg-[#DCDEE4] flex items-center justify-center transition-all cursor-pointer active:scale-90"
                    aria-label="Favorite event"
                  >
                    <Heart
                      className={`w-3.5 h-3.5 transition-colors ${
                        isFav ? 'fill-rose-500 text-rose-500' : 'text-zinc-400'
                      }`}
                    />
                  </button>

                  {/* Center: Brand Logo */}
                  <div className="flex items-center justify-center space-x-1.5 py-4 select-none">
                    <span className="text-xl sm:text-2xl font-black tracking-[0.16em] text-zinc-900 font-sans uppercase">
                      {details.brandLogoText}
                    </span>
                    {details.hasCircledT && (
                      <span className="w-4 h-4 rounded-full border-[1.6px] border-zinc-900 flex items-center justify-center text-[9px] font-bold text-zinc-900 leading-none">
                        T
                      </span>
                    )}
                  </div>
                </div>

                {/* Details Below Box */}
                <div className="px-1 space-y-2 mt-3">
                  {/* Title and Time ago */}
                  <div className="flex items-baseline justify-between">
                    <h3 className="font-extrabold text-base sm:text-lg text-zinc-900 tracking-tight leading-snug line-clamp-1">
                      {details.displayTitle}
                    </h3>
                    <span className="text-xs text-zinc-400 font-normal shrink-0 ml-2">
                      {details.timeAgo}
                    </span>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                    {details.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 rounded-full text-[11px] font-semibold bg-[#ECEEF2] text-zinc-700 tracking-tight"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Date & Time */}
                  <div className="font-bold text-xs sm:text-[13px] text-zinc-900 pt-1 leading-snug">
                    {details.dateTime}
                  </div>

                  {/* Location */}
                  <div className="flex items-start space-x-1.5 text-xs text-zinc-800">
                    <MapPin className="w-3.5 h-3.5 text-zinc-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-zinc-800">
                        {details.location}
                      </span>
                      <span className="text-[11px] text-zinc-400 font-normal block mt-0.5">
                        {details.address}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Joined count & RSVP Button */}
              <div className="flex items-center justify-between pt-3 mt-3 border-t border-zinc-100">
                <div className="flex items-center space-x-1.5 text-xs text-zinc-700">
                  <User className="w-4 h-4 text-zinc-400" />
                  <span className="font-bold text-zinc-900">
                    {ev.isUserRsvpd ? details.joinedCount + 1 : details.joinedCount}
                  </span>
                  <span className="text-zinc-500">/ {details.totalCapacity} Joined</span>
                </div>

                <button
                  type="button"
                  onClick={() => handleRsvpClick(ev)}
                  className={`px-5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95 ${
                    ev.isUserRsvpd
                      ? 'bg-zinc-200 text-zinc-800 hover:bg-zinc-300'
                      : 'bg-[#404040] hover:bg-black text-white'
                  }`}
                >
                  {ev.isUserRsvpd ? "RSVP'd ✓" : 'RSVP'}
                </button>
              </div>
            </div>
          );
        }))}
      </div>
    </div>
  );
};
