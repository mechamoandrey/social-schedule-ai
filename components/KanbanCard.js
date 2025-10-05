export default function KanbanCard({ card, post, onOpen }) {
  if (!post) return null;

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('application/json', JSON.stringify({ 
          cardId: card.id, 
          postId: post.id 
        }));
      }}
      className="border rounded-lg bg-white p-3 shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
      onDoubleClick={() => onOpen(post)}
    >
      <div className="text-sm font-medium">{post.title}</div>
      <div className="text-xs text-neutral-500">
        {post.date} • {post.status}
      </div>
      {post.arte ? (
        <p className="text-sm mt-2 line-clamp-3">{post.arte}</p>
      ) : null}
    </div>
  );
}
