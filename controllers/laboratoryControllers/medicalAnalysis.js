
// const { validateMedicalAnalysis  } = require('../../models/laboratories/medicalAnalys')
const { MedicalAnalysis } = require('../../models/laboratories/medicalAnalysis')
const { Laboratory } = require('../../models/laboratories/laboratory')
const { File, validateFile } = require('../../models/laboratories/analysFile');
const { User } = require('../../models/users/user')
const fs = require('fs');
const path = require('path');


// async function createMedicalAnalys(req, res) {
//     try {
//         // Validate the request body using Joi
//         const { error } = validateMedicalAnalysis(req.body);
//         if (error) {
//             return res.status(400).json({ message: error.details[0].message });
//         }

//         // Get the laboratory ID from the authenticated user's token
//         const laboratoryId = req.laboratory._id;

//         // Find the laboratory by ID
//         const laboratory = await Laboratory.findById(laboratoryId);

//         if (!laboratory) {
//             return res.status(404).json({ message: 'Laboratory not found' });
//         }

//         // Create a new medical analysis based on the request body
//         const medicalAnalysis = new MedicalAnalysis({
//             laboratory: laboratory._id,
//             name: req.body.name,
//             price: req.body.price,
//             requiresFasting: req.body.requiresFasting,
//         });

//         // Save the medical analysis to the database
//         await medicalAnalysis.save();

//         res.status(201).json({ message: 'Medical analysis created successfully' });
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ message: 'Internal server error' });
//     }
// }

// async function getAllMedicalAnalysis(req, res) {
//     try {
//         // Get the laboratory ID from the request parameters
//         const labId = req.laboratory._id;

//         // Find the laboratory by ID
//         const laboratory = await Laboratory.findById(labId);

//         if (!laboratory) {
//             return res.status(404).json({ message: 'Laboratory not found' });
//         }

//         // Get all medical analyses associated with the laboratory
//         const medicalAnalyses = await MedicalAnalysis.find({ laboratory: labId });

//         // if (!medicalAnalyses || medicalAnalyses.length === 0) {
//         //     return res.status(404).json({ message: 'No medical analyses found' });
//         // }

//         return res.status(200).json(medicalAnalyses);
//     } catch (error) {
//         return res.status(500).json({ message: 'Internal server error' });
//     }
// }

// async function deleteMedicalAnalys(req, res) {
//     try {
//         // Get the laboratory ID and medical analysis ID from the request parameters
//         const { analysisId } = req.params;

//         // Verify that the authenticated user's laboratory matches the requested laboratory ID
//         const labId = req.laboratory._id;
//         // Check if the medical analysis exists and belongs to the specified laboratory
//         const medicalAnalysis = await MedicalAnalysis.findOne({
//             _id: analysisId,
//             laboratory: labId,
//         });

//         if (!medicalAnalysis) {
//             return res.status(404).json({ message: 'Medical analysis not found' });
//         }

//         // Delete the medical analysis using findByIdAndRemove
//         await MedicalAnalysis.findByIdAndRemove(analysisId);
//         // console.log('lskks')
//         // // Delete the medical analysis
//         // await medicalAnalysis.remove();
//         console.log('lskks')
//         res.status(200).json({ message: 'Medical analysis deleted successfully' });
//     } catch (error) {
//         res.status(500).json({ message: 'Internal server error' });
//     }
// }

// async function searchForMedicalAnalys(req, res) {
//     try {

//         const { state, municipality, name } = req.query;


