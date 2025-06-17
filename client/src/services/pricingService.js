import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

export const getPlans = async () => {
  try {
    const response = await axios.get(`${API_URL}/api/pricing/plans`);
    return response.data;
  } catch (error) {
    console.error('Error fetching plans:', error);
    throw error;
  }
};

export const createSubscription = async (planId, paymentMethodId, token) => {
  try {
    const response = await axios.post(
      `${API_URL}/api/pricing/create-subscription`,
      { planId, paymentMethodId },
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error creating subscription:', error);
    throw error;
  }
};
// Ajoutez cette nouvelle fonction dans pricingService.js
export const startTrialSubscription = async (planId, token) => {
  try {
    const response = await axios.post(
      `${API_URL}/api/pricing/start-trial`,
      { planId },
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error starting trial:', error);
    throw error;
  }
};
export const cancelSubscription = async (token) => {
  try {
    const response = await axios.post(
      `${API_URL}/api/pricing/cancel-subscription`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error canceling subscription:', error);
    throw error;
  }
};

export const getUserSubscription = async (token) => {
  try {
    const response = await axios.get(`${API_URL}/api/pricing/user-subscription`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error getting user subscription:', error);
    throw error;
  }
};

export const createPortalSession = async (token) => {
  try {
    const response = await axios.post(
      `${API_URL}/api/pricing/create-portal-session`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error creating portal session:', error);
    throw error;
  }
};