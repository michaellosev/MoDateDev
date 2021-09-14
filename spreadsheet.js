require('dotenv').config();
const { GoogleSpreadsheet } = require('google-spreadsheet');

function getCharacteristics(str) {
  let arr = str.split(', ');
  return {
    adventurous: arr.includes('Adventurous'),
    chiller: arr.includes('Chiller'),
    ambitious: arr.includes('Ambitious'),
    intellectuallyInclined: arr.includes('Intellectually Inclined'), 
    quirky: arr.includes('Quirky'),
    existential: arr.includes('Existential'),
    giving: arr.includes('Giving'),
    thoughtful: arr.includes('Thoughtful'),
    loyal: arr.includes('Loyal'),
    honest: arr.includes('Honest'),
    funny: arr.includes('Funny'),
    passionate: arr.includes('Passionate'),
    friendly: arr.includes('Friendly'),
    openMinded: arr.includes('Open-Minded'),
    goWithTheFlow: arr.includes('Go With The Flow'),
    smart: arr.includes('Smart')
  }
}

async function accessSpreadsheet() {
  const doc = new GoogleSpreadsheet('1Qoeyt0e0P6qTakNMWx5g5xUz_Zj0O9u1ROa2gAvsScE');
  await doc.useServiceAccountAuth({
    client_email: process.env.CLIENT_EMAIL,
    private_key: process.env.PRIVATE_KEY
  })

  await doc.loadInfo();
  const sheet = doc.sheetsByTitle['Form Responses 1'];
  const rows = await sheet.getRows();
  rows.shift();
  return rows.map(row => { 
    const data = row['_rawData'];
    const date = Date.now() - new Date(data[4]);
    const year = Math.floor(date / (1000 * 60 * 60 * 24 * 365));
    return {
      timestamp: data[0],
      alias: data[1],
      inactive: data[2],
      connectorName: data[3],
      age: year,
      sex: data[5],
      location: data[6],
      myersBriggs: {
        introvertExtrovert: +data[7],
        sensingIntuition: +data[8],
        thinknigFeeling: +data[9],
        judgingPerceiving: +data[10]
      },
      characteristics: getCharacteristics(data[11]),
      characteristicsP: getCharacteristics(data[12]),
      religiousObservance: {
        kosher: data[13],
        shabbos: data[14],
        shomerNegiah: data[15],
        learns: data[16],
        aliyah: data[27]
      },
      religiousObservanceP: {
        kosher: data[17],
        shabbos: data[18],
        shomerNegiah: data[19],
        learns: data[20],
        aliyah: data[28]
      },
      highSchool: data[21],
      israelSchool: data[22],
      college: data[23],
      profession: data[24],
      religiousAddData: data[25],
      generalAddData: data[26],
      minAge: +data[29],
      maxAge: +data[30]
    }
  })
}

async function getDoc() {
  const doc = new GoogleSpreadsheet('1Qoeyt0e0P6qTakNMWx5g5xUz_Zj0O9u1ROa2gAvsScE');
  await doc.useServiceAccountAuth({
    client_email: process.env.CLIENT_EMAIL,
    private_key: process.env.PRIVATE_KEY
  })
  return doc;
}


exports.getData = accessSpreadsheet;
exports.getDoc = getDoc;
