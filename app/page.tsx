"use client";

import { useEffect, useMemo, useState } from "react";
import { jsPDF } from "jspdf";

export default function Home() {

  const [data, setData] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  const [menu, setMenu] = useState("dashboard");

  const [unlockSekolah, setUnlockSekolah] = useState(false);
  const [unlockAdmin, setUnlockAdmin] = useState(false);

  const KUOTA = 288;

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
    const date = "19 Mei 2026 • 20.00 WIB";

    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text(title, 40, 50);
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(`Tanggal download: ${date}`, 40, 70);

    const headers = ["No", "Sekolah", "Laki-laki", "Perempuan", "Total"];
    const colX = [40, 80, 380, 460, 540];
    let y = 110;

    doc.setFillColor(240, 240, 240);
    doc.rect(36, y - 14, 520, 22, "F");
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(36, y + 8, 556, y + 8);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    headers.forEach((header, index) => {
      doc.text(header, colX[index], y);
    });

    y += 28;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);

    let sumLaki = 0;
    let sumPerempuan = 0;
    let sumTotal = 0;

    rekapSekolah.forEach((item: any, index: number) => {
      if (y > 760) {
        doc.addPage();
        y = 60;
      }

      doc.text(String(index + 1), colX[0], y);
      doc.text(item.nama, colX[1], y, { maxWidth: 280 });
      doc.text(String(item.laki), colX[2], y, { align: "right" });
      doc.text(String(item.perempuan), colX[3], y, { align: "right" });
      doc.text(String(item.total), colX[4], y, { align: "right" });
      doc.line(36, y + 6, 556, y + 6);

      sumLaki += Number(item.laki) || 0;
      sumPerempuan += Number(item.perempuan) || 0;
      sumTotal += Number(item.total) || 0;

      y += 20;
    });

    // Footer totals
    if (y > 720) {
      doc.addPage();
      y = 60;
    }

    y += 6;
    doc.setLineWidth(1);
    doc.line(36, y, 556, y);
    y += 12;

    doc.setFont("helvetica", "bold");
    doc.text("TOTAL", colX[1], y);
    doc.text(String(sumLaki), colX[2], y, { align: "right" });
    doc.text(String(sumPerempuan), colX[3], y, { align: "right" });
    doc.text(String(sumTotal), colX[4], y, { align: "right" });

    doc.save("rekap-sekolah.pdf");
  };

  const downloadAdminPdf = () => {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const title = "Rekap Admin";
    const date = "19 Mei 2026 • 20.00 WIB";

    const rows = [
      ["Total Pendaftar", String(totalPendaftar)],
      ["Sudah Aktivasi", String(totalSudahAktivasi)],
      ["Belum Aktivasi", String(totalBelumAktivasi)],
      ["Belum Revisi", String(totalBelumRevisi)],
      ["Ajuan Baru", String(totalAjuanBaru)],
      ["Total Laki-laki", String(totalLaki)],
      ["Total Perempuan", String(totalPerempuan)],
      ["Banten", String(totalBanten)],
      ["Luar Banten", String(totalLuarBanten)],
      ["Kuota", String(KUOTA)],
      ["Selisih Kuota", totalPendaftar > KUOTA ? `+${totalPendaftar - KUOTA}` : `-${KUOTA - totalPendaftar}`],
    ];

    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text(title, 40, 50);
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(`Tanggal download: ${date}`, 40, 68);

    const boxX = 40;
    let y = 100;
    const labelWidth = 220;
    const valueX = 320;

    rows.forEach(([label, value], index) => {
      if (y > 760) {
        doc.addPage();
        y = 60;
      }

      doc.setFillColor(245, 245, 245);
      doc.rect(boxX, y - 6, 500, 24, "F");
      doc.setDrawColor(220, 220, 220);
      doc.rect(boxX, y - 6, 500, 24);

      doc.setFont("helvetica", "bold");
      doc.text(label, boxX + 8, y + 10);
      doc.setFont("helvetica", "normal");
      doc.text(value, valueX + 8, y + 10);

      y += 34;
    });

    doc.save("rekap-admin.pdf");
  };

  // =========================
  // LOCK MENU
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
            Update data: 19 Mei 2026 • 20.00 WIB
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
                        19 Mei 2026 • 20.00 WIB
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

    </main>
  );
}