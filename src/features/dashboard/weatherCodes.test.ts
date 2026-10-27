import { expect, it } from 'vitest';
import { describeWeather } from './weatherCodes';

it('maps WMO codes', () => {
  expect(describeWeather(0).kind).toBe('clear');
  expect(describeWeather(63).kind).toBe('rain');
  expect(describeWeather(73).kind).toBe('snow');
  expect(describeWeather(95).kind).toBe('storm');
  expect(describeWeather(45).label).toBe('Foggy');
});
