/**
 * explanations.js – SHAP-style explanations for five example URLs.
 *
 * SHAP splits ONE prediction into additive pieces:
 *   prediction = base rate + contribution(feature 1) + contribution(feature 2) + …
 * The base rate is the average prediction (here: 16% of URLs are phishing).
 * We use probability units to keep the maths friendly; the Python `shap`
 * library reports log-odds unless you ask for probabilities.
 *
 * Each feature: [value shown to the user, contribution to P(phishing)]
 */
export const BASE_RATE = 0.16;

export const EXAMPLES = [
  {
    id: 'bank', label: 'Bank clone', url: 'http://northbank.verify-account.top/signin/verify.php',
    features: {
      domain_age_days: [3, 0.29], suspicious_words: [2, 0.21], has_https: [0, 0.12], url_length: [54, 0.05],
      num_subdomains: [1, 0.04], num_hyphens: [1, 0.04], special_chars: [2, 0.03], has_ip_address: [0, -0.02],
      num_dots: [3, 0.01], path_depth: [2, 0.01],
    },
  },
  {
    id: 'unit', label: 'Unit page', url: 'https://learn.unihub.edu.au/units/cos30049',
    features: {
      domain_age_days: [4380, -0.09], has_https: [1, -0.04], suspicious_words: [0, -0.03], num_subdomains: [2, 0.02],
      path_depth: [2, 0.02], url_length: [43, -0.01], special_chars: [0, -0.01], num_dots: [3, 0.01],
      has_ip_address: [0, 0], num_hyphens: [0, 0],
    },
  },
  {
    id: 'parcel', label: 'Parcel scam', url: 'https://quickparcel-redelivery.info/pay-fee?ref=QP2931',
    features: {
      domain_age_days: [9, 0.33], suspicious_words: [1, 0.12], url_length: [54, 0.1], num_hyphens: [2, 0.09],
      special_chars: [4, 0.07], has_https: [1, -0.06], path_depth: [1, 0.04], num_subdomains: [0, -0.02],
      has_ip_address: [0, -0.01], num_dots: [1, -0.01],
    },
  },
  {
    id: 'shop', label: 'New shop', url: 'https://campus-merch.shop/checkout',
    features: {
      domain_age_days: [120, 0.25], num_hyphens: [1, 0.08], has_https: [1, -0.07], suspicious_words: [0, -0.03],
      url_length: [34, -0.02], special_chars: [1, 0.02], num_subdomains: [0, -0.01], has_ip_address: [0, -0.01],
      path_depth: [1, 0.01], num_dots: [1, 0],
    },
  },
  {
    id: 'ip', label: 'Raw IP login', url: 'http://203.0.113.24/northbank/login.html',
    features: {
      has_ip_address: [1, 0.34], domain_age_days: [0, 0.18], suspicious_words: [1, 0.14], has_https: [0, 0.11],
      path_depth: [2, 0.03], num_dots: [4, 0.03], url_length: [40, 0.02], num_subdomains: [0, -0.02],
      special_chars: [0, -0.01], num_hyphens: [0, -0.01],
    },
  },
];

/**
 * Turn one example into waterfall rows: base → top features → "other" → prediction.
 * Each row knows where its bar starts and ends (the running total).
 */
export function waterfallRows(example, top = 6) {
  const all = Object.entries(example.features)
    .map(([feature, [value, contribution]]) => ({ id: feature, label: `${feature} = ${value}`, contribution }))
    .sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution));
  const rest = all.slice(top);
  const steps = [
    ...all.slice(0, top),
    { id: 'other', label: `${rest.length} other features`, contribution: rest.reduce((s, d) => s + d.contribution, 0) },
  ];
  let running = BASE_RATE;
  const middle = steps.map((d) => {
    const row = { ...d, kind: 'step', start: running, end: running + d.contribution };
    running = row.end;
    return row;
  });
  return [
    { id: 'base', label: 'Base rate E[f(x)]', kind: 'total', start: 0, end: BASE_RATE, contribution: BASE_RATE },
    ...middle,
    { id: 'final', label: 'Prediction f(x)', kind: 'total', start: 0, end: running, contribution: running },
  ];
}
