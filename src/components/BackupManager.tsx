/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Product, SalesRecord } from '../types';
import { 
  Database, 
  RotateCcw, 
  Download, 
  Trash2, 
  ShieldCheck, 
  History, 
  Clock, 
  Plus, 
  AlertTriangle,
  Play,
  FilePlus,
  RefreshCw,
  FolderSync,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface AutoBackup {
  id: string;
  timestamp: string;
  trigger: string;
  syarikat: string;
  productsCount: number;
  recordsCount: number;
  produk: Product[];
  jualan: SalesRecord[];
}

/**
 * Global helper to save an automatic/manual backup state.
 * Truncates and preserves only the latest 10 versions chronologically.
 */
export function saveBackupSnapshot(
  trigger: string,
  syarikat: string,
  products: Product[],
  records: SalesRecord[]
) {
  try {
    const rawBackups = localStorage.getItem('auto_backups_history');
    const backups: AutoBackup[] = rawBackups ? JSON.parse(rawBackups) : [];
    
    const newBackup: AutoBackup = {
      id: 'bk_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      timestamp: new Date().toISOString(),
      trigger,
      syarikat: syarikat || '',
      productsCount: products.length,
      recordsCount: records.length,
      produk: products,
      jualan: records
    };

    // Filter duplicates of identical content to avoid filling localstorage needlessly
    const isExactDuplicate = backups.length > 0 && 
      backups[0].syarikat === newBackup.syarikat &&
      backups[0].productsCount === newBackup.productsCount &&
      backups[0].recordsCount === newBackup.recordsCount &&
      JSON.stringify(backups[0].produk) === JSON.stringify(newBackup.produk) &&
      JSON.stringify(backups[0].jualan) === JSON.stringify(newBackup.jualan);

    if (isExactDuplicate && !trigger.includes('Manual') && !trigger.includes('Mula')) {
      return;
    }

    const updatedBackups = [newBackup, ...backups].slice(0, 10);
    localStorage.setItem('auto_backups_history', JSON.stringify(updatedBackups));
    
    window.dispatchEvent(new Event('autobackup-updated'));
  } catch (error) {
    console.error('Ralat semasa menjana auto-backup:', error);
  }
}

interface BackupManagerProps {
  syarikat: string;
  products: Product[];
  records: SalesRecord[];
  onRestore: (syarikat: string, products: Product[], records: SalesRecord[]) => void;
  onClearAll: () => void;
  triggerToast: (msg: string) => void;
}

export default function BackupManager({ 
  syarikat, 
  products, 
  records, 
  onRestore, 
  onClearAll, 
  triggerToast 
}: BackupManagerProps) {
  const [backupsList, setBackupsList] = useState<AutoBackup[]>([]);
  const [manualName, setManualName] = useState<string>('');
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);
  const [activeAction, setActiveAction] = useState<'manual' | 'history' | 'clear'>('history');
  
  const [confirmConfig, setConfirmConfig] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  const showConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirmConfig({ title, message, onConfirm });
  };

  const loadBackups = () => {
    try {
      const raw = localStorage.getItem('auto_backups_history');
      if (raw) {
        setBackupsList(JSON.parse(raw));
      } else {
        setBackupsList([]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadBackups();
    window.addEventListener('autobackup-updated', loadBackups);
    return () => {
      window.removeEventListener('autobackup-updated', loadBackups);
    };
  }, []);

  const formatTimeAgo = (isoString: string) => {
    const backupDate = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - backupDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Baru sahaja';
    if (diffMins < 60) return `${diffMins} minit yang lalu`;
    
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs} jam yang lalu`;

    return backupDate.toLocaleString('ms-MY', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  /**
   * Action: Triggers copy state, writes to DB snapshot index,
   * then programmatically triggers direct automatic file download (.json)
   * to the physical user storage.
   */
  const handlePerformManualBackup = (e: React.FormEvent) => {
    e.preventDefault();
    const label = manualName.trim() ? manualName.trim() : 'Salinan Manual';
    const description = `Salinan Manual: ${label}`;

    // 1. Simpan salinan ke dalam sejarah browser pelayar (Auto Backups History local storage)
    saveBackupSnapshot(description, syarikat, products, records);

    // 2. Muat turun fail data fizikal ke peranti komputer pengguna secara automatik
    try {
      const dbBlob = {
        syarikat,
        produk: products,
        jualan: records,
        version: '1.0',
        timestamp: new Date().toISOString(),
        trigger: description
      };
      const jsonStr = JSON.stringify(dbBlob, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const cleanLabel = label.toLowerCase().replace(/[^a-z0-9]/g, '_').substring(0, 20);
      a.download = `salinan_manual_${cleanLabel}_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setManualName('');
      triggerToast('Salinan manual berjaya disimpan & fail auto download bermula!');
    } catch (err) {
      console.error(err);
      triggerToast('Salinan manual direkodkan tetapi muat turun fail menghadapi masalah.');
    }
  };

  const handleRestoreBackup = (b: AutoBackup) => {
    showConfirm(
      'Pulihkan Data?',
      `Adakah anda pasti mahu memulihkan rekod perniagaan kepada snapshot berikut?\n\n` +
      `📌 Masa: ${new Date(b.timestamp).toLocaleString('ms-MY')}\n` +
      `⚡ Sebab: ${b.trigger}\n` +
      `🏢 Nama Syarikat: ${b.syarikat}\n` +
      `📦 Produk: ${b.productsCount} item\n` +
      `📝 Transaksi: ${b.recordsCount} rekod\n\n` +
      `* AMARAN: Semua data semasa pada skrin akan digantikan sepenuhnya.`,
      () => {
        onRestore(b.syarikat, b.produk, b.jualan);
        triggerToast('Pernyataan rekod berjaya dipulihkan sepenuhnya!');
      }
    );
  };

  const handleDeleteSnapshot = (id: string, triggerName: string) => {
    showConfirm(
      'Padam Sandaran?',
      `Adakah anda pasti mahu memadam rekod auto-backup "${triggerName}" daripada sejarah pelayar?`,
      () => {
        const filtered = backupsList.filter(b => b.id !== id);
        localStorage.setItem('auto_backups_history', JSON.stringify(filtered));
        loadBackups();
        triggerToast('Rekod sandaran dipadam.');
      }
    );
  };

  const handleClearAllSnapshots = () => {
    showConfirm(
      'Kosongkan Sejarah Sandaran?',
      'Adakah anda pasti mahu memadam semua sejarah auto-backup di dalam memori pelayar ini secara kekal? Tindakan ini tidak boleh diundurkan!',
      () => {
        localStorage.removeItem('auto_backups_history');
        loadBackups();
        triggerToast('Semua sejarah auto-backup telah dikosongkan.');
      }
    );
  };

  const handleDownloadSnapshot = (b: AutoBackup) => {
    try {
      const dbBlob = {
        syarikat: b.syarikat,
        produk: b.produk,
        jualan: b.jualan,
        version: '1.0',
        timestamp: b.timestamp,
        trigger: b.trigger
      };
      const jsonStr = JSON.stringify(dbBlob, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const cleanTrigger = b.trigger.toLowerCase().replace(/[^a-z0-9]/g, '_').substring(0, 20);
      a.download = `auto_backup_${cleanTrigger}_${b.timestamp.slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      alert('Gagal memuat turun data backup tersebut.');
    }
  };

  const getTriggerIcon = (trigger: string) => {
    const t = trigger.toLowerCase();
    if (t.includes('tambah') || t.includes('daftar')) {
      return <FilePlus className="w-4 h-4 text-emerald-600" />;
    }
    if (t.includes('padam') || t.includes('batal')) {
      return <Trash2 className="w-4 h-4 text-rose-600" />;
    }
    if (t.includes('mula') || t.includes('startup') || t.includes('sesi')) {
      return <Play className="w-4 h-4 text-sky-600" />;
    }
    if (t.includes('manual')) {
      return <Database className="w-4 h-4 text-amber-600" />;
    }
    if (t.includes('restock') || t.includes('stok')) {
      return <RefreshCw className="w-4 h-4 text-indigo-600" />;
    }
    return <FolderSync className="w-4 h-4 text-violet-600" />;
  };

  return (
    <div className="bg-white border border-slate-100 rounded-xl p-6 shadow-xs space-y-6">
      
      {/* Container Header */}
      <div className="border-b border-slate-100 pb-4">
        <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
          <span>⚙️ Kawalan & Pengurusan Data Pintar</span>
        </h3>
        <p className="text-xs text-slate-400 mt-0.5">
          Kelompok utiliti bagi membuat salinan manual, menguruskan sejarah sandaran pintar, dan melakukan pembersihan data.
        </p>
      </div>

      {/* DROPDOWN SELECTOR BLOCK */}
      <div className="relative">
        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1.5 text-left">
          Pilih Tindakan Utiliti Data:
        </label>
        
        <div className="relative">
          <button
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="w-full flex items-center justify-between bg-slate-50 border border-slate-200 hover:border-slate-350 hover:bg-slate-100/50 rounded-lg px-4 py-3 text-xs font-bold text-slate-705 transition-all cursor-pointer shadow-3xs"
          >
            <span className="flex items-center gap-2">
              {activeAction === 'history' && (
                <>
                  <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 animate-pulse" />
                  <span className="text-slate-805 font-extrabold">1. Sistem Auto Backup Pintar</span>
                </>
              )}
              {activeAction === 'manual' && (
                <>
                  <Database className="w-4 h-4 text-amber-500 shrink-0" />
                  <span className="text-slate-800 font-extrabold">2. Salinan Manual</span>
                </>
              )}
              {activeAction === 'clear' && (
                <>
                  <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                  <span className="text-rose-700 font-extrabold">3. Pembersihan Data (Wipe Slate)</span>
                </>
              )}
            </span>
            {dropdownOpen ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {/* Floating Dropdown List Overlay Component */}
          {dropdownOpen && (
            <div className="absolute left-0 mt-1.5 w-full bg-white border border-slate-150 rounded-xl shadow-xl z-50 divide-y divide-slate-100 overflow-hidden">
              <button
                type="button"
                onClick={() => {
                  setActiveAction('history');
                  setDropdownOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 transition cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                <div className="space-y-0.5">
                  <p className="text-xs font-black text-slate-850">1. Sistem Auto Backup Pintar</p>
                  <p className="text-[10px] text-slate-400 font-semibold font-sans">Lihat, urus, dan pulihkan baki 10 sejarah sandaran jualan terdahulu.</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveAction('manual');
                  setDropdownOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 transition cursor-pointer"
              >
                <Database className="w-4 h-4 text-amber-500 shrink-0" />
                <div className="space-y-0.5">
                  <p className="text-xs font-black text-slate-850">2. Salinan Manual</p>
                  <p className="text-[10px] text-slate-400 font-semibold font-sans font-sans">Jana sandaran terkini secara manual & fail dimuat turun terus ke komputer.</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveAction('clear');
                  setDropdownOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-55 transition cursor-pointer"
              >
                <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                <div className="space-y-0.5">
                  <p className="text-xs font-black text-rose-700">3. Pembersihan Data (Wipe Slate)</p>
                  <p className="text-[10px] text-slate-400 font-semibold font-sans text-left">Padamkan semua menu katalog produk, rekod harian & logo secara kekal.</p>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* RENDER DYNAMIC ACTIVE ACTION CONTAINER */}
      <div className="border border-slate-100 rounded-xl p-4 bg-slate-50/40">
        
        {activeAction === 'manual' && (
          <div className="space-y-4 text-left">
            <div className="space-y-1">
              <h4 className="text-xs font-black uppercase text-slate-800 tracking-tight flex items-center gap-1.5">
                <Database className="w-4 h-4 text-amber-500" />
                <span>Salinan Manual</span>
              </h4>
              <p className="text-[11px] text-slate-400 font-semibold leading-relaxed">
                Menjana salinan manual bagi rekod catalog, jumlah stok, dan jualan anda. Rekod ini akan disimpan terus ke Sejarah Sandaran Pelayar anda, serta memulakan **auto download** fail sandaran `.json` ke cakera keras peranti anda secara serentak.
              </p>
            </div>

            <form onSubmit={handlePerformManualBackup} className="space-y-3 pt-1">
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  className="flex-1 bg-white border border-slate-200 py-2.5 px-3.5 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 placeholder-slate-400"
                  placeholder="Tulis label salinan (Contoh: Sebelum tukar harga, Audit Mingguan)"
                  value={manualName}
                  onChange={e => setManualName(e.target.value)}
                />
                <button
                  type="submit"
                  className="py-2.5 px-4.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm shadow-indigo-600/10 shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  Simpan & Muat Turun
                </button>
              </div>
            </form>
          </div>
        )}

        {activeAction === 'history' && (
          <div className="space-y-4 text-left">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="space-y-0.5">
                <h4 className="text-xs font-black uppercase text-slate-800 tracking-tight flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-500 animate-pulse" />
                  <span>Sistem Auto Backup Pintar</span>
                </h4>
                <p className="text-[10.5px] text-slate-450 font-medium">
                  Sejarah sandaran yang direkodkan secara automatik setiap kali perubahan dikesan.
                </p>
              </div>
              
              {backupsList.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearAllSnapshots}
                  className="text-[10px] font-bold text-rose-600 hover:bg-rose-50 border border-rose-100 px-2.5 py-1 rounded-lg transition-all shrink-0 cursor-pointer"
                >
                  Kosongkan Semua Sejarah
                </button>
              )}
            </div>

            {/* List records */}
            {backupsList.length === 0 ? (
              <div className="bg-slate-50 p-6 rounded-lg text-center border-2 border-dashed border-slate-200">
                <Database className="w-7 h-7 text-slate-350 mx-auto mb-1 animate-bounce" />
                <p className="text-xs text-slate-600 font-bold">Belum ada rekod salinan automatik.</p>
                <p className="text-[10px] text-slate-400 mt-1">Sistem akan automatik menjana sandaran baru setiap kali anda mengemas kini data jualan.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-[300px] overflow-y-auto pr-1">
                <AnimatePresence initial={false}>
                  {backupsList.map((b, idx) => (
                    <motion.div
                      key={b.id}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.12 }}
                      className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 text-xs"
                    >
                      {/* Left Block info */}
                      <div className="flex gap-2.5 items-start">
                        <div className="p-1.5 bg-slate-100 rounded-md mt-0.5 shrink-0 flex items-center justify-center">
                          {getTriggerIcon(b.trigger)}
                        </div>
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <strong className="font-bold text-slate-800 leading-tight">
                              {b.trigger}
                            </strong>
                            {idx === 0 && (
                              <span className="bg-emerald-100 text-emerald-800 text-[8px] font-extrabold uppercase px-1 py-0.2 rounded tracking-wider">
                                Terkini
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium flex-wrap">
                            <span className="flex items-center gap-1 font-mono text-[9px] font-bold text-slate-500">
                              <Clock className="w-3 h-3 text-slate-350" />
                              {formatTimeAgo(b.timestamp)}
                            </span>
                            <span>•</span>
                            <span className="font-semibold text-slate-500">{b.syarikat || 'Identiti Tanpa Nama'}</span>
                            <span>•</span>
                            <span className="bg-slate-100 border border-slate-150 text-slate-600 px-1 py-0.2 rounded text-[9px] font-bold font-mono">
                              {b.productsCount} Prd | {b.recordsCount} Jln
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right Block Actions */}
                      <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
                        <button
                          type="button"
                          onClick={() => handleRestoreBackup(b)}
                          className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-md transition-all flex items-center gap-1 cursor-pointer text-[11px]"
                          title="Gunakan sandaran ini sekarang"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Guna Data</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDownloadSnapshot(b)}
                          className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition cursor-pointer"
                          title="Muat turun fail backup .json"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteSnapshot(b.id, b.trigger)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition cursor-pointer"
                          title="Padam rekod ini"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        )}

        {activeAction === 'clear' && (
          <div className="bg-rose-50/50 border border-rose-100/60 rounded-xl p-4.5 space-y-4 text-left">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-rose-100 text-rose-600 rounded-lg shrink-0 mt-0.5">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-black uppercase text-rose-950">
                  Pembersihan Data (Wipe Slate)
                </h4>
                <p className="text-[10.5px] text-rose-700 font-extrabold leading-normal uppercase">
                  Amaran Bahaya: Semua maklumat katalog, stok terkini & data urus niaga jualan akan dipadam!
                </p>
                <p className="text-[11px] text-slate-500 leading-relaxed font-sans">
                  Sila pastikan anda telah mengeksport backup atau membuat sandaran fizikal luar jika perlu. Tindakan mendelete pangkalan data utama ini tidak boleh dibatalkan.
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={onClearAll}
                className="py-2 px-4 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs uppercase tracking-wider rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs shrink-0"
              >
                🗑️ Padam Semua Data Aplikasi
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Dynamic Confirmation Dialog Backdrop inside the component */}
      <AnimatePresence>
        {confirmConfig && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs text-left">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-md w-full border border-slate-100 shadow-2xl space-y-4"
            >
              <div className="flex items-start gap-3">
                <div className="p-3 bg-amber-50 text-amber-600 rounded-full shrink-0">
                  <AlertTriangle className="w-5 h-5 text-amber-655" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800 leading-tight">
                    {confirmConfig.title}
                  </h3>
                  <p className="text-xs text-slate-450 mt-2 leading-relaxed whitespace-pre-wrap font-semibold font-sans">
                    {confirmConfig.message}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setConfirmConfig(null)}
                  className="px-4 py-2 border border-slate-205 hover:bg-slate-50 text-slate-700 font-bold text-xs uppercase tracking-wider rounded-lg transition-all cursor-pointer"
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
