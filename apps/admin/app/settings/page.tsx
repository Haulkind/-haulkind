'use client';

import { useState, useEffect } from 'react';
import { api } from '../../lib/api';

export default function SettingsPage() {
  // Change password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  // 2FA state
  const [totpEnabled, setTotpEnabled] = useState(false);
  const [setupStep, setSetupStep] = useState<'idle' | 'qr' | 'verify'>('idle');
  const [qrCode, setQrCode] = useState('');
  const [totpSecret, setTotpSecret] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [disablePassword, setDisablePassword] = useState('');
  const [tfaError, setTfaError] = useState('');
  const [tfaSuccess, setTfaSuccess] = useState('');
  const [tfaLoading, setTfaLoading] = useState(false);
  const [showDisable, setShowDisable] = useState(false);

  // Load current user info
  useEffect(() => {
    const loadUser = async () => {
      try {
        const data = await api.getMe();
        setTotpEnabled(!!data.admin.totp_enabled);
      } catch (e) {
        // ignore
      }
    };
    loadUser();
  }, []);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters');
      return;
    }

    setPasswordLoading(true);
    try {
      await api.changePassword(currentPassword, newPassword);
      setPasswordSuccess('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordError(err.message || 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleSetup2FA = async () => {
    setTfaError('');
    setTfaSuccess('');
    setTfaLoading(true);
    try {
      const data = await api.setup2FA();
      setQrCode(data.qr_code);
      setTotpSecret(data.secret);
      setSetupStep('qr');
    } catch (err: any) {
      setTfaError(err.message || 'Failed to setup 2FA');
    } finally {
      setTfaLoading(false);
    }
  };

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setTfaError('');
    setTfaSuccess('');
    setTfaLoading(true);
    try {
      await api.verify2FA(verifyCode);
      setTfaSuccess('Two-factor authentication enabled successfully!');
      setTotpEnabled(true);
      setSetupStep('idle');
      setVerifyCode('');
      setQrCode('');
      setTotpSecret('');
    } catch (err: any) {
      setTfaError(err.message || 'Invalid code');
    } finally {
      setTfaLoading(false);
    }
  };

  const handleDisable2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setTfaError('');
    setTfaSuccess('');
    setTfaLoading(true);
    try {
      await api.disable2FA(disablePassword);
      setTfaSuccess('Two-factor authentication disabled');
      setTotpEnabled(false);
      setShowDisable(false);
      setDisablePassword('');
    } catch (err: any) {
      setTfaError(err.message || 'Failed to disable 2FA');
    } finally {
      setTfaLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Settings</h1>

      {/* Change Password Section */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Change Password</h2>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Current Password
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              New Password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <p className="text-xs text-gray-500 mt-1">Minimum 8 characters</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm New Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          {passwordError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
              {passwordError}
            </div>
          )}
          {passwordSuccess && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded text-sm">
              {passwordSuccess}
            </div>
          )}

          <button
            type="submit"
            disabled={passwordLoading}
            className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {passwordLoading ? 'Changing...' : 'Change Password'}
          </button>
        </form>
      </div>

      {/* Two-Factor Authentication Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Two-Factor Authentication (2FA)</h2>
          {totpEnabled ? (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
              Enabled
            </span>
          ) : (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-600">
              Disabled
            </span>
          )}
        </div>

        <p className="text-sm text-gray-600 mb-4">
          Add an extra layer of security to your account. When enabled, you will need to enter a code from your authenticator app (Google Authenticator, Authy, etc.) every time you log in.
        </p>

        {tfaError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm mb-4">
            {tfaError}
          </div>
        )}
        {tfaSuccess && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded text-sm mb-4">
            {tfaSuccess}
          </div>
        )}

        {/* 2FA Not Enabled — Setup Flow */}
        {!totpEnabled && setupStep === 'idle' && (
          <button
            onClick={handleSetup2FA}
            disabled={tfaLoading}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {tfaLoading ? 'Setting up...' : 'Enable Two-Factor Authentication'}
          </button>
        )}

        {/* QR Code Step */}
        {setupStep === 'qr' && (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
              <p className="text-sm font-medium text-blue-800 mb-3">
                Step 1: Scan this QR code with your authenticator app
              </p>
              {qrCode && (
                <div className="flex justify-center mb-3">
                  <img src={qrCode} alt="2FA QR Code" className="w-48 h-48" />
                </div>
              )}
              <p className="text-xs text-blue-700 mb-2">
                Or enter this secret manually:
              </p>
              <code className="block bg-white px-3 py-2 rounded text-sm font-mono text-gray-800 break-all select-all">
                {totpSecret}
              </code>
            </div>

            <form onSubmit={handleVerify2FA} className="space-y-3">
              <p className="text-sm font-medium text-gray-700">
                Step 2: Enter the 6-digit code from your app to verify
              </p>
              <input
                type="text"
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                required
                maxLength={6}
                className="w-40 px-3 py-2 border border-gray-300 rounded-md text-center text-2xl tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={tfaLoading || verifyCode.length !== 6}
                  className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {tfaLoading ? 'Verifying...' : 'Verify & Enable'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSetupStep('idle');
                    setQrCode('');
                    setTotpSecret('');
                    setVerifyCode('');
                    setTfaError('');
                  }}
                  className="bg-gray-200 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* 2FA Enabled — Disable Option */}
        {totpEnabled && !showDisable && (
          <button
            onClick={() => setShowDisable(true)}
            className="bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700"
          >
            Disable Two-Factor Authentication
          </button>
        )}

        {totpEnabled && showDisable && (
          <form onSubmit={handleDisable2FA} className="space-y-3">
            <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
              <p className="text-sm font-medium text-red-800 mb-3">
                Enter your password to confirm disabling 2FA:
              </p>
              <input
                type="password"
                value={disablePassword}
                onChange={(e) => setDisablePassword(e.target.value)}
                required
                placeholder="Your password"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={tfaLoading}
                className="bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {tfaLoading ? 'Disabling...' : 'Confirm Disable'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowDisable(false);
                  setDisablePassword('');
                  setTfaError('');
                }}
                className="bg-gray-200 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
