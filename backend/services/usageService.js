import https from 'https';
import http from 'http';
import { URL } from 'url';
import { getUsageCollectionPreference } from './preferencesService.js';

// Webhook URL for usage collection
const USAGE_WEBHOOK_URL = 'https://activepieces.coolify.intrane.fr/api/v1/webhooks/6kWAx6VZTA2nYOYijOo3K';

/**
 * Send anonymous usage data to the webhook
 * @param {Object} data - Usage data to send
 * @param {number|string} data.exit_code - Script exit code
 * @param {boolean} data.error - Whether the script had an error
 * @returns {Promise<void>}
 */
export const sendUsageData = async (data) => {
  try {
    // Check if usage collection is enabled
    const usageCollectionEnabled = await getUsageCollectionPreference();
    if (usageCollectionEnabled !== true) {
      return; // Don't send data if not enabled
    }

    // Prepare URL with query parameters
    const url = new URL(USAGE_WEBHOOK_URL);
    url.searchParams.append('exit_code', data.exit_code);
    url.searchParams.append('error', data.error ? 'true' : 'false');

    // Send the request
    await makeRequest(url.toString());
    console.log('[Usage] Sent anonymous usage data');
  } catch (error) {
    // Silently fail - don't log errors to avoid cluttering logs
    // This is intentional as per requirements
  }
};

/**
 * Make an HTTP/HTTPS request
 * @param {string} url - URL to request
 * @returns {Promise<void>}
 */
function makeRequest(url) {
  return new Promise((resolve) => {
    const parsedUrl = new URL(url);
    const requestModule = parsedUrl.protocol === 'https:' ? https : http;
    
    const req = requestModule.get(url, (res) => {
      // We don't care about the response data
      res.resume();
      resolve();
    });
    
    // Set a timeout to avoid hanging
    req.setTimeout(5000, () => {
      req.destroy();
      resolve();
    });
    
    // Handle errors silently
    req.on('error', () => {
      resolve();
    });
    
    req.end();
  });
}
