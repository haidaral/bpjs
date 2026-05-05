const cleaveGaji = new Cleave('#gaji', {
  numeral: true,
  numeralThousandsGroupStyle: 'thousand',
  delimiter: '.',
  numeralDecimalMark: ',',
  numeralDecimalScale: 0,
  numeralPositiveOnly: true
});

const cleaveNewSalary = new Cleave('#newSalary', {
  numeral: true,
  numeralThousandsGroupStyle: 'thousand',
  delimiter: '.',
  numeralDecimalMark: ',',
  numeralDecimalScale: 0,
  numeralPositiveOnly: true
});
const cleaveCurrentAllowance = new Cleave('#currentAllowance', {
  numeral: true, numeralThousandsGroupStyle: 'thousand', delimiter: '.', numeralDecimalMark: ',', numeralDecimalScale: 0, numeralPositiveOnly: true
});
const cleaveCurrentOtherDeduction = new Cleave('#currentOtherDeduction', {
  numeral: true, numeralThousandsGroupStyle: 'thousand', delimiter: '.', numeralDecimalMark: ',', numeralDecimalScale: 0, numeralPositiveOnly: true
});
const cleaveNewAllowance = new Cleave('#newAllowance', {
  numeral: true, numeralThousandsGroupStyle: 'thousand', delimiter: '.', numeralDecimalMark: ',', numeralDecimalScale: 0, numeralPositiveOnly: true
});
const cleaveNewOtherDeduction = new Cleave('#newOtherDeduction', {
  numeral: true, numeralThousandsGroupStyle: 'thousand', delimiter: '.', numeralDecimalMark: ',', numeralDecimalScale: 0, numeralPositiveOnly: true
});
const cleaveTargetNet = new Cleave('#targetNet', {
  numeral: true, numeralThousandsGroupStyle: 'thousand', delimiter: '.', numeralDecimalMark: ',', numeralDecimalScale: 0, numeralPositiveOnly: true
});

const includeTaxInput = document.getElementById('includeTax');
const taxMethodInput = document.getElementById('taxMethod');
const ptkpStatusInput = document.getElementById('ptkpStatus');
const includeThrInput = document.getElementById('includeThr');
const prorataThrInput = document.getElementById('prorataThr');
const monthsWorkedInput = document.getElementById('monthsWorked');
const enableComparisonInput = document.getElementById('enableComparison');
const comparisonTypeInput = document.getElementById('comparisonType');
const newSalaryInput = document.getElementById('newSalary');
const newAllowanceInput = document.getElementById('newAllowance');
const newOtherDeductionInput = document.getElementById('newOtherDeduction');
const thrMonthInput = document.getElementById('thrMonth');
const saveScenarioBtn = document.getElementById('saveScenarioBtn');
const shareLinkBtn = document.getElementById('shareLinkBtn');
const exportCsvBtn = document.getElementById('exportCsvBtn');
const printBtn = document.getElementById('printBtn');
const scenarioStatus = document.getElementById('scenarioStatus');
const scenarioHistory = document.getElementById('scenarioHistory');
const sensitivityPctInput = document.getElementById('sensitivityPct');
const sensitivityLabel = document.getElementById('sensitivityLabel');
const accentChips = document.getElementById('accentChips');
const darkModeToggle = document.getElementById('darkModeToggle');
const presetProfiles = document.getElementById('presetProfiles');

let lastRunData = null;
let lastTargetNetCopyText = '';
const STORAGE_KEY = 'bpjs_scenarios_v1';
const MAX_SCENARIOS = 50;
const THEME_KEY = 'bpjs_theme_v1';

renderScenarioHistory();
initTheme();
hydrateFromUrlScenario();
scenarioHistory.addEventListener('click', onScenarioHistoryClick);
presetProfiles.addEventListener('click', onPresetClick);

sensitivityPctInput.addEventListener('input', function () {
  sensitivityLabel.textContent = `Rentang analisis: +/-${sensitivityPctInput.value}%`;
});

accentChips.addEventListener('click', function (e) {
  const btn = e.target.closest('.accent-chip');
  if (!btn) return;
  const accent = btn.dataset.accent;
  const current = getThemeState();
  const next = { ...current, accent };
  applyTheme(next);
  saveTheme(next);
});

darkModeToggle.addEventListener('click', function () {
  const current = getThemeState();
  const next = { ...current, dark: !current.dark };
  applyTheme(next);
  saveTheme(next);
});

document.addEventListener('click', async function (e) {
  const btn = e.target.closest('#copyTargetNetBtn');
  if (!btn) return;
  const statusEl = document.getElementById('copyTargetNetStatus');
  if (!lastTargetNetCopyText) {
    if (statusEl) statusEl.textContent = 'No result to copy';
    return;
  }
  try {
    await navigator.clipboard.writeText(lastTargetNetCopyText);
    if (statusEl) statusEl.textContent = 'Copied!';
  } catch {
    if (statusEl) statusEl.textContent = 'Copy failed';
  }
});

includeTaxInput.addEventListener('change', function () {
  const enabled = includeTaxInput.checked;
  taxMethodInput.disabled = !enabled;
  ptkpStatusInput.disabled = !enabled;
  includeThrInput.disabled = !enabled;
  prorataThrInput.disabled = !enabled;
  if (!enabled) {
    includeThrInput.checked = false;
    prorataThrInput.checked = false;
    monthsWorkedInput.value = '12';
    monthsWorkedInput.disabled = true;
  }
});

includeThrInput.addEventListener('change', function () {
  if (!includeThrInput.checked) {
    prorataThrInput.checked = false;
    monthsWorkedInput.value = '12';
    monthsWorkedInput.disabled = true;
    return;
  }
  monthsWorkedInput.disabled = !prorataThrInput.checked;
});

prorataThrInput.addEventListener('change', function () {
  monthsWorkedInput.disabled = !prorataThrInput.checked;
  if (!prorataThrInput.checked) monthsWorkedInput.value = '12';
});

enableComparisonInput.addEventListener('change', function () {
  const enabled = enableComparisonInput.checked;
  comparisonTypeInput.disabled = !enabled;
  newSalaryInput.disabled = !enabled;
  newAllowanceInput.disabled = !enabled;
  newOtherDeductionInput.disabled = !enabled;
  if (!enabled) {
    newSalaryInput.value = '';
    cleaveNewSalary.setRawValue('');
    newAllowanceInput.value = '';
    newOtherDeductionInput.value = '';
    cleaveNewAllowance.setRawValue('');
    cleaveNewOtherDeduction.setRawValue('');
  }
});

