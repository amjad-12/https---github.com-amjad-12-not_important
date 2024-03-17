const { Doctor } = require('../../models/doctors/doctor');
const { Appointment } = require('../../models/doctors/appointment')
const { User } = require('../../models/users/user')
const mongoose = require('mongoose');
const { Specialization } = require('../../models/doctors/specializations');
const Joi = require('joi');
const { getPhoneCodesForWilaya } = require('@dzcode-io/leblad');
const { after } = require('lodash');


// export const sendPushNotification = async (devicePushToken, title, body) => {
//   await firebaseAdmin.messaging().send({
//     token: devicePushToken,
//     notification: {
//       title,
//       body
//     }
//   })
// }

async function editSchedule(req, res) {
  try {

    console.log(req.body)
    const doctorId = req.doctor._id;
    const { updates, bookingStartTime } = req.body;

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found', status: false, data: [], code: 404 });
    }

    // Update the schedule for specific days
    const updatedSchedule = doctor.schedule.map(existingDay => {
      const update = updates.find(update => update.dayOfWeek === existingDay.dayOfWeek);
      return {
        dayOfWeek: existingDay.dayOfWeek,
        maxPatients: update ? (update.maxPatients || 0) : existingDay.maxPatients,
        clinicHours: {
          clinicOpeningTime: update ? (update.clinicOpeningTime || '00:00') : existingDay.clinicHours.clinicOpeningTime,
          clinicClosingTime: update ? (update.clinicClosingTime || '00:00') : existingDay.clinicHours.clinicClosingTime,
        },
      };
    });

    // Add new days to the schedule
    updates.forEach(update => {
      if (!doctor.schedule.some(existingDay => existingDay.dayOfWeek === update.dayOfWeek)) {
        updatedSchedule.push({
          dayOfWeek: update.dayOfWeek,
          maxPatients: update.maxPatients || 0,
          clinicHours: {
            clinicOpeningTime: update.clinicOpeningTime || '00:00',
            clinicClosingTime: update.clinicClosingTime || '00:00',
          },
        });
      }
    });

    const updatedDoctor = await Doctor.findByIdAndUpdate(
      doctorId,
      { schedule: updatedSchedule, bookingStartTime },
      { new: true }
    );

    res.status(200).json({ message: 'Your Schedule updated successfully', status: true, data: [], code: 200 });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}



async function getAvailability(req, res) {
  try {
    const { doctorId } = req.params;
    const doctor = await Doctor.findById(doctorId);

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    const today = new Date();
    const dayOfWeek = today.toLocaleDateString('en-US', { weekday: 'long' });
    const currentDaySchedule = doctor.schedule.find(day => day.dayOfWeek === dayOfWeek);

    if (!currentDaySchedule) {
      return res.json({ doctorId, doctorName: doctor.name, availableSlots: [] });
    }

    // Check if the current time is within the booking time range
    const nowTime = today.toLocaleTimeString('en-US', { hour12: false });
    const { bookingStartTime, bookingEndTime } = currentDaySchedule.clinicHours;

    if (nowTime < bookingStartTime || nowTime > bookingEndTime) {
      return res.json({
        doctorId,
        doctorName: doctor.name,
        message: `You cannot book now. The booking starts at ${bookingStartTime} and ends at ${bookingEndTime}.`
      });
    }

    // Define a date range for the entire day
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    const bookedSlots = await Appointment.find({
      date: { $gte: startOfDay, $lt: endOfDay },
      doctor: doctor._id,
    });

    const availableSlots = Array.from({ length: currentDaySchedule.maxPatients }, (_, index) => index + 1)
      .filter(slot => !bookedSlots.some(appointment => appointment.slot === slot));

    res.json({ doctorId, doctorName: doctor.name, availableSlots });
  } catch (error) {
    console.log('ssj');
    res.status(500).json({ message: error.message });
  }
}

function formatDate(date) {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}


function getNextWorkingDay(currentDate, doctorSchedule) {
  let nextDate = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000); // Next day
  // Adjusting to Algeria timezone

  // Keep incrementing the date until a working day is found
  while (!doctorSchedule.some(day => day.dayOfWeek === getDayName(nextDate))) {
    nextDate = new Date(nextDate.getTime() + 24 * 60 * 60 * 1000);
  }

  // Find the maxPatients for the next working day
  const nextDayInfo = doctorSchedule.find(day => day.dayOfWeek === getDayName(nextDate));

  return nextDayInfo
    ? {
      nextDate,
      maxPatients: nextDayInfo.maxPatients,
      clinicHoursNextDay: nextDayInfo.clinicHours,
      immediately: isNextDayImmediately(currentDate, nextDate),
    }
    : null;
}

// Function to check if the next working day is immediately after the current date
function isNextDayImmediately(currentDate, nextDate) {
  const currentDay = currentDate.getDay();
  const nextDay = nextDate.getDay();

  return (nextDay - currentDay + 7) % 7 === 1;
}

function getDayName(date) {
  return date.toLocaleDateString('en-US', { weekday: 'long' });
}


async function getAvailableSlotsOnDays(req, res) {
  try {
    const { doctorId } = req.params;

    // Find the doctor based on the extracted doctor ID
    const doctor = await Doctor.findById(doctorId);
    // If the doctor is not found, return a 404 Not Found response
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    // Get the current date and time
    const today = new Date();

    // Get the current day name (e.g., 'Monday', 'Tuesday', etc.)
    const currentDayName = today.toLocaleDateString('en-US', { weekday: 'long' });

    // Assuming you have the doctor's schedule
    const doctorSchedule = doctor.schedule;

    // Check if the doctor is open on the current day
    const isDoctorOpen = doctorSchedule.some(day => day.dayOfWeek === currentDayName);
    console.log(isDoctorOpen)


    if (isDoctorOpen) {
      const currentDaySchedule = doctorSchedule.find(day => day.dayOfWeek === currentDayName);

      const currentTime = new Date();

      // Extract hours and minutes from the current time
      const currentHours = currentTime.getHours();
      const currentMinutes = currentTime.getMinutes();

      // Extract hours and minutes from the booking start time
      const [bookingStartHours, bookingStartMinutes] = doctor.bookingStartTime.split(':');

      // Extract hours and minutes from the clinic closing time
      const [clinicClosingHours, clinicClosingMinutes] = currentDaySchedule.clinicHours.clinicClosingTime.split(':');
      const [clinicOpeningHours, clinicOpeningMinutes] = currentDaySchedule.clinicHours.clinicOpeningTime.split(':');

      // Convert all values to minutes for easier comparison
      const currentTimeInMinutes = currentHours * 60 + currentMinutes;
      const bookingStartTimeInMinutes = parseInt(bookingStartHours) * 60 + parseInt(bookingStartMinutes);
      const clinicClosingTimeInMinutes = parseInt(clinicClosingHours) * 60 + parseInt(clinicClosingMinutes);
      const clinicOpeningTimeInMinutes = parseInt(clinicOpeningHours) * 60 + parseInt(clinicOpeningMinutes);

      // check if between startBookingTime and clinicClosingTime
      if (
        currentTimeInMinutes >= bookingStartTimeInMinutes || currentTimeInMinutes < clinicClosingTimeInMinutes
      ) {
        // check if the clinic is open
        if (currentTimeInMinutes >= clinicOpeningTimeInMinutes && currentTimeInMinutes < clinicClosingTimeInMinutes) {
          // Generate available slots
          const startOfDay = new Date(today);
          startOfDay.setHours(0, 0, 0, 0);

          const endOfDay = new Date(today);
          endOfDay.setHours(23, 59, 59, 999);

          const bookedSlots = await Appointment.find({
            doctor: doctor._id,
            appointmentDate: {
              $gte: startOfDay,
              $lt: endOfDay,
            },
          });

          // // Generate available slots
          // const bookedSlots = await Appointment.find({
          //   doctor: doctor._id,
          //   appointmentDate: {
          //     $gte: today.setHours(0, 0, 0, 0), // Start of the day
          //     $lt: today.setHours(23, 59, 59, 999), // End of the day
          //   },
          // });

          const availableSlots = Array.from(
            { length: currentDaySchedule.maxPatients },
            (_, index) => index + 1
          ).filter(slot => !bookedSlots.some(appointment => appointment.slot === slot));

          return res.json({
            doctorId,
            doctorName: doctor.name,
            availableSlots,
          });
        }
      }

    }

  } catch (error) {
    // Return a 500 Internal Server Error response if an unexpected error occurs
    return res.status(500).json({ message: error.message });
  }
}


async function bookAppointmentByUser(req, res) {
  try {

    // Extract user ID from the request parameters
    const { userId } = req.params;
    // Extract doctor ID and appointment slot from the request body
    const { doctorId, slot } = req.body;

    // Find the user based on the extracted user ID
    const user = await User.findById(userId);
    // If the user is not found, return a 404 Not Found response
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Find the doctor based on the extracted doctor ID
    // console.log(doctorId)
    const doctor = await Doctor.findById(doctorId);
    // If the doctor is not found, return a 404 Not Found response
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }





    // Get the current date and time
    const today = new Date();
    const bookingHappened = new Date();


    // Get the current day name (e.g., 'Monday', 'Tuesday', etc.)
    const currentDayName = today.toLocaleDateString('en-US', { weekday: 'long' });

    // Assuming you have the doctor's schedule
    const doctorSchedule = doctor.schedule;

    // Check if the doctor is open on the current day
    const isDoctorOpen = doctorSchedule.some(day => day.dayOfWeek === currentDayName);

    if (isDoctorOpen) {
      const currentDaySchedule = doctorSchedule.find(day => day.dayOfWeek === currentDayName);
      console.log(currentDaySchedule)
      if (slot > currentDaySchedule.maxPatients) {
        return res.status(404).json({ message: "the slot number is more than the allowed slots" })
      }
      const currentTime = new Date();

      // Extract hours and minutes from the current time
      const currentHours = currentTime.getHours();
      const currentMinutes = currentTime.getMinutes();

      // Extract hours and minutes from the booking start time
      const [bookingStartHours, bookingStartMinutes] = doctor.bookingStartTime.split(':');

      // Extract hours and minutes from the clinic closing time
      const [clinicClosingHours, clinicClosingMinutes] = currentDaySchedule.clinicHours.clinicClosingTime.split(':');
      const [clinicOpeningHours, clinicOpeningMinutes] = currentDaySchedule.clinicHours.clinicOpeningTime.split(':');

      // Convert all values to minutes for easier comparison
      const currentTimeInMinutes = currentHours * 60 + currentMinutes;
      const bookingStartTimeInMinutes = parseInt(bookingStartHours) * 60 + parseInt(bookingStartMinutes);
      const clinicClosingTimeInMinutes = parseInt(clinicClosingHours) * 60 + parseInt(clinicClosingMinutes);
      const clinicOpeningTimeInMinutes = parseInt(clinicOpeningHours) * 60 + parseInt(clinicOpeningMinutes);


      if (
        currentTimeInMinutes >= bookingStartTimeInMinutes || currentTimeInMinutes < clinicClosingTimeInMinutes
      ) {
        if (currentTimeInMinutes >= clinicOpeningTimeInMinutes && currentTimeInMinutes < clinicClosingTimeInMinutes) {

          // // Find an existing appointment for the specified doctor, slot, and within the current date
          const existingAppointment = await Appointment.findOne({
            doctor: doctorId,
            slot,
            appointmentDate: {
              $gte: today.toLocaleString().split('T')[0], // Only consider the date part of the ISO string
              $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000).toLocaleString().split('T')[0], // Only consider the date part of the ISO string
            },
          });
          // // Check if an existing appointment is found
          if (existingAppointment) {
            //   // Check if the existing appointment is not approved
            if (!existingAppointment.approved) {
              //     // Check if the waiting time has exceeded the booking timeout
              if (bookingHappened.getMinutes() - existingAppointment.dateBookingHappened.getMinutes() > existingAppointment.bookingTimeout) {
                //       // Update the existing appointment details
                existingAppointment.patient = userId;
                existingAppointment.approved = true;
                existingAppointment.dateBookingHappened = bookingHappened;

                // Save the updated appointment
                await existingAppointment.save();

                //       // Return a 201 Created response with the updated appointment details
                return res.status(201).json(existingAppointment);
              } else {
                //       // Return a 400 Bad Request response if the slot is waiting for approval
                return res.status(400).json({ message: 'The slot is waiting for approval' });
              }
            } else {
              //     // Return a 400 Bad Request response if the slot is already booked and approved
              return res.status(400).json({ message: 'The ssssslot is booked' });
            }
          } else {
            //   // Create a new appointment if no existing appointment is found
            const appointment = new Appointment({
              patient: userId,
              doctor: doctorId,
              slot,
              appointmentDate: bookingHappened,
              approved: true,
              dateBookingHappened: bookingHappened,
            });

            //   // Save the new appointment
            await appointment.save();

            //   // Return a 201 Created response with a success message
            return res.status(201).json({ message: 'Appointment is created successfully' });
          }


        } else {
          // Calculate the next date
          const { nextDate, maxPatients } = getNextWorkingDay(today, doctorSchedule);
          if (nextDate) {
            if (slot > maxPatients) {
              return res.status(404).json({ message: "the slot number is more than the allowed slots" })
            }
            // // Find an existing appointment for the specified doctor, slot, and within the current date
            const existingAppointment = await Appointment.findOne({
              doctor: doctorId,
              slot,
              appointmentDate: {
                $gte: nextDate.toLocaleString().split('T')[0], // Only consider the date part of the ISO string
                $lt: new Date(nextDate.getTime() + 24 * 60 * 60 * 1000).toLocaleString().split('T')[0], // Only consider the date part of the ISO string
              },
            });
            // // Check if an existing appointment is found
            if (existingAppointment) {
              //   // Check if the existing appointment is not approved
              if (!existingAppointment.approved) {
                //     // Check if the waiting time has exceeded the booking timeout
                if (bookingHappened.getMinutes() - existingAppointment.dateBookingHappened.getMinutes() > existingAppointment.bookingTimeout) {
                  //       // Update the existing appointment details
                  existingAppointment.patient = userId;
                  existingAppointment.approved = true;
                  existingAppointment.dateBookingHappened = bookingHappened;

                  // Save the updated appointment
                  await existingAppointment.save();

                  //       // Return a 201 Created response with the updated appointment details
                  return res.status(201).json(existingAppointment);
                } else {
                  //       // Return a 400 Bad Request response if the slot is waiting for approval
                  return res.status(400).json({ message: 'The slot is waiting for approval' });
                }
              } else {
                //     // Return a 400 Bad Request response if the slot is already booked and approved
                return res.status(400).json({ message: 'The slotttt is booked' });
              }
            } else {
              //   // Create a new appointment if no existing appointment is found
              const appointment = new Appointment({
                patient: userId,
                doctor: doctorId,
                slot,
                appointmentDate: nextDate,
                approved: true,
                dateBookingHappened: bookingHappened,
              });

              //   // Save the new appointment
              await appointment.save();

              //   // Return a 201 Created response with a success message
              return res.status(201).json({ message: 'Appointment is created successfully' });
            }

            // return res.status(200).json({
            //   message: `You are making a booking on ${formatDate(nextDate)}`
            // });
          } else {
            return res.status(400).json({
              message: `The doctor not work tomorow`
            });
          }


        }

      } else {
        // The current time is outside the booking hours
        return res.status(400).json({
          message: `You cannot book now. Book between ${doctor.bookingStartTime} and ${currentDaySchedule.clinicHours.clinicClosingTime}`
        });
      }
    } else {
      const { nextDate, maxPatients } = getNextWorkingDay(today, doctorSchedule);
      if (nextDate) {
        if (slot > maxPatients) {
          return res.status(404).json({ message: "the slot number is more than the allowed slots" })
        }
        // // Find an existing appointment for the specified doctor, slot, and within the current date
        const existingAppointment = await Appointment.findOne({
          doctor: doctorId,
          slot,
          appointmentDate: {
            $gte: nextDate.toLocaleString().split('T')[0], // Only consider the date part of the ISO string
            $lt: new Date(nextDate.getTime() + 24 * 60 * 60 * 1000).toLocaleString().split('T')[0], // Only consider the date part of the ISO string
          },
        });
        // // Check if an existing appointment is found
        if (existingAppointment) {
          //   // Check if the existing appointment is not approved
          if (!existingAppointment.approved) {
            //     // Check if the waiting time has exceeded the booking timeout
            if (bookingHappened.getMinutes() - existingAppointment.dateBookingHappened.getMinutes() > existingAppointment.bookingTimeout) {
              //       // Update the existing appointment details
              existingAppointment.patient = userId;
              existingAppointment.approved = true;
              existingAppointment.dateBookingHappened = bookingHappened;

              // Save the updated appointment
              await existingAppointment.save();

              //       // Return a 201 Created response with the updated appointment details
              return res.status(201).json(existingAppointment);
            } else {
              //       // Return a 400 Bad Request response if the slot is waiting for approval
              return res.status(400).json({ message: 'The slot is waiting for approval' });
            }
          } else {
            //     // Return a 400 Bad Request response if the slot is already booked and approved
            return res.status(400).json({ message: 'The slllllot is booked' });
          }
        } else {
          //   // Create a new appointment if no existing appointment is found
          const appointment = new Appointment({
            patient: userId,
            doctor: doctorId,
            slot,
            appointmentDate: nextDate,
            approved: true,
            dateBookingHappened: bookingHappened,
          });

          //   // Save the new appointment
          await appointment.save();

          //   // Return a 201 Created response with a success message
          return res.status(201).json({ message: 'Appointment is created successfully' });
        }
      } else {
        return res.status(400).json({
          message: `The doctor not work tomorow`
        });
      }
    }
  } catch (error) {
    // Return a 500 Internal Server Error response if an unexpected error occurs
    return res.status(500).json({ message: error.message });
  }
}



