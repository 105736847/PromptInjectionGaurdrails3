/**
 * multiclass.js – test results of a fictional 5-class URL classifier.
 *
 * MATRIX[actual][predicted] = number of URLs – exactly what sklearn's
 * confusion_matrix(y_true, y_pred) returns (rows = truth, columns = prediction).
 */
export const CLASSES = ['benign', 'phishing', 'malware', 'defacement', 'spam'];

export const MATRIX = [
  // predicted: benign phishing malware defacement spam
  [1180, 22, 8, 25, 15], // actual benign
  [30, 262, 18, 4, 36], // actual phishing
  [12, 21, 236, 6, 5], // actual malware
  [28, 3, 7, 302, 0], // actual defacement
  [19, 34, 4, 1, 122], // actual spam
];

// A few URLs of each TRUE class, used to show examples of a mistake.
const POOL = {
  benign: ['https://learn.unihub.edu.au/login', 'https://shop.greenleaf.com.au/checkout?step=2',
    'https://docs.cloudbox.dev/auth/reset-password', 'https://dailyharbour.com.au/verify-subscription',
    'https://campus-merch.shop/account/update'],
  phishing: ['http://northbank-secure-login.com/signin/verify.php', 'https://unihub-webmail.login-portal.cc/owa',
    'http://quickparcel.track-fee.xyz/pay-fee?ref=QP2931', 'http://203.0.113.24/northbank/login.html',
    'https://mailbox-upgrade.web-app.link/quota'],
  malware: ['http://free-codecs.download-now.top/setup.exe', 'http://198.51.100.7/update/flashplayer.apk',
    'https://cracked-ide.warez.cc/pro-keygen.zip', 'http://invoice-2026.docs-share.link/invoice.pdf.js',
    'http://driver-fix.support-pc.info/scan.msi'],
  defacement: ['http://riverton-bowls.club/index.php?option=com_content&hacked=1', 'http://oldsite.localcouncil.org/~admin/',
    'http://smallbiz-plumbing.com.au/wp-content/owned.html', 'http://choir.community.net/index.php?id=4',
    'http://bakery-hawthorn.com/images/pwn.htm'],
  spam: ['http://win-a-phone.promo-2026.xyz/claim', 'http://cheap-textbooks.best-deal.top/?ref=spam77',
    'https://crypto-double.now-invest.biz/join', 'http://diet-pills.health-news.click/', 'http://lucky-spin.prize-hub.fun/win'],
};

/** Up to 3 example URLs that are really `actual` but were predicted as `predicted`. */
export function examplesFor(actual, predicted) {
  const pool = POOL[CLASSES[actual]];
  const count = Math.min(3, MATRIX[actual][predicted]);
  // Deterministic "random" pick: rotate the pool by a number derived from the cell.
  return Array.from({ length: count }, (_, i) => pool[(actual * 3 + predicted * 2 + i) % pool.length]);
}
