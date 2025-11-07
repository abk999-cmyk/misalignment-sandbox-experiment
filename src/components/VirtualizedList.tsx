import { Virtuoso } from "react-virtuoso";
import { ReactNode } from "react";

interface VirtualizedListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  height?: number;
  className?: string;
}

export function VirtualizedList<T>({
  items,
  renderItem,
  height = 400,
  className = "",
}: VirtualizedListProps<T>) {
  return (
    <div style={{ height: `${height}px` }} className={className}>
      <Virtuoso
        data={items}
        itemContent={(index, item) => renderItem(item, index)}
        style={{ height: "100%" }}
      />
    </div>
  );
}

