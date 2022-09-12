const qrcode = require('qrcode-terminal')
const fetch = require('node-fetch')
const fs = require('fs')
const xlsx = require('xlsx')
const schedule = require('node-schedule');

const { Client, LocalAuth } = require('whatsapp-web.js');
const { MessageMedia } = require('whatsapp-web.js');
const { ChartJSNodeCanvas } = require('chartjs-node-canvas');

const client = new Client({
    authStrategy: new LocalAuth()
})
const database = fs.readFileSync('db.json')
const data = JSON.parse(database)
const prefix = '!'

const width = 524;   // define width and height of canvas
const height = 524;
const backgroundColour = 'white'
const canvasRenderService = new ChartJSNodeCanvas({width, height, backgroundColour});

let list_daily = []

function countantena(value) {
    let hasil = 0
    for(let i = 0; i < data.length; i++) {
        if (data[i].lokasi.includes(value) && data[i].status_antena.includes('DONE')) {
            hasil += 1
        }
    }
    return hasil
}

function countcpe(value) {
    let hasil = 0
    for(let i = 0; i < data.length; i++) {
        if (data[i].lokasi.includes(value) && data[i].status_cpe.includes('DONE')) {
            hasil += 1
        }
    }
    return hasil
}

function countbelum(value) {
    let hasil = 0
    for(let i = 0; i < data.length; i++) {
        if (value == 'antena') {
            if (data[i].status_antena.includes('BELUM')) {
                hasil += 1
            }
        }
        if (value == 'cpe') {
            if (data[i].status_cpe.includes('BELUM')) {
                hasil += 1
            }
        }
    }
    return hasil
}

function writeFile(data) {
    fs.writeFile(database, JSON.stringify(data), 'utf8', function (err) {
        if (err) {
            console.error("An error occured while writing JSON Object to File.");
            return console.error(err);
        }
        console.log("JSON file has been saved.");
    });
}

const createImage = async () => {
    const pdykAnt = countantena('PEDAYAK')
    const kgrAnt = countantena('KANGURU')
    const plknAnt = countantena('PELIKAN')
    const belumAnt = countbelum('antena')

    const pdykCpe = countcpe('PEDAYAK')
    const kgrCpe = countcpe('KANGURU')
    const plknCpe = countcpe('PELIKAN')
    const belumCpe = countbelum('cpe')
    const configuration = {
        type: 'pie',
        data: {
              labels: [`PEDAYAK(Antena: ${pdykAnt}, CPE: ${pdykCpe})`, `KANGURU(Antena: ${kgrAnt}, CPE: ${kgrCpe})`, `PELIKAN(Antena: ${plknAnt}, CPE: ${plknCpe})`, `BELUM(Antena: ${belumAnt}, CPE: ${belumCpe})`],
              datasets: [{
                  label: "Antena",
                  data: [pdykAnt, kgrAnt, plknAnt, belumAnt],
                  backgroundColor: ['rgba(255, 99, 140, 1)', 'rgba(25, 99, 140, 1)', 'rgba(2, 254, 140, 1)',  'rgba(150, 150, 159, 1)'],
              },
              {
                  label: "CPE",
                  data: [pdykCpe, kgrCpe, plknCpe, belumCpe],
                  backgroundColor: ['rgba(255, 99, 140, 1)', 'rgba(25, 99, 140, 1)', 'rgba(2, 254, 140, 1)', 'rgba(150, 150, 150, 1)',],
              }
              ],
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: 'Unit OB KPCS'
                }
            }
        },
    }

    const dataUrl = await canvasRenderService.renderToDataURL(configuration); // converts chart to image
    return dataUrl;
};

function dataURLtoFile(dataurl, filename) {

        var arr = dataurl.split(','),
            mime = arr[0].match(/:(.*?);/)[1],
            bstr = atob(arr[1]),
            n = bstr.length,
            u8arr = new Uint8Array(n);

        while(n--){
            u8arr[n] = bstr.charCodeAt(n);
        }

        return new File([u8arr], filename, {type:mime});
    }

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

