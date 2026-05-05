export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (request.method === 'GET' && url.pathname === '/api/health') {
      return json({ ok: true, service: 'bpjs-payroll-simulator-worker' });
    }

    if (request.method === 'POST' && url.pathname === '/api/calculate') {
      const payload = await request.json().catch(() => null);
      if (!payload) return json({ error: 'Invalid JSON body' }, 400);

      const gaji = Number(payload.gaji || 0);
      const anggotaKeluarga = Number(payload.anggotaKeluarga || 1);
      const includeThr = !!payload.includeThr;
      const monthsWorked = clamp(Number(payload.monthsWorked || 12), 1, 12);
      const prorataThr = !!payload.prorataThr;
      const tunjanganBulanan = Number(payload.tunjanganBulanan || 0);
      const potonganLainBulanan = Number(payload.potonganLainBulanan || 0);
      const includeTax = !!payload.includeTax;
      const taxMethod = String(payload.taxMethod || 'ter');
      const ptkpStatus = String(payload.ptkpStatus || 'TK0');

      if (!Number.isFinite(gaji) || gaji <= 0 || !Number.isFinite(anggotaKeluarga) || anggotaKeluarga <= 0) {
        return json({ error: 'Invalid inputs' }, 400);
      }

      const result = hitungPaketKompensasi({
        gaji,
        anggotaKeluarga,
        includeTax,
        taxMethod,
        ptkpStatus,
        includeThr,
        prorataThr,
        monthsWorked,
        tunjanganBulanan,
        potonganLainBulanan
      });

      return json({
        input: {
          gaji,
          anggotaKeluarga,
          includeTax,
          taxMethod,
          ptkpStatus,
          includeThr,
          prorataThr,
          monthsWorked,
          tunjanganBulanan,
          potonganLainBulanan
        },
        result
      });
    }

    return new Response('Not Found', { status: 404 });
  }
};

function hitungPaketKompensasi(args) {
  const {
    gaji,
    anggotaKeluarga,
    includeTax,
    taxMethod,
    ptkpStatus,
    includeThr,
    prorataThr,
    monthsWorked,
    tunjanganBulanan,
    potonganLainBulanan
  } = args;

  const gajiKenaHitung = gaji + tunjanganBulanan;
  const plafonBPJSKes = 12000000;
  const gajiBPJSKes = Math.min(gajiKenaHitung, plafonBPJSKes);
  const persenIuranKaryawanBPJSKes = anggotaKeluarga > 5 ? 2 : 1;
  const iuranKaryawanBPJSKes = (persenIuranKaryawanBPJSKes / 100) * gajiBPJSKes;

  const iuranKaryawanJHT = (2 / 100) * gajiKenaHitung;
  const iuranPerusahaanJHT = (3.7 / 100) * gajiKenaHitung;

  const plafonGajiJP = 10042000;
  const gajiJP = Math.min(gajiKenaHitung, plafonGajiJP);
  const iuranKaryawanJP = (1 / 100) * gajiJP;
  const iuranPerusahaanJP = (2 / 100) * gajiJP;

  const totalInvestasiKaryawan = iuranKaryawanJHT + iuranKaryawanJP;
  const totalInvestasiPerusahaan = iuranPerusahaanJHT + iuranPerusahaanJP;
  const totalInvestasi = totalInvestasiKaryawan + totalInvestasiPerusahaan;
  const totalPotonganBPJS = iuranKaryawanBPJSKes + totalInvestasiKaryawan;

  const thrNominal = includeThr ? (prorataThr ? gajiKenaHitung * (monthsWorked / 12) : gajiKenaHitung) : 0;
  const taxResult = includeTax ? hitungPPh21Bulanan(gajiKenaHitung, taxMethod, ptkpStatus, includeThr, thrNominal) : null;
  const pphNormal = taxResult ? taxResult.pphBulananNormal : 0;
  const pphThrMonth = taxResult ? taxResult.pphBulanThr : 0;

  const totalPotonganNormal = totalPotonganBPJS + pphNormal + potonganLainBulanan;
  const totalPotonganThrMonth = totalPotonganBPJS + pphThrMonth + potonganLainBulanan;
  const totalPotonganFinal = includeThr ? totalPotonganThrMonth : totalPotonganNormal;

  const gajiBersihNormal = gajiKenaHitung - totalPotonganNormal;
  const gajiBersihThrMonth = gajiKenaHitung - totalPotonganThrMonth;
  const totalDiterimaDenganThr = gajiBersihThrMonth + thrNominal;
  const totalTakeHomeTahunan = (gajiBersihNormal * 11) + totalDiterimaDenganThr;

  return {
    gaji,
    tunjanganBulanan,
    potonganLainBulanan,
    gajiKenaHitung,
    iuranKaryawanBPJSKes,
    iuranKaryawanJHT,
    iuranKaryawanJP,
    totalInvestasiKaryawan,
    totalInvestasiPerusahaan,
    totalInvestasi,
    totalPotonganBPJS,
    totalPotonganNormal,
    totalPotonganThrMonth,
    pphNormal,
    pphThrMonth,
    totalPotonganFinal,
    gajiBersihNormal,
    gajiBersihThrMonth,
    thrNominal,
    totalDiterimaDenganThr,
    totalTakeHomeTahunan,
    taxResult
  };
}

