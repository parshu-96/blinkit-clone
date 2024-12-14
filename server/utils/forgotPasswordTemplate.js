const forgotPasswordTemplate = ({ name, otp }) => {
  return `
<div>
<p>Dear, ${name}</p>
<p>You have requested a password Reset. Please use following OTP code to reset your password.</p>
<div style="background:yellow;font-size:20px; padding:20px; text-align:center; font-weight:800;">${otp}</div>
<p>This OTP will be valid for only 1 Hour. Enter this otp in Blinkit website to procced wuth resetting your password.</p>
</br>
</br>
<p>Thanks,</p>
<p>Blinkit</p>
</div>
`;
};

export default forgotPasswordTemplate;
