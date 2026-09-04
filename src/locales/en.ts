// English is the source of truth: every other locale is type-checked against it.
export const en = {
  'app.name': 'Bingo Party',
  'app.tagline': '75-ball bingo for the whole table',
  'app.subtitle': 'Round {round} · {players} players',

  'ball.left': '{n} left',
  'caller.start': 'Press call to start',
  'caller.call': 'Call ball',
  'caller.empty': 'Drum empty',
  'caller.over': 'Round over',
  'caller.none': 'no calls yet',
  'caller.previous': 'Previous calls',
  'caller.board': 'Numbers called so far',
  'caller.bingoOne': '{names} has bingo!',
  'caller.bingoMany': '{names} have bingo!',

  'ctl.autoCall': 'Auto-call',
  'ctl.autoDaub': 'Auto-daub',
  'ctl.speed': 'Auto-call speed',
  'ctl.speed.slow': 'Slow',
  'ctl.speed.normal': 'Normal',
  'ctl.speed.fast': 'Fast',
  'ctl.speed.frantic': 'Frantic',
  'ctl.sound': 'Sound effects',
  'ctl.voice': 'Spoken caller',
  'ctl.help': 'How to play',
  'ctl.about': 'About',
  'ctl.install': 'Install',
  'ctl.newRound': 'New round',
  'ctl.language': 'Language',
  'ctl.pattern': 'Pattern',

  'pattern.line': 'Any line',
  'pattern.line.hint': 'Five in a row — across, down or diagonally',
  'pattern.corners': 'Four corners',
  'pattern.corners.hint': 'The four corner squares',
  'pattern.x': 'Big X',
  'pattern.x.hint': 'Both diagonals',
  'pattern.blackout': 'Blackout',
  'pattern.blackout.hint': 'The whole card',

  'player.default': 'Player {n}',
  'player.add': 'Add player',
  'player.remove': 'Remove {name}',
  'player.name': 'Name of player {n}',
  'player.wins': 'Rounds won',
  'player.misses': 'Wrong daubs this round',
  'player.free': 'Free space',
  'player.ready': '{n} to daub',
  'player.oneAway': 'one away!',
  'player.toGo': '{n} to go',
  'player.bingo': 'BINGO!',

  'win.round': 'Round {round}',
  'win.title': 'BINGO!',
  'win.detail': 'won on ball {count} ({letter}-{number}) · {misses} misses',
  'win.next': 'Next round',
  'win.look': 'Look at the cards',

  'foot.reset': 'Reset trophies',
  'foot.hint': 'Space = call · tap your numbers to daub',

  'help.play':
    'Call a ball with the big button (or the space bar). Every player then finds that number on their own card and taps it. Tapping a number that has not been called counts as a miss.',
  'help.win':
    'The first card to complete the chosen pattern wins the round — the ★ in the centre is free. Names and trophies are remembered on this device.',
  'help.installIos':
    'Keep it on the iPad: Share → Add to Home Screen. It then opens full screen and plays with no internet at all.',
  'help.installOther':
    'Install it from your browser menu (or the Install button) to play full screen and offline.',

  'about.title': 'About Bingo Party',
  'about.version': 'Version {version}',
  'about.description':
    'A 75-ball bingo game for one to eight players sharing a screen. No accounts, no adverts, no tracking, and no network connection of any kind.',
  'about.author': 'Author',
  'about.license': 'Licence',
  'about.licenseBody':
    'GNU Affero General Public License v3.0, with an additional permission under section 7 allowing the official binaries to be distributed through app marketplaces.',
  'about.source': 'Source code',
  'about.thirdParty': 'Open source in this app',
  'about.close': 'Close',
  'about.privacy': 'Privacy',
  'about.privacyBody':
    'The game stores player names, trophies and settings on this device only. Nothing is collected, and nothing is sent anywhere.',

  'lan.title': 'Play together over Wi-Fi',
  'lan.body':
    'One device hosts and the others join with their own card — no accounts, no internet, nothing leaves your network.',
  'lan.start': 'Share this game',
  'lan.stop': 'Stop sharing',
  'lan.hosting': 'Sharing',
  'lan.scan':
    'Point a phone or tablet camera at this, or type the address into any browser on the same Wi-Fi.',
  'lan.connected': '{n} connected',
  'lan.nativeOnly': 'Sharing needs the installed app. The web version can only join.',
  'lan.failed': 'Could not start: {error}',
  'lan.connecting': 'Connecting to the host…',
  'lan.lost': 'Connection lost — trying again…',
  'lan.join': 'Join the game',
  'lan.joinAs': 'Join as a new player',
  'lan.takeSeat': 'Take this card',
  'lan.taken': 'in use',
  'lan.namePlaceholder': 'Your name',
  'lan.full': 'The game is full — eight players is the maximum.',
  'lan.yourCard': 'Your card',
  'lan.others': 'Other players',
  'lan.leave': 'Leave',
  'lan.waiting': 'Waiting for the host to call a ball…',
}

export type Dict = typeof en
export type Key = keyof Dict
