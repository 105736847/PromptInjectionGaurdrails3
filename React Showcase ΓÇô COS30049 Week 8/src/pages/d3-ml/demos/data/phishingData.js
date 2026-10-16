/**
 * phishingData.js – a deterministic, synthetic TEST SET for a fictional
 * "phishing URL detector" (the kind of model you train for Assignment 3).
 *
 * Each row is one URL the model has never seen during training:
 *   { id, url, label, score, cluster, features, x, y }
 *   label    – the TRUE class: 0 = legitimate, 1 = phishing
 *   score    – the model's predicted probability of phishing (0…1)
 *   features – what the model looked at (url_length, num_dots, …)
 *   x, y     – a 2-D projection of the model's embedding (think t-SNE / UMAP)
 *
 * In your project these rows come from your FastAPI back-end; here we generate
 * them with a SEEDED random generator so every reload shows identical charts.
 * Class imbalance is realistic: only 16% of the URLs are phishing.
 */
import * as d3 from 'd3';

export const CLASS_NAMES = ['Legitimate', 'Phishing'];

const rng = d3.randomLcg(30049); // same seed → same "random" numbers every time
const normal = d3.randomNormal.source(rng);
const beta = d3.randomBeta.source(rng);
const pick = (items) => items[Math.floor(rng() * items.length)];
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// Groups of similar URLs. cx/cy = where the group sits in the 2-D embedding (x: 0–160, y: 0–100);
// short = the label used when the full name has no room on the chart.
export const CLUSTERS = [
  { name: 'University & government', short: 'Uni & gov', label: 0, count: 230, cx: 32, cy: 36,
    hosts: ['library.unihub.edu.au', 'learn.unihub.edu.au', 'my.riverton.gov.au', 'timetable.unihub.edu.au'],
    paths: ['/', '/search?q=neural+networks', '/units/cos30049', '/timetable/week-8', '/news/open-day', '/help/wifi'] },
  { name: 'News & blogs', short: 'News', label: 0, count: 210, cx: 38, cy: 76,
    hosts: ['dailyharbour.com.au', 'techweekly.io', 'blog.devnotes.dev', 'citypaper.net.au'],
    paths: ['/2026/09/ai-in-classrooms', '/science/solar-record', '/tag/react', '/posts/d3-tips', '/opinion/housing'] },
  { name: 'Shopping', short: 'Shops', label: 0, count: 220, cx: 86, cy: 82,
    hosts: ['shop.greenleaf.com.au', 'www.bookburrow.com', 'kitchenco.store', 'campus-merch.shop'],
    paths: ['/cart', '/products/notebook-a5', '/sale', '/checkout', '/category/hoodies'] },
  { name: 'Cloud & dev tools', short: 'Dev tools', label: 0, count: 180, cx: 75, cy: 44,
    hosts: ['docs.cloudbox.dev', 'app.taskflow.io', 'status.cloudbox.dev', 'api.weatherly.dev'],
    paths: ['/dashboard', '/docs/getting-started', '/v2/forecast?city=hawthorn', '/settings/profile'] },
  { name: 'Bank login clones', short: 'Bank clones', label: 1, count: 65, cx: 134, cy: 26,
    hosts: ['northbank-secure-login.com', 'northbank.verify-account.top', '203.0.113.24', 'secure.northbank.session-check.xyz'],
    paths: ['/signin/verify.php', '/account/update?id=88213', '/login.html?session=expired', '/secure/confirm-identity'] },
  { name: 'Parcel-delivery scams', short: 'Parcel scams', label: 1, count: 50, cx: 131, cy: 70,
    hosts: ['quickparcel-redelivery.info', 'quickparcel.track-fee.xyz', 'parcel-hold.help-desk.site'],
    paths: ['/pay-fee?ref=QP2931', '/track/reschedule', '/customs/charge.php', '/redeliver?id=77&sms=1'] },
  { name: 'Webmail credential harvest', short: 'Webmail', label: 1, count: 45, cx: 96, cy: 12,
    hosts: ['campusmail-quota.support', 'unihub-webmail.login-portal.cc', 'mailbox-upgrade.web-app.link'],
    paths: ['/owa/auth.php', '/quota/increase', '/verify?user=student&token=a8f3'] },
];

/** Hand-made "model score": phishing URLs mostly score high, legitimate ones low, with some overlap. */
function scoreFor(label) {
  const hard = rng() < (label ? 0.16 : 0.1); // a few genuinely ambiguous URLs
  if (label === 1) return hard ? beta(2.2, 2.8)() : beta(6, 1.5)();
  return hard ? beta(3, 3.2)() : beta(1.8, 6.5)();
}

function makeRow(cluster, id) {
  const { label } = cluster;
  const https = rng() < (label ? 0.45 : 0.95);
  const host = pick(cluster.hosts);
  const url = `${https ? 'https' : 'http'}://${host}${pick(cluster.paths)}`;
  const score = clamp(scoreFor(label), 0.001, 0.999);
  const isIp = /^\d+\.\d+\.\d+\.\d+$/.test(host);

  const features = {
    url_length: url.length,
    num_dots: (url.match(/\./g) ?? []).length,
    num_subdomains: isIp ? 0 : Math.max(0, host.split('.').length - 2),
    has_https: https ? 1 : 0,
    special_chars: (url.match(/[-_@?=&%~]/g) ?? []).length,
    domain_age_days: label
      ? Math.round(1 - Math.log(1 - rng()) * 35) // phishing domains are days old
      : Math.round(clamp(normal(2600, 1200)(), 45, 9000)), // real sites are years old
  };

  // Embedding: start in the cluster, then drift towards the nearest cluster of
  // the OTHER class the more the model hesitated – mistakes live on the borders.
  const others = CLUSTERS.filter((c) => c.label !== label);
  const nearest = d3.least(others, (c) => Math.hypot(c.cx - cluster.cx, c.cy - cluster.cy));
  const doubt = label ? 1 - score : score; // 0 = confident and right, 1 = confident and wrong
  const t = clamp(doubt * 0.75 + normal(0, 0.05)(), 0, 0.85);
  const x = clamp(d3.interpolateNumber(cluster.cx, nearest.cx)(t) + normal(0, 5)(), 2, 158);
  const y = clamp(d3.interpolateNumber(cluster.cy, nearest.cy)(t) + normal(0, 5)(), 2, 98);

  return { id, url, label, score, cluster: cluster.name, features, x, y };
}

let nextId = 1;
export const testSet = CLUSTERS.flatMap((cluster) =>
  d3.range(cluster.count).map(() => makeRow(cluster, nextId++)),
);

export const POSITIVES = testSet.filter((d) => d.label === 1).length; // 160
export const PREVALENCE = POSITIVES / testSet.length; // 0.16
