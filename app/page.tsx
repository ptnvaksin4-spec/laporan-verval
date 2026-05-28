"use client";

import { useEffect, useMemo, useState } from "react";
import { jsPDF } from "jspdf";

// Definisikan tipe data item biar aman dari 'any'
interface PendaftarItem {
  [key: string]: string;
}

export default function Home() {
  const [data, setData] = useState<PendaftarItem[]>([]);
  const [search, setSearch] = useState("");
  const [menu, setMenu] = useState("dashboard");

  const [unlockSekolah, setUnlockSekolah] = useState(false);
  const [unlockAdmin, setUnlockAdmin] = useState(false);

  const [currentTime, setCurrentTime] = useState("");
  const [dataUpdateTime, setDataUpdateTime] = useState("");

  const KUOTA = 288;

  const formatDateTime = (date: Date) => {
    const day = String(date.getDate()).padStart(2, "0");
    const bulan = [
      "Januari", "Februari", "Maret", "April", "Mei", "Mei", 
      "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];
    const month = bulan[date.getMonth()];
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${day} ${month} ${year} • ${hours}.${minutes} WIB`;
  };

  const getCurrentTimeText = () => currentTime || formatDateTime(new Date());
  const getDataUpdateTimeText = () => dataUpdateTime || getCurrentTimeText();

  // =========================
  // LOAD CSV (Fix Bug \r Windows)
  // =========================
  useEffect(() => {
    fetch(`/laporan.csv?t=${Date.now()}`, { cache: "no-store" })
      .then((res) => {
        const lastModified = res.headers.get("last-modified");
        if (lastModified) {
          setDataUpdateTime(formatDateTime(new Date(lastModified)));
        }
        return res.text();
      })
      .then((text) => {
        if (!text.trim()) return;

        // Pisahkan menggunakan regex agar mendeteksi \n maupun \r\n
        const rows = text
          .trim()
          .split(/\r?\n/)
          .map((row) => row.split(","));

        if (rows.length === 0) return;

        const headers = rows[0].map(h => h.trim());

        const result = rows.slice(1).map((row) => {
          const obj: PendaftarItem = {};
          headers.forEach((header, index) => {
            obj[header] = row[index]?.trim() || "";
          });
          return obj;
        });

        setData(result);
      })
      .catch((err) => console.error("Gagal memuat file CSV:", err));
  }, []);

  // =========================
  // UPDATE TIME CLOCK
  // =========================
  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(formatDateTime(new Date()));
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
    const searchLower = search.toLowerCase();

    return data.filter((item) => {
      return Object.values(item)
        .join(" ")
        .toLowerCase()
        .includes(searchLower);
    });
  }, [data, search]);

  // =========================
  // HITUNG STATISTIK (DIOPTIMALKAN)
  // =========================
  const stats = useMemo(() => {
    let sudahAktivasi = 0;
    let belumAktivasi = 0;
    let belumRevisi = 0;
    let ajuanBaru = 0;
    let laki = 0;
    let perempuan = 0;
    let banten = 0;
    let luarBanten = 0;

    data.forEach((item) => {
      // Cari key secara dinamis per baris data
      const keys = Object.keys(item);
      const aktivasiKey = keys.find((k) => k.toLowerCase().includes("aktivasi"));
      const ajuanKey = keys.find((k) => k.toLowerCase().includes("ajuan"));
      const jkKey = keys.find((k) => k.toLowerCase().includes("kelamin") || k.toLowerCase() === "jk");
      const wilayahKey = keys.find((k) => k.toLowerCase().includes("wilayah"));

      const aktivasiVal = aktivasiKey ? item[aktivasiKey].toLowerCase() : "";
      const ajuanVal = ajuanKey ? item[ajuanKey].toLowerCase() : "";
      const jkVal = jkKey ? item[jkKey].toLowerCase() : "";
      const wilayahVal = wilayahKey ? item[wilayahKey].toLowerCase() : "";

      if (aktivasiVal.includes("sudah")) sudahAktivasi++;
      if (aktivasiVal.includes("belum")) belumAktivasi++;
      if (ajuanVal.includes("belum mengajukan revisi")) belumRevisi++;
      if (ajuanVal.includes("ajuan baru")) ajuanBaru++;

      if (jkVal === "l" || jkVal.includes("laki")) laki++;
      if (jkVal === "p" || jkVal.includes("perempuan")) perempuan++;

      if (wilayahVal === "banten") {
        banten++;
      } else if (wilayahVal !== "") {
        luarBanten++;
      }
    });

    return {
      totalPendaftar: data.length,
      sudahAktivasi,
      belumAktivasi,
      belumRevisi,
      ajuanBaru,
      laki,
      perempuan,
      banten,
      luarBanten
    };
  }, [data]);

  // =========================
  // REKAP SEKOLAH
  // =========================
  const rekapSekolah = useMemo(() => {
    const sekolahMap = new Map<string, { nama: string; laki: number; perempuan: number; total: number }>();

    data.forEach((item) => {
      const keys = Object.keys(item);
      const sekolahKey = keys.find((k) => k.toLowerCase().includes("sekolah"));
      const jkKey = keys.find((k) => k.toLowerCase().includes("kelamin") || k.toLowerCase() === "jk");

      const rawNamaSekolah = sekolahKey ? item[sekolahKey] : "";
      const namaSekolah = rawNamaSekolah.trim().replace(/\s+/g, " ") || "Tidak Diketahui";
      const jk = jkKey ? item[jkKey].toLowerCase() : "";

      if (!sekolahMap.has(namaSekolah)) {
        sekolahMap.set(namaSekolah, {
          nama: namaSekolah,
          laki: 0,
          perempuan: 0,
          total: 0,
        });
      }

      const sekolah = sekolahMap.get(namaSekolah)!;

      if (jk === "l" || jk.includes("laki")) sekolah.laki += 1;
      if (jk === "p" || jk.includes("perempuan")) sekolah.perempuan += 1;
      sekolah.total += 1;
    });

    return Array.from(sekolahMap.values()).sort((a, b) => b.total - a.total);
  }, [data]);

  // =========================
  // EXPORT PDF HANDLERS
  // =========================
  const downloadSekolahPdf = () => {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const title = "Rekap Sekolah";
    const date = getDataUpdateTimeText();

    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 40;
    let y = 56;

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
    const cols = [
      margin, 
      margin + colWidths[0], 
      margin + colWidths[0] + colWidths[1], 
      margin + colWidths[0] + colWidths[1] + colWidths[2], 
      margin + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3]
    ];

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

    rekapSekolah.forEach((item, idx) => {
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

      sumLaki += item.laki;
      sumPerempuan += item.perempuan;
      sumTotal += item.total;

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

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated by Pra SMPB Reporting • ${date}`, margin, pageH - margin + 10);

    doc.save("rekap-sekolah.pdf");
  };

  const downloadAdminPdf = () => {
    const doc = new jsPDF({ unit: "pt", format: "a4", orientation: "landscape" });
    const title = "Rekap Admin";
    const date = getDataUpdateTimeText();

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
    const statsData = [
      { label: "Total Pendaftar", value: String(stats.totalPendaftar), color: [10, 70, 140] },
      { label: "Laki-laki", value: String(stats.laki), color: [0, 120, 60] },
      { label: "Perempuan", value: String(stats.perempuan), color: [180, 25, 40] },
      { label: "Kuota", value: String(KUOTA), color: [120, 120, 120] },
    ];

    statsData.forEach((stat, index) => {
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
      ["Sudah Aktivasi", String(stats.sudahAktivasi)],
      ["Belum Aktivasi", String(stats.belumAktivasi)],
      ["Belum Revisi", String(stats.belumRevisi)],
      ["Ajuan Baru", String(stats.ajuanBaru)],
      ["Banten", String(stats.banten)],
      ["Luar Banten", String(stats.luarBanten)],
      ["Selisih Kuota", stats.totalPendaftar > KUOTA ? `+${stats.totalPendaftar - KUOTA}` : `-${KUOTA - stats.totalPendaftar}`],
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

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(110, 110, 110);
    doc.text(`Generated by Pra SMPB Reporting • ${date}`, margin, pageH - margin + 10);

    doc.save("rekap-admin.pdf");
  };

  // =========================
  // LOCK MENU HANDLERS
  // =========================
  const handleOpenSekolah = () => {
    if (unlockSekolah) {
      setMenu("sekolah");
      return;
    }
    const kode = prompt("Masukkan kode akses");
    if (kode === "20607872") {
      setUnlockSekolah(true);
      setMenu("sekolah");
    } else {
      alert("Kode akses salah");
    }
  };

  const handleOpenAdmin = () => {
    if (unlockAdmin) {
      setMenu("admin");
      return;
    }
    const kode = prompt("Masukkan kode admin");
    if (kode === "999666") {
      setUnlockAdmin(true);
      setMenu("admin");
    } else {
      alert("Kode admin salah");
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
            Update data: {getDataUpdateTimeText() || "Loading..."}
          </p>
        </div>

        {/* MENU */}
        <div className="flex gap-3 mb-8 overflow-auto">
          <button
            onClick={() => setMenu("dashboard")}
            className={`px-5 py-3 rounded-2xl text-sm font-semibold transition-all ${
              menu === "dashboard"
                ? "bg-blue-600 text-white"
                : "bg-white text-slate-700 border border-slate-200"
            }`}
          >
            Dashboard
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
                <div className="text-slate-500 text-xl">🔍</div>
                <input
                  type="text"
                  placeholder="Cari berdasarkan Nama, NISN, atau Sekolah"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full text-black text-sm md:text-base outline-none"
                />
              </div>
            </div>

            {filteredData.length === 0 && (
              <div className="bg-white rounded-[32px] border border-slate-200 shadow-md p-10 text-center">
                <div className="text-6xl mb-5">🔎</div>
                <h2 className="text-2xl font-bold text-slate-700">
                  {search ? "Data tidak ditemukan" : "Cari Data Peserta"}
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
                        .filter(([key]) => !key.toLowerCase().includes("waktu"))
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

        {/* REKAP SEKOLAH */}
        {menu === "sekolah" && (
          <div className="bg-white rounded-[32px] border border-slate-200 shadow-xl overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between gap-4">
              <h2 className="text-2xl font-bold text-slate-800">
                🏫 Rekap Sekolah
              </h2>
              <button
                onClick={downloadSekolahPdf}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 shadow-sm"
              >
                Download PDF
              </button>
            </div>

            <div className="overflow-auto">
              <table className="w-full min-w-[700px]">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="px-6 py-4 text-left">No</th>
                    <th className="px-6 py-4 text-left">Nama Sekolah</th>
                    <th className="px-6 py-4 text-center">👨 Laki-Laki</th>
                    <th className="px-6 py-4 text-center">👩 Perempuan</th>
                    <th className="px-6 py-4 text-center">📋 Total</th>
                  </tr>
                </thead>
                <tbody>
                  {rekapSekolah.map((item, index) => (
                    <tr
                      key={index}
                      className="border-t border-slate-100 hover:bg-slate-50"
                    >
                      <td className="px-6 py-4">{index + 1}</td>
                      <td className="px-6 py-4 font-semibold">{item.nama}</td>
                      <td className="px-6 py-4 text-center">{item.laki}</td>
                      <td className="px-6 py-4 text-center">{item.perempuan}</td>
                      <td className="px-6 py-4 text-center font-bold">{item.total}</td>
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
            <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 rounded-[28px] p-6 text-white shadow-xl">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-center">
                
                {/* KIRI */}
                <div>
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">📊</div>
                    <div>
                      <h2 className="text-xl md:text-2xl font-bold tracking-tight">
                        Rekap Admin
                      </h2>
                      <p className="text-slate-300 mt-1 text-xs md:text-sm">
                        Statistik keseluruhan data Pra SMPB SMKN 1 Cipanas
                      </p>
                    </div>
                  </div>
                  {/* Tombol Cetak PDF diletakkan di dalam container gelap agar kontras */}
                  <div className="mt-4">
                    <button
                      onClick={downloadAdminPdf}
                      className="rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/20"
                    >
                      Download PDF Admin
                    </button>
                  </div>
                </div>

                {/* TENGAH */}
                <div className="flex justify-center">
                  <div className="bg-white/10 backdrop-blur-md rounded-[22px] px-4 py-4 border border-white/10 w-full max-w-sm text-center min-h-[220px] flex flex-col justify-center">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="text-center">
                        <div className="text-3xl mb-2">👨</div>
                        <div className="text-xs text-slate-300">Laki-Laki</div>
                        <div className="text-2xl md:text-3xl font-bold mt-2">{stats.laki}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl mb-2">👩</div>
                        <div className="text-xs text-slate-300">Perempuan</div>
                        <div className="text-2xl md:text-3xl font-bold mt-2">{stats.perempuan}</div>
                      </div>
                    </div>
                    <div className="my-4 border-t border-white/10"></div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="text-center">
                        <div className="text-3xl mb-2">📍</div>
                        <div className="text-xs text-slate-300">Banten</div>
                        <div className="text-2xl md:text-3xl font-bold mt-2">{stats.banten}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl mb-2">🌍</div>
                        <div className="text-xs text-slate-300">Luar Banten</div>
                        <div className="text-2xl md:text-3xl font-bold mt-2">{stats.luarBanten}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* KANAN */}
                <div className="flex justify-center lg:justify-end">
                  <div className="bg-white/10 backdrop-blur-md rounded-[22px] px-4 py-4 border border-white/10 w-full max-w-sm text-center min-h-[220px] flex flex-col justify-center">
                    <div className="text-3xl mb-2">🎯</div>
                    <div className="text-xs text-slate-300">Total Kuota</div>
                    <div className="text-2xl md:text-3xl font-bold mt-2">{KUOTA}</div>
                    <div className="mt-4 pt-3 border-t border-white/10">
                      <div className="text-[11px] text-slate-300">🕒 Update Data</div>
                      <div className="text-xs font-semibold mt-1">{getDataUpdateTimeText()}</div>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* CARD STATISTIK ADMIN */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              <div className="bg-white rounded-[26px] p-5 shadow-xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-500 text-sm">📋 Total Pendaftar</p>
                    <h3 className="text-3xl md:text-4xl font-bold text-slate-800 mt-4">{stats.totalPendaftar}</h3>
                  </div>
                  <div className="text-4xl">🧾</div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-cyan-500 to-blue-700 rounded-[26px] p-5 shadow-xl text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-cyan-100 text-sm">✅ Sudah Aktivasi</p>
                    <h3 className="text-3xl md:text-4xl font-bold mt-4">{stats.sudahAktivasi}</h3>
                  </div>
                  <div className="text-4xl">🔓</div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-orange-400 to-red-600 rounded-[26px] p-5 shadow-xl text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100 text-sm">⏳ Belum Aktivasi</p>
                    <h3 className="text-3xl md:text-4xl font-bold mt-4">{stats.belumAktivasi}</h3>
                  </div>
                  <div className="text-4xl">🔒</div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-pink-500 to-rose-700 rounded-[26px] p-5 shadow-xl text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-pink-100 text-sm">📝 Belum Revisi</p>
                    <h3 className="text-3xl md:text-4xl font-bold mt-4">{stats.belumRevisi}</h3>
                  </div>
                  <div className="text-4xl">📄</div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-violet-500 to-purple-700 rounded-[26px] p-5 shadow-xl text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-violet-100 text-sm">🆕 Ajuan Baru</p>
                    <h3 className="text-3xl md:text-4xl font-bold mt-4">{stats.ajuanBaru}</h3>
                  </div>
                  <div className="text-4xl">📥</div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-slate-700 to-slate-900 rounded-[26px] p-5 shadow-xl text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-300 text-sm">🎯 Selisih Kuota</p>
                    <h3 className="text-3xl md:text-4xl font-bold mt-4">
                      {stats.totalPendaftar > KUOTA
                        ? `+${stats.totalPendaftar - KUOTA}`
                        : `-${KUOTA - stats.totalPendaftar}`}
                    </h3>
                  </div>
                  <div className="text-4xl">📈</div>
                </div>
              </div>
            </div>

          </div>
        )}

      </div>
    </main>
  );
}