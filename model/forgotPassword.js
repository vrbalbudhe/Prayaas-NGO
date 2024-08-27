const connection = require("../config/database");
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: "privatebriefs7@gmail.com",
    pass: "znhk kelm amhw xaks",
  },
});

const handle_forgot_password = async (req, res) => {
  try {
    const { email_id } = req.body;

    // Check if email exists in the database
    const emailExists = await checkEmailExistsOrNot(email_id);
    if (emailExists) {
      const generatedOtp = await random_OTP_generator();
      await saveOrUpdateOtp(email_id, generatedOtp);

      // Email options
      const mailOptions = {
        from: "privatebriefs7@gmail.com",
        to: email_id,
        subject: "Forgot Password Request",
        text: `Your OTP is ${generatedOtp}. Please use this OTP to reset your password.`,
      };

      // Send the email
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error("Error sending email:", error.message);
          return res
            .status(500)
            .json({ message: "Failed to send email", error: error.message });
        } else {
          console.log("Email sent:", info.response);
          return res.status(200).json({ message: "OTP sent successfully" });
        }
      });
    } else {
      return res.status(404).json({ message: "Email not found" });
    }
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};

const handle_verify_otp_and_update_password = async (req, res) => {
  try {
    const { email_id, otp, new_password } = req.body;

    // Check if the OTP is valid
    const isOtpValid = await verifyOtp(email_id, otp);
    if (!isOtpValid) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // Check if the email exists in the individual table
    const sql3 = `SELECT * FROM signupdb_individual WHERE email_id = ?`;
    const individualResult = await queryDatabase(sql3, [email_id]);

    let updateSql;
    let donor_id;

    if (individualResult.length > 0) {
      // Email exists in individual table
      donor_id = individualResult[0].donor_id;
      updateSql = `UPDATE signupdb_individual SET password = ? WHERE donor_id = ?`;
    } else {
      // Check if the email exists in the organization table
      const sql4 = `SELECT * FROM signupdb_organization WHERE email_id = ?`;
      const organizationResult = await queryDatabase(sql4, [email_id]);

      if (organizationResult.length > 0) {
        // Email exists in organization table
        donor_id = organizationResult[0].donor_id;
        updateSql = `UPDATE signupdb_organization SET password = ? WHERE donor_id = ?`;
      } else {
        return res.status(404).json({ message: "Email not found" });
      }
    }

    // Update the password
    await queryDatabase(updateSql, [new_password, donor_id]);

    return res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};

const verifyOtp = async (email_id, otp) => {
  const sql = `SELECT * FROM otpstore WHERE email_id = ? AND otp = ?`;
  const results = await queryDatabase(sql, [email_id, otp]);
  return results.length > 0;
};

const checkEmailExistsOrNot = async (email_id) => {
  const sql1 = `SELECT * FROM signupdb_individual WHERE email_id = ?`;
  const sql2 = `SELECT * FROM signupdb_organization WHERE email_id = ?`;

  const result1 = await queryDatabase(sql1, [email_id]);
  if (result1.length > 0) return true;

  const result2 = await queryDatabase(sql2, [email_id]);
  return result2.length > 0;
};

const queryDatabase = (sql, params) => {
  return new Promise((resolve, reject) => {
    connection.query(sql, params, (error, results) => {
      if (error) {
        reject(error);
      } else {
        resolve(results);
      }
    });
  });
};

const saveOrUpdateOtp = async (email_id, otp) => {
  const emailExistsInOtpStore = await checkEmailInOtpStore(email_id);

  if (emailExistsInOtpStore) {
    await updateOtp(email_id, otp);
  } else {
    await insertOtp(email_id, otp);
  }
};

const checkEmailInOtpStore = async (email_id) => {
  const sql = `SELECT * FROM otpstore WHERE email_id = ?`;
  const results = await queryDatabase(sql, [email_id]);
  return results.length > 0;
};

const updateOtp = (email_id, otp) => {
  const sql = `UPDATE otpstore SET otp = ? WHERE email_id = ?`;
  return queryDatabase(sql, [otp, email_id]);
};

const insertOtp = (email_id, otp) => {
  const sql = `INSERT INTO otpstore (email_id, otp) VALUES (?, ?)`;
  return queryDatabase(sql, [email_id, otp]);
};

const random_OTP_generator = async () => {
  const min = 100000;
  const max = 999999;
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

module.exports = {
  handle_forgot_password,
  handle_verify_otp_and_update_password,
};
