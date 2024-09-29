const mysql = require('mysql');

const connection = mysql.createConnection({
        host: 'localhost', // Ganti dengan host MySQL Anda
        user: 'root', // Ganti dengan username MySQL Anda
        password: '', // Ganti dengan password MySQL Anda
        database: 'pengaduan' // Ganti dengan nama database yang ingin Anda gunakan
    });

    connection.connect((err) => {
        if (err) {
        console.error('Error koneksi ke database:', err);
    }   else {
        console.log('Terhubung ke database MySQL');
    }
});

module.exports = connection;