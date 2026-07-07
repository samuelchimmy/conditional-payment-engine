import OneSignal from 'react-onesignal';

let initialized = false;

export async function initOneSignal() {
  if (initialized || typeof window === 'undefined') return;
  
  try {
    await OneSignal.init({
      appId: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID || "placeholder-onesignal-app-id",
      allowLocalhostAsSecureOrigin: true,
      notifyButton: {
        enable: false,
      },
    });
    initialized = true;
    console.log("OneSignal initialized");
  } catch (e) {
    console.error("OneSignal init error:", e);
  }
}

export async function loginToOneSignal(walletAddress: string, username?: string) {
  if (!initialized) await initOneSignal();
  try {
    await OneSignal.login(walletAddress.toLowerCase());
    if (username) {
      await OneSignal.User.addTags({ username: username });
    }
  } catch (e) {
    console.error("OneSignal login error:", e);
  }
}

export async function logoutFromOneSignal() {
  if (!initialized) return;
  try {
    await OneSignal.logout();
  } catch (e) {
    console.error("OneSignal logout error:", e);
  }
}
