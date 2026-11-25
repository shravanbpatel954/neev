import { shareUrl, server } from '../lib/net.js';
import { QR } from './qr.jsx';

export default function OpenOnPhone() {
  const local = /^(localhost|127\.)/.test(location.hostname) && shareUrl().includes('localhost');
  return (
    <div class="qrbox">
      <QR text={shareUrl()} size={150} />
      <b>For a better experience, open it on your phone</b>
      <small>{local ? 'Start the Neev server to get a link your phone can reach.' : server.value === 'live' && shareUrl().startsWith('http://') ? 'Scan while on the same Wi-Fi.' : 'Scan with your phone camera.'}</small>
    </div>
  );
}