document.getElementById('bpjsForm').addEventListener('submit', async function (e) {
  e.preventDefault();

  const gaji = Number.parseFloat(cleaveGaji.getRawValue());
  const anggotaKeluarga = Number.parseInt(document.getElementById('anggotaKeluarga').value, 10);
  const includeTax = includeTaxInput.checked;
  const taxMethod = taxMethodInput.value;
  const ptkpStatus = ptkpStatusInput.value;
  const includeThr = includeThrInput.checked;
  const prorataThr = prorataThrInput.checked;
  const monthsWorked = Number.parseInt(monthsWorkedInput.value, 10);
  const currentAllowance = Number.parseFloat(cleaveCurrentAllowance.getRawValue()) || 0;
  const currentOtherDeduction = Number.parseFloat(cleaveCurrentOtherDeduction.getRawValue()) || 0;
  const enableComparison = enableComparisonInput.checked;
  const comparisonType = comparisonTypeInput.value;
  const newSalary = Number.parseFloat(cleaveNewSalary.getRawValue());
  const newAllowance = Number.parseFloat(cleaveNewAllowance.getRawValue()) || 0;
  const newOtherDeduction = Number.parseFloat(cleaveNewOtherDeduction.getRawValue()) || 0;
  const targetNet = Number.parseFloat(cleaveTargetNet.getRawValue()) || 0;
  const thrMonth = Number.parseInt(thrMonthInput.value, 10);
  const useWorkerApi = shouldUseWorkerApi();

  if (Number.isNaN(gaji) || Number.isNaN(anggotaKeluarga) || gaji <= 0 || anggotaKeluarga <= 0) {
    showAlert('Mohon masukkan nilai gaji dan anggota keluarga yang valid.');
    return;
  }

  if (enableComparison && (Number.isNaN(newSalary) || newSalary <= 0)) {
    showAlert('Mohon isi gaji baru yang valid untuk fitur perbandingan.');
    return;
  }

  if (includeThr && prorataThr && (Number.isNaN(monthsWorked) || monthsWorked < 1 || monthsWorked > 12)) {
    showAlert('Masa kerja THR prorata harus antara 1 sampai 12 bulan.');
    return;
  }

  let current;
  let comparison = null;
  let backendModeNote = '';

  if (useWorkerApi) {
    try {
      const currentPayload = { gaji, anggotaKeluarga, includeTax, taxMethod, ptkpStatus, includeThr, prorataThr, monthsWorked, tunjanganBulanan: currentAllowance, potonganLainBulanan: currentOtherDeduction };
      const comparisonPayload = { gaji: newSalary, anggotaKeluarga, includeTax, taxMethod, ptkpStatus, includeThr, prorataThr, monthsWorked, tunjanganBulanan: newAllowance, potonganLainBulanan: newOtherDeduction };
      current = await calculateViaWorkerApi(currentPayload);
      if (enableComparison) comparison = await calculateViaWorkerApi(comparisonPayload);
      backendModeNote = 'API_OK';
    } catch {
      current = hitungPaketKompensasi(gaji, anggotaKeluarga, includeTax, taxMethod, ptkpStatus, includeThr, prorataThr, monthsWorked, currentAllowance, currentOtherDeduction);
      comparison = enableComparison
        ? hitungPaketKompensasi(newSalary, anggotaKeluarga, includeTax, taxMethod, ptkpStatus, includeThr, prorataThr, monthsWorked, newAllowance, newOtherDeduction)
        : null;
      backendModeNote = 'FALLBACK_LOCAL';
    }
  } else {
    current = hitungPaketKompensasi(gaji, anggotaKeluarga, includeTax, taxMethod, ptkpStatus, includeThr, prorataThr, monthsWorked, currentAllowance, currentOtherDeduction);
    comparison = enableComparison
      ? hitungPaketKompensasi(newSalary, anggotaKeluarga, includeTax, taxMethod, ptkpStatus, includeThr, prorataThr, monthsWorked, newAllowance, newOtherDeduction)
      : null;
  }

  const pajakItem = includeTax
    ? `<li class="list-group-item"><strong>PPh 21 Bulan Normal (tanpa THR):</strong> ${formatRupiah(current.pphNormal)}</li>
       <li class="list-group-item"><strong>PPh 21 Bulan THR:</strong> ${formatRupiah(current.pphThrMonth)}</li>`
    : '';

  const taxDetail = includeTax && current.taxResult
    ? `<div class="alert alert-info mt-3 mb-0">
        <strong>Detail Pajak:</strong><br>
        Metode: ${current.taxResult.metodeLabel}<br>
        THR: ${current.taxResult.includeThr ? 'Disertakan (1x gaji)' : 'Tidak disertakan'}<br>
        THR Dipakai Hitung: ${formatRupiah(current.taxResult.thrNominal)}<br>
        Dasar Bruto Bulan Normal: ${formatRupiah(current.taxResult.dasarBrutoBulananNormal)}<br>
        Dasar Bruto Bulan THR: ${formatRupiah(current.taxResult.dasarBrutoBulanThr)}<br>
        Kategori TER: ${current.taxResult.kategoriTer || '-'}<br>
        Tarif TER Bulan Normal: ${current.taxResult.terRateNormal != null ? (current.taxResult.terRateNormal * 100).toFixed(2) + '%' : '-'}<br>
        Tarif TER Bulan THR: ${current.taxResult.terRateThr != null ? (current.taxResult.terRateThr * 100).toFixed(2) + '%' : '-'}<br>
        PTKP: ${current.taxResult.statusLabel} (${formatRupiah(current.taxResult.ptkpTahunan)} / tahun)
      </div>`
    : '';

  const comparisonHtml = comparison
    ? buildComparisonHtml(current, comparison, comparisonType)
    : '';
  const chartHtml = buildCashflowChartHtml(current, comparison, thrMonth);
  const assumptionsHtml = buildAssumptionsHtml({
    includeTax, taxMethod, ptkpStatus, includeThr, prorataThr, monthsWorked, thrMonth, currentAllowance, currentOtherDeduction, enableComparison
  });
  const ratesHtml = buildRatesHtml(current);
  const offerScoreHtml = buildOfferScoreHtml(current, comparison);
  const targetNetHtml = targetNet > 0
    ? buildTargetNetHtml({
      targetNet,
      currentGross: gaji,
      args: { anggotaKeluarga, includeTax, taxMethod, ptkpStatus, includeThr, prorataThr, monthsWorked, tunjanganBulanan: currentAllowance, potonganLainBulanan: currentOtherDeduction }
    })
    : '';
  const sensitivityHtml = enableComparison ? buildSensitivityHtml({
    newSalary, sensitivityPct: Number.parseInt(sensitivityPctInput.value, 10), anggotaKeluarga, includeTax, taxMethod, ptkpStatus, includeThr, prorataThr, monthsWorked, newAllowance, newOtherDeduction
  }) : '';

  const hasilDiv = document.getElementById('hasil');
  const backendBadge = buildBackendBadge(useWorkerApi, backendModeNote);
  hasilDiv.innerHTML = `
    ${backendBadge}
    ${assumptionsHtml}
    <div class="card shadow-lg">
      <div class="card-body p-4 p-md-5">
        <h4 class="card-title text-center mb-4">Hasil Perhitungan</h4>
        <ul class="list-group list-group-flush">
          <li class="list-group-item"><strong>Iuran BPJS Kesehatan (Karyawan):</strong> ${formatRupiah(current.iuranKaryawanBPJSKes)}</li>
          <li class="list-group-item"><strong>Iuran JHT (Karyawan):</strong> ${formatRupiah(current.iuranKaryawanJHT)}</li>
          <li class="list-group-item"><strong>Iuran JP (Karyawan):</strong> ${formatRupiah(current.iuranKaryawanJP)}</li>
          <li class="list-group-item"><strong>Tunjangan Bulanan:</strong> ${formatRupiah(current.tunjanganBulanan)}</li>
          <li class="list-group-item"><strong>Potongan Lain Bulanan:</strong> ${formatRupiah(current.potonganLainBulanan)}</li>
          ${pajakItem}
          <li class="list-group-item"><strong>Total Potongan BPJS:</strong> ${formatRupiah(current.totalPotonganBPJS)}</li>
          <li class="list-group-item"><strong>Total Potongan Bulan Normal:</strong> ${formatRupiah(current.totalPotonganNormal)}</li>
          <li class="list-group-item"><strong>Total Potongan Bulan THR:</strong> ${formatRupiah(current.totalPotonganThrMonth)}</li>
        </ul>
        <div class="mt-4">
          <p><strong>Investasi dari Karyawan (JHT + JP):</strong> ${formatRupiah(current.totalInvestasiKaryawan)}</p>
          <p><strong>Investasi dari Perusahaan (JHT + JP):</strong> ${formatRupiah(current.totalInvestasiPerusahaan)}</p>
          <p class="highlight"><strong>Total Investasi per Bulan:</strong> ${formatRupiah(current.totalInvestasi)}</p>
          <hr />
          <p><strong>Total Bruto Bulanan (Gaji + Tunjangan):</strong> ${formatRupiah(current.gajiKenaHitung)}</p>
          <p><strong>Gaji Bersih Anda (Bulan Normal):</strong> ${formatRupiah(current.gajiBersihNormal)}</p>
          <p><strong>Gaji Bersih Bulan THR:</strong> ${formatRupiah(current.gajiBersihThrMonth)}</p>
          <p><strong>THR Diterima:</strong> ${formatRupiah(current.thrDiterima)}</p>
          <p class="highlight"><strong>Total Diterima Bulan THR (Net + THR):</strong> ${formatRupiah(current.totalDiterimaDenganThr)}</p>
          <p class="highlight"><strong>Total Take-Home Tahunan (11 Bulan Normal + 1 Bulan THR):</strong> ${formatRupiah(current.totalTakeHomeTahunan)}</p>
          ${ratesHtml}
          ${offerScoreHtml}
          ${taxDetail}
        </div>
      </div>
    </div>
    ${comparisonHtml}
    ${targetNetHtml}
    ${sensitivityHtml}
    ${chartHtml}
  `;

  lastRunData = {
    timestamp: new Date().toISOString(),
    input: { gaji, anggotaKeluarga, includeTax, taxMethod, ptkpStatus, includeThr, prorataThr, monthsWorked, currentAllowance, currentOtherDeduction, enableComparison, comparisonType, newSalary, newAllowance, newOtherDeduction, thrMonth },
    current,
    comparison
  };
  scenarioStatus.textContent = `Perhitungan terakhir: ${new Date().toLocaleString('id-ID')}`;

  hasilDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
});