async function makeAppointmentAndByDoctorForUser(req, res) {
  try {
    const { doctorId } = req.params;
    const { userId, slot, appointmentDate } = req.body;

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const existingAppointment = await Appointment.findOne({
      doctor: doctorId,
      slot,
    });

    const now = new Date();
    const selectedDate = new Date(appointmentDate);

    // Check if the appointment is within the allowed timeframe for user booking
    if (!existingAppointment || (existingAppointment.approved && now.getMinutes() > 5)) {
      // Create or update the appointment with default approval as false
      const appointment = await Appointment.findOneAndUpdate(
        { doctor: doctorId, slot, approved: false },
        {
          patient: userId,
          doctor: doctorId,
          slot,
          date: selectedDate, // Store the full date and time
          approved: false,
        },
        { upsert: true, new: true }
      );

      // Update user's bookedNumbers
      const userAppointment = user.bookedNumbers.find(
        (booking) => (
          booking.doctorId.toString() === doctorId.toString() &&
          booking.bookedNumber === slot &&
          booking.bookingDate.toString() === selectedDate.toString()
        )
      );

      if (!userAppointment) {
        user.bookedNumbers.push({
          doctorId,
          bookedNumber: slot,
          bookingDate: selectedDate,
        });
        await user.save();
      }

      res.status(201).json(appointment);
    } else {
      // Appointment is not approved, or it's within the restricted timeframe
      return res.status(400).json({ message: 'The slot is not available' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}



// async function bookAppointmentForPatient(req, res) {
//   try {
//     const { doctorId } = req.params;
//     const { patientName, slot } = req.body;

//     const doctor = await Doctor.findById(doctorId);
//     if (!doctor) {
//       return res.status(404).json({ message: 'Doctor not found' });
//     }

//     // Check if the time slot is within the doctor's schedule limit
//     const today = new Date();
//     const dayOfWeek = today.toLocaleDateString('en-US', { weekday: 'long' });
//     const currentDaySchedule = doctor.schedule.find(day => day.dayOfWeek === dayOfWeek);

//     if (!currentDaySchedule || slot < 1 || slot > currentDaySchedule.maxPatients) {
//       return res.status(400).json({ message: 'Invalid time slot selected' });
//     }

//     // Define a date range for the entire day
//     const startOfDay = new Date(today);
//     startOfDay.setHours(0, 0, 0, 0);

//     const endOfDay = new Date(today);
//     endOfDay.setHours(23, 59, 59, 999);

//     // Check if the time slot is already booked for the same day
//     const existingAppointment = await Appointment.findOne({
//       doctor: doctorId,
//       date: { $gte: startOfDay, $lt: endOfDay },
//       slot,
//     });

//     if (existingAppointment) {
//       return res.status(400).json({ message: 'Time slot is already booked for the same day' });
//     }

//     // Book the appointment
//     const appointment = new Appointment({
//       patientName: `Patient ${patientName}`,
//       doctor: doctorId,
//       slot,
//       date: today,
//     });

//     await appointment.save();

//     res.status(201).json(appointment);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// }


async function getCurrentSlot(req, res) {
  try {
    const { doctorId } = req.params;

    // Find the doctor based on the extracted doctor ID
    const doctor = await Doctor.findById(doctorId);

    // If the doctor is not found, return a 404 Not Found response
    if (!doctor) {
      return res.status(404).json({
        message: 'No doctors found',
        data: [],
        status: false,
        code: 404
      });
    }


    // Get the current date and time
    const today = new Date();
    today.setHours(today.getHours() + 1);

    // Get the current day name (e.g., 'Monday', 'Tuesday', etc.)
    const currentDayName = today.toLocaleDateString('en-US', { weekday: 'long' });
    console.log(today, 'today')
    console.log(getDayName(today), 'dayyyy')
    // Assuming you have the doctor's schedule
    const doctorSchedule = doctor.schedule;
    // Check if the doctor is open on the current day
    const isDoctorOpen = doctorSchedule.some(day => day.dayOfWeek === currentDayName);

    const currentTime = new Date();
    currentTime.setHours(currentTime.getHours() + 1);

    // Extract hours and minutes from the current time
    const currentHours = currentTime.getHours();
    const currentMinutes = currentTime.getMinutes();

    const currentDaySchedule = doctorSchedule.find(day => day.dayOfWeek === currentDayName);


    // Extract hours and minutes from the clinic closing time
    const [startBookingHours, startBookingMinutes] = doctor.bookingStartTime.split(':');
    const currentTimeInMinutes = currentHours * 60 + currentMinutes;
    console.log(currentTimeInMinutes, 'current time in minutes')
    const startBookingTimeInMinutes = parseInt(startBookingHours) * 60 + parseInt(startBookingMinutes);

    if (currentDaySchedule) {
      const [clinicClosingHours, clinicClosingMinutes] = currentDaySchedule.clinicHours.clinicClosingTime.split(':');
      const [clinicOpeningHours, clinicOpeningMinutes] = currentDaySchedule.clinicHours.clinicOpeningTime.split(':');

      // Convert all values to minutes for easier comparison
      const clinicClosingTimeInMinutes = parseInt(clinicClosingHours) * 60 + parseInt(clinicClosingMinutes);
      const clinicOpeningTimeInMinutes = parseInt(clinicOpeningHours) * 60 + parseInt(clinicOpeningMinutes);
      console.log(clinicOpeningTimeInMinutes, 'clinic openeing time in minutes')
      console.log(clinicClosingTimeInMinutes, 'clinic closing time in minutes')
      console.log(startBookingTimeInMinutes - 1440, 'start booking time in minutes')
      if ((currentDaySchedule && currentTimeInMinutes >= clinicOpeningTimeInMinutes && currentTimeInMinutes <= clinicClosingTimeInMinutes && (currentTimeInMinutes >= startBookingTimeInMinutes - 1440)) || (currentDaySchedule && (currentTimeInMinutes <= clinicOpeningTimeInMinutes && (currentTimeInMinutes >= startBookingTimeInMinutes - 1440)))) {


        console.log('pppppppppppppppppppppp')
        const startOfDay = new Date(today);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(today);
        endOfDay.setHours(23, 59, 59, 999);
        console.log(startOfDay)
        console.log(endOfDay)

        const bookedSlots = await Appointment.find({
          doctor: doctor._id,
          appointmentDate: {
            $gte: startOfDay,
            $lt: endOfDay,
          },
        });


        // Sort appointments by slot number
        bookedSlots.sort((a, b) => a.slot - b.slot);


        let lastCompletedSlot = 0;

        // Find the last completed slot
        for (const appointment of bookedSlots) {
          if (appointment.completed) {
            lastCompletedSlot = appointment.slot;
          }
        }

        return res.json({
          message: 'Last completed slot retrieved successfully',
          status: true,
          code: 200,
          data: {
            lastCompletedSlot,
          }
        });
        // } else {
      }
    }

    return res.status(404).json({
      status: false,
      code: 404,
      message: 'No available slots found in the next working days.',
      data: []
    });
  } catch (error) {
    // Return a 500 Internal Server Error response if an unexpected error occurs
    return res.status(500).json({
      status: false,
      code: 500,
      message: 'Internal server error',
      data: []
    });

  }
}

async function getCurrentSlotForDoctor(req, res) {
  try {
    const doctorId = req.doctor._id;

    // Find the doctor based on the extracted doctor ID
    const doctor = await Doctor.findById(doctorId);

    // If the doctor is not found, return a 404 Not Found response
    if (!doctor) {
      return res.status(404).json({
        message: 'No doctors found',
        data: [],
        status: false,
        code: 404
      });
    }

    // Get the current date and time
    const today = new Date();
    today.setHours(today.getHours() + 1);

    // Get the current day name (e.g., 'Monday', 'Tuesday', etc.)
    const currentDayName = today.toLocaleDateString('en-US', { weekday: 'long' });

    // Assuming you have the doctor's schedule
    const doctorSchedule = doctor.schedule;

    // Check if the doctor is open on the current day
    const currentDaySchedule = doctorSchedule.find(day => day.dayOfWeek === currentDayName);

    if (!currentDaySchedule) {
      return res.status(404).json({
        status: false,
        code: 404,
        message: 'No available slots found in the next working days.',
        data: []
      });
    }

    // Get the start and end of the current day
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    // Find booked slots for the current day
    const bookedSlots = await Appointment.find({
      doctor: doctor._id,
      appointmentDate: {
        $gte: startOfDay,
        $lt: endOfDay,
      },
    });

    // Sort appointments by slot number
    bookedSlots.sort((a, b) => a.slot - b.slot);

    let currentSlot = 0;

    // Find the last completed slot
    for (const appointment of bookedSlots) {
      if (appointment.completed) {
        currentSlot = appointment.slot;
      }
    }

    let beforeCurrentSlot = null;
    let afterCurrentSlot = null;

    // Find the appointment slot before and after the last completed slot
    const lastCompletedIndex = bookedSlots.findIndex(appointment => appointment.slot === currentSlot);

    if (lastCompletedIndex > 0) {
      beforeCurrentSlot = bookedSlots[lastCompletedIndex - 1].slot;
    }

    if (lastCompletedIndex < bookedSlots.length - 1) {
      afterCurrentSlot = bookedSlots[lastCompletedIndex + 1].slot;
    }

    return res.json({
      message: 'Last completed slot retrieved successfully',
      status: true,
      code: 200,
      data: {
        beforeCurrentSlot,
        currentSlot,
        afterCurrentSlot
      }
    });

  } catch (error) {
    // Return a 500 Internal Server Error response if an unexpected error occurs
    return res.status(500).json({
      status: false,
      code: 500,
      message: 'Internal server error',
      data: []
    });
  }
}

async function markAfterCompleted(req, res) {
  try {
    const doctorId = req.doctor._id;
    const doctor = await Doctor.findById(doctorId);
    // If the doctor is not found, return a 404 Not Found response
    if (!doctor) {
      return res.status(404).json({
        message: 'No doctors found',
        data: [],
        status: false,
        code: 404
      });
    }

    // Get the current date and time
    const today = new Date();
    today.setHours(today.getHours() + 1);

    // Get the current day name (e.g., 'Monday', 'Tuesday', etc.)
    const currentDayName = today.toLocaleDateString('en-US', { weekday: 'long' });

    // Assuming you have the doctor's schedule
    const doctorSchedule = doctor.schedule;

    // Check if the doctor is open on the current day
    const currentDaySchedule = doctorSchedule.find(day => day.dayOfWeek === currentDayName);

    if (!currentDaySchedule) {
      return res.status(404).json({
        status: false,
        code: 404,
        message: 'No available slots found in the next working days.',
        data: []
      });
    }

    // Get the start and end of the current day
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    // Find booked slots for the current day
    const bookedSlots = await Appointment.find({
      doctor: doctor._id,
      appointmentDate: {
        $gte: startOfDay,
        $lt: endOfDay,
      },
    });


    // Sort appointments by slot number
    bookedSlots.sort((a, b) => a.slot - b.slot);
    console.log(bookedSlots, 'fffffffffffff')
    // Find the last completed slot
    // const bookedSlots = await Appointment.findOne({ doctorId, completed: true }).sort({ slot: -1 });

    if (!bookedSlots) {
      return res.status(404).json({ message: 'No appointments found', status: false });
    }

    let currentSlot = 0;

    // Find the last completed slot
    for (const appointment of bookedSlots) {
      if (appointment.completed) {
        currentSlot = appointment.slot;
      }
    }

    let afterCurrentSlot = null
    const lastCompletedIndex = bookedSlots.findIndex(appointment => appointment.slot === currentSlot);
    console.log(lastCompletedIndex)

    if (lastCompletedIndex < bookedSlots.length - 1) {
      afterCurrentSlot = bookedSlots[lastCompletedIndex + 1]._id;
      console.log(afterCurrentSlot)
    } else {
      return res.status(404).json({ message: 'No appointment found after the last completed slot', status: false, data: null, code: 400 });
    }

    // // Find the appointment after the last completed slot
    // const appointmentAfterLastCompleted = await Appointment.findOne({ doctorId, slot: { $gt: bookedSlots.slot } }).sort({ slot: 1 });

    // if (!appointmentAfterLastCompleted) {
    //   return res.status(404).json({ message: 'No appointment found after the last completed slot', status: false });
    // }

    // Update the appointment after the last completed slot to mark it as completed
    await Appointment.findByIdAndUpdate(afterCurrentSlot, { completed: true });

    return res.status(200).json({ message: 'Appointment after the last completed slot marked as completed', status: true });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ message: 'Internal server error', status: false });
  }
}

async function markLastNotCompleted(req, res) {
  try {
    const doctorId = req.doctor._id;
    const doctor = await Doctor.findById(doctorId);
    // If the doctor is not found, return a 404 Not Found response
    if (!doctor) {
      return res.status(404).json({
        message: 'No doctors found',
        data: [],
        status: false,
        code: 404
      });
    }

    // Get the current date and time
    const today = new Date();
    today.setHours(today.getHours() + 1);

    // Get the current day name (e.g., 'Monday', 'Tuesday', etc.)
    const currentDayName = today.toLocaleDateString('en-US', { weekday: 'long' });

    // Assuming you have the doctor's schedule
    const doctorSchedule = doctor.schedule;

    // Check if the doctor is open on the current day
    const currentDaySchedule = doctorSchedule.find(day => day.dayOfWeek === currentDayName);

    if (!currentDaySchedule) {
      return res.status(404).json({
        status: false,
        code: 404,
        message: 'No available slots found in the next working days.',
        data: []
      });
    }

    // Get the start and end of the current day
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    // Find booked slots for the current day
    const bookedSlots = await Appointment.find({
      doctor: doctor._id,
      appointmentDate: {
        $gte: startOfDay,
        $lt: endOfDay,
      },
    });


    // Sort appointments by slot number
    bookedSlots.sort((a, b) => a.slot - b.slot);
    // Find the last completed slot
    // const bookedSlots = await Appointment.findOne({ doctorId, completed: true }).sort({ slot: -1 });

    if (!bookedSlots) {
      return res.status(404).json({ message: 'No appointments found', status: false });
    }

    let currentSlot = 0;

    // Find the last completed slot
    for (const appointment of bookedSlots) {
      if (appointment.completed) {
        currentSlot = appointment.slot;
      }
    }


    let beforeCurrentSlot = null;
    const lastCompletedIndex = bookedSlots.findIndex(appointment => appointment.slot === currentSlot);


    if (lastCompletedIndex >= 0) {
      beforeCurrentSlot = bookedSlots[lastCompletedIndex]._id;
    }
    else {
      return res.status(404).json({ message: 'No appointment found after the last completed slot', status: false, data: null, code: 400 });
    }

    // // Find the appointment after the last completed slot
    // const appointmentAfterLastCompleted = await Appointment.findOne({ doctorId, slot: { $gt: bookedSlots.slot } }).sort({ slot: 1 });

    // if (!appointmentAfterLastCompleted) {
    //   return res.status(404).json({ message: 'No appointment found after the last completed slot', status: false });
    // }

    // Update the appointment after the last completed slot to mark it as completed
    const y = await Appointment.findByIdAndUpdate(beforeCurrentSlot, { completed: false });


    return res.status(200).json({ message: 'Appointment after the last completed slot marked as no completed', status: true, data: null, code: 200 });
  } catch (error) {

    return res.status(500).json({ message: 'Internal server error', status: false });
  }
}

async function getAllAppointmentsForDoctorBYPhoneUser(req, res) {
  try {
    const { phone } = req.params;

    // Check if a user with the provided phone number exists
    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(404).json({ message: 'User not found', status: false,  data: null, code:404  });
    }

    // Find appointments for the user by their full phone number
    const appointments = await Appointment.find({ 'patient.phone': phone }).sort({ appointmentDate: -1 });

    return res.status(200).json({ message: 'Appointments retrieved successfully', status: true, data: appointments, code:200 });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ message: 'Internal server error', status: false });
  }
}

