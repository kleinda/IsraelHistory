import { CATEGORY_BY_ID } from '../lib/categories';
import { images } from '../lib/data';
import { formatDate } from '../lib/dates';
import { href } from '../lib/router';
import type { HistEvent } from '../lib/types';

interface Props {
  event: HistEvent;
  highlighted?: boolean;
  onHover?: (id: string | null) => void;
}

export function EventCard({ event, highlighted, onHover }: Props) {
  const cat = CATEGORY_BY_ID[event.category];
  const Icon = cat.icon;
  const img = event.importance === 3 ? images[`event:${event.id}`] : undefined;

  return (
    <a
      href={href('event', event.id)}
      onMouseEnter={() => onHover?.(event.id)}
      onMouseLeave={() => onHover?.(null)}
      className={`group relative block overflow-hidden rounded-2xl border-2 bg-white text-right shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-lg ${
        highlighted ? 'ring-4 ring-offset-2' : ''
      }`}
      style={{
        borderColor: cat.color + (event.importance === 3 ? '' : '55'),
        ['--tw-ring-color' as string]: cat.color + '66',
      }}
    >
      {img?.src && (
        <div className="relative h-32 overflow-hidden bg-slate-100">
          <img
            src={img.src}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover object-[center_30%] transition duration-500 group-hover:scale-105"
            onError={(e) => (e.currentTarget.parentElement!.style.display = 'none')}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        </div>
      )}
      <div className={`flex gap-3 ${event.importance === 1 ? 'p-2.5' : 'p-3.5'}`}>
        <span
          className={`flex shrink-0 items-center justify-center rounded-xl ${
            event.importance === 1 ? 'h-8 w-8' : 'h-11 w-11'
          }`}
          style={{ background: cat.soft, color: cat.color }}
        >
          <Icon className={event.importance === 1 ? 'h-4 w-4' : 'h-6 w-6'} strokeWidth={2.2} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-xs font-semibold" style={{ color: cat.color }}>
            {formatDate(event.date)}
          </div>
          <h3
            className={`font-bold leading-snug text-slate-900 ${
              event.importance === 3 ? 'text-lg' : event.importance === 2 ? 'text-base' : 'text-sm'
            }`}
          >
            {event.title}
          </h3>
          {event.importance > 1 && (
            <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-slate-600">{event.summary}</p>
          )}
        </div>
      </div>
    </a>
  );
}
