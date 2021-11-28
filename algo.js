import * as fs from 'fs';
import * as data from './spreadsheet.js';
import dotenv from 'dotenv';
dotenv.config();
import { MYERSBRIGGS, LEGEND, RANKING, G, LG, B, Y, R} from "./consts/algoConstants.js";
import mailer from "./mailer.js";
import transporter from "./mailer.js";
import { readFile } from 'fs/promises';
import sgMail from '@sendgrid/mail';
sgMail.setApiKey(process.env.SENDGRID_API_KEY)

const prevMatches = JSON.parse(
  await readFile(
    new URL('./Matches.json', import.meta.url)
  )
);

const spreadSheet = await data.getDocument();
await spreadSheet.loadInfo()

const filterBasedOnSex = (match, people) => {
  return people.filter(person => person.sex !== match.sex)
}

const filterBasedOnReligion = (match, people) => {
  return people.filter(person => {
    if ((match.religiousObservanceP.kosher === "Very Important" && person.religiousObservance.kosher !== "Yes") || 
    (person.religiousObservanceP.kosher === "Very Important" && match.religiousObservance.kosher !== "Yes")) {
      return false;
    }
    else if ((match.religiousObservanceP.shabbos === "Very Important" && person.religiousObservance.shabbos !== "Yes") || 
    (person.religiousObservanceP.shabbos === "Very Important" && match.religiousObservance.shabbos !== "Yes")) {
      return false;
    }
    else if ((match.religiousObservanceP.shomerNegiah === "Very Important" && person.religiousObservance.shomerNegiah !== "Yes") || 
    (person.religiousObservanceP.shomerNegiah === "Very Important" && match.religiousObservance.shomerNegiah !== "Yes")) {
      return false;
    }
    else if ((match.religiousObservanceP.learns === "Very Important" && person.religiousObservance.learns !== "Yes") || 
    (person.religiousObservanceP.learns === "Very Important" && match.religiousObservance.learns !== "Yes")) {
      return false;
    }
    else if ((match.religiousObservanceP.aliyah === "Very Important" && person.religiousObservance.aliyah !== "Yes") || 
    (person.religiousObservanceP.aliyah === "Very Important" && match.religiousObservance.aliyah !== "Yes")) {
      return false
    }
    else if (!isNaN(match.minAge) || !isNaN(person.minAge)) {
      if (!isNaN(match.minAge)) {
        if (person.age < match.minAge || person.age > match.maxAge) {
          return false;
        }
        if (!isNaN(person.minAge)) {
          if (match.age < person.minAge || match.age > person.maxAge) {
            return false;
          }
        }
        return true;
      }
    }
    else {
      return true;
    }
  })
}

const filterOnLocation = (match, people) => {
  return people.filter(person => {
    const matchDatingLocations = match.willingToDate.split(', ');
    const personDatingLocations = person.willingToDate.split(', ');
    const isCompatibleLocations = matchDatingLocations.reduce((acc, cur) => {
      return acc || personDatingLocations.includes(cur);
    }, false);
    return isCompatibleLocations;
  })
}

const filterOnHeight = (match, people) => {
  return people.filter(person => {
    if (match.height === '' || person.height === '') {
      return true;
    }
    const matchHeight = (match.height != "Under 5'0" && match.height != "6'5 & Up") ? +match.height.split("'")[0] * 12 + +match.height.split("'")[1] : (match.height === "Under 5'0" ? 59 : 78);
    const matchMinHeight = match.minHeight == '' ? 0 : (match.minHeight != "Under 5'0" && match.minHeight != "6'5 & Up") ? +match.minHeight.split("'")[0] * 12 + +match.minHeight.split("'")[1] : (match.minHeight === "Under 5'0" ? 59 : 78);
    const personHeight = (person.height != "Under 5'0" && person.height != "6'5 & Up") ? +person.height.split("'")[0] * 12 + +person.height.split("'")[1] : (person.height === "Under 5'0" ? 59 : 78);
    const personMinHeight = person.minHeight == '' ? 0 : (person.minHeight != "Under 5'0" && person.minHeight != "6'5 & Up") ? +person.minHeight.split("'")[0] * 12 + +person.minHeight.split("'")[1] : (person.minHeight === "Under 5'0" ? 59 : 78);
    const result = (matchHeight >= personMinHeight && personHeight >= matchMinHeight);
    return result;
  })
}

