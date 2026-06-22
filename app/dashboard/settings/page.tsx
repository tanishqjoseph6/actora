export default function SettingsPage() {
    return (
      <main className="min-h-screen bg-black text-white p-10">
        <h1 className="text-5xl font-bold mb-8">⚙️ Settings</h1>
  
        <div className="space-y-4">
          <div className="p-6 bg-zinc-900 rounded-xl">
            <p>Email Notifications</p>
          </div>
  
          <div className="p-6 bg-zinc-900 rounded-xl">
            <p>Connected Accounts</p>
          </div>
  
          <div className="p-6 bg-zinc-900 rounded-xl">
            <p>Billing & Subscription</p>
          </div>
        </div>
      </main>
    );
  }