import { SignJWT, jwtVerify } from 'jose';
import { env } from '$env/dynamic/private';

const JWT_SECRET = new TextEncoder().encode(
	env.JWT_SECRET || 'fallback_secret_change_me_in_production'
);

export async function createAccessToken(user: {
	id: string;
	email: string;
	name: string | null;
	role: string;
}) {
	return await new SignJWT({
		id: user.id,
		email: user.email,
		name: user.name,
		role: user.role
	})
		.setProtectedHeader({ alg: 'HS256' })
		.setIssuedAt()
		.setExpirationTime('15m')
		.sign(JWT_SECRET);
}

export async function createRefreshToken(userId: string) {
	return await new SignJWT({ userId })
		.setProtectedHeader({ alg: 'HS256' })
		.setIssuedAt()
		.setExpirationTime('7d')
		.sign(JWT_SECRET);
}

export async function verifyToken(token: string) {
	try {
		const { payload } = await jwtVerify(token, JWT_SECRET);
		return payload;
	} catch (e) {
		return null;
	}
}
