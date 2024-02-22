const { OurMedicine } = require('../../models/pharamacists/ourMedicine');
const { PharmacistMedicine, validatePharmacistMedicine } = require('../../models/pharamacists/pharmacistMedicine')
const { Pharmacist } = require('../../models/pharamacists/pharmacist')
const XLSX = require('xlsx');
const fastcsv = require('fast-csv');
const Joi = require('joi')
const pharmacist = require('../../middleware/pharmacist');

async function onePharmacistMedicine(req, res) {
    try {
        const { error } = validatePharmacistMedicine(req.body);
        if (error) return res.status(400).json({
            message: error.details[0].message
        });

        const pharmacist = await Pharmacist.findById(req.pharmacist._id)
        if (!pharmacist) return res.status(400).json({
            message: 'Invalid pharmacist.'
        });

        newData = req.body.brand_name
        const notExistInOurDb = [];
        const existInOurDb = []
        // const ourMedicine = await OurMedicine.findOne({ brand: { $regex: new RegExp(`^${my_brand_name}$`, 'i') } });
        let ourMedicine = await OurMedicine.findOne(
            { brand: { $regex: new RegExp(`^${newData}$`, "i") } }
        );
        // let ourMedicine = await OurMedicine.findOne({ brand: newData });
        if (ourMedicine) {
            console.log('plk')
            existInOurDb.push(newData);
            const result = await PharmacistMedicine.updateOne(
                { brand_name: { $regex: new RegExp(newData, "i") } },
                {
                    $setOnInsert: { brand_name: newData },
                    $addToSet: { pharmacist: pharmacist._id }
                },
                { upsert: true },
            )
        } else {
            notExistInOurDb.push(newData);
        }
        if (existInOurDb.length > 0) {
            return res.status(200).json({
                brand_names_added_successfully: existInOurDb,
            });
        } else {
            return res.status(200).json({
                brand_names_dont_exist: notExistInOurDb,
            });
        }

    } catch (ex) {
        return res.status(500).send('Internal server error')
    }
}

async function PharmacistMedicines(req, res) {
    try {

        const pharmacist = await Pharmacist.findById(req.pharmacist._id)
        if (!pharmacist) return res.status(400).json({
            message: 'Invalid pharmacist.'
        });

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
            'brand_name': 'A1',
        };

        // Check that the headers in the Excel file match the expected headers
        for (const [headerName, cell] of Object.entries(expectedHeaders)) {
            const sheetCell = sheet[cell];
            const trimmedHeaderName = headerName.trim();
            if (!sheetCell || typeof sheetCell.v !== 'string') {
                return res.status(400).json({
                    message: `Please fill in the blank cell at ${cell} with the value "${trimmedHeaderName}"`
                });
            } else if (sheetCell.v.trim().toLowerCase() !== trimmedHeaderName) {
                return res.status(400).json({
                    message: `Please rename ${cell} to "${trimmedHeaderName}"`
                });
            }
        }

        // Retrieve the specified header cells from the expectedHeaders object
        const headers = Object.keys(expectedHeaders);
        const headerCells = Object.values(expectedHeaders);
        // Loop through the specified header cells and check the cells in the corresponding columns
        for (let i = 0; i < headerCells.length; i++) {
            const column = headerCells[i][0];
            const columnRegex = new RegExp(`^${column}\\d+$`);
            // Check the number of characters in each cell
            for (const cellAddress in sheet) {
                if (cellAddress.match(columnRegex)) {
                    const sheetCell = sheet[cellAddress];
                    if (sheetCell && typeof sheetCell.v === 'string' && sheetCell.v.length > 600) {
                        return res.status(400).json({
                            message: `Please make cell ${cellAddress} for header "${headers[i]}" contain less than 600 characters`
                        });
                    } else if (sheetCell.v === '') {
                        // console.log('pp')
                        return res.status(400).json({
                            message: `Please make cell ${cellAddress} for header "${headers[i]}" non-empty`
                        });
                    }
                }
            }
        }

        // Convert the sheet to a CSV stream using XLSX
        const csvStream = XLSX.stream.to_csv(sheet);
        const insertDocuments = [];
        const notExistInOurDb = [];
        const existInOurDb = []
        // Parse the CSV data using fast-csv
        const csvData = [];
        const parser = fastcsv.parse({ headers: true })
            .on('data', async (data) => {
                // console.log(data)
                // Convert all keys to lowercase to match the field names in the schema
                const keys = Object.keys(data);
                console.log(data)
                // console.log(keys)
                const newData = {};
                for (let i = 0; i < keys.length; i++) {
                    const key = keys[i].toLowerCase().trim();
                    const value = data[keys[i]].toLowerCase().trim();
                    if (expectedHeaders[key]) {
                        newData[key] = value;
                    }
                }
                const my_brand_name = newData.brand_name;
                // const newDataModified = {
                //     brand_name: my_brand_name
                // };
                const ourMedicine = await OurMedicine.findOne({ brand: { $regex: new RegExp(`^${my_brand_name}$`, 'i') } });
                if (ourMedicine !== []) {
                    existInOurDb.push(my_brand_name);
                    insertDocuments.push({
                        updateOne: {
                            filter: {
                                brand_name: { $regex: new RegExp(`^${my_brand_name}$`, 'i') }
                            },
                            update: {
                                $setOnInsert: newData,
                                $addToSet: { pharmacist: pharmacist._id }
                            },
                            upsert: true
                        }
                    });
                } else {
                    if (my_brand_name !== '') {
                        notExistInOurDb.push(my_brand_name);
                    }
                }
            })
            .on('end', async () => {
                // Save the parsed data to MongoDB using bulkWrite
                if (insertDocuments.length > 0) {
                    const result = await PharmacistMedicine.bulkWrite(insertDocuments);
                }
                const response = {
                    brand_names_added_successfully: existInOurDb
                };
                if (notExistInOurDb.length > 0) {
                    response.brand_names_dont_exist = notExistInOurDb;
                }
                return res.status(201).json(response);

            });
        csvStream.pipe(parser);
    } catch (ex) {
        res.status(500).json({message:'Internal server error'})
    }
}

