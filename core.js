(function (root) {
  'use strict';
  const intervals = [1, 2, 4, 8, 16];
  const fresh = () => ({ version: 1, cards: {}, history: [] });
  const initial = () => ({ box: 1, seen: false, weak: false, due: 0 });
  function validate(value, ids) {
    if (!value || value.version !== 1 || !value.cards || typeof value.cards !== 'object' || Array.isArray(value.cards) || !Array.isArray(value.history)) throw Error('Invalid backup');
    const result = fresh();
    for (const [id, c] of Object.entries(value.cards)) {
      if (!ids.includes(id) || !c || !Number.isInteger(c.box) || c.box < 1 || c.box > 5 || typeof c.seen !== 'boolean' || typeof c.weak !== 'boolean' || !Number.isFinite(c.due) || c.due < 0) throw Error('Invalid card');
      result.cards[id] = { box: c.box, seen: c.seen, weak: c.weak, due: c.due };
    }
    result.history = value.history.map(h => {
      if (!h || !ids.includes(h.id) || !Number.isFinite(h.at) || h.at < 0 || typeof h.correct !== 'boolean') throw Error('Invalid history');
      return { id: h.id, at: h.at, correct: h.correct };
    });
    return result;
  }
  function answer(state, id, correct, now = Date.now()) {
    const next = JSON.parse(JSON.stringify(state));
    const previous = state.cards[id] || initial();
    const box = correct ? Math.min(5, previous.box + 1) : 1;
    next.cards[id] = { box, seen: true, weak: !correct, due: now + intervals[box - 1] * 86400000 };
    next.history.push({ id, at: now, correct });
    return next;
  }
  function matches(card, state, filters, now = Date.now()) {
    const c = state.cards[card.id] || initial();
    const query = (filters.search || '').trim().toLocaleLowerCase();
    return (!query || (card.word + ' ' + card.fa).toLocaleLowerCase().includes(query)) &&
      (!filters.type || filters.type === 'all' || card.category === filters.type) &&
      (!filters.box || filters.box === 'all' || c.box === Number(filters.box)) &&
      (!filters.mode || filters.mode === 'all' || (filters.mode === 'due' && (!c.seen || c.due <= now)) || (filters.mode === 'new' && !c.seen) || (filters.mode === 'weak' && c.weak) || (filters.mode === 'seen' && c.seen) || (filters.mode === '5' && c.box === 5));
  }
  const api = { fresh, initial, validate, answer, matches, intervals };
  if (typeof module !== 'undefined') module.exports = api;
  else root.Leitner = api;
})(globalThis);
