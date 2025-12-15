'use client';

import { useState, FormEvent, ChangeEvent, ComponentType } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  UserPlus,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  Book,
  Users,
  Hash,
  Phone,
  ArrowLeft,
} from 'lucide-react';
import { normalizePhoneNumber, validatePhoneNumber } from '@/lib/phone-utils';

// --- InputField Component (Refactored) ---
interface InputFieldProps {
  id: string;
  name: string;
  type: string;
  placeholder: string;
  value: string;
  onChange: (_e: ChangeEvent<HTMLInputElement>) => void;
  icon: ComponentType<{ className?: string }>;
  isPassword?: boolean;
  showPasswordState?: boolean;
  toggleShowPassword?: () => void;
}

const InputField = ({
  id,
  name,
  type,
  placeholder,
  value,
  onChange,
  icon: Icon,
  isPassword = false,
  showPasswordState,
  toggleShowPassword,
}: InputFieldProps) => (
  <div className="relative group">
    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
      <Icon className="h-5 w-5 text-gray-400 group-focus-within:text-rose-600 transition-colors" />
    </div>
    <input
      id={id}
      name={name}
      type={type}
      value={value}
      onChange={onChange}
      className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-rose-600 focus:ring-4 focus:ring-rose-100 outline-none transition-all duration-200 bg-gray-50 focus:bg-white"
      placeholder={placeholder}
      required
    />
    {!!isPassword && (
      <button
        type="button"
        onClick={toggleShowPassword}
        className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
      >
        {showPasswordState ? (
          <EyeOff className="h-5 w-5" />
        ) : (
          <Eye className="h-5 w-5" />
        )}
      </button>
    )}
  </div>
);

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    nim: '',
    prodi: 'D3',
    phone_number: '',
    kelas: 'A',
    password: '',
    password_confirmation: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const router = useRouter();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;

    if (name === 'phone_number') {
      // Hanya izinkan angka dan +
      const cleanValue = value.replace(/[^0-9+]/g, '');
      setFormData((prev) => ({ ...prev, [name]: cleanValue }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const getFullKelas = () => {
    const prodiPrefix = formData.prodi === 'D3' ? '3' : '4';
    return `${prodiPrefix}${formData.kelas}`;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (formData.password !== formData.password_confirmation) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    if (!validatePhoneNumber(formData.phone_number)) {
      setError(
        'Format nomor HP tidak valid. Gunakan format 08xxx, 628xxx, atau +628xxx',
      );
      setLoading(false);
      return;
    }

    const { name, email, nim, prodi, phone_number, password } = formData;
    const payload = {
      name,
      email,
      nim,
      prodi,
      phone_number: normalizePhoneNumber(phone_number),
      kelas: getFullKelas(),
      password,
    };

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      toast.success(
        data.message || 'Registrasi berhasil! Silakan cek email Anda.',
      );
      router.push(`/verify-otp?email=${encodeURIComponent(formData.email)}`);
    } catch (err) {
      const error = err as Error;
      setError(error.message);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-amber-50 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-96 h-96 bg-rose-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-amber-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-1000"></div>

      <Link
        href="/"
        className="hidden md:flex absolute top-8 left-8 items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full shadow-lg hover:shadow-xl text-gray-700 hover:text-rose-600 transition-all z-20 group"
      >
        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        <span className="font-medium">Home</span>
      </Link>

      <div className="max-w-md w-full relative z-10">
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
          <div className="bg-gradient-to-r from-rose-600 via-red-700 to-amber-600 p-8 text-center relative">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative z-10">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl mb-4 shadow-lg">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">Buat Akun</h1>
              <p className="text-white/90 text-sm">Bergabung dengan SITA-BI!</p>
            </div>
          </div>

          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              <InputField
                id="name"
                name="name"
                type="text"
                placeholder="Nama Lengkap"
                value={formData.name}
                icon={User}
                onChange={handleChange}
              />
              <InputField
                id="email"
                name="email"
                type="email"
                placeholder="Alamat Email"
                value={formData.email}
                icon={Mail}
                onChange={handleChange}
              />
              <div className="grid grid-cols-2 gap-4">
                <InputField
                  id="nim"
                  name="nim"
                  type="text"
                  placeholder="NIM"
                  value={formData.nim}
                  icon={Hash}
                  onChange={handleChange}
                />
                <div>
                  <InputField
                    id="phone_number"
                    name="phone_number"
                    type="text"
                    placeholder="08xxxxxxxxx"
                    value={formData.phone_number}
                    icon={Phone}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Book className="h-5 w-5 text-gray-400 group-focus-within:text-rose-600 transition-colors" />
                    </div>
                    <select
                      name="prodi"
                      value={formData.prodi}
                      onChange={handleChange}
                      className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-rose-600 focus:ring-4 focus:ring-rose-100 outline-none transition-all duration-200 bg-gray-50 focus:bg-white"
                    >
                      <option value="D3">D3</option>
                      <option value="D4">D4</option>
                    </select>
                  </div>
                </div>
                <div>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Users className="h-5 w-5 text-gray-400 group-focus-within:text-rose-600 transition-colors" />
                    </div>
                    <select
                      name="kelas"
                      value={formData.kelas}
                      onChange={handleChange}
                      className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-rose-600 focus:ring-4 focus:ring-rose-100 outline-none transition-all duration-200 bg-gray-50 focus:bg-white"
                    >
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="C">C</option>
                      <option value="D">D</option>
                      <option value="E">E</option>
                    </select>
                  </div>
                </div>
              </div>
              <InputField
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Kata Sandi"
                value={formData.password}
                icon={Lock}
                isPassword={true}
                showPasswordState={showPassword}
                toggleShowPassword={() => setShowPassword(!showPassword)}
                onChange={handleChange}
              />
              <InputField
                id="password_confirmation"
                name="password_confirmation"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Konfirmasi Kata Sandi"
                value={formData.password_confirmation}
                icon={Lock}
                isPassword={true}
                showPasswordState={showConfirmPassword}
                toggleShowPassword={() =>
                  setShowConfirmPassword(!showConfirmPassword)
                }
                onChange={handleChange}
              />

              {!!error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
                  <p className="text-red-700 text-sm font-medium">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-700 hover:to-red-800 text-white font-semibold py-3.5 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:translate-y-0"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Mendaftar...</span>
                  </>
                ) : (
                  <>
                    <span>Buat Akun</span>
                    <UserPlus className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">
                  Sudah punya akun?
                </span>
              </div>
            </div>

            <div className="text-center">
              <Link
                href="/login"
                className="inline-flex items-center justify-center w-full px-6 py-3 rounded-xl border-2 border-rose-600 text-rose-600 font-semibold hover:bg-rose-50 transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0"
              >
                Masuk
              </Link>
            </div>
          </div>
        </div>

        <p className="text-center text-gray-500 text-xs mt-6">
          Dengan membuat akun, Anda menyetujui Ketentuan Layanan dan Kebijakan
          Privasi kami
        </p>
      </div>
    </div>
  );
}
