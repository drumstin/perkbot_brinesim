export function addEvent(game, text) {
  game.log.unshift({ id: game.eventSeq++, text, time: game.elapsed });
  game.log = game.log.slice(0, 14);
}
