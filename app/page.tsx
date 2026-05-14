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
            obj[header.trim()] = row[index] || "";
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

  const totalMengajukan = filteredData.filter((item) => {
    const text = Object.values(item)
      .join(" ")
      .toLowerCase();

    return (
      text.includes("mengajukan revisi") &&
      !text.includes("belum mengajukan revisi")
    );
  }).length;

  const totalBelumMengajukan = filteredData.filter((item) => {
    const text = Object.values(item)
      .join(" ")
      .toLowerCase();

    return text.includes("belum mengajukan revisi");
  }).length;

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="max-w-7xl mx-auto p-3 md:p-6">

        <div className="bg-gradient-to-r from-blue-700 to-indigo-700 rounded-3xl shadow-xl p-6 md:p-10 mb-6 text-white">

          <h1 className="text-3xl md:text-5xl font-bold tracking-tight">
            Pra SMPB SMKN 1 Cipanas
          </h1>

          <p className="text-blue-100 text-sm md:text-lg mt-3">
            Portal Data Verifikasi dan Aktivasi Peserta
          </p>

          <div className="flex flex-wrap gap-3 mt-5">

            <div className="bg-white/20 backdrop-blur px-4 py-2 rounded-2xl text-sm">
              Total Data: {filteredData.length}
            </div>

            <div className="bg-green-500/30 backdrop-blur px-4 py-2 rounded-2xl text-sm">
              Mengajukan Revisi: {totalMengajukan}
            </div>

            <div className="bg-red-500/30 backdrop-blur px-4 py-2 rounded-2xl text-sm">
              Belum Mengajukan: {totalBelumMengajukan}
            </div>

          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-lg border border-slate-200 p-4 md:p-6 mb-6">

          <input
            type="text"
            placeholder="Cari berdasarkan NISN atau Nama"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border border-slate-300 rounded-2xl p-4 text-black outline-none focus:ring-4 focus:ring-blue-100"
          />

        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">

          {filteredData.map((item, index) => (
            <div
              key={index}
              className="bg-white rounded-3xl shadow-md border border-slate-200 p-5 hover:shadow-xl transition-all"
            >

              <div className="flex items-center justify-between mb-4">

                <div className="text-sm font-bold text-blue-700">
                  Data Peserta
                </div>

                <div className="text-xs bg-slate-100 px-3 py-1 rounded-full text-slate-600">
                  #{index + 1}
                </div>

              </div>

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

                    <div className="text-xs uppercase tracking-wide font-semibold text-slate-500 mb-1">
                      {key}
                    </div>

                    <div className="text-sm md:text-base text-slate-900 font-semibold break-words">
                      {String(value)}
                    </div>

                  </div>
                ))}

            </div>
          ))}

        </div>

      </div>
    </main>
  );
}