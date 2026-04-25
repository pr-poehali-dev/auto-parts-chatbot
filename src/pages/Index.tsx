import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";

const API = "https://functions.poehali.dev/99a37d06-488c-4467-b254-1515ba02267d";

interface Product {
  id: number;
  name: string;
  article: string;
  compatible_cars: string[];
  description: string;
  price: number;
  stock_quantity: number;
}

const emptyForm = {
  name: "",
  article: "",
  compatible_cars: "",
  description: "",
  price: "",
  stock_quantity: "",
};

export default function Index() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [notification, setNotification] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const notify = (text: string, type: "success" | "error" = "success") => {
    setNotification({ text, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const fetchProducts = async (q = "") => {
    setLoading(true);
    const url = q ? `${API}?search=${encodeURIComponent(q)}` : API;
    const res = await fetch(url);
    const data = await res.json();
    setProducts(data.products || []);
    setLoading(false);
  };

  useEffect(() => { fetchProducts(); }, []);

  useEffect(() => {
    const t = setTimeout(() => fetchProducts(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const openAdd = () => {
    setEditId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (p: Product) => {
    setEditId(p.id);
    setForm({
      name: p.name,
      article: p.article,
      compatible_cars: p.compatible_cars?.join(", ") || "",
      description: p.description || "",
      price: String(p.price ?? ""),
      stock_quantity: String(p.stock_quantity ?? ""),
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.article) return notify("Заполните название и артикул", "error");
    setSaving(true);
    const payload = {
      ...(editId ? { id: editId } : {}),
      name: form.name,
      article: form.article,
      compatible_cars: form.compatible_cars.split(",").map(s => s.trim()).filter(Boolean),
      description: form.description,
      price: parseFloat(form.price) || null,
      stock_quantity: parseInt(form.stock_quantity) || 0,
    };
    const res = await fetch(API, {
      method: editId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    if (res.ok) {
      notify(editId ? "Товар обновлён" : "Товар добавлен");
      setShowForm(false);
      fetchProducts(search);
    } else {
      notify("Ошибка сохранения", "error");
    }
  };

  const handleDelete = async (id: number) => {
    await fetch(`${API}?id=${id}`, { method: "DELETE" });
    setDeleteId(null);
    notify("Товар удалён");
    fetchProducts(search);
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-[Golos_Text,sans-serif]">

      {/* Уведомление */}
      {notification && (
        <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded text-sm font-medium shadow-lg animate-fade-in
          ${notification.type === "success" ? "bg-primary text-primary-foreground" : "bg-destructive text-destructive-foreground"}`}>
          {notification.text}
        </div>
      )}

      {/* Шапка */}
      <header className="border-b border-border bg-card/80 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded bg-primary flex items-center justify-center">
              <Icon name="Cog" size={15} className="text-primary-foreground" />
            </div>
            <span className="font-semibold text-sm tracking-wide text-foreground">АвтоДеталь</span>
            <span className="text-border">|</span>
            <span className="text-xs text-muted-foreground uppercase tracking-widest">Каталог товаров</span>
          </div>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 bg-primary text-primary-foreground text-sm font-medium px-4 py-2 rounded hover:opacity-90 transition-opacity"
          >
            <Icon name="Plus" size={15} />
            Добавить товар
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">

        {/* Статистика */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "Всего товаров", value: products.length, icon: "Package" },
            { label: "В наличии", value: products.filter(p => p.stock_quantity > 0).length, icon: "CheckCircle" },
            { label: "Нет в наличии", value: products.filter(p => p.stock_quantity === 0).length, icon: "XCircle" },
          ].map(s => (
            <div key={s.label} className="bg-card border border-border rounded-lg px-5 py-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded bg-muted flex items-center justify-center flex-shrink-0">
                <Icon name={s.icon} fallback="Package" size={18} className="text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">{s.value}</div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Поиск */}
        <div className="flex items-center gap-3 mb-5">
          <div className="relative flex-1 max-w-md">
            <Icon name="Search" size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Поиск по названию или артикулу..."
              className="w-full bg-card border border-border rounded pl-9 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          {search && (
            <button onClick={() => setSearch("")} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              Сбросить
            </button>
          )}
        </div>

        {/* Таблица */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-5 py-3.5 text-xs text-muted-foreground font-medium uppercase tracking-wider">Название</th>
                <th className="text-left px-5 py-3.5 text-xs text-muted-foreground font-medium uppercase tracking-wider">Артикул</th>
                <th className="text-left px-5 py-3.5 text-xs text-muted-foreground font-medium uppercase tracking-wider">Марки авто</th>
                <th className="text-right px-5 py-3.5 text-xs text-muted-foreground font-medium uppercase tracking-wider">Цена</th>
                <th className="text-right px-5 py-3.5 text-xs text-muted-foreground font-medium uppercase tracking-wider">Остаток</th>
                <th className="px-5 py-3.5"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-16 text-muted-foreground">
                    <div className="flex flex-col items-center gap-3">
                      <Icon name="Loader2" size={24} className="animate-spin opacity-50" />
                      <span className="text-sm">Загрузка...</span>
                    </div>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-16 text-muted-foreground">
                    <div className="flex flex-col items-center gap-3">
                      <Icon name="PackageOpen" size={32} className="opacity-30" />
                      <span className="text-sm">{search ? "Ничего не найдено" : "Товары ещё не добавлены"}</span>
                      {!search && (
                        <button onClick={openAdd} className="text-primary text-xs hover:underline">
                          Добавить первый товар
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                products.map((p, i) => (
                  <tr
                    key={p.id}
                    className="border-b border-border/50 hover:bg-muted/30 transition-colors group"
                    style={{ animationDelay: `${i * 30}ms` }}
                  >
                    <td className="px-5 py-4">
                      <div className="font-medium text-foreground">{p.name}</div>
                      {p.description && (
                        <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{p.description}</div>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-mono-custom text-xs bg-muted px-2 py-1 rounded text-muted-foreground">{p.article}</span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-1">
                        {p.compatible_cars?.slice(0, 3).map(car => (
                          <span key={car} className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded">{car}</span>
                        ))}
                        {p.compatible_cars?.length > 3 && (
                          <span className="text-xs text-muted-foreground">+{p.compatible_cars.length - 3}</span>
                        )}
                        {(!p.compatible_cars || p.compatible_cars.length === 0) && (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right">
                      {p.price ? (
                        <span className="font-semibold text-foreground">{Number(p.price).toLocaleString("ru-RU")} ₽</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span className={`text-sm font-medium ${p.stock_quantity > 0 ? "text-green-400" : "text-destructive"}`}>
                        {p.stock_quantity > 0 ? p.stock_quantity + " шт." : "Нет"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEdit(p)}
                          className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                          title="Редактировать"
                        >
                          <Icon name="Pencil" size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteId(p.id)}
                          className="p-1.5 rounded hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"
                          title="Удалить"
                        >
                          <Icon name="Trash2" size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>

      {/* Форма добавления / редактирования */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-lg mx-4 animate-fade-in">
            <div className="flex items-center justify-between px-6 py-5 border-b border-border">
              <h2 className="font-semibold text-foreground">{editId ? "Редактировать товар" : "Новый товар"}</h2>
              <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                <Icon name="X" size={18} />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              {[
                { key: "name", label: "Название *", placeholder: "Тормозные колодки передние" },
                { key: "article", label: "Артикул *", placeholder: "TRW-GDB1234" },
                { key: "compatible_cars", label: "Марки авто", placeholder: "Toyota, Honda, Nissan (через запятую)" },
                { key: "description", label: "Описание", placeholder: "Краткое описание товара" },
                { key: "price", label: "Цена (₽)", placeholder: "1500" },
                { key: "stock_quantity", label: "Остаток (шт.)", placeholder: "10" },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-xs text-muted-foreground mb-1.5">{f.label}</label>
                  <input
                    value={form[f.key as keyof typeof form]}
                    onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    className="w-full bg-background border border-border rounded px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              ))}
            </div>
            <div className="px-6 py-4 border-t border-border flex justify-end gap-3">
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 bg-primary text-primary-foreground text-sm font-medium px-5 py-2 rounded hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {saving && <Icon name="Loader2" size={14} className="animate-spin" />}
                {editId ? "Сохранить" : "Добавить"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Подтверждение удаления */}
      {deleteId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-sm mx-4 animate-fade-in">
            <div className="px-6 py-6 text-center">
              <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                <Icon name="Trash2" size={20} className="text-destructive" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Удалить товар?</h3>
              <p className="text-sm text-muted-foreground">Это действие нельзя отменить.</p>
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 py-2.5 text-sm border border-border rounded text-foreground hover:bg-muted transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={() => handleDelete(deleteId)}
                className="flex-1 py-2.5 text-sm bg-destructive text-destructive-foreground rounded hover:opacity-90 transition-opacity font-medium"
              >
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}