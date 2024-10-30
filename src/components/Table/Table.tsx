import SortDownIcon from 'assets/icons/down_icon.svg?react';
import SortUpIcon from 'assets/icons/up_icon.svg?react';
import { compareNumber } from 'helper';
import { ReactNode, useState } from 'react';
import styles from './Table.module.scss';

export type HeaderDataType<T extends object> = {
  name: string;
  accessor: (data: T) => ReactNode | string | undefined;
  width: string;
  align: 'left' | 'right' | 'center';
  padding?: string;
  sortField?: keyof T;
};

export type TableHeaderProps<T extends object> = Record<string, HeaderDataType<T>>;
export type TableProps<T extends object> = {
  defaultSorted?: keyof T;
  headers: TableHeaderProps<T>;
  data: T[];
  stylesColumn?: React.CSSProperties;
  handleClickRow?: (event: React.MouseEvent<HTMLTableRowElement, MouseEvent>, record: T) => void;
};

export enum SortType {
  DESC = 'desc',
  ASC = 'asc'
}

export enum AlignType {
  RIGHT = 'right',
  LEFT = 'left',
  CENTER = 'center'
}

export const ClassByAlign = {
  [AlignType.RIGHT]: styles.justify_end,
  [AlignType.LEFT]: styles.justify_start,
  [AlignType.CENTER]: styles.justify_center
};

export const CoefficientBySort = {
  [SortType.ASC]: 1,
  [SortType.DESC]: -1
};

export const sortDataSource = <T extends object>(data: T[], sort: Record<keyof T, SortType>) => {
  const [sortField, sortOrder] = Object.entries(sort)[0];

  const sortedData = [...(data || [])].sort((a, b) => {
    const typeCheck = typeof a[sortField];

    switch (typeCheck) {
      case 'number':
      case 'bigint':
        // @ts-ignore
        return compareNumber(CoefficientBySort[sortOrder], a[sortField], b[sortField]);
      case 'string':
        const isStringNumber = !isNaN(Number(a[sortField]));

        if (isStringNumber) {
          // @ts-ignore
          return compareNumber(CoefficientBySort[sortOrder], a[sortField], b[sortField]);
        }

        // @ts-ignore
        return CoefficientBySort[sortOrder] * a[sortField].localeCompare(b[sortField]);
    }

    return 0;
  });

  return sortedData;
};

const getCustomStyleByColumnKey = <T extends object>(headers: TableHeaderProps<T>, key: string) => {
  return {
    width: headers[key].width,
    textAlign: headers[key].align,
    padding: headers[key].padding
  };
};

const getCustomClassOfHeader = <T extends object>({
  sortField,
  sortOrder,
  align
}: {
  sortField: keyof T;
  sortOrder: SortType;
  align;
}) => {
  let className = '';

  if (sortField) {
    className = className + styles.table_header_sorter;

    if (sortOrder) {
      className = className + ' ' + styles.active_sort;
    }
  }

  if (align) {
    className = className + ' ' + ClassByAlign[align];
  }

  return className;
};

export const Table = <T extends object>({
  defaultSorted,
  headers,
  data,
  handleClickRow,
  stylesColumn
}: TableProps<T>) => {
  const [sort, setSort] = useState<Record<keyof T, SortType>>({
    [defaultSorted]: SortType.DESC
  } as Record<keyof T, SortType>);

  const handleClickSort = (column: HeaderDataType<T>, data: T[]) => {
    const sortField = column.sortField || null;

    if (!sortField) {
      return;
    }

    let newSort = { [sortField]: SortType.DESC } as Record<keyof T, SortType>;

    if (sort[sortField] === SortType.DESC) {
      newSort = { [sortField]: SortType.ASC } as Record<keyof T, SortType>;
      setSort(newSort);
      sortDataSource(data, newSort);
      return;
    }

    setSort(newSort);
    sortDataSource(data, newSort);
  };

  return (
    <table className={styles.table}>
      <thead>
        <tr style={stylesColumn}>
          {Object.keys(headers).map((key, index) => {
            const { sortField } = headers[key];
            const align = headers[key].align;
            const sortOrder = sort[headers[key].sortField];
            const customStyle = getCustomStyleByColumnKey(headers, key);
            const customClass = getCustomClassOfHeader({ sortField, sortOrder, align });

            return (
              <th
                scope="col"
                key={`${index}-${sortOrder}`}
                style={customStyle}
                onClick={() => handleClickSort(headers[key], data)}
                className={customClass}
              >
                {headers[key].name} &nbsp;
                {!sortField ? null : sortOrder === SortType.ASC ? <SortUpIcon /> : <SortDownIcon />}
              </th>
            );
          })}
        </tr>
      </thead>
      <tbody>
        {sortDataSource(data, sort).map((datum, index) => {
          return (
            <tr style={stylesColumn} key={index} onClick={(event) => handleClickRow && handleClickRow(event, datum)}>
              {Object.keys(headers).map((key, index) => {
                const customStyle = getCustomStyleByColumnKey(headers, key);
                return (
                  <td key={index} style={customStyle}>
                    {headers[key].accessor(datum)}
                  </td>
                );
              })}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};
