import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { TextField, Button, Box, Typography } from "@mui/material";
import axios from "axios";

export default function ResetPassword() {
  const { token } = useParams();  // Get token from URL
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleResetPassword = async () => {
    try {
      const response = await axios.post("http://localhost:8000/reset-password", { token, new_password: newPassword });
      setMessage(response.data.message);
      setTimeout(() => navigate("/admin/sign-in"), 2000);  // Redirect to login after success
    } catch (error) {
      setMessage("Failed to reset password.");
    }
  };

  return (
    <Box>
      <Typography variant="h5">Reset Password</Typography>
      <TextField label="New Password" type="password" fullWidth value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
      <Button onClick={handleResetPassword} variant="contained" color="primary">Reset Password</Button>
      <Typography>{message}</Typography>
    </Box>
  );
}
