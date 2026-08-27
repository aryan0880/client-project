import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Building2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Alert } from '../../components/ui/Alert';
import { useAuth } from '../../store/AuthContext';

export function LoginPage() {
  const navigate = useNavigate();
  const { login, isLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

  function validate(): boolean {
    const errors: { email?: string; password?: string } = {};
    if (!email) errors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Enter a valid email address';
    if (!password) errors.password = 'Password is required';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!validate()) return;

    try {
      await login({ email, password });
      navigate('/dashboard');
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Invalid email or password. Please try again.';
      setError(message);
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary-600 flex-col justify-between p-12">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/20">
            <Building2 className="h-5 w-5 text-white" />
          </div>
          <span className="text-white font-semibold text-lg">SupplierAssess</span>
        </div>
        <div>
          <blockquote className="text-white/90 text-xl font-light leading-relaxed">
            "Manage supplier assessments, track performance, and make data-driven procurement decisions — all in one place."
          </blockquote>
          <div className="mt-8 grid grid-cols-2 gap-4">
            {[
              { label: 'Suppliers Managed', value: '50+' },
              { label: 'Surveys Completed', value: '200+' },
              { label: 'Avg. Response Rate', value: '94%' },
              { label: 'Time Saved', value: '8h/week' },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white/10 rounded-lg p-4">
                <p className="text-white text-2xl font-bold">{value}</p>
                <p className="text-white/70 text-sm mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
        <p className="text-white/50 text-sm">© 2026 SupplierAssess. All rights reserved.</p>
      </div>

      {/* Right panel — login form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm animate-fade-in">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600">
              <Building2 className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold text-neutral-900">SupplierAssess</span>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-semibold text-neutral-900">Sign in</h1>
            <p className="text-neutral-500 mt-1 text-sm">
              Enter your credentials to access the management portal.
            </p>
          </div>

          {error && (
            <Alert variant="error" className="mb-6">
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <Input
              label="Email address"
              type="email"
              id="login-email"
              placeholder="admin@company.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (fieldErrors.email) setFieldErrors((p) => ({ ...p, email: undefined }));
              }}
              error={fieldErrors.email}
              leftAddon={<Mail className="h-4 w-4" />}
              autoComplete="email"
              required
            />

            <div className="flex flex-col gap-1">
              <label htmlFor="login-password" className="text-sm font-medium text-neutral-700">
                Password <span className="text-danger-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-neutral-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password) setFieldErrors((p) => ({ ...p, password: undefined }));
                  }}
                  autoComplete="current-password"
                  className={`block w-full rounded border text-sm text-neutral-900 placeholder:text-neutral-400 pl-9 pr-10 py-2 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                    fieldErrors.password
                      ? 'border-danger-500 bg-danger-50'
                      : 'border-neutral-300 bg-white hover:border-neutral-400'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-neutral-400 hover:text-neutral-600"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="text-xs text-danger-600">{fieldErrors.password}</p>
              )}
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              className="w-full mt-2"
            >
              Sign in
            </Button>
          </form>

          <p className="mt-8 text-xs text-neutral-400 text-center">
            For access, contact your system administrator.
          </p>
        </div>
      </div>
    </div>
  );
}
