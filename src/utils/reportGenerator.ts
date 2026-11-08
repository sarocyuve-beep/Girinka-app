import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import * as XLSX from 'xlsx';
import { Beneficiary, PassOnAssessment, ShedInspection, Distribution, FollowUp, Incident, PassOn } from '../types/registry';
import { Candidate } from '../types/selection';
import { Animal } from '../types/animal';

export interface ReportMemoOptions {
  enabled: boolean;
  memoNo?: string;
  ref?: string;
  from?: string;
  to?: string;
  date?: string;
  subject?: string;
  content?: string;
  authorName?: string;
  authorTitle?: string;
  locationDetails?: {
    province: string;
    district: string;
    sector: string;
    email?: string;
    phone?: string;
    poBox?: string;
  };
}

const DEFAULT_LOCATION = {
  province: "Intara y' Amajyaruguru",
  district: "Akarere ka Musanze",
  sector: "Umurenge wa Cyuve",
  email: "cyuve@musanze.gov.rw",
  phone: "0782468519",
  poBox: "03 Musanze"
};

const getReportStyles = () => `
  <style>
    @page { size: A4 portrait; margin: 15mm; }
    @page landscape-page { size: A4 landscape; margin: 10mm; }

    body { font-family: 'Times New Roman', Times, serif; color: #333; line-height: 1.4; margin: 0; padding: 0; }

    .portrait-section { page: portrait; }
    .landscape-section { page: landscape-page; page-break-before: always; }

    .gov-header { text-align: left; margin-bottom: 20px; font-size: 11pt; }
    .gov-header img { width: 50px; height: 50px; float: left; margin-right: 10px; }
    .gov-header-text { display: inline-block; padding-top: 5px; padding-right: 20px; font-weight: bold; line-height: 1.2; }

    .memo-page { padding: 10px; page: portrait; position: relative; min-height: 90%; }
    .memo-title { text-align: left; font-weight: bold; text-decoration: underline; margin-top: 30px; font-size: 12pt; }
    .memo-info { margin-top: 15px; font-size: 11pt; }
    .memo-info div { margin-bottom: 5px; }
    .memo-body { margin-top: 20px; text-align: justify; font-size: 11pt; white-space: pre-line; }
    .memo-closing { margin-top: 20px; font-size: 11pt; }
    .memo-signature { margin-top: 30px; font-weight: bold; border-bottom: 1px solid #000; display: inline-block; min-width: 200px; }

    .authority-box { margin-top: 20px; width: 100%; border-collapse: collapse; }
    .authority-box td { border: 1px dotted #999; padding: 10px; font-size: 10pt; width: 50%; vertical-align: top; }

    .report-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    .report-table th, .report-table td { border: 1px solid #000; padding: 4px; text-align: center; font-size: 8pt; }
    .report-table th { background-color: #f2f2f2; text-transform: uppercase; }

    .footer {
      position: fixed;
      bottom: 10px;
      left: 0;
      right: 0;
      border-top: 3px solid #000;
      padding-top: 5px;
      font-size: 10pt;
      display: flex;
      justify-content: space-between;
      font-family: 'Times New Roman', Times, serif;
    }
    .footer span { font-weight: bold; }
    .footer-spacer { height: 60px; }
    .report-table img { display: block; margin: auto; border: 1px solid #ccc; }
    .page-break { page-break-before: always; }
    .report-title { text-align: center; font-weight: bold; text-decoration: underline; font-size: 13pt; margin: 20px 0; text-transform: uppercase; }
  </style>
`;

const generateHeaderHtml = (loc = DEFAULT_LOCATION) => `
  <div class="gov-header">
    <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/Coat_of_arms_of_Rwanda.svg/250px-Coat_of_arms_of_Rwanda.svg.png" />
    <div class="gov-header-text">
      <span style="text-decoration: underline;">Repubulika y'u Rwanda</span><br/>
      ${loc.province}<br/>
      ${loc.district}<br/>
      ${loc.sector}
    </div>
  </div>
`;

const generateFooterHtml = (loc = DEFAULT_LOCATION) => `
  <div class="footer">
    <span>Email: ${loc.email || 'cyuve@musanze.gov.rw'}</span>
    <span>Phone: ${loc.phone || '0782468519'}</span>
    <span>Po. Box: ${loc.poBox || '03 Musanze'}</span>
  </div>
`;

