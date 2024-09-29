const { Client, LegacySessionAuth, LocalAuth, MessageMedia} = require('whatsapp-web.js');
const qrcodeTerminal = require('qrcode-terminal');
const socketIo = require('socket.io');
const express = require('express');
const { body, validationResult } = require('express-validator');
const qrcode = require('qrcode');
const fs = require("fs");
const http = require('http');
const { phoneNumberFormatter, phoneReturnFormatter } = require('./helpers/formatter');
const connection = require('./helpers/db');
const { ChatInputData, ChatGambar, ChatFirst, ChatUrgent, ChatComplain, Format } = require('./messages/messageHandler');
const checkNumberBlocked = require('./helpers/blocked');
// const fileUpload = require('express-fileupload');
// const axios = require('axios');
// const mime = require('mime-types');
const deleteExpiredFiles = require('./helpers/deleteFile');
const cron = require('node-cron');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.json());
app.use(express.urlencoded({
    extended: true
}));

// Ini optional saat kirim file ke user bisa dimatikan biar g bikin bingung
// app.use(fileUpload({
//     debug: true
// }));

const client = new Client({
    restartOnAuthFail: true,
    authStrategy: new LocalAuth({
         clientId: "client-one" //Un identificador(Sugiero que no lo modifiques)
    }),
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process', // <- this one doesn't works in Windows
            '--disable-gpu'
        ],
    },
})

// Kirim di lokal
app.get('/', (req, res) => {
    res.sendFile('index.html', {root: __dirname});
});

// Save session values to the file upon successful auth
client.on('authenticated', (session) => {
    console.log(session);
});

// Reply message
client.on('message', async msg => {
    console.log("pengirim : ", phoneReturnFormatter(msg.from));
    console.log("pesan : ", msg.body);
    
    const text = msg.body.toLowerCase() || '';

    if (text == 'info') {
        await ChatFirst(msg);
    } 
    
    else if (text === 'pengaduan') {
        await ChatComplain(msg);
    }

    else if (text === 'format') {
        await Format(msg);
    }

    else if (text === 'darurat') {
        await ChatUrgent(msg);
    }

    else if (text.startsWith('nama:') && text.includes('alamat:') && text.includes('deskripsi:') && text.includes('lokasi:')) {
        await ChatInputData(text, msg);
    }
    // Cek apakah pengirim mengirimkan gambar
    else if (msg.hasMedia) {
        await ChatGambar(msg);
    } 
    
    else {
        const response = 'Ketik "Info" untuk informasi lebih lanjut';
        await client.sendMessage(msg.from, response);
    }
});


client.initialize();


// Soceket IO
io.on('connection', function(socket) {
    socket.emit('message', 'Connecting...');

    client.on('qr', (qr) => {
        console.log('QR RECEIVED', qr);
        qrcode.toDataURL(qr, (err, url) => {
            socket.emit('qr', url);
            socket.emit('message', 'QR Code received, scan please!');
        });
    });

    client.on('ready', () => {
        socket.emit('ready', 'Whatsapp is ready!');
        socket.emit('message', 'Whatsapp is ready!');
    });

    client.on('authenticated', () => {
        socket.emit('authenticated', 'Whatsapp is authenticated!');
        socket.emit('message', 'Whatsapp is authenticated!');
        console.log('AUTHENTICATED');
    });

    client.on('auth_failure', function(session) {
        socket.emit('message', 'Auth failure, restarting...');
    });
    
    client.on('disconnected', (reason) => {
        socket.emit('message', 'Whatsapp is disconnected!');
        client.destroy();
        client.initialize();
    });
});


// Cek register nomber
const checkRegisteredNumber = async function(number) {
    const isRegistered = await client.isRegisteredUser(number);
    return isRegistered;
}


// Send message
app.post('/send-message', [
    body('number').notEmpty(),
    body('message').notEmpty(),
], async (req, res) => {
    const errors = validationResult(req).formatWith(({
        msg
    }) => {
        return msg;
    });

    if (!errors.isEmpty()) {
        return res.status(422).json({
            status: false,
            message: errors.mapped()
        });
    }

    const number = phoneNumberFormatter(req.body.number);
    const message = req.body.message;

    // Cek apakah nomer terdaftar di Wa atau tidak
    const isRegisteredNumber = await checkRegisteredNumber(number);
    if (!isRegisteredNumber) {
        return res.status(422).json({
            status: false,
            message: 'The number is not registered'
        });
    }

    client.sendMessage(number, message).then(response => {
        res.status(200).json({
            status: true,
            response: response
        });
    }).catch(err => {
        res.status(500).json({
            status: false,
            response: err
        });
    });
});


// Send media
// app.post('/send-media', (req, res) => {
//     const number = phoneNumberFormatter(req.body.number);
//     const caption = req.body.caption;
//     const fileUrl = req.body.file;

//     // Ini gambar dari file langsung upload. hapus async untuk menjalankan coding ini
//     // const media = MessageMedia.fromFilePath('./image-example.png');
//     const file = req.files.file;
//     const media = new MessageMedia(file.mimetype, file.data.toString('base64'), file.name);

//     // Ini gambar dari url / link
//     // let mimetype;
//     // const attachment = await axios.get(fileUrl, {
//     //     responseType: 'arraybuffer'
//     // }).then(response => {
//     //     mimetype = response.headers['content-type'];
//     //     return response.data.toString('base64');
//     // });
//     // const media = new MessageMedia(mimetype, attachment, 'Media');

//     client.sendMessage(number, media, {
//         caption: caption
//     }).then(response => {
//         res.status(200).json({
//             status: true,
//             response: response
//         });
//     }).catch(err => {
//         res.status(500).json({
//             status: false,
//             response: err
//         });
//     });
// });

// Menjadwalkan pemanggilan fungsi deleteExpiredFiles setiap 5 menit
// cron.schedule('*/5 * * * *', () => {
//     deleteExpiredFiles();
//   });

// Menjadwalkan pemanggilan fungsi deleteExpiredFiles setiap pukul 0:0
// cron.schedule('0 0 * * *', () => {
//     deleteExpiredFiles();
//   });

server.listen(8000, function() {
    console.log('App running in *:' + 8000);
});