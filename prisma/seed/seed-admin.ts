import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
	console.log('🌱 Seeding admin user...');

	const email = 'admin@vivnio.com';
	const password = 'Admin123!';
	const hashedPassword = await bcrypt.hash(password, 10);

	const user = await prisma.user.upsert({
		where: { email },
		update: {
			role: 'ADMIN'
		},
		create: {
			email,
			password: hashedPassword,
			name: 'Super Admin',
			role: 'ADMIN',
			credits: 999999 // Infinite credits for admin
		}
	});

	console.log(`  ✅ Admin user created/updated: ${user.email} (${user.role})`);

	// Assign highest plan (Business)
	const businessPlan = await prisma.pricingPlan.findUnique({
		where: { name: 'business' }
	});

	if (businessPlan) {
		const now = new Date();
		const nextYear = new Date();
		nextYear.setFullYear(now.getFullYear() + 1);

		await prisma.subscription.upsert({
			where: {
				stripeSubscriptionId: 'sub_admin_lifetime' // Dummy ID for admin
			},
			update: {
				status: 'active',
				currentPeriodEnd: nextYear,
				creditsRemaining: 999999,
				planId: businessPlan.id
			},
			create: {
				userId: user.id,
				planId: businessPlan.id,
				status: 'active',
				currentPeriodStart: now,
				currentPeriodEnd: nextYear,
				creditsRemaining: 999999,
				stripeSubscriptionId: 'sub_admin_lifetime'
			}
		});
		console.log(`  ✅ assigned 'business' plan to admin`);
	}

	console.log('✨ Admin seeding completed!');
}

main()
	.catch((e) => {
		console.error('❌ Admin seeding failed:', e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
