"use client";

import { useEffect, useState } from "react";

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

  const filteredData = data.filter((item) => {
    if (!search) return true;

    return Object.values(item)
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase());
  });

  return (
    <main className="min-h-screen bg-gray-200 p-3 md:p-6">
      <div className="max-w-5xl mx-auto">

        <div className="bg-white rounded-2xl shadow-lg p-4 md:p-6 mb-5">
          <h1 className="text-2xl md:text-4xl font-bold text-black">
            Rekap Verifikasi & Aktivasi
          </h1>

          <p className="text-gray-800 text-sm md:text-base mt-2">
            Data laporan verval siswa
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-md p-4 mb-5">
          <input
            type="text"
            placeholder="Cari berdasarkan NISN atau Nama"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border border-gray-300 rounded-xl p-3 text-black outline-none"
          />
        </div>

        <div className="grid gap-4">

          {filteredData.map((item, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl shadow-md border border-gray-300 p-4"
            >

              {Object.entries(item).map(([key, value], i) => (
                <div
                  key={i}
                  className="py-3 border-b border-gray-200 last:border-b-0"
                >

                  <div className="text-xs uppercase font-semibold text-gray-700 mb-1">
                    {key}
                  </div>

                  <div className="text-sm md:text-base text-black font-medium break-words">
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