import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { InteractionType } from "@/types/project";
import { cn } from "@/lib/utils";

interface FilterBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  activeFilter: InteractionType | 'all';
  setActiveFilter: (filter: InteractionType | 'all') => void;
}

const FilterBar = ({
  searchQuery,
  setSearchQuery,
  activeFilter,
  setActiveFilter
}: FilterBarProps) => {

  const filters = [
    { id: 'all', label: 'ALL PROJECTS' },
    { id: 'adopt', label: 'FREE FORKS' },
    { id: 'buy', label: 'FOR SALE' },
    { id: 'collab', label: 'SEEKING PARTNERS' },
  ] as const;

  return (
    <div className="w-full space-y-4 md:space-y-0 md:flex md:items-center md:gap-4 p-1">

      {/* Search Input Area */}
      <div className="relative flex-1 group">
        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-cyber-muted group-focus-within:text-white transition-colors" />
        </div>
        <Input
          type="text"
          placeholder="Search dead projects..."
          className="pl-10 h-12 bg-cyber-black border-cyber-gray focus:border-white/50 focus:ring-0 font-mono text-sm tracking-wide transition-all placeholder:text-cyber-muted/50 rounded-none"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Filter Buttons */}
      <div className="flex items-center gap-4 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
        {filters.map((filter) => {
          const isActive = activeFilter === filter.id;

          return (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id as InteractionType | 'all')}
              className={cn(
                "px-6 py-3 text-sm font-display tracking-wider uppercase transition-all duration-200 border border-transparent whitespace-nowrap",
                isActive
                  ? "bg-cyber-red text-white font-bold"
                  : "bg-transparent border-cyber-gray/30 text-cyber-muted hover:border-cyber-gray hover:text-white"
              )}
            >
              {filter.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default FilterBar;