import KanbanCard from './KanbanCard';

export default function KanbanColumn({
  column,
  cards,
  postsById,
  onOpen,
  onDropCard,
  selectedPostIds,
  onToggleSelection,
}) {
  function allowDrop(e) {
    e.preventDefault();
  }

  async function onDrop(e) {
    e.preventDefault();
    const raw = e.dataTransfer.getData('application/json');
    try {
      const payload = JSON.parse(raw);
      onDropCard(payload, column);
    } catch (error) {
      console.error('Error parsing drag data:', error);
    }
  }

  return (
    <div
      className='mt-9 flex flex-col gap-3 w-full'
      onDragOver={allowDrop}
      onDrop={onDrop}
    >
      <div className='flex items-center justify-between px-1'>
        <h3 className='font-semibold text-sm text-muted-foreground uppercase tracking-wide'>
          {column.name}
        </h3>
        <div className='text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded-full'>
          {cards.length}
        </div>
      </div>
      <div className='space-y-3'>
        {cards.map(c => (
          <KanbanCard
            key={c.id}
            card={c}
            post={postsById[c.post_id]}
            onOpen={onOpen}
            isSelected={selectedPostIds?.has(c.post_id)}
            onToggleSelection={onToggleSelection}
          />
        ))}
      </div>
    </div>
  );
}
