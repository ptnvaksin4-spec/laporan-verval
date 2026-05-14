"use client";

import { useEffect, useMemo, useState } from "react";

export default function Home() {
  const [data, setData] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [view, setView] = useState("nama");

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
    let temp = data;

    if (view === "aktivasi") {
      temp = temp.filter((item) =>
        Object.values(item)
          .join(" ")
          .toLowerCase()
          .includes("sudah aktivasi")
      );
    }

    if (view === "belumaktivasi") {
      temp = temp.filter((item) =>
        Object.values(item)
          .join(" ")
          .toLowerCase()
          .includes("belum aktivasi")
      );
    }

    if (view === "sudahrevisi") {
      temp = temp.filter((item) =>
        Object.values(item)
          .join(" ")
          .toLowerCase()
          .includes("sudah mengajukan revisi")
      );
    }

    if (view === "belumrevisi") {
      temp = temp.filter((item) =>
        Object.values(item)
          .join(" ")
          .toLowerCase()
          .includes("belum mengajukan revisi")
      );
    }

    if (search) {
      temp = temp.filter((item) =>
        Object.values(item)
          .join(" ")
          .toLowerCase()
          .includes(search.toLowerCase())
      );
    }

    return temp;
  }, [data, search, view]);

  const headers =
    data.length > 0
      ? Object.keys(data[0]).filter(
          (key) => !key.toLowerCase().includes("waktu")
        )
      : [];

  return (
    <main className="min-h-screen bg-slate-200">
      <div className="max-w-7xl mx-auto p-3 md:p-6">

        <div className="bg-gradient-to-r from-blue-800 to-indigo-800 rounded-3xl shadow-xl p-5 md:p-10 mb-5 text-white">

          <h1 className="text-2xl md:text-5xl font-bold">
            Pra SMPB SMKN 1 Cipanas
          </h1>

          <p className="text-white text-sm md:text-lg mt-3">
            Portal Verifikasi dan Aktivasi Peserta
          </p>

          <div className="mt-4 inline-block bg-white text-black px-4 py-2 rounded-2xl text-sm font-semibold">
            Total Data: {filteredData.length}
          </div>

        </div>

        <div className="bg-white rounded-3xl shadow-lg border border-slate-300 p-4 md:p-6 mb-5">

          <input
            type="text"
            placeholder="Cari berdasarkan NISN atau Nama"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border-2 border-slate-400 rounded-2xl p-4 text-black text-sm md:text-base outline-none mb-4"
          />

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">

            <button
              onClick={() => setView("nama")}
              className={`p-3 rounded-2xl font-bold text-sm md:text-base transition-all ${
                view === "nama"
                  ? "bg-blue-700 text-white"
                  : "bg-slate-300 text-black"
              }`}
            >
              Nama
            </button>

            <button
              onClick={() => setView("aktivasi")}
              className={`p-3 rounded-2xl font-bold text-sm md:text-base transition-all ${
                view === "aktivasi"
                  ? "bg-blue-700 text-white"
                  : "bg-slate-300 text-black"
              }`}
            >
              Aktivasi
            </button>

            <button
              onClick={() => setView("belumaktivasi")}
              className={`p-3 rounded-2xl font-bold text-sm md:text-base transition-all ${
                view === "belumaktivasi"
                  ? "bg-red-700 text-white"
                  : "bg-slate-300 text-black"
              }`}
            >
              Belum Aktivasi
            </button>

            <button
              onClick={() => setView("sudahrevisi")}
              className={`p-3 rounded-2xl font-bold text-sm md:text-base transition-all ${
                view === "sudahrevisi"
                  ? "bg-green-700 text-white"
                  : "bg-slate-300 text-black"
              }`}
            >
              Sudah Revisi
            </button>

            <button
              onClick={() => setView("belumrevisi")}
              className={`p-3 rounded-2xl font-bold text-sm md:text-base transition-all ${
                view === "belumrevisi"
                  ? "bg-yellow-500 text-black"
                  : "bg-slate-300 text-black"
              }`}
            >
              Belum Revisi
            </button>

          </div>

        </div>

        {view === "nama" && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">

            {filteredData.map((item, index) => (
              <div
                key={index}
                className="bg-white rounded-3xl shadow-md border-2 border-slate-300 p-4"
              >

                <div className="flex justify-between items-center mb-4">

                  <div className="text-blue-800 font-bold">
                    Data Peserta
                  </div>

                  <div className="bg-slate-200 text-black px-3 py-1 rounded-full text-xs font-bold">
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
                      className="py-3 border-b border-slate-200 last:border-b-0"
                    >

                      <div className="text-xs font-bold uppercase text-slate-600 mb-1">
                        {key}
                      </div>

                      <div className="text-sm md:text-base text-black font-semibold break-words">
                        {String(value)}
                      </div>

                    </div>
                  ))}

              </div>
            ))}

          </div>
        )}

        {(view === "aktivasi" ||
          view === "belumaktivasi" ||
          view === "sudahrevisi" ||
          view === "belumrevisi") && (
          <div className="bg-white rounded-3xl shadow-lg border-2 border-slate-300 overflow-hidden">

            <div className="overflow-x-auto">

              <table className="w-full text-[11px] md:text-sm">

                <thead className="bg-blue-800 text-white">
                  <tr>

                    {headers.map((header, index) => (
                      <th
                        key={index}
                        className="p-2 md:p-4 text-left whitespace-nowrap border border-blue-700"
                      >
                        {header}
                      </th>
                    ))}

                  </tr>
                </thead>

                <tbody>

                  {filteredData.map((item, rowIndex) => (
                    <tr
                      key={rowIndex}
                      className="border-b border-slate-300 even:bg-slate-100"
                    >

                      {headers.map((header, colIndex) => (
                        <td
                          key={colIndex}
                          className="p-2 md:p-3 text-black whitespace-nowrap border border-slate-300"
                        >
                          {item[header]}
                        </td>
                      ))}

                    </tr>
                  ))}

                </tbody>

              </table>

            </div>

          </div>
        )}

      </div>
    </main>
  );
}