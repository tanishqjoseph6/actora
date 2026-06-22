export default function ActionsPage() {
    return (
      <main className="min-h-screen bg-black text-white p-10">
        <h1 className="text-5xl font-bold mb-6">
          🤖 AI Actions
        </h1>
  
        <div className="space-y-4">
  
          <div className="p-6 bg-zinc-900 rounded-xl">
            <h2 className="text-xl font-bold">
              Drafted Reply
            </h2>
            <p className="text-zinc-400">
              Proposal email prepared for client
            </p>
          </div>
  
          <div className="p-6 bg-zinc-900 rounded-xl">
            <h2 className="text-xl font-bold">
              Task Created
            </h2>
            <p className="text-zinc-400">
              Follow-up task generated automatically
            </p>
          </div>
  
          <div className="p-6 bg-zinc-900 rounded-xl">
            <h2 className="text-xl font-bold">
              Meeting Scheduled
            </h2>
            <p className="text-zinc-400">
              Weekly update meeting added
            </p>
          </div>
  
        </div>
      </main>
    );
  }