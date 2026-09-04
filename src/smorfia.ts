/**
 * Family-friendly Neapolitan Smorfia calls. The associations are traditional;
 * the wording softens a handful of adult entries for an all-ages game.
 * Artwork is bundled from Noto Emoji under Apache-2.0.
 */
const calls = [
  ['1f5fa', "L'Italia"], ['1f467', "'A piccerella"], ['1f408', "'A jatta"],
  ['1f416', "'O puorco"], ['270b', "'A mano"], ['1f440', "Chella ca guarda 'nterra"],
  ['1f3fa', "'O vasetto"], ['1f607', "'A Maronna"], ['1f476', "'A figliata"],
  ['1fad8', "'E fasule"], ['1f401', "'E suricille"], ['1fa96', "'E surdate"],
  ['1f525', "Sant'Antonio"], ['1f974', "'O mbriaco"], ['1f9d2', "'O guaglione"],
  ['1f351', "'O fondoschiena"], ['26c8', "'A disgrazia"], ['1fa78', "'O sanghe"],
  ['1f602', "'A resata"], ['1f389', "'A festa"], ['1f483', "'A bella signora"],
  ['1f92a', "'O pazzo"], ['1f921', "'O scemo"], ['1f46e', "'E guardie"],
  ['1f384', 'Natale'], ['1f380', 'Nanninella'], ['1faa3', "'O cantero"],
  ['1f457', "'O vestito"], ['1f468', "'O pate d'e criature"], ['26bd', "'E palle d'o tenente"],
  ['1f3e0', "'O padrone 'e casa"], ['1f41f', "'O capitone"], ['271d', "Ll'anne 'e Cristo"],
  ['1f9e0', "'A capa"], ['1f426', "Ll'aucielluzzo"], ['1fa87', "'E castagnelle"],
  ['1f9d8', "'O monaco"], ['1f94a', "'E mazzate"], ['1faa2', "'A funa 'nganna"],
  ['1f963', "'A paposcia"], ['1f52a', "'O curtiello"], ['2615', "'O ccafè"],
  ['1f475', "Onna pereta fore ô balcone"], ['1fa9f', "'E ccancelle"], ['1f377', "'O vino bbuono"],
  ['1fa99', "'E denare"], ['1faa6', "'O muorto"], ['1f4ac', "'O muorto che pparla"],
  ['1f969', "'O piezzo 'e carne"], ['1f35e', "'O ppane"], ['1f333', "'O ciardino"],
  ['1f469', "'A mamma"], ['1f474', "'O viecchio"], ['1f3a9', "'O cappiello"],
  ['1f3b5', "'A museca"], ['1f342', "'A caruta"], ['1f42a', "'O scartellato"],
  ['1f4e6', "'O paccotto"], ['1f487', "'E pile"], ['1f629', 'Se lamenta'],
  ['1f3f9', "'O cacciatore"], ['2694', "'O muorto acciso"], ['1f470', "'A sposa"],
  ['1f9e5', "'A sciammeria"], ['1f62d', "'O chianto"], ['1f46d', "'E ddoie zetelle"],
  ['1f3b8', "'O totaro int'a chitarra"], ['1f372', "'A zuppa cotta"], ['1f504', "Sott'e 'ncoppa"],
  ['1f3db', "'O palazzo"], ['1f4a9', "L'ommo poco gentile"], ['2728', "'A maraviglia"],
  ['1f3e5', "'O spitale"], ['1f573', "'A rotta"], ['1f3ad', 'Pulecenella'],
  ['26f2', "'A funtana"], ['1f479', "'E riavule"], ['1f339', "'A bella figliola"],
  ['1f977', "'O mariuolo"], ['1f444', "'A vocca"], ['1f490', "'E sciure"],
  ['1f37d', "'A tavula 'mbandita"], ['1f327', "'O maletiempo"], ['26ea', "'A chiesa"],
  ['1f47b', "Ll'aneme d'o priatorio"], ['1f3ea', "'A puteca"], ['1fab2', "'E perucchie"],
  ['1f9c0', "'E casecavalle"], ['1f475', "'A vecchia"], ['1f631', "'A paura"],
] as const

export type SmorfiaCall = { number: number; icon: string; label: string }

export const SMORFIA: readonly SmorfiaCall[] = calls.map(([icon, label], index) => ({
  number: index + 1,
  icon,
  label,
}))

export function smorfiaFor(number: number): SmorfiaCall | undefined {
  return SMORFIA[number - 1]
}

export function smorfiaIconUrl(icon: string): string {
  return `${import.meta.env.BASE_URL}smorfia/${icon}.svg`
}
