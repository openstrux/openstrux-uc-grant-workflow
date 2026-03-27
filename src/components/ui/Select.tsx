"use client";

import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from "@headlessui/react";
import { Check, ChevronDown } from "lucide-react";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
}

export function Select({ value, onChange, options, placeholder = "Select…", disabled }: SelectProps) {
  const selected = options.find((o) => o.value === value);

  return (
    <Listbox value={value} onChange={onChange} disabled={disabled}>
      <div className="relative">
        <ListboxButton className="w-full flex items-center justify-between px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-left text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-0 disabled:opacity-60 disabled:cursor-not-allowed transition-colors">
          <span className={selected ? "" : "text-slate-400"}>
            {selected ? selected.label : placeholder}
          </span>
          <ChevronDown size={14} className="text-slate-400 ml-2 shrink-0" />
        </ListboxButton>
        <ListboxOptions className="absolute z-10 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-auto focus:outline-none text-sm">
          {options.map((option) => (
            <ListboxOption
              key={option.value}
              value={option.value}
              className="flex items-center gap-2 px-3 py-2 cursor-pointer text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 data-[selected]:bg-indigo-50 data-[selected]:text-indigo-700"
            >
              {({ selected: isSelected }) => (
                <>
                  <span className="w-4">{isSelected && <Check size={14} />}</span>
                  {option.label}
                </>
              )}
            </ListboxOption>
          ))}
        </ListboxOptions>
      </div>
    </Listbox>
  );
}
