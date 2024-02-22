const { Magazine, validateMagazine } = require('../../models/services/magazine')
const { Doctor, validateDoctor } = require('../../models/doctors/doctor')
const Joi = require('joi')


async function addMagazine(req, res) {
    try {

        const doctorId = req.doctor._id;
        if (!doctorId) {
            return res.status(400).json({ message: 'doctorId is required' })
        }

        const doctor = await Doctor.findById(doctorId);
        if (!doctor) {
            return res.status(404).json({ message: 'Doctor not found' });
        }


        const { error } = validateMagazine(req.body);
        if (error) return res.status(400).json({ message: error.details[0].message });

        const { title, description, content } = req.body;
        const magazine = new Magazine({ title, description, content, doctor: doctorId });
        await magazine.save();

        return res.status(201).json({ message: 'Magazine added successfully.' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error.' });
    }
}


const querySchema = Joi.object({
    page: Joi.number().min(1),
    specializationId: Joi.string().regex(/^[0-9a-fA-F]{24}$/), // Assuming MongoDB ObjectId
});

async function getMagazinesPagination(req, res) {
    try {
        // Validate request parameters
        const language = req.headers['language'];
        const { error, value } = querySchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                status: false,
                code: 400,
                message: 'Invalid request parameters.',
                data: null,
            });
        }

        const { page = 1, specializationId } = value;
        const limit = 5;
        const skip = (page - 1) * limit;

        let magazinesQuery = Magazine.find()
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 })
            .populate({
                path: 'doctor',
                select: 'nameArabic nameEnglish specialization',
                populate: {
                    path: 'specialization',
                    select: 'nameArabic nameEnglish nameFrench',
                },
            });

            
        const magazines = await magazinesQuery.exec();

        const magazinesWithFullUrl = magazines.filter((magazine) => {
            // Filter by specialization if specializationId is provided
            return (
              !specializationId ||
              (magazine.doctor.specialization &&
                magazine.doctor.specialization._id.toString() === specializationId)
            );
          }).map((magazine) => {
            const doctor = magazine.doctor;

            // console.log(doctor)
            
            if (!doctor.specialization) {
                // Skip magazine if no matching specialization found
                return null;
            }

            let doctorName;
            switch (language) {
                case 'ar':
                    doctorName = doctor.nameArabic;
                    break;
                case 'fr':
                    doctorName = doctor.nameEnglish;
                    break;
                case 'en':
                default:
                    doctorName = doctor.nameEnglish;
                    break;
            }

            const specialization = doctor.specialization;

            let specializationName;
            switch (language) {
                case 'ar':
                    specializationName = specialization.nameArabic;
                    break;
                case 'fr':
                    specializationName = specialization.nameFrench;
                    break;
                case 'en':
                default:
                    specializationName = specialization.nameEnglish;
                    break;
            }

            return {
                _id: magazine._id,
                title: magazine.title,
                description: magazine.description,
                content: magazine.content,
                createdAt: magazine.createdAt,
                // imagePath: `${baseUrl}${specialization.imagePath}`,
                doctor: {
                    name: doctorName,
                    id: magazine.doctor._id
                },
                specializationName,
            };
        });

        const filteredMagazines = magazinesWithFullUrl.filter(Boolean);

        if (filteredMagazines.length === 0) {
            return res.status(404).json({
                status: false,
                code: 404,
                message: specializationId
                    ? 'No magazines found for the specified specialization.'
                    : 'No magazines found.',
                data: null,
            });
        }

        return res.status(200).json({
            status: true,
            code: 200,
            message: 'Magazines retrieval successful.',
            data: filteredMagazines ,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            status: false,
            code: 500,
            message: 'Internal server error.',
            data: null,
        });
    }
}

// async function getMagazinesPagination(req, res) {
//     try {
//         const page = parseInt(req.query.page) || 1;
//         const limit = 5;

//         const magazines = await Magazine.find()
//             .skip((page - 1) * limit)
//             .limit(limit)
//             .sort({ createdAt: -1 })
//             .populate({
//                 path: 'doctor',
//                 select: '-_id nameArabic nameEnglish specialization', // Include specialization
//                 populate: {
//                     path: 'specialization',
//                     select: 'nameArabic  nameEnglish imagePath', // Include imagePath
//                 },
//             });

//         const baseUrl = process.env.NODE_ENV === 'production' ? 'https://your-production-url.com' : 'http://localhost:5000/Images/SpecializationsIcons/';

//         // Update the imagePath to return a full URL
//         const magazinesWithFullUrl = magazines.map((magazine) => {
//             const doctor = magazine.doctor;

//             return {
//                 _id: magazine._id,
//                 // other magazine properties
//                 doctor: {
//                     _id: doctor._id,
//                     nameArabic: doctor.nameArabic,
//                     nameEnglish: doctor.nameEnglish,
//                     nameFrance: doctor.nameFrance,
//                     specialization: {
//                         _id: doctor.specialization._id,
//                         nameArabic: doctor.specialization.nameArabic,
//                         nameEnglish: doctor.specialization.nameEnglish,
//                         nameFrench: doctor.specialization.nameFrench,
//                         imagePath: `${baseUrl}${doctor.specialization.imagePath}`,
//                     },
//                 },
//             };
//         });

//         return res.status(200).json({ magazines: magazinesWithFullUrl });
//     } catch (error) {
//         console.error(error);
//         return res.status(500).json({ message: 'Internal server error.' });
//     }
// }



module.exports = {
    addMagazine,
    getMagazinesPagination
}