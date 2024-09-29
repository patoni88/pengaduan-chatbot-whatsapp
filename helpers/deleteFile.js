const fs = require('fs');
const path = require('path');

const mediaPath = './downloaded-media/';

// Fungsi untuk menghapus file
const deleteFile = (filePath, fileName) => {
  fs.unlink(filePath, (err) => {
    if (err) {
      console.log('Gagal menghapus file:', err);
    } else {
      console.log('File dihapus:', fileName);
    }
  });
};

// Fungsi untuk menghapus semua file dalam folder downloaded-media setiap 5 menit
const deleteExpiredFiles = () => {
  fs.readdir(mediaPath, (err, files) => {
    if (err) {
      console.log('Gagal membaca direktori:', err);
      return;
    }

    const currentTime = new Date().getTime();

    files.forEach((file) => {
      const filePath = path.join(mediaPath, file);

      fs.stat(filePath, (err, stats) => {
        if (err) {
          console.log('Gagal mendapatkan info file:', err);
          return;
        }

        const fileModifiedTime = stats.mtime.getTime();
        const elapsedTime = currentTime - fileModifiedTime;
        const twentyFourHoursInMs = 24 * 60 * 60 * 1000; // 24 jam dalam milidetik
        // const fiveMinutesInMs = 5 * 60 * 1000; // 5 menit dalam milidetik

        if (elapsedTime > twentyFourHoursInMs) {
          deleteFile(filePath, file);
        }
      });
    });
  });
};

// Panggil fungsi deleteExpiredFiles setiap 5 menit (300000 ms)
setInterval(deleteExpiredFiles, 300000);

module.exports = deleteExpiredFiles;