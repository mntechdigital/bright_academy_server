export const builderQuery = <TWhereInput, TOrderByInput>({
  searchFields = [],
  searchTerm = '',
  filter = {} as TWhereInput,
  orderBy = {} as TOrderByInput,
  page = 1,
  limit = 10,
}: {
  searchFields?: string[];
  searchTerm?: string;
  filter?: TWhereInput;
  orderBy: TOrderByInput;
  page: number;
  limit: number;
}) => {
  const skip = (page - 1) * limit;
  const take = limit;

  const searchConditions =
    searchFields.length > 0 && searchTerm
      ? {
          OR: searchFields.map((field) => ({
            [field]: {
              contains: searchTerm,
            },
          })),
        }
      : {};

  const where = {
    ...filter,
    ...(Object.keys(searchConditions).length > 0 && searchConditions),
  };

  const query = {
    skip,
    take: Number(take),
    where,
    orderBy,
  };

  return query;
};
