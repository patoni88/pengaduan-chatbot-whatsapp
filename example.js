const connection = require('./helpers/db');

// Data yang ingin dimasukkan ke dalam tabel
const data = {
    kontak: '08312234',
    nomor: 'SP/adfg/2023',
    nama: 'John Doe',
    alamatTinggal: 'Jl. Contoh No. 123',
    deskripsi: 'hahaha',
    lokasi: 'indonesia'
  };
  
  // Query untuk memasukkan data ke dalam tabel
  const query = 'INSERT INTO pengaduans SET ?';
  
  // Menjalankan query dengan menggunakan data yang telah ditentukan
  connection.query(query, data, (error, results) => {
    if (error) {
      console.error('Error saat memasukkan data:', error);
      return;
    }
    console.log('Data berhasil dimasukkan!');
    console.log('ID data yang dimasukkan:', results.insertId);
  });
  