async function getslots(req, res) {
  try {

    const { doctorId } = req.params;

    // Find the doctor based on the extracted doctor ID
    const doctor = await Doctor.findById(doctorId);

    // If the doctor is not found, return a 404 Not Found response
    if (!doctor) {
      return res.status(200).json({
        message: 'No doctors found',
        data: [],
        status: true,
        code: 200
      });
    }


    // Get the current date and time
    const today = new Date();
    today.setHours(today.getHours() + 1);

    // Get the current day name (e.g., 'Monday', 'Tuesday', etc.)
    const currentDayName = today.toLocaleDateString('en-US', { weekday: 'long' });
    console.log(today, 'today')
    console.log(getDayName(today), 'dayyyy')
    // Assuming you have the doctor's schedule
    const doctorSchedule = doctor.schedule;
    // Check if the doctor is open on the current day
    const isDoctorOpen = doctorSchedule.some(day => day.dayOfWeek === currentDayName);

    const currentTime = new Date();
    currentTime.setHours(currentTime.getHours() + 1);

    // Extract hours and minutes from the current time
    const currentHours = currentTime.getHours();
    const currentMinutes = currentTime.getMinutes();

    const currentDaySchedule = doctorSchedule.find(day => day.dayOfWeek === currentDayName);


    // Extract hours and minutes from the clinic closing time
    const [startBookingHours, startBookingMinutes] = doctor.bookingStartTime.split(':');
    const currentTimeInMinutes = currentHours * 60 + currentMinutes;
    console.log(currentTimeInMinutes, 'current time in minutes')
    const startBookingTimeInMinutes = parseInt(startBookingHours) * 60 + parseInt(startBookingMinutes);

    if (currentDaySchedule) {
      const [clinicClosingHours, clinicClosingMinutes] = currentDaySchedule.clinicHours.clinicClosingTime.split(':');
      const [clinicOpeningHours, clinicOpeningMinutes] = currentDaySchedule.clinicHours.clinicOpeningTime.split(':');

      // Convert all values to minutes for easier comparison
      const clinicClosingTimeInMinutes = parseInt(clinicClosingHours) * 60 + parseInt(clinicClosingMinutes);
      const clinicOpeningTimeInMinutes = parseInt(clinicOpeningHours) * 60 + parseInt(clinicOpeningMinutes);
      // console.log(clinicOpeningTimeInMinutes, 'clinic openeing time in minutes')
      // console.log(clinicClosingTimeInMinutes, 'clinic closing time in minutes')
      // console.log(startBookingTimeInMinutes - 1440, 'start booking time in minutes')
      if ((currentDaySchedule && currentTimeInMinutes >= clinicOpeningTimeInMinutes && currentTimeInMinutes <= clinicClosingTimeInMinutes && (currentTimeInMinutes >= startBookingTimeInMinutes - 1440)) || (currentDaySchedule && (currentTimeInMinutes <= clinicOpeningTimeInMinutes && (currentTimeInMinutes >= startBookingTimeInMinutes - 1440)))) {



        const startOfDay = new Date(today);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(today);
        endOfDay.setHours(23, 59, 59, 999);

        const bookedSlots = await Appointment.find({
          doctor: doctor._id,
          appointmentDate: {
            $gte: startOfDay,
            $lt: endOfDay,
          },
        });

        // Extract only the slot numbers for approved appointments
        const approvedAppointmentsSlots = bookedSlots
          .filter(appointment => appointment.approved)
          .map(appointment => appointment.slot);

        // Extract only the slot numbers for pending appointments
        const pendingAppointments = bookedSlots
          .filter(appointment => !appointment.approved)
          .map(appointment => appointment.slot);

        // Generate available slots
        const availableSlots = Array.from(
          { length: currentDaySchedule.maxPatients },
          (_, index) => index + 1
        ).filter(slot => !bookedSlots.some(appointment => appointment.slot === slot));

        // Filter unavailable slots to include only the ones where the appointments are approved
        const unavailableSlots = approvedAppointmentsSlots;


        if (doctorSchedule.length > 1) {
          const nextAvailableDayInfo = getNextWorkingDay(today, doctorSchedule);
          if (nextAvailableDayInfo) {
            const { nextDate } = nextAvailableDayInfo;

            // Find booked slots for the next day
            const nextDayStart = new Date(nextDate);
            nextDayStart.setHours(0, 0, 0, 0);

            const nextDayEnd = new Date(nextDate);

            nextDayEnd.setHours(23, 59, 59, 999);
            console.log(nextDayEnd, 'endd')
            const previousDate = new Date(nextDayStart.getTime() - 24 * 60 * 60 * 1000);




            // // Generate available slots for the next day
            // const availableSlotsNextDay = Array.from(
            //   { length: maxPatients },
            //   (_, index) => index + 1
            // ).filter(slot => !bookedSlotsNextDay.some(appointment => appointment.slot === slot));

            return res.json({
              message: 'dates retrived successfull for today and the next date',
              status: true,
              code: 200,

              data: {
                nextDate: {
                  message: `the booking for ${formatDate(nextDate)} start in ${doctor.bookingStartTime} ${formatDate(previousDate)}`,
                  date: formatDate(nextDate),
                  availableSlots: [],
                  unavailableSlots: [],
                  pendingAppointments: [],
                  maxPatients: 0
                },
                // nextDate: { availableSlotsNextDay, date: nextDate.toISOString().split('T')[0] },
                today: {
                  message: null,
                  availableSlots,
                  unavailableSlots,
                  pendingAppointments,
                  maxPatients: currentDaySchedule.maxPatients,
                  date: today.toLocaleDateString()
                }
              }
              // Only consider the date part of the ISO string
            });
          }
        }

        return res.json({
          message: 'dates retrived successfull for today',
          status: true,
          code: 200,
          data: {
            nextDate: null,
            // nextDate: { availableSlotsNextDay, date: nextDate.toISOString().split('T')[0] },
            today: {
              message: null,
              availableSlots,
              unavailableSlots,
              pendingAppointments,
              maxPatients: currentDaySchedule.maxPatients,
              date: today.toLocaleDateString()
            }
          }
        });
        // } else {
      }
    }
    // console.log(currentDaySchedule && currentTimeInMinutes >= clinicOpeningTimeInMinutes && currentTimeInMinutes <= clinicClosingTimeInMinutes && (currentTimeInMinutes >= startBookingTimeInMinutes - 1440), 'kgjfkgjfkjgkfjgkjfgkjfk')






    // If the current day is not suitable, try to find available slots for the next working day
    const nextAvailableDayInfo = getNextWorkingDay(today, doctorSchedule);
    if (nextAvailableDayInfo) {

      const { nextDate, maxPatients, clinicHoursNextDay, immediately } = nextAvailableDayInfo;
      const [clinicClosingHoursNextDay, clinicClosingMinutesNextDay] = clinicHoursNextDay.clinicClosingTime.split(':');
      const clinicClosingTimeInMinutesNextDay = parseInt(clinicClosingHoursNextDay) * 60 + parseInt(clinicClosingMinutesNextDay);
      if (currentTimeInMinutes >= startBookingTimeInMinutes && currentTimeInMinutes <= clinicClosingTimeInMinutesNextDay + 1440 && immediately) {
        // Find booked slots for the next day
        const nextDayStart = new Date(nextDate);
        nextDayStart.setHours(0, 0, 0, 0);
        const nextDayEnd = new Date(nextDate);
        nextDayEnd.setHours(23, 59, 59, 999);

        const bookedSlotsNextDay = await Appointment.find({
          doctor: doctor._id,
          appointmentDate: {
            $gte: nextDayStart,
            $lt: nextDayEnd,
          },
        });


        // Calculate the date before the next working day
        const previousDate = new Date(nextDayStart.getTime() - 24 * 60 * 60 * 1000);

        // Generate available slots for the next day
        const availableSlotsNextDay = Array.from(
          { length: maxPatients },
          (_, index) => index + 1
        ).filter(slot => !bookedSlotsNextDay.some(appointment => appointment.slot === slot));

        // Extract only the slot numbers for pending appointments
        const pendingAppointmentsNextDay = bookedSlotsNextDay
          .filter(appointment => !appointment.approved)
          .map(appointment => appointment.slot);

        // Extract only the slot numbers for approved appointments
        const approvedAppointmentsNextDaySlots = bookedSlotsNextDay
          .filter(appointment => appointment.approved)
          .map(appointment => appointment.slot);

        // Filter unavailable slots to include only the ones where the appointments are approved
        const unavailableSlotsNextDay = approvedAppointmentsNextDaySlots;


        return res.json({
          // previousDate: previousDate.toLocaleString(),
          // doctorId,
          // doctorName: doctor.name,
          // availableSlots: availableSlotsNextDay,
          // currentDate: nextDate.toLocaleString().split('T')[0], // Only consider the date part of the ISO string          

          message: 'dates retrived successfull for the next date.',
          status: true,
          code: 200,

          data: {
            nextDate: null,
            // nextDate: { availableSlotsNextDay, date: nextDate.toISOString().split('T')[0] },
            today: {
              maxPatients,
              message: null,
              availableSlots: availableSlotsNextDay,
              unavailableSlots: unavailableSlotsNextDay,
              pendingAppointments: pendingAppointmentsNextDay,
              date: nextDate.toLocaleDateString(),
            }
          }
        });
      } else {

        const nextDayStart = new Date(nextDate);
        nextDayStart.setHours(0, 0, 0, 0);
        const nextDayEnd = new Date(nextDate);
        nextDayEnd.setHours(23, 59, 59, 999);
        const previousDate = new Date(nextDayStart.getTime() - 24 * 60 * 60 * 1000);
        return res.json({
          // message: `the booking for ${formatDate(nextDate)} start in ${doctor.bookingStartTime} ${formatDate(previousDate)}`,

          message: 'dates retrived successfull for the next date',
          status: true,
          code: 200,
          data: {
            nextDate: {
              message: `the booking for ${formatDate(nextDate)} start in ${doctor.bookingStartTime} ${formatDate(previousDate)}`,
              date: formatDate(nextDate),
              availableSlots: [],
              unavailableSlots: [],
              pendingAppointments: [],
              maxPatients: 0

            },
            // nextDate: { availableSlotsNextDay, date: nextDate.toISOString().split('T')[0] },
            today: null
          }

          // previousDate: previousDate.toLocaleString(),
          // doctorId,
          // nextDate: nextDate.toLocaleString().split('T')[0], // Only consider the date part of the ISO string
        });

      }
    }

    return res.status(404).json({
      status: false,
      code: 404,
      message: 'No available slots found in the next working days.',
      data: []
    });
  } catch (error) {
    // Return a 500 Internal Server Error response if an unexpected error occurs
    return res.status(500).json({
      status: false,
      code: 500,
      message: 'Internal server error',
      data: []
    });

  }
}

