import { useState, useEffect, useRef } from "react";
import Icon from "@/components/ui/icon";
import BarcodeScanner from "@/components/BarcodeScanner";
import JsBarcode from "jsbarcode";

const API = "https://functions.poehali.dev/99a37d06-488c-4467-b254-1515ba02267d";

interface Product {
  id: number;
  name: string;
  article: string;
  compatible_cars: string[];
  description: string;
  price: number;
  stock_quantity: number;
  rack: string;
  shelf: string;
  cell: string;
}

const emptyForm = {
  name: "", article: "", compatible_cars: "", description: "",
  price: "", stock_quantity: "", rack: "", shelf: "", cell: "",
};

function LocationBadge({ rack, shelf, cell }: { rack?: string; shelf?: string; cell?: string }) {
  const parts = [rack && `Стеллаж ${rack}`, shelf && `Полка ${shelf}`, cell && `Ячейка ${cell}`].filter(Boolean);
  if (!parts.length) return <span className="text-muted-foreground text-xs">—</span>;
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {parts.map((p, i) => (
        <span key={i} className="text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded font-mono-custom">{p}</span>
      ))}
    </div>
  );
}

function BarcodeModal({ product, onClose }: { product: Product; onClose: () => void }) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (svgRef.current && product.article) {
      JsBarcode(svgRef.current, product.article, {
        format: "CODE128",
        width: 2,
        height: 60,
        displayValue: true,
        fontSize: 12,
        margin: 10,
        background: "#ffffff",
        lineColor: "#0f172a",
      });
    }
  }, [product.article]);

  const handlePrint = () => {
    const svg = svgRef.current;
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const w = window.open("", "_blank", "width=600,height=400");
    if (!w) return;
    const location = [
      product.rack && `Стеллаж ${product.rack}`,
      product.shelf && `Полка ${product.shelf}`,
      product.cell && `Ячейка ${product.cell}`,
    ].filter(Boolean).join(" · ");

    w.document.write(`
      <html><head><title>Штрихкод: ${product.article}</title>
      <style>
        body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: #f5f5f5; }
        .card { background: white; border: 1px solid #ddd; border-radius: 8px; padding: 24px 32px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .name { font-size: 15px; font-weight: 600; color: #0f172a; margin-bottom: 4px; }
        .article { font-size: 12px; color: #64748b; margin-bottom: 12px; }
        .location { font-size: 13px; color: #1e40af; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 4px; padding: 4px 10px; margin-top: 12px; display: inline-block; }
      </style></head>
      <body><div class="card">
        <div class="name">${product.name}</div>
        <div class="article">Арт. ${product.article}</div>
        ${svgData}
        ${location ? `<div class="location">📍 ${location}</div>` : ""}
      </div></body></html>
    `);
    w.document.close();
    w.focus();
    setTimeout(() => { w.print(); }, 300);
  };

  const location = [
    product.rack && `Стеллаж ${product.rack}`,
    product.shelf && `Полка ${product.shelf}`,
    product.cell && `Ячейка ${product.cell}`,
  ].filter(Boolean).join(" · ");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-sm mx-4 animate-fade-in">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Icon name="Barcode" size={17} className="text-primary" />
            <span className="font-semibold text-sm text-foreground">Штрихкод товара</span>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <Icon name="X" size={18} />
          </button>
        </div>

        <div className="px-6 py-5">
          <div className="text-center mb-4">
            <div className="font-semibold text-foreground text-sm">{product.name}</div>
            <div className="text-xs text-muted-foreground mt-0.5">Арт. {product.article}</div>
          </div>

          {/* Штрихкод */}
          <div className="bg-white rounded-lg p-4 flex justify-center mb-4">
            <svg ref={svgRef} />
          </div>

          {/* Адрес хранения */}
          {location ? (
            <div className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-lg px-4 py-3 mb-4">
              <Icon name="MapPin" size={15} className="text-blue-400 flex-shrink-0" />
              <div>
                <div className="text-xs text-muted-foreground mb-0.5">Место хранения</div>
                <div className="text-sm font-medium text-blue-300">{location}</div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-muted rounded-lg px-4 py-3 mb-4">
              <Icon name="MapPinOff" size={15} className="text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Место хранения не указано</span>
            </div>
          )}
        </div>

        <div className="px-5 pb-5 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 text-sm border border-border rounded text-foreground hover:bg-muted transition-colors"
          >
            Закрыть
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 py-2.5 text-sm bg-primary text-primary-foreground rounded hover:opacity-90 transition-opacity font-medium flex items-center justify-center gap-2"
          >
            <Icon name="Printer" size={14} />
            Распечатать
          </button>
        </div>
      </div>
    </div>
  );
}

