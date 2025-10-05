import KanbanCard from './KanbanCard';

export default function KanbanColumn({ column, cards, postsById, onOpen, onDropCard }) {
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
      className="border rounded-xl bg-neutral-50 flex flex-col min-h-[300px]" 
      onDragOver={allowDrop} 
      onDrop={onDrop}
    >
      <div className="px-3 py-2 border-b bg-white rounded-t-xl flex items-center justify-between">
        <div className="text-sm font-semibold">{column.name}</div>
        <div className="text-xs text-neutral-500">{cards.length}</div>
      </div>
      <div className="p-2 space-y-2 flex-1">
        {cards.map(c => (
          <KanbanCard 
            key={c.id} 
            card={c} 
            post={postsById[c.post_id]} 
            onOpen={onOpen} 
          />
        ))}
      </div>
    </div>
  );
}
