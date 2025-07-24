import { useState } from 'react';
import { Form, useActionData, useNavigation, redirect } from '@remix-run/react';
import type { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { EyeIcon, EyeSlashIcon, PhoneIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import { authService } from '~/lib/auth';
import { useTranslation } from '~/lib/translations';
import { toast } from 'react-toastify';

export async function loader({ request }: LoaderFunctionArgs) {
  // Check if user is already logged in
  const cookie = request.headers.get('Cookie');
  if (cookie?.includes('auth_token')) {
    return redirect('/dashboard');
  }

  return json({});
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const mobile = formData.get('mobile') as string;
  const password = formData.get('password') as string;

  // Validation
  if (!mobile || !password) {
    return json({
      success: false,
      error: 'Mobile number and password are required',
      errors: {
        mobile: !mobile ? 'Mobile number is required' : '',
        password: !password ? 'Password is required' : ''
      }
    }, { status: 400 });
  }

  // Validate mobile format (without leading 0)
  if (!authService.validateMobile(mobile)) {
    return json({
      success: false,
      error: 'Invalid mobile number format',
      errors: {
        mobile: 'Mobile number must be 10-11 digits without leading 0'
      }
    }, { status: 400 });
  }

  // Validate password format (6 digits)
  if (!authService.validatePassword(password)) {
    return json({
      success: false,
      error: 'Invalid password format',
      errors: {
        password: 'Password must be exactly 6 digits'
      }
    }, { status: 400 });
  }

  try {
    // Attempt login
    const result = await authService.login({ mobile, password });

    if (!result) {
      return json({
        success: false,
        error: 'Invalid mobile number or password',
        errors: {}
      }, { status: 401 });
    }

    // Set auth cookie and redirect based on role
    const headers = new Headers();
    headers.set('Set-Cookie', `auth_token=${result.token}; HttpOnly; Path=/; Max-Age=604800; SameSite=Strict`);
    
    // Redirect based on user role
    let redirectPath = '/dashboard';
    
    if (result.user.role === 'user') {
      redirectPath = '/profile';
    } else if (result.user.role === 'manager') {
      redirectPath = '/sales';
    } else if (result.user.role === 'superadmin') {
      redirectPath = '/dashboard';
    }

    return redirect(redirectPath, { headers });

  } catch (error) {
    console.error('Login error:', error);
    return json({
      success: false,
      error: 'Login failed. Please try again.',
      errors: {}
    }, { status: 500 });
  }
}

export default function Login() {
  const { t } = useTranslation();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';

  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    mobile: '',
    password: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Format mobile number as user types (remove non-digits and leading 0)
  const handleMobileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, ''); // Remove non-digits
    if (value.startsWith('0')) {
      value = value.substring(1); // Remove leading 0
    }
    if (value.length > 11) {
      value = value.substring(0, 11); // Limit to 11 digits
    }
    setFormData(prev => ({
      ...prev,
      mobile: value
    }));
  };

  // Format password as user types (only digits, max 6)
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, ''); // Remove non-digits
    if (value.length > 6) {
      value = value.substring(0, 6); // Limit to 6 digits
    }
    setFormData(prev => ({
      ...prev,
      password: value
    }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-blue-600 rounded-full flex items-center justify-center">
            <PhoneIcon className="h-8 w-8 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900 dark:text-white">
            {t('login')}
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            যানবাহন ব্যবস্থাপনা সিস্টেম
          </p>
        </div>

        {/* Demo Credentials */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
            Demo Login Credentials:
          </h3>
          <div className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
            <div><strong>Superadmin:</strong> Mobile: 1234567890, Password: 123456</div>
            <div><strong>Manager:</strong> Mobile: 1234567891, Password: 123456</div>
            <div><strong>User:</strong> Mobile: 1234567892, Password: 123456</div>
          </div>
        </div>

        {/* Error Display */}
        {actionData?.error && (
          <div className="alert alert-danger">
            <p>{actionData.error}</p>
          </div>
        )}

        {/* Login Form */}
        <div className="bg-white dark:bg-gray-800 shadow-xl rounded-lg px-8 py-8">
          <Form method="post" className="space-y-6">
            {/* Mobile Number */}
            <div>
              <label htmlFor="mobile" className="form-label">
                {t('mobile')} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <PhoneIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="mobile"
                  name="mobile"
                  type="tel"
                  required
                  value={formData.mobile}
                  onChange={handleMobileChange}
                  className={`form-input pl-10 ${actionData?.errors?.mobile ? 'border-red-500' : ''}`}
                  placeholder="1234567890 (without 0)"
                  maxLength={11}
                />
              </div>
              {actionData?.errors?.mobile && (
                <p className="form-error">{actionData.errors.mobile}</p>
              )}
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                ১০-১১ ডিজিট, ০ ছাড়া (without leading 0)
              </p>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="form-label">
                {t('password')} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <LockClosedIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={handlePasswordChange}
                  className={`form-input pl-10 pr-10 ${actionData?.errors?.password ? 'border-red-500' : ''}`}
                  placeholder="123456"
                  maxLength={6}
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
              {actionData?.errors?.password && (
                <p className="form-error">{actionData.errors.password}</p>
              )}
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                ৬ ডিজিটের সংখ্যা (6 digit number)
              </p>
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={isSubmitting || !formData.mobile || !formData.password}
                className="btn btn-primary w-full flex items-center justify-center py-3 text-base"
              >
                {isSubmitting ? (
                  <>
                    <div className="spinner mr-2" />
                    {t('loading')}
                  </>
                ) : (
                  t('login')
                )}
              </button>
            </div>
          </Form>
        </div>

        {/* User Role Information */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
            ব্যবহারকারীর ভূমিকা (User Roles):
          </h3>
          <div className="space-y-2 text-xs text-gray-600 dark:text-gray-400">
            <div className="flex items-start gap-2">
              <span className="badge badge-primary">সুপার অ্যাডমিন</span>
              <span>সবকিছু এডিট/ডিলিট করতে পারবে</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="badge badge-success">ম্যানেজার</span>
              <span>শুধু সেল করতে পারবে, খরচ update করতে পারবে</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="badge badge-gray">ব্যবহারকারী</span>
              <span>শুধু নিজের profile page দেখতে পারবে</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            © 2024 Vehicle Management System. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}