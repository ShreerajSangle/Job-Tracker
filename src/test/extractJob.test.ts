import { describe, it, expect } from 'vitest';
import { assertPublicHttpUrl, htmlToReadableText } from '../../api/_lib/extractJob';

describe('assertPublicHttpUrl', () => {
  it('accepts ordinary public http(s) URLs', () => {
    expect(assertPublicHttpUrl('https://acme.com/careers/123').hostname).toBe('acme.com');
    expect(assertPublicHttpUrl('http://acme.com/jobs/1').hostname).toBe('acme.com');
  });

  it('rejects non-http(s) schemes', () => {
    expect(() => assertPublicHttpUrl('ftp://acme.com/file')).toThrow();
    expect(() => assertPublicHttpUrl('file:///etc/passwd')).toThrow();
  });

  it('rejects loopback and private/link-local IP-literal hosts', () => {
    expect(() => assertPublicHttpUrl('http://127.0.0.1/')).toThrow();
    expect(() => assertPublicHttpUrl('http://localhost/')).toThrow();
    expect(() => assertPublicHttpUrl('http://10.0.0.5/')).toThrow();
    expect(() => assertPublicHttpUrl('http://192.168.1.1/')).toThrow();
    expect(() => assertPublicHttpUrl('http://169.254.169.254/latest/meta-data/')).toThrow();
    expect(() => assertPublicHttpUrl('http://172.16.0.1/')).toThrow();
  });

  it('rejects .local and .internal hostnames', () => {
    expect(() => assertPublicHttpUrl('http://printer.local/')).toThrow();
    expect(() => assertPublicHttpUrl('http://db.internal/')).toThrow();
  });
});

describe('htmlToReadableText', () => {
  it('strips scripts, styles, nav, and footer noise', () => {
    const html = `
      <html><head><title>Senior Engineer at Acme</title>
      <style>.x { color: red; }</style></head>
      <body>
        <nav>Home About</nav>
        <script>console.log('x')</script>
        <main>We are looking for a Senior Engineer to join our team.</main>
        <footer>Copyright 2026</footer>
      </body></html>`;
    const text = htmlToReadableText(html);
    expect(text).toContain('Senior Engineer at Acme');
    expect(text).toContain('We are looking for a Senior Engineer');
    expect(text).not.toContain('console.log');
    expect(text).not.toContain('color: red');
    expect(text).not.toContain('Home About');
    expect(text).not.toContain('Copyright 2026');
  });

  it('decodes common HTML entities', () => {
    const html = '<title>R&amp;D Engineer</title><body>Fun &quot;stuff&quot; &amp; more</body>';
    const text = htmlToReadableText(html);
    expect(text).toContain('R&D Engineer');
    expect(text).toContain('Fun "stuff" & more');
  });
});
