/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Product, SalesRecord } from '../types';
import { formatCurrency } from '../utils';
import { ArrowUpRight, ShoppingBag, Package, AlertTriangle, TrendingUp } from 'lucide-react';
import { motion } from 'motion/react';

// ================== Component 1: GUDANG STOK KRITIK ==================
interface GudangStokKritikProps {
  products: Product[];
  onQuickRestock?: (productId: string, qty: number) => void;
}

export function GudangStokKritik({ products, onQuickRestock }: GudangStokKritikProps) {
  const lowStockProducts = products.filter(p => p.jenis === 'stok' && p.stok <= 5);

  return (
    <div className="space-y-4">
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-5 rounded-xl border border-slate-100 shadow-xs flex items-center justify-between"
      >
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Gudang Stok Kritik</p>
          <h4 className="text-2xl font-bold text-slate-800 mt-2 font-mono">
            {lowStockProducts.length === 0 ? '0' : `${lowStockProducts.length} Produk`}
          </h4>
          <p className="text-xs text-amber-500 mt-1">
            {lowStockProducts.length > 0 ? 'Perlu tambah segera' : 'Semua stok mencukupi'}
          </p>
        </div>
        <div className={`p-3 rounded-lg ${lowStockProducts.length > 0 ? 'bg-amber-50 text-amber-500' : 'bg-slate-50 text-slate-400'}`}>
          <AlertTriangle className="w-6 h-6" />
        </div>
      </motion.div>

      {/* Warnings Banner for Low Stock */}
      {lowStockProducts.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm"
        >
          <div className="flex flex-wrap items-center gap-2 font-medium">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Perhatian: Amaran stok rendah untuk produk berikut:</span>
            <div className="flex flex-wrap gap-1.5 ml-1">
              {lowStockProducts.slice(0, 3).map(p => (
                <button
                  key={p.id}
                  onClick={() => {
                    const promptValue = prompt(`Masukkan amaun penambahan unit stok untuk [${p.nama}]:`, '10');
                    if (promptValue === null) return;
                    
                    const intAdd = parseInt(promptValue);
                    if (isNaN(intAdd) || intAdd <= 0) {
                      alert('Sila isi jumlah tambahan stok yang sah (melebihi 0).');
                      return;
                    }

                    if (onQuickRestock) {
                      onQuickRestock(p.id, intAdd);
                    } else {
                      alert('Sila buka tab jualan/katalog untuk menambah stok produk ini.');
                    }
                  }}
                  className="bg-amber-100 hover:bg-amber-200 text-amber-950 px-2.5 py-0.5 rounded text-xs font-bold font-sans transition-all cursor-pointer flex items-center gap-1.5 border border-amber-200/60 hover:scale-105 active:scale-95"
                  title="Klik untuk tambah produk"
                >
                  <span className="underline decoration-amber-400 decoration-1 underline-offset-2">{p.nama} ({p.stok} baki)</span>
                  <span className="text-[10px] text-amber-700 bg-amber-50 px-1 rounded font-black font-sans shrink-0">+</span>
                </button>
              ))}
              {lowStockProducts.length > 3 && (
                <span className="text-xs text-amber-700 font-bold self-center">+{lowStockProducts.length - 3} lagi</span>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

// ================== Component 2: RINGKASAN GUDANG PRODUK ==================
interface RingkasanGudangProdukProps {
  products: Product[];
}

export function RingkasanGudangProduk({ products }: RingkasanGudangProdukProps) {
  const harianCount = products.filter(p => p.jenis === 'harian').length;
  const stokCount = products.filter(p => p.jenis === 'stok').length;
  const totalStokInHand = products.filter(p => p.jenis === 'stok').reduce((sum, p) => sum + p.stok, 0);

  return (
    <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-xs">
      <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">📦 Ringkasan Gudang Produk</h5>
      <div className="space-y-3">
        <div className="flex justify-between items-center py-2 border-b border-slate-100 text-xs">
          <span className="text-slate-500">Jumlah jenis produk</span>
          <span className="font-semibold text-slate-700">{products.length} Jenis</span>
        </div>
        <div className="flex justify-between items-center py-2 border-b border-slate-100 text-xs">
          <span className="text-slate-500">Kategori aliran Harian</span>
          <span className="font-semibold text-slate-705">{harianCount} produk</span>
        </div>
        <div className="flex justify-between items-center py-2 border-b border-slate-100 text-xs">
          <span className="text-slate-500">Kategori kawalan Stok</span>
          <span className="font-semibold text-slate-705">{stokCount} produk</span>
        </div>
        <div className="flex justify-between items-center py-2 text-xs">
          <span className="text-slate-500">Jumlah unit stok dalam tangan</span>
          <span className="font-semibold text-slate-700 font-mono">
            {totalStokInHand} pcs
          </span>
        </div>
      </div>
    </div>
  );
}

// ================== Component 3: KPI JUMLAH JUALAN ==================
interface KpiJumlahJualanProps {
  records: SalesRecord[];
}

export function KpiJumlahJualan({ records }: KpiJumlahJualanProps) {
  const totalRevenue = records.reduce((sum, r) => sum + r.jumlah, 0);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white p-5 rounded-xl border border-slate-100 shadow-xs flex items-center justify-between"
    >
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Jumlah Jualan</p>
        <h4 className="text-2xl font-bold text-slate-800 mt-2 font-mono">RM {formatCurrency(totalRevenue)}</h4>
        <p className="text-xs text-emerald-500 flex items-center gap-1 mt-1 font-medium">
          <ArrowUpRight className="w-3.5 h-3.5" />
          Aktif merekod
        </p>
      </div>
      <div className="bg-emerald-50 p-3 rounded-lg text-emerald-500">
        <TrendingUp className="w-6 h-6" />
      </div>
    </motion.div>
  );
}

// ================== Component 4: KPI UNIT TERJUAL ==================
interface KpiUnitTerjualProps {
  records: SalesRecord[];
}

export function KpiUnitTerjual({ records }: KpiUnitTerjualProps) {
  const totalUnits = records.reduce((sum, r) => sum + r.terjual, 0);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white p-5 rounded-xl border border-slate-100 shadow-xs flex items-center justify-between"
    >
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Unit Terjual</p>
        <h4 className="text-2xl font-bold text-slate-800 mt-2 font-mono">{totalUnits} pcs</h4>
        <p className="text-xs text-slate-400 mt-1">Daripada semua produk</p>
      </div>
      <div className="bg-sky-50 p-3 rounded-lg text-sky-500">
        <ShoppingBag className="w-6 h-6" />
      </div>
    </motion.div>
  );
}

// ================== Component 5: KPI PECAHAN JUALAN ==================
interface KpiPecahanJualanProps {
  records: SalesRecord[];
  products: Product[];
}

export function KpiPecahanJualan({ records, products }: KpiPecahanJualanProps) {
  const harianRecords = records.filter(r => {
    const prod = products.find(p => p.nama.toLowerCase() === r.produk.toLowerCase());
    return prod ? prod.jenis === 'harian' : true;
  });
  const stokRecords = records.filter(r => {
    const prod = products.find(p => p.nama.toLowerCase() === r.produk.toLowerCase());
    return prod ? prod.jenis === 'stok' : false;
  });

  const harianRevenue = harianRecords.reduce((sum, r) => sum + r.jumlah, 0);
  const stokRevenue = stokRecords.reduce((sum, r) => sum + r.jumlah, 0);

  // Product performance (Sales by product name)
  const productPerformance: { [key: string]: { qty: number; sales: number; type: string } } = {};
  records.forEach(r => {
    if (!productPerformance[r.produk]) {
      const prod = products.find(p => p.nama.toLowerCase() === r.produk.toLowerCase());
      productPerformance[r.produk] = { qty: 0, sales: 0, type: prod?.jenis || 'harian' };
    }
    productPerformance[r.produk].qty += r.terjual;
    productPerformance[r.produk].sales += r.jumlah;
  });

  const topProducts = Object.entries(productPerformance)
    .map(([nama, data]) => ({ nama, ...data }))
    .sort((a, b) => b.sales - a.sales)
    .slice(0, 5);

  const maxSales = Math.max(...topProducts.map(p => p.sales), 1);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">
      {/* Visual Pie/Card split info */}
      <div className="lg:col-span-4 bg-white p-5 rounded-xl border border-slate-100 shadow-xs flex flex-col justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pecahan Jualan</p>
          <div className="space-y-3.5 mt-4">
            <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-violet-500" />
                <span className="text-xs text-slate-500 font-bold uppercase">Harian:</span>
              </div>
              <span className="font-semibold font-mono text-xs text-slate-700">RM {formatCurrency(harianRevenue)}</span>
            </div>
            <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                <span className="text-xs text-slate-500 font-bold uppercase">Stok:</span>
              </div>
              <span className="font-semibold font-mono text-xs text-slate-700">RM {formatCurrency(stokRevenue)}</span>
            </div>
          </div>
        </div>
        <div className="text-[11px] text-slate-400 italic mt-3 pt-3 border-t border-slate-50">
          * Diperoleh dari jumlah jualan harian & baki kawalan stok.
        </div>
      </div>

      {/* Top Products Benchmark list */}
      <div className="lg:col-span-8 bg-white p-5 rounded-xl border border-slate-100 shadow-xs">
        <h5 className="text-xs font-bold text-slate-450 uppercase tracking-widest mb-4 flex items-center gap-2">
          📊 Prestasi Jualan Produk (Top 5 Terbaik)
        </h5>
        {topProducts.length === 0 ? (
          <div className="h-28 flex items-center justify-center text-slate-400 text-xs text-center">
            Rekod jualan pertama anda untuk mula melihat carta.
          </div>
        ) : (
          <div className="space-y-4">
            {topProducts.map((p, i) => (
              <div key={p.nama} className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-slate-700">{i + 1}. {p.nama} 
                    <span className="ml-2 px-1.5 py-0.2 bg-slate-100 text-slate-550 rounded text-[9px] font-bold font-sans">
                      {p.type === 'stok' ? 'STOK' : 'HARIAN'}
                    </span>
                  </span>
                  <span className="font-mono text-xs text-slate-500">
                    {p.qty} pcs • <strong className="text-slate-800 font-bold">RM {formatCurrency(p.sales)}</strong>
                  </span>
                </div>
                <div className="w-full bg-slate-50 h-2.5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(p.sales / maxSales) * 100}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className={`h-full rounded-full ${
                      p.type === 'stok' ? 'bg-indigo-500' : 'bg-sky-500'
                    }`}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Backward Compatibility Default Export
interface StatsDashboardProps {
  products: Product[];
  records: SalesRecord[];
}

export default function StatsDashboard({ products, records }: StatsDashboardProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <KpiJumlahJualan records={records} />
        <KpiUnitTerjual records={records} />
        <GudangStokKritik products={products} />
      </div>
      <KpiPecahanJualan records={records} products={products} />
      <RingkasanGudangProduk products={products} />
    </div>
  );
}
