const fs = require('fs')
// const people = [{name: 'michael', sex: 'male'}, {name: 'evan', sex: 'male'}, {name: 'sarah', sex: 'female'}, {name: 'rachel', sex: 'female'}];
// const me = people.filter(person => person.name === 'michael')[0];
const data = require('./spreadsheet');

const G = "its got a good chance"
const LG = "one sided match"
const B = "often listed as an ideal match"
const Y = "it could work but not ideal"
const R = "uh oh, think this one through"

const Ranking = {
  "uh oh, think this one through": 1,
  "one sided match": 2,
  "it could work but not ideal": 3, 
  "its got a good chance": 4,
  "often listed as an ideal match": 5
}


const legend = {
    INFP: 0,
    ENFP: 1,
    INFJ: 2, 
    ENFJ: 3,
    INTJ: 4,
    ENTJ: 5,
    INTP: 6,
    ENTP: 7,
    ISFP: 8,
    ESFP: 9,
    ISTP: 10,
    ESTP: 11,
    ISFJ: 12,
    ESFJ: 13,
    ISTJ: 14,
    ESTJ: 15
}

const myersBriggs = [
  [G, G, G, B, G, B, G, G, R, R, R, R, R, R, R, R],
  [G, G, B, G, B, G, G, G, R, R, R, R, R, R, R, R],
  [G, B, G, G, G, G, G, B, R, R, R, R, R, R, R, R],
  [B, G, G, G, G, G, G, G, B, R, R, R, R, R, R, R],
  [G, B, G, G, G, G, G, B, LG, LG, LG, LG, Y, Y, Y, Y],
  [B, G, G, G, G, G, B, G, LG, LG, LG, LG, LG, LG, LG, LG],
  [G, G, G, G, G, B, G, G, LG, LG, LG, LG, Y, Y, Y, B],
  [G, G, B, G, B, G, G, G, LG, LG, LG, LG, Y, Y, Y, Y], 
  [R, R, R, B, LG, LG, LG, LG, Y, Y, Y, Y, LG, B, LG, B],
  [R, R, R, R, LG, LG, LG, LG, Y, Y, Y, Y, B, LG, B, LG],
  [R, R, R, R, LG, LG, LG, LG, Y, Y, Y, Y, LG, B, LG, B],
  [R, R, R, R, LG, LG, LG, LG, Y, Y, Y, Y, B, LG, B, LG],
  [R, R, R, R, Y, LG, Y, Y, LG, B, LG, B, G, G, G, G],
  [R, R, R, R, Y, LG, Y, Y, B, LG, B, LG, G, G, G, G],
  [R, R, R, R, Y, LG, Y, Y, LG, B, LG, B, G, G, G, G],
  [R, R, R, R, Y, LG, B, Y, B, LG, B, LG, G, G, G, G]
]

