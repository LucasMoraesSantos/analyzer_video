import assert from 'node:assert/strict';
import test from 'node:test';
import { parseScriptOutput } from '../script-output-parser.logic.js';

const valid = {
  hook: 'Pare tudo',
  abertura: 'Hoje você vai aprender',
  desenvolvimento: 'Passo 1, 2, 3',
  fechamento: 'Resumo final',
  cta: 'Comente agora',
  sugestoesTextoTela: ['dica 1'],
  sugestaoNarracao: 'Tom energético',
  sugestoesCortesCenas: ['corte rápido']
};

test('parseia roteiro JSON válido', () => {
  const res = parseScriptOutput(JSON.stringify(valid));
  assert.equal(res.recovered, false);
  assert.equal(res.parsed.cta, 'Comente agora');
});

test('recupera roteiro com markdown/trailing comma', () => {
  const malformed = "```json\n{\n\"hook\":\"Pare tudo\",\n\"abertura\":\"Hoje\",\n\"desenvolvimento\":\"A\",\n\"fechamento\":\"B\",\n\"cta\":\"C\",\n\"sugestoesTextoTela\":[\"x\"],\n\"sugestaoNarracao\":\"N\",\n\"sugestoesCortesCenas\":[\"y\"],\n}\n```";
  const res = parseScriptOutput(malformed);
  assert.equal(res.recovered, true);
  assert.equal(res.parsed.hook, 'Pare tudo');
});
