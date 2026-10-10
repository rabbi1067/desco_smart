"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Compass,
  Gauge,
  Loader2,
  Search,
  User,
  X,
  ArrowUpRight,
} from "lucide-react";
import { searchAdminDirectoryAction, type SearchResultItem } from "@/app/actions/search";

export function AdminHeaderSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isPending, startTransition] = useTransition();

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Keyboard shortcut Ctrl+K or / to focus search
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Live search effect on query change
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setSelectedIndex(-1);
      return;
    }

    const timer = setTimeout(() => {
      startTransition(async () => {
        const res = await searchAdminDirectoryAction(trimmed);
        if (res.success) {
          setResults(res.results);
          setSelectedIndex(-1);
          setIsOpen(true);
        }
      });
    }, 150);

    return () => clearTimeout(timer);
  }, [query]);

  function handleSelect(item: SearchResultItem) {
    setIsOpen(false);
    setQuery("");
    router.push(item.url);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!isOpen || results.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
    } else if (e.key === "Enter" && selectedIndex >= 0) {
      e.preventDefault();
      const item = results[selectedIndex];
      if (item) handleSelect(item);
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "route":
        return <Compass className="size-4 text-emerald-400 shrink-0" />;
      case "meter":
        return <Gauge className="size-4 text-cyan-400 shrink-0" />;
      case "user":
        return <User className="size-4 text-violet-400 shrink-0" />;
      default:
        return <Search className="size-4 text-muted-foreground shrink-0" />;
    }
  };

  const getBadgeColor = (type: string, badge?: string) => {
    if (type === "route") return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    if (badge === "HEALTHY") return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    if (badge === "LOW") return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    if (badge === "CRITICAL") return "bg-rose-500/10 text-rose-400 border-rose-500/20";
    if (badge === "SUPER_ADMIN") return "bg-purple-500/10 text-purple-400 border-purple-500/20";
    return "bg-muted text-muted-foreground border-border";
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative flex items-center">
        <Search className="absolute left-3 size-3.5 text-muted-foreground pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => {
            if (query.trim().length > 0) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Search meters, accounts, consumers, routes..."
          className="w-full h-9 pl-9 pr-14 text-xs bg-muted/40 hover:bg-muted/60 focus:bg-background border border-border/70 hover:border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/70 transition-all shadow-sm"
        />

        <div className="absolute right-2.5 flex items-center gap-1">
          {isPending ? (
            <Loader2 className="size-3.5 animate-spin text-emerald-400" />
          ) : query.length > 0 ? (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setResults([]);
                setIsOpen(false);
              }}
              className="text-muted-foreground hover:text-foreground p-0.5 rounded"
            >
              <X className="size-3.5" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground bg-muted/70 border border-border/80 rounded">
              <span className="text-[9px]">⌘</span>K
            </kbd>
          )}
        </div>
      </div>

      {/* Live Dropdown Results */}
      {isOpen && query.trim().length > 0 && (
        <div className="absolute left-0 top-full mt-2 w-full min-w-[340px] max-w-xl bg-popover/95 backdrop-blur-xl border border-border/80 rounded-xl shadow-2xl shadow-black/30 overflow-hidden z-50 animate-in fade-in-0 zoom-in-95 duration-150">
          <div className="p-2 border-b border-border/50 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>
              {results.length > 0
                ? `${results.length} live results found`
                : isPending
                ? "Searching database..."
                : "No matching records"}
            </span>
            <span className="text-[10px]">ESC to close</span>
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-border/30 p-1">
            {results.length > 0 ? (
              results.map((item, index) => {
                const isSelected = index === selectedIndex;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelect(item)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-left transition-all group ${
                      isSelected
                        ? "bg-accent text-accent-foreground shadow-sm"
                        : "hover:bg-accent/60 text-foreground"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div className="p-1.5 rounded-md bg-muted/60 group-hover:bg-background/80 transition-colors">
                        {getTypeIcon(item.type)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold truncate group-hover:text-emerald-400 transition-colors">
                          {item.title}
                        </p>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {item.subtitle}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {item.badge && (
                        <span
                          className={`text-[9px] font-semibold px-1.5 py-0.5 rounded border uppercase tracking-wider ${getBadgeColor(
                            item.type,
                            item.badge,
                          )}`}
                        >
                          {item.badge}
                        </span>
                      )}
                      <ArrowUpRight className="size-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </button>
                );
              })
            ) : !isPending ? (
              <div className="py-6 px-4 text-center">
                <Search className="size-6 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-xs font-medium text-foreground">
                  No matching results for &ldquo;{query}&rdquo;
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Try typing a meter number, account ID, consumer email, or page name.
                </p>
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                <Loader2 className="size-4 animate-spin text-emerald-400" />
                <span>Searching directory...</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
