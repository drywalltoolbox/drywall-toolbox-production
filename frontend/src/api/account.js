import { apiClient } from './client.js';

export async function getAccountSettings() {
  return apiClient('/wp-json/dtb/v1/account');
}

export async function updateAccountSettings(payload) {
  return apiClient('/wp-json/dtb/v1/account', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function changeAccountPassword(currentPassword, newPassword) {
  return apiClient('/wp-json/dtb/v1/account/password', {
    method: 'POST',
    body: JSON.stringify({
      current_password: currentPassword,
      new_password: newPassword,
    }),
  });
}
