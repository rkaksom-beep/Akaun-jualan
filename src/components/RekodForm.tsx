/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Product, SalesRecord } from '../types';
import { formatCurrency, formatTarikh } from '../utils';
import { Calendar, Tag, DollarSign, ListPlus, ShieldAlert, PackageOpen, Plus, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface RekodFormProps {
  products: Product[];
  records: SalesRecord[];
  onAddRecord: (record: Omit<SalesRecord, 'id'>) => void;
  onQuickRestock: (productId: string, additionalQty: number) => void;
  selectedDate: string;
  onDateChange: (date: string) => void;
}

export default function RekodForm({ products, records, onAddRecord, onQuickRestock, selectedDate, onDateChange }: RekodFormProps) {
  const [selectedProductIndex, setSelectedProductIndex] = useState<string>('');
  
  // Input fields
  const [dihantar, setDihantar] = useState<number>(0);
  const [tambahan, setTambahan] = useState<number>(0);
  const [terjual, setTerjual] = useState<number>(0);

  // Quick Inline Restocking State
  const [isRestocking, setIsRestocking] = useState<boolean>(false);
  const [restockAmount, setRestockAmount] = useState<string>('20');

  // Active product item
  const selectedProduct = selectedProductIndex !== '' ? products[parseInt(selectedProductIndex)] : null;

  // Semak jika produk yang sama sudah dimasukkan pada hari yang sama sewaktu paparan live
  const isDuplicate = selectedProduct
    ? records.some((r) => r.tarikh === selectedDate && r.produk.toLowerCase() === selectedProduct.nama.toLowerCase())
    : false;

  // Sync / Reset values when selected product changes
  useEffect(() => {
    setDihantar(0);
    setTambahan(0);
    setTerjual(0);
    setIsRestocking(false);
  }, [selectedProductIndex]);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate) {
      alert('Sila pilih tarikh jualan terlebih dahulu.');
      return;
    }
    if (!selectedProduct) {
      alert('Sila pilih produk jualan.');
      return;
    }

    // Semak jika produk yang sama sudah dimasukkan pada hari yang sama
    const isDuplicate = records.some(
      (r) => r.tarikh === selectedDate && r.produk.toLowerCase() === selectedProduct.nama.toLowerCase()
    );
    if (isDuplicate) {
      alert(`Rekod jualan bagi produk "${selectedProduct.nama}" pada tarikh ${formatTarikh(selectedDate)} sudah wujud. Sila kemas kini atau padam rekod sedia ada jika perlu.`);
      return;
    }

    if (isNaN(terjual) || terjual <= 0) {
      alert('Bilangan terjual tidak sah. Mesti sekurang-kurangnya 1 seunit.');
      return;
    }

    if (selectedProduct.jenis === 'stok') {
      if (terjual > selectedProduct.stok) {
        alert(`Stok semasa tidak mencukupi! Baki semasa dalam tangan hanyalah ${selectedProduct.stok} unit.`);
        return;
      }

      onAddRecord({
        tarikh: selectedDate,
        produk: selectedProduct.nama,
        dihantar: 0,
        tambahan: 0,
        terjual,
        harga: selectedProduct.harga,
        jumlah: terjual * selectedProduct.harga,
      });
    } else {
      // Daily item validation
      // If the user left dihantar and tambahan as 0, let's automatically set dihantar to match sold units so they don't get forced to fill it!
      const finalDihantar = (dihantar === 0 && tambahan === 0) ? terjual : dihantar;

      if ((finalDihantar + tambahan) < terjual) {
        alert(`Bilangan terjual (${terjual}) tidak boleh melebihi jumlah unit dihantar + unit tambahan (${finalDihantar + tambahan} unit).`);
        return;
      }

      onAddRecord({
        tarikh: selectedDate,
        produk: selectedProduct.nama,
        dihantar: finalDihantar,
        tambahan,
        terjual,
        harga: selectedProduct.harga,
        jumlah: terjual * selectedProduct.harga,
      });
    }

    // Reset inputs and product dropdown
    setSelectedProductIndex('');
    setTerjual(0);
    setDihantar(0);
    setTambahan(0);
  };


  return (
    <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-xs">
      <h3 className="text-sm font-bold text-slate-800 tracking-wide mb-4 uppercase flex items-center gap-2">
        <ListPlus className="w-4 h-4 text-emerald-500" />
        Daftar Catatan Jualan
      </h3>

      <form onSubmit={handleAdd} className="space-y-4">
        {/* Date and Product Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label id="lbl-tarikh-jualan" htmlFor="select-tarikh" className="block text-xs font-semibold text-slate-500 uppercase mb-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              Tarikh Jualan
            </label>
            <input
              id="select-tarikh"
              type="date"
              className="w-full bg-slate-50/50 border border-slate-200 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-indigo-500 font-mono text-slate-700 focus:ring-1 focus:ring-indigo-500 transition-all"
              value={selectedDate}
              onChange={e => onDateChange(e.target.value)}
            />
          </div>

          <div>
            <label id="lbl-pilih-produk" htmlFor="select-produk" className="block text-xs font-semibold text-slate-500 uppercase mb-1 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5" />
              Pilih Produk
            </label>
            <select
              id="select-produk"
              className="w-full bg-slate-50/50 border border-slate-200 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-indigo-500 text-slate-700 font-semibold focus:ring-1 focus:ring-indigo-500 transition-all"
              value={selectedProductIndex}
              onChange={e => setSelectedProductIndex(e.target.value)}
            >
              <option value="">-- Pilih Produk --</option>
              {products.map((p, idx) => (
                <option key={p.id} value={idx}>
                  {p.nama} ({p.jenis === 'stok' ? 'Stok' : 'Harian'})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Dynamic Fields */}
        <AnimatePresence mode="wait">
          {selectedProduct && (
            <motion.div
              key={selectedProduct.id}
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="bg-slate-50/80 p-4 rounded-xl space-y-4 border border-slate-100"
            >
              {/* Amaran Pertindihan Rekod Live */}
              {isDuplicate && (
                <div className="flex items-start gap-2.5 text-xs text-amber-800 bg-amber-50/70 p-3.5 rounded-lg border-2 border-dashed border-amber-300 shadow-3xs animate-pulse">
                  <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span className="font-extrabold uppercase block text-[10px] tracking-wider text-amber-950">
                      ⚠️ AMARAN: REKOD SUDAH WUJUD!
                    </span>
                    <p className="leading-relaxed">
                      Produk <strong>"{selectedProduct.nama}"</strong> sudah pun didaftarkan jualan pada tarikh <strong>{formatTarikh(selectedDate)}</strong>. Anda tidak boleh merekod produk yang sama pada hari sedia ada.
                    </p>
                    <p className="text-[10px] text-amber-700">
                      Sila semak, padam, atau sunting semula rekod jualan sedia ada dalam jadual laporan di bawah.
                    </p>
                  </div>
                </div>
              )}

              {/* Common automatic displays */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 bg-white p-3 rounded-lg border border-slate-100">
                  <div className="bg-emerald-50 text-emerald-600 p-2 rounded-md">
                    <DollarSign className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-400 font-semibold uppercase">Harga Seunit</span>
                    <span className="font-mono font-bold text-slate-700 text-sm">RM {formatCurrency(selectedProduct.harga)}</span>
                  </div>
                </div>

                {selectedProduct.jenis === 'stok' ? (
                  <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-slate-100 flex-wrap gap-2">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-md ${selectedProduct.stok <= 5 ? 'bg-amber-50 text-amber-600' : 'bg-indigo-50 text-indigo-600'}`}>
                        <PackageOpen className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="block text-[10px] text-slate-400 font-semibold uppercase">Baki Stok Semasa</span>
                        <span className={`font-mono font-bold text-sm ${selectedProduct.stok <= 5 ? 'text-amber-500' : 'text-slate-700'}`}>
                          {selectedProduct.stok} unit
                        </span>
                      </div>
                    </div>
                    {isRestocking ? (
                      <div className="flex items-center gap-1.5 animate-in fade-in duration-200">
                        <input
                          type="number"
                          min="1"
                          className="w-16 py-1 px-1.5 text-xs font-mono text-center border border-indigo-200 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                          value={restockAmount}
                          onClick={(e) => e.stopPropagation()}
                          onChange={e => setRestockAmount(e.target.value)}
                          placeholder="Kuantiti"
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            const qty = parseInt(restockAmount);
                            if (isNaN(qty) || qty <= 0) {
                              alert('Sila isi kuantiti tambahan yang sah.');
                              return;
                            }
                            onQuickRestock(selectedProduct.id, qty);
                            setIsRestocking(false);
                          }}
                          className="px-2 py-1 text-[10px] font-extrabold bg-emerald-600 hover:bg-emerald-700 text-white rounded cursor-pointer transition uppercase flex items-center gap-0.5"
                        >
                          <Check className="w-3 h-3" /> Rekod
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setIsRestocking(false);
                          }}
                          className="px-2 py-1 text-[10px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-500 rounded cursor-pointer transition flex items-center gap-0.5"
                        >
                          <X className="w-3 h-3" /> Batal
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        id="btn-quick-restock"
                        onClick={() => {
                          setRestockAmount('20');
                          setIsRestocking(true);
                        }}
                        className="text-[10px] font-extrabold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition px-2 py-1 rounded border border-indigo-100 uppercase tracking-wider flex items-center gap-0.5 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" /> Tambah Stok
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="bg-white p-3 rounded-lg border border-slate-100 flex items-center justify-center text-xs font-semibold text-slate-500">
                    🚚 Pengurusan Aliran Edaran Harian
                  </div>
                )}
              </div>

              {/* Input specifics */}
              {selectedProduct.jenis === 'harian' ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label id="lbl-dihantar" htmlFor="val-dihantar" className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                      Kuantiti Dihantar
                    </label>
                    <input
                      id="val-dihantar"
                      type="number"
                      min="0"
                      className="w-full bg-white border border-slate-200 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-indigo-500 font-mono text-slate-700"
                      value={dihantar === 0 ? '' : dihantar}
                      placeholder="0"
                      onChange={e => setDihantar(parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <label id="lbl-tambahan" htmlFor="val-tambahan" className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                      Unit Tambahan (Restock)
                    </label>
                    <input
                      id="val-tambahan"
                      type="number"
                      min="0"
                      className="w-full bg-white border border-slate-200 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-indigo-500 font-mono text-slate-700"
                      value={tambahan === 0 ? '' : tambahan}
                      placeholder="0"
                      onChange={e => setTambahan(parseInt(e.target.value) || 0)}
                    />
                  </div>
                </div>
              ) : null}

              {/* Quantities Sold Input */}
              <div className="pt-2 border-t border-slate-100/70">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="w-full sm:w-1/2">
                    <label id="lbl-terjual" htmlFor="val-terjual" className="block text-xs font-bold text-indigo-950 uppercase mb-1 flex items-center gap-1">
                      Kuantiti Berjaya Terjual
                    </label>
                    <input
                      id="val-terjual"
                      type="number"
                      min="0"
                      className="w-full bg-white border border-slate-300 rounded-lg py-2.5 px-3 text-sm font-semibold focus:outline-none focus:border-indigo-500 font-mono text-slate-800"
                      value={terjual === 0 ? '' : terjual}
                      placeholder="Masukkan Unit Terjual"
                      onChange={e => setTerjual(parseInt(e.target.value) || 0)}
                    />
                  </div>

                  <div className="text-right flex flex-col justify-end">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Jumlah Estimasi</span>
                    <span className="font-mono text-lg font-bold text-emerald-600 block">
                      RM {formatCurrency(terjual * selectedProduct.harga)}
                    </span>
                  </div>
                </div>

                {/* Warning limits */}
                {selectedProduct.jenis === 'stok' && terjual > selectedProduct.stok && (
                  <div className="mt-3 flex items-center gap-1.5 text-xs text-rose-500 font-semibold bg-rose-50 py-1.5 px-3 rounded-md border border-rose-100 transition-all">
                    <ShieldAlert className="w-4 h-4 text-rose-600" />
                    <span>Ralat: Had terjual melebihi baki stok ({selectedProduct.stok} unit)!</span>
                  </div>
                )}
                {selectedProduct.jenis === 'harian' && (dihantar > 0 || tambahan > 0) && terjual > (dihantar + tambahan) && (
                  <div className="mt-3 flex items-center gap-1.5 text-xs text-rose-500 font-semibold bg-rose-50 py-1.5 px-3 rounded-md border border-rose-100 transition-all">
                    <ShieldAlert className="w-4 h-4 text-rose-600" />
                    <span>Ralat: Had terjual melebihi unit Dibekal ({dihantar + tambahan} unit)!</span>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          type="submit"
          id="btn-simpan-rekod"
          disabled={!selectedProduct || terjual <= 0 || isDuplicate}
          className={`w-full py-2.5 px-4 font-bold rounded-lg text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-xs ${
            isDuplicate 
              ? 'bg-rose-600 hover:bg-rose-700 text-white' 
              : 'bg-emerald-600 hover:bg-emerald-700 text-white'
          }`}
        >
          {isDuplicate ? (
            <span className="flex items-center gap-1">⚠️ Terhalang: Rekod Sudah Wujud</span>
          ) : (
            <span>💾 Tambah Rekod Jualan</span>
          )}
        </button>
      </form>
    </div>
  );
}
