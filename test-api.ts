import { prisma } from './src/lib/prisma';
import { criarAbastecimento } from './src/lib/abastecimentos-crud';

// Since we cannot easily mock modules in plain Node.js, let's just test the validation schema directly
// and then if needed, we can test the API by starting the server and making HTTP requests.

console.log('Testing schema directly...');
const { schemaAbastecimento } = require('./src/lib/validacoes/abastecimento');

const testSchema = (data) => {
  const result = schemaAbastecimento.safeParse(data);
  if (result.success) {
    console.log('Success:', result.data);
  } else {
    console.log('Validation error:');
    console.log(JSON.stringify(result.error.format(), null, 2));
  }
};

console.log('\n1. Empty vei_id:');
testSchema({
  vei_id: '',
  mot_id: '1',
  hodometro_ausente: true,
  km_hodometro: '',
  litros_tanque_antes: '10',
  litros_aprovados: '20',
  km_previsto_rodar: '100',
});

console.log('\n2. Non-numeric vei_id:');
testSchema({
  vei_id: 'abc',
  mot_id: '1',
  hodometro_ausente: true,
  km_hodometro: '',
  litros_tanque_antes: '10',
  litros_aprovados: '20',
  km_previsto_rodar: '100',
});

console.log('\n3. Valid vei_id:');
testSchema({
  vei_id: '1',
  mot_id: '1',
  hodometro_ausente: true,
  km_hodometro: '',
  litros_tanque_antes: '10',
  litros_aprovados: '20',
  km_previsto_rodar: '100',
});