import { useState } from "react";
import { TextField, Button, Box, Typography } from "@mui/material";
import axios from "axios";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleForgotPassword = async () => {
    try {
      const response = await axios.post("http://localhost:8000/forgot-password", { email });
      setMessage(response.data.message);
    } catch (error) {
      setMessage("Error sending reset link.");
    }
  };

  return (
    <Box>
      <Typography variant="h5">Forgot Password</Typography>
      <TextField label="Enter your email" fullWidth value={email} onChange={(e) => setEmail(e.target.value)} />
      <Button onClick={handleForgotPassword} variant="contained" color="primary">Send Reset Link</Button>
      <Typography>{message}</Typography>
    </Box>
  );
}