function hitungPPh21Bulanan(gajiBulanan, taxMethod, ptkpStatus, includeThr, thrNominal) {
  if (taxMethod === 'ter') return hitungPPh21TerBulanan(gajiBulanan, ptkpStatus, includeThr, thrNominal);
  return hitungPPh21ProgresifBulanan(gajiBulanan, ptkpStatus, includeThr, thrNominal);
}

function hitungPPh21TerBulanan(gajiBulanan, ptkpStatus, includeThr, thrNominal) {
  const dasarBrutoBulananNormal = gajiBulanan;
  const dasarBrutoBulanThr = gajiBulanan + (includeThr ? thrNominal : 0);
  const kategoriTer = getKategoriTer(ptkpStatus);
  const terRateNormal = getTerRateBulanan(kategoriTer, dasarBrutoBulananNormal);
  const terRateThr = getTerRateBulanan(kategoriTer, dasarBrutoBulanThr);

  return {
    pphBulananNormal: dasarBrutoBulananNormal * terRateNormal,
    pphBulanThr: dasarBrutoBulanThr * terRateThr,
    includeThr,
    thrNominal,
    dasarBrutoBulananNormal,
    dasarBrutoBulanThr,
    kategoriTer,
    terRateNormal,
    terRateThr,
    ptkpTahunan: getPtkpTahunan(ptkpStatus),
    metodeLabel: 'TER Bulanan (PP 58/2023)',
    statusLabel: labelPtkpStatus(ptkpStatus)
  };
}

function hitungPPh21ProgresifBulanan(gajiBulanan, ptkpStatus, includeThr, thrNominal) {
  const thrTahunan = includeThr ? thrNominal : 0;
  const penghasilanTahunan = (gajiBulanan * 12) + thrTahunan;
  const ptkpTahunan = getPtkpTahunan(ptkpStatus);
  const pkpTahunan = Math.max(0, penghasilanTahunan - ptkpTahunan);
  const pphTahunan = hitungPajakProgresifTahunan(pkpTahunan);

  return {
    pphBulananNormal: pphTahunan / 12,
    pphBulanThr: pphTahunan / 12,
    includeThr,
    thrNominal,
    dasarBrutoBulananNormal: gajiBulanan,
    dasarBrutoBulanThr: gajiBulanan + (includeThr ? thrNominal : 0),
    kategoriTer: getKategoriTer(ptkpStatus),
    terRateNormal: null,
    terRateThr: null,
    ptkpTahunan,
    pkpTahunan,
    metodeLabel: 'Progresif Tahunan (Sederhana)',
    statusLabel: labelPtkpStatus(ptkpStatus)
  };
}

function hitungPajakProgresifTahunan(pkpTahunan) {
  const lapisan = [
    { batas: 60000000, tarif: 0.05 },
    { batas: 250000000, tarif: 0.15 },
    { batas: 500000000, tarif: 0.25 },
    { batas: 5000000000, tarif: 0.30 },
    { batas: Number.POSITIVE_INFINITY, tarif: 0.35 }
  ];

  let sisa = pkpTahunan;
  let pajak = 0;
  let batasBawah = 0;

  for (const item of lapisan) {
    if (sisa <= 0) break;
    const lebarLapisan = item.batas - batasBawah;
    const kenaPajak = Math.min(sisa, lebarLapisan);
    pajak += kenaPajak * item.tarif;
    sisa -= kenaPajak;
    batasBawah = item.batas;
  }
  return pajak;
}

function getPtkpTahunan(status) {
  const map = { TK0: 54000000, TK1: 58500000, TK2: 63000000, TK3: 67500000, K0: 58500000, K1: 63000000, K2: 67500000, K3: 72000000 };
  return map[status] || map.TK0;
}

