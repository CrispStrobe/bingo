import type { Dict } from './en'

export const de: Dict = {
  'app.name': 'Bingo Party',
  'app.tagline': '75-Kugel-Bingo für die ganze Runde',
  'app.subtitle': 'Runde {round} · {players} Spieler',

  'ball.left': 'noch {n}',
  'caller.start': 'Zum Starten Kugel ziehen',
  'caller.call': 'Kugel ziehen',
  'caller.empty': 'Trommel leer',
  'caller.over': 'Runde beendet',
  'caller.none': 'noch keine Kugel',
  'caller.previous': 'Zuletzt gezogen',
  'caller.board': 'Bisher gezogene Zahlen',
  'caller.bingoOne': '{names} hat Bingo!',
  'caller.bingoMany': '{names} haben Bingo!',

  'ctl.autoCall': 'Auto-Ansage',
  'ctl.autoDaub': 'Auto-Markieren',
  'ctl.speed': 'Tempo der Auto-Ansage',
  'ctl.speed.slow': 'Langsam',
  'ctl.speed.normal': 'Normal',
  'ctl.speed.fast': 'Schnell',
  'ctl.speed.frantic': 'Rasant',
  'ctl.sound': 'Toneffekte',
  'ctl.voice': 'Ansage vorlesen',
  'ctl.help': 'Spielregeln',
  'ctl.about': 'Über',
  'ctl.install': 'Installieren',
  'ctl.newRound': 'Neue Runde',
  'ctl.language': 'Sprache',
  'ctl.pattern': 'Muster',

  'pattern.line': 'Eine Linie',
  'pattern.line.hint': 'Fünf in einer Reihe – waagerecht, senkrecht oder diagonal',
  'pattern.corners': 'Vier Ecken',
  'pattern.corners.hint': 'Die vier Eckfelder',
  'pattern.x': 'Großes X',
  'pattern.x.hint': 'Beide Diagonalen',
  'pattern.blackout': 'Vollkarte',
  'pattern.blackout.hint': 'Die ganze Karte',

  'player.default': 'Spieler {n}',
  'player.add': 'Spieler hinzufügen',
  'player.remove': '{name} entfernen',
  'player.name': 'Name von Spieler {n}',
  'player.wins': 'Gewonnene Runden',
  'player.misses': 'Fehlgriffe in dieser Runde',
  'player.free': 'Freifeld',
  'player.ready': '{n} zu markieren',
  'player.oneAway': 'nur noch eins!',
  'player.toGo': 'noch {n}',
  'player.bingo': 'BINGO!',

  'win.round': 'Runde {round}',
  'win.title': 'BINGO!',
  'win.detail': 'gewonnen mit Kugel {count} ({letter}-{number}) · {misses} Fehlgriffe',
  'win.next': 'Nächste Runde',
  'win.look': 'Karten ansehen',

  'foot.reset': 'Trophäen zurücksetzen',
  'foot.hint': 'Leertaste = ziehen · eigene Zahlen antippen',

  'help.play':
    'Zieh eine Kugel mit dem großen Knopf (oder der Leertaste). Alle suchen die Zahl auf ihrer eigenen Karte und tippen sie an. Wer eine Zahl antippt, die noch nicht gezogen wurde, kassiert einen Fehlgriff.',
  'help.win':
    'Wer als Erster das gewählte Muster voll hat, gewinnt die Runde – das ★ in der Mitte ist geschenkt. Namen und Trophäen bleiben auf diesem Gerät gespeichert.',
  'help.installIos':
    'Aufs iPad holen: Teilen → Zum Home-Bildschirm. Dann startet das Spiel im Vollbild und läuft ganz ohne Internet.',
  'help.installOther':
    'Über das Browsermenü (oder den Installieren-Knopf) installieren – dann läuft das Spiel im Vollbild und offline.',

  'about.title': 'Über Bingo Party',
  'about.version': 'Version {version}',
  'about.description':
    'Ein 75-Kugel-Bingo für ein bis acht Mitspieler an einem Bildschirm. Ohne Konto, ohne Werbung, ohne Tracking – und ohne jede Netzverbindung.',
  'about.author': 'Autor',
  'about.license': 'Lizenz',
  'about.licenseBody':
    'GNU Affero General Public License v3.0, mit einer zusätzlichen Erlaubnis nach Abschnitt 7, die den Vertrieb der offiziellen Binärdateien über App-Marktplätze gestattet.',
  'about.source': 'Quellcode',
  'about.thirdParty': 'Verwendete Open-Source-Software',
  'about.close': 'Schließen',
  'about.privacy': 'Datenschutz',
  'about.privacyBody':
    'Das Spiel speichert Spielernamen, Trophäen und Einstellungen ausschließlich auf diesem Gerät. Es werden keine Daten erhoben und nichts wird irgendwohin gesendet.',
}