async function getSlotsStatusForDoctorByToday(req, res) {
  try {
    const doctorId = req.doctor._id;
    // Find the doctor based on the extracted doctor ID
    const doctor = await Doctor.findById(doctorId);

    // If the doctor is not found, return a 404 Not Found response
    if (!doctor) {
      return res.status(404).json({
        message: 'No doctors found',
        data: [],
        status: false,
        code: 404
      });
    }


    // Get the current date and time
    const today = new Date();
    today.setHours(today.getHours() + 1);

    // Get the current day name (e.g., 'Monday', 'Tuesday', etc.)
    const currentDayName = today.toLocaleDateString('en-US', { weekday: 'long' });
    console.log(today, 'today')
    // Assuming you have the doctor's schedule
    const doctorSchedule = doctor.schedule;
    // Check if the doctor is open on the current day
    const isDoctorOpen = doctorSchedule.some(day => day.dayOfWeek === currentDayName);

    const currentTime = new Date();
    currentTime.setHours(currentTime.getHours() + 1);

    // Extract hours and minutes from the current time
    const currentHours = currentTime.getHours();
    const currentMinutes = currentTime.getMinutes();

    const currentDaySchedule = doctorSchedule.find(day => day.dayOfWeek === currentDayName);

    // Extract hours and minutes from the clinic closing time
    const [startBookingHours, startBookingMinutes] = doctor.bookingStartTime.split(':');
    const currentTimeInMinutes = currentHours * 60 + currentMinutes;
    const startBookingTimeInMinutes = parseInt(startBookingHours) * 60 + parseInt(startBookingMinutes);

    if (currentDaySchedule) {
      const [clinicClosingHours, clinicClosingMinutes] = currentDaySchedule.clinicHours.clinicClosingTime.split(':');
      const [clinicOpeningHours, clinicOpeningMinutes] = currentDaySchedule.clinicHours.clinicOpeningTime.split(':');

      // Convert all values to minutes for easier comparison
      const clinicClosingTimeInMinutes = parseInt(clinicClosingHours) * 60 + parseInt(clinicClosingMinutes);
      const clinicOpeningTimeInMinutes = parseInt(clinicOpeningHours) * 60 + parseInt(clinicOpeningMinutes);
      console.log('dsdsds')
      if ((currentDaySchedule && currentTimeInMinutes >= clinicOpeningTimeInMinutes && currentTimeInMinutes <= clinicClosingTimeInMinutes && (currentTimeInMinutes >= startBookingTimeInMinutes - 1440)) || (currentDaySchedule && (currentTimeInMinutes <= clinicOpeningTimeInMinutes && (currentTimeInMinutes >= startBookingTimeInMinutes - 1440)))) {


        const startOfDay = new Date(today);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(today);
        endOfDay.setHours(23, 59, 59, 999);

        const bookedSlots = await Appointment.find({
          doctor: doctor._id,
          appointmentDate: {
            $gte: startOfDay,
            $lt: endOfDay,
          },
        }).populate('patient', 'phone');




        // Sort appointments by slot number
        bookedSlots.sort((a, b) => a.slot - b.slot);


        let lastCompletedSlot = 0;

        // Find the last completed slot
        for (const appointment of bookedSlots) {
          if (appointment.completed) {
            lastCompletedSlot = appointment.slot;
          }
        }


        // Prepare all slots with flags
        const allSlotsWithFlag = Array.from(
          { length: currentDaySchedule.maxPatients },
          (_, index) => {
            const slot = index + 1;
            const bookedSlot = bookedSlots.find(appointment => appointment.slot === slot);
            let status = 'available';
            let firstName = '';
            let lastName = '';
            let age = '';
            let phone = '';
            let appointmentDate = ''
            let timeOut = ''
            let id = ''

            if (bookedSlot) {
              if (bookedSlot.approved) {
                status = bookedSlot.completed ? 'completed' : 'booked';
              } else {
                status = 'pending';
              }
              // status = bookedSlot.approved ? 'booked' : 'pending';
              firstName = bookedSlot.patientFirstName;
              lastName = bookedSlot.patientLastName;
              age = bookedSlot.patientAge;
              timeOut = bookedSlot.bookingTimeout;
              id = bookedSlot._id;
              phone = bookedSlot.patient.phone;
              appointmentDate = formatDate(bookedSlot.appointmentDate);
            }

            return { slot, status, firstName, lastName, age, phone, appointmentDate, timeOut, id };
          }
        );

        if (doctorSchedule.length > 1) {
          const nextAvailableDayInfo = getNextWorkingDay(today, doctorSchedule);
          if (nextAvailableDayInfo) {
            const { nextDate } = nextAvailableDayInfo;

            // Find booked slots for the next day
            const nextDayStart = new Date(nextDate);
            console.log(nextDate, 'next datee')
            nextDayStart.setHours(0, 0, 0, 0);
            console.log(nextDayStart)

            const nextDayEnd = new Date(nextDate);

            nextDayEnd.setHours(23, 59, 59, 999);
            console.log(nextDayEnd, 'endd')
            const previousDate = new Date(nextDayStart.getTime() - 24 * 60 * 60 * 1000);




            // // Generate available slots for the next day
            // const availableSlotsNextDay = Array.from(
            //   { length: maxPatients },
            //   (_, index) => index + 1
            // ).filter(slot => !bookedSlotsNextDay.some(appointment => appointment.slot === slot));

            return res.json({
              message: 'dates retrived successfull for today and the next date',
              status: true,
              code: 200,

              data: {
                allSlotsWithFlag,
                lastCompletedSlot,
                maxPatients: currentDaySchedule.maxPatients,
                date: today.toLocaleDateString()
              }
              // Only consider the date part of the ISO string
            });
          }
        }

        return res.json({
          message: 'dates retrived successfull for today',
          status: true,
          code: 200,
          data: {
            allSlotsWithFlag,
            lastCompletedSlot,
            maxPatients: currentDaySchedule.maxPatients,
            date: today.toLocaleDateString()
          }
        });
        // } else {
      }
    }
    // console.log(currentDaySchedule && currentTimeInMinutes >= clinicOpeningTimeInMinutes && currentTimeInMinutes <= clinicClosingTimeInMinutes && (currentTimeInMinutes >= startBookingTimeInMinutes - 1440), 'kgjfkgjfkjgkfjgkjfgkjfk')






    // If the current day is not suitable, try to find available slots for the next working day
    const nextAvailableDayInfo = getNextWorkingDay(today, doctorSchedule);
    if (nextAvailableDayInfo) {
      const { nextDate, maxPatients, clinicHoursNextDay, immediately } = nextAvailableDayInfo;
      const [clinicClosingHoursNextDay, clinicClosingMinutesNextDay] = clinicHoursNextDay.clinicClosingTime.split(':');
      const clinicClosingTimeInMinutesNextDay = parseInt(clinicClosingHoursNextDay) * 60 + parseInt(clinicClosingMinutesNextDay);
      if (currentTimeInMinutes >= startBookingTimeInMinutes && currentTimeInMinutes <= clinicClosingTimeInMinutesNextDay + 1440 && immediately) {
        // Find booked slots for the next day
        const nextDayStart = new Date(nextDate);
        nextDayStart.setHours(0, 0, 0, 0);
        const nextDayEnd = new Date(nextDate);
        nextDayEnd.setHours(23, 59, 59, 999);

        const bookedSlotsNextDay = await Appointment.find({
          doctor: doctor._id,
          appointmentDate: {
            $gte: nextDayStart,
            $lt: nextDayEnd,
          },
        }).populate('patient', 'phone');


        const bookedSlots = await Appointment.find({
          doctor: doctor._id,
          appointmentDate: {
            $gte: nextDayStart,
            $lt: nextDayEnd,
          },
        });


        // Sort appointments by slot number
        bookedSlots.sort((a, b) => a.slot - b.slot);


        let lastCompletedSlot = 0;

        // Find the last completed slot
        for (const appointment of bookedSlots) {
          if (appointment.completed) {
            lastCompletedSlot = appointment.slot;
          }
        }


        // Prepare all slots with flags for the next day
        const allSlotsNextDayWithFlag = Array.from(
          { length: maxPatients },
          (_, index) => {
            const slot = index + 1;
            const bookedSlot = bookedSlotsNextDay.find(appointment => appointment.slot === slot);
            let status = 'available';
            let firstName = '';
            let lastName = '';
            let age = '';
            let phone = '';
            let appointmentDate = ''
            let timeOut = ''
            let id = ''


            if (bookedSlot) {
              if (bookedSlot.approved) {
                status = bookedSlot.completed ? 'completed' : 'booked';
              } else {
                status = 'pending';
              }
              firstName = bookedSlot.patientFirstName;
              lastName = bookedSlot.patientLastName;
              age = bookedSlot.patientAge;
              timeOut = bookedSlot.bookingTimeout;
              phone = bookedSlot.patient.phone;
              id = bookedSlot._id;
              appointmentDate = formatDate(bookedSlot.appointmentDate);
            }

            return { slot, status, firstName, lastName, age, phone, appointmentDate, timeOut, id };
          }
        );
        return res.json({
          // previousDate: previousDate.toLocaleString(),
          // doctorId,
          // doctorName: doctor.name,
          // availableSlots: availableSlotsNextDay,
          // currentDate: nextDate.toLocaleString().split('T')[0], // Only consider the date part of the ISO string          

          message: 'dates retrived successfull for the next date.',
          status: true,
          code: 200,

          data: {
            maxPatients,
            lastCompletedSlot,
            allSlotsWithFlag: allSlotsNextDayWithFlag,
            date: nextDate.toLocaleDateString(),

          }
        });
      } else {

        const nextDayStart = new Date(nextDate);
        nextDayStart.setHours(0, 0, 0, 0);
        const nextDayEnd = new Date(nextDate);
        nextDayEnd.setHours(23, 59, 59, 999);
        const previousDate = new Date(nextDayStart.getTime() - 24 * 60 * 60 * 1000);
        return res.json({
          // message: `the booking for ${formatDate(nextDate)} start in ${doctor.bookingStartTime} ${formatDate(previousDate)}`,

          message: 'dates retrived successfull for the next date',
          status: true,
          code: 200,
          data: {
            message: `the booking for ${formatDate(nextDate)} start in ${doctor.bookingStartTime} ${formatDate(previousDate)}`,
            date: formatDate(nextDate),
            allSlotsWithFlag: [],
            maxPatients: []
          }

          // previousDate: previousDate.toLocaleString(),
          // doctorId,
          // nextDate: nextDate.toLocaleString().split('T')[0], // Only consider the date part of the ISO string
        });

      }
    }

    return res.status(404).json({
      status: false,
      code: 404,
      message: 'No available slots found in the next working days.',
      data: []
    });
  } catch (error) {
    console.log(error)
    // Return a 500 Internal Server Error response if an unexpected error occurs
    return res.status(500).json({
      status: false,
      code: 500,
      message: 'Internal server error',
      data: []
    });

  }
}


