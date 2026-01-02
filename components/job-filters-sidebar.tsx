"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

type CategoryGroup = {
  title: string;
  items: string[];
};

type Props = {
  groups: CategoryGroup[];
  activeCategories: string[];
  setActiveCategories: (cats: string[]) => void;
};

export default function JobFiltersSidebar({
  groups,
  activeCategories,
  setActiveCategories,
}: Props) {
  const [openGroups, setOpenGroups] = useState<string[]>(
    groups.map((g) => g.title),
  );

  const toggleCategory = (cat: string) => {
    if (activeCategories.includes(cat)) {
      setActiveCategories(activeCategories.filter((c) => c !== cat));
    } else {
      setActiveCategories([...activeCategories, cat]);
    }
  };

  const toggleGroup = (title: string) => {
    if (openGroups.includes(title)) {
      setOpenGroups(openGroups.filter((g) => g !== title));
    } else {
      setOpenGroups([...openGroups, title]);
    }
  };

  return (
    <aside className="w-72 shrink-0">
      <div className="sticky top-20 flex flex-col gap-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Filter Jobs
        </h3>

        <div className="flex flex-col gap-4">
          {groups.map((group) => {
            const isOpen = openGroups.includes(group.title);

            return (
              <div key={group.title} className="flex flex-col gap-2">
                <button
                  onClick={() => toggleGroup(group.title)}
                  className="flex w-full items-center justify-between text-sm font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-300"
                >
                  {group.title}
                  {isOpen ? (
                    <ChevronDown size={16} className="text-gray-500" />
                  ) : (
                    <ChevronRight size={16} className="text-gray-500" />
                  )}
                </button>

                {isOpen && (
                  <div className="mt-1 flex flex-col gap-2 pl-2">
                    {group.items.map((cat) => (
                      <label
                        key={cat}
                        className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-1 transition hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        <input
                          type="checkbox"
                          checked={activeCategories.includes(cat)}
                          onChange={() => toggleCategory(cat)}
                          className="h-4 w-4 rounded border-gray-400 bg-gray-200 accent-lime-600 focus:ring-lime-500 dark:border-gray-600 dark:bg-gray-700"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {cat}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <button
          onClick={() => setActiveCategories([])}
          className={`self-start text-sm font-medium transition hover:underline ${
            activeCategories.length > 0
              ? "text-lime-600 opacity-100 dark:text-lime-400"
              : "pointer-events-none opacity-0"
          }`}
        >
          Clear filters
        </button>
      </div>
    </aside>
  );
}
