const { hashSync } = require("bcrypt");
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
    const checking = await emailExistsOrNot(email_id);

    if (checking) {
      const otpGenerating = await random_OTP_generator();

      // Assuming you are using express-session to handle sessions
      req.session.otpGenerate = otpGenerating;
      req.session.email_id = email_id;

      // Email options
      const mailOptions = {
        from: "privatebriefs7@gmail.com",
        to: email_id,
        subject: "Forgot Password Request",
        text: `Your OTP is ${otpGenerating}. Please use this OTP to reset your password.`,
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
          return res.redirect(
            `http://localhost:8000/prayaas/forgotPasswordAuth?email_id=${email_id}`
          );
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

const forgotPasswordAuth = async (req, res) => {
  try {
    const { otp, password } = req.body;
    const email_id = req.session.email_id;
    console.log(email_id);
    console.log(req.session.otpGenerate);
    if (req.session.otpGenerate == otp) {
      const sql1 =
        "UPDATE signupdb_individual SET password = ? WHERE email_id = ?";
      const sql2 =
        "UPDATE signupdb_organization SET password = ? WHERE email_id = ?";

      try {
        const hashedPassword = await hashSync(password, 10);
        // Try updating the password in the individual table
        const result1 = await new Promise((resolve, reject) => {
          connection.query(
            sql1,
            [hashedPassword, email_id],
            (error, result) => {
              if (error) {
                reject(error);
              } else {
                resolve(result);
              }
            }
          );
        });

        if (result1.affectedRows > 0) {
          res.redirect("http://localhost:8000/prayaas/login");
          return;
        }

        // If not, try updating the password in the organization table
        const result2 = await new Promise((resolve, reject) => {
          connection.query(
            sql2,
            [hashedPassword, email_id],
            (error, result) => {
              if (error) {
                reject(error);
              } else {
                resolve(result);
              }
            }
          );
        });

        if (result2.affectedRows > 0) {
          res.redirect("http://localhost:8000/prayaas/login");
          return;
        }

        // If the email was not found in both tables, throw an error
        res.status(404).send("Email not found in both tables.");
      } catch (error) {
        console.log(error);
        res.status(500).send("Internal Server Error");
      }
    } else {
      res.status(400).send("Invalid OTP. Please try again.");
    }
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};

// Helper function to check if the email exists
const emailExistsOrNot = async (email_id) => {
  try {
    const sql1 = "SELECT * FROM signupdb_individual WHERE email_id = ?";
    const sql2 = "SELECT * FROM signupdb_organization WHERE email_id = ?";

    const result1 = await new Promise((resolve, reject) => {
      connection.query(sql1, [email_id], (error1, result1) => {
        if (error1) {
          reject(error1);
        } else {
          resolve(result1);
        }
      });
    });

    if (result1.length > 0) {
      return true; // Email exists in individual table
    } else {
      const result2 = await new Promise((resolve, reject) => {
        connection.query(sql2, [email_id], (error2, result2) => {
          if (error2) {
            reject(error2);
          } else {
            resolve(result2);
          }
        });
      });

      if (result2.length > 0) {
        return true; // Email exists in organization table
      } else {
        return false; // Email does not exist in either table
      }
    }
  } catch (error) {
    console.log(error);
    throw error;
  }
};

const MobileAndEmailInIndividualTable = async (email_id, mobile_no) => {
  try {
    const sql = `
      SELECT email_id, mobile_no FROM signupdb_individual 
      WHERE email_id = ? OR mobile_no = ?
    `;
    const results = await connection.query(sql, [email_id, mobile_no]);
    console.log(`this is the result_set: ${results._resultSet}`);
    if (results.length === 0) {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    console.error("Error querying tables:", error.message);
    throw error;
  }
};

const MobileAndEmailInOrganizationTable = async (email_id, mobile_no) => {
  try {
    const sql = `
      SELECT email_id, mobile_no FROM signupdb_organization 
      WHERE email_id = ? OR mobile_no = ?
    `;
    const results = await connection.query(sql, [email_id, mobile_no]);
    console.log("Results:", results);

    if (results.length === 0) {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    console.error("Error querying tables:", error.message);
    throw error;
  }
};

const registerUserIndividual = async (
  donor_id,
  name,
  email_id,
  mobile_no,
  dob,
  address,
  gender,
  password
) => {
  return new Promise(async (resolve, reject) => {
    try {
      const sql = `INSERT INTO signupdb_individual (donor_id, name, email_id, mobile_no, dob, address, gender, password) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

      connection.query(
        sql,
        [donor_id, name, email_id, mobile_no, dob, address, gender, password],
        async (error, results) => {
          if (error) {
            console.error(
              "Error inserting into individual table:",
              error.message
            );
            reject(error);
          } else {
            resolve(results.affectedRows === 1);

            // Check if the email exists in otpstore
            const emailExists = await checkEmailInOtpStore(email_id);
            let otp = await random_OTP_generator();

            if (emailExists) {
              console.log("Email already exists in otpstore.");
              await updateOtp(email_id, otp, password);
            } else {
              console.log("Email does not exist in otpstore.");
              await insertOtp(email_id, otp, password);
            }

            // Send email with nodemailer
            const mailOptions = {
              from: "privatebriefs7@gmail.com",
              to: email_id,
              subject: "Registration Successful",
              text: `This is your DONOR-ID : ${donor_id}, Thank you for registering with us! Your OTP is ${otp}. Please use this OTP to complete your registration.`,
            };

            transporter.sendMail(mailOptions, (error, info) => {
              if (error) {
                console.error("Error sending email:", error.message);
                reject(error);
              } else {
                console.log("Email sent:", info.response);
                resolve(results.affectedRows === 1);
              }
            });
          }
        }
      );
    } catch (error) {
      console.error("Error during registration:", error);
      reject(error);
    }
  });
};

const registerUserOrganisation = async (
  donor_id,
  type,
  name,
  email_id,
  mobile_no,
  address,
  password
) => {
  return new Promise(async (resolve, reject) => {
    try {
      const sql = `INSERT INTO signupdb_organization (
        donor_id,
        type,
        name,
        email_id,
        mobile_no,
        address,
        password
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`;

      connection.query(
        sql,
        [donor_id, type, name, email_id, mobile_no, address, password],
        async (error, results) => {
          if (error) {
            console.error(
              "Error inserting into organization table:",
              error.message
            );
            reject(error);
          } else {
            resolve(results.affectedRows === 1);

            // Check if the email exists in otpstore
            const emailExists = await checkEmailInOtpStore(email_id);
            let otp = await random_OTP_generator();

            if (emailExists) {
              console.log("Email already exists in otpstore.");
              await updateOtp(email_id, otp, password);
            } else {
              console.log("Email does not exist in otpstore.");
              await insertOtp(email_id, otp, password);
            }

            // Send email with nodemailer
            const mailOptions = {
              from: "privatebriefs7@gmail.com",
              to: email_id,
              subject: "Registration Successful",
              text: `This is your DONOR-ID : ${donor_id}, Thank you for registering with us! Your OTP is ${otp}. Please use this OTP to complete your registration.`,
            };

            transporter.sendMail(mailOptions, (error, info) => {
              if (error) {
                console.error("Error sending email:", error.message);
                reject(error); // Reject promise on email sending error
              } else {
                console.log("Email sent:", info.response);
                resolve(results.affectedRows === 1);
              }
            });
          }
        }
      );
    } catch (error) {
      console.error("Error during organization registration:", error);
      reject(error);
    }
  });
};

const loginUserAndOrganization = async (email_id, password) => {
  return new Promise((resolve, reject) => {
    const indSqlQuery = `SELECT * FROM signupdb_individual WHERE email_id = ? AND password = ?`;
    const orgSqlQuery = `SELECT * FROM signupdb_organization WHERE email_id = ? AND password = ?`;

    connection.query(indSqlQuery, [email_id, password], (error, indResults) => {
      if (error) {
        console.error("Error querying individual database:", error.message);
        reject(error);
      } else {
        if (indResults.length > 0) {
          // Extract donor_id, name, and contact from individual table
          const { donor_id, name, mobile_no, dob } = indResults[0];
          resolve({
            type: "individual",
            donor_id,
            name,
            mobile_no,
            dob,
          });
        } else {
          connection.query(
            orgSqlQuery,
            [email_id, password],
            (error, orgResults) => {
              if (error) {
                console.error(
                  "Error querying organization database:",
                  error.message
                );
                reject(error);
              } else {
                if (orgResults.length > 0) {
                  // Extract donor_id, name, and contact from organization table
                  const { donor_id, mobile_no, name } = orgResults[0];
                  resolve({
                    type: "organization",
                    donor_id,
                    mobile_no,
                    name,
                  });
                } else {
                  resolve(null);
                }
              }
            }
          );
        }
      }
    });
  });
};

const random_OTP_generator = async () => {
  try {
    const min = 100000;
    const max = 999999;
    return Math.floor(Math.random() * (max - min + 1)) + min;
  } catch (error) {
    console.log("Unable to generate the OTP");
    throw error;
  }
};

const random_donor_id_generator = async () => {
  try {
    const min = 1000000;
    const max = 9999999;
    return Math.floor(Math.random() * (max - min + 1)) + min;
  } catch (error) {
    console.log("Unable to generate the Donor_Id");
    throw error;
  }
};

const checkEmailInOtpStore = async (email_id) => {
  return new Promise((resolve, reject) => {
    const sql = `SELECT * FROM otpstore WHERE email_id = ?`;

    connection.query(sql, [email_id], (error, results) => {
      if (error) {
        console.error("Error checking email in otpstore:", error.message);
        reject(error);
      } else {
        resolve(results.length > 0);
      }
    });
  });
};

const updateOtp = async (email_id, otp, password) => {
  const sql = `UPDATE otpstore SET otp = ? WHERE email_id = ?`;

  return new Promise((resolve, reject) => {
    connection.query(sql, [otp, email_id, password], (error, results) => {
      if (error) {
        console.error("Error updating OTP in otpstore:", error.message);
        reject(error);
      } else {
        resolve();
      }
    });
  });
};

// const accessTokenFromSessions = async(req,res)=>{
//   const sql = `INSERT INTO {}`;
// }

const insertOtp = async (email_id, otp, password) => {
  const sql = `INSERT INTO otpstore (email_id, otp,password) VALUES (?, ?, ?)`;

  return new Promise((resolve, reject) => {
    connection.query(sql, [email_id, otp, password], (error, results) => {
      if (error) {
        console.error("Error inserting OTP into otpstore:", error.message);
        reject(error);
      } else {
        resolve();
      }
    });
  });
};

const otpAuthenticator = async (email_id, otp, res) => {
  try {
    console.log("Attempting OTP verification for email:", email_id);
    console.log("Input OTP:", otp);

    const mysqlQuery = `SELECT * FROM otpstore WHERE email_id = ? AND otp = ?`;
    connection.query(mysqlQuery, [email_id, otp], (error, results) => {
      if (error) {
        console.error("Error verifying OTP:", error.message);
        res.status(500).json({ message: "Error verifying OTP" });
      } else {
        console.log("Database query results:", results);

        if (results.length > 0) {
          console.log("OTP verified successfully for:", email_id);
          res.redirect("http://localhost:8000/prayaas/login");
          // res.status(200).json({ message: "OTP verified successfully" });
        } else {
          console.log("Invalid OTP for:", email_id);
          res.status(400).json({ message: "Invalid OTP" });
        }
      }
    });
  } catch (error) {
    console.error("Error during OTP verification:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  registerUserIndividual,
  registerUserOrganisation,
  loginUserAndOrganization,
  otpAuthenticator,
  random_donor_id_generator,
  MobileAndEmailInIndividualTable,
  MobileAndEmailInOrganizationTable,
  handle_forgot_password,
  forgotPasswordAuth,
};