function LocationCard({ product, onClose }: { product: Product; onClose: () => void }) {
  const location = [
    product.rack && `Стеллаж ${product.rack}`,
    product.shelf && `Полка ${product.shelf}`,
    product.cell && `Ячейка ${product.cell}`,
  ].filter(Boolean);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-sm mx-4 animate-fade-in overflow-hidden">
        {/* Зелёная полоса сверху */}
        <div className="h-1.5 bg-gradient-to-r from-green-500 to-emerald-400" />

        <div className="px-6 py-5">
          <div className="flex items-start justify-between mb-5">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-xs text-green-400 font-medium uppercase tracking-wider">Товар найден</span>
              </div>
              <div className="font-semibold text-foreground text-base">{product.name}</div>
              <div className="text-xs text-muted-foreground mt-0.5 font-mono-custom">Арт. {product.article}</div>
            </div>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors mt-0.5">
              <Icon name="X" size={18} />
            </button>
          </div>

          {/* Адрес хранения — крупно */}
          <div className="bg-muted rounded-xl p-5 mb-4">
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Icon name="MapPin" size={12} />
              Место на складе
            </div>
            {location.length > 0 ? (
              <div className="space-y-2">
                {product.rack && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Стеллаж</span>
                    <span className="text-2xl font-black text-primary">{product.rack}</span>
                  </div>
                )}
                {product.shelf && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Полка</span>
                    <span className="text-2xl font-black text-foreground">{product.shelf}</span>
                  </div>
                )}
                {product.cell && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Ячейка</span>
                    <span className="text-2xl font-black text-foreground">{product.cell}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-2">
                <Icon name="MapPinOff" size={24} className="text-muted-foreground mx-auto mb-1" />
                <div className="text-sm text-muted-foreground">Адрес не указан</div>
              </div>
            )}
          </div>

          {/* Доп. инфо */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="bg-secondary/50 rounded-lg px-3 py-2.5">
              <div className="text-xs text-muted-foreground mb-0.5">Остаток</div>
              <div className={`font-semibold text-sm ${product.stock_quantity > 0 ? "text-green-400" : "text-destructive"}`}>
                {product.stock_quantity > 0 ? `${product.stock_quantity} шт.` : "Нет"}
              </div>
            </div>
            <div className="bg-secondary/50 rounded-lg px-3 py-2.5">
              <div className="text-xs text-muted-foreground mb-0.5">Цена</div>
              <div className="font-semibold text-sm text-foreground">
                {product.price ? `${Number(product.price).toLocaleString("ru-RU")} ₽` : "—"}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full py-2.5 text-sm bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity font-medium"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
}

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
  const [showScanner, setShowScanner] = useState(false);
  const [scanHighlight, setScanHighlight] = useState<number | null>(null);
  const [barcodeProduct, setBarcodeProduct] = useState<Product | null>(null);
  const [locationProduct, setLocationProduct] = useState<Product | null>(null);

  const notify = (text: string, type: "success" | "error" = "success") => {
    setNotification({ text, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleScanned = async (code: string) => {
    setShowScanner(false);
    setSearch(code);
    const res = await fetch(`${API}?search=${encodeURIComponent(code)}`);
    const data = await res.json();
    const found: Product[] = data.products || [];
    setProducts(found);
    setLoading(false);
    if (found.length > 0) {
      setScanHighlight(found[0].id);
      setLocationProduct(found[0]);
      setTimeout(() => setScanHighlight(null), 4000);
    } else {
      notify(`Товар с кодом «${code}» не найден`, "error");
    }
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

  const openAdd = () => { setEditId(null); setForm(emptyForm); setShowForm(true); };
  const openEdit = (p: Product) => {
    setEditId(p.id);
    setForm({
      name: p.name, article: p.article,
      compatible_cars: p.compatible_cars?.join(", ") || "",
      description: p.description || "",
      price: String(p.price ?? ""),
      stock_quantity: String(p.stock_quantity ?? ""),
      rack: p.rack || "", shelf: p.shelf || "", cell: p.cell || "",
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.article) return notify("Заполните название и артикул", "error");
    setSaving(true);
    const payload = {
      ...(editId ? { id: editId } : {}),
      name: form.name, article: form.article,
      compatible_cars: form.compatible_cars.split(",").map(s => s.trim()).filter(Boolean),
      description: form.description,
      price: parseFloat(form.price) || null,
      stock_quantity: parseInt(form.stock_quantity) || 0,
      rack: form.rack, shelf: form.shelf, cell: form.cell,
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
            <span className="text-xs text-muted-foreground uppercase tracking-widest">Склад / Каталог</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowScanner(true)}
              className="flex items-center gap-2 border border-border text-foreground text-sm font-medium px-4 py-2 rounded hover:bg-muted transition-colors"
            >
              <Icon name="ScanLine" size={15} className="text-primary" />
              Сканировать
            </button>
            <button
              onClick={openAdd}
              className="flex items-center gap-2 bg-primary text-primary-foreground text-sm font-medium px-4 py-2 rounded hover:opacity-90 transition-opacity"
            >
              <Icon name="Plus" size={15} />
              Добавить товар
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">

        {/* Статистика */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { label: "Всего товаров", value: products.length, icon: "Package" },
            { label: "В наличии", value: products.filter(p => p.stock_quantity > 0).length, icon: "CheckCircle" },
            { label: "Нет в наличии", value: products.filter(p => p.stock_quantity === 0).length, icon: "XCircle" },
            { label: "С адресом склада", value: products.filter(p => p.rack || p.shelf || p.cell).length, icon: "MapPin" },
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
                <th className="text-left px-5 py-3.5 text-xs text-muted-foreground font-medium uppercase tracking-wider">Место на складе</th>
                <th className="text-right px-5 py-3.5 text-xs text-muted-foreground font-medium uppercase tracking-wider">Цена</th>
                <th className="text-right px-5 py-3.5 text-xs text-muted-foreground font-medium uppercase tracking-wider">Остаток</th>
                <th className="px-5 py-3.5"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-muted-foreground">
                    <div className="flex flex-col items-center gap-3">
                      <Icon name="Loader2" size={24} className="animate-spin opacity-50" />
                      <span className="text-sm">Загрузка...</span>
                    </div>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-muted-foreground">
                    <div className="flex flex-col items-center gap-3">
                      <Icon name="PackageOpen" size={32} className="opacity-30" />
                      <span className="text-sm">{search ? "Ничего не найдено" : "Товары ещё не добавлены"}</span>
                      {!search && (
                        <button onClick={openAdd} className="text-primary text-xs hover:underline">Добавить первый товар</button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                products.map((p, i) => (
                  <tr
                    key={p.id}
                    className={`border-b border-border/50 hover:bg-muted/30 transition-colors group ${scanHighlight === p.id ? "bg-primary/10 ring-1 ring-inset ring-primary/30" : ""}`}
                    style={{ animationDelay: `${i * 30}ms` }}
                  >
                    <td className="px-5 py-4">
                      <div className="font-medium text-foreground">{p.name}</div>
                      {p.description && <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{p.description}</div>}
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-mono-custom text-xs bg-muted px-2 py-1 rounded text-muted-foreground">{p.article}</span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-1">
                        {p.compatible_cars?.slice(0, 3).map(car => (
                          <span key={car} className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded">{car}</span>
                        ))}
                        {p.compatible_cars?.length > 3 && <span className="text-xs text-muted-foreground">+{p.compatible_cars.length - 3}</span>}
                        {(!p.compatible_cars || p.compatible_cars.length === 0) && <span className="text-xs text-muted-foreground">—</span>}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <LocationBadge rack={p.rack} shelf={p.shelf} cell={p.cell} />
                    </td>
                    <td className="px-5 py-4 text-right">
                      {p.price ? <span className="font-semibold text-foreground">{Number(p.price).toLocaleString("ru-RU")} ₽</span> : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span className={`text-sm font-medium ${p.stock_quantity > 0 ? "text-green-400" : "text-destructive"}`}>
                        {p.stock_quantity > 0 ? `${p.stock_quantity} шт.` : "Нет"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setBarcodeProduct(p)}
                          className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-primary"
                          title="Штрихкод"
                        >
                          <Icon name="Barcode" size={14} />
                        </button>
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

      {/* Сканер */}
      {showScanner && <BarcodeScanner onDetected={handleScanned} onClose={() => setShowScanner(false)} />}

      {/* Карточка местонахождения после сканирования */}
      {locationProduct && <LocationCard product={locationProduct} onClose={() => setLocationProduct(null)} />}

      {/* Модал штрихкода */}
      {barcodeProduct && <BarcodeModal product={barcodeProduct} onClose={() => setBarcodeProduct(null)} />}

      {/* Форма добавления / редактирования */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-lg mx-4 animate-fade-in max-h-[90vh] overflow-y-auto scrollbar-thin">
            <div className="flex items-center justify-between px-6 py-5 border-b border-border sticky top-0 bg-card z-10">
              <h2 className="font-semibold text-foreground">{editId ? "Редактировать товар" : "Новый товар"}</h2>
              <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                <Icon name="X" size={18} />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              {/* Основные поля */}
              {[
                { key: "name", label: "Название *", placeholder: "Тормозные колодки передние" },
                { key: "article", label: "Артикул *", placeholder: "TRW-GDB1234" },
                { key: "compatible_cars", label: "Марки авто", placeholder: "Toyota, Honda, Nissan (через запятую)" },
                { key: "description", label: "Описание", placeholder: "Краткое описание" },
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

              {/* Адрес хранения */}
              <div className="pt-2">
                <div className="flex items-center gap-2 mb-3">
                  <Icon name="MapPin" size={14} className="text-primary" />
                  <span className="text-xs font-medium text-foreground uppercase tracking-wider">Место хранения на складе</span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { key: "rack", label: "Стеллаж", placeholder: "А" },
                    { key: "shelf", label: "Полка", placeholder: "3" },
                    { key: "cell", label: "Ячейка", placeholder: "12" },
                  ].map(f => (
                    <div key={f.key}>
                      <label className="block text-xs text-muted-foreground mb-1.5">{f.label}</label>
                      <input
                        value={form[f.key as keyof typeof form]}
                        onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                        placeholder={f.placeholder}
                        className="w-full bg-background border border-border rounded px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary text-center font-mono-custom"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-border flex justify-end gap-3 sticky bottom-0 bg-card">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
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
              <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 text-sm border border-border rounded text-foreground hover:bg-muted transition-colors">
                Отмена
              </button>
              <button onClick={() => handleDelete(deleteId)} className="flex-1 py-2.5 text-sm bg-destructive text-destructive-foreground rounded hover:opacity-90 transition-opacity font-medium">
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