async function calculateViaWorkerApi(payload) {
  const res = await fetch('/api/calculate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Worker API request failed');
  const data = await res.json();
  if (!data || !data.result) throw new Error('Worker API invalid response');
  return {
    gaji: data.input.gaji,
    tunjanganBulanan: data.input.tunjanganBulanan || 0,
    potonganLainBulanan: data.input.potonganLainBulanan || 0,
    gajiKenaHitung: data.result.gajiKenaHitung,
    iuranKaryawanBPJSKes: data.result.iuranKaryawanBPJSKes,
    iuranKaryawanJHT: data.result.iuranKaryawanJHT,
    iuranKaryawanJP: data.result.iuranKaryawanJP,
    totalInvestasiKaryawan: data.result.totalInvestasiKaryawan,
    totalInvestasiPerusahaan: data.result.totalInvestasiPerusahaan,
    totalInvestasi: data.result.totalInvestasi,
    totalPotonganBPJS: data.result.totalPotonganBPJS,
    totalPotonganNormal: data.result.totalPotonganNormal,
    totalPotonganThrMonth: data.result.totalPotonganThrMonth,
    pphNormal: data.result.pphNormal || 0,
    pphThrMonth: data.result.pphThrMonth || 0,
    totalPotonganFinal: data.result.totalPotonganFinal,
    gajiBersihNormal: data.result.gajiBersihNormal,
    gajiBersihThrMonth: data.result.gajiBersihThrMonth,
    thrDiterima: data.result.thrNominal,
    totalDiterimaDenganThr: data.result.totalDiterimaDenganThr,
    totalTakeHomeTahunan: data.result.totalTakeHomeTahunan,
    taxResult: data.result.taxResult || null
  };
}

function buildBackendBadge(useWorkerApi, backendModeNote) {
  if (!useWorkerApi) {
    return `<div class="mb-3"><span class="badge text-bg-secondary">Backend: Local Engine</span></div>`;
  }
  if (backendModeNote === 'API_OK') {
    return `<div class="mb-3"><span class="badge text-bg-success">Backend: Live API Connected</span></div>`;
  }
  if (backendModeNote === 'FALLBACK_LOCAL') {
    return `<div class="mb-3"><span class="badge text-bg-warning">Backend: API Unavailable, Local Fallback Active</span></div>`;
  }
  return `<div class="mb-3"><span class="badge text-bg-secondary">Backend: Unknown Status</span></div>`;
}

function shouldUseWorkerApi() {
  const host = window.location.hostname;
  if (host === 'bpjs-payroll-simulator.pages.dev' || host.endsWith('.bpjs-payroll-simulator.pages.dev')) {
    return true;
  }
  return false;
}

function hitungPaketKompensasi(gaji, anggotaKeluarga, includeTax, taxMethod, ptkpStatus, includeThr, prorataThr, monthsWorked, tunjanganBulanan, potonganLainBulanan) {
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

  const thrNominal = includeThr ? (prorataThr ? (gajiKenaHitung * Math.min(Math.max(monthsWorked, 1), 12) / 12) : gajiKenaHitung) : 0;
  const taxResult = includeTax ? hitungPPh21Bulanan(gajiKenaHitung, taxMethod, ptkpStatus, includeThr, thrNominal) : null;
  const pphNormal = taxResult ? taxResult.pphBulananNormal : 0;
  const pphThrMonth = taxResult ? taxResult.pphBulanThr : 0;

  const totalPotonganNormal = totalPotonganBPJS + pphNormal + potonganLainBulanan;
  const totalPotonganThrMonth = totalPotonganBPJS + pphThrMonth + potonganLainBulanan;
  const totalPotonganFinal = includeThr ? totalPotonganThrMonth : totalPotonganNormal;
  const gajiBersihNormal = gajiKenaHitung - (totalPotonganBPJS + pphNormal + potonganLainBulanan);
  const gajiBersihThrMonth = gajiKenaHitung - (totalPotonganBPJS + pphThrMonth + potonganLainBulanan);
  const thrDiterima = thrNominal;
  const totalDiterimaDenganThr = gajiBersihThrMonth + thrDiterima;
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
    thrDiterima,
    totalDiterimaDenganThr,
    totalTakeHomeTahunan,
    taxResult
  };
}

