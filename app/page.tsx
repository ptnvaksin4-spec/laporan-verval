"use client";

import { useEffect, useMemo, useState } from "react";

export default function Home() {
  const [data, setData] = useState<any[]>([]);
  const [search, setSearch] = useState("");

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

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      if (!search) return true;

      return Object.values(item)
        .join(" ")
        .toLowerCase()
        .includes(search.toLowerCase());
    });
  }, [data, search]);

  return (
    <main className="min-h-screen bg-slate-100">

      <div className="max-w-7xl mx-auto p-4 md:p-8">

        {/* HEADER */}
        <div className="bg-gradient-to-r from-blue-800 via-indigo-700 to-blue-600 rounded-[32px] shadow-2xl p-6 md:p-10 text-white mb-8">

          <div>
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight">
              Pra SMPB SMKN 1 Cipanas
            </h1>

            <p className="text-blue-100 mt-3 text-sm md:text-lg">
              Dashboard Verifikasi dan Aktivasi Peserta
            </p>
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
                  filteredData.filter((item) =>
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
                  filteredData.filter((item) =>
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
                  filteredData.filter(
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
                  filteredData.filter(
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

        {/* SEARCH */}
        <div className="bg-white rounded-[28px] shadow-xl border border-slate-200 p-4 md:p-6 mb-8">

          <div className="flex items-center gap-3">

            <div className="text-slate-500 text-xl">
              🔍
            </div>

            <input
              type="text"
              placeholder="Cari berdasarkan NISN atau Nama Peserta"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-black text-sm md:text-base outline-none"
            />

          </div>

        </div>

        {/* CARD DATA */}
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

      </div>

    </main>
  );
}