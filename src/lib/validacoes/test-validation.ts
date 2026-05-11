import { schemaAbastecimento } from './abastecimento';

console.log('Testing schema with STRING vei_id...');
const result1 = schemaAbastecimento.safeParse({
  vei_id: '1',
  mot_id: '1',
  hodometro_ausente: true,
  km_hodometro: '',
  litros_tanque_antes: '10',
  litros_aprovados: '20',
  km_previsto_rodar: '100',
});

if (result1.success) {
  console.log('Success (String):', result1.data);
} else {
  console.log('Error (String):', result1.error.format());
}

console.log('\nTesting schema with NUMBER vei_id (simulating server re-validation)...');
const result2 = schemaAbastecimento.safeParse({
  vei_id: 1,
  mot_id: 1,
  hodometro_ausente: true,
  km_hodometro: '',
  litros_tanque_antes: 10,
  litros_aprovados: 20,
  km_previsto_rodar: 100,
});

if (result2.success) {
  console.log('Success (Number):', result2.data);
} else {
  console.log('Error (Number):', result2.error.format());
}

console.log('\nTesting schema with EMPTY vei_id...');
const result3 = schemaAbastecimento.safeParse({
  vei_id: '',
  mot_id: '1',
  hodometro_ausente: true,
  km_hodometro: '',
  litros_tanque_antes: '10',
  litros_aprovados: '20',
  km_previsto_rodar: '100',
});

if (!result3.success) {
  console.log('Validation failed as expected for empty vei_id:', result3.error.format().vei_id);
} else {
  console.log('Unexpected success for empty vei_id');
}