function buildComparisonHtml(current, next, comparisonType) {
  const deltaNetNormal = next.gajiBersihNormal - current.gajiBersihNormal;
  const deltaNetThrMonth = next.gajiBersihThrMonth - current.gajiBersihThrMonth;
  const deltaTotalThr = next.totalDiterimaDenganThr - current.totalDiterimaDenganThr;
  const deltaTahunan = next.totalTakeHomeTahunan - current.totalTakeHomeTahunan;
  const skenario = comparisonType === 'new_company' ? 'Pindah ke perusahaan baru' : 'Naik gaji di perusahaan yang sama';

  return `
    <div class="card shadow-sm mt-4">
      <div class="card-body p-4">
        <h5 class="mb-3">Perbandingan Gaji: ${skenario}</h5>
        <div class="table-responsive">
          <table class="table table-bordered align-middle mb-0">
            <thead>
              <tr>
                <th>Komponen</th>
                <th>Sekarang</th>
                <th>Skenario Baru</th>
                <th>Selisih</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Gaji Kotor Bulanan</td>
                <td>${formatRupiah(current.gaji)}</td>
                <td>${formatRupiah(next.gaji)}</td>
                <td>${formatSigned(delta(next.gaji, current.gaji))}</td>
              </tr>
              <tr>
                <td>Total Bruto Bulanan (Gaji + Tunjangan)</td>
                <td>${formatRupiah(current.gajiKenaHitung)}</td>
                <td>${formatRupiah(next.gajiKenaHitung)}</td>
                <td>${formatSigned(delta(next.gajiKenaHitung, current.gajiKenaHitung))}</td>
              </tr>
              <tr>
                <td>Potongan Lain Bulanan</td>
                <td>${formatRupiah(current.potonganLainBulanan)}</td>
                <td>${formatRupiah(next.potonganLainBulanan)}</td>
                <td>${formatSigned(delta(next.potonganLainBulanan, current.potonganLainBulanan))}</td>
              </tr>
              <tr>
                <td>Gaji Bersih Bulan Normal</td>
                <td>${formatRupiah(current.gajiBersihNormal)}</td>
                <td>${formatRupiah(next.gajiBersihNormal)}</td>
                <td>${formatSigned(deltaNetNormal)}</td>
              </tr>
              <tr>
                <td>Gaji Bersih Bulan THR</td>
                <td>${formatRupiah(current.gajiBersihThrMonth)}</td>
                <td>${formatRupiah(next.gajiBersihThrMonth)}</td>
                <td>${formatSigned(deltaNetThrMonth)}</td>
              </tr>
              <tr>
                <td>Total Diterima Bulan THR (Net + THR)</td>
                <td>${formatRupiah(current.totalDiterimaDenganThr)}</td>
                <td>${formatRupiah(next.totalDiterimaDenganThr)}</td>
                <td><strong>${formatSigned(deltaTotalThr)}</strong></td>
              </tr>
              <tr>
                <td>Total Take-Home Tahunan</td>
                <td>${formatRupiah(current.totalTakeHomeTahunan)}</td>
                <td>${formatRupiah(next.totalTakeHomeTahunan)}</td>
                <td><strong>${formatSigned(deltaTahunan)}</strong></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

function buildCashflowChartHtml(current, comparison, thrMonth) {
  const bulan = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const currentSeries = buildSeries(current, thrMonth);
  const compareSeries = comparison ? buildSeries(comparison, thrMonth) : null;
  const maxVal = Math.max(...currentSeries, ...(compareSeries || [0]));

  const currentBars = currentSeries.map((v, idx) => {
    const h = maxVal > 0 ? Math.max(10, Math.round((v / maxVal) * 140)) : 10;
    const thrClass = idx === thrMonth ? ' thr' : '';
    return `<div class="cf-col"><div class="cf-bar current${thrClass}" style="height:${h}px" title="${bulan[idx]}: ${formatRupiah(v)}"></div><span>${bulan[idx]}</span></div>`;
  }).join('');

  const compareBars = compareSeries ? compareSeries.map((v, idx) => {
    const h = maxVal > 0 ? Math.max(10, Math.round((v / maxVal) * 140)) : 10;
    const thrClass = idx === thrMonth ? ' thr' : '';
    return `<div class="cf-col"><div class="cf-bar compare${thrClass}" style="height:${h}px" title="${bulan[idx]}: ${formatRupiah(v)}"></div><span>${bulan[idx]}</span></div>`;
  }).join('') : '';

  return `
    <div class="card shadow-sm mt-4">
      <div class="card-body p-4">
        <h5 class="mb-3">Timeline Cashflow Jan-Des</h5>
        <div class="cf-legend mb-2">
          <span class="dot current"></span> Skenario Saat Ini
          ${comparison ? '<span class="dot compare ms-3"></span> Skenario Baru' : ''}
          <span class="dot thr ms-3"></span> Bulan THR
        </div>
        <div class="cf-scroll">
          <div class="cf-grid">${currentBars}</div>
          ${comparison ? `<div class="cf-grid mt-3">${compareBars}</div>` : ''}
        </div>
      </div>
    </div>
  `;
}

function buildSeries(pkg, thrMonth) {
  const arr = Array(12).fill(pkg.gajiBersihNormal);
  arr[thrMonth] = pkg.totalDiterimaDenganThr;
  return arr;
}

function buildAssumptionsHtml(data) {
  const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  return `
    <div class="card shadow-sm mb-3">
      <div class="card-body p-3">
        <strong>Asumsi Aktif</strong>
        <div class="small mt-2">
          Pajak: ${data.includeTax ? 'Aktif' : 'Nonaktif'} | Metode: ${data.includeTax ? data.taxMethod.toUpperCase() : '-'} | PTKP: ${labelPtkpStatus(data.ptkpStatus)}<br>
          THR: ${data.includeThr ? 'Aktif' : 'Nonaktif'}${data.includeThr ? ` | Prorata: ${data.prorataThr ? `Ya (${data.monthsWorked} bulan)` : 'Tidak'}` : ''}<br>
          Bulan THR: ${monthNames[data.thrMonth]} | Tunjangan Saat Ini: ${formatRupiah(data.currentAllowance)} | Potongan Lain Saat Ini: ${formatRupiah(data.currentOtherDeduction)}<br>
          Perbandingan: ${data.enableComparison ? 'Aktif' : 'Nonaktif'}
        </div>
      </div>
    </div>
  `;
}

function buildRatesHtml(current) {
  const base = current.gajiKenaHitung || 1;
  const effectiveTaxNormal = (current.pphNormal / base) * 100;
  const effectiveTaxThr = (current.pphThrMonth / (base + current.thrDiterima || 1)) * 100;
  const totalDeductionRate = ((current.totalPotonganBPJS + current.pphNormal + current.potonganLainBulanan) / base) * 100;
  const annualGross = (base * 12) + current.thrDiterima;
  const annualNet = (current.gajiBersihNormal * 11) + current.totalDiterimaDenganThr;
  const annualEffRate = annualGross > 0 ? ((annualGross - annualNet) / annualGross) * 100 : 0;
  return `
    <div class="rate-badges mt-3">
      <span class="badge text-bg-primary">Efektif PPh21 Normal: ${effectiveTaxNormal.toFixed(2)}%</span>
      <span class="badge text-bg-warning">Efektif PPh21 Bulan THR: ${effectiveTaxThr.toFixed(2)}%</span>
      <span class="badge text-bg-danger">Rate Total Potongan: ${totalDeductionRate.toFixed(2)}%</span>
      <span class="badge text-bg-success">Rate Efektif Tahunan: ${annualEffRate.toFixed(2)}%</span>
    </div>
  `;
}

function buildOfferScoreHtml(current, comparison) {
  const currentScore = computeOfferScore(current);
  const comparisonScore = comparison ? computeOfferScore(comparison) : null;
  return `
    <div class="card shadow-sm mt-3">
      <div class="card-body p-3">
        <h6 class="mb-2">Offer Score</h6>
        <div class="small text-muted mb-2">Skor ringkas dari take-home tahunan, cashflow bulan THR, dan beban potongan.</div>
        <div class="d-flex flex-wrap gap-2">
          <span class="badge text-bg-primary">Saat Ini: ${currentScore}/100</span>
          ${comparisonScore != null ? `<span class="badge text-bg-success">Skenario Baru: ${comparisonScore}/100</span>` : ''}
        </div>
      </div>
    </div>
  `;
}

function computeOfferScore(pkg) {
  const annualGross = (pkg.gajiKenaHitung * 12) + pkg.thrDiterima;
  const annualNetRatio = annualGross > 0 ? pkg.totalTakeHomeTahunan / annualGross : 0;
  const thrPower = pkg.gajiKenaHitung > 0 ? pkg.totalDiterimaDenganThr / pkg.gajiKenaHitung : 0;
  const deductionBurden = pkg.gajiKenaHitung > 0 ? pkg.totalPotonganNormal / pkg.gajiKenaHitung : 0;
  const scoreRaw = (annualNetRatio * 60) + (Math.min(thrPower / 2, 1) * 25) + ((1 - Math.min(deductionBurden, 1)) * 15);
  return Math.max(0, Math.min(100, Math.round(scoreRaw)));
}

function onPresetClick(e) {
  const btn = e.target.closest('.preset-btn');
  if (!btn) return;
  const ptkp = btn.dataset.ptkp || 'TK0';
  includeTaxInput.checked = true;
  includeTaxInput.dispatchEvent(new Event('change'));
  ptkpStatusInput.value = ptkp;
  taxMethodInput.value = 'ter';
  includeThrInput.checked = true;
  includeThrInput.dispatchEvent(new Event('change'));
  prorataThrInput.checked = false;
  prorataThrInput.dispatchEvent(new Event('change'));
  monthsWorkedInput.value = '12';
}

function buildSensitivityHtml(ctx) {
  const pct = Math.max(0, ctx.sensitivityPct || 10);
  const lowSalary = ctx.newSalary * (1 - pct / 100);
  const highSalary = ctx.newSalary * (1 + pct / 100);
  const low = hitungPaketKompensasi(lowSalary, ctx.anggotaKeluarga, ctx.includeTax, ctx.taxMethod, ctx.ptkpStatus, ctx.includeThr, ctx.prorataThr, ctx.monthsWorked, ctx.newAllowance, ctx.newOtherDeduction);
  const mid = hitungPaketKompensasi(ctx.newSalary, ctx.anggotaKeluarga, ctx.includeTax, ctx.taxMethod, ctx.ptkpStatus, ctx.includeThr, ctx.prorataThr, ctx.monthsWorked, ctx.newAllowance, ctx.newOtherDeduction);
  const high = hitungPaketKompensasi(highSalary, ctx.anggotaKeluarga, ctx.includeTax, ctx.taxMethod, ctx.ptkpStatus, ctx.includeThr, ctx.prorataThr, ctx.monthsWorked, ctx.newAllowance, ctx.newOtherDeduction);
  return `
    <div class="card shadow-sm mt-4">
      <div class="card-body p-4">
        <h5 class="mb-3">Sensitivity Gaji Baru (+/-${pct}%)</h5>
        <div class="table-responsive">
          <table class="table table-bordered mb-0">
            <thead><tr><th>Skenario</th><th>Gaji</th><th>Net Normal</th><th>Take-Home Tahunan</th></tr></thead>
            <tbody>
              <tr><td>Low</td><td>${formatRupiah(lowSalary)}</td><td>${formatRupiah(low.gajiBersihNormal)}</td><td>${formatRupiah(low.totalTakeHomeTahunan)}</td></tr>
              <tr><td>Base</td><td>${formatRupiah(ctx.newSalary)}</td><td>${formatRupiah(mid.gajiBersihNormal)}</td><td>${formatRupiah(mid.totalTakeHomeTahunan)}</td></tr>
              <tr><td>High</td><td>${formatRupiah(highSalary)}</td><td>${formatRupiah(high.gajiBersihNormal)}</td><td>${formatRupiah(high.totalTakeHomeTahunan)}</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

function buildTargetNetHtml(ctx) {
  const estimate = findRequiredGrossForTargetNet(ctx.targetNet, ctx.args);
  if (!estimate) {
    lastTargetNetCopyText = '';
    return `
      <div class="card shadow-sm mt-4">
        <div class="card-body p-4">
          <h5 class="mb-2">Target Net Finder</h5>
          <p class="mb-0 text-muted">Target belum bisa dicapai dalam rentang estimasi saat ini. Coba turunkan target atau cek potongan.</p>
        </div>
      </div>
    `;
  }

  const delta = estimate.requiredGross - ctx.currentGross;
  lastTargetNetCopyText = [
    `Target Net Bulanan: ${formatRupiah(ctx.targetNet)}`,
    `Estimasi Gaji Bruto Dibutuhkan: ${formatRupiah(estimate.requiredGross)}`,
    `Selisih dari Gaji Saat Ini: ${formatSigned(delta)}`
  ].join('\n');
  return `
    <div class="card shadow-sm mt-4">
      <div class="card-body p-4">
        <h5 class="mb-2">Target Net Finder</h5>
        <p class="mb-1"><strong>Target Net Bulanan:</strong> ${formatRupiah(ctx.targetNet)}</p>
        <p class="mb-1"><strong>Estimasi Gaji Bruto Dibutuhkan:</strong> ${formatRupiah(estimate.requiredGross)}</p>
        <p class="mb-0"><strong>Selisih dari Gaji Saat Ini:</strong> ${formatSigned(delta)}</p>
        <div class="mt-3 d-flex align-items-center gap-2">
          <button type="button" id="copyTargetNetBtn" class="btn btn-sm btn-outline-secondary">Copy Result</button>
          <small id="copyTargetNetStatus" class="text-muted"></small>
        </div>
      </div>
    </div>
  `;
}

function findRequiredGrossForTargetNet(targetNet, args) {
  const maxGross = 500000000;
  let lo = 1;
  let hi = maxGross;

  const hiResult = hitungPaketKompensasi(hi, args.anggotaKeluarga, args.includeTax, args.taxMethod, args.ptkpStatus, args.includeThr, args.prorataThr, args.monthsWorked, args.tunjanganBulanan, args.potonganLainBulanan);
  if (hiResult.gajiBersihNormal < targetNet) return null;

  for (let i = 0; i < 60; i += 1) {
    const mid = (lo + hi) / 2;
    const res = hitungPaketKompensasi(mid, args.anggotaKeluarga, args.includeTax, args.taxMethod, args.ptkpStatus, args.includeThr, args.prorataThr, args.monthsWorked, args.tunjanganBulanan, args.potonganLainBulanan);
    if (res.gajiBersihNormal >= targetNet) {
      hi = mid;
    } else {
      lo = mid;
    }
  }

  const requiredGross = Math.ceil(hi / 1000) * 1000;
  const verify = hitungPaketKompensasi(requiredGross, args.anggotaKeluarga, args.includeTax, args.taxMethod, args.ptkpStatus, args.includeThr, args.prorataThr, args.monthsWorked, args.tunjanganBulanan, args.potonganLainBulanan);
  return { requiredGross, estimatedNet: verify.gajiBersihNormal };
}

function delta(a, b) {
  return a - b;
}

function formatSigned(value) {
  const prefix = value > 0 ? '+' : '';
  return `${prefix}${formatRupiah(value)}`;
}

saveScenarioBtn.addEventListener('click', function () {
  if (!lastRunData) {
    scenarioStatus.textContent = 'Belum ada hasil untuk disimpan.';
    return;
  }
  const existing = parseSafeJson(localStorage.getItem(STORAGE_KEY), []);
  existing.push({ ...lastRunData, name: `Skenario ${existing.length + 1}` });
  while (existing.length > MAX_SCENARIOS) existing.shift();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
  renderScenarioHistory();
  scenarioStatus.textContent = `Skenario tersimpan. Total tersimpan: ${existing.length}`;
});

shareLinkBtn.addEventListener('click', async function () {
  const payload = getCurrentInputSnapshot();
  if (!payload || !payload.gaji || payload.gaji <= 0) {
    scenarioStatus.textContent = 'Isi minimal gaji dulu sebelum share link.';
    return;
  }
  const url = buildShareUrl(payload);
  try {
    await navigator.clipboard.writeText(url);
    scenarioStatus.textContent = 'Share link copied.';
  } catch {
    scenarioStatus.textContent = `Share link: ${url}`;
  }
});

exportCsvBtn.addEventListener('click', function () {
  if (!lastRunData) {
    scenarioStatus.textContent = 'Belum ada hasil untuk diexport.';
    return;
  }
  const rows = buildCsvRows(lastRunData);
  const csv = rows.map((r) => r.map(csvEscape).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `simulasi-bpjs-${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
  scenarioStatus.textContent = 'CSV berhasil diexport.';
});

printBtn.addEventListener('click', function () {
  window.print();
});

function buildCsvRows(data) {
  const rows = [
    ['timestamp', data.timestamp],
    ['gaji_sekarang', data.current.gaji],
    ['net_normal_sekarang', data.current.gajiBersihNormal],
    ['net_thr_month_sekarang', data.current.gajiBersihThrMonth],
    ['thr_sekarang', data.current.thrDiterima],
    ['total_thr_month_sekarang', data.current.totalDiterimaDenganThr],
    ['take_home_tahunan_sekarang', data.current.totalTakeHomeTahunan]
  ];
  if (data.comparison) {
    rows.push(
      ['gaji_baru', data.comparison.gaji],
      ['net_normal_baru', data.comparison.gajiBersihNormal],
      ['net_thr_month_baru', data.comparison.gajiBersihThrMonth],
      ['thr_baru', data.comparison.thrDiterima],
      ['total_thr_month_baru', data.comparison.totalDiterimaDenganThr],
      ['take_home_tahunan_baru', data.comparison.totalTakeHomeTahunan]
    );
  }
  return [['field', 'value'], ...rows];
}

function renderScenarioHistory() {
  const all = parseSafeJson(localStorage.getItem(STORAGE_KEY), []);
  if (!all.length) {
    scenarioHistory.innerHTML = 'Belum ada skenario tersimpan.';
    return;
  }
  scenarioHistory.innerHTML = all.map((s, i) => `
    <div class="d-flex justify-content-between align-items-center border rounded p-2 mb-2">
      <div>
        <strong>${escapeHtml(s.name || `Skenario ${i + 1}`)}</strong><br>
        <small>${escapeHtml(new Date(s.timestamp).toLocaleString('id-ID'))}</small>
      </div>
      <div class="d-flex gap-1">
        <button class="btn btn-sm btn-outline-primary" data-action="load" data-idx="${i}">Load</button>
        <button class="btn btn-sm btn-outline-secondary" data-action="rename" data-idx="${i}">Rename</button>
        <button class="btn btn-sm btn-outline-danger" data-action="delete" data-idx="${i}">Delete</button>
      </div>
    </div>
  `).join('');
}

function onScenarioHistoryClick(e) {
  const btn = e.target.closest('button[data-action]');
  if (!btn) return;
  const idx = Number.parseInt(btn.dataset.idx, 10);
  const action = btn.dataset.action;
  if (action === 'load') loadScenario(idx);
  if (action === 'rename') renameScenario(idx);
  if (action === 'delete') deleteScenario(idx);
}

function loadScenario(idx) {
  const all = parseSafeJson(localStorage.getItem(STORAGE_KEY), []);
  const s = all[idx];
  if (!s) return;
  const i = s.input;
  cleaveGaji.setRawValue(i.gaji || 0);
  document.getElementById('anggotaKeluarga').value = i.anggotaKeluarga || 1;
  includeTaxInput.checked = !!i.includeTax; includeTaxInput.dispatchEvent(new Event('change'));
  taxMethodInput.value = i.taxMethod || 'ter';
  ptkpStatusInput.value = i.ptkpStatus || 'TK0';
  includeThrInput.checked = !!i.includeThr; includeThrInput.dispatchEvent(new Event('change'));
  prorataThrInput.checked = !!i.prorataThr; prorataThrInput.dispatchEvent(new Event('change'));
  monthsWorkedInput.value = i.monthsWorked || 12;
  cleaveCurrentAllowance.setRawValue(i.currentAllowance || 0);
  cleaveCurrentOtherDeduction.setRawValue(i.currentOtherDeduction || 0);
  enableComparisonInput.checked = !!i.enableComparison; enableComparisonInput.dispatchEvent(new Event('change'));
  comparisonTypeInput.value = i.comparisonType || 'same_company';
  cleaveNewSalary.setRawValue(i.newSalary || 0);
  cleaveNewAllowance.setRawValue(i.newAllowance || 0);
  cleaveNewOtherDeduction.setRawValue(i.newOtherDeduction || 0);
  thrMonthInput.value = String(i.thrMonth ?? 3);
  scenarioStatus.textContent = `Skenario "${s.name || `Skenario ${idx + 1}`}" dimuat. Klik Hitung.`;
}

function hydrateFromUrlScenario() {
  const params = new URLSearchParams(window.location.search);
  const raw = params.get('s');
  if (!raw) return;
  const decoded = decodeScenarioPayload(raw);
  if (!decoded) return;
  applyInputSnapshot(decoded);
  scenarioStatus.textContent = 'Scenario loaded from shared link. Klik Hitung.';
}

function getCurrentInputSnapshot() {
  return {
    gaji: Number.parseFloat(cleaveGaji.getRawValue()) || 0,
    anggotaKeluarga: Number.parseInt(document.getElementById('anggotaKeluarga').value, 10) || 1,
    includeTax: includeTaxInput.checked,
    taxMethod: taxMethodInput.value || 'ter',
    ptkpStatus: ptkpStatusInput.value || 'TK0',
    includeThr: includeThrInput.checked,
    prorataThr: prorataThrInput.checked,
    monthsWorked: Number.parseInt(monthsWorkedInput.value, 10) || 12,
    currentAllowance: Number.parseFloat(cleaveCurrentAllowance.getRawValue()) || 0,
    currentOtherDeduction: Number.parseFloat(cleaveCurrentOtherDeduction.getRawValue()) || 0,
    enableComparison: enableComparisonInput.checked,
    comparisonType: comparisonTypeInput.value || 'same_company',
    newSalary: Number.parseFloat(cleaveNewSalary.getRawValue()) || 0,
    newAllowance: Number.parseFloat(cleaveNewAllowance.getRawValue()) || 0,
    newOtherDeduction: Number.parseFloat(cleaveNewOtherDeduction.getRawValue()) || 0,
    targetNet: Number.parseFloat(cleaveTargetNet.getRawValue()) || 0,
    thrMonth: Number.parseInt(thrMonthInput.value, 10) || 3,
    sensitivityPct: Number.parseInt(sensitivityPctInput.value, 10) || 10
  };
}

function applyInputSnapshot(i) {
  cleaveGaji.setRawValue(i.gaji || 0);
  document.getElementById('anggotaKeluarga').value = i.anggotaKeluarga || 1;
  includeTaxInput.checked = !!i.includeTax;
  includeTaxInput.dispatchEvent(new Event('change'));
  taxMethodInput.value = i.taxMethod || 'ter';
  ptkpStatusInput.value = i.ptkpStatus || 'TK0';
  includeThrInput.checked = !!i.includeThr;
  includeThrInput.dispatchEvent(new Event('change'));
  prorataThrInput.checked = !!i.prorataThr;
  prorataThrInput.dispatchEvent(new Event('change'));
  monthsWorkedInput.value = i.monthsWorked || 12;
  cleaveCurrentAllowance.setRawValue(i.currentAllowance || 0);
  cleaveCurrentOtherDeduction.setRawValue(i.currentOtherDeduction || 0);
  enableComparisonInput.checked = !!i.enableComparison;
  enableComparisonInput.dispatchEvent(new Event('change'));
  comparisonTypeInput.value = i.comparisonType || 'same_company';
  cleaveNewSalary.setRawValue(i.newSalary || 0);
  cleaveNewAllowance.setRawValue(i.newAllowance || 0);
  cleaveNewOtherDeduction.setRawValue(i.newOtherDeduction || 0);
  cleaveTargetNet.setRawValue(i.targetNet || 0);
  thrMonthInput.value = String(i.thrMonth ?? 3);
  sensitivityPctInput.value = String(i.sensitivityPct ?? 10);
  sensitivityLabel.textContent = `Rentang analisis: +/-${sensitivityPctInput.value}%`;
}

function buildShareUrl(payload) {
  const encoded = encodeScenarioPayload(payload);
  const url = new URL(window.location.href);
  url.searchParams.set('s', encoded);
  return url.toString();
}

function encodeScenarioPayload(payload) {
  return toBase64Url(JSON.stringify(payload));
}

function decodeScenarioPayload(encoded) {
  try {
    const raw = fromBase64Url(encoded);
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed;
  } catch {
    return null;
  }
}

function toBase64Url(str) {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  bytes.forEach((b) => { binary += String.fromCharCode(b); });
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
}

function fromBase64Url(b64url) {
  const normalized = b64url.replaceAll('-', '+').replaceAll('_', '/');
  const paddingNeeded = (4 - (normalized.length % 4)) % 4;
  const padded = normalized + '='.repeat(paddingNeeded);
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function renameScenario(idx) {
  const all = parseSafeJson(localStorage.getItem(STORAGE_KEY), []);
  const s = all[idx];
  if (!s) return;
  const name = prompt('Nama baru skenario:', s.name || `Skenario ${idx + 1}`);
  if (!name) return;
  all[idx].name = name.trim();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  renderScenarioHistory();
}

function deleteScenario(idx) {
  const all = parseSafeJson(localStorage.getItem(STORAGE_KEY), []);
  all.splice(idx, 1);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  renderScenarioHistory();
}

function escapeHtml(str) {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function csvEscape(value) {
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function initTheme() {
  const saved = parseSafeJson(localStorage.getItem(THEME_KEY), { accent: 'blue', dark: false });
  const safe = {
    accent: ['blue', 'green', 'orange', 'pink'].includes(saved.accent) ? saved.accent : 'blue',
    dark: !!saved.dark
  };
  applyTheme(safe);
}

function saveTheme(theme) {
  localStorage.setItem(THEME_KEY, JSON.stringify(theme));
}

function getThemeState() {
  return {
    accent: document.querySelector('.accent-chip.active')?.dataset.accent || 'blue',
    dark: document.body.classList.contains('dark-mode')
  };
}

function applyTheme(theme) {
  const palette = {
    blue: { brand: '#1459d9', accent: '#12b981', warm: '#ff8a00' },
    green: { brand: '#0f8f6f', accent: '#2cc295', warm: '#f59e0b' },
    orange: { brand: '#d96a14', accent: '#f39c12', warm: '#ff5e5e' },
    pink: { brand: '#c2185b', accent: '#ff4f8b', warm: '#f59e0b' }
  };
  const p = palette[theme.accent] || palette.blue;
  document.documentElement.style.setProperty('--brand', p.brand);
  document.documentElement.style.setProperty('--accent', p.accent);
  document.documentElement.style.setProperty('--warm', p.warm);
  document.body.classList.toggle('dark-mode', !!theme.dark);
  document.documentElement.setAttribute('data-theme', theme.dark ? 'dark' : 'light');
  darkModeToggle.textContent = theme.dark ? 'Light Mode' : 'Dark Mode';

  const nav = document.querySelector('.top-nav');
  if (nav) nav.style.background = `linear-gradient(92deg, ${p.brand} 0%, ${p.brand} 100%)`;

  const cta = document.querySelector('.cta-main');
  if (cta) cta.style.background = p.brand;

  const hero = document.querySelector('.hero-tag');
  if (hero) {
    hero.style.color = p.brand;
    hero.style.borderColor = `${p.brand}33`;
  }

  const dots = document.querySelectorAll('.dot.current');
  dots.forEach((d) => { d.style.background = p.brand; });

  const bars = document.querySelectorAll('.cf-bar.current');
  bars.forEach((b) => { b.style.background = p.brand; });

  const compareBars = document.querySelectorAll('.cf-bar.compare');
  compareBars.forEach((b) => { b.style.background = p.accent; });

  document.querySelectorAll('.accent-chip').forEach((chip) => {
    chip.classList.toggle('active', chip.dataset.accent === theme.accent);
  });

  document.body.style.background = '';
  document.body.style.color = '';

  scenarioStatus.textContent = `Theme: ${theme.accent}${theme.dark ? ' / dark' : ' / light'}`;
}

function parseSafeJson(raw, fallback) {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function showAlert(message) {
  const hasilDiv = document.getElementById('hasil');
  hasilDiv.innerHTML = `
    <div class="alert alert-danger alert-dismissible fade show" role="alert">
      <strong>Error:</strong> ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    </div>
  `;
}

function formatRupiah(angka) {
  return angka.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });
}

function hitungPPh21Bulanan(gajiBulanan, taxMethod, ptkpStatus, includeThr, thrNominal) {
  if (taxMethod === 'ter') {
    return hitungPPh21TerBulanan(gajiBulanan, ptkpStatus, includeThr, thrNominal);
  }
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
  const map = {
    TK0: 54000000,
    TK1: 58500000,
    TK2: 63000000,
    TK3: 67500000,
    K0: 58500000,
    K1: 63000000,
    K2: 67500000,
    K3: 72000000
  };
  return map[status] || map.TK0;
}

function labelPtkpStatus(status) {
  const map = {
    TK0: 'TK/0',
    TK1: 'TK/1',
    TK2: 'TK/2',
    TK3: 'TK/3',
    K0: 'K/0',
    K1: 'K/1',
    K2: 'K/2',
    K3: 'K/3'
  };
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
  { min: -1, max: 5400000, rate: 0 },
  { min: 5400000, max: 5650000, rate: 0.0025 },
  { min: 5650000, max: 5950000, rate: 0.005 },
  { min: 5950000, max: 6300000, rate: 0.0075 },
  { min: 6300000, max: 6750000, rate: 0.01 },
  { min: 6750000, max: 7500000, rate: 0.0125 },
  { min: 7500000, max: 8550000, rate: 0.015 },
  { min: 8550000, max: 9650000, rate: 0.0175 },
  { min: 9650000, max: 10050000, rate: 0.02 },
  { min: 10050000, max: 10350000, rate: 0.0225 },
  { min: 10350000, max: 10700000, rate: 0.025 },
  { min: 10700000, max: 11050000, rate: 0.03 },
  { min: 11050000, max: 11600000, rate: 0.035 },
  { min: 11600000, max: 12500000, rate: 0.04 },
  { min: 12500000, max: 13750000, rate: 0.05 },
  { min: 13750000, max: 15100000, rate: 0.06 },
  { min: 15100000, max: 16950000, rate: 0.07 },
  { min: 16950000, max: 19750000, rate: 0.08 },
  { min: 19750000, max: 24150000, rate: 0.09 },
  { min: 24150000, max: 26450000, rate: 0.1 },
  { min: 26450000, max: 28000000, rate: 0.11 },
  { min: 28000000, max: 30050000, rate: 0.12 },
  { min: 30050000, max: 32400000, rate: 0.13 },
  { min: 32400000, max: 35400000, rate: 0.14 },
  { min: 35400000, max: 39100000, rate: 0.15 },
  { min: 39100000, max: 43850000, rate: 0.16 },
  { min: 43850000, max: 47800000, rate: 0.17 },
  { min: 47800000, max: 51400000, rate: 0.18 },
  { min: 51400000, max: 56300000, rate: 0.19 },
  { min: 56300000, max: 62200000, rate: 0.2 },
  { min: 62200000, max: 68600000, rate: 0.21 },
  { min: 68600000, max: 77500000, rate: 0.22 },
  { min: 77500000, max: 89000000, rate: 0.23 },
  { min: 89000000, max: 103000000, rate: 0.24 },
  { min: 103000000, max: 125000000, rate: 0.25 },
  { min: 125000000, max: 157000000, rate: 0.26 },
  { min: 157000000, max: 206000000, rate: 0.27 },
  { min: 206000000, max: 337000000, rate: 0.28 },
  { min: 337000000, max: 454000000, rate: 0.29 },
  { min: 454000000, max: 550000000, rate: 0.3 },
  { min: 550000000, max: 695000000, rate: 0.31 },
  { min: 695000000, max: 910000000, rate: 0.32 },
  { min: 910000000, max: 1400000000, rate: 0.33 },
  { min: 1400000000, max: Number.POSITIVE_INFINITY, rate: 0.34 }
];

const TER_TABLE_B = [
  { min: -1, max: 6200000, rate: 0 },
  { min: 6200000, max: 6500000, rate: 0.0025 },
  { min: 6500000, max: 6850000, rate: 0.005 },
  { min: 6850000, max: 7300000, rate: 0.0075 },
  { min: 7300000, max: 9200000, rate: 0.01 },
  { min: 9200000, max: 10750000, rate: 0.015 },
  { min: 10750000, max: 11250000, rate: 0.02 },
  { min: 11250000, max: 11600000, rate: 0.025 },
  { min: 11600000, max: 12600000, rate: 0.03 },
  { min: 12600000, max: 13600000, rate: 0.04 },
  { min: 13600000, max: 14950000, rate: 0.05 },
  { min: 14950000, max: 16400000, rate: 0.06 },
  { min: 16400000, max: 18450000, rate: 0.07 },
  { min: 18450000, max: 21850000, rate: 0.08 },
  { min: 21850000, max: 26000000, rate: 0.09 },
  { min: 26000000, max: 27700000, rate: 0.1 },
  { min: 27700000, max: 29350000, rate: 0.11 },
  { min: 29350000, max: 31450000, rate: 0.12 },
  { min: 31450000, max: 33950000, rate: 0.13 },
  { min: 33950000, max: 37100000, rate: 0.14 },
  { min: 37100000, max: 41100000, rate: 0.15 },
  { min: 41100000, max: 45800000, rate: 0.16 },
  { min: 45800000, max: 49500000, rate: 0.17 },
  { min: 49500000, max: 53800000, rate: 0.18 },
  { min: 53800000, max: 58500000, rate: 0.19 },
  { min: 58500000, max: 64000000, rate: 0.2 },
  { min: 64000000, max: 71000000, rate: 0.21 },
  { min: 71000000, max: 80000000, rate: 0.22 },
  { min: 80000000, max: 93000000, rate: 0.23 },
  { min: 93000000, max: 109000000, rate: 0.24 },
  { min: 109000000, max: 129000000, rate: 0.25 },
  { min: 129000000, max: 163000000, rate: 0.26 },
  { min: 163000000, max: 211000000, rate: 0.27 },
  { min: 211000000, max: 374000000, rate: 0.28 },
  { min: 374000000, max: 459000000, rate: 0.29 },
  { min: 459000000, max: 555000000, rate: 0.3 },
  { min: 555000000, max: 704000000, rate: 0.31 },
  { min: 704000000, max: 957000000, rate: 0.32 },
  { min: 957000000, max: 1405000000, rate: 0.33 },
  { min: 1405000000, max: Number.POSITIVE_INFINITY, rate: 0.34 }
];

const TER_TABLE_C = [
  { min: -1, max: 6600000, rate: 0 },
  { min: 6600000, max: 6950000, rate: 0.0025 },
  { min: 6950000, max: 7350000, rate: 0.005 },
  { min: 7350000, max: 7800000, rate: 0.0075 },
  { min: 7800000, max: 8850000, rate: 0.01 },
  { min: 8850000, max: 9800000, rate: 0.0125 },
  { min: 9800000, max: 10950000, rate: 0.015 },
  { min: 10950000, max: 11200000, rate: 0.0175 },
  { min: 11200000, max: 12050000, rate: 0.02 },
  { min: 12050000, max: 12950000, rate: 0.03 },
  { min: 12950000, max: 14150000, rate: 0.04 },
  { min: 14150000, max: 15550000, rate: 0.05 },
  { min: 15550000, max: 17050000, rate: 0.06 },
  { min: 17050000, max: 19500000, rate: 0.07 },
  { min: 19500000, max: 22700000, rate: 0.08 },
  { min: 22700000, max: 26600000, rate: 0.09 },
  { min: 26600000, max: 28100000, rate: 0.1 },
  { min: 28100000, max: 30100000, rate: 0.11 },
  { min: 30100000, max: 32600000, rate: 0.12 },
  { min: 32600000, max: 35400000, rate: 0.13 },
  { min: 35400000, max: 38900000, rate: 0.14 },
  { min: 38900000, max: 43000000, rate: 0.15 },
  { min: 43000000, max: 47400000, rate: 0.16 },
  { min: 47400000, max: 51200000, rate: 0.17 },
  { min: 51200000, max: 55800000, rate: 0.18 },
  { min: 55800000, max: 60400000, rate: 0.19 },
  { min: 60400000, max: 66700000, rate: 0.2 },
  { min: 66700000, max: 74500000, rate: 0.21 },
  { min: 74500000, max: 83200000, rate: 0.22 },
  { min: 83200000, max: 95600000, rate: 0.23 },
  { min: 95600000, max: 110000000, rate: 0.24 },
  { min: 110000000, max: 134000000, rate: 0.25 },
  { min: 134000000, max: 169000000, rate: 0.26 },
  { min: 169000000, max: 221000000, rate: 0.27 },
  { min: 221000000, max: 390000000, rate: 0.28 },
  { min: 390000000, max: 463000000, rate: 0.29 },
  { min: 463000000, max: 561000000, rate: 0.3 },
  { min: 561000000, max: 709000000, rate: 0.31 },
  { min: 709000000, max: 965000000, rate: 0.32 },
  { min: 965000000, max: 1419000000, rate: 0.33 },
  { min: 1419000000, max: Number.POSITIVE_INFINITY, rate: 0.34 }
];
