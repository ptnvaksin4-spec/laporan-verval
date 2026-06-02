const fs = require('fs');
const path = require('path');

const csvPath = path.join(__dirname, 'public', 'laporan.csv');
const jurusan = [
  'Teknik Komputer dan Jaringan',
  'Akuntansi',
  'Bisnis Digital',
  'Teknik Mesin'
];

const csvContent = fs.readFileSync(csvPath, 'utf-8');
const lines = csvContent.trim().split('\n');
const header = lines[0];

// Check if Jurusan column already exists
if (header.includes('Jurusan')) {
  console.log('Jurusan column already exists');
  process.exit(0);
}

const newHeader = header + ',Jurusan';
const newLines = [newHeader];

for (let i = 1; i < lines.length; i++) {
  if (lines[i].trim() === '') continue;
  const randomJurusan = jurusan[Math.floor(Math.random() * jurusan.length)];
  newLines.push(lines[i] + ',' + randomJurusan);
}

fs.writeFileSync(csvPath, newLines.join('\n'), 'utf-8');
console.log('CSV updated with Jurusan column');
