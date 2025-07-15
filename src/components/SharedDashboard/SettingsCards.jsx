import React, { useState, useEffect } from "react";
import {
  FiUser,
  FiKey,
  FiImage,
  FiBell,
  FiType,
  FiAlertCircle,
  FiSettings,
  FiMoon,
  FiGlobe,
  FiEyeOff,
  FiTrash2
} from "react-icons/fi";
import { toast } from "react-hot-toast";
import { auth, storage, db } from "../../firebase";
import { updateProfile, updateEmail, reauthenticateWithCredential, EmailAuthProvider, updatePassword, deleteUser } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { doc, updateDoc, getDoc, collection, getDocs, deleteDoc } from "firebase/firestore";
import { getUserData } from '../../firebase';
import { useNavigate } from "react-router-dom";
import profile from "../../assets/profile.jpeg";
import { useTheme } from '../../context/ThemeContext';
import Modal from '../Modal';

const mockAnnouncements = [
  { id: 1, title: "Welcome to Golden Generation!", date: "2024-06-01", content: "We are excited to have you on board." },
  { id: 2, title: "New Feature: Dark Mode", date: "2024-06-10", content: "You can now switch between light and dark themes in your settings." },
];

const SettingsCards = () => {
  // Modal states
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showProfilePicture, setShowProfilePicture] = useState(false);
  const [showFontSize, setShowFontSize] = useState(false);
  const [showAnnouncements, setShowAnnouncements] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showTheme, setShowTheme] = useState(false);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [reauthPassword, setReauthPassword] = useState("");
  const [showReauth, setShowReauth] = useState(false);
  const [pendingProfileData, setPendingProfileData] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(false);

  // Form states
  const [profileData, setProfileData] = useState({ name: "John Doe", username: "johndoe", phone: "", email: "john@example.com" });
  const [passwordData, setPasswordData] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [fontSize, setFontSize] = useState(16);
  const [notifications, setNotifications] = useState({ email: true, push: false });
  const [profilePic, setProfilePic] = useState(null);
  const [profilePicPreview, setProfilePicPreview] = useState(null);
  const [uploadingProfilePic, setUploadingProfilePic] = useState(false);
  const [currentProfilePic, setCurrentProfilePic] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const navigate = useNavigate();
  const [deletePassword, setDeletePassword] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);

  const { theme, setTheme } = useTheme();

  // Fetch preferences on mount
  useEffect(() => {
    const fetchPreferences = async () => {
      const user = auth.currentUser;
      if (!user) return;
      try {
        const userDoc = await getUserData(user.uid);
        const prefs = userDoc?.preferences || {};
        if (prefs.fontSize) setFontSize(Number(prefs.fontSize));
        if (prefs.theme) setTheme(prefs.theme);
        if (prefs.notifications) setNotifications(prefs.notifications);
      } catch (err) {
        // ignore if not logged in
      }
    };
    fetchPreferences();
    // eslint-disable-next-line
  }, []);

  // Font size effect
  useEffect(() => {
    document.documentElement.style.fontSize = fontSize + "px";
  }, [fontSize]);

  // Theme effect and persistence
  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
      document.body.style.background = "#18181b";
    } else {
      document.documentElement.classList.remove("dark");
      document.body.style.background = "#f9fafb";
    }
  }, [theme]);

  // Fetch current profile picture
  useEffect(() => {
    const fetchCurrentProfilePic = async () => {
      const user = auth.currentUser;
      if (!user) return;
      try {
        const userDoc = await getUserData(user.uid);
        if (userDoc?.personalDetails?.photoURL) {
          setCurrentProfilePic(userDoc.personalDetails.photoURL);
        }
      } catch (err) {
        console.error("Error fetching profile picture:", err);
      }
    };
    fetchCurrentProfilePic();
  }, []);

  // Handlers
  const handleOpenEditProfile = async () => {
    setLoadingProfile(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Not logged in");
      const userDoc = await getUserData(user.uid);
      setProfileData({
        name: userDoc?.personalDetails?.name || "",
        username: userDoc?.credentials?.username || "",
        phone: userDoc?.personalDetails?.phoneNumber || "",
        email: userDoc?.credentials?.email || user.email || ""
      });
      setShowEditProfile(true);
    } catch (err) {
      toast.error("Failed to load profile");
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return toast.error("Not logged in");
    try {
      // If email changed, require re-auth
      if (profileData.email !== user.email) {
        setPendingProfileData({ ...profileData });
        setShowReauth(true);
        return;
      }
      await updateFirestoreProfile(user.uid, profileData);
      toast.success("Profile updated");
      setShowEditProfile(false);
    } catch (err) {
      toast.error(err.message || "Failed to update profile");
    }
  };

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return toast.error("Not logged in");
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    try {
      // Re-authenticate
      const cred = EmailAuthProvider.credential(user.email, passwordData.currentPassword);
      await reauthenticateWithCredential(user, cred);
      await updatePassword(user, passwordData.newPassword);
      toast.success("Password updated successfully");
      setShowChangePassword(false);
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      toast.error(err.message || "Failed to update password");
    }
  };
  const handleProfilePicChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      toast.error('Please upload a valid image file (JPG, JPEG, PNG, or GIF)');
      return;
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      toast.error('File size must be less than 5MB');
      return;
    }

    setProfilePic(file);
    setProfilePicPreview(URL.createObjectURL(file));
  };

  const uploadToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);
    formData.append('cloud_name', import.meta.env.VITE_CLOUDINARY_CLOUD_NAME);

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      return data.secure_url;
    } catch (error) {
      console.error('Error uploading to Cloudinary:', error);
      throw error;
    }
  };

  const handleProfilePicSave = async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return toast.error("Not logged in");
    if (!profilePic) return toast.error("Please select a picture");

    setUploadingProfilePic(true);
    setUploadProgress(0);

    try {
      // Upload to Cloudinary
      const imageUrl = await uploadToCloudinary(profilePic);
      
      // Update Auth
      await updateProfile(user, { photoURL: imageUrl });

      // Update Firestore
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, { 
        "personalDetails.photoURL": imageUrl,
        "personalDetails.lastProfileUpdate": Date.now()
      });

      // Update local state
      setCurrentProfilePic(imageUrl);
      toast.success("Profile picture updated successfully");
      setShowProfilePicture(false);
      setProfilePic(null);
      setProfilePicPreview(null);
    } catch (err) {
      console.error("Error updating profile picture:", err);
      toast.error(err.message || "Failed to update profile picture");
    } finally {
      setUploadingProfilePic(false);
      setUploadProgress(0);
    }
  };
  const handleFontSizeChange = (size) => {
    if (size < 2) size = 2;
    if (size > 40) size = 40;
    setFontSize(size);
    updatePreference("fontSize", size);
    toast.success("Font size updated");
  };
  const handleThemeChange = (mode) => {
    setTheme(mode);
    updatePreference("theme", mode);
    toast.success(`Theme set to ${mode}`);
    setShowTheme(false);
  };
  const handleNotificationsChange = (field) => {
    const newNotifications = { ...notifications, [field]: !notifications[field] };
    setNotifications(newNotifications);
    updatePreference("notifications", newNotifications);
    toast.success("Notification preference updated");
  };
  const handleDeleteAccount = async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return toast.error("Not logged in");
    if (deleteConfirm !== "DELETE") return toast.error("Type DELETE to confirm");
    if (!deletePassword) return toast.error("Enter your password");
    try {
      // Re-authenticate
      const cred = EmailAuthProvider.credential(user.email, deletePassword);
      await reauthenticateWithCredential(user, cred);

      // Delete Firestore user document first
      await deleteDoc(doc(db, "users", user.uid));
      
      // Delete Auth user
      await deleteUser(user);
      
      toast.success("Account deleted successfully");
      setShowDeleteAccount(false);
      setDeleteConfirm("");
      setDeletePassword("");
      navigate("/login");
    } catch (err) {
      console.error("Error deleting account:", err);
      if (err.code === 'auth/requires-recent-login') {
        toast.error("Please log out and log in again before deleting your account");
      } else {
        toast.error(err.message || "Failed to delete account");
      }
    }
  };

  // Update Firestore profile helper
  const updateFirestoreProfile = async (uid, data) => {
    const userRef = doc(db, "users", uid);
    await updateDoc(userRef, {
      "credentials.username": data.username,
      "credentials.email": data.email,
      "personalDetails.phoneNumber": data.phone,
      "personalDetails.name": data.name
    });
  };

  // Handle re-auth and email update
  const handleReauthAndSave = async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user || !pendingProfileData) return;
    try {
      const cred = EmailAuthProvider.credential(user.email, reauthPassword);
      await reauthenticateWithCredential(user, cred);
      await updateEmail(user, pendingProfileData.email);
      await updateFirestoreProfile(user.uid, pendingProfileData);
      toast.success("Profile and email updated");
      setShowReauth(false);
      setShowEditProfile(false);
      setPendingProfileData(null);
      setReauthPassword("");
    } catch (err) {
      toast.error(err.message || "Re-authentication failed");
    }
  };

  // Helper to update preferences in Firestore
  const updatePreference = async (field, value) => {
    const user = auth.currentUser;
    if (!user) return toast.error("Not logged in");
    try {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, { [`preferences.${field}`]: value });
    } catch (err) {
      toast.error("Failed to save preference");
    }
  };

  // Fetch announcements when modal opens
  const handleOpenAnnouncements = async () => {
    setShowAnnouncements(true);
    setLoadingAnnouncements(true);
    try {
      const snap = await getDocs(collection(db, "announcements"));
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAnnouncements(list);
    } catch (err) {
      setAnnouncements([]);
    } finally {
      setLoadingAnnouncements(false);
    }
  };

  // Move settingsOptions array here, after all handler functions
  const settingsOptions = [
    {
      label: "Edit Profile",
      description: "Update your name, username, phone, and email",
      icon: <FiUser className="text-2xl" />,
      onClick: handleOpenEditProfile,
    },
    {
      label: "Change Password",
      description: "Update your account password",
      icon: <FiKey className="text-2xl" />,
      onClick: () => setShowChangePassword(true),
    },
    {
      label: "Profile Picture",
      description: "Update your profile picture",
      icon: <FiImage className="text-2xl" />,
      onClick: () => setShowProfilePicture(true),
    },
    {
      label: "Font Size",
      description: "Adjust the text size (Normal / Large / Extra large)",
      icon: <FiType className="text-2xl" />,
      onClick: () => setShowFontSize(true),
    },
    {
      label: "System Announcements",
      description: "View important system updates and announcements",
      icon: <FiAlertCircle className="text-2xl" />,
      onClick: handleOpenAnnouncements,
    },
    {
      label: "Notifications",
      description: "Manage your notification preferences",
      icon: <FiBell className="text-2xl" />,
      onClick: () => setShowNotifications(true),
    },
    {
      label: "Theme",
      description: "Switch between light and dark mode",
      icon: <FiMoon className="text-2xl" />,
      onClick: () => setShowTheme(true),
    },
    {
      label: "Delete Account",
      description: "Permanently delete your account",
      icon: <FiTrash2 className={`text-2xl ${theme === 'dark' ? 'text-red-400' : 'text-red-500'}`} />,
      onClick: () => setShowDeleteAccount(true),
    },
    {
      label: "Edit Sign-Up Data",
      description: "Edit all information entered during sign-up",
      icon: <FiSettings className="text-2xl" />,
      onClick: () => navigate("/edit-signup-data"),
    },
  ];

  return (
    <div className="space-y-8">
      {/* Responsive Settings Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 lg:gap-8 px-2 sm:px-0">
        {settingsOptions.map((option, index) => (
          <div
            key={index}
            onClick={option.onClick}
            className={`flex flex-col items-start border rounded-xl p-4 sm:p-6 shadow-lg cursor-pointer hover:shadow-2xl transition-all min-h-[120px] group w-full h-full
              ${theme === 'dark' 
                ? 'bg-gray-800 border-gray-700 hover:border-yellow-500 text-white' 
                : 'bg-white border-gray-200 hover:border-yellow-400 text-gray-900'}`}
          >
            <div className={`mb-3 ${theme === 'dark' ? 'text-yellow-400' : 'text-yellow-500'} group-hover:scale-110 transition-transform`}>
              {option.icon}
            </div>
            <div>
              <h3 className={`font-semibold text-base sm:text-lg mb-1 transition-colors ${
                theme === 'dark' 
                  ? 'group-hover:text-yellow-400' 
                  : 'group-hover:text-yellow-600'
              }`}>
                {option.label}
              </h3>
              <p className={`text-xs sm:text-sm ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
              }`}>
                {option.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Profile Modal */}
      {showEditProfile && (
        <Modal onClose={() => setShowEditProfile(false)} title="Edit Profile">
          {loadingProfile && (
            <div className="flex justify-center items-center mb-4">
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-yellow-500"></div>
            </div>
          )}
          {showReauth && (
            <form onSubmit={handleReauthAndSave} className="space-y-4">
              <input 
                type="password" 
                className={`w-full p-2 border rounded ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300'
                }`}
                placeholder="Re-authenticate with current password" 
                value={reauthPassword} 
                onChange={e => setReauthPassword(e.target.value)} 
                required 
              />
              <div className="flex justify-end gap-2">
                <button 
                  type="button" 
                  onClick={() => setShowReauth(false)} 
                  className={`px-4 py-2 rounded ${
                    theme === 'dark' 
                      ? 'bg-gray-700 text-white hover:bg-gray-600' 
                      : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 rounded bg-yellow-500 text-white hover:bg-yellow-600"
                >
                  Re-authenticate
                </button>
              </div>
            </form>
          )}
          {!showReauth && (
            <form onSubmit={handleProfileSave} className="space-y-4">
              <input 
                type="text" 
                className={`w-full p-2 border rounded ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300'
                }`}
                placeholder="Name" 
                value={profileData.name} 
                onChange={e => setProfileData({ ...profileData, name: e.target.value })} 
                required 
              />
              <input 
                type="text" 
                className={`w-full p-2 border rounded ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300'
                }`}
                placeholder="Username" 
                value={profileData.username} 
                onChange={e => setProfileData({ ...profileData, username: e.target.value })} 
                required 
              />
              <input 
                type="tel" 
                className={`w-full p-2 border rounded ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300'
                }`}
                placeholder="Phone" 
                value={profileData.phone} 
                onChange={e => setProfileData({ ...profileData, phone: e.target.value })} 
              />
              <input 
                type="email" 
                className={`w-full p-2 border rounded ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300'
                }`}
                placeholder="Email" 
                value={profileData.email} 
                onChange={e => setProfileData({ ...profileData, email: e.target.value })} 
                required 
              />
              <div className="flex justify-end gap-2">
                <button 
                  type="button" 
                  onClick={() => setShowEditProfile(false)} 
                  className={`px-4 py-2 rounded ${
                    theme === 'dark' 
                      ? 'bg-gray-700 text-white hover:bg-gray-600' 
                      : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 rounded bg-yellow-500 text-white hover:bg-yellow-600"
                >
                  Save
                </button>
              </div>
            </form>
          )}
        </Modal>
      )}
      {/* Change Password Modal */}
      {showChangePassword && (
        <Modal onClose={() => setShowChangePassword(false)} title="Change Password">
          <form onSubmit={handlePasswordSave} className="space-y-4">
            <input 
              type="password" 
              className={`w-full p-2 border rounded ${
                theme === 'dark' 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300'
              }`}
              placeholder="Current Password" 
              value={passwordData.currentPassword} 
              onChange={e => setPasswordData({ ...passwordData, currentPassword: e.target.value })} 
              required 
            />
            <input 
              type="password" 
              className={`w-full p-2 border rounded ${
                theme === 'dark' 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300'
              }`}
              placeholder="New Password" 
              value={passwordData.newPassword} 
              onChange={e => setPasswordData({ ...passwordData, newPassword: e.target.value })} 
              required 
            />
            <input 
              type="password" 
              className={`w-full p-2 border rounded ${
                theme === 'dark' 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300'
              }`}
              placeholder="Confirm New Password" 
              value={passwordData.confirmPassword} 
              onChange={e => setPasswordData({ ...passwordData, confirmPassword: e.target.value })} 
              required 
            />
            <div className="flex justify-end gap-2">
              <button 
                type="button" 
                onClick={() => setShowChangePassword(false)} 
                className={`px-4 py-2 rounded ${
                  theme === 'dark' 
                    ? 'bg-gray-700 text-white hover:bg-gray-600' 
                    : 'bg-gray-200 hover:bg-gray-300'
                }`}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="px-4 py-2 rounded bg-yellow-500 text-white hover:bg-yellow-600"
              >
                Change
              </button>
            </div>
          </form>
        </Modal>
      )}
      {/* Profile Picture Modal */}
      {showProfilePicture && (
        <Modal onClose={() => setShowProfilePicture(false)} title="Update Profile Picture">
          <form onSubmit={handleProfilePicSave} className="space-y-6">
            {/* Current Profile Picture */}
            <div className="flex flex-col items-center">
              <div className="relative w-32 h-32 mb-4">
                <img 
                  src={currentProfilePic || profile} 
                  alt="Current Profile" 
                  className="w-full h-full rounded-full object-cover border-2 border-yellow-500"
                />
              </div>
              <p className={`text-sm mb-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                Current Profile Picture
              </p>
            </div>

            {/* File Upload Section */}
            <div className="space-y-4">
              <div className="flex flex-col items-center justify-center w-full">
                <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer ${
                  theme === 'dark' 
                    ? 'border-gray-600 bg-gray-700 hover:bg-gray-600' 
                    : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
                }`}>
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <FiImage className={`w-8 h-8 mb-3 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-400'}`} />
                    <p className={`mb-2 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                      <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                      PNG, JPG, JPEG or GIF (MAX. 5MB)
                    </p>
                  </div>
                  <input 
                    type="file" 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleProfilePicChange}
                  />
                </label>
              </div>

              {/* Upload Progress */}
              {uploadingProfilePic && (
                <div className={`w-full rounded-full h-2.5 ${
                  theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
                }`}>
                  <div 
                    className="bg-yellow-500 h-2.5 rounded-full transition-all duration-300" 
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              )}

              {/* Preview Section */}
              {profilePicPreview && (
                <div className="flex flex-col items-center">
                  <div className="relative w-32 h-32">
                    <img 
                      src={profilePicPreview} 
                      alt="Preview" 
                      className="w-full h-full rounded-full object-cover border-2 border-yellow-500"
                    />
                  </div>
                  <p className={`text-sm mt-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                    New Profile Picture Preview
                  </p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-2">
              <button 
                type="button" 
                onClick={() => setShowProfilePicture(false)} 
                className={`px-4 py-2 rounded ${
                  theme === 'dark' 
                    ? 'bg-gray-700 text-white hover:bg-gray-600' 
                    : 'bg-gray-200 hover:bg-gray-300'
                }`}
                disabled={uploadingProfilePic}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="px-4 py-2 rounded bg-yellow-500 text-white hover:bg-yellow-600 flex items-center gap-2"
                disabled={!profilePic || uploadingProfilePic}
              >
                {uploadingProfilePic ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Uploading...
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </form>
        </Modal>
      )}
      {/* Font Size Modal */}
      {showFontSize && (
        <Modal onClose={() => setShowFontSize(false)} title="Font Size">
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleFontSizeChange(fontSize - 1)}
                className={`px-3 py-1 rounded text-xl font-bold transition ${
                  theme === 'dark' 
                    ? 'bg-gray-700 text-white hover:bg-gray-600' 
                    : 'bg-gray-200 hover:bg-yellow-400'
                }`}
                disabled={fontSize <= 2}
              >
                –
              </button>
              <input
                type="number"
                min={2}
                max={40}
                value={fontSize}
                onChange={e => handleFontSizeChange(Number(e.target.value))}
                className={`w-16 text-center border rounded p-2 text-lg font-semibold ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300'
                }`}
              />
              <button
                onClick={() => handleFontSizeChange(fontSize + 1)}
                className={`px-3 py-1 rounded text-xl font-bold transition ${
                  theme === 'dark' 
                    ? 'bg-gray-700 text-white hover:bg-gray-600' 
                    : 'bg-gray-200 hover:bg-yellow-400'
                }`}
                disabled={fontSize >= 40}
              >
                +
              </button>
            </div>
            <div className="flex flex-wrap gap-2 justify-center mt-2">
              {[
                { label: "Small", size: 12 },
                { label: "Medium", size: 16 },
                { label: "Large", size: 20 }
              ].map(option => (
                <button
                  key={option.label}
                  onClick={() => handleFontSizeChange(option.size)}
                  className={`px-3 py-1 rounded border ${
                    fontSize === option.size 
                      ? "bg-yellow-500 text-white border-yellow-500" 
                      : theme === 'dark'
                        ? "bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                        : "bg-white border-gray-300 hover:bg-yellow-100"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <div className={`mt-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`} style={{ fontSize: fontSize }}>
              Live preview: The quick brown fox jumps over the lazy dog.
            </div>
          </div>
        </Modal>
      )}
      {/* Announcements Modal */}
      {showAnnouncements && (
        <Modal onClose={() => setShowAnnouncements(false)} title="System Announcements">
          {loadingAnnouncements ? (
            <div className="flex justify-center items-center mb-4">
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-yellow-500"></div>
            </div>
          ) : (
            <ul className="space-y-4">
              {announcements.map(a => (
                <li key={a.id} className={`border-b pb-2 ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                  <div className={`font-semibold ${theme === 'dark' ? 'text-yellow-400' : 'text-yellow-700'}`}>
                    {a.title}
                  </div>
                  <div className={`text-xs mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-400'}`}>
                    {a.date}
                  </div>
                  <div className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    {a.content}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Modal>
      )}
      {/* Notifications Modal */}
      {showNotifications && (
        <Modal onClose={() => setShowNotifications(false)} title="Notifications">
          <div className="space-y-4">
            <label className={`flex items-center gap-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-900'}`}>
              <input 
                type="checkbox" 
                checked={notifications.email} 
                onChange={() => handleNotificationsChange("email")} 
                className={theme === 'dark' ? 'bg-gray-700 border-gray-600' : ''}
              />
              Email Notifications
            </label>
            <label className={`flex items-center gap-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-900'}`}>
              <input 
                type="checkbox" 
                checked={notifications.push} 
                onChange={() => handleNotificationsChange("push")} 
                className={theme === 'dark' ? 'bg-gray-700 border-gray-600' : ''}
              />
              Push Notifications
            </label>
          </div>
        </Modal>
      )}
      {/* Theme Modal */}
      {showTheme && (
        <Modal onClose={() => setShowTheme(false)} title="Theme">
          <div className="space-y-3">
            <button 
              onClick={() => handleThemeChange("light")} 
              className={`w-full p-2 rounded transition-colors ${
                theme === "light" 
                  ? "bg-yellow-500 text-white" 
                  : theme === "dark" 
                    ? "bg-gray-700 text-white hover:bg-gray-600" 
                    : "bg-gray-100 hover:bg-gray-200"
              }`}
            >
              Light
            </button>
            <button 
              onClick={() => handleThemeChange("dark")} 
              className={`w-full p-2 rounded transition-colors ${
                theme === "dark" 
                  ? "bg-yellow-500 text-white" 
                  : theme === "light" 
                    ? "bg-gray-700 text-white hover:bg-gray-600" 
                    : "bg-gray-100 hover:bg-gray-200"
              }`}
            >
              Dark
            </button>
          </div>
        </Modal>
      )}
      {/* Delete Account Modal */}
      {showDeleteAccount && (
        <Modal onClose={() => setShowDeleteAccount(false)} title="Delete Account">
          <form onSubmit={handleDeleteAccount} className="space-y-4">
            <div className={`text-red-600 font-semibold ${theme === 'dark' ? 'text-red-400' : ''}`}>
              This action is irreversible. Type <b>DELETE</b> to confirm.
            </div>
            <input 
              type="text"
              className={`w-full p-2 border rounded ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
              placeholder="Type DELETE to confirm"
              value={deleteConfirm}
              onChange={e => setDeleteConfirm(e.target.value)}
              required
            />
            <input 
              type="password" 
              className={`w-full p-2 border rounded ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
              placeholder="Enter your password" 
              value={deletePassword} 
              onChange={e => setDeletePassword(e.target.value)} 
            />
            <div className="flex justify-end gap-2">
              <button 
                type="button" 
                onClick={() => setShowDeleteAccount(false)} 
                className={`px-4 py-2 rounded ${
                  theme === 'dark' 
                    ? 'bg-gray-700 text-white hover:bg-gray-600' 
                    : 'bg-gray-200 hover:bg-gray-300'
                }`}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="px-4 py-2 rounded bg-red-500 text-white hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default SettingsCards;
