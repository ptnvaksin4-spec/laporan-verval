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

  const totalSudahAktivasi = data.filter((item) =>
    item["Status Aktivasi"]
      ?.toLowerCase()
      .includes("sudah")
  ).length;

  const totalBelumAktivasi = data.filter((item) =>
    item["Status Aktivasi"]
      ?.toLowerCase()
      .includes("belum")
  ).length;

  const totalSudahRevisi = data.filter(
    (item) =>
      item["Status Ajuan"]
        ?.toLowerCase()
        .trim() === "mengajukan revisi"
  ).length;

  const totalBelumRevisi = data.filter(
    (item) =>
      item["Status Ajuan"]
        ?.toLowerCase()
        .trim() === "belum mengajukan revisi"
  ).length;

  const totalAjuanBaru = data.filter(
    (item) =>
      item["Status Ajuan"]
        ?.toLowerCase()
        .includes("ajuan baru")
  ).length;

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

      const wilayah =
        item["Asal Wilayah"] || "Tidak Diketahui";

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

          <div className="space-y-6">

            {/* KARTU STATISTIK */}
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">

              <div className="bg-white rounded-3xl p-5 shadow-md border">
                <div className="text-sm text-slate-500">
                  Total Pendaftar
                </div>
                <div className="text-3xl font-bold mt-2">
                  {totalPendaftar}
                </div>
              </div>

              <div className="bg-cyan-50 rounded-3xl p-5 shadow-md border">
                <div className="text-sm text-cyan-700">
                  Sudah Aktivasi
                </div>
                <div className="text-3xl font-bold mt-2 text-cyan-700">
                  {totalSudahAktivasi}
                </div>
              </div>

              <div className="bg-blue-50 rounded-3xl p-5 shadow-md border">
                <div className="text-sm text-blue-700">
                  Belum Aktivasi
                </div>
                <div className="text-3xl font-bold mt-2 text-blue-700">
                  {totalBelumAktivasi}
                </div>
              </div>

              <div className="bg-red-50 rounded-3xl p-5 shadow-md border">
                <div className="text-sm text-red-700">
                  Belum Revisi
                </div>
                <div className="text-3xl font-bold mt-2 text-red-700">
                  {totalBelumRevisi}
                </div>
              </div>

              <div className="bg-yellow-50 rounded-3xl p-5 shadow-md border">
                <div className="text-sm text-yellow-700">
                  Ajuan Baru
                </div>
                <div className="text-3xl font-bold mt-2 text-yellow-700">
                  {totalAjuanBaru}
                </div>
              </div>

              <div className="bg-indigo-50 rounded-3xl p-5 shadow-md border">
                <div className="text-sm text-indigo-700">
                  Laki-Laki
                </div>
                <div className="text-3xl font-bold mt-2 text-indigo-700">
                  {totalLaki}
                </div>
              </div>

              <div className="bg-pink-50 rounded-3xl p-5 shadow-md border">
                <div className="text-sm text-pink-700">
                  Perempuan
                </div>
                <div className="text-3xl font-bold mt-2 text-pink-700">
                  {totalPerempuan}
                </div>
              </div>

              <div className="bg-slate-100 rounded-3xl p-5 shadow-md border">

                <div className="text-sm text-slate-700">
                  Kuota 288
                </div>

                <div className="text-2xl font-bold mt-2">

                  {totalPendaftar > KUOTA
                    ? `+${totalPendaftar - KUOTA}`
                    : `-${KUOTA - totalPendaftar}`}

                </div>

                <div className="text-xs text-slate-500 mt-1">
                  Selisih Kuota
                </div>

              </div>

            </div>

            {/* TABEL ASAL WILAYAH */}
            <div className="bg-white rounded-[28px] border border-slate-200 shadow-xl overflow-hidden">

              <div className="px-6 py-5 border-b border-slate-200">

                <h2 className="text-xl font-bold text-slate-800">
                  Rekap Asal Wilayah
                </h2>

              </div>

              <div className="overflow-auto">

                <table className="w-full">

                  <thead className="bg-slate-100">

                    <tr>

                      <th className="px-6 py-4 text-left">
                        No
                      </th>

                      <th className="px-6 py-4 text-left">
                        Asal Wilayah
                      </th>

                      <th className="px-6 py-4 text-center">
                        Jumlah
                      </th>

                    </tr>

                  </thead>

                  <tbody>

                    {wilayahMap.map((item: any, index) => (

                      <tr
                        key={index}
                        className="border-t border-slate-100"
                      >

                        <td className="px-6 py-4">
                          {index + 1}
                        </td>

                        <td className="px-6 py-4 font-semibold">
                          {item[0]}
                        </td>

                        <td className="px-6 py-4 text-center font-bold">
                          {item[1]}
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