const getMyersBriggs = (match) => {

  const Letters = [["E", "I"], ["S", "N"], ["T", "F"], ["J", "P"]]

  let missing = 0;
  const arr = Object.keys(match.myersBriggs).map((key, index) => {
    if (match.myersBriggs[key] < 3) {
      return Letters[index][0];
    }
    else if (match.myersBriggs[key] > 3) {
      return Letters[index][1];
    }
    else {
      missing++;
      return "X"
    }
  })

  if (missing >= 2) {
    return null;
  }

  let result = [];
  for (let i = 0; i <= missing; i++) {
    let cur = "";
    for (let j = 0; j < arr.length; j++) {
      if (arr[j] === "X") {
        cur += Letters[j][i];
      }
      else {
        cur += arr[j];
      }
    }
    result.push(cur);
  }
  return result;
}

const getHighestRanking = (ranking, ...args) => {
  let maxRank = -1
  let maxColor = ""
  for (let i = 0; i < args.length; i++) {
    if (ranking[args[i]] > maxRank) {
      maxRank = ranking[args[i]];
      maxColor = args[i];
    } 
  }
  return maxColor;
}

const checkMyersBriggs = (match, suitor, legend, myersBriggs, ranking) => {
  const matchesP = getMyersBriggs(match);
  const suitorsP = getMyersBriggs(suitor);

  if (!matchesP || !suitorsP) {
    return null;
  }
  else if (matchesP.length > 1 || suitorsP.length > 1) {

    if (matchesP.length > 1 && suitorsP.length === 1) {
      const first = myersBriggs[legend[matchesP[0]]][legend[suitorsP[0]]];
      const second = myersBriggs[legend[matchesP[1]]][legend[suitorsP[0]]];
      return getHighestRanking(ranking, first, second)
    }
    else if (matchesP.length === 1 && suitorsP.length > 1) {
      const first = myersBriggs[legend[matchesP[0]]][legend[suitorsP[0]]];
      const second = myersBriggs[legend[matchesP[0]]][legend[suitorsP[1]]];
      return getHighestRanking(ranking, first, second)
    }
    else {
      const first = myersBriggs[legend[matchesP[0]]][legend[suitorsP[0]]];
      const second = myersBriggs[legend[matchesP[0]]][legend[suitorsP[1]]];
      const third = myersBriggs[legend[matchesP[1]]][legend[suitorsP[0]]];
      const fourth = myersBriggs[legend[matchesP[1]]][legend[suitorsP[1]]];
      return getHighestRanking(ranking, first, second, third, fourth)
    }
  }
  else {
    return myersBriggs[legend[matchesP]][legend[suitorsP]];
  }
}

