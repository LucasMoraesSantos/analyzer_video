import { Card } from '@/components/ui/card';

export default function ConfiguracoesPage() {
  return (
    <div className="space-y-4">
      <Card>
        <h2 className="text-lg font-semibold">Configurações</h2>
        <p className="text-sm text-slate-600">
          Base inicial para configurações administrativas (API URL, preferências de coleta e limites).
        </p>
      </Card>
      <Card>
        <p className="text-sm text-slate-500">
          Esta etapa entrega a estrutura visual principal; formulários avançados serão adicionados em etapas futuras.
        </p>
      </Card>
    </div>
  );
}
