import sendEmail from "../config/sendemail.js";
import UserModel from "../models/user.model.js";
import bcryptjs from "bcryptjs";
import verificationEmailTemplate from "../utils/verifyEmailTemplate.js";
import dotenv from "dotenv";
import generateAccessToken from "../utils/generateAccessToken.js";
import generateRefreshToken from "../utils/generateRefreshToken.js";
import uploadImageCloudinary from "../utils/uploadImageCloudinary.js";
import generateOtp from "../utils/generateOtp.js";
import forgotPasswordTemplate from "../utils/forgotPasswordTemplate.js";
import jwt from "jsonwebtoken";
dotenv.config();

export async function registerUserController(req, res) {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      res.status(400).json({
        message: "Provide email,username and password",
        error: true,
        success: false,
      });
    }

    const user = await UserModel.findOne({ email });

    if (user) {
      return res.json({
        message: "Already Registered email",
        error: true,
        success: false,
      });
    }

    const salt = await bcryptjs.genSalt(10);
    const hashPassword = await bcryptjs.hash(password, salt);

    const payLoad = {
      name,
      email,
      password: hashPassword,
    };

    const newUser = new UserModel(payLoad);
    const save = await newUser.save();

    const verifyEmailUrl = `${process.env.FRONTEND_URL}/verify-email?code=${save?._id}`;

    const verificationEmail = await sendEmail({
      sendTo: email,
      subject: "Verify email from Blinkit",
      html: verificationEmailTemplate({
        name,
        url: verifyEmailUrl,
      }),
    });
    return res.json({
      message: "User registered Succssfully",
      error: false,
      success: true,
      data: save,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
}

export async function verifyEmailController(request, response) {
  try {
    const { code } = request.body;
    const user = await UserModel.findOne({ _id: code });
    if (!user) {
      response.status(400).json({
        message: "Invalid code",
        error: true,
        success: false,
      });
    }
    const updateUser = await UserModel.updateOne(
      { _id: code },
      {
        verify_email: true,
      }
    );
    return response.json({
      message: "Verification Done",
      success: true,
      error: false,
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
}

//Login Controller
export async function LoginController(request, response) {
  try {
    const { email, password } = request.body;
    if (!email || !password) {
      return response.status(400).json({
        message: "Please provider email and password",
        error: true,
        success: false,
      });
    }
    const user = await UserModel.findOne({ email });
    if (!user) {
      return response.status(400).json({
        message: "User is not registered",
        error: true,
        success: false,
      });
    }

    if (user.status !== "Active") {
      return response.status(400).json({
        message: "Contact to Admin",
        error: true,
        success: false,
      });
    }

    const checkPassword = await bcryptjs.compare(password, user.password);
    if (!checkPassword) {
      return response.status(400).json({
        message: "Check your password",
        error: true,
        success: false,
      });
    }
    const accessToken = await generateAccessToken(user._id);

    const refreshToken = await generateRefreshToken(user._id);

    const cookiesOption = {
      httpOnly: true,
      secure: true,
      sameSite: "None",
    };
    response.cookie("accessToken", accessToken, cookiesOption);
    response.cookie("refreshToken", refreshToken, cookiesOption);

    return response.json({
      message: "Login Successfully",
      error: false,
      success: true,
      data: {
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
}

//logout controller
export async function logoutController(request, response) {
  try {
    const userId = request.userId; //From middleware
    const removeRefreshToken = await UserModel.findByIdAndUpdate(userId, {
      refresh_token: "",
    });
    const cookiesOption = {
      httpOnly: true,
      secure: true,
      sameSite: "None",
    };
    response.clearCookie("accessToken", cookiesOption);
    response.clearCookie("refreshToken", cookiesOption);

    return response.json({
      message: "Logout successfully",
      error: false,
      success: true,
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
}

//Upload user Avatar
export async function uploadAvatar(request, response) {
  try {
    const userId = request.userId;
    const image = request.file;

    const upload = await uploadImageCloudinary(image);

    const updataUser = await UserModel.findByIdAndUpdate(userId, {
      avatar: upload.url,
    });

    return response.json({
      message: "Upload Profile",
      data: {
        _id: userId,
        avatar: upload.url,
      },
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
}

//Update User Details
export async function updateUserDetails(request, response) {
  try {
    const userId = request.userId; //Auth Middleware
    const { name, email, mobile, password } = request.body;
    let hashPassword = "";
    if (password) {
      const salt = await bcryptjs.genSalt(10);
      hashPassword = await bcryptjs.hash(password, salt);
    }

    const updateUser = await UserModel.updateOne(
      { _id: userId },
      {
        ...(name && { name: name }),
        ...(email && { email: email }),
        ...(mobile && { mobile: mobile }),
        ...(password && { password: hashPassword }),
      }
    );
    return response.json({
      message: "Updated user successfully",
      error: false,
      success: true,
      data: updateUser,
    });
  } catch (error) {
    return response.status(500).json({
      message: error || error.message,
      error: true,
      success: false,
    });
  }
}

//Forgot password not login
export async function forgotPasswordController(request, response) {
  try {
    const { email } = request.body;
    const user = await UserModel.findOne({ email });
    if (!user) {
      return response.status(400).json({
        message: "Email not  available",
        error: true,
        success: false,
      });
    }

    const otp = generateOtp();

    const expireTime = new Date() + 60 * 60 * 1000; // 1Hour
    const update = await UserModel.findByIdAndUpdate(user._id, {
      forgot_password_otp: otp,
      forgot_password_expiry: new Date(expireTime).toISOString(),
    });
    const emailRet = await sendEmail({
      sendTo: email,
      subject: "Forgot Password from Blinkit",
      html: forgotPasswordTemplate({
        name: user.name,
        otp: otp,
      }),
    });
    return response.json({
      message: "Check your email",
      error: false,
      success: true,
    });
  } catch (error) {
    return response.status(500).json({
      message: error || error.message,
      error: true,
      success: false,
    });
  }
}

//Verify Forgot password OTP
export async function verifyForgotPasswordOTP(request, response) {
  try {
    const { email, otp } = request.body;

    if (!email || !otp) {
      return response.status(400).json({
        message: "Provide Required Field. Email and Otp",
        error: true,
        success: false,
      });
    }
    const user = await UserModel.findOne({ email });
    if (!user) {
      return response.status(400).json({
        message: "Email not  available",
        error: true,
        success: false,
      });
    }

    const getCurrentTime = new Date().toISOString();
    if (user.forgot_password_expiry < getCurrentTime) {
      return response.status(400).json({
        message: "Otp Expired",
        error: true,
        success: false,
      });
    }

    if (otp !== user.forgot_password_otp) {
      return response.status(400).json({
        message: "Invalid OTP",
        error: true,
        success: false,
      });
    }

    //If Otp is not expired and otp===user.forgot_password_otp
    return response.json({
      message: "OTP Verified Successfilly",
      success: true,
      error: false,
    });
  } catch (error) {
    return response.status(500).json({
      message: error || error.message,
      error: true,
      success: false,
    });
  }
}

//Reset the password
export async function resetPassword(request, response) {
  try {
    const { email, newPassword, confirmPassword } = request.body;
    if (!email || !newPassword || !confirmPassword) {
      return response.status(400).json({
        message: "Provide Required Field email, password, Confirm password",
        error: true,
        success: false,
      });
    }
    const user = await UserModel.findOne({ email });

    if (!user) {
      return response.status(400).json({
        message: "Email is not available",
        error: true,
        success: false,
      });
    }

    if (newPassword !== confirmPassword) {
      return response.status(400).json({
        message: "Password and confirm Password does not match",
        error: true,
        success: false,
      });
    }
    const salt = await bcryptjs.genSalt(10);
    const hashPassword = await bcryptjs.hash(newPassword, salt);

    const update = await UserModel.findByIdAndUpdate(user._id, {
      password: hashPassword,
    });

    return response.json({
      message: "Password Updated successfully.",
      error: false,
      success: true,
    });
  } catch (error) {
    return response.status(500).json({
      message: error || error.message,
      error: true,
      success: false,
    });
  }
}

//Refresh Token Controller
export async function refreshToken(request, response) {
  try {
    const refreshToken =
      request.cookies.refreshToken ||
      request?.header?.authorization?.split(" ")[1]; //Bearer token
    if (!refreshToken) {
      return response.status(401).json({
        message: "Invalid Token",
        error: true,
        success: false,
      });
    }
    const verifyToken = await jwt.verify(
      refreshToken,
      process.env.SECRET_KEY_REFRESH_TOKEN
    );
    if (!verifyToken) {
      return response.status(401).json({
        message: "Token is expired",
        error: true,
        success: false,
      });
    }

    const userId = verifyToken._id;
    console.log("verify Token", verifyToken);
    const newAccessToken = await generateAccessToken(userId);
    console.log("New Access token", newAccessToken);
    const cookiesOption = {
      httpOnly: true,
      secure: true,
      sameSite: "None",
    };

    response.cookie("accessToken", newAccessToken, cookiesOption);

    return response.json({
      message: "New Access Token Generated",
      error: false,
      success: true,
      data: {
        accessToken: newAccessToken,
      },
    });
  } catch (error) {
    return response.status(500).json({
      message: error || error.message,
      error: true,
      success: false,
    });
  }
}