async function removePharmacistMedicine(req, res) {
    try {
        const { brand_name } = req.body;

        // Find the pharmacist by ID and only return the _id field
        const pharmacist = await Pharmacist.findById(req.pharmacist._id).select('_id').lean()
        if (!pharmacist) return res.status(400).json({
            message: 'Invalid pharmacist.'
        });

        // const pharmacistSure = await Pharmacist.findById(req.pharmacist._id).select('_id');
        // if (!pharmacist) {
        //     return res.status(404).json({ error: 'Pharmacist not found' });
        // }

        // Find the pharmacist medicine by brand name and pharmacist ID

        // Find and update the pharmacist medicine
        const updatedPharmacistMedicine = await PharmacistMedicine.findOneAndUpdate(
            {
                brand_name: { $regex: new RegExp(`^${brand_name}$`, 'i') },
                pharmacist: pharmacist._id,
            },
            { $pull: { pharmacist: pharmacist._id } },
            { new: true } // Return the updated document
        ).lean();
        if (!updatedPharmacistMedicine) {
            return res.status(404).json({ message: 'Pharmacist medicine not found' });
        }

        return res.status(200).json({ message: 'Pharmacist medicine removed successfully' });

    } catch (ex) {
        console.error(ex);
        return res.status(500).json({message:'Internal server error'});
    }
}

