import nodemailer from "nodemailer";
require('dotenv').config();

let sendSimpleEmail = async (dataSend) => {
    // create reusable transporter object using the default SMTP transport
    let transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: process.env.EMAIL_APP, // generated ethereal user
            pass: process.env.EMAIL_APP_PASSWORD, // generated ethereal password
        },
        tls: { rejectUnauthorized: false }
    });

    // send mail with defined transport object
    let info = await transporter.sendMail({
        from: '"Tinh Nguyen 👻" <apdinh.nguyenductinh@gmail.com>', // sender address
        to: dataSend.reciverEmail, // list of receivers
        subject: "Thông tin đặt lịch khám bệnh", // Subject line
        html: getBodyHTMLEmail(dataSend), // html body
    });
}

let getBodyHTMLEmail = (dataSend) => {
    let result = '';
    if (dataSend.language === 'vi') {
        result =
            `<h3>Xin chào ${dataSend.patientName}</h3>
        <p>Thông tin đặt lịch khám bệnh:</p>
        <div><b>Thời gian: ${dataSend.time}</b></div>
        <div><b>Thời gian: ${dataSend.doctorName}</b></div>
        <div>Vui lòng nhấn vào link sau để xác nhận lịch hẹn đã đăng kí:</div>
        <div>
            <a href=${dataSend.redirectLink} target='_blank'>Click here</a>
        </div>
        <div>Bạn có thể hủy đăng kí lịch khám trong vòng 8 tiếng bằng cách nhấn vào link bên dưới:</div>
        <div>
            <a href=${dataSend.cancelLink} target='_blank'>Click here</a>
        </div>
        <div>Xin chân thành cảm ơn</div>
        `
    }

    if (dataSend.language === 'en') {
        result =
            `<h3>Dear ${dataSend.patientName}</h3>
        <p>Thông tin đặt lịch khám bệnh:</p>
        <div><b>Thời gian: ${dataSend.time}</b></div>
        <div><b>Thời gian: ${dataSend.doctorName}</b></div>
        <div>Vui lòng nhấn vào link sau:</div>
        <div>
            <a href=${dataSend.redirectLink} target='_blank'>Click here</a>
        </div>
        <div>Sincerely thank</div>
        `
    }
    return result;
}

let getBodyHTMLEmailRemedy = (dataSend) => {
    let result = '';
    if (dataSend.language === 'vi') {
        result =
            `<h3>Xin chào ${dataSend.patientName}</h3>
        <p>Thông tin đặt lịch khám bệnh:</p>
        <div>Thông tin đơn thuốc và hóa đơn được gửi trong file đính kèm</div>
        <div>Xin chân thành cảm ơn</div>
        `
    }

    if (dataSend.language === 'en') {
        result =
            `<h3>Dear ${dataSend.patientName}</h3>
        <p>Thông tin đặt lịch khám bệnh:</p>
        <div>sdadasdada</div>
        <div>Sincerely thank</div>
        `
    }
    return result
}

let sendAttachment = async (dataSend) => {
    return new Promise(async (resolve, reject) => {
        try {
            // create reusable transporter object using the default SMTP transport
            let transporter = nodemailer.createTransport({
                host: "smtp.gmail.com",
                port: 587,
                secure: false, // true for 465, false for other ports
                auth: {
                    user: process.env.EMAIL_APP, // generated ethereal user
                    pass: process.env.EMAIL_APP_PASSWORD, // generated ethereal password
                },
                tls: { rejectUnauthorized: false }
            });

            // send mail with defined transport object
            let info = await transporter.sendMail({
                from: '"Tinh Nguyen 👻" <apdinh.nguyenductinh@gmail.com>', // sender address
                to: dataSend.email, // list of receivers
                subject: "Kết quả đặt lịch khám", // Subject line
                html: getBodyHTMLEmailRemedy(dataSend), // html body
                attachments: [
                    { //encoded string as an attachment
                        filename: `remedy-${dataSend.patientId}-${new Date().getTime()}.png`,
                        content: dataSend.imgBase64.split("base64,")[1],
                        encoding: 'base64'
                    }
                ]
            });

            resolve(true)
        } catch (e) {
            reject(e)
        }
    })
}

module.exports = {
    sendSimpleEmail: sendSimpleEmail,
    sendAttachment: sendAttachment
}