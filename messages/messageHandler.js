const axios = require('axios');
const connection = require('../helpers/db');
const fs = require('fs');
const fsExtra = require('fs-extra');
const path = require('path');
const mime = require('mime-types');
const { phoneNumberFormatter, phoneReturnFormatter } = require('../helpers/formatter');

// Objek untuk menyimpan data pengaduan
const dataPengaduan = {};


// else /info
const ChatFirst = async (msg) => {
    // Mengirim pesan dengan informasi mengenai sistem pengaduan masyarakat di Desa Dampit
    const systemInfoMessage = `Halo! Terima kasih atas pesan Anda.

    Kami adalah sistem pengaduan masyarakat di Desa Dampit. Anda dapat mengirimkan pengaduan dengan format yang benar dan melampirkan hingga 3 gambar terkait.

    Jika Anda memerlukan bantuan atau informasi lebih lanjut, jangan ragu untuk mengirimkan pesan 'Info'.

    'Darurat' untuk menampilkan kontak darurat jika anda membutuhkan bantuan segera
    
    'Pengaduan' untuk melakukan pengaduan

    Terima kasih!`;

    msg.reply(systemInfoMessage);
}

const ChatUrgent = async (msg) => {
    // Pesan untuk layanan darurat
    const emergencyMessage = `Jika Anda mengalami keadaan darurat, harap segera hubungi layanan darurat di nomor Tlp.7952100.`;

    msg.reply(emergencyMessage);
}

// Info
const ChatComplain = async (msg) => {
    const infoMessage = `📋 Informasi Pengaduan Masyarakat di Desa Dampit 🏘️
    
Sebelum Anda dapat melakukan pengaduan, mohon untuk mengirimkan informasi berikut dengan format yang sama seperti berikut:

Nama: [Nama lengkap Anda]
Alamat: [Alamat lengkap Anda]
Deskripsi: [Deskripsi singkat pengaduan Anda]
Lokasi: [Lokasi terkait pengaduan Anda]

Juga, mohon untuk mengirimkan 3 gambar yang terkait dengan lokasi pengaduan.

Mohon kirimkan informasi dan gambar-gambar tersebut agar kami dapat segera menindaklanjuti pengaduan Anda. Terima kasih! 🙏

Ketik 'Format' untuk format pengaduan`;

      // Pengecekan data kontak dalam tabel block
    const kontak = phoneReturnFormatter(msg.from);
    const isBlocked = await checkDataExists(kontak);

    if (isBlocked) {
        // Jika data kontak ditemukan dalam tabel block
        msg.reply('Maaf, Anda tidak dapat mengirim pengaduan karena kontak Anda diblokir.');
    } else {
        // Jika data kontak tidak ditemukan dalam tabel block
        msg.reply(infoMessage);
    }
}

// Format
const Format = async (msg) => {
  const formatMessage = `Nama:
Alamat:
Deskripsi:
Lokasi:`;

    // Pengecekan data kontak dalam tabel block
  const kontak = phoneReturnFormatter(msg.from);
  const isBlocked = await checkDataExists(kontak);

  if (isBlocked) {
      // Jika data kontak ditemukan dalam tabel block
      msg.reply('Maaf, Anda tidak dapat mengirim pengaduan karena kontak Anda diblokir.');
  } else {
      // Jika data kontak tidak ditemukan dalam tabel block
      msg.reply(formatMessage);
  }
}


// Fungsi untuk mengolah data pengaduan
const ChatInputData = async (text, msg) => {
    const lines = text.split('\n'); // Memisahkan baris dengan karakter baris baru

    const newData = {
      nama: lines[0].split(':')[1].trim(),
      alamatTinggal: lines[1].split(':')[1].trim(),
      deskripsi: lines[2].split(':')[1].trim(),
      lokasi: lines[3].split(':')[1].trim(),
      kontak: msg.from,
      gambar: []
    };

    // Pengecekan data kontak dalam tabel block
    const kontak = phoneReturnFormatter(msg.from);
    const isBlocked = await checkDataExists(kontak);

    if (isBlocked) {
        // Jika data kontak ditemukan dalam tabel block
        msg.reply('Maaf, Anda tidak dapat mengirim pengaduan karena kontak Anda diblokir.');
    } else {
        // Jika data kontak tidak ditemukan dalam tabel block
            // Menyimpan data pengaduan berdasarkan nomor pengirim
    dataPengaduan[msg.from] = newData;

    const responseMessage = `Terima kasih atas pengaduan yang telah dikirimkan!

  Berikut adalah informasi yang telah Anda kirim:

  Nama: ${newData.nama}
  Alamat: ${newData.alamatTinggal}
  Deskripsi: ${newData.deskripsi}
  Lokasi: ${newData.lokasi}

  Mohon tunggu sebentar, kami sedang menunggu pengiriman gambar-gambar terkait.

  Tim kami akan segera menindaklanjuti pengaduan Anda. Terima kasih! 🙏`;

    msg.reply(responseMessage);
    }
  };


