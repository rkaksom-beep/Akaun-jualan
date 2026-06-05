/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Product } from '../types';
import { formatCurrency } from '../utils';
import { Trash2, Edit2, Check, X, PlusCircle, ShoppingBag, Package } from 'lucide-react';

interface ProdukListProps {
  products: Product[];
  onAddProduct: (product: Omit<Product, 'id'>) => void;
  onEditProduct: (id: string, updated: Partial<Product>) => void;
  onDeleteProduct: (id: string) => void;
}

export default function ProdukList({ products, onAddProduct, onEditProduct, onDeleteProduct }: ProdukListProps) {
  // New product form states
  const [nama, setNama] = useState('');
  const [harga, setHarga] = useState('0.00');
  const [jenis, setJenis] = useState<'harian' | 'stok'>('harian');
  const [stokAwal, setStokAwal] = useState('0');

  // Edit inline states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNama, setEditNama] = useState('');
  const [editHarga, setEditHarga] = useState('0.00');
  const [editJenis, setEditJenis] = useState<'harian' | 'stok'>('harian');
  const [editStok, setEditStok] = useState('0');

  // Form submit handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNama = nama.trim();
    const floatHarga = parseFloat(harga);
    const intStok = parseInt(stokAwal) || 0;

    if (!cleanNama) {
      alert('Sila isi nama produk.');
      return;
    }
    if (isNaN(floatHarga) || floatHarga <= 0) {
      alert('Sila masukkan harga produk yang sah (melebihi RM 0).');
      return;
    }
    if (products.some(p => p.nama.toLowerCase() === cleanNama.toLowerCase())) {
      alert('Syarikat anda sudah mempunyai produk dengan nama ini.');
      return;
    }
    if (jenis === 'stok' && intStok < 0) {
      alert('Stok awal produk tidak boleh bernilai negatif.');
      return;
    }

    onAddProduct({
      nama: cleanNama,
      harga: floatHarga,
      jenis,
      stok: jenis === 'stok' ? intStok : 0,
      tarikhStokMula: jenis === 'stok' ? new Date().toISOString().slice(0, 10) : undefined,
    });

    // Reset standard state
    setNama('');
    setHarga('0.00');
    setJenis('harian');
    setStokAwal('0');
  };

  // Begin inline editing
  const startEdit = (p: Product) => {
    setEditingId(p.id);
    setEditNama(p.nama);
    setEditHarga(p.harga.toFixed(2));
    setEditJenis(p.jenis);
    setEditStok(p.stok.toString());
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = (id: string) => {
    const cleanNama = editNama.trim();
    const floatHarga = parseFloat(editHarga);
    const intStok = parseInt(editStok) || 0;

    if (!cleanNama) {
      alert('Sila isi nama produk.');
      return;
    }
    if (isNaN(floatHarga) || floatHarga <= 0) {
      alert('Sila masukkan harga produk yang sah.');
      return;
    }
    if (products.some(p => p.id !== id && p.nama.toLowerCase() === cleanNama.toLowerCase())) {
      alert('Satu lagi produk dengan nama ini sudah wujud.');
      return;
    }
    if (editJenis === 'stok' && intStok < 0) {
      alert('Nilai stok tidak boleh negatif.');
      return;
    }

    onEditProduct(id, {
      nama: cleanNama,
      harga: floatHarga,
      jenis: editJenis,
      stok: editJenis === 'stok' ? intStok : 0,
      // If changed from daily to stock, initialize tarikhStokMula
      tarikhStokMula: editJenis === 'stok' ? (products.find(p => p.id === id)?.tarikhStokMula || new Date().toISOString().slice(0, 10)) : undefined
    });

    setEditingId(null);
  };

  const quickAddStock = (p: Product) => {
    const promptValue = prompt(`Masukkan amaun penambahan unit stok untuk [${p.nama}]:`, '10');
    if (promptValue === null) return;
    
    const intAdd = parseInt(promptValue);
    if (isNaN(intAdd) || intAdd <= 0) {
      alert('Sila isi jumlah tambahan stok yang sah (melebihi 0).');
      return;
    }

    onEditProduct(p.id, {
      stok: p.stok + intAdd,
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* 1. Add Product Form - Left Columns */}
      <div className="lg:col-span-4 bg-slate-50/70 p-6 rounded-xl border border-slate-100">
        <h3 className="text-sm font-bold text-slate-800 tracking-wide mb-4 uppercase">
          ➕ Tambah Produk
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label id="lbl-nama" htmlFor="input-nama" className="block text-xs font-semibold text-slate-500 uppercase mb-1">
              Nama Produk
            </label>
            <input
              id="input-nama"
              type="text"
              className="w-full bg-white border border-slate-200 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-indigo-500 font-medium text-slate-800 focus:ring-1 focus:ring-indigo-500 transition-all"
              placeholder="cth: Kuih Talam, Biskut Raya"
              value={nama}
              onChange={e => setNama(e.target.value)}
            />
          </div>

          <div>
            <label id="lbl-harga" htmlFor="input-harga" className="block text-xs font-semibold text-slate-500 uppercase mb-1">
              Harga Seunit (RM)
            </label>
            <input
              id="input-harga"
              type="number"
              step="0.01"
              min="0"
              className="w-full bg-white border border-slate-200 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-indigo-500 font-mono text-slate-800 focus:ring-1 focus:ring-indigo-500 transition-all"
              value={harga}
              onChange={e => setHarga(e.target.value)}
            />
          </div>

          <div>
            <label id="lbl-fungsi" className="block text-xs font-semibold text-slate-500 uppercase mb-1">
              Jenis Pengurusan
            </label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              <button
                type="button"
                id="btn-jenis-harian"
                onClick={() => setJenis('harian')}
                className={`py-2 px-3 text-xs font-semibold rounded-lg border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  jenis === 'harian'
                    ? 'bg-sky-50 border-sky-300 text-sky-700'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <ShoppingBag className="w-4 h-4" />
                Aliran Harian
              </button>
              <button
                type="button"
                id="btn-jenis-stok"
                onClick={() => setJenis('stok')}
                className={`py-2 px-3 text-xs font-semibold rounded-lg border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  jenis === 'stok'
                    ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Package className="w-4 h-4" />
                Sistem Stok
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5 italic leading-relaxed">
              {jenis === 'harian' 
                ? 'Sesuai untuk barang segar / dihantar harian. Memerlukan rekod dihantar, tambahan, dan baki pulangan setiap hari.'
                : 'Sesuai untuk barangan tahan lama / sejuk beku. Aliran jualan akan memotong baki inventori terus daripada gudang stok anda.'}
            </p>
          </div>

          {jenis === 'stok' && (
            <div>
              <label id="lbl-stok" htmlFor="input-stok" className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                Kuantiti Stok Awal (Unit)
              </label>
              <input
                id="input-stok"
                type="number"
                min="0"
                className="w-full bg-white border border-slate-200 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-indigo-500 font-mono text-slate-800 focus:ring-1 focus:ring-indigo-500 transition-all animate-fade-in"
                value={stokAwal}
                onChange={e => setStokAwal(e.target.value)}
              />
            </div>
          )}

          <button
            type="submit"
            id="btn-tambah"
            className="w-full bg-slate-800 hover:bg-slate-900 text-white py-2.5 px-4 rounded-lg font-bold text-xs uppercase flex items-center justify-center gap-2 transition-colors shadow-xs mt-3 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            Tambah Dalam Senarai
          </button>
        </form>
      </div>

      {/* 2. Products List - Right Columns */}
      <div className="lg:col-span-8 bg-white border border-slate-100 rounded-xl p-5 shadow-xs">
        <h3 className="text-sm font-bold text-slate-800 tracking-wide mb-4 uppercase">
          📋 Senarai Produk Syarikat ({products.length})
        </h3>

        {products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 border-2 border-dashed border-slate-100 rounded-xl space-y-2 text-center">
            <Package className="w-10 h-10 text-slate-300 stroke-[1.5]" />
            <p className="text-slate-400 font-medium text-sm">Tiada produk didaftarkan.</p>
            <p className="text-xs text-slate-400 leading-normal max-w-sm">
              Gunakan borang tambah produk di sebelah kiri untuk mula menetapkan catalog jualan syarikat anda.
            </p>
          </div>
        ) : (
          <div className="table-responsive border border-slate-100 rounded-lg">
            <table className="w-full min-w-[650px]">
              <thead>
                <tr className="border-b border-slate-100 text-left">
                  <th className="pb-3 text-xs font-bold text-slate-400 uppercase tracking-widest pl-2">Nama Produk</th>
                  <th className="pb-3 text-xs font-bold text-slate-400 uppercase tracking-widest text-center">Harga Unit (RM)</th>
                  <th className="pb-3 text-xs font-bold text-slate-400 uppercase tracking-widest text-center">Jenis Aliran</th>
                  <th className="pb-3 text-xs font-bold text-slate-400 uppercase tracking-widest text-center">Baki Stok</th>
                  <th className="pb-3 text-xs font-bold text-slate-400 uppercase tracking-widest text-right pr-2">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/70">
                {products.map(p => {
                  const isEditing = editingId === p.id;
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors group">
                      {/* Name Col */}
                      <td className="py-3.5 pl-2 font-medium text-slate-700 text-sm">
                        {isEditing ? (
                          <input
                            type="text"
                            className="bg-white border border-slate-300 rounded px-2 py-1 text-xs w-full font-medium"
                            value={editNama}
                            onChange={e => setEditNama(e.target.value)}
                          />
                        ) : (
                          p.nama
                        )}
                      </td>

                      {/* Price Col */}
                      <td className="py-3.5 text-center font-mono font-medium text-slate-600 text-sm">
                        {isEditing ? (
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            className="bg-white border border-slate-300 rounded px-2 py-1 text-xs w-20 text-center font-mono"
                            value={editHarga}
                            onChange={e => setEditHarga(e.target.value)}
                          />
                        ) : (
                          <span>RM {formatCurrency(p.harga)}</span>
                        )}
                      </td>

                      {/* Type Badge Col */}
                      <td className="py-3.5 text-center">
                        {isEditing ? (
                          <select
                            className="bg-white border border-slate-300 rounded px-1.5 py-1 text-xs"
                            value={editJenis}
                            onChange={e => setEditJenis(e.target.value as 'harian' | 'stok')}
                          >
                            <option value="harian">Harian</option>
                            <option value="stok">Stok</option>
                          </select>
                        ) : (
                          <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                            p.jenis === 'stok' 
                              ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' 
                              : 'bg-sky-50 text-sky-600 border border-sky-100'
                          }`}>
                            {p.jenis === 'stok' ? 'Sistem Stok' : 'Harian'}
                          </span>
                        )}
                      </td>

                      {/* Stock Col */}
                      <td className="py-3.5 text-center font-mono font-semibold text-sm">
                        {isEditing ? (
                          <input
                            type="number"
                            min="0"
                            className="bg-white border border-slate-300 rounded px-2 py-1 text-xs w-16 text-center font-mono"
                            value={editStok}
                            disabled={editJenis === 'harian'}
                            onChange={e => setEditStok(e.target.value)}
                          />
                        ) : (
                          p.jenis === 'stok' ? (
                            <span className={p.stok <= 5 ? 'text-amber-500 font-bold' : 'text-slate-700'}>
                              {p.stok} unit
                            </span>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )
                        )}
                      </td>

                      {/* Actions Col */}
                      <td className="py-3.5 text-right pr-2">
                        {isEditing ? (
                          <div className="flex gap-1 justify-end">
                            <button
                              onClick={() => saveEdit(p.id)}
                              className="p-1 px-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded text-xs h-7 w-7 flex items-center justify-center cursor-pointer"
                              title="Simpan"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="p-1 px-1.5 bg-slate-400 hover:bg-slate-500 text-white rounded text-xs h-7 w-7 flex items-center justify-center cursor-pointer"
                              title="Batal"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex gap-1.5 justify-end">
                            <button
                              onClick={() => startEdit(p)}
                              className="p-1.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-500 rounded transition-all cursor-pointer"
                              title="Kemaskini produk"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            {p.jenis === 'stok' && (
                              <button
                                onClick={() => quickAddStock(p)}
                                className="p-1 px-2 border border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 text-xs font-bold text-slate-600 rounded transition-all cursor-pointer"
                              >
                                + Stok
                              </button>
                            )}
                            <button
                              onClick={() => onDeleteProduct(p.id)}
                              className="p-1.5 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-400 rounded transition-all cursor-pointer"
                              title="Padam"
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
    </div>
  );
}
