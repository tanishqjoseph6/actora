export default function TasksPage() {
    return (
      <main className="min-h-screen bg-black text-white p-10">
        <h1 className="text-5xl font-bold mb-6">📋 Tasks</h1>
  
        <div className="space-y-4">
          <div className="p-6 bg-zinc-900 rounded-xl">
            <h2 className="text-xl font-bold">Send proposal to client</h2>
            <p className="text-zinc-400">Due: Tomorrow</p>
          </div>
  
          <div className="p-6 bg-zinc-900 rounded-xl">
            <h2 className="text-xl font-bold">Follow up with startup team</h2>
            <p className="text-zinc-400">Due: Friday</p>
          </div>
  
          <div className="p-6 bg-zinc-900 rounded-xl">
            <h2 className="text-xl font-bold">Review subscription invoice</h2>
            <p className="text-zinc-400">Due: Next Week</p>
          </div>
        </div>
      </main>
    );
  }