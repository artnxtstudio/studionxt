'use client';

export default function Error({ reset }: { reset: () => void }) {
  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
      <div className="text-center">
        <div className="text-gray-500 text-sm mb-4">Something went wrong.</div>
        <button
          onClick={reset}
          className="px-4 py-2 bg-purple-700 text-white text-sm rounded-lg"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
