import test from "node:test";
import assert from "node:assert/strict";
import handler from "../netlify/functions/search.mjs";
const call = (qs, method = "GET", ip = "1.1.1.1") => handler(new Request("https://x.test/.netlify/functions/search" + qs, { method }), { ip });
test("a função devolve Response (formato exigido pelo Netlify Functions v2)", async () => { const res = await call("?q=a"); assert.ok(res instanceof Response); assert.equal(res.status, 400); });
test("rejeita métodos diferentes de GET e consultas longas", async () => { assert.equal((await call("?q=teste", "POST")).status, 405); assert.equal((await call("?q=" + "a".repeat(301))).status, 400); });
test("limita a frequência por IP", async () => { let last; for (let i = 0; i < 22; i += 1) last = await call("?q=a", "GET", "9.9.9.9"); assert.equal(last.status, 429); });
