import db from "../models/index";
require('dotenv').config();
import emailService from "./emailService";
import { v4 as uuidv4 } from 'uuid';
import _ from 'lodash';

const MAX_NUMBER_SCHEDULE = process.env.MAX_NUMBER_SCHEDULE;

let buildUrlEmail = (doctorId, token, action) => {
    let result = `${process.env.URL_REACT}/verify-booking?token=${token}&doctorId=${doctorId}&action=${action}`;
    return result;
}

let postBookAppointment = (data) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!data.email || !data.doctorId || !data.timeType || !data.date || !data.fullName
                || !data.selectedGender || !data.address) {
                resolve({
                    errCode: 1,
                    errMessage: "Missing required paramenters"
                })
            } else {

                let token = uuidv4();
                await emailService.sendSimpleEmail({
                    reciverEmail: data.email,
                    patientName: data.fullName,
                    time: data.timeString,
                    doctorName: data.doctorName,
                    language: data.language,
                    redirectLink: buildUrlEmail(data.doctorId, token, 'confirm'),
                    cancelLink: buildUrlEmail(data.doctorId, token, 'cancel'),
                })

                //upsert patient
                let user = await db.User.findOrCreate({
                    where: { email: data.email },
                    defaults: {
                        email: data.email,
                        roleId: "R3",
                        gender: data.selectedGender,
                        address: data.address,
                        firstName: data.fullName
                    }
                });

                //create a booking record
                if (user && user[0]) {
                    await db.Booking.findOrCreate({
                        where: {
                            patientId: user[0].id,
                            date: data.date
                        },
                        defaults: {
                            statusId: 'S1',
                            doctorId: data.doctorId,
                            patientId: user[0].id,
                            date: data.date,
                            timeType: data.timeType,
                            token: token
                        }
                    })

                    let count = await db.Booking.count({
                        where: {
                            statusId: 'S1',
                            date: data.date,
                            timeType: data.timeType,
                            doctorId: data.doctorId
                        },
                    })

                    if (count > MAX_NUMBER_SCHEDULE) {
                        resolve({
                            errCode: 3,
                            errMessage: "Sorry schedules are full now!"
                        })
                    } else {
                        await db.Schedule.update(
                            { currentNumber: count },
                            {
                                where: {
                                    date: data.date,
                                    timeType: data.timeType,
                                    doctorId: data.doctorId
                                }
                            });
                    }
                }
            }
            resolve({
                errCode: 0,
                errMessage: "Save infor patient succeed"
            })
        } catch (error) {
            reject(error)
        }
    })
}

let postVerifyBookAppointment = (data) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!data.token || !data.doctorId || !data.action) {
                resolve({
                    errCode: 1,
                    errMessage: "Missing required paramenters"
                })
            }

            if (data.action === 'confirm') {
                let appointment = await db.Booking.findOne({
                    where: {
                        doctorId: data.doctorId,
                        token: data.token,
                        statusId: "S1"
                    },
                    raw: false
                })

                if (appointment) {
                    appointment.statusId = "S2";
                    await appointment.save();

                    resolve({
                        errCode: 0,
                        errMessage: "Xác nhận lịch hẹn thành công!"
                    })
                }
            }

            if (data.action === 'cancel') {
                let booking = await db.Booking.findOne({
                    where: {
                        doctorId: data.doctorId,
                        token: data.token,
                        statusId: "S2"
                    },
                    raw: false
                })

                if (booking) {
                    await db.User.destroy({
                        where: {
                            id: booking.patientId,
                        }
                    });

                    await db.Booking.destroy({
                        where: {
                            doctorId: data.doctorId,
                            token: data.token,
                            statusId: "S2"
                        }
                    });
                }

                resolve({
                    errCode: 0,
                    errMessage: "Hủy lịch hẹn thành công!"
                })
            }

            else {
                resolve({
                    errCode: 2,
                    errMessage: "Appointment has been activated or does not exist"
                })
            }
        }
        catch (error) {
            reject(error)
        }
    })
}

let getCountPatientByDate = (date) => {
    return new Promise(async (resolve, reject) => {
        try {
            let listDoctor = await db.User.findAll({
                where: {
                    roleId: 'R2'
                },
                attributes: ['id', 'email', 'roleId', 'address', 'firstName', 'lastName'],
                raw: true
            })

            let listPatientConfirm = [];
            let listDoctorConfirm = [];

            if (listDoctor && listDoctor.length > 0) {
                listDoctor.map(async (item, index) => {
                    let countPatient = await db.Booking.count({
                        where: {
                            doctorId: item.id,
                            date: date,
                            statusId: 'S2',
                        }
                    });
                    listPatientConfirm.push({
                        count: countPatient,
                        id: item.id
                    });
                    listPatientConfirm = _.orderBy(listPatientConfirm, ['id'], ['asc']); //desc cho giảm dần

                    let countDoctor = await db.Booking.count({
                        where: {
                            doctorId: item.id,
                            date: date,
                            statusId: 'S3',
                        }
                    });
                    listDoctorConfirm.push({
                        count: countDoctor,
                        id: item.id
                    });
                    listDoctorConfirm = _.orderBy(listDoctorConfirm, ['id'], ['asc']); //desc cho giảm dần

                    if (listPatientConfirm.length === listDoctor.length && listDoctorConfirm.length === listDoctor.length) {
                        resolve({
                            listPatientConfirm: listPatientConfirm,
                            listDoctorConfirm: listDoctorConfirm,
                            errCode: 0
                        });
                    }
                })
            } else {
                resolve({
                    errCode: 1
                });
            }
        }
        catch (error) {
            reject(error);
        }
    })
}

module.exports = {
    postBookAppointment: postBookAppointment,
    postVerifyBookAppointment: postVerifyBookAppointment,
    getCountPatientByDate: getCountPatientByDate
}