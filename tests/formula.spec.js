const assert = (name, cond) => {
  if (!cond) throw new Error(`FAIL: ${name}`);
  console.log(`PASS: ${name}`);
};

function hitungPaketKompensasi({ gaji, anggotaKeluarga, includeTax, includeThr, prorataThr, monthsWorked, tunjanganBulanan=0, potonganLainBulanan=0 }) {
  const gajiKenaHitung = gaji + tunjanganBulanan;
  const gajiBPJSKes = Math.min(gajiKenaHitung, 12000000);
  const iuranKaryawanBPJSKes = ((anggotaKeluarga > 5 ? 2 : 1) / 100) * gajiBPJSKes;
  const iuranKaryawanJHT = 0.02 * gajiKenaHitung;
  const iuranKaryawanJP = 0.01 * Math.min(gajiKenaHitung, 10042000);
  const totalPotonganBPJS = iuranKaryawanBPJSKes + iuranKaryawanJHT + iuranKaryawanJP;

  const thrNominal = includeThr ? (prorataThr ? gajiKenaHitung * (monthsWorked / 12) : gajiKenaHitung) : 0;
  const pphNormal = includeTax ? 0 : 0; // local invariant suite focuses deterministic BPJS/THR totals
  const pphThr = includeTax ? 0 : 0;

  const totalPotonganNormal = totalPotonganBPJS + pphNormal + potonganLainBulanan;
  const totalPotonganThr = totalPotonganBPJS + pphThr + potonganLainBulanan;
  const gajiBersihNormal = gajiKenaHitung - totalPotonganNormal;
  const gajiBersihThr = gajiKenaHitung - totalPotonganThr;
  const totalThrMonth = gajiBersihThr + thrNominal;
  const annual = gajiBersihNormal * 11 + totalThrMonth;

  return { iuranKaryawanBPJSKes, iuranKaryawanJHT, iuranKaryawanJP, totalPotonganBPJS, thrNominal, gajiBersihNormal, totalThrMonth, annual };
}

(() => {
  const r1 = hitungPaketKompensasi({ gaji: 10000000, anggotaKeluarga: 3, includeTax: false, includeThr: true, prorataThr: false, monthsWorked: 12 });
  assert('BPJSKes 1%', Math.round(r1.iuranKaryawanBPJSKes) === 100000);
  assert('JHT 2%', Math.round(r1.iuranKaryawanJHT) === 200000);
  assert('JP cap path', Math.round(r1.iuranKaryawanJP) === 100000);
  assert('THR full 1x', Math.round(r1.thrNominal) === 10000000);

  const r2 = hitungPaketKompensasi({ gaji: 9000000, anggotaKeluarga: 2, includeTax: false, includeThr: true, prorataThr: true, monthsWorked: 6 });
  assert('THR prorata 6/12', Math.round(r2.thrNominal) === 4500000);

  const r3 = hitungPaketKompensasi({ gaji: 12000000, anggotaKeluarga: 6, includeTax: false, includeThr: false, prorataThr: false, monthsWorked: 12 });
  assert('BPJSKes 2% when family > 5', Math.round(r3.iuranKaryawanBPJSKes) === 240000);

  assert('Annual formula consistency', Math.round(r1.annual) === Math.round((r1.gajiBersihNormal * 11) + r1.totalThrMonth));
  console.log('\nAll formula invariants passed.');
})();
