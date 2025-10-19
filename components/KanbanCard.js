import * as React from 'react';
import { Checkbox } from '@/components/ui/Checkbox';
import { MessageSquare } from 'lucide-react';
import DateBadge from '@/pages/projects/[id]/kanban/components/DateBadge';

export default function KanbanCard({
  card,
  post,
  onOpen,
  isSelected,
  onToggleSelection,
}) {
  if (!post) return null;

  return (
    <div
      draggable
      onDragStart={e => {
        e.dataTransfer.setData(
          'application/json',
          JSON.stringify({
            cardId: card.id,
            postId: post.id,
          })
        );
      }}
      className='border rounded-lg bg-white p-3 shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow'
      onDoubleClick={() => onOpen(post)}
    >
      <DateBadge date={post.date} className='mb-2 shrink-0' />

      <div className='flex items-start gap-2'>
        {/* Checkbox com o mesmo comportamento */}
        <Checkbox
          className='mt-0.5'
          checked={isSelected || false}
          onCheckedChange={() => {
            onToggleSelection?.(post.id);
          }}
          onClick={e => e.stopPropagation()}
        />

        {/* Título  */}
        <div className='flex-1 min-w-0'>
          <div className='flex items-start gap-2'>
            <div
              className='font-semibold text-sm leading-tight truncate'
              title={post.title}
            >
              {post.title}
            </div>
          </div>
        </div>
      </div>

      {/* Arte/conteúdo opcional */}
      {post.arte ? (
        <p className='pl-6 text-sm mt-2 line-clamp-3 flex items-start gap-2 text-xs'>
          <MessageSquare className='h-3.5 w-3.5 text-muted-foreground mt-0.5' />
          {post.arte}
        </p>
      ) : null}
    </div>
  );
}
