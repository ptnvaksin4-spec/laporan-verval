"use client";

import { useEffect, useState } from "react";

export default function Home() {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    fetch("/laporan.csv")
      .then((res) => res.text())
      .then((text) => {
        const rows = text.split("\n").map((row) => row.split(","));

        const headers = rows[0];

        const result = rows.slice(1).map((row) => {
          let obj: any = {};

          headers.forEach((header, index) => {
            obj[header.trim()] = row[index];
          });

          return obj;
        });

        setData(result);
      });
  }, []);

  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">

        <div className="bg-white rounded-3xl shadow-lg p-8 mb-8">
          <h1 className="text-4xl font-bold mb-3">
            Rekap Verifikasi & Aktivasi
          </h1>

          <p className="text-gray-600">
            Data Rekap 14 Mei Jam 5
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-lg p-6 overflow-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                {data[0] &&
                  Object.keys(data[0]).map((key, index) => (
                    <th
                      key={index}
                      className="border p-3 text-left"
                    >
                      {key}
                    </th>
                  ))}
              </tr>
            </thead>

            <tbody>
              {data.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {Object.values(row).map((value: any, colIndex) => (
                    <td
                      key={colIndex}
                      className="border p-3"
                    >
                      {value}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}