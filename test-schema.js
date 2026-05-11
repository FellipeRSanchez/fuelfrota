const { schemaAbastecimento } = require('./src/lib/validacoes/abastecimento');

console.log('Testing schema with empty vei_id...');
const result = schemaAbastecimento.safeParse({
  vei_id: '',
  mot_id: '1',
  hodometro_ausente: true,
  km_hodometro: '',
  litros_tanque_antes: '10',
  litros_aprovados: '20',
  km_previsto_rodar: '100',
});

if (result.success) {
  console.log('Unexpected success:', result.data);
} else {
  console.log('Validation error:');
  console.log(JSON.stringify(result.error.format(), null, 2));
}

// Also test with a non-numeric string
console.log('\nTesting schema with non-numeric vei_id...');
const result2 = schemaAbastecimento.safeParse({
  vei_id: 'abc',
  mot_id: '1',
  hodometro_ausente: true,
  km_hodometro: '',
  litros_tanque_antes: '10',
  litros_aprovados: '20',
  km_previsto_rodar: '100',
});

if (result2.success) {
  console.log('Unexpected success:', result2.data);
} else {
  console.log('Validation error:');
  console.log(JSON.stringify(result2.error.format(), null, 2));
}

// Test with a valid number string
console.log('\nTesting schema with valid vei_id...');
const result3 = schemaAbastecimento.safeParse({
  vei_id: '1',
  mot_id: '1',
  hodometro_ausente: true,
  km_hodometro: '',
  litros_tanque_antes: '10',
  litros_aprovados: '20',
  km_previsto_rodar: '100',
});

if (result3.success) {
  console.log('Success:', result3.data);
} else {
  console.log('Validation error:');
  console.log(JSON.stringify(result3.error.format(), null, 2));
}