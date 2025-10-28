import { getPrams } from '@/helpers';
import querystring from 'query-string';
import { useEffect, useState } from 'react';
import { history, useLocation } from 'umi';

export default function usePagination() {
  const location: any = useLocation();
  const [paginationConfig, setPaginationConfig] = useState({ pageSize: 10, current: 1 });

  useEffect(() => {
    const { page = 1, pageSize = 10 } = querystring.parse(location.search);

    setPaginationConfig({ pageSize: Number(pageSize), current: Number(page) });
  }, [location.search]);

  const savePageList = (page = 1, pageSize = 10) => {
    history.replace(
      `${location.pathname}?page=${page}&pageSize=${pageSize}${getPrams(['page', 'pageSize'])}`,
    );
  };

  return { paginationConfig, savePageList };
}