async function getslotsFake(req, res) {
  try {
    return res.json({
      dataOne: {
        nextDate: {
          message: `the booking for 31/2/2024 start in 23:55 30/2/2024`,
          date: " 31/2/2024",
          availableSlots: [],
          unavailableSlots: [],
          pendingAppointments: [],
          maxPatients: []
        },
        // nextDate: { availableSlotsNextDay, date: nextDate.toISOString().split('T')[0] },
        today: {
          message: null,
          availableSlots: [
            1,
            2,
            3,
            4,
            7,
            8,
            9,
            10,
            11,
            12,
            13,
            14,
            15
          ],
          unavailableSlots: [5],
          pendingAppointments: [6],
          maxPatients: 15,
          date: '30/01/2024'
        }
      },
      dataTwo: {
        nextDate: [],
        // nextDate: { availableSlotsNextDay, date: nextDate.toISOString().split('T')[0] },
        today: {
          message: null,
          availableSlots: [
            1,
            2,
            3,
            4,
            5,
            6,
            9,
            10,
            11,
            12,
            13,
            14,
            15,
            16,
            17,
            18,
            19,
            20
          ],
          unavailableSlots: [7],
          pendingAppointments: [8],
          maxPatients: 20,
          date: '30/01/2024'
        }
      },
      dataThree: {
        nextDate: [],
        // nextDate: { availableSlotsNextDay, date: nextDate.toISOString().split('T')[0] },
        today: {
          maxPatients: 15,
          message: null,
          availableSlots: [
            1,
            2,
            3,
            4,
            7,
            8,
            9,
            10,
            11,
            12,
            13,
            14,
            15
          ],
          unavailableSlots: [5],
          pendingAppointments: [6],
          date: "31/01/2024",
        }
      },
      dataFour: {
        nextDate: {
          message: `the booking for 31/2/2024 start in 23:55 30/2/2024`,
          date: '31/02/2024',
          availableSlots: [],
          unavailableSlots: [],
          pendingAppointments: [],
          maxPatients: []
        },
        // nextDate: { availableSlotsNextDay, date: nextDate.toISOString().split('T')[0] },
        today: []
      }
    })

  } catch (error) {
    // Return a 500 Internal Server Error response if an unexpected error occurs
    return res.status(500).json({
      status: false,
      code: 500,
      message: 'Internal server error',
      data: []
    });

  }
}

async function makeAppointmentNew(req, res) {
  try {
    // const { doctorId } = req.params;
    const { slot, patientFirstName, patientLastName, doctorId } = req.body;
    const userId = req.user._id

    // Find the doctor based on the extracted doctor ID
    const doctor = await Doctor.findById(doctorId);


    // If the doctor is not found, return a 404 Not Found response
    if (!doctor) {
      return res.status(404).json({
        message: 'No doctors found',
        data: [],
        status: false,
        code: 404
      });
    }

    // Get the current date and time
    const today = new Date();
    today.setHours(today.getHours() + 1);

    // Get the current day name (e.g., 'Monday', 'Tuesday', etc.)
    const currentDayName = today.toLocaleDateString('en-US', { weekday: 'long' });

    // Assuming you have the doctor's schedule
    const doctorSchedule = doctor.schedule;
    // Check if the doctor is open on the current day
    const isDoctorOpen = doctorSchedule.some(day => day.dayOfWeek === currentDayName);

    const currentTime = new Date();
    currentTime.setHours(currentTime.getHours() + 1);

    // Extract hours and minutes from the current time
    const currentHours = currentTime.getHours();
    const currentMinutes = currentTime.getMinutes();

    const currentDaySchedule = doctorSchedule.find(day => day.dayOfWeek === currentDayName);



    // Extract hours and minutes from the clinic closing time
    const [startBookingHours, startBookingMinutes] = doctor.bookingStartTime.split(':');
    const currentTimeInMinutes = currentHours * 60 + currentMinutes;
    const startBookingTimeInMinutes = parseInt(startBookingHours) * 60 + parseInt(startBookingMinutes);

    if (currentDaySchedule) {
      const [clinicClosingHours, clinicClosingMinutes] = currentDaySchedule.clinicHours.clinicClosingTime.split(':');
      const [clinicOpeningHours, clinicOpeningMinutes] = currentDaySchedule.clinicHours.clinicOpeningTime.split(':');

      // Convert all values to minutes for easier comparison
      const clinicClosingTimeInMinutes = parseInt(clinicClosingHours) * 60 + parseInt(clinicClosingMinutes);
      const clinicOpeningTimeInMinutes = parseInt(clinicOpeningHours) * 60 + parseInt(clinicOpeningMinutes);
      if (currentDaySchedule && currentTimeInMinutes >= clinicOpeningTimeInMinutes && currentTimeInMinutes <= clinicClosingTimeInMinutes && (currentTimeInMinutes >= startBookingTimeInMinutes - 1440)) {
        // if (currentDaySchedule && currentTimeInMinutes >= clinicOpeningTimeInMinutes && currentTimeInMinutes <= clinicClosingTimeInMinutes) {
        // Check if between startBookingTime and clinicClosingTime
        // if (currentTimeInMinutes >= clinicOpeningTimeInMinutes && currentTimeInMinutes < clinicClosingTimeInMinutes) {

        // Generate available slots
        const startOfDay = new Date(today);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(today);
        endOfDay.setHours(23, 59, 59, 999);

        const bookingHappened = new Date();
        bookingHappened.setHours(bookingHappened.getHours() + 1);

        try {
          console.log('our bookinggg', today)
          const existingAppointment = await Appointment.findOne({
            doctor: doctorId,
            slot,
            appointmentDate: {
              $gte: startOfDay,
              $lt: endOfDay,
            },
          });





          if (existingAppointment) {
            // Check if the existing appointment is not approved
            if (!existingAppointment.approved) {
              // Check if the waiting time has exceeded the booking timeout
              if (bookingHappened.getMinutes() - existingAppointment.dateBookingHappened.getMinutes() > existingAppointment.bookingTimeout) {
                // Update the existing appointment details
                existingAppointment.patient = userId;
                existingAppointment.approved = true;
                existingAppointment.patientFirstName = patientFirstName;
                existingAppointment.patientLastName = patientLastName;
                existingAppointment.dateBookingHappened = bookingHappened;
                existingAppointment.appointmentDate = bookingHappened

                // Save the updated appointment
                await existingAppointment.save();

                // Return a 201 Created response with the updated appointment details
                return res.status(201).json({
                  status: true,
                  code: 201,
                  message: 'Appointment created successfully.',
                  data: existingAppointment
                });

              } else {
                // Return a 400 Bad Request response if the slot is waiting for approval
                return res.status(400).json({
                  status: false,
                  code: 400,
                  message: 'The slot is waiting for approval',
                  data: []
                });

              }
            } else {
              // Return a 400 Bad Request response if the slot is already booked and approved
              return res.status(400).json({
                status: false,
                code: 400,
                message: 'The slot is booked',
                data: []
              });

            }
          } else {

            // Create a new appointment if no existing appointment is found
            const appointment = new Appointment({
              patient: userId,
              patientLastName,
              patientFirstName,
              doctor: doctorId,
              slot,
              appointmentDate: bookingHappened,
              approved: true,
              dateBookingHappened: bookingHappened,
            });
            console.log(' making new bookinggg', today)

            // Save the new appointment
            await appointment.save();

            // Return a 201 Created response with a success message
            return res.status(201).json({
              status: true,
              code: 201,
              message: 'Appointment is created successfully',
              data: []
            });

          }
        } catch (error) {
          console.log(error)
          // Return a 500 Internal Server Error response
          return res.status(500).json({
            status: false,
            code: 500,
            message: 'Internal Server Error',
            data: []
          });

        }

      }
    }
    // console.log(currentDaySchedule && currentTimeInMinutes >= clinicOpeningTimeInMinutes && currentTimeInMinutes <= clinicClosingTimeInMinutes && (currentTimeInMinutes >= startBookingTimeInMinutes - 1440), 'kgjfkgjfkjgkfjgkjfgkjfk')






    // If the current day is not suitable, try to find available slots for the next working day
    const nextAvailableDayInfo = getNextWorkingDay(today, doctorSchedule);
    if (nextAvailableDayInfo) {
      const bookingHappened = new Date();

      const { nextDate, maxPatients, clinicHoursNextDay, immediately } = nextAvailableDayInfo;
      console.log('booking found', nextDate)
      console.log(nextDate)
      const [clinicClosingHoursNextDay, clinicClosingMinutesNextDay] = clinicHoursNextDay.clinicClosingTime.split(':');
      const clinicClosingTimeInMinutesNextDay = parseInt(clinicClosingHoursNextDay) * 60 + parseInt(clinicClosingMinutesNextDay);
      if (currentTimeInMinutes >= startBookingTimeInMinutes && currentTimeInMinutes <= clinicClosingTimeInMinutesNextDay + 1440 && immediately) {
        // Find booked slots for the next day
        const nextDayStart = new Date(nextDate);
        nextDayStart.setHours(0, 0, 0, 0);
        const nextDayEnd = new Date(nextDate);
        nextDayEnd.setHours(23, 59, 59, 999);

        const bookedSlotsNextDay = await Appointment.find({
          doctor: doctor._id,
          appointmentDate: {
            $gte: nextDayStart,
            $lt: nextDayEnd,
          },
        });

        // Calculate the date before the next working day
        // const previousDate = new Date(nextDayStart.getTime() - 24 * 60 * 60 * 1000);

        // // Generate available slots for the next day
        // const availableSlotsNextDay = Array.from(
        //   { length: maxPatients },
        //   (_, index) => index + 1
        // ).filter(slot => !bookedSlotsNextDay.some(appointment => appointment.slot === slot));
        // console.log(nextDate)

        if (slot > maxPatients) {
          return res.status(404).json({
            status: false,
            code: 404,
            message: 'The slot number is more than the allowed slots',
            data: []
          });

        }
        // // Find an existing appointment for the specified doctor, slot, and within the current date
        const existingAppointment = await Appointment.findOne({
          doctor: doctorId,
          slot,
          appointmentDate: {
            $gte: nextDayStart, // Only consider the date part of the ISO string
            $lt: nextDayEnd, // Only consider the date part of the ISO string
          },
        });
        // // Check if an existing appointment is found
        if (existingAppointment) {
          //   // Check if the existing appointment is not approved
          if (!existingAppointment.approved) {
            //     // Check if the waiting time has exceeded the booking timeout
            if (bookingHappened.getMinutes() - existingAppointment.dateBookingHappened.getMinutes() > existingAppointment.bookingTimeout) {
              //       // Update the existing appointment details
              existingAppointment.patient = userId;
              existingAppointment.approved = true;
              existingAppointment.patientFirstName = patientFirstName;
              existingAppointment.patientLastName = patientLastName;
              existingAppointment.dateBookingHappened = bookingHappened.toLocaleString();

              // Save the updated appointment
              await existingAppointment.save();

              //       // Return a 201 Created response with the updated appointment details
              return res.status(201).json({
                status: true,
                code: 201,
                message: 'Appointment created successfully',
                data: existingAppointment
              });

            } else {
              //       // Return a 400 Bad Request response if the slot is waiting for approval
              return res.status(400).json({
                status: false,
                code: 400,
                message: 'The slot is waiting for approval',
                data: []
              });

            }
          } else {
            //     // Return a 400 Bad Request response if the slot is already booked and approved
            return res.status(400).json({
              status: false,
              code: 400,
              message: 'The slot is booked',
              data: []
            });

          }
        } else {
          //   // Create a new appointment if no existing appointment is found
          const appointment = new Appointment({
            patient: userId,
            patientLastName,
            patientFirstName,
            doctor: doctorId,
            slot,
            appointmentDate: nextDate.toLocaleString(),
            approved: true,
            dateBookingHappened: bookingHappened,
          });

          //   // Save the new appointment
          await appointment.save();

          //   // Return a 201 Created response with a success message
          return res.status(201).json({
            status: true,
            code: 201,
            message: 'Appointment is created successfully',
            data: []
          });

        }

        // return res.json({
        //   // previousDate: previousDate.toLocaleString(),
        //   // doctorId,
        //   // doctorName: doctor.name,
        //   // availableSlots: availableSlotsNextDay,
        //   // currentDate: nextDate.toLocaleString().split('T')[0], // Only consider the date part of the ISO string          

        //   message: 'dates retrived successfull for the next date.',
        //   status: true,
        //   code: 200,

        //   data: {
        //     nextDate: null,
        //     // nextDate: { availableSlotsNextDay, date: nextDate.toISOString().split('T')[0] },
        //     today: {
        //       message: null,
        //       availableSlots: availableSlotsNextDay,
        //       date: nextDate.toLocaleString().split('T')[0],
        //     }
        //   }
        // });
      } else {
        return res.json({
          message: 'you can not booked',
          status: true,
          code: 400,
          data: []
        });

      }
    }

    // If no suitable slots are found, return a message
    return res.json({
      status: false,
      code: 404,
      message: 'No available slots found in the next working days.',
      data: []
    });

  } catch (error) {
    console.log(error)
    // Return a 500 Internal Server Error response if an unexpected error occurs
    return res.status(500).json({
      status: false,
      code: 500,
      message: 'Internal server error',
      data: []
    });

  }
}



