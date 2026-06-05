/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Product, SalesRecord } from '../types';
import { formatCurrency, formatTarikh, formatTarikhMelayu } from '../utils';
import { 
  TrendingUp, 
  ShoppingBag, 
  Award, 
  PieChart as PieIcon, 
  BarChart3,
  Calendar,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Info,
  CalendarDays,
  Percent,
  CheckCircle2,
  AlertCircle,
  FileText,
  MousePointerClick
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AnalisaJualanProps {
  records: SalesRecord[];
  products: Product[];
}

export default function AnalisaJualan({ records, products }: AnalisaJualanProps) {
  // --- Selected Time Frame ---
  const [timeRange, setTimeRange] = useState<'7' | '30' | 'all'>('30');
  
  // Tab control for more granular analyst perspectives
  const [activeTab, setActiveTab] = useState<'overview' | 'weekday' | 'insights'>('overview');
  
  // Interactive Hover/Tooltip States
  const [hoveredPoint, setHoveredPoint] = useState<{ date: string; sales: number; qty: number; x: number; y: number } | null>(null);
  const [hoveredSector, setHoveredSector] = useState<'harian' | 'stok' | null>(null);

  const today = new Date();

  // --- 1. Current Selected Period Filter ---
  const filteredRecords = useMemo(() => {
    if (timeRange === 'all') return records;
    
    const cutoffDate = new Date();
    cutoffDate.setDate(today.getDate() - parseInt(timeRange));
    const cutoffStr = cutoffDate.toISOString().split('T')[0];
    
    return records.filter(r => r.tarikh >= cutoffStr);
  }, [records, timeRange]);

  // --- 2. Growth and Comparison Metrics vs Preceding Period ---
  const comparisons = useMemo(() => {
    if (timeRange === 'all') {
      return {
        revenueGrowth: null,
        unitsGrowth: null,
        countGrowth: null,
        prevRevenue: 0,
        prevUnits: 0,
        prevCount: 0
      };
    }

    const rangeDays = parseInt(timeRange);
    
    // Limits of current period
    const cutoffDate = new Date();
    cutoffDate.setDate(today.getDate() - rangeDays);
    const cutoffStr = cutoffDate.toISOString().split('T')[0];

    // Limits of previous period
    const prevCutoffDate = new Date();
    prevCutoffDate.setDate(today.getDate() - (rangeDays * 2));
    const prevCutoffStr = prevCutoffDate.toISOString().split('T')[0];

    // Filter transaction lists
    const curRecords = filteredRecords;
    const prevRecords = records.filter(r => r.tarikh >= prevCutoffStr && r.tarikh < cutoffStr);

    const curRevenue = curRecords.reduce((sum, r) => sum + r.jumlah, 0);
    const curUnits = curRecords.reduce((sum, r) => sum + r.terjual, 0);
    const curCount = curRecords.length;

    const prevRevenue = prevRecords.reduce((sum, r) => sum + r.jumlah, 0);
    const prevUnits = prevRecords.reduce((sum, r) => sum + r.terjual, 0);
    const prevCount = prevRecords.length;

    const revenueGrowth = prevRevenue > 0 
      ? ((curRevenue - prevRevenue) / prevRevenue) * 100 
      : null;

    const unitsGrowth = prevTotalUnitsGrowth(prevUnits, curUnits);
    const countGrowth = prevTotalUnitsGrowth(prevCount, curCount);

    function prevTotalUnitsGrowth(prevVal: number, curVal: number) {
      return prevVal > 0 ? ((curVal - prevVal) / prevVal) * 100 : null;
    }

    return {
      revenueGrowth,
      unitsGrowth,
      countGrowth,
      prevRevenue,
      prevUnits,
      prevCount
    };
  }, [records, filteredRecords, timeRange]);

  // --- 3. Base Standard Metrics ---
  const totalRevenue = useMemo(() => {
    return filteredRecords.reduce((sum, r) => sum + r.jumlah, 0);
  }, [filteredRecords]);

  const totalUnits = useMemo(() => {
    return filteredRecords.reduce((sum, r) => sum + r.terjual, 0);
  }, [filteredRecords]);

  const activeDaysCount = useMemo(() => {
    const uniqueDays = new Set(filteredRecords.map(r => r.tarikh));
    return uniqueDays.size;
  }, [filteredRecords]);

  const purataHarian = useMemo(() => {
    const days = activeDaysCount || 1;
    return totalRevenue / days;
  }, [totalRevenue, activeDaysCount]);

  // Average Order Value (AOV) represent basket sizes
  const averageTicketSize = useMemo(() => {
    const count = filteredRecords.length || 1;
    return totalRevenue / count;
  }, [totalRevenue, filteredRecords]);

  // --- 4. Donut Category Analysis (Harian vs Stok) ---
  const categorySplit = useMemo(() => {
    let harianSales = 0;
    let harianQty = 0;
    let stokSales = 0;
    let stokQty = 0;

    filteredRecords.forEach(r => {
      const prod = products.find(p => p.nama.toLowerCase() === r.produk.toLowerCase());
      const isStok = prod ? prod.jenis === 'stok' : false;
      if (isStok) {
        stokSales += r.jumlah;
        stokQty += r.terjual;
      } else {
        harianSales += r.jumlah;
        harianQty += r.terjual;
      }
    });

    const total = harianSales + stokSales || 1;
    return {
      harian: {
        raw: harianSales,
        qty: harianQty,
        percent: Math.round((harianSales / total) * 100)
      },
      stok: {
        raw: stokSales,
        qty: stokQty,
        percent: Math.round((stokSales / total) * 100)
      }
    };
  }, [filteredRecords, products]);

  // --- 5. Donut SVG calculation ---
  const donutSVG = useMemo(() => {
    const size = 180;
    const center = size / 2;
    const radius = 62;
    const strokeWidth = 22;
    const circ = 2 * Math.PI * radius;

    const harianScore = categorySplit.harian.raw;
    const stokScore = categorySplit.stok.raw;
    const sum = harianScore + stokScore || 1;

    const harianStroke = (harianScore / sum) * circ;
    const stokStroke = (stokScore / sum) * circ;

    return {
      harianStroke: `${harianStroke} ${circ}`,
      stokStroke: `${stokStroke} ${circ}`,
      harianOffset: 0,
      stokOffset: -harianStroke,
      circ,
      radius,
      strokeWidth,
      center,
      size
    };
  }, [categorySplit]);

  // --- 6. Top 5 Products Benchmark ---
  const topProducts = useMemo(() => {
    const map: { [key: string]: { qty: number; sales: number; type: string } } = {};
    
    filteredRecords.forEach(r => {
      if (!map[r.produk]) {
        const prod = products.find(p => p.nama.toLowerCase() === r.produk.toLowerCase());
        map[r.produk] = { qty: 0, sales: 0, type: prod?.jenis || 'harian' };
      }
      map[r.produk].qty += r.terjual;
      map[r.produk].sales += r.jumlah;
    });

    return Object.entries(map)
      .map(([nama, data]) => ({ nama, ...data }))
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 5);
  }, [filteredRecords, products]);

  const maxProductSales = useMemo(() => {
    return Math.max(...topProducts.map(p => p.sales), 1);
  }, [topProducts]);

  // --- 7. Full Timeline Sequence (Daily trend) ---
  const lineChartData = useMemo(() => {
    const datesMap: { [key: string]: { sales: number; qty: number } } = {};
    const dayCount = timeRange === 'all' ? 15 : parseInt(timeRange);
    
    filteredRecords.forEach(r => {
      if (!datesMap[r.tarikh]) {
        datesMap[r.tarikh] = { sales: 0, qty: 0 };
      }
      datesMap[r.tarikh].sales += r.jumlah;
      datesMap[r.tarikh].qty += r.terjual;
    });

    if (timeRange === 'all') {
      return Object.entries(datesMap)
        .map(([date, data]) => ({ date, ...data }))
        .sort((a, b) => a.date.localeCompare(b.date));
    }

    const timeline = [];
    for (let i = dayCount - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dStr = d.toISOString().split('T')[0];
      const match = datesMap[dStr] || { sales: 0, qty: 0 };
      timeline.push({
        date: dStr,
        sales: match.sales,
        qty: match.qty
      });
    }
    return timeline;
  }, [filteredRecords, timeRange]);

  // Peak sales single day analysis
  const peakSalesDay = useMemo(() => {
    if (lineChartData.length === 0) return null;
    const sorted = [...lineChartData].sort((a, b) => b.sales - a.sales);
    return sorted[0].sales > 0 ? sorted[0] : null;
  }, [lineChartData]);

  // --- 8. Weekday Distribution Matrix (Isnin - Ahad) ---
  const weekdayData = useMemo(() => {
    const daysInMalay = ['Ahad', 'Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat', 'Sabtu'];
    const revenueMap: { [key: number]: number } = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    const quantityMap: { [key: number]: number } = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    const frequencyMap: { [key: number]: number } = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };

    filteredRecords.forEach(r => {
      const dateObj = new Date(r.tarikh + 'T12:00:00');
      const dayIndex = dateObj.getDay();
      if (!isNaN(dayIndex)) {
        revenueMap[dayIndex] += r.jumlah;
        quantityMap[dayIndex] += r.terjual;
        frequencyMap[dayIndex] += 1;
      }
    });

    const totalRevSum = Object.values(revenueMap).reduce((a, b) => a + b, 0) || 1;

    return daysInMalay.map((name, index) => {
      const value = revenueMap[index];
      const qty = quantityMap[index];
      const freq = frequencyMap[index];
      const percent = Math.round((value / totalRevSum) * 100);
      return {
        index,
        name,
        value,
        qty,
        freq,
        percent
      };
    });
  }, [filteredRecords]);

  // Peak Day of the Week
  const peakWeekday = useMemo(() => {
    const sorted = [...weekdayData].sort((a, b) => b.value - a.value);
    return sorted[0].value > 0 ? sorted[0] : null;
  }, [weekdayData]);

  // --- 9. Coordinate Plot Generation for Area/Line Graph ---
  const { pathD, areaD, pointsCoords, meanY } = useMemo(() => {
    const width = 600;
    const height = 240;
    const padL = 55;
    const padR = 20;
    const padT = 35;
    const padB = 40;

    const dataLength = lineChartData.length;
    if (dataLength === 0) return { pathD: '', areaD: '', pointsCoords: [], meanY: 0 };

    const maxVal = Math.max(...lineChartData.map(d => d.sales), 50) * 1.15;
    const scaleX = (width - padL - padR) / Math.max(dataLength - 1, 1);
    const scaleY = (height - padT - padB) / maxVal;

    const coords = lineChartData.map((d, idx) => {
      const x = padL + idx * scaleX;
      const y = height - padB - d.sales * scaleY;
      return { x, y, date: d.date, sales: d.sales, qty: d.qty };
    });

    // Reference average Line height coordinate
    const avgSales = lineChartData.reduce((sum, d) => sum + d.sales, 0) / dataLength;
    const mY = height - padB - avgSales * scaleY;

    let pD = '';
    let aD = '';

    if (coords.length > 0) {
      pD = `M ${coords[0].x} ${coords[0].y}`;
      for (let i = 1; i < coords.length; i++) {
        const cpX1 = coords[i - 1].x + (coords[i].x - coords[i - 1].x) / 2;
        const cpY1 = coords[i - 1].y;
        const cpX2 = coords[i - 1].x + (coords[i].x - coords[i - 1].x) / 2;
        const cpY2 = coords[i].y;
        pD += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${coords[i].x} ${coords[i].y}`;
      }
      aD = pD + ` L ${coords[coords.length - 1].x} ${height - padB} L ${coords[0].x} ${height - padB} Z`;
    }

    return { pathD: pD, areaD: aD, pointsCoords: coords, meanY: mY };
  }, [lineChartData]);

  // --- 10. Executive Recommendations Engine (Dynamic Consultations) ---
  const analystInsights = useMemo(() => {
    const list = [];

    // Observation 1: Weekday demand spike
    if (peakWeekday && peakWeekday.value > 0) {
      list.push({
        type: 'opportunity',
        title: `Puncak Aktiviti Mingguan: Hari ${peakWeekday.name}`,
        desc: `Hari ${peakWeekday.name} adalah penyumbang modal terbesar dengan RM ${formatCurrency(peakWeekday.value)} (${peakWeekday.percent}% dari jumlah sumbangan). Cadangan: Tingkatkan ketersediaan kakitangan penghantaran dan pastikan semakan baki stok diselesaikan sehari sebelum hari ${peakWeekday.name}.`
      });
    }

    // Observation 2: Portfolio concentration risk (80/20 Pareto rule check)
    if (topProducts.length > 0 && totalRevenue > 0) {
      const leadProduct = topProducts[0];
      const dominanceRatio = (leadProduct.sales / totalRevenue) * 100;
      if (dominanceRatio > 35) {
        list.push({
          type: 'warning',
          title: `Konsentrasi Risiko Portfolio: Terlalu Bergantung pada [${leadProduct.nama}]`,
          desc: `Produk "${leadProduct.nama}" bersendirian menjana ${dominanceRatio.toFixed(1)}% daripada keseluruhan hasil syarikat. Sekiranya pembekal utama terputus bekalan, aliran tunai syarikat akan menerima impak drastik. Cadangan: Mula perkenalkan atau promosikan 1-2 produk alternatif untuk menyeimbangkan penumpuan jualan.`
        });
      } else {
        list.push({
          type: 'success',
          title: 'Diversifikasi Portfolio Cemerlang',
          desc: `Struktur jualan produk anda seimbang dan tidak tertumpu secara berlebihan kepada satu menu sahaja. Ini mengurangkan risiko rantaian bekalan.`
        });
      }
    }

    // Observation 3: High margin or performance benchmark
    if (categorySplit.stok.percent > categorySplit.harian.percent && categorySplit.stok.raw > 0) {
      list.push({
        type: 'strategy',
        title: 'Model Berorientasikan Inventori (Sistem Gudang/Stok)',
        desc: `Kumpulan barangan stok mencatatkan bahagian majoriti sebanyak ${categorySplit.stok.percent}% daripada jualan. Aliran model ini mempunyai volum tinggi tetapi memerlukan modal terikat pada gudang fizikal. Pantau pusingan stok jualan (Inventory Turnover) dengan teliti.`
      });
    } else if (categorySplit.harian.raw > 0) {
      list.push({
        type: 'strategy',
        title: 'Model Berorientasikan Segar Harian (Aliran Just-in-Time)',
        desc: `Model runcit harian (tanpa simpanan gudang) menerajui prestasi dengan ${categorySplit.harian.percent}%. Ini mengekalkan aliran tunai cair kerana tiada produk lapuk di gudang. Fokus kepada mengurangkan baki pulangan tidak terjual harian.`
      });
    }

    // Observation 4: Ticket sizes
    if (averageTicketSize > 40) {
      list.push({
        type: 'info',
        title: `Nilai Pesanan Tinggi (RM ${formatCurrency(averageTicketSize)} / pembeli)`,
        desc: `Resit rujukan menunjukkan pelanggan membeli dalam saiz kuantiti sub-borong atau bundle besar. Strategi disyorkan: Kekalkan pakej promosi berasaskan kuantiti minimum (pembelian bundle) berbanding diskaun satu item tunggal.`
      });
    } else {
      list.push({
        type: 'info',
        title: `Nilai Transaksi Standard (RM ${formatCurrency(averageTicketSize)} / resit)`,
        desc: `Carian mencatatkan saiz perbelanjaan adalah berorientasikan pengguna akhir (end-user micro transactions). Disyorkan: Reka struktur cross-selling (e.g. "Beli 3 item percuma penghantaran / diskaun 5%") untuk meningkatkan saiz bakul belian purata.`
      });
    }

    return list;
  }, [peakWeekday, topProducts, totalRevenue, categorySplit, averageTicketSize]);

  return (
    <div className="space-y-6">
      
      {/* SECTION 1: POLISHED BUSINESS-LEVEL TOOLBAR */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-2xl p-6 shadow-md border border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1 text-left">
            <div className="flex items-center gap-2.5">
              <span className="bg-indigo-600 text-white p-2 rounded-xl border border-indigo-500 shadow-sm shadow-indigo-600/35">
                <TrendingUp className="w-5 h-5 animate-pulse" />
              </span>
              <div>
                <span className="text-[10px] bg-slate-800 text-indigo-300 font-extrabold uppercase px-2 py-0.5 rounded-md border border-slate-700 tracking-wider">
                  Mod Analisis Profesional
                </span>
                <h1 className="text-xl font-black tracking-tight font-sans mt-0.5 flex items-center gap-2">
                  Dashboard Prestasi Analitik Perniagaan
                </h1>
              </div>
            </div>
            <p className="text-xs text-slate-300 max-w-2xl font-medium leading-relaxed pl-1.5 pt-1">
              Data dikosongkan daripada pengaruh luar untuk menilai prestasi perniagaan anda secara tulen. Menawarkan metrik pertumbuhan, kecenderungan hari, dan audit konsultasi runcit automatik.
            </p>
          </div>

          {/* Time Selector Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 self-stretch lg:self-auto">
            <span className="text-[10px] uppercase font-bold text-slate-400 self-center hidden lg:inline mr-1">
              Julat Data:
            </span>
            <div className="flex bg-slate-800/80 p-1 rounded-xl border border-slate-705/85 shrink-0">
              <button
                type="button"
                onClick={() => setTimeRange('7')}
                className={`py-1.5 px-4 text-[10.5px] font-extrabold tracking-wider uppercase rounded-lg transition-all cursor-pointer ${
                  timeRange === '7' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                7 HARI LEPAS
              </button>
              <button
                type="button"
                onClick={() => setTimeRange('30')}
                className={`py-1.5 px-4 text-[10.5px] font-extrabold tracking-wider uppercase rounded-lg transition-all cursor-pointer ${
                  timeRange === '30' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                30 HARI LEPAS
              </button>
              <button
                type="button"
                onClick={() => setTimeRange('all')}
                className={`py-1.5 px-4 text-[10.5px] font-extrabold tracking-wider uppercase rounded-lg transition-all cursor-pointer ${
                  timeRange === 'all' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                SEMUA REKOD
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic Metric Indicator Row inside header */}
        {timeRange !== 'all' && (
          <div className="mt-4 pt-4 border-t border-slate-800 text-[11px] text-slate-300 flex flex-wrap gap-x-6 gap-y-2 font-medium">
            <span className="flex items-center gap-1.5">
              <CalendarDays className="w-3.5 h-3.5 text-indigo-400" />
              Tempoh Semasa: <strong className="text-white font-semibold">{formatTarikh(new Date(today.getTime() - parseInt(timeRange) * 86400000).toISOString())} - {formatTarikh(today.toISOString())}</strong>
            </span>
            <span className="text-slate-650 hidden sm:inline">|</span>
            <span className="flex items-center gap-1.5">
              <RotateCcwIcon className="w-3.5 h-3.5 text-amber-400" />
              Bandingan Silang: <strong className="text-indigo-250 font-semibold">{timeRange} hari sebelumnya</strong>
            </span>
          </div>
        )}
      </div>

      {/* SECTION 2: EXECUTIVE KPIS BENTO GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI CARD 1: REVENUE FLOW */}
        <motion.div 
          whileHover={{ y: -3 }}
          className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between"
        >
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block font-sans">
                Jumlah Jualan Kasar
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-slate-800 font-mono tracking-tight pt-1">
                RM {formatCurrency(totalRevenue)}
              </h3>
            </div>
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl shrink-0">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          
          <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between text-[11px]">
            <span className="text-slate-400 font-semibold">Tumbesaran:</span>
            {timeRange === 'all' ? (
              <span className="text-slate-500 font-black">N/A (Siri Semua)</span>
            ) : comparisons.revenueGrowth !== null ? (
              <span className={`font-black flex items-center gap-0.5 ${comparisons.revenueGrowth >= 0 ? 'text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded font-sans' : 'text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded font-sans'}`}>
                {comparisons.revenueGrowth >= 0 ? (
                  <ArrowUpRight className="w-3.5 h-3.5" />
                ) : (
                  <ArrowDownRight className="w-3.5 h-3.5" />
                )}
                {comparisons.revenueGrowth.toFixed(1)}%
              </span>
            ) : (
              <span className="text-slate-400 font-bold bg-slate-50 px-1.5 py-0.5 rounded">Baru bermula</span>
            )}
          </div>
        </motion.div>

        {/* KPI CARD 2: UNITS SOLD */}
        <motion.div 
          whileHover={{ y: -3 }}
          className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between"
        >
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block font-sans">
                Unit Barangan Terjual
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-slate-800 font-mono tracking-tight pt-1">
                {totalUnits} <span className="text-xs text-slate-450 font-bold font-sans">unit</span>
              </h3>
            </div>
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl shrink-0">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          
          <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between text-[11px]">
            <span className="text-slate-400 font-semibold">Isihan Volum:</span>
            {timeRange === 'all' ? (
              <span className="text-slate-500 font-black">N/A (Siri Semua)</span>
            ) : comparisons.unitsGrowth !== null ? (
              <span className={`font-black flex items-center gap-0.5 ${comparisons.unitsGrowth >= 0 ? 'text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded font-sans' : 'text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded'}`}>
                {comparisons.unitsGrowth >= 0 ? '+' : ''}{comparisons.unitsGrowth.toFixed(1)}% qty
              </span>
            ) : (
              <span className="text-slate-400 font-bold bg-slate-50 px-1.5 py-0.5 rounded">Baru bermula</span>
            )}
          </div>
        </motion.div>

        {/* KPI CARD 3: AVERAGE BASKET VALUE (AOV) */}
        <motion.div 
          whileHover={{ y: -3 }}
          className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between"
        >
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block font-sans">
                Nilai Pesanan Purata (AOV)
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-slate-800 font-mono tracking-tight pt-1">
                RM {formatCurrency(averageTicketSize)}
              </h3>
            </div>
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl shrink-0">
              <Award className="w-4 h-4" />
            </div>
          </div>
          
          <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between text-[11px]">
            <span className="text-slate-400 font-semibold">Kadar Aktif Jualan:</span>
            <span className="font-extrabold text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-mono text-[10px]">
              {activeDaysCount} HARI AKTIF
            </span>
          </div>
        </motion.div>

        {/* KPI CARD 4: DAILY MEAN REVENUE */}
        <motion.div 
          whileHover={{ y: -3 }}
          className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between"
        >
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block font-sans">
                Purata Jualan Sehari
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-slate-800 font-mono tracking-tight pt-1">
                RM {formatCurrency(purataHarian)}
              </h3>
            </div>
            <div className="p-2.5 bg-violet-50 text-violet-600 rounded-xl shrink-0">
              <BarChart3 className="w-4 h-4" />
            </div>
          </div>
          
          <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between text-[11px]">
            <span className="text-slate-400 font-semibold">Jumlah Transaksi:</span>
            <span className="font-extrabold text-violet-700 bg-violet-50 px-2 py-0.5 rounded font-mono text-[10.5px]">
              {filteredRecords.length} REKOD
            </span>
          </div>
        </motion.div>

      </div>

      {/* THREE INTERACTIVE ANALYST VIEW TABS */}
      <div className="flex border-b border-slate-200 overflow-x-auto scrollbar-none whitespace-nowrap -mx-4 px-4 sm:mx-0 sm:px-0">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`py-3 px-4 md:px-5 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center gap-2 shrink-0 whitespace-nowrap ${
            activeTab === 'overview' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          <BarChart3 className="w-4 h-4 shrink-0" />
          <span>Graf Aliran & Model</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('weekday')}
          className={`py-3 px-4 md:px-5 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center gap-2 shrink-0 whitespace-nowrap ${
            activeTab === 'weekday' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          <Calendar className="w-4 h-4 shrink-0" />
          <span>Analisis Kitaran Hari</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('insights')}
          className={`py-3 px-4 md:px-5 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center gap-2 shrink-0 whitespace-nowrap ${
            activeTab === 'insights' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          <Sparkles className="w-4 h-4 text-violet-500 shrink-0" />
          <span>Audit & Khidmat Nasihat (Executive Advisory)</span>
          <span className="bg-violet-100 text-violet-850 px-1.5 py-0.5 rounded text-[9px] font-black font-sans uppercase animate-pulse shrink-0">Pintar</span>
        </button>
      </div>

      {/* ACTIVE TAB CONTAINER PANEL PANEL */}
      <div className="space-y-6">
        
        {/* TAB 1: OVERVIEW CHARTS */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* SVG CURVED FLOW GRAPH (LEFT) */}
            <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between">
              
              <div className="border-b border-slate-50 pb-3 mb-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="text-left">
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2.5 h-2.5 bg-indigo-600 rounded-full inline-block animate-ping" />
                    Trend Aliran Hasil Jualan Kasar (RM)
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-0.5 font-medium leading-normal">
                    Paparan data harian berturutan mengikut tempoh masa aktif jualan jitu.
                  </p>
                </div>
                
                {/* Visual Legends */}
                <div className="flex gap-4 text-[10.5px] font-semibold text-slate-500 wrap">
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-0.5 bg-indigo-500 rounded-full" /> Trend Sebenar
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-0.5 border-t-2 border-dashed border-rose-455" /> Garis Purata Harian
                  </span>
                </div>
              </div>

              {lineChartData.length === 0 ? (
                <div className="h-[240px] flex flex-col items-center justify-center text-center p-6 space-y-2">
                  <Info className="w-8 h-8 text-slate-300 animate-bounce" />
                  <p className="text-xs text-slate-400 font-bold">Tiada data jualan dalam julat tarikh yang dipilih.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* SVG Container wrapping Area Curves */}
                  <div className="relative w-full overflow-x-auto select-none">
                    <div className="min-w-[550px] relative">
                      <svg width="100%" height="240" viewBox="0 0 600 240" preserveAspectRatio="none" className="overflow-visible">
                        <defs>
                          <linearGradient id="areaGradIndigo" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.32" />
                            <stop offset="100%" stopColor="#818cf8" stopOpacity="0.0" />
                          </linearGradient>
                        </defs>

                        {/* Horizontal Grid & Y-Axis Labels */}
                        {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
                          const yVal = 35 + ratio * 165;
                          const referenceVal = (1 - ratio) * Math.max(...lineChartData.map(d => d.sales), 50) * 1.15;
                          return (
                            <g key={i}>
                              <line 
                                x1="55" 
                                y1={yVal} 
                                x2="585" 
                                y2={yVal} 
                                stroke="#f8fafc" 
                                strokeWidth="2" 
                                strokeDasharray={i === 4 ? 'none' : '4 4'} 
                              />
                              <text 
                                x="48" 
                                y={yVal + 3} 
                                textAnchor="end" 
                                className="font-mono text-[9px] fill-slate-405 font-bold"
                              >
                                {i === 4 ? '0' : `RM ${Math.round(referenceVal).toLocaleString()}`}
                              </text>
                            </g>
                          );
                        })}

                        {/* Flat Dotted Average Sales Reference Line */}
                        {meanY > 0 && meanY < 240 && (
                          <g>
                            <line 
                              x1="55" 
                              y1={meanY} 
                              x2="585" 
                              y2={meanY} 
                              stroke="#f43f5e" 
                              strokeWidth="1.5" 
                              strokeDasharray="4 6" 
                            />
                            <text 
                              x="580" 
                              y={meanY - 4} 
                              textAnchor="end" 
                              className="font-sans text-[8.5px] fill-rose-600 font-extrabold uppercase tracking-wider"
                            >
                              Sempadan Purata: RM {formatCurrency(purataHarian)}
                            </text>
                          </g>
                        )}

                        {/* Area Fill Gradient Path */}
                        {areaD && (
                          <path d={areaD} fill="url(#areaGradIndigo)" />
                        )}

                        {/* Main Plot Curve */}
                        {pathD && (
                          <path 
                            d={pathD} 
                            fill="none" 
                            stroke="#4f46e5" 
                            strokeWidth="3.5" 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                          />
                        )}

                        {/* Interactive Data Dots on Path */}
                        {pointsCoords.map((pt, i) => (
                          <g key={i}>
                            <circle 
                              cx={pt.x} 
                              cy={pt.y} 
                              r={hoveredPoint?.date === pt.date ? '7.5' : '4'} 
                              fill={hoveredPoint?.date === pt.date ? '#4f46e5' : '#ffffff'} 
                              stroke="#4f46e5" 
                              strokeWidth="3" 
                              className="transition-all duration-100 cursor-pointer"
                              onMouseEnter={() => setHoveredPoint(pt)}
                              onMouseLeave={() => setHoveredPoint(null)}
                            />
                          </g>
                        ))}

                        {/* Dynamic Tooltip Element inside SVG scope */}
                        <g>
                          {hoveredPoint && (
                            <foreignObject 
                              x={hoveredPoint.x > 380 ? hoveredPoint.x - 175 : hoveredPoint.x + 12} 
                              y={hoveredPoint.y - 70 < 10 ? 10 : hoveredPoint.y - 75} 
                              width="165" 
                              height="85"
                              className="pointer-events-none drop-shadow-lg z-50 text-left"
                            >
                              <div className="bg-slate-950/95 backdrop-blur-xs text-white p-2.5 rounded-xl border border-slate-800 text-[11px] leading-relaxed">
                                <span className="font-extrabold text-indigo-300 block text-[9px] uppercase tracking-wide">
                                  📅 {formatTarikhMelayu(hoveredPoint.date)}
                                </span>
                                <div className="mt-1.5 pt-1 border-t border-slate-800 flex justify-between items-center text-[10px]">
                                  <span className="text-slate-400 font-semibold">RM Jualan:</span>
                                  <span className="font-bold text-emerald-400 font-mono">RM {formatCurrency(hoveredPoint.sales)}</span>
                                </div>
                                <div className="flex justify-between items-center text-[10px]">
                                  <span className="text-slate-400 font-semibold">Qty Terjual:</span>
                                  <span className="font-bold text-white font-mono">{hoveredPoint.qty} bungkusan</span>
                                </div>
                              </div>
                            </foreignObject>
                          )}
                        </g>

                        {/* Ticks/Dates labels */}
                        {pointsCoords.map((pt, idx) => {
                          const steps = Math.ceil(pointsCoords.length / 7) || 1;
                          if (idx % steps !== 0 && idx !== pointsCoords.length - 1) return null;
                          const label = pt.date.slice(8, 10) + '/' + pt.date.slice(5, 7);
                          return (
                            <text 
                              key={idx} 
                              x={pt.x} 
                              y="225" 
                              textAnchor="middle" 
                              className="font-mono text-[9px] fill-slate-400 font-bold"
                            >
                              {label}
                            </text>
                          );
                        })}
                      </svg>
                    </div>
                  </div>
                  
                  {/* Peak Day Callout Panel */}
                  {peakSalesDay && peakSalesDay.sales > 0 && (
                    <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-left">
                      <span className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-amber-500 animate-spin" />
                        <span>Peak Performance Day (Titik Puncak):</span>
                        <strong className="text-indigo-600 bg-white border border-indigo-150 px-2.5 py-0.5 rounded-lg text-[11px]">
                          {formatTarikhMelayu(peakSalesDay.date)}
                        </strong>
                      </span>
                      <strong className="text-xs font-mono font-black text-indigo-950">
                        RM {formatCurrency(peakSalesDay.sales)} (Terjual {peakSalesDay.qty} unit)
                      </strong>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* PRODUCT CATEGORY SHARE HOVER DONUT CHART (RIGHT) */}
            <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between text-left">
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <PieIcon className="w-4 h-4 text-indigo-600" />
                  Pecahan Aliran Operasi Runcit
                </h4>
                <p className="text-[10px] text-slate-450 mt-0.5 font-medium leading-relaxed">
                  Bandingan sistem pesanan harian berbanding kawalan gudang stok semasa.
                </p>
              </div>

              {/* Graphical Donut Container */}
              <div className="flex flex-col items-center justify-center py-5 relative">
                {totalRevenue === 0 ? (
                  <div className="h-[120px] flex items-center justify-center text-slate-400 text-xs">
                    Tiada rekod pengagihan runcit.
                  </div>
                ) : (
                  <>
                    <svg width={donutSVG.size} height={donutSVG.size} className="transform -rotate-90 overflow-visible">
                      {/* Grey Base Track */}
                      <circle 
                        cx={donutSVG.center} 
                        cy={donutSVG.center} 
                        r={donutSVG.radius} 
                        fill="none" 
                        stroke="#f8fafc" 
                        strokeWidth={donutSVG.strokeWidth} 
                      />

                      {/* Segment Harian */}
                      {categorySplit.harian.raw > 0 && (
                        <circle 
                          cx={donutSVG.center} 
                          cy={donutSVG.center} 
                          r={donutSVG.radius} 
                          fill="none" 
                          stroke="#8b5cf6" 
                          strokeWidth={hoveredSector === 'harian' ? donutSVG.strokeWidth + 5 : donutSVG.strokeWidth} 
                          strokeDasharray={donutSVG.harianStroke} 
                          strokeDashoffset={donutSVG.harianOffset} 
                          strokeLinecap="round"
                          className="transition-all duration-150 cursor-pointer"
                          onMouseEnter={() => setHoveredSector('harian')}
                          onMouseLeave={() => setHoveredSector(null)}
                        />
                      )}

                      {/* Segment Stok */}
                      {categorySplit.stok.raw > 0 && (
                        <circle 
                          cx={donutSVG.center} 
                          cy={donutSVG.center} 
                          r={donutSVG.radius} 
                          fill="none" 
                          stroke="#4f46e5" 
                          strokeWidth={hoveredSector === 'stok' ? donutSVG.strokeWidth + 5 : donutSVG.strokeWidth} 
                          strokeDasharray={donutSVG.stokStroke} 
                          strokeDashoffset={donutSVG.stokOffset} 
                          strokeLinecap="round"
                          className="transition-all duration-150 cursor-pointer"
                          onMouseEnter={() => setHoveredSector('stok')}
                          onMouseLeave={() => setHoveredSector(null)}
                        />
                      )}
                    </svg>

                    {/* Central Hole Labels */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-2.5">
                      <AnimatePresence mode="wait">
                        {hoveredSector === 'harian' ? (
                          <motion.div
                            key="harian"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="text-center"
                          >
                            <span className="text-[9px] font-black uppercase text-violet-600 tracking-wider">HARIAN</span>
                            <span className="text-sm font-extrabold text-slate-800 font-mono block leading-snug">{categorySplit.harian.percent}%</span>
                            <span className="text-[9.5px] text-slate-450 font-semibold">{categorySplit.harian.qty} unit</span>
                          </motion.div>
                        ) : hoveredSector === 'stok' ? (
                          <motion.div
                            key="stok"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="text-center"
                          >
                            <span className="text-[9px] font-black uppercase text-indigo-600 tracking-wider">STOK</span>
                            <span className="text-sm font-extrabold text-slate-800 font-mono block leading-snug">{categorySplit.stok.percent}%</span>
                            <span className="text-[9.5px] text-slate-450 font-semibold">{categorySplit.stok.qty} unit</span>
                          </motion.div>
                        ) : (
                          <motion.div
                            key="default"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="text-center"
                          >
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block leading-3">KASAR</span>
                            <span className="text-base font-black text-indigo-950 font-mono mt-0.5 block">RM {formatCurrency(totalRevenue).split('.')[0]}</span>
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{totalUnits} PCS</p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </>
                )}
              </div>

              {/* Legends blocks with interactive hover toggles */}
              <div className="space-y-2.5 border-t border-slate-50 pt-4.5">
                <div 
                  onMouseEnter={() => setHoveredSector('harian')}
                  onMouseLeave={() => setHoveredSector(null)}
                  className={`flex items-center justify-between p-2 rounded-xl transition-all ${
                    hoveredSector === 'harian' ? 'bg-violet-50/70 border border-violet-100/50' : 'bg-slate-50/50 border border-transparent'
                  }`}
                >
                  <span className="flex items-center gap-2 text-xs font-bold text-slate-600">
                    <span className="w-2.5 h-2.5 rounded-full bg-violet-500 shrink-0" />
                    <span>Harian (Fresh Retail)</span>
                  </span>
                  <div className="text-right font-mono text-[11.5px] font-bold text-slate-800">
                    RM {formatCurrency(categorySplit.harian.raw)} <span className="text-violet-600 bg-violet-50 px-1 rounded font-sans text-[10px]">({categorySplit.harian.percent}%)</span>
                  </div>
                </div>

                <div 
                   onMouseEnter={() => setHoveredSector('stok')}
                   onMouseLeave={() => setHoveredSector(null)}
                   className={`flex items-center justify-between p-2 rounded-xl transition-all ${
                     hoveredSector === 'stok' ? 'bg-indigo-50/70 border border-indigo-100/50' : 'bg-slate-50/50 border border-transparent'
                   }`}
                >
                  <span className="flex items-center gap-2 text-xs font-bold text-slate-600">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shrink-0" />
                    <span>Stok (Gudang Fizikal)</span>
                  </span>
                  <div className="text-right font-mono text-[11.5px] font-bold text-slate-800">
                    RM {formatCurrency(categorySplit.stok.raw)} <span className="text-indigo-600 bg-indigo-50 px-1 rounded font-sans text-[10px]">({categorySplit.stok.percent}%)</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: WEEKDAY DEMAND ANALYSIS */}
        {activeTab === 'weekday' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* WEEKDAY BAR GRAPH (LEFT) */}
            <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-slate-100 shadow-xs text-left space-y-4">
              <div>
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-emerald-600" />
                  Graf Agihan Aliran Mengikut Hari Runcit (Isnin - Ahad)
                </h4>
                <p className="text-[10px] text-slate-450 mt-0.5 leading-normal font-medium">
                  Mengukur kekerapan transaksi dan volum dana kasar bagi mengoptimumkan strategi restock atau penjadualan jualan harian.
                </p>
              </div>

              {totalRevenue === 0 ? (
                <div className="h-44 flex items-center justify-center text-slate-400 text-xs">
                  Tiada rekod untuk dianalisis trend hariannya.
                </div>
              ) : (
                <div className="space-y-3.5 pt-2">
                  {weekdayData.map((day, idx) => {
                    const peakVal = Math.max(...weekdayData.map(d => d.value), 1);
                    const widthPercent = Math.max((day.value / peakVal) * 100, 3);
                    const isPeak = peakWeekday?.index === day.index;

                    return (
                      <div key={day.index} className="grid grid-cols-12 items-center gap-2.5">
                        {/* Day Name Label */}
                        <div className="col-span-2 text-xs font-black text-slate-700 tracking-tight flex items-center gap-1">
                          {isPeak && <span className="text-amber-500 animate-pulse text-[9px]">★</span>}
                          <span>{day.name}</span>
                        </div>

                        {/* Bar Segment */}
                        <div className="col-span-7 flex items-center h-7 relative">
                          <div className="w-full bg-slate-100 rounded-lg h-5 overflow-hidden border border-slate-50">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${widthPercent}%` }}
                              transition={{ duration: 0.8, ease: 'easeOut', delay: idx * 0.05 }}
                              className={`h-full rounded-lg ${
                                isPeak 
                                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 shadow-xs' 
                                  : 'bg-gradient-to-r from-indigo-500 to-indigo-600/80'
                              }`}
                            />
                          </div>
                        </div>

                        {/* Calculations Label values */}
                        <div className="col-span-3 text-right text-xs">
                          <span className="font-mono font-bold text-slate-800 block">RM {formatCurrency(day.value)}</span>
                          <span className="text-[9.5px] text-slate-400 font-mono font-medium block">
                            {day.percent}% • {day.qty} unit ({day.freq} jln)
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* QUICK BENCHMARK SUMMARY CHIPS (RIGHT) */}
            <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-xs text-left space-y-4">
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-indigo-600" />
                  Ringkasan Kitaran Hari
                </h4>
                <p className="text-[10px] text-slate-450 mt-0.5 leading-normal">
                  Rujukan cepat mengenai indeks hari tumpuan pelanggan anda.
                </p>
              </div>

              {peakWeekday && peakWeekday.value > 0 ? (
                <div className="space-y-4 pt-1">
                  
                  {/* Indicator Box 1 */}
                  <div className="bg-emerald-50/60 border border-emerald-100 rounded-xl p-3.5 space-y-2">
                    <span className="text-[9.5px] text-emerald-800 font-extrabold uppercase tracking-wider bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-md">
                      Penyumbang Paling Menguntungkan
                    </span>
                    <div className="flex justify-between items-baseline pt-1">
                      <strong className="text-base text-slate-800 font-black">Hari {peakWeekday.name}</strong>
                      <span className="font-mono text-sm font-black text-emerald-700">RM {formatCurrency(peakWeekday.value)}</span>
                    </div>
                    <p className="text-[10.5px] text-slate-500 leading-normal font-sans font-medium">
                      Ini mewakili <strong className="font-semibold text-slate-700">{peakWeekday.percent}%</strong> daripada keseluruhan pusingan modal dalam julat tarikh aktif yang ditapis.
                    </p>
                  </div>

                  {/* Indicator Box 2 - Lowest Day */}
                  {(() => {
                    const sortedLow = [...weekdayData]
                      .filter(d => d.value > 0)
                      .sort((a, b) => a.value - b.value);
                    const lowestDay = sortedLow[0];
                    if (!lowestDay) return null;

                    return (
                      <div className="bg-slate-50 border border-slate-150 rounded-xl p-3.5 space-y-2">
                        <span className="text-[9.5px] text-slate-500 font-extrabold uppercase tracking-wider bg-slate-200/50 px-2 py-0.5 rounded-md">
                          Hari Aktiviti Terendah / Tenang
                        </span>
                        <div className="flex justify-between items-baseline pt-1">
                          <strong className="text-sm text-slate-700 font-black">Hari {lowestDay.name}</strong>
                          <span className="font-mono text-xs font-bold text-slate-600">RM {formatCurrency(lowestDay.value)}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 leading-normal font-semibold">
                          Mencatatkan prestasi paling landai. Cadangan: Gunakan hari ini untuk audit pengiraan stok baki, pendedahan atau setup promosi.
                        </p>
                      </div>
                    );
                  })()}

                </div>
              ) : (
                <div className="text-slate-400 text-xs py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  Sila buat entri rekod jualan terdahulu untuk melihat rumusan tumpuan hari.
                </div>
              )}
            </div>

          </div>
        )}

        {/* TAB 3: SMART EXECUTIVE ADVISORY INSIGHTS */}
        {activeTab === 'insights' && (
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-6 text-left">
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="space-y-0.5">
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-violet-500 animate-bounce" />
                  Syor Runcit Pintar (Advisory Suite)
                </h4>
                <p className="text-[10px] text-slate-450 font-medium">
                  Khidmat rundingan automatik berdasarkan matematik pangkalan data semasa perniagaan anda.
                </p>
              </div>

              <div className="text-[10px] font-mono text-slate-400 bg-slate-100 border border-slate-150 px-2 py-0.5 rounded-md font-bold">
                AUDIT ENGINE LITE v1.2
              </div>
            </div>

            {analystInsights.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <Info className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-650 font-bold">Belum ada statistik jualan yang mencukupi untuk menjana idea nasihat.</p>
                <p className="text-[10px] text-slate-400 mt-1">Sila pastikan anda mendaftarkan menu produk dan membuat beberapa transaksi jualan.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {analystInsights.map((insight, idx) => {
                  
                  // Setup icons and color themes based on type
                  let theme = {
                    bg: 'bg-indigo-50/50 border-indigo-100/80',
                    iconBg: 'bg-indigo-100 text-indigo-700',
                    textTitle: 'text-indigo-950',
                    label: 'CADANGAN STRATEGIK'
                  };

                  if (insight.type === 'warning') {
                    theme = {
                      bg: 'bg-rose-50/40 border-rose-100/60',
                      iconBg: 'bg-rose-100 text-rose-700',
                      textTitle: 'text-rose-950',
                      label: 'PERINGATAN RISIKO'
                    };
                  } else if (insight.type === 'success') {
                    theme = {
                      bg: 'bg-emerald-50/40 border-emerald-100/60',
                      iconBg: 'bg-emerald-100 text-emerald-700',
                      textTitle: 'text-emerald-950',
                      label: 'PETUNJUK POSITIF'
                    };
                  } else if (insight.type === 'opportunity') {
                    theme = {
                      bg: 'bg-amber-50/50 border-amber-100/80',
                      iconBg: 'bg-amber-100 text-amber-800',
                      textTitle: 'text-slate-800',
                      label: 'PEAK VELOCITY'
                    };
                  }

                  return (
                    <div 
                      key={idx} 
                      className={`p-4 border rounded-xl flex gap-3.5 items-start ${theme.bg} shadow-3xs hover:shadow-2xs transition-all`}
                    >
                      <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${theme.iconBg}`}>
                        {insight.type === 'warning' ? (
                          <AlertCircle className="w-4 h-4" />
                        ) : insight.type === 'success' ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : (
                          <Sparkles className="w-4 h-4" />
                        )}
                      </div>

                      <div className="space-y-1">
                        <span className="text-[8.5px] font-black uppercase tracking-wider text-slate-400 block font-mono">
                          {theme.label}
                        </span>
                        <h5 className={`font-black text-xs leading-snug tracking-tight ${theme.textTitle}`}>
                          {insight.title}
                        </h5>
                        <p className="text-[10.5px] text-slate-500 leading-relaxed font-sans font-medium">
                          {insight.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </div>

      {/* SECTION 4: PRODUCT PERFORMANCE STANDINGS (GOLST/SLVR/BRNZ) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm text-left">
        <div className="border-b border-slate-50 pb-3 mb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
          <div>
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Award className="w-4 h-4 text-indigo-600" />
              Sumbangan Prestasi Produk (Top 5 Sumbangan RM)
            </h4>
            <p className="text-[10px] text-slate-450 mt-0.5 leading-normal">
              Analisis kedudukan produk terbaik yang mendominasi hasil kasar pusingan modal tunai.
            </p>
          </div>
          <span className="text-[9.5px] font-mono text-indigo-600 font-black bg-indigo-50 border border-indigo-120 py-0.5 px-2.5 rounded-full self-start sm:self-auto">
            Disusun Mengikut Total RM Tertinggi
          </span>
        </div>

        {topProducts.length === 0 ? (
          <div className="py-10 flex flex-col items-center justify-center text-slate-400 text-xs">
            <ShoppingBag className="w-7 h-7 text-slate-355 mb-2" />
            <p className="font-bold">Katalog kosong.</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Sila tambah baki rekod jualan harian untuk merumuskan carta leaderboard.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {topProducts.map((p, idx) => {
              const shares = Math.round((p.sales / (totalRevenue || 1)) * 100);
              const isStok = p.type === 'stok';

              const medalBadge = [
                { text: '🥇 GOLD RANK', bg: 'bg-amber-50 text-amber-800 border-amber-200' },
                { text: '🥈 SILVER RANK', bg: 'bg-slate-50 text-slate-800 border-slate-200' },
                { text: '🥉 BRONZE RANK', bg: 'bg-amber-50/30 text-amber-700/90 border-amber-100' },
                { text: '⭐️ KEDUDUKAN 4', bg: 'bg-slate-50/50 text-slate-500 border-slate-150' },
                { text: '⭐️ KEDUDUKAN 5', bg: 'bg-slate-50/50 text-slate-500 border-slate-150' },
              ][idx] || { text: `#${idx + 1}`, bg: 'bg-slate-50 text-slate-500 border-slate-150' };

              return (
                <motion.div
                  key={p.nama}
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-slate-50/40 p-4 rounded-xl border border-slate-100 hover:border-slate-250 transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="flex justify-between items-center">
                    <span className={`text-[8.5px] font-black border tracking-wider px-2 py-0.5 rounded-full font-mono ${medalBadge.bg}`}>
                      {medalBadge.text}
                    </span>
                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-md ${
                      isStok ? 'bg-indigo-100 text-indigo-700' : 'bg-violet-100 text-violet-700'
                    }`}>
                      {isStok ? 'K.STOK' : 'K.HARIAN'}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <h5 className="font-black text-slate-750 text-xs line-clamp-2 leading-relaxed min-h-[34px]" title={p.nama}>
                      {p.nama}
                    </h5>
                    <div className="flex justify-between items-center text-[10px] text-slate-400">
                      <span>Total Volum:</span>
                      <strong className="text-slate-800 font-mono font-bold">{p.qty} unit</strong>
                    </div>
                  </div>

                  {/* Horizontal visual meter share */}
                  <div className="space-y-1">
                    <div className="w-full bg-slate-200/50 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-700 ${isStok ? 'bg-indigo-600' : 'bg-violet-600'}`}
                        style={{ width: `${(p.sales / maxProductSales) * 100}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center text-[9px] font-bold text-slate-400">
                      <span>Peratus Sumbangan:</span>
                      <span className="text-indigo-600 font-black">{shares}%</span>
                    </div>
                  </div>

                  {/* Final block holding the RM value */}
                  <div className="bg-white border border-slate-100 rounded-lg py-2 px-1.5 text-center shadow-3xs mt-1">
                    <span className="text-[8.5px] text-slate-400 uppercase font-bold tracking-tight block">Kutipan Kasar</span>
                    <span className="text-xs font-black text-slate-800 font-mono mt-0.5 block">
                      RM {formatCurrency(p.sales)}
                    </span>
                  </div>

                </motion.div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}

// Minimalist local inline representation of RotateCcw icon replacement
function RotateCcwIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      viewBox="0 0 24 24" 
      className={props.className} 
      width="1em" 
      height="1em"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
    </svg>
  );
}
