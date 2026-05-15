{/* STATISTIK */}
<div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">

  <div className="bg-white/15 backdrop-blur-md rounded-3xl p-5">
    <div className="text-sm text-blue-100">
      Total Data
    </div>

    <div className="text-3xl font-bold mt-2">
      {filteredData.length}
    </div>
  </div>

  <div className="bg-cyan-500/20 rounded-3xl p-5">
    <div className="text-sm text-cyan-100">
      Sudah Aktivasi
    </div>

    <div className="text-3xl font-bold mt-2">
      {totalSudahAktivasi}
    </div>
  </div>

  <div className="bg-green-500/20 rounded-3xl p-5">
    <div className="text-sm text-green-100">
      Mengajukan Revisi
    </div>

    <div className="text-3xl font-bold mt-2">
      {totalMengajukan}
    </div>
  </div>

  <div className="bg-red-500/20 rounded-3xl p-5">
    <div className="text-sm text-red-100">
      Belum Mengajukan
    </div>

    <div className="text-3xl font-bold mt-2">
      {totalBelumMengajukan}
    </div>
  </div>

</div>