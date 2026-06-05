/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Product {
  id: string;
  nama: string;
  harga: number;
  jenis: 'harian' | 'stok';
  stok: number;
  tarikhStokMula?: string;
}

export interface SalesRecord {
  id: string;
  tarikh: string;
  produk: string; // matches product name
  dihantar: number;
  tambahan: number;
  terjual: number;
  harga: number;
  jumlah: number;
}
