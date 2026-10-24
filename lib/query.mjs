import "../search-core.js";
const S = globalThis.FonteVivaSearch;
export const normalize = S.normalize;
export const scoreText = S.scoreText;
const STOP = new Set(("a o as os um uma uns umas de do da dos das em no na nos nas por para com sem sobre entre ate que se e ou mas como mais menos muito muita muitos muitas ja nao sim foi ser sao era eram tem tinha teve ter vai vao esta estao estar este esse essa isso isto aquele aquela seu sua seus suas ele ela eles elas lhe mesmo mesma tambem so apenas quando onde qual quais quem cada todo toda todos todas ainda depois antes durante segundo disse diz falou afirmou afirma afirmando fala falando brasil").split(" "));
const MONTHS = ["janeiro", "fevereiro", "marco", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
export function buildQuery(raw) {
 const text = String(raw ?? "").replace(/[\r\n]+/g, " ").trim().slice(0, 300);
 const numbers = [...new Set((text.match(/\d+(?:[.,]\d+)*\s?%?/g) || []).map((n) => n.trim()))];
 const entities = [];
 const words = text.split(/\s+/);
 words.forEach((word, index) => { const clean = word.replace(/^[^\p{L}]+|[^\p{L}]+$/gu, ""); if (index > 0 && /^\p{Lu}\p{L}{2,}$/u.test(clean) && !STOP.has(normalize(clean))) entities.push(clean); });
 const tokens = normalize(text).split(" ").filter((t) => t.length >= 3 && !STOP.has(t));
 const keywords = [...new Set([...entities.map(normalize), ...tokens])].slice(0, 8);
 const years = [...new Set(text.match(/\b(?:19|20)\d{2}\b/g) || [])].map(Number);
 const norm = normalize(text);
 const months = MONTHS.map((m, i) => (new RegExp("\\b" + m + "\\b").test(norm) ? i + 1 : 0)).filter(Boolean);
 return { text, years, months, numbers, entities: [...new Set(entities)], keywords, searchString: keywords.slice(0, 6).join(" ") };
}
