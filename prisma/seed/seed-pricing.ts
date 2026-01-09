import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const pricingPlans = [
	{
		name: 'free',
		displayName: 'Free',
		price: 0,
		currency: 'IDR',
		interval: 'once',
		credits: 15,
		sortOrder: 0,
		features: JSON.stringify([
			'Compress Images',
			'Convert Formats',
			'Resize Images',
			'10 Credits (sekali)'
		])
	},
	{
		name: 'starter',
		displayName: 'Starter',
		price: 39000,
		currency: 'IDR',
		interval: 'month',
		credits: 100,
		sortOrder: 1,
		features: JSON.stringify(['All Free features', 'Priority Support', '100 Credits/bulan'])
	},
	{
		name: 'pro',
		displayName: 'Pro',
		price: 79000,
		currency: 'IDR',
		interval: 'month',
		credits: 300,
		sortOrder: 2,
		features: JSON.stringify([
			'All Starter features',
			'Remove Background',
			'Add Watermark',
			'300 Credits/bulan'
		])
	},
	{
		name: 'business',
		displayName: 'Business',
		price: 199000,
		currency: 'IDR',
		interval: 'month',
		credits: 1000,
		sortOrder: 3,
		features: JSON.stringify([
			'All Pro features',
			'API Access',
			'Batch Processing',
			'1000 Credits/bulan'
		])
	}
];
async function main() {
	console.log('🌱 Seeding pricing plans...');
	for (const plan of pricingPlans) {
		const result = await prisma.pricingPlan.upsert({
			where: { name: plan.name },
			update: plan,
			create: plan
		});
		console.log(`  ✅ ${result.displayName} (${result.name})`);
	}
	console.log('✨ Seeding completed!');
}
main()
	.catch((e) => {
		console.error('❌ Seeding failed:', e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
