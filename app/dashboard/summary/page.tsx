export default function SummaryPage() {
    return (
      <main className="min-h-screen bg-black text-white p-10">
        <h1 className="text-5xl font-bold mb-8">
          📊 Daily Summary
        </h1>
  
        <div className="p-6 bg-zinc-900 rounded-xl">
          <p>
            Today:
          </p>
  
          <ul className="mt-4 space-y-2">
            <li>✅ 3 emails processed</li>
            <li>✅ 2 tasks created</li>
            <li>✅ 1 meeting scheduled</li>
            <li>✅ 4 AI actions completed</li>
          </ul>
        </div>
      </main>
    );
  }