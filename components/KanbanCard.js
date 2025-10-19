import * as React from 'react';
import { Checkbox } from '@/components/ui/Checkbox'; // ⬅️ use o caminho correspondente ao seu projeto
import { Calendar, MessageSquare } from 'lucide-react';

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
      <div className='flex items-center gap-2'>
        {/* Checkbox com o mesmo comportamento do input original */}
        <Checkbox
          className='mt-0.5'
          checked={isSelected || false}
          onCheckedChange={() => {
            // mantém a mesma lógica: parar propagação e chamar o toggle
            onToggleSelection?.(post.id);
          }}
          onClick={e => e.stopPropagation()}
        />
        <div className='flex-1 min-w-0'>
          <div
            className='font-semibold text-sm leading-tight truncate'
            title={post.title} // mostra o texto completo no hover
          >
            {post.title}
          </div>
        </div>
      </div>

      <div className='pl-6 pt-3 flex items-center gap-2 text-xs text-muted-foreground'>
        <Calendar className='h-3.5 w-3.5' />
        {post.date} • {post.status}
      </div>

      {post.arte ? (
        <p className='pl-6 text-sm mt-2 line-clamp-3 flex items-start gap-2 text-xs'>
          <MessageSquare className='h-3.5 w-3.5 text-muted-foreground mt-0.5' />{' '}
          {post.arte}
        </p>
      ) : null}
    </div>
  );
}
