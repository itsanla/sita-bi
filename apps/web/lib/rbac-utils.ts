export function validatePembimbingSelection(
  pembimbing1Id: number | null,
  pembimbing2Id: number | null,
): { valid: boolean; error?: string } {
  if (!pembimbing1Id) {
    return { valid: false, error: 'Pembimbing 1 harus dipilih' };
  }

  if (pembimbing2Id && pembimbing1Id === pembimbing2Id) {
    return {
      valid: false,
      error: 'Pembimbing 1 dan Pembimbing 2 harus berbeda',
    };
  }

  return { valid: true };
}

export function validatePengujiSelection(
  penguji1Id: number | null,
  penguji2Id: number | null,
  penguji3Id: number | null,
): { valid: boolean; error?: string } {
  if (!penguji1Id) {
    return { valid: false, error: 'Minimal 1 penguji harus dipilih' };
  }

  const pengujiIds = [penguji1Id, penguji2Id, penguji3Id].filter(
    (id) => id !== null,
  );
  const uniqueIds = new Set(pengujiIds);

  if (uniqueIds.size !== pengujiIds.length) {
    return { valid: false, error: 'Semua penguji harus berbeda' };
  }

  return { valid: true };
}
