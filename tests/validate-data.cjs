const fs = require("node:fs");
const vm = require("node:vm");
const assert = require("node:assert/strict");

const source = fs.readFileSync("data/claims.js", "utf8");
const context = { window: {} };
vm.runInNewContext(source, context, { filename: "data/claims.js" });
const claims = context.window.FONTEVIVA_CLAIMS;

assert.ok(Array.isArray(claims), "FONTEVIVA_CLAIMS must be an array");
assert.ok(claims.length > 0, "At least one demonstration record is expected");

const ids = new Set();
const allowedVerdicts = new Set(["true", "false", "partial", "inconclusive"]);

for (const claim of claims) {
  assert.equal(typeof claim.id, "string", "Each record needs a string id");
  assert.ok(claim.id.length > 0, "Record ids cannot be empty");
  assert.ok(!ids.has(claim.id), `Duplicate record id: ${claim.id}`);
  ids.add(claim.id);

  assert.equal(typeof claim.claim, "string", `${claim.id}: claim must be text`);
  assert.ok(claim.claim.trim().length > 0, `${claim.id}: claim cannot be empty`);
  assert.ok(allowedVerdicts.has(claim.verdict), `${claim.id}: unsupported verdict`);
  assert.equal(typeof claim.verdictLabel, "string", `${claim.id}: verdictLabel is required`);
  assert.ok(Array.isArray(claim.sources), `${claim.id}: sources must be an array`);
  assert.ok(Array.isArray(claim.tags), `${claim.id}: tags must be an array`);

  for (const source of claim.sources) {
    assert.equal(typeof source.label, "string", `${claim.id}: source label is required`);
    if (source.url) {
      assert.ok(/^https?:\/\//i.test(source.url), `${claim.id}: source URL must use HTTP(S)`);
    }
  }
}

console.log(`Validated ${claims.length} demonstration claim records.`);
