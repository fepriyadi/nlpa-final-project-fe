import type { Review } from './classifier'

export interface Batch {
  id: string
  marketplace: string
  category: string
  count: number
  fakePct: string
  date: string
  /** Origin of the data: 'Upload CSV' | 'Input manual' | 'Scrape API'. */
  source: string
  /** Classification model used for this batch. */
  model: string
  /** Who created the batch (no auth in the prototype — stamped from a constant). */
  createdBy: string
  /** Human-readable timestamp when the batch was created. */
  createdAt: string
  /** Human-readable timestamp when classification finished. */
  processedAt: string
  selected?: boolean
}

export const SEED_BATCHES: Batch[] = [
  { id: 'BATCH-2026-0042', marketplace: 'Shopee', category: 'Skincare', count: 8, fakePct: '37,5%', date: '03 Jun 2026', source: 'Scrape API', model: 'IndoBERT-base · v2.1', createdBy: 'M. Iqbal', createdAt: '03 Jun 2026, 10.12', processedAt: '03 Jun 2026, 10.14', selected: true },
  { id: 'BATCH-2026-0041', marketplace: 'Tokopedia', category: 'Fashion Pria', count: 128, fakePct: '22,7%', date: '02 Jun 2026', source: 'Scrape API', model: 'IndoBERT-base · v2.1', createdBy: 'Sari R.', createdAt: '02 Jun 2026, 14.03', processedAt: '02 Jun 2026, 14.09' },
  { id: 'BATCH-2026-0039', marketplace: 'Google Maps', category: 'Restoran', count: 540, fakePct: '14,1%', date: '31 Mei 2026', source: 'Scrape API', model: 'IndoBERT-large · v1.0', createdBy: 'M. Iqbal', createdAt: '31 Mei 2026, 09.20', processedAt: '31 Mei 2026, 09.41' },
  { id: 'BATCH-2026-0036', marketplace: 'Tiket.com', category: 'Hotel Bali', count: 72, fakePct: '9,7%', date: '28 Mei 2026', source: 'Upload CSV', model: 'IndoBERT-base · v2.1', createdBy: 'Naufal P.', createdAt: '28 Mei 2026, 16.45', processedAt: '28 Mei 2026, 16.47' },
  { id: 'BATCH-2026-0034', marketplace: 'Bukalapak', category: 'Elektronik', count: 210, fakePct: '31,4%', date: '26 Mei 2026', source: 'Scrape API', model: 'XLM-R · v0.9', createdBy: 'Sari R.', createdAt: '26 Mei 2026, 11.02', processedAt: '26 Mei 2026, 11.15' },
]

export const SEED_REVIEWS: Review[] = [
  { id: 1, username: 'siti_amelia', rating: 5, text: 'Saya pakai serum ini selama 3 minggu, tekstur kulit jelas lebih halus dan jerawat hormonal di dagu berkurang. Awalnya sempat purging 4 hari. Packaging aman, dikirim cepat.', product: 'Serum Niacinamide 30ml', date: '2026-05-30' },
  { id: 2, username: 'user1281xx', rating: 5, text: 'Mantap! Recommended seller, barang ori, pengiriman cepat. 5 bintang!!!', product: 'Serum Niacinamide 30ml', date: '2026-05-31' },
  { id: 3, username: 'rinaa.k', rating: 4, text: 'Produk oke, di kulit kombinasi saya cukup melembabkan tapi agak lengket di awal. Setelah 30 menit menyerap. Harga sesuai.', product: 'Moisturizer Gel 50ml', date: '2026-05-31' },
  { id: 4, username: 'promotor.id_99', rating: 5, text: 'WAJIB BELI!!! The best produk istimewa kualitas premium fast respon!!!!', product: 'Sunscreen SPF50 50ml', date: '2026-06-01' },
  { id: 5, username: 'dimas.w', rating: 2, text: 'Botolnya bocor sedikit waktu sampai. Krimnya sendiri lumayan tapi packaging perlu diperbaiki, sayang aja kalau begini terus.', product: 'Moisturizer Gel 50ml', date: '2026-06-01' },
  { id: 6, username: 'akun.baru_2026', rating: 5, text: 'Joss kerennn', product: 'Sunscreen SPF50 50ml', date: '2026-06-02' },
  { id: 7, username: 'naufalp', rating: 4, text: 'Dibanding sunscreen sebelumnya yang white cast, ini jauh lebih nyaman dipakai di bawah makeup. Tidak perih di mata.', product: 'Sunscreen SPF50 50ml', date: '2026-06-02' },
  { id: 8, username: 'anonim_xyz', rating: 1, text: 'Mantap! barang ori, fast respon. Pokoknya the best.', product: 'Toner 100ml', date: '2026-06-02' },
]
