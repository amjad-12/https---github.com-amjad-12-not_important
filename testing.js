const csvData = [{brand_name: 'amjad'}, {brand_name: 'lobna'}, {brand_name: 'layana'}]
const proveMedicineData = [{brand_name: 'layana'}]

const missingData = csvData.filter(data => !proveMedicineData.find(proveData => proveData.brand_name === data.brand_name));
const missingRegNums = missingData.map(data => data.brand_name).join(', ');

const l = csvData.map(data => ({
  insertOne: {
      document: data,
  }
})
)

console.log(l)

// console.log(missingData)
// console.log(`[ ${missingRegNums} ]`)

// const XLSX = require('xlsx');


//     const workbook = XLSX.readFile('./medtest.xlsx');
//     const sheetName = workbook.SheetNames[0];
//     const sheet = workbook.Sheets[sheetName];

//     const expectedHeaders = {
//       'name': 'A1',
//     };
    
//     for (const [headerName, cell] of Object.entries(expectedHeaders)) {
//         const sheetCell = sheet[cell];
//         const trimmedHeaderName = headerName.trim();
//         if (!sheetCell || typeof sheetCell.v !== 'string') {
//           return res.send(`Please fill in the blank cell at ${cell} with the value "${trimmedHeaderName}"`);
//         } else if (sheetCell.v.trim().toLowerCase() !== trimmedHeaderName) {
//           return res.send(`Please rename ${cell} to "${trimmedHeaderName}"`);
//         }
//       }

//       for (const cellAddress in sheet) {
//         const sheetCell = sheet[cellAddress];
//         if (sheetCell.v && typeof sheetCell.v === 'string' && sheetCell.v.length > 255) {
//           return console.log(`Please make cell ${cellAddress} contains less than 255 characters`);
//         }
//       }
      

// const xlsx = require('xlsx');
// const workbook = xlsx.readFile('./medtest.xlsx');
// const sheetName = workbook.SheetNames[0]; // Change as needed
// const sheet = workbook.Sheets[sheetName];

// // Check if A1 and B1 cells match the name
// const A1 = sheet['A1'].v;

// if (A1 === 'name') {
//   // If true, extract all content from column A
//   const data = [];
//   let rowNum = 2; // Start at row 2 (assuming headers are in row 1)
//   while (sheet[`A${rowNum}`]) {
//     const cellValue = sheet[`A${rowNum}`].v;
//     data.push(cellValue);
//     rowNum++;
//   }
//   console.log(data);
// } else {
//   // If false, print a warning message
//   console.log(`Please rename the (A1, B1) to 'name'`);
// }

// const reader = require('xlsx')

// const file = reader.readFile('./medtest.xlsx')

// let data = []

// const sheets = file.SheetNames

// for(let i = 0; i < sheets.length; i++) {
//     const temp = reader.utils.sheet_to_json(
//         file.Sheets[file.SheetNames[i]])
//         console.log(file.SheetNames)

//     temp.forEach((res) => {
//         data.push(res)
//     })
// }
