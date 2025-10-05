export default function DevInfo({ 
  requestPayload, 
  responseRaw, 
  systemExcerpt, 
  userPrompt 
}) {
  return (
    <details className="mt-4 border rounded-lg bg-neutral-50 p-3">
      <summary className="cursor-pointer text-sm font-medium">
        Informações para desenvolvedor
      </summary>
      
      <div className="mt-3 space-y-3">
        <section>
          <div className="text-xs text-neutral-500 mb-1">Request payload</div>
          <pre className="bg-neutral-100 p-3 rounded overflow-x-auto text-xs">
            {JSON.stringify(requestPayload, null, 2)}
          </pre>
        </section>
        
        {userPrompt ? (
          <section>
            <div className="text-xs text-neutral-500 mb-1">User prompt (gerado)</div>
            <pre className="bg-neutral-100 p-3 rounded overflow-x-auto text-xs whitespace-pre-wrap">
              {userPrompt}
            </pre>
          </section>
        ) : null}
        
        {systemExcerpt ? (
          <section>
            <div className="text-xs text-neutral-500 mb-1">System (trecho)</div>
            <pre className="bg-neutral-100 p-3 rounded overflow-x-auto text-xs whitespace-pre-wrap">
              {systemExcerpt}
            </pre>
          </section>
        ) : null}
        
        <section>
          <div className="text-xs text-neutral-500 mb-1">Resposta JSON (bruta)</div>
          <pre className="bg-neutral-100 p-3 rounded overflow-x-auto text-xs">
            {responseRaw}
          </pre>
        </section>
      </div>
    </details>
  );
}
