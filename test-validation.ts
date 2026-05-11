import { prisma } from './src/lib/prisma';
import { criarAbastecimento } from './src/lib/abastecimentos-crud';
import { obterSessao } from './src/lib/auth-nativo';

// Mock obterSessao to return a fake payload
jest.mock('./src/lib/auth-nativo', () => ({
  obterSessao: () => Promise.resolve({
    sub: '1',
    email: 'test@example.com',
    nome: 'Test User',
    role: 'usuario',
    permissoes: ['abastecimentos:ler', 'abastecimentos:criar']
  })
}));

async function test() {
  try {
    // Create a test vehicle and motorist
    const veiculo = await prisma.veiculos.create({
      data: {
        vei_frota: 'TESTE',
        vei_placa: 'TEST0001',
        vei_capacidade_tanque: 50,
        vei_consumo_referencia: 10,
        vei_ativo: true,
      },
    });

    const motorista = await prisma.motoristas.create({
      data: {
        mot_nome: 'Motorista Teste',
        mot_ativo: true,
      },
    });

    console.log('Created vehicle:', veiculo.vei_id);
    console.log('Created motorista:', motorista.mot_id);

    // Now test the validation with empty vei_id
    const result = await criarAbastecimento({
      vei_id: '', // empty string should trigger validation error
      mot_id: String(motorista.mot_id),
      hodometro_ausente: true,
      km_hodometro: '',
      litros_tanque_antes: '10',
      litros_aprovados: '20',
      km_previsto_rodar: '100',
    });

    console.log('Result:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

test();