async function generateMatches(prevMatches) {
  let people = await data.getData();
  people = people.filter(person => person.inactive == 'FALSE');
  const numPeople = people.length;
  const numMen = people.filter(person => person.sex === 'Male').length;
  const numFemales = numPeople - numMen;

  console.log(`total people: ${numPeople}\ntotal Men: ${numMen}\ntotal Females: ${numFemales}`)
  const results = {}
  for (let i = 0; i < numPeople; i++) {
    const match = people[i];
    const suitors = filterBasedOnSex(people[i], people);
    const compatibleHeight = filterOnHeight(people[i], suitors)
    const compatibleLocation = filterOnLocation(people[i], compatibleHeight);
    const religiousMatchingFemales = filterBasedOnReligion(people[i], compatibleLocation)
    
    const resultingRankings = religiousMatchingFemales.map(person => {
      let score = Object.keys(match.characteristicsP).reduce((acc, key) => {
        if (match.characteristicsP[key] === true && person.characteristics[key] === true) {
          return acc + 1;
        }
        else return acc;
      }, 0)
      const mbResult = checkMyersBriggs(match, person, LEGEND, MYERSBRIGGS, RANKING);
      if (mbResult === B) {
        score += 4;
      }
      else if (mbResult === G) {
        score += 3;
      }
      else if (mbResult === LG || mbResult == Y) {
        score += 2;
      }
      else {
        score++;
      }
      return {
        name: person.alias,
        compatabilityScore: score
      }
    })
    resultingRankings.sort((a, b) => b.compatabilityScore - a.compatabilityScore);
    results[match.alias] = {
      compatiblePartners: resultingRankings,
      sex: match.sex
    }
  }
  // const p = Object.keys(results);
  // let count = 0;
  // for (let i = 0; i < p.length; i++) {
  //   if (results[p[i]].sex === 'Male' && results[p[i]].compatiblePartners.length > 0) {
  //     console.log(results[p[i]])
  //     count++
  //   }
  // }
  // console.log(count)

  const keys = Object.keys(results);

  const males = keys.reduce((acc, cur) => {
    if (results[cur].sex === 'Male') {
      acc.push(
        {
          person: cur,
          compatiblePartners: results[cur].compatiblePartners
        }
      )
    }
    return acc;
  }, [])

  const females = keys.reduce((acc, cur) => {
    if (results[cur].sex === 'Female') {
      acc.push(
        {
          person: cur,
          compatiblePartners: results[cur].compatiblePartners
        }
      )
    }
    return acc;
  }, [])

  const prelimMatches = {};
  for (let male of males) {
    const compatiblePartners = male.compatiblePartners;
    let i = 0;
    while (i < compatiblePartners.length) {
      if (compatiblePartners[i].compatabilityScore >= 0) {
        if (prelimMatches.hasOwnProperty(male.person)) {
          prelimMatches[male.person].push(compatiblePartners[i].name)
        }
        else {
          prelimMatches[male.person] = [compatiblePartners[i].name]
        }
      }
      i++;
    }
  }
  // console.log(Object.keys(prelimMatches).length)

  const preMatches = {};
  for (let female of females) {
    const compatiblePartners = female.compatiblePartners;
    let i = 0;
    while (i < compatiblePartners.length) {
      if (compatiblePartners[i].compatabilityScore >= 0) {
        if (preMatches.hasOwnProperty(female.person)) {
          preMatches[female.person].push(compatiblePartners[i].name)
        }
        else {
          preMatches[female.person] = [compatiblePartners[i].name]
        }
      }
      i++;
    }
  }


  const numMatches = {}
  const girlMatches = {};
  for (const name of Object.keys(preMatches)) {
    for (const match of preMatches[name]) {
      if (prelimMatches[match] && prelimMatches[match].includes(name)) {
        // dont have to check both ways because in prevMatches if two people match they are on each others list
        if (!prevMatches[name] || !prevMatches[name].hasOwnProperty(match)) {
          if (!numMatches[name] && !numMatches[match]) {
            if (girlMatches.hasOwnProperty(name)) {
              girlMatches[name].push(match);
            }
            else {
              girlMatches[name] = [match];
            }
            numMatches[name] = 1;
            numMatches[match] = 1;
          }
          else if (numMatches[name] && numMatches[match]) {
            if ((numMatches[name] < 2 && numMatches[match] < 4)) {
              if (girlMatches.hasOwnProperty(name)) {
                girlMatches[name].push(match);
              }
              else {
                girlMatches[name] = [match];
              }
              numMatches[name]++;
              numMatches[match]++;
            }
          }
          else if (!numMatches[name]) {
            if (numMatches[match] < 2) {
              if (girlMatches.hasOwnProperty(name)) {
                girlMatches[name].push(match); 
              }
              else {
                girlMatches[name] = [match];
              }
              numMatches[name] = 1;
              numMatches[match]++;
            }
          }
          else {
            if (numMatches[name] < 2) {
              if (girlMatches.hasOwnProperty(name)) {
                girlMatches[name].push(match);
              }
              else {
                girlMatches[name] = [match];
              }
              numMatches[name]++;
              numMatches[match] = 1;
            }
          }
        }
      }
    }
  }
  return girlMatches;
}

