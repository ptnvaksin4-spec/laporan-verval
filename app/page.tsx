"use client";

import { useEffect, useMemo, useState } from "react";

export default function Home() {
  const [data, setData] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  const [menu, setMenu] = useState("dashboard");

  // LOCK MENU
  const [unlockSekolah, setUnlockSekolah] = useState(false);
  const [unlockAdmin, setUnlockAdmin] = useState(false);

  // KUOTA
  const KUOTA = 288;

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

    if (!search.trim()) return [];

    return data.filter((item) => {

      return Object.values(item)
        .join(" ")
        .toLowerCase()
        .includes(search.toLowerCase());

    });

  }, [data, search]);

  // TOTAL DATA
  const totalPendaftar = data.length;

  const totalSudahAktivasi = data.filter((item) => {

    const value = Object.values(item)
      .join(" ")
      .toLowerCase();

    return value.includes("sudah aktivasi");

  }).length;

  const totalBelumAktivasi = data.filter((item) => {

    const value = Object.values(item)
      .join(" ")
      .toLowerCase();

    return value.includes("belum aktivasi");

  }).length;

  const totalBelumRevisi = data.filter((item) => {

    const value = Object.values(item)
      .join(" ")
      .toLowerCase();

    return value.includes("belum mengajukan revisi");

  }).length;

  const totalAjuanBaru = data.filter((item) => {

    const value = Object.values(item)
      .join(" ")
      .toLowerCase();

    return value.includes("ajuan baru");

  }).length;

  // TOTAL JENIS KELAMIN
  const totalLaki = data.filter((item) => {

    const value = Object.values(item)
      .join(" ")
      .toLowerCase();

    return (
      value.includes("laki") ||
      value.includes('"l"')
    );

  }).length;

  const totalPerempuan = data.filter((item) => {

    const value = Object.values(item)
      .join(" ")
      .toLowerCase();

    return (
      value.includes("perempuan") ||
      value.includes('"p"')
    );

  }).length;

  // ASAL WILAYAH
  const wilayahMap = useMemo(() => {

    const map = new Map();

    data.forEach((item) => {

      const wilayahKey = Object.keys(item).find(
        (key) =>
          key.toLowerCase().includes("wilayah")
      );

      const wilayah = wilayahKey
        ? item[wilayahKey]
        : "Tidak Diketahui";

      if (!map.has(wilayah)) {
        map.set(wilayah, 0);
      }

      map.set(wilayah, map.get(wilayah) + 1);

    });

    return Array.from(map.entries()).sort(
      (a: any, b: any) => b[1] - a[1]
    );

  }, [data]);

  // REKAP SEKOLAH
  const rekapSekolah = useMemo(() => {

    const sekolahMap = new Map();

    data.forEach((item) => {

      const sekolahKey = Object.keys(item).find((key) =>
        key.toLowerCase().includes("sekolah")
      );

      const namaSekolah = sekolahKey
        ? item[sekolahKey]
        : "Tidak Diketahui";

      const jkKey = Object.keys(item).find(
        (key) =>
          key.toLowerCase().includes("jenis kelamin") ||
          key.toLowerCase() === "jk"
      );

      const jenisKelamin = jkKey
        ? String(item[jkKey]).toLowerCase().trim()
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
        jenisKelamin === "l" ||
        jenisKelamin.includes("laki")
      ) {
        sekolah.laki += 1;
      }

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

  // MENU REKAP SEKOLAH
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

  // MENU REKAP ADMIN
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
        <div className="bg-gradient-to-r from-blue-800 via-indigo-700 to-blue-600 rounded-[32px] shadow-2xl p-6 md:p-10 text-white mb-8">

          <h1 className="text-3xl md:text-5xl font-bold tracking-tight">
            Pra SMPB SMKN 1 Cipanas
          </h1>

          <div className="mt-3">

            <p className="text-blue-100 text-sm md:text-lg">
              Informasi Status Ajuan Akun Pra SMPB
            </p>

            <p className="text-blue-200 text-xs md:text-sm mt-1">
              Update data: 18 Mei 2026 • 19.00 WIB
            </p>

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

        {/* SEARCH */}
        {menu === "dashboard" && (

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

        )}

        {/* DASHBOARD */}
        {menu === "dashboard" && (

          <>
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

            {filteredData.length > 0 && (

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">

                {filteredData.map((item, index) => (

                  <div
                    key={index}
                    className="bg-white rounded-[28px] border border-slate-200 shadow-md overflow-hidden"
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

          <div className="bg-white rounded-[28px] border border-slate-200 shadow-xl overflow-hidden">

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
                      Laki-Laki
                    </th>

                    <th className="px-6 py-4 text-center">
                      Perempuan
                    </th>

                    <th className="px-6 py-4 text-center">
                      Total
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {rekapSekolah.map((item: any, index) => (

                    <tr
                      key={index}
                      className="border-t border-slate-100"
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

          <div className="space-y-8">

            {/* HEADER ADMIN */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-[32px] p-8 text-white shadow-2xl">

              <h2 className="text-3xl md:text-4xl font-bold">
                Rekap Admin
              </h2>

              <p className="text-slate-300 mt-2">
                Statistik keseluruhan data Pra SMPB SMKN 1 Cipanas
              </p>

            </div>

            {/* STATISTIK */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">

              <div className="bg-white rounded-[28px] p-6 shadow-lg border border-slate-200">

                <div className="flex items-center justify-between">

                  <div>

                    <p className="text-sm text-slate-500">
                      Total Pendaftar
                    </p>

                    <h3 className="text-4xl font-bold text-slate-800 mt-2">
                      {totalPendaftar}
                    </h3>

                  </div>

                  <div className="text-5xl">
                    📋
                  </div>

                </div>

              </div>

              <div className="bg-gradient-to-br from-cyan-500 to-blue-600 rounded-[28px] p-6 shadow-lg text-white">

                <div className="flex items-center justify-between">

                  <div>

                    <p className="text-sm text-cyan-100">
                      Sudah Aktivasi
                    </p>

                    <h3 className="text-4xl font-bold mt-2">
                      {totalSudahAktivasi}
                    </h3>

                  </div>

                  <div className="text-5xl">
                    ✅
                  </div>

                </div>

              </div>

              <div className="bg-gradient-to-br from-orange-400 to-red-500 rounded-[28px] p-6 shadow-lg text-white">

                <div className="flex items-center justify-between">

                  <div>

                    <p className="text-sm text-orange-100">
                      Belum Aktivasi
                    </p>

                    <h3 className="text-4xl font-bold mt-2">
                      {totalBelumAktivasi}
                    </h3>

                  </div>

                  <div className="text-5xl">
                    ⏳
                  </div>

                </div>

              </div>

              <div className="bg-gradient-to-br from-pink-500 to-rose-600 rounded-[28px] p-6 shadow-lg text-white">

                <div className="flex items-center justify-between">

                  <div>

                    <p className="text-sm text-pink-100">
                      Belum Revisi
                    </p>

                    <h3 className="text-4xl font-bold mt-2">
                      {totalBelumRevisi}
                    </h3>

                  </div>

                  <div className="text-5xl">
                    📝
                  </div>

                </div>

              </div>

              <div className="bg-gradient-to-br from-violet-500 to-purple-700 rounded-[28px] p-6 shadow-lg text-white">

                <div className="flex items-center justify-between">

                  <div>

                    <p className="text-sm text-violet-100">
                      Ajuan Baru
                    </p>

                    <h3 className="text-4xl font-bold mt-2">
                      {totalAjuanBaru}
                    </h3>

                  </div>

                  <div className="text-5xl">
                    🆕
                  </div>

                </div>

              </div>

              <div className="bg-gradient-to-br from-slate-700 to-slate-900 rounded-[28px] p-6 shadow-lg text-white">

                <div className="flex items-center justify-between">

                  <div>

                    <p className="text-sm text-slate-300">
                      Selisih Kuota
                    </p>

                    <h3 className="text-4xl font-bold mt-2">

                      {totalPendaftar > KUOTA
                        ? `+${totalPendaftar - KUOTA}`
                        : `-${KUOTA - totalPendaftar}`}

                    </h3>

                    <p className="text-xs text-slate-400 mt-2">
                      Kuota Maksimal {KUOTA}
                    </p>

                  </div>

                  <div className="text-5xl">
                    🎯
                  </div>

                </div>

              </div>

            </div>

            {/* JENIS KELAMIN */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              <div className="bg-white rounded-[28px] p-8 shadow-lg border border-slate-200">

                <div className="flex items-center justify-between">

                  <div>

                    <p className="text-slate-500 text-sm">
                      Total Laki-Laki
                    </p>

                    <h3 className="text-5xl font-bold text-blue-700 mt-3">
                      {totalLaki}
                    </h3>

                  </div>

                  <div className="text-6xl">
                    👨
                  </div>

                </div>

              </div>

              <div className="bg-white rounded-[28px] p-8 shadow-lg border border-slate-200">

                <div className="flex items-center justify-between">

                  <div>

                    <p className="text-slate-500 text-sm">
                      Total Perempuan
                    </p>

                    <h3 className="text-5xl font-bold text-pink-600 mt-3">
                      {totalPerempuan}
                    </h3>

                  </div>

                  <div className="text-6xl">
                    👩
                  </div>

                </div>

              </div>

            </div>

            {/* REKAP WILAYAH */}
            <div className="bg-white rounded-[32px] shadow-xl border border-slate-200 overflow-hidden">

              <div className="px-8 py-6 border-b border-slate-200 bg-slate-50">

                <h2 className="text-2xl font-bold text-slate-800">
                  Rekap Asal Wilayah
                </h2>

                <p className="text-slate-500 mt-1 text-sm">
                  Distribusi asal wilayah peserta
                </p>

              </div>

              <div className="overflow-auto">

                <table className="w-full">

                  <thead className="bg-slate-100">

                    <tr>

                      <th className="px-6 py-4 text-left text-sm font-bold text-slate-600">
                        No
                      </th>

                      <th className="px-6 py-4 text-left text-sm font-bold text-slate-600">
                        Asal Wilayah
                      </th>

                      <th className="px-6 py-4 text-center text-sm font-bold text-slate-600">
                        Jumlah
                      </th>

                    </tr>

                  </thead>

                  <tbody>

                    {wilayahMap.map((item: any, index) => (

                      <tr
                        key={index}
                        className="border-t border-slate-100 hover:bg-slate-50 transition-all"
                      >

                        <td className="px-6 py-4">
                          {index + 1}
                        </td>

                        <td className="px-6 py-4 font-semibold text-slate-700">
                          {item[0]}
                        </td>

                        <td className="px-6 py-4 text-center">

                          <span className="bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-bold">
                            {item[1]}
                          </span>

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