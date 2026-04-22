import { request } from 'undici';
import { env } from './env';
import { logger } from './logger';

export interface SmsProvider {
  sendOtp(phone: string, code: string): Promise<void>;
}

/**
 * Mock provider: writes the OTP to the log instead of calling the SMS API.
 * Safe for local dev and CI — never hits the network.
 *
 * Also keeps the last OTP per phone in memory so tests can retrieve it
 * without scraping logs or brute-forcing bcrypt. This map is only populated
 * in mock mode.
 */
const lastOtpByPhone = new Map<string, string>();

export function _testGetLastOtp(phone: string): string | undefined {
  return lastOtpByPhone.get(phone);
}

class MockTermii implements SmsProvider {
  async sendOtp(phone: string, code: string): Promise<void> {
    lastOtpByPhone.set(phone, code);
    logger.info({ phone, otp: code, provider: 'termii:mock' }, 'OTP generated (mock)');
  }
}

/**
 * Live Termii client: https://developer.termii.com/messaging-api
 * Uses the generic /sms/send endpoint with a short template. Full OTP/token
 * APIs can replace this later when we move OTP generation server-side of
 * Termii.
 */
class LiveTermii implements SmsProvider {
  async sendOtp(phone: string, code: string): Promise<void> {
    if (!env.TERMII_API_KEY) {
      throw new Error('TERMII_MODE=live requires TERMII_API_KEY');
    }
    const body = {
      to: phone,
      from: env.TERMII_SENDER_ID,
      sms: `Your ArtisanHQ verification code is ${code}. It expires in 5 minutes.`,
      type: 'plain',
      channel: 'generic',
      api_key: env.TERMII_API_KEY,
    };
    const res = await request(`${env.TERMII_BASE_URL}/sms/send`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (res.statusCode >= 400) {
      const text = await res.body.text();
      throw new Error(`Termii SMS failed (${res.statusCode}): ${text}`);
    }
  }
}

export const smsProvider: SmsProvider =
  env.TERMII_MODE === 'live' ? new LiveTermii() : new MockTermii();
