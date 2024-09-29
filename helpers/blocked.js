const connection = require('./db');
const { phoneReturnFormatter } = require('./formatter');


// Fungsi untuk melakukan pengecekan nomor telepon dalam tabel block di database
const checkNumberBlocked = (msg) => {
    return new Promise((resolve, reject) => {
        const phoneNumber = phoneReturnFormatter(msg);
    
        // Lakukan koneksi ke database
        connection.connect((error) => {
            if (error) {
                reject(error);
                return;
            }
    
            // Lakukan query untuk memeriksa nomor telepon dalam tabel block
            const query = `SELECT * FROM block WHERE kontak = '${phoneNumber}'`;
    
            connection.query(query, (error, results) => {
            if (error) {
                reject(error);
                return;
            }
    
            // Jika nomor telepon ditemukan dalam tabel block, resolve dengan true
            if (results.length > 0) {
                resolve(true);
            } else {
                resolve(false);
            }
            });
    
            // Tutup koneksi setelah query selesai
            connection.end();
        });
    });
};

module.exports = {
    checkNumberBlocked,
};