// Fungsi untuk mengelola pengiriman gambar
const ChatGambar = async (msg) => {
  // Downloading media
  if (msg.hasMedia) {
    const media = await msg.downloadMedia();

    if (media) {
      // The folder to store: change as you want!
      // Create if not exists
      const mediaPath = './downloaded-media/';

      if (!fs.existsSync(mediaPath)) {
        fs.mkdirSync(mediaPath);
      }

      // Get the file extension by mime-type
      const extension = mime.extension(media.mimetype);

      // Filename: change as you want!
      // I will use the time for this example
      // Why not use media.filename? Because the value is not certain exists
      const filename = new Date().getTime();

      const fullFilename = mediaPath + filename + '.' + extension;

      // Save to file
      try {
        fs.writeFileSync(fullFilename, media.data, { encoding: 'base64' });
        console.log('File downloaded successfully!', fullFilename);

        // Set the corresponding data field based on the order of received images
        const data = dataPengaduan[msg.from];

        if (!data.gambar1) {
          data.gambar1 = await getBase64(fullFilename);
          // msg.reply('Gambar 1 diterima. Silahkan kirim gambar selanjutnya.');
          // Memeriksa jika terdapat data null
          if (
            data.nama === null ||
            data.alamatTinggal === null ||
            data.deskripsi === null ||
            data.lokasi === null
          ) {
            const errorMessage =
              'Data yang Anda kirimkan tidak valid. Harap kirimkan semua informasi dan gambar dengan benar.';
            msg.reply(errorMessage);
            console.log(errorMessage);
            return;
          } else {
            msg.reply('Gambar 1 diterima. Silahkan kirim gambar selanjutnya.');
          }

        } else if (!data.gambar2) {
          data.gambar2 = await getBase64(fullFilename);
          // msg.reply('Gambar 2 diterima. Silahkan kirim gambar selanjutnya.');
          // Memeriksa jika terdapat data null
          if (
            data.nama === null ||
            data.alamatTinggal === null ||
            data.deskripsi === null ||
            data.lokasi === null ||
            data.gambar1 === null
          ) {
            const errorMessage =
              'Data yang Anda kirimkan tidak valid. Harap kirimkan semua informasi dan gambar dengan benar.';
            msg.reply(errorMessage);
            console.log(errorMessage);
            return;
          } else {
            msg.reply('Gambar 2 diterima. Silahkan kirim gambar selanjutnya.');
          }

        } else if (!data.gambar3) {
          data.gambar3 = await getBase64(fullFilename);
          // msg.reply('Gambar 3 diterima. Data terpenuhi.');
          // Memeriksa jika terdapat data null
          if (
            data.nama === null ||
            data.alamatTinggal === null ||
            data.deskripsi === null ||
            data.lokasi === null ||
            data.gambar1 === null ||
            data.gambar2 === null ||
            data.gambar3 === null
          ) {
            const errorMessage =
              'Data yang Anda kirimkan tidak valid. Harap kirimkan semua informasi dan gambar dengan benar.';
            msg.reply(errorMessage);
            console.log(errorMessage);
            return;
          } else {
            msg.reply('Gambar 3 diterima. Data terpenuhi.');
          }

          // Menambahkan pengirim ke data JSON
          data.kontak = msg.from;

          // Semua data dan gambar telah diterima, kirim pesan pengaduan selesai
          const selesaiMessage = `Terima kasih! Pengaduan Anda telah diterima dan sedang diproses.

Berikut adalah detail pengaduan Anda:

1. Nama: ${data.nama}
2. Alamat: ${data.alamatTinggal}
3. Deskripsi: ${data.deskripsi}
4. Lokasi: ${data.lokasi}

Gambar-gambar terkait juga telah diterima.

Tim kami akan segera menindaklanjuti pengaduan Anda. Terima kasih atas partisipasinya! 🙏`;

          msg.reply(selesaiMessage);

          // Semua data dan gambar telah diterima, kirim sebagai JSON
          const jsonData = JSON.stringify(data);
          console.log('Data JSON:', jsonData);

          // Lakukan tindakan lainnya dengan data JSON, misalnya mengirimkannya ke API
          // Mengirim data JSON ke API
          axios
            .post('http://127.0.0.1:3000/api/pengaduan', jsonData, {
              headers: {
                'Content-Type': 'application/json'
              }
            })
            .then((response) => {
              console.log('Data berhasil dikirim ke API:', response.data);
              // Lakukan tindakan lainnya setelah pengiriman data berhasil
            })
            .catch((error) => {
              console.error('Gagal mengirim data ke API:', error);
              // Lakukan penanganan kesalahan jika pengiriman data gagal
            });

          // Reset data untuk pengaduan berikutnya
          dataPengaduan[msg.from] = {
            nama: null,
            alamatTinggal: null,
            deskripsi: null,
            lokasi: null,
            gambar1: null,
            gambar2: null,
            gambar3: null
          };
        }
      } catch (err) {
        console.log('Failed to save the file:', err);
      }
    }
  }
};


// Fungsi untuk mengubah gambar menjadi Base64
const getBase64 = async (mediaPath) => {
    return new Promise((resolve, reject) => {
        fs.readFile(mediaPath, (error, image) => {
            if (error) {
                console.error('Error saat membaca gambar:', error);
                reject(error);
            } else {
                const base64Image = image.toString('base64');
                resolve(base64Image);
            }
        });
    });
}

const checkDataExists = (data) => {
    return new Promise((resolve, reject) => {
        const query = `SELECT COUNT(*) AS count FROM block WHERE kontak = '${data}'`;

    connection.query(query, (error, results) => {
        if (error) {
            reject(error);
            return;
        }

            const count = results[0].count;
            const exists = count > 0;
            resolve(exists);
        });
    });
};


module.exports = {
    ChatInputData,
    ChatComplain,
    ChatGambar,
    ChatFirst,
    ChatUrgent,
    Format,
}