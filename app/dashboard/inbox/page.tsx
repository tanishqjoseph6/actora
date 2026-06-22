"use client";

export default function InboxPage() {
  const emails = [
    {
      sender: "Amazon",
      subject: "Your order has shipped",
      preview: "Your package is on the way...",
      time: "10m ago",
    },
    {
      sender: "LinkedIn",
      subject: "New job opportunity",
      preview: "A recruiter viewed your profile...",
      time: "1h ago",
    },
    {
      sender: "Stripe",
      subject: "Payment received",
      preview: "You received a payment of $99...",
      time: "3h ago",
    },
  ];

  return (
    <main className="min-h-screen bg-black text-white p-10">
      <h1 className="text-4xl font-bold mb-8">📥 Inbox</h1>

      <div className="space-y-4">
        {emails.map((email, i) => (
          <div
            key={i}
            className="bg-zinc-900 p-5 rounded-xl border border-zinc-800"
          >
            <div className="flex justify-between">
              <h2 className="font-bold">{email.sender}</h2>
              <span className="text-zinc-400">{email.time}</span>
            </div>

            <p className="font-medium mt-2">{email.subject}</p>
            <p className="text-zinc-400">{email.preview}</p>

            <button
              className="mt-4 px-4 py-2 bg-blue-500 rounded-lg"
              onClick={() =>
                alert(
                  "AI Summary:\nThis email contains an important update that may require your attention."
                )
              }
            >
              Generate AI Summary
            </button>
          </div>
        ))}
      </div>
    </main>
  );
}