function labelPtkpStatus(status) {
  const map = { TK0: 'TK/0', TK1: 'TK/1', TK2: 'TK/2', TK3: 'TK/3', K0: 'K/0', K1: 'K/1', K2: 'K/2', K3: 'K/3' };
  return map[status] || 'TK/0';
}

function getKategoriTer(status) {
  if (status === 'K3') return 'C';
  if (status === 'TK2' || status === 'TK3' || status === 'K1' || status === 'K2') return 'B';
  return 'A';
}

function getTerRateBulanan(kategori, brutoBulanan) {
  const tabel = kategori === 'B' ? TER_TABLE_B : (kategori === 'C' ? TER_TABLE_C : TER_TABLE_A);
  for (const row of tabel) {
    if (brutoBulanan > row.min && brutoBulanan <= row.max) return row.rate;
  }
  return 0.34;
}

const TER_TABLE_A = [
  { min: -1, max: 5400000, rate: 0 }, { min: 5400000, max: 5650000, rate: 0.0025 }, { min: 5650000, max: 5950000, rate: 0.005 }, { min: 5950000, max: 6300000, rate: 0.0075 },
  { min: 6300000, max: 6750000, rate: 0.01 }, { min: 6750000, max: 7500000, rate: 0.0125 }, { min: 7500000, max: 8550000, rate: 0.015 }, { min: 8550000, max: 9650000, rate: 0.0175 },
  { min: 9650000, max: 10050000, rate: 0.02 }, { min: 10050000, max: 10350000, rate: 0.0225 }, { min: 10350000, max: 10700000, rate: 0.025 }, { min: 10700000, max: 11050000, rate: 0.03 },
  { min: 11050000, max: 11600000, rate: 0.035 }, { min: 11600000, max: 12500000, rate: 0.04 }, { min: 12500000, max: 13750000, rate: 0.05 }, { min: 13750000, max: 15100000, rate: 0.06 },
  { min: 15100000, max: 16950000, rate: 0.07 }, { min: 16950000, max: 19750000, rate: 0.08 }, { min: 19750000, max: 24150000, rate: 0.09 }, { min: 24150000, max: 26450000, rate: 0.1 },
  { min: 26450000, max: 28000000, rate: 0.11 }, { min: 28000000, max: 30050000, rate: 0.12 }, { min: 30050000, max: 32400000, rate: 0.13 }, { min: 32400000, max: 35400000, rate: 0.14 },
  { min: 35400000, max: 39100000, rate: 0.15 }, { min: 39100000, max: 43850000, rate: 0.16 }, { min: 43850000, max: 47800000, rate: 0.17 }, { min: 47800000, max: 51400000, rate: 0.18 },
  { min: 51400000, max: 56300000, rate: 0.19 }, { min: 56300000, max: 62200000, rate: 0.2 }, { min: 62200000, max: 68600000, rate: 0.21 }, { min: 68600000, max: 77500000, rate: 0.22 },
  { min: 77500000, max: 89000000, rate: 0.23 }, { min: 89000000, max: 103000000, rate: 0.24 }, { min: 103000000, max: 125000000, rate: 0.25 }, { min: 125000000, max: 157000000, rate: 0.26 },
  { min: 157000000, max: 206000000, rate: 0.27 }, { min: 206000000, max: 337000000, rate: 0.28 }, { min: 337000000, max: 454000000, rate: 0.29 }, { min: 454000000, max: 550000000, rate: 0.3 },
  { min: 550000000, max: 695000000, rate: 0.31 }, { min: 695000000, max: 910000000, rate: 0.32 }, { min: 910000000, max: 1400000000, rate: 0.33 }, { min: 1400000000, max: Number.POSITIVE_INFINITY, rate: 0.34 }
];

