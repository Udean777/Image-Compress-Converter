import 'dotenv/config';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });

async function main() {
	console.log('🌱 Seeding admin user (via SQL)...');

	const email = 'admin@vivnio.com';
	const password = 'Admin123!';
	const hashedPassword = await bcrypt.hash(password, 10);
	const role = 'ADMIN';
	const name = 'Super Admin';
	const credits = 999999;
	const id = 'admin-user-id'; // Fixed ID for easier reference

	const client = await pool.connect();

	try {
		// Upsert Admin User
		await client.query(`
			INSERT INTO "User" (id, email, password, name, role, credits, "createdAt", "isBanned")
			VALUES ($1, $2, $3, $4, $5, $6, NOW(), false)
			ON CONFLICT (email) 
			DO UPDATE SET 
				role = EXCLUDED.role,
				password = EXCLUDED.password,
				name = EXCLUDED.name,
				credits = EXCLUDED.credits;
		`, [id, email, hashedPassword, name, role, credits]);

		console.log(`  ✅ Admin user seeded: ${email}`);

		// Get Business Plan ID
		const planRes = await client.query('SELECT id FROM "PricingPlan" WHERE name = $1', ['business']);
		if (planRes.rows.length > 0) {
			const planId = planRes.rows[0].id;
			const nextYear = new Date();
			nextYear.setFullYear(nextYear.getFullYear() + 1);

			// Upsert Subscription
			// Need to fetch user id if we didn't insert it (e.g. on conflict we kept old id, but we used fixed id so...)
			// Actually ON CONFLICT UPDATE doesn't return ID unless we ask.
			// But we sent a fixed ID. If it existed with diff ID, insert would fail? 
			// No, email is unique. If email matches, we update. ID remains old ID.
			
			const userRes = await client.query('SELECT id FROM "User" WHERE email = $1', [email]);
			const userId = userRes.rows[0].id;

			const subId = 'sub_admin_lifetime';

			await client.query(`
				INSERT INTO "Subscription" (id, "userId", "planId", status, "currentPeriodStart", "currentPeriodEnd", "creditsRemaining", "stripeSubscriptionId", "createdAt")
				VALUES (gen_random_uuid(), $1, $2, 'active', NOW(), $3, $4, $5, NOW())
				ON CONFLICT ("stripeSubscriptionId")
				DO UPDATE SET
					status = 'active',
					"currentPeriodEnd" = EXCLUDED."currentPeriodEnd",
					"creditsRemaining" = EXCLUDED."creditsRemaining",
					"planId" = EXCLUDED."planId";
			`, [userId, planId, nextYear, 999999, subId]);

			console.log(`  ✅ 'business' plan assigned to admin`);
		}

	} catch (e) {
		console.error('SQL Error:', e);
		throw e;
	} finally {
		client.release();
		await pool.end();
	}

	console.log('✨ Admin seeding completed!');
}

main()
	.catch((e) => {
		console.error('❌ Admin seeding failed:', e);
		process.exit(1);
	});