//         if (!state && !municipality) {
//             const medicalAnalyses = await MedicalAnalysis.find({
//                 name: { $regex: name, $options: 'i' }
//             }).populate({
//                 path: 'laboratory',
//                 select: 'name location isConfirmed',
//                 match: { isConfirmed: true }
//             })
//                 .select('-_id laboratory requiresFasting price ')
//                 .exec();
//             ;
//             if (!medicalAnalyses || medicalAnalyses.length === 0) {
//                 return res.status(404).json({ message: 'No medical analyses found' });
//             }
//             const filteredMedicalAnalyses = medicalAnalyses.filter((analysis) => {
//                 return analysis?.laboratory?.isConfirmed === true;
//             });
//             return res.status(200).json(filteredMedicalAnalyses);
//         } else if (state && municipality) {
//             const medicalAnalyses = await MedicalAnalysis.find({
//                 name: { $regex: name, $options: 'i' }
//             }).populate({
//                 path: 'laboratory',
//                 select: 'name location isConfirmed',
//                 match: { isConfirmed: true, state: state, municipality: municipality }
//             })
//                 .select('-_id laboratory requiresFasting price ')
//                 .exec();
//             ;
//             if (!medicalAnalyses || medicalAnalyses.length === 0) {
//                 return res.status(404).json({ message: 'No medical analyses found' });
//             }
//             const filteredMedicalAnalyses = medicalAnalyses.filter((analysis) => {
//                 return analysis?.laboratory?.isConfirmed === true;
//             });
//             return res.status(200).json(filteredMedicalAnalyses);
//         } else if (state) {
//             const medicalAnalyses = await MedicalAnalysis.find({
//                 name: { $regex: name, $options: 'i' }
//             }).populate({
//                 path: 'laboratory',
//                 select: 'name location isConfirmed',
//                 match: { isConfirmed: true, state: state }
//             })
//                 .select('-_id laboratory requiresFasting price ')
//                 .exec();
//             ;
//             if (!medicalAnalyses || medicalAnalyses.length === 0) {
//                 return res.status(404).json({ message: 'No medical analyses found' });
//             }
//             const filteredMedicalAnalyses = medicalAnalyses.filter((analysis) => {
//                 return analysis?.laboratory?.isConfirmed === true;
//             });
//             return res.status(200).json(filteredMedicalAnalyses);
//         } else if (municipality) {
//             const medicalAnalyses = await MedicalAnalysis.find({
//                 name: { $regex: name, $options: 'i' }
//             }).populate({
//                 path: 'laboratory',
//                 select: 'name location isConfirmed',
//                 match: { isConfirmed: true, municipality: municipality }
//             })
//                 .select('-_id laboratory requiresFasting price ')
//                 .exec();
//             ;
//             if (!medicalAnalyses || medicalAnalyses.length === 0) {
//                 return res.status(404).json({ message: 'No medical analyses found' });
//             }
//             const filteredMedicalAnalyses = medicalAnalyses.filter((analysis) => {
//                 return analysis?.laboratory?.isConfirmed === true;
//             });
//             return res.status(200).json(filteredMedicalAnalyses);
//         }
//     } catch (error) {
//         return res.status(500).json({ message: 'Internal server error' });
//     }
// }

// async function searchForNameMedicalAnalys(req, res) {
//     try {
//         // Validate the search query parameter using Joi
//         const { name } = req.params;

//         // Search for documents that match the query


//         const results = await MedicalAnalysis.find({
//             name: { $regex: name, $options: 'i' }
//         }).select('-_id -laboratory -requiresFasting -price')
//             .populate({
//                 path: 'laboratory',
//                 select: 'name location',
//                 match: { isConfirmed: true }
//             })


//         return res.send({ data: results });
//     } catch (err) {
//         console.error(err);
//         return res.status(500).json({ message: 'Internal server error.' });
//     }
// }







async function addMedicalAnalysByAdmin(req, res) {
    try {
        const { name } = req.body;

        // Check if the medical analysis with the given name already exists
        const existingAnalysis = await MedicalAnalysis.findOne({ name });
        if (existingAnalysis) {
            return res.status(409).json({ message: 'Medical analysis with this name already exists.' });
        }

        // Create a new medical analysis
        const newAnalysis = await MedicalAnalysis.create({ name });

        return res.status(201).json(newAnalysis);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error.' });
    }
}

