/**
 * Standardized API response formatter.
 * Use this to return consistent JSON responses to the frontend.
 */
class ApiResponse {
  constructor(statusCode, data, message = 'Success') {
    this.statusCode = statusCode;
    this.message = message;
    this.success = statusCode < 400;
    
    // Spread data properties directly onto the response to match frontend expectations
    // (e.g. response.data.reviews instead of response.data.data.reviews)
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      Object.assign(this, data);
    } else {
      this.data = data;
    }
  }
}

module.exports = ApiResponse;
