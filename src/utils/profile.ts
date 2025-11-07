export const normalizeArrayField = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === 'string' ? item.trim() : String(item)))
      .filter((item) => item.length > 0);
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();

    if (!trimmed) {
      return [];
    }

    // Handle Postgres array string format: {"Item","Other"}
    const postgresArrayMatch = trimmed.match(/^\{.*\}$/);
    if (postgresArrayMatch) {
      return trimmed
        .slice(1, -1)
        .split(',')
        .map((item) => item.replace(/^"|"$/g, '').trim())
        .filter((item) => item.length > 0);
    }

    return trimmed
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }

  return [];
};

export const normalizeUserProfile = <T extends Record<string, any>>(user: T | null | undefined) => {
  if (!user) {
    return user;
  }

  return {
    ...user,
    crop_types: normalizeArrayField(user.crop_types),
    service_categories: normalizeArrayField(user.service_categories),
    services_offered: normalizeArrayField(user.services_offered),
    equipment_list: normalizeArrayField(user.equipment_list),
  };
};