const getConnectors = async (title, document) => {
  const sheet = document.sheetsByTitle[title]
  const rows = await sheet.getRows();
  rows.shift();
  const connectors = document.sheetsByTitle['Connector Responses'];
  const cRows = await connectors.getRows();
  const dict = {};
  cRows.forEach(row => {
    const arr = row['_rawData'];
    dict[arr[1].trim().toLowerCase()] = [arr[3], arr[4]];
  })
  const directory = {}
  rows.forEach(row => {
    const arr = row['_rawData'];
    // console.log(arr)
    directory[arr[1]] = [arr[3], dict[arr[3].trim().toLowerCase()][0], dict[arr[3].trim().toLowerCase()][1]];
  })
  return directory;
}

const rankAtrributes = async () => {
  const doc = await data.getDocument();
  await doc.loadInfo(); 
  const sheet = doc.sheetsByTitle['MoDate Responses'];
  const rows = await sheet.getRows();
  const result = {};
  rows.map(row => {
    const data = row['_rawData'][12];
    if (row['_rawData'][5] === 'Male') {
      const attrs = data.split(', ');
      attrs.forEach(attr => {
        if (result.hasOwnProperty(attr)) {
          result[attr]++;
        }
        else {
          result[attr] = 1;
        }
      })
    }
  })
  console.log(result)
}

const addMatches = async (title, prevMatches, fileName, document) => {

  // if (document.sheetsByTitle[title] !== undefined) {
  //   await document.sheetsByTitle[title].delete()
  // }

  // const sheet = await document.addSheet(
  //   { 
  //     title: title,
  //     headerValues: ['ConnectorForGirl', 'Girls Phone Number', 'ConnectorForGuy', 'Guys Phone Number',  'girlAlias', 'guyAlias'] 
  //   }
  // );

  const girlMatches = await generateMatches(prevMatches);
  // console.log(Object.keys(girlMatches).length)
  // const keys = Object.keys(girlMatches);
  // const directory = await getConnectors('MoDate Responses', document);
  // const newRows = []
  // for (let key of keys) {
  //   const guyMatches = girlMatches[key]
  //   for (let guy of guyMatches) {
  //     if (!prevMatches.hasOwnProperty(key)) {
  //       prevMatches[key] = {[guy]: 1};
  //     }
  //     else {
  //       prevMatches[key][guy] = 1;
  //     }
  //     if (!prevMatches.hasOwnProperty(guy)) {
  //       prevMatches[guy] = {[key]: 1};
  //     }
  //     else {
  //       prevMatches[guy][key] = 1;
  //     }
  //     newRows.push(
  //       {
  //         ConnectorForGirl: directory[key][0],
  //         'Girls Phone Number': directory[key][1],
  //         ConnectorForGuy: directory[guy][0],
  //         'Guys Phone Number': directory[guy][1],
  //         girlAlias: key,
  //         guyAlias: guy
  //       }
  //     )
  //   }
  // }
  dataForEmail(girlMatches, spreadSheet).then(emailData => {
    const connectors = Object.keys(emailData);
    console.log(connectors.length)
    // console.log(emailData)
    let recipients = ['michaellosev75@gmail.com', 'modate613@gmail.com']
    for (let i = 40; i < connectors.length; i++) {
      // const message = createMessage(connectors[i], emailData[connectors[i]].matches);
      console.log(emailData[connectors[i]].email)
      // sendMailTwilio(message, recipients[i]);
      // setTimeout(() => {sendEmail('michaellosev75@gmail.com', message, i)}, 1000 * i)
      // emailData[connectors[i]].email
    }
  })
  // await sheet.addRows(newRows)
  // fs.writeFile('girlMatches.json', JSON.stringify(girlMatches, null, 2), { flag: 'w+' }, (err) => {
  //   if (err) throw err;
  // })
  // fs.writeFile(fileName, JSON.stringify(prevMatches, null, 2), { flag: 'w+' }, (err) => {
  //   if (err) throw err;
  // })
}

