import { filterTags, sortOptions, type FilterTag } from '@/data/fleetData';

interface FilterBarProps {
  activeFilter: FilterTag;
  onFilterChange: (f: FilterTag) => void;
  sortBy: string;
  onSortChange: (s: string) => void;
}

const FilterBar = ({ activeFilter, onFilterChange, sortBy, onSortChange }: FilterBarProps) => {
  const typeFilters = filterTags.slice(0, 10);
  const statusFilters = filterTags.slice(10);

  return (
    <div className="mx-4 sm:mx-6 mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-1.5 flex-wrap">
        {typeFilters.map(tag => (
          <button
            key={tag}
            onClick={() => onFilterChange(tag)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              activeFilter === tag
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
            }`}
          >
            {tag}
          </button>
        ))}
        <div className="w-px h-5 bg-border mx-1" />
        {statusFilters.map(tag => (
          <button
            key={tag}
            onClick={() => onFilterChange(tag)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              activeFilter === tag
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
            }`}
          >
            {tag}
          </button>
        ))}
      </div>
      <select
        value={sortBy}
        onChange={e => onSortChange(e.target.value)}
        className="w-full sm:w-auto px-3 py-1.5 rounded-lg bg-secondary border border-border text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
      >
        {sortOptions.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
};

export default FilterBar;
