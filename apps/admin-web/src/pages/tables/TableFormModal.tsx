// 테이블 추가/수정 모달
import { useEffect, useState } from 'react';
import { Modal } from '@/components/Modal';
import { FormField, inputClass } from '@/components/FormField';
import type { AdminTable } from '@/lib/types';

interface TableFormModalProps {
  open: boolean;
  initial: AdminTable | null;
  onClose: () => void;
  onSubmit: (data: { number: string; name: string; capacity: number; isActive: boolean }) => Promise<void>;
}

export function TableFormModal({ open, initial, onClose, onSubmit }: TableFormModalProps) {
  const [number, setNumber] = useState('');
  const [name, setName] = useState('');
  const [capacity, setCapacity] = useState(4);
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setNumber(initial?.number ?? '');
    setName(initial?.name ?? '');
    setCapacity(initial?.capacity ?? 4);
    setIsActive(initial?.isActive ?? true);
    setError(null);
  }, [open, initial]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!number.trim()) return setError('테이블 번호를 입력해 주세요');
    if (!name.trim()) return setError('테이블 이름을 입력해 주세요');
    if (capacity < 1) return setError('수용 인원은 1명 이상이어야 합니다');
    setSubmitting(true);
    try {
      await onSubmit({ number: number.trim(), name: name.trim(), capacity, isActive });
      onClose();
    } catch (e: any) {
      setError(e?.message ?? '저장 실패');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      title={initial ? '테이블 수정' : '테이블 추가'}
      onClose={onClose}
      width="md"
      footer={
        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={onClose} className="h-11 rounded-xl bg-bg-subtle font-medium hover:bg-line">취소</button>
          <button form="table-form" type="submit" disabled={submitting} className="h-11 rounded-xl bg-accent text-white font-semibold hover:bg-accent-dark disabled:opacity-50">
            {submitting ? '저장 중…' : '저장'}
          </button>
        </div>
      }
    >
      <form id="table-form" onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <FormField label="번호" required hint="짧은 식별자 (예: 1, 2, V)">
            <input value={number} onChange={(e) => setNumber(e.target.value)} className={inputClass} maxLength={5} />
          </FormField>
          <FormField label="수용 인원" required>
            <input
              type="number" min={1} max={50} value={capacity}
              onChange={(e) => setCapacity(Number(e.target.value) || 1)}
              className={inputClass}
            />
          </FormField>
        </div>
        <FormField label="이름" required hint="화면에 표시되는 명칭 (예: 1번 테이블, VIP룸)">
          <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} maxLength={20} />
        </FormField>
        <FormField label="활성화">
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="w-4 h-4 accent-accent" />
            <span className="text-sm">손님 화면에 노출</span>
          </label>
        </FormField>
        {error && <p className="text-sm text-bad">{error}</p>}
      </form>
    </Modal>
  );
}
