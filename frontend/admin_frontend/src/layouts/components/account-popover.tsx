import { useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Popover from '@mui/material/Popover';
import Divider from '@mui/material/Divider';
import MenuList from '@mui/material/MenuList';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import MenuItem, { menuItemClasses } from '@mui/material/MenuItem';
import { useAuth } from 'src/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useRouter, usePathname } from 'src/routes/hooks';

type AccountPopoverProps = {
  data: { label: string; href: string; icon: React.ReactNode }[];
};

export function AccountPopover({ data }: AccountPopoverProps) {
  const { user, token, logout } = useAuth(); // Get user & token from AuthContext
  const navigate = useNavigate();
  const router = useRouter();
  const pathname = usePathname();

  const [openPopover, setOpenPopover] = useState<HTMLButtonElement | null>(null);
  const [userData, setUserData] = useState({
    name: '',
    email: '',
    profile_image: '',
  });

  // Fetch user profile from API
  useEffect(() => {
    if (!user?.userID || !token) return; // Ensure user ID & token exist

    axios
      .get(`http://localhost:8000/view-profile/${user.userID}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((response) => {
        setUserData(response.data); // Set user data with API response
      })
      .catch((error) => {
        console.error("Failed to fetch user profile:", error);
      });
  }, [user, token]); // Runs when userID or token changes

  const handleOpenPopover = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    setOpenPopover(event.currentTarget);
  }, []);

  const handleClosePopover = useCallback(() => {
    setOpenPopover(null);
  }, []);

  const handleClickItem = useCallback(
    (path: string) => {
      handleClosePopover();
      router.push(path);
    },
    [handleClosePopover, router]
  );

  // Logout function
  const handleLogout = () => {
    handleClosePopover();
    logout();
    navigate('/admin/sign-in', { replace: true });
  };

  return (
    <>
      <IconButton
        onClick={handleOpenPopover}
        sx={{
          p: '2px',
          width: 40,
          height: 40,
          background: (theme) =>
            `conic-gradient(${theme.vars.palette.primary.light}, ${theme.vars.palette.warning.light}, ${theme.vars.palette.primary.light})`,
        }}
      >
        <Avatar 
          src={userData.profile_image ? `http://localhost:8000${userData.profile_image}?t=${new Date().getTime()}` : "/default-avatar.png"}
          alt={userData.name}
          sx={{ width: 40, height: 40 }}
        >
          {!userData.profile_image && userData.name?.charAt(0).toUpperCase()}
        </Avatar>
      </IconButton>

      <Popover
        open={!!openPopover}
        anchorEl={openPopover}
        onClose={handleClosePopover}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: {
            sx: { width: 200 },
          },
        }}
      >
        <Box sx={{ p: 2, pb: 1.5 }}>
          <Typography variant="subtitle2" noWrap>
            {userData.name || "Unknown User"}
          </Typography>

          <Typography variant="body2" sx={{ color: 'text.secondary' }} noWrap>
            {userData.email || "No Email"}
          </Typography>
        </Box>

        <Divider sx={{ borderStyle: 'dashed' }} />

        <MenuList
          disablePadding
          sx={{
            p: 1,
            gap: 0.5,
            display: 'flex',
            flexDirection: 'column',
            [`& .${menuItemClasses.root}`]: {
              px: 1,
              gap: 2,
              borderRadius: 0.75,
              color: 'text.secondary',
              '&:hover': { color: 'text.primary' },
              [`&.${menuItemClasses.selected}`]: {
                color: 'text.primary',
                bgcolor: 'action.selected',
                fontWeight: 'fontWeightSemiBold',
              },
            },
          }}
        >
          <MenuItem selected={pathname === "/admin/profile"} onClick={() => handleClickItem("/admin/profile")}>
            Profile
          </MenuItem>
        </MenuList>

        <Divider sx={{ borderStyle: 'dashed' }} />

        {/* Logout Button */}
        <Box sx={{ p: 1 }}>
          <Button fullWidth color="error" size="medium" variant="text" onClick={handleLogout}>
            Logout
          </Button>
        </Box>
      </Popover>
    </>
  );
}