async function searchForMedicine(req, res) {
    try {

        const { state, municipality, brand_name } = req.query;
        // if (!brand_name)

        if (!state && !municipality) {
            const pharamacies = await PharmacistMedicine.find({
                brand_name: { $regex: brand_name, $options: 'i' }
            }).populate({
                path: 'pharmacist',
                select: 'name location',
                match: { isConfirmed: true, isOpen: true }
            })
                .select('-_id pharamacist brand_name ')
                .exec();
            ;
            if (!pharamacies || pharamacies.length === 0) {
                return res.status(404).json({ message: 'No medical analyses found' });
            }
            return res.status(200).json(pharamacies);

        } else if (state && municipality) {
            const pharamacies = await PharmacistMedicine.find({
                brand_name: { $regex: brand_name, $options: 'i' }
            }).populate({
                path: 'pharmacist',
                select: 'name location ',
                match: { isConfirmed: true, isOpen: true, state: state, municipality: municipality },
            })
                .select('-_id pharamacist brand_name ')
                .exec();
            ;
            if (!pharamacies || pharamacies.length === 0) {
                return res.status(404).json({ message: 'No medical analyses found' });
            }

            return res.status(200).json(pharamacies);
        } else if (state) {
            const pharamacies = await PharmacistMedicine.find({
                brand_name: { $regex: brand_name, $options: 'i' }
            }).populate({
                path: 'pharmacist',
                select: 'name location ',
                match: { isConfirmed: true, isOpen: true, state: state }
            })
                .select('-_id pharamacist brand_name ')
                .exec();
            ;
            if (!pharamacies || pharamacies.length === 0) {
                return res.status(404).json({ message: 'No medical analyses found' });
            }

            return res.status(200).json(pharamacies);
        } else if (municipality) {
            const pharamacies = await PharmacistMedicine.find({
                brand_name: { $regex: brand_name, $options: 'i' }
            }).populate({
                path: 'pharmacist',
                select: 'name location ',
                match: { isConfirmed: true, isOpen: true, municipality: municipality}
            })
            .select('-_id pharamacist brand_name ')
            .exec();
            ;
            if (!pharamacies || pharamacies.length === 0) {
                return res.status(404).json({ message: 'No medical analyses found' });
            }

            return res.status(200).json(pharamacies);
        }
        // const { name } = req.params;
        // if (!name) {
        //     return res.status(404).json({message: "name is required"})
        // }
        // const { state, municipality } = req.query;
        // console.log(name)
        // if (!state && !municipality) {

        //     const pharmacyMedicines = await PharmacistMedicine.find({
        //         brand_name: { $regex: name, $options: 'i' }
        //     })
        //         .populate({
        //             path: 'pharmacist',
        //             select: 'name location isConfirmed',
        //             match: { isConfirmed: true, isOpen: true }
        //         })
        //         .select('-_id pharmacist')
        //         .exec();
        //     console.log(pharmacyMedicines)

        //     if (!pharmacyMedicines || pharmacyMedicines.length === 0) {
        //         return res.status(404).json({ message: 'No pharmacy medicines found' });
        //     }


        //     const filteredPharmacyMedicines = pharmacyMedicines[0]?.pharmacist.filter((medicine) => {
        //         return medicine?.isConfirmed === true;
        //     });

        //     return res.status(200).json(filteredPharmacyMedicines);
        // } else if (state && municipality) {
        //     const pharmacyMedicines = await PharmacistMedicine.find({
        //         brand_name: { $regex: name, $options: 'i' }
        //     })
        //         .populate({
        //             path: 'pharmacist',
        //             select: 'name location isConfirmed',
        //             match: { isConfirmed: true, isOpen: true, state: { $regex: state, $options: 'i' }, municipality: { $regex: municipality, $options: 'i' } }
        //         })
        //         .select('-_id pharmacy')
        //         .exec();

        //     if (!pharmacyMedicines || pharmacyMedicines.length === 0) {
        //         return res.status(404).json({ message: 'No pharmacy medicines found' });
        //     }

        //     const filteredPharmacyMedicines = pharmacyMedicines[0]?.pharmacist.filter((medicine) => {
        //         return medicine?.isConfirmed === true;
        //     });

        //     return res.status(200).json(filteredPharmacyMedicines);
        // } else if (state) {
        //     const pharmacyMedicines = await PharmacistMedicine.find({
        //         brand_name: { $regex: name, $options: 'i' }
        //     })
        //         .populate({
        //             path: 'pharmacist',
        //             select: 'name location isConfirmed',
        //             match: { isConfirmed: true, isOpen: true, state: { $regex: state, $options: 'i' } }
        //         })
        //         .select('-_id pharmacy')
        //         .exec();

        //     if (!pharmacyMedicines || pharmacyMedicines.length === 0) {
        //         return res.status(404).json({ message: 'No pharmacy medicines found' });
        //     }

        //     const filteredPharmacyMedicines = pharmacyMedicines[0]?.pharmacist.filter((medicine) => {
        //         return medicine?.isConfirmed === true;
        //     });

        //     return res.status(200).json(filteredPharmacyMedicines);
        // } else if (municipality) {
        //     const pharmacyMedicines = await PharmacistMedicine.find({
        //         brand_name: { $regex: name, $options: 'i' }
        //     })
        //         .populate({
        //             path: 'pharmacy',
        //             select: 'name location isConfirmed',
        //             match: { isConfirmed: true, isOpen: true, municipality: { $regex: municipality, $options: 'i' } }
        //         })
        //         .select('-_id pharmacy')
        //         .exec();

        //     if (!pharmacyMedicines || pharmacyMedicines.length === 0) {
        //         return res.status(404).json({ message: 'No pharmacy medicines found' });
        //     }

        //     const filteredPharmacyMedicines = pharmacyMedicines[0]?.pharmacist.filter((medicine) => {
        //         return medicine?.isConfirmed === true;
        //     });

        //     return res.status(200).json(filteredPharmacyMedicines);
        // }
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
}

async function searchForNameMedicine(req, res) {
    try {
        // Validate the search query parameter using Joi
        const schema = Joi.object({
            name_medicine: Joi.string().min(1).max(50).required()
        });
        const { error } = schema.validate(req.query);
        if (error) {
            return res.status(400).json({message: error.details[0].message});
        }

        // Search for documents that match the query
        const query = req.query.name_medicine;

        const results = await PharmacistMedicine.find({
            brand_name: { $regex: query, $options: 'i' }
        }).select('-_id -pharmacist')
        // .populate({
        //     path: 'pharmacist',
        //     select: 'name location',
        //     match: { isConfirmed: true }
        // })
        // .select('-_id pharmacist brand_name')
        // .exec();

        return res.send({ data: results });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Internal server error.' });
    }
}

async function getAllPharmacyMedicine(req, res) {
    const pharmacist = await Pharmacist.findById(req.pharmacist._id).select('_id').lean()
    if (!pharmacist) return res.status(400).json({
        message: 'Invalid pharmacist.'
    });

    try {
        const pharmacistId = req.pharmacist._id;

        // Find all medicines associated with the given pharmacist ID
        const medicines = await PharmacistMedicine.find({ pharmacist: pharmacistId }).lean();

        if (medicines.length === 0) {
            return res.status(200).json({ message: 'No medicines found for the specified pharmacist ID' });
        }

        const medicineNames = medicines.map(medicine => medicine.brand_name);

        return res.status(200).json({ medicineNames });

    } catch (ex) {
        return res.status(500).json({message:'Internal server error'});
    }
}

async function toggleIsOpen(req, res) {
    try {
        const pharmacyId  = req.pharmacist._id;

        // Find the pharmacy by ID
        const pharmacy = await Pharmacist.findById(pharmacyId);

        if (!pharmacy) {
            return res.status(404).json({ message: 'Pharmacy not found' });
        }

        // Toggle the isOpen status
        pharmacy.isOpen = !pharmacy.isOpen;

        // Save the updated pharmacy
        await pharmacy.save();

        return res.status(200).json({ isOpen: pharmacy.isOpen, message: 'toggled successfully' });
    } catch (error) {
        return res.status(500).json({ message: 'Internal server error' });
    }
}

async function knowIsOpen(req, res) {
    try {
        const pharmacyId  = req.pharmacist._id;

        // Find the pharmacy by ID
        const pharmacy = await Pharmacist.findById(pharmacyId);

        if (!pharmacy) {
            return res.status(404).json({ message: 'Pharmacy not found' });
        }

        

        // Save the updated pharmacy
        await pharmacy.save();

        return res.status(200).json({ isOpen: pharmacy.isOpen});
    } catch (error) {
        return res.status(500).json({ message: 'Internal server error' });
    }
}

module.exports = {
    PharmacistMedicines,
    onePharmacistMedicine,
    removePharmacistMedicine,
    searchForMedicine,
    searchForNameMedicine,
    getAllPharmacyMedicine,
    toggleIsOpen,
    knowIsOpen
}