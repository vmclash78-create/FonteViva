import test from "node:test";
import assert from "node:assert/strict";
import { buildQuery } from "../lib/query.mjs";
import { detectTopic } from "../lib/topics.mjs";
test("extrai números, entidades e palavras-chave de uma fala", () => {
 const q = buildQuery("O presidente Lula disse que o desemprego caiu para 6,5% em 2024");
 assert.ok(q.numbers.includes("6,5%")); assert.ok(q.numbers.includes("2024")); assert.ok(q.entities.includes("Lula")); assert.ok(q.keywords.includes("desemprego")); assert.ok(!q.keywords.includes("que"));
});
test("limita o tamanho e remove quebras de linha", () => { const q = buildQuery("a\nb ".repeat(400)); assert.ok(q.text.length <= 300); assert.ok(!q.text.includes("\n")); });
test("detecta assunto automaticamente", () => { assert.equal(detectTopic("a selic subiu"), "economia"); assert.equal(detectTopic("vacinacao infantil"), "saude"); assert.equal(detectTopic("texto sem pista"), "geral"); });
test("extrai anos e meses citados", () => { const q = buildQuery("Em março de 2024 a inflação foi de 0,16%"); assert.deepEqual(q.years, [2024]); assert.deepEqual(q.months, [3]); });
