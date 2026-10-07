import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import type { Category } from '../../types';
import { PageHeader, Card, EmptyState, Skeleton } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input, Textarea } from '../../components/ui/Input';
import { getErrorMessage } from '../../utils';

export function CategoriesPage() {
  const [items, setItems] = useState<Category[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);

  // Состояние меняем только когда пришёл ответ: при перезагрузке список остаётся на экране.
  const load = () =>
    api
      .get('/categories')
      .then(({ data }) => setItems(data.data))
      .finally(() => setLoading(false));

  useEffect(() => {
    void load();
  }, []);

  const create = async () => {
    try {
      await api.post('/categories', { name, description });
      setName('');
      setDescription('');
      toast.success('Категория создана');
      load();
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Удалить категорию?')) return;
    try {
      await api.delete(`/categories/${id}`);
      toast.success('Удалено');
      load();
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  };

  return (
    <div>
      <PageHeader title="Категории" description="Таксономия курсов" />
      <Card className="mb-6 grid gap-3 p-5 md:grid-cols-2">
        <Input label="Название" value={name} onChange={(e) => setName(e.target.value)} />
        <Textarea label="Описание" value={description} onChange={(e) => setDescription(e.target.value)} />
        <Button onClick={create}>Добавить</Button>
      </Card>
      {loading ? (
        <Skeleton className="h-40" />
      ) : items.length === 0 ? (
        <EmptyState title="Категорий нет" />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((c) => (
            <Card key={c.id} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold">{c.name}</h3>
                  <p className="mt-1 text-sm text-slate-500">{c.description || '—'}</p>
                  <div className="mt-3 text-xs text-slate-400">{c._count?.courses ?? 0} курсов</div>
                </div>
                <Button size="sm" variant="danger" onClick={() => remove(c.id)}>
                  Удалить
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