const getPotentialSuitors = (match, people) => {
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
    // else if (!isNaN(match.minAge) && !isNaN(person.minAge)) {
    //   if ((person.age < match.minAge || person.age > match.maxAge) || (match.age < person.minAge || match.age > person.maxAge)) {
    //     return false
    //   }
    // }
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
    console.log(person.minAge)
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
  // console.log(matchesP, match.alias, suitorsP, suitor.alias)
  
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

// const filterOnMyersBriggs = (match, people, legend, myersBriggs, ranking) => {
//   return people.filter(person => {
//     const result = checkMyersBriggs(match, person, legend, myersBriggs, ranking);
//     if (result !== null && result !== R && result !== LG) {
//       return true;
//     }
//     return false;
//   })
// }

// people is array of everyone but the match
// const getCompatibleMatches = (match, people, legend, myersBriggs, ranking) => {
//   const females = getPotentialSuitors(match, people);
//   const religiousMatchingFemales = filterBasedOnReligion(match, females);
//   const myersBriggsMatches = filterOnMyersBriggs(match, religiousMatchingFemales, legend, myersBriggs, ranking);
//   const resultingRankings = myersBriggsMatches.map(person => {
//     let score = Object.keys(match.characteristicsP).reduce((acc, key) => {
//       if (match.characteristicsP[key] === true && person.characteristics[key] === true) {
//         return acc + 1;
//       }
//       else return acc;
//     }, 0)
//     const mbResult = checkMyersBriggs(match, person, legend, myersBriggs, ranking);
//     if (mbResult === B) {
//       score += 3;
//     }
//     else if (mbResult === G) {
//       score += 2;
//     }
//     else {
//       score++;
//     }
//     return {
//       name: person.name,
//       compatabilityScore: score
//     }
//   })
//   resultingRankings.sort((a, b) => b.compatabilityScore - a.compatabilityScore);
//   return resultingRankings;

// }

async function main(prevDocs) {
  let people = await data.getData();
  people = people.filter(person => person.inactive == 'FALSE');
  const numPeople = people.length;
  const numMen = people.filter(person => person.sex === 'Male').length;
  const numFemales = numPeople - numMen;

  console.log(`total people: ${numPeople}\ntotal Men: ${numMen}\ntotal Females: ${numFemales}`)
  const results = {}
  for (let i = 0; i < numPeople; i++) {
    const suitors = getPotentialSuitors(people[i], people);
    const religiousMatchingFemales = filterBasedOnReligion(people[i], suitors)
    // const myersBriggsMatches = filterOnMyersBriggs(people[i], religiousMatchingFemales, legend, myersBriggs, Ranking);
    const resultingRankings = religiousMatchingFemales.map(person => {
      match = people[i];
      let score = Object.keys(match.characteristicsP).reduce((acc, key) => {
        if (match.characteristicsP[key] === true && person.characteristics[key] === true) {
          return acc + 1;
        }
        else return acc;
      }, 0)
      const mbResult = checkMyersBriggs(match, person, legend, myersBriggs, Ranking);
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
  // console.log(results['ENHM994'])
  
  // const obj = Object.keys(results).reduce((acc, cur) => {
  //   acc[results[cur].sex] = acc.hasOwnProperty(results[cur].sex) ? acc[results[cur].sex] + 1 : 1;
  //   return acc
  // }, {})

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

  // console.log(females)
  
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
  
  const prevMatches = await filterPrevMatches(prevDocs)
  const numMatches = {}
  const girlMatches = {};
  for (name of Object.keys(preMatches)) {
    for (match of preMatches[name]) {
      if (prelimMatches[match] && prelimMatches[match].includes(name)) {
        if (!prevMatches[name] || !prevMatches[name].includes(match)) {
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
        
          // if (girlMatches.hasOwnProperty(name)) {
          //   girlMatches[name].push(match);
          // }
          // else {
          //   girlMatches[name] = [match];
          // } 
      }
    }
  }
  return girlMatches;
  // console.log(girlMatches)
}

async function filterPrevMatches(prevDocs) {
  const doc = await data.getDoc();
  await doc.loadInfo();
  const result = {}
  for (let i = 0; i < prevDocs.length; i++) {
    const sheet = doc.sheetsByTitle[prevDocs[i]]
    const rows = await sheet.getRows();
    rows.forEach(row => {
      const arr = row['_rawData'];
      const girlAlias = arr[4];
      const guyAlias = arr[5];
      if (result.hasOwnProperty(girlAlias)) {
        result[girlAlias].push(guyAlias);
      }
      else {
        result[girlAlias] = [guyAlias];
      }
    })
  }
  return result;
}

const getConnectors = async (title) => {
  const doc = await data.getDoc();
  await doc.loadInfo();
  const sheet = doc.sheetsByTitle[title]
  const rows = await sheet.getRows();
  rows.shift();
  const connnectors = doc.sheetsByTitle['Connector Directory'];
  const cRows = await connnectors.getRows();
  const dict = {};
  cRows.forEach(row => {
    const arr = row['_rawData'];
    dict[arr[1].trim().toLowerCase()] = arr[2];
  })
  // console.log(dict)
  const directory = {}
  rows.forEach(row => {
    const arr = row['_rawData'];
    console.log(arr)
    directory[arr[1]] = [arr[3], dict[arr[3].trim().toLowerCase()]];
  })
  // console.log(dict)
  // console.log(directory)
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
          result[attr]++;``
        }
        else {
          result[attr] = 1;
        }
      })
    }
  })
  console.log(result)
}

const addMathces = async (title, prevDocs) => {

  const doc = await data.getDoc();
  await doc.loadInfo();

  if (doc.sheetsByTitle[title] !== undefined) {
    await doc.sheetsByTitle[title].delete()
  }

  const sheet = await doc.addSheet(
    { 
      title: title,
      headerValues: ['ConnectorForGirl', 'Girls Phone Number', 'ConnectorForGuy', 'Guys Phone Number',  'girlAlias', 'guyAlias'] 
    }
  );

  const girlMatches = await main(prevDocs);
  // console.log(girlMatches)
  const keys = Object.keys(girlMatches);
  const directory = await getConnectors('Form Responses 1');
  // console.log(directory)
  const newRows = []
  for (let key of keys) {
    const guyMatches = girlMatches[key]
    for (let guy of guyMatches) {
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

}

const test = async (title) => {
  // const doc = await data.getDoc();
  // await doc.loadInfo();
  // const sheet = doc.sheetsByTitle[title];
  // const rows = await sheet.getRows();
  // rows.forEach(row => {
  //   const active = row['_rawData'][2];
  //   if (active === 'TRUE') {
  //     console.log('true')
  //   }
  // })
  const people = await data.getData();
  // people.shift()
  console.log(people[318])
}

// test('Form Responses 1')

// console.log(getPotentialSuitors(me, people))
addMathces('Matches (Sep 5th)', ['Matches (May 2nd)', 'Matches (May 15th)', 'Matches (June 2nd)', 'Matches (June 13th)', 'Matches (June 20th)', 'Matches (June 27th)', 'Matches (July 6th)', 'Matches (July 11th)', 'Matches (July 19th)', 'Matches (July 25th)', 'Matches (Aug 1st)', 'Matches (Aug 8th)', 'Matches (Aug 15th)', 'Matches (Aug 22nd)', 'Matches (Aug 30th)'])
// rankAtrributes()