const generateMemoHtml = (options: ReportMemoOptions) => {
  if (!options.enabled) return "";
  const dateStr = options.date || new Date().toLocaleDateString('fr-FR');
  return `
    <div class="memo-page">
      ${generateHeaderHtml(options.locationDetails)}
      <div class="memo-title">MEMO INTERNE No ${options.memoNo || '...........'}</div>
      <div class="memo-info">
        <div><span style="font-weight: bold;">REF:</span> ${options.ref || 'SARO'}</div>
        <div style="margin-top: 15px;"><span style="font-weight: bold;">KUVA KURI:</span> ${options.from || 'Umukozi ushinzwe Ubworozi mu Murenge wa CYUVE'}</div>
        <div><span style="font-weight: bold;">KUJYA KURI:</span> ${options.to || "Bwana Umunyamabanga Nshingwabikorwa w'Umurenge wa CYUVE"}</div>
        <div><span style="font-weight: bold;">ITARIKI:</span> ${dateStr}</div>
        <div style="margin-top: 15px;"><span style="text-decoration: underline; font-weight: bold;">IMPAMVU:</span> ${options.subject || "Gukurikirana imitangire n'imicungire y'inka zitangwa muri gahunda ya Girinka"}</div>
      </div>
      <div class="memo-body">
        Bwana Muyobozi,

        ${options.content || `Mu rwego rwo gukurikirana imitangire n'imicungire y'inka zitangwa muri gahunda ya girinka.

          Mbandikiye iyi memo ngira ngo mbagezeho ku mugereka wayo raporo yo gukurikira imiryango yahwe inka muri gahunda ya girinka 2025-2026.

          Muri rusange umukozi ushinzwe ubworozi yasanze inka zifashwe neza. Bimwe mu byagaragaye murabisanga ku mugereka w'iyi memo.`}
      </div>
      <div class="memo-closing">Mugire Amahoro.</div>
      <div class="memo-signature">
        ${options.authorName || 'YABARAGIYE Bernard'}<br/>
        ${options.authorTitle || 'Umukozi ushinzwe Ubworozi mu Murenge wa CYUVE'}
      </div>

      <table class="authority-box">
        <tr>
          <td>
            <strong>Authority Comments:</strong><br/><br/>
            ...................................................................................<br/>
            ...................................................................................<br/>
            ...................................................................................
          </td>
          <td>
            <strong>Authority Names, Signature and Stump</strong><br/><br/>
            ...................................................................................<br/>
            ...................................................................................<br/>
            ...................................................................................
          </td>
        </tr>
      </table>
      ${generateFooterHtml(options.locationDetails)}
    </div>
  `;
};

// --- 1. PASS-ON ASSESSMENT REPORTS ---
export const generatePassOnAssessmentReport = async (
  assessments: PassOnAssessment[],
  people: (Beneficiary | Candidate)[],
  memoOptions: ReportMemoOptions = { enabled: false }
) => {
  const peopleMap = new Map(people.map(p => [p.id, p]));
  const tableRows = assessments.map(async (a, index) => {
    const owner = peopleMap.get(a.beneficiaryId);
    let photoHtml = "-";
    if (a.photoUri) {
      try {
        const base64 = await FileSystem.readAsStringAsync(a.photoUri, { encoding: FileSystem.EncodingType.Base64 });
        photoHtml = `<img src="data:image/jpeg;base64,${base64}" style="width:60px; height:50px; object-fit:cover;"/>`;
      } catch (e) { console.warn("Photo error", e); }
    }

    return `
      <tr>
        <td>${index + 1}</td>
        <td>${owner?.fullName || "-"}</td>
        <td>${owner?.nationalId || "-"}</td>
        <td>${owner?.sector || "-"}</td>
        <td>${owner?.cell || "-"}</td>
        <td>${owner?.village || "-"}</td>
        <td>${a.breed}</td>
        <td>${a.sex === "F" ? "Female" : "Male"}</td>
        <td>${a.birthDate}</td>
        <td>${a.earTag || "-"}</td>
        <td>${a.isReadyForPassOn ? "Yego" : "Oya"}</td>
        <td>${photoHtml}</td>
        <td>${a.conclusion}</td>
      </tr>
    `;
  });

  const resolvedRows = await Promise.all(tableRows);

  const htmlContent = `
    <html>
      <head>${getReportStyles()}</head>
      <body>
        ${generateMemoHtml(memoOptions)}

        <div class="landscape-section">
          ${generateHeaderHtml(memoOptions.locationDetails)}

          <div class="report-title">IFISHI YO KUBARURA INKA ZO KWITURA (PASS-ON ASSESSMENT)</div>

          <table class="report-table">
            <thead>
              <tr>
                <th rowspan="2">No</th>
                <th colspan="5">Identification of beneficiary</th>
                <th colspan="4">Identification of Calf</th>
                <th rowspan="2">Igihe cyo kwiturwa?</th>
                <th rowspan="2">IFOTO</th>
                <th rowspan="2">icyongerwahaho</th>
              </tr>
              <tr>
                <th>NAME OF THE FARMER</th>
                <th>ID</th>
                <th>Sector</th>
                <th>Cell</th>
                <th>Village</th>
                <th>Breed</th>
                <th>Sex</th>
                <th>Birth day</th>
                <th>Ear Tag</th>
              </tr>
            </thead>
            <tbody>${resolvedRows.join('')}</tbody>
          </table>
          <div class="footer-spacer"></div>
          ${generateFooterHtml(memoOptions.locationDetails)}
        </div>
      </body>
    </html>
  `;
  const { uri } = await Print.printToFileAsync({ html: htmlContent });
  await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
};

export const exportPassOnAssessmentsToExcel = async (assessments: PassOnAssessment[], people: (Beneficiary | Candidate)[]) => {
  const peopleMap = new Map(people.map(p => [p.id, p]));
  const data = assessments.map((a, index) => {
    const owner = peopleMap.get(a.beneficiaryId);
    return {
      "No": index + 1,
      "NAME OF THE FARMER": owner?.fullName || "",
      "ID": owner?.nationalId || "",
      "Sector": owner?.sector || "",
      "Cell": owner?.cell || "",
      "Village": owner?.village || "",
      "Breed": a.breed,
      "Sex": a.sex === "F" ? "Female" : "Male",
      "Birth day/date": a.birthDate,
      "Ear Tag": a.earTag || "-",
      "Garagaza igihe cyo kwiturwa?": a.isReadyForPassOn ? "Yego" : "Oya",
      "icyongerwahaho": a.conclusion
    };
  });
  await exportToExcel(data, "Ibarura_Kwitura_Template");
};

// --- 2. DISTRIBUTION REPORTS ---
export const generateDistributionReport = async (
  distributions: Distribution[],
  beneficiaries: Beneficiary[],
  memoOptions: ReportMemoOptions = { enabled: false }
) => {
  const benMap = new Map(beneficiaries.map(b => [b.id, b]));
  const tableRows = distributions.map((d, index) => {
    const owner = benMap.get(d.beneficiaryId);
    return `<tr><td>${index+1}</td><td>${owner?.fullName}</td><td>${owner?.nationalId}</td><td>${d.yearReceived}</td><td>${d.source}</td><td>${d.type}</td><td>${d.passedOnCow?'Yego':'Oya'}</td><td>${d.notes||'-'}</td></tr>`;
  }).join('');
  const html = `<html>
    <head>${getReportStyles()}</head>
    <body>
      ${generateMemoHtml(memoOptions)}
      <div class="landscape-section">
        ${generateHeaderHtml(memoOptions.locationDetails)}
        <div class="report-title">URUTONDE RW'ITANGWA RY'INKA (GIRINKA)</div>
        <table class="report-table">
          <thead><tr style="background:#f2f2f2"><th>NO</th><th>AMAZINA</th><th>INDANGAMUNTU</th><th>UMWAKA</th><th>INKOMOKO</th><th>UBWOKO</th><th>YARITUYE?</th><th>ICYIMENYETSO</th></tr></thead>
          <tbody>${tableRows}</tbody></table>
        <div class="footer-spacer"></div>
        ${generateFooterHtml(memoOptions.locationDetails)}
      </div>
    </body></html>`;
  const { uri } = await Print.printToFileAsync({ html });
  await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
};

export const exportDistributionToExcel = async (distributions: Distribution[], beneficiaries: Beneficiary[]) => {
  const benMap = new Map(beneficiaries.map(b => [b.id, b]));
  const data = distributions.map((d, index) => {
    const owner = benMap.get(d.beneficiaryId);
    return {
      "NO": index + 1,
      "AMAZINA": owner?.fullName || "",
      "INDANGAMUNTU": owner?.nationalId || "",
      "UMWAKA": d.yearReceived,
      "INKOMOKO": d.source,
      "UBWOKO": d.type,
      "YARITUYE?": d.passedOnCow ? "Yego" : "Oya",
      "IBINDI": d.notes || ""
    };
  });
  await exportToExcel(data, "Itangwa_ry_Inka");
};

// --- 3. FOLLOW-UP REPORTS ---
export const generateFollowUpReport = async (
  followUps: FollowUp[],
  beneficiaries: Beneficiary[],
  memoOptions: ReportMemoOptions = { enabled: false }
) => {
  const benMap = new Map(beneficiaries.map(b => [b.id, b]));
  const tableRows = followUps.map(async (f, index) => {
    const owner = benMap.get(f.beneficiaryId);
    const photos = [];
    try {
      if (f.photo1Uri) {
        const base64_1 = await FileSystem.readAsStringAsync(f.photo1Uri, { encoding: FileSystem.EncodingType.Base64 });
        photos.push(`<img src="data:image/jpeg;base64,${base64_1}" style="width:60px; height:50px; object-fit:cover; margin:2px; border:1px solid #ccc;"/>`);
      }
      if (f.photo2Uri) {
        const base64_2 = await FileSystem.readAsStringAsync(f.photo2Uri, { encoding: FileSystem.EncodingType.Base64 });
        photos.push(`<img src="data:image/jpeg;base64,${base64_2}" style="width:60px; height:50px; object-fit:cover; margin:2px; border:1px solid #ccc;"/>`);
      }
    } catch (e) {
      console.warn("Could not load photo for report", e);
    }

    return `
      <tr>
        <td>${index+1}</td>
        <td>${owner?.fullName}</td>
        <td>${f.date}</td>
        <td>${f.hasCowInShed ? 'YEGO' : 'OYA (' + (f.noCowReason || '-') + ')'}</td>
        <td>${f.hasShed ? 'YEGO' : 'OYA'}</td>
        <td>${f.bodyCondition || f.cowCondition}</td>
        <td>${f.milkProductionPerDay || 0}L</td>
        <td>${f.isPregnant ? 'YEGO' : 'OYA'}</td>
        <td>${f.hasPassedOn ? 'YEGO' : 'OYA'}</td>
        <td><div style="display:flex; justify-content:center;">${photos.join('')}</div></td>
        <td>${f.notes || '-'}</td>
      </tr>
    `;
  });

  const resolvedRows = await Promise.all(tableRows);

  const html = `
    <html>
      <head>${getReportStyles()}</head>
      <body>
        ${generateMemoHtml(memoOptions)}
        <div class="landscape-section">
          ${generateHeaderHtml(memoOptions.locationDetails)}
          <div class="report-title">RAPORO Y'IKURIKIRANA RY'INKA (GIRINKA FOLLOW-UP)</div>
          <table class="report-table">
            <thead>
              <tr>
                <th>NO</th>
                <th>AMAZINA</th>
                <th>ITARIKI</th>
                <th>INKA IRI MU KIRARO?</th>
                <th>IKIRARO?</th>
                <th>UKO IMEZE</th>
                <th>AMATA</th>
                <th>IHAKA?</th>
                <th>YARITUYE?</th>
                <th>AMAFOTO</th>
                <th>ICYIMENYETSO</th>
              </tr>
            </thead>
            <tbody>${resolvedRows.join('')}</tbody>
          </table>
          <div class="footer-spacer"></div>
          ${generateFooterHtml(memoOptions.locationDetails)}
        </div>
      </body>
    </html>
  `;
  const { uri } = await Print.printToFileAsync({ html });
  await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
};

export const exportFollowUpToExcel = async (followUps: FollowUp[], beneficiaries: Beneficiary[]) => {
  const benMap = new Map(beneficiaries.map(b => [b.id, b]));
  const data = followUps.map((f, index) => {
    const owner = benMap.get(f.beneficiaryId);
    return {
      "NO": index + 1,
      "AMAZINA Y'UMWOROZI": owner?.fullName || "",
      "ITARIKI": f.date,
      "INKA IRI MU KIRARO?": f.hasCowInShed ? "YEGO" : "OYA",
      "IMPAMVU NTA NKA": f.noCowReason || "",
      "AFITE IKIRARO?": f.hasShed ? "YEGO" : "OYA",
      "UKO INKA IMEZE (BODY)": f.bodyCondition || "",
      "UKO INKA IMEZE (GEN)": f.cowCondition,
      "AMATA/MUNSI (L)": f.milkProductionPerDay || 0,
      "ESE IHAKA?": f.isPregnant ? "YEGO" : "OYA",
      "YAMAZE KWITURA?": f.hasPassedOn ? "YEGO" : "OYA",
      "AMAFOTO": (f.photo1Uri ? "Y" : "") + (f.photo2Uri ? ", Y" : ""),
      "ICYIMENYETSO": f.notes
    };
  });
  await exportToExcel(data, "Ikurikirana_ry_Inka");
};

// --- 4. INCIDENT REPORTS ---
export const generateIncidentReport = async (
  incidents: Incident[],
  beneficiaries: Beneficiary[],
  memoOptions: ReportMemoOptions = { enabled: false }
) => {
  const benMap = new Map(beneficiaries.map(b => [b.id, b]));
  const tableRows = incidents.map(async (i, index) => {
    const owner = benMap.get(i.beneficiaryId);
    let typeLabel = i.type;
    if (i.type === "POOR_MANAGEMENT") typeLabel = "INKA IFASHWE NABI";
    if (i.type === "DEATH") typeLabel = "INKA YAPFUYE";

    let photoHtml = "-";
    if (i.photoUri) {
      try {
        const base64 = await FileSystem.readAsStringAsync(i.photoUri, { encoding: FileSystem.EncodingType.Base64 });
        photoHtml = `<img src="data:image/jpeg;base64,${base64}" style="width:60px; height:50px; object-fit:cover; border:1px solid #ccc;"/>`;
      } catch (e) {
        console.warn("Could not load incident photo", e);
      }
    }

    return `<tr><td>${index+1}</td><td>${owner?.fullName}</td><td>${i.date}</td><td>${typeLabel}</td><td>${photoHtml}</td><td>${i.description}</td><td>${i.reportedBy}</td></tr>`;
  });

  const resolvedRows = await Promise.all(tableRows);

  const html = `<html>
    <head>${getReportStyles()}</head>
    <body>
      ${generateMemoHtml(memoOptions)}
      <div class="landscape-section">
        ${generateHeaderHtml(memoOptions.locationDetails)}
        <div class="report-title" style="color:red">RAPORO Y'IBIBAZO (INCIDENTS)</div>
        <table class="report-table">
          <thead><tr style="background:#f2f2f2"><th>NO</th><th>AMAZINA</th><th>ITARIKI</th><th>UBWOKO</th><th>IFOTO</th><th>IBISOBANURO</th><th>UWATANZE RAPORO</th></tr></thead>
          <tbody>${resolvedRows.join('')}</tbody></table>
        <div class="footer-spacer"></div>
        ${generateFooterHtml(memoOptions.locationDetails)}
      </div>
    </body></html>`;
  const { uri } = await Print.printToFileAsync({ html });
  await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
};

export const exportIncidentToExcel = async (incidents: Incident[], beneficiaries: Beneficiary[]) => {
  const benMap = new Map(beneficiaries.map(b => [b.id, b]));
  const data = incidents.map((i, index) => {
    const owner = benMap.get(i.beneficiaryId);
    return {
      "NO": index + 1,
      "AMAZINA Y'UMWOROZI": owner?.fullName || "",
      "ITARIKI": i.date,
      "UBWOKO BW'IKIBAZO": i.type,
      "IBISOBANURO": i.description,
      "UWATANZE RAPORO": i.reportedBy
    };
  });
  await exportToExcel(data, "Ibibazo_by_Inka");
};

// --- 5. BENEFICIARY & CANDIDATE REPORTS ---
export const generateBeneficiaryReport = async (
  beneficiaries: Beneficiary[],
  distributions: Distribution[],
  animals: Animal[],
  shedInspections: ShedInspection[],
  title: string,
  memoOptions: ReportMemoOptions = { enabled: false }
) => {
  const benMap = new Map(beneficiaries.map(b => [b.id, b]));
  const distMap = new Map(distributions.map(d => [d.beneficiaryId, d]));
  const aniMap = new Map(animals.map(a => [a.id, a]));
  const shedMap = new Map();

  // Map latest shed inspection for each beneficiary
  shedInspections.forEach(s => {
    const existing = shedMap.get(s.beneficiaryId);
    if (!existing || new Date(s.createdAt) > new Date(existing.createdAt)) {
      shedMap.set(s.beneficiaryId, s);
    }
  });

  // Sort: Cell -> Village -> Year Received (Oldest to Newest)
  const sorted = [...beneficiaries].sort((a, b) => {
    const cellA = (a.cell || "").toUpperCase();
    const cellB = (b.cell || "").toUpperCase();
    if (cellA !== cellB) return cellA.localeCompare(cellB);

    const vilA = (a.village || "").toUpperCase();
    const vilB = (b.village || "").toUpperCase();
    if (vilA !== vilB) return vilA.localeCompare(vilB);

    const distA = distMap.get(a.id);
    const distB = distMap.get(b.id);
    const yearA = distA?.yearReceived || 9999;
    const yearB = distB?.yearReceived || 9999;
    return yearA - yearB;
  });

  const tableRows = sorted.map((b, index) => {
    const dist = distMap.get(b.id);
    const animal = dist?.animalId ? aniMap.get(dist.animalId) : null;
    const shed = shedMap.get(b.id);

    const isVerified = (b as any).verificationStatus;
    const hasCow = isVerified ? isVerified === 'HAS_COW' : !!dist;
    const hasShed = shed?.conclusion === "READY";

    return `
      <tr style="${!hasCow ? 'background-color: #ffebee;' : ''}">
        <td>${index+1}</td>
        <td>${b.fullName}</td>
        <td>${b.nationalId}</td>
        <td>${b.ubudeheCategory||'-'}</td>
        <td>${b.sector}</td>
        <td>${b.cell}</td>
        <td>${b.village}</td>
        <td>${animal?.breed || '-'}</td>
        <td>${dist?.yearReceived||'—'}</td>
        <td>${dist?.source || '-'}</td>
        <td>${animal?.earTag || '-'}</td>
        <td>${dist?.passedOnCow ? 'X' : ''}</td>
        <td>${!dist?.passedOnCow ? 'X' : ''}</td>
        <td>${hasCow ? 'YEGO' : 'OYA'}</td>
        <td>${hasShed ? 'YEGO' : 'OYA'}</td>
        <td>${b.phone||'-'}</td>
      </tr>
    `;
  }).join('');

  const html = `
    <html>
      <head>${getReportStyles()}</head>
      <body>
        ${generateMemoHtml(memoOptions)}
        <div class="landscape-section">
          ${generateHeaderHtml(memoOptions.locationDetails)}
          <div class="report-title">${title}</div>
          <table class="report-table">
            <thead>
              <tr>
                <th>NO</th>
                <th>AMAZINA</th>
                <th>NO Y'INDANGAMUNTU</th>
                <th>ICYICIRO</th>
                <th>UMURENGE</th>
                <th>AKAGARI</th>
                <th>UMUDUGUDU</th>
                <th>UBWOKO</th>
                <th>UMWAKA</th>
                <th>INKOMOKO</th>
                <th>IHERENA</th>
                <th>YARITUYE</th>
                <th>NTARITUYE</th>
                <th>AFITE INKA?</th>
                <th>AFITE IKIRARO?</th>
                <th>TELEFONE</th>
              </tr>
            </thead>
            <tbody>${tableRows}</tbody>
          </table>
          <div class="footer-spacer"></div>
          ${generateFooterHtml(memoOptions.locationDetails)}
        </div>
      </body>
    </html>
  `;
  const { uri } = await Print.printToFileAsync({ html });
  await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
};

export const exportBeneficiariesToExcel = async (
  beneficiaries: Beneficiary[],
  distributions: Distribution[],
  animals: Animal[],
  shedInspections: ShedInspection[],
  title: string
) => {
  const distMap = new Map(distributions.map(d => [d.beneficiaryId, d]));
  const aniMap = new Map(animals.map(a => [a.id, a]));
  const shedMap = new Map();

  shedInspections.forEach(s => {
    const existing = shedMap.get(s.beneficiaryId);
    if (!existing || new Date(s.createdAt) > new Date(existing.createdAt)) {
      shedMap.set(s.beneficiaryId, s);
    }
  });

  const sorted = [...beneficiaries].sort((a, b) => {
    const cellA = (a.cell || "").toUpperCase();
    const cellB = (b.cell || "").toUpperCase();
    if (cellA !== cellB) return cellA.localeCompare(cellB);
    const vilA = (a.village || "").toUpperCase();
    const vilB = (b.village || "").toUpperCase();
    if (vilA !== vilB) return vilA.localeCompare(vilB);
    const distA = distMap.get(a.id);
    const distB = distMap.get(b.id);
    const yearA = distA?.yearReceived || 9999;
    const yearB = distB?.yearReceived || 9999;
    return yearA - yearB;
  });

  const data = sorted.map((b, index) => {
    const dist = distMap.get(b.id);
    const animal = dist?.animalId ? aniMap.get(dist.animalId) : null;
    const shed = shedMap.get(b.id);
    const isVerified = (b as any).verificationStatus;
    const hasCow = isVerified ? isVerified === 'HAS_COW' : !!dist;
    const hasShed = shed?.conclusion === "READY";

    return {
      "NO": index + 1,
      "AMAZINA": b.fullName,
      "NO Y'INDANGAMUNTU": b.nationalId,
      "ICYICIRO CY'UBUDEHE": b.ubudeheCategory || '',
      "UMURENGE": b.sector,
      "AKAGARI": b.cell,
      "UMUDUGUDU": b.village,
      "UBWOKO BW'INKA": animal?.breed || '-',
      "UMWAKA": dist?.yearReceived || '—',
      "INKOMOKO": dist?.source || '',
      "IHERENA": animal?.earTag || '-',
      "YAMAZE KWITURA": dist?.passedOnCow ? "X" : "",
      "NTABWO ARITURA": !dist?.passedOnCow ? "X" : "",
      "AFITE INKA?": hasCow ? "YEGO" : "OYA",
      "AFITE IKIRARO?": hasShed ? "YEGO" : "OYA",
      "TELEFONE": b.phone || ''
    };
  });
  await exportToExcel(data, title.replace(/\s+/g, '_'));
};

export const generateCandidateReport = async (
  candidates: Candidate[],
  campaignLabel: string,
  memoOptions: ReportMemoOptions = { enabled: false }
) => {
  const tableRows = candidates.map((c, index) => `<tr><td>${index+1}</td><td>${c.fullName}</td><td>${c.sex}</td><td>${c.nationalId}</td><td>${c.phone||'-'}</td><td>${c.village}</td><td>${c.cell}</td><td>${c.drawNumber||'-'}</td><td>${c.graduationStatus||'-'}</td><td>${c.conclusion||'-'}</td></tr>`).join('');
  const html = `<html>
    <head>${getReportStyles()}</head>
    <body>
      ${generateMemoHtml(memoOptions)}
      <div class="landscape-section">
        ${generateHeaderHtml(memoOptions.locationDetails)}
        <div class="report-title">${campaignLabel}</div>
        <table class="report-table">
          <thead><tr style="background:#1b6e3c; color:white"><th>NO</th><th>FULL NAME</th><th>SEX</th><th>ID</th><th>PHONE</th><th>VILLAGE</th><th>CELL</th><th>DRAW</th><th>GRADUATION</th><th>CONCLUSION</th></tr></thead>
          <tbody>${tableRows}</tbody></table>
        <div class="footer-spacer"></div>
        ${generateFooterHtml(memoOptions.locationDetails)}
      </div>
    </body></html>`;
  const { uri } = await Print.printToFileAsync({ html });
  await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
};

export const exportCandidatesToExcel = async (candidates: Candidate[], campaignLabel: string) => {
  const data = candidates.map((c, index) => ({
    "NO": index+1, "AMAZINA": c.fullName, "IGITSINA": c.sex, "ID": c.nationalId, "PHONE": c.phone || '',
    "UMURENGE": c.sector, "AKAGARI": c.cell, "UMUDUGUDU": c.village, "DRAW": c.drawNumber || '', "GRADUATION": c.graduationStatus || '', "CONCLUSION": c.conclusion || ''
  }));
  await exportToExcel(data, `Candidates_${campaignLabel.replace(/\s+/g, '_')}`);
};

// --- 6. PASS-ON (KWITURA) REPORTS ---
export const generatePassOnReport = async (
  passOns: PassOn[],
  beneficiaries: Beneficiary[],
  animals: Animal[],
  memoOptions: ReportMemoOptions = { enabled: false }
) => {
  const benMap = new Map(beneficiaries.map(b => [b.id, b]));
  const aniMap = new Map(animals.map(a => [a.id, a]));

  const tableRows = passOns.map((po, index) => {
    const donor = benMap.get(po.donorBeneficiaryId);
    const recipient = benMap.get(po.recipientBeneficiaryId);
    const animal = po.animalId ? aniMap.get(po.animalId) : null;
    return `
      <tr>
        <td>${index + 1}</td>
        <td>${donor?.fullName || "-"}</td>
        <td>${donor?.nationalId || "-"}</td>
        <td>${donor?.sector || "-"}</td>
        <td>${donor?.cell || "-"}</td>
        <td>${donor?.village || "-"}</td>
        <td>${recipient?.fullName || "-"}</td>
        <td>${recipient?.nationalId || "-"}</td>
        <td>${recipient?.cell || "-"}</td>
        <td>${recipient?.village || "-"}</td>
        <td>${animal?.breed || "-"}</td>
        <td>${animal?.earTag || "-"}</td>
        <td>${po.date}</td>
      </tr>
    `;
  }).join('');

  const htmlContent = `
    <html>
      <head>${getReportStyles()}</head>
      <body>
        ${generateMemoHtml(memoOptions)}
        <div class="landscape-section">
          ${generateHeaderHtml(memoOptions.locationDetails)}
          <div class="report-title">KWITURA (UWITUYE N'UWITUWE)</div>
          <table class="report-table">
            <thead>
              <tr>
                <th rowspan="2">NO</th>
                <th colspan="5">Uwituye (Donor / Original Recipient)</th>
                <th colspan="4">Uwituwe (Recipient of Pass-on)</th>
                <th colspan="2">Inka yatanzwe</th>
                <th rowspan="2">ITARIKI</th>
              </tr>
              <tr>
                <th>AMAZINA</th><th>ID</th><th>UMURENGE</th><th>AKAGARI</th><th>UMUDUGUDU</th>
                <th>AMAZINA</th><th>ID</th><th>AKAGARI</th><th>UMUDUGUDU</th>
                <th>UBWOKO</th><th>IHERENA</th>
              </tr>
            </thead>
            <tbody>${tableRows}</tbody>
          </table>
          <div class="footer-spacer"></div>
          ${generateFooterHtml(memoOptions.locationDetails)}
        </div>
      </body>
    </html>
  `;
  const { uri } = await Print.printToFileAsync({ html: htmlContent });
  await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
};

export const exportPassOnToExcel = async (passOns: PassOn[], beneficiaries: Beneficiary[], animals: Animal[]) => {
  const benMap = new Map(beneficiaries.map(b => [b.id, b]));
  const aniMap = new Map(animals.map(a => [a.id, a]));

  const data = passOns.map((po, index) => {
    const donor = benMap.get(po.donorBeneficiaryId);
    const recipient = benMap.get(po.recipientBeneficiaryId);
    const animal = po.animalId ? aniMap.get(po.animalId) : null;
    return {
      "NO": index + 1,
      "AMAZINA Y'UWITUYE": donor?.fullName || "",
      "ID Y'UWITUYE": donor?.nationalId || "",
      "UMURENGE": donor?.sector || "",
      "AKAGARI": donor?.cell || "",
      "UMUDUGUDU": donor?.village || "",
      "AMAZINA Y'UWITUWE": recipient?.fullName || "",
      "ID Y'UWITUWE": recipient?.nationalId || "",
      "AKAGARI K'UWITUWE": recipient?.cell || "",
      "UMUDUGUDU W'UWITUWE": recipient?.village || "",
      "UBWOKO": animal?.breed || "",
      "IHERENA": animal?.earTag || "",
      "ITARIKI": po.date
    };
  });
  await exportToExcel(data, "Kwitura_PassOn");
};

// --- 7. SHED INSPECTION REPORTS ---
export const generateShedInspectionReport = async (
  inspections: ShedInspection[],
  people: (Beneficiary | Candidate)[],
  memoOptions: ReportMemoOptions = { enabled: false }
) => {
  const peopleMap = new Map(people.map(p => [p.id, p]));
  const tableRows = inspections.map(async (s, index) => {
    const owner = peopleMap.get(s.beneficiaryId);
    const name = owner?.fullName || "N/A";
    const id = owner?.nationalId || "-";
    const sec = owner?.sector || s.sector || "-";
    const cel = owner?.cell || s.cell || "-";
    const vil = owner?.village || s.village || "-";

    const photos = [];
    try {
      if (s.photo1Uri) {
        const b64_1 = await FileSystem.readAsStringAsync(s.photo1Uri, { encoding: FileSystem.EncodingType.Base64 });
        photos.push(`<img src="data:image/jpeg;base64,${b64_1}" style="width:50px; height:45px; object-fit:cover; margin:1px;"/>`);
      }
      if (s.photo2Uri) {
        const b64_2 = await FileSystem.readAsStringAsync(s.photo2Uri, { encoding: FileSystem.EncodingType.Base64 });
        photos.push(`<img src="data:image/jpeg;base64,${b64_2}" style="width:50px; height:45px; object-fit:cover; margin:1px;"/>`);
      }
    } catch (e) { console.warn(e); }

    return `
      <tr>
        <td>${index + 1}</td>
        <td>${name}</td>
        <td>${id}</td>
        <td>${sec}</td>
        <td>${cel}</td>
        <td>${vil}</td>
        <td>${s.hasShed ? "Y" : "N"}</td>
        <td>${s.isFirm ? "Y" : "N"}</td>
        <td>${s.isRoofed ? "Y" : "N"}</td>
        <td>${s.hasEnoughSpace ? "Y" : "N"}</td>
        <td>${s.hasCement ? "Y" : "N"}</td>
        <td><div style="display:flex; justify-content:center;">${photos.join('')}</div></td>
        <td>${s.conclusion}</td>
        <td>${s.reportedBy}</td>
      </tr>
    `;
  });

  const resolvedRows = await Promise.all(tableRows);

  const htmlContent = `
    <html>
      <head>${getReportStyles()}</head>
      <body>
        ${generateMemoHtml(memoOptions)}

        <div class="landscape-section">
          ${generateHeaderHtml(memoOptions.locationDetails)}

          <div class="report-title">RAPORO Y'ISUZUMA RY'IBIRARO (SHED INSPECTION)</div>

          <table class="report-table">
            <thead>
              <tr>
                <th>NO</th>
                <th>AMAZINA</th>
                <th>INDANGAMUNTU</th>
                <th>UMURENGE</th>
                <th>AKAGARI</th>
                <th>UMUDUGUDU</th>
                <th>IKIRARO</th>
                <th>GIKOMEYE</th>
                <th>GIRASAKAYE</th>
                <th>IMITAMBIKO</th>
                <th>SIMA</th>
                <th>AMAFOTO</th>
                <th>UMWANZURO</th>
                <th>UWASUZE</th>
              </tr>
            </thead>
            <tbody>${resolvedRows.join('')}</tbody>
          </table>
          <div class="footer-spacer"></div>
          ${generateFooterHtml(memoOptions.locationDetails)}
        </div>
      </body>
    </html>
  `;
  const { uri } = await Print.printToFileAsync({ html: htmlContent });
  await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
};

export const exportShedInspectionsToExcel = async (inspections: ShedInspection[], people: (Beneficiary | Candidate)[]) => {
  const peopleMap = new Map(people.map(p => [p.id, p]));
  const data = inspections.map((s, index) => {
    const owner = peopleMap.get(s.beneficiaryId);
    return {
      "NO": index + 1,
      "AMAZINA": owner?.fullName || "",
      "ID": owner?.nationalId || "",
      "UMURENGE": owner?.sector || s.sector || "",
      "AKAGARI": owner?.cell || s.cell || "",
      "UMUDUGUDU": owner?.village || s.village || "",
      "AFITE IKIRARO": s.hasShed ? "Yego" : "Oya",
      "GIKOMEYE": s.isFirm ? "Yego" : "Oya",
      "GIRASAKAYE": s.isRoofed ? "Yego" : "Oya",
      "IMITAMBIKO": s.hasEnoughSpace ? "Yego" : "Oya",
      "SIMA": s.hasCement ? "Yego" : "Oya",
      "UMWANZURO": s.conclusion,
      "UWASUZE": s.reportedBy
    };
  });
  await exportToExcel(data, "Shed_Inspections");
};

// --- HELPER FUNCTIONS ---
const exportToExcel = async (data: any[], fileName: string) => {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
  const uri = FileSystem.cacheDirectory + `${fileName}_${new Date().getTime()}.xlsx`;
  try {
    await FileSystem.writeAsStringAsync(uri, wbout, { encoding: FileSystem.EncodingType.Base64 });
    await Sharing.shareAsync(uri, { mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', UTI: 'com.microsoft.excel.xlsx' });
  } catch (error) { console.error("Excel Error:", error); }
};
