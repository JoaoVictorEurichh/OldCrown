import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const BARBERS = ['João', 'Carlos', 'Rafael'];
const NOMES = [
  'Lucas Souza', 'Rafael Oliveira', 'Bruno Ferreira', 'Gabriel Santos',
  'Matheus Costa', 'Felipe Rodrigues', 'Thiago Almeida', 'Diego Lima',
  'Anderson Pereira', 'Rodrigo Martins', 'Leandro Barbosa', 'Eduardo Nascimento',
  'Vinicius Carvalho', 'Gustavo Ribeiro', 'Carlos Silva',
];
const SERVICOS = ['Corte', 'Barba', 'Corte + Barba'];

function hojeOffset(dias: number): string {
  const d = new Date();
  d.setDate(d.getDate() + dias);
  return d.toISOString().split('T')[0];
}

function horariosAleatorios(quantidade: number): string[] {
  const todos: string[] = [];
  for (let h = 8; h < 18; h++) {
    todos.push(`${String(h).padStart(2, '0')}:00`);
    todos.push(`${String(h).padStart(2, '0')}:30`);
  }
  return todos.sort(() => Math.random() - 0.5).slice(0, quantidade);
}

async function main() {
  const hash = await bcrypt.hash('123456', 10);

  // Admin
  await prisma.user.upsert({
    where: { email: 'admin@email.com' },
    update: {},
    create: { name: 'Administrador', email: 'admin@email.com', password: hash, role: 'ADMIN' },
  });
  console.log('✅ Admin: admin@email.com / 123456');

  // Contas dos barbeiros
  const barbeiros = [
    { name: 'João',   email: 'joao@oldcrown.com'   },
    { name: 'Carlos', email: 'carlos@oldcrown.com' },
    { name: 'Rafael', email: 'rafael@oldcrown.com' },
  ];
  for (const b of barbeiros) {
    await prisma.user.upsert({
      where: { email: b.email },
      update: {},
      create: { name: b.name, email: b.email, password: hash, role: 'BARBER' },
    });
    console.log(`✅ Barbeiro: ${b.email} / 123456`);
  }

  // Apaga seed anterior
  await prisma.simpleAppointment.deleteMany({ where: { clientName: { in: NOMES } } });

  // Cria agendamentos por barbeiro nos próximos 7 dias
  const agendamentos: any[] = [];
  let nomeIdx = 0;

  for (const barber of BARBERS) {
    for (let dia = 0; dia < 7; dia++) {
      const date = hojeOffset(dia);
      const horarios = horariosAleatorios(3 + Math.floor(Math.random() * 3));
      horarios.forEach((time) => {
        agendamentos.push({
          clientName: NOMES[nomeIdx++ % NOMES.length],
          date,
          time,
          service: SERVICOS[Math.floor(Math.random() * SERVICOS.length)],
          barber,
        });
      });
    }
  }

  await prisma.simpleAppointment.createMany({ data: agendamentos });
  console.log(`✅ ${agendamentos.length} agendamentos criados (${BARBERS.join(', ')})`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