async function bookAppointmentByDoctor(req, res) {
  try {
    // Validate request body
    const schema = Joi.object({
      firstName: Joi.string().required(),
      lastName: Joi.string().required(),
      phone: Joi.string().required(),
      slot: Joi.number().required(),
      age: Joi.number().min(0).max(150).required(),
      bookingTimeout: Joi.number().min(5).max(60).default(5),
      date: Joi.string().regex(/^\d{1,2}\/\d{1,2}\/\d{4}$/).required(),
    });


    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { firstName, lastName, phone, slot, age, bookingTimeout, date } = value;
    const doctorId = req.doctor._id;
    console.log(date)

    // Convert date to proper format
    // const appointmentDate = new Date(date.replace(/\//g, '-') + 'T00:00:00Z');
    const [month, day, year] = date.split('/');

    // Construct the proper date format
    const isoDateString = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T00:00:00Z`;

    // Create a Date object
    const appointmentDate = new Date(isoDateString);
    // appointmentDate.setHours(appointmentDate.getHours() + 1);
    // Check if the doctor exists
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found', status: false, code: 404, data: [] });
    }


    // Check if the specified day exists in the doctor's schedule
    const dayName = getDayName(appointmentDate);
    const dayExists = doctor.schedule.some(day => day.dayOfWeek === dayName);
    if (!dayExists) {
      return res.status(400).json({ message: `Doctor's schedule does not include ${dayName}`, status: false, code: 404, data: [] });
    }

    // Find the maximum number of patients allowed for the specified day and slot
    const daySchedule = doctor.schedule.find(day => day.dayOfWeek === dayName);
    if (daySchedule.maxPatients <= 0) {
      return res.status(400).json({ message: 'Maximum patients limit not set for this day', status: false, code: 404, data: [] });
    }

    // Check if the slot exceeds the maximum patients limit for the specified day
    if (slot > daySchedule.maxPatients) {
      return res.status(400).json({ message: 'Slot exceeds maximum patients limit for this day', status: false, code: 404, data: [] });
    }


    const user = await User.find({
      phone: phone
    })

    if (!user || user.length === 0) {
      return res.status(404).json({ message: 'User not found by phone', status: false, code: 404, data: [] });
    }

    const startOfDay = new Date(appointmentDate);
    startOfDay.setHours(0, 0, 0, 0);


    const endOfDay = new Date(appointmentDate);
    endOfDay.setHours(23, 59, 59, 999);


    // Check if the doctor already has an appointment on the given date and slot
    const existingAppointment = await Appointment.findOne({
      doctor: doctorId,
      slot,
      appointmentDate,
    });

    if (existingAppointment) {
      return res.status(400).json({ message: 'Doctor already has an appointment at this slot on the given date', status: false, code: 404, data: [] });
    }

    // Create new appointment
    // console.log(user, 'my useeeeeeeeeeerrrrrrr')
    const appointment = new Appointment({
      patient: user[0]._id,
      doctor: doctorId,
      slot,
      appointmentDate,
      bookingTimeout,
      patientFirstName: firstName,
      patientLastName: lastName,
      patientAge: age,
    });

    await appointment.save();

    return res.status(200).json({ message: 'Appointment booked successfully', status: true, code: 200, data: [] });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error', status: false, code: 500, data: [] });
  }
}



async function previousDatesForDoctor(req, res) {
  try {
    const doctorId = req.doctor._id
    const language = req.headers['language'];


    // Find completed appointments for the specified patient
    const completedAppointments = await Appointment.find({
      doctor: doctorId,
      completed: true,
      cancelled: false,
      approved: true,
    }).select('patientFirstName patientLastName patientAge slot appointmentDate patient')
      .sort({ appointmentDate: -1 })
      .populate({
        path: 'patient',
        model: User,
        select: 'phone',
      });
    // Sort by appointmentDate in descending order




    if (!completedAppointments) {
      return res.status(404).json({ message: 'No completed appointments found for the specified patient', data: [], code: 404, status: true });
    }

    // Map appointments to a more structured response
    const formattedAppointments = completedAppointments.map(appointment => ({
      id: appointment._id,
      slot: appointment.slot,
      appointmentDate: appointment.appointmentDate.toISOString().split('T')[0], // Format to "year-month-day"
      // completed: appointment.completed,
      firstName: appointment.patientFirstName,
      lastName: appointment.patientLastName,
      age: appointment.patientAge,
      phone: appointment.patient.phone
    }));

    // Respond with the formatted appointments
    return res.status(200).json({
      message: 'Completed appointments retrieved successfully',
      data: formattedAppointments,
      status: true,
      code: 200,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: 'Internal server error',
      data: [],
      status: false,
      code: 500,
    });
  }
}

async function pendingDatesForDoctor(req, res) {
  try {
    const doctorId = req.doctor._id

    // Find completed appointments for the specified patient
    const completedAppointments = await Appointment.find({
      doctor: doctorId,
      approved: false,
      cancelled: false,
      completed: false
    }).select('patientFirstName patientLastName patientAge slot appointmentDate patient bookingTimeout')
      .sort({ appointmentDate: -1 })
      .populate({
        path: 'patient',
        model: User,
        select: 'phone',
      });

    if (!completedAppointments) {
      return res.status(404).json({ message: 'No completed appointments found for the specified patient' });
    }

    console.log(completedAppointments)

    // Map appointments to a more structured response
    const formattedAppointments = completedAppointments.map(appointment => ({
      id: appointment._id,
      slot: appointment.slot,
      appointmentDate: appointment.appointmentDate.toISOString().split('T')[0], // Format to "year-month-day"
      firstName: appointment.patientFirstName,
      lastName: appointment.patientLastName,
      age: appointment.patientAge,
      timeOut: appointment.bookingTimeout,
      phone: appointment.patient.phone
    }));
    console.log(formattedAppointments)

    // Respond with the formatted appointments
    return res.status(200).json({
      message: 'Completed appointments retrieved successfully',
      data: formattedAppointments,
      status: true,
      code: 200,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: 'Internal server error',
      data: [],
      status: false,
      code: 500,
    });
  }
}

async function futureDatesForDoctor(req, res) {
  try {
    const doctorId = req.doctor._id

    const today = new Date();
    today.setHours(today.getHours() + 1);
    today.setHours(0, 0, 0, 0);
    const nextDay = new Date(today);
    nextDay.setHours(23, 59, 59, 999);
    nextDay.setDate(nextDay.getDate() + 1);

    // Find completed appointments for the specified patient
    const completedAppointments = await Appointment.find({
      doctor: doctorId,
      approved: true,
      completed: false,
      cancelled: false,
      // appointmentDate: { $gte: today }
    })
      .select('patientFirstName patientLastName patientAge slot appointmentDate patient')
      .sort({ appointmentDate: -1 })
      .populate({
        path: 'patient',
        model: User,
        select: 'phone',
      });


    if (!completedAppointments) {
      return res.status(404).json({ message: 'No completed appointments found for the specified patient' });
    }

    // Map appointments to a more structured response
    const formattedAppointments = completedAppointments.map(appointment => ({
      id: appointment._id,
      slot: appointment.slot,
      appointmentDate: appointment.appointmentDate.toISOString().split('T')[0], // Format to "year-month-day"
      // completed: appointment.completed,
      firstName: appointment.patientFirstName,
      lastName: appointment.patientLastName,
      age: appointment.patientAge,
      phone: appointment.patient.phone
    }));

    // Respond with the formatted appointments
    return res.status(200).json({
      message: 'Completed appointments retrieved successfully',
      data: formattedAppointments,
      status: true,
      code: 200,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: 'Internal server error',
      data: [],
      status: false,
      code: 500,
    });
  }
}

async function currentDatesForDoctor(req, res) {
  try {
    const doctorId = req.doctor._id;

    // Find the doctor based on the extracted doctor ID
    const doctor = await Doctor.findById(doctorId);

    // If the doctor is not found, return a 404 Not Found response
    if (!doctor) {
      return res.status(404).json({
        message: 'No doctors found',
        data: [],
        status: false,
        code: 404
      });
    }

    // Get the current date and time
    const today = new Date();

    // Get the current day name (e.g., 'Monday', 'Tuesday', etc.)
    const currentDayName = today.toLocaleDateString('en-US', { weekday: 'long' });

    // Assuming you have the doctor's schedule
    const doctorSchedule = doctor.schedule;
    // Check if the doctor is open on the current day
    const isDoctorOpen = doctorSchedule.some(day => day.dayOfWeek === currentDayName);

    const currentTime = new Date();

    // Extract hours and minutes from the current time
    const currentHours = currentTime.getHours();
    const currentMinutes = currentTime.getMinutes();

    const currentDaySchedule = doctorSchedule.find(day => day.dayOfWeek === currentDayName);



    // Extract hours and minutes from the clinic closing time
    const [startBookingHours, startBookingMinutes] = doctor.bookingStartTime.split(':');
    const currentTimeInMinutes = currentHours * 60 + currentMinutes;
    const startBookingTimeInMinutes = parseInt(startBookingHours) * 60 + parseInt(startBookingMinutes);

    console.log(currentDaySchedule, currentDayName)
    if (currentDaySchedule) {
      const [clinicClosingHours, clinicClosingMinutes] = currentDaySchedule.clinicHours.clinicClosingTime.split(':');
      const [clinicOpeningHours, clinicOpeningMinutes] = currentDaySchedule.clinicHours.clinicOpeningTime.split(':');

      // Convert all values to minutes for easier comparison
      const clinicClosingTimeInMinutes = parseInt(clinicClosingHours) * 60 + parseInt(clinicClosingMinutes);
      const clinicOpeningTimeInMinutes = parseInt(clinicOpeningHours) * 60 + parseInt(clinicOpeningMinutes);
      if (currentDaySchedule && currentTimeInMinutes >= clinicOpeningTimeInMinutes && currentTimeInMinutes <= clinicClosingTimeInMinutes && (currentTimeInMinutes >= startBookingTimeInMinutes - 1440)) {

        // if (currentDaySchedule && currentTimeInMinutes >= clinicOpeningTimeInMinutes && currentTimeInMinutes <= clinicClosingTimeInMinutes) {
        // Check if between startBookingTime and clinicClosingTime
        // if (currentTimeInMinutes >= clinicOpeningTimeInMinutes && currentTimeInMinutes < clinicClosingTimeInMinutes) {

        // Generate available slots
        const startOfDay = new Date(today);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(today);
        endOfDay.setHours(23, 59, 59, 999);

        const bookedSlots = await Appointment.find({
          doctor: doctor._id,
          appointmentDate: {
            $gte: startOfDay,
            $lt: endOfDay,
          },
        })
          .populate({
            path: 'patient',
            model: User,
            select: 'phone',
          })

        const availableSlots = Array.from(
          { length: currentDaySchedule.maxPatients },
          (_, index) => index + 1
        ).filter(slot => !bookedSlots.some(appointment => appointment.slot === slot))
          .map(slot => ({ slot, status: 'open to book' }));

        const unavailableSlots = Array.from(
          { length: currentDaySchedule.maxPatients },
          (_, index) => index + 1
        ).filter(slot => bookedSlots.some(appointment => appointment.slot === slot))
          .map(slot => ({
            slot,
            status: 'booked',
            patientFirstName: bookedSlots.find(appointment => appointment.slot === slot).patientFirstName,
            patientLastName: bookedSlots.find(appointment => appointment.slot === slot).patientLastName,
            patientAge: bookedSlots.find(appointment => appointment.slot === slot).patientAge,
            phone: bookedSlots.find(appointment => appointment.slot === slot).patient.phone,
          }));

        const pendingAppointments = bookedSlots.filter(appointment => !appointment.approved)
          .map(appointment => ({ slot: appointment.slot, status: 'pending' }));

        const completedAppointments = bookedSlots.filter(appointment => appointment.completed)
          .map(appointment => ({ slot: appointment.slot, status: 'completed' }));
        // const availableSlots = Array.from(
        //   { length: currentDaySchedule.maxPatients },
        //   (_, index) => index + 1
        // ).filter(slot => !bookedSlots.some(appointment => appointment.slot === slot))
        //   .map(slot => ({ slot, status: 'open to book' }));

        // const unavailableSlots = Array.from(
        //   { length: currentDaySchedule.maxPatients },
        //   (_, index) => index + 1
        // ).filter(slot => bookedSlots.some(appointment => appointment.slot === slot))
        //   .map(slot => ({ slot, status: 'booked' }));

        // const pendingAppointments = bookedSlots.filter(appointment => !appointment.approved)
        //   .map(appointment => ({ slot: appointment.slot, status: 'pending' }));

        // Combine and sort all slots based on slot number
        const allSlots = [...availableSlots, ...pendingAppointments, ...unavailableSlots, ...completedAppointments].sort((a, b) => a.slot - b.slot);

        return res.json({
          message: 'Appointments retrieved successfully for today',
          status: true,
          code: 200,
          data: {
            today: {
              message: null,
              appointments: allSlots,
              maxPatients: currentDaySchedule.maxPatients,
              date: today.toLocaleDateString()
            }
          }
        });
      }
    }
    // console.log(currentDaySchedule && currentTimeInMinutes >= clinicOpeningTimeInMinutes && currentTimeInMinutes <= clinicClosingTimeInMinutes && (currentTimeInMinutes >= startBookingTimeInMinutes - 1440), 'kgjfkgjfkjgkfjgkjfgkjfk')

    // If the current day is not suitable, try to find available slots for the next working day
    const nextAvailableDayInfo = getNextWorkingDay(today, doctorSchedule);
    if (nextAvailableDayInfo) {
      const { nextDate, maxPatients, clinicHoursNextDay, immediately } = nextAvailableDayInfo;
      const [clinicClosingHoursNextDay, clinicClosingMinutesNextDay] = clinicHoursNextDay.clinicClosingTime.split(':');
      const clinicClosingTimeInMinutesNextDay = parseInt(clinicClosingHoursNextDay) * 60 + parseInt(clinicClosingMinutesNextDay);
      if (currentTimeInMinutes >= startBookingTimeInMinutes && currentTimeInMinutes <= clinicClosingTimeInMinutesNextDay + 1440 && immediately) {
        // Find booked slots for the next day
        const nextDayStart = new Date(nextDate);
        nextDayStart.setHours(0, 0, 0, 0);
        const nextDayEnd = new Date(nextDate);
        nextDayEnd.setHours(23, 59, 59, 999);

        const bookedSlotsNextDay = await Appointment.find({
          doctor: doctor._id,
          appointmentDate: {
            $gte: nextDayStart,
            $lt: nextDayEnd,
          },
        });

        // Calculate the date before the next working day
        const previousDate = new Date(nextDayStart.getTime() - 24 * 60 * 60 * 1000);

        // Generate available slots for the next day
        const availableSlotsNextDay = Array.from(
          { length: maxPatients },
          (_, index) => index + 1
        ).filter(slot => !bookedSlotsNextDay.some(appointment => appointment.slot === slot));

        const unavailableSlotsNextDay = Array.from(
          { length: nextAvailableDayInfo.maxPatients },
          (_, index) => index + 1
        ).filter(slot => bookedSlotsNextDay.some(appointment => appointment.slot === slot));

        const pendingAppointmentsNextDay = bookedSlotsNextDay.filter(appointment => !appointment.approved);

        return res.json({
          // previousDate: previousDate.toLocaleString(),
          // doctorId,
          // doctorName: doctor.name,
          // availableSlots: availableSlotsNextDay,
          // currentDate: nextDate.toLocaleString().split('T')[0], // Only consider the date part of the ISO string          

          message: 'dates retrived successfull for the next date.',
          status: true,
          code: 200,

          data: {
            nextDate: [],
            // nextDate: { availableSlotsNextDay, date: nextDate.toISOString().split('T')[0] },
            today: {
              maxPatients,
              message: null,
              availableSlots: availableSlotsNextDay,
              unavailableSlots: unavailableSlotsNextDay,
              pendingAppointments: pendingAppointmentsNextDay,
              date: nextDate.toLocaleDateString(),
            }
          }
        });
      } else {

        const nextDayStart = new Date(nextDate);
        nextDayStart.setHours(0, 0, 0, 0);
        const nextDayEnd = new Date(nextDate);
        nextDayEnd.setHours(23, 59, 59, 999);
        const previousDate = new Date(nextDayStart.getTime() - 24 * 60 * 60 * 1000);
        return res.json({
          // message: `the booking for ${formatDate(nextDate)} start in ${doctor.bookingStartTime} ${formatDate(previousDate)}`,

          message: 'dates retrived successfull for the next date',
          status: true,
          code: 200,
          data: {
            nextDate: {
              message: `the booking for ${formatDate(nextDate)} start in ${doctor.bookingStartTime} ${formatDate(previousDate)}`,
              date: formatDate(nextDate),
              availableSlots: [],
              unavailableSlots: [],
              pendingAppointments: [],
              maxPatients: []

            },
            // nextDate: { availableSlotsNextDay, date: nextDate.toISOString().split('T')[0] },
            today: []
          }

          // previousDate: previousDate.toLocaleString(),
          // doctorId,
          // nextDate: nextDate.toLocaleString().split('T')[0], // Only consider the date part of the ISO string
        });

      }
    }

    return res.status(404).json({
      status: false,
      code: 404,
      message: 'No available slots found in the next working days.',
      data: []
    });
  } catch (error) {
    // Return a 500 Internal Server Error response if an unexpected error occurs
    return res.status(500).json({
      status: false,
      code: 500,
      message: 'Internal server error',
      data: []
    });

  }
}

