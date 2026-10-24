import test from "node:test";
import assert from "node:assert/strict";
import "../search-core.js";
const search = globalThis.FonteVivaSearch;

test("normaliza acentos, maiúsculas e pontuação", () => {
  assert.equal(search.normalize("VACINAÇÃO, Saúde!"), "vacinacao saude");
});

test("encontra uma palavra com erro simples de digitação", () => {
  assert.ok(search.scoreText("vacinacao", "vacinação e imunização") > 0.72);
  assert.ok(search.scoreText("vacinacão", "vacinação e imunização") > 0.72);
});

test("não confunde uma busca sem relação com correspondência", () => {
  assert.equal(search.scoreText("astronauta", "vacinação e imunização"), 0);
});

test("retorna zero para corpus vazio e valor neutro para consulta vazia", () => {
  assert.equal(search.scoreText("vacina", ""), 0);
  assert.equal(search.scoreText("", "qualquer conteúdo"), 1);
});

test("a busca por frase exata tem pontuação maior que correspondência parcial", () => {
  const exact = search.scoreText("clima e evidência", "clima e evidência científica");
  const partial = search.scoreText("clima evidência", "clima e evidência científica");
  assert.ok(exact > 0);
  assert.ok(partial > 0);
});

test("distância de edição cobre casos básicos", () => {
  assert.equal(search.editDistance("fonte", "fonte"), 0);
  assert.equal(search.editDistance("fonte", "fonti"), 1);
  assert.equal(search.editDistance("", "viva"), 4);
});
