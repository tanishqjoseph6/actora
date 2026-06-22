export default function MeetingsPage() {
    return (
      <main className="min-h-screen bg-black text-white p-10">
        <h1 className="text-5xl font-bold mb-8">📅 Meetings</h1>
  
        <div className="space-y-4">
          <div className="p-6 bg-zinc-900 rounded-xl">
            <h2 className="text-xl font-bold">
              Weekly Startup Meeting
            </h2>
            <p className="text-zinc-400">
              Friday • 5:00 PM
            </p>
          </div>
  
          <div className="p-6 bg-zinc-900 rounded-xl">
            <h2 className="text-xl font-bold">
              Client Call
            </h2>
            <p className="text-zinc-400">
              Monday • 2:00 PM
            </p>
          </div>
        </div>
      </main>
    );
  }