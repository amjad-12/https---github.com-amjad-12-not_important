const express = require('express');
const router = express.Router();
const { Doctor } = require('../../models/doctors/doctor');
const { Assistant } = require('../../models/doctors/assistantDoctor');
const { User } = require('../../models/users/user')
// const authenticate = require('../middleware/authenticate'); // Create this middleware
const Joi = require('joi');
// const { use } = require('../../routes/doctors/doctors');

// Get available booking numbers for a doctor
// router.get('/available-booking-numbers/:doctorId', authenticate, async (req, res) => {
async function getAvilableNumbers(req, res) {
    try {


        if (!req.body.doctorId) return res.status(400).json({
            error: 'doctor id is required'
        });


        const doctor = await Doctor.findById(req.body.doctorId);
        // const doctor = await Doctor.findById(req.params.doctorId);

        if (!doctor) {
            return res.status(404).json({ message: 'Doctor not found' });
        }

        const bookedNumbers = doctor.bookedPatients.map(booking => booking.bookedNumber);
        const availableNumbers = [];

        for (let i = 1; i <= doctor.maxPatients; i++) {
            if (!bookedNumbers.includes(i)) {
                availableNumbers.push(i);
            }
        }

        return res.json({ availableNumbers });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

async function bookExamination(req, res) {
    try {
        const { bookedNumber, doctorId } = req.body;
        // Use the current date as the default booking date
        const bookingDate = new Date().toISOString().split('T')[0];

        if (!doctorId) {
            return res.status(404).json({ message: 'Doctor id is required' });
        }

        if (!bookedNumber) {
            return res.status(404).json({ message: 'Booked number is required' });
        }

        const doctor = await Doctor.findById(doctorId);
        
        if (!doctor) {
            return res.status(404).json({ message: 'Doctor not found' });
        }
        
        const userId = req.user._id
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if the patient has already booked with the same doctor on the same date
        const existingBookingForUser = user.bookedNumbers.find(
            (booking) =>
                booking.doctorId.equals(doctorId) &&
                booking.bookingDate.toDateString() === new Date(bookingDate).toDateString()
        );

        if (existingBookingForUser) {
            return res.status(400).json({ message: 'You have already booked with the same doctor on the same date' });
        }

        // Check if the booking date is the same for the patient's previous bookings with any doctor
        const existingPatientBooking = user.bookedNumbers.find(
            (booking) => booking.bookingDate.toDateString() === new Date(bookingDate).toDateString()
        );

        if (existingPatientBooking) {
            return res.status(400).json({ message: 'You have already booked with another doctor on the same date' });
        }

        const now = new Date();
        const bookingStartTime = new Date();
        bookingStartTime.setHours(
            parseInt(doctor.bookingStartTime.split(':')[0]),
            parseInt(doctor.bookingStartTime.split(':')[1])
        );
        const bookingEndTime = new Date();
        bookingEndTime.setHours(
            parseInt(doctor.bookingEndTime.split(':')[0]),
            parseInt(doctor.bookingEndTime.split(':')[1])
        );

        // // Check if booking is allowed within the specified times
        if (now < bookingStartTime || now >= bookingEndTime) {
            return res.status(400).json({ message: 'Booking is not allowed at this time' });
        }

        const existingBooking = doctor.bookedPatients.find(booking => booking.bookedNumber === bookedNumber);

        if (existingBooking) {
            return res.status(400).json({ message: 'Number already booked' });
        }

        if (bookedNumber < 1 || bookedNumber > doctor.maxPatients) {
            return res.status(400).json({ message: 'Invalid booked number' });
        }


        const userExists = await User.findById(userId);
        if (!userExists) {
            return res.status(404).json({ message: 'User not found' });
        }

        // لازم رجعهااااااااااااااااااااااا
        // const existingBookingForUser = doctor.bookedPatients.find(booking => booking.user && booking.user.equals(userId));
        // if (existingBookingForUser) {
        //     return res.status(400).json({ message: 'You have already booked a number' });
        // }

        doctor.bookedPatients.push({
            bookedNumber,
            user: userId,
            doctor: [],
            assistant: [],
            isDone: false, // Initial status
        });
        await doctor.save();

        // Continue with the booking process
        user.bookedNumbers.push({
            doctorId,
            bookedNumber,
            bookingDate: new Date(bookingDate),
        });
        await user.save();


        return res.status(201).json({ message: 'Booking successful' });
    } catch (error) {
        return res.status(400).json({ message: error.message });
    }
}

// Book an examination
// async function bookExamination(req, res) {
//     try {
//         const { doctorId, bookedNumber, userId } = req.body;

//         if (!doctorId) {
//             return res.status(400).json({ message: "doctorId is required" })
//         }

//         if (!bookedNumber) {
//             return res.status(400).json({ message: "bookedNumber is required" })
//         }

//         if (!userId) {
//             return res.status(400).json({ message: "userId is required" })
//         }

//         // const existingBookingForUser = await Doctor.findOne({
//         //     _id: doctorId,
//         //     'bookedPatients.user': patientId,
//         // });

//         // if (existingBookingForUser) {
//         //     return res.status(400).json({ message: 'You have already booked a number' });
//         // }


//         const doctor = await Doctor.findById(doctorId);

//         const existingBookingForUser = doctor.bookedPatients.find(booking => booking.user.equals(userId));
//         if (existingBookingForUser) {
//             return res.status(400).json({ message: 'You have already booked a number' });
//         }


//         if (!doctor) {
//             return res.status(404).json({ message: 'Doctor not found' });
//         }

//         if (bookedNumber < 1 || bookedNumber > doctor.maxPatients) {
//             return res.status(400).json({ message: 'Invalid booked number' });
//         }

//         const existingBooking = doctor.bookedPatients.find(booking => booking.bookedNumber === bookedNumber);

//         if (existingBooking) {
//             return res.status(400).json({ message: 'Number already booked' });
//         }

//         const user = userId;

//         doctor.bookedPatients.push({

//             bookedNumber,
//             user
//         });

//         await doctor.save();

//         res.status(201).json({ message: 'Booking successful' });
//     } catch (error) {
//         res.status(400).json({ message: error.message });
//     }
// };

async function bookExaminationByDoctor(req, res) {
    try {
        const { bookedNumber } = req.body;

        if (!bookedNumber) {
            return res.status(400).json({ message: 'booked number is required' });
        }

        const doctorId = req.doctor._id;
        const doctor = await Doctor.findById(doctorId);

        if (!doctor) {
            return res.status(404).json({ message: 'Doctor not found' });
        }

        const now = new Date();
        const bookingStartTime = new Date();
        bookingStartTime.setHours(
            parseInt(doctor.bookingStartTime.split(':')[0]),
            parseInt(doctor.bookingStartTime.split(':')[1])
        );
        const bookingEndTime = new Date();
        bookingEndTime.setHours(
            parseInt(doctor.bookingEndTime.split(':')[0]),
            parseInt(doctor.bookingEndTime.split(':')[1])
        );
        console.log(bookingStartTime, bookingEndTime)
        console.log(now)

        // // Check if booking is allowed within the specified times
        if (now < bookingStartTime || now >= bookingEndTime) {
            return res.status(400).json({ message: 'Booking is not allowed at this time' });
        }

        const existingBooking = doctor.bookedPatients.find(booking => booking.bookedNumber === bookedNumber);

        if (existingBooking) {
            return res.status(400).json({ message: 'Number already booked' });
        }

        // if ((!doctorName && !assistantName && !userId) || !bookedNumber) {
        //     return res.status(400).json({ message: "doctorName/assistantName/userId and bookedNumber are required" });
        // }

        if (bookedNumber < 1 || bookedNumber > doctor.maxPatients) {
            return res.status(400).json({ message: 'Invalid booked number' });
        }

        doctor.bookedPatients.push({
            bookedNumber,
            user: null,
            doctor: doctor.name,
            assistant: null,
            isDone: false, // Initial status
        });
        await doctor.save();



        return res.status(201).json({ message: 'Booking successful' });
    } catch (error) {
        return res.status(400).json({ message: error.message });
    }
};


async function bookExaminationByAssitant(req, res) {
    try {
        const { bookedNumber } = req.body;

        if (!bookedNumber) {
            return res.status(400).json({ message: 'booked number is required' });
        }



        const assistantId = req.assistant._id;
        const assistant = await Assistant.findById(assistantId);

        if (!assistant) {
            return res.status(404).json({ message: 'Assistant not found' });
        }

        const doctorId = req.assistant.registeredByDoctor;
        const doctor = await Doctor.findById(doctorId);

        if (!doctor) {
            return res.status(404).json({ message: 'Doctor not found' });
        }

        const now = new Date();
        const bookingStartTime = new Date();
        bookingStartTime.setHours(
            parseInt(doctor.bookingStartTime.split(':')[0]),
            parseInt(doctor.bookingStartTime.split(':')[1])
        );
        const bookingEndTime = new Date();
        bookingEndTime.setHours(
            parseInt(doctor.bookingEndTime.split(':')[0]),
            parseInt(doctor.bookingEndTime.split(':')[1])
        );
        console.log(bookingStartTime, bookingEndTime)
        console.log(now)

        // // Check if booking is allowed within the specified times
        if (now < bookingStartTime || now >= bookingEndTime) {
            return res.status(400).json({ message: 'Booking is not allowed at this time' });
        }

        const existingBooking = doctor.bookedPatients.find(booking => booking.bookedNumber === bookedNumber);

        if (existingBooking) {
            return res.status(400).json({ message: 'Number already booked' });
        }

        // if ((!doctorName && !assistantName && !userId) || !bookedNumber) {
        //     return res.status(400).json({ message: "doctorName/assistantName/userId and bookedNumber are required" });
        // }

        if (bookedNumber < 1 || bookedNumber > doctor.maxPatients) {
            return res.status(400).json({ message: 'Invalid booked number' });
        }

        doctor.bookedPatients.push({
            bookedNumber,
            user: null,
            doctor: null,
            assistant: assistant.name,
            isDone: false, // Initial status
        });
        await doctor.save();



        return res.status(201).json({ message: 'Booking successful' });
    } catch (error) {
        console.log(error)
        return res.status(400).json({ message: error.message });
    }
};


async function markExaminationDone(req, res) {
    try {
        const { doctorId } = req.body;
        const doctor = await Doctor.findById(doctorId);

        if (!doctor) {
            return res.status(404).json({ message: 'Doctor not found' });
        }

        const sortedBookedPatients = doctor.bookedPatients
            .filter(booking => booking.isDone === false)
            .sort((a, b) => a.bookedNumber - b.bookedNumber);

        if (sortedBookedPatients.length === 0) {
            return res.status(400).json({ message: 'No current patients found' });
        }

        const markedPatient = sortedBookedPatients[0]; // Get the patient to mark as done


        // Populate User model to get firstName and phone
        const user = await User.findById('64c7e9c3e161deba42f522fc', 'first_name phone');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        markedPatient.isDone = true;
        await doctor.save();

        res.status(200).json({
            message: 'Patient marked as done',
            markedBookedNumber: markedPatient.bookedNumber,
            user: {
                firstName: user.first_name,
                phone: user.phone,
            },
        });

        return res.status(200).json({ message: 'Patient marked as done' });
    } catch (error) {
        return res.status(400).json({ message: error.message });
    }
}
// async function markExaminationDone(req, res) {
//     try {
//         const { doctorId } = req.body;
//         const doctor = await Doctor.findById(doctorId);

//         if (!doctor) {
//             return res.status(404).json({ message: 'Doctor not found' });
//         }

//         const sortedBookedPatients = doctor.bookedPatients
//             .filter(booking => booking.isDone === false)
//             .sort((a, b) => a.bookedNumber - b.bookedNumber);

//         if (sortedBookedPatients.length === 0) {
//             return res.status(400).json({ message: 'No current patients found' });
//         }

//         const markedPatient = sortedBookedPatients[0]; // Get the patient to mark as done


//         // Populate User model to get firstName and phone
//         const user = await User.findById('64c7e9c3e161deba42f522fc', 'first_name phone');
//         if (!user) {
//             return res.status(404).json({ message: 'User not found' });
//         }

//         markedPatient.isDone = true;
//         await doctor.save();

//         res.status(200).json({
//             message: 'Patient marked as done',
//             markedBookedNumber: markedPatient.bookedNumber,
//             user: {
//                 firstName: user.first_name,
//                 phone: user.phone,
//             },
//         });

//         return res.status(200).json({ message: 'Patient marked as done' });
//     } catch (error) {
//         return res.status(400).json({ message: error.message });
//     }
// }

async function getCurrentExaminationNumber(req, res) {
    try {
        const doctorId = req.doctor._id;
        const doctor = await Doctor.findById(doctorId);

        if (!doctor) {
            return res.status(404).json({ message: 'Doctor not found' });
        }

        const sortedBookedPatients = doctor.bookedPatients
            .filter(booking => booking.isDone === false)
            .sort((a, b) => a.bookedNumber - b.bookedNumber);

        if (sortedBookedPatients.length === 0) {
            return res.status(400).json({ message: 'No current patients found' });
        }

        const currentExaminationNumber = sortedBookedPatients[0].bookedNumber;

        return res.status(200).json({
            currentExaminationNumber
        });
    } catch (error) {
        return res.status(500).json({ message: 'Internal server error' });
    }
}

async function getBookedNumbers(req, res) {
    try {
        const { doctorId } = req.body; // Extracted from the token

        // Find the doctor and populate the bookedPatients field with user information
        const doctor = await Doctor.findById(doctorId)


        if (!doctor) {
            return res.status(404).json({ message: 'Doctor not found' });
        }


        const bookedNumbers = await Promise.all(
            doctor.bookedPatients.map(async (booking) => {
                if (booking.user) {
                    const populatedUser = await User.findById(booking.user, 'first_name phone');
                    return {
                        bookedNumber: booking.bookedNumber,
                        user: populatedUser,
                    };
                } else if (booking.doctor) {
                    return {
                        bookedNumber: booking.bookedNumber,
                        doctor: booking.doctor,
                    };
                } else if (booking.assistant) {
                    return {
                        bookedNumber: booking.bookedNumber,
                        assistant: booking.assistant,
                    };
                }
            })
        );
        bookedNumbers.sort((a, b) => a.bookedNumber - b.bookedNumber);

        return res.status(200).json(bookedNumbers);
    } catch (error) {
        return res.status(500).json({ message: 'Internal server error' });
    }
}

async function incrementTheCurrentNumber(req, res) {
    try {
        const doctorId = req.doctor._id;

        // Find the doctor by ID
        const doctor = await Doctor.findById(doctorId);

        if (!doctor) {
            return res.status(404).json({ message: 'Doctor not found' });
        }

        // Check if currentNumber is within the maxPatients limit
        if (doctor.currentNumber < doctor.maxPatients) {
            // Increment currentNumber
            doctor.currentNumber++;
            await doctor.save();
            return res.status(200).json({ currentNumber: doctor.currentNumber });
        } else {
            return res.status(400).json({ message: 'Maximum patients reached' });
        }
    } catch (error) {
        return res.status(500).json({ message: 'Internal server error' });
    }
};

async function incrementTheCurrentNumberByAssistant(req, res) {
    try {
        const doctorId = req.assistant.registeredByDoctor;

        // Find the doctor by ID
        const doctor = await Doctor.findById(doctorId);

        if (!doctor) {
            return res.status(404).json({ message: 'Doctor not found' });
        }

        // Check if currentNumber is within the maxPatients limit
        if (doctor.currentNumber < doctor.maxPatients) {
            // Increment currentNumber
            doctor.currentNumber++;
            await doctor.save();
            return res.status(200).json({ currentNumber: doctor.currentNumber });
        } else {
            return res.status(400).json({ message: 'Maximum patients reached' });
        }
    } catch (error) {
        return res.status(500).json({ message: 'Internal server error' });
    }
};

async function getCurrentNumber(req, res) {
    try {
        const doctorId = req.doctor._id;

        // Find the doctor by ID
        const doctor = await Doctor.findById(doctorId).populate([
            {
              path: 'specialization',
              select: 'name ourId nameFrance',
            },
            {
              path: 'municipality',
              select: 'name', // Replace with the fields you want to select
            },
            {
              path: 'state',
              select: 'name', // Replace with the fields you want to select
            },
          ]).select('_id specialization state municipality name phone currentNumber bookedPatients')



        if (!doctor) {
            return res.status(404).json({ message: 'Doctor not found' });
        }

        // Find the booked patient object with the currentNumber
        // const bookedPatient = doctor.bookedPatients.find(
        //     (booking) => booking.bookedNumber === doctor.currentNumber
        // );
        const doctorInfo = {
            doctorId: doctor._id,
            name: doctor.name,
            specialization: doctor.specialization.name,
            specializationFrance: doctor.specialization.nameFrance,
            ourIdSpecialization: doctor.specialization.ourId,
            phone: doctor.phone,
            state: doctor.state,
            municipality: doctor.municipality
        };

        const currentNumberBooking = doctor.bookedPatients.find(booking => booking.bookedNumber === doctor.currentNumber);

        if (!currentNumberBooking) {
            return res.status(200).json({ doctorInfo });
        }

        // If the user is not null, retrieve the user separately
        if (currentNumberBooking.user) {
            const user = await User.findById(currentNumberBooking.user).select('phone first_name last_name age gender');
            currentNumberBooking.user = user;
        }


        return res.status(200).json({ doctorInfo, bookedPatient: currentNumberBooking });
    } catch (error) {
        return res.status(500).json({ message: 'Internal server error' });
    }
}

async function getCurentNumberWithoutData(req, res) {
    try {

        const { doctorId } = req.params;

        // Find the doctor by ID
        const doctor = await Doctor.findById(doctorId);

        if (!doctor) {
            return res.status(404).json({ message: 'Doctor not found' });
        }

        // Return the currentNumber without checking bookedPatients
        return res.status(200).json({ currentNumber: doctor.currentNumber });
    } catch (error) {
        return res.status(500).json({ message: 'Internal server error' });
    }
}


async function getCurentAndNuxtNumberWithoutDataForDoctor(req, res) {
    try {

        const doctorId = req.doctor._id;

        // Find the doctor by ID
        const doctor = await Doctor.findById(doctorId);

        if (!doctor) {
            return res.status(404).json({ message: 'Doctor not found' });
        }

        const nextNumber = doctor.currentNumber + 1;

        // Check if the next number exceeds the maxPatients limit
        if (nextNumber > doctor.maxPatients) {
            return res.status(200).json({ currentNumber: doctor.currentNumber, nextNumber: 'No next date' });
        }
        // Return the currentNumber without checking bookedPatients
        return res.status(200).json({ currentNumber: doctor.currentNumber, nextNumber: nextNumber });
    } catch (error) {
        return res.status(500).json({ message: 'Internal server error' });
    }
}

async function getCurentAndNuxtNumberWithoutDataForDoctorByAssistant(req, res) {
    try {

        const doctorId = req.assistant.registeredByDoctor;

        // Find the doctor by ID
        const doctor = await Doctor.findById(doctorId);

        if (!doctor) {
            return res.status(404).json({ message: 'Doctor not found' });
        }

        const nextNumber = doctor.currentNumber + 1;

        // Check if the next number exceeds the maxPatients limit
        if (nextNumber > doctor.maxPatients) {
            return res.status(200).json({ currentNumber: doctor.currentNumber, nextNumber: 'No next date' });
        }
        // Return the currentNumber without checking bookedPatients
        return res.status(200).json({ currentNumber: doctor.currentNumber, nextNumber: nextNumber });
    } catch (error) {
        return res.status(500).json({ message: 'Internal server error' });
    }
}

async function getNextNumberForDoctor(req, res) {
    try {
        const doctorId = req.doctor._id;

        // Find the doctor by ID
        const doctor = await Doctor.findById(doctorId);

        if (!doctor) {
            return res.status(404).json({ message: 'Doctor not found' });
        }

        // Calculate the next number by incrementing the current number
        const nextNumber = doctor.currentNumber + 1;

        // Check if the next number exceeds the maxPatients limit
        if (nextNumber > doctor.maxPatients) {
            return res.status(200).json({ message: 0 });
        }

        return res.status(200).json({ nextNumber });
    } catch (error) {
        return res.status(500).json({ message: 'Internal server error' });
    }
};

async function getNextNumber(req, res) {
    try {
        const { doctorId } = req.params;
        const userId = req.user._id

        // Find the doctor by ID
        const doctor = await Doctor.findById(doctorId).populate({
            path: 'specialization',
            select: 'name',
        });

        if (!doctor) {
            return res.status(404).json({ message: 'Doctor not found' });
        }

        // Check if the user's ID exists in the bookedPatients array
        const isUserInBookedPatients = doctor.bookedPatients.some(
            (booking) => booking.user && booking.user.equals(userId)
        );

        if (!isUserInBookedPatients) {
            return res.status(403).json({ message: 'You dont book examination to see the details' });
        }

        // Calculate the next number by incrementing the current number
        const nextNumber = doctor.currentNumber + 1;

        // Check if the next number exceeds the maxPatients limit
        if (nextNumber > doctor.maxPatients) {
            return res.status(200).json({ message: 'no next dates today' });
        }

        return res.status(200).json({ nextNumber, specialization: doctor.specialization, name: doctor.name, currentNumber: doctor.currentNumber });
    } catch (error) {
        return res.status(500).json({ message: 'Internal server error' });
    }
};

async function getAllTheBookedNumberWithInfo(req, res) {
    try {
        const doctorId = req.doctor._id;

        // Find the doctor by ID
        const doctor = await Doctor.findById(doctorId);

        if (!doctor) {
            return res.status(404).json({ message: 'Doctor not found' });
        }

        // Get all examination numbers
        const examinationNumbers = [];

        for (let i = 1; i <= doctor.maxPatients; i++) {
            const examinationNumber = {
                number: i,
                booked: false,
                patientInfo: null,
            };

            // Check if the number is in the bookedPatients array
            const bookedPatient = doctor.bookedPatients.find(
                (booking) => booking.bookedNumber === i
            );

            if (bookedPatient) {
                examinationNumber.booked = true;

                if (bookedPatient.user) {
                    // If user is not null, retrieve user information
                    const user = await User.findById(
                        bookedPatient.user,
                        'first_name last_name phone age'
                    );
                    examinationNumber.patientInfo = {
                        user: {
                            first_name: user.first_name,
                            last_name: user.last_name,
                            age: user.age,
                            phone: user.phone,
                        },
                    };
                } else if (bookedPatient.doctor) {
                    // If doctor is not null, retrieve doctor information
                    examinationNumber.patientInfo = {
                        doctorName: bookedPatient.doctor,
                    };
                } else if (bookedPatient.assistant) {
                    // If assistant is not null, retrieve assistant information
                    examinationNumber.patientInfo = {
                        assistantName: bookedPatient.assistant,
                    };
                }
            }

            examinationNumbers.push(examinationNumber);
        }

        return res.status(200).json(examinationNumbers);
    } catch (error) {
        return res.status(500).json({ message: 'Internal server error' });
    }
};

async function getAllTheBookedNumberWithInfoToAssistant(req, res) {
    try {
        const doctorId = req.assistant.registeredByDoctor;

        // Find the doctor by ID
        const doctor = await Doctor.findById(doctorId);

        if (!doctor) {
            return res.status(404).json({ message: 'Doctor not found' });
        }

        // Get all examination numbers
        const examinationNumbers = [];

        for (let i = 1; i <= doctor.maxPatients; i++) {
            const examinationNumber = {
                number: i,
                booked: false,
                patientInfo: null,
            };

            // Check if the number is in the bookedPatients array
            const bookedPatient = doctor.bookedPatients.find(
                (booking) => booking.bookedNumber === i
            );

            if (bookedPatient) {
                examinationNumber.booked = true;

                if (bookedPatient.user) {
                    // If user is not null, retrieve user information
                    const user = await User.findById(
                        bookedPatient.user,
                        'first_name last_name phone age'
                    );
                    examinationNumber.patientInfo = {
                        user: {
                            first_name: user.first_name,
                            last_name: user.last_name,
                            age: user.age,
                            phone: user.phone,
                        },
                    };
                } else if (bookedPatient.doctor) {
                    // If doctor is not null, retrieve doctor information
                    examinationNumber.patientInfo = {
                        doctorName: bookedPatient.doctor,
                    };
                } else if (bookedPatient.assistant) {
                    // If assistant is not null, retrieve assistant information
                    examinationNumber.patientInfo = {
                        assistantName: bookedPatient.assistant,
                    };
                }
            }

            examinationNumbers.push(examinationNumber);
        }

        return res.status(200).json(examinationNumbers);
    } catch (error) {
        return res.status(500).json({ message: 'Internal server error' });
    }
};

async function getAllExaminationNumbersWithFlag(req, res) {
    try {
        const { doctorId } = req.params;

        // Find the doctor by ID
        const doctor = await Doctor.findById(doctorId);

        if (!doctor) {
            return res.status(404).json({ message: 'Doctor not found' });
        }

        // Get all examination numbers with booked flag
        const examinationNumbers = [];

        for (let i = 1; i <= doctor.maxPatients; i++) {
            const examinationNumber = {
                number: i,
                booked: false,
            };

            // Check if the number is in the bookedPatients array
            const bookedPatient = doctor.bookedPatients.find(
                (booking) => booking.bookedNumber === i
            );

            if (bookedPatient) {
                examinationNumber.booked = true;
            }

            examinationNumbers.push(examinationNumber);
        }

        return res.status(200).json(examinationNumbers);
    } catch (error) {
        return res.status(500).json({ message: 'Internal server error' });
    }
};

async function clearBookedPatients(req, res) {
    try {
        const doctorId = req.doctor._id;

        // Find the doctor by ID
        const doctor = await Doctor.findById(doctorId);

        if (!doctor) {
            return res.status(404).json({ message: 'Doctor not found' });
        }
        // console.log(doctor.bookedPatients)
        // Clear the bookedPatients array

        doctor.bookedPatients = [];
        doctor.currentNumber = 1
        // doctor.
        // console.log(doctor.bookedPatients)

        // Save the doctor with the cleared bookedPatients array
        await doctor.save();
        // console.log('plsdsk')

        return res.status(200).json({ message: 'Booked patients cleared successfully' });
    } catch (error) {

        return res.status(500).json({ message: 'Internal server error' });
    }
}


async function clearBookedPatientsByAssistant(req, res) {
    try {
        const doctorId = req.assistant.registeredByDoctor;

        // Find the doctor by ID
        const doctor = await Doctor.findById(doctorId);

        if (!doctor) {
            return res.status(404).json({ message: 'Doctor not found' });
        }
        // console.log(doctor.bookedPatients)
        // Clear the bookedPatients array

        doctor.bookedPatients = [];
        doctor.currentNumber = 1
        // doctor.
        // console.log(doctor.bookedPatients)

        // Save the doctor with the cleared bookedPatients array
        await doctor.save();
        // console.log('plsdsk')

        return res.status(200).json({ message: 'Booked patients cleared successfully' });
    } catch (error) {

        return res.status(500).json({ message: 'Internal server error' });
    }
}

async function getAllDatesForPatient(req, res) {
    try {
        const userId = req.user._id;

        const user = await User.findById(userId).populate({
            path: 'bookedNumbers.doctorId',
            select: 'name specialization',
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const bookingDates = user.bookedNumbers.map((booking) => ({
            bookingDate: booking.bookingDate,
            doctor: {
                id: booking.doctorId._id,
                name: booking.doctorId.name,
                specialization: booking.doctorId.specialization,
            },
        }));

        return res.status(200).json({ bookingDates });
    } catch (error) {
        return res.status(500).json({ message: 'Internal server error' });
    }
}


module.exports = {
    clearBookedPatientsByAssistant,
    getAllTheBookedNumberWithInfoToAssistant,
    getAvilableNumbers,
    bookExamination,
    bookExaminationByDoctor,
    getCurrentExaminationNumber,
    markExaminationDone,
    getBookedNumbers,
    bookExaminationByDoctor,
    incrementTheCurrentNumber,
    getCurrentNumber,
    getCurentNumberWithoutData,
    getNextNumber,
    getAllTheBookedNumberWithInfo,
    getAllExaminationNumbersWithFlag,
    clearBookedPatients,
    getCurentAndNuxtNumberWithoutDataForDoctor,
    getNextNumberForDoctor,
    bookExaminationByAssitant,
    getCurentAndNuxtNumberWithoutDataForDoctorByAssistant,
    incrementTheCurrentNumberByAssistant,
    getAllDatesForPatient
};
