const allMatches = async (document) => {
  let re = /Matches/;
  const spreadSheetTitles = Object.keys(document.sheetsByTitle);
  let arrMatches = [];
  spreadSheetTitles.forEach(title => {
    if (re.test(title)) {
      arrMatches.push(title);
    }
  })
  const listOfMatches = {};
  for (let i = 0; i < arrMatches.length; i++) {
    const curSheet = doc.sheetsByTitle[arrMatches[i]];
    const rows = await curSheet.getRows();
    rows.forEach(row => {
      const girlAlias = row['_rawData'][4];
      const guyAlias = row['_rawData'][5];
      if (!listOfMatches.hasOwnProperty(girlAlias)) {
        listOfMatches[girlAlias] = {[guyAlias]: 1};
      }
      else {
        listOfMatches[girlAlias][guyAlias] = 1;
      }
      if (!listOfMatches.hasOwnProperty(guyAlias)) {
        listOfMatches[guyAlias] = {[girlAlias]: 1};
      }
      else {
        listOfMatches[guyAlias][girlAlias] = 1;
      }
    })
  }
  fs.writeFile('MatchesTest.json', JSON.stringify(listOfMatches, null, 2), (err) => {
    if (err) throw err;
  })
}

async function filterPrevMatches(prevDocs, document) {
  const result = {}
  for (let i = 0; i < prevDocs.length; i++) {
    const sheet = document.sheetsByTitle[prevDocs[i]]
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
