import { useState, useMemo } from 'react';
import AppHeader from '@/components/AppHeader';
import AlertBanners from '@/components/AlertBanners';
import FleetChart from '@/components/FleetChart';
import MissionReadiness from '@/components/MissionReadiness';
import FilterBar from '@/components/FilterBar';
import AssetCard from '@/components/AssetCard';
import { assets, type FilterTag, type Asset } from '@/data/fleetData';

const Index = () => {
  const [activeFilter, setActiveFilter] = useState<FilterTag>('All');
  const [sortBy, setSortBy] = useState('all');

  const filtered = useMemo(() => {
    let result: Asset[] = [...assets];

    if (activeFilter !== 'All') {
      const statusMap: Record<string, string> = { Critical: 'critical', Warning: 'warning', Normal: 'normal' };
      if (statusMap[activeFilter]) {
        result = result.filter(a => a.status === statusMap[activeFilter]);
      } else {
        result = result.filter(a => a.type === activeFilter);
      }
    }

    switch (sortBy) {
      case 'critical':
        result.sort((a, b) => {
          const order = { critical: 0, warning: 1, normal: 2 };
          return order[a.status] - order[b.status];
        });
        break;
      case 'attention':
        result.sort((a, b) => b.anomalyScore - a.anomalyScore);
        break;
      case 'operational':
        result = result.filter(a => a.status === 'normal');
        break;
      case 'highest':
        result.sort((a, b) => b.readiness - a.readiness);
        break;
      case 'lowest':
        result.sort((a, b) => a.readiness - b.readiness);
        break;
    }

    return result;
  }, [activeFilter, sortBy]);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <AlertBanners />
      <FleetChart />
      <MissionReadiness />
      <FilterBar
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        sortBy={sortBy}
        onSortChange={setSortBy}
      />
      <div className="mx-4 sm:mx-6 mt-4 pb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(asset => (
          <AssetCard key={asset.id} asset={asset} />
        ))}
      </div>
    </div>
  );
};

export default Index;
