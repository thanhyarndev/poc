/**
 * Application-wide constants
 */

// Device identification constants
export const DEVICE_CONSTANTS = {
  client: {
    DEVICE_ID: "CLIENT",
    DEVICE_TOKEN: "123123"
  },

}

// Helper function to get device headers
export const getDeviceHeaders = () => {
  return {
    "Device-ID": DEVICE_CONSTANTS['client'].DEVICE_ID,
    "Device-Token": DEVICE_CONSTANTS['client'].DEVICE_TOKEN
  }
} 