const qrcode = require('qrcode-terminal')
const fetch = require('node-fetch')
const fs = require('fs');
const { Client } = require('whatsapp-web.js');


const database = fs.readFileSync('db.json')
const data = JSON.parse(database)
const prefix = '!'

function search(value) {
    for(let i = 0; i < data.length; i++) {
        if (data[i].cn.includes(value)) {
            return i
        }
    }
}

function dataInformation(index) {
    const d = data[index]
    return `No Unit: ${d.cn}\nLokasi Unit: ${d.lokasi}\nStatus Antena: ${d.status_antena}\nStatus CPE: ${d.status_cpe}`
}

function changeValue(typedata, value, index) {
    if (typedata == 'antena') {
        data[index].status_antena = value
    }
    if (typedata == 'cpe') {
        data[index].status_cpe = value
    }
}

client.on('qr', qr => {
    qrcode.generate(qr, {small: true})
})

client.on('ready', () => {
    console.log('Bot is ready!')
})

client.on('message', message => {
    const messageSplit = message.bodysplit(" ")
    const cmd = messageSplit[0]
    const agr1 = messageSplit[1]
    const agr2 = messageSplit[2]

    if (!cmd.startWith(prefix)) return

    if (cmd === '!s') {
        message.reply(dataInformation(search(agr1)));
    }

    if (cmd === '!antena') {
        const index = search(agr1)
        try {
            changeValue('antena', agr2.toUpperCase(), search(agr1))
            message.reply('Data berhasil di update.')
        } catch(err) {
            message.reply(`Terjadi error!!\nLog: ${err}`)
        }
    }

    if (cmd === '!cpe') {
        const index = search(agr1)
        try {
            changeValue('cpe', agr2.toUpperCase(), search(agr1))
        } catch(err) {
            return message.reply(`Terjadi error!!\nLog: ${err}`)
        }
        message.reply('Data berhasil di update.')
    }

    if (cmd === '!ping') {
         message.reply(`🏓Pong.. ${Date.now() - message.timestamp}ms`)
    }
})

client.initialize()
