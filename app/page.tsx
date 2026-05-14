"use client";

import { useEffect, useState } from "react";

export default function Home() {
  const [data, setData] = useState<any[]>([]);

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

  return (
    <main className="min-h-screen bg-gray-100 p-3 md:p-6">
      <div className="max-w-5xl mx-auto">

        <div className="bg-white rounded-2xl shadow-md p-4 md:p-6 mb-5">
          <h1 className="text-xl md:text-3xl font-bold">
            Rekap Verifikasi & Aktivasi
          </h1>

          <p className="text-gray-500 text-sm mt-2">
            Data laporan verval siswa
          </p>
        </div>

        <div className="grid gap-4">

          {data.map((item, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl shadow-sm border p-4"
            >

              {Object.entries(item).map(([key, value], i) => (
                <div
                  key={i}
                  className="py-2 border-b last:border-b-0"
                >

                  <div className="text-xs uppercase text-gray-500 mb-1">
                    {key}
                  </div>

                  <div className="text-sm md:text-base font-medium break-words">
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