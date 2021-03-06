import * as fs from 'fs';
import * as data from './spreadsheet.js';
import dotenv from 'dotenv';
dotenv.config();
import { MYERSBRIGGS, LEGEND, RANKING, G, LG, B, Y, R} from "./consts/algoConstants.js";
import mailer from "./mailer.js";
import transporter from "./mailer.js";
import { readFile } from 'fs/promises';

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
    const suitors = filterBasedOnSex(people[i], people);
    const religiousMatchingFemales = filterBasedOnReligion(people[i], suitors)
    const match = people[i];
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
      if (compatiblePartners[i].compatabilityScore >= 4) {
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

  const preMatches = {};
  for (let female of females) {
    const compatiblePartners = female.compatiblePartners;
    let i = 0;
    while (i < compatiblePartners.length) {
      if (compatiblePartners[i].compatabilityScore >= 4) {
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
            if ((numMatches[name] < 3 && numMatches[match] < 3)) {
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
            if (numMatches[match] < 3) {
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
            if (numMatches[name] < 3) {
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
  const connectors = document.sheetsByTitle['Connector Directory'];
  const cRows = await connectors.getRows();
  const dict = {};
  cRows.forEach(row => {
    const arr = row['_rawData'];
    dict[arr[1].trim().toLowerCase()] = arr[2];
  })
  const directory = {}
  rows.forEach(row => {
    const arr = row['_rawData'];
    directory[arr[1]] = [arr[3], dict[arr[3].trim().toLowerCase()]];
  })
  return directory;
}

const rankAtrributes = async () => {
  const doc = await data.getDoc();
  await doc.loadInfo(); 
  const sheet = doc.sheetsByTitle['Form Responses 1'];
  const rows = await sheet.getRows();
  const result = {};
  rows.map(row => {
    const data = row['_rawData'][12];
    if (row['_rawData'][5] === 'Female') {
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
}

const addMatches = async (title, prevMatches, fileName, document) => {

  if (document.sheetsByTitle[title] !== undefined) {
    await document.sheetsByTitle[title].delete()
  }

  const sheet = await document.addSheet(
    { 
      title: title,
      headerValues: ['ConnectorForGirl', 'Girls Phone Number', 'ConnectorForGuy', 'Guys Phone Number',  'girlAlias', 'guyAlias'] 
    }
  );

  const girlMatches = await generateMatches(prevMatches);
  const keys = Object.keys(girlMatches);
  const directory = await getConnectors('Form Responses 1', document);
  const newRows = []
  for (let key of keys) {
    const guyMatches = girlMatches[key]
    for (let guy of guyMatches) {
      if (!prevMatches.hasOwnProperty(key)) {
        prevMatches[key] = {[guy]: 1};
      }
      else {
        prevMatches[key][guy] = 1;
      }
      if (!prevMatches.hasOwnProperty(guy)) {
        prevMatches[guy] = {[key]: 1};
      }
      else {
        prevMatches[guy][key] = 1;
      }
      newRows.push(
        {
          ConnectorForGirl: directory[key][0],
          'Girls Phone Number': directory[key][1],
          ConnectorForGuy: directory[guy][0],
          'Guys Phone Number': directory[guy][1],
          girlAlias: key,
          guyAlias: guy
        }
      )
    }
  }
  await sheet.addRows(newRows)
  fs.writeFile(fileName, JSON.stringify(prevMatches, null, 2), { flag: 'w+' }, (err) => {
    if (err) throw err;
  })
}


// send mail to connectors
const sendMail = process.argv[3];
if (sendMail === "send") {
  transporter.verify((err, success) => {
    err
        ? console.log(err)
        : console.log(`=== Ready to send mail: ${success} ===`);
  });
  const mailOptions = {
    from: "test@gmail.com",
    to: process.env.EMAIL,
    subject: "Nodemailer API",
    text: "Hi from your nodemailer API",
  };

  mailer.sendMail(mailOptions, function (err, data) {
    if (err) {
      console.log("Error " + err);
    } else {
      console.log("Email sent successfully");
    }
  });
}

// Run the Algorithm
const mode = process.argv[2];

if (mode === 'run') {
  addMatches(new Date().toLocaleDateString(), prevMatches, 'MatchesTest.json', spreadSheet);
}
else if (mode === 'test') {
  addMatches(new Date().toLocaleDateString(), prevMatches, 'MatchesTest.json', spreadSheet); 
} 
else if (mode === 'success') {
  const path = './MatchesTest.json';
  fs.exists(path, isExist => {
    if (isExist) {
      console.log("exists:", path);
      fs.rename(path, './Matches.json', function (err) {
        if (err) throw err;
        console.log('File Renamed.');
      });
    } else {
      console.log("DOES NOT exist:", path);
    }
  })
}
else {
  console.error("Incorrect number of arguments. Try running `$ node algo run` or `$ node algo test`");
}