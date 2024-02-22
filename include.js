const XLSX = require('xlsx')
const Papa = require('papaparse');
// const fs = require('fs')

// const file = reader.readFile('./edit.xlsx')
// const data = []

// const sheets = file.SheetNames
// for (let i = 0; i < sheets.length; i++) {
//     const temp = reader.utils.sheet_to_json(file.Sheets[sheets[i]])        
//     temp.forEach((res) => { data.push(res) })
// }


const workbook = XLSX.readFile('./medtest.xlsx');
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  // Convert the sheet to a CSV string
  const csvString = XLSX.utils.sheet_to_csv(sheet);

  // Parse the CSV string using PapaParse
  const parsedData = Papa.parse(csvString, { header: true });

  console.log(parsedData)



// const reader = require('xlsx')
// const file = reader.readFile('./edit.xlsx')
// let data = []

// const sheets = file.SheetNames
// for (let i = 0; i < sheets.length; i++) {
//     const temp = reader.utils.sheet_to_json(file.Sheets[sheets[i]])        
//     temp.forEach((res) => { data.push(res) })
// }

// console.log(data)