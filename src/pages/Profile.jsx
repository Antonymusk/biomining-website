import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Camera, Lock, User, Save, Phone, FileText, Briefcase, Loader2, Calendar, Clock, ShieldCheck } from "lucide-react";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { useAuth } from "../lib/AuthContext";
import { supabase } from "../lib/supabase";
import toast from "react-hot-toast";

export default function Profile() {
  const { user, session, refreshProfile } = useAuth();
  
  // Profile Form State
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState({
    name: "",
    phone: "",
    bio: "",
    designation: "",
    avatar_url: ""
  });
  
  // Password State
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwords, setPasswords] = useState({
    newPassword: "",
    confirmPassword: ""
  });

  // Avatar Upload State
  const fileInputRef = useRef(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || "",
        phone: user.phone || "",
        bio: user.bio || "",
        designation: user.designation || "",
        avatar_url: user.avatar_url || ""
      });
    }
  }, [user]);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswords(prev => ({ ...prev, [name]: value }));
  };

  const saveProfile = async (e) => {
    if (e) e.preventDefault();
    try {
      setLoading(true);
      const { error } = await supabase
        .from('users')
        .upsert({
          id: user.id,
          email: session.user.email,
          name: profileData.name,
          phone: profileData.phone,
          bio: profileData.bio,
          designation: profileData.designation,
          avatar_url: profileData.avatar_url
        });

      if (error) throw error;
      if (refreshProfile) await refreshProfile();
      toast.success("Profile updated successfully");
    } catch (err) {
      console.error("Save profile error:", err);
      toast.error(err.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    try {
      const file = e.target.files[0];
      if (!file) return;
      
      // Basic validation
      if (file.size > 2 * 1024 * 1024) {
        return toast.error("Image size must be less than 2MB");
      }
      if (!file.type.startsWith("image/")) {
        return toast.error("File must be an image");
      }

      setUploadingAvatar(true);
      
      // Generate unique path
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}-${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const publicUrl = data.publicUrl;
      setProfileData(prev => ({ ...prev, avatar_url: publicUrl }));
      
      // Save URL to users table immediately
      const { error: updateError } = await supabase
        .from('users')
        .upsert({ 
          id: user.id,
          email: session.user.email,
          name: profileData.name,
          phone: profileData.phone,
          bio: profileData.bio,
          designation: profileData.designation,
          avatar_url: publicUrl 
        });
        
      if (updateError) throw updateError;
      if (refreshProfile) await refreshProfile();
      
      toast.success("Avatar uploaded successfully");
    } catch (err) {
      console.error("Avatar upload error:", err);
      toast.error("Failed to upload avatar");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const updatePassword = async (e) => {
    e.preventDefault();
    if (passwords.newPassword.length < 6) {
      return toast.error("Password must be at least 6 characters");
    }
    if (passwords.newPassword !== passwords.confirmPassword) {
      return toast.error("Passwords do not match");
    }

    try {
      setPasswordLoading(true);
      const { error } = await supabase.auth.updateUser({
        password: passwords.newPassword
      });

      if (error) throw error;
      toast.success("Password changed successfully");
      setPasswords({ newPassword: "", confirmPassword: "" });
    } catch (err) {
      console.error("Change password error:", err);
      toast.error(err.message || "Failed to change password");
    } finally {
      setPasswordLoading(false);
    }
  };

  if (!user || !session) return null;

  const joinDate = new Date(user.created_at || session.user.created_at).toLocaleDateString();
  const lastSignIn = new Date(session.user.last_sign_in_at).toLocaleString();

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-6xl mx-auto space-y-6 pb-12"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Account Profile</h2>
          <p className="text-gray-400 text-sm">Manage your personal information and security settings</p>
        </div>
        <button 
          onClick={saveProfile}
          disabled={loading || uploadingAvatar}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-xl transition-all disabled:opacity-50"
        >
          {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
          Save Changes
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column - Avatar & Info */}
        <div className="space-y-6">
          <Card className="text-center p-6 flex flex-col items-center">
            <div className="relative mb-6">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-dark-border bg-dark-bg/50 relative group">
                {profileData.avatar_url ? (
                  <img src={profileData.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-dark-border/30">
                    <User size={48} className="text-gray-500" />
                  </div>
                )}
                
                <div 
                  className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {uploadingAvatar ? (
                    <Loader2 className="animate-spin text-white" size={24} />
                  ) : (
                    <>
                      <Camera className="text-white mb-1" size={24} />
                      <span className="text-xs text-white font-medium">Change</span>
                    </>
                  )}
                </div>
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleAvatarUpload} 
                accept="image/*" 
                className="hidden" 
              />
            </div>
            
            <h3 className="text-xl font-bold text-white mb-1">{profileData.name || "User"}</h3>
            <p className="text-primary font-medium text-sm mb-4">{profileData.designation || user?.roles?.name || "Team Member"}</p>
            
            <div className="w-full text-left space-y-3 mt-4 border-t border-dark-border pt-4">
              <div className="flex items-center gap-3 text-sm">
                <Calendar size={16} className="text-gray-400" />
                <span className="text-gray-300">Joined {joinDate}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <ShieldCheck size={16} className="text-gray-400" />
                <span className="text-gray-300">Role: {user?.roles?.name || "None"}</span>
              </div>
            </div>
          </Card>
          
          <Card>
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Lock size={18} className="text-primary" /> Security
            </h3>
            <div className="space-y-4">
              <div className="bg-dark-bg p-3 rounded-lg border border-dark-border">
                <div className="text-xs text-gray-500 mb-1">Email Address</div>
                <div className="text-sm text-gray-300 truncate">{session.user.email}</div>
              </div>
              <div className="bg-dark-bg p-3 rounded-lg border border-dark-border">
                <div className="text-xs text-gray-500 mb-1 flex items-center gap-1"><Clock size={12}/> Last Login</div>
                <div className="text-sm text-gray-300">{lastSignIn}</div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column - Forms */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <h3 className="text-lg font-semibold text-white mb-6">Personal Information</h3>
            <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); saveProfile(); }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                    <Input 
                      name="name"
                      value={profileData.name}
                      onChange={handleProfileChange}
                      className="pl-10"
                      placeholder="e.g. John Doe"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                    <Input 
                      name="phone"
                      value={profileData.phone}
                      onChange={handleProfileChange}
                      className="pl-10"
                      placeholder="e.g. +1 234 567 890"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Designation</label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                  <Input 
                    name="designation"
                    value={profileData.designation}
                    onChange={handleProfileChange}
                    className="pl-10"
                    placeholder="e.g. Operations Manager"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Bio</label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 text-gray-500" size={16} />
                  <textarea 
                    name="bio"
                    value={profileData.bio}
                    onChange={handleProfileChange}
                    className="w-full bg-dark-bg border border-dark-border rounded-xl pl-10 pr-4 py-3 text-white focus:border-primary/50 outline-none resize-none h-24"
                    placeholder="A brief description about yourself..."
                  />
                </div>
              </div>
            </form>
          </Card>

          <Card>
            <h3 className="text-lg font-semibold text-white mb-6">Change Password</h3>
            <form onSubmit={updatePassword} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">New Password</label>
                  <Input 
                    type="password"
                    name="newPassword"
                    value={passwords.newPassword}
                    onChange={handlePasswordChange}
                    placeholder="Min. 6 characters"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Confirm Password</label>
                  <Input 
                    type="password"
                    name="confirmPassword"
                    value={passwords.confirmPassword}
                    onChange={handlePasswordChange}
                    placeholder="Confirm new password"
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <button 
                  type="submit"
                  disabled={passwordLoading}
                  className="flex items-center gap-2 bg-dark-border hover:bg-dark-border/80 text-white px-5 py-2.5 rounded-xl transition-all disabled:opacity-50"
                >
                  {passwordLoading ? <Loader2 className="animate-spin" size={18} /> : <Lock size={18} />}
                  Update Password
                </button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
