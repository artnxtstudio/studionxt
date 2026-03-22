'use client';

import { useState } from 'react';
import { db, auth } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

const STATUS_OPTIONS = ['Available','Reserved','Sold','Donated','MuseumCollection','ArtistRetained','Destroyed'];
const STATUS_LABELS: Record<string,string> = { Available:'Available',Reserved:'Reserved',Sold:'Sold',Donated:'Donated',MuseumCollection:'Museum collection',ArtistRetained:'Artist retained',Destroyed:'Destroyed' };
const STATUS_COLORS: Record<string,string> = { Available:'text-green-600 border-green-400',Reserved:'text-yellow-600 border-yellow-400',Sold:'text-blue-600 border-blue-400',Donated:'text-purple-600 border-purple-400',MuseumCollection:'text-orange-600 border-orange-400',ArtistRetained:'text-secondary border-default',Destroyed:'text-red-600 border-red-400' };
const COLLECTOR_TYPES = ['Private','Institution','Gallery','Artist'];
const CURRENCIES = ['USD','EUR','GBP','CHF','JPY','AUD','CAD'];

interface Props { artwork: any; userId?: string; }

export default function EditionLedger({ artwork, userId = 'demo-user' }: Props) {
  const [ledger, setLedger] = useState<any[]>(artwork.ledger || []);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [showCatalogue, setShowCatalogue] = useState(false);

  const inp = 'w-full bg-background border border-default text-primary rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-purple-500 transition-colors';

  function startEdit(entry: any) { setEditingId(entry.id); setEditData({ ...entry }); }

  async function saveEntry() {
    setSaving(true);
    try {
      const updated = ledger.map(e => e.id === editingId ? { ...editData } : e);
      await new Promise<void>(resolve => {
        const unsub = onAuthStateChanged(auth, async user => {
          unsub();
          const uid = user?.uid || userId;
          await updateDoc(doc(db, 'artists', uid, 'artworks', artwork.id), { ledger: updated });
          resolve();
        });
      });
      setLedger(updated);
      setEditingId(null);
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  }

  const editionEntries = ledger.filter(e => e.type === 'Edition');
  const apEntries = ledger.filter(e => e.type === 'AP');
  const soldCount = ledger.filter(e => e.status === 'Sold').length;
  const availableCount = ledger.filter(e => e.status === 'Available').length;

  const classLine = !artwork.classification || artwork.classification === 'Unique' ? 'Unique work'
    : artwork.classification === 'LimitedEdition' ? ('Edition of ' + artwork.editionSize + (artwork.apCount ? ' + ' + artwork.apCount + ' AP' : ''))
    : 'Open edition';

  const catalogueText = (artwork.title || 'Untitled') + ', ' + (artwork.year || '') + '\n'
    + (artwork.medium || '') + (artwork.materials ? ', ' + artwork.materials : '') + '\n'
    + (artwork.dimensions || '') + '\n' + classLine
    + (artwork.signatureDetails ? '\n' + artwork.signatureDetails : '');

  if (!artwork.classification || artwork.classification === 'Unique') {
    return (
      <div className="bg-card border border-default rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-default">
          <div className="text-xs text-purple-400 uppercase tracking-widest">Classification</div>
        </div>
        <div className="px-5 py-4 space-y-3">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="px-3 py-1 rounded-full border border-purple-400 bg-purple-50 text-xs text-purple-700 font-medium dark:border-purple-700 dark:bg-purple-900/20 dark:text-purple-300">Unique · 1 of 1</div>
            {artwork.certificateIssued && <div className="px-3 py-1 rounded-full border border-green-500 text-xs text-green-600">CoA issued</div>}
          </div>
          {artwork.signatureDetails && <div className="text-xs text-secondary">{artwork.signatureDetails}</div>}
          {artwork.markingType && <div className="text-xs text-muted">Marked: {artwork.markingType}</div>}
          <button onClick={() => setShowCatalogue(s => !s)} className="text-xs text-secondary hover:text-primary transition-colors">
            {showCatalogue ? 'Hide' : 'Show'} catalogue entry
          </button>
          {showCatalogue && (
            <div className="bg-background border border-default rounded-xl p-4">
              <div className="text-xs text-purple-400 mb-2 uppercase tracking-widest">Catalogue entry</div>
              <pre className="text-xs text-primary whitespace-pre-wrap font-mono leading-relaxed">{catalogueText}</pre>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (artwork.classification === 'OpenEdition') {
    return (
      <div className="bg-card border border-default rounded-2xl p-5">
        <div className="text-xs text-purple-400 uppercase tracking-widest mb-3">Classification</div>
        <div className="px-3 py-1 rounded-full border border-gray-700 text-xs text-secondary inline-block mb-3">Open edition</div>
        <div className="text-xs text-secondary">No fixed limit on copies. Clearly marked as open edition in all records.</div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-default rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-default">
        <div className="flex justify-between items-start">
          <div>
            <div className="text-xs text-purple-400 uppercase tracking-widest mb-1">Edition ledger</div>
            <div className="text-sm font-semibold text-primary">{artwork.editionSize} editions{artwork.apCount ? ' + ' + artwork.apCount + ' AP' : ''}</div>
            {artwork.editionSizeLocked && <div className="text-xs text-muted mt-0.5">Edition size locked · Cannot be increased</div>}
          </div>
          <div className="flex gap-4 text-xs text-center">
            <div><div className="font-bold text-green-600">{availableCount}</div><div className="text-secondary">Available</div></div>
            <div><div className="font-bold text-blue-400">{soldCount}</div><div className="text-secondary">Sold</div></div>
            <div><div className="font-bold text-primary">{ledger.length}</div><div className="text-secondary">Total</div></div>
          </div>
        </div>
      </div>

      {editionEntries.length > 0 && (
        <div>
          <div className="px-5 py-2 bg-background border-b border-default">
            <div className="text-xs text-muted uppercase tracking-wider">Editions</div>
          </div>
          {editionEntries.map(entry => (
            <div key={entry.id}>
              {editingId === entry.id ? (
                <div className="p-5 space-y-3 bg-card-hover border-b border-default">
                  <div className="text-xs text-purple-400 font-medium">{entry.number}</div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><div className="text-xs text-secondary mb-1">Status</div><select value={editData.status} onChange={e => setEditData((d: any) => ({ ...d, status: e.target.value }))} className={inp}>{STATUS_OPTIONS.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}</select></div>
                    <div><div className="text-xs text-secondary mb-1">Collector type</div><select value={editData.collectorType} onChange={e => setEditData((d: any) => ({ ...d, collectorType: e.target.value }))} className={inp}><option value="">Select...</option>{COLLECTOR_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                  </div>
                  <div><div className="text-xs text-secondary mb-1">Collector name</div><input value={editData.collectorName} onChange={e => setEditData((d: any) => ({ ...d, collectorName: e.target.value }))} placeholder="Name or institution" className={inp} /></div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2"><div className="text-xs text-secondary mb-1">Sale price</div><input value={editData.salePrice} onChange={e => setEditData((d: any) => ({ ...d, salePrice: e.target.value }))} placeholder="0" className={inp} /></div>
                    <div><div className="text-xs text-secondary mb-1">Currency</div><select value={editData.currency} onChange={e => setEditData((d: any) => ({ ...d, currency: e.target.value }))} className={inp}>{CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><div className="text-xs text-secondary mb-1">Invoice no.</div><input value={editData.invoiceNumber} onChange={e => setEditData((d: any) => ({ ...d, invoiceNumber: e.target.value }))} placeholder="Optional" className={inp} /></div>
                    <div><div className="text-xs text-secondary mb-1">Sale date</div><input type="date" value={editData.saleDate} onChange={e => setEditData((d: any) => ({ ...d, saleDate: e.target.value }))} className={inp} /></div>
                  </div>
                  <div><div className="text-xs text-secondary mb-1">Current location</div><input value={editData.currentLocation} onChange={e => setEditData((d: any) => ({ ...d, currentLocation: e.target.value }))} placeholder="e.g. Collector home, museum collection" className={inp} /></div>
                  <div><div className="text-xs text-secondary mb-1">Provenance notes</div><textarea value={editData.provenanceNotes} onChange={e => setEditData((d: any) => ({ ...d, provenanceNotes: e.target.value }))} rows={2} className={inp + ' resize-none'} /></div>
                  <div className="flex gap-2">
                    <button onClick={saveEntry} disabled={saving} className="flex-1 py-2 bg-purple-700 hover:bg-purple-600 disabled:opacity-40 text-white text-xs rounded-lg">{saving ? 'Saving...' : 'Save'}</button>
                    <button onClick={() => setEditingId(null)} className="px-4 py-2 border border-default text-secondary text-xs rounded-lg">Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="px-5 py-3 flex items-center justify-between hover:bg-card-hover transition-all border-b border-default last:border-0">
                  <div className="flex items-center gap-4">
                    <div className="text-xs font-mono text-primary w-16 flex-shrink-0">{entry.number}</div>
                    <div>
                      <div className={'text-xs px-2 py-0.5 rounded-full border inline-block ' + (STATUS_COLORS[entry.status] || 'text-secondary border-gray-700')}>{STATUS_LABELS[entry.status] || entry.status}</div>
                      {entry.collectorName && <div className="text-xs text-secondary mt-0.5">{entry.collectorName}</div>}
                      {entry.currentLocation && <div className="text-xs text-muted">{entry.currentLocation}</div>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {entry.salePrice && <div className="text-xs text-secondary">{entry.currency} {entry.salePrice}</div>}
                    <button onClick={() => startEdit(entry)} className="text-xs text-muted hover:text-purple-400 transition-colors">Edit</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {apEntries.length > 0 && (
        <div>
          <div className="px-5 py-2 bg-background border-y border-default">
            <div className="text-xs text-muted uppercase tracking-wider">Artist Proofs (AP) — recorded separately</div>
          </div>
          {apEntries.map(entry => (
            <div key={entry.id} className="px-5 py-3 flex items-center justify-between hover:bg-card-hover transition-all border-b border-default last:border-0">
              <div className="flex items-center gap-4">
                <div className="text-xs font-mono text-purple-600 w-16 flex-shrink-0">{entry.number}</div>
                <div>
                  <div className={'text-xs px-2 py-0.5 rounded-full border inline-block ' + (STATUS_COLORS[entry.status] || 'text-secondary border-gray-700')}>{STATUS_LABELS[entry.status] || entry.status}</div>
                  {entry.collectorName && <div className="text-xs text-secondary mt-0.5">{entry.collectorName}</div>}
                  {entry.currentLocation && <div className="text-xs text-muted">{entry.currentLocation}</div>}
                </div>
              </div>
              <div className="flex items-center gap-3">
                {entry.salePrice && <div className="text-xs text-secondary">{entry.currency} {entry.salePrice}</div>}
                <button onClick={() => startEdit(entry)} className="text-xs text-muted hover:text-purple-400 transition-colors">Edit</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="px-5 py-4 border-t border-default">
        <button onClick={() => setShowCatalogue(s => !s)} className="text-xs text-secondary hover:text-primary transition-colors">
          {showCatalogue ? 'Hide' : 'Show'} catalogue entry
        </button>
        {showCatalogue && (
          <div className="mt-3 bg-background border border-default rounded-xl p-4">
            <div className="text-xs text-purple-400 mb-2 uppercase tracking-widest">Catalogue entry</div>
            <pre className="text-xs text-primary whitespace-pre-wrap font-mono leading-relaxed">{catalogueText}</pre>
            <div className="mt-3 pt-3 border-t border-default text-xs text-muted italic">This archive is the authoritative record of production. All edition data must match physical markings.</div>
          </div>
        )}
      </div>
    </div>
  );
}
