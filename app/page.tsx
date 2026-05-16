"use client";

import { useEffect, useMemo, useState } from "react";

export default function Home() {
  const [data, setData] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [menu, setMenu] = useState("dashboard");

  // LOCK MENU REKAP SEKOLAH
  const [unlockSekolah, setUnlockSekolah] = useState(false);

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

  // FILTER DATA
  const filteredData = useMemo(() => {

    // DATA HANYA MUNCUL SETELAH SEARCH
    if (!search.trim()) return [];

    return data.filter((item) => {

      return Object.values(item)
        .join(" ")
        .toLowerCase()
        .includes(search.toLowerCase());

    });

  }, [data, search]);

  // REKAP SEKOLAH
  const rekapSekolah = useMemo(() => {

    const sekolahMap = new Map();

    data.forEach((item) => {

      // CARI KOLOM SEKOLAH
      const sekolahKey = Object.keys(item).find((key) =>
        key.toLowerCase().includes("sekolah")
      );

      const namaSekolah = sekolahKey
        ? item[sekolahKey]
        : "Tidak Diketahui";

      // CARI KOLOM JENIS KELAMIN
      const jkKey = Object.keys(item).find(
        (key) =>
          key.toLowerCase().includes("jenis kelamin") ||
          key.toLowerCase() === "jk"
      );

      const jenisKelamin = jkKey
        ? String(item[jkKey]).toLowerCase().trim()
        : "";

      // BUAT DATA SEKOLAH
      if (!sekolahMap.has(namaSekolah)) {

        sekolahMap.set(namaSekolah, {
          nama: namaSekolah,
          laki: 0,
          perempuan: 0,
          total: 0,
        });

      }

      const sekolah: any = sekolahMap.get(namaSekolah);

      // LAKI-LAKI
      if (
        jenisKelamin === "l" ||
        jenisKelamin.includes("laki")
      ) {
        sekolah.laki += 1;
      }

      // PEREMPUAN
      if (
        jenisKelamin === "p" ||
        jenisKelamin.includes("perempuan")
      ) {
        sekolah.perempuan += 1;
      }

      sekolah.total += 1;

    });

    return Array.from(sekolahMap.values()).sort(
      (a: any, b: any) => b.total - a.total
    );

  }, [data]);

  // BUKA MENU REKAP SEKOLAH
  const handleOpenSekolah = () => {

    // JIKA SUDAH TERBUKA
    if (unlockSekolah) {
      setMenu("sekolah");
      return;
    }

    // INPUT KODE
    const kode = prompt("Masukkan kode akses");

    // CEK KODE
    if (kode === "20607872") {

      setUnlockSekolah(true);
      setMenu("sekolah");

    } else {

      alert("Kode akses salah");

    }

  };

  return (
    <main className="min-h-screen bg-slate-100">

      <div className="max-w-7xl mx-auto p-4 md:p-8">

        {/* HEADER */}
        <div className="bg-gradient-to-r from-blue-800 via-indigo-700 to-blue-600 rounded-[32px] shadow-2xl p-6 md:p-10 text-white mb-8">

          <div>

            <h1 className="text-3xl md:text-5xl font-bold tracking-tight">
              Pra SMPB SMKN 1 Cipanas
            </h1>

            <div className="mt-3">

              <p className="text-blue-100 text-sm md:text-lg">
                Informasi Status Ajuan Akun Pra SMPB
              </p>

              <p className="text-blue-200 text-xs md:text-sm mt-1">
                Update data: 16 Mei 2026 • 19.30 WIB
              </p>

            </div>

          </div>

          {/* STATISTIK */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">

            {/* SUDAH AKTIVASI */}
            <div className="bg-cyan-500/20 backdrop-blur-md rounded-3xl p-5 border border-cyan-300/20">

              <div className="text-sm text-cyan-100">
                Sudah Aktivasi
              </div>

              <div className="text-3xl font-bold mt-2">
                {
                  data.filter((item) =>
                    item["Status Aktivasi"]
                      ?.toLowerCase()
                      .includes("sudah")
                  ).length
                }
              </div>

            </div>

            {/* BELUM AKTIVASI */}
            <div className="bg-white/15 backdrop-blur-md rounded-3xl p-5 border border-white/10">

              <div className="text-sm text-blue-100">
                Belum Aktivasi
              </div>

              <div className="text-3xl font-bold mt-2">
                {
                  data.filter((item) =>
                    item["Status Aktivasi"]
                      ?.toLowerCase()
                      .includes("belum")
                  ).length
                }
              </div>

            </div>

            {/* MENGAJUKAN REVISI */}
            <div className="bg-green-500/20 backdrop-blur-md rounded-3xl p-5 border border-green-300/20">

              <div className="text-sm text-green-100">
                Mengajukan Revisi
              </div>

              <div className="text-3xl font-bold mt-2">
                {
                  data.filter(
                    (item) =>
                      item["Status Ajuan"]
                        ?.toLowerCase()
                        .trim() === "mengajukan revisi"
                  ).length
                }
              </div>

            </div>

            {/* BELUM REVISI */}
            <div className="bg-red-500/20 backdrop-blur-md rounded-3xl p-5 border border-red-300/20">

              <div className="text-sm text-red-100">
                Belum Revisi
              </div>

              <div className="text-3xl font-bold mt-2">
                {
                  data.filter(
                    (item) =>
                      item["Status Ajuan"]
                        ?.toLowerCase()
                        .trim() === "belum mengajukan revisi"
                  ).length
                }
              </div>

            </div>

          </div>

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

        </div>

        {/* SEARCH */}
        <div className="bg-white rounded-[28px] shadow-xl border border-slate-200 p-4 md:p-6 mb-8">

          <div className="flex items-center gap-3">

            <div className="text-slate-500 text-xl">
              🔍
            </div>

            <input
              type="text"
              placeholder="Cari berdasarkan Nama, NISN, atau Sekolah"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-black text-sm md:text-base outline-none"
            />

          </div>

        </div>

        {/* DASHBOARD */}
        {menu === "dashboard" && (

          <>
            {/* PESAN AWAL */}
            {filteredData.length === 0 && (

              <div className="bg-white rounded-[28px] border border-slate-200 shadow-md p-10 text-center">

                <div className="text-5xl mb-4">
                  🔍
                </div>

                <h2 className="text-xl font-bold text-slate-700">
                  Cari Data Peserta
                </h2>

                <p className="text-slate-500 mt-2">
                  Masukkan Nama atau NISN untuk menampilkan data peserta.
                </p>

              </div>

            )}

            {/* DATA PESERTA */}
            {filteredData.length > 0 && (

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">

                {filteredData.map((item, index) => (

                  <div
                    key={index}
                    className="bg-white rounded-[28px] border border-slate-200 shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden"
                  >

                    <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-5 py-4 border-b border-slate-200 flex items-center justify-between">

                      <div>

                        <div className="text-sm font-bold text-blue-700">
                          Data Peserta
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

          <div className="space-y-6">

            {/* STATISTIK REKAP */}
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">

              {/* TOTAL PENDAFTAR */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-md p-5">

                <div className="text-xs text-slate-500 font-semibold">
                  Total Pendaftar
                </div>

                <div className="text-3xl font-bold text-slate-800 mt-2">
                  {data.length}
                </div>

              </div>

              {/* SUDAH AKTIVASI */}
              <div className="bg-cyan-50 rounded-3xl border border-cyan-200 shadow-md p-5">

                <div className="text-xs text-cyan-700 font-semibold">
                  Sudah Aktivasi
                </div>

                <div className="text-3xl font-bold text-cyan-700 mt-2">
                  {
                    data.filter((item) =>
                      item["Status Aktivasi"]
                        ?.toLowerCase()
                        .includes("sudah")
                    ).length
                  }
                </div>

              </div>

              {/* BELUM AKTIVASI */}
              <div className="bg-blue-50 rounded-3xl border border-blue-200 shadow-md p-5">

                <div className="text-xs text-blue-700 font-semibold">
                  Belum Aktivasi
                </div>

                <div className="text-3xl font-bold text-blue-700 mt-2">
                  {
                    data.filter((item) =>
                      item["Status Aktivasi"]
                        ?.toLowerCase()
                        .includes("belum")
                    ).length
                  }
                </div>

              </div>

              {/* SUDAH REVISI */}
              <div className="bg-green-50 rounded-3xl border border-green-200 shadow-md p-5">

                <div className="text-xs text-green-700 font-semibold">
                  Sudah Revisi
                </div>

                <div className="text-3xl font-bold text-green-700 mt-2">
                  {
                    data.filter(
                      (item) =>
                        item["Status Ajuan"]
                          ?.toLowerCase()
                          .trim() === "mengajukan revisi"
                    ).length
                  }
                </div>

              </div>

              {/* BELUM REVISI */}
              <div className="bg-red-50 rounded-3xl border border-red-200 shadow-md p-5">

                <div className="text-xs text-red-700 font-semibold">
                  Belum Revisi
                </div>

                <div className="text-3xl font-bold text-red-700 mt-2">
                  {
                    data.filter(
                      (item) =>
                        item["Status Ajuan"]
                          ?.toLowerCase()
                          .trim() === "belum mengajukan revisi"
                    ).length
                  }
                </div>

              </div>

              {/* AJUAN BARU */}
              <div className="bg-yellow-50 rounded-3xl border border-yellow-200 shadow-md p-5">

                <div className="text-xs text-yellow-700 font-semibold">
                  Ajuan Baru
                </div>

                <div className="text-3xl font-bold text-yellow-700 mt-2">
                  {
                    data.filter(
                      (item) =>
                        item["Status Ajuan"]
                          ?.toLowerCase()
                          .includes("ajuan baru")
                    ).length
                  }
                </div>

              </div>

            </div>

            {/* TABEL SEKOLAH */}
            <div className="bg-white rounded-[28px] border border-slate-200 shadow-xl overflow-hidden">

              <div className="overflow-auto">

                <table className="w-full min-w-[700px]">

                  <thead className="bg-slate-100">

                    <tr>

                      <th className="text-left px-6 py-4 text-sm font-bold text-slate-700">
                        No
                      </th>

                      <th className="text-left px-6 py-4 text-sm font-bold text-slate-700">
                        Nama Sekolah
                      </th>

                      <th className="text-center px-6 py-4 text-sm font-bold text-slate-700">
                        Laki-Laki
                      </th>

                      <th className="text-center px-6 py-4 text-sm font-bold text-slate-700">
                        Perempuan
                      </th>

                      <th className="text-center px-6 py-4 text-sm font-bold text-slate-700">
                        Total
                      </th>

                    </tr>

                  </thead>

                  <tbody>

                    {rekapSekolah.map((item: any, index) => (

                      <tr
                        key={index}
                        className="border-t border-slate-100 hover:bg-slate-50"
                      >

                        <td className="px-6 py-4 text-sm text-slate-700">
                          {index + 1}
                        </td>

                        <td className="px-6 py-4 text-sm font-semibold text-slate-800">
                          {item.nama}
                        </td>

                        <td className="px-6 py-4 text-center text-sm text-blue-700 font-bold">
                          {item.laki}
                        </td>

                        <td className="px-6 py-4 text-center text-sm text-pink-700 font-bold">
                          {item.perempuan}
                        </td>

                        <td className="px-6 py-4 text-center text-sm font-bold text-slate-900">
                          {item.total}
                        </td>

                      </tr>

                    ))}

                  </tbody>

                </table>

              </div>

            </div>

          </div>

        )}

      </div>

    </main>
  );
}