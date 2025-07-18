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
import { useTranslation } from 'react-i18next';
import { FaEnvelope, FaUser, FaPhone, FaInfoCircle } from 'react-icons/fa';

const SettingsCards = () => {
  // Modal states
  const { t } = useTranslation();
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

  // Add field objects for form fields to prevent ReferenceError
  const emailField = {
    value: profileData.email || '',
    error: '',
    isChecking: false,
    onChange: () => {},
  };
  const usernameField = {
    value: profileData.username || '',
    error: '',
    isChecking: false,
    onChange: () => {},
  };
  const phoneField = {
    value: profileData.phone || '',
    error: '',
    isChecking: false,
    onChange: () => {},
  };
  // Add a simple isValid check for required fields
  const isValid = !!(profileData.email && profileData.username && profileData.phone && profileData.name);

  // Move mockAnnouncements here so t is in scope
  const mockAnnouncements = [
    { id: 1, title: t('auth.dashboard.settings.announcements.welcome.title'), date: "2024-06-01", content: t('auth.dashboard.settings.announcements.welcome.content') },
    { id: 2, title: t('auth.dashboard.settings.announcements.darkMode.title'), date: "2024-06-10", content: t('auth.dashboard.settings.announcements.darkMode.content') },
  ];

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
      toast.error(t('auth.dashboard.settings.toast.failedToLoadProfile'));
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return toast.error(t('auth.dashboard.settings.toast.notLoggedIn'));
    try {
      // If email changed, require re-auth
      if (profileData.email !== user.email) {
        setPendingProfileData({ ...profileData });
        setShowReauth(true);
        return;
      }
      await updateFirestoreProfile(user.uid, profileData);
      toast.success(t('auth.dashboard.settings.toast.profileUpdated'));
      setShowEditProfile(false);
    } catch (err) {
      toast.error(err.message || t('auth.dashboard.settings.toast.failedToUpdateProfile'));
    }
  };

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return toast.error(t('auth.dashboard.settings.toast.notLoggedIn'));
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error(t('auth.dashboard.settings.toast.passwordsDoNotMatch'));
      return;
    }
    try {
      // Re-authenticate
      const cred = EmailAuthProvider.credential(user.email, passwordData.currentPassword);
      await reauthenticateWithCredential(user, cred);
      await updatePassword(user, passwordData.newPassword);
      toast.success(t('auth.dashboard.settings.toast.passwordUpdatedSuccessfully'));
      setShowChangePassword(false);
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      toast.error(err.message || t('auth.dashboard.settings.toast.failedToUpdatePassword'));
    }
  };
  const handleProfilePicChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      toast.error(t('auth.dashboard.settings.toast.invalidImageFile'));
      return;
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      toast.error(t('auth.dashboard.settings.toast.fileSizeTooLarge'));
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
        throw new Error(t('auth.dashboard.settings.profilePicture.uploadFailed'));
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
    if (!user) return toast.error(t('auth.dashboard.settings.toast.notLoggedIn'));
    if (!profilePic) return toast.error(t('auth.dashboard.settings.toast.pleaseSelectPicture'));

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
      toast.success(t('auth.dashboard.settings.toast.profilePictureUpdatedSuccessfully'));
      setShowProfilePicture(false);
      setProfilePic(null);
      setProfilePicPreview(null);
    } catch (err) {
      console.error("Error updating profile picture:", err);
      toast.error(err.message || t('auth.dashboard.settings.toast.failedToUpdateProfilePicture'));
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
    toast.success(t('auth.dashboard.settings.toast.fontSizeUpdated'));
  };
  const handleThemeChange = (mode) => {
    setTheme(mode);
    updatePreference("theme", mode);
    toast.success(t('auth.dashboard.settings.toast.themeSetTo', { mode: mode }));
    setShowTheme(false);
  };
  const handleNotificationsChange = (field) => {
    const newNotifications = { ...notifications, [field]: !notifications[field] };
    setNotifications(newNotifications);
    updatePreference("notifications", newNotifications);
    toast.success(t('auth.dashboard.settings.toast.notificationPreferenceUpdated'));
  };
  const handleDeleteAccount = async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return toast.error(t('auth.dashboard.settings.toast.notLoggedIn'));
    if (deleteConfirm !== "DELETE") return toast.error(t('auth.dashboard.settings.toast.typeDeleteToConfirm'));
    if (!deletePassword) return toast.error(t('auth.dashboard.settings.toast.enterPassword'));
    try {
      // Re-authenticate
      const cred = EmailAuthProvider.credential(user.email, deletePassword);
      await reauthenticateWithCredential(user, cred);

      // Delete Firestore user document first
      await deleteDoc(doc(db, "users", user.uid));
      
      // Delete Auth user
      await deleteUser(user);
      
      toast.success(t('auth.dashboard.settings.toast.accountDeletedSuccessfully'));
      setShowDeleteAccount(false);
      setDeleteConfirm("");
      setDeletePassword("");
      navigate("/login");
    } catch (err) {
      console.error("Error deleting account:", err);
      if (err.code === 'auth/requires-recent-login') {
        toast.error(t('auth.dashboard.settings.toast.pleaseLogOutAndLogInAgain'));
      } else {
        toast.error(err.message || t('auth.dashboard.settings.toast.failedToDeleteAccount'));
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
      toast.success(t('auth.dashboard.settings.toast.profileAndEmailUpdated'));
      setShowReauth(false);
      setShowEditProfile(false);
      setPendingProfileData(null);
      setReauthPassword("");
    } catch (err) {
      toast.error(err.message || t('auth.dashboard.settings.toast.reAuthenticationFailed'));
    }
  };

  // Helper to update preferences in Firestore
  const updatePreference = async (field, value) => {
    const user = auth.currentUser;
    if (!user) return toast.error(t('auth.dashboard.settings.toast.notLoggedIn'));
    try {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, { [`preferences.${field}`]: value });
    } catch (err) {
      toast.error(t('auth.dashboard.settings.toast.failedToSavePreference'));
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
      label: t('auth.dashboard.settings.options.editProfile'),
      description: t('auth.dashboard.settings.options.editProfileDesc'),
      icon: <FiUser className="text-2xl" />,
      onClick: handleOpenEditProfile,
    },
    {
      label: t('auth.dashboard.settings.options.changePassword'),
      description: t('auth.dashboard.settings.options.changePasswordDesc'),
      icon: <FiKey className="text-2xl" />,
      onClick: () => setShowChangePassword(true),
    },
    {
      label: t('auth.dashboard.settings.options.profilePicture'),
      description: t('auth.dashboard.settings.options.profilePictureDesc'),
      icon: <FiImage className="text-2xl" />,
      onClick: () => setShowProfilePicture(true),
    },
    {
      label: t('auth.dashboard.settings.options.fontSize'),
      description: t('auth.dashboard.settings.options.fontSizeDesc'),
      icon: <FiType className="text-2xl" />,
      onClick: () => setShowFontSize(true),
    },
    {
      label: t('auth.dashboard.settings.options.systemAnnouncements'),
      description: t('auth.dashboard.settings.options.systemAnnouncementsDesc'),
      icon: <FiAlertCircle className="text-2xl" />,
      onClick: handleOpenAnnouncements,
    },
    {
      label: t('auth.dashboard.settings.options.notifications'),
      description: t('auth.dashboard.settings.options.notificationsDesc'),
      icon: <FiBell className="text-2xl" />,
      onClick: () => setShowNotifications(true),
    },
    {
      label: t('auth.dashboard.settings.options.theme'),
      description: t('auth.dashboard.settings.options.themeDesc'),
      icon: <FiMoon className="text-2xl" />,
      onClick: () => setShowTheme(true),
    },
    {
      label: t('auth.dashboard.settings.options.deleteAccount'),
      description: t('auth.dashboard.settings.options.deleteAccountDesc'),
      icon: <FiTrash2 className={`text-2xl ${theme === 'dark' ? 'text-red-400' : 'text-red-500'}`} />,
      onClick: () => setShowDeleteAccount(true),
    },
    {
      label: t('auth.dashboard.settings.options.editUserInfo'),
      description: t('auth.dashboard.settings.options.editUserInfoDesc'),
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
        <div
          className="fixed inset-0 flex items-center justify-center z-50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-profile-title"
        >
          <div className="fixed inset-0 bg-black bg-opacity-30 z-40"></div>
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md relative z-50">
            <button
              className="absolute top-5 right-5 text-2xl text-gray-400 hover:text-gray-600"
              onClick={() => setShowEditProfile(false)}
              aria-label={t('common.close')}
            >
              &times;
            </button>
            <h2
              id="edit-profile-title"
              className="text-2xl font-bold mb-8 text-yellow-600 text-left"
            >
              {t('auth.dashboard.settings.modals.editProfile')}
            </h2>
            
            {loadingProfile && (
              <div className="flex justify-center items-center mb-4">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-yellow-500"></div>
              </div>
            )}
            
            {showReauth && (
              <form onSubmit={handleReauthAndSave} className="flex flex-col gap-4">
                <div className="relative">
                  <label htmlFor="reauth-password" className="text-sm font-medium">{t('auth.dashboard.settings.placeholders.currentPassword')}</label>
                  <PasswordInput
                    id="reauth-password"
                    value={reauthPassword}
                    onChange={e => setReauthPassword(e.target.value)}
                    className="w-full pl-3 pr-3 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition"
                    placeholder={t('auth.dashboard.settings.placeholders.reauthPassword')}
                    autoComplete="current-password"
                    required
                  />
                </div>
                <div className="flex justify-end gap-3 mt-8">
                  <button
                    type="button"
                    onClick={() => setShowReauth(false)}
                    className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg font-semibold hover:bg-gray-200"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    type="submit"
                    className="bg-yellow-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-yellow-600"
                  >
                    {t('auth.dashboard.settings.buttons.reauthenticate')}
                  </button>
                </div>
              </form>
            )}
            
            {!showReauth && (
              <form onSubmit={handleProfileSave} className="flex flex-col gap-4">
                {/* Auto-save status indicator */}
                <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                  <span>{t('auth.dashboard.settings.options.autoSaveEnabled')}</span>
                  <div className="flex items-center gap-2">
                    {/* autoSaving and lastSaved are not defined in this component, so this block will be removed or commented out */}
                    {/* {autoSaving && (
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
                        <span>Saving...</span>
                      </div>
                    )} */}
                    {/* {lastSaved && !autoSaving && (
                      <div className="flex items-center gap-1 text-green-600">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span>Saved {lastSaved.toLocaleTimeString()}</span>
                      </div>
                    )} */}
                  </div>
                </div>

                <div className="relative">
                  <label htmlFor="profile-email" className="text-sm font-medium">{t('auth.dashboard.settings.placeholders.email')}</label>
                  <FaEnvelope className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg" />
                  <input
                    id="profile-email"
                    name="email"
                    type="email"
                    placeholder="Email"
                    value={emailField.value}
                    onChange={(e) => emailField.onChange(e.target.value)}
                    onBlur={() => {}}
                    className={`pl-11 pr-3 py-3 rounded-lg border border-gray-300 w-full placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition
                      ${emailField.error ? 'border-red-500' : emailField.value ? 'border-green-500' : 'border-gray-300'}`}
                    aria-label="Profile Email"
                  />
                </div>
                {emailField.isChecking && (
                  <span className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                    <FaInfoCircle className="flex-shrink-0" />{t('auth.dashboard.settings.checking')}
                  </span>
                )}
                {emailField.error && (
                  <span className="text-red-500 text-xs flex items-center gap-1 mt-1">
                    <FaInfoCircle className="flex-shrink-0" />
                    {emailField.error}
                  </span>
                )}

                <div className="relative">
                  <label htmlFor="profile-username" className="text-sm font-medium">{t('auth.dashboard.settings.placeholders.username')}</label>
                  <FaUser className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg" />
                  <input
                    id="profile-username"
                    name="username"
                    type="text"
                    placeholder="Username"
                    value={usernameField.value}
                    onChange={(e) => usernameField.onChange(e.target.value)}
                    onBlur={() => {}}
                    className={`pl-11 pr-3 py-3 rounded-lg border border-gray-300 w-full placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition
                      ${usernameField.error ? 'border-red-500' : usernameField.value ? 'border-green-500' : 'border-gray-300'}`}
                    aria-label="Profile Username"
                  />
                </div>
                {usernameField.isChecking && (
                  <span className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                    <FaInfoCircle className="flex-shrink-0" />{t('auth.dashboard.settings.checking')}
                  </span>
                )}
                {usernameField.error && (
                  <span className="text-red-500 text-xs flex items-center gap-1 mt-1">
                    <FaInfoCircle className="flex-shrink-0" />
                    {usernameField.error}
                  </span>
                )}

                <div className="relative">
                  <label htmlFor="profile-phone" className="text-sm font-medium">{t('auth.dashboard.settings.placeholders.phone')}</label>
                  <FaPhone className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg" />
                  <input
                    id="profile-phone"
                    name="phone"
                    type="tel"
                    placeholder="Phone"
                    value={phoneField.value}
                    onChange={(e) => phoneField.onChange(e.target.value)}
                    onBlur={() => {}}
                    className={`pl-11 pr-3 py-3 rounded-lg border border-gray-300 w-full placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition
                      ${phoneField.error ? 'border-red-500' : phoneField.value ? 'border-green-500' : 'border-gray-300'}`}
                    aria-label="Profile Phone"
                  />
                </div>
                {phoneField.error && (
                  <span className="text-red-500 text-xs flex items-center gap-1 mt-1">
                    <FaInfoCircle className="flex-shrink-0" />
                    {phoneField.error}
                  </span>
                )}

                <div className="flex justify-end gap-3 mt-8">
                  <button
                    type="button"
                    onClick={() => setShowEditProfile(false)}
                    className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg font-semibold hover:bg-gray-200"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    type="submit"
                    className="bg-yellow-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-yellow-600 disabled:opacity-50 flex items-center justify-center"
                    disabled={
                      usernameField.isChecking ||
                      emailField.isChecking ||
                      !isValid
                    }
                  >
                    {t('auth.dashboard.settings.buttons.saveChanges')}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
      {/* Change Password Modal */}
      {showChangePassword && (
        <Modal onClose={() => setShowChangePassword(false)} title={t('auth.dashboard.settings.modals.changePassword')}>
          <form onSubmit={handlePasswordSave} className="space-y-4">
            <input 
              type="password" 
              className={`w-full p-2 border rounded ${
                theme === 'dark' 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300'
              }`}
              placeholder={t('auth.dashboard.settings.placeholders.currentPassword')} 
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
              placeholder={t('auth.dashboard.settings.placeholders.newPassword')} 
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
              placeholder={t('auth.dashboard.settings.placeholders.confirmNewPassword')} 
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
                {t('common.cancel')}
              </button>
              <button 
                type="submit" 
                className="px-4 py-2 rounded bg-yellow-500 text-white hover:bg-yellow-600"
              >
                {t('auth.dashboard.settings.buttons.saveChanges')}
              </button>
            </div>
          </form>
        </Modal>
      )}
      {/* Profile Picture Modal */}
      {showProfilePicture && (
        <Modal onClose={() => setShowProfilePicture(false)} title={t('auth.dashboard.settings.modals.profilePicture')}>
          <form onSubmit={handleProfilePicSave} className="space-y-6">
            {/* Current Profile Picture */}
            <div className="flex flex-col items-center">
              <div className="relative w-32 h-32 mb-4">
                <img 
                  src={currentProfilePic || profile} 
                  alt={t('auth.dashboard.settings.profilePicture.currentProfile')} 
                  className="w-full h-full rounded-full object-cover border-2 border-yellow-500"
                />
              </div>
              <p className={`text-sm mb-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                {t('auth.dashboard.settings.profilePicture.currentProfile')}
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
                      <span className="font-semibold">{t('auth.dashboard.settings.profilePicture.clickToUpload')}</span> {t('auth.dashboard.settings.profilePicture.orDragAndDrop')}
                    </p>
                    <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                      {t('auth.dashboard.settings.profilePicture.fileTypes')}
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
                      alt={t('auth.dashboard.settings.profilePicture.preview')} 
                      className="w-full h-full rounded-full object-cover border-2 border-yellow-500"
                    />
                  </div>
                  <p className={`text-sm mt-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                    {t('auth.dashboard.settings.profilePicture.newProfilePicturePreview')}
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
                {t('common.cancel')}
              </button>
              <button 
                type="submit" 
                className="px-4 py-2 rounded bg-yellow-500 text-white hover:bg-yellow-600 flex items-center gap-2"
                disabled={!profilePic || uploadingProfilePic}
              >
                {uploadingProfilePic ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    {t('auth.dashboard.settings.profilePicture.uploading')}
                  </>
                ) : (
                  t('auth.dashboard.settings.buttons.saveChanges')
                )}
              </button>
            </div>
          </form>
        </Modal>
      )}
      {/* Font Size Modal */}
      {showFontSize && (
        <Modal onClose={() => setShowFontSize(false)} title={t('auth.dashboard.settings.modals.fontSize')}>
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
                { label: t('dashboard.fontSize.small'), size: 12 },
                { label: t('dashboard.fontSize.medium'), size: 16 },
                { label: t('dashboard.fontSize.large'), size: 20 }
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
              {t('auth.dashboard.settings.fontSize.sampleText')}
            </div>
          </div>
        </Modal>
      )}
      {/* Announcements Modal */}
      {showAnnouncements && (
        <Modal onClose={() => setShowAnnouncements(false)} title={t('auth.dashboard.settings.modals.announcements')}>
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
        <Modal onClose={() => setShowNotifications(false)} title={t('auth.dashboard.settings.modals.notifications')}>
          <div className="space-y-4">
            <label className={`flex items-center gap-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-900'}`}>
              <input 
                type="checkbox" 
                checked={notifications.email} 
                onChange={() => handleNotificationsChange("email")} 
                className={theme === 'dark' ? 'bg-gray-700 border-gray-600' : ''}
              />
              {t('auth.dashboard.settings.notifications.emailNotifications')}
            </label>
            <label className={`flex items-center gap-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-900'}`}>
              <input 
                type="checkbox" 
                checked={notifications.push} 
                onChange={() => handleNotificationsChange("push")} 
                className={theme === 'dark' ? 'bg-gray-700 border-gray-600' : ''}
              />
              {t('auth.dashboard.settings.notifications.pushNotifications')}
            </label>
          </div>
        </Modal>
      )}
      {/* Theme Modal */}
      {showTheme && (
        <Modal onClose={() => setShowTheme(false)} title={t('auth.dashboard.settings.modals.theme')}>
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
              {t('auth.dashboard.settings.theme.light')}
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
              {t('auth.dashboard.settings.theme.dark')}
            </button>
          </div>
        </Modal>
      )}
      {/* Delete Account Modal */}
      {showDeleteAccount && (
        <Modal onClose={() => setShowDeleteAccount(false)} title={t('auth.dashboard.settings.modals.deleteAccount')}>
          <form onSubmit={handleDeleteAccount} className="space-y-4">
            <div className={`text-red-600 font-semibold ${theme === 'dark' ? 'text-red-400' : ''}`}>
              {t('auth.dashboard.settings.deleteAccountWarning')}
            </div>
            <input 
              type="text"
              className={`w-full p-2 border rounded ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
              placeholder={t('auth.dashboard.settings.placeholders.deleteConfirm')}
              value={deleteConfirm}
              onChange={e => setDeleteConfirm(e.target.value)}
              required
            />
            <input 
              type="password" 
              className={`w-full p-2 border rounded ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
              placeholder={t('auth.dashboard.settings.placeholders.enterPassword')} 
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
                {t('common.cancel')}
              </button>
              <button 
                type="submit" 
                className="px-4 py-2 rounded bg-red-500 text-white hover:bg-red-600"
              >
                {t('auth.dashboard.settings.options.deleteAccount')}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default SettingsCards;
