/**
 * featureImportance.js – what three fictional phishing models "look at".
 *
 * Tree models (sklearn's feature_importances_) give impurity-based importances:
 * always ≥ 0 and they sum to 1 – they say HOW MUCH a feature is used, not in
 * which direction. Logistic regression coefficients (coef_[0], on standardised
 * features) have a SIGN: positive pushes towards "phishing", negative towards
 * "legitimate".
 */
export const MODELS = [
  {
    id: 'rf', label: 'Random Forest', kind: 'importance',
    note: 'Mean decrease in impurity: always ≥ 0 and sums to 1. It says how much, not in which direction.',
    values: {
      domain_age_days: 0.24, suspicious_words: 0.16, has_https: 0.12, url_length: 0.11, num_subdomains: 0.09,
      special_chars: 0.08, has_ip_address: 0.07, num_hyphens: 0.06, num_dots: 0.04, path_depth: 0.03,
    },
  },
  {
    id: 'gb', label: 'Gradient Boosting', kind: 'importance',
    note: 'Boosting leans harder on fewer, stronger features than a random forest does.',
    values: {
      domain_age_days: 0.31, suspicious_words: 0.19, has_ip_address: 0.11, has_https: 0.09, num_subdomains: 0.08,
      url_length: 0.07, special_chars: 0.06, num_hyphens: 0.05, num_dots: 0.025, path_depth: 0.015,
    },
  },
  {
    id: 'lr', label: 'Logistic Regression', kind: 'coefficient',
    note: 'Coefficients on standardised features – the sign tells you the direction of the effect.',
    values: {
      domain_age_days: -1.85, suspicious_words: 1.62, has_https: -1.2, has_ip_address: 1.1, num_subdomains: 0.74,
      special_chars: 0.58, url_length: 0.45, num_hyphens: 0.38, path_depth: -0.21, num_dots: 0.12,
    },
  },
];
