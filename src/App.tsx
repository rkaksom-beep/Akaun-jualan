/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Product, SalesRecord } from './types';
import { 
  GudangStokKritik, 
  RingkasanGudangProduk, 
  KpiJumlahJualan, 
  KpiUnitTerjual, 
  KpiPecahanJualan 
} from './components/StatsDashboard';
import { 
  TableHarian, 
  TableStok, 
  TapisanRekod 
} from './components/RekodLists';
import ProdukList from './components/ProdukList';
import RekodForm from './components/RekodForm';
import ResitModal from './components/ResitModal';
import AnalisaJualan from './components/AnalisaJualan';
import BackupManager, { saveBackupSnapshot } from './components/BackupManager';

import { 
  Building2, 
  Settings, 
  ClipboardList, 
  Download, 
  Upload, 
  CalendarDays, 
  Sparkles,
  HelpCircle,
  TrendingUp,
  PackageOpen,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getLocalDateString } from './utils';

// Default welcome records & products if blank initial state
const defaultProducts: Product[] = [];

const defaultRecords: SalesRecord[] = [];

export default function App() {
  // --- Persistent States ---
  const [syarikat, setSyarikat] = useState<string>('');
  const [syarikatLogo, setSyarikatLogo] = useState<string>('');
  const [products, setProducts] = useState<Product[]>([]);
  const [records, setRecords] = useState<SalesRecord[]>([]);

  // --- UI Active Controller States ---
  const [activeTab, setActiveTab] = useState<'records' | 'setup' | 'analisa'>('records');
  const [selectedDate, setSelectedDate] = useState<string>(getLocalDateString());
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProfilExpanded, setIsProfilExpanded] = useState<boolean>(false);
  const [confirmConfig, setConfirmConfig] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  const showConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirmConfig({ title, message, onConfirm });
  };

  // --- Filter states ---
  const todayStr = getLocalDateString();
  const getThirtyDaysAgoStr = () => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    const offset = d.getTimezoneOffset();
    const localD = new Date(d.getTime() - (offset * 60 * 1000));
    return localD.toISOString().split('T')[0];
  };
  const monthAgoStr = getThirtyDaysAgoStr();

  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState(monthAgoStr);
  const [dateTo, setDateTo] = useState(todayStr);

  const filteredRecords = records.filter(r => {
    const matchesSearch = r.produk.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDate = (!dateFrom || r.tarikh >= dateFrom) && (!dateTo || r.tarikh <= dateTo);
    return matchesSearch && matchesDate;
  });

  // Load from localStorage on Initial Startup
  useEffect(() => {
    const storedSyarikat = localStorage.getItem('syarikat_setup');
    const storedProducts = localStorage.getItem('products_setup');
    const storedRecords = localStorage.getItem('records_setup');
    const storedLogo = localStorage.getItem('syarikat_logo');

    const finalSyarikat = storedSyarikat !== null ? JSON.parse(storedSyarikat) : '';
    const finalProducts = storedProducts !== null ? JSON.parse(storedProducts) : defaultProducts;
    let finalRecords = storedRecords !== null ? JSON.parse(storedRecords) : defaultRecords;
    const finalLogo = storedLogo !== null ? JSON.parse(storedLogo) : '';

    // Saring pendua ID rekod jualan dari simpanan tempatan sekiranya ada (cth: rec_gzs7zojst)
    const seenIds = new Set<string>();
    finalRecords = finalRecords.filter((r: SalesRecord) => {
      if (!r || !r.id) return false;
      if (seenIds.has(r.id)) return false;
      seenIds.add(r.id);
      return true;
    });

    setSyarikat(finalSyarikat);
    setSyarikatLogo(finalLogo);
    setProducts(finalProducts);
    setRecords(finalRecords);

    // Salinan automatik kali pertama sesi pelayar dimulakan
    setTimeout(() => {
      saveBackupSnapshot('Sesi Pelayar Dimulakan', finalSyarikat, finalProducts, finalRecords);
    }, 400);
  }, []);

  // Sync back to localStorage when states evolve
  useEffect(() => {
    localStorage.setItem('syarikat_setup', JSON.stringify(syarikat));
  }, [syarikat]);

  useEffect(() => {
    localStorage.setItem('syarikat_logo', JSON.stringify(syarikatLogo));
  }, [syarikatLogo]);

  useEffect(() => {
    localStorage.setItem('products_setup', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('records_setup', JSON.stringify(records));
  }, [records]);

  // Helper trigger banner alerts
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // --- Handler: Logo Upload ---
  const handleLogoUpload = (file: File) => {
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      alert('Sila pilih fail imej sahaja (PNG, JPG, JPEG, WEBP).');
      return;
    }

    if (file.size > 1.2 * 1024 * 1024) {
      alert('Had fail logo adalah maksimum 1MB bagi melancarkan penyimpanan memori pelayar.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      if (base64) {
        setSyarikatLogo(base64);
        triggerToast('Logo syarikat berjaya dimuat naik & didaftarkan!');
      }
    };
    reader.readAsDataURL(file);
  };

  // --- Handlers: Product Catalog Configurations ---
  const handleAddProduct = (newProd: Omit<Product, 'id'>) => {
    const finalProduct: Product = {
      ...newProd,
      id: 'prod_' + Math.random().toString(36).substr(2, 9),
    };
    setProducts(prev => {
      const next = [...prev, finalProduct];
      saveBackupSnapshot(`Katalog: Tambah "${newProd.nama}"`, syarikat, next, records);
      return next;
    });
    triggerToast(`Produk [${newProd.nama}] didaftarkan successfully!`);
  };

  const handleEditProduct = (id: string, updatedFields: Partial<Product>) => {
    const prod = products.find(p => p.id === id);
    const label = prod ? prod.nama : 'Produk';
    setProducts(prev => {
      const next = prev.map(p => {
        if (p.id === id) {
          return { ...p, ...updatedFields };
        }
        return p;
      });
      saveBackupSnapshot(`Katalog: Kemaskini "${label}"`, syarikat, next, records);
      return next;
    });
    triggerToast('Metadata produk dikemaskini.');
  };

  const handleDeleteProduct = (id: string) => {
    const prod = products.find(p => p.id === id);
    if (!prod) return;

    // Check if the product has associated sales records
    const inUse = records.some(r => r.produk.toLowerCase() === prod.nama.toLowerCase());
    if (inUse) {
      showConfirm(
        'Padam Produk?',
        `Sistem mengesan baki transaksi lama untuk [${prod.nama}]. Memadam produk ini boleh menjejaskan paparan laporan resit. Teruskan padam?`,
        () => {
          setProducts(prev => {
            const next = prev.filter(p => p.id !== id);
            saveBackupSnapshot(`Katalog: Padam "${prod.nama}"`, syarikat, next, records);
            return next;
          });
          triggerToast(`Produk [${prod.nama}] dipadam.`);
        }
      );
    } else {
      showConfirm(
        'Padam Produk?',
        `Mahu padam produk [${prod.nama}] daripada katalog?`,
        () => {
          setProducts(prev => {
            const next = prev.filter(p => p.id !== id);
            saveBackupSnapshot(`Katalog: Padam "${prod.nama}"`, syarikat, next, records);
            return next;
          });
          triggerToast(`Produk [${prod.nama}] dipadam.`);
        }
      );
    }
  };

  // Quick Restock incrementer helper
  const handleQuickRestock = (productId: string, qty: number) => {
    const prod = products.find(p => p.id === productId);
    const label = prod ? prod.nama : 'Produk';
    setProducts(prev => {
      const next = prev.map(p => {
        if (p.id === productId) {
          return { ...p, stok: p.stok + qty };
        }
        return p;
      });
      saveBackupSnapshot(`Katalog: Restock "${label}" (+${qty})`, syarikat, next, records);
      return next;
    });
    triggerToast(`Restock kuantiti [${prod?.nama}] +${qty} unit berjaya!`);
  };

  // --- Handlers: Sales Records / Transactions ---
  const handleAddRecord = (newRec: Omit<SalesRecord, 'id'>) => {
    const recordWithId: SalesRecord = {
      ...newRec,
      id: 'rec_' + Math.random().toString(36).substr(2, 9),
    };

    // Deduct inventory if selected item is a Stock System Product
    const referentProd = products.find(p => p.nama.toLowerCase() === newRec.produk.toLowerCase());
    if (referentProd && referentProd.jenis === 'stok') {
      if (referentProd.stok < newRec.terjual) {
        alert('Ralat kritikal: Stok jualan melebihi baki dalam tangan!');
        return;
      }
      const nextProds = products.map(p => {
        if (p.id === referentProd.id) {
          const updatedTarikhStokMula = p.tarikhStokMula && newRec.tarikh < p.tarikhStokMula 
            ? newRec.tarikh 
            : p.tarikhStokMula;
          return { 
            ...p, 
            stok: p.stok - newRec.terjual,
            tarikhStokMula: updatedTarikhStokMula
          };
        }
        return p;
      });
      const nextRecs = [recordWithId, ...records];
      setProducts(nextProds);
      setRecords(nextRecs);
      saveBackupSnapshot(`Jualan: Tambah "${newRec.produk}"`, syarikat, nextProds, nextRecs);
    } else {
      const nextRecs = [recordWithId, ...records];
      setRecords(nextRecs);
      saveBackupSnapshot(`Jualan: Tambah "${newRec.produk}"`, syarikat, products, nextRecs);
    }

    triggerToast(`Rekod jualan [${newRec.produk}] ditambahkan.`);
  };

  const handleUpdateRecord = (id: string, updatedFields: Partial<SalesRecord>) => {
    const oldRec = records.find(r => r.id === id);
    if (!oldRec) return;

    const prod = products.find(p => p.nama.toLowerCase() === oldRec.produk.toLowerCase());

    if (prod && prod.jenis === 'stok' && updatedFields.terjual !== undefined) {
      // Re-adjust inventory: refund old sold count, deduct new sold count
      const refundPool = prod.stok + oldRec.terjual;
      if (updatedFields.terjual > refundPool) {
        alert('Stok baki tidak mencukupi untuk kemaskini ini.');
        return;
      }
      const nextProds = products.map(p => {
        if (p.id === prod.id) {
          return { ...p, stok: refundPool - (updatedFields.terjual || 0) };
        }
        return p;
      });
      const nextRecs = records.map(r => (r.id === id ? { ...r, ...updatedFields } : r));
      setProducts(nextProds);
      setRecords(nextRecs);
      saveBackupSnapshot(`Jualan: Kemaskini "${oldRec.produk}"`, syarikat, nextProds, nextRecs);
    } else {
      const nextRecs = records.map(r => (r.id === id ? { ...r, ...updatedFields } : r));
      setRecords(nextRecs);
      saveBackupSnapshot(`Jualan: Kemaskini "${oldRec.produk}"`, syarikat, products, nextRecs);
    }
    triggerToast('Rekod jualan dikemaskini.');
  };

  const handleDeleteRecord = (id: string) => {
    const recObj = records.find(r => r.id === id);
    if (!recObj) return;

    showConfirm(
      'Padam Catatan Jualan?',
      `Adakah anda pasti mahu memadam catatan jualan ini?`,
      () => {
        // Refund stock pool if stock series
        const prodRef = products.find(p => p.nama.toLowerCase() === recObj.produk.toLowerCase());
        if (prodRef && prodRef.jenis === 'stok') {
          const nextProds = products.map(p => {
            if (p.id === prodRef.id) {
              return { ...p, stok: p.stok + recObj.terjual };
            }
            return p;
          });
          const nextRecs = records.filter(r => r.id !== id);
          setProducts(nextProds);
          setRecords(nextRecs);
          saveBackupSnapshot(`Jualan: Padam "${recObj.produk}"`, syarikat, nextProds, nextRecs);
        } else {
          const nextRecs = records.filter(r => r.id !== id);
          setRecords(nextRecs);
          saveBackupSnapshot(`Jualan: Padam "${recObj.produk}"`, syarikat, products, nextRecs);
        }

        triggerToast('Satu rekod jualan dibatalkan.');
      }
    );
  };

  // --- Handlers: Data Backup & Recovery Restore ---
  const handleExportBackup = () => {
    try {
      const dbBlob = {
        syarikat,
        produk: products,
        jualan: records,
        version: '1.0',
        timestamp: new Date().toISOString()
      };
      const jsonStr = JSON.stringify(dbBlob, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `jualan_backup_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      triggerToast('Salinan sandaran backup berjaya dimuat turun!');
    } catch {
      alert('Gagal mengeksport fail backup.');
    }
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const rawContent = event.target?.result as string;
        const parsed = JSON.parse(rawContent);

        if (parsed.syarikat && parsed.produk && parsed.jualan) {
          showConfirm(
            'Pulihkan Laporan Backup?',
            'Amaran: Memulihkan backup ini akan memadamkan rekod sedia ada pada paparan peranti ini secara kekal. Teruskan?',
            () => {
              setSyarikat(parsed.syarikat);
              setProducts(parsed.produk);
              setRecords(parsed.jualan);
              
              saveBackupSnapshot(`Muat Naik Backup: ${file.name}`, parsed.syarikat, parsed.produk, parsed.jualan);

              // Persist directly
              localStorage.setItem('syarikat_setup', JSON.stringify(parsed.syarikat));
              localStorage.setItem('products_setup', JSON.stringify(parsed.produk));
              localStorage.setItem('records_setup', JSON.stringify(parsed.jualan));

              triggerToast('Data dan rekod dipulihkan sepenuhnya!');
            }
          );
        } else {
          alert('Format fail JSON tidak sah atau tidak sepadan.');
        }
      } catch {
        alert('Gagal membaca fail backup yang rosak.');
      }
    };
    reader.readAsText(file);
    // clear input trigger
    e.target.value = '';
  };

  const handleClearAllData = () => {
    showConfirm(
      '🧹 Pembersihan Data (Wipe Slate)?',
      'AMARAN KESELAMATAN: Adakah anda pasti mahu memadamkan semua data (katalog produk, catatan jualan, dan logo syarikat) di dalam memori pelayar ini secara kekal? Tindakan ini tidak boleh diundurkan!',
      () => {
        setProducts([]);
        setRecords([]);
        setSyarikatLogo('');
        setSyarikat('');
        localStorage.setItem('products_setup', JSON.stringify([]));
        localStorage.setItem('records_setup', JSON.stringify([]));
        localStorage.setItem('syarikat_logo', JSON.stringify(''));
        localStorage.setItem('syarikat_setup', JSON.stringify(''));
        triggerToast('Semua data dan catatan dalam aplikasi telah berjaya dibersihkan!');
      }
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col antialiased">
      {/* 1. Header Banner & Branding (no-print) */}
      <header className="bg-slate-900 text-white shadow-md relative overflow-hidden shrink-0 no-print">
        {/* Ambient aesthetic light */}
        <div className="absolute right-0 top-0 w-80 h-32 bg-indigo-500/10 blur-3xl pointer-events-none rounded-full" />
        
        <div className="max-w-7xl mx-auto px-4 py-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl overflow-hidden shadow-inner shrink-0 bg-slate-800 border border-slate-700 w-12 h-12 flex items-center justify-center">
              {syarikatLogo ? (
                <img src={syarikatLogo} alt="Logo Syarikat" className="w-full h-full object-cover" />
              ) : (
                <Building2 className="w-5 h-5 text-indigo-400" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  className="bg-transparent text-lg font-black text-white hover:bg-slate-800/40 focus:bg-slate-850 focus:ring-1 focus:ring-indigo-500 rounded py-0.5 px-2.5 transition-all outline-none font-sans tracking-tight min-w-[220px]"
                  value={syarikat}
                  onChange={e => setSyarikat(e.target.value)}
                  placeholder="Isi Nama Syarikat"
                  title="Klik untuk menukar nama syarikat anda"
                />
              </div>
              <p className="text-xs text-slate-400 pl-2.5 flex items-center gap-1.5 mt-0.5 font-medium flex-wrap">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>Sistem Setup & Penyata Rekod Jualan</span>
                <span className="inline-flex items-center gap-1 bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase ml-1.5 shadow-3xs shadow-emerald-500/10">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                  </span>
                  Auto Backup Aktif
                </span>
              </p>
            </div>
          </div>

          {/* Quick Stats & Navigation */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Backup & Restore controllers */}
            <div className="flex items-center bg-slate-800 rounded-lg p-1 border border-slate-700 text-xs">
              <button
                type="button"
                id="btn-backup-export"
                onClick={handleExportBackup}
                className="hover:bg-slate-700/60 text-slate-300 font-bold px-2 py-1.5 rounded transition flex items-center gap-1 cursor-pointer"
                title="Backup pangkalan data"
              >
                <Download className="w-3.5 h-3.5" />
                Eksport Backup
              </button>
              
              <div className="w-[1px] h-4 bg-slate-700 mx-1" />

              <label 
                htmlFor="upload-backup-file" 
                className="hover:bg-slate-700/60 text-slate-300 font-bold px-2 py-1.5 rounded transition flex items-center gap-1 cursor-pointer"
                title="Pulihkan data lama"
              >
                <Upload className="w-3.5 h-3.5" />
                Pulihkan Backup
              </label>
              <input
                id="upload-backup-file"
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleImportBackup}
              />
            </div>
          </div>
        </div>
      </header>

      {/* 2. Secondary Tab Switcher & Dynamic Toast Warnings (no-print) */}
      <div className="bg-white border-b border-slate-100 py-3 px-4 shadow-2xs shrink-0 no-print">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Navigation controller */}
          <div className="flex gap-2">
            <button
              type="button"
              id="tab-btn-setup"
              onClick={() => setActiveTab('setup')}
              className={`px-4 py-2 text-xs font-extrabold rounded-lg uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'setup'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              <Settings className="w-4 h-4" />
              Katalog & Setup
            </button>
            <button
              type="button"
              id="tab-btn-records"
              onClick={() => setActiveTab('records')}
              className={`px-4 py-2 text-xs font-extrabold rounded-lg uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'records'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              <ClipboardList className="w-4 h-4" />
              Catatan & Jualan
            </button>
            <button
              type="button"
              id="tab-btn-analisa"
              onClick={() => setActiveTab('analisa')}
              className={`px-4 py-2 text-xs font-extrabold rounded-lg uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'analisa'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              Analisa Jualan
            </button>
          </div>

          {/* Quick Date Display */}
          <div className="text-xs text-slate-400 font-bold font-mono">
            {new Date().toLocaleDateString('ms-MY', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
          </div>
        </div>
      </div>

      {/* Toast Alert Banner */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 right-4 z-50 bg-slate-900 border border-slate-800 text-indigo-400 py-2.5 px-4 rounded-xl shadow-xl flex items-center gap-2 text-xs font-bold font-mono"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. Main Body View Controller */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        
        {activeTab === 'records' && (
          /* ================== TAB 1: SALES RECORDS ================== */
          <div className="flex flex-col gap-6">
            
            {/* 1. DAFTAR CATATAN JUALAN (Top-Most) */}
            <div className="no-print">
              <RekodForm 
                products={products}
                records={records}
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
                onAddRecord={handleAddRecord}
                onQuickRestock={handleQuickRestock}
              />
            </div>

            {/* 2. TAPISAN REKOD JUALAN (Kini diletakkan di bawah form daftar catatan) */}
            <div className="no-print">
              <TapisanRekod 
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                dateFrom={dateFrom}
                setDateFrom={setDateFrom}
                dateTo={dateTo}
                setDateTo={setDateTo}
                products={products}
              />
            </div>

            {/* 3. REKOD JUALAN ALIRAN HARIAN */}
            <div className="no-print">
              <TableHarian 
                records={filteredRecords}
                products={products}
                onDeleteRecord={handleDeleteRecord}
                onUpdateRecord={handleUpdateRecord}
              />
            </div>

            {/* 4. REKOD JUALAN SISTEM STOK */}
            <div className="no-print">
              <TableStok 
                records={filteredRecords}
                products={products}
                onDeleteRecord={handleDeleteRecord}
                onUpdateRecord={handleUpdateRecord}
              />
            </div>

            {/* 5. PENJANA RESIT & PENYATA JUALAN */}
            <div>
              <ResitModal 
                records={records}
                products={products}
                syarikat={syarikat}
                syarikatLogo={syarikatLogo}
              />
            </div>

            {/* 6. GUDANG STOK KRITIK */}
            <div className="no-print">
              <GudangStokKritik products={products} onQuickRestock={handleQuickRestock} />
            </div>

            {/* 7. RINGKASAN GUDANG PRODUK */}
            <div className="no-print">
              <RingkasanGudangProduk products={products} />
            </div>
            
          </div>
        )}

        {activeTab === 'setup' && (
          /* ================== TAB 2: CATALOG WORKSPACE ================== */
          <div className="space-y-6 no-print">
            
            {/* 1. KAD PROFIL & LOGO SYARIKAT */}
            <div className="bg-white border border-slate-100 rounded-xl shadow-xs overflow-hidden transition-all duration-300">
              {/* Clickable Header for Collapsing */}
              <button
                type="button"
                onClick={() => setIsProfilExpanded(!isProfilExpanded)}
                className="w-full flex items-center justify-between p-6 hover:bg-slate-50/50 transition-all text-left border-none focus:outline-none focus:ring-0 cursor-pointer"
              >
                <div className="flex-1 min-w-0 pr-4">
                  <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                    <h2 className="text-sm font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                      <span>🏢 Profil & Identiti Perniagaan</span>
                    </h2>
                    {!isProfilExpanded && (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="inline-block h-4 w-[1px] bg-slate-200 hidden sm:inline" />
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded truncate max-w-[200px]">
                          {syarikat || 'Tiada Nama'}
                        </span>
                        <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                          syarikatLogo 
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-500/10' 
                            : 'bg-slate-100 text-slate-400'
                        }`}>
                          {syarikatLogo ? 'Logo Khas Aktif' : 'Logo Lalai'}
                        </span>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5 leading-snug">
                    Klik untuk {isProfilExpanded ? 'kemaskan' : 'buka & ubah'} nama rasmi perniagaan dan muat naik logo custom syarikat.
                  </p>
                </div>
                <div className="shrink-0 p-1.5 bg-slate-100 text-slate-500 rounded-lg hover:bg-slate-200 hover:text-indigo-600 transition-all">
                  {isProfilExpanded ? (
                    <ChevronUp className="w-4 h-4 text-indigo-500 font-bold" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-500" />
                  )}
                </div>
              </button>

              {/* Collapsible Content Wrapper with motion for smooth transition */}
              <AnimatePresence initial={false}>
                {isProfilExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: 'easeInOut' }}
                    className="overflow-hidden border-t border-slate-100"
                  >
                    <div className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                        {/* Ruang Input & Muat Naik */}
                        <div className="md:col-span-7 space-y-5">
                          {/* Nama Syarikat Input */}
                          <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                              Nama Rasmi Syarikat / Perniagaan:
                            </label>
                            <input
                              type="text"
                              className="w-full bg-slate-50 border border-slate-200 py-2.5 px-3.5 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 placeholder-slate-400"
                              value={syarikat}
                              onChange={(e) => setSyarikat(e.target.value)}
                              placeholder="Masukkan nama syarikat anda"
                            />
                            <p className="text-[10px] text-slate-400">Nama syarikat ini akan diselaraskan secara langsung ke bahagian kepala resit laporan jualan anda.</p>
                          </div>

                          {/* Logo Syarikat Drag & Drop */}
                          <div className="space-y-2">
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                              Logo Syarikat / Kedai:
                            </label>
                            
                            {/* Drag and Drop Zone */}
                            <div
                              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                              onDragLeave={() => setIsDragOver(false)}
                              onDrop={(e) => {
                                e.preventDefault();
                                setIsDragOver(false);
                                const files = e.dataTransfer.files;
                                if (files && files.length > 0) {
                                  handleLogoUpload(files[0]);
                                }
                              }}
                              className={`border-2 border-dashed rounded-xl p-6 transition-all text-center flex flex-col items-center justify-center gap-2 relative ${
                                isDragOver 
                                  ? 'border-indigo-500 bg-indigo-50/50 text-indigo-700' 
                                  : 'border-slate-200 hover:border-slate-350 bg-slate-50/50 text-slate-500'
                              }`}
                            >
                              <input
                                type="file"
                                accept="image/*"
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                onChange={(e) => {
                                  const files = e.target.files;
                                  if (files && files.length > 0) {
                                    handleLogoUpload(files[0]);
                                  }
                                }}
                                title="Klik atau heret logo di sini"
                              />
                              
                              <div className="p-2.5 bg-white border border-slate-100 rounded-full shadow-3xs text-slate-500">
                                <Upload className="w-5 h-5 text-indigo-500" />
                              </div>
                              
                              <div className="space-y-1">
                                <p className="text-xs font-bold text-slate-700">
                                  {isDragOver ? 'Lepaskan imej di sini!' : 'Sila heret logo ke sini atau klik untuk pilih'}
                                </p>
                                <p className="text-[10px] text-slate-400">
                                  PNG, JPG, JPEG, atau WEBP (Saiz disyorkan maks. 1MB)
                                </p>
                              </div>
                            </div>

                            {syarikatLogo && (
                              <div className="flex items-center justify-between p-2 px-3 bg-rose-50 border border-rose-100/60 rounded-lg text-xs mt-2">
                                <span className="text-slate-505 font-semibold text-slate-650">Logo custom sedang aktif</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSyarikatLogo('');
                                    triggerToast('Logo custom dipadam. Kembali menggunakan reka bentuk lalai.');
                                  }}
                                  className="text-[10px] font-bold text-rose-600 hover:underline cursor-pointer"
                                >
                                  🗑️ Padam Logo
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Live Digital Brand Preview Badge Card */}
                        <div className="md:col-span-5 flex flex-col justify-center">
                          <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 shadow-md relative overflow-hidden flex flex-col items-center text-center space-y-4">
                            <div className="absolute right-0 top-0 w-32 h-32 bg-indigo-500/10 blur-2xl pointer-events-none rounded-full" />
                            
                            <span className="text-[9px] font-extrabold uppercase tracking-widest text-indigo-400 bg-indigo-500/15 py-0.5 px-2.5 rounded-full border border-indigo-500/10">
                              Pratonton Kad Identiti
                            </span>

                            <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-800 border border-slate-700 flex items-center justify-center shadow-md shrink-0">
                              {syarikatLogo ? (
                                <img src={syarikatLogo} alt="Logo" className="w-full h-full object-cover" />
                              ) : (
                                <Building2 className="w-7 h-7 text-indigo-400" />
                              )}
                            </div>

                            <div className="space-y-1 w-full px-2">
                              <h4 className="text-xs font-black uppercase text-white tracking-wide truncate max-w-full">
                                {syarikat || 'TIADA NAMA SYARIKAT'}
                              </h4>
                              <p className="text-[10px] text-slate-400 font-mono">
                                Sistem Kawalan Jualan & Inventori Pintar
                              </p>
                            </div>

                            <div className="w-full h-[1px] bg-slate-800" />

                            <div className="flex items-center gap-1.5 text-[9.5px] text-slate-500 uppercase font-bold tracking-wider">
                              <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-pulse" />
                              Status: Branding Sedia Digunakan
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* 2. DAFTAR KATALOG PRODUK */}
            <div className="bg-white border border-slate-100 rounded-xl p-6 shadow-xs">
              <div className="border-b border-slate-100 pb-4 mb-6">
                <h2 className="text-base font-bold text-slate-800">⚙️ Pengurusan Katalog Syarikat</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Daftarkan senarai menu makanan sejuk beku, barangan runcit kering, atau tempahan masakan harian mengikut kategori perniagaan anda.
                </p>
              </div>

              <ProdukList 
                products={products}
                onAddProduct={handleAddProduct}
                onEditProduct={handleEditProduct}
                onDeleteProduct={handleDeleteProduct}
              />
            </div>

            {/* Combined Data and Backup Management Panel with Grouped Dropdown */}
            <BackupManager 
              syarikat={syarikat}
              products={products}
              records={records}
              onRestore={(restoredSyarikat, restoredProducts, restoredRecords) => {
                setSyarikat(restoredSyarikat);
                setProducts(restoredProducts);
                setRecords(restoredRecords);
                
                // Overwrite browser storage
                localStorage.setItem('syarikat_setup', JSON.stringify(restoredSyarikat));
                localStorage.setItem('products_setup', JSON.stringify(restoredProducts));
                localStorage.setItem('records_setup', JSON.stringify(restoredRecords));
              }}
              onClearAll={handleClearAllData}
              triggerToast={triggerToast}
            />
          </div>
        )}

        {activeTab === 'analisa' && (
          /* ================== TAB 3: ANALISA JUALAN ================== */
          <div className="no-print col-span-12">
            <AnalisaJualan 
              records={records}
              products={products}
            />
          </div>
        )}
      </main>

      {/* 4. Footer credits & printing styles */}
      <footer className="bg-white border-t border-slate-100 py-6 text-center text-slate-400 text-xs no-print shrink-0 mt-8">
        <p className="font-semibold text-slate-500">© 2026 {syarikat || 'Syarikat Maju Jualan'}</p>
        <p className="text-[10px] text-slate-400 mt-1">Menggunakan Sistem Aliran Harian & Kawalan Stok Pintar.</p>
      </footer>

      {/* 5. Reusable animated Confirmation Dialog Modal */}
      <AnimatePresence>
        {confirmConfig && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs no-print">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-md w-full border border-slate-100 shadow-2xl space-y-4"
            >
              <div className="flex items-start gap-3">
                <div className="p-3 bg-amber-50 text-amber-600 rounded-full shrink-0">
                  <span className="text-xl">⚠️</span>
                </div>
                <div className="text-left">
                  <h3 className="text-base font-extrabold text-slate-800 leading-tight">
                    {confirmConfig.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed whitespace-pre-wrap">
                    {confirmConfig.message}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setConfirmConfig(null)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs uppercase tracking-wider rounded-lg transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    confirmConfig.onConfirm();
                    setConfirmConfig(null);
                  }}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs uppercase tracking-wider rounded-lg transition-all cursor-pointer shadow-sm shadow-rose-600/10"
                >
                  Pasti
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
