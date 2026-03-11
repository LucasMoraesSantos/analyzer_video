import assert from 'node:assert/strict';
import test from 'node:test';
import { parseSummaryOutput } from '../summary-output-parser.logic.js';

const validPayload = {
  temaCentral: 'Tema',
  nicho: 'vendas',
  ganchoInicial: 'Gancho',
  promessa: 'Promessa',
  estruturaDoVideo: 'Estrutura',
  tom: 'Direto',
  emocaoPredominante: 'Urgência',
  elementosVirais: ['lista'],
  publicoProvavel: 'Iniciantes',
  palavrasChave: ['vendas'],
  resumoExecutivo: 'Resumo',
  insightDeRecriacao: 'Insight',
  riscosDeCopia: 'Risco',
  roteiroBaseInspiracional: 'Roteiro'
};

test('parseia JSON válido sem recuperação', () => {
  const result = parseSummaryOutput(JSON.stringify(validPayload));
  assert.equal(result.recovered, false);
  assert.equal(result.parsed.nicho, 'vendas');
});

test('recupera JSON dentro de markdown com vírgula sobrando', () => {
  const malformed = "```json\n{\n  \"temaCentral\": \"Tema\",\n  \"nicho\": \"vendas\",\n  \"ganchoInicial\": \"Gancho\",\n  \"promessa\": \"Promessa\",\n  \"estruturaDoVideo\": \"Estrutura\",\n  \"tom\": \"Direto\",\n  \"emocaoPredominante\": \"Urgência\",\n  \"elementosVirais\": [\"lista\"],\n  \"publicoProvavel\": \"Iniciantes\",\n  \"palavrasChave\": [\"vendas\"],\n  \"resumoExecutivo\": \"Resumo\",\n  \"insightDeRecriacao\": \"Insight\",\n  \"riscosDeCopia\": \"Risco\",\n  \"roteiroBaseInspiracional\": \"Roteiro\",\n}\n```";
  const result = parseSummaryOutput(malformed);
  assert.equal(result.recovered, true);
  assert.equal(result.parsed.temaCentral, 'Tema');
});

test('falha quando campos obrigatórios não existem', () => {
  assert.throws(() => parseSummaryOutput('{"temaCentral":"x"}'));
});
