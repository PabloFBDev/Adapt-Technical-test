import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  if (process.env.NODE_ENV === "production") {
    console.error("Seed is not allowed in production environment.");
    process.exit(1);
  }

  // Limpar base de dados (ordem respeita foreign keys)
  await prisma.aICache.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.user.deleteMany();

  const seedPassword = process.env.SEED_ADMIN_PASSWORD ?? "password123";
  const hashedPassword = await bcrypt.hash(seedPassword, 10);

  const user = await prisma.user.create({
    data: {
      email: "admin@opscopilot.com",
      password: hashedPassword,
      name: "Admin",
    },
  });

  const ticketsData = [
    {
      title: "Servidor retornando erro 500 em /api/users",
      description:
        "O endpoint /api/users começou a retornar erro 500 (Internal Server Error) após o último deploy. Os usuários não conseguem carregar seus perfis. O erro ocorre de forma intermitente e afeta aproximadamente 30% das requisições. Os logs indicam timeout na conexão com o banco de dados.",
      priority: "high" as const,
      status: "open" as const,
      tags: ["bug", "api", "urgente"],
    },
    {
      title: "Adicionar suporte a modo escuro no dashboard",
      description:
        "Os usuários solicitaram suporte a modo escuro no dashboard principal. O sistema deve seguir a preferência do sistema operacional por padrão, mas também permitir alternância manual. Todos os componentes precisam ser atualizados com tokens de cor apropriados. Considere usar propriedades customizadas de CSS para facilitar a tematização.",
      priority: "medium" as const,
      status: "in_progress" as const,
      tags: ["feature", "ui", "dashboard"],
    },
    {
      title: "Otimizar consultas ao banco para listagem de tickets",
      description:
        "A página de listagem de tickets está levando mais de 2 segundos para carregar quando há mais de 500 tickets. Precisamos adicionar índices adequados e otimizar a consulta para utilizar paginação de forma eficiente. Considere adicionar um índice composto em status + createdAt.",
      priority: "medium" as const,
      status: "open" as const,
      tags: ["performance", "database"],
    },
    {
      title: "Atualizar documentação do usuário para novas funcionalidades",
      description:
        "Diversas novas funcionalidades foram lançadas no último sprint, mas a documentação do usuário ainda não foi atualizada. É necessário documentar: novas opções de filtro, funcionalidade de exportação e o recurso de resumo com IA. Incluir capturas de tela e instruções passo a passo.",
      priority: "low" as const,
      status: "done" as const,
      tags: ["docs"],
    },
    {
      title: "Vazamento de memória no manipulador de conexão WebSocket",
      description:
        "Foi identificado um vazamento de memória no manipulador de conexão WebSocket. O uso de memória do servidor cresce continuamente ao longo do tempo e exige reinicializações periódicas. A análise de profiling mostra que os event listeners não estão sendo removidos corretamente quando os clientes se desconectam. Este é um bug crítico que afeta a estabilidade em produção.",
      priority: "high" as const,
      status: "in_progress" as const,
      tags: ["bug", "critical", "backend"],
    },
  ];

  for (const data of ticketsData) {
    const ticket = await prisma.ticket.create({
      data: {
        ...data,
        userId: user.id,
      },
    });

    await prisma.auditLog.create({
      data: {
        ticketId: ticket.id,
        userId: user.id,
        action: "created",
        changes: {
          title: { from: null, to: ticket.title },
          description: { from: null, to: ticket.description },
          priority: { from: null, to: ticket.priority },
          status: { from: null, to: ticket.status },
          tags: { from: null, to: ticket.tags },
        },
      },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async () => {
    await prisma.$disconnect();
    process.exit(1);
  });
