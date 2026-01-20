import { google } from 'googleapis';
import { env } from '$env/dynamic/private';
import type { PrismaClient } from '@prisma/client';
import { prisma } from '../db';

export class GoogleDriveService {
	private db: PrismaClient;

	constructor(database: PrismaClient = prisma) {
		this.db = database;
	}

	getOAuth2Client() {
		return new google.auth.OAuth2(
			env.GOOGLE_CLIENT_ID,
			env.GOOGLE_CLIENT_SECRET,
			env.GOOGLE_REDIRECT_URI
		);
	}

	getAuthUrl() {
		const oauth2Client = this.getOAuth2Client();
		return oauth2Client.generateAuthUrl({
			access_type: 'offline',
			prompt: 'consent',
			scope: [
				'https://www.googleapis.com/auth/drive.file',
				'https://www.googleapis.com/auth/userinfo.email',
				'https://www.googleapis.com/auth/userinfo.profile'
			]
		});
	}

	async exchangeCode(code: string) {
		const oauth2Client = this.getOAuth2Client();
		const { tokens } = await oauth2Client.getToken(code);
		return tokens;
	}

	async uploadFile(userId: string, tokens: any, fileName: string, buffer: Buffer, mimeType: string) {
		const oauth2Client = this.getOAuth2Client();
		oauth2Client.setCredentials(tokens);

		const drive = google.drive({ version: 'v3', auth: oauth2Client });

		// Check if folder exists, if not create it
		let folderId = await this.getOrCreateFolder(drive, 'Image Studio');

		const fileMetadata = {
			name: fileName.split('/').pop(),
			parents: [folderId]
		};

		const media = {
			mimeType: mimeType,
			body: new (await import('stream')).PassThrough().end(buffer)
		};

		const response = await drive.files.create({
			requestBody: fileMetadata,
			media: media,
			fields: 'id, webViewLink'
		});

		return response.data;
	}

	private async getOrCreateFolder(drive: any, folderName: string): Promise<string> {
		const response = await drive.files.list({
			q: `name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
			fields: 'files(id)',
			spaces: 'drive'
		});

		if (response.data.files && response.data.files.length > 0) {
			return response.data.files[0].id;
		}

		const folderMetadata = {
			name: folderName,
			mimeType: 'application/vnd.google-apps.folder'
		};

		const folder = await drive.files.create({
			resource: folderMetadata,
			fields: 'id'
		});

		return folder.data.id;
	}
}

export const googleDriveService = new GoogleDriveService();
