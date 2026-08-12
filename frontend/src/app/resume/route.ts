import { promises as fs } from 'fs';
import path from 'path';

export async function GET() {
  const resumePath = path.join(process.cwd(), 'public', 'Parth_Hada_Resume.pdf');

  try {
    const resumeBuffer = await fs.readFile(resumePath);

    return new Response(resumeBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="Parth_Hada_Resume.pdf"',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch {
    return new Response('Resume not found', { status: 404 });
  }
}