async function addMedicalAnalysByLaboratory(req, res) {
    try {
        const { analysisId } = req.params;

        const laboratoryId = req.laboratory._id;
        // Check if the laboratory has already chosen this medical analysis
        const laboratory = await Laboratory.findById(laboratoryId);
        // Check if the laboratory exists
        if (!laboratory) {
            return res.status(404).json({ message: 'Laboratory not found.' });
        }

        // Check if chosenMedicalAnalyses is defined
        if (!laboratory.chosenMedicalAnalyses) {
            laboratory.chosenMedicalAnalyses = [];
        }

        // Check if the laboratory has already chosen this medical analysis
        if (laboratory.chosenMedicalAnalyses.some(analysis => analysis && analysis.medicalAnalysis && analysis.medicalAnalysis.equals(analysisId))) {
            return res.status(409).json({ message: 'Laboratory has already chosen this medical analysis.' });
        }

        // Add the chosen medical analysis to the laboratory's array
        laboratory.chosenMedicalAnalyses.push({ medicalAnalysis: analysisId });
        await laboratory.save();

        // Add the laboratory's ID to the medical analysis's array
        const medicalAnalysis = await MedicalAnalysis.findById(analysisId);
        medicalAnalysis.laboratoriesHave.push(laboratoryId);
        await medicalAnalysis.save();

        return res.status(200).json({ message: 'Medical analysis chosen successfully.' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error.' });
    }
}


async function searchForAnalysName(req, res) {
    try {
        const { name } = req.body;

        if (!name || name.length > 100) {
            return res.status(400).json({
                status: false,
                code: 400,
                message: 'Name is required and should not exceed 100 characters.',
                data: []
            });
        }

        const regex = new RegExp(`^${name.slice(0, 2)}`, 'i'); // Case-insensitive search for the first two letters
        const data = await MedicalAnalysis.find({ name: { $regex: regex } }).select('name');

        if (!data || data.length === 0) {
            return res.status(200).json({
                status: true,
                code: 200,
                message: 'No matching medical analysis found for the given name.',
                data: []
            });
        }

        return res.status(200).json({
            status: true,
            code: 200,
            message: 'Medical analysis search successful.',
            data: data
        });
    } catch (error) {
        return res.status(500).json({
            status: false,
            code: 500,
            message: 'Internal server error.',
            data: []
        });
    }
}

async function searchForFiveMedicalAnalysisNames(req, res) {
    try {
        const { ids, state, municipality } = req.body;
        const language = req.headers['language'];
        // Validate input
        if (!ids || ids.length > 5 || ids.length === 0) {
            return res.status(400).json({
                status: false,
                code: 400,
                message: 'Exactly 5 medical analysis or lower than 5 are required.',
                data: []
            });
        }
        // Build the query for ID search
        const idQuery = { _id: { $in: ids } };

        // If state and municipality are provided, add them to the query
        if (state || municipality) {
            const labQuery = {};

            if (state) {
                labQuery['state.mattricule'] = state;
            }

            if (municipality) {
                labQuery['municipality.code'] = municipality;
            }

            // Find laboratories based on state and municipality
            const laboratories = await Laboratory.find(labQuery).select('_id');
            const labIds = laboratories.map(lab => lab._id);

            // Add the laboratories to the ID query
            idQuery['laboratoriesHave'] = { $in: labIds };
        }

        // Search for documents that match the query
        const results = await MedicalAnalysis.find(idQuery)
            .select('_id name laboratoriesHave')
            .populate({
                path: 'laboratoriesHave',
                select: 'labNameArabic labNameEnglish ',
            });


        // Organize results by laboratory
        const labResults = {};



        results.forEach(result => {
            result.laboratoriesHave.forEach(lab => {
                const labId = lab._id.toString();
                let labName;
                switch (language) {
                    case 'ar':
                        labName = lab.labNameArabic;
                        break;
                    case 'fr':
                        labName = lab.labNameEnglish;
                        break;
                    case 'en':
                    default:
                        labName = lab.labNameEnglish;
                        break;
                }

                const medicalName = result.name.trim();

                if (!labResults[labId]) {
                    labResults[labId] = {
                        labName,
                        medicalNamesHave: [],
                        medicalIdsHave: [],
                        all: false,
                    };
                }

                if (!labResults[labId].medicalNamesHave.some(medical => medical.name === medicalName)) {
                    labResults[labId].medicalNamesHave.push({
                        _id: result._id,
                        name: medicalName
                    });
                    labResults[labId].medicalIdsHave.push(result._id);
                }
                // if (!labResults[labId].medicalNamesHave.includes(medicalName)) {
                //     labResults[labId].medicalNamesHave.push(medicalName);
                //     labResults[labId].medicalIdsHave.push(result._id);
                // }
            });
        });


        // Check if a lab has all names from the request body
        Object.keys(labResults).forEach(labId => {
            const labData = labResults[labId];
            const medicalAnalysisIds = labData.medicalIdsHave.map(id => id.toString());
            labData.all = ids.every(id => medicalAnalysisIds.includes(id.trim()));

        });
        const formattedResults = Object.keys(labResults).map(labId => ({
            _id: labId,
            labName: labResults[labId].labName,
            medicalNamesHave: labResults[labId].medicalNamesHave,
            medicalNamesDontHave: labResults[labId].medicalNamesDontHave,
            all: labResults[labId].all,
        }));

        return res.json({
            status: true,
            code: 200,
            message: 'Medical analysis search successful.',
            data: formattedResults,
        });
    } catch (err) {
        return res.status(500).json({
            status: false,
            code: 500,
            message: 'Internal server error.',
            data: []
        });
    }
}



async function uploadAnalysFile(req, res) {
    try {

        const { error } = validateFile(req.body);
        if (error) {
            return res.status(400).json({ message: error.details[0].message });
        }


        const labId = req.laboratory._id;
        const userId = req.body.userId

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }


        const laboratory = await Laboratory.findById(labId).select('-_id');

        if (!laboratory) {
            return res.status(404).json({ message: 'Laboratory not found.' });
        }



        // Save the file information
        const file = new File({
            userId: userId,
            laboratoryId: labId,
            userInfo: {
                first_name: user.first_name,
                last_name: user.last_name,
                // phone: patientInfo.phone,
                age: user.age,
                gender: user.gender
            },
            file: {
                originalName: req.file.originalname,
                path: req.file.path,
            },
        });
        await file.save();

        return res.status(201).json({ file });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error.' });
    }
}

async function getAnalysisFilesForUser(req, res) {
    const userId = req.user._id; // Assuming user ID is available in the request
    // const userId = '65d86ab99706b6855a9cc9fe'; // Assuming user ID is available in the request

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;

    try {
        const files = await File.find({ userId })
            .populate('laboratoryId', 'name ') // Populate laboratory name
            .select('file.originalName laboratoryId time ')
            .limit(limit)
            .skip((page - 1) * limit);

        return res.status(200).json({
            status: true,
            data: files,
            code: 200,
            message: 'User files retrieved successfully.',
        });
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({
            status: false,
            code: 500,
            message: 'Internal server error.',
        });
    }
    // try {
    //     const { page = 1 } = req.query;
    //     const perPage = 3;

    //     const userId = req.user._id;
    //     const user = await User.findById(userId);

    //     if (!user) {
    //         return res.status(404).json({ message: 'User not found' });
    //     }

    //     const analysisFiles = await AnalysisFile.find({ userId })
    //         .sort({ createdAt: -1 }) // Sort by newest first
    //         .skip((page - 1) * perPage)
    //         .limit(perPage)
    //         .populate({
    //             path: 'laboratoryId',
    //             select: 'nameArabic nameFrance', // Add other fields as needed
    //         });

    //     // Map analysisFiles to include the full path of each file
    //     const analysisFilesWithFullPath = analysisFiles.map(file => ({
    //         ...file.toObject(),
    //         file: {
    //             ...file.file.toObject(),
    //             fullPath: path.resolve(file.file.path),
    //         },
    //     }));

    //     return res.status(200).json({ analysisFiles: analysisFilesWithFullPath });
    // } catch (error) {
    //     console.error(error);
    //     return res.status(500).json({ message: 'Internal server error.' });
    // }
}

async function downloadAnalysFile(req, res) {
    const { fileId } = req.params; // Assuming file ID is available in the request
    console.log(fileId)
    File.findById(fileId)
        .populate('laboratoryId', 'name')
        .then(file => {
            if (!file) {
                return res.status(404).json({
                    status: false,
                    code: 404,
                    message: 'File not found.',
                });
            }
            console.log(file.file.path,'sdsds')

            // const filePath = path.join(__dirname, 'AnalysFiles', 'pdf', file.file.path);
            const filePath = file.file.path
            console.log(filePath)
            fs.exists(filePath, exists => {
                if (!exists) {
                    return res.status(404).json({
                        status: false,
                        code: 404,
                        message: 'File not found on the server.',
                    });
                }

                // Stream the file for download
                res.setHeader('Content-disposition', `attachment; filename=${file.file.originalName}`);
                res.setHeader('Content-type', 'application/pdf');
                const fileStream = fs.createReadStream(filePath);
                fileStream.pipe(res);
            });
        })
        .catch(error => {
            console.error('Error:', error);
            return res.status(500).json({
                status: false,
                code: 500,
                message: 'Internal server error.',
            });
        });
}

async function getMyChosenAnalysisForLaboratory(req, res) {
    try {

        const labId = req.laboratory._id;
        const laboratory = await Laboratory.findById(labId).populate('chosenMedicalAnalyses.medicalAnalysis', 'name');

        if (!laboratory) {
            return res.status(404).json({ message: 'Laboratory not found.' });
        }

        const data = laboratory.chosenMedicalAnalyses.map(item => ({
            id: item.medicalAnalysis._id,
            name: item.medicalAnalysis.name,
        }));

        return res.status(200).json({ data });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error.' });
    }
}
async function deleteMyChosenMedicalAnalysForLaboratory(req, res) {
    try {

        const { medicalAnalysisId } = req.params;
        const labId = req.laboratory._id;

        const laboratory = await Laboratory.findById(labId);

        if (!laboratory) {
            return res.status(404).json({ message: 'Laboratory not found.' });
        }

        const index = laboratory.chosenMedicalAnalyses.findIndex(item => item.medicalAnalysis.equals(medicalAnalysisId));

        if (index === -1) {
            return res.status(404).json({ message: 'Chosen Medical Analysis not found in the laboratory.' });
        }

        const medicalAnalysis = await MedicalAnalysis.findById(medicalAnalysisId);

        if (!medicalAnalysis) {
            return res.status(404).json({ message: 'Medical Analysis not found.' });
        }

        // Remove the laboratory from the laboratoriesHave array in MedicalAnalysis
        medicalAnalysis.laboratoriesHave = medicalAnalysis.laboratoriesHave.filter(lab => !lab.equals(labId));
        await medicalAnalysis.save();

        // Remove the chosen medical analysis from the laboratory
        laboratory.chosenMedicalAnalyses.splice(index, 1);
        await laboratory.save();

        return res.status(200).json({ message: 'Chosen Medical Analysis deleted successfully.' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error.' });
    }
}


module.exports = {
    // createMedicalAnalys,
    // getAllMedicalAnalysis,
    // deleteMedicalAnalys,
    // searchForMedicalAnalys,
    // searchForNameMedicalAnalys,
    downloadAnalysFile,
    searchForFiveMedicalAnalysisNames,
    searchForAnalysName,
    addMedicalAnalysByAdmin,
    addMedicalAnalysByLaboratory,
    uploadAnalysFile,
    getAnalysisFilesForUser,
    getMyChosenAnalysisForLaboratory,
    deleteMyChosenMedicalAnalysForLaboratory
}