const dataForEmail = async (results, document) => {
  const people = await data.getData();
  const peopleDirecotry = people.reduce((acc, cur) => {
    acc[cur.alias] = cur;
    return acc;
  }, {});
  const connectorResult = {};
  const connectorDirectory = await getConnectors('MoDate Responses', document);
  // console.log(connectorDirectory)
  const keys = Object.keys(results);
  for (let i = 0; i < keys.length; i++) {
    const girlMatch = keys[i];
    results[girlMatch].forEach(guyMatch => {
      // add to the girls connectors email list
      const girlsConnector = peopleDirecotry[girlMatch].connectorName.trim().toLowerCase();
      if (connectorResult.hasOwnProperty(girlsConnector)) {
        if (connectorResult[girlsConnector]['matches'].hasOwnProperty(girlMatch)) {
          connectorResult[girlsConnector]['matches'][girlMatch].push(
            {
              alias: guyMatch,
              age: peopleDirecotry[guyMatch].age,
              location: peopleDirecotry[guyMatch].location,
              connectorName: connectorDirectory[guyMatch][0],
              connectorNumber: connectorDirectory[guyMatch][1]
            }
          )
        }
        else {
          connectorResult[girlsConnector]['matches'][girlMatch] = [
            {
              alias: guyMatch,
              age: peopleDirecotry[guyMatch].age,
              location: peopleDirecotry[guyMatch].location,
              connectorName: connectorDirectory[guyMatch][0],
              connectorNumber: connectorDirectory[guyMatch][1]
            }
          ]
        }
      }
      else {
        connectorResult[girlsConnector] = {
          matches: {
            [girlMatch]: [
              {
                alias: guyMatch,
                age: peopleDirecotry[guyMatch].age,
                location: peopleDirecotry[guyMatch].location,
                connectorName: connectorDirectory[guyMatch][0],
                connectorNumber: connectorDirectory[guyMatch][1]
              }
            ]
          }
        }
        connectorResult[girlsConnector]['email'] = connectorDirectory[girlMatch][2];
      }
      // add to the guys connectors email list
      const guysConnector = peopleDirecotry[guyMatch].connectorName.trim().toLowerCase();
      if (connectorResult.hasOwnProperty(guysConnector)) {
        if (connectorResult[guysConnector]['matches'].hasOwnProperty(guyMatch)) {
          connectorResult[guysConnector]['matches'][guyMatch].push(
            {
              alias: girlMatch,
              age: peopleDirecotry[girlMatch].age,
              location: peopleDirecotry[girlMatch].location,
              connectorName: connectorDirectory[girlMatch][0],
              connectorNumber: connectorDirectory[girlMatch][1]
            }
          )
        }
        else {
          connectorResult[guysConnector]['matches'][guyMatch] = [
            {
              alias: girlMatch,
              age: peopleDirecotry[girlMatch].age,
              location: peopleDirecotry[girlMatch].location,
              connectorName: connectorDirectory[girlMatch][0],
              connectorNumber: connectorDirectory[girlMatch][1]
            }
          ]
        }
      }
      else {
        connectorResult[guysConnector] = {
          matches: {
            [guyMatch]: [
              {
                alias: girlMatch,
                age: peopleDirecotry[girlMatch].age,
                location: peopleDirecotry[girlMatch].location,
                connectorName: connectorDirectory[girlMatch][0],
                connectorNumber: connectorDirectory[girlMatch][1]
              }
            ]
          }
        }
        connectorResult[guysConnector]['email'] = connectorDirectory[guyMatch][2];
      }
    })
  }
  return connectorResult;
}

// send mail to connectors

const sendEmail = (recipient, message, index) => {
  transporter.verify((err, success) => {
    err
        ? console.log(err)
        : console.log(`=== Ready to send mail: ${success} ===`);
  });
  const mailOptions = {
    from: "test@gmail.com",
    to: recipient,
    subject: `MoDate Matches for week ${new Date().toLocaleDateString()} - Do Not Respond`,
    html: message
  };

  mailer.sendMail(mailOptions, function (err, data) {
    if (err) {
      console.log("Error " + err);
    } else {
      console.log(`Email sent successfully to ${recipient} # ${index}`);
      console.log(data)
    }
  });
}

function capitalizeFirstLetter(string) {
  let result = '';
  string.split(' ').forEach(str => {
    result += str.charAt(0).toUpperCase() + str.slice(1);
    result += ' ';
  });
  return result.trim();
}

