/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Product, SalesRecord } from '../types';
import { formatTarikh, formatCurrency } from '../utils';
import { Trash2, Edit2, Check, X, CalendarDays, Search, SlidersHorizontal, ChevronDown, ChevronUp } from 'lucide-react';

// ================== Component 1: TAPISAN REKOD JUALAN ==================
interface TapisanRekodProps {
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  dateFrom: string;
  setDateFrom: (v: string) => void;
  dateTo: string;
  setDateTo: (v: string) => void;
  products: Product[];
}

export function TapisanRekod({
  searchTerm,
  setSearchTerm,
  dateFrom,
  setDateFrom,
  dateTo,
  setDateTo,
  products
}: TapisanRekodProps) {
  const [isOpen, setIsOpen] = useState(false);
  const isFilterActive = !!(searchTerm || dateFrom || dateTo);

  return (
    <div className="bg-white border border-slate-150 rounded-xl shadow-2xs overflow-hidden no-print">
      {/* Clickable Dropdown Trigger/Header */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-slate-50/50 hover:bg-slate-50 transition-colors text-left focus:outline-none cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
            <SlidersHorizontal className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-tight flex items-center gap-1.5">
              <span>Carian Rekod Jualan</span>
            </h4>
            <p className="text-[10px] text-slate-450 font-medium">
              Klik untuk cari jualan mengikut pilihan produk atau julat tarikh.
            </p>
          </div>
        </div>
        <div className="text-slate-400 p-1 bg-white border border-slate-100 rounded-lg shadow-3xs">
          {isOpen ? <ChevronUp className="w-4 h-4 text-indigo-500" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>
      </button>

      {/* Dropdown Content */}
      {isOpen && (
        <div className="p-4 border-t border-slate-100 bg-white grid grid-cols-1 sm:grid-cols-12 gap-4 items-end">
          {/* Search Input */}
          <div className="sm:col-span-5 space-y-1.5 text-left">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">
              Pilih Produk untuk Dicari:
            </label>
            <div className="relative">
              <select
                className="pl-3 pr-8 py-2 w-full bg-slate-50 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-700 font-bold appearance-none cursor-pointer"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              >
                <option value="">-- Semua Produk --</option>
                {products.map(p => (
                  <option key={p.id} value={p.nama}>
                    {p.nama}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5 text-slate-400">
                <ChevronDown className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>

          {/* Date From */}
          <div className="sm:col-span-3 space-y-1.5 text-left">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">
              Mula (Dari):
            </label>
            <input
              type="date"
              className="w-full py-2 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono text-slate-705"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
            />
          </div>

          {/* Date To */}
          <div className="sm:col-span-3 space-y-1.5 text-left">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">
              Hingga:
            </label>
            <input
              type="date"
              className="w-full py-2 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono text-slate-705"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
            />
          </div>

          {/* Reset / Action Buttons */}
          <div className="sm:col-span-1">
            <button 
              type="button"
              onClick={() => { setDateFrom(''); setDateTo(''); setSearchTerm(''); }}
              disabled={!isFilterActive}
              className={`w-full py-2 border rounded-lg text-[11px] font-extrabold cursor-pointer transition uppercase tracking-wider ${
                isFilterActive 
                  ? 'border-indigo-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 text-indigo-600 bg-white' 
                  : 'border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed'
              }`}
            >
              Batal
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ================== Component 2: REKOD JUALAN ALIRAN HARIAN ==================
interface TableHarianProps {
  records: SalesRecord[];
  products: Product[];
  onDeleteRecord: (id: string) => void;
  onUpdateRecord: (id: string, updated: Partial<SalesRecord>) => void;
}

export function TableHarian({ records, products, onDeleteRecord, onUpdateRecord }: TableHarianProps) {
  // Editing state
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [editDihantar, setEditDihantar] = useState('0');
  const [editTambahan, setEditTambahan] = useState('0');
  const [editTerjual, setEditTerjual] = useState('0');

  const getProductObj = (produkNama: string) => {
    return products.find(p => p.nama.toLowerCase() === produkNama.toLowerCase());
  };

  const harianRecords = records.filter(r => {
    const prod = getProductObj(r.produk);
    return prod ? prod.jenis === 'harian' : true;
  });

  const harianTotalRev = harianRecords.reduce((sum, r) => sum + r.jumlah, 0);

  const startEditRecord = (record: SalesRecord) => {
    setEditingRecordId(record.id);
    setEditDihantar(record.dihantar.toString());
    setEditTambahan(record.tambahan.toString());
    setEditTerjual(record.terjual.toString());
  };

  const cancelEditRecord = () => {
    setEditingRecordId(null);
  };

  const handleSaveRecord = (id: string) => {
    const record = records.find(r => r.id === id);
    if (!record) return;

    const intTerjual = parseInt(editTerjual) || 0;
    if (intTerjual <= 0) {
      alert('Bilangan terjual mesti melebihi 1 unit.');
      return;
    }

    const intDihantar = parseInt(editDihantar) || 0;
    const intTambahan = parseInt(editTambahan) || 0;
    if (intDihantar < 0 || intTambahan < 0) {
      alert('Unit dihantar atau tambahan tidak boleh bernilai negatif.');
      return;
    }
    if ((intDihantar + intTambahan) < intTerjual) {
      alert(`Baki terjual (${intTerjual}) tidak boleh melebihi jumlah unit dihantar + tambahan (${intDihantar + intTambahan}).`);
      return;
    }

    onUpdateRecord(id, {
      dihantar: intDihantar,
      tambahan: intTambahan,
      terjual: intTerjual,
      jumlah: intTerjual * record.harga,
    });

    setEditingRecordId(null);
  };

  return (
    <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-xs">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
          <h4 className="text-xs font-bold text-slate-800 tracking-wider uppercase">
            🚚 Rekod Jualan Aliran Harian
          </h4>
        </div>
        <span className="text-xs font-mono font-bold text-sky-600 bg-sky-50 px-2.5 py-0.5 rounded-full">
          RM {formatCurrency(harianTotalRev)}
        </span>
      </div>

      {harianRecords.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center text-slate-400 no-print">
          <CalendarDays className="w-8 h-8 text-slate-300 stroke-[1.5] mb-2" />
          <p className="text-xs font-semibold">Tiada rekod jualan harian bagi tempoh ini.</p>
        </div>
      ) : (
        <div className="table-responsive border border-slate-100 rounded-lg overflow-x-auto">
          <table className="w-full text-left min-w-[650px]">
            <thead>
              <tr className="text-slate-400 text-[9px] uppercase font-bold tracking-wider border-b border-slate-100">
                <th className="py-2.5 pl-2 text-center">No</th>
                <th className="py-2.5">Tarikh</th>
                <th className="py-2.5">Produk</th>
                <th className="py-2.5 text-center">Dihantar</th>
                <th className="py-2.5 text-center">Tambahan</th>
                <th className="py-2.5 text-center">Terjual</th>
                <th className="py-2.5 text-right">Harga (RM)</th>
                <th className="py-2.5 text-right pr-3">Jumlah (RM)</th>
                <th className="py-2.5 text-center no-print">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/60 font-medium text-slate-700 text-xs">
              {harianRecords.map((r, i) => {
                const isEditing = editingRecordId === r.id;
                return (
                  <tr key={r.id} className="hover:bg-slate-50/30 transition">
                    <td className="py-2.5 text-center font-mono text-slate-405">{i + 1}</td>
                    <td className="py-2.5 font-mono text-slate-500 whitespace-nowrap">{formatTarikh(r.tarikh)}</td>
                    <td className="py-2.5 font-bold text-slate-700">{r.produk}</td>
                    
                    {/* Dihantar edit */}
                    <td className="py-2.5 text-center font-mono text-slate-600">
                      {isEditing ? (
                        <input
                          type="number"
                          min="0"
                          className="bg-white border border-slate-300 rounded text-center font-mono py-0.5 w-12 text-xs"
                          value={editDihantar}
                          onChange={e => setEditDihantar(e.target.value)}
                        />
                      ) : (
                        r.dihantar
                      )}
                    </td>

                    {/* Tambahan edit */}
                    <td className="py-2.5 text-center font-mono text-slate-600">
                      {isEditing ? (
                        <input
                          type="number"
                          min="0"
                          className="bg-white border border-slate-300 rounded text-center font-mono py-0.5 w-12 text-xs"
                          value={editTambahan}
                          onChange={e => setEditTambahan(e.target.value)}
                        />
                      ) : (
                        r.tambahan
                      )}
                    </td>

                    {/* Terjual edit */}
                    <td className="py-2.5 text-center font-mono text-slate-800 font-bold">
                      {isEditing ? (
                        <input
                          type="number"
                          min="1"
                          className="bg-white border border-slate-300 rounded text-center font-mono py-0.5 w-12 text-xs"
                          value={editTerjual}
                          onChange={e => setEditTerjual(e.target.value)}
                        />
                      ) : (
                        r.terjual
                      )}
                    </td>

                    <td className="py-2.5 text-right font-mono text-slate-500">RM {formatCurrency(r.harga)}</td>
                    
                    {/* Jumlah */}
                    <td className="py-2.5 text-right font-mono font-bold text-slate-800 pr-3">
                      {isEditing ? (
                        <span className="text-emerald-600">RM {formatCurrency((parseInt(editTerjual) || 0) * r.harga)}</span>
                      ) : (
                        <span>RM {formatCurrency(r.jumlah)}</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-2.5 text-center no-print whitespace-nowrap">
                      {isEditing ? (
                        <div className="flex gap-1 justify-center">
                          <button
                            onClick={() => handleSaveRecord(r.id)}
                            className="p-1 px-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs cursor-pointer"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                          <button
                            onClick={cancelEditRecord}
                            className="p-1 px-1.5 bg-slate-400 hover:bg-slate-500 text-white rounded text-xs cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-1 justify-center">
                          <button
                            onClick={() => startEditRecord(r)}
                            className="p-1 font-semibold text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded transition cursor-pointer"
                            title="Kemaskini rekod"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteRecord(r.id)}
                            className="p-1 text-slate-400 hover:text-rose-50 rounded hover:bg-rose-50 transition cursor-pointer"
                            title="Padam rekod"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ================== Component 3: REKOD JUALAN SISTEM STOK ==================
interface TableStokProps {
  records: SalesRecord[];
  products: Product[];
  onDeleteRecord: (id: string) => void;
  onUpdateRecord: (id: string, updated: Partial<SalesRecord>) => void;
}

export function TableStok({ records, products, onDeleteRecord, onUpdateRecord }: TableStokProps) {
  // Editing state
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [editTerjual, setEditTerjual] = useState('0');

  const getProductObj = (produkNama: string) => {
    return products.find(p => p.nama.toLowerCase() === produkNama.toLowerCase());
  };

  const stokRecords = records.filter(r => {
    const prod = getProductObj(r.produk);
    return prod ? prod.jenis === 'stok' : false;
  });

  const stokTotalRev = stokRecords.reduce((sum, r) => sum + r.jumlah, 0);

  const startEditRecord = (record: SalesRecord) => {
    setEditingRecordId(record.id);
    setEditTerjual(record.terjual.toString());
  };

  const cancelEditRecord = () => {
    setEditingRecordId(null);
  };

  const handleSaveRecord = (id: string) => {
    const record = records.find(r => r.id === id);
    if (!record) return;

    const prod = getProductObj(record.produk);
    if (!prod) return;

    const intTerjual = parseInt(editTerjual) || 0;
    if (intTerjual <= 0) {
      alert('Bilangan terjual mesti melebihi 1 unit.');
      return;
    }

    const availableTempPool = prod.stok + record.terjual;
    if (intTerjual > availableTempPool) {
      alert(`Baki stok produk tidak mencukupi untuk penukaran ini! Maksimum dibenarkan: ${availableTempPool} unit.`);
      return;
    }

    onUpdateRecord(id, {
      terjual: intTerjual,
      jumlah: intTerjual * record.harga,
    });

    setEditingRecordId(null);
  };

  return (
    <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-xs">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
          <h4 className="text-xs font-bold text-slate-800 tracking-wider uppercase">
            📦 Rekod Jualan Sistem Stok
          </h4>
        </div>
        <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full">
          RM {formatCurrency(stokTotalRev)}
        </span>
      </div>

      {stokRecords.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center text-slate-400 no-print">
          <CalendarDays className="w-8 h-8 text-slate-300 stroke-[1.5] mb-2" />
          <p className="text-xs font-semibold">Tiada rekod jualan sistem stok bagi tempoh ini.</p>
        </div>
      ) : (
        <div className="table-responsive border border-slate-100 rounded-lg overflow-x-auto">
          <table className="w-full text-left min-w-[550px]">
            <thead>
              <tr className="text-slate-400 text-[10px] uppercase font-bold tracking-wider border-b border-slate-100">
                <th className="py-2.5 pl-2 text-center">No</th>
                <th className="py-2.5">Tarikh</th>
                <th className="py-2.5">Produk</th>
                <th className="py-2.5 text-center">Terjual</th>
                <th className="py-2.5 text-right">Harga (RM)</th>
                <th className="py-2.5 text-right pr-3">Jumlah (RM)</th>
                <th className="py-2.5 text-center no-print">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/60 font-medium text-slate-700 text-xs">
              {stokRecords.map((r, i) => {
                const isEditing = editingRecordId === r.id;
                return (
                  <tr key={r.id} className="hover:bg-slate-50/30 transition">
                    <td className="py-2.5 text-center font-mono text-slate-405">{i + 1}</td>
                    <td className="py-2.5 font-mono text-slate-500 whitespace-nowrap">{formatTarikh(r.tarikh)}</td>
                    <td className="py-2.5 font-bold text-slate-700">{r.produk}</td>

                    {/* Terjual edit */}
                    <td className="py-2.5 text-center font-mono text-slate-800 font-bold">
                      {isEditing ? (
                        <input
                          type="number"
                          min="1"
                          className="bg-white border border-slate-300 rounded text-center font-mono py-0.5 w-12 text-xs"
                          value={editTerjual}
                          onChange={e => setEditTerjual(e.target.value)}
                        />
                      ) : (
                        r.terjual
                      )}
                    </td>

                    <td className="py-2.5 text-right font-mono text-slate-500">RM {formatCurrency(r.harga)}</td>
                    
                    {/* Jumlah */}
                    <td className="py-2.5 text-right font-mono font-bold text-slate-800 pr-3">
                      {isEditing ? (
                        <span className="text-emerald-600">RM {formatCurrency((parseInt(editTerjual) || 0) * r.harga)}</span>
                      ) : (
                        <span>RM {formatCurrency(r.jumlah)}</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-2.5 text-center no-print whitespace-nowrap">
                      {isEditing ? (
                        <div className="flex gap-1 justify-center">
                          <button
                            onClick={() => handleSaveRecord(r.id)}
                            className="p-1 px-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs cursor-pointer"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                          <button
                            onClick={cancelEditRecord}
                            className="p-1 px-1.5 bg-slate-400 hover:bg-slate-500 text-white rounded text-xs cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-1 justify-center">
                          <button
                            onClick={() => startEditRecord(r)}
                            className="p-1 font-semibold text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded transition cursor-pointer"
                            title="Kemaskini rekod"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteRecord(r.id)}
                            className="p-1 text-slate-400 hover:text-rose-50 rounded hover:bg-rose-50 transition cursor-pointer"
                            title="Padam rekod"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// Default export wrapper for backward compatibility
interface RekodListsProps {
  records: SalesRecord[];
  products: Product[];
  onDeleteRecord: (id: string) => void;
  onUpdateRecord: (id: string, updated: Partial<SalesRecord>) => void;
}

export default function RekodLists({ records, products, onDeleteRecord, onUpdateRecord }: RekodListsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  
  const todayStr = new Date().toISOString().slice(0, 10);
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const monthAgoStr = thirtyDaysAgo.toISOString().slice(0, 10);

  const [dateFrom, setDateFrom] = useState(monthAgoStr);
  const [dateTo, setDateTo] = useState(todayStr);

  const filteredRecords = records.filter(r => {
    const matchesSearch = r.produk.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDate = (!dateFrom || r.tarikh >= dateFrom) && (!dateTo || r.tarikh <= dateTo);
    return matchesSearch && matchesDate;
  });

  return (
    <div className="space-y-6">
      <TapisanRekod 
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        dateFrom={dateFrom}
        setDateFrom={setDateFrom}
        dateTo={dateTo}
        setDateTo={setDateTo}
        products={products}
      />
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <TableHarian 
          records={filteredRecords}
          products={products}
          onDeleteRecord={onDeleteRecord}
          onUpdateRecord={onUpdateRecord}
        />
        <TableStok 
          records={filteredRecords}
          products={products}
          onDeleteRecord={onDeleteRecord}
          onUpdateRecord={onUpdateRecord}
        />
      </div>
    </div>
  );
}
