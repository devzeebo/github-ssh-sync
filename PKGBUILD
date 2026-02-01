# Maintainer: Your Name <your.email@example.com>
pkgname=github-ssh-sync
pkgver=1.0.0
pkgrel=1
pkgdesc="Sync GitHub SSH public keys to Linux user authorized_keys"
arch=('any')
url="https://github.com/yourusername/github-ssh-sync"
license=('MIT')
depends=('nodejs')
install=github-ssh-sync.install
source=('sync-github-keys.js'
        'config.example.json'
        'github-ssh-sync.service'
        'github-ssh-sync.timer')
sha256sums=('SKIP' 'SKIP' 'SKIP' 'SKIP')

package() {
    # Install the script
    install -Dm755 "$srcdir/sync-github-keys.js" "$pkgdir/opt/$pkgname/sync-github-keys.js"

    # Install example config to /usr/share for reference
    install -Dm644 "$srcdir/config.example.json" "$pkgdir/usr/share/$pkgname/config.example.json"

    # Install systemd units
    install -Dm644 "$srcdir/github-ssh-sync.service" "$pkgdir/usr/lib/systemd/system/github-ssh-sync.service"
    install -Dm644 "$srcdir/github-ssh-sync.timer" "$pkgdir/usr/lib/systemd/system/github-ssh-sync.timer"
}
