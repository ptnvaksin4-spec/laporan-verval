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
  // FILTER SEARCH
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

  // SUDAH AKTIVASI
  const totalSudahAktivasi = data.filter((item) => {

    const aktivasiKey = Object.keys(item).find(
      (key) =>
        key.toLowerCase().includes("aktivasi")
    );

    const value = aktivasiKey
      ? String(item[aktivasiKey]).toLowerCase()
      : "";

    return value.includes("sudah");

  }).length;

  // BELUM AKTIVASI
  const totalBelumAktivasi = data.filter((item) => {

    const aktivasiKey = Object.keys(item).find(
      (key) =>
        key.toLowerCase().includes("aktivasi")
    );

    const value = aktivasiKey
      ? String(item[aktivasiKey]).toLowerCase()
      : "";

    return value.includes("belum");

  }).length;

  // BELUM REVISI
  const totalBelumRevisi = data.filter((item) => {

    const revisiKey = Object.keys(item).find(
      (key) =>
        key.toLowerCase().includes("ajuan")
    );

    const value = revisiKey
      ? String(item[revisiKey]).toLowerCase()
      : "";

    return value.includes("belum mengajukan revisi");

  }).length;

  // AJUAN BARU
  const totalAjuanBaru = data.filter((item) => {

    const revisiKey = Object.keys(item).find(
      (key) =>
        key.toLowerCase().includes("ajuan")
    );

    const value = revisiKey
      ? String(item[revisiKey]).toLowerCase()
      : "";

    return value.includes("ajuan baru");

  }).length;

  // =========================
  // JENIS KELAMIN
  // =========================

  const totalLaki = data.filter((item) => {

    const jkKey = Object.keys(item).find(
      (key) =>
        key.toLowerCase().includes("kelamin") ||
        key.toLowerCase() === "jk"
    );

    const value = jkKey
      ? String(item[jkKey]).toLowerCase()
      : "";

    return (
      value === "l" ||
      value.includes("laki")
    );

  }).length;

  const totalPerempuan = data.filter((item) => {

    const jkKey = Object.keys(item).find(
      (key) =>
        key.toLowerCase().includes("kelamin") ||
        key.toLowerCase() === "jk"
    );

    const value = jkKey
      ? String(item[jkKey]).toLowerCase()
      : "";

    return (
      value === "p" ||
      value.includes("perempuan")
    );

  }).length;

  // =========================
  // REKAP WILAYAH
  // =========================

  const totalBanten = data.filter((item) => {

    const wilayahKey = Object.keys(item).find(
      (key) =>
        key.toLowerCase().includes("wilayah")
    );

    const value = wilayahKey
      ? String(item[wilayahKey]).toLowerCase()
      : "";

    return value.includes("banten");

  }).length;

  const totalLuarBanten = data.filter((item) => {

    const wilayahKey = Object.keys(item).find(
      (key) =>
        key.toLowerCase().includes("wilayah")
    );

    const value = wilayahKey
      ? String(item[wilayahKey]).toLowerCase()
      : "";

    return value.includes("luar banten");

  }).length;

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

      map.set(
        wilayah,
        map.get(wilayah) + 1
      );

    });

    return Array.from(map.entries()).sort(
      (a: any, b: any) => b[1] - a[1]
    );

  }, [data]);

  // =========================
  // REKAP SEKOLAH
  // =========================

  const rekapSekolah = useMemo(() => {

    const sekolahMap = new Map();

    data.forEach((item) => {

      const sekolahKey = Object.keys(item).find(
        (key) =>
          key.toLowerCase().includes("sekolah")
      );

      const namaSekolah = sekolahKey
        ? item[sekolahKey]
        : "Tidak Diketahui";

      const jkKey = Object.keys(item).find(
        (key) =>
          key.toLowerCase().includes("kelamin") ||
          key.toLowerCase() === "jk"
      );

      const jenisKelamin = jkKey
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

      const sekolah: any =
        sekolahMap.get(namaSekolah);

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

  // =========================
  // MENU LOCK
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
            Update data: 18 Mei 2026 • 19.00 WIB
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

        {/* REKAP ADMIN */}
        {menu === "admin" && (

          <div className="space-y-8">

            {/* HEADER ADMIN */}
            <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 rounded-[36px] p-8 md:p-10 text-white shadow-2xl">

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">

                {/* KIRI */}
                <div>

                  <div className="flex items-center gap-3">

                    <div className="text-5xl">
                      📊
                    </div>

                    <div>

                      <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
                        Rekap Admin
                      </h2>

                      <p className="text-slate-300 mt-2 text-sm md:text-base">
                        Statistik keseluruhan data Pra SMPB SMKN 1 Cipanas
                      </p>

                    </div>

                  </div>

                </div>

                {/* TENGAH */}
                <div className="flex justify-center">

                  <div className="bg-white/10 backdrop-blur-md rounded-[28px] px-8 py-6 border border-white/10 w-full max-w-md">

                    {/* JK */}
                    <div className="grid grid-cols-2 gap-4">

                      {/* LAKI */}
                      <div className="text-center bg-white/5 rounded-2xl p-4">

                        <div className="text-5xl mb-2">
                          👨
                        </div>

                        <div className="text-sm text-slate-300">
                          Laki-Laki
                        </div>

                        <div className="text-4xl font-bold mt-2">
                          {totalLaki}
                        </div>

                      </div>

                      {/* PEREMPUAN */}
                      <div className="text-center bg-white/5 rounded-2xl p-4">

                        <div className="text-5xl mb-2">
                          👩
                        </div>

                        <div className="text-sm text-slate-300">
                          Perempuan
                        </div>

                        <div className="text-4xl font-bold mt-2">
                          {totalPerempuan}
                        </div>

                      </div>

                    </div>

                    {/* WILAYAH */}
                    <div className="grid grid-cols-2 gap-4 mt-4">

                      {/* BANTEN */}
                      <div className="text-center bg-white/5 rounded-2xl p-4">

                        <div className="text-5xl mb-2">
                          📍
                        </div>

                        <div className="text-sm text-slate-300">
                          Banten
                        </div>

                        <div className="text-4xl font-bold mt-2">
                          {totalBanten}
                        </div>

                      </div>

                      {/* LUAR BANTEN */}
                      <div className="text-center bg-white/5 rounded-2xl p-4">

                        <div className="text-5xl mb-2">
                          🌎
                        </div>

                        <div className="text-sm text-slate-300">
                          Luar Banten
                        </div>

                        <div className="text-4xl font-bold mt-2">
                          {totalLuarBanten}
                        </div>

                      </div>

                    </div>

                  </div>

                </div>

                {/* KANAN */}
                <div className="flex justify-end">

                  <div className="bg-white/10 backdrop-blur-md rounded-3xl px-6 py-5 border border-white/10 min-w-[220px] text-center">

                    <div className="text-4xl mb-2">
                      🎯
                    </div>

                    <div className="text-sm text-slate-300">
                      Total Kuota
                    </div>

                    <div className="text-5xl font-bold mt-3">
                      {KUOTA}
                    </div>

                    <div className="mt-5 pt-4 border-t border-white/10">

                      <div className="text-xs text-slate-300">
                        🕒 Update Data
                      </div>

                      <div className="text-sm font-semibold mt-1">
                        18 Mei 2026 • 19.00 WIB
                      </div>

                    </div>

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