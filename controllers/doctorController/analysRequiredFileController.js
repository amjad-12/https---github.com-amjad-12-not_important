const { Doctor } = require('../../models/doctors/doctor')
const { AnalysRequiredFile, AnalysRequiredFileValidate } = require('../../models/doctors/analysRequiredFile');
const { User } = require('../../models/users/user')
const fs = require('fs');
const path = require('path');

async function getAnalysisRequiredFilesDoctorHistory(req, res) {
    const { userId } = req.body;
    const doctorId = req.doctor._id;

    let userExists = true;
    let doctorExists = true;

    const doctor = await Doctor.findById(doctorId);

    // If the doctor is not found, return a 404 Not Found response
    if (!doctor) {
        return res.status(404).json({
            message: 'No doctors found',
            data: [],
            status: true,
            code: 404
        });
    }

    if (userId) {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                message: 'No user found',
                data: [],
                status: true,
                code: 404
            });
        }
    }

    try {

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 5;

        let query = { doctorId };
        if (userId) {
            query.userId = userId;
        }

        const files = await AnalysRequiredFile.find(query)
            .populate({
                path: 'userId',
                select: 'phone first_name last_name',
            })
            .select('file.originalName doctorId time first_name last_name phone age')
            // .limit(limit)
            // .skip((page - 1) * limit);

        return res.status(200).json({
            status: true,
            data: files,
            code: 200,
            message: 'Files retrieved successfully.',
            // userExists,
        });
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({
            status: false,
            code: 500,
            message: 'Internal server error.',
            data: null
        });
    }
}


async function uploadAnalysRequiredFile(req, res) {
    try {
        const { error } = AnalysRequiredFileValidate(req.body);
        if (error) {
            return res.status(400).json({ message: error.details[0].message, status: false, code: 400, data: null });
        }

        const doctorId = req.doctor._id;
        const userId = req.body.userId

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found', status: false, code: 404, data: null });
        }


        const doctor = await Doctor.findById(doctorId).select('-_id');

        if (!doctor) {
            return res.status(404).json({ message: 'Doctor not found.', status: false, code: 404, data: null });
        }



        // Save the file information
        const file = new AnalysRequiredFile({
            userId: userId,
            doctorId: doctorId,
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
        await file.save()
        return res.status(201).json({ message: 'Analys Required File Uploaded Successfully', status: true, code: 201, data: null });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error.', status: false, code: 500, data: null });
    }
}

async function getAnalysRequiredFilesForUser(req, res) {
    const userId = req.user._id; // Assuming user ID is available in the request
    // const userId = '65d86ab99706b6855a9cc9fe'; // Assuming user ID is available in the request

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;

    try {
        const files = await AnalysRequiredFile.find({ userId })
            .populate('doctorId', 'nameEnglish ') // Populate laboratory name
            .select('file.originalName doctorId time ')
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

async function downloadAnalysRequiredFile(req, res) {
    const { fileId } = req.params; // Assuming file ID is available in the request

    AnalysRequiredFile.findById(fileId)
        .populate('doctorId', 'nameEnglish')
        .then(file => {
            if (!file) {
                return res.status(404).json({
                    status: false,
                    code: 404,
                    message: 'File not found.',
                });
            }


            // const filePath = path.join(__dirname, 'AnalysFiles', 'pdf', file.file.path);
            const filePath = file.file.path
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

module.exports = {
    uploadAnalysRequiredFile,
    getAnalysRequiredFilesForUser,
    downloadAnalysRequiredFile,
    getAnalysisRequiredFilesDoctorHistory
}