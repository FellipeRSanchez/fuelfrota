import { schemaAbastecimento } from './abastecimento';

const result = schemaAbastecimento.safeParse({
  vei_id: '',
  mot_id: '1',
  hodometro_ausente: true,
  km_hodometro: '',
  litros_tanque_antes: '10',
  litros_aprovados: '20',
  km_previsto_rodar: '100',
});

console.log(JSON.stringify(result, null, 2));
