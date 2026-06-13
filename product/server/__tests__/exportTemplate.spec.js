'use strict'

const { buildInsuranceHtml } = require('../lib/exportTemplate')

const GENERATED_AT = new Date('2026-06-13T12:00:00Z')

describe('buildInsuranceHtml', () => {
  describe('happy path — two items', () => {
    let html

    beforeAll(() => {
      html = buildInsuranceHtml(
        [
          {
            id: '1',
            make: 'Leica',
            model: 'M6',
            serial: 'SN-001',
            condition: 'Excellent',
            purchaseDate: '2020-01-15',
            purchasePrice: 1200,
            currentValue: 1200,
          },
          {
            id: '2',
            make: 'Nikon',
            model: 'F3',
            serial: 'SN-002',
            condition: 'Good',
            purchaseDate: '2019-06-01',
            purchasePrice: 300,
            currentValue: 400,
          },
        ],
        { generatedAt: GENERATED_AT }
      )
    })

    it('returns a string starting with <!doctype html', () => {
      expect(html.toLowerCase()).toContain('<!doctype html')
    })

    it('contains both item makes', () => {
      expect(html).toContain('Leica')
      expect(html).toContain('Nikon')
    })

    it('contains both item models', () => {
      expect(html).toContain('M6')
      expect(html).toContain('F3')
    })
  })

  describe('collection total', () => {
    it('shows the formatted sum of currentValue fields ($1,600.00)', () => {
      const html = buildInsuranceHtml(
        [
          { id: '1', make: 'A', currentValue: 1200 },
          { id: '2', make: 'B', currentValue: 400 },
        ],
        { generatedAt: GENERATED_AT }
      )
      expect(html).toContain('$1,600.00')
    })

    it('treats a missing currentValue as 0 when summing', () => {
      const html = buildInsuranceHtml(
        [
          { id: '1', make: 'A', currentValue: 500 },
          { id: '2', make: 'B' },
        ],
        { generatedAt: GENERATED_AT }
      )
      expect(html).toContain('$500.00')
    })
  })

  describe('empty collection', () => {
    it('returns a valid HTML document and does not throw', () => {
      expect(() =>
        buildInsuranceHtml([], { generatedAt: GENERATED_AT })
      ).not.toThrow()
    })

    it('contains <!doctype html when the collection is empty', () => {
      const html = buildInsuranceHtml([], { generatedAt: GENERATED_AT })
      expect(html.toLowerCase()).toContain('<!doctype html')
    })

    it('shows a total of $0.00 for an empty collection', () => {
      const html = buildInsuranceHtml([], { generatedAt: GENERATED_AT })
      expect(html).toContain('$0.00')
    })
  })

  describe('missing-field fallbacks', () => {
    it('renders without throwing when only currentValue is provided', () => {
      expect(() =>
        buildInsuranceHtml([{ id: '1', currentValue: 99 }], {
          generatedAt: GENERATED_AT,
        })
      ).not.toThrow()
    })

    it('uses a dash placeholder for missing make/model/serial/condition', () => {
      const html = buildInsuranceHtml([{ id: '1', currentValue: 99 }], {
        generatedAt: GENERATED_AT,
      })
      // The em-dash fallback character used in the template
      expect(html).toContain('—')
    })
  })

  describe('serial field', () => {
    it('renders the serial field value (not serialNumber)', () => {
      const html = buildInsuranceHtml(
        [
          {
            id: '1',
            make: 'Canon',
            model: 'AE-1',
            serial: 'SN-123',
            currentValue: 200,
          },
        ],
        { generatedAt: GENERATED_AT }
      )
      expect(html).toContain('SN-123')
    })
  })

  describe('XSS escaping', () => {
    it('escapes a malicious make value in text content', () => {
      const html = buildInsuranceHtml(
        [{ id: '1', make: '<script>alert(1)</script>', currentValue: 0 }],
        { generatedAt: GENERATED_AT }
      )
      expect(html).not.toContain('<script>')
      expect(html).toContain('&lt;script&gt;')
    })

    it('escapes a malicious photoPath in the src attribute', () => {
      const html = buildInsuranceHtml(
        [
          {
            id: '1',
            make: 'Safe',
            photoPath: '"><img onerror=alert(1)/>',
            currentValue: 0,
          },
        ],
        { generatedAt: GENERATED_AT }
      )
      // The injected " must be encoded as &quot; so it cannot close the src attribute early.
      // If encoding works, the src value will contain &quot; and the raw onerror= string
      // will appear inside the attribute value, not as a live event handler.
      expect(html).toContain('&quot;')
      // The literal attribute-breaking sequence " followed by space or > must NOT appear
      // inside the src value — we check that no raw un-escaped double-quote precedes
      // the injected payload's onerror fragment outside of the attribute wrapper.
      expect(html).not.toContain('" onerror')
      expect(html).not.toContain('"><img onerror')
    })
  })
})
