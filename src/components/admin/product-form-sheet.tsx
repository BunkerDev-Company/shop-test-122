'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminApi } from '@/lib/api';
import { apiErrorMessage } from '@/lib/utils';
import type { AdminProduct, AdminVariantInput, Brand, Category } from '@/types';

interface ProductFormSheetProps {
  /** null — создание нового товара. */
  product:    AdminProduct | null;
  categories: Category[];
  brands:     Brand[];
  onClose:    () => void;
}

const EMPTY_VARIANT: AdminVariantInput = {
  sku: '', title: '', price: 0, stockQty: 0, isActive: true,
};

/**
 * Форма товара выезжает снизу листом — на телефоне это привычнее
 * отдельного экрана и не теряет список под собой.
 */
export function ProductFormSheet({ product, categories, brands, onClose }: ProductFormSheetProps) {
  const queryClient = useQueryClient();
  const isEdit = !!product;

  const [form, setForm] = useState({
    title:       product?.title ?? '',
    subtitle:    product?.subtitle ?? '',
    description: product?.description ?? '',
    categoryId:  product?.categoryId ?? '',
    brandId:     product?.brandId ?? '',
    imageUrl:    product?.imageUrl ?? '',
    isActive:    product?.isActive ?? true,
    isFeatured:  product?.isFeatured ?? false,
  });

  const [variants, setVariants] = useState<AdminVariantInput[]>(
    product?.variants.map((v) => ({
      id: v.id, sku: v.sku, title: v.title, price: v.price,
      oldPrice: v.oldPrice ?? null, stockQty: v.stockQty,
      attributes: v.attributes, isActive: v.isActive ?? true,
    })) ?? [{ ...EMPTY_VARIANT }],
  );

  // Создание и обновление возвращают разные тела; общий для них
  // идентификатор — всё, что нужно форме после сохранения.
  const save = useMutation<{ id: string }>({
    mutationFn: () => {
      const payload = {
        title:       form.title,
        subtitle:    form.subtitle || null,
        description: form.description || null,
        categoryId:  form.categoryId || null,
        brandId:     form.brandId || null,
        imageUrl:    form.imageUrl || null,
        isActive:    form.isActive,
        isFeatured:  form.isFeatured,
        variants,
      };
      return isEdit
        ? adminApi.updateProduct(product!.id, payload)
        : adminApi.createProduct(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success(isEdit ? 'Товар обновлён' : 'Товар создан');
      onClose();
    },
    onError: (error) => toast.error(apiErrorMessage(error, 'Не удалось сохранить')),
  });

  const updateVariant = (index: number, patch: Partial<AdminVariantInput>) => {
    setVariants((prev) => prev.map((v, i) => (i === index ? { ...v, ...patch } : v)));
  };

  const canSave =
    form.title.trim() &&
    variants.length > 0 &&
    variants.every((v) => v.sku.trim() && v.title.trim() && v.price >= 0);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 backdrop-blur-sm">
      <div className="flex max-h-[92vh] w-full max-w-[440px] flex-col rounded-t-[24px] bg-surface animate-sheet-up">
        <header className="flex items-center justify-between gap-3 border-b border-line px-4 py-3.5">
          <h2 className="text-[17px] font-bold">{isEdit ? 'Изменить товар' : 'Новый товар'}</h2>
          <button type="button" onClick={onClose} className="icon-btn h-9 w-9" aria-label="Закрыть">
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
          <div>
            <label className="field-label">Название</label>
            <input
              className="field-box"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="iPhone 15 Pro"
            />
          </div>

          <div>
            <label className="field-label">Подзаголовок</label>
            <input
              className="field-box"
              value={form.subtitle}
              onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
              placeholder="Титан. Чип A17 Pro"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="field-label">Категория</label>
              <select
                className="field-box"
                value={form.categoryId}
                onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
              >
                <option value="">—</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="field-label">Бренд</label>
              <select
                className="field-box"
                value={form.brandId}
                onChange={(e) => setForm({ ...form, brandId: e.target.value })}
              >
                <option value="">—</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>{b.title}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="field-label">Ссылка на фото</label>
            <input
              className="field-box"
              value={form.imageUrl}
              onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
              placeholder="/products/iphone-15-pro.svg"
            />
          </div>

          <div>
            <label className="field-label">Описание</label>
            <textarea
              rows={3}
              className="field-box resize-none"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <div className="flex gap-4 py-1">
            <label className="flex items-center gap-2 text-[14px]">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                className="h-4 w-4 accent-[#FFC633]"
              />
              Опубликован
            </label>
            <label className="flex items-center gap-2 text-[14px]">
              <input
                type="checkbox"
                checked={form.isFeatured}
                onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })}
                className="h-4 w-4 accent-[#FFC633]"
              />
              В подборке
            </label>
          </div>

          {/* ── Варианты ─────────────────────────────────────────
              Цена и остаток живут на SKU, поэтому без хотя бы одного
              варианта товар продать нельзя. */}
          <div className="border-t border-line pt-3">
            <div className="flex items-center justify-between">
              <h3 className="text-[15px] font-bold">Варианты</h3>
              <button
                type="button"
                onClick={() => setVariants((prev) => [...prev, { ...EMPTY_VARIANT }])}
                className="chip btn-sm border-ink"
              >
                <Plus className="h-3.5 w-3.5" /> Добавить
              </button>
            </div>

            <div className="mt-2.5 space-y-3">
              {variants.map((variant, index) => (
                <div key={index} className="card space-y-2 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-semibold text-muted">SKU #{index + 1}</span>
                    {variants.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setVariants((prev) => prev.filter((_, i) => i !== index))}
                        className="text-[12px] font-medium text-danger"
                      >
                        Убрать
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <input
                      className="field-box py-2.5 text-[14px]"
                      value={variant.sku}
                      onChange={(e) => updateVariant(index, { sku: e.target.value })}
                      placeholder="Артикул"
                    />
                    <input
                      className="field-box py-2.5 text-[14px]"
                      value={variant.title}
                      onChange={(e) => updateVariant(index, { title: e.target.value })}
                      placeholder="256 ГБ · Чёрный"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="number"
                      inputMode="numeric"
                      className="field-box py-2.5 text-[14px]"
                      value={variant.price || ''}
                      onChange={(e) => updateVariant(index, { price: Number(e.target.value) })}
                      placeholder="Цена"
                    />
                    <input
                      type="number"
                      inputMode="numeric"
                      className="field-box py-2.5 text-[14px]"
                      value={variant.oldPrice ?? ''}
                      onChange={(e) =>
                        updateVariant(index, { oldPrice: e.target.value ? Number(e.target.value) : null })
                      }
                      placeholder="Было"
                    />
                    <input
                      type="number"
                      inputMode="numeric"
                      className="field-box py-2.5 text-[14px]"
                      value={variant.stockQty || ''}
                      onChange={(e) => updateVariant(index, { stockQty: Number(e.target.value) })}
                      placeholder="Остаток"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-line px-4 py-3">
          <button
            type="button"
            onClick={() => save.mutate()}
            disabled={!canSave || save.isPending}
            className="btn-accent w-full"
          >
            {save.isPending ? 'Сохраняем…' : isEdit ? 'Сохранить' : 'Создать товар'}
          </button>
        </div>
      </div>
    </div>
  );
}
