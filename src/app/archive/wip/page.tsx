'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { db, auth } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

export default function WIPList() {
  const router = useRouter();
  const [works, setWorks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      const uid = user?.uid || '';
      try {
        const snap = await getDocs(collection(db, 'artists', uid, 'wip'));
        const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        items.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setWorks(items);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const statusColor: Record<string, string> = {
    Active: 'border-green-800 text-green-400',
    Paused: 'border-yellow-800 text-yellow-400',
    Abandoned: 'border-red-900 text-red-500',
    Completed: 'border-blue-800 text-blue-400',
  };

  const statuses = ['All', 'Active', 'Paused', 'Abandoned', 'Completed'];
  const filtered = filter === 'All' ? works : works.filter(w => w.status === filter);

  return (
    <div className="min-h-screen bg-background text-primary pb-24">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-[#221A12] px-4 py-3 flex justify-between items-center">
        <button onClick={() => router.back()} className="text-secondary text-sm hover:text-primary transition-colors">Back</button>
        <span className="text-sm font-semibold text-primary">Work in Progress</span>
        <button
          onClick={() => router.push('/archive/wip/new')}
          className="text-sm text-purple-400 hover:text-purple-300 font-medium transition-colors"
        >
          + New
        </button>
      </div>

      <div className="max-w-6xl mx-auto px-4 pt-5">
        <div className="flex gap-3 mb-6 items-center justify-between flex-wrap">
          <div className="flex gap-2 flex-wrap">
            {statuses.map(s => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={'px-3 py-1 rounded-full border text-xs transition-all ' + (filter === s ? 'border-purple-500 bg-purple-900 text-purple-200' : 'border-default text-secondary hover:border-purple-700')}
              >
                {s}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            {(['grid', 'list'] as const).map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={'px-3 py-1.5 rounded border text-xs transition-all ' + (view === v ? 'border-purple-500 bg-purple-900 text-purple-200' : 'border-default text-secondary')}
              >
                {v === 'grid' ? '⊞' : '≡'}
              </button>
            ))}
          </div>
        </div>

        {loading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-card rounded-2xl overflow-hidden animate-pulse">
                <div className="h-48 bg-card-hover" />
                <div className="p-4 space-y-2">
                  <div className="h-3 bg-card-hover rounded w-1/2" />
                  <div className="h-3 bg-card-hover rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="text-center py-32">
            <div className="text-5xl mb-4">🎨</div>
            <div className="text-primary font-medium mb-2">
              {filter === 'All' ? 'Nothing in progress' : 'No ' + filter + ' works'}
            </div>
            <div className="text-secondary text-sm mb-8">
              {filter === 'All' ? 'Track a work as you make it. Photo first. Mira responds.' : ''}
            </div>
            {filter === 'All' && (
              <button
                onClick={() => router.push('/archive/wip/new')}
                className="px-6 py-3 bg-purple-700 hover:bg-purple-600 text-primary text-sm rounded-xl transition-all"
              >
                Start tracking a work
              </button>
            )}
          </div>
        )}

        {!loading && filtered.length > 0 && view === 'grid' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
            {filtered.map(work => (
              <div
                key={work.id}
                onClick={() => router.push('/archive/wip/' + work.id)}
                className="bg-card border border-default rounded-xl overflow-hidden hover:border-purple-700 transition-all cursor-pointer group"
              >
                {work.timeline && work.timeline.length > 0 ? (
                  <img
                    src={work.timeline[work.timeline.length - 1].imageUrl}
                    alt={work.title}
                    className="w-full h-36 sm:h-48 object-contain bg-background group-hover:opacity-90 transition-all"
                  />
                ) : (
                  <div className="w-full h-36 sm:h-48 bg-card-hover flex items-center justify-center">
                    <span className="text-3xl opacity-20">🎨</span>
                  </div>
                )}
                <div className="p-3 sm:p-4">
                  <div className="flex justify-between items-start mb-1">
                    <div className="text-xs sm:text-sm font-medium text-primary truncate flex-1 mr-2">
                      {work.title || 'Untitled'}
                    </div>
                    <span className={'text-xs px-2 py-0.5 rounded-full border whitespace-nowrap ' + (statusColor[work.status] || 'border-purple-800 text-purple-400')}>
                      {work.status || 'Active'}
                    </span>
                  </div>
                  {work.problem && (
                    <div className="text-xs text-secondary line-clamp-2 mt-1">{work.problem}</div>
                  )}
                  <div className="text-xs text-muted mt-2">
                    {work.timeline ? work.timeline.length : 0} photos · {work.createdAt ? new Date(work.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && filtered.length > 0 && view === 'list' && (
          <div className="bg-card border border-default rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-default">
                  {['Photo', 'Title', 'Problem', 'Photos', 'Status', 'Started'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs text-secondary uppercase tracking-wider font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((work, i) => (
                  <tr
                    key={work.id}
                    onClick={() => router.push('/archive/wip/' + work.id)}
                    className={'hover:bg-card-hover transition-all cursor-pointer ' + (i < filtered.length - 1 ? 'border-b border-default' : '')}
                  >
                    <td className="px-4 py-3">
                      {work.timeline && work.timeline.length > 0 ? (
                        <img
                          src={work.timeline[work.timeline.length - 1].imageUrl}
                          alt={work.title}
                          className="w-10 h-10 object-contain bg-background rounded"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-card-hover rounded flex items-center justify-center text-lg">🎨</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-primary font-medium">{work.title || 'Untitled'}</td>
                    <td className="px-4 py-3 text-xs text-secondary max-w-xs">
                      <div className="line-clamp-2">{work.problem || '—'}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-secondary">{work.timeline ? work.timeline.length : 0}</td>
                    <td className="px-4 py-3">
                      <span className={'text-xs px-2 py-0.5 rounded-full border ' + (statusColor[work.status] || 'border-purple-800 text-purple-400')}>
                        {work.status || 'Active'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-secondary">
                      {work.createdAt ? new Date(work.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