async function cancelAppointmentByDoctor(req, res) {
  try {
    const appointmentId = req.params.appointmentId;
    // Assuming user is authenticated and user information is available in req.user
    const doctorId = req.doctor._id

    // Check if the appointment exists for the user
    const existingAppointment = await Appointment.findOne({
      _id: appointmentId,
      doctor: doctorId,
      completed: false, // Ensure the appointment is not completed
    });

    if (!existingAppointment) {
      return res.status(404).json({ message: 'Appointment not found for the user or already completed' });
    }

    // Update the appointment to mark it as canceled by the user
    existingAppointment.cancelledByDoctor = true;
    existingAppointment.cancelled = true;

    // Save the updated appointment
    await existingAppointment.save();

    return res.status(200).json({
      message: 'Appointment canceled successfully',
      status: true,
      code: 200,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: 'Internal server error',
      status: false,
      code: 500,
    });
  }
}

async function completeFlagAppointmentByDoctor(req, res) {
  try {
    const appointmentId = req.params.appointmentId;
    // Assuming user is authenticated and user information is available in req.user
    const doctorId = req.doctor._id

    // Check if the appointment exists for the user
    const existingAppointment = await Appointment.findOne({
      _id: appointmentId,
      doctor: doctorId,
      completed: false, // Ensure the appointment is not completed
    });

    if (!existingAppointment) {
      return res.status(404).json({
        message: 'Appointment not found for the user or already completed',
        status: false,
        code: 404,
        data: []
      });
    }

    // Update the appointment to mark it as completed 
    existingAppointment.completed = true;

    // Save the updated appointment
    await existingAppointment.save();

    return res.status(200).json({
      message: 'Appointment completed successfully',
      status: true,
      code: 200,
      data: []
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: 'Internal server error',
      status: false,
      code: 500,
    });
  }
}

async function listCancelledDatesByUserForDoctor(req, res) {
  try {
    const doctorId = req.doctor._id
    const language = req.headers['language'];

    // Find completed appointments for the specified patient
    const completedAppointments = await Appointment.find({
      doctor: doctorId,
      completed: false,
      cancelled: true,
      cancelledByUser: true
    })
      .select('patientFirstName patientLastName patientAge slot appointmentDate patient')
      .populate({
        path: 'patient',
        model: User,
        select: 'phone',
      })
      .sort({ appointmentDate: -1 }) // Sort by appointmentDate in descending order
    // .populate({
    //   path: 'doctor',
    //   model: Doctor,
    //   select: `name${language === 'ar' ? 'Arabic' : language === 'fr' ? 'France' : 'English'} specialization`,
    //   populate: {
    //     path: 'specialization',
    //     model: Specialization,
    //     select: `name${language === 'ar' ? 'Arabic' : language === 'fr' ? 'French' : 'English'}`,
    //   },
    // });

    if (!completedAppointments) {
      return res.status(200).json({ message: 'No completed appointments found for the specified patient', data: [], code: 200, status: true });
    }

    // Map appointments to a more structured response
    const formattedAppointments = completedAppointments.map(appointment => ({
      id: appointment._id,
      slot: appointment.slot,
      appointmentDate: appointment.appointmentDate.toISOString().split('T')[0], // Format to "year-month-day"
      completed: appointment.completed,
      firstName: appointment.patientFirstName,
      lastName: appointment.patientLastName,
      age: appointment.patientAge,
      phone: appointment.patient.phone
    }));

    // Respond with the formatted appointments
    return res.status(200).json({
      message: 'Completed appointments retrieved successfully',
      data: formattedAppointments,
      status: true,
      code: 200,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: 'Internal server error',
      data: [],
      status: false,
      code: 500,
    });
  }
}

async function listCancelledDatesByDoctorForDoctor(req, res) {
  try {
    const doctorId = req.doctor._id
    const language = req.headers['language'];

    // Find completed appointments for the specified patient
    const completedAppointments = await Appointment.find({
      doctor: doctorId,
      completed: false,
      cancelled: true,
      cancelledByDoctor: true
    })
      .select('patientFirstName patientLastName patientAge slot appointmentDate patient')
      .populate({
        path: 'patient',
        model: User,
        select: 'phone',
      })
      .sort({ appointmentDate: -1 }) // Sort by appointmentDate in descending order

    if (!completedAppointments) {
      return res.status(200).json({ message: 'No Cancelled appointments found for the specified patient', data: [], code: 200, status: true });
    }

    // Map appointments to a more structured response
    const formattedAppointments = completedAppointments.map(appointment => ({
      id: appointment._id,
      slot: appointment.slot,
      appointmentDate: appointment.appointmentDate.toISOString().split('T')[0], // Format to "year-month-day"
      completed: appointment.completed,
      firstName: appointment.patientFirstName,
      lastName: appointment.patientLastName,
      age: appointment.patientAge,
      phone: appointment.patient.phone
    }));

    // Respond with the formatted appointments
    return res.status(200).json({
      message: 'Completed appointments retrieved successfully',
      data: formattedAppointments,
      status: true,
      code: 200,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: 'Internal server error',
      data: [],
      status: false,
      code: 500,
    });
  }
}

async function listCancelledDatesByUserIncorrectForDoctor(req, res) {
  try {
    const doctorId = req.doctor._id
    const language = req.headers['language'];

    // Find completed appointments for the specified patient
    const completedAppointments = await Appointment.find({
      doctor: doctorId,
      completed: false,
      cancelled: true,
      falseBookByDoctorForUser: true
    })
      .select('patientFirstName patientLastName patientAge slot appointmentDate patient')
      .populate({
        path: 'patient',
        model: User,
        select: 'phone',
      })
      .sort({ appointmentDate: -1 }) // Sort by appointmentDate in descending order

    if (!completedAppointments) {
      return res.status(200).json({ message: 'No cancelled appointments found for the specified patient', data: [], code: 200, status: true });
    }

    // Map appointments to a more structured response
    const formattedAppointments = completedAppointments.map(appointment => ({
      id: appointment._id,
      slot: appointment.slot,
      appointmentDate: appointment.appointmentDate.toISOString().split('T')[0], // Format to "year-month-day"
      completed: appointment.completed,
      firstName: appointment.patientFirstName,
      lastName: appointment.patientLastName,
      age: appointment.patientAge,
      phone: appointment.patient.phone
    }));

    // Respond with the formatted appointments
    return res.status(200).json({
      message: 'Completed appointments retrieved successfully',
      data: formattedAppointments,
      status: true,
      code: 200,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: 'Internal server error',
      data: [],
      status: false,
      code: 500,
    });
  }
}

async function listCancelledDatesByUser(req, res) {
  try {
    const patientId = req.user._id;
    const language = req.headers['language'];

    // Find completed appointments for the specified patient
    const completedAppointments = await Appointment.find({
      patient: patientId,
      completed: false,
      cancelled: true,
      cancelledByUser: true
    })
      .sort({ appointmentDate: -1 }) // Sort by appointmentDate in descending order
      .populate({
        path: 'doctor',
        model: Doctor,
        select: `name${language === 'ar' ? 'Arabic' : language === 'fr' ? 'France' : 'English'} specialization`,
        populate: {
          path: 'specialization',
          model: Specialization,
          select: `name${language === 'ar' ? 'Arabic' : language === 'fr' ? 'French' : 'English'}`,
        },
      });

    if (!completedAppointments) {
      return res.status(200).json({ message: 'No completed appointments found for the specified patient', data: [], code: 200, status: true });
    }

    // Map appointments to a more structured response
    const formattedAppointments = completedAppointments.map(appointment => ({
      id: appointment._id,
      slot: appointment.slot,
      appointmentDate: appointment.appointmentDate.toISOString().split('T')[0], // Format to "year-month-day"
      completed: appointment.completed,
      firstName: appointment.patientFirstName,
      lastName: appointment.patientLastName,
      doctor: {
        id: appointment.doctor._id,
        name: appointment.doctor[`name${language === 'ar' ? 'Arabic' : language === 'fr' ? 'France' : 'English'}`],
        specialization: appointment.doctor.specialization[`name${language === 'ar' ? 'Arabic' : language === 'fr' ? 'French' : 'English'}`],
      },
    }));

    // Respond with the formatted appointments
    return res.status(200).json({
      message: 'Completed appointments retrieved successfully',
      data: formattedAppointments,
      status: true,
      code: 200,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: 'Internal server error',
      data: [],
      status: false,
      code: 500,
    });
  }
}

async function listCancelledDatesByDoctor(req, res) {
  try {
    const patientId = req.user._id;
    const language = req.headers['language'];

    // Find completed appointments for the specified patient
    const completedAppointments = await Appointment.find({
      patient: patientId,
      completed: false,
      cancelled: true,
      cancelledByDoctor: true
    })
      .sort({ appointmentDate: -1 }) // Sort by appointmentDate in descending order
      .populate({
        path: 'doctor',
        model: Doctor,
        select: `name${language === 'ar' ? 'Arabic' : language === 'fr' ? 'France' : 'English'} specialization`,
        populate: {
          path: 'specialization',
          model: Specialization,
          select: `name${language === 'ar' ? 'Arabic' : language === 'fr' ? 'French' : 'English'}`,
        },
      });

    if (!completedAppointments) {
      return res.status(200).json({ message: 'No completed appointments found for the specified patient', data: [], code: 200, status: true });
    }

    // Map appointments to a more structured response
    const formattedAppointments = completedAppointments.map(appointment => ({
      id: appointment._id,
      slot: appointment.slot,
      appointmentDate: appointment.appointmentDate.toISOString().split('T')[0], // Format to "year-month-day"
      completed: appointment.completed,
      firstName: appointment.patientFirstName,
      lastName: appointment.patientLastName,
      doctor: {
        id: appointment.doctor._id,
        name: appointment.doctor[`name${language === 'ar' ? 'Arabic' : language === 'fr' ? 'France' : 'English'}`],
        specialization: appointment.doctor.specialization[`name${language === 'ar' ? 'Arabic' : language === 'fr' ? 'French' : 'English'}`],
      },
    }));

    // Respond with the formatted appointments
    return res.status(200).json({
      message: 'Completed appointments retrieved successfully',
      data: formattedAppointments,
      status: true,
      code: 200,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: 'Internal server error',
      data: [],
      status: false,
      code: 500,
    });
  }
}

async function previousDates(req, res) {
  try {
    const patientId = req.user._id;
    const language = req.headers['language'];

    // Find completed appointments for the specified patient
    const completedAppointments = await Appointment.find({
      patient: patientId,
      completed: true,
      cancelled: false
    })
      .sort({ appointmentDate: -1 }) // Sort by appointmentDate in descending order
      .populate({
        path: 'doctor',
        model: Doctor,
        select: `name${language === 'ar' ? 'Arabic' : language === 'fr' ? 'France' : 'English'} specialization`,
        populate: {
          path: 'specialization',
          model: Specialization,
          select: `name${language === 'ar' ? 'Arabic' : language === 'fr' ? 'French' : 'English'}`,
        },
      });

    if (!completedAppointments) {
      return res.status(200).json({ message: 'No completed appointments found for the specified patient', data: [], code: 200, status: true });
    }

    // Map appointments to a more structured response
    const formattedAppointments = completedAppointments.map(appointment => ({
      id: appointment._id,
      slot: appointment.slot,
      appointmentDate: appointment.appointmentDate.toISOString().split('T')[0], // Format to "year-month-day"
      completed: appointment.completed,
      firstName: appointment.patientFirstName,
      lastName: appointment.patientLastName,
      doctor: {
        id: appointment.doctor._id,
        name: appointment.doctor[`name${language === 'ar' ? 'Arabic' : language === 'fr' ? 'France' : 'English'}`],
        specialization: appointment.doctor.specialization[`name${language === 'ar' ? 'Arabic' : language === 'fr' ? 'French' : 'English'}`],
      },
    }));

    // Respond with the formatted appointments
    return res.status(200).json({
      message: 'Completed appointments retrieved successfully',
      data: formattedAppointments,
      status: true,
      code: 200,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: 'Internal server error',
      data: [],
      status: false,
      code: 500,
    });
  }
}

