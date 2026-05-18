"use client";

import { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export default function Home() {

  const [data, setData] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  const [menu, setMenu] = useState("dashboard");

  const [unlockSekolah, setUnlockSekolah] =
    useState(false);

  const [unlockAdmin, setUnlockAdmin] =
    useState(false);

  const KUOTA = 288;

  // =========================
  // DOWNLOAD EXCEL
  // =========================

  const downloadExcel = (
    dataExport: any[],
    fileName: string
  ) => {

    const worksheet =
      XLSX.utils.json_to_sheet(dataExport);

    const workbook =
      XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "Data"
    );

    const excelBuffer = XLSX.write(
      workbook,
      {
        bookType: "xlsx",
        type: "array",
      }
    );

    const fileData = new Blob(
      [excelBuffer],
      {
        type:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
      }
    );

    saveAs(
      fileData,
      `${fileName}.xlsx`
    );

  };

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

        const result = rows
          .slice(1)
          .map((row) => {

            const obj: any = {};

            headers.forEach(
              (header, index) => {

                obj[header.trim()] =
                  row[index]?.trim() || "";

              }
            );

            return obj;

          });

        setData(result);

      });

  }, []);

  // =========================
  // FILTER DATA
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

  const totalSudahAktivasi =
    data.filter((item) => {

      const key =
        Object.keys(item).find(
          (k) =>
            k.toLowerCase()
              .includes("aktivasi")
        );

      const value = key
        ? String(item[key])
            .toLowerCase()
        : "";

      return value.includes("sudah");

    }).length;

  const totalBelumAktivasi =
    data.filter((item) => {

      const key =
        Object.keys(item).find(
          (k) =>
            k.toLowerCase()
              .includes("aktivasi")
        );

      const value = key
        ? String(item[key])
            .toLowerCase()
        : "";

      return value.includes("belum");

    }).length;

  const totalBelumRevisi =
    data.filter((item) => {

      const key =
        Object.keys(item).find(
          (k) =>
            k.toLowerCase()
              .includes("ajuan")
        );

      const value = key
        ? String(item[key])
            .toLowerCase()
        : "";

      return value.includes(
        "belum mengajukan revisi"
      );

    }).length;

  const totalAjuanBaru =
    data.filter((item) => {

      const key =
        Object.keys(item).find(
          (k) =>
            k.toLowerCase()
              .includes("ajuan")
        );

      const value = key
        ? String(item[key])
            .toLowerCase()
        : "";

      return value.includes(
        "ajuan baru"
      );

    }).length;

  // =========================
  // JK
  // =========================

  const totalLaki =
    data.filter((item) => {

      const key =
        Object.keys(item).find(
          (k) =>
            k.toLowerCase()
              .includes("kelamin") ||
            k.toLowerCase() === "jk"
        );

      const value = key
        ? String(item[key])
            .toLowerCase()
        : "";

      return (
        value === "l" ||
        value.includes("laki")
      );

    }).length;

  const totalPerempuan =
    data.filter((item) => {

      const key =
        Object.keys(item).find(
          (k) =>
            k.toLowerCase()
              .includes("kelamin") ||
            k.toLowerCase() === "jk"
        );

      const value = key
        ? String(item[key])
            .toLowerCase()
        : "";

      return (
        value === "p" ||
        value.includes("perempuan")
      );

    }).length;

  // =========================
  // WILAYAH
  // =========================

  const totalBanten =
    data.filter((item) => {

      const key =
        Object.keys(item).find(
          (k) =>
            k.toLowerCase()
              .includes("wilayah")
        );

      const value = key
        ? String(item[key])
            .toLowerCase()
            .trim()
        : "";

      return value === "banten";

    }).length;

  const totalLuarBanten =
    data.filter((item) => {

      const key =
        Object.keys(item).find(
          (k) =>
            k.toLowerCase()
              .includes("wilayah")
        );

      const value = key
        ? String(item[key])
            .toLowerCase()
            .trim()
        : "";

      return (
        value !== "" &&
        value !== "banten"
      );

    }).length;

  // =========================
  // REKAP SEKOLAH
  // =========================

  const rekapSekolah = useMemo(() => {

    const sekolahMap = new Map();

    data.forEach((item) => {

      const sekolahKey =
        Object.keys(item).find(
          (k) =>
            k.toLowerCase()
              .includes("sekolah")
        );

      const namaSekolah =
        sekolahKey
          ? item[sekolahKey]
          : "Tidak Diketahui";

      const jkKey =
        Object.keys(item).find(
          (k) =>
            k.toLowerCase()
              .includes("kelamin") ||
            k.toLowerCase() === "jk"
        );

      const jk = jkKey
        ? String(item[jkKey])
            .toLowerCase()
        : "";

      if (
        !sekolahMap.has(
          namaSekolah
        )
      ) {

        sekolahMap.set(
          namaSekolah,
          {
            nama: namaSekolah,
            laki: 0,
            perempuan: 0,
            total: 0,
          }
        );

      }

      const sekolah: any =
        sekolahMap.get(
          namaSekolah
        );

      if (
        jk === "l" ||
        jk.includes("laki")
      ) {
        sekolah.laki += 1;
      }

      if (
        jk === "p" ||
        jk.includes("perempuan")
      ) {
        sekolah.perempuan += 1;
      }

      sekolah.total += 1;

    });

    return Array.from(
      sekolahMap.values()
    ).sort(
      (a: any, b: any) =>
        b.total - a.total
    );

  }, [data]);

  // =========================
  // LOCK MENU
  // =========================

  const handleOpenSekolah =
    () => {

      if (unlockSekolah) {

        setMenu("sekolah");
        return;

      }

      const kode =
        prompt(
          "Masukkan kode akses"
        );

      if (kode === "20607872") {

        setUnlockSekolah(true);
        setMenu("sekolah");

      } else {

        alert(
          "Kode akses salah"
        );

      }

    };

  const handleOpenAdmin =
    () => {

      if (unlockAdmin) {

        setMenu("admin");
        return;

      }

      const kode =
        prompt(
          "Masukkan kode admin"
        );

      if (kode === "999666") {

        setUnlockAdmin(true);
        setMenu("admin");

      } else {

        alert(
          "Kode admin salah"
        );

      }

    };

  return (
    <main className="min-h-screen bg-slate-100">

      <div className="max-w-7xl mx-auto p-4 md:p-8">

        {/* HEADER */}
        <div className="bg-gradient-to-r from-blue-800 via-indigo-700 to-blue-600 rounded-[36px] shadow-2xl p-8 md:p-10 text-white mb-8">

          <h1 className="text-3xl md:text-5xl font-bold">
            Pra SMPB SMKN 1 Cipanas
          </h1>

          <p className="text-blue-100 mt-4 text-sm md:text-lg">
            Informasi Status Ajuan Akun Pra SMPB
          </p>

          <p className="text-blue-200 mt-2 text-xs md:text-sm">
            Update data:
            18 Mei 2026 •
            19.00 WIB
          </p>

        </div>

        {/* MENU */}
        <div className="flex gap-3 mb-8 overflow-auto">

          <button
            onClick={() =>
              setMenu("dashboard")
            }
            className={`px-5 py-3 rounded-2xl text-sm font-semibold ${
              menu === "dashboard"
                ? "bg-blue-600 text-white"
                : "bg-white text-slate-700 border border-slate-200"
            }`}
          >
            Dashboard
          </button>

          <button
            onClick={
              handleOpenSekolah
            }
            className={`px-5 py-3 rounded-2xl text-sm font-semibold ${
              menu === "sekolah"
                ? "bg-blue-600 text-white"
                : "bg-white text-slate-700 border border-slate-200"
            }`}
          >
            🔒 Rekap Sekolah
          </button>

          <button
            onClick={
              handleOpenAdmin
            }
            className={`px-5 py-3 rounded-2xl text-sm font-semibold ${
              menu === "admin"
                ? "bg-blue-600 text-white"
                : "bg-white text-slate-700 border border-slate-200"
            }`}
          >
            🔒 Rekap Admin
          </button>

        </div>

        {/* DASHBOARD */}
        {menu ===
          "dashboard" && (
          <>

            <div className="bg-white rounded-[28px] shadow-xl border border-slate-200 p-4 md:p-6 mb-8">

              <div className="flex items-center gap-3">

                <div className="text-xl">
                  🔍
                </div>

                <input
                  type="text"
                  placeholder="Cari Nama, NISN, atau Sekolah"
                  value={search}
                  onChange={(e) =>
                    setSearch(
                      e.target.value
                    )
                  }
                  className="w-full outline-none text-black"
                />

              </div>

            </div>

            {filteredData.length >
              0 && (

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">

                {filteredData.map(
                  (
                    item,
                    index
                  ) => (

                    <div
                      key={index}
                      className="bg-white rounded-[28px] border border-slate-200 shadow-md overflow-hidden"
                    >

                      <div className="bg-slate-100 px-5 py-4 flex justify-between">

                        <div>

                          <div className="text-sm font-bold text-blue-700">
                            📄 Data Peserta
                          </div>

                          <div className="text-xs text-slate-500 mt-1">
                            Detail Verifikasi
                          </div>

                        </div>

                        <div className="bg-blue-600 text-white text-xs px-3 py-1 rounded-full">
                          #
                          {index + 1}
                        </div>

                      </div>

                      <div className="p-5">

                        {Object.entries(
                          item
                        )
                          .filter(
                            (
                              [key]
                            ) =>
                              !key
                                .toLowerCase()
                                .includes(
                                  "waktu"
                                )
                          )
                          .map(
                            (
                              [
                                key,
                                value,
                              ],
                              i
                            ) => (

                              <div
                                key={
                                  i
                                }
                                className="py-3 border-b border-slate-100"
                              >

                                <div className="text-[11px] uppercase font-bold text-slate-400 mb-1">
                                  {
                                    key
                                  }
                                </div>

                                <div className="text-sm font-semibold text-slate-800 break-words">
                                  {String(
                                    value
                                  )}
                                </div>

                              </div>

                            )
                          )}

                      </div>

                    </div>

                  )
                )}

              </div>

            )}

          </>
        )}

        {/* REKAP SEKOLAH */}
        {menu ===
          "sekolah" && (

          <div className="bg-white rounded-[32px] shadow-xl overflow-hidden">

            <div className="px-6 py-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">

              <h2 className="text-2xl font-bold text-slate-800">
                🏫 Rekap Sekolah
              </h2>

              <button
                onClick={() =>
                  downloadExcel(
                    rekapSekolah,
                    "rekap-sekolah"
                  )
                }
                className="bg-green-600 hover:bg-green-700 text-white px-5 py-3 rounded-2xl text-sm font-semibold"
              >
                ⬇️ Download
              </button>

            </div>

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
                      👨 L
                    </th>

                    <th className="px-6 py-4 text-center">
                      👩 P
                    </th>

                    <th className="px-6 py-4 text-center">
                      📋 Total
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {rekapSekolah.map(
                    (
                      item: any,
                      index
                    ) => (

                      <tr
                        key={
                          index
                        }
                        className="border-t border-slate-100"
                      >

                        <td className="px-6 py-4">
                          {index + 1}
                        </td>

                        <td className="px-6 py-4 font-semibold">
                          {
                            item.nama
                          }
                        </td>

                        <td className="px-6 py-4 text-center">
                          {
                            item.laki
                          }
                        </td>

                        <td className="px-6 py-4 text-center">
                          {
                            item.perempuan
                          }
                        </td>

                        <td className="px-6 py-4 text-center font-bold">
                          {
                            item.total
                          }
                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            </div>

          </div>

        )}

        {/* REKAP ADMIN */}
        {menu ===
          "admin" && (

          <div className="space-y-8">

            <div className="flex justify-end">

              <button
                onClick={() =>
                  downloadExcel(
                    [
                      {
                        "Total Pendaftar":
                          totalPendaftar,
                        "Sudah Aktivasi":
                          totalSudahAktivasi,
                        "Belum Aktivasi":
                          totalBelumAktivasi,
                        "Belum Revisi":
                          totalBelumRevisi,
                        "Ajuan Baru":
                          totalAjuanBaru,
                        "Laki-Laki":
                          totalLaki,
                        "Perempuan":
                          totalPerempuan,
                        Banten:
                          totalBanten,
                        "Luar Banten":
                          totalLuarBanten,
                        Kuota:
                          KUOTA,
                      },
                    ],
                    "rekap-admin"
                  )
                }
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-2xl text-sm font-semibold"
              >
                ⬇️ Download Rekap
              </button>

            </div>

            {/* CARD */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">

              <div className="bg-white rounded-[32px] p-7 shadow-xl">
                <p className="text-sm text-slate-500">
                  📋 Total Pendaftar
                </p>
                <h3 className="text-5xl font-bold mt-4">
                  {totalPendaftar}
                </h3>
              </div>

              <div className="bg-cyan-600 text-white rounded-[32px] p-7 shadow-xl">
                <p className="text-sm">
                  ✅ Sudah Aktivasi
                </p>
                <h3 className="text-5xl font-bold mt-4">
                  {
                    totalSudahAktivasi
                  }
                </h3>
              </div>

              <div className="bg-orange-500 text-white rounded-[32px] p-7 shadow-xl">
                <p className="text-sm">
                  ⏳ Belum Aktivasi
                </p>
                <h3 className="text-5xl font-bold mt-4">
                  {
                    totalBelumAktivasi
                  }
                </h3>
              </div>

              <div className="bg-pink-600 text-white rounded-[32px] p-7 shadow-xl">
                <p className="text-sm">
                  📝 Belum Revisi
                </p>
                <h3 className="text-5xl font-bold mt-4">
                  {
                    totalBelumRevisi
                  }
                </h3>
              </div>

              <div className="bg-violet-600 text-white rounded-[32px] p-7 shadow-xl">
                <p className="text-sm">
                  🆕 Ajuan Baru
                </p>
                <h3 className="text-5xl font-bold mt-4">
                  {
                    totalAjuanBaru
                  }
                </h3>
              </div>

              <div className="bg-slate-800 text-white rounded-[32px] p-7 shadow-xl">
                <p className="text-sm">
                  🎯 Selisih Kuota
                </p>
                <h3 className="text-5xl font-bold mt-4">
                  {totalPendaftar -
                    KUOTA}
                </h3>
              </div>

            </div>

          </div>

        )}

      </div>

    </main>
  );
}