const createMessage = (connector, emailData) => {

  let message = (`
    <head>
    <style>
      @media only screen and (max-width: 479px) {
        .main {
          width: 95% !important;
          margin: auto
        }
      }
    </style>
    <div class="main" style="margin: auto; width: 70%; padding:10px; font-family:monospace;">
      <div>
        <div style="text-align:center; font-size:30px; font-weight:bold; background:#25253b; color:white; padding: 20px;">${capitalizeFirstLetter(connector)}'s Matches</div>
      </div>
  `)
  const matches = Object.keys(emailData);
  for (let i = 0; i < matches.length; i++) {
    const curAlias = matches[i];
    const curAliasMatches = emailData[curAlias];
    message += `<div style="text-align:center; font-size:20px; font-weight:bold; background:white; color:black; padding: 20px;">Matches for ${curAlias}:</div>
    <div style="background: #25253b; color: white; padding: 15px;">`
    for (let j = 0; j < curAliasMatches.length; j++) {
      message += (`
        <div style="margin:10px; text-align:center">-->  <strong>${curAliasMatches[j].alias}</strong>, aged ${curAliasMatches[j].age}, located in ${curAliasMatches[j].location}. Reach out to <strong>${curAliasMatches[j].connectorName}</strong> for more details: <a href="tel:${curAliasMatches[j].connectorNumber}"><strong>${curAliasMatches[j].connectorNumber}</strong></a>.</div>
      `)
    }
    message += '</div>'
  }
  message += `<a href="https://ibb.co/2sp3ZMz"><img style="width: 120px; height: 55px; margin-top: 20px;" src="https://i.ibb.co/Hx9ThPc/moDate.png" alt="moDate" border="0"></a>`
  message += `<p>Follow us on Instagram <a href=https://www.instagram.com/modate613/>@modate613</a></p>`;
  message += `<p>We appreciate your hard work, pump the volume!</div></head>`;
  return message;
}

const sendMailTwilio = (msg, recipient) => {
  const email = {
    to: recipient,
    from: 'modate613@gmail.com',
    subject: `MoDate Matches for week ${new Date().toLocaleDateString()} - Do Not Respond`,
    text: 'and easy to do anywhere, even with Node.js',
    html: msg,
  }
  sgMail
    .send(email)
    .then(() => {
      console.log(`Email sent to ${recipient}`)
    })
    .catch((error) => {
      console.error(error)
    })
}

// Run the Algorithm
const mode = process.argv[3];

if (mode === 'run') {
  addMatches(new Date().toLocaleDateString(), prevMatches, 'MatchesTest.json', spreadSheet);
}
else if (mode === 'success') {
  const path = './MatchesTest.json';
  fs.exists(path, isExist => {
    if (isExist) {
      console.log("exists:", path);
      fs.rename(path, './Matches.json', function (err) {
        if (err) {
          console.log(err)
        }
        else {
          console.log('File Renamed.');

          fs.readFile('./girlMatches.json', (err, data) => {
            if (err) {
              console.log(err)
            }
            else {
              let girlMatches = JSON.parse(data);
              dataForEmail(girlMatches, spreadSheet).then(emailData => {
                const connectors = Object.keys(emailData);
                console.log(connectors.length)
                // console.log(emailData)
                // let k = 0;
                // for (let i = 40; i < connectors.length; i++) {
                //   const message = createMessage(connectors[i], emailData[connectors[i]].matches);
                  // console.log(connectors[i])
                  // sendMailTwilio(message, emailData[connectors[i]].email);
                  // setTimeout(() => {sendEmail(emailData[connectors[i]].email, message, i)}, 1000 * k)
                  // k++;
                  // emailData[connectors[i]].email
                // }
              })
            }
          })

          fs.unlink('./girlMatches.json', (err) => {
            if (err) {
              console.error(err)
            }
          })
        }
      });
    } else {
      console.log("DOES NOT exist:", path);
    }
  })
}
else {
  console.error("Incorrect number of arguments. Try running `$ node algo dev/test run` or `$ node algo dev/test success`");
  // sendEmail('michaellosev75@gmail.com', 'hello', 1)
  // generateMatches(prevMatches)
  // rankAtrributes();
  let recipients = ['michaellosev75@gmail.com']
  for (let i = 0; i < 1; i++) {
    sendMailTwilio('<strong>and easy to do anywhere, even with Node.js</strong>', recipients[0])
  }
}