async function pendingDates(req, res) {
  try {
    const patientId = req.user._id;
    const language = req.headers['language'];

    // Find completed appointments for the specified patient
    const completedAppointments = await Appointment.find({
      patient: patientId,
      approved: false,
      cancelled: false,
      completed: false
    })
      .sort({ appointmentDate: -1 }) // Sort by appointmentDate in descending order
      .populate({
        path: 'doctor',
        model: Doctor,
        select: `name${language === 'ar' ? 'Arabic' : language === 'fr' ? 'France' : 'English'} specialization`,
        populate: {
          path: 'specialization',
          model: Specialization,
          select: `name${language === 'ar' ? 'Arabic' : language === 'fr' ? 'French' : 'English'}`,
        },
      });

    if (!completedAppointments) {
      return res.status(200).json({ message: 'No completed appointments found for the specified patient', data: [], code: 200, status: true });
    }

    // Map appointments to a more structured response
    const formattedAppointments = completedAppointments.map(appointment => ({
      id: appointment._id,
      slot: appointment.slot,
      appointmentDate: appointment.appointmentDate.toISOString().split('T')[0], // Format to "year-month-day"
      approved: appointment.approved,
      firstName: appointment.patientFirstName,
      lastName: appointment.patientLastName,
      doctor: {
        id: appointment.doctor._id,
        name: appointment.doctor[`name${language === 'ar' ? 'Arabic' : language === 'fr' ? 'France' : 'English'}`],
        specialization: appointment.doctor.specialization[`name${language === 'ar' ? 'Arabic' : language === 'fr' ? 'French' : 'English'}`],
      },
    }));

    // Respond with the formatted appointments
    return res.status(200).json({
      message: 'Completed appointments retrieved successfully',
      data: formattedAppointments,
      status: true,
      code: 200,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: 'Internal server error',
      data: [],
      status: false,
      code: 500,
    });
  }
}

async function currentDates(req, res) {
  try {
    const patientId = req.user._id;

    const language = req.headers['language'];

    // Get the current date and the next day
    const today = new Date();
    today.setHours(today.getHours() + 1);
    today.setHours(0, 0, 0, 0);
    const nextDay = new Date(today);
    nextDay.setHours(23, 59, 59, 999);
    nextDay.setDate(nextDay.getDate() + 1);




    // Find completed appointments for the specified patient
    const completedAppointments = await Appointment.find({
      patient: patientId,
      approved: true,
      completed: false,
      cancelled: false,
      appointmentDate: { $gte: today, $lt: nextDay }
    })
      .sort({ appointmentDate: -1 }) // Sort by appointmentDate in descending order
      .populate({
        path: 'doctor',
        model: Doctor,
        select: `name${language === 'ar' ? 'Arabic' : language === 'fr' ? 'France' : 'English'} specialization schedule bookingStartTime`,
        populate: {
          path: 'specialization',
          model: Specialization,
          select: `name${language === 'ar' ? 'Arabic' : language === 'fr' ? 'French' : 'English'}`,
        },
      });


    if (!completedAppointments) {
      return res.status(200).json({ message: 'No completed appointments found for the specified patient', data: [], code: 200, status: true });
    }

    // Initialize arrays for appointments on the same day and the next day
    const appointmentsSameDay = [];
    const appointmentsNextDay = [];

    const appointmentAfterFilteringThem = []

    // Categorize appointments based on their appointment date
    completedAppointments.forEach(appointment => {
      const appointmentDate = appointment.appointmentDate.toISOString().split('T')[0];


      if (appointmentDate === today.toISOString().split('T')[0]) {


        const currentDayName = today.toLocaleDateString('en-US', { weekday: 'long' });
        const currentDaySchedule = appointment.doctor.schedule.find(day => day.dayOfWeek === currentDayName);

        const realToday = new Date();
        realToday.setHours(realToday.getHours() + 1);
        const currentHours = realToday.getHours();
        const currentMinutes = realToday.getMinutes();
        const currentTimeInMinutes = currentHours * 60 + currentMinutes;

        const [startBookingHours, startBookingMinutes] = appointment.doctor.bookingStartTime.split(':');
        const startBookingTimeInMinutes = parseInt(startBookingHours) * 60 + parseInt(startBookingMinutes);

        const [clinicClosingHours, clinicClosingMinutes] = currentDaySchedule.clinicHours.clinicClosingTime.split(':');
        const [clinicOpeningHours, clinicOpeningMinutes] = currentDaySchedule.clinicHours.clinicOpeningTime.split(':');

        // Convert all values to minutes for easier comparison
        const clinicClosingTimeInMinutes = parseInt(clinicClosingHours) * 60 + parseInt(clinicClosingMinutes);
        const clinicOpeningTimeInMinutes = parseInt(clinicOpeningHours) * 60 + parseInt(clinicOpeningMinutes);



        if (currentDaySchedule && currentTimeInMinutes >= clinicOpeningTimeInMinutes && currentTimeInMinutes <= clinicClosingTimeInMinutes && (currentTimeInMinutes >= startBookingTimeInMinutes - 1440)) {
          appointmentAfterFilteringThem.push(appointment);
        }

      } else {
        const realToday = new Date();
        const { clinicHoursNextDay, immediately, nextDate } = getNextWorkingDay(realToday, appointment.doctor.schedule)
        const [clinicClosingHoursNextDay, clinicClosingMinutesNextDay] = clinicHoursNextDay.clinicClosingTime.split(':');
        const clinicClosingTimeInMinutesNextDay = parseInt(clinicClosingHoursNextDay) * 60 + parseInt(clinicClosingMinutesNextDay);


        realToday.setHours(realToday.getHours() + 1);
        const currentHours = realToday.getHours();
        const currentMinutes = realToday.getMinutes();
        const currentTimeInMinutes = currentHours * 60 + currentMinutes;

        const [startBookingHours, startBookingMinutes] = appointment.doctor.bookingStartTime.split(':');
        const startBookingTimeInMinutes = parseInt(startBookingHours) * 60 + parseInt(startBookingMinutes);



        console.log(currentTimeInMinutes >= startBookingTimeInMinutes && currentTimeInMinutes <= clinicClosingTimeInMinutesNextDay + 1440 && immediately)


        if (currentTimeInMinutes >= startBookingTimeInMinutes && currentTimeInMinutes <= clinicClosingTimeInMinutesNextDay + 1440 && immediately) {
          appointmentAfterFilteringThem.push(appointment);
        }
      }
    });



    // Map appointments to a more structured response
    const formattedAppointments = completedAppointments.map(appointment => ({
      id: appointment._id,
      slot: appointment.slot,
      appointmentDate: appointment.appointmentDate.toISOString().split('T')[0], // Format to "year-month-day"
      approved: appointment.approved,
      completed: appointment.completed,
      firstName: appointment.patientFirstName,
      lastName: appointment.patientLastName,
      doctor: {
        id: appointment.doctor._id,
        name: appointment.doctor[`name${language === 'ar' ? 'Arabic' : language === 'fr' ? 'France' : 'English'}`],
        specialization: appointment.doctor.specialization[`name${language === 'ar' ? 'Arabic' : language === 'fr' ? 'French' : 'English'}`],
      },
    }));

    // Respond with the formatted appointments
    return res.status(200).json({
      message: 'Completed appointments retrieved successfully',
      data: formattedAppointments,
      status: true,
      code: 200,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: 'Internal server error',
      data: [],
      status: false,
      code: 500,
    });
  }
}

async function cancelAppointmentByUser(req, res) {
  try {
    const appointmentId = req.params.appointmentId;
    const userId = req.user._id; // Assuming user is authenticated and user information is available in req.user

    // Check if the appointment exists for the user
    const existingAppointment = await Appointment.findOne({
      _id: appointmentId,
      patient: userId,
      completed: false, // Ensure the appointment is not completed
    });

    if (!existingAppointment) {
      return res.status(404).json({ message: 'Appointment not found for the user or already completed', data: [], code: 404, status: false });
    }

    // Update the appointment to mark it as canceled by the user
    existingAppointment.cancelledByUser = true;
    existingAppointment.cancelled = true;

    // Save the updated appointment
    await existingAppointment.save();

    return res.status(200).json({
      message: 'Appointment canceled successfully',
      status: true,
      code: 200,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: 'Internal server error',
      status: false,
      code: 500,
    });
  }
}

async function cancelAppointmentByUserBecauseTheDoctorBookFalse(req, res) {
  try {
    const appointmentId = req.params.appointmentId;
    const userId = req.user._id; // Assuming user is authenticated and user information is available in req.user

    // Check if the appointment exists for the user
    const existingAppointment = await Appointment.findOne({
      _id: appointmentId,
      patient: userId,
      approved: false,
      completed: false, // Ensure the appointment is not completed
    });

    if (!existingAppointment) {
      return res.status(404).json({ message: 'Appointment not found for the user or already completed', data: [], code: 404, status: false });
    }

    // Update the appointment to mark it as canceled by the user
    existingAppointment.falseBookByDoctorForUser = true;
    existingAppointment.cancelled = true;

    // Save the updated appointment
    await existingAppointment.save();

    return res.status(200).json({
      message: 'Appointment rejected successfully',
      status: true,
      code: 200,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: 'Internal server error',
      status: false,
      code: 500,
    });
  }
}

async function approveAppointmentByUser(req, res) {
  try {
    const appointmentId = req.params.appointmentId;
    const userId = req.user._id; // Assuming user is authenticated and user information is available in req.user

    // Check if the appointment exists for the user
    const existingAppointment = await Appointment.findOne({
      _id: appointmentId,
      patient: userId,
      approved: false,
      cancelled: false,
      completed: false // Ensure the appointment is not completed
    });

    if (!existingAppointment) {
      return res.status(200).json({ data: [], code: 200, message: 'Appointment not found for the user or already completed', status: true });
    }

    // Update the appointment to mark it as canceled by the user
    existingAppointment.approved = true;

    // Save the updated appointment
    await existingAppointment.save();

    return res.status(200).json({
      message: 'Appointment approved successfully',
      status: true,
      code: 200,
      data: []
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: 'Internal server error',
      status: false,
      code: 500,
      data: []
    });
  }
}

async function analysAppointmentForDoctor(req, res) {
  try {
    const doctorId = req.doctor._id
    console.log(doctorId)
    // Fetch doctor's information
    const doctor = await Doctor.findById(doctorId).select('nameEnglish');

    // If doctor is not found, return 404
    if (!doctor) {
      return res.status(404).json({
        status: false,
        code: 404,
        data: [],
        message: 'Doctor not found.',
      });
    }


    // Use MongoDB aggregation pipeline to count appointment statuses
    const counts = await Appointment.aggregate([
      { $match: { doctor: new mongoose.Types.ObjectId(doctorId) } },
      {
        $group: {
          _id: null,
          completed: { $sum: { $cond: [{ $eq: ["$completed", true] }, 1, 0] } },
          future: { $sum: { $cond: [{ $eq: ["$completed", false] }, 1, 0] } },
          cancelled: { $sum: { $cond: [{ $eq: ["$cancelled", true] }, 1, 0] } },
        },
      },
    ]);


    // Check if counts array is empty
    if (counts.length === 0) {
      return res.status(200).json({
        status: true,
        code: 200,
        message: 'No appointments found for the specified doctor.',
        data: { completed: 0, future: 0, cancelled: 0, name: doctor.nameEnglish },
      });
    }

    // Extract counts from the result                  
    const { completed, future, cancelled } = counts[0];

    // Send the response
    return res.status(200).json({
      status: true,
      data: { completed, future, cancelled, name: doctor.nameEnglish },
      code: 200,
      message: 'Appointment status counts retrieved successfully.',
    });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({
      status: 'error',
      code: 500,
      message: 'Internal server error.',
    });
  }
}

// Function to format the date as 'DD-MM-YYYY'
function formatDate(date) {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
}
module.exports = {
  editSchedule,
  bookAppointmentByUser,
  getAvailability,
  makeAppointmentAndByDoctorForUser,
  getAvailableSlotsOnDays,
  getslots,
  makeAppointmentNew,
  getslotsFake,
  previousDates,
  pendingDates,
  currentDates,
  cancelAppointmentByUser,
  cancelAppointmentByUserBecauseTheDoctorBookFalse,
  previousDatesForDoctor,
  pendingDatesForDoctor,
  futureDatesForDoctor,
  currentDatesForDoctor,
  getCurrentSlot,
  listCancelledDatesByDoctor,
  listCancelledDatesByUser,
  approveAppointmentByUser,
  listCancelledDatesByUserIncorrectForDoctor,
  listCancelledDatesByDoctorForDoctor,
  listCancelledDatesByUserForDoctor,
  cancelAppointmentByDoctor,
  completeFlagAppointmentByDoctor,
  bookAppointmentByDoctor,
  getSlotsStatusForDoctorByToday,
  analysAppointmentForDoctor,
  getCurrentSlotForDoctor,
  markAfterCompleted,
  markLastNotCompleted,
  getAllAppointmentsForDoctorBYPhoneUser
}



// if (nextAvailableDayInfo) {
//   const { nextDate, maxPatients } = nextAvailableDayInfo;

//   // Find booked slots for the next day
//   const nextDayStart = new Date(nextDate);
//   nextDayStart.setHours(0, 0, 0, 0);

//   const nextDayEnd = new Date(nextDate);
//   nextDayEnd.setHours(23, 59, 59, 999);

//   const bookedSlotsNextDay = await Appointment.find({
//     doctor: doctor._id,
//     appointmentDate: {
//       $gte: nextDayStart,
//       $lt: nextDayEnd,
//     },
//   });

//   // Generate available slots for the next day
//   const availableSlotsNextDay = Array.from(
//     { length: maxPatients },
//     (_, index) => index + 1
//   ).filter(slot => !bookedSlotsNextDay.some(appointment => appointment.slot === slot));

//   return res.json({
//     doctorId,
//     doctorName: doctor.name,
//     nextDate: {availableSlotsNextDay,date: nextDate.toISOString().split('T')[0]},
//     today: {availableSlots, date: today.toISOString().split('T')[0]},
//      // Only consider the date part of the ISO string
//   });
// }