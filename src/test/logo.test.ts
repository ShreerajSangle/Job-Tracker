import { describe, it, expect } from 'vitest';
import { detectImageType, normalizeDomain, belongsToOfficial } from '../../api/_lib/logo';

describe('logo helpers', () => {
  it('detects raster types and rejects svg/html', () => {
    expect(detectImageType(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0]))).toBe('image/png');
    expect(detectImageType(Buffer.from([0xff, 0xd8, 0xff, 0xe0]))).toBe('image/jpeg');
    expect(detectImageType(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>'))).toBeNull();
    expect(detectImageType(Buffer.from('<!doctype html>'))).toBeNull();
  });
  it('normalises domains', () => {
    expect(normalizeDomain('https://www.Stripe.com/jobs')).toBe('stripe.com');
    expect(normalizeDomain('localhost')).toBeNull();
    expect(normalizeDomain('10.0.0.1')).toBeNull();
    expect(normalizeDomain('bad_host.com')).toBeNull();
  });
  it('limits logos to the official host boundary', () => {
    expect(belongsToOfficial('cdn.stripe.com', 'stripe.com')).toBe(true);
    expect(belongsToOfficial('www.stripe.com', 'stripe.com')).toBe(true);
    expect(belongsToOfficial('evilstripe.com', 'stripe.com')).toBe(false);
  });
});