const TER_TABLE_B = [
  { min: -1, max: 6200000, rate: 0 }, { min: 6200000, max: 6500000, rate: 0.0025 }, { min: 6500000, max: 6850000, rate: 0.005 }, { min: 6850000, max: 7300000, rate: 0.0075 },
  { min: 7300000, max: 9200000, rate: 0.01 }, { min: 9200000, max: 10750000, rate: 0.015 }, { min: 10750000, max: 11250000, rate: 0.02 }, { min: 11250000, max: 11600000, rate: 0.025 },
  { min: 11600000, max: 12600000, rate: 0.03 }, { min: 12600000, max: 13600000, rate: 0.04 }, { min: 13600000, max: 14950000, rate: 0.05 }, { min: 14950000, max: 16400000, rate: 0.06 },
  { min: 16400000, max: 18450000, rate: 0.07 }, { min: 18450000, max: 21850000, rate: 0.08 }, { min: 21850000, max: 26000000, rate: 0.09 }, { min: 26000000, max: 27700000, rate: 0.1 },
  { min: 27700000, max: 29350000, rate: 0.11 }, { min: 29350000, max: 31450000, rate: 0.12 }, { min: 31450000, max: 33950000, rate: 0.13 }, { min: 33950000, max: 37100000, rate: 0.14 },
  { min: 37100000, max: 41100000, rate: 0.15 }, { min: 41100000, max: 45800000, rate: 0.16 }, { min: 45800000, max: 49500000, rate: 0.17 }, { min: 49500000, max: 53800000, rate: 0.18 },
  { min: 53800000, max: 58500000, rate: 0.19 }, { min: 58500000, max: 64000000, rate: 0.2 }, { min: 64000000, max: 71000000, rate: 0.21 }, { min: 71000000, max: 80000000, rate: 0.22 },
  { min: 80000000, max: 93000000, rate: 0.23 }, { min: 93000000, max: 109000000, rate: 0.24 }, { min: 109000000, max: 129000000, rate: 0.25 }, { min: 129000000, max: 163000000, rate: 0.26 },
  { min: 163000000, max: 211000000, rate: 0.27 }, { min: 211000000, max: 374000000, rate: 0.28 }, { min: 374000000, max: 459000000, rate: 0.29 }, { min: 459000000, max: 555000000, rate: 0.3 },
  { min: 555000000, max: 704000000, rate: 0.31 }, { min: 704000000, max: 957000000, rate: 0.32 }, { min: 957000000, max: 1405000000, rate: 0.33 }, { min: 1405000000, max: Number.POSITIVE_INFINITY, rate: 0.34 }
];

const TER_TABLE_C = [
  { min: -1, max: 6600000, rate: 0 }, { min: 6600000, max: 6950000, rate: 0.0025 }, { min: 6950000, max: 7350000, rate: 0.005 }, { min: 7350000, max: 7800000, rate: 0.0075 },
  { min: 7800000, max: 8850000, rate: 0.01 }, { min: 8850000, max: 9800000, rate: 0.0125 }, { min: 9800000, max: 10950000, rate: 0.015 }, { min: 10950000, max: 11200000, rate: 0.0175 },
  { min: 11200000, max: 12050000, rate: 0.02 }, { min: 12050000, max: 12950000, rate: 0.03 }, { min: 12950000, max: 14150000, rate: 0.04 }, { min: 14150000, max: 15550000, rate: 0.05 },
  { min: 15550000, max: 17050000, rate: 0.06 }, { min: 17050000, max: 19500000, rate: 0.07 }, { min: 19500000, max: 22700000, rate: 0.08 }, { min: 22700000, max: 26600000, rate: 0.09 },
  { min: 26600000, max: 28100000, rate: 0.1 }, { min: 28100000, max: 30100000, rate: 0.11 }, { min: 30100000, max: 32600000, rate: 0.12 }, { min: 32600000, max: 35400000, rate: 0.13 },
  { min: 35400000, max: 38900000, rate: 0.14 }, { min: 38900000, max: 43000000, rate: 0.15 }, { min: 43000000, max: 47400000, rate: 0.16 }, { min: 47400000, max: 51200000, rate: 0.17 },
  { min: 51200000, max: 55800000, rate: 0.18 }, { min: 55800000, max: 60400000, rate: 0.19 }, { min: 60400000, max: 66700000, rate: 0.2 }, { min: 66700000, max: 74500000, rate: 0.21 },
  { min: 74500000, max: 83200000, rate: 0.22 }, { min: 83200000, max: 95600000, rate: 0.23 }, { min: 95600000, max: 110000000, rate: 0.24 }, { min: 110000000, max: 134000000, rate: 0.25 },
  { min: 134000000, max: 169000000, rate: 0.26 }, { min: 169000000, max: 221000000, rate: 0.27 }, { min: 221000000, max: 390000000, rate: 0.28 }, { min: 390000000, max: 463000000, rate: 0.29 },
  { min: 463000000, max: 561000000, rate: 0.3 }, { min: 561000000, max: 709000000, rate: 0.31 }, { min: 709000000, max: 965000000, rate: 0.32 }, { min: 965000000, max: 1419000000, rate: 0.33 },
  { min: 1419000000, max: Number.POSITIVE_INFINITY, rate: 0.34 }
];

function clamp(v, min, max) {
  return Math.min(max, Math.max(min, v));
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' }
  });
}
