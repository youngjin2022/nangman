// 메뉴 추가/수정 모달
import { useEffect, useState } from "react";
import { Modal } from "@/components/Modal";
import {
  FormField,
  inputClass,
  selectClass,
  textareaClass,
} from "@/components/FormField";
import type { Category, Menu } from "@/lib/types";

interface MenuFormModalProps {
  open: boolean;
  initial: Menu | null; // null이면 신규
  categories: Category[];
  onClose: () => void;
  onSubmit: (data: Omit<Menu, "id">) => Promise<void>;
}

export function MenuFormModal({
  open,
  initial,
  categories,
  onClose,
  onSubmit,
}: MenuFormModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState<number>(0);
  const [categoryId, setCategoryId] = useState("");
  const [isSoldOut, setIsSoldOut] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setName(initial?.name ?? "");
    setDescription(initial?.description ?? "");
    setPrice(initial?.price ?? 0);
    setCategoryId(initial?.categoryId ?? categories[0]?.id ?? "");
    setIsSoldOut(initial?.isSoldOut ?? false);
    setError(null);
  }, [open, initial, categories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim()) return setError("메뉴명을 입력해 주세요");
    if (!categoryId) return setError("카테고리를 선택해 주세요");
    if (price < 0) return setError("가격은 0원 이상이어야 합니다");
    setSubmitting(true);
    try {
      await onSubmit({
        categoryId,
        name: name.trim(),
        description: description.trim() || undefined,
        price,
        isSoldOut,
        // 옵션 그룹은 별도 화면에서 관리 - 신규 시 비움
        optionGroups: initial?.optionGroups,
      });
      onClose();
    } catch (e: any) {
      setError(e?.message ?? "저장 실패");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      title={initial ? "메뉴 수정" : "메뉴 추가"}
      onClose={onClose}
      width="md"
      footer={
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onClose}
            className="h-11 rounded-xl bg-bg-subtle font-medium hover:bg-line"
          >
            취소
          </button>
          <button
            form="menu-form"
            type="submit"
            disabled={submitting}
            className="h-11 rounded-xl bg-accent text-white font-semibold hover:bg-accent-dark disabled:opacity-50"
          >
            {submitting ? "저장 중…" : "저장"}
          </button>
        </div>
      }
    >
      <form id="menu-form" onSubmit={handleSubmit} className="space-y-4">
        <FormField label="카테고리" required>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className={selectClass}
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="메뉴명" required>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
            placeholder="예) 모듬 전"
            maxLength={50}
          />
        </FormField>

        <FormField label="설명" hint="손님 화면에 표시되는 짧은 설명">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={textareaClass}
            rows={2}
            maxLength={200}
            placeholder="예) 해물파전 + 김치전 + 동그랑땡"
          />
        </FormField>

        <FormField label="가격(원)" required>
          <input
            type="number"
            min={0}
            step={1}
            value={price}
            onChange={(e) => setPrice(Number(e.target.value) || 0)}
            className={inputClass}
          />
        </FormField>

        <FormField label="품절 여부">
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isSoldOut}
              onChange={(e) => setIsSoldOut(e.target.checked)}
              className="w-4 h-4 accent-accent"
            />
            <span className="text-sm">현재 품절 상태로 등록</span>
          </label>
        </FormField>

        {error && <p className="text-sm text-bad">{error}</p>}
      </form>
    </Modal>
  );
}
