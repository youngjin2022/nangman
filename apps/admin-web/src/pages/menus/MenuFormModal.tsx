// 메뉴 추가/수정 모달
import { useEffect, useRef, useState } from "react";
import { Modal } from "@/components/Modal";
import {
  FormField,
  inputClass,
  selectClass,
  textareaClass,
} from "@/components/FormField";
import type { Category, Menu } from "@/lib/types";
import { uploadMenuImage } from "@/lib/api";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

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
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [imageRemoved, setImageRemoved] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setName(initial?.name ?? "");
    setDescription(initial?.description ?? "");
    setPrice(initial?.price ?? 0);
    setCategoryId(initial?.categoryId ?? categories[0]?.id ?? "");
    setIsSoldOut(initial?.isSoldOut ?? false);
    setImageFile(null);
    setImageRemoved(false);
    setFilePreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [open, initial, categories]);

  useEffect(() => {
    return () => {
      if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl);
    };
  }, [filePreviewUrl]);

  const existingImageUrl =
    initial?.imageUrl && String(initial.imageUrl).trim()
      ? String(initial.imageUrl).trim()
      : undefined;

  const previewHref =
    filePreviewUrl ??
    (!imageRemoved && existingImageUrl ? existingImageUrl : undefined);

  let fileStatusText = "선택된 파일이 없습니다";
  if (imageFile) fileStatusText = imageFile.name;
  else if (initial && imageRemoved)
    fileStatusText = "사진을 제거했습니다 · 저장하면 기본 아이콘으로 표시됩니다";
  else if (initial && existingImageUrl && !imageRemoved)
    fileStatusText = "등록된 사진이 있습니다 · 아래에서 새 파일로 바꿀 수 있습니다";

  const clearImage = () => {
    setImageFile(null);
    setImageRemoved(true);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setFilePreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  };

  const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    if (f.size > MAX_IMAGE_BYTES) {
      setError("이미지는 최대 5MB까지 업로드할 수 있습니다.");
      return;
    }
    if (!/^image\/(jpeg|png|webp|gif)$/i.test(f.type)) {
      setError("JPEG, PNG, WebP, GIF만 업로드할 수 있습니다.");
      return;
    }
    setError(null);
    setImageRemoved(false);
    setImageFile(f);
    setFilePreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(f);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim()) return setError("메뉴명을 입력해 주세요");
    if (!categoryId) return setError("카테고리를 선택해 주세요");
    if (price < 0) return setError("가격은 0원 이상이어야 합니다");

    let imageUrl: string | null | undefined = undefined;

    setSubmitting(true);
    try {
      if (imageFile) {
        if (imageFile.size > MAX_IMAGE_BYTES) {
          setError("이미지는 최대 5MB까지 업로드할 수 있습니다.");
          return;
        }
        const { imageUrl: url } = await uploadMenuImage(imageFile);
        imageUrl = url;
      } else if (initial && imageRemoved) {
        imageUrl = null;
      }

      const payload: Omit<Menu, "id"> = {
        categoryId,
        name: name.trim(),
        description: description.trim() || undefined,
        price,
        isSoldOut,
      };
      if (imageUrl !== undefined) {
        payload.imageUrl = imageUrl;
      }
      await onSubmit(payload);
      onClose();
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : typeof err === "string"
            ? err
            : "저장 실패";
      setError(msg);
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
            className="h-11 rounded-xl bg-bg-subtle font-medium hover:bg-line active:bg-line"
          >
            취소
          </button>
          <button
            form="menu-form"
            type="submit"
            disabled={submitting}
            className="h-11 rounded-xl bg-accent text-white font-semibold hover:bg-accent-dark active:opacity-95 disabled:opacity-50"
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

        <FormField
          label="사진"
          hint="파일을 업로드하면 서버에 저장하고 DB에는 공개 URL만 기록합니다. 비우면 손님 화면에서 기본 아이콘만 표시됩니다."
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="sr-only"
            onChange={onPickFile}
          />
          <div className="rounded-lg border border-line bg-bg-panel shadow-sm overflow-hidden focus-within:ring-2 focus-within:ring-accent/25 focus-within:border-accent transition-colors">
            <div className="flex flex-col gap-3 p-3 sm:flex-row sm:items-stretch sm:gap-4">
              {previewHref && (
                <div className="sm:w-[5.25rem] shrink-0">
                  <div className="relative aspect-square w-full max-w-[5.25rem] overflow-hidden rounded-lg border border-line bg-bg-subtle">
                    <img
                      src={previewHref}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </div>
                </div>
              )}
              <div className="flex min-w-0 flex-1 flex-col justify-center gap-2">
                <p className="text-sm leading-snug text-ink break-all">
                  {fileStatusText}
                </p>
                <p className="text-xs text-ink-muted">
                  JPEG · PNG · WebP · GIF, 최대 5MB
                </p>
                <div className="flex flex-wrap items-center gap-2 pt-0.5">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex h-10 shrink-0 items-center justify-center rounded-lg bg-accent px-4 text-sm font-semibold text-white shadow-sm hover:bg-accent-dark active:opacity-95"
                  >
                    {imageFile ? "다른 파일 선택" : "파일 선택"}
                  </button>
                  {previewHref && (
                    <button
                      type="button"
                      onClick={clearImage}
                      className="inline-flex h-10 items-center justify-center rounded-lg border border-line bg-bg-subtle px-3 text-sm font-medium text-ink-muted hover:bg-line hover:text-ink"
                    >
                      사진 제거
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
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
