import { useState, useCallback } from "react";
import Box from "@mui/material/Box";
import Link from "@mui/material/Link";
import Divider from "@mui/material/Divider";
import TextField from "@mui/material/TextField";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import LoadingButton from "@mui/lab/LoadingButton";
import InputAdornment from "@mui/material/InputAdornment";
import { useRouter } from "src/routes/hooks";
import { Iconify } from "src/components/iconify";
import { useAuth } from "src/contexts/AuthContext"; // ✅ Import useAuth hook
import axios from "axios";

export function SignInView() {
  const router = useRouter();
  const { login } = useAuth(); // ✅ Use AuthContext properly

  // State Management
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Handle Login
  const handleSignIn = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      await login(email, password);
      router.push("/admin/dashboard"); // ✅ Redirect to dashboard after login
    } catch (err) {
      setError("Invalid email or password"); // Show error message
    } finally {
      setLoading(false);
    }
  }, [email, password, login, router]);

 

  return (
    <>
      <Box gap={1.5} display="flex" flexDirection="column" alignItems="center" sx={{ mb: 5 }}>
        <Typography variant="h5">Sign in</Typography>
        <Typography variant="body2" color="text.secondary">
          Don’t have an account?
          <Link href="/register" variant="subtitle2" sx={{ ml: 0.5 }}>
            Get started
          </Link>
        </Typography>
      </Box>

      <Box display="flex" flexDirection="column" alignItems="flex-end">
        {/* Email Field */}
        <TextField
          fullWidth
          name="email"
          label="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          InputLabelProps={{ shrink: true }}
          sx={{ mb: 3 }}
        />

        

        <Link href="/admin/forgot-password" variant="body2" color="inherit" sx={{ mb: 1.5 }}>
          Forgot password?
        </Link>

        {/* Password Field */}
        <TextField
          fullWidth
          name="password"
          label="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type={showPassword ? "text" : "password"}
          InputLabelProps={{ shrink: true }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                  <Iconify icon={showPassword ? "solar:eye-bold" : "solar:eye-closed-bold"} />
                </IconButton>
              </InputAdornment>
            ),
          }}
          sx={{ mb: 3 }}
        />

        {/* Error Message */}
        {error && (
          <Typography color="error" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}

        {/* Sign In Button */}
        <LoadingButton
          fullWidth
          size="large"
          type="submit"
          color="inherit"
          variant="contained"
          onClick={handleSignIn}
          loading={loading}
        >
          Sign in
        </LoadingButton>
      </Box>

      {/* OR Divider */}
      <Divider sx={{ my: 3, "&::before, &::after": { borderTopStyle: "dashed" } }}>
        <Typography variant="overline" sx={{ color: "text.secondary", fontWeight: "fontWeightMedium" }}>
          OR
        </Typography>
      </Divider>

      {/* Social Login Icons */}
      <Box gap={1} display="flex" justifyContent="center">
        <IconButton color="inherit">
          <Iconify icon="logos:google-icon" />
        </IconButton>
        <IconButton color="inherit">
          <Iconify icon="eva:github-fill" />
        </IconButton>
        <IconButton color="inherit">
          <Iconify icon="ri:twitter-x-fill" />
        </IconButton>
      </Box>
    </>
  );
}
