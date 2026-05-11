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