import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Limpar base de dados (ordem respeita foreign keys)
  await prisma.aICache.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.user.deleteMany();

  const hashedPassword = await bcrypt.hash("password123", 10);

  const user = await prisma.user.create({
    data: {
      email: "admin@opscopilot.com",
      password: hashedPassword,
      name: "Admin",
    },
  });

  const ticketsData = [
    {
      title: "Server returning 500 error on /api/users",
      description:
        "The /api/users endpoint started returning 500 Internal Server Error after the last deployment. Users are unable to load their profiles. The error appears intermittently and affects approximately 30% of requests. Logs show a database connection timeout.",
      priority: "high" as const,
      status: "open" as const,
      tags: ["bug", "api", "urgent"],
    },
    {
      title: "Add dark mode support to dashboard",
      description:
        "Users have requested dark mode support for the main dashboard. This should follow the system preference by default but also allow manual toggle. All components need to be updated with appropriate color tokens. Consider using CSS custom properties for easy theming.",
      priority: "medium" as const,
      status: "in_progress" as const,
      tags: ["feature", "ui", "dashboard"],
    },
    {
      title: "Optimize database queries for ticket listing",
      description:
        "The ticket listing page is taking over 2 seconds to load when there are more than 500 tickets. We need to add proper indexes and optimize the query to use pagination efficiently. Consider adding a composite index on status + createdAt.",
      priority: "medium" as const,
      status: "open" as const,
      tags: ["performance", "database"],
    },
    {
      title: "Update user documentation for new features",
      description:
        "Several new features were released in the last sprint but the user documentation has not been updated. Need to document: new filtering options, export functionality, and the AI summary feature. Include screenshots and step-by-step instructions.",
      priority: "low" as const,
      status: "done" as const,
      tags: ["docs"],
    },
    {
      title: "Memory leak in WebSocket connection handler",
      description:
        "There is a memory leak detected in the WebSocket connection handler. The server memory usage grows steadily over time and requires periodic restarts. Profiling shows that event listeners are not being properly cleaned up when clients disconnect. This is a critical bug affecting production stability.",
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
