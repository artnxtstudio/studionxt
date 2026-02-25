'use client';

import { useState } from 'react';
import { db, auth } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

const STATUS_OPTIONS = ['Available','Reserved','Sold','Donated','MuseumCollection','ArtistRetained','Destroyed'];
const STATUS_LABELS: Record<string,string> = { Available:'Available',Reserved:'Reserved',Sold:'Sold',Donated:'Donated',MuseumCollection:'Museum collection',ArtistRetained:'Artist retained',Destroyed:'Destroyed' };
const STATUS_COLORS: Record<string,string> = { Available:'text-green-400 border-green-800',Reserved:'text-yellow-400 border-yellow-800',Sold:'text-blue-400 border-blue-800',Donated:'text-purple-400 border-purple-800',MuseumCollection:'text-orange-400 border-orange-800',ArtistRetained:'text-gray-400 border-gray-700',Destroyed:'text-red-500 border-red-900' };
const COLLECTOR_TYPES = ['Private','Institution','Gallery','Artist'];
const CURRENCIES = ['USD','EUR','GBP','CHF','JPY','AUD','CAD'];

interface Props { artwork: any; userId?: string; }

export default function EditionLedger({ artwork, userId = 'demo-user' }: Props) {
  const [ledger, setLedger] = useState<any[]>(artwork.ledger || []);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [showCatalogue, setShowCatalogue] = useState(false);

  const inp = 'w-full bg-[#0A0908] border border-[#3D3530] text-[#F5F0EB] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-purple-500 transition-colors';

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
      <div className="bg-[#141210] border border-[#2A2520] rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#221F1C]">
          <div className="text-xs text-purple-400 uppercase tracking-widest">Classification</div>
        </div>
        <div className="px-5 py-4 space-y-3">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="px-3 py-1 rounded-full border border-purple-700 bg-purple-900/20 text-xs text-purple-300 font-medium">Unique · 1 of 1</div>
            {artwork.certificateIssued && <div className="px-3 py-1 rounded-full border border-green-800 text-xs text-green-400">CoA issued</div>}
          </div>
          {artwork.signatureDetails && <div className="text-xs text-gray-500">{artwork.signatureDetails}</div>}
          {artwork.markingType && <div className="text-xs text-gray-600">Marked: {artwork.markingType}</div>}
          <button onClick={() => setShowCatalogue(s => !s)} className="text-xs text-gray-500 hover:text-[#F5F0EB] transition-colors">
            {showCatalogue ? 'Hide' : 'Show'} catalogue entry
          </button>
          {showCatalogue && (
            <div className="bg-[#0A0908] border border-[#2A2520] rounded-xl p-4">
              <div className="text-xs text-purple-400 mb-2 uppercase tracking-widest">Catalogue entry</div>
              <pre className="text-xs text-gray-300 whitespace-pre-wrap font-mono leading-relaxed">{catalogueText}</pre>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (artwork.classification === 'OpenEdition') {
    return (
      <div className="bg-[#141210] border border-[#2A2520] rounded-2xl p-5">
        <div className="text-xs text-purple-400 uppercase tracking-widest mb-3">Classification</div>
        <div className="px-3 py-1 rounded-full border border-gray-700 text-xs text-gray-400 inline-block mb-3">Open edition</div>
        <div className="text-xs text-gray-500">No fixed limit on copies. Clearly marked as open edition in all records.</div>
      </div>
    );
  }

  return (
    <div className="bg-[#141210] border border-[#2A2520] rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-[#221F1C]">
        <div className="flex justify-between items-start">
          <div>
            <div className="text-xs text-purple-400 uppercase tracking-widest mb-1">Edition ledger</div>
            <div className="text-sm font-semibold text-[#F5F0EB]">{artwork.editionSize} editions{artwork.apCount ? ' + ' + artwork.apCount + ' AP' : ''}</div>
            {artwork.editionSizeLocked && <div className="text-xs text-gray-600 mt-0.5">Edition size locked · Cannot be increased</div>}
          </div>
          <div className="flex gap-4 text-xs text-center">
            <div><div className="font-bold text-green-400">{availableCount}</div><div className="text-gray-600">Available</div></div>
            <div><div className="font-bold text-blue-400">{soldCount}</div><div className="text-gray-600">Sold</div></div>
            <div><div className="font-bold text-[#F5F0EB]">{ledger.length}</div><div className="text-gray-600">Total</div></div>
          </div>
        </div>
      </div>

      {editionEntries.length > 0 && (
        <div>
          <div className="px-5 py-2 bg-[#0A0908] border-b border-[#221F1C]">
            <div className="text-xs text-gray-600 uppercase tracking-wider">Editions</div>
          </div>
          {editionEntries.map(entry => (
            <div key={entry.id}>
              {editingId === entry.id ? (
                <div className="p-5 space-y-3 bg-[#0d0d0d] border-b border-[#221F1C]">
                  <div className="text-xs text-purple-400 font-medium">{entry.number}</div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><div className="text-xs text-gray-500 mb-1">Status</div><select value={editData.status} onChange={e => setEditData((d: any) => ({ ...d, status: e.target.value }))} className={inp}>{STATUS_OPTIONS.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}</select></div>
                    <div><div className="text-xs text-gray-500 mb-1">Collector type</div><select value={editData.collectorType} onChange={e => setEditData((d: any) => ({ ...d, collectorType: e.target.value }))} className={inp}><option value="">Select...</option>{COLLECTOR_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                  </div>
                  <div><div className="text-xs text-gray-500 mb-1">Collector name</div><input value={editData.collectorName} onChange={e => setEditData((d: any) => ({ ...d, collectorName: e.target.value }))} placeholder="Name or institution" className={inp} /></div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2"><div className="text-xs text-gray-500 mb-1">Sale price</div><input value={editData.salePrice} onChange={e => setEditData((d: any) => ({ ...d, salePrice: e.target.value }))} placeholder="0" className={inp} /></div>
                    <div><div className="text-xs text-gray-500 mb-1">Currency</div><select value={editData.currency} onChange={e => setEditData((d: any) => ({ ...d, currency: e.target.value }))} className={inp}>{CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><div className="text-xs text-gray-500 mb-1">Invoice no.</div><input value={editData.invoiceNumber} onChange={e => setEditData((d: any) => ({ ...d, invoiceNumber: e.target.value }))} placeholder="Optional" className={inp} /></div>
                    <div><div className="text-xs text-gray-500 mb-1">Sale date</div><input type="date" value={editData.saleDate} onChange={e => setEditData((d: any) => ({ ...d, saleDate: e.target.value }))} className={inp} /></div>
                  </div>
                  <div><div className="text-xs text-gray-500 mb-1">Current location</div><input value={editData.currentLocation} onChange={e => setEditData((d: any) => ({ ...d, currentLocation: e.target.value }))} placeholder="e.g. Collector home, museum collection" className={inp} /></div>
                  <div><div className="text-xs text-gray-500 mb-1">Provenance notes</div><textarea value={editData.provenanceNotes} onChange={e => setEditData((d: any) => ({ ...d, provenanceNotes: e.target.value }))} rows={2} className={inp + ' resize-none'} /></div>
                  <div className="flex gap-2">
                    <button onClick={saveEntry} disabled={saving} className="flex-1 py-2 bg-purple-700 hover:bg-purple-600 disabled:opacity-40 text-[#F5F0EB] text-xs rounded-lg">{saving ? 'Saving...' : 'Save'}</button>
                    <button onClick={() => setEditingId(null)} className="px-4 py-2 border border-[#3D3530] text-gray-500 text-xs rounded-lg">Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="px-5 py-3 flex items-center justify-between hover:bg-[#0d0d0d] transition-all border-b border-[#221F1C] last:border-0">
                  <div className="flex items-center gap-4">
                    <div className="text-xs font-mono text-[#F5F0EB] w-16 flex-shrink-0">{entry.number}</div>
                    <div>
                      <div className={'text-xs px-2 py-0.5 rounded-full border inline-block ' + (STATUS_COLORS[entry.status] || 'text-gray-400 border-gray-700')}>{STATUS_LABELS[entry.status] || entry.status}</div>
                      {entry.collectorName && <div className="text-xs text-gray-500 mt-0.5">{entry.collectorName}</div>}
                      {entry.currentLocation && <div className="text-xs text-gray-700">{entry.currentLocation}</div>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {entry.salePrice && <div className="text-xs text-gray-400">{entry.currency} {entry.salePrice}</div>}
                    <button onClick={() => startEdit(entry)} className="text-xs text-gray-600 hover:text-purple-400 transition-colors">Edit</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {apEntries.length > 0 && (
        <div>
          <div className="px-5 py-2 bg-[#0A0908] border-y border-[#221F1C]">
            <div className="text-xs text-gray-600 uppercase tracking-wider">Artist Proofs (AP) — recorded separately</div>
          </div>
          {apEntries.map(entry => (
            <div key={entry.id} className="px-5 py-3 flex items-center justify-between hover:bg-[#0d0d0d] transition-all border-b border-[#221F1C] last:border-0">
              <div className="flex items-center gap-4">
                <div className="text-xs font-mono text-purple-300 w-16 flex-shrink-0">{entry.number}</div>
                <div>
                  <div className={'text-xs px-2 py-0.5 rounded-full border inline-block ' + (STATUS_COLORS[entry.status] || 'text-gray-400 border-gray-700')}>{STATUS_LABELS[entry.status] || entry.status}</div>
                  {entry.collectorName && <div className="text-xs text-gray-500 mt-0.5">{entry.collectorName}</div>}
                  {entry.currentLocation && <div className="text-xs text-gray-700">{entry.currentLocation}</div>}
                </div>
              </div>
              <div className="flex items-center gap-3">
                {entry.salePrice && <div className="text-xs text-gray-400">{entry.currency} {entry.salePrice}</div>}
                <button onClick={() => startEdit(entry)} className="text-xs text-gray-600 hover:text-purple-400 transition-colors">Edit</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="px-5 py-4 border-t border-[#221F1C]">
        <button onClick={() => setShowCatalogue(s => !s)} className="text-xs text-gray-500 hover:text-[#F5F0EB] transition-colors">
          {showCatalogue ? 'Hide' : 'Show'} catalogue entry
        </button>
        {showCatalogue && (
          <div className="mt-3 bg-[#0A0908] border border-[#2A2520] rounded-xl p-4">
            <div className="text-xs text-purple-400 mb-2 uppercase tracking-widest">Catalogue entry</div>
            <pre className="text-xs text-gray-300 whitespace-pre-wrap font-mono leading-relaxed">{catalogueText}</pre>
            <div className="mt-3 pt-3 border-t border-[#221F1C] text-xs text-gray-600 italic">This archive is the authoritative record of production. All edition data must match physical markings.</div>
          </div>
        )}
      </div>
    </div>
  );
}