function convertExcelFileToJsonUsingXlsx(dataStream) {
    // Read the file using pathname
    const file = xlsx.read(dataStream);
    // Grab the sheet info from the file
    const sheetNames = file.SheetNames;
    const totalSheets = sheetNames.length;
    // Variable to store our data
    let parsedData = [];
    // Loop through sheets
    for (let i = 0; i < totalSheets; i++) {
        // Convert to json using xlsx
        const tempData = xlsx.utils.sheet_to_json(file.Sheets[sheetNames[i]]);
        // Skip header row which is the colum names
        tempData.shift();
        // Add the sheet's json to our data array
        parsedData.push(...tempData);
    }
    return parsedData;
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

const job = schedule.scheduleJob('0 19 * * 1-6', function(){
    let msg = 'Daily list terinstall hari ini\n\n'
    if (list_daily.length == 0) {
        msg += 'Tidak ada pemasangan hari ini'
        return client.sendMessage('120363043177317693@g.us', msg)
    }
    for (let i = 0; i < list_daily.length; i++) {
        msg += `🔹 *${list_daily[i]}*\n`
    }
    msg += `\nTotal: ${list_daily.length}`
    client.sendMessage('120363043177317693@g.us', msg)
    list_daily = []
});

client.on('qr', qr => {
    qrcode.generate(qr, {small: true})
})

client.on('ready', () => {
    console.log('Bot is ready!')
})

client.on('message', async message => {
    console.info(`[!] Recived message "${message.body}" from ${message.from}`)
    const messageSplit = message.body.split(" ")
    const cmd = messageSplit[0]
    const agr1 = messageSplit[1]
    const agr2 = messageSplit[2]

    // Inline cmd
    if (message.hasMedia) {
        const media = await message.downloadMedia()
        const mediaData = media.data
        const exceljson = convertExcelFileToJsonUsingXlsx(mediaData)
        if (media.filename.includes('.xlsx')) {
            let msg = `📝 List unit belum terinstall filtered by database\n\nData dari: ${media.filename}\n\n`
            let no = 1
            for (let i = 0; i < exceljson.length; i++) {
                const dataDT = search(exceljson[i].__EMPTY_1)
                let noCount = false
                if (dataDT && data[dataDT].status_antena.includes('BELUM')) {
                    if (!noCount) msg += `${no}:\n`
                    msg += `  📡 *${exceljson[i].__EMPTY_1}*\n`
                    noCount = true
                }
                if (dataDT && data[dataDT].status_cpe.includes('BELUM')) {
                    if (!noCount) msg += `${no}:\n`
                    msg += `  📟 *${exceljson[i].__EMPTY_1}*\n`
                    noCount = true
                }
                if (noCount) no += 1
            }
            msg += '\nKeterangan:\n📡: Antena\n📟: CPE'
            message.reply(msg)
        }
    }

    if (!message.body.startsWith(prefix)) return

    if (cmd === '!s') {
        const indexData = search(agr1)
        if (!indexData) return message.reply('Data tidak terdapat di database😭')
        message.reply(dataInformation(indexData))
    }

    if (cmd === '!antena') {
        const index = search(agr1)
        if (agr2 != 'done' && agr2 != 'belum') return message.reply('🚨 Eitss, mau ngapain?')
        try {
            changeValue('antena', agr2.toUpperCase(), search(agr1))
            message.reply('Data berhasil di update✅.')
            list_daily.push(`Antena ${data[index].cn}`)
            writeFile(data)
        } catch(err) {
            return message.reply(`Terjadi error!!\nLog: ${err}`)
        }
    }

    if (cmd === '!cpe') {
        const index = search(agr1)
        if (agr2 != 'done' && agr2 != 'belum') return message.reply('🚨 Eitss, mau ngapain?')
        try {
            changeValue('cpe', agr2.toUpperCase(), search(agr1))
            message.reply('Data berhasil di update✅.')
            list_daily.push(`CPE ${data[index].cn}`)
            writeFile(data)
        } catch(err) {
            return message.reply(`Terjadi error!!\nLog: ${err}`)
        }
        message.reply('Data berhasil di update✅.')
    }

    if (cmd === '!ping') {
         message.reply('🏓Pong..')
    }

    if (cmd === '!status') {
         createImage().then((t) => {
             const base64Image = t.replace(/^data:image\/png;base64,/, "");
             const media = new MessageMedia('image/png', base64Image);
             message.reply(media)
         })
    }

})

client.initialize()
