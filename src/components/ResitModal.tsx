/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { Product, SalesRecord } from '../types';
import { formatTarikh, formatTarikhMelayu, formatTarikhObj, formatCurrency, getLocalDateString } from '../utils';
import { FileText, Printer, Share2, X, HelpCircle, Copy, Check, MessageSquare, AlertTriangle, ExternalLink } from 'lucide-react';
import html2canvas from 'html2canvas';

interface ResitModalProps {
  records: SalesRecord[];
  products: Product[];
  syarikat: string;
  syarikatLogo?: string;
}

export default function ResitModal({ records, products, syarikat, syarikatLogo }: ResitModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Date filters for receipt statement (timezone-safe)
  const todayStr = getLocalDateString();
  const getStartOfMonthStr = () => {
    const d = new Date();
    d.setDate(1);
    const offset = d.getTimezoneOffset();
    const localD = new Date(d.getTime() - (offset * 60 * 1000));
    return localD.toISOString().split('T')[0];
  };
  const startOfMonthStr = getStartOfMonthStr();

  const [resitMula, setResitMula] = useState(startOfMonthStr);
  const [resitTamat, setResitTamat] = useState(todayStr);
  
  // States of interactions
  const [isGeneratingImg, setIsGeneratingImg] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [custPhone, setCustPhone] = useState('');
  const [showPrintNotice, setShowPrintNotice] = useState(false);

  // Reference for capturing image
  const receiptCaptureRef = useRef<HTMLDivElement>(null);

  // Compute filtered receipt items
  const receiptItems = records
    .filter(r => (!resitMula || r.tarikh >= resitMula) && (!resitTamat || r.tarikh <= resitTamat))
    .sort((a, b) => new Date(a.tarikh).getTime() - new Date(b.tarikh).getTime());

  const totalReceiptRevenue = receiptItems.reduce((sum, r) => sum + r.jumlah, 0);

  // Calculate daily totals summary within the receipt statement
  const dailyBreakdown: { [dateStr: string]: number } = {};
  receiptItems.forEach(r => {
    if (!dailyBreakdown[r.tarikh]) dailyBreakdown[r.tarikh] = 0;
    dailyBreakdown[r.tarikh] += r.jumlah;
  });

  const dailyBreakdownSorted = Object.entries(dailyBreakdown)
    .map(([tarikh, jumlah]) => ({ tarikh, jumlah }))
    .sort((a, b) => new Date(a.tarikh).getTime() - new Date(b.tarikh).getTime());

  // Helper to construct WhatsApp message text
  const generateWhatsAppText = () => {
    const lineSepar = '================================';
    let text = `*PENYATA JUALAN RASMI - ${syarikat.toUpperCase()}*\n`;
    text += `📅 *Tempoh:* ${formatTarikh(resitMula)} hingga ${formatTarikh(resitTamat)}\n`;
    text += `Tarikh Dijana: ${formatTarikhObj(new Date())}\n`;
    text += `${lineSepar}\n\n`;
    
    text += `*BUTIRAN TRANSAKSI JUALAN:*\n`;
    receiptItems.forEach((item, index) => {
      text += `${index + 1}. *[${formatTarikh(item.tarikh)}]* ${item.produk}\n`;
      text += `   Kuantiti: ${item.terjual} pcs @ RM ${formatCurrency(item.harga)}/pcs\n`;
      if (item.dihantar > 0) {
        text += `   Hantar: ${item.dihantar} pcs (+ Tambahan: ${item.tambahan})\n`;
      }
      text += `   Jumlah: *RM ${formatCurrency(item.jumlah)}*\n\n`;
    });

    text += `${lineSepar}\n`;
    text += `*💰 JUMLAH KESELURUHAN JUALAN: RM ${formatCurrency(totalReceiptRevenue)}*\n`;
    text += `${lineSepar}\n\n`;

    text += `*RINGKASAN HARIAN JUALAN:*\n`;
    dailyBreakdownSorted.forEach(day => {
      text += `• ${formatTarikh(day.tarikh)}: *RM ${formatCurrency(day.jumlah)}*\n`;
    });

    text += `\nTerima kasih atas sokongan perniagaan anda!\n`;
    text += `_Dijana secara automatik oleh Sistem Jualan & Stok ${syarikat}_`;
    return text;
  };

  // Print function
  const handlePrint = () => {
    if (receiptItems.length === 0) {
      alert('Sila pilih julat tarikh yang mempunyai rekod jualan.');
      return;
    }
    const isIframe = window.self !== window.top;
    if (isIframe) {
      setShowPrintNotice(true);
    } else {
      window.print();
    }
  };

  // Convert HTML to PNG and share or download with dynamic captions
  const handleShareOrDownload = async () => {
    if (receiptItems.length === 0) {
      alert('Sila pastikan senarai mempunyai item jualan sebelum menjana imej.');
      return;
    }
    if (!receiptCaptureRef.current) return;

    setIsGeneratingImg(true);
    try {
      const captureNode = receiptCaptureRef.current;
      const originalStyle = captureNode.style.cssText;
      
      // CRITICAL FIX: Explicitly set exact width so it renders flawlessly at high desktops aspects
      // even if user is on a small screens (e.g. iPhone) where everything usually squishes!
      captureNode.style.width = '600px';
      captureNode.style.minWidth = '600px';
      captureNode.style.maxWidth = '600px';
      captureNode.style.padding = '35px';

      // Temporarily patch getComputedStyle to convert OKLCH and OKLAB colors to standard RGB/RGBA values
      const originalGetComputedStyle = window.getComputedStyle;
      
      const labToRgbString = (L: number, a: number, b: number, hasAlpha: boolean, A: number): string => {
        const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
        const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
        const s_ = L - 0.0894841775 * a - 1.2914855480 * b;

        const lmsL = Math.max(0, l_ ** 3);
        const lmsM = Math.max(0, m_ ** 3);
        const lmsS = Math.max(0, s_ ** 3);

        const r =  4.0767416621 * lmsL - 3.3077115913 * lmsM + 0.2309699292 * lmsS;
        const g = -1.2684380046 * lmsL + 2.6097574011 * lmsM - 0.3413193965 * lmsS;
        const b_ = -0.0041960863 * lmsL - 0.7034186179 * lmsM + 1.7076147042 * lmsS;

        const toSRGB = (x: number) => {
          return x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055;
        };

        const pin = (val: number) => Math.min(255, Math.max(0, Math.round(val)));

        const R = pin(toSRGB(r) * 255);
        const G = pin(toSRGB(g) * 255);
        const B = pin(toSRGB(b_) * 255);

        if (hasAlpha) {
          return `rgba(${R}, ${G}, ${B}, ${A})`;
        }
        return `rgb(${R}, ${G}, ${B})`;
      };

      const oklchToRgb = (oklchStr: string): string => {
        try {
          const match = oklchStr.match(/oklch\(\s*([\d.%]+)\s+([\d.%]+)\s+([\d.radgradturn%]+)(?:\s*\/\s*([\d.%]+))?\s*\)/i);
          if (!match) return oklchStr;

          const LStr = match[1];
          const CStr = match[2];
          const HStr = match[3];
          const alphaStr = match[4];

          const L = LStr.endsWith('%') ? parseFloat(LStr) / 100 : parseFloat(LStr);
          const C = CStr.endsWith('%') ? (parseFloat(CStr) / 100) * 0.4 : parseFloat(CStr);
          
          let H = parseFloat(HStr);
          if (HStr.endsWith('rad')) {
            H = parseFloat(HStr) * (180 / Math.PI);
          } else if (HStr.endsWith('grad')) {
            H = parseFloat(HStr) * 0.9;
          } else if (HStr.endsWith('turn')) {
            H = parseFloat(HStr) * 360;
          }
          
          let A = 1;
          if (alphaStr) {
            A = alphaStr.endsWith('%') ? parseFloat(alphaStr) / 100 : parseFloat(alphaStr);
          }

          const hRad = (H * Math.PI) / 180;
          const a = C * Math.cos(hRad);
          const b = C * Math.sin(hRad);

          return labToRgbString(L, a, b, alphaStr !== undefined, A);
        } catch {
          return oklchStr;
        }
      };

      const oklabToRgb = (oklabStr: string): string => {
        try {
          const match = oklabStr.match(/oklab\(\s*([\d.%]+)\s+([-\d.%]+)\s+([-\d.%]+)(?:\s*\/\s*([\d.%]+))?\s*\)/i);
          if (!match) return oklabStr;

          const LStr = match[1];
          const aStr = match[2];
          const bStr = match[3];
          const alphaStr = match[4];

          const L = LStr.endsWith('%') ? parseFloat(LStr) / 100 : parseFloat(LStr);
          const a = aStr.endsWith('%') ? (parseFloat(aStr) / 100) * 0.4 : parseFloat(aStr);
          const b = bStr.endsWith('%') ? (parseFloat(bStr) / 100) * 0.4 : parseFloat(bStr);

          let A = 1;
          if (alphaStr) {
            A = alphaStr.endsWith('%') ? parseFloat(alphaStr) / 100 : parseFloat(alphaStr);
          }

          return labToRgbString(L, a, b, alphaStr !== undefined, A);
        } catch {
          return oklabStr;
        }
      };

      window.getComputedStyle = (elt, pseudoElt) => {
        const style = originalGetComputedStyle(elt, pseudoElt);
        return new Proxy(style, {
          get(target, prop) {
            const value = target[prop as any];
            if (typeof value === 'string') {
              let updatedValue = value;
              if (updatedValue.includes('oklch(')) {
                updatedValue = updatedValue.replace(/oklch\([^)]+\)/gi, (match) => oklchToRgb(match));
              }
              if (updatedValue.includes('oklab(')) {
                updatedValue = updatedValue.replace(/oklab\([^)]+\)/gi, (match) => oklabToRgb(match));
              }
              return updatedValue;
            }
            if (typeof value === 'function') {
              return (value as any).bind(target);
            }
            return value;
          }
        });
      };

      let canvas;
      try {
        canvas = await html2canvas(captureNode, {
          scale: 2.2,
          backgroundColor: '#ffffff',
          logging: false,
          useCORS: true
        });
      } finally {
        window.getComputedStyle = originalGetComputedStyle;
      }

      // Restore style
      captureNode.style.cssText = originalStyle;

      const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
      if (!blob) throw new Error('Blob generation failed');

      const fileName = `penyata_jualan_${resitMula}_hingga_${resitTamat}.png`;
      const fileObj = new File([blob], fileName, { type: 'image/png' });

      let sharedSuccessfully = false;

      if (
        navigator.share && 
        navigator.canShare && 
        navigator.canShare({ files: [fileObj] })
      ) {
        try {
          await navigator.share({
            files: [fileObj],
            title: `Penyata Jualan - ${syarikat}`
          });
          sharedSuccessfully = true;
        } catch (shareError) {
          console.warn('Navigator share failed:', shareError);
        }
      }

      if (!sharedSuccessfully) {
        // Try copying the image blob to the clipboard so they can paste it directly to WhatsApp/Telegram/etc.
        try {
          if (navigator.clipboard && navigator.clipboard.write) {
            await navigator.clipboard.write([
              new ClipboardItem({
                [blob.type]: blob
              })
            ]);
            alert('Imej Penyata telah disalin ke papan klip peranti anda! Anda kini boleh menampalnya (Paste/Ctrl+V) terus ke aplikasi kegemaran anda.');
          } else {
            alert('Fungsi kongsi terus tidak disokong pada pelayar web anda dalam tetingkap ini. Sila gunakan butang Cetak Penyata (PDF) atau ambil tangkapan skrin (Screenshot).');
          }
        } catch (clipErr) {
          alert('Fungsi kongsi terus tidak disokong pada pelayar web anda dalam tetingkap ini. Sila gunakan butang Cetak Penyata (PDF) atau ambil tangkapan skrin (Screenshot).');
        }
      }
    } catch (e) {
      console.error(e);
      alert('Gagal menjana imej. Sila gunakan fungsi Cetak Penyata (PDF) pilihan alternatif.');
    } finally {
      setIsGeneratingImg(false);
    }
  };

  // Copy statement text
  const handleCopyText = async () => {
    try {
      const text = generateWhatsAppText();
      await navigator.clipboard.writeText(text);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2000);
    } catch (err) {
      alert('Gagal menyalin teks penyata jualan.');
    }
  };

  // Instant direct WhatsApp dispatcher
  const handleSendToWhatsApp = () => {
    const textContent = encodeURIComponent(generateWhatsAppText());
    let cleanPhone = custPhone.replace(/\D/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '6' + cleanPhone;
    } else if (cleanPhone && !cleanPhone.startsWith('60') && cleanPhone.startsWith('1')) {
      cleanPhone = '60' + cleanPhone;
    }
    const url = cleanPhone 
      ? `https://wa.me/${cleanPhone}?text=${textContent}` 
      : `https://wa.me/?text=${textContent}`;
    window.open(url, '_blank');
  };

  return (
    <>
      <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4 no-print">
        {/* Overview action text */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-lg shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-800">Pusat Cetakan Resit & Penyata</h4>
            <p className="text-xs text-slate-400 mt-0.5 leading-snug">
              Jana fail imej resit rasmi, salin teks laporan lengkap, atau cetak PDF penyata jualan harian.
            </p>
          </div>
        </div>

        <button
          type="button"
          id="btn-buka-dialog-resit"
          onClick={() => setIsOpen(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition uppercase tracking-wider cursor-pointer"
        >
          <FileText className="w-3.5 h-3.5" />
          Buka Penyata Resit
        </button>
      </div>

      {/* Dialog Backdrop / Modal Interface */}
      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto no-print animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl flex flex-col max-h-[95vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-100 shrink-0">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 uppercase">
                <FileText className="w-4 h-4 text-indigo-500" />
                Penjana Resit & Penyata Jualan
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Range controls within modal */}
            <div className="p-4 bg-slate-50 border-b border-slate-100 shrink-0">
              <span className="text-xs font-bold text-slate-700 uppercase">Tetapkan Julat Tarikh Penyata:</span>
              <div className="flex flex-wrap sm:flex-nowrap gap-4 items-center mt-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono text-slate-400 font-extrabold uppercase">Dari:</span>
                  <input
                    type="date"
                    className="py-1 px-2.5 bg-white border border-slate-200 rounded text-xs focus:outline-none focus:border-indigo-500 font-mono text-slate-700"
                    value={resitMula}
                    onChange={e => setResitMula(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono text-slate-400 font-extrabold uppercase">Hingga:</span>
                  <input
                    type="date"
                    className="py-1 px-2.5 bg-white border border-slate-200 rounded text-xs focus:outline-none focus:border-indigo-500 font-mono text-slate-700"
                    value={resitTamat}
                    onChange={e => setResitTamat(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Scrollable Receipt Area & Layout grids */}
            <div className="p-6 overflow-y-auto bg-slate-100 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {receiptItems.length === 0 ? (
                <div className="lg:col-span-12 bg-white rounded-lg p-12 border border-slate-200 shadow-sm text-center flex flex-col items-center justify-center space-y-3">
                  <HelpCircle className="w-12 h-12 text-slate-300 stroke-[1.5]" />
                  <p className="text-slate-500 font-bold text-sm">Tiada Rekod Pada Tarikh Dipilih.</p>
                  <p className="text-xs text-slate-400 leading-normal max-w-xs">
                    Sila pilih julat tarikh jualan yang berbeza untuk menjana laporan penyata resit rasmi.
                  </p>
                </div>
              ) : (
                <>
                  {/* LEFT COMPONENT: INTUITIVE PREVIEW EXPLANATIONS */}
                  <div className="lg:col-span-4 space-y-4">
                    <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-3">
                      <h4 className="text-xs font-black text-slate-700 uppercase tracking-widest border-b pb-1.5 border-slate-100">Info Slip Penyata</h4>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between border-b border-slate-50 pb-1">
                          <span className="text-slate-450">Syarikat:</span>
                          <span className="font-bold text-slate-800">{syarikat || '-'}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-50 pb-1">
                          <span className="text-slate-450">Bil. Transaksi:</span>
                          <span className="font-bold text-slate-800">{receiptItems.length} rekod</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-50 pb-1">
                          <span className="text-slate-450">Jumlah Jualan:</span>
                          <span className="font-bold text-emerald-600">RM {formatCurrency(totalReceiptRevenue)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-lg space-y-2.5">
                      <h5 className="text-[11px] font-extrabold text-indigo-800 uppercase tracking-wider">💡 Tips Penjanaan Penyata:</h5>
                      <ul className="text-[11px] text-indigo-700 space-y-1.5 list-disc pl-3.5 leading-snug">
                        <li>Gunakan butang <strong>"Kongsi"</strong> di bawah untuk menjana & berkongsi imej grafik resit rasmi.</li>
                        <li>Gunakan butang <strong>"Cetak Penyata (PDF)"</strong> untuk mencetak dokumen terus ke pencetak fizikal atau menyimpannya sebagai fail dokumen PDF berkualiti tinggi.</li>
                      </ul>
                    </div>
                  </div>

                  {/* RIGHT COMPONENT: ACTUAL EMBEDDABLE RECEIPT TEMPLATE */}
                  <div className="lg:col-span-8 w-full overflow-x-auto pb-4 flex justify-start sm:justify-center">
                    <div 
                      ref={receiptCaptureRef}
                      className="bg-white shadow-md border border-slate-200 w-[576px] shrink-0 mx-auto p-6 font-sans text-slate-800 space-y-6 select-none leading-relaxed"
                      style={{ minHeight: '400px' }}
                    >
                      {/* Company Header */}
                      <div className="border-b-2 border-slate-800 pb-4 text-center flex flex-col items-center justify-center">
                        {syarikatLogo && (
                          <div className="w-14 h-14 rounded-xl overflow-hidden mb-2.5 border border-slate-200 bg-slate-50 flex items-center justify-center shadow-3xs">
                            <img src={syarikatLogo} alt="Logo Syarikat" className="w-full h-full object-cover" />
                          </div>
                        )}
                        <h2 className="text-xl font-extrabold text-slate-905 tracking-tight uppercase">
                          {syarikat || 'Syarikat Maju'}
                        </h2>
                        <p className="text-[10px] text-slate-400 mt-1 uppercase font-semibold tracking-widest">
                          Penyata Jualan & Laporan Resit Rasmi
                        </p>
                        <div className="flex justify-between items-center text-[10px] text-slate-500 mt-4 px-1 font-mono">
                          <span>Tarikh Jana: {formatTarikhObj(new Date())}</span>
                          <span>Tempoh: {formatTarikh(resitMula)} - {formatTarikh(resitTamat)}</span>
                        </div>
                      </div>

                      {/* Items table with STRICT percentage width distribution to prevent overflows */}
                      <div className="space-y-3">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pb-1 border-b border-slate-150">
                          Butiran Transaksi Jualan
                        </div>
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b border-slate-200 text-slate-500 font-bold">
                              <th className="py-1.5 text-left" style={{ width: '18%' }}>Tarikh</th>
                              <th className="py-1.5 text-left" style={{ width: '40%' }}>Butiran Produk</th>
                              <th className="py-1.5 text-center" style={{ width: '12%' }}>Kuantiti</th>
                              <th className="py-1.5 text-right" style={{ width: '15%' }}>Harga</th>
                              <th className="py-1.5 text-right" style={{ width: '15%' }}>Jumlah</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {receiptItems.map((item) => (
                              <tr key={item.id} className="text-slate-700">
                                <td className="py-2.5 font-mono text-[9px] text-slate-500 align-top whitespace-nowrap">
                                  {formatTarikh(item.tarikh)}
                                </td>
                                <td className="py-2.5 font-semibold text-slate-900 align-top break-words pr-2">
                                  <span>{item.produk}</span>
                                  {item.dihantar > 0 && (
                                    <span className="block text-[9px] text-slate-400 font-normal mt-0.5 leading-snug">
                                      Hantar: {item.dihantar} pcs (+ Tambahan: {item.tambahan})
                                    </span>
                                  )}
                                </td>
                                <td className="py-2.5 text-center font-mono align-top text-slate-600">
                                  {item.terjual} pcs
                                </td>
                                <td className="py-2.5 text-right font-mono align-top text-slate-550">
                                  {formatCurrency(item.harga)}
                                </td>
                                <td className="py-2.5 text-right font-mono font-bold text-slate-950 align-top">
                                  {formatCurrency(item.jumlah)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Daily breakdowns inside the clean receipt */}
                      <div className="pt-4 border-t border-slate-100 space-y-2">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pb-1 border-b border-slate-100/50">
                          Ringkasan Jualan Mengikut Hari
                        </div>
                        <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 font-mono text-[11px]">
                          {dailyBreakdownSorted.map(day => (
                            <div key={day.tarikh} className="flex justify-between py-0.5 border-b border-slate-100/50">
                              <span className="text-slate-500">{formatTarikh(day.tarikh)}</span>
                              <span className="font-bold text-slate-700">RM {formatCurrency(day.jumlah)}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* GRAND TOTAL */}
                      <div className="pt-4 border-t-2 border-dashed border-slate-800 flex justify-between items-center bg-slate-50 p-2.5 rounded">
                        <span className="text-xs font-black uppercase text-slate-800 tracking-wider">
                          Jumlah Jualan Keseluruhan:
                        </span>
                        <span className="text-lg font-black font-mono text-indigo-950">
                          RM {formatCurrency(totalReceiptRevenue)}
                        </span>
                      </div>

                      {/* Friendly footer */}
                      <div className="text-center pt-4 border-t border-slate-100 text-[9px] text-slate-400 italic">
                        Terima kasih atas sokongan perniagaan anda. Dijana secara automatik.
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Modal Actions Footer */}
            <div className="p-4 border-t border-slate-100 shrink-0 bg-slate-50 flex flex-col sm:flex-row justify-between gap-3">
              <span className="text-[11px] text-slate-400 flex items-center leading-tight">
                💡 Penyata gambar auto-selaras untuk tontonan peranti desktop mahupun mudah alih.
              </span>
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  id="btn-tutup-dialog-resit"
                  onClick={() => setIsOpen(false)}
                  className="px-3 py-1.5 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded text-xs font-semibold cursor-pointer transition"
                >
                  Tutup
                </button>
                <button
                  type="button"
                  id="btn-kongsi-resit-wa"
                  disabled={receiptItems.length === 0 || isGeneratingImg}
                  onClick={handleShareOrDownload}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold rounded flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs"
                >
                  {isGeneratingImg ? (
                    <span className="animate-pulse">Menjana Penyata...</span>
                  ) : (
                    <>
                      <Share2 className="w-3.5 h-3.5" />
                      Kongsi
                    </>
                  )}
                </button>
                <button
                  type="button"
                  id="btn-cetak-resit-skrin"
                  disabled={receiptItems.length === 0}
                  onClick={handlePrint}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold rounded flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Cetak Penyata (PDF)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Visual print warning overlay if they click print inside iframe */}
      {showPrintNotice && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center z-[60] p-4 animate-fade-in no-print">
          <div className="bg-white border-2 border-amber-500 rounded-xl shadow-2xl p-6 max-w-md w-full space-y-4">
            <div className="flex items-start gap-4">
              <div className="p-2.5 bg-amber-50 text-amber-600 rounded-full shrink-0">
                <AlertTriangle className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-tight">
                  Sila Buka Tab Baru Untuk Cetak PDF
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Sekatan keselamatan pelayar web menyekat tetingkap cetakan terus (print dialog) apabila aplikasi dimuatkan di dalam Frame Pratonton AI Studio.
                </p>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg space-y-3.5">
              <span className="text-xs font-bold text-amber-900 uppercase block">
                Ikuti Langkah Mudah Ini:
              </span>

              {/* Direct Quick Launch Tab Button */}
              <div className="bg-white border border-amber-300 p-3 rounded-xl text-center space-y-2 shadow-3xs">
                <p className="text-[10px] text-indigo-650 font-extrabold uppercase tracking-wide">Pautan Pintasan Pantas:</p>
                <a
                  href="./"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-widest rounded-lg transition-all cursor-pointer shadow-sm text-center animate-bounce duration-1000"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Buka Di Tab Baru Sekarang
                </a>
                <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                  Klik pautan ini untuk terus ke tetingkap tab penuh. Sijil keselamatan cetakan PDF anda diselaraskan secara automatik tanpa sekatan.
                </p>
              </div>

              <ul className="space-y-2.5 text-xs text-amber-800 leading-relaxed list-none pl-0">
                <li className="flex items-start gap-2.5">
                  <span className="flex items-center justify-center w-5 h-5 bg-amber-200 text-amber-900 rounded-full text-[10px] font-extrabold shrink-0 mt-0.5">1</span>
                  <span>
                    Klik butang <strong>"Buka Di Tab Baru Sekarang"</strong> di atas, atau butang <strong>"Buka di Tab Baru"</strong> berkembar dengan ikon anak panah serong <ExternalLink className="w-3" /> di penjuru kanan-atas pelayar AI Studio anda.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="flex items-center justify-center w-5 h-5 bg-amber-200 text-amber-900 rounded-full text-[10px] font-extrabold shrink-0 mt-0.5">2</span>
                  <span>
                    Di tetingkap tab penuh yang baru terpapar, klik semula butang <strong>"Buka Penyata Resit"</strong>.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="flex items-center justify-center w-5 h-5 bg-amber-200 text-amber-900 rounded-full text-[10px] font-extrabold shrink-0 mt-0.5">3</span>
                  <span>
                    Tekan butang <strong>"Cetak Penyata (PDF)"</strong> sekali lagi — dialog cetakan sistem pelayar anda akan muncul serta-merta tanpa sebarang sekatan!
                  </span>
                </li>
              </ul>
            </div>

            <div className="flex gap-2 justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setShowPrintNotice(false);
                  window.print();
                }}
                className="px-3.5 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 font-medium text-xs rounded transition cursor-pointer"
              >
                Cuba Cetak Juga
              </button>
              <button
                type="button"
                onClick={() => setShowPrintNotice(false)}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded transition cursor-pointer shadow-sm animate-pulse"
              >
                Faham & Tutup Panduan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HIDDEN IN WEB VIEWS BUT PRESENT FOR HARDWARE PRINTER COMMANDS */}
      {receiptItems.length > 0 && (
        <div className="print-only">
          <div className="p-6 font-sans text-slate-800 space-y-6 bg-white mx-auto" style={{ maxWidth: '650px' }}>
            <div className="border-b-2 border-slate-800 pb-4 text-center flex flex-col items-center justify-center">
              {syarikatLogo && (
                <div className="w-14 h-14 rounded-xl overflow-hidden mb-2.5 border border-slate-200 bg-slate-50 flex items-center justify-center shadow-3xs">
                  <img src={syarikatLogo} alt="Logo Syarikat" className="w-full h-full object-cover" />
                </div>
              )}
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight uppercase">
                {syarikat}
              </h2>
              <p className="text-xs text-slate-400 mt-1 uppercase font-semibold">
                Penyata Laporan & Resit Jualan Rasmi
              </p>
              <div className="flex justify-between items-center text-xs text-slate-500 mt-4 px-1 font-mono">
                <span>Tarikh Jana: {formatTarikhObj(new Date())}</span>
                <span>Tempoh: {formatTarikh(resitMula)} - {formatTarikh(resitTamat)}</span>
              </div>
            </div>

            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-bold">
                  <th className="py-2 text-left" style={{ width: '18%' }}>Tarikh</th>
                  <th className="py-2 text-left" style={{ width: '40%' }}>Butiran Produk</th>
                  <th className="py-2 text-center" style={{ width: '12%' }}>Kuantiti</th>
                  <th className="py-2 text-right" style={{ width: '15%' }}>Harga (RM)</th>
                  <th className="py-2 text-right" style={{ width: '15%' }}>Jumlah (RM)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {receiptItems.map((item) => (
                  <tr key={item.id} className="text-slate-700">
                    <td className="py-2 font-mono whitespace-nowrap">{formatTarikh(item.tarikh)}</td>
                    <td className="py-2 font-bold break-words pr-2">{item.produk}</td>
                    <td className="py-2 text-center font-mono">{item.terjual} pcs</td>
                    <td className="py-2 text-right font-mono text-slate-500">{formatCurrency(item.harga)}</td>
                    <td className="py-2 text-right font-mono font-bold text-slate-950">
                      {formatCurrency(item.jumlah)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="pt-4 border-t border-slate-200 space-y-1.5">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider pb-1">
                Laporan Ringkasan Mengikut Hari
              </div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-1 font-mono text-xs">
                {dailyBreakdownSorted.map(day => (
                  <div key={day.tarikh} className="flex justify-between py-1 border-b border-slate-100 font-mono">
                    <span className="text-slate-500">{formatTarikh(day.tarikh)}:</span>
                    <span className="font-bold text-slate-700">RM {formatCurrency(day.jumlah)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t-2 border-dashed border-slate-800 flex justify-between items-center text-sm font-bold bg-slate-50 p-2.5 rounded">
              <span>JUMLAH KESELURUHAN PENYATA:</span>
              <span className="text-2xl font-black font-mono text-slate-950">
                RM {formatCurrency(totalReceiptRevenue)}
              </span>
            </div>

            <div className="text-center pt-8 text-xs text-slate-400 italic">
              Terima kasih atas sokongan perniagaan anda. Dijana secara automatik.
            </div>
          </div>
        </div>
      )}
    </>
  );
}
