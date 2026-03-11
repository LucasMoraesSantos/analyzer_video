import Link from 'next/link';
import { Card } from '@/components/ui/card';

export default function ConfiguracoesPage() {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001/api';
  const netlifySiteUrl = process.env.NEXT_PUBLIC_NETLIFY_SITE_URL ?? '';

  return (
    <div className="space-y-4">
      <Card>
        <h2 className="text-lg font-semibold">Configurações</h2>
        <p className="text-sm text-slate-600">
          Configure os links da aplicação online para facilitar acesso por qualquer dispositivo.
        </p>
      </Card>

      <Card>
        <h3 className="font-medium text-slate-900">API em uso</h3>
        <p className="mt-2 text-sm text-slate-600 break-all">{apiBaseUrl}</p>
      </Card>

      <Card>
        <h3 className="font-medium text-slate-900">Link público (Netlify)</h3>
        {netlifySiteUrl ? (
          <Link
            href={netlifySiteUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-flex text-sm font-medium text-blue-600 hover:underline"
          >
            Abrir aplicação online
          </Link>
        ) : (
          <p className="mt-2 text-sm text-slate-500">
            Defina <code>NEXT_PUBLIC_NETLIFY_SITE_URL</code> para exibir aqui o link do deploy Netlify.
          </p>
        )}
      </Card>
    </div>
  );
}
