const qrcode = require('qrcode-terminal')
const fetch = require('node-fetch')
const fs = require('fs');
const { Client } = require('whatsapp-web.js');

const client = new Client()
const database = fs.readFileSync('db.json')
const data = JSON.parse(database)
const prefix = '!'

function search(value) {
    for(let i = 0; i < data.length; i++) {
        if (data[i].cn.includes(value)) {
            return i
        }
    }
    return false
}

function dataInformation(index) {
    const d = data[index]
    return `🚜 No Unit: ${d.cn}\n📍 Lokasi Unit: ${d.lokasi}\n📡 Status Antena: ${d.status_antena}\n📟 Status CPE: ${d.status_cpe}`
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
    console.info(`[!] Recived message "${message.body}" from ${message.from}`)
    const messageSplit = message.body.split(" ")
    const cmd = messageSplit[0]
    const agr1 = messageSplit[1]
    const agr2 = messageSplit[2]

    if (!message.body.startsWith(prefix)) return

    if (cmd === '!s') {
        const indexData = search(agr1)
        if (!indexData) return message.reply('Data tidak terdapat di database😭')
        message.reply(dataInformation(indexData))
    }

    if (cmd === '!antena') {
        const index = search(agr1)
        if (agr2 != 'done' || agr2 != 'belum') return message.reply('🚨 Eitss, mau ngapain?')
        try {
            changeValue('antena', agr2.toUpperCase(), search(agr1))
            message.reply('Data berhasil di update✅.')
        } catch(err) {
            return message.reply(`Terjadi error!!\nLog: ${err}`)
        }
    }

    if (cmd === '!cpe') {
        const index = search(agr1)
        if (agr2 != 'done' || agr2 != 'belum') return message.reply('🚨 Eitss, mau ngapain?')
        try {
            changeValue('cpe', agr2.toUpperCase(), search(agr1))
        } catch(err) {
            return message.reply(`Terjadi error!!\nLog: ${err}`)
        }
        message.reply('Data berhasil di update✅.')
    }

    if (cmd === '!ping') {
         message.reply('🏓Pong..')
    }
})

client.initialize()
