export default function SuggestedHolidays({ 
  items = [], 
  selected = [], 
  setSelected, 
  onAddApproved, 
  onRegenerate, 
  onAddSinglePost 
}) {
  return (
    <div className="border rounded-lg p-3 bg-white space-y-2">
      <div className="flex items-center justify-between">
        <div className="font-semibold text-sm">Suggested Holidays (não agenda automaticamente)</div>
      </div>
      
      {items.length === 0 ? (
        <p className="text-xs text-neutral-500">Nenhuma sugestão para este mês.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((h, idx) => {
            const checked = selected.some(s => s.date === h.date && s.name === h.name);
            
            return (
              <li key={idx} className="flex flex-wrap items-center gap-2 text-sm">
                <input 
                  type="checkbox" 
                  checked={checked} 
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelected([...selected, h]);
                    } else {
                      setSelected(selected.filter(s => !(s.date === h.date && s.name === h.name)));
                    }
                  }} 
                />
                <span className="text-neutral-800">{h.date}</span>
                <span className="text-neutral-500">— {h.name}</span>
                {onAddSinglePost && (
                  <button 
                    onClick={() => onAddSinglePost(h)} 
                    className="ml-auto border rounded px-2 py-1 text-xs hover:bg-neutral-50"
                  >
                    Adicionar post dessa data
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
      
      <div className="flex flex-wrap gap-2 pt-2">
        <button 
          onClick={onAddApproved} 
          className="border rounded px-3 py-1.5 text-sm hover:bg-neutral-50"
        >
          Adicionar aos aprovados
        </button>
        <button 
          onClick={onRegenerate} 
          className="border rounded px-3 py-1.5 text-sm hover:bg-neutral-50"
        >
          Regenerar com aprovados
        </button>
      </div>
    </div>
  );
}
