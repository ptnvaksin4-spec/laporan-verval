const fs = require('fs');
const path = require('path');
const { createReadStream, createWriteStream } = require('fs');
const readline = require('readline');

const csvPath = './public/laporan.csv';
const jurusanList = [
  'Teknik Komputer dan Jaringan',
  'Akuntansi',
  'Bisnis Digital',
  'Teknik Mesin'
];

async function addJurusanColumn() {
  const fileStream = createReadStream(csvPath, { encoding: 'utf-8' });
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  const outputPath = csvPath + '.tmp';
  const writeStream = createWriteStream(outputPath, { encoding: 'utf-8' });

  let isHeader = true;
  let lineCount = 0;

  for await (const line of rl) {
    if (isHeader) {
      writeStream.write(line + ',Jurusan\n');
      isHeader = false;
    } else {
      const randomJurusan = jurusanList[Math.floor(Math.random() * jurusanList.length)];
      writeStream.write(line + ',' + randomJurusan + '\n');
      lineCount++;
    }
  }

  writeStream.end();

  return new Promise((resolve, reject) => {
    writeStream.on('finish', () => {
      // Replace original with temp file
      fs.renameSync(outputPath, csvPath);
      console.log('✓ CSV updated successfully');
      console.log('✓ Jurusan column added');
      console.log('✓ Total data rows: ' + lineCount);
      resolve();
    });
    writeStream.on('error', reject);
  });
}

addJurusanColumn().catch(console.error);
