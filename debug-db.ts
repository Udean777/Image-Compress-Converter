import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function debug() {
	const userId = '9a977bb9-6e77-4031-8c6c-cdb7418d87a4';
	console.log('--- Subscriptions ---');
	const subs = await prisma.subscription.findMany({ where: { userId }, include: { plan: true } });
	console.log(JSON.stringify(subs, null, 2));

	console.log('\n--- Payments ---');
	const payments = await prisma.payment.findMany({ where: { userId } });
	console.log(JSON.stringify(payments, null, 2));
}

debug().finally(() => prisma.$disconnect());
