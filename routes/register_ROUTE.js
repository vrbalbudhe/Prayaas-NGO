const path = require("path");
const express = require("express");
const router = express.Router();

// Import controllers
const {
  handle_registration_individual,
  handle_registration_organisation,
  handle_login_individual_And_organization,
  handle_otp_authenticator,
  verifyToken,
} = require("../controllers.js/usercontrolles");
const {
  handle_forgot_password,
  forgotPasswordAuth,
} = require("../model/usermodel");

// REGISTER AND LOGIN ROUTES
router.post("/register_individual", handle_registration_individual);
router.post("/register_organisation", handle_registration_organisation);
router.post(
  "/login_individual_And_organization",
  handle_login_individual_And_organization
);
router.post("/otp_authenticate", handle_otp_authenticator);
router.post("/forgotPass", handle_forgot_password);
router.post("/forgotPass1", forgotPasswordAuth);

// USER-REDIRECTING ROUTES

// PRAYAAS REGISTER FOR THE INDIVIDUAL
router.get("/prayaas/register", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "register.html"));
});

// PRAYAAS REGISTER FOR THE ORGANISATION
router.get("/prayaas/registerOrg", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "registerOrg.html"));
});

// PRAYAAS LOGIN FOR BOTH INDIVIDUAL AND ORGANISATION
router.get("/prayaas/login", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "login.html"));
});

// PRAYAAS HOME FOR THE WEBSITE HOMEPAGE
router.get("/prayaas/home", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "ngo.html"));
});

// PRAYAAS OTP AUTHENTICATION FOR THE INDIVIDUAL
router.get("/prayaas/otpauth", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "otp_window.html"));
});

// PRAYAAS OTP AUTHENTICATION FOR THE ORGANIZATION
router.get("/prayaas/otpauthOrg", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "otp_window_org.html"));
});

// PRAYAAS FORGOT PASSWORD
router.get("/prayaas/forgotPass", (req, res) => {
  res.render(path.join(__dirname, "..", "views", "forgotPassword.ejs"));
});

router.get("/prayaas/forgotPasswordAuth", (req, res) => {
  res.render(path.join(__dirname, "..", "views", "fp2.ejs"));
});

module.exports = router;
