const { OurMedicine } = require('../../models/pharamacists/ourMedicine');
const XLSX = require('xlsx');
const fastcsv = require('fast-csv');

/**
 * @desc Uploads a CSV file of medicine information to the database
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 * @return {Object} A response indicating success or failure, and two lists of brand names for new and existing medicines
 */
async function ourMedicine(req, res) {
  try {
    // Check if a file was uploaded
    if (!req.file) {
      return res.status(400).json({
        message: 'Error: No file uploaded'
      });
    }

    // Check if the file is in XLSX format
    const fileExtension = req.file.originalname.split('.').pop();
    if (fileExtension !== 'xlsx') {
      return res.status(400).json({
        message: 'Error: File must be in .xlsx format'
      });
    }

    // Read the Excel file and get the first sheet
    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // Define the expected headers for the Excel file
    const expectedHeaders = {
      // 'name': 'A1',
      // 'age': 'B1'
      'number': 'A1',
      'rigistration_number': 'B1',
      'code': 'C1',
      'dci': 'D1',
      'brand': 'E1',
      'form': 'F1',
      'dosage': 'G1',
      'cond': 'H1',
      'list': 'I1',
      'p_one': 'J1',
      'p_two': 'K1',
      'obs': 'L1',
      'lab_decision': 'M1',
      'country_lab_decision': 'N1',
      'init_date': 'O1',
      'fina_date': 'P1',
      'type': 'Q1',
      'status': 'R1',
      'duration': 'S1'
    };

    // Check that the headers in the Excel file match the expected headers
    for (const [headerName, cell] of Object.entries(expectedHeaders)) {
      const sheetCell = sheet[cell];
      const trimmedHeaderName = headerName.trim();
      if (!sheetCell || typeof sheetCell.v !== 'string') {
        return res.status(400).json({
          message: `Please fill in the blank cell at ${cell} with the value ${trimmedHeaderName}`
        });
      } else if (sheetCell.v.trim().toLowerCase() !== trimmedHeaderName) {
        return res.status(400).json({
          message: `Please rename ${cell} to ${trimmedHeaderName}`
        });
      }
    }

    // Check the number of characters in each cell
    const headers = Object.keys(expectedHeaders);
    console.log(headers)
    const headerCells = Object.values(expectedHeaders);
    console.log(headerCells)
    // Loop through the specified header cells and check the cells in the corresponding columns
    for (let i = 0; i < headerCells.length; i++) {
      const column = headerCells[i][0];
      const columnRegex = new RegExp(`^${column}\\d+$`);
      for (const cellAddress in sheet) {
        if (cellAddress.match(columnRegex)) {
          const sheetCell = sheet[cellAddress];
          if (sheetCell && typeof sheetCell.v === 'string' && sheetCell.v.length > 600) {
            return res.status(400).json({
              message: `Please make cell ${cellAddress} for header "${headers[i]}" contain less than 600 characters`
            });
          }
        }
      }
    }



    // Convert the sheet to a CSV stream using XLSX
    const csvStream = XLSX.stream.to_csv(sheet);
    // Create an array to store the documents to be inserted
    const insertDocuments = [];
    // Parse the CSV data using fast-csv
    const parser = fastcsv.parse({ headers: true })
      .on('data', (data) => {

        // Convert all keys to lowercase and trim them to match the field names in the schema
        const keys = Object.keys(data);

        const lowerCaseKeys = keys.map(key => key.toLowerCase().trim());
        const newData = {};
        for (let i = 0; i < keys.length; i++) {
          const key = keys[i].toLowerCase().trim();
          const value = data[keys[i]].toLowerCase().trim();
          if (expectedHeaders[key]) {
            newData[key] = value;
          }
        }

        insertDocuments.push({
          updateOne: {
            filter: {
              number: newData.number,
              rigistration_number: newData.rigistration_number,
              code: newData.code,
              dosage:  newData.dosage,
              p_one: newData.p_one,
              p_two:  newData.p_two
            },
            update: newData,
            upsert: true
          }
        });
      })
      .on('end', async () => {
        // If there is data in the CSV file, insert the documents using bulkWrite
        if (insertDocuments.length > 0) {
          const result = await OurMedicine.bulkWrite(insertDocuments);
        }

        return res.status(200).json({ message: 'data saved correctly' });
      });

    // Pipe the CSV stream to the parser
    csvStream.pipe(parser);

  } catch (ex) {
    // If there is an error, send an internal server error response
    console.error(ex);
    return res.status(500).json({
      message: 'Internal server error'
    });
  }
}

module.exports = {
  ourMedicine
};

