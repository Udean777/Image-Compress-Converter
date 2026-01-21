import ts from 'typescript';
import fs from 'fs';
import path from 'path';
import { glob } from 'glob';
import readline from 'readline';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const question = (query: string): Promise<string> => 
    new Promise((resolve) => rl.question(query, resolve));

async function main() {
    const srcDir = path.resolve(process.cwd(), 'src');
    const files = await glob('**/*.{ts,js,svelte}', { cwd: srcDir, absolute: true });

    console.log(`🔍 Scanning ${files.length} files in src/...`);

    let totalUnusedImports = 0;
    const filesToProcess: { path: string; content: string; newContent: string; unusedCount: number }[] = [];

    // Setup TS compiler options
    const compilerOptions: ts.CompilerOptions = {
        target: ts.ScriptTarget.Latest,
        module: ts.ModuleKind.ESNext,
        allowJs: true,
        checkJs: true,
    };

    const host = ts.createCompilerHost(compilerOptions);

    for (const file of files) {
        let content = fs.readFileSync(file, 'utf8');
        let isSvelte = file.endsWith('.svelte');
        let scriptContent = content;
        let scriptStart = 0;
        let scriptEnd = content.length;

        if (isSvelte) {
            const scriptMatch = content.match(/<script[^>]*>([\s\S]*?)<\/script>/);
            if (!scriptMatch) continue;
            scriptContent = scriptMatch[1];
            scriptStart = content.indexOf(scriptMatch[1]);
            scriptEnd = scriptStart + scriptMatch[1].length;
        }

        // Create a dummy source file for the script content
        const virtualFileName = isSvelte ? file + '.ts' : file;
        
        // We need to find unused imports. TS "organizeImports" is perfect for this.
        // However, the standard TS API doesn't expose a simple "count unused imports" without a full LanguageService.
        
        // Let's setup a minimal LanguageService
        const registry = ts.createDocumentRegistry();
        const serviceHost: ts.LanguageServiceHost = {
            getCompilationSettings: () => compilerOptions,
            getScriptFileNames: () => [virtualFileName],
            getScriptVersion: () => '0',
            getScriptSnapshot: (fileName) => {
                if (fileName === virtualFileName) return ts.ScriptSnapshot.fromString(scriptContent);
                if (fs.existsSync(fileName)) {
                    return ts.ScriptSnapshot.fromString(fs.readFileSync(fileName, 'utf8'));
                }
                return undefined;
            },
            getCurrentDirectory: () => process.cwd(),
            getDefaultLibFileName: (options) => ts.getDefaultLibFilePath(options),
            readFile: (path: string) => {
                try {
                    return fs.readFileSync(path, 'utf8');
                } catch (e) {
                    return undefined;
                }
            },
            fileExists: fs.existsSync,
        };

        const service = ts.createLanguageService(serviceHost, registry);
        
        // Get the changes from organizeImports
        const changes = service.organizeImports(
            { type: 'file', fileName: virtualFileName },
            ts.getDefaultFormatCodeSettings(),
            undefined
        );

        if (changes.length > 0) {
            // Apply changes to a temporary string to see what happens
            let newScriptContent = scriptContent;
            
            // Sort changes in reverse order to apply them safely
            const sortedChanges = [...changes[0].textChanges].sort((a, b) => b.span.start - a.span.start);
            
            for (const change of sortedChanges) {
                newScriptContent = 
                    newScriptContent.slice(0, change.span.start) + 
                    change.newText + 
                    newScriptContent.slice(change.span.start + change.span.length);
            }

            // Estimate unused imports by counting removed 'import' lines or similar
            // A more accurate way is comparing the two contents and counting removed import declarations
            const oldImportCount = (scriptContent.match(/^import /gm) || []).length;
            const newImportCount = (newScriptContent.match(/^import /gm) || []).length;
            const diffCount = Math.max(0, oldImportCount - newImportCount);

            if (diffCount > 0) {
                totalUnusedImports += diffCount;
                let finalContent = content;
                if (isSvelte) {
                    finalContent = content.slice(0, scriptStart) + newScriptContent + content.slice(scriptEnd);
                } else {
                    finalContent = newScriptContent;
                }

                filesToProcess.push({
                    path: file,
                    content,
                    newContent: finalContent,
                    unusedCount: diffCount
                });
            }
        }
    }

    if (totalUnusedImports === 0) {
        console.log('✅ Tidak ditemukan import yang tidak digunakan.');
        process.exit(0);
    }

    console.log(`\nFound ${totalUnusedImports} unused imports across ${filesToProcess.length} files.`);
    const answer = await question(`Apakah kamu ingin membersihkan ${totalUnusedImports} import yang sudah tidak digunakan lagi? (yes/no): `);

    if (answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y') {
        console.log('\n🚀 Cleaning up...');
        for (const f of filesToProcess) {
            fs.writeFileSync(f.path, f.newContent);
            console.log(`  ✅ Modified: ${path.relative(process.cwd(), f.path)} (-${f.unusedCount})`);
        }
        console.log('\n✨ Selesai! Semua import yang tidak digunakan telah dihapus.');
    } else {
        console.log('\n❌ Cleanup dibatalkan.');
    }

    rl.close();
}

main().catch(console.error);
