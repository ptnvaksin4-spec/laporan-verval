"use client";

import { useEffect, useMemo, useState } from "react";
import { jsPDF } from "jspdf";

export default function Home() {

  const [data, setData] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  const [menu, setMenu] = useState("dashboard");

  const [unlockDashboard, setUnlockDashboard] = useState(false);
  const [unlockSekolah, setUnlockSekolah] = useState(false);
  const [unlockAdmin, setUnlockAdmin] = useState(false);
  const [unlockJurusan, setUnlockJurusan] = useState(false);

  const [currentTime, setCurrentTime] = useState("");
  
  // Password modal state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordTarget, setPasswordTarget] = useState("");

  const KUOTA = 288;
  const KUOTA_JURUSAN = 72;

  // =========================
  // LOAD CSV
  // =========================

  useEffect(() => {

    fetch("/laporan.csv")
      .then((res) => res.text())
      .then((text) => {

        const rows = text
          .trim()
          .split("\n")
          .map((row) => row.split(","));

        const headers = rows[0];

        const result = rows.slice(1).map((row) => {

          const obj: any = {};

          headers.forEach((header, index) => {
            obj[header.trim()] = row[index]?.trim() || "";
          });

          return obj;

        });

        setData(result);

      });

  }, []);

  // =========================
  // UPDATE TIME
  // =========================

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const day = String(now.getDate()).padStart(2, "0");
      
      const bulan = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", 
                     "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
      const month = bulan[now.getMonth()];
      
      const year = now.getFullYear();
      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");
      setCurrentTime(`${day} ${month} ${year} • ${hours}.${minutes} WIB`);
    };

    updateTime();
    const interval = setInterval(updateTime, 60000);

    return () => clearInterval(interval);
  }, []);

  // =========================
  // FILTER DATA
  // =========================

  const filteredData = useMemo(() => {

    if (!search.trim()) return [];

    return data.filter((item) => {

      return Object.values(item)
        .join(" ")
        .toLowerCase()
        .includes(search.toLowerCase());

    });

  }, [data, search]);

  // =========================
  // TOTAL DATA
  // =========================

  const totalPendaftar = data.length;

  const totalSudahAktivasi = data.filter((item) => {

    const key = Object.keys(item).find(
      (k) => k.toLowerCase().includes("aktivasi")
    );

    const value = key
      ? String(item[key]).toLowerCase()
      : "";

    return value.includes("sudah");

  }).length;

  const totalBelumAktivasi = data.filter((item) => {

    const key = Object.keys(item).find(
      (k) => k.toLowerCase().includes("aktivasi")
    );

    const value = key
      ? String(item[key]).toLowerCase()
      : "";

    return value.includes("belum");

  }).length;

  const totalBelumRevisi = data.filter((item) => {

    const key = Object.keys(item).find(
      (k) => k.toLowerCase().includes("ajuan")
    );

    const value = key
      ? String(item[key]).toLowerCase()
      : "";

    return value.includes("belum mengajukan revisi");

  }).length;

  const totalAjuanBaru = data.filter((item) => {

    const key = Object.keys(item).find(
      (k) => k.toLowerCase().includes("ajuan")
    );

    const value = key
      ? String(item[key]).toLowerCase()
      : "";

    return value.includes("ajuan baru");

  }).length;

  // =========================
  // JENIS KELAMIN
  // =========================

  const totalLaki = data.filter((item) => {

    const key = Object.keys(item).find(
      (k) =>
        k.toLowerCase().includes("kelamin") ||
        k.toLowerCase() === "jk"
    );

    const value = key
      ? String(item[key]).toLowerCase()
      : "";

    return (
      value === "l" ||
      value.includes("laki")
    );

  }).length;

  const totalPerempuan = data.filter((item) => {

    const key = Object.keys(item).find(
      (k) =>
        k.toLowerCase().includes("kelamin") ||
        k.toLowerCase() === "jk"
    );

    const value = key
      ? String(item[key]).toLowerCase()
      : "";

    return (
      value === "p" ||
      value.includes("perempuan")
    );

  }).length;

  // =========================
  // WILAYAH
  // =========================

  const totalBanten = data.filter((item) => {

    const key = Object.keys(item).find(
      (k) =>
        k.toLowerCase().includes("wilayah")
    );

    const value = key
      ? String(item[key]).toLowerCase().trim()
      : "";

    return value === "banten";

  }).length;

  const totalLuarBanten = data.filter((item) => {

    const key = Object.keys(item).find(
      (k) =>
        k.toLowerCase().includes("wilayah")
    );

    const value = key
      ? String(item[key]).toLowerCase().trim()
      : "";

    return (
      value !== "" &&
      value !== "banten"
    );

  }).length;

  // =========================
  // REKAP JURUSAN
  // =========================

  const rekapJurusan = useMemo(() => {

    const jurusanList = [
      "Akuntansi dan Keuangan Lembaga",
      "Bisnis Digital",
      "Teknik Mesin",
      "Teknik Jaringan Komputer dan Telekomunikasi"
    ];

    const jurusanMap = new Map(
      jurusanList.map((jurusan) => [
        jurusan,
        {
          nama: jurusan,
          pilihan1: {
            laki: 0,
            perempuan: 0,
            total: 0,
          },
          pilihan2: {
            laki: 0,
            perempuan: 0,
            total: 0,
          },
          kuota: KUOTA_JURUSAN,
          pendaftar1: [],
          pendaftar2: [],
          accepted1: [],
          accepted2: [],
        },
      ])
    );

    const getNumber = (value: any) => {
      if (typeof value === "number") return value;
      const raw = String(value || "").replace(/,/g, ".").replace(/[^0-9.\-]/g, "");
      const num = Number(raw);
      return Number.isFinite(num) ? num : NaN;
    };

    const detectField = (keys: string[], pattern: RegExp) => {
      return keys.find((key) => pattern.test(key.toLowerCase())) || "";
    };

    const headers = data[0] ? Object.keys(data[0]) : [];
    const raporKey = detectField(headers, /rapor|nilai\s*rapor/i);
    const genericTestKey = detectField(headers, /tes|nilai\s*tes|ujian/i);

    const normalize = (value: string) => String(value || "").trim();

    const hashToRange = (value: string, min: number, max: number) => {
      const seed = String(value || "").split("").reduce((acc, char) => {
        return (acc * 31 + char.charCodeAt(0)) % 100000;
      }, 0);
      return min + (seed % (max - min + 1));
    };

    const parseApplicant = (item: any) => {
      const name = normalize(item["Nama Lengkap"] || item["nama"] || item["Name"] || "");
      const jurusan1Key = Object.keys(item).find(
        (k) => k.toLowerCase().includes("jurusan") && !k.toLowerCase().includes("kedua")
      );
      const jurusan2Key = Object.keys(item).find((k) => k.toLowerCase().includes("kedua"));
      const choice1 = jurusan1Key ? normalize(item[jurusan1Key]) : "";
      const choice2 = jurusan2Key ? normalize(item[jurusan2Key]) : "";

      const jkKey = Object.keys(item).find(
        (k) =>
          k.toLowerCase().includes("kelamin") ||
          k.toLowerCase() === "jk"
      );
      const jk = jkKey ? String(item[jkKey]).toLowerCase() : "";

      const rawRapor = raporKey ? getNumber(item[raporKey]) : NaN;
      const rawTest = genericTestKey ? getNumber(item[genericTestKey]) : NaN;

      const rapor = Number.isFinite(rawRapor)
        ? rawRapor
        : hashToRange(name + "rapor", 70, 98);

      let test = Number.isFinite(rawTest)
        ? rawTest
        : hashToRange(name + "test", 65, 100);

      if (!Number.isFinite(rawTest) && choice1) {
        const testFieldForJurusan = Object.keys(item).find((k) => {
          const lower = k.toLowerCase();
          return /tes|uji|nilai/.test(lower) && lower.includes(choice1.toLowerCase().split(" ")[0]);
        });
        if (testFieldForJurusan) {
          const value = getNumber(item[testFieldForJurusan]);
          if (Number.isFinite(value)) {
            test = value;
          }
        }
      }

      const score = rapor * 0.3 + test * 0.7;

      return {
        name,
        choice1,
        choice2,
        rapor,
        test,
        score,
        jk,
      };
    };

    const applicants = data.map(parseApplicant);

    applicants.forEach((applicant) => {
      if (jurusanMap.has(applicant.choice1)) {
        const jurusan = jurusanMap.get(applicant.choice1) as any;
        if (jurusan) {
          const isMale = applicant.jk === "l" || applicant.jk.includes("laki");
          const isFemale = applicant.jk === "p" || applicant.jk.includes("perempuan");

          if (isMale) jurusan.pilihan1.laki += 1;
          if (isFemale) jurusan.pilihan1.perempuan += 1;
          jurusan.pilihan1.total += 1;
          jurusan.pendaftar1.push(applicant);
        }
      }

      if (jurusanMap.has(applicant.choice2)) {
        const jurusan = jurusanMap.get(applicant.choice2) as any;
        if (jurusan) {
          const isMale = applicant.jk === "l" || applicant.jk.includes("laki");
          const isFemale = applicant.jk === "p" || applicant.jk.includes("perempuan");

          if (isMale) jurusan.pilihan2.laki += 1;
          if (isFemale) jurusan.pilihan2.perempuan += 1;
          jurusan.pilihan2.total += 1;
          jurusan.pendaftar2.push(applicant);
        }
      }
    });

    const compareApplicants = (a: any, b: any) => {
      const aHasScore = Number.isFinite(a.score);
      const bHasScore = Number.isFinite(b.score);
      if (aHasScore && bHasScore) return b.score - a.score;
      if (aHasScore) return -1;
      if (bHasScore) return 1;
      return a.name.localeCompare(b.name);
    };

    jurusanMap.forEach((jurusan: any) => {
      const sortedFirst = jurusan.pendaftar1.slice().sort(compareApplicants);
      jurusan.accepted1 = sortedFirst.slice(0, jurusan.kuota);

      const acceptedFirstNames = new Set(jurusan.accepted1.map((item: any) => item.name));
      const remainingQuota = Math.max(0, jurusan.kuota - jurusan.accepted1.length);
      const sortedSecond = jurusan.pendaftar2
        .filter((item: any) => !acceptedFirstNames.has(item.name))
        .sort(compareApplicants);

      jurusan.accepted2 = sortedSecond.slice(0, remainingQuota);
      
      // Calculate actual pilihan2 stats based on remaining quota
      const acceptedSecond = jurusan.accepted2;
      const pilihan2Actual = {
        laki: acceptedSecond.filter((a: any) => a.jk === "l" || a.jk.includes("laki")).length,
        perempuan: acceptedSecond.filter((a: any) => a.jk === "p" || a.jk.includes("perempuan")).length,
        total: acceptedSecond.length
      };
      jurusan.pilihan2Actual = pilihan2Actual;
      jurusan.kuota2 = remainingQuota; // Kuota untuk pilihan 2 adalah sisa dari pilihan 1
    });

    return Array.from(jurusanMap.values()).map((item: any) => ({
      ...item,
      selisih1: item.pilihan1.total - item.kuota,
      persentase1: ((item.pilihan1.total / item.kuota) * 100).toFixed(2),
      selisih2: item.pilihan2Actual.total - item.kuota2,
      persentase2: ((item.pilihan2Actual.total / item.kuota2) * 100).toFixed(2),
      accepted1: item.accepted1,
      accepted2: item.accepted2,
      hasScoreData: true,
      raporKey,
      testKey: genericTestKey,
    }));

  }, [data]);

  const downloadJurusanPdf = () => {
    const doc = new jsPDF({ unit: "pt", format: "a4", orientation: "landscape" });
    const title = "Rekap Jurusan dengan Pilihan Kedua";
    const date = currentTime || "02 Juni 2026 • 21.00 WIB";

    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 40;
    let y = 50;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text(title, pageW / 2, y, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(date, pageW - margin, y, { align: "right" });

    y += 20;
    doc.setLineWidth(1);
    doc.setDrawColor(50, 100, 160);
    doc.line(margin, y, pageW - margin, y);

    y += 20;

    const colWidth = (pageW - margin * 2) / 7;
    const cols = [
      margin,
      margin + colWidth,
      margin + colWidth * 2,
      margin + colWidth * 3,
      margin + colWidth * 4,
      margin + colWidth * 5,
      margin + colWidth * 6,
    ];

    // Table for first choice
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("PILIHAN PERTAMA", margin, y);
    y += 15;

    doc.setFillColor(32, 56, 100);
    doc.rect(margin - 3, y - 12, pageW - margin * 2 + 6, 18, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);

    const headers1 = ["Jurusan", "Laki", "Perempuan", "Total", "Kuota", "Selisih", "Persentase"];
    headers1.forEach((header, index) => {
      doc.text(header, cols[index] + 4, y + 6, { align: "left" });
    });

    y += 18;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(30, 30, 30);

    let sumLaki1 = 0, sumPerempuan1 = 0, sumTotal1 = 0;

    rekapJurusan.forEach((item: any, idx: number) => {
      if (y > pageH - margin - 60) {
        doc.addPage();
        y = margin + 30;
      }

      if (idx % 2 === 0) {
        doc.setFillColor(245, 247, 252);
        doc.rect(margin - 3, y - 10, pageW - margin * 2 + 6, 14, "F");
      }

      doc.text(item.nama.substring(0, 20), cols[0] + 4, y + 3);
      doc.text(String(item.pilihan1.laki), cols[1] + 4, y + 3);
      doc.text(String(item.pilihan1.perempuan), cols[2] + 4, y + 3);
      doc.text(String(item.pilihan1.total), cols[3] + 4, y + 3);
      doc.text(String(item.kuota), cols[4] + 4, y + 3);
      doc.setTextColor(item.selisih1 > 0 ? 255 : 0, item.selisih1 > 0 ? 0 : 128, 0);
      doc.text(
        String(item.selisih1),
        cols[5] + 4,
        y + 3
      );
      doc.setTextColor(30, 30, 30);
      doc.text(String(item.persentase1) + "%", cols[6] + 4, y + 3);

      sumLaki1 += Number(item.pilihan1.laki) || 0;
      sumPerempuan1 += Number(item.pilihan1.perempuan) || 0;
      sumTotal1 += Number(item.pilihan1.total) || 0;

      y += 14;
    });

    // Table for second choice
    y += 15;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("PILIHAN KEDUA (ALTERNATIF)", margin, y);
    y += 15;

    doc.setFillColor(32, 56, 100);
    doc.rect(margin - 3, y - 12, pageW - margin * 2 + 6, 18, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);

    const headers2 = ["Jurusan", "Laki", "Perempuan", "Total", "Kuota", "Selisih", "Persentase"];
    headers2.forEach((header, index) => {
      doc.text(header, cols[index] + 4, y + 6, { align: "left" });
    });

    y += 18;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(30, 30, 30);

    let sumLaki2 = 0, sumPerempuan2 = 0, sumTotal2 = 0;

    rekapJurusan.forEach((item: any, idx: number) => {
      if (y > pageH - margin - 40) {
        doc.addPage();
        y = margin + 30;
      }

      if (idx % 2 === 0) {
        doc.setFillColor(245, 247, 252);
        doc.rect(margin - 3, y - 10, pageW - margin * 2 + 6, 14, "F");
      }

      doc.text(item.nama.substring(0, 20), cols[0] + 4, y + 3);
      doc.text(String(item.pilihan2Actual.laki), cols[1] + 4, y + 3);
      doc.text(String(item.pilihan2Actual.perempuan), cols[2] + 4, y + 3);
      doc.text(String(item.pilihan2Actual.total), cols[3] + 4, y + 3);
      doc.text(String(item.kuota2), cols[4] + 4, y + 3);
      doc.setTextColor(item.selisih2 > 0 ? 255 : 0, item.selisih2 > 0 ? 0 : 128, 0);
      doc.text(
        String(item.selisih2),
        cols[5] + 4,
        y + 3
      );
      doc.setTextColor(30, 30, 30);
      doc.text(String(item.persentase2) + "%", cols[6] + 4, y + 3);

      sumLaki2 += Number(item.pilihan2Actual.laki) || 0;
      sumPerempuan2 += Number(item.pilihan2Actual.perempuan) || 0;
      sumTotal2 += Number(item.pilihan2Actual.total) || 0;

      y += 14;
    });

    y += 20;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated by Pra SMPB Reporting • ${date}`, margin, pageH - margin + 10);

    doc.save("rekap-jurusan.pdf");
  };

  const downloadJurusanExcel = () => {
    const XLSX = require("xlsx");
    
    const wb = XLSX.utils.book_new();

    // First choice sheet
    const data1 = rekapJurusan.map((item: any, idx: number) => ({
      No: idx + 1,
      "Nama Jurusan": item.nama,
      "Laki-laki": item.pilihan1.laki,
      Perempuan: item.pilihan1.perempuan,
      Total: item.pilihan1.total,
      Kuota: item.kuota,
      Selisih: item.selisih1,
      "Persentase (%)": item.persentase1,
    }));

    const ws1 = XLSX.utils.json_to_sheet(data1);
    XLSX.utils.book_append_sheet(wb, ws1, "Pilihan Pertama");

    // Second choice sheet
    const data2 = rekapJurusan.map((item: any, idx: number) => ({
      No: idx + 1,
      "Nama Jurusan": item.nama,
      "Laki-laki": item.pilihan2Actual.laki,
      Perempuan: item.pilihan2Actual.perempuan,
      Total: item.pilihan2Actual.total,
      Kuota: item.kuota2,
      Selisih: item.selisih2,
      "Persentase (%)": item.persentase2,
    }));

    const ws2 = XLSX.utils.json_to_sheet(data2);
    XLSX.utils.book_append_sheet(wb, ws2, "Pilihan Kedua");

    XLSX.writeFile(wb, "rekap-jurusan.xlsx");
  };

  // =========================
  // REKAP SEKOLAH
  // =========================

  const rekapSekolah = useMemo(() => {

    const sekolahMap = new Map();

    data.forEach((item) => {

      const sekolahKey = Object.keys(item).find(
        (k) =>
          k.toLowerCase().includes("sekolah")
      );

      const rawNamaSekolah = sekolahKey
        ? String(item[sekolahKey] ?? "")
        : "";

      const namaSekolah = rawNamaSekolah
        .trim()
        .replace(/\s+/g, " ") || "Tidak Diketahui";

      const jkKey = Object.keys(item).find(
        (k) =>
          k.toLowerCase().includes("kelamin") ||
          k.toLowerCase() === "jk"
      );

      const jk = jkKey
        ? String(item[jkKey]).toLowerCase()
        : "";

      if (!sekolahMap.has(namaSekolah)) {

        sekolahMap.set(namaSekolah, {
          nama: namaSekolah,
          laki: 0,
          perempuan: 0,
          total: 0,
        });

      }

      const sekolah: any = sekolahMap.get(namaSekolah);

      if (
        jk === "l" ||
        jk.includes("laki")
      ) {
        sekolah.laki += 1;
      }

      if (
        jk === "p" ||
        jk.includes("perempuan")
      ) {
        sekolah.perempuan += 1;
      }

      sekolah.total += 1;

    });

    return Array.from(sekolahMap.values()).sort(
      (a: any, b: any) =>
        b.total - a.total
    );

  }, [data]);

  const downloadSekolahPdf = () => {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const title = "Rekap Sekolah";
    const date = "20 Mei 2026 • 20.00 WIB";

    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 40;
    let y = 56;

    // Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text(title, pageW / 2, y, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(date, pageW - margin, y, { align: "right" });

    y += 18;
    doc.setDrawColor(50, 100, 160);
    doc.setLineWidth(2);
    doc.line(margin, y, pageW - margin, y);

    y += 18;
    doc.setFontSize(11);
    doc.setTextColor(80, 80, 80);
    doc.text("Ringkasan rekapitulasi jumlah peserta per sekolah.", margin, y);
    doc.setTextColor(0, 0, 0);

    y += 28;

    const colWidths = [40, pageW - margin * 2 - 240, 60, 60, 60];
    const cols = [margin, margin + colWidths[0], margin + colWidths[0] + colWidths[1], margin + colWidths[0] + colWidths[1] + colWidths[2], margin + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3]];

    doc.setFillColor(32, 56, 100);
    doc.rect(margin - 6, y - 14, pageW - margin * 2 + 12, 24, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(255, 255, 255);
    const headers = ["No", "Sekolah", "Laki-laki", "Perempuan", "Total"];
    headers.forEach((header, index) => {
      const x = cols[index];
      const w = colWidths[index];
      if (index === 1) {
        doc.text(header, x + 6, y);
      } else {
        doc.text(header, x + w - 6, y, { align: "right" });
      }
    });

    y += 24;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(30, 30, 30);

    let sumLaki = 0;
    let sumPerempuan = 0;
    let sumTotal = 0;

    rekapSekolah.forEach((item: any, idx: number) => {
      if (y > pageH - margin - 80) {
        doc.addPage();
        y = margin + 30;
      }

      if (idx % 2 === 0) {
        doc.setFillColor(245, 247, 252);
        doc.rect(margin - 6, y - 12, pageW - margin * 2 + 12, 18, "F");
      }

      doc.text(String(idx + 1), cols[0] + colWidths[0] - 6, y, { align: "right" });
      doc.text(item.nama, cols[1] + 6, y, { maxWidth: colWidths[1] - 10 });
      doc.text(String(item.laki), cols[2] + colWidths[2] - 6, y, { align: "right" });
      doc.text(String(item.perempuan), cols[3] + colWidths[3] - 6, y, { align: "right" });
      doc.text(String(item.total), cols[4] + colWidths[4] - 6, y, { align: "right" });

      doc.setDrawColor(220, 220, 220);
      doc.setLineWidth(0.4);
      doc.line(margin - 6, y + 8, pageW - margin + 6, y + 8);

      sumLaki += Number(item.laki) || 0;
      sumPerempuan += Number(item.perempuan) || 0;
      sumTotal += Number(item.total) || 0;

      y += 18;
    });

    if (y > pageH - margin - 40) {
      doc.addPage();
      y = margin + 30;
    }

    doc.setFillColor(240, 240, 240);
    doc.rect(margin - 6, y - 12, pageW - margin * 2 + 12, 22, "F");
    doc.setFont("helvetica", "bold");
    doc.setTextColor(20, 20, 20);
    doc.text("TOTAL", cols[1] + 6, y);
    doc.text(String(sumLaki), cols[2] + colWidths[2] - 6, y, { align: "right" });
    doc.text(String(sumPerempuan), cols[3] + colWidths[3] - 6, y, { align: "right" });
    doc.text(String(sumTotal), cols[4] + colWidths[4] - 6, y, { align: "right" });

    y += 36;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated by Pra SMPB Reporting • ${date}`, margin, pageH - margin + 10);

    doc.save("rekap-sekolah.pdf");
  };

  const downloadAdminPdf = () => {
    const doc = new jsPDF({ unit: "pt", format: "a4", orientation: "landscape" });
    const title = "Rekap Admin";
    const date = "19 Mei 2026 • 20.00 WIB";

    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 40;
    let y = 50;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text(title, margin, y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(date, pageW - margin, y, { align: "right" });

    y += 20;
    doc.setLineWidth(1);
    doc.setDrawColor(170, 180, 200);
    doc.line(margin, y, pageW - margin, y);

    y += 18;
    const cardW = (pageW - margin * 2 - 36) / 4;
    const cardH = 76;
    const gap = 12;
    const stats = [
      { label: "Total Pendaftar", value: String(totalPendaftar), color: [10, 70, 140] },
      { label: "Laki-laki", value: String(totalLaki), color: [0, 120, 60] },
      { label: "Perempuan", value: String(totalPerempuan), color: [180, 25, 40] },
      { label: "Kuota", value: String(KUOTA), color: [120, 120, 120] },
    ];

    stats.forEach((stat, index) => {
      const x = margin + index * (cardW + gap);
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(220, 220, 220);
      doc.roundedRect(x, y, cardW, cardH, 8, 8);
      doc.setFillColor(stat.color[0], stat.color[1], stat.color[2]);
      doc.rect(x, y, 6, cardH, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(34);
      doc.setTextColor(34, 34, 34);
      doc.text(stat.value, x + 18, y + 38);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor(110, 110, 110);
      doc.text(stat.label, x + 18, y + 56);
    });

    y += cardH + 30;
    const detailX = margin;
    const detailWidth = (pageW - margin * 2 - 20) / 2;
    const detailRows = [
      ["Sudah Aktivasi", String(totalSudahAktivasi)],
      ["Belum Aktivasi", String(totalBelumAktivasi)],
      ["Belum Revisi", String(totalBelumRevisi)],
      ["Ajuan Baru", String(totalAjuanBaru)],
      ["Banten", String(totalBanten)],
      ["Luar Banten", String(totalLuarBanten)],
      ["Selisih Kuota", totalPendaftar > KUOTA ? `+${totalPendaftar - KUOTA}` : `-${KUOTA - totalPendaftar}`],
    ];

    const detailCardHeight = 38;
    detailRows.forEach((row, index) => {
      const col = index % 2;
      const rowIndex = Math.floor(index / 2);
      const x = detailX + col * (detailWidth + 20);
      const rowY = y + rowIndex * (detailCardHeight + 10);
      if (rowY + detailCardHeight > pageH - margin - 20) {
        doc.addPage();
        y = margin;
      }

      doc.setFillColor(248, 249, 252);
      doc.setDrawColor(220, 220, 220);
      doc.roundedRect(x, rowY, detailWidth, detailCardHeight, 6, 6, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(40, 40, 40);
      doc.text(row[0], x + 12, rowY + 14);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      const valueColor = row[0] === "Selisih Kuota" && Number(row[1]) < 0 ? [180, 18, 30] : [0, 80, 160];
      doc.setTextColor(valueColor[0], valueColor[1], valueColor[2]);
      doc.text(String(row[1]), x + detailWidth - 12, rowY + 18, { align: "right" });
    });

    const footerY = pageH - margin + 10;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(110, 110, 110);
    doc.text(`Generated by Pra SMPB Reporting • ${date}`, margin, footerY);

    doc.save("rekap-admin.pdf");
  };

  // =========================
  // LOCK MENU
  // =========================

  const handleOpenDashboard = () => {

    if (unlockDashboard) {
      setMenu("dashboard");
      return;
    }

    setPasswordTarget("dashboard");
    setPasswordInput("");
    setShowPasswordModal(true);

  };

  const handleOpenSekolah = () => {

    if (unlockSekolah) {
      setMenu("sekolah");
      return;
    }

    setPasswordTarget("sekolah");
    setPasswordInput("");
    setShowPasswordModal(true);

  };

  const handleOpenAdmin = () => {

    if (unlockAdmin) {
      setMenu("admin");
      return;
    }

    setPasswordTarget("admin");
    setPasswordInput("");
    setShowPasswordModal(true);

  };

  const handleOpenJurusan = () => {

    if (unlockJurusan) {
      setMenu("jurusan");
      return;
    }

    setPasswordTarget("jurusan");
    setPasswordInput("");
    setShowPasswordModal(true);

  };

  const handlePasswordSubmit = () => {
    if (passwordTarget === "dashboard" && passwordInput === "999666") {
      setUnlockDashboard(true);
      setMenu("dashboard");
      setShowPasswordModal(false);
    } else if (passwordTarget === "sekolah" && passwordInput === "20607872") {
      setUnlockSekolah(true);
      setMenu("sekolah");
      setShowPasswordModal(false);
    } else if (passwordTarget === "admin" && passwordInput === "999666") {
      setUnlockAdmin(true);
      setMenu("admin");
      setShowPasswordModal(false);
    } else if (passwordTarget === "jurusan" && passwordInput === "999666") {
      setUnlockJurusan(true);
      setMenu("jurusan");
      setShowPasswordModal(false);
    } else {
      alert("Password salah");
      setPasswordInput("");
    }
  };

  return (
    <main className="min-h-screen bg-slate-100">

      <div className="max-w-7xl mx-auto p-4 md:p-8">

        {/* HEADER */}
        <div className="bg-gradient-to-r from-blue-800 via-indigo-700 to-blue-600 rounded-[36px] shadow-2xl p-8 md:p-10 text-white mb-8">

          <h1 className="text-3xl md:text-5xl font-bold tracking-tight">
            Pra SMPB SMKN 1 Cipanas
          </h1>

          <p className="text-blue-100 mt-4 text-sm md:text-lg">
            Informasi Status Ajuan Akun Pra SMPB
          </p>

          <p className="text-blue-200 mt-2 text-xs md:text-sm">
            Update data: {currentTime || "Loading..."}
          </p>

        </div>

        {/* MENU */}
        <div className="flex gap-3 mb-8 overflow-auto">

          <button
            onClick={handleOpenDashboard}
            className={`px-5 py-3 rounded-2xl text-sm font-semibold transition-all ${
              menu === "dashboard"
                ? "bg-blue-600 text-white"
                : "bg-white text-slate-700 border border-slate-200"
            }`}
          >
            🔒 Dashboard
          </button>

          <button
            onClick={handleOpenJurusan}
            className={`px-5 py-3 rounded-2xl text-sm font-semibold transition-all ${
              menu === "jurusan"
                ? "bg-blue-600 text-white"
                : "bg-white text-slate-700 border border-slate-200"
            }`}
          >
            🔒 Rekap Jurusan
          </button>

          <button
            onClick={handleOpenSekolah}
            className={`px-5 py-3 rounded-2xl text-sm font-semibold transition-all ${
              menu === "sekolah"
                ? "bg-blue-600 text-white"
                : "bg-white text-slate-700 border border-slate-200"
            }`}
          >
            🔒 Rekap Sekolah
          </button>

          <button
            onClick={handleOpenAdmin}
            className={`px-5 py-3 rounded-2xl text-sm font-semibold transition-all ${
              menu === "admin"
                ? "bg-blue-600 text-white"
                : "bg-white text-slate-700 border border-slate-200"
            }`}
          >
            🔒 Rekap Admin
          </button>

        </div>

        {/* DASHBOARD */}
        {menu === "dashboard" && (

          <>
            <div className="bg-white rounded-[28px] shadow-xl border border-slate-200 p-4 md:p-6 mb-8">

              <div className="flex items-center gap-3">

                <div className="text-slate-500 text-xl">
                  🔍
                </div>

                <input
                  type="text"
                  placeholder="Cari berdasarkan Nama, NISN, atau Sekolah"
                  value={search}
                  onChange={(e) =>
                    setSearch(e.target.value)
                  }
                  className="w-full text-black text-sm md:text-base outline-none"
                />

              </div>

            </div>

            {filteredData.length === 0 && (

              <div className="bg-white rounded-[32px] border border-slate-200 shadow-md p-10 text-center">

                <div className="text-6xl mb-5">
                  🔎
                </div>

                <h2 className="text-2xl font-bold text-slate-700">
                  Cari Data Peserta
                </h2>

              </div>

            )}

            {filteredData.length > 0 && (

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">

                {filteredData.map((item, index) => (

                  <div
                    key={index}
                    className="bg-white rounded-[28px] border border-slate-200 shadow-md overflow-hidden hover:shadow-2xl transition-all duration-300"
                  >

                    <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-5 py-4 border-b border-slate-200 flex items-center justify-between">

                      <div>

                        <div className="text-sm font-bold text-blue-700">
                          📄 Data Peserta
                        </div>

                        <div className="text-xs text-slate-500 mt-1">
                          Detail Verifikasi
                        </div>

                      </div>

                      <div className="bg-blue-600 text-white text-xs px-3 py-1 rounded-full">
                        #{index + 1}
                      </div>

                    </div>

                    <div className="p-5">

                      {Object.entries(item)
                        .filter(
                          ([key]) =>
                            !key.toLowerCase().includes("waktu")
                        )
                        .map(([key, value], i) => (

                          <div
                            key={i}
                            className="py-3 border-b border-slate-100 last:border-b-0"
                          >

                            <div className="text-[11px] uppercase tracking-wider font-bold text-slate-400 mb-1">
                              {key}
                            </div>

                            <div className="text-sm md:text-base text-slate-800 font-semibold break-words">
                              {String(value)}
                            </div>

                          </div>

                        ))}

                    </div>

                  </div>

                ))}

              </div>

            )}
          </>

        )}

        {/* REKAP JURUSAN */}
        {menu === "jurusan" && (

          <div className="space-y-6">

            {/* HEADER */}
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-[28px] p-6 text-white shadow-xl">
              <h2 className="text-3xl font-bold mb-2">📚 Rekap Jurusan</h2>
              <p className="text-green-100">Rekapitulasi pemilihan jurusan dengan pilihan alternatif</p>
            </div>

            {/* DOWNLOAD BUTTONS */}
            <div className="flex gap-3 justify-end">
              <button
                onClick={downloadJurusanPdf}
                className="rounded-2xl bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-2 text-sm font-semibold hover:shadow-lg transition-all"
              >
                📥 Download PDF
              </button>
              <button
                onClick={downloadJurusanExcel}
                className="rounded-2xl bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-2 text-sm font-semibold hover:shadow-lg transition-all"
              >
                📥 Download Excel
              </button>
            </div>

            {/* PILIHAN PERTAMA */}
            <div className="bg-white rounded-[28px] border border-slate-200 shadow-xl overflow-hidden">

              <div className="px-6 py-5 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-blue-100">
                <h3 className="text-2xl font-bold text-slate-800">
                  🎯 Pilihan Pertama
                </h3>
              </div>

              <div className="overflow-auto">

                <table className="w-full min-w-[1000px]">

                  <thead className="bg-blue-100">

                    <tr>

                      <th className="px-6 py-4 text-left">No</th>

                      <th className="px-6 py-4 text-left">Nama Jurusan</th>

                      <th className="px-6 py-4 text-center">👨 Laki-Laki</th>

                      <th className="px-6 py-4 text-center">👩 Perempuan</th>

                      <th className="px-6 py-4 text-center">Total</th>

                      <th className="px-6 py-4 text-center">Kuota</th>

                      <th className="px-6 py-4 text-center">Selisih</th>

                      <th className="px-6 py-4 text-center">Persentase (%)</th>

                    </tr>

                  </thead>

                  <tbody>

                    {rekapJurusan.map((item: any, index) => (

                      <tr
                        key={index}
                        className="border-t border-slate-100 hover:bg-slate-50"
                      >

                        <td className="px-6 py-4">{index + 1}</td>

                        <td className="px-6 py-4 font-semibold">{item.nama}</td>

                        <td className="px-6 py-4 text-center">{item.pilihan1.laki}</td>

                        <td className="px-6 py-4 text-center">{item.pilihan1.perempuan}</td>

                        <td className="px-6 py-4 text-center font-bold text-blue-600">{item.pilihan1.total}</td>

                        <td className="px-6 py-4 text-center font-semibold">{item.kuota}</td>

                        <td className={`px-6 py-4 text-center font-bold ${
                          item.selisih1 > 0 ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {item.selisih1 > 0 ? '+' : ''}{item.selisih1}
                        </td>

                        <td className="px-6 py-4 text-center font-semibold">{item.persentase1}%</td>

                      </tr>

                    ))}

                  </tbody>

                </table>

              </div>

            </div>

            {/* PILIHAN KEDUA */}
            <div className="bg-white rounded-[28px] border border-slate-200 shadow-xl overflow-hidden">

              <div className="px-6 py-5 border-b border-slate-200 bg-gradient-to-r from-purple-50 to-purple-100">
                <h3 className="text-2xl font-bold text-slate-800">
                  🔄 Pilihan Kedua (Alternatif)
                </h3>
              </div>

              <div className="overflow-auto">

                <table className="w-full min-w-[1000px]">

                  <thead className="bg-purple-100">

                    <tr>

                      <th className="px-6 py-4 text-left">No</th>

                      <th className="px-6 py-4 text-left">Nama Jurusan</th>

                      <th className="px-6 py-4 text-center">👨 Laki-Laki</th>

                      <th className="px-6 py-4 text-center">👩 Perempuan</th>

                      <th className="px-6 py-4 text-center">Total</th>

                      <th className="px-6 py-4 text-center">Kuota</th>

                      <th className="px-6 py-4 text-center">Selisih</th>

                      <th className="px-6 py-4 text-center">Persentase (%)</th>

                    </tr>

                  </thead>

                  <tbody>

                    {rekapJurusan.map((item: any, index) => (

                      <tr
                        key={index}
                        className="border-t border-slate-100 hover:bg-slate-50"
                      >

                        <td className="px-6 py-4">{index + 1}</td>

                        <td className="px-6 py-4 font-semibold">{item.nama}</td>

                        <td className="px-6 py-4 text-center">{item.pilihan2Actual.laki}</td>

                        <td className="px-6 py-4 text-center">{item.pilihan2Actual.perempuan}</td>

                        <td className="px-6 py-4 text-center font-bold text-purple-600">{item.pilihan2Actual.total}</td>

                        <td className="px-6 py-4 text-center font-semibold">{item.kuota2}</td>

                        <td className={`px-6 py-4 text-center font-bold ${
                          item.selisih2 > 0 ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {item.selisih2 > 0 ? '+' : ''}{item.selisih2}
                        </td>

                        <td className="px-6 py-4 text-center font-semibold">{item.persentase2}%</td>

                      </tr>

                    ))}

                  </tbody>

                </table>

              </div>

            </div>

          </div>

        )}

        {/* REKAP SEKOLAH */}
        {menu === "sekolah" && (

          <div className="bg-white rounded-[32px] border border-slate-200 shadow-xl overflow-hidden">

            <div className="px-6 py-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between gap-4">

              <h2 className="text-2xl font-bold text-slate-800">
                🏫 Rekap Sekolah
              </h2>

              <button
                onClick={downloadSekolahPdf}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                Download PDF
              </button>

            </div>

            <div className="overflow-auto">

              <table className="w-full min-w-[700px]">

                <thead className="bg-slate-100">

                  <tr>

                    <th className="px-6 py-4 text-left">
                      No
                    </th>

                    <th className="px-6 py-4 text-left">
                      Nama Sekolah
                    </th>

                    <th className="px-6 py-4 text-center">
                      👨 Laki-Laki
                    </th>

                    <th className="px-6 py-4 text-center">
                      👩 Perempuan
                    </th>

                    <th className="px-6 py-4 text-center">
                      📋 Total
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {rekapSekolah.map((item: any, index) => (

                    <tr
                      key={index}
                      className="border-t border-slate-100 hover:bg-slate-50"
                    >

                      <td className="px-6 py-4">
                        {index + 1}
                      </td>

                      <td className="px-6 py-4 font-semibold">
                        {item.nama}
                      </td>

                      <td className="px-6 py-4 text-center">
                        {item.laki}
                      </td>

                      <td className="px-6 py-4 text-center">
                        {item.perempuan}
                      </td>

                      <td className="px-6 py-4 text-center font-bold">
                        {item.total}
                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

          </div>

        )}

        {/* REKAP ADMIN */}
        {menu === "admin" && (

          <div className="space-y-5">

            {/* HEADER ADMIN */}
            <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 rounded-[28px] p-4 md:p-5 text-white shadow-xl">

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-center">

                {/* KIRI */}
                <div>

                  <div className="flex items-center gap-3">

                    <div className="text-3xl">
                      📊
                    </div>

                    <div>

                      <h2 className="text-xl md:text-2xl font-bold tracking-tight">
                        Rekap Admin
                      </h2>

                      <p className="text-slate-300 mt-1 text-xs md:text-sm">
                        Statistik keseluruhan data Pra SMPB SMKN 1 Cipanas
                      </p>

                    </div>

                  </div>

                </div>

                {/* TENGAH */}
                <div className="flex justify-center">

                  <div className="bg-white/10 backdrop-blur-md rounded-[22px] px-4 py-4 border border-white/10 w-full max-w-sm text-center min-h-[220px] flex flex-col justify-center">

                    <div className="grid grid-cols-2 gap-3">

                      <div className="text-center">

                        <div className="text-3xl mb-2">
                          👨
                        </div>

                        <div className="text-xs text-slate-300">
                          Laki-Laki
                        </div>

                        <div className="text-2xl md:text-3xl font-bold mt-2">
                          {totalLaki}
                        </div>

                      </div>

                      <div className="text-center">

                        <div className="text-3xl mb-2">
                          👩
                        </div>

                        <div className="text-xs text-slate-300">
                          Perempuan
                        </div>

                        <div className="text-2xl md:text-3xl font-bold mt-2">
                          {totalPerempuan}
                        </div>

                      </div>

                    </div>

                    <div className="my-4 border-t border-white/10"></div>

                    <div className="grid grid-cols-2 gap-3">

                      <div className="text-center">

                        <div className="text-3xl mb-2">
                          📍
                        </div>

                        <div className="text-xs text-slate-300">
                          Banten
                        </div>

                        <div className="text-2xl md:text-3xl font-bold mt-2">
                          {totalBanten}
                        </div>

                      </div>

                      <div className="text-center">

                        <div className="text-3xl mb-2">
                          🌍
                        </div>

                        <div className="text-xs text-slate-300">
                          Luar Banten
                        </div>

                        <div className="text-2xl md:text-3xl font-bold mt-2">
                          {totalLuarBanten}
                        </div>

                      </div>

                    </div>

                  </div>

                </div>

                {/* KANAN */}
                <div className="flex justify-center lg:justify-end">

                  <div className="bg-white/10 backdrop-blur-md rounded-[22px] px-4 py-4 border border-white/10 w-full max-w-sm text-center min-h-[220px] flex flex-col justify-center">

                    <div className="text-3xl mb-2">
                      🎯
                    </div>

                    <div className="text-xs text-slate-300">
                      Total Kuota
                    </div>

                    <div className="text-2xl md:text-3xl font-bold mt-2">
                      {KUOTA}
                    </div>

                    <div className="mt-4 pt-3 border-t border-white/10">

                      <div className="text-[11px] text-slate-300">
                        🕒 Update Data
                      </div>

                      <div className="text-xs font-semibold mt-1">
                        20 Mei 2026 • 20.00 WIB
                      </div>

                    </div>

                  </div>

                </div>

              </div>

            </div>

            <div className="flex justify-end">
              <button
                onClick={downloadAdminPdf}
                className="rounded-2xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
              >
                Download PDF
              </button>
            </div>

            {/* CARD STATISTIK ADMIN */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">

              <div className="bg-white rounded-[26px] p-5 shadow-xl border border-slate-200">

                <div className="flex items-center justify-between">

                  <div>

                    <p className="text-slate-500 text-sm">
                      📋 Total Pendaftar
                    </p>

                    <h3 className="text-3xl md:text-4xl font-bold text-slate-800 mt-4">
                      {totalPendaftar}
                    </h3>

                  </div>

                  <div className="text-4xl">
                    🧾
                  </div>

                </div>

              </div>

              <div className="bg-gradient-to-br from-cyan-500 to-blue-700 rounded-[26px] p-5 shadow-xl text-white">

                <div className="flex items-center justify-between">

                  <div>

                    <p className="text-cyan-100 text-sm">
                      ✅ Sudah Aktivasi
                    </p>

                    <h3 className="text-3xl md:text-4xl font-bold mt-4">
                      {totalSudahAktivasi}
                    </h3>

                  </div>

                  <div className="text-4xl">
                    🔓
                  </div>

                </div>

              </div>

              <div className="bg-gradient-to-br from-orange-400 to-red-600 rounded-[26px] p-5 shadow-xl text-white">

                <div className="flex items-center justify-between">

                  <div>

                    <p className="text-orange-100 text-sm">
                      ⏳ Belum Aktivasi
                    </p>

                    <h3 className="text-3xl md:text-4xl font-bold mt-4">
                      {totalBelumAktivasi}
                    </h3>

                  </div>

                  <div className="text-4xl">
                    🔒
                  </div>

                </div>

              </div>

              <div className="bg-gradient-to-br from-pink-500 to-rose-700 rounded-[26px] p-5 shadow-xl text-white">

                <div className="flex items-center justify-between">

                  <div>

                    <p className="text-pink-100 text-sm">
                      📝 Belum Revisi
                    </p>

                    <h3 className="text-3xl md:text-4xl font-bold mt-4">
                      {totalBelumRevisi}
                    </h3>

                  </div>

                  <div className="text-4xl">
                    📄
                  </div>

                </div>

              </div>

              <div className="bg-gradient-to-br from-violet-500 to-purple-700 rounded-[26px] p-5 shadow-xl text-white">

                <div className="flex items-center justify-between">

                  <div>

                    <p className="text-violet-100 text-sm">
                      🆕 Ajuan Baru
                    </p>

                    <h3 className="text-3xl md:text-4xl font-bold mt-4">
                      {totalAjuanBaru}
                    </h3>

                  </div>

                  <div className="text-4xl">
                    📥
                  </div>

                </div>

              </div>

              <div className="bg-gradient-to-br from-slate-700 to-slate-900 rounded-[26px] p-5 shadow-xl text-white">

                <div className="flex items-center justify-between">

                  <div>

                    <p className="text-slate-300 text-sm">
                      🎯 Selisih Kuota
                    </p>

                    <h3 className="text-3xl md:text-4xl font-bold mt-4">

                      {totalPendaftar > KUOTA
                        ? `+${totalPendaftar - KUOTA}`
                        : `-${KUOTA - totalPendaftar}`}

                    </h3>

                  </div>

                  <div className="text-4xl">
                    📈
                  </div>

                </div>

              </div>

            </div>

          </div>

        )}

      </div>

      {/* PASSWORD MODAL */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-[28px] p-8 shadow-2xl max-w-md w-full mx-4">
            <h3 className="text-2xl font-bold text-slate-800 mb-4">🔐 Masukkan Password</h3>
            <input
              type="password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handlePasswordSubmit()}
              placeholder="Password"
              className="w-full px-4 py-3 border border-slate-200 rounded-2xl mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowPasswordModal(false)}
                className="flex-1 px-4 py-3 rounded-2xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-all"
              >
                Batal
              </button>
              <button
                onClick={handlePasswordSubmit}
                className="flex-1 px-4 py-3 rounded-2xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-all"
              >
                Buka
              </button>
            </div>
          </div>
        </div>
      )}

    </main>
  );
}