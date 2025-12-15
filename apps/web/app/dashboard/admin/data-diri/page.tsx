'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { API_BASE_URL } from '@/lib/config';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Users,
  Lock,
  Eye,
  EyeOff,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  normalizePhoneNumber,
  validatePhoneNumber,
  formatPhoneForDisplay,
} from '@/lib/phone-utils';

export default function DataDiriAdminPage() {
  useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone_number: '',
    alamat: '',
    tanggal_lahir: '',
    tempat_lahir: '',
    jenis_kelamin: '',
  });
  const [passwordData, setPasswordData] = useState({
    password_lama: '',
    password_baru: '',
    konfirmasi_password: '',
  });
  const [showPassword, setShowPassword] = useState({
    lama: false,
    baru: false,
    konfirmasi: false,
  });
  const [emailData, setEmailData] = useState({
    email_baru: '',
    otp: '',
  });
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  useEffect(() => {
    fetchDataDiri();
  }, []);

  const fetchDataDiri = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/data-diri`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const data = await response.json();
      if (data.status === 'sukses') {
        setFormData({
          name: data.data.name || '',
          email: data.data.email || '',
          phone_number: formatPhoneForDisplay(data.data.phone_number || ''),
          alamat: data.data.alamat || '',
          tanggal_lahir: data.data.tanggal_lahir
            ? new Date(data.data.tanggal_lahir).toISOString().split('T')[0]
            : '',
          tempat_lahir: data.data.tempat_lahir || '',
          jenis_kelamin: data.data.jenis_kelamin || '',
        });
      }
    } catch {
      toast.error('Gagal memuat data diri');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (!validatePhoneNumber(formData.phone_number)) {
        toast.error(
          'Format nomor HP tidak valid. Gunakan format 08xxx, 628xxx, atau +628xxx',
        );
        return;
      }

      const payload: Record<string, string | number | null> = {
        name: formData.name,
        phone_number: normalizePhoneNumber(formData.phone_number),
        alamat: formData.alamat || null,
        tempat_lahir: formData.tempat_lahir || null,
        jenis_kelamin: formData.jenis_kelamin || null,
      };

      if (formData.tanggal_lahir) {
        payload.tanggal_lahir = new Date(formData.tanggal_lahir).toISOString();
      }

      const response = await fetch(`${API_BASE_URL}/data-diri`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (data.status === 'sukses') {
        toast.success('Data diri berhasil diperbarui');
      } else {
        toast.error(data.message || 'Gagal memperbarui data diri');
      }
    } catch {
      toast.error('Terjadi kesalahan saat menyimpan data');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPassword(true);

    try {
      const response = await fetch(`${API_BASE_URL}/data-diri/password`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(passwordData),
      });

      const data = await response.json();
      if (data.status === 'sukses') {
        toast.success('Password berhasil diubah');
        setPasswordData({
          password_lama: '',
          password_baru: '',
          konfirmasi_password: '',
        });
      } else {
        toast.error(data.message || 'Gagal mengubah password');
      }
    } catch {
      toast.error('Terjadi kesalahan saat mengubah password');
    } finally {
      setSavingPassword(false);
    }
  };

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendingOtp(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/data-diri/email/request-otp`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({ email_baru: emailData.email_baru }),
        },
      );

      const data = await response.json();
      if (data.status === 'sukses') {
        toast.success('Kode OTP telah dikirim ke WhatsApp Anda');
        setOtpSent(true);
      } else {
        toast.error(data.message || 'Gagal mengirim OTP');
      }
    } catch {
      toast.error('Terjadi kesalahan saat mengirim OTP');
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifyingOtp(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/data-diri/email/verify-otp`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify(emailData),
        },
      );

      const data = await response.json();
      if (data.status === 'sukses') {
        toast.success('Email berhasil diubah');
        setEmailData({ email_baru: '', otp: '' });
        setOtpSent(false);
        await fetchDataDiri();
      } else {
        toast.error(data.message || 'Gagal mengubah email');
      }
    } catch {
      toast.error('Terjadi kesalahan saat verifikasi OTP');
    } finally {
      setVerifyingOtp(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7f1d1d]"></div>
      </div>
    );
  }

  return (
    <div className="px-2 py-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6 max-w-7xl mx-auto">
      <div className="bg-gradient-to-br from-[#7f1d1d] to-[#991b1b] rounded-2xl shadow-xl p-6 sm:p-8 mb-6">
        <div className="flex items-center gap-4">
          <div className="bg-white/20 backdrop-blur-sm p-4 rounded-xl">
            <User className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">
              Data Diri Admin
            </h1>
            <p className="text-white/90 text-sm">
              Kelola informasi pribadi dan akun Anda
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
          <div className="bg-[#7f1d1d]/10 p-2 rounded-lg">
            <User className="w-5 h-5 text-[#7f1d1d]" />
          </div>
          <h2 className="text-xl font-bold text-gray-800">Informasi Pribadi</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <User className="w-4 h-4 text-[#7f1d1d]" />
                Nama Lengkap
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#7f1d1d] focus:ring-4 focus:ring-[#7f1d1d]/10 outline-none transition-all bg-gray-50 focus:bg-white"
                required
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <Mail className="w-4 h-4 text-[#7f1d1d]" />
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                disabled
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-gray-100 text-gray-500 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <Phone className="w-4 h-4 text-[#7f1d1d]" />
                Nomor HP
              </label>
              <input
                type="text"
                value={formData.phone_number}
                onChange={(e) =>
                  setFormData({ ...formData, phone_number: e.target.value })
                }
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#7f1d1d] focus:ring-4 focus:ring-[#7f1d1d]/10 outline-none transition-all bg-gray-50 focus:bg-white"
                placeholder="08xxxxxxxxx"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Format: 08xxx, 628xxx, atau +628xxx
              </p>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <Users className="w-4 h-4 text-[#7f1d1d]" />
                Jenis Kelamin
              </label>
              <select
                value={formData.jenis_kelamin}
                onChange={(e) =>
                  setFormData({ ...formData, jenis_kelamin: e.target.value })
                }
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#7f1d1d] focus:ring-4 focus:ring-[#7f1d1d]/10 outline-none transition-all bg-gray-50 focus:bg-white"
              >
                <option value="">Pilih Jenis Kelamin</option>
                <option value="Laki-laki">Laki-laki</option>
                <option value="Perempuan">Perempuan</option>
              </select>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <MapPin className="w-4 h-4 text-[#7f1d1d]" />
                Tempat Lahir
              </label>
              <input
                type="text"
                value={formData.tempat_lahir}
                onChange={(e) =>
                  setFormData({ ...formData, tempat_lahir: e.target.value })
                }
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#7f1d1d] focus:ring-4 focus:ring-[#7f1d1d]/10 outline-none transition-all bg-gray-50 focus:bg-white"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <Calendar className="w-4 h-4 text-[#7f1d1d]" />
                Tanggal Lahir
              </label>
              <input
                type="date"
                value={formData.tanggal_lahir}
                onChange={(e) =>
                  setFormData({ ...formData, tanggal_lahir: e.target.value })
                }
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#7f1d1d] focus:ring-4 focus:ring-[#7f1d1d]/10 outline-none transition-all bg-gray-50 focus:bg-white"
              />
            </div>

            <div className="md:col-span-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <MapPin className="w-4 h-4 text-[#7f1d1d]" />
                Alamat
              </label>
              <textarea
                value={formData.alamat}
                onChange={(e) =>
                  setFormData({ ...formData, alamat: e.target.value })
                }
                rows={3}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#7f1d1d] focus:ring-4 focus:ring-[#7f1d1d]/10 outline-none transition-all bg-gray-50 focus:bg-white resize-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={fetchDataDiri}
              className="px-6 py-3 rounded-xl border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 hover:border-gray-400 transition-all"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#7f1d1d] to-[#991b1b] text-white font-semibold hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
          <div className="bg-[#7f1d1d]/10 p-2 rounded-lg">
            <Lock className="w-5 h-5 text-[#7f1d1d]" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 flex-1">
            Ubah Password
          </h2>
          <a
            href="/forgot-password"
            className="text-sm text-[#7f1d1d] hover:underline font-medium"
          >
            Lupa Password?
          </a>
        </div>

        <form onSubmit={handlePasswordSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <Lock className="w-4 h-4 text-[#7f1d1d]" />
                Password Lama
              </label>
              <div className="relative">
                <input
                  type={showPassword.lama ? 'text' : 'password'}
                  value={passwordData.password_lama}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      password_lama: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 pr-12 rounded-xl border-2 border-gray-200 focus:border-[#7f1d1d] focus:ring-4 focus:ring-[#7f1d1d]/10 outline-none transition-all bg-gray-50 focus:bg-white"
                  required
                />
                <button
                  type="button"
                  onClick={() =>
                    setShowPassword({
                      ...showPassword,
                      lama: !showPassword.lama,
                    })
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword.lama ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <Lock className="w-4 h-4 text-[#7f1d1d]" />
                Password Baru
              </label>
              <div className="relative">
                <input
                  type={showPassword.baru ? 'text' : 'password'}
                  value={passwordData.password_baru}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      password_baru: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 pr-12 rounded-xl border-2 border-gray-200 focus:border-[#7f1d1d] focus:ring-4 focus:ring-[#7f1d1d]/10 outline-none transition-all bg-gray-50 focus:bg-white"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() =>
                    setShowPassword({
                      ...showPassword,
                      baru: !showPassword.baru,
                    })
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword.baru ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">Minimal 8 karakter</p>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <Lock className="w-4 h-4 text-[#7f1d1d]" />
                Konfirmasi Password Baru
              </label>
              <div className="relative">
                <input
                  type={showPassword.konfirmasi ? 'text' : 'password'}
                  value={passwordData.konfirmasi_password}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      konfirmasi_password: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 pr-12 rounded-xl border-2 border-gray-200 focus:border-[#7f1d1d] focus:ring-4 focus:ring-[#7f1d1d]/10 outline-none transition-all bg-gray-50 focus:bg-white"
                  required
                />
                <button
                  type="button"
                  onClick={() =>
                    setShowPassword({
                      ...showPassword,
                      konfirmasi: !showPassword.konfirmasi,
                    })
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword.konfirmasi ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() =>
                setPasswordData({
                  password_lama: '',
                  password_baru: '',
                  konfirmasi_password: '',
                })
              }
              className="px-6 py-3 rounded-xl border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 hover:border-gray-400 transition-all"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={savingPassword}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#7f1d1d] to-[#991b1b] text-white font-semibold hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {savingPassword ? 'Menyimpan...' : 'Ubah Password'}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
          <div className="bg-[#7f1d1d]/10 p-2 rounded-lg">
            <Mail className="w-5 h-5 text-[#7f1d1d]" />
          </div>
          <h2 className="text-xl font-bold text-gray-800">Ubah Email</h2>
        </div>

        {!otpSent ? (
          <form onSubmit={handleRequestOtp} className="space-y-6">
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <Mail className="w-4 h-4 text-[#7f1d1d]" />
                Email Saat Ini
              </label>
              <input
                type="email"
                value={formData.email}
                disabled
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-gray-100 text-gray-500 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <Mail className="w-4 h-4 text-[#7f1d1d]" />
                Email Baru
              </label>
              <input
                type="email"
                value={emailData.email_baru}
                onChange={(e) =>
                  setEmailData({ ...emailData, email_baru: e.target.value })
                }
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#7f1d1d] focus:ring-4 focus:ring-[#7f1d1d]/10 outline-none transition-all bg-gray-50 focus:bg-white"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Kode OTP akan dikirim ke WhatsApp Anda
              </p>
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-200">
              <button
                type="submit"
                disabled={sendingOtp}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#7f1d1d] to-[#991b1b] text-white font-semibold hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {sendingOtp ? 'Mengirim...' : 'Kirim Kode OTP'}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-6">
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <Mail className="w-4 h-4 text-[#7f1d1d]" />
                Email Baru
              </label>
              <input
                type="email"
                value={emailData.email_baru}
                disabled
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-gray-100 text-gray-500 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <Lock className="w-4 h-4 text-[#7f1d1d]" />
                Kode OTP
              </label>
              <input
                type="text"
                value={emailData.otp}
                onChange={(e) =>
                  setEmailData({ ...emailData, otp: e.target.value })
                }
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#7f1d1d] focus:ring-4 focus:ring-[#7f1d1d]/10 outline-none transition-all bg-gray-50 focus:bg-white"
                required
                maxLength={6}
                placeholder="Masukkan 6 digit kode OTP"
              />
              <p className="text-xs text-gray-500 mt-1">
                Cek WhatsApp Anda untuk kode OTP
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => {
                  setOtpSent(false);
                  setEmailData({ email_baru: '', otp: '' });
                }}
                className="px-6 py-3 rounded-xl border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 hover:border-gray-400 transition-all"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={verifyingOtp}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#7f1d1d] to-[#991b1b] text-white font-semibold hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {verifyingOtp ? 'Memverifikasi...' : 'Verifikasi & Ubah Email'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
