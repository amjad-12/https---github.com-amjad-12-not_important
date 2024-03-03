const { Specialization } = require('../../models/doctors/specializations')





// the api we use for the specializations
async function getSpecializationSuggestionsWithIcon(req, res) {
    try {
        const { name } = req.params;

        const specializations = await Specialization.find(
            {
                $or: [
                    { nameArabic: { $regex: name, $options: 'i' } },
                    { nameEnglish: { $regex: name, $options: 'i' } },
                    { nameFrench: { $regex: name, $options: 'i' } },
                ],
            },
            '_id nameEnglish nameFrench nameArabic imagePath isFirst'
        ).limit(10);

        if (!specializations || specializations.length === 0) {
            return res.status(404).json({
                message: 'No specializations found',
                data: [],
                status: false,
                code: 404
            });
        }

        const baseUrl = process.env.NODE_ENV === 'production' ? 'https://your-production-url.com' : 'http://localhost:5000/Images/SpecializationsIcons/';

        const specializationsWithFullUrl = specializations.map((specialization) => {
            return {
                _id: specialization._id,
                nameEnglish: specialization.nameEnglish,
                nameFrench: specialization.nameFrench,
                nameArabic: specialization.nameArabic,
                icon: `${baseUrl}${specialization.imagePath}`,
                isFirst: specialization.isFirst
            };
        });

        res.status(200).json({
            message: "Specializations retrieved successfully",
            data: specializationsWithFullUrl,
            status: true,
            code: 200
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Internal server error',
            data: [],
            status: false,
            code: 500
        });
    }
}


async function addSpecializationWithIcon(req, res) {
    try {
        const { nameArabic, nameEnglish, nameFrench } = req.body;

        const existingSpecialization = await Specialization.findOne({
            $or: [
                { nameArabic },
                { nameEnglish },
                { nameFrench },
            ],
        });

        if (existingSpecialization) {
            return res.status(400).json({
                message: 'Specialization names already exist',
                data: [],
                status: false,
                code: 400
            });
        }

        const imagePath = req.file.filename;

        const newSpecialization = new Specialization({
            nameArabic,
            nameEnglish,
            nameFrench,
            imagePath,
        });

        await newSpecialization.save();

        res.status(201).json({
            message: 'Specialization uploaded successfully',
            data: newSpecialization,
            status: true,
            code: 201
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Internal server error',
            data: [],
            status: false,
            code: 500
        });
    }
}


async function getAllSpecializationWithIcon(req, res) {
    try {
        const specializations = await Specialization.find({}, '_id nameArabic nameFrench nameEnglish imagePath isFirst');

        if (!specializations || specializations.length === 0) {
            return res.status(404).json({
                message: 'No specializations found',
                data: [],
                status: false,
                code: 404
            });
        }

        const language = req.headers['language'];

        // Get the base URL for your images
        // const baseUrl = process.env.NODE_ENV === 'production' ? 'https://your-production-url.com' : 'http://localhost:5000/Images/SpecializationsIcons/';
        const baseUrl = 'https://api.medsyncdz.com/Images/SpecializationsIcons/';

        // Update the specializations to return a full URL and the name based on the requested language
        const specializationsWithFullUrl = specializations.map((specialization) => {
            let name;
            switch (language) {
                case 'ar':
                    name = specialization.nameArabic;
                    break;
                case 'fr':
                    name = specialization.nameFrench;
                    break;
                case 'en':
                default:
                    name = specialization.nameEnglish;
                    break;
            }
            return {
                _id: specialization._id,
                name: name,
                imagePath: `${baseUrl}${specialization.imagePath}`,
                isFirst: specialization.isFirst
            };
        });

        res.status(200).json({
            message: "Specializations retrieved successfully",
            data: specializationsWithFullUrl,
            status: true,
            code: 200
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Internal server error',
            data: [],
            status: false,
            code: 500
        });
    }
}

async function getAllSpecializationWithoutIcon(req, res) {
    try {
        const specializations = await Specialization.find({}, '_id nameArabic nameFrench nameEnglish');

        if (!specializations || specializations.length === 0) {
            return res.status(404).json({
                message: 'No specializations found',
                data: [],
                status: false,
                code: 404
            });
        }

        const language = req.headers['language'];

        // Get the base URL for your images

        // Update the specializations to return a full URL and the name based on the requested language
        const specializationsWithFullUrl = specializations.map((specialization) => {
            let name;
            switch (language) {
                case 'ar':
                    name = specialization.nameArabic;
                    break;
                case 'fr':
                    name = specialization.nameFrench;
                    break;
                case 'en':
                default:
                    name = specialization.nameEnglish;
                    break;
            }
            return {
                _id: specialization._id,
                name: name,
            };
        });

        res.status(200).json({
            message: "Specializations retrieved successfully",
            data: specializationsWithFullUrl,
            status: true,
            code: 200
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Internal server error',
            data: [],
            status: false,
            code: 500
        });
    }
}


module.exports = {
    addSpecializationWithIcon,
    getAllSpecializationWithIcon,
    getSpecializationSuggestionsWithIcon,
    getAllSpecializationWithoutIcon
}