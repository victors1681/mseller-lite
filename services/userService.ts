import { httpsCallable } from "firebase/functions";
import { auth, functions } from "../config/firebase";
import { IConfig, UserTypes } from "../types/user";
import { axiosSetClientUrl, refreshAccessToken } from "./api";

/**
 * Refresh the current user's access token
 */
export const refreshUserAccessToken = async (): Promise<string | undefined> => {
  return refreshAccessToken();
};

/**
 * Get current user profile from Firebase function
 */
export const getAllCurrentProfile = async (): Promise<
  UserTypes | undefined
> => {
  try {
    const fn = httpsCallable(functions, "getUserProfileV2");
    const profileDataResponse = await fn();
    const userData = profileDataResponse.data as UserTypes;

    // Set axios client URL based on user config
    axiosSetClientUrl(userData.business.config, userData.testMode);

    return userData;
  } catch (error) {
    console.error("Error fetching user profile:", error);
    throw error;
  }
};

/**
 * Get user by access token from Firebase function
 */
export const getUserByAccessToken = async (
  accessToken: string,
): Promise<UserTypes | undefined> => {
  try {
    const fn = httpsCallable(functions, "getUserByAccessToken");
    const response = await fn({ accessToken });
    return response.data as UserTypes;
  } catch (error) {
    console.error("Error fetching user by access token:", error);
    throw error;
  }
};

/**
 * Initialize user session after login
 * This function will fetch user profile and configure the API client
 */
export const initializeUserSession = async (): Promise<
  UserTypes | undefined
> => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error("No authenticated user found");
    }

    // Get fresh token
    await user.getIdToken(true);
    console.log("User token refreshed successfully");

    // Fetch user profile
    const userData = await getAllCurrentProfile();

    if (userData) {
      console.log("User profile loaded:", {
        userId: userData.userId,
        email: userData.email,
        business: userData.business.name,
        testMode: userData.testMode,
      });
    }

    return userData;
  } catch (error) {
    console.error("Error initializing user session:", error);
    throw error;
  }
};

/**
 * Update user profile in Firebase
 */
export const updateUserProfile = async (
  profileData: Partial<UserTypes>,
): Promise<UserTypes | undefined> => {
  try {
    const fn = httpsCallable(functions, "updateUserProfile");
    const response = await fn(profileData);
    return response.data as UserTypes;
  } catch (error) {
    console.error("Error updating user profile:", error);
    throw error;
  }
};

/**
 * Get business configuration
 */
export const getBusinessConfig = async (): Promise<IConfig | undefined> => {
  try {
    const userData = await getAllCurrentProfile();
    return userData?.business.config;
  } catch (error) {
    console.error("Error fetching business config:", error);
    throw error;
  }
};
