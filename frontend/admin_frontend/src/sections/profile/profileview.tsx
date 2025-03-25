import { useState , useEffect} from 'react';
import { TextField, Button, Box, Typography, Avatar, IconButton, Divider } from '@mui/material';
import { useAuth } from 'src/contexts/AuthContext';
import axios from 'axios';
// Import your API service

export  function ProfilePage() {
  const { user, setUser ,token} = useAuth(); // Get user details from AuthContext
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "",
    profile_image: "",
  });
  
  const [passwords, setPasswords] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });

  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);

  
  useEffect(() => {
    if (!user?.userID || !token) return; // Ensure user ID & token exist

    axios
      .get(`http://localhost:8000/view-profile/${user.userID}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((response) => {
        setFormData(response.data); // Set form data with API response
      })
      .catch((error) => {
        console.error("Failed to fetch user profile:", error);
      });
  }, [user, token]);
  // Handle form input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle password input change
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswords({ ...passwords, [e.target.name]: e.target.value });
  };

  // Handle profile image change
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProfileImageFile(file);
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  // Update Profile
  const handleUpdateProfile = async () => {
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('email', formData.email);
      if (profileImageFile) formDataToSend.append('profile_image', profileImageFile);

      const response = await axios.put(
        `http://localhost:8000/edit_profile/${user?.userID}`,
        formDataToSend,
        {
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
        }
      );
      const updatedUser = response.data; // Assuming API returns updated user data
      setFormData((prev) => ({
        ...prev,
        profile_image: updatedUser.profile_image,
      }));
    
     

    // ✅ Update user in AuthContext
    // setUser({
    //     userID: updatedUser.userID,
    //     name: updatedUser.name,
    //     email: updatedUser.email,
    //     role: updatedUser.role,
    //     profile_image: updatedUser.profile_image,
    //   });
    //   localStorage.setItem("user", JSON.stringify({ 
    //     name:updatedUser.name, 
    //     email: updatedUser.email, 
    //     role: updatedUser.role, 
    //     profile_image: updatedUser.profile_image, 
    //     userID:updatedUser.userID
    //   }));
  
   
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile.');
    }
  };

  const handleChangePassword = async () => {
    if (passwords.new_password !== passwords.confirm_password) {
      alert("New password and confirm password must match!");
      return;
    }
  
    try {
      const response = await axios.put(
        `http://localhost:8000/change-password/${user?.userID}`, // API endpoint
        {
          email:user?.email,
          current_password: passwords.current_password,
          new_password: passwords.new_password,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`, // Token for authorization
            "Content-Type": "application/json",
          },
        }
      );
  
      alert("Password changed successfully!");
    } catch (error) {
      console.error("Error changing password:", error);
      alert("Failed to change password.");
    }
  };


  return (
    <Box sx={{ maxWidth: 500, mx: 'auto', mt: 4, p: 3, borderRadius: 2, boxShadow: 3, backgroundColor: 'white' }}>
      <Typography variant="h5" fontWeight="bold" textAlign="center" mb={2}>
        User Profile
      </Typography>

      {/* Profile Image */}
      <Box textAlign="center" mb={2}>
        <Avatar
          src={previewImage || `http://localhost:8000${formData.profile_image}?t=${new Date().getTime()}`}
          sx={{ width: 80, height: 80, mx: 'auto', mb: 1 }}
        />
        <input type="file" accept="image/*" onChange={handleImageChange} />
      </Box>

      {/* User Details Form */}
      <TextField fullWidth label="Name" name="name" value={formData.name} onChange={handleChange} margin="dense" />
      <TextField fullWidth label="Email" name="email" value={formData.email} disabled margin="dense" />
      <TextField fullWidth label="Role" name="role" value={formData.role} disabled margin="dense" />

      <Button fullWidth variant="contained" color="primary" sx={{ mt: 2 }} onClick={handleUpdateProfile}>
        Update Profile
      </Button>

      <Divider sx={{ my: 3 }} />

      {/* Change Password Section */}
      <Typography variant="h6" textAlign="center" fontWeight="bold">
        Change Password
      </Typography>
      <TextField fullWidth label="Current Password" type="password" name="current_password" onChange={handlePasswordChange} margin="dense" />
      <TextField fullWidth label="New Password" type="password" name="new_password" onChange={handlePasswordChange} margin="dense" />
      <TextField fullWidth label="Confirm Password" type="password" name="confirm_password" onChange={handlePasswordChange} margin="dense" />

      <Button fullWidth variant="contained" color="error" sx={{ mt: 2 }} onClick={handleChangePassword}>
        Change Password
      </Button>
    </Box>
  );
}
