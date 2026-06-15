export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
      <h1 className="text-6xl font-bold mb-4">
        Actora
      </h1>

      <p className="text-xl text-gray-500">
        The inbox that takes action.
      </p>

      <button className="mt-8 px-6 py-3 rounded-xl bg-black text-white">
        Join Waitlist
      </button>
    </main>
  );
}