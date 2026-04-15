import { Icon, Icons } from "@/components/Icon";
import { Link } from "@/pages/migration/utils";

import { DetailViewProps } from "../types";
import { formatNotificationDescription } from "../utils";

export function DetailView({
  selectedNotification,
  goBackToList,
  getCategoryColor,
  getCategoryLabel,
  formatDate,
  isRead,
  toggleReadStatus,
}: DetailViewProps) {
  const isMovie = selectedNotification.type === "movie";

  return (
    <div className="flex flex-col h-full max-h-[80vh]">
      {/* Header / Navigation */}
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/5">
        <button
          type="button"
          onClick={goBackToList}
          className="group flex items-center gap-2 text-type-secondary hover:text-white transition-all text-sm font-medium"
        >
          <div className="p-1.5 bg-white/5 rounded-lg group-hover:bg-white/10 transition-colors">
            <Icon icon={Icons.CHEVRON_LEFT} className="text-xs" />
          </div>
          Back
        </button>
        
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggleReadStatus}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
              isRead
                ? "bg-white/5 border-white/10 text-white/60 hover:text-white"
                : "bg-type-link/10 border-type-link/20 text-type-link hover:bg-type-link/20"
            }`}
          >
            <Icon icon={isRead ? Icons.EYE_SLASH : Icons.EYE} />
            {isRead ? "Mark Unread" : "Mark Read"}
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto pr-2 space-y-6 custom-scrollbar">
        {/* Visual Header / Hero */}
        <div className="relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-white/5">
          {selectedNotification.posterUrl ? (
            <div className="aspect-video w-full relative">
              <img 
                src={selectedNotification.posterUrl} 
                alt="" 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background-main via-background-main/20 to-black/40" />
            </div>
          ) : (
            <div className="h-32 w-full flex items-center justify-center bg-gradient-to-br from-type-link/20 to-purple-500/20">
              <Icon icon={isMovie ? Icons.FILM : Icons.BELL} className="text-5xl text-white/20" />
            </div>
          )}

          <div className="absolute bottom-0 left-0 right-0 p-6">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider ${
                getCategoryColor(selectedNotification.category) || "bg-white/10"
              }`}>
                {getCategoryLabel(selectedNotification.category)}
              </span>
              <span className="text-[10px] text-white/50 font-bold px-2 py-1 bg-black/40 backdrop-blur-md rounded-md border border-white/5 uppercase">
                {selectedNotification.source}
              </span>
              {selectedNotification.releaseDate && (
                <span className="text-[10px] text-yellow-500 font-bold px-2 py-1 bg-yellow-500/10 backdrop-blur-md rounded-md border border-yellow-500/20 uppercase">
                  {selectedNotification.releaseDate}
                </span>
              )}
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white leading-tight drop-shadow-lg">
              {selectedNotification.title}
            </h1>
          </div>
        </div>

        {/* Description Section */}
        <div className="space-y-4 px-1">
          <div className="flex items-center gap-3 text-xs text-type-secondary font-medium">
            <div className="flex items-center gap-1.5">
              <Icon icon={Icons.CLOCK} className="text-[10px]" />
              {formatDate(selectedNotification.pubDate)}
            </div>
          </div>

          <div 
            className="text-base text-type-secondary leading-relaxed font-medium opacity-90"
            dangerouslySetInnerHTML={{
              __html: formatNotificationDescription(selectedNotification.description)
            }}
          />
        </div>

        {/* Actions Section */}
        {selectedNotification.link && (
          <div className="pt-6 border-t border-white/5 flex flex-wrap gap-4">
            <Link 
              href={selectedNotification.link} 
              target={selectedNotification.link.startsWith("http") ? "_blank" : undefined}
              className="px-8 py-3 bg-type-link hover:bg-type-linkHover text-white rounded-xl font-bold transition-all flex items-center gap-2 shadow-lg shadow-type-link/20 group"
            >
              <span>{isMovie ? "Watch Now" : "Learn More"}</span>
              <Icon icon={Icons.CHEVRON_RIGHT} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            
            <button 
              onClick={goBackToList}
              className="px-8 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold transition-all border border-white/5"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
